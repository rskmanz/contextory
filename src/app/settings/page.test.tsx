import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import SettingsPage from './page';
import { useStore } from '@/lib/store';

// Mock next/link to render a plain anchor
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

beforeEach(() => {
  vi.clearAllMocks();
  localStorageMock.clear();

  // Reset store AI settings to defaults
  useStore.setState({
    aiSettings: {
      provider: 'openai',
      model: 'gpt-4o',
    },
  });
});

describe('SettingsPage', () => {
  describe('Page structure', () => {
    it('renders the Settings heading', () => {
      render(<SettingsPage />);

      expect(screen.getByRole('heading', { name: 'Settings' })).toBeInTheDocument();
    });

    it('renders a back link to home', () => {
      render(<SettingsPage />);

      const backLink = screen.getByTitle('Back to Home');
      expect(backLink).toBeInTheDocument();
      expect(backLink).toHaveAttribute('href', '/');
    });

    it('renders the AI Configuration section', () => {
      render(<SettingsPage />);

      expect(screen.getByText('AI Configuration')).toBeInTheDocument();
      expect(screen.getByText(/Configure your AI provider/)).toBeInTheDocument();
    });

    it('renders the About Contextory section', () => {
      render(<SettingsPage />);

      expect(screen.getByText('About Contextory')).toBeInTheDocument();
      expect(screen.getByText(/Contextory helps you shape and visualize/)).toBeInTheDocument();
    });

    it('renders version information', () => {
      render(<SettingsPage />);

      expect(screen.getByText(/Version 0\.1\.0/)).toBeInTheDocument();
    });
  });

  describe('AI Provider selection', () => {
    it('renders the AI Provider label', () => {
      render(<SettingsPage />);

      expect(screen.getByText('AI Provider')).toBeInTheDocument();
    });

    it('renders OpenAI provider button', () => {
      render(<SettingsPage />);

      expect(screen.getByText('OpenAI')).toBeInTheDocument();
      expect(screen.getByText('GPT-4o, GPT-4 Turbo')).toBeInTheDocument();
    });

    it('renders Anthropic provider button', () => {
      render(<SettingsPage />);

      expect(screen.getByText('Anthropic')).toBeInTheDocument();
      expect(screen.getByText('Claude Sonnet 4, Claude 3.5')).toBeInTheDocument();
    });

    it('switches to Anthropic models when Anthropic is selected', () => {
      render(<SettingsPage />);

      fireEvent.click(screen.getByText('Anthropic'));

      // Anthropic models should be visible in the select
      const modelSelect = screen.getByRole('combobox');
      const options = Array.from(modelSelect.querySelectorAll('option'));
      const optionTexts = options.map((opt) => opt.textContent);

      expect(optionTexts).toContain('Claude Sonnet 4 (Recommended)');
      expect(optionTexts).toContain('Claude 3.5 Sonnet');
      expect(optionTexts).toContain('Claude 3 Haiku (Faster)');
    });

    it('shows OpenAI models by default', () => {
      render(<SettingsPage />);

      const modelSelect = screen.getByRole('combobox');
      const options = Array.from(modelSelect.querySelectorAll('option'));
      const optionTexts = options.map((opt) => opt.textContent);

      expect(optionTexts).toContain('GPT-4o (Recommended)');
      expect(optionTexts).toContain('GPT-4o Mini (Faster)');
      expect(optionTexts).toContain('GPT-4 Turbo');
    });
  });

  describe('Model selection', () => {
    it('renders the Model label', () => {
      render(<SettingsPage />);

      expect(screen.getByText('Model')).toBeInTheDocument();
    });

    it('renders a select element for models', () => {
      render(<SettingsPage />);

      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('allows changing the model', () => {
      render(<SettingsPage />);

      const modelSelect = screen.getByRole('combobox') as HTMLSelectElement;
      fireEvent.change(modelSelect, { target: { value: 'gpt-4o-mini' } });

      expect(modelSelect.value).toBe('gpt-4o-mini');
    });
  });

  describe('API Key input', () => {
    it('renders API Key label', () => {
      render(<SettingsPage />);

      expect(screen.getByText('API Key')).toBeInTheDocument();
    });

    it('renders a password input for API key', () => {
      render(<SettingsPage />);

      const apiKeyInput = screen.getByPlaceholderText(/Enter your .* API key/);
      expect(apiKeyInput).toBeInTheDocument();
      expect(apiKeyInput).toHaveAttribute('type', 'password');
    });

    it('shows OpenAI placeholder text by default', () => {
      render(<SettingsPage />);

      expect(screen.getByPlaceholderText('Enter your OpenAI API key')).toBeInTheDocument();
    });

    it('shows Anthropic placeholder text when Anthropic is selected', () => {
      render(<SettingsPage />);

      fireEvent.click(screen.getByText('Anthropic'));

      expect(screen.getByPlaceholderText('Enter your Anthropic API key')).toBeInTheDocument();
    });
  });

  describe('Save functionality', () => {
    it('renders Save Settings button', () => {
      render(<SettingsPage />);

      expect(screen.getByRole('button', { name: 'Save Settings' })).toBeInTheDocument();
    });

    it('updates store when Save Settings is clicked', () => {
      render(<SettingsPage />);

      fireEvent.click(screen.getByRole('button', { name: 'Save Settings' }));

      const { aiSettings } = useStore.getState();
      expect(aiSettings.provider).toBe('openai');
      expect(aiSettings.model).toBe('gpt-4o');
    });

    it('shows Saved! confirmation after saving', () => {
      render(<SettingsPage />);

      fireEvent.click(screen.getByRole('button', { name: 'Save Settings' }));

      expect(screen.getByText('Saved!')).toBeInTheDocument();
    });
  });
});
