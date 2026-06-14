from fastapi import APIRouter

from app.database import get_connection


router = APIRouter(tags=["meta"])


@router.get("/meta/options")
def get_options():
    with get_connection() as connection:
        rows = connection.execute(
            """
            SELECT product, tech FROM pas_records
            UNION
            SELECT product, tech FROM cpms_records
            ORDER BY product, tech
            """
        ).fetchall()
    products: dict[str, list[str]] = {}
    for row in rows:
        products.setdefault(row["product"], []).append(row["tech"])
    return {
        "products": products,
        "current_user": {
            "name": "김하늘",
            "team": "품질혁신",
            "role": "SYSTEM_ADMIN",
            "managed_scopes": ["DRAM/1a", "DRAM/1b", "NAND/V8", "NAND/V9"],
        },
    }


@router.get("/dashboard")
def get_dashboard():
    with get_connection() as connection:
        pas_total = connection.execute("SELECT COUNT(*) AS count FROM pas_records").fetchone()["count"]
        pas_open = connection.execute(
            "SELECT COUNT(*) AS count FROM pas_records WHERE status NOT IN ('승인완료', '반려')"
        ).fetchone()["count"]
        cpms_total = connection.execute("SELECT COUNT(*) AS count FROM cpms_records").fetchone()["count"]
        cpms_attention = connection.execute(
            "SELECT COUNT(*) AS count FROM cpms_records WHERE monitoring_result = '주의'"
        ).fetchone()["count"]
        recent_pas = connection.execute(
            "SELECT * FROM pas_records ORDER BY updated_at DESC LIMIT 5"
        ).fetchall()
        recent_cpms = connection.execute(
            "SELECT * FROM cpms_records ORDER BY updated_at DESC LIMIT 4"
        ).fetchall()
        batches = connection.execute(
            "SELECT * FROM batch_settings ORDER BY module"
        ).fetchall()
    return {
        "metrics": {
            "pas_total": pas_total,
            "pas_open": pas_open,
            "cpms_total": cpms_total,
            "cpms_attention": cpms_attention,
            "approval_rate": 78,
            "avg_lead_time": 3.2,
        },
        "recent_pas": recent_pas,
        "recent_cpms": recent_cpms,
        "batches": batches,
    }

