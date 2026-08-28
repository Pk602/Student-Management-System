from flask import Blueprint, jsonify, render_template_string


docs_bp = Blueprint("docs", __name__, url_prefix="/apidocs")


SWAGGER_UI_TEMPLATE = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Student API - Swagger Documentation</title>
  <link rel="stylesheet" type="text/css" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css" />
  <style>
    html { box-sizing: border-box; overflow: -moz-scrollbars-vertical; overflow-y: scroll; }
    *, *:before, *:after { box-sizing: inherit; }
    body { margin:0; background: #fafafa; font-family: sans-serif; }
    .topbar { display: none; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = function() {
      window.ui = SwaggerUIBundle({
        url: "/apidocs/openapi.json",
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        layout: "BaseLayout"
      });
    };
  </script>
</body>
</html>
"""


OPENAPI_SPEC = {
    "openapi": "3.0.3",
    "info": {
        "title": "Student Management System API",
        "description": "Production-ready REST API for Student Management with JWT Auth, Role-Based Access Control, Soft-Delete, Search & Pagination, Bulk Excel Import, and Mock LMS Sync.",
        "version": "2.0.0"
    },
    "servers": [
        {"url": "/", "description": "Current Environment"}
    ],
    "components": {
        "securitySchemes": {
            "BearerAuth": {
                "type": "http",
                "scheme": "bearer",
                "bearerFormat": "JWT"
            }
        },
        "schemas": {
            "RegisterRequest": {
                "type": "object",
                "required": ["username", "password"],
                "properties": {
                    "username": {"type": "string", "example": "john_doe", "minLength": 3, "maxLength": 50},
                    "password": {"type": "string", "example": "securePassword123", "minLength": 6}
                }
            },
            "LoginRequest": {
                "type": "object",
                "required": ["username", "password"],
                "properties": {
                    "username": {"type": "string", "example": "john_doe"},
                    "password": {"type": "string", "example": "securePassword123"}
                }
            },
            "StudentInput": {
                "type": "object",
                "required": ["name", "cgpa"],
                "properties": {
                    "name": {"type": "string", "example": "Pratyush Kumar", "minLength": 2, "maxLength": 100},
                    "cgpa": {"type": "number", "format": "float", "example": 8.75, "minimum": 0.0, "maximum": 10.0},
                    "course": {"type": "string", "example": "AIDS", "enum": ["AIDS", "AIML", "IIOT", "AR"]},
                    "program": {"type": "string", "example": "B.Tech"},
                    "class_name": {"type": "string", "example": "B2"},
                    "year_of_study": {"type": "integer", "example": 3, "minimum": 1, "maximum": 4},
                    "admission_year": {"type": "integer", "example": 2023, "minimum": 1900, "maximum": 2100},
                    "graduation_year": {"type": "integer", "example": 2027, "minimum": 1900, "maximum": 2100},
                    "gender": {"type": "string", "example": "Male", "enum": ["Male", "Female", "Other", "Prefer not to say"]}
                }
            }
        }
    },
    "paths": {
        "/auth/register": {
            "post": {
                "summary": "Register a new user account",
                "tags": ["Authentication"],
                "requestBody": {
                    "required": True,
                    "content": {"application/json": {"schema": {"$ref": "#/components/schemas/RegisterRequest"}}}
                },
                "responses": {
                    "201": {"description": "User created successfully"},
                    "400": {"description": "Validation error"},
                    "409": {"description": "Username already exists"}
                }
            }
        },
        "/auth/login": {
            "post": {
                "summary": "Authenticate user and get JWT token",
                "tags": ["Authentication"],
                "requestBody": {
                    "required": True,
                    "content": {"application/json": {"schema": {"$ref": "#/components/schemas/LoginRequest"}}}
                },
                "responses": {
                    "200": {"description": "Login successful"},
                    "401": {"description": "Invalid credentials"},
                    "403": {"description": "Account deactivated"}
                }
            }
        },
        "/auth/me": {
            "get": {
                "summary": "Get current authenticated user profile",
                "tags": ["Authentication"],
                "security": [{"BearerAuth": []}],
                "responses": {
                    "200": {"description": "User profile returned"},
                    "401": {"description": "Unauthorized"}
                }
            }
        },
        "/students/": {
            "get": {
                "summary": "List active students for current user (or all if admin)",
                "tags": ["Students"],
                "security": [{"BearerAuth": []}],
                "parameters": [
                    {"name": "all", "in": "query", "schema": {"type": "boolean"}, "description": "Admin only: fetch all students across all users"}
                ],
                "responses": {
                    "200": {"description": "List of students"}
                }
            },
            "post": {
                "summary": "Create a new student",
                "tags": ["Students"],
                "security": [{"BearerAuth": []}],
                "requestBody": {
                    "required": True,
                    "content": {"application/json": {"schema": {"$ref": "#/components/schemas/StudentInput"}}}
                },
                "responses": {
                    "201": {"description": "Student created successfully"}
                }
            }
        },
        "/students/search": {
            "get": {
                "summary": "Search & filter students with pagination",
                "tags": ["Students"],
                "security": [{"BearerAuth": []}],
                "parameters": [
                    {"name": "q", "in": "query", "schema": {"type": "string"}, "description": "Student name keyword search"},
                    {"name": "min_cgpa", "in": "query", "schema": {"type": "number"}, "description": "Minimum CGPA filter"},
                    {"name": "max_cgpa", "in": "query", "schema": {"type": "number"}, "description": "Maximum CGPA filter"},
                    {"name": "page", "in": "query", "schema": {"type": "integer", "default": 1}},
                    {"name": "limit", "in": "query", "schema": {"type": "integer", "default": 10}}
                ],
                "responses": {
                    "200": {"description": "Paginated list of students"}
                }
            }
        },
        "/students/{id}": {
            "get": {
                "summary": "Get student details by ID",
                "tags": ["Students"],
                "security": [{"BearerAuth": []}],
                "parameters": [{"name": "id", "in": "path", "required": True, "schema": {"type": "integer"}}],
                "responses": {"200": {"description": "Student details"}, "404": {"description": "Student not found"}}
            },
            "put": {
                "summary": "Update student by ID",
                "tags": ["Students"],
                "security": [{"BearerAuth": []}],
                "parameters": [{"name": "id", "in": "path", "required": True, "schema": {"type": "integer"}}],
                "requestBody": {"required": True, "content": {"application/json": {"schema": {"$ref": "#/components/schemas/StudentInput"}}}},
                "responses": {"200": {"description": "Student updated"}, "404": {"description": "Student not found"}}
            },
            "delete": {
                "summary": "Soft delete / archive student by ID",
                "tags": ["Students"],
                "security": [{"BearerAuth": []}],
                "parameters": [{"name": "id", "in": "path", "required": True, "schema": {"type": "integer"}}],
                "responses": {"200": {"description": "Student deleted"}}
            }
        },
        "/admin/stats": {
            "get": {
                "summary": "Get system-wide statistics (Admin only)",
                "tags": ["Admin"],
                "security": [{"BearerAuth": []}],
                "responses": {"200": {"description": "Statistics overview"}, "403": {"description": "Forbidden"}}
            }
        },
        "/admin/users": {
            "get": {
                "summary": "List all users and their status (Admin only)",
                "tags": ["Admin"],
                "security": [{"BearerAuth": []}],
                "responses": {"200": {"description": "User list"}, "403": {"description": "Forbidden"}}
            }
        },
        "/admin/users/{id}/status": {
            "put": {
                "summary": "Activate or deactivate a user account (Admin only)",
                "tags": ["Admin"],
                "security": [{"BearerAuth": []}],
                "parameters": [{"name": "id", "in": "path", "required": True, "schema": {"type": "integer"}}],
                "requestBody": {"required": True, "content": {"application/json": {"schema": {"type": "object", "properties": {"is_active": {"type": "boolean"}}}}}},
                "responses": {"200": {"description": "User status updated"}, "403": {"description": "Forbidden"}}
            }
        },
        "/admin/students/archived": {
            "get": {
                "summary": "List soft-deleted / archived students (Admin only)",
                "tags": ["Admin"],
                "security": [{"BearerAuth": []}],
                "responses": {"200": {"description": "Archived student list"}, "403": {"description": "Forbidden"}}
            }
        },
        "/admin/students/{id}/restore": {
            "put": {
                "summary": "Restore an archived student (Admin only)",
                "tags": ["Admin"],
                "security": [{"BearerAuth": []}],
                "parameters": [{"name": "id", "in": "path", "required": True, "schema": {"type": "integer"}}],
                "responses": {"200": {"description": "Student restored"}, "403": {"description": "Forbidden"}}
            }
        },
        "/admin/students/import": {
            "post": {
                "summary": "Bulk import students from Excel file (.xlsx) (Admin only)",
                "tags": ["Admin"],
                "security": [{"BearerAuth": []}],
                "requestBody": {
                    "required": True,
                    "content": {
                        "multipart/form-data": {
                            "schema": {
                                "type": "object",
                                "properties": {
                                    "file": {"type": "string", "format": "binary"},
                                    "user_id": {"type": "integer", "description": "Target student owner ID"}
                                }
                            }
                        }
                    }
                },
                "responses": {"200": {"description": "Import result report with row errors"}, "403": {"description": "Forbidden"}}
            }
        },
        "/admin/audit-logs": {
            "get": {
                "summary": "Get system audit logs (Admin only)",
                "tags": ["Admin"],
                "security": [{"BearerAuth": []}],
                "parameters": [
                    {"name": "action", "in": "query", "schema": {"type": "string"}},
                    {"name": "user_id", "in": "query", "schema": {"type": "integer"}},
                    {"name": "limit", "in": "query", "schema": {"type": "integer", "default": 200}}
                ],
                "responses": {"200": {"description": "Audit log list"}, "403": {"description": "Forbidden"}}
            }
        },
        "/api/lms/sync-student/{id}": {
            "post": {
                "summary": "Sync student with Mock LMS REST API",
                "tags": ["LMS Integration"],
                "security": [{"BearerAuth": []}],
                "parameters": [{"name": "id", "in": "path", "required": True, "schema": {"type": "integer"}}],
                "responses": {"200": {"description": "Sync response from Mock LMS"}}
            }
        }
    }
}


@docs_bp.route("/", methods=["GET"])
def swagger_ui():
    return render_template_string(SWAGGER_UI_TEMPLATE)


@docs_bp.route("/openapi.json", methods=["GET"])
def openapi_json():
    return jsonify(OPENAPI_SPEC)
