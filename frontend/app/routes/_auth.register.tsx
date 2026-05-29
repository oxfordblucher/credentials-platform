import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { subYears, isAfter } from 'date-fns';
import { Link, useNavigate } from 'react-router';
import { useAuth } from '~/lib/auth/context';
import { checkOrgName, setupOrg } from '~/lib/api/auth';
import { ApiError } from '~/lib/api/client';

const step1Schema = z.object({
  orgName: z.string().min(1, 'Organization name is required').max(100),
  orgAddress: z.string().min(1, 'Address is required').max(255),
});

const step2Schema = z
  .object({
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
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type Step1Data = z.infer<typeof step1Schema>;
type Step2Data = z.infer<typeof step2Schema>;

const inputStyle = (hasError: boolean) => ({
  borderColor: hasError ? 'var(--color-danger)' : 'var(--color-border)',
  backgroundColor: 'var(--color-bg)',
  color: 'var(--color-text)',
});

export default function RegisterPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);
  const [orgData, setOrgData] = useState({ orgName: '', orgAddress: '' });

  const step1 = useForm<Step1Data>({ resolver: zodResolver(step1Schema) });
  const step2 = useForm<Step2Data>({ resolver: zodResolver(step2Schema) });

  async function onStep1Next(data: Step1Data) {
    try {
      const { available } = await checkOrgName(data.orgName);
      if (!available) {
        step1.setError('orgName', { message: 'This organization name is already taken' });
        return;
      }
      setOrgData({ orgName: data.orgName, orgAddress: data.orgAddress });
      setStep(2);
    } catch {
      step1.setError('root', { message: 'Could not check name availability. Please try again.' });
    }
  }

  function handleBack() {
    step1.reset({ orgName: orgData.orgName, orgAddress: orgData.orgAddress });
    setStep(1);
  }

  async function onStep2Submit(data: Step2Data) {
    try {
      await setupOrg({
        orgName: orgData.orgName,
        orgAddress: orgData.orgAddress,
        firstName: data.firstName,
        lastName: data.lastName,
        dob: data.dob,
        email: data.email,
        password: data.password,
      });
      await login(data.email, data.password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      step2.setError('root', {
        message: err instanceof ApiError ? err.message : 'Registration failed. Please try again.',
      });
    }
  }

  const loginLink = (
    <p className="mt-6 text-sm text-center" style={{ color: 'var(--color-text-muted)' }}>
      Already have an account?{' '}
      <Link to="/login" className="font-medium" style={{ color: 'var(--color-accent)' }}>
        Sign in
      </Link>
    </p>
  );

  if (step === 1) {
    return (
      <>
        <h1
          className="text-2xl font-semibold mb-2"
          style={{ color: 'var(--color-text)', fontFamily: 'Syne, system-ui' }}
        >
          Set up your organisation
        </h1>
        <p className="text-sm mb-8" style={{ color: 'var(--color-text-muted)' }}>
          Step 1 of 2 — Organisation details
        </p>

        <form onSubmit={step1.handleSubmit(onStep1Next)} noValidate className="space-y-4">
          <div>
            <label
              htmlFor="orgName"
              className="block text-sm font-medium mb-1"
              style={{ color: 'var(--color-text)' }}
            >
              Organization name
            </label>
            <input
              id="orgName"
              type="text"
              {...step1.register('orgName')}
              className="w-full px-3 py-2 border rounded-md text-sm outline-none"
              style={inputStyle(!!step1.formState.errors.orgName)}
            />
            {step1.formState.errors.orgName && (
              <p className="mt-1 text-xs" style={{ color: 'var(--color-danger)' }}>
                {step1.formState.errors.orgName.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="orgAddress"
              className="block text-sm font-medium mb-1"
              style={{ color: 'var(--color-text)' }}
            >
              Address
            </label>
            <input
              id="orgAddress"
              type="text"
              {...step1.register('orgAddress')}
              className="w-full px-3 py-2 border rounded-md text-sm outline-none"
              style={inputStyle(!!step1.formState.errors.orgAddress)}
            />
            {step1.formState.errors.orgAddress && (
              <p className="mt-1 text-xs" style={{ color: 'var(--color-danger)' }}>
                {step1.formState.errors.orgAddress.message}
              </p>
            )}
          </div>

          {step1.formState.errors.root && (
            <div
              className="px-3 py-2 rounded-md text-sm"
              style={{ backgroundColor: '#fef2f2', color: 'var(--color-danger)', border: '1px solid #fecaca' }}
            >
              {step1.formState.errors.root.message}
            </div>
          )}

          <button
            type="submit"
            disabled={step1.formState.isSubmitting}
            className="w-full py-2 px-4 rounded-md text-sm font-medium transition-opacity disabled:opacity-60"
            style={{ backgroundColor: 'var(--color-accent)', color: '#ffffff' }}
          >
            {step1.formState.isSubmitting ? 'Checking…' : 'Next'}
          </button>
        </form>

        {loginLink}
      </>
    );
  }

  return (
    <>
      <h1
        className="text-2xl font-semibold mb-2"
        style={{ color: 'var(--color-text)', fontFamily: 'Syne, system-ui' }}
      >
        Create your account
      </h1>
      <p className="text-sm mb-8" style={{ color: 'var(--color-text-muted)' }}>
        Step 2 of 2 — Owner details
      </p>

      <form onSubmit={step2.handleSubmit(onStep2Submit)} noValidate className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="firstName"
              className="block text-sm font-medium mb-1"
              style={{ color: 'var(--color-text)' }}
            >
              First name
            </label>
            <input
              id="firstName"
              type="text"
              {...step2.register('firstName')}
              className="w-full px-3 py-2 border rounded-md text-sm outline-none"
              style={inputStyle(!!step2.formState.errors.firstName)}
            />
            {step2.formState.errors.firstName && (
              <p className="mt-1 text-xs" style={{ color: 'var(--color-danger)' }}>
                {step2.formState.errors.firstName.message}
              </p>
            )}
          </div>
          <div>
            <label
              htmlFor="lastName"
              className="block text-sm font-medium mb-1"
              style={{ color: 'var(--color-text)' }}
            >
              Last name
            </label>
            <input
              id="lastName"
              type="text"
              {...step2.register('lastName')}
              className="w-full px-3 py-2 border rounded-md text-sm outline-none"
              style={inputStyle(!!step2.formState.errors.lastName)}
            />
            {step2.formState.errors.lastName && (
              <p className="mt-1 text-xs" style={{ color: 'var(--color-danger)' }}>
                {step2.formState.errors.lastName.message}
              </p>
            )}
          </div>
        </div>

        <div>
          <label
            htmlFor="dob"
            className="block text-sm font-medium mb-1"
            style={{ color: 'var(--color-text)' }}
          >
            Date of birth
          </label>
          <input
            id="dob"
            type="date"
            {...step2.register('dob')}
            className="w-full px-3 py-2 border rounded-md text-sm outline-none"
            style={inputStyle(!!step2.formState.errors.dob)}
          />
          {step2.formState.errors.dob && (
            <p className="mt-1 text-xs" style={{ color: 'var(--color-danger)' }}>
              {step2.formState.errors.dob.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium mb-1"
            style={{ color: 'var(--color-text)' }}
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            {...step2.register('email')}
            className="w-full px-3 py-2 border rounded-md text-sm outline-none"
            style={inputStyle(!!step2.formState.errors.email)}
          />
          {step2.formState.errors.email && (
            <p className="mt-1 text-xs" style={{ color: 'var(--color-danger)' }}>
              {step2.formState.errors.email.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium mb-1"
            style={{ color: 'var(--color-text)' }}
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            {...step2.register('password')}
            className="w-full px-3 py-2 border rounded-md text-sm outline-none"
            style={inputStyle(!!step2.formState.errors.password)}
          />
          {step2.formState.errors.password && (
            <p className="mt-1 text-xs" style={{ color: 'var(--color-danger)' }}>
              {step2.formState.errors.password.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-medium mb-1"
            style={{ color: 'var(--color-text)' }}
          >
            Confirm password
          </label>
          <input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            {...step2.register('confirmPassword')}
            className="w-full px-3 py-2 border rounded-md text-sm outline-none"
            style={inputStyle(!!step2.formState.errors.confirmPassword)}
          />
          {step2.formState.errors.confirmPassword && (
            <p className="mt-1 text-xs" style={{ color: 'var(--color-danger)' }}>
              {step2.formState.errors.confirmPassword.message}
            </p>
          )}
        </div>

        {step2.formState.errors.root && (
          <div
            className="px-3 py-2 rounded-md text-sm"
            style={{ backgroundColor: '#fef2f2', color: 'var(--color-danger)', border: '1px solid #fecaca' }}
          >
            {step2.formState.errors.root.message}
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleBack}
            className="flex-1 py-2 px-4 rounded-md text-sm font-medium border transition-opacity"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
          >
            Back
          </button>
          <button
            type="submit"
            disabled={step2.formState.isSubmitting}
            className="flex-1 py-2 px-4 rounded-md text-sm font-medium transition-opacity disabled:opacity-60"
            style={{ backgroundColor: 'var(--color-accent)', color: '#ffffff' }}
          >
            {step2.formState.isSubmitting ? 'Creating account…' : 'Create account'}
          </button>
        </div>
      </form>

      {loginLink}
    </>
  );
}
