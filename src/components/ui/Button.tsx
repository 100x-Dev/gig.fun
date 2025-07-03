interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  isLoading?: boolean;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export function Button({ 
  children, 
  className = "", 
  isLoading = false, 
  variant = 'primary',
  size = 'md',
  ...props 
}: ButtonProps) {
  const baseClasses = "btn";
  
  const variantClasses = {
    primary: "btn-primary",
    secondary: "btn-secondary", 
    outline: "btn-outline",
    ghost: "bg-transparent hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
  };
  
  const sizeClasses = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base"
  };

  const fullWidthClasses = "w-full max-w-xs mx-auto block";
  
  const combinedClasses = [
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    fullWidthClasses,
    className
  ].join(' ');

  return (
    <button
      className={combinedClasses}
      {...props}
    >
      {isLoading ? (
        <div className="flex items-center justify-center">
          <div className="spinner-primary h-5 w-5" />
        </div>
      ) : (
        children
      )}
    </button>
  );
}
