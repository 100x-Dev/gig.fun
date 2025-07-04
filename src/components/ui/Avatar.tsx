import * as React from 'react';
import { cn } from '~/lib/utils';

const Avatar = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement> & {
    src?: string;
    alt?: string;
    size?: 'sm' | 'md' | 'lg';
  }
>(({ className, src, alt, size = 'md', ...props }, ref) => {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
  };

  return (
    <span
      ref={ref}
      className={cn(
        'relative flex shrink-0 overflow-hidden rounded-full',
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {src ? (
        <img
          src={src}
          alt={alt || 'Avatar'}
          className="aspect-square h-full w-full object-cover"
        />
      ) : (
        <span className="flex h-full w-full items-center justify-center rounded-full bg-muted">
          {props.children}
        </span>
      )}
    </span>
  );
});
Avatar.displayName = 'Avatar';

const AvatarImage = React.forwardRef<
  HTMLImageElement,
  React.ImgHTMLAttributes<HTMLImageElement>
>(({ className, ...props }, ref) => (
  <img
    ref={ref}
    className={cn('aspect-square h-full w-full object-cover', className)}
    {...props}
  />
));
AvatarImage.displayName = 'AvatarImage';

const AvatarFallback = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement>
>(({ className, ...props }, ref) => (
  <span
    ref={ref}
    className={cn(
      'flex h-full w-full items-center justify-center rounded-full bg-muted',
      className
    )}
    {...props}
  />
));
AvatarFallback.displayName = 'AvatarFallback';

export { Avatar, AvatarImage, AvatarFallback };
