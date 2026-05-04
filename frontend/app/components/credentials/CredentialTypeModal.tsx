import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '~/components/ui/Modal';
import { Input } from '~/components/ui/Input';
import { Textarea } from '~/components/ui/Textarea';
import { Select } from '~/components/ui/Select';
import { Toggle } from '~/components/ui/Toggle';
import { Button } from '~/components/ui/Button';
import { createCredentialType, updateCredentialType } from '~/lib/api/credentialTypes';
import { ApiError } from '~/lib/api/client';
import { toast } from '~/lib/toast';
import { slugify } from '~/lib/utils/schema';
import type { CredentialType } from '~/lib/types';

interface FieldRow {
  id: string;
  key: string;
  label: string;
  type: 'string' | 'number' | 'date';
  required: boolean;
}

interface Props {
  mode: 'create' | 'edit';
  initialData?: CredentialType;
  onSuccess: (ct: CredentialType) => void;
  onClose: () => void;
}

const formSchema = z.object({
  name: z.string().min(1, 'Required').max(80, 'Max 80 characters'),
  description: z.string().max(300, 'Max 300 characters').optional(),
});

type FormValues = z.infer<typeof formSchema>;

function generateId() {
  return Math.random().toString(36).slice(2, 9);
}

function fieldRowsFromSchema(ct: CredentialType): FieldRow[] {
  return ct.metadataSchema.fields.map((f) => ({
    id: generateId(),
    key: f.key,
    label: f.label,
    type: f.type as 'string' | 'number' | 'date',
    required: f.required,
  }));
}

export function CredentialTypeModal({ mode, initialData, onSuccess, onClose }: Props) {
  const [fields, setFields] = useState<FieldRow[]>(
    initialData ? fieldRowsFromSchema(initialData) : []
  );
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  // Track which keys have been manually overridden so we don't auto-slugify them
  const [manualKeys, setManualKeys] = useState<Set<string>>(() => {
    if (!initialData) return new Set();
    // All pre-existing fields are treated as manually set
    return new Set(initialData.metadataSchema.fields.map((_, i) => i.toString()));
  });

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name ?? '',
      description: initialData?.description ?? '',
    },
  });

  const jsonPreview = useMemo(() => {
    const schema = {
      fields: fields.map(({ key, label, type, required }) => ({
        key,
        label,
        type,
        required,
      })),
    };
    return JSON.stringify(schema, null, 2);
  }, [fields]);

  function addField() {
    setFields((prev) => [
      ...prev,
      { id: generateId(), key: '', label: '', type: 'string', required: false },
    ]);
    setFieldError(null);
  }

  function removeField(index: number) {
    setFields((prev) => prev.filter((_, i) => i !== index));
    setManualKeys((prev) => {
      const next = new Set(prev);
      next.delete(index.toString());
      return next;
    });
  }

  function updateField<K extends keyof FieldRow>(index: number, field: K, value: FieldRow[K]) {
    setFields((prev) =>
      prev.map((row, i) => {
        if (i !== index) return row;
        const updated = { ...row, [field]: value };
        // Auto-slugify key from label unless manually overridden
        if (field === 'label' && !manualKeys.has(index.toString())) {
          updated.key = slugify(value as string);
        }
        return updated;
      })
    );
  }

  function handleKeyChange(index: number, value: string) {
    setManualKeys((prev) => new Set(prev).add(index.toString()));
    updateField(index, 'key', value);
  }

  function handleDragStart(index: number) {
    setDraggingIndex(index);
  }

  function handleDragOver(e: React.DragEvent, targetIndex: number) {
    e.preventDefault();
    if (draggingIndex === null || draggingIndex === targetIndex) return;
    setFields((prev) => {
      const next = [...prev];
      const [item] = next.splice(draggingIndex, 1);
      next.splice(targetIndex, 0, item);
      return next;
    });
    setDraggingIndex(targetIndex);
  }

  function handleDrop() {
    setDraggingIndex(null);
  }

  function validateFields(): boolean {
    if (fields.length === 0) {
      setFieldError('Add at least one field.');
      return false;
    }
    for (let i = 0; i < fields.length; i++) {
      const f = fields[i];
      if (!f.label.trim()) {
        setFieldError(`Field ${i + 1}: label is required.`);
        return false;
      }
      if (!f.key || !/^[a-z][a-z0-9_]*$/.test(f.key)) {
        setFieldError(
          `Field ${i + 1}: key "${f.key}" must start with a letter and contain only lowercase letters, digits, and underscores.`
        );
        return false;
      }
    }
    const keys = fields.map((f) => f.key);
    const dupes = keys.filter((k, i) => keys.indexOf(k) !== i);
    if (dupes.length > 0) {
      setFieldError(`Duplicate field key: "${dupes[0]}".`);
      return false;
    }
    setFieldError(null);
    return true;
  }

  async function onSubmit(values: FormValues) {
    if (!validateFields()) return;

    const metadataSchema = {
      fields: fields.map(({ key, label, type, required }) => ({
        key,
        label,
        type,
        required,
      })),
    };

    try {
      let result: CredentialType;
      if (mode === 'create') {
        const res = await createCredentialType({
          name: values.name,
          description: values.description || undefined,
          metadataSchema,
        });
        result = res.credentialType;
        toast.success(`Credential type created (v${result.schemaVersion})`);
      } else {
        const res = await updateCredentialType(initialData!.id, {
          name: values.name,
          description: values.description || undefined,
          metadataSchema,
        });
        result = res.credentialType;
        toast.success(`Credential type updated (v${result.schemaVersion})`);
      }
      onSuccess(result);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setError('name', { message: 'A credential type with this name already exists' });
      } else if (err instanceof Error) {
        toast.error(err.message);
      } else {
        toast.error('Something went wrong');
      }
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={mode === 'create' ? 'New Credential Type' : 'Edit Credential Type'}
      size="xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
        {/* Name + Description */}
        <div className="flex flex-col gap-4">
          <Input label="Name" error={errors.name?.message} {...register('name')} />
          <Textarea
            label="Description"
            hint="Optional — shown to members when submitting credentials."
            error={errors.description?.message}
            {...register('description')}
          />
        </div>

        {/* Schema builder */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3
              className="text-sm font-semibold text-[var(--color-text)]"
              style={{ fontFamily: 'Syne, sans-serif' }}
            >
              Fields
            </h3>
            <Button type="button" variant="secondary" size="sm" onClick={addField}>
              + Add field
            </Button>
          </div>

          <div className="md:grid md:grid-cols-2 md:gap-4">
            {/* Left: field rows */}
            <div className="flex flex-col gap-2">
              {fields.length === 0 && (
                <p className="text-sm text-[var(--color-text-muted)] py-4 text-center border border-dashed border-[var(--color-border)] rounded-lg">
                  No fields yet. Click "+ Add field" to start.
                </p>
              )}
              {fields.map((row, index) => (
                <div
                  key={row.id}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDrop={handleDrop}
                  className={[
                    'border border-[var(--color-border)] rounded-lg p-3 bg-white flex flex-col gap-2 cursor-grab active:cursor-grabbing',
                    draggingIndex === index ? 'opacity-50' : '',
                  ].join(' ')}
                >
                  <div className="flex items-center gap-2">
                    {/* Drag handle */}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-[var(--color-text-muted)] shrink-0"
                      aria-hidden="true"
                    >
                      <circle cx="9" cy="5" r="1" fill="currentColor" stroke="none" />
                      <circle cx="15" cy="5" r="1" fill="currentColor" stroke="none" />
                      <circle cx="9" cy="12" r="1" fill="currentColor" stroke="none" />
                      <circle cx="15" cy="12" r="1" fill="currentColor" stroke="none" />
                      <circle cx="9" cy="19" r="1" fill="currentColor" stroke="none" />
                      <circle cx="15" cy="19" r="1" fill="currentColor" stroke="none" />
                    </svg>
                    <span className="text-xs font-medium text-[var(--color-text-muted)]">
                      Field {index + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeField(index)}
                      className="ml-auto text-[var(--color-text-muted)] hover:text-[var(--color-danger)] transition-colors"
                      aria-label={`Remove field ${index + 1}`}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      label="Label"
                      value={row.label}
                      onChange={(e) => updateField(index, 'label', e.target.value)}
                    />
                    <Input
                      label="Key"
                      value={row.key}
                      onChange={(e) => handleKeyChange(index, e.target.value)}
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <Select
                        label="Type"
                        value={row.type}
                        onChange={(e) =>
                          updateField(index, 'type', e.target.value as FieldRow['type'])
                        }
                        options={[
                          { value: 'string', label: 'Text' },
                          { value: 'number', label: 'Number' },
                          { value: 'date', label: 'Date' },
                        ]}
                      />
                    </div>
                    <div className="flex items-center gap-2 pt-5">
                      <Toggle
                        label="Required"
                        checked={row.required}
                        onChange={(v) => updateField(index, 'required', v)}
                        size="sm"
                      />
                      <span className="text-xs text-[var(--color-text-muted)]">Required</span>
                    </div>
                  </div>
                </div>
              ))}

              {fieldError && (
                <p className="text-sm text-[var(--color-danger)]" role="alert">
                  {fieldError}
                </p>
              )}
            </div>

            {/* Right: JSON preview */}
            <div className="mt-4 md:mt-0">
              <p className="text-xs font-medium text-[var(--color-text-muted)] mb-1">
                Schema preview
              </p>
              <pre
                className="text-xs bg-[var(--color-bg-subtle)] border border-[var(--color-border)] rounded-lg p-3 overflow-auto max-h-72 text-[var(--color-text)]"
                style={{ fontFamily: 'DM Mono, monospace' }}
              >
                {jsonPreview}
              </pre>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={isSubmitting}>
            {mode === 'create' ? 'Create' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
