import React from 'react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  hint?: string;
  placeholder?: string;
  options: SelectOption[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  function Select({ label, error, hint, placeholder, options, id, className = '', ...rest }, ref) {
    const selectId = id ?? `select-${label.toLowerCase().replace(/\s+/g, '-')}`;

    return (
      <div className="flex flex-col gap-1">
        <label
          htmlFor={selectId}
          className={[
            'text-sm font-medium',
            error ? 'text-[var(--color-danger)]' : 'text-[var(--color-text)]',
          ].join(' ')}
        >
          {label}
        </label>
        <select
          ref={ref}
          id={selectId}
          className={[
            'rounded-md border px-3 py-2 text-sm text-[var(--color-text)] bg-[var(--color-bg)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-1 transition-colors appearance-none',
            error
              ? 'border-[var(--color-danger)]'
              : 'border-[var(--color-border)]',
            className,
          ]
            .filter(Boolean)
            .join(' ')}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={
            error
              ? `${selectId}-error`
              : hint
              ? `${selectId}-hint`
              : undefined
          }
          {...rest}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && (
          <p
            id={`${selectId}-error`}
            className="text-sm text-[var(--color-danger)]"
            role="alert"
          >
            {error}
          </p>
        )}
        {!error && hint && (
          <p id={`${selectId}-hint`} className="text-sm text-[var(--color-text-muted)]">
            {hint}
          </p>
        )}
      </div>
    );
  }
);
