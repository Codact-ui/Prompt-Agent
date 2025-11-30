import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'default' | 'sm' | 'icon';
}

const Button: React.FC<ButtonProps> = ({ children, className, variant = 'primary', size = 'default', ...props }) => {
  const baseStyles = 'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-notion-accent/80 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background';

  const variantStyles = {
    primary: 'bg-notion-text text-white hover:bg-notion-text/90 dark:bg-gray-200 dark:text-gray-900 dark:hover:bg-gray-300',
    secondary: 'bg-notion-hover text-notion-text hover:bg-notion-hover/80 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600',
    danger: 'bg-red-500 text-white hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700',
    ghost: 'hover:bg-notion-hover text-notion-text',
  };
  
  const sizeStyles = {
      default: 'px-4 py-2',
      sm: 'h-9 rounded-md px-3',
      icon: 'h-9 w-9',
  };

  return (
    <button className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

export default Button;