from fastapi import APIRouter, Header, HTTPException

from app.database import get_connection
from app.schemas import CpmsUpdate
from app.services import add_log, now_text, query_records


router = APIRouter(prefix="/cpms", tags=["CPMS"])


@router.get("/records")
def list_cpms_records(
    product: str | None = None,
    tech: str | None = None,
    search: str | None = None,
    date_from: str | None = None,
    date_to: str | None = None,
):
    with get_connection() as connection:
        records = query_records(
            connection,
            "cpms_records",
            product,
            tech,
            search,
            date_from,
            date_to,
            "approved_at",
        )
    return {"items": records, "total": len(records)}


@router.get("/records/{record_id}")
def get_cpms_detail(record_id: int):
    with get_connection() as connection:
        record = connection.execute(
            "SELECT * FROM cpms_records WHERE id = ?", (record_id,)
        ).fetchone()
        if not record:
            raise HTTPException(status_code=404, detail="데이터를 찾을 수 없습니다.")
        record["inline_data"] = connection.execute(
            """
            SELECT measured_at, target_value, others_value
            FROM inline_points
            WHERE cpms_id = ?
            ORDER BY measured_at
            """,
            (record_id,),
        ).fetchall()
        add_log(connection, "김하늘", "품질혁신", "CPMS", "상세 조회", record["document_no"])
    return record


@router.patch("/records/{record_id}")
def update_cpms_record(
    record_id: int,
    payload: CpmsUpdate,
    x_user_role: str = Header(default="SYSTEM_ADMIN"),
):
    if x_user_role not in {"SYSTEM_ADMIN", "TECH_MANAGER"}:
        raise HTTPException(status_code=403, detail="담당자만 구분자를 수정할 수 있습니다.")
    with get_connection() as connection:
        current = connection.execute(
            "SELECT * FROM cpms_records WHERE id = ?", (record_id,)
        ).fetchone()
        if not current:
            raise HTTPException(status_code=404, detail="데이터를 찾을 수 없습니다.")
        connection.execute(
            """
            UPDATE cpms_records
            SET discriminator = ?, updated_at = ?
            WHERE id = ?
            """,
            (payload.discriminator, now_text(), record_id),
        )
        add_log(
            connection,
            "김하늘",
            "품질혁신",
            "CPMS",
            "구분자 수정",
            current["document_no"],
        )
        updated = connection.execute(
            "SELECT * FROM cpms_records WHERE id = ?", (record_id,)
        ).fetchone()
    return updated

