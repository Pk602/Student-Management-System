import React, { useState, useEffect, useCallback } from "react";
import Login from "./components/Login";
import Register from "./components/Register";
import Navbar from "./components/Navbar";
import NormalDashboard from "./components/NormalDashboard";
import AdminDashboard from "./components/AdminDashboard";
import Toast from "./components/Toast";
import apiClient from "./api/client";
import "./App.css";

export default function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("user_info");
    return saved ? JSON.parse(saved) : null;
  });

  const [authPage, setAuthPage] = useState("login"); // 'login' | 'register'
  const [activeView, setActiveView] = useState("dashboard"); // 'dashboard' | 'admin'
  const [toast, setToast] = useState(null);
  const [appLoading, setAppLoading] = useState(true);

  const showToast = useCallback(({ type, message }) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  }, []);

  // Fetch current user details on boot
  const fetchCurrentUser = useCallback(async () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      setUser(null);
      setAppLoading(false);
      return;
    }

    try {
      const response = await apiClient.get("/auth/me");
      const userData = response.data;
      setUser(userData);
      localStorage.setItem("user_info", JSON.stringify(userData));
    } catch {
      setUser(null);
      localStorage.removeItem("access_token");
      localStorage.removeItem("user_info");
    } finally {
      setAppLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser();

    // Listen to global auth interceptor events
    const handleUnauthorized = (e) => {
      setUser(null);
      setAuthPage("login");
      showToast({
        type: "error",
        message: e.detail?.message || "Session expired. Please log in again.",
      });
    };

    const handleForbidden = (e) => {
      showToast({
        type: "warning",
        message: e.detail?.message || "Access denied: insufficient permissions.",
      });
    };

    window.addEventListener("auth:unauthorized", handleUnauthorized);
    window.addEventListener("auth:forbidden", handleForbidden);

    return () => {
      window.removeEventListener("auth:unauthorized", handleUnauthorized);
      window.removeEventListener("auth:forbidden", handleForbidden);
    };
  }, [fetchCurrentUser, showToast]);

  const handleLoginSuccess = (userData) => {
    if (userData) {
      setUser(userData);
    } else {
      fetchCurrentUser();
    }
    showToast({
      type: "success",
      message: `Welcome back, ${userData?.username || "student"}!`,
    });
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user_info");
    setUser(null);
    setActiveView("dashboard");
    setAuthPage("login");
    showToast({
      type: "success",
      message: "You have been signed out successfully.",
    });
  };

  if (appLoading) {
    return (
      <div className="app-splash-screen">
        <div className="spinner"></div>
        <p>Loading application...</p>
      </div>
    );
  }

  // Not logged in -> Auth views
  if (!user) {
    return (
      <div className="app-auth-container">
        <Toast toast={toast} onClose={() => setToast(null)} />
        {authPage === "register" ? (
          <Register switchToLogin={() => setAuthPage("login")} />
        ) : (
          <Login
            onLogin={handleLoginSuccess}
            switchToRegister={() => setAuthPage("register")}
          />
        )}
      </div>
    );
  }

  // Logged in -> Protected views
  return (
    <div className="app-layout">
      <Navbar
        user={user}
        activeView={activeView}
        onViewChange={(view) => setActiveView(view)}
        onLogout={handleLogout}
      />

      <Toast toast={toast} onClose={() => setToast(null)} />

      <main className="app-main-content">
        {activeView === "admin" && user.role === "admin" ? (
          <AdminDashboard user={user} onShowToast={showToast} />
        ) : (
          <NormalDashboard user={user} onShowToast={showToast} />
        )}
      </main>
    </div>
  );
}