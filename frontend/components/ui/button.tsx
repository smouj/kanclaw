import * as React from 'react';
import clsx from 'clsx';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'outline' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = 'primary', size = 'md', ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      className={clsx(
        'inline-flex items-center justify-center rounded font-medium transition duration-200 focus:outline-none focus:ring-2 focus:ring-white/20 disabled:cursor-not-allowed disabled:opacity-50',
        size === 'sm' && 'px-3 py-1.5 text-xs',
        size === 'md' && 'px-4 py-2 text-sm',
        size === 'lg' && 'px-6 py-3 text-base',
        variant === 'primary' && 'bg-white text-black hover:bg-zinc-200',
        variant === 'secondary' && 'bg-zinc-800 text-white hover:bg-zinc-700',
        variant === 'ghost' && 'bg-transparent text-zinc-200 hover:bg-white/5',
        variant === 'outline' && 'border border-white/10 bg-transparent text-zinc-100 hover:border-white/20 hover:bg-white/5',
        className,
      )}
      {...props}
    />
  );
});
