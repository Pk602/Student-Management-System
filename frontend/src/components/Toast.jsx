import React from "react";
import { CheckCircle2, AlertCircle, AlertTriangle, X } from "lucide-react";

/**
 * Recursively formats arbitrary error structures (objects, arrays, strings, Error instances)
 * into human-readable plain text to prevent React child rendering errors.
 */
function formatToastMessage(msg) {
  if (!msg) return "";
  if (typeof msg === "string") return msg;
  if (typeof msg === "number" || typeof msg === "boolean") return String(msg);

  if (Array.isArray(msg)) {
    return msg
      .map((item) => formatToastMessage(item))
      .filter(Boolean)
      .join(", ");
  }

  if (msg instanceof Error) {
    return msg.message || "An unexpected error occurred.";
  }

  if (typeof msg === "object") {
    if (typeof msg.error === "string") return msg.error;
    if (typeof msg.message === "string") return msg.message;

    const entries = Object.entries(msg);
    if (entries.length === 0) return "";

    return entries
      .map(([key, val]) => {
        const valStr = formatToastMessage(val);
        if (isNaN(Number(key))) {
          return `${key}: ${valStr}`;
        }
        return valStr;
      })
      .filter(Boolean)
      .join(" | ");
  }

  return String(msg);
}

export default function Toast({ toast, onClose }) {
  if (!toast) return null;

  const { type, message } = toast;
  const formattedMessage = formatToastMessage(message);

  const getIcon = () => {
    switch (type) {
      case "success":
        return <CheckCircle2 size={18} className="toast-icon-success" />;
      case "error":
        return <AlertCircle size={18} className="toast-icon-error" />;
      case "warning":
        return <AlertTriangle size={18} className="toast-icon-warning" />;
      default:
        return <CheckCircle2 size={18} />;
    }
  };

  return (
    <div className={`toast-notification toast-${type || "info"}`}>
      <div className="toast-content">
        {getIcon()}
        <span className="toast-text">{formattedMessage}</span>
      </div>
      <button className="toast-close" onClick={onClose} aria-label="Close toast">
        <X size={16} />
      </button>
    </div>
  );
}
