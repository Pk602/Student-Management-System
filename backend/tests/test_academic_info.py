import io
import openpyxl
from backend.models import Program, Student
from backend.tests.conftest import auth_headers, login, register


def create_excel(rows):
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Students"
    for r in rows:
        ws.append(r)
    stream = io.BytesIO()
    wb.save(stream)
    stream.seek(0)
    return stream


def test_academic_fields_student_crud(client, user_token):
    headers = auth_headers(user_token)

    # 1. Create student with full academic info including admission_year and gender
    res = client.post(
        "/students/",
        headers=headers,
        json={
            "name": "Pratyush Kumar",
            "cgpa": 8.75,
            "course": "AIDS",
            "program": "B.Tech",
            "class_name": "B2",
            "year_of_study": 3,
            "admission_year": 2023,
            "graduation_year": 2027,
            "gender": "Male",
        },
    )
    assert res.status_code == 201
    student = res.get_json()["student"]
    assert student["name"] == "Pratyush Kumar"
    assert student["cgpa"] == 8.75
    assert student["course"] == "AIDS"
    assert student["program"] == "B.Tech"
    assert student["class_name"] == "B2"
    assert student["year_of_study"] == 3
    assert student["admission_year"] == 2023
    assert student["graduation_year"] == 2027
    assert student["gender"] == "Male"
    s_id = student["id"]

    # 2. Update student academic fields
    update_res = client.put(
        f"/students/{s_id}",
        headers=headers,
        json={
            "name": "Pratyush K. Sharma",
            "cgpa": 9.1,
            "course": "AIML",
            "program": "M.Tech",
            "class_name": "A1",
            "year_of_study": 4,
            "admission_year": 2022,
            "graduation_year": 2026,
            "gender": "Other",
        },
    )
    assert update_res.status_code == 200
    updated = update_res.get_json()["student"]
    assert updated["name"] == "Pratyush K. Sharma"
    assert updated["cgpa"] == 9.1
    assert updated["course"] == "AIML"
    assert updated["program"] == "M.Tech"
    assert updated["class_name"] == "A1"
    assert updated["year_of_study"] == 4
    assert updated["admission_year"] == 2022
    assert updated["graduation_year"] == 2026
    assert updated["gender"] == "Other"


def test_academic_fields_validation(client, user_token):
    headers = auth_headers(user_token)

    # Invalid course
    res = client.post(
        "/students/",
        headers=headers,
        json={"name": "Test User", "cgpa": 8.0, "course": "CIVIL"},
    )
    assert res.status_code == 400

    # Invalid year of study (> 4)
    res = client.post(
        "/students/",
        headers=headers,
        json={"name": "Test User", "cgpa": 8.0, "year_of_study": 5},
    )
    assert res.status_code == 400

    # Invalid admission year (< 1900)
    res = client.post(
        "/students/",
        headers=headers,
        json={"name": "Test User", "cgpa": 8.0, "admission_year": 1850},
    )
    assert res.status_code == 400

    # Invalid admission year (> 2100)
    res = client.post(
        "/students/",
        headers=headers,
        json={"name": "Test User", "cgpa": 8.0, "admission_year": 2150},
    )
    assert res.status_code == 400

    # Invalid graduation year (< 1900)
    res = client.post(
        "/students/",
        headers=headers,
        json={"name": "Test User", "cgpa": 8.0, "graduation_year": 1850},
    )
    assert res.status_code == 400

    # Invalid graduation year (> 2100)
    res = client.post(
        "/students/",
        headers=headers,
        json={"name": "Test User", "cgpa": 8.0, "graduation_year": 2150},
    )
    assert res.status_code == 400

    # Invalid gender
    res = client.post(
        "/students/",
        headers=headers,
        json={"name": "Test User", "cgpa": 8.0, "gender": "NonBinary"},
    )
    assert res.status_code == 400

    # Valid genders are accepted
    for g in ["Male", "Female", "Other", "Prefer not to say"]:
        valid_res = client.post(
            "/students/",
            headers=headers,
            json={"name": f"Gender {g} Student", "cgpa": 8.0, "gender": g},
        )
        assert valid_res.status_code == 201
        assert valid_res.get_json()["student"]["gender"] == g


def test_academic_search_filtering(client, user_token):
    headers = auth_headers(user_token)

    students = [
        {"name": "Student AIDS 1", "cgpa": 8.5, "course": "AIDS", "program": "B.Tech", "class_name": "B2", "year_of_study": 3, "admission_year": 2023, "graduation_year": 2027, "gender": "Male"},
        {"name": "Student AIML 1", "cgpa": 7.9, "course": "AIML", "program": "B.Tech", "class_name": "A1", "year_of_study": 2, "admission_year": 2024, "graduation_year": 2028, "gender": "Female"},
        {"name": "Student IIOT 1", "cgpa": 9.1, "course": "IIOT", "program": "M.Tech", "class_name": "B2", "year_of_study": 1, "admission_year": 2025, "graduation_year": 2026, "gender": "Other"},
        {"name": "Student AR 1", "cgpa": 8.0, "course": "AR", "program": "BCA", "class_name": "C1", "year_of_study": 3, "admission_year": 2023, "graduation_year": 2027, "gender": "Prefer not to say"},
    ]

    for s in students:
        res = client.post("/students/", headers=headers, json=s)
        assert res.status_code == 201

    # Filter by course: AIDS
    res = client.get("/students/search?course=AIDS", headers=headers)
    assert res.status_code == 200
    assert res.get_json()["total"] == 1
    assert res.get_json()["students"][0]["course"] == "AIDS"

    # Filter by class_name: B2
    res = client.get("/students/search?class_name=B2", headers=headers)
    assert res.status_code == 200
    assert res.get_json()["total"] == 2

    # Filter by year_of_study: 3
    res = client.get("/students/search?year_of_study=3", headers=headers)
    assert res.status_code == 200
    assert res.get_json()["total"] == 2

    # Filter by program: M.Tech
    res = client.get("/students/search?program=M.Tech", headers=headers)
    assert res.status_code == 200
    assert res.get_json()["total"] == 1

    # Filter by admission_year: 2023
    res = client.get("/students/search?admission_year=2023", headers=headers)
    assert res.status_code == 200
    assert res.get_json()["total"] == 2
    for item in res.get_json()["students"]:
        assert item["admission_year"] == 2023

    # Filter by graduation_year: 2028
    res = client.get("/students/search?graduation_year=2028", headers=headers)
    assert res.status_code == 200
    assert res.get_json()["total"] == 1
    assert res.get_json()["students"][0]["graduation_year"] == 2028

    # Filter by gender: Female
    res = client.get("/students/search?gender=Female", headers=headers)
    assert res.status_code == 200
    assert res.get_json()["total"] == 1
    assert res.get_json()["students"][0]["gender"] == "Female"

    # Filter by gender: Prefer not to say
    res = client.get("/students/search?gender=Prefer%20not%20to%20say", headers=headers)
    assert res.status_code == 200
    assert res.get_json()["total"] == 1
    assert res.get_json()["students"][0]["gender"] == "Prefer not to say"


def test_program_management_api(client, admin_token, user_token):
    admin_headers = auth_headers(admin_token)
    user_headers = auth_headers(user_token)

    # 1. Any authenticated user can list programs
    res = client.get("/programs/", headers=user_headers)
    assert res.status_code == 200
    programs = res.get_json()
    names = [p["name"] for p in programs]
    assert "B.Tech" in names
    assert "M.Tech" in names
    assert "BCA" in names
    assert "MCA" in names

    # 2. Regular user cannot add program -> 403
    res = client.post("/programs/", headers=user_headers, json={"name": "MBA"})
    assert res.status_code == 403

    # 3. Admin can add a new program
    res = client.post("/programs/", headers=admin_headers, json={"name": "MBA"})
    assert res.status_code == 201
    created_id = res.get_json()["program"]["id"]

    # 4. Duplicate program rejected -> 400
    dup_res = client.post("/programs/", headers=admin_headers, json={"name": "MBA"})
    assert dup_res.status_code == 400

    # 5. Admin can delete program
    del_res = client.delete(f"/programs/{created_id}", headers=admin_headers)
    assert del_res.status_code == 200


def test_academic_excel_import(client, admin_token):
    headers = auth_headers(admin_token)
    reg_res = register(client, "excel_academic_user", "password123")
    target_user_id = reg_res.get_json()["user"]["id"]

    # Excel file with all 9 columns: name, cgpa, course, program, class_name, year_of_study, admission_year, graduation_year, gender
    rows = [
        ["name", "cgpa", "course", "program", "class_name", "year_of_study", "admission_year", "graduation_year", "gender"],
        ["Pratyush Kumar", 8.75, "AIDS", "B.Tech", "B2", 3, 2023, 2027, "Male"],
        ["Ananya Roy", 9.2, "AIML", "M.Tech", "A1", 2, 2024, 2026, "Female"],
        ["Alex Green", 8.1, "IIOT", "BCA", "C1", 1, 2025, 2028, "Other"],
        ["Sam Taylor", 7.8, "AR", "MCA", "D1", 2, 2024, 2026, "Prefer not to say"],
        ["Invalid Course Student", 8.0, "INVALID_COURSE", "B.Tech", "A1", 2, 2023, 2027, "Male"],
        ["Invalid Adm Year Student", 8.0, "AIDS", "B.Tech", "B2", 3, 1850, 2027, "Male"],
        ["Invalid Grad Year Student", 8.0, "AIDS", "B.Tech", "B2", 3, 2023, 2250, "Male"],
        ["Invalid Gender Student", 8.0, "AIDS", "B.Tech", "B2", 3, 2023, 2027, "UnknownGender"],
    ]

    excel_file = create_excel(rows)
    data = {
        "user_id": str(target_user_id),
        "file": (excel_file, "academic_students.xlsx"),
    }

    res = client.post(
        "/admin/students/import",
        headers={**headers, "Content-Type": "multipart/form-data"},
        data=data,
    )
    assert res.status_code == 200
    res_json = res.get_json()
    result = res_json["result"]
    assert result["imported_count"] == 4
    assert result["failed_count"] == 4
    assert len(result["successful"]) == 4

    # Verify first imported student
    p_student = result["successful"][0]
    assert p_student["name"] == "Pratyush Kumar"
    assert p_student["cgpa"] == 8.75
    assert p_student["course"] == "AIDS"
    assert p_student["program"] == "B.Tech"
    assert p_student["class_name"] == "B2"
    assert p_student["year_of_study"] == 3
    assert p_student["admission_year"] == 2023
    assert p_student["graduation_year"] == 2027
    assert p_student["gender"] == "Male"

    # Verify second imported student
    a_student = result["successful"][1]
    assert a_student["name"] == "Ananya Roy"
    assert a_student["gender"] == "Female"

    # Verify third imported student
    g_student = result["successful"][2]
    assert g_student["gender"] == "Other"

    # Verify fourth imported student
    s_student = result["successful"][3]
    assert s_student["gender"] == "Prefer not to say"
