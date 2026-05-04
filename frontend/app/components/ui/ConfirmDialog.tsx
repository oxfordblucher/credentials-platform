import { Button } from '~/components/ui/Button';

interface ConfirmDialogProps {
  message: string;
  warning?: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  loading?: boolean;
}

export function ConfirmDialog({
  message,
  warning,
  onConfirm,
  onCancel,
  confirmLabel = 'Confirm',
  loading = false,
}: ConfirmDialogProps) {
  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-subtle)] p-4 flex flex-col gap-3">
      <p className="text-sm text-[var(--color-text)]">{message}</p>
      {warning && (
        <p className="text-sm text-amber-600">{warning}</p>
      )}
      <div className="flex gap-2 justify-end">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          type="button"
          variant="danger"
          size="sm"
          onClick={onConfirm}
          loading={loading}
        >
          {confirmLabel}
        </Button>
      </div>
    </div>
  );
}
