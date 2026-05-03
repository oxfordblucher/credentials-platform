import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { toast as toastStore } from '~/lib/toast';
import type { Toast } from '~/lib/toast';

const borderColors: Record<Toast['type'], string> = {
  success: 'border-l-teal-500',
  error: 'border-l-red-500',
  info: 'border-l-slate-400',
};

const AUTO_DISMISS_MS = 4000;

function ToastItem({ t, onDismiss }: { t: Toast; onDismiss: () => void }) {
  useEffect(() => {
    const timer = setTimeout(() => toastStore.dismiss(t.id), AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [t.id]); // only depends on stable id

  return (
    <div
      role="status"
      aria-live={t.type === 'error' ? 'assertive' : 'polite'}
      className={[
        'pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-lg shadow-lg bg-white border-l-4 min-w-64 max-w-sm',
        borderColors[t.type],
      ].join(' ')}
    >
      <p className="flex-1 text-sm text-[var(--color-text)]">{t.message}</p>
      <button
        onClick={onDismiss}
        aria-label="Dismiss notification"
        className="shrink-0 text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors leading-none mt-0.5"
      >
        &times;
      </button>
    </div>
  );
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const unsubscribe = toastStore.subscribe(setToasts);
    return unsubscribe;
  }, []);

  return createPortal(
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <ToastItem key={t.id} t={t} onDismiss={() => toastStore.dismiss(t.id)} />
      ))}
    </div>,
    document.body
  );
}
