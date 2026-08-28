from backend.models import AuditLog
from backend.tests.conftest import auth_headers


def test_user_cannot_read_audit_logs(client, user_token):

    response = client.get(
        "/admin/audit-logs",
        headers=auth_headers(user_token)
    )

    assert response.status_code == 403


def test_admin_can_read_audit_logs(app, client, admin_token):

    headers = auth_headers(admin_token)

    response = client.post(
        "/students/",
        headers=headers,
        json={
            "name": "Audit Student",
            "cgpa": 8.7
        }
    )

    assert response.status_code == 201

    response = client.get(
        "/admin/audit-logs",
        headers=headers
    )

    assert response.status_code == 200

    actions = [
        log["action"]
        for log in response.get_json()
    ]

    assert "LOGIN" in actions
    assert "CREATE_STUDENT" in actions

    with app.app_context():
        assert AuditLog.query.count() >= 2
