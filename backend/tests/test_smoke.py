from fastapi.testclient import TestClient

from app.main import app


def test_health_check():
    with TestClient(app) as client:
        response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_pas_records_are_filterable():
    with TestClient(app) as client:
        response = client.get("/api/pas/records", params={"product": "DRAM", "tech": "1a"})
    assert response.status_code == 200
    assert all(item["product"] == "DRAM" for item in response.json()["items"])


def test_cpms_detail_contains_inline_data():
    with TestClient(app) as client:
        records = client.get("/api/cpms/records").json()["items"]
        detail = client.get(f"/api/cpms/records/{records[0]['id']}")
    assert detail.status_code == 200
    assert len(detail.json()["inline_data"]) > 0


def test_pas_websocket_reports_multiple_users():
    with TestClient(app) as client:
        with client.websocket_connect("/ws/pas") as first:
            assert first.receive_json()["count"] == 1
            with client.websocket_connect("/ws/pas") as second:
                first_update = first.receive_json()
                second_update = second.receive_json()
    assert first_update == {"type": "presence", "count": 2}
    assert second_update == {"type": "presence", "count": 2}
