import React, { useState } from "react";
import { LogIn, User, Lock, ArrowRight, GraduationCap } from "lucide-react";
import apiClient from "../api/client";

export default function Login({ onLogin, switchToRegister }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError("Please enter both username and password");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const response = await apiClient.post("/auth/login", {
        username: username.trim(),
        password: password,
      });

      const { access_token, user } = response.data;
      localStorage.setItem("access_token", access_token);
      if (user) {
        localStorage.setItem("user_info", JSON.stringify(user));
      }

      onLogin(user);
    } catch (err) {
      if (err.response) {
        setError(err.response.data?.error || "Invalid username or password");
      } else {
        setError("Cannot connect to server. Please check your backend connection.");
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
          <h1 className="auth-title">Welcome Back</h1>
          <p className="auth-subtitle">Sign in to manage your student directory</p>
        </div>

        {error && (
          <div className="auth-alert auth-alert-danger">
            <span>{error}</span>
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="login-username">
              Username
            </label>
            <div className="input-with-icon">
              <User size={18} className="input-icon" />
              <input
                id="login-username"
                type="text"
                className="form-input"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                autoFocus
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="login-password">
              Password
            </label>
            <div className="input-with-icon">
              <Lock size={18} className="input-icon" />
              <input
                id="login-password"
                type="password"
                className="form-input"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block btn-lg"
            disabled={loading}
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>Sign In</span>
                <LogIn size={18} />
              </>
            )}
          </button>
        </form>

        <div className="auth-footer">
          <p className="auth-switch-text">
            Don't have an account?{" "}
            <button
              type="button"
              className="link-btn font-semibold"
              onClick={switchToRegister}
            >
              Create an account <ArrowRight size={14} className="inline-arrow" />
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
