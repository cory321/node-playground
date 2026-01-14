import React, { ReactNode } from 'react';

interface ToolbarButtonProps {
  onClick?: () => void;
  icon: ReactNode;
  label: string;
  className?: string;
  variant?: 'primary' | 'secondary';
  children?: ReactNode;
}

export function ToolbarButton({
  onClick,
  icon,
  label,
  className = '',
  variant = 'secondary',
  children,
}: ToolbarButtonProps) {
  const baseStyles =
    'p-3 rounded-xl transition-all hover:scale-105 active:scale-95 group relative';

  const variantStyles = {
    primary:
      'bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-500/20',
    secondary:
      'hover:bg-slate-800 text-slate-400 hover:text-slate-200',
  };

  return (
    <button
      onClick={onClick}
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
    >
      {children || icon}
      <span className="absolute -bottom-10 left-1/2 -translate-x-1/2 z-10 bg-slate-900 text-[10px] px-2 py-1 rounded border border-slate-700 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none uppercase tracking-tighter whitespace-nowrap">
        {label}
      </span>
    </button>
  );
}

export default ToolbarButton;
