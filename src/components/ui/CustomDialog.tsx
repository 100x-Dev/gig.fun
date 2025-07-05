'use client';

import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '~/lib/utils';
import { Button } from './Button';

export interface CustomDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  confirmText?: string;
  onConfirm?: () => void;
  cancelText?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function CustomDialog({
  open,
  onClose,
  title,
  children,
  confirmText,
  onConfirm,
  cancelText,
  size = 'md',
}: CustomDialogProps) {
  const sizeClasses = {
    sm: 'sm:max-w-sm',
    md: 'sm:max-w-md',
    lg: 'sm:max-w-lg',
    xl: 'sm:max-w-xl',
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay 
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-all duration-100 data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=open]:fade-in"
        />
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <DialogPrimitive.Content
            className={cn(
              'fixed z-50 grid w-full gap-4 rounded-lg border bg-white p-6 shadow-lg animate-in data-[state=open]:fade-in-90 data-[state=open]:slide-in-from-bottom-10 sm:rounded-lg sm:zoom-in-90 data-[state=open]:sm:slide-in-from-bottom-0',
              sizeClasses[size],
              'max-h-[85vh] overflow-y-auto'
            )}
          >
            <div className="flex flex-col space-y-1.5 text-center sm:text-left">
              <DialogPrimitive.Title className="text-lg font-semibold text-gray-900">
                {title}
              </DialogPrimitive.Title>
            </div>
            
            <div>{children}</div>
            
            {(confirmText || cancelText) && (
              <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
                {cancelText && (
                  <Button 
                    variant="outline" 
                    onClick={onClose}
                    className="mt-2 sm:mt-0"
                  >
                    {cancelText}
                  </Button>
                )}
                {confirmText && onConfirm && (
                  <Button onClick={onConfirm}>
                    {confirmText}
                  </Button>
                )}
              </div>
            )}
            
            <DialogPrimitive.Close 
              className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </DialogPrimitive.Close>
          </DialogPrimitive.Content>
        </div>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
