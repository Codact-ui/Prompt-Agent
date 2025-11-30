import React, { useEffect, useRef, useMemo } from 'react';
import ReactDOM from 'react-dom';

interface ModalProps {
  children: React.ReactNode;
  onClose: () => void;
}

const Modal: React.FC<ModalProps> = ({ children, onClose }) => {
  const modalRoot = document.body;
  const el = useMemo(() => document.createElement('div'), []);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    modalRoot.appendChild(el);
    // Add a class to the body to prevent scrolling when the modal is open
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      // Check if modalRoot still contains el before removing, to prevent errors on fast unmounts
      if (modalRoot.contains(el)) {
        modalRoot.removeChild(el);
      }
      document.body.style.overflow = 'unset';
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [el, modalRoot, onClose]);

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
          onClose();
      }
  }

  return ReactDOM.createPortal(
    <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 modal-fade-in"
        onClick={handleOverlayClick}
    >
        <div ref={modalRef} role="dialog" aria-modal="true">
            {children}
        </div>
    </div>,
    el
  );
};

export default Modal;