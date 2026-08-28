from backend.extensions import db
from backend.utils.time import utc_now


class AuditLog(db.Model):

    __tablename__ = "audit_logs"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=False,
        index=True
    )

    action = db.Column(
        db.String(50),
        nullable=False,
        index=True
    )

    student_id = db.Column(
        db.Integer,
        db.ForeignKey("students.id"),
        nullable=True,
        index=True
    )

    details = db.Column(
        db.String(255),
        nullable=True
    )

    created_at = db.Column(
        db.DateTime,
        nullable=False,
        default=utc_now,
        index=True
    )

    user = db.relationship(
        "User",
        backref="audit_logs",
        lazy=True
    )

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "username": self.user.username if self.user else None,
            "action": self.action,
            "student_id": self.student_id,
            "details": self.details,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }

