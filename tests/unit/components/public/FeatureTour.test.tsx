import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/vitest';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { FeatureTour } from '@/components/public/FeatureTour';

// Mock next/link
vi.mock('next/link', () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

describe('FeatureTour', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render heading and description', () => {
    render(<FeatureTour />);

    expect(
      screen.getByText('Explore Our Features')
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Get a preview of the powerful analytics tools available/i
      )
    ).toBeInTheDocument();
  });

  it('should render all feature cards', () => {
    render(<FeatureTour />);

    // Each feature title appears multiple times (in cards and in preview), so use getAllByText
    expect(screen.getAllByText('Role Performance Analytics').length).toBeGreaterThan(0);
    expect(screen.getAllByText('ELO Rating & Trends').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Team & Club Analytics').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Tournament Performance').length).toBeGreaterThan(0);
  });

  it('should display first feature as active by default', () => {
    render(<FeatureTour />);

    // First feature should be active (Role Performance Analytics)
    expect(
      screen.getByText(/Track your performance across different roles/i)
    ).toBeInTheDocument();
  });

  it('should switch active feature when clicking feature card', async () => {
    const user = userEvent.setup();
    render(<FeatureTour />);

    // Initial feature should be Role Performance Analytics
    expect(
      screen.getByText(/Track your performance across different roles/i)
    ).toBeInTheDocument();

    // Click on ELO Rating & Trends card
    const eloCard = screen.getByRole('button', {
      name: /Select ELO Rating & Trends feature/i,
    });
    await user.click(eloCard);

    // Should now show ELO Rating content
    expect(
      screen.getByText(/Monitor your ELO rating over time/i)
    ).toBeInTheDocument();
  });

  it('should switch active feature with keyboard navigation', async () => {
    const user = userEvent.setup();
    render(<FeatureTour />);

    // Focus on first feature card
    const firstCard = screen.getByRole('button', {
      name: /Select Role Performance Analytics feature/i,
    });
    firstCard.focus();

    // Press Enter to activate (though it's already active)
    await user.keyboard('{Enter}');

    // Navigate to Team & Club Analytics
    const teamCard = screen.getByRole('button', {
      name: /Select Team & Club Analytics feature/i,
    });
    teamCard.focus();
    await user.keyboard('{Enter}');

    // Should now show Team & Club Analytics content
    expect(
      screen.getByText(/Analyze your club performance/i)
    ).toBeInTheDocument();
  });

  it('should switch active feature with Space key', async () => {
    const user = userEvent.setup();
    render(<FeatureTour />);

    // Navigate to Tournament Performance
    const tournamentCard = screen.getByRole('button', {
      name: /Select Tournament Performance feature/i,
    });
    tournamentCard.focus();
    await user.keyboard(' ');

    // Should now show Tournament Performance content
    expect(
      screen.getByText(/Follow tournament updates/i)
    ).toBeInTheDocument();
  });

  it('should display sample data for active feature', () => {
    render(<FeatureTour />);

    // Default feature (Role Performance Analytics) should show sample data
    expect(screen.getByText('DON')).toBeInTheDocument();
    expect(screen.getByText('72.5%')).toBeInTheDocument();
    // "Win Rate" appears multiple times (for each role), so use getAllByText
    expect(screen.getAllByText('Win Rate').length).toBeGreaterThanOrEqual(4);

    expect(screen.getByText('MAFIA')).toBeInTheDocument();
    expect(screen.getByText('68.2%')).toBeInTheDocument();

    expect(screen.getByText('SHERIFF')).toBeInTheDocument();
    expect(screen.getByText('65.8%')).toBeInTheDocument();

    expect(screen.getByText('CITIZEN')).toBeInTheDocument();
    expect(screen.getByText('61.3%')).toBeInTheDocument();
  });

  it('should update sample data when switching features', async () => {
    const user = userEvent.setup();
    render(<FeatureTour />);

    // Switch to ELO Rating & Trends
    const eloCard = screen.getByRole('button', {
      name: /Select ELO Rating & Trends feature/i,
    });
    await user.click(eloCard);

    // Should show ELO sample data
    expect(screen.getByText('Current ELO')).toBeInTheDocument();
    expect(screen.getByText('1,245')).toBeInTheDocument();
    // Check for "points" text - use getAllByText since it appears multiple times
    const pointsTexts = screen.getAllByText('points');
    expect(pointsTexts.length).toBeGreaterThan(0);

    expect(screen.getByText('Peak ELO')).toBeInTheDocument();
    expect(screen.getByText('1,320')).toBeInTheDocument();

    expect(screen.getByText('This Month')).toBeInTheDocument();
    expect(screen.getByText('+45')).toBeInTheDocument();

    expect(screen.getByText('Rank')).toBeInTheDocument();
    expect(screen.getByText('#127')).toBeInTheDocument();
  });

  it('should display preview badge', () => {
    render(<FeatureTour />);

    expect(
      screen.getByText('This is a preview with sample data')
    ).toBeInTheDocument();
  });

  it('should display sign up call-to-action button', () => {
    render(<FeatureTour />);

    const signUpLink = screen.getByRole('link', {
      name: /Sign Up to Access Full Features/i,
    });

    expect(signUpLink).toBeInTheDocument();
    expect(signUpLink).toHaveAttribute('href', '/signup');
  });

  it('should display sign up prompt text', () => {
    render(<FeatureTour />);

    expect(
      screen.getByText(
        /Create a free account to unlock personalized analytics/i
      )
    ).toBeInTheDocument();
  });

  it('should render additional features section', () => {
    render(<FeatureTour />);

    expect(screen.getByText('Advanced Charts')).toBeInTheDocument();
    expect(screen.getByText('Performance Goals')).toBeInTheDocument();
  });

  it('should set aria-pressed on active feature card', () => {
    render(<FeatureTour />);

    const activeCard = screen.getByRole('button', {
      name: /Select Role Performance Analytics feature/i,
    });

    expect(activeCard).toHaveAttribute('aria-pressed', 'true');
  });

  it('should set aria-pressed to false on inactive feature cards', () => {
    render(<FeatureTour />);

    const inactiveCard = screen.getByRole('button', {
      name: /Select ELO Rating & Trends feature/i,
    });

    expect(inactiveCard).toHaveAttribute('aria-pressed', 'false');
  });

  it('should update aria-pressed when switching features', async () => {
    const user = userEvent.setup();
    render(<FeatureTour />);

    // Initially, first card should be active
    const firstCard = screen.getByRole('button', {
      name: /Select Role Performance Analytics feature/i,
    });
    expect(firstCard).toHaveAttribute('aria-pressed', 'true');

    // Click second card
    const secondCard = screen.getByRole('button', {
      name: /Select ELO Rating & Trends feature/i,
    });
    await user.click(secondCard);

    // Now second card should be active
    expect(secondCard).toHaveAttribute('aria-pressed', 'true');
    expect(firstCard).toHaveAttribute('aria-pressed', 'false');
  });

  it('should render icons for each feature', () => {
    render(<FeatureTour />);

    // Icons have aria-hidden="true"
    const icons = document.querySelectorAll('[aria-hidden="true"]');
    // Should have at least 4 feature icons + additional feature icons
    expect(icons.length).toBeGreaterThanOrEqual(4);
  });

  it('should have proper tabIndex for keyboard navigation', () => {
    render(<FeatureTour />);

    const featureCards = screen.getAllByRole('button', {
      name: /Select .* feature/i,
    });

    featureCards.forEach((card) => {
      expect(card).toHaveAttribute('tabIndex', '0');
    });
  });

  it('should render responsive grid layout', () => {
    const { container } = render(<FeatureTour />);

    // Check for responsive grid classes
    const grid = container.querySelector('.grid');
    expect(grid).toHaveClass('grid-cols-1');
    expect(grid).toHaveClass('lg:grid-cols-3');
  });

  it('should handle rapid feature switching', async () => {
    const user = userEvent.setup();
    render(<FeatureTour />);

    const cards = [
      screen.getByRole('button', {
        name: /Select Role Performance Analytics feature/i,
      }),
      screen.getByRole('button', {
        name: /Select ELO Rating & Trends feature/i,
      }),
      screen.getByRole('button', {
        name: /Select Team & Club Analytics feature/i,
      }),
      screen.getByRole('button', {
        name: /Select Tournament Performance feature/i,
      }),
    ];

    // Rapidly click through all cards
    for (const card of cards) {
      await user.click(card);
    }

    // Final card should be active
    expect(cards[3]).toHaveAttribute('aria-pressed', 'true');
  });

  it('should display correct description for each feature', async () => {
    const user = userEvent.setup();
    render(<FeatureTour />);

    // Test Role Performance Analytics
    expect(
      screen.getByText(
        /Track your performance across different roles with detailed statistics/i
      )
    ).toBeInTheDocument();

    // Switch to ELO
    await user.click(
      screen.getByRole('button', {
        name: /Select ELO Rating & Trends feature/i,
      })
    );
    expect(
      screen.getByText(/Monitor your ELO rating over time with historical trends/i)
    ).toBeInTheDocument();

    // Switch to Team
    await user.click(
      screen.getByRole('button', {
        name: /Select Team & Club Analytics feature/i,
      })
    );
    expect(
      screen.getByText(/Analyze your club performance, member rankings/i)
    ).toBeInTheDocument();

    // Switch to Tournament
    await user.click(
      screen.getByRole('button', {
        name: /Select Tournament Performance feature/i,
      })
    );
    expect(
      screen.getByText(/Follow tournament updates, track brackets/i)
    ).toBeInTheDocument();
  });
});
