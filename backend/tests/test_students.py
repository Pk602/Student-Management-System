from backend.extensions import db
from backend.models import Student
from backend.tests.conftest import auth_headers


def test_student_crud_and_soft_delete(app, client, user_token):

    headers = auth_headers(user_token)

    response = client.post(
        "/students/",
        headers=headers,
        json={
            "name": "Rahul Kumar",
            "cgpa": 8.5
        }
    )

    assert response.status_code == 201
    student = response.get_json()["student"]
    student_id = student["id"]

    response = client.get(
        "/students/",
        headers=headers
    )

    assert response.status_code == 200
    assert len(response.get_json()) == 1

    response = client.put(
        f"/students/{student_id}",
        headers=headers,
        json={
            "name": "Rahul Sharma",
            "cgpa": 9.0
        }
    )

    assert response.status_code == 200
    assert response.get_json()["student"]["cgpa"] == 9.0

    response = client.delete(
        f"/students/{student_id}",
        headers=headers
    )

    assert response.status_code == 200
    assert response.get_json()["message"] == "Student deleted successfully"

    response = client.get(
        "/students/",
        headers=headers
    )

    assert response.status_code == 200
    assert response.get_json() == []

    response = client.get(
        f"/students/{student_id}",
        headers=headers
    )

    assert response.status_code == 404

    with app.app_context():
        deleted_student = db_student(student_id)

    assert deleted_student.is_deleted is True


def test_student_validation_rejects_invalid_cgpa(client, user_token):

    response = client.post(
        "/students/",
        headers=auth_headers(user_token),
        json={
            "name": "Invalid CGPA",
            "cgpa": 11
        }
    )

    assert response.status_code == 400


def test_search_filters_deleted_students(client, user_token):

    headers = auth_headers(user_token)

    first = client.post(
        "/students/",
        headers=headers,
        json={
            "name": "Active Student",
            "cgpa": 8.2
        }
    ).get_json()["student"]

    second = client.post(
        "/students/",
        headers=headers,
        json={
            "name": "Deleted Student",
            "cgpa": 9.1
        }
    ).get_json()["student"]

    client.delete(
        f"/students/{second['id']}",
        headers=headers
    )

    response = client.get(
        "/students/search?min_cgpa=8",
        headers=headers
    )

    assert response.status_code == 200
    assert response.get_json()["students"] == [first]


def db_student(student_id):

    return db.session.get(
        Student,
        student_id
    )


def test_admin_create_student_with_user_id(app, client, admin_token):
    headers = auth_headers(admin_token)

    response = client.post(
        "/students/",
        headers=headers,
        json={
            "name": "Admin Created Student",
            "cgpa": 9.4,
            "user_id": 1,
        },
    )

    assert response.status_code == 201
    student = response.get_json()["student"]
    assert student["name"] == "Admin Created Student"
    assert student["cgpa"] == 9.4
    assert student["user_id"] == 1

