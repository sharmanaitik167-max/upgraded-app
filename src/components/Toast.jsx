import { useState, useEffect, useCallback } from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';

export default function Toast({ message, type = 'success', onClose, duration = 3000 }) {
  const [isExiting, setIsExiting] = useState(false);

  const handleClose = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      onClose();
    }, 250);
  }, [onClose]);

  useEffect(() => {
    const timer = setTimeout(handleClose, duration);
    return () => clearTimeout(timer);
  }, [duration, handleClose]);

  const styles = {
    success: {
      bg: 'bg-green-50 border-green-200',
      icon: <CheckCircle size={20} className="text-green-600 shrink-0" />,
      text: 'text-green-800'
    },
    error: {
      bg: 'bg-red-50 border-red-200',
      icon: <XCircle size={20} className="text-red-600 shrink-0" />,
      text: 'text-red-800'
    }
  };

  const s = styles[type] || styles.success;

  return (
    <div className={`${isExiting ? 'animate-toast-out' : 'animate-toast-in'} flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg ${s.bg} min-w-[280px] max-w-[400px]`}>
      {s.icon}
      <p className={`text-sm font-medium flex-1 ${s.text}`}>{message}</p>
      <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 shrink-0">
        <X size={16} />
      </button>
    </div>
  );
}
