from backend.extensions import db
from backend.utils.time import utc_now


class Program(db.Model):

    __tablename__ = "programs"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    name = db.Column(
        db.String(50),
        unique=True,
        nullable=False,
        index=True
    )

    created_at = db.Column(
        db.DateTime,
        nullable=False,
        default=utc_now
    )

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "created_at": (
                self.created_at.isoformat()
                if self.created_at
                else None
            ),
        }
