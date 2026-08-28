from backend.extensions import db
from backend.models import AuditLog


def log_action(user_id, action, student_id=None, details=None):

    try:
        audit_log = AuditLog(
            user_id=int(user_id) if user_id is not None else None,
            action=action,
            student_id=student_id,
            details=details
        )

        db.session.add(audit_log)
        db.session.commit()

        return audit_log
    except Exception:
        db.session.rollback()
        return None


def get_audit_logs(user_id=None, action=None, limit=100):

    query = AuditLog.query

    if user_id is not None:
        query = query.filter_by(user_id=user_id)

    if action:
        query = query.filter_by(action=action)

    return query.order_by(
        AuditLog.created_at.desc()
    ).limit(limit).all()

