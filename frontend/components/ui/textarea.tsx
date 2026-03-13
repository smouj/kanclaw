import * as React from 'react';
import clsx from 'clsx';

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, ...props }, ref) {
    return (
      <textarea
        ref={ref}
        className={clsx(
          'w-full rounded-3xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-zinc-100 outline-none transition duration-200 placeholder:text-zinc-500 focus:border-white/20 focus:bg-white/[0.05]',
          className,
        )}
        {...props}
      />
    );
  },
);