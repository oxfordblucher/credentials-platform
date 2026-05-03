import { Outlet, useNavigate, useMatches } from 'react-router';
import { useEffect } from 'react';
import { useAuth } from '~/lib/auth/context';
import { Sidebar } from '~/components/layout/Sidebar';
import { Header } from '~/components/layout/Header';

export default function AppShell() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const matches = useMatches();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/login', { replace: true });
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: 'var(--color-bg-subtle)' }}
      >
        <div
          className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: 'var(--color-accent)' }}
        />
      </div>
    );
  }

  if (!user) return null;

  const currentMatch = matches[matches.length - 1];
  const pageTitle =
    (currentMatch?.handle as { title?: string } | undefined)?.title ?? 'Dashboard';

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: 'var(--color-bg)' }}>
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0">
        <Header title={pageTitle} />
        <main
          className="flex-1 p-6 overflow-auto"
          style={{ backgroundColor: 'var(--color-bg-subtle)' }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
