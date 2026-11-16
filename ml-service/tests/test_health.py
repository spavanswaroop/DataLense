from app.api.routes.health import get_health

def test_health_check():
    res = get_health()
    assert res.status == "UP"
    assert res.service == "datalens-ml-service"
