from backend.extensions import db
from backend.utils.time import utc_now


class Student(db.Model):

    __tablename__ = "students"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    name = db.Column(
        db.String(100),
        nullable=False,
        index=True
    )

    cgpa = db.Column(
        db.Float,
        nullable=False,
        index=True
    )

    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=False,
        index=True
    )

    course = db.Column(
        db.String(20),
        nullable=True,
        index=True
    )

    program = db.Column(
        db.String(50),
        nullable=True,
        index=True
    )

    class_name = db.Column(
        db.String(50),
        nullable=True,
        index=True
    )

    year_of_study = db.Column(
        db.Integer,
        nullable=True,
        index=True
    )

    admission_year = db.Column(
        db.Integer,
        nullable=True,
        index=True
    )

    graduation_year = db.Column(
        db.Integer,
        nullable=True,
        index=True
    )

    gender = db.Column(
        db.String(30),
        nullable=True,
        index=True
    )

    is_deleted = db.Column(
        db.Boolean,
        nullable=False,
        default=False,
        index=True
    )

    created_at = db.Column(
        db.DateTime,
        nullable=False,
        default=utc_now
    )

    updated_at = db.Column(
        db.DateTime,
        nullable=False,
        default=utc_now,
        onupdate=utc_now
    )

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "cgpa": self.cgpa,
            "course": self.course,
            "program": self.program,
            "class_name": self.class_name,
            "year_of_study": self.year_of_study,
            "admission_year": self.admission_year,
            "graduation_year": self.graduation_year,
            "gender": self.gender,
            "user_id": self.user_id,
            "is_deleted": self.is_deleted,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "owner_username": self.user.username if self.user else None
        }


