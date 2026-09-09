import { createContext, useContext, useState, useCallback } from 'react';
import { Trash2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

const ConfirmContext = createContext(null);

export function ConfirmProvider({ children }) {
  const [dialogState, setDialogState] = useState({
    isOpen: false,
    title: 'Confirm Action',
    message: 'Are you sure you want to proceed?',
    confirmText: 'Delete',
    cancelText: 'Cancel',
    type: 'danger', // 'danger' | 'warning' | 'info'
    resolve: null,
  });

  const confirm = useCallback(({
    title = 'Confirm Action',
    message = 'Are you sure you want to proceed?',
    confirmText = 'Delete',
    cancelText = 'Cancel',
    type = 'danger',
  } = {}) => {
    return new Promise((resolve) => {
      setDialogState({
        isOpen: true,
        title,
        message,
        confirmText,
        cancelText,
        type,
        resolve,
      });
    });
  }, []);

  const handleClose = (result) => {
    if (dialogState.resolve) {
      dialogState.resolve(result);
    }
    setDialogState((prev) => ({ ...prev, isOpen: false, resolve: null }));
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {dialogState.isOpen && (
        <div className="confirm-modal-backdrop animate-fade-in" onClick={() => handleClose(false)}>
          <div
            className="confirm-modal-card animate-scale-up"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <button
              className="confirm-modal-close-btn"
              onClick={() => handleClose(false)}
              aria-label="Close dialog"
            >
              <X size={16} />
            </button>

            <div className="confirm-modal-icon-wrap">
              <div className={`confirm-modal-icon-bubble ${dialogState.type}`}>
                {dialogState.type === 'danger' ? (
                  <Trash2 size={24} />
                ) : dialogState.type === 'warning' ? (
                  <AlertTriangle size={24} />
                ) : (
                  <Info size={24} />
                )}
              </div>
            </div>

            <div className="confirm-modal-content">
              <h3 className="confirm-modal-title">{dialogState.title}</h3>
              <p className="confirm-modal-message">{dialogState.message}</p>
            </div>

            <div className="confirm-modal-actions">
              <button
                type="button"
                className="confirm-btn-cancel"
                onClick={() => handleClose(false)}
              >
                {dialogState.cancelText}
              </button>
              <button
                type="button"
                className={`confirm-btn-action ${dialogState.type}`}
                onClick={() => handleClose(true)}
                autoFocus
              >
                {dialogState.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmProvider');
  }
  return context;
}
