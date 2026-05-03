import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  function Input({ label, error, hint, id, className = '', ...rest }, ref) {
    const inputId = id ?? `input-${label.toLowerCase().replace(/\s+/g, '-')}`;

    return (
      <div className="flex flex-col gap-1">
        <label
          htmlFor={inputId}
          className={[
            'text-sm font-medium',
            error ? 'text-[var(--color-danger)]' : 'text-[var(--color-text)]',
          ].join(' ')}
        >
          {label}
        </label>
        <input
          ref={ref}
          id={inputId}
          className={[
            'rounded-md border px-3 py-2 text-sm text-[var(--color-text)] bg-[var(--color-bg)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-1 transition-colors',
            error
              ? 'border-[var(--color-danger)]'
              : 'border-[var(--color-border)]',
            className,
          ]
            .filter(Boolean)
            .join(' ')}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={
            error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined
          }
          {...rest}
        />
        {error && (
          <p
            id={`${inputId}-error`}
            className="text-sm text-[var(--color-danger)]"
            role="alert"
          >
            {error}
          </p>
        )}
        {!error && hint && (
          <p id={`${inputId}-hint`} className="text-sm text-[var(--color-text-muted)]">
            {hint}
          </p>
        )}
      </div>
    );
  }
);
