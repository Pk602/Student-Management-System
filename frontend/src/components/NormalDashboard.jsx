import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  Award,
  Filter,
  Layers,
  Sparkles,
  LayoutGrid,
  List,
} from "lucide-react";
import apiClient from "../api/client";
import Pagination from "./Pagination";
import StudentModal from "./StudentModal";
import { COURSE_OPTIONS, YEAR_OPTIONS, ADMISSION_YEAR_OPTIONS, GRAD_YEAR_OPTIONS, GENDER_OPTIONS } from "../constants/academic";
import ConfirmModal from "./ConfirmModal";
import LmsSyncModal from "./LmsSyncModal";


export default function NormalDashboard({ _user, onShowToast }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [minCgpa, setMinCgpa] = useState("");
  const [maxCgpa, setMaxCgpa] = useState("");
  const [courseFilter, setCourseFilter] = useState("");
  const [programFilter, setProgramFilter] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [admYearFilter, setAdmYearFilter] = useState("");
  const [gradYearFilter, setGradYearFilter] = useState("");
  const [genderFilter, setGenderFilter] = useState("");

  // Grouping State
  const [groupByClass, setGroupByClass] = useState(false);

  // Programs for filter
  const [programsList, setProgramsList] = useState(["B.Tech", "M.Tech", "BCA", "MCA"]);

  // Pagination State
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [lmsModalOpen, setLmsModalOpen] = useState(false);
  const [lmsSyncData, setLmsSyncData] = useState(null);
  const [lmsSyncingId, setLmsSyncingId] = useState(null);

  // Load programs list once
  useEffect(() => {
    apiClient
      .get("/programs")
      .then((res) => {
        if (Array.isArray(res.data) && res.data.length > 0) {
          setProgramsList(res.data.map((p) => p.name));
        }
      })
      .catch(() => {});
  }, []);

  // Fetch Students with search, filters and pagination
  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit,
      };

      if (searchQuery.trim()) {
        params.q = searchQuery.trim();
      }
      if (minCgpa !== "") {
        params.min_cgpa = Number(minCgpa);
      }
      if (maxCgpa !== "") {
        params.max_cgpa = Number(maxCgpa);
      }
      if (courseFilter) {
        params.course = courseFilter;
      }
      if (programFilter) {
        params.program = programFilter;
      }
      if (classFilter.trim()) {
        params.class_name = classFilter.trim();
      }
      if (yearFilter) {
        params.year_of_study = Number(yearFilter);
      }
      if (admYearFilter) {
        params.admission_year = Number(admYearFilter);
      }
      if (gradYearFilter) {
        params.graduation_year = Number(gradYearFilter);
      }
      if (genderFilter) {
        params.gender = genderFilter;
      }

      const response = await apiClient.get("/students/search", { params });
      setStudents(response.data.students || []);
      setTotalItems(response.data.total || 0);
      setTotalPages(response.data.pages || 1);
    } catch (err) {
      onShowToast({
        type: "error",
        message: err.response?.data?.error || "Failed to load students.",
      });
    } finally {
      setLoading(false);
    }
  }, [
    page,
    limit,
    searchQuery,
    minCgpa,
    maxCgpa,
    courseFilter,
    programFilter,
    classFilter,
    yearFilter,
    admYearFilter,
    gradYearFilter,
    genderFilter,
    onShowToast,
  ]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchStudents();
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setMinCgpa("");
    setMaxCgpa("");
    setCourseFilter("");
    setProgramFilter("");
    setClassFilter("");
    setYearFilter("");
    setAdmYearFilter("");
    setGradYearFilter("");
    setGenderFilter("");
    setPage(1);
  };

  const hasActiveFilters = Boolean(
    searchQuery ||
    minCgpa !== "" ||
    maxCgpa !== "" ||
    courseFilter ||
    programFilter ||
    classFilter ||
    yearFilter ||
    admYearFilter ||
    gradYearFilter ||
    genderFilter
  );

  // Student Create / Edit
  const handleOpenAddModal = () => {
    setEditingStudent(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (student) => {
    setEditingStudent(student);
    setIsModalOpen(true);
  };

  const handleStudentFormSubmit = async (payload) => {
    setModalLoading(true);
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
      setIsModalOpen(false);
      fetchStudents();
    } catch (err) {
      onShowToast({
        type: "error",
        message: err.response?.data?.error || "Failed to save student.",
      });
    } finally {
      setModalLoading(false);
    }
  };

  // Delete Confirmation
  const handleOpenDeleteModal = (student) => {
    setStudentToDelete(student);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!studentToDelete) return;
    setDeleteLoading(true);
    try {
      await apiClient.delete(`/students/${studentToDelete.id}`);
      onShowToast({
        type: "success",
        message: `Student '${studentToDelete.name}' archived successfully.`,
      });
      setDeleteModalOpen(false);
      setStudentToDelete(null);
      fetchStudents();
    } catch (err) {
      onShowToast({
        type: "error",
        message: err.response?.data?.error || "Failed to archive student.",
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  // LMS Sync Action
  const handleSyncToLms = async (student) => {
    setLmsSyncingId(student.id);
    try {
      const response = await apiClient.post(`/api/lms/sync-student/${student.id}`);
      setLmsSyncData(response.data.data);
      setLmsModalOpen(true);
      onShowToast({
        type: "success",
        message: response.data.message,
      });
    } catch (err) {
      onShowToast({
        type: "error",
        message: err.response?.data?.error || "Failed to sync with LMS.",
      });
    } finally {
      setLmsSyncingId(null);
    }
  };

  const getCgpaBadgeClass = (cgpa) => {
    if (cgpa >= 9.0) return "cgpa-badge-stellar";
    if (cgpa >= 7.5) return "cgpa-badge-high";
    if (cgpa >= 5.0) return "cgpa-badge-medium";
    return "cgpa-badge-low";
  };

  // Grouped students calculation
  const groupedStudents = useMemo(() => {
    const map = {};
    students.forEach((s) => {
      const groupKey = s.class_name ? `Class ${s.class_name}` : "Unassigned Class";
      if (!map[groupKey]) {
        map[groupKey] = [];
      }
      map[groupKey].push(s);
    });
    return map;
  }, [students]);

  return (
    <div className="dashboard-container">
      {/* Top Header */}
      <div className="dashboard-header-row">
        <div>
          <h1 className="dashboard-title">Student Portfolio</h1>
          <p className="dashboard-subtitle">
            Manage student academic profiles, courses, degree programs, classes, and performance.
          </p>
        </div>
        <div className="dashboard-header-actions">
          <button
            type="button"
            className={`btn ${groupByClass ? "btn-secondary" : "btn-outline"}`}
            onClick={() => setGroupByClass(!groupByClass)}
            title="Toggle Group by Class View"
          >
            {groupByClass ? <LayoutGrid size={16} /> : <List size={16} />}
            <span>{groupByClass ? "Grouped by Class" : "Group by Class"}</span>
          </button>
          <button className="btn btn-primary" onClick={handleOpenAddModal}>
            <Plus size={18} />
            <span>Add Student</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="filter-card">
        <form className="filter-form-expanded" onSubmit={handleSearchSubmit}>
          {/* Row 1: Search & CGPA */}
          <div className="filter-row-top">
            <div className="search-input-wrapper">
              <Search size={18} className="search-icon" />
              <input
                type="text"
                className="filter-input search-input"
                placeholder="Search by student name or keyword..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="cgpa-filters-group">
              <div className="cgpa-input-item">
                <span className="cgpa-label">Min CGPA</span>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  className="filter-input filter-input-sm"
                  placeholder="0.0"
                  value={minCgpa}
                  onChange={(e) => setMinCgpa(e.target.value)}
                />
              </div>

              <div className="cgpa-input-item">
                <span className="cgpa-label">Max CGPA</span>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  className="filter-input filter-input-sm"
                  placeholder="10.0"
                  value={maxCgpa}
                  onChange={(e) => setMaxCgpa(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Row 2: Academic Filters (Course, Program, Class, Year, Grad Year) */}
          <div className="filter-row-academic">
            <div className="filter-field-item">
              <span className="field-filter-label">Course:</span>
              <select
                className="filter-input form-select filter-select-sm"
                value={courseFilter}
                onChange={(e) => {
                  setCourseFilter(e.target.value);
                  setPage(1);
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
                  setPage(1);
                }}
              >
                <option value="">All Programs</option>
                {programsList.map((p) => (
                  <option key={p} value={p}>
                    {p}
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
                  setPage(1);
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
                  setPage(1);
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
                  setPage(1);
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
                  setPage(1);
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
                  setPage(1);
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

            <div className="filter-actions-end">
              <button type="submit" className="btn btn-secondary btn-sm">
                <Filter size={14} />
                <span>Filter</span>
              </button>

              {hasActiveFilters && (
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={handleResetFilters}
                  title="Reset all search and filters"
                >
                  <RefreshCw size={14} />
                  <span>Reset</span>
                </button>
              )}
            </div>
          </div>
        </form>
      </div>

      {/* Main Student Directory Content */}
      <div className="table-card">
        {loading ? (
          <div className="table-loading-state">
            <div className="spinner"></div>
            <p>Loading student records...</p>
          </div>
        ) : students.length === 0 ? (
          <div className="table-empty-state">
            <div className="empty-icon-circle">
              <Layers size={36} />
            </div>
            <h3 className="empty-title">No Students Found</h3>
            <p className="empty-desc">
              {hasActiveFilters
                ? "No students match your search criteria. Try adjusting your filters."
                : "Your student directory is currently empty. Click 'Add Student' to get started."}
            </p>
            {hasActiveFilters ? (
              <button className="btn btn-secondary" onClick={handleResetFilters}>
                Clear Filters
              </button>
            ) : (
              <button className="btn btn-primary" onClick={handleOpenAddModal}>
                <Plus size={16} /> Add Your First Student
              </button>
            )}
          </div>
        ) : groupByClass ? (
          /* ==============================================
             GROUPED BY CLASS VIEW
             ============================================== */
          <div className="grouped-class-view">
            {Object.entries(groupedStudents).map(([groupTitle, classStudents]) => {
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
                          <th className="text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {classStudents.map((student) => (
                          <tr key={student.id} className="table-row">
                            <td className="font-mono text-muted">#{student.id}</td>
                            <td className="font-semibold text-primary-dark">
                              {student.name}
                            </td>
                            <td>
                              <div className="academic-badges-wrap">
                                {student.course && (
                                  <span className="academic-badge badge-course">
                                    {student.course}
                                  </span>
                                )}
                                {student.program && (
                                  <span className="academic-badge badge-program">
                                    {student.program}
                                  </span>
                                )}
                                {!student.course && !student.program && (
                                  <span className="text-muted text-sm">-</span>
                                )}
                              </div>
                            </td>
                            <td>
                              <span className="text-sm">
                                {student.admission_year ? `${student.admission_year}` : "–"}
                                {" → "}
                                {student.graduation_year ? `${student.graduation_year}` : "–"}
                              </span>
                            </td>
                            <td>
                              {student.gender ? (
                                <span className="class-chip">{student.gender}</span>
                              ) : (
                                <span className="text-muted text-sm">-</span>
                              )}
                            </td>
                            <td>
                              <span className={`cgpa-badge ${getCgpaBadgeClass(student.cgpa)}`}>
                                <Award size={14} className="inline-icon" />
                                {Number(student.cgpa).toFixed(2)}
                              </span>
                            </td>
                            <td className="text-right">
                              <div className="action-buttons-group">
                                <button
                                  className="action-btn action-btn-lms"
                                  onClick={() => handleSyncToLms(student)}
                                  disabled={lmsSyncingId === student.id}
                                  title="Sync profile to Mock LMS"
                                >
                                  <Sparkles size={14} />
                                </button>
                                <button
                                  className="action-btn action-btn-edit"
                                  onClick={() => handleOpenEditModal(student)}
                                  title="Edit student"
                                >
                                  <Edit2 size={14} />
                                </button>
                                <button
                                  className="action-btn action-btn-delete"
                                  onClick={() => handleOpenDeleteModal(student)}
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
              page={page}
              totalPages={totalPages}
              totalItems={totalItems}
              limit={limit}
              onPageChange={(newPage) => setPage(newPage)}
              onLimitChange={(newLimit) => {
                setLimit(newLimit);
                setPage(1);
              }}
            />
          </div>
        ) : (
          /* ==============================================
             STANDARD FLAT TABLE VIEW
             ============================================== */
          <>
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Student Name</th>
                    <th>Course & Program</th>
                    <th>Class</th>
                    <th>Adm / Grad</th>
                    <th>Gender</th>
                    <th>CGPA</th>
                    <th>Performance</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => (
                    <tr key={student.id} className="table-row">
                      <td className="font-mono text-muted">#{student.id}</td>
                      <td className="font-semibold text-primary-dark">
                        {student.name}
                      </td>
                      <td>
                        <div className="academic-badges-wrap">
                          {student.course && (
                            <span className="academic-badge badge-course" title={`Course: ${student.course}`}>
                              {student.course}
                            </span>
                          )}
                          {student.program && (
                            <span className="academic-badge badge-program" title={`Program: ${student.program}`}>
                              {student.program}
                            </span>
                          )}
                          {!student.course && !student.program && (
                            <span className="text-muted text-sm">-</span>
                          )}
                        </div>
                      </td>
                      <td>
                        {student.class_name ? (
                          <span className="class-chip">{student.class_name}</span>
                        ) : (
                          <span className="text-muted text-sm">-</span>
                        )}
                      </td>
                      <td>
                        <span className="text-sm">
                          {student.admission_year ? String(student.admission_year) : "–"}
                          {" → "}
                          {student.graduation_year ? String(student.graduation_year) : "–"}
                        </span>
                      </td>
                      <td>
                        {student.gender ? (
                          <span className="class-chip">{student.gender}</span>
                        ) : (
                          <span className="text-muted text-sm">-</span>
                        )}
                      </td>
                      <td>
                        <span className={`cgpa-badge ${getCgpaBadgeClass(student.cgpa)}`}>
                          <Award size={14} className="inline-icon" />
                          {Number(student.cgpa).toFixed(2)}
                        </span>
                      </td>
                      <td>
                        <span className="performance-text">
                          {student.cgpa >= 9.0
                            ? "Excellent / Honors"
                            : student.cgpa >= 7.5
                            ? "Very Good"
                            : student.cgpa >= 6.0
                            ? "Satisfactory"
                            : "Needs Improvement"}
                        </span>
                      </td>
                      <td className="text-right">
                        <div className="action-buttons-group">
                          <button
                            className="action-btn action-btn-lms"
                            onClick={() => handleSyncToLms(student)}
                            disabled={lmsSyncingId === student.id}
                            title="Sync profile to Mock LMS"
                          >
                            <Sparkles size={14} />
                            <span>{lmsSyncingId === student.id ? "Syncing..." : "LMS Sync"}</span>
                          </button>

                          <button
                            className="action-btn action-btn-edit"
                            onClick={() => handleOpenEditModal(student)}
                            title="Edit student"
                          >
                            <Edit2 size={14} />
                          </button>

                          <button
                            className="action-btn action-btn-delete"
                            onClick={() => handleOpenDeleteModal(student)}
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

            {/* Pagination Controls */}
            <Pagination
              page={page}
              totalPages={totalPages}
              totalItems={totalItems}
              limit={limit}
              onPageChange={(newPage) => setPage(newPage)}
              onLimitChange={(newLimit) => {
                setLimit(newLimit);
                setPage(1);
              }}
            />
          </>
        )}
      </div>

      {/* Add / Edit Student Modal */}
      <StudentModal
        isOpen={isModalOpen}
        student={editingStudent}
        isLoading={modalLoading}
        onSubmit={handleStudentFormSubmit}
        onClose={() => setIsModalOpen(false)}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        title="Archive Student"
        message={`Are you sure you want to archive student '${studentToDelete?.name}'? The record will be moved to the archive and can be restored by an administrator.`}
        confirmText="Archive Student"
        confirmVariant="danger"
        isLoading={deleteLoading}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setDeleteModalOpen(false);
          setStudentToDelete(null);
        }}
      />

      {/* LMS Sync Result Modal */}
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
