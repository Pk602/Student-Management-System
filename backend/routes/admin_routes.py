from io import BytesIO

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt, get_jwt_identity, jwt_required

from backend.extensions import db
from backend.models import Student, User
from backend.services.audit_service import get_audit_logs, log_action
from backend.services.auth_service import (
    get_all_users,
    get_user_by_id,
    make_user_admin,
    set_user_active_status,
    set_user_role,
)
from backend.services.student_service import (
    get_admin_statistics,
    get_student_by_id,
    get_students_query,
    import_students_from_excel,
    restore_student,
)


admin_bp = Blueprint(
    "admin",
    __name__,
    url_prefix="/admin"
)


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


@admin_bp.route("/users", methods=["GET"])
@jwt_required()
def list_users():

    if not require_admin():
        return jsonify({
            "error": "Admin access required"
        }), 403

    users = get_all_users()
    result = []
    for user in users:
        student_count = Student.query.filter_by(
            user_id=user.id,
            is_deleted=False
        ).count()
        user_data = user.to_dict()
        user_data["student_count"] = student_count
        result.append(user_data)

    return jsonify(result), 200


@admin_bp.route("/users/<int:user_id>/status", methods=["PUT"])
@jwt_required()
def update_user_status(user_id):

    if not require_admin():
        return jsonify({
            "error": "Admin access required"
        }), 403

    current_admin_id = int(get_jwt_identity())
    if current_admin_id == user_id:
        return jsonify({
            "error": "You cannot deactivate your own admin account"
        }), 400

    data = request.get_json() or {}
    if "is_active" not in data:
        return jsonify({
            "error": "is_active boolean field is required"
        }), 400

    is_active = bool(data["is_active"])
    user = set_user_active_status(user_id, is_active)

    if user is None:
        return jsonify({
            "error": "User not found"
        }), 404

    action_label = "REACTIVATE_USER" if is_active else "DEACTIVATE_USER"
    log_action(
        current_admin_id,
        action_label,
        details=f"{'Reactivated' if is_active else 'Deactivated'} user {user.username} (ID: {user.id})",
    )

    return jsonify({
        "message": f"User {'activated' if is_active else 'deactivated'} successfully",
        "user": user.to_dict(),
    }), 200


@admin_bp.route("/users/<int:user_id>/role", methods=["PUT"])
@jwt_required()
def update_user_role(user_id):

    if not require_admin():
        return jsonify({
            "error": "Admin access required"
        }), 403

    current_admin_id = int(get_jwt_identity())
    data = request.get_json() or {}
    role = data.get("role")

    if role not in ("admin", "user"):
        return jsonify({
            "error": "Role must be 'admin' or 'user'"
        }), 400

    user = set_user_role(user_id, role)
    if user is None:
        return jsonify({
            "error": "User not found"
        }), 404

    log_action(
        current_admin_id,
        "UPDATE_USER_ROLE",
        details=f"Changed user {user.username} role to {role}",
    )

    return jsonify({
        "message": f"User role updated to {role}",
        "user": user.to_dict(),
    }), 200


@admin_bp.route("/make-admin/<username>", methods=["PUT"])
@jwt_required()
def make_admin(username):

    if not require_admin():
        return jsonify({
            "error": "Admin access required"
        }), 403

    user = make_user_admin(username)

    if user is None:
        return jsonify({
            "error": "User not found"
        }), 404

    log_action(
        get_jwt_identity(),
        "PROMOTE_USER",
        details=f"Promoted user {user.username}",
    )

    return jsonify({
        "message": "User promoted to admin",
        "user": {
            "id": user.id,
            "username": user.username,
            "role": user.role,
        },
    }), 200


@admin_bp.route("/students/archived", methods=["GET"])
@jwt_required()
def list_archived_students():

    if not require_admin():
        return jsonify({
            "error": "Admin access required"
        }), 403

    page = request.args.get("page", 1, type=int)
    limit = request.args.get("limit", 10, type=int)
    search_query = (
        request.args.get("q")
        or request.args.get("name")
        or ""
    ).strip()
    target_user_id = request.args.get("user_id", type=int)
    min_cgpa = request.args.get("min_cgpa", type=float)
    max_cgpa = request.args.get("max_cgpa", type=float)

    course = request.args.get("course")
    program = request.args.get("program")
    class_name = request.args.get("class_name") or request.args.get("class")
    year_of_study = request.args.get("year_of_study", type=int) or request.args.get("year", type=int)
    admission_year = request.args.get("admission_year", type=int) or request.args.get("adm_year", type=int)
    graduation_year = request.args.get("graduation_year", type=int) or request.args.get("grad_year", type=int)
    gender = request.args.get("gender")

    query = get_students_query(
        is_admin=True,
        search_query=search_query if search_query else None,
        min_cgpa=min_cgpa,
        max_cgpa=max_cgpa,
        is_deleted=True,
        target_user_id=target_user_id,
        course=course,
        program=program,
        class_name=class_name,
        year_of_study=year_of_study,
        admission_year=admission_year,
        graduation_year=graduation_year,
        gender=gender,
    )

    paginated = query.paginate(
        page=page,
        per_page=limit,
        error_out=False
    )

    return jsonify({
        "students": [
            student.to_dict()
            for student in paginated.items
        ],
        "page": page,
        "limit": limit,
        "total": paginated.total,
        "pages": paginated.pages,
    }), 200


@admin_bp.route("/students/<int:student_id>/restore", methods=["PUT"])
@jwt_required()
def restore_student_route(student_id):

    if not require_admin():
        return jsonify({
            "error": "Admin access required"
        }), 403

    student = get_student_by_id(
        student_id=student_id,
        is_admin=True,
        include_deleted=True
    )

    if student is None:
        return jsonify({
            "error": "Student not found"
        }), 404

    restore_student(student)

    log_action(
        get_jwt_identity(),
        "RESTORE_STUDENT",
        student_id=student.id,
        details=f"Restored archived student {student.name}",
    )

    return jsonify({
        "message": "Student restored successfully",
        "student": student.to_dict(),
    }), 200


@admin_bp.route("/students/import", methods=["POST"])
@jwt_required()
def import_students():

    if not require_admin():
        return jsonify({
            "error": "Admin access required"
        }), 403

    if "file" not in request.files:
        return jsonify({
            "error": "No file uploaded. Please provide an Excel (.xlsx) file in 'file' field"
        }), 400

    file = request.files["file"]
    if not file.filename.endswith(".xlsx"):
        return jsonify({
            "error": "Invalid file format. Only Excel files (.xlsx) are supported"
        }), 400

    target_user_id = (
        request.form.get("user_id")
        or request.args.get("user_id")
        or get_jwt_identity()
    )

    try:
        target_user_id = int(target_user_id)
    except (ValueError, TypeError):
        return jsonify({
            "error": "Invalid target user ID"
        }), 400

    user = get_user_by_id(target_user_id)
    if not user:
        return jsonify({
            "error": "Target student owner user not found"
        }), 404

    file_bytes = BytesIO(file.read())
    result, error = import_students_from_excel(
        file_bytes,
        target_user_id
    )

    if error:
        return jsonify({
            "error": error
        }), 400

    log_action(
        get_jwt_identity(),
        "IMPORT_STUDENTS",
        details=f"Imported {result['imported_count']} students for user {user.username} (Failed: {result['failed_count']})",
    )

    return jsonify({
        "message": f"Excel import completed. {result['imported_count']} imported, {result['failed_count']} failed.",
        "result": result,
    }), 200


@admin_bp.route("/stats", methods=["GET"])
@jwt_required()
def admin_stats():

    if not require_admin():
        return jsonify({
            "error": "Admin access required"
        }), 403

    stats = get_admin_statistics()
    return jsonify(stats), 200


@admin_bp.route("/audit-logs", methods=["GET"])
@jwt_required()
def audit_logs():

    if not require_admin():
        return jsonify({
            "error": "Admin access required"
        }), 403

    action_filter = request.args.get("action")
    user_id_filter = request.args.get("user_id", type=int)
    limit = request.args.get("limit", 200, type=int)

    logs = get_audit_logs(
        user_id=user_id_filter,
        action=action_filter,
        limit=limit,
    )

    return jsonify([
        log.to_dict()
        for log in logs
    ]), 200

