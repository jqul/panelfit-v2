import { ButtonHTMLAttributes } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
}

export function Button({
  className,
  variant = 'primary',
  size = 'md',
  ...props
}: ButtonProps) {
  const variants = {
    primary: 'bg-[#111110] text-[#faf8f5] hover:bg-[#222220]',
    secondary: 'bg-[#6e5438] text-white hover:bg-[#5a442d]',
    outline: 'border border-[#d8d4ca] bg-transparent text-[#444240] hover:border-[#111110] hover:text-[#111110]',
    ghost: 'bg-transparent text-[#888480] hover:text-[#111110]',
    danger: 'bg-[#b02a20] text-white hover:bg-[#90221a]',
    success: 'bg-[#1a6038] text-white hover:bg-[#144a2b]',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-md font-medium transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  );
}
