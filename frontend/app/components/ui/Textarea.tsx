import React from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  hint?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ label, error, hint, id, className = '', onInput: _onInput, ...rest }, ref) {
    const textareaId = id ?? `textarea-${label.toLowerCase().replace(/\s+/g, '-')}`;

    function handleInput(e: React.FormEvent<HTMLTextAreaElement>) {
      const target = e.currentTarget;
      target.style.height = 'auto';
      target.style.height = target.scrollHeight + 'px';
    }

    return (
      <div className="flex flex-col gap-1">
        <label
          htmlFor={textareaId}
          className={[
            'text-sm font-medium',
            error ? 'text-[var(--color-danger)]' : 'text-[var(--color-text)]',
          ].join(' ')}
        >
          {label}
        </label>
        <textarea
          ref={ref}
          id={textareaId}
          rows={3}
          className={[
            'rounded-md border px-3 py-2 text-sm text-[var(--color-text)] bg-[var(--color-bg)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-1 transition-colors resize-none overflow-hidden',
            error
              ? 'border-[var(--color-danger)]'
              : 'border-[var(--color-border)]',
            className,
          ]
            .filter(Boolean)
            .join(' ')}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={
            error ? `${textareaId}-error` : hint ? `${textareaId}-hint` : undefined
          }
          onInput={handleInput}
          {...rest}
        />
        {error && (
          <p
            id={`${textareaId}-error`}
            className="text-sm text-[var(--color-danger)]"
            role="alert"
          >
            {error}
          </p>
        )}
        {!error && hint && (
          <p id={`${textareaId}-hint`} className="text-sm text-[var(--color-text-muted)]">
            {hint}
          </p>
        )}
      </div>
    );
  }
);
