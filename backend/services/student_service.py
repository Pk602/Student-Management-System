import io
import openpyxl
from sqlalchemy import func

from backend.extensions import db
from backend.models import Student, User


def get_students_query(
    user_id=None,
    is_admin=False,
    search_query=None,
    min_cgpa=None,
    max_cgpa=None,
    is_deleted=False,
    target_user_id=None,
    course=None,
    program=None,
    class_name=None,
    year_of_study=None,
    admission_year=None,
    graduation_year=None,
    gender=None,
):

    query = Student.query.filter(Student.is_deleted == is_deleted)

    if not is_admin:
        query = query.filter(Student.user_id == user_id)
    elif target_user_id is not None:
        query = query.filter(Student.user_id == target_user_id)

    if search_query:
        search_term = f"%{search_query.strip()}%"
        query = query.filter(Student.name.ilike(search_term))

    if min_cgpa is not None:
        query = query.filter(Student.cgpa >= min_cgpa)

    if max_cgpa is not None:
        query = query.filter(Student.cgpa <= max_cgpa)

    if course:
        query = query.filter(Student.course == course.strip())

    if program:
        query = query.filter(Student.program == program.strip())

    if class_name:
        query = query.filter(Student.class_name == class_name.strip())

    if year_of_study is not None:
        query = query.filter(Student.year_of_study == year_of_study)

    if admission_year is not None:
        query = query.filter(Student.admission_year == admission_year)

    if graduation_year is not None:
        query = query.filter(Student.graduation_year == graduation_year)

    if gender:
        query = query.filter(Student.gender == gender.strip())

    return query.order_by(Student.id.desc())


def get_all_students(user_id, is_admin=False):

    if is_admin:
        return (
            Student.query.filter_by(is_deleted=False)
            .order_by(Student.id.desc())
            .all()
        )

    return (
        Student.query.filter_by(
            user_id=user_id,
            is_deleted=False,
        )
        .order_by(Student.id.desc())
        .all()
    )


def get_student_by_id(
    student_id,
    user_id=None,
    is_admin=False,
    include_deleted=False,
):

    query = Student.query.filter_by(id=student_id)

    if not include_deleted:
        query = query.filter_by(is_deleted=False)

    if not is_admin and user_id is not None:
        query = query.filter_by(user_id=user_id)

    return query.first()


def create_student(
    name,
    cgpa,
    user_id,
    course=None,
    program=None,
    class_name=None,
    year_of_study=None,
    admission_year=None,
    graduation_year=None,
    gender=None,
):

    student = Student(
        name=name.strip(),
        cgpa=float(cgpa),
        user_id=int(user_id),
        course=course.strip() if course else None,
        program=program.strip() if program else None,
        class_name=class_name.strip() if class_name else None,
        year_of_study=(
            int(year_of_study)
            if year_of_study is not None and str(year_of_study).strip() != ""
            else None
        ),
        admission_year=(
            int(admission_year)
            if admission_year is not None and str(admission_year).strip() != ""
            else None
        ),
        graduation_year=(
            int(graduation_year)
            if graduation_year is not None and str(graduation_year).strip() != ""
            else None
        ),
        gender=gender.strip() if gender else None,
    )

    db.session.add(student)
    db.session.commit()

    return student


def update_student(
    student,
    name,
    cgpa,
    course=None,
    program=None,
    class_name=None,
    year_of_study=None,
    admission_year=None,
    graduation_year=None,
    gender=None,
):

    student.name = name.strip()
    student.cgpa = float(cgpa)
    student.course = course.strip() if course else None
    student.program = program.strip() if program else None
    student.class_name = class_name.strip() if class_name else None
    student.year_of_study = (
        int(year_of_study)
        if year_of_study is not None and str(year_of_study).strip() != ""
        else None
    )
    student.admission_year = (
        int(admission_year)
        if admission_year is not None and str(admission_year).strip() != ""
        else None
    )
    student.graduation_year = (
        int(graduation_year)
        if graduation_year is not None and str(graduation_year).strip() != ""
        else None
    )
    student.gender = gender.strip() if gender else None

    db.session.commit()

    return student


def delete_student(student):

    student.is_deleted = True
    db.session.commit()

    return student


def restore_student(student):

    student.is_deleted = False
    db.session.commit()

    return student


def get_admin_statistics():

    total_active_students = Student.query.filter_by(
        is_deleted=False
    ).count()
    total_archived_students = Student.query.filter_by(
        is_deleted=True
    ).count()
    total_users = User.query.count()
    active_users = User.query.filter_by(is_active=True).count()

    avg_cgpa_result = (
        db.session.query(func.avg(Student.cgpa))
        .filter(Student.is_deleted == False)
        .scalar()
    )
    avg_cgpa = (
        round(float(avg_cgpa_result), 2)
        if avg_cgpa_result is not None
        else 0.0
    )

    return {
        "total_students": total_active_students,
        "total_archived": total_archived_students,
        "total_users": total_users,
        "active_users": active_users,
        "average_cgpa": avg_cgpa,
    }


VALID_COURSES = {"AIDS", "AIML", "IIOT", "AR"}
GENDER_MAP = {
    "male": "Male",
    "m": "Male",
    "female": "Female",
    "f": "Female",
    "other": "Other",
    "o": "Other",
    "prefer not to say": "Prefer not to say",
    "prefer_not_to_say": "Prefer not to say",
    "prefer-not-to-say": "Prefer not to say",
    "n/a": "Prefer not to say",
    "none": "Prefer not to say",
}


def import_students_from_excel(file_stream, target_user_id):

    user = db.session.get(User, int(target_user_id))
    if not user:
        return None, "Target user not found"

    try:
        workbook = openpyxl.load_workbook(file_stream, data_only=True)
    except Exception as error:
        return None, f"Invalid Excel file: {str(error)}"

    sheet = workbook.active
    rows = list(sheet.iter_rows(values_only=True))

    if not rows or len(rows) < 2:
        return {
            "total_rows": 0,
            "imported_count": 0,
            "failed_count": 1,
            "successful": [],
            "failed": [
                {
                    "row": 1,
                    "name": "-",
                    "cgpa": "-",
                    "reason": "File is empty or contains only header row",
                }
            ],
        }, None

    header = [
        str(cell).strip().lower() if cell is not None else ""
        for cell in rows[0]
    ]

    name_idx = -1
    cgpa_idx = -1
    course_idx = -1
    program_idx = -1
    class_idx = -1
    year_idx = -1
    adm_year_idx = -1
    grad_year_idx = -1
    gender_idx = -1

    for idx, raw_c in enumerate(header):
        col = raw_c.lower().replace("_", " ").replace("-", " ").strip()
        if "name" in col or "student" in col:
            name_idx = idx
        elif "cgpa" in col or "gpa" in col or "grade" in col:
            cgpa_idx = idx
        elif "course" in col or "branch" in col or "dept" in col:
            course_idx = idx
        elif "program" in col or "degree" in col:
            program_idx = idx
        elif "class" in col or "section" in col or "sec" in col:
            class_idx = idx
        elif "admission" in col or "adm" in col or "joining" in col or "admit" in col:
            adm_year_idx = idx
        elif "grad" in col or "passout" in col or "batch" in col:
            grad_year_idx = idx
        elif "gender" in col or "sex" in col:
            gender_idx = idx
        elif "year" in col or "study" in col or "yr" in col:
            year_idx = idx

    if name_idx == -1:
        name_idx = 0
    if cgpa_idx == -1:
        cgpa_idx = 1 if len(header) > 1 else 0

    successful = []
    failed = []

    for row_num, row in enumerate(rows[1:], start=2):
        if not row or all(
            c is None or str(c).strip() == "" for c in row
        ):
            continue

        raw_name = row[name_idx] if len(row) > name_idx else None
        raw_cgpa = row[cgpa_idx] if len(row) > cgpa_idx else None

        errors = []
        name_val = (
            str(raw_name).strip() if raw_name is not None else ""
        )
        if not name_val:
            errors.append("Student name is required")
        elif len(name_val) < 2 or len(name_val) > 100:
            errors.append(
                "Student name must be between 2 and 100 characters"
            )

        cgpa_val = None
        if raw_cgpa is None or str(raw_cgpa).strip() == "":
            errors.append("CGPA is required")
        else:
            try:
                cgpa_val = float(raw_cgpa)
                if cgpa_val < 0.0 or cgpa_val > 10.0:
                    errors.append(
                        "CGPA must be between 0.0 and 10.0"
                    )
            except (ValueError, TypeError):
                errors.append("CGPA must be a valid number")

        course_val = None
        if course_idx != -1 and len(row) > course_idx and row[course_idx] is not None:
            raw_course = str(row[course_idx]).strip().upper()
            if raw_course:
                if raw_course in VALID_COURSES:
                    course_val = raw_course
                else:
                    errors.append(
                        f"Invalid course '{raw_course}': must be one of AIDS, AIML, IIOT, AR"
                    )

        program_val = None
        if program_idx != -1 and len(row) > program_idx and row[program_idx] is not None:
            raw_prog = str(row[program_idx]).strip()
            if raw_prog:
                if len(raw_prog) > 50:
                    errors.append("Program must be 50 characters or less")
                else:
                    program_val = raw_prog

        class_val = None
        if class_idx != -1 and len(row) > class_idx and row[class_idx] is not None:
            raw_cls = str(row[class_idx]).strip()
            if raw_cls:
                if len(raw_cls) > 50:
                    errors.append("Class name must be 50 characters or less")
                else:
                    class_val = raw_cls

        year_val = None
        if year_idx != -1 and len(row) > year_idx and row[year_idx] is not None:
            raw_yr = str(row[year_idx]).strip()
            if raw_yr:
                try:
                    parsed_yr = int(float(raw_yr))
                    if parsed_yr < 1 or parsed_yr > 4:
                        errors.append("Year of study must be between 1 and 4")
                    else:
                        year_val = parsed_yr
                except (ValueError, TypeError):
                    errors.append("Year of study must be an integer between 1 and 4")

        adm_val = None
        if adm_year_idx != -1 and len(row) > adm_year_idx and row[adm_year_idx] is not None:
            raw_adm = str(row[adm_year_idx]).strip()
            if raw_adm:
                try:
                    parsed_adm = int(float(raw_adm))
                    if parsed_adm < 1900 or parsed_adm > 2100:
                        errors.append(
                            "Admission year must be a valid 4-digit year (1900-2100)"
                        )
                    else:
                        adm_val = parsed_adm
                except (ValueError, TypeError):
                    errors.append("Admission year must be a valid 4-digit year")

        grad_val = None
        if grad_year_idx != -1 and len(row) > grad_year_idx and row[grad_year_idx] is not None:
            raw_grad = str(row[grad_year_idx]).strip()
            if raw_grad:
                try:
                    parsed_grad = int(float(raw_grad))
                    if parsed_grad < 1900 or parsed_grad > 2100:
                        errors.append(
                            "Graduation year must be a valid 4-digit year (1900-2100)"
                        )
                    else:
                        grad_val = parsed_grad
                except (ValueError, TypeError):
                    errors.append("Graduation year must be a valid 4-digit year")

        gender_val = None
        if gender_idx != -1 and len(row) > gender_idx and row[gender_idx] is not None:
            raw_gender = str(row[gender_idx]).strip()
            if raw_gender:
                norm_gender = GENDER_MAP.get(raw_gender.lower())
                if norm_gender:
                    gender_val = norm_gender
                elif raw_gender in ("Male", "Female", "Other", "Prefer not to say"):
                    gender_val = raw_gender
                else:
                    errors.append(
                        f"Invalid gender '{raw_gender}': must be one of Male, Female, Other, Prefer not to say"
                    )

        if errors:
            failed.append({
                "row": row_num,
                "name": name_val or "(empty)",
                "cgpa": (
                    str(raw_cgpa) if raw_cgpa is not None else "(empty)"
                ),
                "reason": "; ".join(errors),
            })
        else:
            student = Student(
                name=name_val,
                cgpa=round(cgpa_val, 2),
                user_id=int(target_user_id),
                course=course_val,
                program=program_val,
                class_name=class_val,
                year_of_study=year_val,
                admission_year=adm_val,
                graduation_year=grad_val,
                gender=gender_val,
            )
            db.session.add(student)
            successful.append({
                "row": row_num,
                "name": name_val,
                "cgpa": round(cgpa_val, 2),
                "course": course_val,
                "program": program_val,
                "class_name": class_val,
                "year_of_study": year_val,
                "admission_year": adm_val,
                "graduation_year": grad_val,
                "gender": gender_val,
            })

    if successful:
        db.session.commit()

    return {
        "total_rows": len(successful) + len(failed),
        "imported_count": len(successful),
        "failed_count": len(failed),
        "successful": successful,
        "failed": failed,
    }, None


