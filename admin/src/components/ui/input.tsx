import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...rest }, ref) => (
    <input
      ref={ref}
      className={cn(
        'h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm',
        'placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300',
        'disabled:bg-gray-50 disabled:text-gray-500',
        className,
      )}
      {...rest}
    />
  ),
);
Input.displayName = 'Input';
