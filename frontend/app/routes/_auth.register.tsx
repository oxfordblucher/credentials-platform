import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { subYears, isAfter } from 'date-fns';
import { Link, useNavigate } from 'react-router';
import { useAuth } from '~/lib/auth/context';
import { register as apiRegister } from '~/lib/api/auth';
import { ApiError } from '~/lib/api/client';

const registerSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  dob: z.string().refine((val) => {
    const date = new Date(val);
    if (isNaN(date.getTime())) return false;
    return !isAfter(date, subYears(new Date(), 16));
  }, 'You must be at least 16 years old'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  async function onSubmit(data: RegisterFormData) {
    try {
      await apiRegister({
        firstName: data.firstName,
        lastName: data.lastName,
        dob: data.dob,
        email: data.email,
        password: data.password,
      });
      await login(data.email, data.password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError('root', {
        message: err instanceof ApiError ? err.message : 'Registration failed. Please try again.',
      });
    }
  }

  return (
    <>
      <h1
        className="text-2xl font-semibold mb-2"
        style={{ color: 'var(--color-text)', fontFamily: 'Syne, system-ui' }}
      >
        Create account
      </h1>
      <p className="text-sm mb-8" style={{ color: 'var(--color-text-muted)' }}>
        Join your organization on CredPlat.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>
              First name
            </label>
            <input
              type="text"
              {...register('firstName')}
              className="w-full px-3 py-2 border rounded-md text-sm outline-none"
              style={{
                borderColor: errors.firstName ? 'var(--color-danger)' : 'var(--color-border)',
                backgroundColor: 'var(--color-bg)',
                color: 'var(--color-text)',
              }}
            />
            {errors.firstName && (
              <p className="mt-1 text-xs" style={{ color: 'var(--color-danger)' }}>
                {errors.firstName.message}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>
              Last name
            </label>
            <input
              type="text"
              {...register('lastName')}
              className="w-full px-3 py-2 border rounded-md text-sm outline-none"
              style={{
                borderColor: errors.lastName ? 'var(--color-danger)' : 'var(--color-border)',
                backgroundColor: 'var(--color-bg)',
                color: 'var(--color-text)',
              }}
            />
            {errors.lastName && (
              <p className="mt-1 text-xs" style={{ color: 'var(--color-danger)' }}>
                {errors.lastName.message}
              </p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>
            Date of birth
          </label>
          <input
            type="date"
            {...register('dob')}
            className="w-full px-3 py-2 border rounded-md text-sm outline-none"
            style={{
              borderColor: errors.dob ? 'var(--color-danger)' : 'var(--color-border)',
              backgroundColor: 'var(--color-bg)',
              color: 'var(--color-text)',
            }}
          />
          {errors.dob && (
            <p className="mt-1 text-xs" style={{ color: 'var(--color-danger)' }}>
              {errors.dob.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>
            Email
          </label>
          <input
            type="email"
            autoComplete="email"
            {...register('email')}
            className="w-full px-3 py-2 border rounded-md text-sm outline-none"
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
            autoComplete="new-password"
            {...register('password')}
            className="w-full px-3 py-2 border rounded-md text-sm outline-none"
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

        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>
            Confirm password
          </label>
          <input
            type="password"
            autoComplete="new-password"
            {...register('confirmPassword')}
            className="w-full px-3 py-2 border rounded-md text-sm outline-none"
            style={{
              borderColor: errors.confirmPassword ? 'var(--color-danger)' : 'var(--color-border)',
              backgroundColor: 'var(--color-bg)',
              color: 'var(--color-text)',
            }}
          />
          {errors.confirmPassword && (
            <p className="mt-1 text-xs" style={{ color: 'var(--color-danger)' }}>
              {errors.confirmPassword.message}
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
          {isSubmitting ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p className="mt-6 text-sm text-center" style={{ color: 'var(--color-text-muted)' }}>
        Already have an account?{' '}
        <Link to="/login" className="font-medium" style={{ color: 'var(--color-accent)' }}>
          Sign in
        </Link>
      </p>
    </>
  );
}
