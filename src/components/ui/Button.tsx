import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  isLoading?: boolean;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  asChild?: boolean;
  fullWidth?: boolean;
}

export function Button({ 
  children, 
  className = "", 
  isLoading = false, 
  variant = 'primary',
  size = 'md',
  asChild = false,
  fullWidth = false,
  ...props 
}: ButtonProps) {
  const baseClasses = "btn";
  
  const variantClasses = {
    primary: "bg-[var(--primary)] hover:bg-[var(--primary-light)] text-white",
    secondary: "bg-[var(--secondary)] hover:opacity-90 text-white", 
    outline: "border border-[var(--primary)] text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white",
    ghost: "bg-transparent hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300",
    destructive: "bg-red-600 hover:bg-red-700 text-white"
  };
  
  const sizeClasses = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
    icon: "h-9 w-9 flex items-center justify-center"
  };

  const fullWidthClasses = "w-full max-w-xs mx-auto block";
  
  const combinedClasses = [
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    fullWidth ? fullWidthClasses : '',
    className
  ].join(' ');

  const content = isLoading ? (
    <div className="flex items-center justify-center">
      <div className="spinner-primary h-5 w-5" />
    </div>
  ) : (
    children
  );

  if (asChild) {
    const child = React.Children.only(children) as React.ReactElement<React.HTMLAttributes<HTMLElement>>;
    return React.cloneElement(child, {
      className: [child.props.className, combinedClasses].filter(Boolean).join(' '),
      ...(props as React.HTMLAttributes<HTMLElement>)
    });
  }

  return (
    <button
      className={combinedClasses}
      {...props}
    >
      {content}
    </button>
  );
}
