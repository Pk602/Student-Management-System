import logging
from flask import Flask, jsonify
from flask_cors import CORS

from backend.config import Config
from backend.extensions import bcrypt, db, jwt
from backend.routes import (
    admin_bp,
    auth_bp,
    docs_bp,
    lms_bp,
    program_bp,
    student_bp,
)
from backend.services.schema_service import ensure_database_schema
from backend.utils.error_handlers import register_error_handlers


logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] %(levelname)s in %(module)s: %(message)s"
)


def create_app(config_class=Config):

    app = Flask(__name__)
    app.config.from_object(config_class)

    db.init_app(app)
    bcrypt.init_app(app)
    jwt.init_app(app)

    app.register_blueprint(auth_bp)
    app.register_blueprint(student_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(lms_bp)
    app.register_blueprint(program_bp)
    app.register_blueprint(docs_bp)


    CORS(
        app,
        origins=app.config.get("CORS_ORIGINS", ["http://localhost:5173", "http://127.0.0.1:5173"])
    )
    register_error_handlers(app)

    @app.after_request
    def set_security_headers(response):
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        return response

    @app.route("/")
    def home():
        return jsonify({
            "message": "Student API is running",
            "version": "2.0.0",
            "docs": "/apidocs/"
        })

    with app.app_context():
        db.create_all()
        ensure_database_schema()

    return app


app = create_app()


if __name__ == "__main__":
    app.run(debug=True)

