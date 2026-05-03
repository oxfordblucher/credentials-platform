export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

let toasts: Toast[] = [];
let listeners: Array<(toasts: Toast[]) => void> = [];

function notify(): void {
  listeners.forEach((l) => l([...toasts]));
}

function add(type: ToastType, message: string): void {
  const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  toasts = [...toasts, { id, type, message }];
  notify();
}

export const toast = {
  success(message: string): void {
    add('success', message);
  },
  error(message: string): void {
    add('error', message);
  },
  info(message: string): void {
    add('info', message);
  },
  dismiss(id: string): void {
    toasts = toasts.filter((t) => t.id !== id);
    notify();
  },
  subscribe(listener: (toasts: Toast[]) => void): () => void {
    listeners = [...listeners, listener];
    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  },
};
