import React from "react";
import { GraduationCap, Shield, User, LogOut, FileCode, LayoutDashboard, Settings } from "lucide-react";
import { API_URL } from "../api/client";

export default function Navbar({ user, activeView, onViewChange, onLogout }) {
  const isAdmin = user?.role === "admin";

  return (
    <header className="navbar-container">
      <div className="navbar-inner">
        <div className="navbar-brand">
          <div className="navbar-logo">
            <GraduationCap size={24} />
          </div>
          <div className="navbar-titles">
            <span className="navbar-title-main">Student Portal</span>
            <span className="navbar-title-sub">Management System</span>
          </div>
        </div>

        {user && (
          <div className="navbar-nav-links">
            <button
              className={`nav-tab-btn ${activeView === "dashboard" ? "nav-tab-btn-active" : ""}`}
              onClick={() => onViewChange("dashboard")}
            >
              <LayoutDashboard size={16} />
              <span>Students</span>
            </button>

            {isAdmin && (
              <button
                className={`nav-tab-btn ${activeView === "admin" ? "nav-tab-btn-active" : ""}`}
                onClick={() => onViewChange("admin")}
              >
                <Shield size={16} />
                <span>Admin Console</span>
              </button>
            )}
          </div>
        )}

        <div className="navbar-actions">
          <a
            href={`${API_URL}/apidocs/`}
            target="_blank"
            rel="noopener noreferrer"
            className="api-docs-link"
            title="Swagger API Documentation"
          >
            <FileCode size={16} />
            <span className="hide-mobile">API Docs</span>
          </a>

          {user && (
            <div className="user-profile-badge">
              <div className="user-avatar">
                <User size={16} />
              </div>
              <div className="user-meta hide-mobile">
                <span className="user-name">{user.username}</span>
                <span className={`role-pill role-pill-${user.role}`}>
                  {user.role}
                </span>
              </div>
            </div>
          )}

          <button className="logout-btn" onClick={onLogout} title="Sign Out">
            <LogOut size={16} />
            <span className="hide-mobile">Sign Out</span>
          </button>
        </div>
      </div>
    </header>
  );
}
