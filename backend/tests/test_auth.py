from backend.tests.conftest import auth_headers, register


def test_register_login_and_me(client):

    response = register(client)

    assert response.status_code == 201
    assert response.get_json()["message"] == "User registered successfully"

    response = client.post(
        "/auth/login",
        json={
            "username": "student",
            "password": "password123"
        }
    )

    assert response.status_code == 200

    token = response.get_json()["access_token"]

    response = client.get(
        "/auth/me",
        headers=auth_headers(token)
    )

    assert response.status_code == 200
    assert response.get_json()["username"] == "student"
    assert response.get_json()["role"] == "user"


def test_duplicate_register_returns_conflict(client):

    register(client)
    response = register(client)

    assert response.status_code == 409
    assert response.get_json()["error"] == "Username already exists"


def test_invalid_login_returns_unauthorized(client):

    register(client)

    response = client.post(
        "/auth/login",
        json={
            "username": "student",
            "password": "wrong-password"
        }
    )

    assert response.status_code == 401
