import { forwardRef, type SelectHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export const Select = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...rest }, ref) => (
  <select
    ref={ref}
    className={cn(
      'h-10 w-full rounded-md border border-gray-300 bg-white px-2 text-sm',
      'focus:outline-none focus:ring-2 focus:ring-gray-300',
      'disabled:bg-gray-50 disabled:text-gray-500',
      className,
    )}
    {...rest}
  >
    {children}
  </select>
));
Select.displayName = 'Select';
