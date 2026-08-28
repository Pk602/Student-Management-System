import React, { useState, useEffect } from "react";
import {
  User,
  Award,
  X,
  Sparkles,
  BookOpen,
  GraduationCap,
  Building2,
  Calendar,
  Layers,
  Venus,
} from "lucide-react";
import apiClient from "../api/client";
import {
  COURSE_OPTIONS,
  YEAR_OPTIONS,
  ADMISSION_YEAR_OPTIONS,
  GRAD_YEAR_OPTIONS,
  GENDER_OPTIONS,
} from "../constants/academic";

const DEFAULT_USERS = [];
const DEFAULT_PROGRAMS = ["B.Tech", "M.Tech", "BCA", "MCA"];

export default function StudentModal({
  isOpen,
  student = null,
  users = DEFAULT_USERS,
  isAdmin = false,
  isLoading = false,
  onSubmit,
  onClose,
}) {
  const [name, setName] = useState("");
  const [cgpa, setCgpa] = useState("");
  const [course, setCourse] = useState("AIDS");
  const [program, setProgram] = useState("B.Tech");
  const [className, setClassName] = useState("");
  const [yearOfStudy, setYearOfStudy] = useState("1");
  const [admissionYear, setAdmissionYear] = useState("2023");
  const [graduationYear, setGraduationYear] = useState("2027");
  const [gender, setGender] = useState("");
  const [targetUserId, setTargetUserId] = useState("");
  const [programsList, setProgramsList] = useState(DEFAULT_PROGRAMS);
  const [errors, setErrors] = useState({});

  // Fetch dynamic programs from backend
  useEffect(() => {
    if (isOpen) {
      apiClient
        .get("/programs")
        .then((res) => {
          if (Array.isArray(res.data) && res.data.length > 0) {
            setProgramsList(res.data.map((p) => p.name));
          }
        })
        .catch(() => {
          setProgramsList(DEFAULT_PROGRAMS);
        });
    }
  }, [isOpen]);

  // Reset / populate form when modal opens
  useEffect(() => {
    if (isOpen) {
      if (student) {
        setName(student.name || "");
        setCgpa(
          student.cgpa !== undefined && student.cgpa !== null
            ? String(student.cgpa)
            : ""
        );
        setCourse(student.course || "AIDS");
        setProgram(student.program || "B.Tech");
        setClassName(student.class_name || "");
        setYearOfStudy(
          student.year_of_study ? String(student.year_of_study) : "1"
        );
        setAdmissionYear(
          student.admission_year ? String(student.admission_year) : "2023"
        );
        setGraduationYear(
          student.graduation_year ? String(student.graduation_year) : "2027"
        );
        setGender(student.gender || "");
        setTargetUserId(student.user_id ? String(student.user_id) : "");
      } else {
        setName("");
        setCgpa("");
        setCourse("AIDS");
        setProgram("B.Tech");
        setClassName("");
        setYearOfStudy("1");
        setAdmissionYear("2023");
        setGraduationYear("2027");
        setGender("");
        setTargetUserId(
          users && users.length > 0 ? String(users[0].id) : ""
        );
      }
      setErrors({});
    }
  }, [isOpen, student, users]);

  if (!isOpen) return null;

  const validate = () => {
    const errs = {};
    const trimmedName = name.trim();

    if (!trimmedName) {
      errs.name = "Student name is required";
    } else if (trimmedName.length < 2 || trimmedName.length > 100) {
      errs.name = "Name must be between 2 and 100 characters";
    }

    if (cgpa === "" || cgpa === null || isNaN(Number(cgpa))) {
      errs.cgpa = "CGPA must be a valid number";
    } else {
      const numCgpa = Number(cgpa);
      if (numCgpa < 0 || numCgpa > 10) {
        errs.cgpa = "CGPA must be between 0.00 and 10.00";
      }
    }

    if (yearOfStudy) {
      const yr = Number(yearOfStudy);
      if (isNaN(yr) || yr < 1 || yr > 4) {
        errs.year_of_study = "Year of study must be between 1 and 4";
      }
    }

    if (admissionYear) {
      const ay = Number(admissionYear);
      if (isNaN(ay) || ay < 1900 || ay > 2100) {
        errs.admission_year = "Admission year must be a valid 4-digit year";
      }
    }

    if (graduationYear) {
      const gy = Number(graduationYear);
      if (isNaN(gy) || gy < 1900 || gy > 2100) {
        errs.graduation_year = "Graduation year must be a valid 4-digit year";
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      name: name.trim(),
      cgpa: Number(parseFloat(cgpa).toFixed(2)),
      course: course || null,
      program: program || null,
      class_name: className.trim() || null,
      year_of_study: yearOfStudy ? Number(yearOfStudy) : null,
      admission_year: admissionYear ? Number(admissionYear) : null,
      graduation_year: graduationYear ? Number(graduationYear) : null,
      gender: gender || null,
    };

    if (isAdmin && !student && targetUserId) {
      payload.user_id = Number(targetUserId);
    }

    onSubmit(payload);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card modal-card-md" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-wrapper">
            <div className="modal-icon-badge badge-primary">
              <Sparkles size={20} />
            </div>
            <h3 className="modal-title">
              {student ? "Edit Student Record" : "Add New Student"}
            </h3>
          </div>
          <button
            className="modal-close-btn"
            onClick={onClose}
            disabled={isLoading}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Full Name */}
            <div className="form-group">
              <label className="form-label" htmlFor="student-name">
                Full Name <span className="text-danger">*</span>
              </label>
              <div className="input-with-icon">
                <User size={18} className="input-icon" />
                <input
                  id="student-name"
                  type="text"
                  className={`form-input ${errors.name ? "input-error" : ""}`}
                  placeholder="e.g. Pratyush Kumar"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (errors.name) setErrors((prev) => ({ ...prev, name: null }));
                  }}
                  autoFocus
                />
              </div>
              {errors.name && (
                <span className="field-error">{errors.name}</span>
              )}
            </div>

            {/* CGPA */}
            <div className="form-group">
              <label className="form-label" htmlFor="student-cgpa">
                CGPA (0.00 – 10.00) <span className="text-danger">*</span>
              </label>
              <div className="input-with-icon">
                <Award size={18} className="input-icon" />
                <input
                  id="student-cgpa"
                  type="number"
                  step="0.01"
                  min="0"
                  max="10"
                  className={`form-input ${errors.cgpa ? "input-error" : ""}`}
                  placeholder="e.g. 8.75"
                  value={cgpa}
                  onChange={(e) => {
                    setCgpa(e.target.value);
                    if (errors.cgpa) setErrors((prev) => ({ ...prev, cgpa: null }));
                  }}
                />
              </div>
              {errors.cgpa && (
                <span className="field-error">{errors.cgpa}</span>
              )}
            </div>

            {/* Course & Program */}
            <div className="form-row">
              <div className="form-group form-col-half">
                <label className="form-label" htmlFor="student-course">
                  Course
                </label>
                <div className="input-with-icon">
                  <BookOpen size={18} className="input-icon" />
                  <select
                    id="student-course"
                    className="form-input form-select"
                    value={course}
                    onChange={(e) => setCourse(e.target.value)}
                  >
                    {COURSE_OPTIONS.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group form-col-half">
                <label className="form-label" htmlFor="student-program">
                  Program / Degree
                </label>
                <div className="input-with-icon">
                  <GraduationCap size={18} className="input-icon" />
                  <select
                    id="student-program"
                    className="form-input form-select"
                    value={program}
                    onChange={(e) => setProgram(e.target.value)}
                  >
                    {programsList.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Class & Year of Study */}
            <div className="form-row">
              <div className="form-group form-col-half">
                <label className="form-label" htmlFor="student-class">
                  Class
                </label>
                <div className="input-with-icon">
                  <Layers size={18} className="input-icon" />
                  <input
                    id="student-class"
                    type="text"
                    className="form-input"
                    placeholder="e.g. B2"
                    value={className}
                    onChange={(e) => setClassName(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group form-col-half">
                <label className="form-label" htmlFor="student-year">
                  Year of Study
                </label>
                <div className="input-with-icon">
                  <Calendar size={18} className="input-icon" />
                  <select
                    id="student-year"
                    className="form-input form-select"
                    value={yearOfStudy}
                    onChange={(e) => setYearOfStudy(e.target.value)}
                  >
                    {YEAR_OPTIONS.map((y) => (
                      <option key={y.value} value={y.value}>
                        {y.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Admission Year & Graduation Year */}
            <div className="form-row">
              <div className="form-group form-col-half">
                <label className="form-label" htmlFor="student-adm-year">
                  Admission Year
                </label>
                <div className="input-with-icon">
                  <Calendar size={18} className="input-icon" />
                  <select
                    id="student-adm-year"
                    className="form-input form-select"
                    value={admissionYear}
                    onChange={(e) => setAdmissionYear(e.target.value)}
                  >
                    {ADMISSION_YEAR_OPTIONS.map((ay) => (
                      <option key={ay} value={ay}>
                        {ay}
                      </option>
                    ))}
                  </select>
                </div>
                {errors.admission_year && (
                  <span className="field-error">{errors.admission_year}</span>
                )}
              </div>

              <div className="form-group form-col-half">
                <label className="form-label" htmlFor="student-grad-year">
                  Graduation Year
                </label>
                <div className="input-with-icon">
                  <Building2 size={18} className="input-icon" />
                  <select
                    id="student-grad-year"
                    className="form-input form-select"
                    value={graduationYear}
                    onChange={(e) => setGraduationYear(e.target.value)}
                  >
                    {GRAD_YEAR_OPTIONS.map((gy) => (
                      <option key={gy} value={gy}>
                        {gy}
                      </option>
                    ))}
                  </select>
                </div>
                {errors.graduation_year && (
                  <span className="field-error">{errors.graduation_year}</span>
                )}
              </div>
            </div>

            {/* Gender */}
            <div className="form-group">
              <label className="form-label" htmlFor="student-gender">
                Gender
              </label>
              <div className="input-with-icon">
                <Venus size={18} className="input-icon" />
                <select
                  id="student-gender"
                  className="form-input form-select"
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                >
                  <option value="">— Select gender —</option>
                  {GENDER_OPTIONS.map((g) => (
                    <option key={g.value} value={g.value}>
                      {g.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Admin: assign owner */}
            {isAdmin && !student && users.length > 0 && (
              <div className="form-group">
                <label className="form-label" htmlFor="student-owner">
                  Assign Student Owner (User)
                </label>
                <select
                  id="student-owner"
                  className="form-input form-select"
                  value={targetUserId}
                  onChange={(e) => setTargetUserId(e.target.value)}
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.username} (ID: {u.id}){" "}
                      {u.role === "admin" ? "[Admin]" : ""}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading}
            >
              {isLoading
                ? "Saving..."
                : student
                ? "Update Student"
                : "Create Student"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
