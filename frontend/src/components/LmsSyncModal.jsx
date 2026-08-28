import React from "react";
import { CheckCircle2, BookOpen, Clock, ShieldCheck, X } from "lucide-react";

export default function LmsSyncModal({ isOpen, syncData, onClose }) {
  if (!isOpen || !syncData) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card modal-card-md" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-wrapper">
            <div className="modal-icon-badge badge-success">
              <CheckCircle2 size={20} />
            </div>
            <h3 className="modal-title">Mock LMS Sync Complete</h3>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <div className="lms-sync-card">
            <div className="lms-meta-row">
              <span className="lms-meta-label">LMS Provider:</span>
              <span className="lms-meta-value font-semibold">{syncData.lms_provider}</span>
            </div>
            <div className="lms-meta-row">
              <span className="lms-meta-label">Student Name:</span>
              <span className="lms-meta-value font-semibold">{syncData.student_name}</span>
            </div>
            <div className="lms-meta-row">
              <span className="lms-meta-label">CGPA:</span>
              <span className="lms-meta-value">{syncData.cgpa}</span>
            </div>
            <div className="lms-meta-row">
              <span className="lms-meta-label">Enrollment ID:</span>
              <span className="lms-enrollment-badge">{syncData.lms_enrollment_id}</span>
            </div>
            <div className="lms-meta-row">
              <span className="lms-meta-label">Timestamp:</span>
              <span className="lms-meta-value text-muted">{new Date(syncData.sync_timestamp).toLocaleString()}</span>
            </div>
          </div>

          <div className="lms-courses-section">
            <h4 className="section-subtitle">
              <BookOpen size={16} className="inline-icon" /> Assigned LMS Courses
            </h4>
            <div className="lms-courses-chips">
              {syncData.assigned_courses?.map((courseCode) => (
                <span key={courseCode} className="course-chip">
                  <ShieldCheck size={14} /> {courseCode}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-primary" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
