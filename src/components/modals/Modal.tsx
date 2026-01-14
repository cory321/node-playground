import React, { ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  icon: ReactNode;
  iconBgColor?: string;
  shadowColor?: string;
  children: ReactNode;
}

export function Modal({
  isOpen,
  onClose,
  title,
  icon,
  iconBgColor = 'bg-violet-500/20',
  shadowColor = 'shadow-violet-500/10',
  children,
}: ModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={`bg-slate-900/95 backdrop-blur-2xl border border-slate-700/50 rounded-3xl p-6 w-full max-w-lg shadow-2xl ${shadowColor} animate-in zoom-in-95 fade-in duration-200`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`p-2 ${iconBgColor} rounded-xl`}>{icon}</div>
            <h2 className="text-lg font-bold uppercase tracking-widest text-slate-100">
              {title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-xl transition-colors text-slate-400 hover:text-slate-200"
          >
            <X size={20} />
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}

export default Modal;
