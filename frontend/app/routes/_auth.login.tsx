import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router';
import { useAuth } from '~/lib/auth/context';
import { ApiError } from '~/lib/api/client';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(data: LoginFormData) {
    try {
      await login(data.email, data.password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError('root', {
        message: err instanceof ApiError ? err.message : 'An unexpected error occurred.',
      });
    }
  }

  return (
    <>
      <h1
        className="text-2xl font-semibold mb-2"
        style={{ color: 'var(--color-text)', fontFamily: 'Syne, system-ui' }}
      >
        Sign in
      </h1>
      <p className="text-sm mb-8" style={{ color: 'var(--color-text-muted)' }}>
        Welcome back. Enter your credentials to continue.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>
            Email
          </label>
          <input
            type="email"
            autoComplete="email"
            {...register('email')}
            className="w-full px-3 py-2 border rounded-md text-sm outline-none focus:ring-2"
            style={{
              borderColor: errors.email ? 'var(--color-danger)' : 'var(--color-border)',
              backgroundColor: 'var(--color-bg)',
              color: 'var(--color-text)',
            }}
          />
          {errors.email && (
            <p className="mt-1 text-xs" style={{ color: 'var(--color-danger)' }}>
              {errors.email.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>
            Password
          </label>
          <input
            type="password"
            autoComplete="current-password"
            {...register('password')}
            className="w-full px-3 py-2 border rounded-md text-sm outline-none focus:ring-2"
            style={{
              borderColor: errors.password ? 'var(--color-danger)' : 'var(--color-border)',
              backgroundColor: 'var(--color-bg)',
              color: 'var(--color-text)',
            }}
          />
          {errors.password && (
            <p className="mt-1 text-xs" style={{ color: 'var(--color-danger)' }}>
              {errors.password.message}
            </p>
          )}
        </div>

        {errors.root && (
          <div
            className="px-3 py-2 rounded-md text-sm"
            style={{ backgroundColor: '#fef2f2', color: 'var(--color-danger)', border: '1px solid #fecaca' }}
          >
            {errors.root.message}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-2 px-4 rounded-md text-sm font-medium transition-opacity disabled:opacity-60"
          style={{ backgroundColor: 'var(--color-accent)', color: '#ffffff' }}
        >
          {isSubmitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <p className="mt-6 text-sm text-center" style={{ color: 'var(--color-text-muted)' }}>
        Don't have an account?{' '}
        <Link to="/register" className="font-medium" style={{ color: 'var(--color-accent)' }}>
          Register
        </Link>
      </p>
    </>
  );
}
