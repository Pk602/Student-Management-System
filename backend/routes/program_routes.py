from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt, get_jwt_identity, jwt_required
from marshmallow import ValidationError

from backend.extensions import db
from backend.models import User
from backend.schemas.program_schema import ProgramSchema
from backend.services.audit_service import log_action
from backend.services.program_service import (
    create_program,
    delete_program,
    get_all_programs,
    seed_default_programs,
)


program_bp = Blueprint(
    "program",
    __name__,
    url_prefix="/programs"
)

program_schema = ProgramSchema()


def require_admin():
    claims = get_jwt()
    if claims.get("role") == "admin":
        return True

    user_id = get_jwt_identity()
    if user_id:
        user = db.session.get(User, int(user_id))
        if user and user.role == "admin" and user.is_active:
            return True

    return False


@program_bp.route("/", methods=["GET"])
@jwt_required()
def list_programs():
    programs = get_all_programs()
    if not programs:
        seed_default_programs()
        programs = get_all_programs()

    return jsonify([p.to_dict() for p in programs]), 200


@program_bp.route("/", methods=["POST"])
@jwt_required()
def add_program():
    if not require_admin():
        return jsonify({"error": "Admin access required"}), 403

    data = request.get_json()
    if not data:
        return jsonify({"error": "Request body is required"}), 400

    try:
        data = program_schema.load(data)
    except ValidationError as err:
        return jsonify({"error": err.messages}), 400

    program, error = create_program(data["name"])
    if error:
        return jsonify({"error": error}), 400

    log_action(
        int(get_jwt_identity()),
        "CREATE_PROGRAM",
        details=f"Created academic program {program.name}",
    )

    return jsonify({
        "message": f"Program '{program.name}' created successfully",
        "program": program.to_dict(),
    }), 201


@program_bp.route("/<int:id>", methods=["DELETE"])
@jwt_required()
def remove_program(id):
    if not require_admin():
        return jsonify({"error": "Admin access required"}), 403

    success, error = delete_program(id)
    if not success:
        return jsonify({"error": error}), 404

    log_action(
        int(get_jwt_identity()),
        "DELETE_PROGRAM",
        details=f"Deleted academic program ID #{id}",
    )

    return jsonify({
        "message": "Program deleted successfully"
    }), 200
