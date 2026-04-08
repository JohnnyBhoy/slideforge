import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose?: () => void;
  children: React.ReactNode;
  dismissable?: boolean;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children, dismissable = true }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
      onClick={dismissable ? onClose : undefined}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {dismissable && onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 text-xl font-bold"
          >
            ✕
          </button>
        )}
        {children}
      </div>
    </div>
  );
};

export default Modal;
