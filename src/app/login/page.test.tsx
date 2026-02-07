import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import LoginPage from './page';

// Mock supabase client
const mockSignInWithOAuth = vi.fn().mockResolvedValue({ error: null });
const mockSignInWithPassword = vi.fn().mockResolvedValue({ error: null });
const mockSignUp = vi.fn().mockResolvedValue({ error: null });

vi.mock('@/lib/supabase', () => ({
  createClient: () => ({
    auth: {
      signInWithOAuth: mockSignInWithOAuth,
      signInWithPassword: mockSignInWithPassword,
      signUp: mockSignUp,
    },
    from: vi.fn(),
  }),
}));

// Mock window.location
beforeEach(() => {
  vi.clearAllMocks();
  Object.defineProperty(window, 'location', {
    value: { origin: 'http://localhost:3000', href: '' },
    writable: true,
  });
});

describe('LoginPage', () => {
  describe('Default sign in view', () => {
    it('renders the sign in heading by default', () => {
      render(<LoginPage />);

      expect(screen.getByRole('heading', { name: 'Sign in' })).toBeInTheDocument();
    });

    it('shows welcome back message', () => {
      render(<LoginPage />);

      expect(screen.getByText('Welcome back to Contextory')).toBeInTheDocument();
    });

    it('renders email input', () => {
      render(<LoginPage />);

      const emailInput = screen.getByLabelText('Email');
      expect(emailInput).toBeInTheDocument();
      expect(emailInput).toHaveAttribute('type', 'email');
      expect(emailInput).toBeRequired();
    });

    it('renders password input', () => {
      render(<LoginPage />);

      const passwordInput = screen.getByLabelText('Password');
      expect(passwordInput).toBeInTheDocument();
      expect(passwordInput).toHaveAttribute('type', 'password');
      expect(passwordInput).toBeRequired();
    });

    it('does not show name field in sign in mode', () => {
      render(<LoginPage />);

      expect(screen.queryByLabelText('Name')).not.toBeInTheDocument();
    });

    it('renders sign in submit button', () => {
      render(<LoginPage />);

      expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
    });
  });

  describe('OAuth buttons', () => {
    it('renders Google OAuth button', () => {
      render(<LoginPage />);

      expect(screen.getByRole('button', { name: /Continue with Google/i })).toBeInTheDocument();
    });

    it('renders GitHub OAuth button', () => {
      render(<LoginPage />);

      expect(screen.getByRole('button', { name: /Continue with GitHub/i })).toBeInTheDocument();
    });

    it('renders LinkedIn OAuth button', () => {
      render(<LoginPage />);

      expect(screen.getByRole('button', { name: /Continue with LinkedIn/i })).toBeInTheDocument();
    });

    it('calls signInWithOAuth with google when Google button is clicked', async () => {
      render(<LoginPage />);

      fireEvent.click(screen.getByRole('button', { name: /Continue with Google/i }));

      expect(mockSignInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: {
          redirectTo: 'http://localhost:3000/auth/callback',
        },
      });
    });

    it('calls signInWithOAuth with github when GitHub button is clicked', async () => {
      render(<LoginPage />);

      fireEvent.click(screen.getByRole('button', { name: /Continue with GitHub/i }));

      expect(mockSignInWithOAuth).toHaveBeenCalledWith({
        provider: 'github',
        options: {
          redirectTo: 'http://localhost:3000/auth/callback',
        },
      });
    });

    it('calls signInWithOAuth with linkedin_oidc when LinkedIn button is clicked', async () => {
      render(<LoginPage />);

      fireEvent.click(screen.getByRole('button', { name: /Continue with LinkedIn/i }));

      expect(mockSignInWithOAuth).toHaveBeenCalledWith({
        provider: 'linkedin_oidc',
        options: {
          redirectTo: 'http://localhost:3000/auth/callback',
        },
      });
    });
  });

  describe('Toggle between sign in and sign up', () => {
    it('shows toggle button to switch to sign up', () => {
      render(<LoginPage />);

      expect(screen.getByText("Don't have an account? Sign up")).toBeInTheDocument();
    });

    it('switches to sign up view when toggle is clicked', () => {
      render(<LoginPage />);

      fireEvent.click(screen.getByText("Don't have an account? Sign up"));

      expect(screen.getByRole('heading', { name: 'Create account' })).toBeInTheDocument();
      expect(screen.getByText('Get started with Contextory')).toBeInTheDocument();
    });

    it('shows name field in sign up mode', () => {
      render(<LoginPage />);

      fireEvent.click(screen.getByText("Don't have an account? Sign up"));

      const nameInput = screen.getByLabelText('Name');
      expect(nameInput).toBeInTheDocument();
      expect(nameInput).toHaveAttribute('type', 'text');
    });

    it('shows Create account button in sign up mode', () => {
      render(<LoginPage />);

      fireEvent.click(screen.getByText("Don't have an account? Sign up"));

      expect(screen.getByRole('button', { name: 'Create account' })).toBeInTheDocument();
    });

    it('shows toggle to switch back to sign in', () => {
      render(<LoginPage />);

      fireEvent.click(screen.getByText("Don't have an account? Sign up"));

      expect(screen.getByText('Already have an account? Sign in')).toBeInTheDocument();
    });

    it('switches back to sign in when toggled twice', () => {
      render(<LoginPage />);

      fireEvent.click(screen.getByText("Don't have an account? Sign up"));
      fireEvent.click(screen.getByText('Already have an account? Sign in'));

      expect(screen.getByRole('heading', { name: 'Sign in' })).toBeInTheDocument();
      expect(screen.queryByLabelText('Name')).not.toBeInTheDocument();
    });
  });

  describe('Form interaction', () => {
    it('allows typing in email field', () => {
      render(<LoginPage />);

      const emailInput = screen.getByLabelText('Email') as HTMLInputElement;
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

      expect(emailInput.value).toBe('test@example.com');
    });

    it('allows typing in password field', () => {
      render(<LoginPage />);

      const passwordInput = screen.getByLabelText('Password') as HTMLInputElement;
      fireEvent.change(passwordInput, { target: { value: 'secret123' } });

      expect(passwordInput.value).toBe('secret123');
    });

    it('allows typing in name field in sign up mode', () => {
      render(<LoginPage />);

      fireEvent.click(screen.getByText("Don't have an account? Sign up"));

      const nameInput = screen.getByLabelText('Name') as HTMLInputElement;
      fireEvent.change(nameInput, { target: { value: 'Jane Doe' } });

      expect(nameInput.value).toBe('Jane Doe');
    });
  });
});
