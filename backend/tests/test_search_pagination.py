from backend.tests.conftest import auth_headers, login, register


def test_keyword_and_cgpa_search_pagination(client, user_token):
    headers = auth_headers(user_token)

    # Create multiple students
    students_data = [
        ("Alice Walker", 9.5),
        ("Alice Johnson", 8.2),
        ("Bob Smith", 7.1),
        ("Charlie Brown", 8.9),
        ("David Wilson", 6.5),
        ("Eva Green", 9.1),
    ]

    for name, cgpa in students_data:
        res = client.post(
            "/students/",
            headers=headers,
            json={"name": name, "cgpa": cgpa}
        )
        assert res.status_code == 201

    # 1. Search by keyword "Alice"
    res = client.get("/students/search?q=Alice", headers=headers)
    assert res.status_code == 200
    data = res.get_json()
    assert data["total"] == 2
    names = [s["name"] for s in data["students"]]
    assert "Alice Walker" in names
    assert "Alice Johnson" in names

    # 2. Filter by CGPA range [8.0, 9.2]
    res = client.get("/students/search?min_cgpa=8.0&max_cgpa=9.2", headers=headers)
    assert res.status_code == 200
    data = res.get_json()
    assert data["total"] == 3
    cgpas = [s["cgpa"] for s in data["students"]]
    assert all(8.0 <= c <= 9.2 for c in cgpas)

    # 3. Pagination check (limit=2, page=1)
    res = client.get("/students/search?limit=2&page=1", headers=headers)
    assert res.status_code == 200
    data = res.get_json()
    assert len(data["students"]) == 2
    assert data["limit"] == 2
    assert data["page"] == 1
    assert data["total"] == 6
    assert data["pages"] == 3

    # Page 2
    res_page2 = client.get("/students/search?limit=2&page=2", headers=headers)
    assert res_page2.status_code == 200
    data_page2 = res_page2.get_json()
    assert len(data_page2["students"]) == 2
    # Ensure page 2 items are different from page 1 items
    p1_ids = {s["id"] for s in data["students"]}
    p2_ids = {s["id"] for s in data_page2["students"]}
    assert p1_ids.isdisjoint(p2_ids)


def test_admin_can_view_all_students_search(app, client, admin_token):
    # Register user1 and create a student
    register(client, "user1", "password123")
    u1_token = login(client, "user1", "password123")
    client.post(
        "/students/",
        headers=auth_headers(u1_token),
        json={"name": "User1 Student", "cgpa": 8.0}
    )

    # Register user2 and create a student
    register(client, "user2", "password123")
    u2_token = login(client, "user2", "password123")
    client.post(
        "/students/",
        headers=auth_headers(u2_token),
        json={"name": "User2 Student", "cgpa": 9.0}
    )

    # Normal user1 searches -> only sees their own student
    res_u1 = client.get("/students/search", headers=auth_headers(u1_token))
    assert res_u1.status_code == 200
    assert res_u1.get_json()["total"] == 1

    # Admin searches with all=true -> sees all students across users
    res_admin = client.get("/students/search?all=true", headers=auth_headers(admin_token))
    assert res_admin.status_code == 200
    assert res_admin.get_json()["total"] >= 2
