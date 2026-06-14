import json

from fastapi import APIRouter, HTTPException

from app.database import get_connection
from app.schemas import BatchSettingUpdate, ColumnConfigUpdate
from app.services import add_log, get_column_config, now_text


router = APIRouter(tags=["admin"])


@router.get("/column-configs")
def read_column_config(module: str, product: str, tech: str):
    module = module.upper()
    if module not in {"PAS", "CPMS"}:
        raise HTTPException(status_code=400, detail="지원하지 않는 모듈입니다.")
    with get_connection() as connection:
        return get_column_config(connection, module, product, tech)


@router.put("/column-configs")
def save_column_config(
    module: str,
    product: str,
    tech: str,
    payload: ColumnConfigUpdate,
):
    module = module.upper()
    if module not in {"PAS", "CPMS"}:
        raise HTTPException(status_code=400, detail="지원하지 않는 모듈입니다.")
    updated_at = now_text()
    with get_connection() as connection:
        connection.execute(
            """
            INSERT INTO column_configs
            (module, product, tech, config_json, updated_by, updated_at)
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(module, product, tech)
            DO UPDATE SET
                config_json = excluded.config_json,
                updated_by = excluded.updated_by,
                updated_at = excluded.updated_at
            """,
            (
                module,
                product,
                tech,
                json.dumps(payload.columns, ensure_ascii=False),
                payload.updated_by,
                updated_at,
            ),
        )
        add_log(
            connection,
            payload.updated_by,
            "품질혁신",
            module,
            "컬럼 설정 변경",
            f"{product}/{tech}",
        )
    return {
        "module": module,
        "product": product,
        "tech": tech,
        "columns": payload.columns,
        "updated_by": payload.updated_by,
        "updated_at": updated_at,
    }


@router.get("/admin/logs")
def get_logs(limit: int = 50):
    with get_connection() as connection:
        logs = connection.execute(
            "SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT ?",
            (min(limit, 200),),
        ).fetchall()
        module_counts = connection.execute(
            """
            SELECT module, COUNT(*) AS count
            FROM activity_logs
            GROUP BY module
            ORDER BY count DESC
            """
        ).fetchall()
        daily_counts = connection.execute(
            """
            SELECT substr(created_at, 1, 10) AS day, COUNT(*) AS count
            FROM activity_logs
            GROUP BY day
            ORDER BY day DESC
            LIMIT 7
            """
        ).fetchall()
    return {"items": logs, "module_counts": module_counts, "daily_counts": daily_counts}


@router.get("/admin/batches")
def get_batch_settings():
    with get_connection() as connection:
        rows = connection.execute(
            "SELECT * FROM batch_settings ORDER BY module"
        ).fetchall()
    return {"items": rows}


@router.patch("/admin/batches/{module}")
def update_batch_setting(module: str, payload: BatchSettingUpdate):
    module = module.upper()
    with get_connection() as connection:
        current = connection.execute(
            "SELECT * FROM batch_settings WHERE module = ?", (module,)
        ).fetchone()
        if not current:
            raise HTTPException(status_code=404, detail="배치 설정을 찾을 수 없습니다.")
        connection.execute(
            "UPDATE batch_settings SET schedule = ? WHERE module = ?",
            (payload.schedule, module),
        )
        add_log(connection, "김하늘", "품질혁신", "ADMIN", "배치 주기 변경", module)
        updated = connection.execute(
            "SELECT * FROM batch_settings WHERE module = ?", (module,)
        ).fetchone()
    return updated

