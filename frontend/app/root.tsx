import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from 'react-router';
import type { Route } from './+types/root';
import '~/styles/globals.css';
import { AuthProvider } from '~/lib/auth/context';

export const links: Route.LinksFunction = () => [
  { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
  {
    rel: 'preconnect',
    href: 'https://fonts.gstatic.com',
    crossOrigin: 'anonymous',
  },
  {
    rel: 'stylesheet',
    href: 'https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700&family=DM+Mono:wght@400;500&display=swap',
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Outlet />
    </AuthProvider>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = 'Something went wrong';
  let details = 'An unexpected error occurred. Please try again.';

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? '404 — Page Not Found' : `Error ${error.status}`;
    details =
      error.status === 404
        ? 'The page you were looking for does not exist.'
        : error.statusText || details;
  } else if (import.meta.env.DEV && error instanceof Error) {
    details = error.message;
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[var(--color-bg-subtle)]">
      <div className="text-center max-w-md p-8">
        <h1 className="text-2xl font-semibold text-[var(--color-text)] mb-2">{message}</h1>
        <p className="text-[var(--color-text-muted)]">{details}</p>
        <a
          href="/"
          className="mt-6 inline-block px-4 py-2 rounded-md text-sm font-medium"
          style={{ backgroundColor: 'var(--color-accent)', color: '#ffffff' }}
        >
          Go home
        </a>
      </div>
    </main>
  );
}
