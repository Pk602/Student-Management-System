from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt, get_jwt_identity, jwt_required
from marshmallow import ValidationError

from backend.schemas import StudentSchema
from backend.services.audit_service import log_action
from backend.services.student_service import (
    create_student,
    delete_student,
    get_all_students,
    get_student_by_id,
    get_students_query,
    update_student,
)


student_bp = Blueprint(
    "student",
    __name__,
    url_prefix="/students"
)


student_schema = StudentSchema()


def serialize_student(student):

    return {
        "id": student.id,
        "name": student.name,
        "cgpa": student.cgpa,
        "course": student.course,
        "program": student.program,
        "class_name": student.class_name,
        "year_of_study": student.year_of_study,
        "admission_year": student.admission_year,
        "graduation_year": student.graduation_year,
        "gender": student.gender,
        "user_id": student.user_id,
        "is_deleted": student.is_deleted,
        "created_at": (
            student.created_at.isoformat()
            if student.created_at
            else None
        ),
        "updated_at": (
            student.updated_at.isoformat()
            if student.updated_at
            else None
        ),
        "owner_username": (
            student.user.username if student.user else None
        ),
    }


def is_admin_user():

    claims = get_jwt()
    return claims.get("role") == "admin"


@student_bp.route("/", methods=["GET"])
@jwt_required()
def get_students():

    user_id = int(get_jwt_identity())
    admin = is_admin_user()

    all_param = request.args.get("all", "false").lower() in (
        "true",
        "1",
    )
    should_get_all = admin and all_param

    students = get_all_students(user_id, is_admin=should_get_all)

    return jsonify([
        serialize_student(student)
        for student in students
    ]), 200


@student_bp.route("/search", methods=["GET"])
@jwt_required()
def search_students():

    user_id = int(get_jwt_identity())
    admin = is_admin_user()

    page = request.args.get("page", 1, type=int)
    limit = request.args.get("limit", 10, type=int)

    search_query = (
        request.args.get("q")
        or request.args.get("name")
        or ""
    ).strip()
    min_cgpa = request.args.get("min_cgpa", type=float)
    max_cgpa = request.args.get("max_cgpa", type=float)
    target_user_id = request.args.get("user_id", type=int)

    course = request.args.get("course")
    program = request.args.get("program")
    class_name = request.args.get("class_name") or request.args.get("class")
    year_of_study = request.args.get("year_of_study", type=int) or request.args.get("year", type=int)
    admission_year = request.args.get("admission_year", type=int) or request.args.get("adm_year", type=int)
    graduation_year = request.args.get("graduation_year", type=int) or request.args.get("grad_year", type=int)
    gender = request.args.get("gender")

    all_users = request.args.get("all", "false").lower() in (
        "true",
        "1",
    )

    if page < 1:
        return jsonify({
            "error": "Page must be greater than 0"
        }), 400

    if limit < 1 or limit > 100:
        return jsonify({
            "error": "Limit must be between 1 and 100"
        }), 400

    if min_cgpa is not None and (min_cgpa < 0 or min_cgpa > 10):
        return jsonify({
            "error": "min_cgpa must be between 0 and 10"
        }), 400

    if max_cgpa is not None and (max_cgpa < 0 or max_cgpa > 10):
        return jsonify({
            "error": "max_cgpa must be between 0 and 10"
        }), 400

    if min_cgpa is not None and max_cgpa is not None and min_cgpa > max_cgpa:
        return jsonify({
            "error": "min_cgpa cannot be greater than max_cgpa"
        }), 400

    query = get_students_query(
        user_id=user_id,
        is_admin=admin and (all_users or target_user_id is not None),
        search_query=search_query if search_query else None,
        min_cgpa=min_cgpa,
        max_cgpa=max_cgpa,
        is_deleted=False,
        target_user_id=target_user_id if admin else None,
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
            serialize_student(student)
            for student in paginated.items
        ],
        "page": page,
        "limit": limit,
        "total": paginated.total,
        "pages": paginated.pages,
    }), 200


@student_bp.route("/<int:id>", methods=["GET"])
@jwt_required()
def get_student(id):

    user_id = int(get_jwt_identity())
    admin = is_admin_user()

    student = get_student_by_id(
        student_id=id,
        user_id=user_id,
        is_admin=admin
    )

    if student is None:
        return jsonify({
            "error": "Student not found"
        }), 404

    return jsonify(serialize_student(student)), 200


@student_bp.route("/", methods=["POST"])
@jwt_required()
def add_student():

    data = request.get_json()

    if not data:
        return jsonify({
            "error": "Request body is required"
        }), 400

    try:
        data = student_schema.load(data)
    except ValidationError as error:
        return jsonify({
            "error": error.messages
        }), 400

    user_id = int(get_jwt_identity())
    admin = is_admin_user()

    target_user_id = user_id
    if admin and "user_id" in request.get_json():
        try:
            target_user_id = int(request.get_json()["user_id"])
        except (ValueError, TypeError):
            pass

    student = create_student(
        name=data["name"],
        cgpa=data["cgpa"],
        user_id=target_user_id,
        course=data.get("course"),
        program=data.get("program"),
        class_name=data.get("class_name"),
        year_of_study=data.get("year_of_study"),
        admission_year=data.get("admission_year"),
        graduation_year=data.get("graduation_year"),
        gender=data.get("gender"),
    )

    log_action(
        user_id,
        "CREATE_STUDENT",
        student_id=student.id,
        details=f"Created student {student.name}",
    )

    return jsonify({
        "message": "Student added successfully",
        "student": serialize_student(student),
    }), 201


@student_bp.route("/<int:id>", methods=["PUT"])
@jwt_required()
def update_student_route(id):

    user_id = int(get_jwt_identity())
    admin = is_admin_user()

    student = get_student_by_id(
        student_id=id,
        user_id=user_id,
        is_admin=admin
    )

    if student is None:
        return jsonify({
            "error": "Student not found"
        }), 404

    data = request.get_json()

    if not data:
        return jsonify({
            "error": "Request body is required"
        }), 400

    try:
        data = student_schema.load(data)
    except ValidationError as error:
        return jsonify({
            "error": error.messages
        }), 400

    student = update_student(
        student=student,
        name=data["name"],
        cgpa=data["cgpa"],
        course=data.get("course"),
        program=data.get("program"),
        class_name=data.get("class_name"),
        year_of_study=data.get("year_of_study"),
        admission_year=data.get("admission_year"),
        graduation_year=data.get("graduation_year"),
        gender=data.get("gender"),
    )

    log_action(
        user_id,
        "UPDATE_STUDENT",
        student_id=student.id,
        details=f"Updated student {student.name}",
    )

    return jsonify({
        "message": "Student updated successfully",
        "student": serialize_student(student),
    }), 200




@student_bp.route("/<int:id>", methods=["DELETE"])
@jwt_required()
def delete_student_route(id):

    user_id = int(get_jwt_identity())
    admin = is_admin_user()

    student = get_student_by_id(
        student_id=id,
        user_id=user_id,
        is_admin=admin
    )

    if student is None:
        return jsonify({
            "error": "Student not found"
        }), 404

    delete_student(student)

    log_action(
        user_id,
        "DELETE_STUDENT",
        student_id=student.id,
        details=f"Soft deleted student {student.name}",
    )

    return jsonify({
        "message": "Student deleted successfully"
    }), 200

