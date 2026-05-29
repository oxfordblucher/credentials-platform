import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';

const { mockNavigate, mockLogin, mockCheckOrgName, mockSetupOrg } = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
  mockLogin: vi.fn(),
  mockCheckOrgName: vi.fn(),
  mockSetupOrg: vi.fn(),
}));

vi.mock('react-router', () => ({
  useNavigate: () => mockNavigate,
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
}));

vi.mock('~/lib/auth/context', () => ({
  useAuth: () => ({ login: mockLogin }),
}));

vi.mock('~/lib/api/auth', () => ({
  checkOrgName: mockCheckOrgName,
  setupOrg: mockSetupOrg,
}));

import RegisterPage from '~/routes/_auth.register';

function fillStep1(orgName = 'Test Corp', orgAddress = '123 Main St') {
  fireEvent.change(screen.getByLabelText(/organization name/i), {
    target: { value: orgName },
  });
  fireEvent.change(screen.getByLabelText(/address/i), {
    target: { value: orgAddress },
  });
}

function fillStep2() {
  fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'Jane' } });
  fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: 'Doe' } });
  fireEvent.change(screen.getByLabelText(/date of birth/i), { target: { value: '1990-01-01' } });
  fireEvent.change(screen.getByLabelText(/^email/i), { target: { value: 'jane@example.com' } });
  fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: 'password123' } });
  fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'password123' } });
}

describe('RegisterPage wizard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCheckOrgName.mockResolvedValue({ available: true });
    mockSetupOrg.mockResolvedValue(undefined);
    mockLogin.mockResolvedValue({ user: {}, accessToken: 'tok' });
  });

  it('renders step 1 initially with org name and address fields', () => {
    render(<RegisterPage />);
    expect(screen.getByLabelText(/organization name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/address/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/first name/i)).not.toBeInTheDocument();
  });

  it('advances to step 2 when org name is available', async () => {
    render(<RegisterPage />);
    fillStep1();
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    await waitFor(() => {
      expect(mockCheckOrgName).toHaveBeenCalledWith('Test Corp');
      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    });
  });

  it('shows error and stays on step 1 when org name is taken', async () => {
    mockCheckOrgName.mockResolvedValue({ available: false });
    render(<RegisterPage />);
    fillStep1();
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    await waitFor(() => {
      expect(screen.getByText(/already taken/i)).toBeInTheDocument();
      expect(screen.queryByLabelText(/first name/i)).not.toBeInTheDocument();
    });
  });

  it('returns to step 1 with org data pre-filled when Back is clicked', async () => {
    render(<RegisterPage />);
    fillStep1('Acme Ltd', '999 Oak Ave');
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    await waitFor(() => screen.getByLabelText(/first name/i));
    fireEvent.click(screen.getByRole('button', { name: /back/i }));
    expect((screen.getByLabelText(/organization name/i) as HTMLInputElement).value).toBe('Acme Ltd');
    expect((screen.getByLabelText(/address/i) as HTMLInputElement).value).toBe('999 Oak Ave');
  });

  it('calls setupOrg and login then navigates on successful submission', async () => {
    render(<RegisterPage />);
    fillStep1();
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    await waitFor(() => screen.getByLabelText(/first name/i));
    fillStep2();
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));
    await waitFor(() => {
      expect(mockSetupOrg).toHaveBeenCalledWith(
        expect.objectContaining({
          orgName: 'Test Corp',
          orgAddress: '123 Main St',
          firstName: 'Jane',
          lastName: 'Doe',
          email: 'jane@example.com',
        })
      );
      expect(mockLogin).toHaveBeenCalledWith('jane@example.com', 'password123');
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
    });
  });
});
