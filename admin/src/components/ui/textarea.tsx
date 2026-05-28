import { forwardRef, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...rest }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      'w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm leading-6',
      'placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300',
      'disabled:bg-gray-50 disabled:text-gray-500',
      className,
    )}
    {...rest}
  />
));
Textarea.displayName = 'Textarea';
