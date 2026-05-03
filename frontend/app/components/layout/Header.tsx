import { useAuth } from '~/lib/auth/context';

interface HeaderProps {
  title: string;
}

export function Header({ title }: HeaderProps) {
  const { user } = useAuth();

  return (
    <header
      className="h-14 flex items-center justify-between px-6 border-b shrink-0"
      style={{ backgroundColor: 'var(--color-bg)', borderColor: 'var(--color-border)' }}
    >
      <h1
        className="text-base font-semibold"
        style={{ color: 'var(--color-text)', fontFamily: 'Syne, system-ui' }}
      >
        {title}
      </h1>

      <div className="flex items-center gap-4">
        {/* Notification bell — stubbed at 0, wired in Chunk 7 */}
        <button
          className="relative p-1 rounded-md"
          style={{ color: 'var(--color-text-muted)' }}
          aria-label="Notifications"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path
              d="M10 2a6 6 0 00-6 6v2.586l-1.707 1.707A1 1 0 003 14h14a1 1 0 00.707-1.707L16 10.586V8a6 6 0 00-6-6zM10 18a2 2 0 01-2-2h4a2 2 0 01-2 2z"
              fill="currentColor"
            />
          </svg>
        </button>

        {/* User avatar */}
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold"
          style={{ backgroundColor: 'var(--color-accent-dim)', color: 'var(--color-accent)' }}
        >
          {user ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase() : '?'}
        </div>
      </div>
    </header>
  );
}
