import { NavLink, useNavigate } from 'react-router';
import { useAuth } from '~/lib/auth/context';

interface NavItem {
  label: string;
  to: string;
}

export function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const isAdminOrOwner = user?.orgRole === 'admin' || user?.orgRole === 'owner';

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  const memberLinks: NavItem[] = [
    { label: 'My Credentials', to: '/credentials' },
  ];

  const adminLinks: NavItem[] = [
    { label: 'Credential Types', to: '/admin/credential-types' },
    { label: 'Teams', to: '/admin/teams' },
    { label: 'Org Compliance', to: '/admin/compliance' },
  ];

  return (
    <aside
      className="flex flex-col w-60 min-h-screen shrink-0"
      style={{ backgroundColor: 'var(--color-sidebar)' }}
    >
      {/* Logo */}
      <div className="px-6 py-5 border-b" style={{ borderColor: '#1e2130' }}>
        <span
          className="text-xl font-bold tracking-tight"
          style={{ color: 'var(--color-accent)', fontFamily: 'Syne, system-ui' }}
        >
          CredPlat
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {memberLinks.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center px-3 py-2 rounded-md text-sm transition-colors ${
                isActive ? 'border-l-2 pl-[10px]' : 'hover:bg-[var(--color-sidebar-hover)]'
              }`
            }
            style={({ isActive }) => ({
              color: isActive ? 'var(--color-accent)' : '#c9d0db',
              borderColor: isActive ? 'var(--color-accent)' : 'transparent',
            })}
          >
            {item.label}
          </NavLink>
        ))}

        {isAdminOrOwner && (
          <div className="pt-4">
            <p
              className="px-3 pb-2 text-xs font-medium uppercase tracking-widest font-mono-label"
              style={{ color: '#4b5563' }}
            >
              Admin
            </p>
            {adminLinks.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center px-3 py-2 rounded-md text-sm transition-colors ${
                    isActive ? 'border-l-2 pl-[10px]' : 'hover:bg-[var(--color-sidebar-hover)]'
                  }`
                }
                style={({ isActive }) => ({
                  color: isActive ? 'var(--color-accent)' : '#c9d0db',
                  borderColor: isActive ? 'var(--color-accent)' : 'transparent',
                })}
              >
                {item.label}
              </NavLink>
            ))}
          </div>
        )}
      </nav>

      {/* User + Logout */}
      <div className="px-4 py-4 border-t" style={{ borderColor: '#1e2130' }}>
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
            style={{ backgroundColor: 'var(--color-accent-dim)', color: 'var(--color-accent)' }}
          >
            {user ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase() : '?'}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate" style={{ color: '#e5e7eb' }}>
              {user ? `${user.firstName} ${user.lastName}` : ''}
            </p>
            <p className="text-xs truncate font-mono-label" style={{ color: '#6b7280' }}>
              {user?.email ?? ''}
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full text-left px-3 py-2 rounded-md text-sm transition-colors hover:bg-[var(--color-sidebar-hover)]"
          style={{ color: '#9ca3af' }}
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
