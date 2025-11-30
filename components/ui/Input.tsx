import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

// FIX: Wrap the component with React.forwardRef to allow parent components to pass a ref to the underlying input element.
const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => {
  return (
    <input
      className={`flex h-10 w-full rounded-md border border-notion-border bg-transparent px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-notion-accent focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:text-gray-200 dark:placeholder-gray-500 ${className}`}
      {...props}
      ref={ref}
    />
  );
});

Input.displayName = 'Input';

export default Input;
