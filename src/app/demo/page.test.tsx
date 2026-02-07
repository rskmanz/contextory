import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import DemoPage from './page';

// Mock next/link to render a plain anchor
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

describe('DemoPage', () => {
  it('renders the page header with Contextory branding', () => {
    render(<DemoPage />);

    const allBranding = screen.getAllByText('Contextory');
    expect(allBranding.length).toBeGreaterThanOrEqual(1);
    // The header should be the bold span
    const header = allBranding.find((el) => el.classList.contains('text-xl'));
    expect(header).toBeInTheDocument();
  });

  it('does not contain old "Context OS" branding', () => {
    const { container } = render(<DemoPage />);

    expect(container.textContent).not.toContain('Context OS');
    expect(container.textContent).not.toContain('context-os');
  });

  it('renders the Try Demo link', () => {
    render(<DemoPage />);

    const link = screen.getByText('Try Demo');
    expect(link).toBeInTheDocument();
    expect(link.closest('a')).toHaveAttribute('href', '/');
  });

  it('renders the data hierarchy columns', () => {
    render(<DemoPage />);

    expect(screen.getByText('TARGET')).toBeInTheDocument();
    expect(screen.getByText('PROJECT')).toBeInTheDocument();
    expect(screen.getByText('WORKSPACE')).toBeInTheDocument();
    expect(screen.getByText('ITEMS')).toBeInTheDocument();
    expect(screen.getByText('ITEM CONTEXT')).toBeInTheDocument();
  });

  it('renders the project example', () => {
    render(<DemoPage />);

    expect(screen.getByText('Founder University')).toBeInTheDocument();
  });

  it('renders workspace examples', () => {
    render(<DemoPage />);

    expect(screen.getByText('Pitch Deck')).toBeInTheDocument();
  });

  it('renders the 8 visualization types', () => {
    render(<DemoPage />);

    expect(screen.getByText('8 VIEWS')).toBeInTheDocument();
    expect(screen.getByText('List')).toBeInTheDocument();
    expect(screen.getByText('Mindmap')).toBeInTheDocument();
    expect(screen.getByText('Kanban')).toBeInTheDocument();
    expect(screen.getByText('Grid')).toBeInTheDocument();
    expect(screen.getByText('Flow')).toBeInTheDocument();
    expect(screen.getByText('Table')).toBeInTheDocument();
    expect(screen.getByText('Gantt')).toBeInTheDocument();
    // Canvas appears in both 8 VIEWS section and nested context, use getAllByText
    const canvasElements = screen.getAllByText('Canvas');
    expect(canvasElements.length).toBeGreaterThanOrEqual(1);
  });

  it('renders the nested context section', () => {
    render(<DemoPage />);

    expect(screen.getByText('NESTED CONTEXT')).toBeInTheDocument();
    expect(screen.getByText('Feature: Views')).toBeInTheDocument();
  });

  it('renders the key message about context hierarchy', () => {
    render(<DemoPage />);

    expect(screen.getByText(/Every level has context/)).toBeInTheDocument();
  });
});
