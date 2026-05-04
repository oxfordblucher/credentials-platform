import { useLoaderData, useSearchParams } from 'react-router';
import { useMemo, useState } from 'react';
import {
  listCredentialTypes,
  deactivateCredentialType,
} from '~/lib/api/credentialTypes';
import { useRequireRole } from '~/lib/auth/hooks';
import { toast } from '~/lib/toast';
import { ApiError } from '~/lib/api/client';
import { Button } from '~/components/ui/Button';
import { ConfirmDialog } from '~/components/ui/ConfirmDialog';
import { CredentialTypeModal } from '~/components/credentials/CredentialTypeModal';
import type { CredentialType } from '~/lib/types';

export const handle = { title: 'Credential Types' };

export async function clientLoader() {
  return listCredentialTypes({ includeDeactivated: true });
}

export default function AdminCredentialTypesPage() {
  useRequireRole(['admin', 'owner']);

  const loaderData = useLoaderData<typeof clientLoader>();
  const [credentialTypes, setCredentialTypes] = useState<CredentialType[]>(
    loaderData.credentialTypes
  );
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') === 'deactivated' ? 'deactivated' : 'active';

  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<CredentialType | null>(null);

  const [menuOpen, setMenuOpen] = useState<Record<string, boolean>>({});
  const [confirmOpen, setConfirmOpen] = useState<Record<string, boolean>>({});
  const [deactivating, setDeactivating] = useState<Record<string, boolean>>({});
  const [deactivateWarning, setDeactivateWarning] = useState<Record<string, string>>({});

  const activeTypes = useMemo(
    () => credentialTypes.filter((ct) => ct.deactivatedAt === null),
    [credentialTypes]
  );
  const deactivatedTypes = useMemo(
    () => credentialTypes.filter((ct) => ct.deactivatedAt !== null),
    [credentialTypes]
  );

  const displayed = activeTab === 'active' ? activeTypes : deactivatedTypes;

  function openCreate() {
    setEditTarget(null);
    setModalOpen(true);
  }

  function openEdit(ct: CredentialType) {
    setEditTarget(ct);
    setModalOpen(true);
    setMenuOpen((prev) => ({ ...prev, [ct.id]: false }));
  }

  function handleSuccess(ct: CredentialType) {
    setCredentialTypes((prev) => {
      const idx = prev.findIndex((t) => t.id === ct.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = ct;
        return next;
      }
      return [ct, ...prev];
    });
    setModalOpen(false);
  }

  function toggleMenu(id: string) {
    setMenuOpen((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function openConfirm(id: string) {
    setConfirmOpen((prev) => ({ ...prev, [id]: true }));
    setMenuOpen((prev) => ({ ...prev, [id]: false }));
    setDeactivateWarning((prev) => ({ ...prev, [id]: '' }));
  }

  function closeConfirm(id: string) {
    setConfirmOpen((prev) => ({ ...prev, [id]: false }));
  }

  async function handleDeactivate(id: string) {
    setDeactivating((prev) => ({ ...prev, [id]: true }));
    try {
      await deactivateCredentialType(id);
      setCredentialTypes((prev) =>
        prev.map((ct) =>
          ct.id === id ? { ...ct, deactivatedAt: new Date().toISOString() } : ct
        )
      );
      closeConfirm(id);
      toast.success('Credential type deactivated');
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        const msg =
          err.message || 'This credential type is still used by active team requirements.';
        setDeactivateWarning((prev) => ({ ...prev, [id]: msg }));
      } else if (err instanceof Error) {
        toast.error(err.message);
      } else {
        toast.error('Something went wrong');
      }
    } finally {
      setDeactivating((prev) => ({ ...prev, [id]: false }));
    }
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1
          className="text-2xl font-bold text-[var(--color-text)]"
          style={{ fontFamily: 'Syne, sans-serif' }}
        >
          Credential Types
        </h1>
        <Button variant="primary" onClick={openCreate}>
          New Credential Type
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-[var(--color-border)]">
        <button
          type="button"
          onClick={() => setSearchParams({})}
          className={[
            'px-4 py-2 text-sm font-medium transition-colors -mb-px border-b-2',
            activeTab === 'active'
              ? 'border-[var(--color-accent)] text-[var(--color-accent)]'
              : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text)]',
          ].join(' ')}
        >
          Active
          {activeTypes.length > 0 && (
            <span className="ml-2 text-xs bg-[var(--color-bg-subtle)] border border-[var(--color-border)] rounded-full px-1.5 py-0.5">
              {activeTypes.length}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setSearchParams({ tab: 'deactivated' })}
          className={[
            'px-4 py-2 text-sm font-medium transition-colors -mb-px border-b-2',
            activeTab === 'deactivated'
              ? 'border-[var(--color-accent)] text-[var(--color-accent)]'
              : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text)]',
          ].join(' ')}
        >
          Deactivated
          {deactivatedTypes.length > 0 && (
            <span className="ml-2 text-xs bg-[var(--color-bg-subtle)] border border-[var(--color-border)] rounded-full px-1.5 py-0.5">
              {deactivatedTypes.length}
            </span>
          )}
        </button>
      </div>

      {/* Cards */}
      {displayed.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-[var(--color-text-muted)]">
            {activeTab === 'active'
              ? 'No credential types yet. Create one to get started.'
              : 'No deactivated credential types.'}
          </p>
          {activeTab === 'active' && (
            <Button className="mt-4" onClick={openCreate}>
              New Credential Type
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayed.map((ct) => (
            <div
              key={ct.id}
              className="bg-white border border-[var(--color-border)] rounded-xl p-5 shadow-sm relative"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <h2
                  className="text-base font-semibold text-[var(--color-text)] leading-snug"
                  style={{ fontFamily: 'Syne, sans-serif' }}
                >
                  {ct.name}
                </h2>

                {/* Three-dot menu — only shown on active tab */}
                {activeTab === 'active' && (
                  <div className="relative shrink-0">
                    <button
                      type="button"
                      onClick={() => toggleMenu(ct.id)}
                      className="p-1 rounded-md text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-subtle)] transition-colors"
                      aria-label="Options"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <circle cx="12" cy="5" r="1.5" />
                        <circle cx="12" cy="12" r="1.5" />
                        <circle cx="12" cy="19" r="1.5" />
                      </svg>
                    </button>

                    {menuOpen[ct.id] && (
                      <div className="absolute right-0 top-7 z-10 bg-white border border-[var(--color-border)] rounded-lg shadow-md py-1 min-w-[140px]">
                        <button
                          type="button"
                          className="w-full text-left px-3 py-2 text-sm hover:bg-[var(--color-bg-subtle)] text-[var(--color-text)] transition-colors"
                          onClick={() => openEdit(ct)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="w-full text-left px-3 py-2 text-sm hover:bg-[var(--color-bg-subtle)] text-[var(--color-danger)] transition-colors"
                          onClick={() => openConfirm(ct.id)}
                        >
                          Deactivate
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {ct.description && (
                <p className="text-sm text-[var(--color-text-muted)] mb-3 line-clamp-2">
                  {ct.description}
                </p>
              )}

              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-[var(--color-bg-subtle)] border border-[var(--color-border)] text-[var(--color-text-muted)]">
                  {ct.metadataSchema.fields.length} field
                  {ct.metadataSchema.fields.length !== 1 ? 's' : ''}
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-[var(--color-bg-subtle)] border border-[var(--color-border)] text-[var(--color-text-muted)]">
                  v{ct.schemaVersion}
                </span>
                {ct.deactivatedAt && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-amber-50 border border-amber-200 text-amber-700">
                    Deactivated
                  </span>
                )}
              </div>

              {/* Inline deactivation confirm */}
              {confirmOpen[ct.id] && (
                <div className="mt-4">
                  <ConfirmDialog
                    message={`Deactivate "${ct.name}"? Members will no longer be able to submit this credential type.`}
                    warning={deactivateWarning[ct.id] || undefined}
                    confirmLabel="Deactivate"
                    loading={deactivating[ct.id]}
                    onConfirm={() => handleDeactivate(ct.id)}
                    onCancel={() => closeConfirm(ct.id)}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit modal */}
      {modalOpen && (
        <CredentialTypeModal
          mode={editTarget ? 'edit' : 'create'}
          initialData={editTarget ?? undefined}
          onSuccess={handleSuccess}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  );
}
