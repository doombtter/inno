import type { LabelHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface Props extends LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
  hint?: ReactNode;
}

export function Label({ children, required, hint, className, ...rest }: Props) {
  return (
    <label
      className={cn(
        'block text-xs font-medium text-gray-700 mb-1',
        className,
      )}
      {...rest}
    >
      <span>
        {children}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </span>
      {hint && (
        <span className="ml-2 text-gray-400 font-normal">{hint}</span>
      )}
    </label>
  );
}
