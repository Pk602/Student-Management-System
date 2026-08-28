from backend.tests.conftest import auth_headers


def test_admin_stats(client, admin_token, user_token):
    # User creates a student
    client.post(
        "/students/",
        headers=auth_headers(user_token),
        json={"name": "Stats Student 1", "cgpa": 8.0}
    )

    # Admin requests stats
    res = client.get("/admin/stats", headers=auth_headers(admin_token))
    assert res.status_code == 200
    data = res.get_json()
    assert "total_students" in data
    assert "total_archived" in data
    assert "total_users" in data
    assert "average_cgpa" in data
    assert data["total_students"] >= 1
    assert data["average_cgpa"] > 0


def test_mock_lms_sync_and_courses(client, user_token):
    headers = auth_headers(user_token)

    # 1. Create a student
    create_res = client.post(
        "/students/",
        headers=headers,
        json={"name": "LMS Scholar", "cgpa": 9.2}
    )
    student_id = create_res.get_json()["student"]["id"]

    # 2. Get LMS courses
    courses_res = client.get("/api/lms/courses", headers=headers)
    assert courses_res.status_code == 200
    assert len(courses_res.get_json()["courses"]) > 0

    # 3. Sync student with LMS
    sync_res = client.post(f"/api/lms/sync-student/{student_id}", headers=headers)
    assert sync_res.status_code == 200
    data = sync_res.get_json()["data"]
    assert data["status"] == "synchronized"
    assert "lms_enrollment_id" in data
    assert data["student_name"] == "LMS Scholar"


def test_swagger_documentation_endpoint(client):
    # Check OpenAPI JSON specification
    res_json = client.get("/apidocs/openapi.json")
    assert res_json.status_code == 200
    spec = res_json.get_json()
    assert spec["openapi"] == "3.0.3"
    assert "/students/" in spec["paths"]
    assert "/admin/users" in spec["paths"]

    # Check Swagger UI HTML page
    res_ui = client.get("/apidocs/")
    assert res_ui.status_code == 200
    assert b"SwaggerUIBundle" in res_ui.data
