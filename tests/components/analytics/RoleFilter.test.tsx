/**
 * Component tests for RoleFilter
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RoleFilter } from '@/components/analytics/RoleFilter';
import type { PlayerRole } from '@/types/analytics';

describe('RoleFilter', () => {
  const defaultOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render all role buttons', () => {
    render(<RoleFilter value={[]} onChange={defaultOnChange} />);

    expect(screen.getByText('Don')).toBeInTheDocument();
    expect(screen.getByText('Mafia')).toBeInTheDocument();
    expect(screen.getByText('Sheriff')).toBeInTheDocument();
    expect(screen.getByText('Citizen')).toBeInTheDocument();
  });

  it('should highlight selected roles', () => {
    render(<RoleFilter value={['DON']} onChange={defaultOnChange} />);

    const donButton = screen.getByText('Don').closest('button');
    expect(donButton).toHaveClass('shadow-md');
  });

  it('should not highlight unselected roles', () => {
    render(<RoleFilter value={['DON']} onChange={defaultOnChange} />);

    const mafiaButton = screen.getByText('Mafia').closest('button');
    expect(mafiaButton).not.toHaveClass('shadow-md');
  });

  it('should call onChange when role button is clicked (add role)', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<RoleFilter value={[]} onChange={onChange} />);

    const donButton = screen.getByText('Don');
    await user.click(donButton);

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(['DON']);
  });

  it('should call onChange when selected role button is clicked (remove role)', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<RoleFilter value={['DON', 'MAFIA']} onChange={onChange} />);

    const donButton = screen.getByText('Don');
    await user.click(donButton);

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(['MAFIA']);
  });

  it('should show clear button when roles are selected', () => {
    render(<RoleFilter value={['DON']} onChange={defaultOnChange} />);

    expect(screen.getByText('Clear')).toBeInTheDocument();
  });

  it('should not show clear button when no roles are selected', () => {
    render(<RoleFilter value={[]} onChange={defaultOnChange} />);

    expect(screen.queryByText('Clear')).not.toBeInTheDocument();
  });

  it('should call onChange with empty array when clear button is clicked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<RoleFilter value={['DON', 'MAFIA']} onChange={onChange} />);

    const clearButton = screen.getByText('Clear');
    await user.click(clearButton);

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it('should display active filter indicator when roles are selected', () => {
    render(<RoleFilter value={['DON']} onChange={defaultOnChange} />);

    expect(screen.getByText(/Filtering by:/)).toBeInTheDocument();
    expect(screen.getByText('Don')).toBeInTheDocument();
  });

  it('should display multiple roles in filter indicator', () => {
    render(
      <RoleFilter
        value={['DON', 'MAFIA', 'SHERIFF']}
        onChange={defaultOnChange}
      />
    );

    expect(screen.getByText(/Filtering by:/)).toBeInTheDocument();
    expect(screen.getByText('Don, Mafia, Sheriff')).toBeInTheDocument();
  });

  it('should not display filter indicator when no roles are selected', () => {
    render(<RoleFilter value={[]} onChange={defaultOnChange} />);

    expect(screen.queryByText(/Filtering by:/)).not.toBeInTheDocument();
  });

  it('should support multi-select', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<RoleFilter value={[]} onChange={onChange} />);

    // Select first role
    await user.click(screen.getByText('Don'));
    expect(onChange).toHaveBeenCalledWith(['DON']);

    // Select second role (simulate state update)
    onChange.mockClear();
    render(<RoleFilter value={['DON']} onChange={onChange} />);
    await user.click(screen.getByText('Mafia'));
    expect(onChange).toHaveBeenCalledWith(['DON', 'MAFIA']);
  });

  it('should accept custom className', () => {
    const { container } = render(
      <RoleFilter
        value={[]}
        onChange={defaultOnChange}
        className="custom-class"
      />
    );

    const filterContainer = container.firstChild as HTMLElement;
    expect(filterContainer).toHaveClass('custom-class');
  });

  it('should handle all roles selected', () => {
    const allRoles: PlayerRole[] = ['DON', 'MAFIA', 'SHERIFF', 'CITIZEN'];
    render(<RoleFilter value={allRoles} onChange={defaultOnChange} />);

    // All buttons should be highlighted
    expect(screen.getByText('Don').closest('button')).toHaveClass('shadow-md');
    expect(screen.getByText('Mafia').closest('button')).toHaveClass(
      'shadow-md'
    );
    expect(screen.getByText('Sheriff').closest('button')).toHaveClass(
      'shadow-md'
    );
    expect(screen.getByText('Citizen').closest('button')).toHaveClass(
      'shadow-md'
    );
  });
});
