import { useLoaderData, useNavigate, useParams } from 'react-router';
import type { ClientLoaderFunctionArgs } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getInvite, acceptInvite } from '~/lib/api/teams';
import { setToken } from '~/lib/auth/tokenStore';
import { toast } from '~/lib/toast';
import { ApiError } from '~/lib/api/client';
import { Button } from '~/components/ui/Button';
import { Input } from '~/components/ui/Input';
import type { Invite } from '~/lib/types';

export const handle = { title: 'Accept Invite' };

export async function clientLoader({ params }: ClientLoaderFunctionArgs) {
  try {
    const data = await getInvite(params.token!);
    return { invite: data.invite, error: null };
  } catch {
    // Invalid/expired/used token
    return { invite: null, error: 'expired' as const };
  }
}

const inviteSchema = z
  .object({
    firstName: z.string().min(1, 'Required'),
    lastName: z.string().min(1, 'Required'),
    dob: z.string().min(1, 'Required'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Required'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type InviteFormData = z.infer<typeof inviteSchema>;

interface LoaderData {
  invite: (Invite & { teamName: string }) | null;
  error: 'expired' | null;
}

function ExpiredCard() {
  return (
    <div className="text-center">
      <h2
        className="text-xl font-semibold mb-2"
        style={{ fontFamily: 'Syne, system-ui' }}
      >
        Invite Link Invalid
      </h2>
      <p className="text-[var(--color-text-muted)]">
        This invite link has expired or has already been used.
      </p>
    </div>
  );
}

function InviteForm({
  invite,
  token,
}: {
  invite: Invite & { teamName: string };
  token: string;
}) {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<InviteFormData>({
    resolver: zodResolver(inviteSchema),
  });

  async function onSubmit(data: InviteFormData) {
    try {
      const result = await acceptInvite(token, {
        firstName: data.firstName,
        lastName: data.lastName,
        dob: data.dob,
        password: data.password,
      });
      setToken(result.accessToken);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message);
      } else {
        toast.error('Something went wrong');
      }
    }
  }

  return (
    <>
      <h1
        className="text-2xl font-semibold mb-2"
        style={{ color: 'var(--color-text)', fontFamily: 'Syne, system-ui' }}
      >
        You&apos;ve been invited to join {invite.teamName}
      </h1>
      <p className="text-sm mb-6 text-[var(--color-text-muted)]">
        Role: <span className="font-medium capitalize">{invite.role}</span>
      </p>

      <div className="mb-6 px-3 py-2 rounded-md border border-[var(--color-border)] bg-[var(--color-bg-subtle)]">
        <p className="text-xs text-[var(--color-text-muted)] mb-0.5">Email</p>
        <p className="text-sm text-[var(--color-text)]">{invite.email}</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <Input
          label="First name"
          autoComplete="given-name"
          error={errors.firstName?.message}
          {...register('firstName')}
        />
        <Input
          label="Last name"
          autoComplete="family-name"
          error={errors.lastName?.message}
          {...register('lastName')}
        />
        <Input
          label="Date of birth"
          type="date"
          error={errors.dob?.message}
          {...register('dob')}
        />
        <Input
          label="Password"
          type="password"
          autoComplete="new-password"
          error={errors.password?.message}
          {...register('password')}
        />
        <Input
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        <Button type="submit" fullWidth loading={isSubmitting}>
          {isSubmitting ? 'Creating account…' : 'Create account'}
        </Button>
      </form>
    </>
  );
}

export default function InviteAcceptPage() {
  const { invite, error } = useLoaderData() as LoaderData;
  const params = useParams();

  if (error === 'expired' || !invite) {
    return <ExpiredCard />;
  }

  return <InviteForm invite={invite} token={params.token!} />;
}
