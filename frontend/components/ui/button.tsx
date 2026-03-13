import * as React from 'react';
import clsx from 'clsx';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'outline';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = 'primary', ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      className={clsx(
        'inline-flex items-center justify-center rounded-full px-4 py-2.5 text-sm font-medium transition duration-200 focus:outline-none focus:ring-2 focus:ring-white/20 disabled:cursor-not-allowed disabled:opacity-50',
        variant === 'primary' && 'bg-white text-black hover:bg-zinc-200',
        variant === 'ghost' && 'bg-transparent text-zinc-200 hover:bg-white/5',
        variant === 'outline' && 'border border-white/10 bg-transparent text-zinc-100 hover:border-white/20 hover:bg-white/5',
        className,
      )}
      {...props}
    />
  );
});