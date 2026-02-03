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
  const baseStyles = "font-medium rounded-lg focus:outline-none transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed select-none tracking-wide shadow-sm";
  const variantStyles = {
    primary: "bg-slate-700/50 hover:bg-slate-600/50 text-white border border-slate-600/50 hover:border-slate-500",
    secondary: "bg-transparent hover:bg-slate-800/50 text-slate-300 border border-slate-700/50",
    active: "bg-sky-600 hover:bg-sky-500 text-white border border-sky-500 shadow-sky-900/20 shadow-md",
    danger: "bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20",
    ghost: "bg-transparent hover:bg-slate-800/30 text-slate-400 hover:text-slate-200 shadow-none",
  };
  const sizeStyles = {
    xs: "px-2 py-1 text-[10px]",
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
  };

  return (
    <button onClick={onClick} disabled={disabled} title={title} className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}>
      {icon && React.createElement(icon, { className: "w-4 h-4 opacity-90" })}
      <span>{children}</span>
    </button>
  );
};
