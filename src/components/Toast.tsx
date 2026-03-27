import React, { useEffect } from 'react';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface ToastProps {
  toasts: ToastMessage[];
  removeToast: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, removeToast }) => {
  return (
    <div className="fixed bottom-6 right-6 z-9999 flex flex-col gap-2">
      {toasts.map(t => (
        <Toast key={t.id} toast={t} onRemove={() => removeToast(t.id)} />
      ))}
    </div>
  );
};

const Toast: React.FC<{ toast: ToastMessage; onRemove: () => void }> = ({ toast, onRemove }) => {
  useEffect(() => {
    const timer = setTimeout(onRemove, 3000);
    return () => clearTimeout(timer);
  }, [onRemove]);

  const styles = {
    success: 'bg-emerald-900/90 border-emerald-500 text-emerald-400',
    error: 'bg-red-900/90 border-red-500 text-red-400',
    info: 'bg-blue-900/90 border-blue-500 text-blue-400',
  };

  const icons = {
    success: <CheckCircle2 size={16} />,
    error: <XCircle size={16} />,
    info: <Info size={16} />,
  };

  return (
    <div className={`toast-animation flex items-center gap-3 px-4.5 py-3 rounded-xl border shadow-2xl backdrop-blur-md max-w-xs ${styles[toast.type]}`}>
      <div className="shrink-0">{icons[toast.type]}</div>
      <div className="text-sm font-medium flex-1">{toast.message}</div>
      <button className="shrink-0 opacity-50 hover:opacity-100 transition-opacity cursor-pointer" onClick={onRemove}>
        <X size={14} />
      </button>
    </div>
  );
};
