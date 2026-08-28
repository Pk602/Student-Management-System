import pytest

from backend.app import create_app
from backend.extensions import db
from backend.models import User


class TestConfig:
    TESTING = True
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = "test-secret-key-that-is-long-enough"
    CORS_ORIGINS = ["http://localhost:5173"]


@pytest.fixture()
def app():

    app = create_app(TestConfig)

    with app.app_context():
        db.drop_all()
        db.create_all()

    yield app


@pytest.fixture()
def client(app):

    return app.test_client()


def register(client, username="student", password="password123"):

    return client.post(
        "/auth/register",
        json={
            "username": username,
            "password": password
        }
    )


def login(client, username="student", password="password123"):

    response = client.post(
        "/auth/login",
        json={
            "username": username,
            "password": password
        }
    )

    return response.get_json()["access_token"]


def auth_headers(token):

    return {
        "Authorization": f"Bearer {token}"
    }


@pytest.fixture()
def user_token(client):

    register(client)

    return login(client)


@pytest.fixture()
def admin_token(app, client):

    register(client, "admin", "password123")

    with app.app_context():
        admin = User.query.filter_by(
            username="admin"
        ).first()
        admin.role = "admin"
        db.session.commit()

    return login(client, "admin", "password123")
