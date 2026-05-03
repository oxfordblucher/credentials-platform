import { Outlet } from 'react-router';

export default function AuthLayout() {
  return (
    <div className="min-h-screen flex" style={{ backgroundColor: 'var(--color-sidebar)' }}>
      {/* Left panel — branding, hidden on mobile */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center px-16">
        <div className="mb-8">
          <span
            className="text-3xl font-bold tracking-tight"
            style={{ color: 'var(--color-accent)', fontFamily: 'Syne, system-ui' }}
          >
            CredPlat
          </span>
        </div>
        <h2
          className="text-4xl font-semibold leading-tight mb-4"
          style={{ color: '#ffffff', fontFamily: 'Syne, system-ui' }}
        >
          Credential compliance,<br />simplified.
        </h2>
        <p className="text-base" style={{ color: 'var(--color-text-muted)' }}>
          Manage team credentials, document submissions, and compliance status — all in one place.
        </p>
      </div>

      {/* Right panel — form area */}
      <div
        className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12"
        style={{ backgroundColor: 'var(--color-bg)' }}
      >
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="mb-8 lg:hidden">
            <span
              className="text-2xl font-bold"
              style={{ color: 'var(--color-accent)', fontFamily: 'Syne, system-ui' }}
            >
              CredPlat
            </span>
          </div>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
