import { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

const ToastContext = createContext(null);

// Helper to format backend JSON or DRF error payloads into clean human-readable strings
export function formatErrorMessage(err) {
  if (!err) return 'An unexpected error occurred.';
  if (typeof err === 'string') {
    // Check if the string is JSON
    if (err.startsWith('{') && err.endsWith('}')) {
      try {
        const parsed = JSON.parse(err);
        return formatErrorMessage(parsed);
      } catch (e) {
        return err;
      }
    }
    return err;
  }
  if (err instanceof Error) {
    if (err.data) return formatErrorMessage(err.data);
    if (err.message) return formatErrorMessage(err.message);
  }
  if (typeof err === 'object') {
    if (err.detail) return err.detail;
    if (err.error) return err.error;
    if (err.message) return err.message;
    // DRF field errors dictionary: { field: ["msg"] }
    const entries = Object.entries(err);
    if (entries.length > 0) {
      return entries
        .map(([field, msgs]) => {
          const fieldName = field.charAt(0).toUpperCase() + field.slice(1).replace(/_/g, ' ');
          const msgStr = Array.isArray(msgs) ? msgs.join(', ') : String(msgs);
          return `${fieldName}: ${msgStr}`;
        })
        .join(' | ');
    }
  }
  return String(err);
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((type, message, description = '') => {
    const id = Date.now() + Math.random().toString(36).substring(2, 7);
    const parsedMsg = type === 'error' ? formatErrorMessage(message) : String(message);

    const newToast = {
      id,
      type, // 'success' | 'error' | 'info' | 'warning'
      message: parsedMsg,
      description,
      createdAt: Date.now(),
    };

    setToasts((prev) => [...prev, newToast]);

    // Auto dismiss after 4 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = {
    success: (msg, desc) => addToast('success', msg, desc),
    error: (msg, desc) => addToast('error', msg, desc),
    info: (msg, desc) => addToast('info', msg, desc),
    warning: (msg, desc) => addToast('warning', msg, desc),
  };

  return (
    <ToastContext.Provider value={{ toast, addToast, removeToast }}>
      {children}
      {/* Toast Notification Container */}
      <div className="toast-portal-container" aria-live="polite">
        {toasts.map((t) => {
          let Icon = CheckCircle2;
          let variantClass = 'toast-success';
          if (t.type === 'error') {
            Icon = AlertCircle;
            variantClass = 'toast-error';
          } else if (t.type === 'warning') {
            Icon = AlertTriangle;
            variantClass = 'toast-warning';
          } else if (t.type === 'info') {
            Icon = Info;
            variantClass = 'toast-info';
          }

          return (
            <div key={t.id} className={`toast-card ${variantClass} animate-toast-in`}>
              <div className="toast-icon-box">
                <Icon size={18} />
              </div>
              <div className="toast-content-box">
                <p className="toast-title">{t.message}</p>
                {t.description && <p className="toast-desc">{t.description}</p>}
              </div>
              <button
                type="button"
                className="toast-close-btn"
                onClick={() => removeToast(t.id)}
                aria-label="Dismiss notification"
              >
                <X size={15} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context.toast;
}
