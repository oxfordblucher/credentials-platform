interface ToggleProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  size?: 'sm' | 'md';
}

export function Toggle({ label, checked, onChange, size = 'md' }: ToggleProps) {
  const trackSize = size === 'sm' ? 'w-8 h-4' : 'w-10 h-5';
  const thumbSize = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';
  const thumbTranslate = size === 'sm' ? 'translate-x-4' : 'translate-x-5';

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={[
        'relative inline-flex items-center rounded-full transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-1',
        trackSize,
        checked ? 'bg-[var(--color-accent)]' : 'bg-[var(--color-border)]',
      ].join(' ')}
    >
      <span
        className={[
          'absolute left-0.5 inline-block rounded-full bg-white shadow transition-transform duration-150',
          thumbSize,
          checked ? thumbTranslate : 'translate-x-0.5',
        ].join(' ')}
      />
    </button>
  );
}
