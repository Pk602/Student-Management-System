import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Users,
  GraduationCap,
  Archive,
  FileSpreadsheet,
  Activity,
  RotateCcw,
  Shield,
  ShieldAlert,
  UserCheck,
  UserX,
  Upload,
  RefreshCw,
  Plus,
  Edit2,
  Trash2,
  Search,
  Award,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  Layers,
  LayoutGrid,
  List,
} from "lucide-react";
import apiClient from "../api/client";
import Pagination from "./Pagination";
import StudentModal from "./StudentModal";
import { COURSE_OPTIONS, YEAR_OPTIONS, ADMISSION_YEAR_OPTIONS, GRAD_YEAR_OPTIONS, GENDER_OPTIONS } from "../constants/academic";
import ConfirmModal from "./ConfirmModal";
import LmsSyncModal from "./LmsSyncModal";


export default function AdminDashboard({ user, onShowToast }) {
  const [activeTab, setActiveTab] = useState("overview");

  // Statistics State
  const [stats, setStats] = useState(null);
  const [_statsLoading, setStatsLoading] = useState(false);

  // Users List State
  const [usersList, setUsersList] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);

  // Academic Programs State
  const [programsList, setProgramsList] = useState([]);
  const [programsLoading, setProgramsLoading] = useState(false);
  const [newProgramName, setNewProgramName] = useState("");
  const [programSubmitting, setProgramSubmitting] = useState(false);

  // All Students State
  const [allStudents, setAllStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [studentSearch, setStudentSearch] = useState("");
  const [selectedUserFilter, setSelectedUserFilter] = useState("");
  const [courseFilter, setCourseFilter] = useState("");
  const [programFilter, setProgramFilter] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [admYearFilter, setAdmYearFilter] = useState("");
  const [gradYearFilter, setGradYearFilter] = useState("");
  const [genderFilter, setGenderFilter] = useState("");
  const [groupByClass, setGroupByClass] = useState(false);

  const [studentPage, setStudentPage] = useState(1);
  const [studentLimit, setStudentLimit] = useState(10);
  const [studentTotal, setStudentTotal] = useState(0);
  const [studentPages, setStudentPages] = useState(1);

  // Archived Students State
  const [archivedStudents, setArchivedStudents] = useState([]);
  const [archivedLoading, setArchivedLoading] = useState(false);
  const [archivedSearch, setArchivedSearch] = useState("");
  const [archivedPage, setArchivedPage] = useState(1);
  const [archivedTotal, setArchivedTotal] = useState(0);
  const [archivedPages, setArchivedPages] = useState(1);

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditActionFilter, setAuditActionFilter] = useState("");

  // Excel Import State
  const [importUser, setImportUser] = useState("");
  const [excelFile, setExcelFile] = useState(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState(null);

  // Modals & Actions
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [studentModalLoading, setStudentModalLoading] = useState(false);

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    confirmText: "",
    confirmVariant: "danger",
    onConfirm: null,
  });

  const [lmsModalOpen, setLmsModalOpen] = useState(false);
  const [lmsSyncData, setLmsSyncData] = useState(null);

  // ==========================================
  // FETCH STATS
  // ==========================================
  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await apiClient.get("/admin/stats");
      setStats(res.data);
    } catch (err) {
      onShowToast({
        type: "error",
        message: err.response?.data?.error || "Failed to load admin stats",
      });
    } finally {
      setStatsLoading(false);
    }
  }, [onShowToast]);

  // ==========================================
  // FETCH USERS
  // ==========================================
  const fetchUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const res = await apiClient.get("/admin/users");
      setUsersList(res.data);
      if (res.data.length > 0 && !importUser) {
        setImportUser(String(res.data[0].id));
      }
    } catch (err) {
      onShowToast({
        type: "error",
        message: err.response?.data?.error || "Failed to load users",
      });
    } finally {
      setUsersLoading(false);
    }
  }, [importUser, onShowToast]);

  // ==========================================
  // FETCH ACADEMIC PROGRAMS
  // ==========================================
  const fetchPrograms = useCallback(async () => {
    setProgramsLoading(true);
    try {
      const res = await apiClient.get("/programs/");
      setProgramsList(res.data || []);
    } catch (err) {
      onShowToast({
        type: "error",
        message: err.response?.data?.error || "Failed to load academic programs",
      });
    } finally {
      setProgramsLoading(false);
    }
  }, [onShowToast]);

  // ==========================================
  // FETCH ALL STUDENTS
  // ==========================================
  const fetchAllStudents = useCallback(async () => {
    setStudentsLoading(true);
    try {
      const params = {
        all: true,
        page: studentPage,
        limit: studentLimit,
      };
      if (studentSearch.trim()) params.q = studentSearch.trim();
      if (selectedUserFilter) params.user_id = Number(selectedUserFilter);
      if (courseFilter) params.course = courseFilter;
      if (programFilter) params.program = programFilter;
      if (classFilter.trim()) params.class_name = classFilter.trim();
      if (yearFilter) params.year_of_study = Number(yearFilter);
      if (admYearFilter) params.admission_year = Number(admYearFilter);
      if (gradYearFilter) params.graduation_year = Number(gradYearFilter);
      if (genderFilter) params.gender = genderFilter;

      const res = await apiClient.get("/students/search", { params });
      setAllStudents(res.data.students || []);
      setStudentTotal(res.data.total || 0);
      setStudentPages(res.data.pages || 1);
    } catch (err) {
      onShowToast({
        type: "error",
        message: err.response?.data?.error || "Failed to load students",
      });
    } finally {
      setStudentsLoading(false);
    }
  }, [
    studentPage,
    studentLimit,
    studentSearch,
    selectedUserFilter,
    courseFilter,
    programFilter,
    classFilter,
    yearFilter,
    admYearFilter,
    gradYearFilter,
    genderFilter,
    onShowToast,
  ]);

  // ==========================================
  // FETCH ARCHIVED STUDENTS
  // ==========================================
  const fetchArchivedStudents = useCallback(async () => {
    setArchivedLoading(true);
    try {
      const params = {
        page: archivedPage,
        limit: 10,
      };
      if (archivedSearch.trim()) params.q = archivedSearch.trim();

      const res = await apiClient.get("/admin/students/archived", { params });
      setArchivedStudents(res.data.students || []);
      setArchivedTotal(res.data.total || 0);
      setArchivedPages(res.data.pages || 1);
    } catch (err) {
      onShowToast({
        type: "error",
        message: err.response?.data?.error || "Failed to load archived students",
      });
    } finally {
      setArchivedLoading(false);
    }
  }, [archivedPage, archivedSearch, onShowToast]);

  // ==========================================
  // FETCH AUDIT LOGS
  // ==========================================
  const fetchAuditLogs = useCallback(async () => {
    setAuditLoading(true);
    try {
      const params = { limit: 150 };
      if (auditActionFilter) params.action = auditActionFilter;

      const res = await apiClient.get("/admin/audit-logs", { params });
      setAuditLogs(res.data || []);
    } catch (err) {
      onShowToast({
        type: "error",
        message: err.response?.data?.error || "Failed to load audit logs",
      });
    } finally {
      setAuditLoading(false);
    }
  }, [auditActionFilter, onShowToast]);

  useEffect(() => {
    fetchStats();
    fetchUsers();
    fetchPrograms();
  }, [fetchStats, fetchUsers, fetchPrograms]);

  useEffect(() => {
    if (activeTab === "students") fetchAllStudents();
    else if (activeTab === "archived") fetchArchivedStudents();
    else if (activeTab === "users") fetchUsers();
    else if (activeTab === "programs") fetchPrograms();
    else if (activeTab === "audit") fetchAuditLogs();
    else if (activeTab === "overview") fetchStats();
  }, [
    activeTab,
    fetchAllStudents,
    fetchArchivedStudents,
    fetchUsers,
    fetchPrograms,
    fetchAuditLogs,
    fetchStats,
  ]);

  // ==========================================
  // ACTIONS: PROGRAM MANAGEMENT
  // ==========================================
  const handleCreateProgram = async (e) => {
    e.preventDefault();
    if (!newProgramName.trim()) {
      onShowToast({ type: "warning", message: "Program name is required" });
      return;
    }

    setProgramSubmitting(true);
    try {
      const res = await apiClient.post("/programs/", { name: newProgramName.trim() });
      onShowToast({ type: "success", message: res.data.message });
      setNewProgramName("");
      fetchPrograms();
    } catch (err) {
      onShowToast({
        type: "error",
        message: err.response?.data?.error || "Failed to create program",
      });
    } finally {
      setProgramSubmitting(false);
    }
  };

  const handleDeleteProgram = (prog) => {
    setConfirmModal({
      isOpen: true,
      title: "Delete Program",
      message: `Are you sure you want to remove degree program '${prog.name}'?`,
      confirmText: "Delete Program",
      confirmVariant: "danger",
      onConfirm: async () => {
        try {
          await apiClient.delete(`/programs/${prog.id}`);
          onShowToast({
            type: "success",
            message: `Program '${prog.name}' removed successfully.`,
          });
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
          fetchPrograms();
        } catch (err) {
          onShowToast({
            type: "error",
            message: err.response?.data?.error || "Failed to delete program",
          });
        }
      },
    });
  };

  // ==========================================
  // ACTIONS: RESTORE STUDENT
  // ==========================================
  const handleRestoreStudent = (student) => {
    setConfirmModal({
      isOpen: true,
      title: "Restore Archived Student",
      message: `Restore student '${student.name}' back to active status?`,
      confirmText: "Restore Student",
      confirmVariant: "success",
      onConfirm: async () => {
        try {
          await apiClient.put(`/admin/students/${student.id}/restore`);
          onShowToast({
            type: "success",
            message: `Student '${student.name}' successfully restored!`,
          });
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
          fetchArchivedStudents();
          fetchStats();
        } catch (err) {
          onShowToast({
            type: "error",
            message: err.response?.data?.error || "Failed to restore student",
          });
        }
      },
    });
  };

  // ==========================================
  // ACTIONS: USER STATUS & ROLE
  // ==========================================
  const handleToggleUserStatus = (u) => {
    const nextStatus = !u.is_active;
    const actionName = nextStatus ? "Reactivate" : "Deactivate";

    setConfirmModal({
      isOpen: true,
      title: `${actionName} User Account`,
      message: `Are you sure you want to ${actionName.toLowerCase()} account '${u.username}'?`,
      confirmText: `${actionName} User`,
      confirmVariant: nextStatus ? "success" : "danger",
      onConfirm: async () => {
        try {
          await apiClient.put(`/admin/users/${u.id}/status`, { is_active: nextStatus });
          onShowToast({
            type: "success",
            message: `User '${u.username}' ${nextStatus ? "activated" : "deactivated"} successfully.`,
          });
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
          fetchUsers();
          fetchStats();
        } catch (err) {
          onShowToast({
            type: "error",
            message: err.response?.data?.error || `Failed to ${actionName.toLowerCase()} user`,
          });
        }
      },
    });
  };

  const handlePromoteToAdmin = (u) => {
    setConfirmModal({
      isOpen: true,
      title: "Promote User to Admin",
      message: `Grant full administrator privileges to user '${u.username}'?`,
      confirmText: "Promote to Admin",
      confirmVariant: "success",
      onConfirm: async () => {
        try {
          await apiClient.put(`/admin/make-admin/${u.username}`);
          onShowToast({
            type: "success",
            message: `User '${u.username}' is now an administrator!`,
          });
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
          fetchUsers();
        } catch (err) {
          onShowToast({
            type: "error",
            message: err.response?.data?.error || "Failed to promote user",
          });
        }
      },
    });
  };

  // ==========================================
  // ACTIONS: EXCEL BULK IMPORT
  // ==========================================
  const handleExcelImportSubmit = async (e) => {
    e.preventDefault();
    if (!excelFile) {
      onShowToast({ type: "warning", message: "Please select an Excel file (.xlsx)" });
      return;
    }
    if (!importUser) {
      onShowToast({ type: "warning", message: "Please select a target student owner user" });
      return;
    }

    setImportLoading(true);
    setImportResult(null);

    const formData = new FormData();
    formData.append("file", excelFile);
    formData.append("user_id", importUser);

    try {
      const res = await apiClient.post("/admin/students/import", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setImportResult(res.data.result);
      onShowToast({
        type: "success",
        message: res.data.message,
      });
      fetchStats();
    } catch (err) {
      onShowToast({
        type: "error",
        message: err.response?.data?.error || "Excel import failed",
      });
    } finally {
      setImportLoading(false);
    }
  };

  // ==========================================
  // ACTIONS: ADMIN STUDENT CRUD
  // ==========================================
  const handleAdminStudentSubmit = async (payload) => {
    setStudentModalLoading(true);
    try {
      if (editingStudent) {
        await apiClient.put(`/students/${editingStudent.id}`, payload);
        onShowToast({
          type: "success",
          message: `Student '${payload.name}' updated successfully.`,
        });
      } else {
        await apiClient.post("/students/", payload);
        onShowToast({
          type: "success",
          message: `Student '${payload.name}' created successfully.`,
        });
      }
      setIsStudentModalOpen(false);
      fetchAllStudents();
      fetchStats();
    } catch (err) {
      onShowToast({
        type: "error",
        message: err.response?.data?.error || "Failed to save student",
      });
    } finally {
      setStudentModalLoading(false);
    }
  };

  const handleAdminDeleteStudent = (student) => {
    setConfirmModal({
      isOpen: true,
      title: "Archive Student",
      message: `Are you sure you want to archive student '${student.name}'?`,
      confirmText: "Archive Student",
      confirmVariant: "danger",
      onConfirm: async () => {
        try {
          await apiClient.delete(`/students/${student.id}`);
          onShowToast({
            type: "success",
            message: `Student '${student.name}' archived.`,
          });
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
          fetchAllStudents();
          fetchStats();
        } catch (err) {
          onShowToast({
            type: "error",
            message: err.response?.data?.error || "Archive failed",
          });
        }
      },
    });
  };

  const handleLmsSync = async (student) => {
    try {
      const res = await apiClient.post(`/api/lms/sync-student/${student.id}`);
      setLmsSyncData(res.data.data);
      setLmsModalOpen(true);
      onShowToast({ type: "success", message: res.data.message });
    } catch (err) {
      onShowToast({
        type: "error",
        message: err.response?.data?.error || "LMS Sync failed",
      });
    }
  };

  const handleResetAdminFilters = () => {
    setStudentSearch("");
    setSelectedUserFilter("");
    setCourseFilter("");
    setProgramFilter("");
    setClassFilter("");
    setYearFilter("");
    setAdmYearFilter("");
    setGradYearFilter("");
    setGenderFilter("");
    setStudentPage(1);
  };

  const hasActiveAdminFilters = Boolean(
    studentSearch ||
    selectedUserFilter ||
    courseFilter ||
    programFilter ||
    classFilter ||
    yearFilter ||
    admYearFilter ||
    gradYearFilter ||
    genderFilter
  );

  // Grouped students calculation for Admin
  const adminGroupedStudents = useMemo(() => {
    const map = {};
    allStudents.forEach((s) => {
      const groupKey = s.class_name ? `Class ${s.class_name}` : "Unassigned Class";
      if (!map[groupKey]) {
        map[groupKey] = [];
      }
      map[groupKey].push(s);
    });
    return map;
  }, [allStudents]);

  return (
    <div className="dashboard-container">
      {/* Admin Header */}
      <div className="dashboard-header-row">
        <div>
          <div className="admin-badge-row">
            <span className="admin-status-chip">
              <Shield size={14} /> Administrator Control Center
            </span>
          </div>
          <h1 className="dashboard-title">System Administration</h1>
          <p className="dashboard-subtitle">
            Manage users, degree programs, student directories, soft-delete archives, bulk imports, and audit trails.
          </p>
        </div>
      </div>

      {/* Admin Tabs */}
      <div className="admin-tabs-nav">
        <button
          className={`admin-tab-btn ${activeTab === "overview" ? "active" : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          <Activity size={16} /> Overview & Stats
        </button>
        <button
          className={`admin-tab-btn ${activeTab === "students" ? "active" : ""}`}
          onClick={() => setActiveTab("students")}
        >
          <GraduationCap size={16} /> All Students
        </button>
        <button
          className={`admin-tab-btn ${activeTab === "programs" ? "active" : ""}`}
          onClick={() => setActiveTab("programs")}
        >
          <BookOpen size={16} /> Academic Programs
        </button>
        <button
          className={`admin-tab-btn ${activeTab === "archived" ? "active" : ""}`}
          onClick={() => setActiveTab("archived")}
        >
          <Archive size={16} /> Archived Students
        </button>
        <button
          className={`admin-tab-btn ${activeTab === "users" ? "active" : ""}`}
          onClick={() => setActiveTab("users")}
        >
          <Users size={16} /> User Accounts
        </button>
        <button
          className={`admin-tab-btn ${activeTab === "import" ? "active" : ""}`}
          onClick={() => setActiveTab("import")}
        >
          <FileSpreadsheet size={16} /> Excel Bulk Import
        </button>
        <button
          className={`admin-tab-btn ${activeTab === "audit" ? "active" : ""}`}
          onClick={() => setActiveTab("audit")}
        >
          <ShieldAlert size={16} /> Audit Trail
        </button>
      </div>

      {/* ========================================================
          TAB 1: OVERVIEW & STATS
      ======================================================== */}
      {activeTab === "overview" && (
        <div className="tab-pane">
          <div className="kpi-grid">
            <div className="kpi-card">
              <div className="kpi-icon-wrapper kpi-icon-primary">
                <GraduationCap size={24} />
              </div>
              <div className="kpi-content">
                <span className="kpi-label">Active Students</span>
                <span className="kpi-value">{stats?.total_students ?? "-"}</span>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-icon-wrapper kpi-icon-warning">
                <Archive size={24} />
              </div>
              <div className="kpi-content">
                <span className="kpi-label">Archived Students</span>
                <span className="kpi-value">{stats?.total_archived ?? "-"}</span>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-icon-wrapper kpi-icon-info">
                <Users size={24} />
              </div>
              <div className="kpi-content">
                <span className="kpi-label">Total Users</span>
                <span className="kpi-value">{stats?.total_users ?? "-"}</span>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-icon-wrapper kpi-icon-success">
                <Award size={24} />
              </div>
              <div className="kpi-content">
                <span className="kpi-label">Average CGPA</span>
                <span className="kpi-value">{stats?.average_cgpa ?? "-"}</span>
              </div>
            </div>
          </div>

          <div className="quick-actions-card">
            <h3 className="section-title">Quick Administration Actions</h3>
            <div className="quick-actions-grid">
              <button
                className="quick-action-btn"
                onClick={() => {
                  setEditingStudent(null);
                  setIsStudentModalOpen(true);
                }}
              >
                <Plus size={20} />
                <span>Add Student Anywhere</span>
              </button>

              <button
                className="quick-action-btn"
                onClick={() => setActiveTab("programs")}
              >
                <BookOpen size={20} />
                <span>Manage Academic Programs</span>
              </button>

              <button
                className="quick-action-btn"
                onClick={() => setActiveTab("import")}
              >
                <Upload size={20} />
                <span>Upload Excel Student List</span>
              </button>

              <button
                className="quick-action-btn"
                onClick={() => setActiveTab("archived")}
              >
                <RotateCcw size={20} />
                <span>Restore Archived Records</span>
              </button>

              <button
                className="quick-action-btn"
                onClick={() => setActiveTab("users")}
              >
                <UserCheck size={20} />
                <span>Review User Statuses</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 2: ALL STUDENTS DIRECTORY
      ======================================================== */}
      {activeTab === "students" && (
        <div className="tab-pane">
          <div className="filter-card">
            <div className="filter-form-expanded">
              {/* Row 1: Search, Owner, Add Button, Group Toggle */}
              <div className="filter-row-top">
                <div className="search-input-wrapper">
                  <Search size={18} className="search-icon" />
                  <input
                    type="text"
                    className="filter-input search-input"
                    placeholder="Search students across all users..."
                    value={studentSearch}
                    onChange={(e) => {
                      setStudentSearch(e.target.value);
                      setStudentPage(1);
                    }}
                  />
                </div>

                <div className="cgpa-input-item">
                  <span className="cgpa-label">Owner:</span>
                  <select
                    className="filter-input form-select filter-select-sm"
                    value={selectedUserFilter}
                    onChange={(e) => {
                      setSelectedUserFilter(e.target.value);
                      setStudentPage(1);
                    }}
                  >
                    <option value="">All Users</option>
                    {usersList.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.username} (ID: {u.id})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="filter-actions-end">
                  <button
                    type="button"
                    className={`btn btn-sm ${groupByClass ? "btn-secondary" : "btn-outline"}`}
                    onClick={() => setGroupByClass(!groupByClass)}
                    title="Toggle Group by Class View"
                  >
                    {groupByClass ? <LayoutGrid size={14} /> : <List size={14} />}
                    <span>{groupByClass ? "Grouped" : "Group by Class"}</span>
                  </button>

                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => {
                      setEditingStudent(null);
                      setIsStudentModalOpen(true);
                    }}
                  >
                    <Plus size={14} /> Add Student
                  </button>
                </div>
              </div>

              {/* Row 2: Academic Filters */}
              <div className="filter-row-academic">
                <div className="filter-field-item">
                  <span className="field-filter-label">Course:</span>
                  <select
                    className="filter-input form-select filter-select-sm"
                    value={courseFilter}
                    onChange={(e) => {
                      setCourseFilter(e.target.value);
                      setStudentPage(1);
                    }}
                  >
                    <option value="">All Courses</option>
                    {COURSE_OPTIONS.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.value}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="filter-field-item">
                  <span className="field-filter-label">Program:</span>
                  <select
                    className="filter-input form-select filter-select-sm"
                    value={programFilter}
                    onChange={(e) => {
                      setProgramFilter(e.target.value);
                      setStudentPage(1);
                    }}
                  >
                    <option value="">All Programs</option>
                    {programsList.map((p) => (
                      <option key={p.id} value={p.name}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="filter-field-item">
                  <span className="field-filter-label">Class:</span>
                  <input
                    type="text"
                    className="filter-input filter-input-sm"
                    placeholder="e.g. B2"
                    value={classFilter}
                    onChange={(e) => {
                      setClassFilter(e.target.value);
                      setStudentPage(1);
                    }}
                  />
                </div>

                <div className="filter-field-item">
                  <span className="field-filter-label">Year:</span>
                  <select
                    className="filter-input form-select filter-select-sm"
                    value={yearFilter}
                    onChange={(e) => {
                      setYearFilter(e.target.value);
                      setStudentPage(1);
                    }}
                  >
                    <option value="">All Years</option>
                    {YEAR_OPTIONS.map((y) => (
                      <option key={y.value} value={y.value}>
                        {y.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="filter-field-item">
                  <span className="field-filter-label">Adm. Year:</span>
                  <select
                    className="filter-input form-select filter-select-sm"
                    value={admYearFilter}
                    onChange={(e) => {
                      setAdmYearFilter(e.target.value);
                      setStudentPage(1);
                    }}
                  >
                    <option value="">All</option>
                    {ADMISSION_YEAR_OPTIONS.map((ay) => (
                      <option key={ay} value={ay}>
                        {ay}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="filter-field-item">
                  <span className="field-filter-label">Grad Year:</span>
                  <select
                    className="filter-input form-select filter-select-sm"
                    value={gradYearFilter}
                    onChange={(e) => {
                      setGradYearFilter(e.target.value);
                      setStudentPage(1);
                    }}
                  >
                    <option value="">All Batches</option>
                    {GRAD_YEAR_OPTIONS.map((gy) => (
                      <option key={gy} value={gy}>
                        {gy}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="filter-field-item">
                  <span className="field-filter-label">Gender:</span>
                  <select
                    className="filter-input form-select filter-select-sm"
                    value={genderFilter}
                    onChange={(e) => {
                      setGenderFilter(e.target.value);
                      setStudentPage(1);
                    }}
                  >
                    <option value="">All</option>
                    {GENDER_OPTIONS.map((g) => (
                      <option key={g.value} value={g.value}>
                        {g.label}
                      </option>
                    ))}
                  </select>
                </div>

                {hasActiveAdminFilters && (
                  <div className="filter-field-item">
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={handleResetAdminFilters}
                      title="Reset all filters"
                    >
                      <RefreshCw size={14} />
                      <span>Reset</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="table-card">
            {studentsLoading ? (
              <div className="table-loading-state">
                <div className="spinner"></div>
                <p>Loading directory...</p>
              </div>
            ) : allStudents.length === 0 ? (
              <div className="table-empty-state">
                <p>No active students match this filter.</p>
                {hasActiveAdminFilters && (
                  <button className="btn btn-secondary btn-sm" onClick={handleResetAdminFilters}>
                    Clear Filters
                  </button>
                )}
              </div>
            ) : groupByClass ? (
              /* Grouped by Class View */
              <div className="grouped-class-view">
                {Object.entries(adminGroupedStudents).map(([groupTitle, classStudents]) => {
                  const avgCgpa = (
                    classStudents.reduce((acc, s) => acc + Number(s.cgpa), 0) /
                    classStudents.length
                  ).toFixed(2);

                  return (
                    <div key={groupTitle} className="class-group-card">
                      <div className="class-group-header">
                        <div className="class-group-title-row">
                          <div className="class-badge-icon">
                            <Layers size={16} />
                          </div>
                          <h4 className="class-group-name">{groupTitle}</h4>
                          <span className="class-student-count">
                            {classStudents.length} {classStudents.length === 1 ? "student" : "students"}
                          </span>
                        </div>
                        <div className="class-group-stats">
                          <span className="class-avg-cgpa">
                            Avg CGPA: <strong>{avgCgpa}</strong>
                          </span>
                        </div>
                      </div>

                      <div className="table-responsive">
                        <table className="data-table">
                          <thead>
                            <tr>
                              <th>ID</th>
                              <th>Student Name</th>
                              <th>Course &amp; Program</th>
                              <th>Adm / Grad</th>
                              <th>Gender</th>
                              <th>CGPA</th>
                              <th>Owner</th>
                              <th className="text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {classStudents.map((s) => (
                              <tr key={s.id} className="table-row">
                                <td className="font-mono text-muted">#{s.id}</td>
                                <td className="font-semibold">{s.name}</td>
                                <td>
                                  <div className="academic-badges-wrap">
                                    {s.course && (
                                      <span className="academic-badge badge-course">{s.course}</span>
                                    )}
                                    {s.program && (
                                      <span className="academic-badge badge-program">{s.program}</span>
                                    )}
                                    {!s.course && !s.program && <span className="text-muted text-sm">-</span>}
                                  </div>
                                </td>
                                <td>
                                  <span className="text-sm">
                                    {s.admission_year ? `${s.admission_year}` : "–"}
                                    {" → "}
                                    {s.graduation_year ? `${s.graduation_year}` : "–"}
                                  </span>
                                </td>
                                <td>
                                  {s.gender ? (
                                    <span className="class-chip">{s.gender}</span>
                                  ) : (
                                    <span className="text-muted text-sm">-</span>
                                  )}
                                </td>
                                <td>
                                  <span className="cgpa-badge cgpa-badge-high">
                                    {Number(s.cgpa).toFixed(2)}
                                  </span>
                                </td>
                                <td>
                                  <span className="user-owner-pill">
                                    {s.owner_username || `User #${s.user_id}`}
                                  </span>
                                </td>
                                <td className="text-right">
                                  <div className="action-buttons-group">
                                    <button
                                      className="action-btn action-btn-lms"
                                      onClick={() => handleLmsSync(s)}
                                      title="Sync to LMS"
                                    >
                                      <Sparkles size={14} />
                                    </button>
                                    <button
                                      className="action-btn action-btn-edit"
                                      onClick={() => {
                                        setEditingStudent(s);
                                        setIsStudentModalOpen(true);
                                      }}
                                      title="Edit student"
                                    >
                                      <Edit2 size={14} />
                                    </button>
                                    <button
                                      className="action-btn action-btn-delete"
                                      onClick={() => handleAdminDeleteStudent(s)}
                                      title="Archive student"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })}

                <Pagination
                  page={studentPage}
                  totalPages={studentPages}
                  totalItems={studentTotal}
                  limit={studentLimit}
                  onPageChange={(p) => setStudentPage(p)}
                  onLimitChange={(l) => {
                    setStudentLimit(l);
                    setStudentPage(1);
                  }}
                />
              </div>
            ) : (
              /* Flat Table View */
              <>
                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Student Name</th>
                        <th>Course &amp; Program</th>
                        <th>Class</th>
                        <th>Adm / Grad</th>
                        <th>Gender</th>
                        <th>CGPA</th>
                        <th>Owner Account</th>
                        <th>Created</th>
                        <th className="text-right">Admin Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allStudents.map((s) => (
                        <tr key={s.id} className="table-row">
                          <td className="font-mono text-muted">#{s.id}</td>
                          <td className="font-semibold">{s.name}</td>
                          <td>
                            <div className="academic-badges-wrap">
                              {s.course && (
                                <span className="academic-badge badge-course" title={`Course: ${s.course}`}>
                                  {s.course}
                                </span>
                              )}
                              {s.program && (
                                <span className="academic-badge badge-program" title={`Program: ${s.program}`}>
                                  {s.program}
                                </span>
                              )}
                              {!s.course && !s.program && (
                                <span className="text-muted text-sm">-</span>
                              )}
                            </div>
                          </td>
                          <td>
                            {s.class_name ? (
                              <span className="class-chip">{s.class_name}</span>
                            ) : (
                              <span className="text-muted text-sm">-</span>
                            )}
                          </td>
                          <td>
                            <span className="text-sm">
                              {s.admission_year ? String(s.admission_year) : "–"}
                              {" → "}
                              {s.graduation_year ? String(s.graduation_year) : "–"}
                            </span>
                          </td>
                          <td>
                            {s.gender ? (
                              <span className="class-chip">{s.gender}</span>
                            ) : (
                              <span className="text-muted text-sm">-</span>
                            )}
                          </td>
                          <td>
                            <span className="cgpa-badge cgpa-badge-high">
                              {Number(s.cgpa).toFixed(2)}
                            </span>
                          </td>
                          <td>
                            <span className="user-owner-pill">
                              {s.owner_username || `User #${s.user_id}`}
                            </span>
                          </td>
                          <td className="text-muted text-sm">
                            {s.created_at ? new Date(s.created_at).toLocaleDateString() : "-"}
                          </td>
                          <td className="text-right">
                            <div className="action-buttons-group">
                              <button
                                className="action-btn action-btn-lms"
                                onClick={() => handleLmsSync(s)}
                                title="Sync to LMS"
                              >
                                <Sparkles size={14} />
                              </button>
                              <button
                                className="action-btn action-btn-edit"
                                onClick={() => {
                                  setEditingStudent(s);
                                  setIsStudentModalOpen(true);
                                }}
                                title="Edit student"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                className="action-btn action-btn-delete"
                                onClick={() => handleAdminDeleteStudent(s)}
                                title="Archive student"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <Pagination
                  page={studentPage}
                  totalPages={studentPages}
                  totalItems={studentTotal}
                  limit={studentLimit}
                  onPageChange={(p) => setStudentPage(p)}
                  onLimitChange={(l) => {
                    setStudentLimit(l);
                    setStudentPage(1);
                  }}
                />
              </>
            )}
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 3: ACADEMIC DEGREE PROGRAMS MANAGEMENT
      ======================================================== */}
      {activeTab === "programs" && (
        <div className="tab-pane">
          <div className="program-mgmt-grid">
            {/* Create Program Card */}
            <div className="program-create-card">
              <div className="program-card-header">
                <div className="modal-icon-badge badge-primary">
                  <BookOpen size={20} />
                </div>
                <div>
                  <h3 className="section-title">Add Academic Degree Program</h3>
                  <p className="section-desc">
                    Define degree types and academic programs (e.g. B.Tech, M.Tech, BCA, MCA) for student enrollment.
                  </p>
                </div>
              </div>

              <form onSubmit={handleCreateProgram} className="program-form">
                <div className="form-group">
                  <label className="form-label" htmlFor="program-name-input">
                    Program / Degree Name <span className="text-danger">*</span>
                  </label>
                  <div className="input-with-icon">
                    <GraduationCap size={18} className="input-icon" />
                    <input
                      id="program-name-input"
                      type="text"
                      className="form-input"
                      placeholder="e.g. B.Tech, MCA, MBA"
                      value={newProgramName}
                      onChange={(e) => setNewProgramName(e.target.value)}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={programSubmitting}
                >
                  <Plus size={16} />
                  <span>{programSubmitting ? "Adding..." : "Add Program"}</span>
                </button>
              </form>
            </div>

            {/* Programs List Table */}
            <div className="table-card">
              <div className="table-header-custom">
                <h3 className="section-title">Active Degree Programs ({programsList.length})</h3>
              </div>

              {programsLoading ? (
                <div className="table-loading-state">
                  <div className="spinner"></div>
                  <p>Loading programs...</p>
                </div>
              ) : programsList.length === 0 ? (
                <div className="table-empty-state">
                  <p>No academic programs registered yet.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Program / Degree Name</th>
                        <th>Created Date</th>
                        <th className="text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {programsList.map((prog) => (
                        <tr key={prog.id} className="table-row">
                          <td className="font-mono text-muted">#{prog.id}</td>
                          <td className="font-semibold">
                            <span className="academic-badge badge-program badge-lg">
                              {prog.name}
                            </span>
                          </td>
                          <td className="text-muted text-sm">
                            {prog.created_at ? new Date(prog.created_at).toLocaleDateString() : "-"}
                          </td>
                          <td className="text-right">
                            <button
                              className="action-btn action-btn-delete"
                              onClick={() => handleDeleteProgram(prog)}
                              title="Delete program"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 4: ARCHIVED STUDENTS (SOFT DELETE & RESTORE)
      ======================================================== */}
      {activeTab === "archived" && (
        <div className="tab-pane">
          <div className="filter-card">
            <div className="filter-form">
              <div className="search-input-wrapper">
                <Search size={18} className="search-icon" />
                <input
                  type="text"
                  className="filter-input search-input"
                  placeholder="Search archived students..."
                  value={archivedSearch}
                  onChange={(e) => {
                    setArchivedSearch(e.target.value);
                    setArchivedPage(1);
                  }}
                />
              </div>

              <div className="archive-badge-pill">
                <Archive size={14} />
                <span>{archivedTotal} Archived Records</span>
              </div>
            </div>
          </div>

          <div className="table-card">
            {archivedLoading ? (
              <div className="table-loading-state">
                <div className="spinner"></div>
                <p>Loading archived records...</p>
              </div>
            ) : archivedStudents.length === 0 ? (
              <div className="table-empty-state">
                <p>Archive directory is empty.</p>
              </div>
            ) : (
              <>
                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Student Name</th>
                        <th>Course &amp; Program</th>
                        <th>Class</th>
                        <th>Adm / Grad</th>
                        <th>Gender</th>
                        <th>CGPA</th>
                        <th>Owner Account</th>
                        <th className="text-right">Restore Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {archivedStudents.map((s) => (
                        <tr key={s.id} className="table-row row-archived">
                          <td className="font-mono text-muted">#{s.id}</td>
                          <td className="font-semibold text-muted">{s.name}</td>
                          <td>
                            <div className="academic-badges-wrap">
                              {s.course && <span className="academic-badge badge-course">{s.course}</span>}
                              {s.program && <span className="academic-badge badge-program">{s.program}</span>}
                              {!s.course && !s.program && <span className="text-muted text-sm">-</span>}
                            </div>
                          </td>
                          <td>{s.class_name ? <span className="class-chip">{s.class_name}</span> : "-"}</td>
                          <td>
                            <span className="text-sm">
                              {s.admission_year ? String(s.admission_year) : "–"}
                              {" → "}
                              {s.graduation_year ? String(s.graduation_year) : "–"}
                            </span>
                          </td>
                          <td>
                            {s.gender ? (
                              <span className="class-chip">{s.gender}</span>
                            ) : (
                              <span className="text-muted text-sm">-</span>
                            )}
                          </td>
                          <td>
                            <span className="cgpa-badge cgpa-badge-low">
                              {Number(s.cgpa).toFixed(2)}
                            </span>
                          </td>
                          <td className="text-muted text-sm">
                            {s.owner_username || `User #${s.user_id}`}
                          </td>
                          <td className="text-right">
                            <button
                              className="btn btn-sm btn-success"
                              onClick={() => handleRestoreStudent(s)}
                            >
                              <RotateCcw size={14} /> Restore
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <Pagination
                  page={archivedPage}
                  totalPages={archivedPages}
                  totalItems={archivedTotal}
                  limit={10}
                  onPageChange={(p) => setArchivedPage(p)}
                />
              </>
            )}
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 5: USER ACCOUNT MANAGEMENT
      ======================================================== */}
      {activeTab === "users" && (
        <div className="tab-pane">
          <div className="table-card">
            {usersLoading ? (
              <div className="table-loading-state">
                <div className="spinner"></div>
                <p>Loading user accounts...</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>User ID</th>
                      <th>Username</th>
                      <th>Role</th>
                      <th>Account Status</th>
                      <th>Active Students</th>
                      <th className="text-right">Account Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersList.map((u) => (
                      <tr key={u.id} className="table-row">
                        <td className="font-mono text-muted">#{u.id}</td>
                        <td className="font-semibold">{u.username}</td>
                        <td>
                          <span className={`role-pill role-pill-${u.role}`}>
                            {u.role}
                          </span>
                        </td>
                        <td>
                          {u.is_active ? (
                            <span className="status-badge badge-active">
                              <UserCheck size={14} /> Active
                            </span>
                          ) : (
                            <span className="status-badge badge-inactive">
                              <UserX size={14} /> Deactivated
                            </span>
                          )}
                        </td>
                        <td>{u.student_count ?? 0} students</td>
                        <td className="text-right">
                          <div className="action-buttons-group">
                            {u.role !== "admin" && (
                              <button
                                className="btn btn-sm btn-outline"
                                onClick={() => handlePromoteToAdmin(u)}
                                title="Promote to administrator"
                              >
                                <Shield size={14} /> Make Admin
                              </button>
                            )}

                            {u.id !== user.id && (
                              <button
                                className={`btn btn-sm ${
                                  u.is_active ? "btn-danger" : "btn-success"
                                }`}
                                onClick={() => handleToggleUserStatus(u)}
                              >
                                {u.is_active ? (
                                  <>
                                    <UserX size={14} /> Deactivate
                                  </>
                                ) : (
                                  <>
                                    <UserCheck size={14} /> Reactivate
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 6: EXCEL BULK IMPORT
      ======================================================== */}
      {activeTab === "import" && (
        <div className="tab-pane">
          <div className="import-card">
            <h3 className="section-title">Bulk Student Import from Excel</h3>
            <p className="section-desc">
              Upload an Excel workbook (<code className="code-badge">.xlsx</code>) with student and academic information. Each row is validated individually with full error reporting.
            </p>

            <div className="academic-format-info-box">
              <div className="format-info-title">
                <BookOpen size={16} /> Expected Excel Header Format:
              </div>
              <div className="format-cols-list">
                <code>Name</code> • <code>CGPA</code> • <code>Course</code> • <code>Program</code> • <code>Class</code> • <code>Year of Study</code> • <code>Admission Year</code> • <code>Graduation Year</code> • <code>Gender</code>
              </div>
              <div className="format-example-text">
                Example: <em>Pratyush Kumar | 8.75 | AIDS | B.Tech | B2 | 3 | 2023 | 2027 | Male</em>
              </div>
            </div>

            <form onSubmit={handleExcelImportSubmit} className="import-form">
              <div className="form-group">
                <label className="form-label" htmlFor="import-owner">
                  Select Student Owner (Account)
                </label>
                <select
                  id="import-owner"
                  className="form-input form-select"
                  value={importUser}
                  onChange={(e) => setImportUser(e.target.value)}
                >
                  {usersList.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.username} (ID: {u.id}) - {u.role}
                    </option>
                  ))}
                </select>
              </div>

              <div className="file-drop-zone">
                <input
                  type="file"
                  id="excel-file-input"
                  accept=".xlsx"
                  className="file-input-hidden"
                  onChange={(e) => setExcelFile(e.target.files[0] || null)}
                />
                <label htmlFor="excel-file-input" className="file-drop-label">
                  <Upload size={32} className="upload-icon" />
                  <span className="drop-main-text">
                    {excelFile ? excelFile.name : "Click to select or drop an Excel spreadsheet (.xlsx)"}
                  </span>
                  <span className="drop-sub-text">
                    Supported extensions: .xlsx (Excel OpenXML format)
                  </span>
                </label>
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-lg"
                disabled={importLoading || !excelFile}
              >
                {importLoading ? "Processing Excel File..." : "Start Import"}
              </button>
            </form>

            {/* Import Results Summary */}
            {importResult && (
              <div className="import-results-container">
                <h4 className="results-title">Import Execution Results</h4>
                <div className="results-metrics">
                  <div className="metric-chip chip-total">
                    Total Rows: <strong>{importResult.total_rows}</strong>
                  </div>
                  <div className="metric-chip chip-success">
                    <CheckCircle2 size={16} /> Imported: <strong>{importResult.imported_count}</strong>
                  </div>
                  <div className="metric-chip chip-failed">
                    <AlertCircle size={16} /> Failed: <strong>{importResult.failed_count}</strong>
                  </div>
                </div>

                {importResult.failed && importResult.failed.length > 0 && (
                  <div className="failed-rows-report">
                    <h5>Validation Failures ({importResult.failed.length})</h5>
                    <div className="table-responsive">
                      <table className="data-table data-table-sm">
                        <thead>
                          <tr>
                            <th>Excel Row</th>
                            <th>Name</th>
                            <th>CGPA</th>
                            <th>Failure Reason</th>
                          </tr>
                        </thead>
                        <tbody>
                          {importResult.failed.map((f, i) => (
                            <tr key={i}>
                              <td className="font-mono">Row #{f.row}</td>
                              <td>{f.name}</td>
                              <td>{f.cgpa}</td>
                              <td className="text-danger">{f.reason}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 7: AUDIT LOGS TRAIL
      ======================================================== */}
      {activeTab === "audit" && (
        <div className="tab-pane">
          <div className="filter-card">
            <div className="filter-form">
              <div className="cgpa-input-item">
                <span className="cgpa-label">Filter Action:</span>
                <select
                  className="filter-input form-select"
                  value={auditActionFilter}
                  onChange={(e) => setAuditActionFilter(e.target.value)}
                >
                  <option value="">All Actions</option>
                  <option value="LOGIN">LOGIN</option>
                  <option value="REGISTER">REGISTER</option>
                  <option value="CREATE_STUDENT">CREATE_STUDENT</option>
                  <option value="UPDATE_STUDENT">UPDATE_STUDENT</option>
                  <option value="DELETE_STUDENT">DELETE_STUDENT</option>
                  <option value="RESTORE_STUDENT">RESTORE_STUDENT</option>
                  <option value="IMPORT_STUDENTS">IMPORT_STUDENTS</option>
                  <option value="CREATE_PROGRAM">CREATE_PROGRAM</option>
                  <option value="DELETE_PROGRAM">DELETE_PROGRAM</option>
                  <option value="ACTIVATE_USER">ACTIVATE_USER</option>
                  <option value="DEACTIVATE_USER">DEACTIVATE_USER</option>
                  <option value="PROMOTE_USER">PROMOTE_USER</option>
                </select>
              </div>

              <button className="btn btn-secondary" onClick={() => fetchAuditLogs()}>
                <RefreshCw size={16} /> Refresh Log
              </button>
            </div>
          </div>

          <div className="table-card">
            {auditLoading ? (
              <div className="table-loading-state">
                <div className="spinner"></div>
                <p>Loading audit trail...</p>
              </div>
            ) : auditLogs.length === 0 ? (
              <div className="table-empty-state">
                <p>No audit logs available.</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Timestamp</th>
                      <th>Actor</th>
                      <th>Action</th>
                      <th>Event Details</th>
                      <th>Target ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="table-row">
                        <td className="text-muted font-mono text-sm">
                          {log.created_at ? new Date(log.created_at).toLocaleString() : "-"}
                        </td>
                        <td className="font-semibold">
                          {log.username || `User #${log.user_id}`}
                        </td>
                        <td>
                          <span className={`audit-action-chip action-${log.action}`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="text-sm">{log.details || "-"}</td>
                        <td className="font-mono text-muted">
                          {log.student_id ? `#${log.student_id}` : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Admin Student Add/Edit Modal */}
      <StudentModal
        isOpen={isStudentModalOpen}
        student={editingStudent}
        users={usersList}
        isAdmin={true}
        isLoading={studentModalLoading}
        onSubmit={handleAdminStudentSubmit}
        onClose={() => setIsStudentModalOpen(false)}
      />

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        confirmVariant={confirmModal.confirmVariant}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* LMS Sync Modal */}
      <LmsSyncModal
        isOpen={lmsModalOpen}
        syncData={lmsSyncData}
        onClose={() => {
          setLmsModalOpen(false);
          setLmsSyncData(null);
        }}
      />
    </div>
  );
}
