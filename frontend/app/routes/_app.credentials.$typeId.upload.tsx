import { useLoaderData, useNavigate, useParams } from 'react-router';
import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { listCredentialTypes } from '~/lib/api/credentialTypes';
import { requestUploadUrl, confirmUpload } from '~/lib/api/credentials';
import { buildMetadataValidator } from '~/lib/utils/schema';
import { toast } from '~/lib/toast';
import { Button } from '~/components/ui/Button';
import { Input } from '~/components/ui/Input';
import { ApiError } from '~/lib/api/client';
import type { CredentialType } from '~/lib/types';

export const handle = { title: 'Upload Document' };

export async function clientLoader({ params }: { params: { typeId: string } }) {
  const { credentialTypes } = await listCredentialTypes();
  const credentialType = credentialTypes.find((ct) => ct.id === params.typeId);
  if (!credentialType) {
    throw new Response('Credential type not found', { status: 404 });
  }
  return { credentialType };
}

// ---- Step indicator ----

const STEPS = ['Select File', 'Details', 'Review'] as const;

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {STEPS.map((label, idx) => (
        <div key={label} className="flex items-center gap-2">
          <div className="flex flex-col items-center gap-1">
            <div
              className={[
                'w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors',
                idx < current
                  ? 'bg-[var(--color-accent)] text-[var(--color-sidebar)]'
                  : idx === current
                  ? 'border-2 border-[var(--color-accent)] text-[var(--color-accent)]'
                  : 'border-2 border-[var(--color-border)] text-[var(--color-text-muted)]',
              ].join(' ')}
            >
              {idx < current ? (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                idx + 1
              )}
            </div>
            <span
              className={`text-xs ${idx === current ? 'text-[var(--color-accent)] font-medium' : 'text-[var(--color-text-muted)]'}`}
            >
              {label}
            </span>
          </div>
          {idx < STEPS.length - 1 && (
            <div
              className={`h-0.5 w-10 mb-4 transition-colors ${idx < current ? 'bg-[var(--color-accent)]' : 'bg-[var(--color-border)]'}`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ---- Step 1: File select ----

const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];

interface Step1Props {
  credentialType: CredentialType;
  onNext: (file: File, uploadUrl: string, objectKey: string) => void;
}

function Step1({ credentialType, onNext }: Step1Props) {
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function validateFile(f: File): string {
    if (!ALLOWED_TYPES.includes(f.type)) {
      return 'Only JPEG, PNG, and PDF files are accepted.';
    }
    if (f.size > MAX_BYTES) {
      return 'File must be 10 MB or smaller.';
    }
    return '';
  }

  function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    const f = files[0];
    const err = validateFile(f);
    if (err) {
      setError(err);
      setFile(null);
      return;
    }
    setError('');
    setFile(f);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  }

  function formatBytes(n: number): string {
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
    return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  }

  async function handleNext() {
    if (!file) {
      setError('Please select a file.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await requestUploadUrl(credentialType.id, {
        filename: file.name,
        contentType: file.type,
      });
      onNext(file, res.uploadUrl, res.objectKey);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to prepare upload. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const isPdf = file?.type === 'application/pdf';
  const isImage = file && (file.type === 'image/jpeg' || file.type === 'image/png');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-[var(--color-text)] mb-1" style={{ fontFamily: 'Syne, sans-serif' }}>
          Select File
        </h2>
        <p className="text-sm text-[var(--color-text-muted)]">{credentialType.name}</p>
      </div>

      {/* Drop zone */}
      <div
        className={[
          'relative border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer',
          dragOver
            ? 'border-[var(--color-accent)] bg-[var(--color-accent-dim)]'
            : 'border-[var(--color-border)] hover:border-[var(--color-accent)] hover:bg-[var(--color-accent-dim)]',
        ].join(' ')}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
        aria-label="File drop zone"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,application/pdf"
          className="sr-only"
          onChange={(e) => handleFiles(e.target.files)}
        />

        {!file ? (
          <div>
            <svg
              className="mx-auto mb-3 text-[var(--color-text-muted)]"
              width="40" height="40" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="1.5" aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            <p className="text-sm text-[var(--color-text)]">
              Drop your file here or <span className="text-[var(--color-accent)] font-medium">click to browse</span>
            </p>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">JPEG, PNG, PDF — max 10 MB</p>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-4">
            {isImage && (
              <img
                src={URL.createObjectURL(file)}
                alt="Preview"
                className="h-16 w-16 rounded-md object-cover border border-[var(--color-border)]"
              />
            )}
            {isPdf && (
              <div className="flex items-center justify-center w-16 h-16 rounded-md bg-red-50 border border-red-200">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.5" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            )}
            <div className="text-left">
              <p className="text-sm font-medium text-[var(--color-text)]">{file.name}</p>
              <p className="text-xs text-[var(--color-text-muted)]">{formatBytes(file.size)}</p>
              <button
                type="button"
                className="text-xs text-[var(--color-accent)] hover:underline mt-1"
                onClick={(e) => { e.stopPropagation(); setFile(null); }}
              >
                Change file
              </button>
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm text-[var(--color-danger)]" role="alert">{error}</p>
      )}

      <div className="flex justify-end">
        <Button variant="primary" onClick={handleNext} loading={loading} disabled={!file}>
          Next: Enter Details
        </Button>
      </div>
    </div>
  );
}

// ---- Step 2: Metadata form ----

interface Step2Props {
  credentialType: CredentialType;
  onBack: () => void;
  onSubmit: (metadata: Record<string, unknown>) => Promise<void>;
  loading: boolean;
  error: string;
}

function Step2({ credentialType, onBack, onSubmit, loading, error }: Step2Props) {
  const schema = buildMetadataValidator(credentialType.metadataSchema);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Record<string, unknown>>({
    resolver: zodResolver(schema),
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-[var(--color-text)] mb-1" style={{ fontFamily: 'Syne, sans-serif' }}>
          Credential Information
        </h2>
        <p className="text-sm text-[var(--color-text-muted)]">{credentialType.name}</p>
      </div>

      <form onSubmit={handleSubmit((data) => onSubmit(data))} className="space-y-4">
        {credentialType.metadataSchema.fields.map((field) => (
          <Input
            key={field.key}
            label={field.label}
            type={field.type === 'string' ? 'text' : field.type}
            error={errors[field.key]?.message as string | undefined}
            {...register(field.key)}
          />
        ))}

        {error && (
          <p className="text-sm text-[var(--color-danger)]" role="alert">{error}</p>
        )}

        <div className="flex justify-between pt-2">
          <Button type="button" variant="secondary" onClick={onBack} disabled={loading}>
            Back
          </Button>
          <Button type="submit" variant="primary" loading={loading}>
            Submit
          </Button>
        </div>
      </form>
    </div>
  );
}

// ---- Step 3: Error / retry panel ----

interface Step3Props {
  r2Failed: boolean;
  onRetryConfirm: () => void;
  onStartOver: () => void;
  confirmError: string;
  loading: boolean;
}

function Step3({ r2Failed, onRetryConfirm, onStartOver, confirmError, loading }: Step3Props) {
  return (
    <div className="space-y-6 text-center">
      <div className="text-[var(--color-danger)]">
        <svg className="mx-auto mb-3" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <h2 className="text-xl font-semibold" style={{ fontFamily: 'Syne, sans-serif' }}>
          {r2Failed ? 'Upload Failed' : 'Confirmation Failed'}
        </h2>
        <p className="text-sm text-[var(--color-text-muted)] mt-2">
          {r2Failed
            ? 'The file could not be uploaded. Please try again.'
            : 'The file was uploaded but confirmation failed. You can retry without re-uploading.'}
        </p>
        {confirmError && (
          <p className="text-sm text-[var(--color-danger)] mt-2">{confirmError}</p>
        )}
      </div>

      <div className="flex justify-center gap-3">
        {r2Failed ? (
          <Button variant="primary" onClick={onStartOver}>
            Start Over
          </Button>
        ) : (
          <>
            <Button variant="secondary" onClick={onStartOver}>
              Start Over
            </Button>
            <Button variant="primary" onClick={onRetryConfirm} loading={loading}>
              Retry Confirmation
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

// ---- Main wizard ----

export default function UploadWizardPage() {
  const { credentialType } = useLoaderData<typeof clientLoader>();
  const navigate = useNavigate();
  const params = useParams<{ typeId: string }>();

  const [step, setStep] = useState<0 | 1 | 2>(0);

  // State persisted across steps
  const [file, setFile] = useState<File | null>(null);
  const [uploadUrl, setUploadUrl] = useState('');
  const [objectKey, setObjectKey] = useState('');
  const [pendingMetadata, setPendingMetadata] = useState<Record<string, unknown>>({});

  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [r2Failed, setR2Failed] = useState(false);
  const [confirmError, setConfirmError] = useState('');

  const [progress, setProgress] = useState(0);

  function handleStep1Next(f: File, url: string, key: string) {
    setFile(f);
    setUploadUrl(url);
    setObjectKey(key);
    setStep(1);
  }

  async function handleStep2Submit(metadata: Record<string, unknown>) {
    if (!file) return;
    setUploadLoading(true);
    setUploadError('');
    setProgress(0);

    // PUT to R2 using XHR for progress
    let r2Ok = false;
    try {
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', uploadUrl);
        xhr.setRequestHeader('Content-Type', file.type);
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve();
          else reject(new Error(`Upload failed: ${xhr.status}`));
        };
        xhr.onerror = () => reject(new Error('Network error during upload'));
        xhr.send(file);
      });
      r2Ok = true;
    } catch {
      setR2Failed(true);
      setStep(2);
      setUploadLoading(false);
      return;
    }

    if (!r2Ok) return;

    // Confirm upload
    setPendingMetadata(metadata);
    try {
      await confirmUpload(params.typeId!, { objectKey, submittedMetadata: metadata });
      toast.success('Credential submitted for review');
      navigate('/credentials', { replace: true });
    } catch (err) {
      setR2Failed(false);
      setConfirmError(err instanceof ApiError ? err.message : 'Confirmation failed');
      setStep(2);
    } finally {
      setUploadLoading(false);
    }
  }

  async function handleRetryConfirm() {
    setUploadLoading(true);
    setConfirmError('');
    try {
      await confirmUpload(params.typeId!, {
        objectKey,
        submittedMetadata: pendingMetadata,
      });
      toast.success('Credential submitted for review');
      navigate('/credentials', { replace: true });
    } catch (err) {
      setConfirmError(err instanceof ApiError ? err.message : 'Confirmation failed');
    } finally {
      setUploadLoading(false);
    }
  }

  function startOver() {
    setFile(null);
    setUploadUrl('');
    setObjectKey('');
    setPendingMetadata({});
    setProgress(0);
    setR2Failed(false);
    setConfirmError('');
    setUploadError('');
    setStep(0);
  }

  return (
    <div className="max-w-xl mx-auto">
      <StepIndicator current={step} />

      {/* Upload progress bar (shown during step 2 submit) */}
      {uploadLoading && step === 1 && (
        <div className="mb-4">
          <div className="h-1.5 bg-[var(--color-border)] rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--color-accent)] transition-all duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-[var(--color-text-muted)] mt-1 text-right">
            {progress}%
          </p>
        </div>
      )}

      <div className="bg-white border border-[var(--color-border)] rounded-xl p-6 shadow-sm">
        {step === 0 && (
          <Step1
            credentialType={credentialType}
            onNext={handleStep1Next}
          />
        )}
        {step === 1 && (
          <Step2
            credentialType={credentialType}
            onBack={() => setStep(0)}
            onSubmit={handleStep2Submit}
            loading={uploadLoading}
            error={uploadError}
          />
        )}
        {step === 2 && (
          <Step3
            r2Failed={r2Failed}
            onRetryConfirm={handleRetryConfirm}
            onStartOver={startOver}
            confirmError={confirmError}
            loading={uploadLoading}
          />
        )}
      </div>
    </div>
  );
}
