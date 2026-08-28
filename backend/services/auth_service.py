from backend.extensions import bcrypt, db
from backend.models import User


def register_user(username, password, role="user"):

    existing_user = User.query.filter_by(
        username=username
    ).first()

    if existing_user:
        return None, "Username already exists"

    hashed_password = bcrypt.generate_password_hash(
        password
    ).decode("utf-8")

    user = User(
        username=username,
        password=hashed_password,
        role=role,
        is_active=True
    )

    db.session.add(user)
    db.session.commit()

    return user, None


def authenticate_user(username, password):

    user = User.query.filter_by(
        username=username
    ).first()

    if not user:
        return None, "Invalid username or password"

    if not bcrypt.check_password_hash(
        user.password,
        password
    ):
        return None, "Invalid username or password"

    if not getattr(user, "is_active", True):
        return None, "Account is deactivated. Please contact an administrator."

    return user, None


def get_user_by_id(user_id):

    return db.session.get(User, int(user_id))


def get_all_users():

    return User.query.order_by(User.id.asc()).all()


def set_user_active_status(user_id, is_active):

    user = db.session.get(User, int(user_id))
    if not user:
        return None

    user.is_active = bool(is_active)
    db.session.commit()
    return user


def set_user_role(user_id, role):

    user = db.session.get(User, int(user_id))
    if not user:
        return None

    user.role = role
    db.session.commit()
    return user


def make_user_admin(username):

    user = User.query.filter_by(
        username=username
    ).first()

    if not user:
        return None

    user.role = "admin"
    db.session.commit()

    return user
