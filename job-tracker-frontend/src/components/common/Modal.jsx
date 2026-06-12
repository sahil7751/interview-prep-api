import { useEffect } from 'react';

export default function Modal({ open, onClose, title, children, size = 'md' }) {
  // Close on Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    if (open) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-xl',
    lg: 'max-w-2xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center
                    justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Modal box */}
      <div className={`relative bg-white rounded-2xl shadow-xl
                       w-full ${sizes[size]} max-h-[90vh]
                       overflow-y-auto z-10`}>
        {/* Header */}
        <div className="flex items-center justify-between
                        p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center
                       rounded-lg text-gray-400 hover:text-gray-600
                       hover:bg-gray-100 transition-colors text-xl">
            ×
          </button>
        </div>
        {/* Content */}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

