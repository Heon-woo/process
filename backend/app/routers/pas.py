from datetime import date
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from app.database import UPLOAD_DIR, get_connection
from app.realtime import pas_connections
from app.schemas import AutomaticUploadCreate, PasCreate, PasUpdate
from app.services import add_log, now_text, query_records


router = APIRouter(prefix="/pas", tags=["PAS"])


@router.get("/records")
def list_pas_records(
    product: str | None = None,
    tech: str | None = None,
    search: str | None = None,
    date_from: str | None = None,
    date_to: str | None = None,
):
    with get_connection() as connection:
        records = query_records(
            connection,
            "pas_records",
            product,
            tech,
            search,
            date_from,
            date_to,
            "requested_at",
        )
    return {"items": records, "total": len(records)}


@router.post("/records", status_code=201)
async def create_pas_record(payload: PasCreate):
    created_at = now_text()
    document_no = f"PCCB-{date.today().strftime('%y%m%d')}-{uuid4().hex[:3].upper()}"
    with get_connection() as connection:
        cursor = connection.execute(
            """
            INSERT INTO pas_records
            (document_no, product, tech, process, device, title, requester, owner_team,
             status, priority, requested_at, target_date, change_type, equipment,
             recipe, comment, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                document_no,
                payload.product,
                payload.tech,
                payload.process,
                payload.device,
                payload.title,
                payload.requester,
                payload.owner_team,
                payload.status,
                payload.priority,
                date.today().isoformat(),
                payload.target_date,
                payload.change_type,
                payload.equipment,
                payload.recipe,
                payload.comment,
                created_at,
            ),
        )
        add_log(connection, "김하늘", "품질혁신", "PAS", "행 추가", document_no)
        record = connection.execute(
            "SELECT * FROM pas_records WHERE id = ?", (cursor.lastrowid,)
        ).fetchone()
    await pas_connections.broadcast({"type": "record_created", "record": record})
    return record


@router.patch("/records/{record_id}")
async def update_pas_record(record_id: int, payload: PasUpdate):
    values = payload.model_dump(exclude_none=True)
    if not values:
        raise HTTPException(status_code=400, detail="변경할 값이 없습니다.")
    allowed_fields = {
        "process",
        "device",
        "title",
        "requester",
        "owner_team",
        "status",
        "priority",
        "target_date",
        "change_type",
        "equipment",
        "recipe",
        "comment",
    }
    invalid_fields = set(values) - allowed_fields
    if invalid_fields:
        raise HTTPException(status_code=400, detail="수정할 수 없는 컬럼입니다.")
    values["updated_at"] = now_text()
    assignments = ", ".join(f"{field} = ?" for field in values)
    with get_connection() as connection:
        current = connection.execute(
            "SELECT * FROM pas_records WHERE id = ?", (record_id,)
        ).fetchone()
        if not current:
            raise HTTPException(status_code=404, detail="데이터를 찾을 수 없습니다.")
        connection.execute(
            f"UPDATE pas_records SET {assignments} WHERE id = ?",
            [*values.values(), record_id],
        )
        add_log(connection, "김하늘", "품질혁신", "PAS", "행 수정", current["document_no"])
        updated = connection.execute(
            "SELECT * FROM pas_records WHERE id = ?", (record_id,)
        ).fetchone()
    await pas_connections.broadcast({"type": "record_updated", "record": updated})
    return updated


@router.delete("/records/{record_id}", status_code=204)
async def delete_pas_record(record_id: int):
    with get_connection() as connection:
        current = connection.execute(
            "SELECT * FROM pas_records WHERE id = ?", (record_id,)
        ).fetchone()
        if not current:
            raise HTTPException(status_code=404, detail="데이터를 찾을 수 없습니다.")
        connection.execute("DELETE FROM pas_records WHERE id = ?", (record_id,))
        add_log(connection, "김하늘", "품질혁신", "PAS", "행 삭제", current["document_no"])
    await pas_connections.broadcast({"type": "record_deleted", "record_id": record_id})


@router.get("/uploads")
def list_uploads(product: str | None = None, tech: str | None = None):
    conditions = ["module = 'PAS'"]
    params = []
    if product and product != "ALL":
        conditions.append("product = ?")
        params.append(product)
    if tech and tech != "ALL":
        conditions.append("tech = ?")
        params.append(tech)
    with get_connection() as connection:
        rows = connection.execute(
            f"""
            SELECT * FROM uploads
            WHERE {' AND '.join(conditions)}
            ORDER BY uploaded_at DESC
            """,
            params,
        ).fetchall()
    return {"items": rows}


@router.post("/uploads", status_code=201)
async def upload_pas_file(
    file: UploadFile = File(...),
    product: str = Form(...),
    tech: str = Form(...),
    uploaded_by: str = Form("현재 사용자"),
):
    extension = Path(file.filename or "").suffix.lower()
    allowed_extensions = {".xlsx", ".xls", ".csv", ".pdf", ".png", ".jpg", ".jpeg"}
    if extension not in allowed_extensions:
        raise HTTPException(status_code=400, detail="지원하지 않는 파일 형식입니다.")
    content = await file.read()
    if len(content) > 20 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="파일은 20MB 이하만 업로드할 수 있습니다.")
    stored_name = f"{uuid4().hex}{extension}"
    (UPLOAD_DIR / stored_name).write_bytes(content)
    uploaded_at = now_text()
    with get_connection() as connection:
        cursor = connection.execute(
            """
            INSERT INTO uploads
            (module, product, tech, original_name, stored_name, size,
             uploaded_by, uploaded_at, source)
            VALUES ('PAS', ?, ?, ?, ?, ?, ?, ?, 'USER')
            """,
            (
                product,
                tech,
                file.filename,
                stored_name,
                len(content),
                uploaded_by,
                uploaded_at,
            ),
        )
        add_log(connection, uploaded_by, "품질혁신", "PAS", "파일 업로드", file.filename or "")
        row = connection.execute(
            "SELECT * FROM uploads WHERE id = ?", (cursor.lastrowid,)
        ).fetchone()
    return row


@router.post("/uploads/automatic", status_code=201)
def register_automatic_upload(payload: AutomaticUploadCreate):
    uploaded_at = now_text()
    with get_connection() as connection:
        cursor = connection.execute(
            """
            INSERT INTO uploads
            (module, product, tech, original_name, stored_name, size,
             uploaded_by, uploaded_at, source)
            VALUES ('PAS', ?, ?, ?, ?, ?, ?, ?, 'SYSTEM')
            """,
            (
                payload.product,
                payload.tech,
                payload.original_name,
                payload.stored_name,
                payload.size,
                payload.uploaded_by,
                uploaded_at,
            ),
        )
        add_log(
            connection,
            payload.uploaded_by,
            "PASS",
            "PAS",
            "자동 파일 등록",
            payload.original_name,
        )
        row = connection.execute(
            "SELECT * FROM uploads WHERE id = ?", (cursor.lastrowid,)
        ).fetchone()
    return row
