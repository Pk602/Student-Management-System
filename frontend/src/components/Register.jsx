import React, { useState } from "react";
import { UserPlus, User, Lock, ArrowLeft, GraduationCap, CheckCircle2 } from "lucide-react";
import apiClient from "../api/client";

export default function Register({ switchToLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedUsername = username.trim();

    if (!trimmedUsername || !password) {
      setError("Please fill in all required fields.");
      return;
    }

    if (trimmedUsername.length < 3 || trimmedUsername.length > 50) {
      setError("Username must be between 3 and 50 characters.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setMessage("");
    setError("");
    setLoading(true);

    try {
      const response = await apiClient.post("/auth/register", {
        username: trimmedUsername,
        password: password,
      });

      setMessage(response.data.message || "Registration successful! You can now sign in.");
      setUsername("");
      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      if (err.response) {
        const errorData = err.response.data?.error;
        if (typeof errorData === "object") {
          setError(Object.values(errorData).flat().join(", "));
        } else {
          setError(errorData || "Registration failed. Please try again.");
        }
      } else {
        setError("Cannot connect to server. Please check your connection.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card-modern">
        <div className="auth-header">
          <div className="auth-logo-badge">
            <GraduationCap size={32} />
          </div>
          <h1 className="auth-title">Create Account</h1>
          <p className="auth-subtitle">Register to start managing student portfolios</p>
        </div>

        {message && (
          <div className="auth-alert auth-alert-success">
            <CheckCircle2 size={18} />
            <span>{message}</span>
          </div>
        )}

        {error && (
          <div className="auth-alert auth-alert-danger">
            <span>{error}</span>
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="register-username">
              Username (min 3 chars)
            </label>
            <div className="input-with-icon">
              <User size={18} className="input-icon" />
              <input
                id="register-username"
                type="text"
                className="form-input"
                placeholder="Choose a unique username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                autoFocus
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="register-password">
              Password (min 6 chars)
            </label>
            <div className="input-with-icon">
              <Lock size={18} className="input-icon" />
              <input
                id="register-password"
                type="password"
                className="form-input"
                placeholder="Create a strong password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="register-confirm-password">
              Confirm Password
            </label>
            <div className="input-with-icon">
              <Lock size={18} className="input-icon" />
              <input
                id="register-confirm-password"
                type="password"
                className="form-input"
                placeholder="Repeat your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block btn-lg"
            disabled={loading}
          >
            {loading ? (
              <span>Creating account...</span>
            ) : (
              <>
                <span>Register Account</span>
                <UserPlus size={18} />
              </>
            )}
          </button>
        </form>

        <div className="auth-footer">
          <p className="auth-switch-text">
            Already have an account?{" "}
            <button
              type="button"
              className="link-btn font-semibold"
              onClick={switchToLogin}
            >
              <ArrowLeft size={14} className="inline-arrow-left" /> Back to Sign In
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
