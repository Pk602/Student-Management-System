from backend.tests.conftest import auth_headers, login, register


def test_admin_user_management_and_deactivation(client, admin_token):
    headers = auth_headers(admin_token)

    # 1. Register a standard user
    register_res = register(client, "testmember", "password123")
    assert register_res.status_code == 201
    user_id = register_res.get_json()["user"]["id"]

    # 2. Admin lists users
    res = client.get("/admin/users", headers=headers)
    assert res.status_code == 200
    users = res.get_json()
    usernames = [u["username"] for u in users]
    assert "testmember" in usernames

    # 3. User can login initially
    member_token = login(client, "testmember", "password123")
    assert member_token is not None

    # 4. Admin deactivates user
    deact_res = client.put(
        f"/admin/users/{user_id}/status",
        headers=headers,
        json={"is_active": False}
    )
    assert deact_res.status_code == 200
    assert deact_res.get_json()["user"]["is_active"] is False

    # 5. Deactivated user cannot login
    failed_login = client.post(
        "/auth/login",
        json={"username": "testmember", "password": "password123"}
    )
    assert failed_login.status_code == 403
    assert "deactivated" in failed_login.get_json()["error"].lower()

    # 6. Admin reactivates user
    react_res = client.put(
        f"/admin/users/{user_id}/status",
        headers=headers,
        json={"is_active": True}
    )
    assert react_res.status_code == 200
    assert react_res.get_json()["user"]["is_active"] is True

    # 7. Reactivated user can login again
    new_token = login(client, "testmember", "password123")
    assert new_token is not None

    # 8. Admin promotes user to admin
    role_res = client.put(
        f"/admin/users/{user_id}/role",
        headers=headers,
        json={"role": "admin"}
    )
    assert role_res.status_code == 200
    assert role_res.get_json()["user"]["role"] == "admin"


def test_regular_user_cannot_manage_users(client, user_token):
    headers = auth_headers(user_token)

    # Attempt to list users as non-admin -> 403
    res = client.get("/admin/users", headers=headers)
    assert res.status_code == 403

    # Attempt to deactivate user as non-admin -> 403
    res = client.put("/admin/users/1/status", headers=headers, json={"is_active": False})
    assert res.status_code == 403
