import React from 'react';
import { useSocket } from '../../context/SocketContext';
import { X, Bell, CheckCircle, AlertTriangle, Info } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useSocket();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-50 flex flex-col gap-3 max-w-sm w-full px-4 pointer-events-none">
      {toasts.map((toast) => {
        let bg = 'bg-slate-900 text-white';
        let Icon = Info;

        if (toast.type === 'success') {
          bg = 'bg-emerald-800 text-white border border-emerald-600';
          Icon = CheckCircle;
        } else if (toast.type === 'error') {
          bg = 'bg-rose-900 text-white border border-rose-700';
          Icon = AlertTriangle;
        } else if (toast.type === 'info') {
          bg = 'bg-indigo-900 text-white border border-indigo-700';
          Icon = Bell;
        }

        return (
          <div
            key={toast.id}
            className={`${bg} p-4 rounded-xl shadow-xl flex items-start gap-3 pointer-events-auto transition-all animate-bounce-short`}
          >
            <Icon className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold leading-tight">{toast.title}</h4>
              <p className="text-xs opacity-90 mt-1 leading-normal">{toast.message}</p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
