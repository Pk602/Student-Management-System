# Student Management System

A full-stack Student Management System built with **React + Vite** on the frontend and **Flask + SQLAlchemy** on the backend. The application provides secure authentication, role-based access control, student management, Excel bulk import, audit logging, search/filtering, pagination, academic information management, LMS integration, and API documentation.

## Live Application

- **Frontend:** https://student-management-system-1-2rsl.onrender.com
- **Backend API:** https://student-management-system-un2e.onrender.com
- **API Documentation:** https://student-management-system-un2e.onrender.com/apidocs/

> The backend is hosted on Render and uses Supabase PostgreSQL for production data storage.

## Features

### Authentication & Authorization
- User registration and login
- Password hashing with Flask-Bcrypt
- JWT-based authentication
- Protected API endpoints
- Role-based authorization
- Normal user and administrator roles
- User activation/deactivation
- Admin promotion

### Student Management
- Create, read, update and archive students
- Soft-delete instead of immediately removing records
- Restore archived students
- User-based student ownership
- Administrators can manage students across users
- Search by student name/keyword
- CGPA filtering
- Pagination
- Class-based grouping/filtering

### Academic Information

Student records support academic information such as:

- Course
  - AIDS — Artificial Intelligence and Data Science
  - AIML — Artificial Intelligence and Machine Learning
  - IIOT — Industrial Internet of Things
  - AR — Automation and Robotics
- Program/Degree
  - Examples: B.Tech, M.Tech, BCA, MCA
- Class/Section
- Year of Study
- Admission Year
- Graduation Year
- Gender

### Excel Bulk Import
Administrators can import multiple student records from `.xlsx` files.

Supported data includes:

```text
name
cgpa
course
program
class_name
year_of_study
admission_year
graduation_year
gender
```

The importer validates rows individually and reports:
- Successfully imported rows
- Failed rows
- Validation errors and reasons

### Administration
The administrator dashboard provides:
- System statistics
- Student management
- User management
- Student ownership assignment
- Archived student management
- Restore functionality
- Excel import
- Audit logs
- LMS-related operations

### Audit Logging
Important application activities are recorded, including actions such as:
- Registration
- Login
- Student creation
- Student update
- Student archive/delete
- Student restore
- Excel import
- User promotion
- User activation/deactivation

### LMS Integration
The project includes a mock LMS REST integration to demonstrate communication with an external system through APIs.

### API Documentation
Swagger/OpenAPI documentation is available at:

https://student-management-system-un2e.onrender.com/apidocs/

The documentation provides a structured view of API endpoints, request data, responses, and authentication requirements.

## Technology Stack

### Frontend
- React
- Vite
- Axios
- JavaScript
- CSS

### Backend
- Python
- Flask
- Flask-CORS
- Flask-SQLAlchemy
- Flask-Bcrypt
- Flask-JWT-Extended
- Marshmallow
- OpenPyXL
- Gunicorn

### Database
- PostgreSQL
- Supabase

### Testing
- Pytest

### Deployment
- Render
- Supabase

## Architecture

```text
                    User
                     |
                     v
              React Frontend
                     |
                   Axios
                     |
                 HTTP / REST
                     |
                     v
               Flask Backend
          +----------+-----------+
          |          |           |
        Auth      Students     Admin
          |          |           |
          +----------+-----------+
                     |
              Service Layer
                     |
                  SQLAlchemy
                     |
                     v
             Supabase PostgreSQL
```

External integration:

```text
Flask Backend
      |
      +---- API Documentation (Swagger/OpenAPI)
      |
      +---- Mock LMS REST API
```

## Project Structure

```text
student-management-system/
│
├── backend/
│   ├── models/
│   ├── routes/
│   ├── schemas/
│   ├── services/
│   ├── tests/
│   ├── utils/
│   ├── uploads/
│   ├── app.py
│   ├── config.py
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── constants/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── public/
│   ├── package.json
│   └── vite.config.js
│
├── docs/
│   ├── architecture.md
│   └── migration-plan.md
│
├── sample_data/
├── .gitignore
├── README.md
└── requirements / project files
```

## API Overview

### Authentication

```text
POST /auth/register
POST /auth/login
GET  /auth/me
```

### Students

```text
GET    /students/
GET    /students/<id>
POST   /students/
PUT    /students/<id>
DELETE /students/<id>
GET    /students/search
```

### Admin

The admin API provides user management, student administration, archive/restore, statistics, audit logs, and Excel import operations.

For the complete endpoint list, use the Swagger/OpenAPI documentation:

https://student-management-system-un2e.onrender.com/apidocs/

## Example Student Request

```json
{
  "name": "Amit Kumar",
  "cgpa": 8.5,
  "course": "AIDS",
  "program": "B.Tech",
  "class_name": "B2",
  "year_of_study": 3,
  "admission_year": 2024,
  "graduation_year": 2028,
  "gender": "Male"
}
```

## Local Development

### Backend

Open a terminal in the project root:

```bash
cd student-management-system
```

Create/activate the Python virtual environment:

### Windows

```cmd
venv\Scripts\activate
```

Install dependencies:

```cmd
pip install -r backend/requirements.txt
```

Run the Flask application:

```cmd
python -m backend.app
```

The backend normally runs at:

```text
http://127.0.0.1:5000
```

### Frontend

Open another terminal:

```cmd
cd frontend
npm install
npm run dev
```

The Vite development server normally runs at:

```text
http://localhost:5173
```

## Environment Variables

Do not commit real secrets to GitHub.

### Backend

Example:

```env
JWT_SECRET_KEY=your-random-secret
DATABASE_URL=your-database-url
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
MAX_CONTENT_LENGTH=16777216
```

### Frontend

Example:

```env
VITE_API_URL=http://127.0.0.1:5000
```

For production, `VITE_API_URL` should point to the deployed backend.

## Testing

Run the backend tests from the project root:

```cmd
venv\Scripts\python.exe -m pytest backend\tests
```

The project has automated tests covering authentication, student management, academic data, Excel import, admin functionality, archive/restore, search/pagination, LMS/statistics, and audit-related functionality.

## Security

The project uses:
- JWT authentication
- Bcrypt password hashing
- Role-based authorization
- Protected endpoints
- CORS configuration
- Input validation using Marshmallow
- Soft deletion
- Audit logging
- Environment variables for secrets
- Security response headers

Never commit:

```text
.env
venv/
frontend/node_modules/
frontend/dist/
instance/*.db
```

## Deployment

The current production architecture is:

```text
GitHub
   |
   +--> Render Static Site
   |       |
   |       +--> React/Vite frontend
   |
   +--> Render Web Service
           |
           +--> Flask + Gunicorn backend
                   |
                   +--> Supabase PostgreSQL
```

### Deployment services

- **GitHub** — source code repository
- **Render** — frontend and backend hosting
- **Supabase** — PostgreSQL production database

## Database

Local development can use SQLite through the application's configuration.

Production uses PostgreSQL hosted by Supabase.

The backend reads the database connection from the `DATABASE_URL` environment variable, keeping credentials outside the source code.

## Future Improvements

Potential future improvements include:
- More advanced reporting and analytics
- Additional academic subject-management features
- More extensive automated integration testing
- Improved production monitoring
- Custom domain and additional deployment hardening

## Project Goal

The project was designed as a practical full-stack application demonstrating:

- REST API development
- Secure authentication
- Role-based access control
- Relational database design
- CRUD operations
- Data validation
- File processing
- API integration
- Auditability
- Frontend/backend integration
- Automated testing
- Cloud deployment

## Author

**Pratyush Kumar**

