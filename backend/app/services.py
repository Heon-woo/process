import json
import sqlite3
from datetime import datetime
from typing import Any

from app.seed_data import DEFAULT_CPMS_COLUMNS, DEFAULT_PAS_COLUMNS


EDIT_ROLES = {"SYSTEM_ADMIN", "TECH_MANAGER"}


def can_edit_scope(
    role: str,
    scopes: tuple[str, ...],
    product: str,
    tech: str,
) -> bool:
    if role == "SYSTEM_ADMIN":
        return True
    return role == "TECH_MANAGER" and f"{product}/{tech}" in scopes


def now_text() -> str:
    return datetime.now().strftime("%Y-%m-%d %H:%M")


def add_log(
    connection: sqlite3.Connection,
    user_name: str,
    user_team: str,
    module: str,
    action: str,
    target: str,
) -> None:
    connection.execute(
        """
        INSERT INTO activity_logs
        (user_name, user_team, module, action, target, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        (user_name, user_team, module, action, target, now_text()),
    )


def query_records(
    connection: sqlite3.Connection,
    table: str,
    product: str | None,
    tech: str | None,
    search: str | None,
    date_from: str | None,
    date_to: str | None,
    date_column: str,
) -> list[dict[str, Any]]:
    conditions = []
    params: list[Any] = []
    if product and product != "ALL":
        conditions.append("product = ?")
        params.append(product)
    if tech and tech != "ALL":
        conditions.append("tech = ?")
        params.append(tech)
    if search:
        conditions.append(
            "(document_no LIKE ? OR process LIKE ? OR device LIKE ? OR title LIKE ?)"
        )
        wildcard = f"%{search}%"
        params.extend([wildcard] * 4)
    if date_from:
        conditions.append(f"{date_column} >= ?")
        params.append(date_from)
    if date_to:
        conditions.append(f"{date_column} <= ?")
        params.append(date_to)
    where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""
    return connection.execute(
        f"SELECT * FROM {table} {where_clause} ORDER BY id DESC",
        params,
    ).fetchall()


def get_column_config(
    connection: sqlite3.Connection,
    module: str,
    product: str,
    tech: str,
) -> dict[str, Any]:
    row = connection.execute(
        """
        SELECT * FROM column_configs
        WHERE module = ? AND product = ? AND tech = ?
        """,
        (module, product, tech),
    ).fetchone()
    if row:
        row["columns"] = json.loads(row.pop("config_json"))
        return row
    defaults = DEFAULT_PAS_COLUMNS if module == "PAS" else DEFAULT_CPMS_COLUMNS
    return {
        "module": module,
        "product": product,
        "tech": tech,
        "columns": defaults,
        "updated_by": "System",
        "updated_at": None,
    }
