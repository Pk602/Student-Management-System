from flask import Blueprint, jsonify, request
from flask_jwt_extended import (
    create_access_token,
    get_jwt_identity,
    jwt_required,
)
from marshmallow import ValidationError

from backend.extensions import db
from backend.models import User
from backend.schemas import RegisterSchema
from backend.services.audit_service import log_action
from backend.services.auth_service import (
    authenticate_user,
    register_user,
)


auth_bp = Blueprint(
    "auth",
    __name__,
    url_prefix="/auth"
)


register_schema = RegisterSchema()


@auth_bp.route("/register", methods=["POST"])
def register():

    data = request.get_json()

    if not data:
        return jsonify({
            "error": "Request body is required"
        }), 400

    try:
        data = register_schema.load(data)
    except ValidationError as error:
        return jsonify({
            "error": error.messages
        }), 400

    user, error = register_user(
        data["username"],
        data["password"]
    )

    if user is None:
        return jsonify({
            "error": error
        }), 409

    log_action(
        user.id,
        "REGISTER",
        details=f"User {user.username} registered"
    )

    return jsonify({
        "message": "User registered successfully",
        "user": user.to_dict()
    }), 201


@auth_bp.route("/login", methods=["POST"])
def login():

    data = request.get_json()

    if not data:
        return jsonify({
            "error": "Request body is required"
        }), 400

    username = data.get("username")
    password = data.get("password")

    if not username or not password:
        return jsonify({
            "error": "Username and password are required"
        }), 400

    user, error = authenticate_user(
        username,
        password
    )

    if user is None:
        status_code = 403 if "deactivated" in (error or "").lower() else 401
        return jsonify({
            "error": error or "Invalid username or password"
        }), status_code

    log_action(
        user.id,
        "LOGIN",
        details=f"User {user.username} logged in"
    )

    access_token = create_access_token(
        identity=str(user.id),
        additional_claims={
            "role": user.role,
            "username": user.username
        }
    )

    return jsonify({
        "message": "Login successful",
        "access_token": access_token,
        "user": user.to_dict()
    }), 200


@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def get_current_user():

    user_id = get_jwt_identity()

    user = db.session.get(
        User,
        int(user_id)
    )

    if user is None:
        return jsonify({
            "error": "User not found"
        }), 404

    return jsonify(user.to_dict()), 200

