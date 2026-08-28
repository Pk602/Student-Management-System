from backend.extensions import db
from backend.models.program import Program


DEFAULT_PROGRAMS = ["B.Tech", "M.Tech", "BCA", "MCA"]


def get_all_programs():
    return Program.query.order_by(Program.id.asc()).all()


def get_program_by_id(program_id):
    return db.session.get(Program, program_id)


def get_program_by_name(name):
    if not name:
        return None
    return Program.query.filter(Program.name.ilike(name.strip())).first()


def create_program(name):
    name_clean = name.strip()
    existing = get_program_by_name(name_clean)
    if existing:
        return None, f"Program '{name_clean}' already exists"

    program = Program(name=name_clean)
    db.session.add(program)
    db.session.commit()
    return program, None


def delete_program(program_id):
    program = get_program_by_id(program_id)
    if not program:
        return False, "Program not found"

    db.session.delete(program)
    db.session.commit()
    return True, None


def seed_default_programs():
    for name in DEFAULT_PROGRAMS:
        if not get_program_by_name(name):
            db.session.add(Program(name=name))
    db.session.commit()
