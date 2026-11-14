from fastapi.testclient import TestClient
from app.main import app

client=TestClient(app)

def test_health_and_case_count():
    r=client.get("/api/health")
    assert r.status_code==200
    assert r.json()["case_count"] >= 20

def test_search_filters_india():
    r=client.get("/api/cases",params={"country":"India","page_size":100})
    assert r.status_code==200
    assert r.json()["total"] >= 15

def test_every_case_has_ten_sections():
    for case in client.get("/api/cases",params={"page_size":100}).json()["items"]:
        detail=client.get(f"/api/cases/{case['id']}").json()
        assert len(detail["sections"])==10

def test_nithari_2025_status_is_reflected():
    data=client.get("/api/cases/nithari-killings").json()
    assert "2025" in data["sections"]["official_conclusion"]
