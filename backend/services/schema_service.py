from sqlalchemy import inspect, text

from backend.extensions import db


def ensure_database_schema():

    if db.engine.dialect.name != "sqlite":
        return

    inspector = inspect(db.engine)
    table_names = inspector.get_table_names()

    statements = []

    if "students" in table_names:
        student_columns = {
            column["name"]
            for column in inspector.get_columns("students")
        }

        if "is_deleted" not in student_columns:
            statements.append(
                "ALTER TABLE students "
                "ADD COLUMN is_deleted BOOLEAN NOT NULL DEFAULT 0"
            )

        if "created_at" not in student_columns:
            statements.append(
                "ALTER TABLE students "
                "ADD COLUMN created_at DATETIME"
            )

        if "updated_at" not in student_columns:
            statements.append(
                "ALTER TABLE students "
                "ADD COLUMN updated_at DATETIME"
            )

        if "course" not in student_columns:
            statements.append(
                "ALTER TABLE students "
                "ADD COLUMN course VARCHAR(20)"
            )

        if "program" not in student_columns:
            statements.append(
                "ALTER TABLE students "
                "ADD COLUMN program VARCHAR(50)"
            )

        if "class_name" not in student_columns:
            statements.append(
                "ALTER TABLE students "
                "ADD COLUMN class_name VARCHAR(50)"
            )

        if "year_of_study" not in student_columns:
            statements.append(
                "ALTER TABLE students "
                "ADD COLUMN year_of_study INTEGER"
            )

        if "admission_year" not in student_columns:
            statements.append(
                "ALTER TABLE students "
                "ADD COLUMN admission_year INTEGER"
            )

        if "graduation_year" not in student_columns:
            statements.append(
                "ALTER TABLE students "
                "ADD COLUMN graduation_year INTEGER"
            )

        if "gender" not in student_columns:
            statements.append(
                "ALTER TABLE students "
                "ADD COLUMN gender VARCHAR(30)"
            )


    if "users" in table_names:
        user_columns = {
            column["name"]
            for column in inspector.get_columns("users")
        }

        if "is_active" not in user_columns:
            statements.append(
                "ALTER TABLE users "
                "ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT 1"
            )

        if "created_at" not in user_columns:
            statements.append(
                "ALTER TABLE users "
                "ADD COLUMN created_at DATETIME"
            )

    for statement in statements:
        db.session.execute(text(statement))

    if statements:
        db.session.commit()

    # Seed default programs if programs table exists and is empty
    if "programs" in table_names or "programs" in inspect(db.engine).get_table_names():
        from backend.models.program import Program
        try:
            if Program.query.count() == 0:
                default_programs = ["B.Tech", "M.Tech", "BCA", "MCA"]
                for p_name in default_programs:
                    db.session.add(Program(name=p_name))
                db.session.commit()
        except Exception:
            db.session.rollback()


