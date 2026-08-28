import { useEffect, useState } from "react";

import apiClient from "../api/client";


function Dashboard({ onLogout }) {

    const [user, setUser] = useState(null);

    const [students, setStudents] = useState([]);

    const [name, setName] = useState("");
    const [cgpa, setCgpa] = useState("");

    const [editingId, setEditingId] = useState(null);

    const [searchCgpa, setSearchCgpa] = useState("");

    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const [loading, setLoading] = useState(true);


    const token =
        localStorage.getItem("access_token");


    const headers = {
        Authorization: `Bearer ${token}`
    };


    // =====================================================
    // GET CURRENT USER
    // =====================================================

    const getCurrentUser = async () => {

        try {

            const response = await apiClient.get(
                "/auth/me",
                {
                    headers: headers
                }
            );

            setUser(response.data);

        } catch (error) {

            handleUnauthorized();

        }
    };


    // =====================================================
    // GET STUDENTS
    // =====================================================

    const getStudents = async () => {

        try {

            const response = await apiClient.get(
                "/students/",
                {
                    headers: headers
                }
            );

            setStudents(response.data);

        } catch (error) {

            if (
                error.response &&
                error.response.status === 401
            ) {

                handleUnauthorized();

            } else {

                setError(
                    "Could not load students"
                );
            }
        }
    };


    // =====================================================
    // LOAD DASHBOARD
    // =====================================================

    useEffect(() => {

        const loadDashboard = async () => {

            await getCurrentUser();
            await getStudents();

            setLoading(false);
        };

        loadDashboard();

    }, []);


    // =====================================================
    // UNAUTHORIZED
    // =====================================================

    const handleUnauthorized = () => {

        localStorage.removeItem(
            "access_token"
        );

        onLogout();
    };


    // =====================================================
    // ADD STUDENT
    // =====================================================

    const addStudent = async (e) => {

        e.preventDefault();

        setMessage("");
        setError("");

        try {

            const response = await apiClient.post(
                "/students/",
                {
                    name: name,
                    cgpa: Number(cgpa)
                },
                {
                    headers: headers
                }
            );

            setMessage(
                response.data.message
            );

            setName("");
            setCgpa("");

            await getStudents();

        } catch (error) {

            handleApiError(error);
        }
    };


    // =====================================================
    // START EDIT
    // =====================================================

    const startEdit = (student) => {

        setEditingId(student.id);

        setName(student.name);
        setCgpa(student.cgpa);

        setMessage("");
        setError("");
    };


    // =====================================================
    // CANCEL EDIT
    // =====================================================

    const cancelEdit = () => {

        setEditingId(null);

        setName("");
        setCgpa("");

        setMessage("");
        setError("");
    };


    // =====================================================
    // UPDATE STUDENT
    // =====================================================

    const updateStudent = async (e) => {

        e.preventDefault();

        setMessage("");
        setError("");

        try {

            const response = await apiClient.put(
                `/students/${editingId}`,
                {
                    name: name,
                    cgpa: Number(cgpa)
                },
                {
                    headers: headers
                }
            );

            setMessage(
                response.data.message
            );

            cancelEdit();

            await getStudents();

        } catch (error) {

            handleApiError(error);
        }
    };


    // =====================================================
    // DELETE STUDENT
    // =====================================================

    const deleteStudent = async (id) => {

        const confirmDelete =
            window.confirm(
                "Are you sure you want to delete this student?"
            );

        if (!confirmDelete) {
            return;
        }

        setMessage("");
        setError("");

        try {

            const response = await apiClient.delete(
                `/students/${id}`,
                {
                    headers: headers
                }
            );

            setMessage(
                response.data.message
            );

            await getStudents();

        } catch (error) {

            handleApiError(error);
        }
    };


    // =====================================================
    // SEARCH
    // =====================================================

    const searchStudents = async () => {

        setMessage("");
        setError("");

        try {

            const params = {};

            if (searchCgpa !== "") {

                params.min_cgpa =
                    Number(searchCgpa);
            }

            const response = await apiClient.get(
                "/students/search",
                {
                    headers: headers,
                    params: params
                }
            );

            setStudents(
                response.data.students
            );

        } catch (error) {

            handleApiError(error);
        }
    };


    // =====================================================
    // RESET SEARCH
    // =====================================================

    const resetSearch = async () => {

        setSearchCgpa("");

        await getStudents();
    };


    // =====================================================
    // API ERROR
    // =====================================================

    const handleApiError = (error) => {

        if (
            error.response &&
            error.response.status === 401
        ) {

            handleUnauthorized();

            return;
        }


        if (error.response) {

            const errorData =
                error.response.data.error;

            if (typeof errorData === "object") {

                setError(
                    Object.values(errorData)
                        .flat()
                        .join(", ")
                );

            } else {

                setError(
                    errorData ||
                    "Something went wrong"
                );
            }

        } else {

            setError(
                "Cannot connect to backend"
            );
        }
    };


    // =====================================================
    // LOGOUT
    // =====================================================

    const logout = () => {

        localStorage.removeItem(
            "access_token"
        );

        onLogout();
    };


    // =====================================================
    // LOADING
    // =====================================================

    if (loading) {

        return (
            <div className="dashboard-loading">
                Loading dashboard...
            </div>
        );
    }


    // =====================================================
    // UI
    // =====================================================

    return (

        <div className="dashboard">

            <header className="navbar">

                <h2>
                    Student Management System
                </h2>

                <div>

                    {user && (
                        <span className="user-info">
                            {user.username}
                            {" "}
                            ({user.role})
                        </span>
                    )}

                    <button
                        className="logout-button"
                        onClick={logout}
                    >
                        Logout
                    </button>

                </div>

            </header>


            <main className="dashboard-content">

                <h1>
                    Dashboard
                </h1>


                {/* =========================================
                    MESSAGES
                ========================================= */}

                {message && (
                    <p className="success">
                        {message}
                    </p>
                )}

                {error && (
                    <p className="error">
                        {error}
                    </p>
                )}


                {/* =========================================
                    STUDENT FORM
                ========================================= */}

                <div className="student-form-card">

                    <h2>
                        {editingId
                            ? "Update Student"
                            : "Add Student"}
                    </h2>

                    <form
                        onSubmit={
                            editingId
                                ? updateStudent
                                : addStudent
                        }
                    >

                        <input
                            type="text"
                            placeholder="Student name"
                            value={name}
                            onChange={(e) =>
                                setName(
                                    e.target.value
                                )
                            }
                        />

                        <input
                            type="number"
                            placeholder="CGPA"
                            step="0.01"
                            min="0"
                            max="10"
                            value={cgpa}
                            onChange={(e) =>
                                setCgpa(
                                    e.target.value
                                )
                            }
                        />

                        <button type="submit">

                            {editingId
                                ? "Update Student"
                                : "Add Student"}

                        </button>


                        {editingId && (

                            <button
                                type="button"
                                className="cancel-button"
                                onClick={cancelEdit}
                            >
                                Cancel
                            </button>

                        )}

                    </form>

                </div>


                {/* =========================================
                    SEARCH
                ========================================= */}

                <div className="search-card">

                    <h2>
                        Search Students
                    </h2>

                    <div className="search-row">

                        <input
                            type="number"
                            placeholder="Minimum CGPA"
                            step="0.01"
                            min="0"
                            max="10"
                            value={searchCgpa}
                            onChange={(e) =>
                                setSearchCgpa(
                                    e.target.value
                                )
                            }
                        />

                        <button
                            onClick={searchStudents}
                        >
                            Search
                        </button>

                        <button
                            className="cancel-button"
                            onClick={resetSearch}
                        >
                            Reset
                        </button>

                    </div>

                </div>


                {/* =========================================
                    STUDENT TABLE
                ========================================= */}

                <div className="student-table-card">

                    <h2>
                        Students
                    </h2>

                    {students.length === 0 ? (

                        <p>
                            No students found.
                        </p>

                    ) : (

                        <table>

                            <thead>

                                <tr>

                                    <th>ID</th>
                                    <th>Name</th>
                                    <th>CGPA</th>
                                    <th>Actions</th>

                                </tr>

                            </thead>

                            <tbody>

                                {students.map(
                                    (student) => (

                                        <tr
                                            key={
                                                student.id
                                            }
                                        >

                                            <td>
                                                {
                                                    student.id
                                                }
                                            </td>

                                            <td>
                                                {
                                                    student.name
                                                }
                                            </td>

                                            <td>
                                                {
                                                    student.cgpa
                                                }
                                            </td>

                                            <td>

                                                <button
                                                    onClick={() =>
                                                        startEdit(
                                                            student
                                                        )
                                                    }
                                                >
                                                    Edit
                                                </button>

                                                <button
                                                    className="delete-button"
                                                    onClick={() =>
                                                        deleteStudent(
                                                            student.id
                                                        )
                                                    }
                                                >
                                                    Delete
                                                </button>

                                            </td>

                                        </tr>

                                    )
                                )}

                            </tbody>

                        </table>

                    )}

                </div>

            </main>

        </div>
    );
}

export default Dashboard;
