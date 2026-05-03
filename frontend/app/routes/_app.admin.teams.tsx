import { useLoaderData, Link } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { listTeams, createTeam } from '~/lib/api/teams';
import { useRequireRole } from '~/lib/auth/hooks';
import { toast } from '~/lib/toast';
import { Button } from '~/components/ui/Button';
import { Input } from '~/components/ui/Input';
import { Modal } from '~/components/ui/Modal';
import { ApiError } from '~/lib/api/client';
import type { Team } from '~/lib/types';

export const handle = { title: 'Teams' };

export async function clientLoader() {
  const data = await listTeams();
  return data;
}

const createTeamSchema = z.object({
  name: z.string().min(2, 'Min 2 characters').max(60, 'Max 60 characters'),
});

type CreateTeamForm = z.infer<typeof createTeamSchema>;

export default function AdminTeamsPage() {
  useRequireRole(['admin', 'owner']);

  const loaderData = useLoaderData<typeof clientLoader>();
  const [teams, setTeams] = useState<Team[]>(loaderData.teams);
  const [modalOpen, setModalOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CreateTeamForm>({
    resolver: zodResolver(createTeamSchema),
  });

  function openModal() {
    reset();
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    reset();
  }

  async function onSubmit(values: CreateTeamForm) {
    try {
      const result = await createTeam(values);
      setTeams((prev) => [result.team, ...prev]);
      closeModal();
      toast.success('Team created');
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setError('name', { message: 'A team with this name already exists' });
      } else if (err instanceof Error) {
        toast.error(err.message);
      } else {
        toast.error('Something went wrong');
      }
    }
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1
          className="text-2xl font-bold text-[var(--color-text)]"
          style={{ fontFamily: 'Syne, sans-serif' }}
        >
          Teams
        </h1>
        <Button variant="primary" onClick={openModal}>
          New Team
        </Button>
      </div>

      {teams.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-[var(--color-text-muted)] mb-4">
            No teams yet. Create your first team to get started.
          </p>
          <Button onClick={openModal}>New Team</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {teams.map((team) => (
            <div
              key={team.id}
              className="bg-white border border-[var(--color-border)] rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <h2
                className="text-lg font-semibold text-[var(--color-text)] mb-1"
                style={{ fontFamily: 'Syne, sans-serif' }}
              >
                {team.name}
              </h2>
              <p className="text-sm text-[var(--color-text-muted)] mb-3">— members</p>
              <div className="mb-4">
                <span className="px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-500 border border-slate-200">
                  Compliance —
                </span>
              </div>
              <Link
                to={`/admin/teams/${team.id}`}
                className="inline-flex items-center justify-center gap-2 rounded-md font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 bg-white border border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-bg-subtle)] px-3 py-1.5 text-sm"
              >
                View
              </Link>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={closeModal} title="New Team" size="sm">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Input
            label="Team name"
            error={errors.name?.message}
            {...register('name')}
          />
          <div className="flex justify-end gap-2 mt-2">
            <Button type="button" variant="secondary" onClick={closeModal}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={isSubmitting}>
              Create Team
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
