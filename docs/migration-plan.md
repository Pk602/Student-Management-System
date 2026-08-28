# Migration Plan

## Current Architecture

The repository started as a working full-stack student management app:

- Flask API files lived at the repository root.
- React/Vite frontend already lived in `frontend/`.
- SQLAlchemy models covered `User` and `Student`.
- Existing API behavior included auth, JWT-protected student CRUD, minimum-CGPA search, and a simple admin promotion route.
- SQLite data lived in `instance/students.db`.

## Target Architecture

Move toward a single repository with clear application boundaries:

- `backend/` for Flask application code.
- `frontend/` for React/Vite application code.
- `docs/` for architecture, API, and database notes.
- `sample_data/` for import examples.

## Increment 1: Structural Migration

Completed in this increment:

- Moved backend routes into `backend/routes/`.
- Moved backend services into `backend/services/`.
- Split models into `backend/models/user.py` and `backend/models/student.py`.
- Split schemas into `backend/schemas/auth_schema.py` and `backend/schemas/student_schema.py`.
- Moved shared Flask extensions into `backend/extensions.py`.
- Moved error handlers into `backend/utils/error_handlers.py`.
- Added a Flask `create_app()` factory.
- Kept root `app.py` as a compatibility launcher.
- Preserved the existing SQLite database path.
- Preserved existing endpoint URLs and JSON behavior.
- Centralized frontend API configuration in `frontend/src/api/client.js`.

## Later Increments

Recommended next steps:

- Add admin user management as new endpoints instead of changing `/admin/make-admin/<username>`.
- Add Excel import behind admin authorization.
- Add pagination/search fields incrementally while preserving current `min_cgpa` behavior.
- Introduce PostgreSQL through `DATABASE_URL` after SQLite parity tests pass.
- Add OpenAPI documentation once endpoint behavior stabilizes.

## Increment 2: Soft Delete, Audit Logging, Tests

Completed in this increment:

- Added `students.is_deleted`, `students.created_at`, and `students.updated_at`.
- Changed student deletion from hard delete to soft delete while preserving the existing `DELETE /students/<id>` response.
- Updated student list, detail, update, and search behavior to ignore soft-deleted records.
- Added an `audit_logs` table.
- Logged successful login, student create, student update, student delete, and user promotion actions.
- Added `GET /admin/audit-logs` for admins.
- Added a SQLite startup schema safeguard so existing local databases are upgraded in place.
- Added pytest coverage for auth, student CRUD, soft delete, search filtering, and audit-log authorization.
