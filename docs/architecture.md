# Architecture

```text
frontend/
  React + Vite UI
  src/api/client.js
        |
        v
backend/
  Flask app factory
  routes/
        |
        v
  services/
        |
        v
  models/ + SQLAlchemy
        |
        v
  SQLite now, PostgreSQL later through DATABASE_URL
```

The backend now uses package imports and an application factory while keeping the current API surface stable. Root-level compatibility modules remain for older imports during the migration.
