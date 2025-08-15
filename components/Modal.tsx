import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600/75 dark:bg-black/80 overflow-y-auto h-full w-full z-50 flex items-center justify-center" id="my-modal">
      <div className="relative mx-auto p-5 border dark:border-acotubo-dark-border w-full max-w-lg shadow-lg rounded-md bg-white dark:bg-acotubo-dark-surface">
        <div className="flex justify-between items-start pb-3 border-b dark:border-acotubo-dark-border">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-acotubo-dark-text-primary">{title}</h3>
          <button onClick={onClose} className="text-gray-400 dark:text-acotubo-dark-text-secondary bg-transparent hover:bg-gray-200 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-acotubo-dark-text-primary rounded-lg text-sm p-1.5 ml-auto inline-flex items-center">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
};

export default Modal;