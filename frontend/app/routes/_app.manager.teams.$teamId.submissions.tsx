import { useLoaderData } from 'react-router';
import { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { apiFetch, ApiError } from '~/lib/api/client';
import { toast } from '~/lib/toast';
import { Button } from '~/components/ui/Button';
import { Input } from '~/components/ui/Input';
import { Select } from '~/components/ui/Select';
import { Textarea } from '~/components/ui/Textarea';
import { Modal } from '~/components/ui/Modal';
import { MetadataTable } from '~/components/credentials/MetadataTable';
import type { MetadataSchema, RejectionReason } from '~/lib/types';

export const handle = { title: 'Submissions' };

interface Submission {
  userId: string;
  credentialId: string;
  submitted: string;
  submittedMetadata: Record<string, unknown> | null;
  firstName: string;
  lastName: string;
  email: string;
  credentialTypeId: string;
  credentialTypeName: string;
  credentialTypeDescription: string | null;
  metadataSchema: MetadataSchema;
}

export async function clientLoader({ params }: { params: { teamId: string } }) {
  const [submissionsRes, reasonsRes] = await Promise.all([
    apiFetch<{ submissions: Submission[] }>(`/api/teams/${params.teamId}/submissions`),
    apiFetch<{ reasons: RejectionReason[] }>('/api/credentials/rejection-reasons'),
  ]);
  return {
    teamId: params.teamId,
    submissions: submissionsRes.submissions,
    rejectionReasons: reasonsRes.reasons,
  };
}

function formatDate(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'MMM d, yyyy');
  } catch {
    return dateStr;
  }
}

function SectionLabel({ children, color }: { children: React.ReactNode; color?: string }) {
  return (
    <p
      className="text-xs font-semibold uppercase tracking-widest mb-3"
      style={{ color: color ?? 'var(--color-text-muted)', fontFamily: 'DM Mono, monospace' }}
    >
      {children}
    </p>
  );
}

export default function ManagerSubmissionsPage() {
  const { teamId, submissions: initial, rejectionReasons } = useLoaderData<typeof clientLoader>();

  const [submissions, setSubmissions] = useState<Submission[]>(initial);
  const [reviewTarget, setReviewTarget] = useState<Submission | null>(null);

  // Document
  const [docLoading, setDocLoading] = useState(false);

  // Verify form
  const [expirationDate, setExpirationDate] = useState('');
  const [verifyNotes, setVerifyNotes] = useState('');
  const [verifyMetadata, setVerifyMetadata] = useState<Record<string, string>>({});
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyError, setVerifyError] = useState('');

  // Reject form
  const [rejectReasonId, setRejectReasonId] = useState('');
  const [rejectNotes, setRejectNotes] = useState('');
  const [rejectLoading, setRejectLoading] = useState(false);
  const [rejectError, setRejectError] = useState('');

  // Pre-populate verify metadata from submitted values whenever a new card is opened
  useEffect(() => {
    if (!reviewTarget) return;
    const initial: Record<string, string> = {};
    for (const field of reviewTarget.metadataSchema.fields) {
      const val = reviewTarget.submittedMetadata?.[field.key];
      initial[field.key] = val != null ? String(val) : '';
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVerifyMetadata(initial);
    setExpirationDate('');
    setVerifyNotes('');
    setVerifyError('');
    setRejectReasonId('');
    setRejectNotes('');
    setRejectError('');
  }, [reviewTarget]);

  function closeModal() {
    if (verifyLoading || rejectLoading) return;
    setReviewTarget(null);
  }

  function removeFromList(sub: Submission) {
    setSubmissions((prev) =>
      prev.filter((s) => !(s.userId === sub.userId && s.credentialId === sub.credentialId))
    );
  }

  async function handleOpenDocument() {
    if (!reviewTarget) return;
    setDocLoading(true);
    try {
      const { view_url } = await apiFetch<{ view_url: string; expires_in: number }>(
        `/api/teams/${teamId}/submissions/${reviewTarget.userId}/${reviewTarget.credentialId}/document`
      );
      window.open(view_url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to load document');
    } finally {
      setDocLoading(false);
    }
  }

  async function handleVerify() {
    if (!reviewTarget) return;
    if (!expirationDate) {
      setVerifyError('Expiration date is required');
      return;
    }
    setVerifyLoading(true);
    setVerifyError('');
    try {
      await apiFetch(
        `/api/teams/${teamId}/users/${reviewTarget.userId}/credentials/${reviewTarget.credentialId}/verify`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            expiration_date: expirationDate,
            review_notes: verifyNotes || undefined,
            verified_metadata: verifyMetadata,
          }),
        }
      );
      removeFromList(reviewTarget);
      setReviewTarget(null);
      toast.success('Credential verified');
    } catch (err) {
      setVerifyError(err instanceof ApiError ? err.message : 'Verification failed');
    } finally {
      setVerifyLoading(false);
    }
  }

  async function handleReject() {
    if (!reviewTarget || !rejectReasonId) return;
    setRejectLoading(true);
    setRejectError('');
    try {
      await apiFetch(
        `/api/teams/${teamId}/users/${reviewTarget.userId}/credentials/${reviewTarget.credentialId}/reject`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            rejection_reason_id: rejectReasonId,
            review_notes: rejectNotes || undefined,
          }),
        }
      );
      removeFromList(reviewTarget);
      setReviewTarget(null);
      toast.success('Credential rejected');
    } catch (err) {
      setRejectError(err instanceof ApiError ? err.message : 'Rejection failed');
    } finally {
      setRejectLoading(false);
    }
  }

  // eslint-disable-next-line react-hooks/purity
  const minDate = new Date(Date.now() + 86_400_000).toISOString().split('T')[0];

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1
          className="text-2xl font-bold text-[var(--color-text)]"
          style={{ fontFamily: 'Syne, sans-serif' }}
        >
          Pending Submissions
        </h1>
        {submissions.length > 0 && (
          <span
            className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[var(--color-accent-dim)] text-[var(--color-accent)]"
          >
            {submissions.length} pending
          </span>
        )}
      </div>

      {submissions.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-[var(--color-text-muted)]">No pending submissions.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {submissions.map((sub) => (
            <div
              key={`${sub.userId}-${sub.credentialId}`}
              className="bg-white border border-[var(--color-border)] rounded-xl p-5 shadow-sm flex items-center gap-4"
            >
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[var(--color-text)]">
                  {sub.firstName} {sub.lastName}
                </p>
                <p className="text-sm text-[var(--color-text-muted)] truncate">{sub.email}</p>
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  <span className="text-sm text-[var(--color-text)]">{sub.credentialTypeName}</span>
                  <span className="text-xs text-[var(--color-text-muted)]">
                    Submitted {formatDate(sub.submitted)}
                  </span>
                </div>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setReviewTarget(sub)}
                className="shrink-0"
              >
                Review
              </Button>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={reviewTarget !== null}
        onClose={closeModal}
        title={reviewTarget ? reviewTarget.credentialTypeName : ''}
        size="xl"
      >
        {reviewTarget && (
          <div className="space-y-6 pb-2">

            {/* Member info strip */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--color-bg-subtle)] border border-[var(--color-border)]">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold shrink-0"
                style={{ backgroundColor: 'var(--color-accent-dim)', color: 'var(--color-accent)' }}
              >
                {reviewTarget.firstName[0]}{reviewTarget.lastName[0]}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-[var(--color-text)]">
                  {reviewTarget.firstName} {reviewTarget.lastName}
                </p>
                <p className="text-xs text-[var(--color-text-muted)] truncate">{reviewTarget.email}</p>
              </div>
              <span className="ml-auto text-xs text-[var(--color-text-muted)] shrink-0">
                {formatDate(reviewTarget.submitted)}
              </span>
            </div>

            {/* Document */}
            <section>
              <SectionLabel>Document</SectionLabel>
              <Button variant="secondary" size="sm" onClick={handleOpenDocument} loading={docLoading}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
                Open Document
              </Button>
            </section>

            <hr className="border-[var(--color-border)]" />

            {/* Submitted metadata */}
            {reviewTarget.metadataSchema.fields.length > 0 && (
              <>
                <section>
                  <MetadataTable
                    schema={reviewTarget.metadataSchema}
                    metadata={reviewTarget.submittedMetadata ?? {}}
                    label="Submitted Information"
                  />
                </section>
                <hr className="border-[var(--color-border)]" />
              </>
            )}

            {/* Verify */}
            <section>
              <SectionLabel color="var(--color-accent)">Verify</SectionLabel>
              <div className="space-y-4">
                <Input
                  label="Expiration Date"
                  type="date"
                  value={expirationDate}
                  min={minDate}
                  onChange={(e) => setExpirationDate(e.target.value)}
                />
                {reviewTarget.metadataSchema.fields.map((field) => (
                  <Input
                    key={field.key}
                    label={`${field.label} (verified)`}
                    type={field.type === 'string' ? 'text' : field.type}
                    value={verifyMetadata[field.key] ?? ''}
                    onChange={(e) =>
                      setVerifyMetadata((prev) => ({ ...prev, [field.key]: e.target.value }))
                    }
                  />
                ))}
                <Textarea
                  label="Review Notes (optional)"
                  value={verifyNotes}
                  onChange={(e) => setVerifyNotes(e.target.value)}
                  placeholder="Internal notes about this verification…"
                />
                {verifyError && (
                  <p className="text-sm text-[var(--color-danger)]" role="alert">
                    {verifyError}
                  </p>
                )}
                <Button variant="primary" onClick={handleVerify} loading={verifyLoading}>
                  Verify Credential
                </Button>
              </div>
            </section>

            <hr className="border-[var(--color-border)]" />

            {/* Reject */}
            <section>
              <SectionLabel color="var(--color-danger)">Reject</SectionLabel>
              <div className="space-y-4">
                <Select
                  label="Rejection Reason"
                  value={rejectReasonId}
                  onChange={(e) => setRejectReasonId(e.target.value)}
                  options={rejectionReasons.map((r) => ({ value: r.id, label: r.label }))}
                  placeholder="Select a reason…"
                />
                <Textarea
                  label="Review Notes (optional)"
                  value={rejectNotes}
                  onChange={(e) => setRejectNotes(e.target.value)}
                  placeholder="Additional context for the member…"
                />
                {rejectError && (
                  <p className="text-sm text-[var(--color-danger)]" role="alert">
                    {rejectError}
                  </p>
                )}
                <Button
                  variant="danger"
                  onClick={handleReject}
                  loading={rejectLoading}
                  disabled={!rejectReasonId}
                >
                  Reject Credential
                </Button>
              </div>
            </section>

          </div>
        )}
      </Modal>
    </>
  );
}
