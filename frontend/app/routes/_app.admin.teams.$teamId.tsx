import { useLoaderData } from 'react-router';
import type { ClientLoaderFunctionArgs } from 'react-router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { getTeam, listTeamMembers, createInvite } from '~/lib/api/teams';
import { useRequireRole } from '~/lib/auth/hooks';
import { toast } from '~/lib/toast';
import { ApiError } from '~/lib/api/client';
import { Button } from '~/components/ui/Button';
import { Input } from '~/components/ui/Input';
import { Select } from '~/components/ui/Select';
import type { TeamMember, Invite } from '~/lib/types';

export const handle = { title: 'Team Detail' };

export async function clientLoader({ params }: ClientLoaderFunctionArgs) {
  const [teamData, membersData] = await Promise.all([
    getTeam(params.teamId!),
    listTeamMembers(params.teamId!),
  ]);
  return { team: teamData.team, members: membersData.members };
}

const inviteSchema = z.object({
  email: z.string().min(1, 'Required').email('Enter a valid email'),
  role: z.enum(['manager', 'member'], { error: 'Required' }),
});

type InviteForm = z.infer<typeof inviteSchema>;

const ROLE_OPTIONS = [
  { value: 'manager', label: 'Manager' },
  { value: 'member', label: 'Member' },
];

function roleBadgeClass(role: TeamMember['role']) {
  if (role === 'manager') {
    return 'bg-teal-100 text-teal-800 border border-teal-200';
  }
  return 'bg-slate-100 text-slate-600 border border-slate-200';
}

export default function TeamDetailPage() {
  useRequireRole(['admin', 'owner']);

  const { team, members } = useLoaderData<typeof clientLoader>();

  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InviteForm>({
    resolver: zodResolver(inviteSchema),
  });

  async function onSubmit(values: InviteForm) {
    try {
      const result = await createInvite({
        email: values.email,
        teamId: team.id,
        role: values.role,
      });
      const invite: Invite = result.invite;
      const link = `${window.location.origin}/invite/${invite.id}`;
      setInviteLink(link);
      toast.success('Invite sent to ' + values.email);
      reset();
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message);
      } else if (err instanceof Error) {
        toast.error(err.message);
      } else {
        toast.error('Something went wrong');
      }
    }
  }

  function handleCopy() {
    if (!inviteLink) return;
    navigator.clipboard.writeText(inviteLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-[var(--color-text)]">
        {team.name} — Team Details
      </h1>

      {/* Members Section */}
      <section>
        <h2 className="text-lg font-semibold text-[var(--color-text)] mb-4">Members</h2>
        {members.length === 0 ? (
          <p className="text-[var(--color-text-muted)]">No members yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-[var(--color-border)]">
            <table className="w-full text-sm">
              <thead className="bg-[var(--color-bg-subtle)] text-[var(--color-text-muted)]">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Name</th>
                  <th className="px-4 py-3 text-left font-medium">Email</th>
                  <th className="px-4 py-3 text-left font-medium">Role</th>
                  <th className="px-4 py-3 text-left font-medium">Joined</th>
                  <th className="px-4 py-3 text-left font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {members.map((member) => (
                  <tr key={member.userId} className="bg-[var(--color-bg)] hover:bg-[var(--color-bg-subtle)] transition-colors">
                    <td className="px-4 py-3 text-[var(--color-text)]">
                      {member.user.firstName} {member.user.lastName}
                    </td>
                    <td className="px-4 py-3 text-[var(--color-text-muted)]">
                      {member.user.email}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${roleBadgeClass(member.role)}`}
                      >
                        {member.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[var(--color-text-muted)]">
                      {format(new Date(member.joinedAt), 'MMM d, yyyy')}
                    </td>
                    <td className="px-4 py-3">
                      <Button variant="ghost" size="sm">
                        Remove
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Invite Member Section */}
      <section>
        <h2 className="text-lg font-semibold text-[var(--color-text)] mb-4">Invite Member</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="flex gap-4 flex-col sm:flex-row">
            <div className="flex-1">
              <Input
                label="Email address"
                type="email"
                error={errors.email?.message}
                {...register('email')}
              />
            </div>
            <div className="flex-1">
              <Select
                label="Role"
                placeholder="Select role"
                options={ROLE_OPTIONS}
                error={errors.role?.message}
                {...register('role')}
              />
            </div>
          </div>
          <Button type="submit" variant="primary" loading={isSubmitting}>
            Send Invite
          </Button>
        </form>

        {inviteLink && (
          <div className="mt-4 p-3 bg-[var(--color-bg-subtle)] rounded-lg border border-[var(--color-border)] flex items-center gap-2">
            <code className="flex-1 text-sm font-mono text-[var(--color-text)] break-all">
              {inviteLink}
            </code>
            <Button variant="secondary" size="sm" onClick={handleCopy}>
              {copied ? 'Copied!' : 'Copy'}
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}
