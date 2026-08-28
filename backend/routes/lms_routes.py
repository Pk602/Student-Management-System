import random
from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from backend.models import Student
from backend.services.audit_service import log_action


lms_bp = Blueprint("lms", __name__, url_prefix="/api/lms")


MOCK_COURSES = [
    {"course_id": "CS101", "name": "Introduction to Computer Science", "credits": 4},
    {"course_id": "CS201", "name": "Data Structures & Algorithms", "credits": 4},
    {"course_id": "CS301", "name": "Database Management Systems", "credits": 3},
    {"course_id": "CS401", "name": "Software Engineering & Architecture", "credits": 3},
]


@lms_bp.route("/courses", methods=["GET"])
@jwt_required()
def get_lms_courses():
    """Retrieve available mock LMS courses."""
    return jsonify({
        "status": "success",
        "provider": "MockLMS Enterprise v3.2",
        "courses": MOCK_COURSES
    }), 200


@lms_bp.route("/sync-student/<int:student_id>", methods=["POST"])
@jwt_required()
def sync_student_to_lms(student_id):
    """
    Synchronizes a student record from our system to the mock LMS REST API.
    Simulates external API latency, verification, and enrollment creation.
    """
    user_id = int(get_jwt_identity())

    student = Student.query.filter_by(id=student_id, is_deleted=False).first()
    if not student:
        return jsonify({
            "error": "Active student not found"
        }), 404

    recommended_courses = ["CS101", "CS201"]
    if student.cgpa >= 8.0:
        recommended_courses.extend(["CS301", "CS401"])

    mock_enrollment_id = f"LMS-ENR-{student.id:04d}-{random.randint(1000, 9999)}"

    sync_result = {
        "status": "synchronized",
        "lms_provider": "MockLMS Cloud API",
        "student_id": student.id,
        "student_name": student.name,
        "cgpa": student.cgpa,
        "lms_enrollment_id": mock_enrollment_id,
        "assigned_courses": recommended_courses,
        "sync_timestamp": student.updated_at.isoformat() if student.updated_at else student.created_at.isoformat()
    }

    log_action(
        user_id,
        "LMS_SYNC",
        student_id=student.id,
        details=f"Synced student {student.name} to Mock LMS (Enrollment ID: {mock_enrollment_id})"
    )

    return jsonify({
        "message": f"Successfully synchronized student '{student.name}' with LMS",
        "data": sync_result
    }), 200


@lms_bp.route("/sync-all", methods=["POST"])
@jwt_required()
def sync_all_students_to_lms():
    """Batch synchronize all active students for current user or admin."""
    user_id = int(get_jwt_identity())

    students = Student.query.filter_by(is_deleted=False).all()

    synced_items = []
    for s in students:
        synced_items.append({
            "student_id": s.id,
            "name": s.name,
            "lms_id": f"LMS-BATCH-{s.id:04d}"
        })

    log_action(
        user_id,
        "LMS_SYNC_BATCH",
        details=f"Batch synchronized {len(synced_items)} students to Mock LMS"
    )

    return jsonify({
        "message": f"Synchronized {len(synced_items)} students with LMS",
        "count": len(synced_items),
        "students": synced_items
    }), 200
