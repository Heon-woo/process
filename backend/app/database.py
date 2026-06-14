import json
import os
import sqlite3
from contextlib import contextmanager
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
DB_PATH = Path(os.environ.get("PASS_DB_PATH", str(DATA_DIR / "pass.db"))).expanduser()
UPLOAD_DIR = Path(os.environ.get("PASS_UPLOAD_DIR", str(DATA_DIR / "uploads"))).expanduser()


def dict_factory(cursor: sqlite3.Cursor, row: tuple) -> dict:
    return {column[0]: row[index] for index, column in enumerate(cursor.description)}


@contextmanager
def get_connection():
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = dict_factory
    try:
        yield connection
        connection.commit()
    finally:
        connection.close()


def initialize_database() -> None:
    with get_connection() as connection:
        connection.executescript(
            """
            CREATE TABLE IF NOT EXISTS pas_records (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                document_no TEXT NOT NULL,
                product TEXT NOT NULL,
                tech TEXT NOT NULL,
                process TEXT NOT NULL,
                device TEXT NOT NULL,
                title TEXT NOT NULL,
                requester TEXT NOT NULL,
                owner_team TEXT NOT NULL,
                status TEXT NOT NULL,
                priority TEXT NOT NULL,
                requested_at TEXT NOT NULL,
                target_date TEXT NOT NULL,
                change_type TEXT NOT NULL,
                equipment TEXT NOT NULL,
                recipe TEXT NOT NULL,
                comment TEXT NOT NULL DEFAULT '',
                updated_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS cpms_records (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                document_no TEXT NOT NULL,
                product TEXT NOT NULL,
                tech TEXT NOT NULL,
                process TEXT NOT NULL,
                device TEXT NOT NULL,
                title TEXT NOT NULL,
                requester TEXT NOT NULL,
                hiq1_comment TEXT NOT NULL DEFAULT '',
                approved_at TEXT NOT NULL,
                applied_at TEXT,
                discriminator TEXT NOT NULL,
                status TEXT NOT NULL,
                monitoring_result TEXT NOT NULL,
                ai_status TEXT,
                ai_link TEXT,
                updated_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS inline_points (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                cpms_id INTEGER NOT NULL,
                measured_at TEXT NOT NULL,
                target_value REAL NOT NULL,
                others_value REAL NOT NULL,
                FOREIGN KEY(cpms_id) REFERENCES cpms_records(id)
            );

            CREATE TABLE IF NOT EXISTS column_configs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                module TEXT NOT NULL,
                product TEXT NOT NULL,
                tech TEXT NOT NULL,
                config_json TEXT NOT NULL,
                updated_by TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                UNIQUE(module, product, tech)
            );

            CREATE TABLE IF NOT EXISTS uploads (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                module TEXT NOT NULL,
                product TEXT NOT NULL,
                tech TEXT NOT NULL,
                original_name TEXT NOT NULL,
                stored_name TEXT NOT NULL,
                size INTEGER NOT NULL,
                uploaded_by TEXT NOT NULL,
                uploaded_at TEXT NOT NULL,
                source TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS activity_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_name TEXT NOT NULL,
                user_team TEXT NOT NULL,
                module TEXT NOT NULL,
                action TEXT NOT NULL,
                target TEXT NOT NULL,
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS batch_settings (
                module TEXT PRIMARY KEY,
                schedule TEXT NOT NULL,
                description TEXT NOT NULL,
                last_run_at TEXT,
                next_run_at TEXT,
                status TEXT NOT NULL
            );
            """
        )
        count = connection.execute("SELECT COUNT(*) AS count FROM pas_records").fetchone()["count"]
        if count == 0:
            seed_database(connection)


def seed_database(connection: sqlite3.Connection) -> None:
    from app.seed_data import (
        ACTIVITY_LOGS,
        BATCH_SETTINGS,
        CPMS_RECORDS,
        DEFAULT_COLUMN_CONFIGS,
        PAS_RECORDS,
        UPLOADS,
        build_inline_points,
    )

    pas_columns = (
        "document_no, product, tech, process, device, title, requester, owner_team, "
        "status, priority, requested_at, target_date, change_type, equipment, recipe, "
        "comment, updated_at"
    )
    pas_placeholders = ", ".join(["?"] * 17)
    connection.executemany(
        f"INSERT INTO pas_records ({pas_columns}) VALUES ({pas_placeholders})",
        PAS_RECORDS,
    )

    cpms_columns = (
        "document_no, product, tech, process, device, title, requester, hiq1_comment, "
        "approved_at, applied_at, discriminator, status, monitoring_result, ai_status, "
        "ai_link, updated_at"
    )
    cpms_placeholders = ", ".join(["?"] * 16)
    connection.executemany(
        f"INSERT INTO cpms_records ({cpms_columns}) VALUES ({cpms_placeholders})",
        CPMS_RECORDS,
    )

    cpms_ids = [
        row["id"] for row in connection.execute("SELECT id FROM cpms_records ORDER BY id").fetchall()
    ]
    inline_rows = []
    for index, cpms_id in enumerate(cpms_ids):
        inline_rows.extend(build_inline_points(cpms_id, index))
    connection.executemany(
        """
        INSERT INTO inline_points (cpms_id, measured_at, target_value, others_value)
        VALUES (?, ?, ?, ?)
        """,
        inline_rows,
    )

    connection.executemany(
        """
        INSERT INTO activity_logs
        (user_name, user_team, module, action, target, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        ACTIVITY_LOGS,
    )
    connection.executemany(
        """
        INSERT INTO batch_settings
        (module, schedule, description, last_run_at, next_run_at, status)
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        BATCH_SETTINGS,
    )
    connection.executemany(
        """
        INSERT INTO uploads
        (module, product, tech, original_name, stored_name, size,
         uploaded_by, uploaded_at, source)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        UPLOADS,
    )

    for module, product, tech, config, updated_by, updated_at in DEFAULT_COLUMN_CONFIGS:
        connection.execute(
            """
            INSERT INTO column_configs
            (module, product, tech, config_json, updated_by, updated_at)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (module, product, tech, json.dumps(config), updated_by, updated_at),
        )
