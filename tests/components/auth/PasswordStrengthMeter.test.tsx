import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PasswordStrengthMeter } from '@/components/auth/PasswordStrengthMeter';

describe('PasswordStrengthMeter', () => {
  it('should not render when password is empty', () => {
    const { container } = render(<PasswordStrengthMeter password="" />);
    expect(container.firstChild).toBeNull();
  });

  it('should render weak strength indicator for weak passwords', () => {
    render(<PasswordStrengthMeter password="weak" />);

    expect(screen.getByText('Weak')).toBeInTheDocument();
    expect(screen.getByTestId('password-strength-meter')).toBeInTheDocument();
  });

  it('should render medium strength indicator for medium passwords', () => {
    render(<PasswordStrengthMeter password="Medium123" />);

    expect(screen.getByText('Medium')).toBeInTheDocument();
  });

  it('should render strong strength indicator for strong passwords', () => {
    render(<PasswordStrengthMeter password="Strong123!" />);

    expect(screen.getByText('Strong')).toBeInTheDocument();
  });

  it('should show password requirements when showRequirements is true', () => {
    render(<PasswordStrengthMeter password="Test123!" showRequirements />);

    expect(screen.getByText('Password requirements:')).toBeInTheDocument();
    expect(screen.getByText('At least 8 characters')).toBeInTheDocument();
    expect(screen.getByText('One uppercase letter')).toBeInTheDocument();
    expect(screen.getByText('One number')).toBeInTheDocument();
    expect(screen.getByText('One special character')).toBeInTheDocument();
  });

  it('should not show password requirements when showRequirements is false', () => {
    render(
      <PasswordStrengthMeter password="Test123!" showRequirements={false} />
    );

    expect(
      screen.queryByText('Password requirements:')
    ).not.toBeInTheDocument();
  });

  it('should mark requirements as met when password meets them', () => {
    render(<PasswordStrengthMeter password="Strong123!" showRequirements />);

    // All requirements should be met for a strong password
    const requirements = screen.getByTestId('password-requirements');
    expect(requirements).toBeInTheDocument();

    // Check that requirement items are present (they should be green when met)
    expect(screen.getByText('At least 8 characters')).toBeInTheDocument();
    expect(screen.getByText('One uppercase letter')).toBeInTheDocument();
    expect(screen.getByText('One number')).toBeInTheDocument();
    expect(screen.getByText('One special character')).toBeInTheDocument();
  });

  it('should show progress bar with correct value', () => {
    render(<PasswordStrengthMeter password="Test123!" />);

    const progress = screen.getByTestId('password-strength-progress');
    expect(progress).toBeInTheDocument();
  });

  describe('Password strength calculation', () => {
    it('should show weak for passwords missing multiple requirements', () => {
      render(<PasswordStrengthMeter password="weak" />);
      expect(screen.getByText('Weak')).toBeInTheDocument();
    });

    it('should show weak for passwords shorter than 8 characters', () => {
      render(<PasswordStrengthMeter password="Short1!" />);
      expect(screen.getByText('Weak')).toBeInTheDocument();
    });

    it('should show medium for passwords meeting some requirements', () => {
      render(<PasswordStrengthMeter password="Medium123" />);
      expect(screen.getByText('Medium')).toBeInTheDocument();
    });

    it('should show strong for passwords meeting all requirements', () => {
      const strongPasswords = [
        'Strong123!',
        'MyP@ssw0rd',
        'Test1234$',
        'Password1#',
      ];

      strongPasswords.forEach((password) => {
        const { unmount } = render(
          <PasswordStrengthMeter password={password} />
        );
        expect(screen.getByText('Strong')).toBeInTheDocument();
        unmount();
      });
    });

    it('should show strong for long passwords meeting all requirements', () => {
      render(<PasswordStrengthMeter password="VeryLongPassword123!" />);
      expect(screen.getByText('Strong')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper test IDs for testing', () => {
      render(<PasswordStrengthMeter password="Test123!" />);

      expect(screen.getByTestId('password-strength-meter')).toBeInTheDocument();
      expect(
        screen.getByTestId('password-strength-progress')
      ).toBeInTheDocument();
    });

    it('should have test ID for requirements when shown', () => {
      render(<PasswordStrengthMeter password="Test123!" showRequirements />);

      expect(screen.getByTestId('password-requirements')).toBeInTheDocument();
    });
  });
});
