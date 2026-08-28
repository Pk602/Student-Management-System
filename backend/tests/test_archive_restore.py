from backend.tests.conftest import auth_headers, register, login


def test_archive_and_restore_student(client, admin_token, user_token):
    admin_headers = auth_headers(admin_token)
    user_headers = auth_headers(user_token)

    # 1. User creates a student
    create_res = client.post(
        "/students/",
        headers=user_headers,
        json={"name": "Archivable Student", "cgpa": 7.8}
    )
    assert create_res.status_code == 201
    student_id = create_res.get_json()["student"]["id"]

    # 2. User deletes (archives) the student
    del_res = client.delete(f"/students/{student_id}", headers=user_headers)
    assert del_res.status_code == 200

    # 3. Student is not visible in regular list
    list_res = client.get("/students/", headers=user_headers)
    assert list_res.status_code == 200
    assert not any(s["id"] == student_id for s in list_res.get_json())

    # 4. Admin views archived students
    archived_res = client.get("/admin/students/archived", headers=admin_headers)
    assert archived_res.status_code == 200
    archived_students = archived_res.get_json()["students"]
    assert any(s["id"] == student_id for s in archived_students)

    # 5. Admin restores the student
    restore_res = client.put(f"/admin/students/{student_id}/restore", headers=admin_headers)
    assert restore_res.status_code == 200
    assert restore_res.get_json()["student"]["is_deleted"] is False

    # 6. Student is back in active list
    list_res_after = client.get("/students/", headers=user_headers)
    assert list_res_after.status_code == 200
    assert any(s["id"] == student_id for s in list_res_after.get_json())


def test_admin_archived_student_filtering(client, admin_token):
    admin_headers = auth_headers(admin_token)

    # Create target users
    register(client, "arch_owner_1", "password123")
    u1_token = login(client, "arch_owner_1", "password123")
    u1_headers = auth_headers(u1_token)
    me_res = client.get("/auth/me", headers=u1_headers)
    u1_id = me_res.get_json()["user"]["id"]

    register(client, "arch_owner_2", "password123")
    u2_token = login(client, "arch_owner_2", "password123")
    u2_headers = auth_headers(u2_token)
    me_res2 = client.get("/auth/me", headers=u2_headers)
    u2_id = me_res2.get_json()["user"]["id"]

    # Populate multiple students under u1 and u2, then archive them
    archived_data = [
        {"name": "Archived AIDS Student", "cgpa": 8.5, "course": "AIDS", "program": "B.Tech", "class_name": "B2", "year_of_study": 3, "admission_year": 2023, "graduation_year": 2027, "gender": "Male"},
        {"name": "Archived AIML Student", "cgpa": 9.2, "course": "AIML", "program": "M.Tech", "class_name": "A1", "year_of_study": 2, "admission_year": 2024, "graduation_year": 2026, "gender": "Female"},
        {"name": "Archived IIOT Student", "cgpa": 7.4, "course": "IIOT", "program": "BCA", "class_name": "C1", "year_of_study": 1, "admission_year": 2025, "graduation_year": 2028, "gender": "Other"},
        {"name": "Archived AR Student", "cgpa": 6.8, "course": "AR", "program": "MCA", "class_name": "B2", "year_of_study": 2, "admission_year": 2023, "graduation_year": 2025, "gender": "Prefer not to say"},
    ]

    created_ids = []
    for idx, s in enumerate(archived_data):
        h = u1_headers if idx % 2 == 0 else u2_headers
        c_res = client.post("/students/", headers=h, json=s)
        assert c_res.status_code == 201
        sid = c_res.get_json()["student"]["id"]
        created_ids.append(sid)
        # Archive immediately
        d_res = client.delete(f"/students/{sid}", headers=h)
        assert d_res.status_code == 200

    # 1. Filter archived by course = AIDS
    res = client.get("/admin/students/archived?course=AIDS", headers=admin_headers)
    assert res.status_code == 200
    names = [s["name"] for s in res.get_json()["students"]]
    assert "Archived AIDS Student" in names
    assert "Archived AIML Student" not in names

    # 2. Filter archived by program = M.Tech
    res = client.get("/admin/students/archived?program=M.Tech", headers=admin_headers)
    assert res.status_code == 200
    names = [s["name"] for s in res.get_json()["students"]]
    assert "Archived AIML Student" in names
    assert "Archived AIDS Student" not in names

    # 3. Filter archived by class_name = B2
    res = client.get("/admin/students/archived?class_name=B2", headers=admin_headers)
    assert res.status_code == 200
    assert res.get_json()["total"] >= 2

    # 4. Filter archived by admission_year = 2023
    res = client.get("/admin/students/archived?admission_year=2023", headers=admin_headers)
    assert res.status_code == 200
    for s in res.get_json()["students"]:
        if s["id"] in created_ids:
            assert s["admission_year"] == 2023

    # 5. Filter archived by graduation_year = 2026
    res = client.get("/admin/students/archived?graduation_year=2026", headers=admin_headers)
    assert res.status_code == 200
    for s in res.get_json()["students"]:
        if s["id"] in created_ids:
            assert s["graduation_year"] == 2026

    # 6. Filter archived by gender = Female
    res = client.get("/admin/students/archived?gender=Female", headers=admin_headers)
    assert res.status_code == 200
    names = [s["name"] for s in res.get_json()["students"]]
    assert "Archived AIML Student" in names

    # 7. Filter archived by gender = Prefer not to say
    res = client.get("/admin/students/archived?gender=Prefer%20not%20to%20say", headers=admin_headers)
    assert res.status_code == 200
    names = [s["name"] for s in res.get_json()["students"]]
    assert "Archived AR Student" in names

    # 8. Filter archived by CGPA range [8.0, 9.5]
    res = client.get("/admin/students/archived?min_cgpa=8.0&max_cgpa=9.5", headers=admin_headers)
    assert res.status_code == 200
    for s in res.get_json()["students"]:
        if s["id"] in created_ids:
            assert 8.0 <= s["cgpa"] <= 9.5

    # 9. Filter archived by search query 'IIOT'
    res = client.get("/admin/students/archived?q=IIOT", headers=admin_headers)
    assert res.status_code == 200
    names = [s["name"] for s in res.get_json()["students"]]
    assert "Archived IIOT Student" in names

    # 10. Filter archived by user_id = u1_id
    res = client.get(f"/admin/students/archived?user_id={u1_id}", headers=admin_headers)
    assert res.status_code == 200
    for s in res.get_json()["students"]:
        if s["id"] in created_ids:
            assert s["user_id"] == u1_id


def test_non_admin_cannot_access_archived_endpoints(client, user_token):
    user_headers = auth_headers(user_token)

    # 1. Non-admin cannot list archived
    res = client.get("/admin/students/archived", headers=user_headers)
    assert res.status_code == 403

    # 2. Non-admin cannot restore
    res = client.put("/admin/students/1/restore", headers=user_headers)
    assert res.status_code == 403

