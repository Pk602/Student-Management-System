import io
import openpyxl

from backend.tests.conftest import auth_headers, register


def create_mock_excel_file(rows):
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Students"
    for row in rows:
        ws.append(row)
    output = io.BytesIO()
    wb.save(output)
    output.seek(0)
    return output


def test_excel_bulk_import_valid_and_invalid_rows(client, admin_token):
    headers = auth_headers(admin_token)

    # Register a user to own the imported students
    u_res = register(client, "excel_target", "password123")
    target_user_id = u_res.get_json()["user"]["id"]

    # Prepare rows: 1 header + 2 valid + 2 invalid
    test_rows = [
        ["Student Name", "CGPA"],
        ["Emma Watson", 9.4],
        ["Daniel Radcliffe", 8.8],
        ["", 7.5],             # Invalid: missing name
        ["Rupert Grint", 12.5],  # Invalid: CGPA > 10
    ]

    excel_file = create_mock_excel_file(test_rows)

    data = {
        "user_id": str(target_user_id),
        "file": (excel_file, "students.xlsx")
    }

    res = client.post(
        "/admin/students/import",
        headers={**headers, "Content-Type": "multipart/form-data"},
        data=data
    )

    assert res.status_code == 200
    res_data = res.get_json()
    result = res_data["result"]
    assert result["imported_count"] == 2
    assert result["failed_count"] == 2
    assert len(result["failed"]) == 2

    # Check error reasons
    failed_rows = result["failed"]
    reasons = " ".join([f["reason"] for f in failed_rows])
    assert "name is required" in reasons.lower()
    assert "between 0.0 and 10.0" in reasons


def test_regular_user_cannot_import_excel(client, user_token):
    headers = auth_headers(user_token)
    excel_file = create_mock_excel_file([["Name", "CGPA"], ["Test", 8.0]])

    res = client.post(
        "/admin/students/import",
        headers={**headers, "Content-Type": "multipart/form-data"},
        data={"file": (excel_file, "students.xlsx")}
    )

    assert res.status_code == 403


def test_excel_import_all_nine_columns_and_gender_normalization(client, admin_token):
    headers = auth_headers(admin_token)

    u_res = register(client, "nine_col_target", "password123")
    target_user_id = u_res.get_json()["user"]["id"]

    test_rows = [
        ["name", "cgpa", "course", "program", "class_name", "year_of_study", "admission_year", "graduation_year", "gender"],
        ["Student One", 9.1, "AIDS", "B.Tech", "A1", 1, 2023, 2027, "male"],
        ["Student Two", 8.5, "AIML", "M.Tech", "B1", 2, 2024, 2026, "FEMALE"],
        ["Student Three", 7.9, "IIOT", "BCA", "C1", 3, 2022, 2025, "other"],
        ["Student Four", 8.0, "AR", "MCA", "D1", 2, 2023, 2025, "prefer_not_to_say"],
    ]

    excel_file = create_mock_excel_file(test_rows)
    data = {
        "user_id": str(target_user_id),
        "file": (excel_file, "nine_cols.xlsx"),
    }

    res = client.post(
        "/admin/students/import",
        headers={**headers, "Content-Type": "multipart/form-data"},
        data=data,
    )

    assert res.status_code == 200
    result = res.get_json()["result"]
    assert result["imported_count"] == 4
    assert result["failed_count"] == 0

    succ = result["successful"]
    assert succ[0]["gender"] == "Male"
    assert succ[0]["admission_year"] == 2023
    assert succ[0]["graduation_year"] == 2027
    assert succ[0]["year_of_study"] == 1
    assert succ[0]["class_name"] == "A1"
    assert succ[0]["program"] == "B.Tech"
    assert succ[0]["course"] == "AIDS"

    assert succ[1]["gender"] == "Female"
    assert succ[2]["gender"] == "Other"
    assert succ[3]["gender"] == "Prefer not to say"

