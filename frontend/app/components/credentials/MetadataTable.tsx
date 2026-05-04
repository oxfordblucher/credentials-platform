import { format, parseISO } from 'date-fns';
import type { MetadataSchema } from '~/lib/types';

interface MetadataTableProps {
  schema: MetadataSchema;
  metadata: Record<string, unknown>;
  label?: string;
}

function formatValue(value: unknown, type: string): string {
  if (value === null || value === undefined || value === '') return '—';
  if (type === 'date' && typeof value === 'string') {
    try {
      return format(parseISO(value), 'MMM d, yyyy');
    } catch {
      return String(value);
    }
  }
  return String(value);
}

export function MetadataTable({ schema, metadata, label }: MetadataTableProps) {
  return (
    <div>
      {label && (
        <p className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide mb-2">
          {label}
        </p>
      )}
      <table className="w-full text-sm border-collapse">
        <tbody>
          {schema.fields.map((field) => (
            <tr key={field.key} className="border-b border-[var(--color-border)] last:border-0">
              <th
                className="text-left py-2 pr-4 text-[var(--color-text-muted)] font-medium w-1/3 align-top"
                style={{ fontFamily: 'DM Mono, monospace' }}
              >
                {field.label}
              </th>
              <td className="py-2 text-[var(--color-text)]">
                {formatValue(metadata[field.key], field.type)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
