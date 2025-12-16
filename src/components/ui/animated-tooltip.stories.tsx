import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { AnimatedTooltip } from './animated-tooltip';

const meta = {
  title: 'UI/AnimatedTooltip',
  component: AnimatedTooltip,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'An animated tooltip component that displays user information on hover. Perfect for showing player details, avatars, and designations in analytics dashboards.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    items: {
      control: 'object',
      description: 'Array of items with id, name, designation, and image',
    },
  },
} satisfies Meta<typeof AnimatedTooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Tooltip with top players showing their names and designations.
 */
export const TopPlayers: Story = {
  args: {
    items: [
      {
        id: 1,
        name: 'Player One',
        designation: 'ELO: 1,920 | Win Rate: 71.1%',
        image:
          'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop',
      },
      {
        id: 2,
        name: 'Player Two',
        designation: 'ELO: 1,850 | Win Rate: 68.5%',
        image:
          'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
      },
      {
        id: 3,
        name: 'Player Three',
        designation: 'ELO: 1,780 | Win Rate: 65.4%',
        image:
          'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
      },
      {
        id: 4,
        name: 'Player Four',
        designation: 'ELO: 1,720 | Win Rate: 62.3%',
        image:
          'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop',
      },
    ],
  },
};

/**
 * Tooltip with role-based player information.
 */
export const RolePlayers: Story = {
  args: {
    items: [
      {
        id: 1,
        name: 'Don Player',
        designation: 'Role: Don | Games: 45',
        image:
          'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop',
      },
      {
        id: 2,
        name: 'Sheriff Player',
        designation: 'Role: Sheriff | Games: 52',
        image:
          'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
      },
      {
        id: 3,
        name: 'Citizen Player',
        designation: 'Role: Citizen | Games: 38',
        image:
          'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
      },
    ],
  },
};

/**
 * Single player tooltip example.
 */
export const SinglePlayer: Story = {
  args: {
    items: [
      {
        id: 1,
        name: 'Top Performer',
        designation: 'ELO: 1,920 | Win Rate: 71.1% | Games: 45',
        image:
          'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop',
      },
    ],
  },
};
