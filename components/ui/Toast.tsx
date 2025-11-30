import React from 'react';
import { ToastMessage } from '../../types';
import { CheckCircleIcon, XCircleIcon } from '../icons/AgentIcons';

const Toast: React.FC<{ message: ToastMessage }> = ({ message }) => {
  const [isVisible, setIsVisible] = React.useState(true);
  
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 2700); // Start fade out before removal
    return () => clearTimeout(timer);
  }, []);

  const animationClass = isVisible ? 'toast-in' : 'toast-out';

  const typeStyles = {
    success: 'bg-green-600 text-white',
    error: 'bg-red-600 text-white',
  };

  const Icon = message.type === 'success' ? CheckCircleIcon : XCircleIcon;

  return (
    <div className={`flex items-center p-4 rounded-lg shadow-lg text-sm ${typeStyles[message.type]} ${animationClass}`}>
      <div className="w-5 h-5 mr-3">
        <Icon />
      </div>
      <span>{message.message}</span>
    </div>
  );
};

const ToastContainer: React.FC<{ toasts: ToastMessage[] }> = ({ toasts }) => {
  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <Toast key={toast.id} message={toast} />
      ))}
    </div>
  );
};

export default ToastContainer;