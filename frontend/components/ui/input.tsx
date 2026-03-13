import * as React from 'react';
import clsx from 'clsx';

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(function Input(
  { className, ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      className={clsx(
        'w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-zinc-100 outline-none transition duration-200 placeholder:text-zinc-500 focus:border-white/20 focus:bg-white/[0.05]',
        className,
      )}
      {...props}
    />
  );
});