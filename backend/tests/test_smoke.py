from fastapi.testclient import TestClient

from app.main import app


def test_health_check():
    with TestClient(app) as client:
        response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_meta_options_expose_products_and_user():
    with TestClient(app) as client:
        response = client.get("/api/meta/options")
    assert response.status_code == 200
    body = response.json()
    assert "DRAM" in body["products"]
    assert body["current_user"]["role"] == "SYSTEM_ADMIN"


def test_dashboard_returns_metrics():
    with TestClient(app) as client:
        response = client.get("/api/dashboard")
    assert response.status_code == 200
    assert response.json()["metrics"]["pas_total"] >= 0


def test_pas_records_are_filterable():
    with TestClient(app) as client:
        response = client.get("/api/pas/records", params={"product": "DRAM", "tech": "1a"})
    assert response.status_code == 200
    assert all(item["product"] == "DRAM" for item in response.json()["items"])


def test_pas_create_update_delete_cycle():
    with TestClient(app) as client:
        created = client.post(
            "/api/pas/records",
            json={"product": "DRAM", "tech": "1a", "target_date": "2026-12-31"},
        )
        assert created.status_code == 201
        record_id = created.json()["id"]

        updated = client.patch(
            f"/api/pas/records/{record_id}",
            json={"status": "협의중"},
        )
        assert updated.status_code == 200
        assert updated.json()["status"] == "협의중"

        assert client.delete(f"/api/pas/records/{record_id}").status_code == 204
        missing = client.patch(
            f"/api/pas/records/{record_id}",
            json={"status": "협의중"},
        )
        assert missing.status_code == 404


def test_cpms_detail_contains_inline_data():
    with TestClient(app) as client:
        records = client.get("/api/cpms/records").json()["items"]
        detail = client.get(f"/api/cpms/records/{records[0]['id']}")
    assert detail.status_code == 200
    assert len(detail.json()["inline_data"]) > 0


def test_cpms_discriminator_requires_edit_role():
    with TestClient(app) as client:
        record = client.get("/api/cpms/records").json()["items"][0]
        response = client.patch(
            f"/api/cpms/records/{record['id']}",
            json={"discriminator": "TEST-USER"},
            headers={"X-User-Role": "USER"},
        )
    assert response.status_code == 403


def test_cpms_manager_must_own_product_tech_scope():
    with TestClient(app) as client:
        record = client.get("/api/cpms/records").json()["items"][0]
        outside_scope = client.patch(
            f"/api/cpms/records/{record['id']}",
            json={"discriminator": "TEST-OUTSIDE"},
            headers={
                "X-User-Role": "TECH_MANAGER",
                "X-User-Scopes": "UNKNOWN/NONE",
            },
        )
        inside_scope = client.patch(
            f"/api/cpms/records/{record['id']}",
            json={"discriminator": "TEST-MANAGER"},
            headers={
                "X-User-Role": "TECH_MANAGER",
                "X-User-Scopes": f"{record['product']}/{record['tech']}",
            },
        )
    assert outside_scope.status_code == 403
    assert inside_scope.status_code == 200
    assert inside_scope.json()["discriminator"] == "TEST-MANAGER"


def test_cpms_system_admin_can_edit_any_scope():
    with TestClient(app) as client:
        record = client.get("/api/cpms/records").json()["items"][0]
        response = client.patch(
            f"/api/cpms/records/{record['id']}",
            json={"discriminator": "TEST-ADMIN"},
            headers={"X-User-Role": "SYSTEM_ADMIN"},
        )
    assert response.status_code == 200
    assert response.json()["discriminator"] == "TEST-ADMIN"


def test_column_config_roundtrip():
    columns = [
        {
            "key": "title",
            "label": "변경 제목",
            "width": 200,
            "visible": True,
            "pinned": False,
        }
    ]
    with TestClient(app) as client:
        saved = client.put(
            "/api/column-configs",
            params={"module": "PAS", "product": "DRAM", "tech": "1a"},
            json={"columns": columns, "updated_by": "tester"},
        )
        read = client.get(
            "/api/column-configs",
            params={"module": "PAS", "product": "DRAM", "tech": "1a"},
        )
    assert saved.status_code == 200
    assert read.status_code == 200
    assert read.json()["columns"] == columns


def test_pas_websocket_reports_multiple_users():
    with TestClient(app) as client:
        with client.websocket_connect("/ws/pas") as first:
            assert first.receive_json()["count"] == 1
            with client.websocket_connect("/ws/pas") as second:
                first_update = first.receive_json()
                second_update = second.receive_json()
    assert first_update == {"type": "presence", "count": 2}
    assert second_update == {"type": "presence", "count": 2}
