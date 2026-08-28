import os
from datetime import timedelta
from pathlib import Path

from dotenv import load_dotenv


BASE_DIR = Path(__file__).resolve().parent.parent

load_dotenv(BASE_DIR / ".env")
load_dotenv(BASE_DIR / "backend" / ".env")


def get_database_uri():
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        instance_dir = BASE_DIR / "instance"
        instance_dir.mkdir(exist_ok=True)
        return f"sqlite:///{instance_dir / 'students.db'}"

    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)

    if db_url in ("sqlite:///students.db", "sqlite:///instance/students.db"):
        instance_dir = BASE_DIR / "instance"
        instance_dir.mkdir(exist_ok=True)
        return f"sqlite:///{instance_dir / 'students.db'}"

    return db_url


class Config:
    SQLALCHEMY_DATABASE_URI = get_database_uri()
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "dev-only-change-me")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(
        seconds=int(os.getenv("JWT_ACCESS_TOKEN_EXPIRES_SECONDS", 86400))
    )
    CORS_ORIGINS = [
        origin.strip()
        for origin in os.getenv(
            "CORS_ORIGINS",
            "http://localhost:5173,http://127.0.0.1:5173",
        ).split(",")
        if origin.strip()
    ]
    MAX_CONTENT_LENGTH = int(
        os.getenv("MAX_CONTENT_LENGTH", 16 * 1024 * 1024)
    )
    UPLOAD_FOLDER = str(BASE_DIR / "backend" / "uploads")

