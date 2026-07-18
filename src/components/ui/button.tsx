import React from 'react';
import { LucideIcon } from 'lucide-react';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  icon?: LucideIcon;
  variant?: 'primary' | 'secondary' | 'active' | 'danger' | 'ghost';
  size?: 'xs' | 'sm' | 'md';
  className?: string;
  disabled?: boolean;
  title?: string;
}

export const Button: React.FC<ButtonProps> = ({ children, onClick, icon, variant = 'primary', size = 'md', className = '', disabled = false, title }) => {
  const baseStyles = "font-medium rounded focus:outline-none focus-visible:ring-1 focus-visible:ring-sky-500 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed select-none";
  const variantStyles = {
    primary: "bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700",
    secondary: "bg-transparent hover:bg-slate-800 text-slate-300 border border-slate-700",
    active: "bg-sky-600 hover:bg-sky-500 text-white border border-sky-600",
    danger: "bg-transparent hover:bg-red-950 text-red-400 border border-red-900",
    ghost: "bg-transparent hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-transparent",
  };
  const sizeStyles = {
    xs: "px-2 py-1 text-[10px]",
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
  };

  return (
    <button onClick={onClick} disabled={disabled} title={title} className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}>
      {icon && React.createElement(icon, { className: "w-4 h-4" })}
      <span>{children}</span>
    </button>
  );
};
