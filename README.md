# Student Management System

Full-stack student management app with a Flask REST API and React/Vite frontend.

## Structure

```text
backend/       Flask API
frontend/      React app
docs/          Migration and architecture notes
sample_data/   Future import samples
```

## Run Backend

```powershell
venv\Scripts\python.exe app.py
```

The root `app.py` launches `backend.app` for compatibility.

## Run Frontend

```powershell
cd frontend
npm run dev
```

Set `VITE_API_URL` in `frontend/.env` if the backend is not running at `http://127.0.0.1:5000`.

## Run Backend Tests

```powershell
venv\Scripts\python.exe -m pytest backend\tests
```
