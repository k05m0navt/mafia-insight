import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { HoverEffect } from './card-hover-effect';

const meta = {
  title: 'UI/CardHoverEffect',
  component: HoverEffect,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'An interactive card grid with smooth hover effects. Perfect for displaying analytics cards, metrics, and navigation items with engaging animations.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    items: {
      control: 'object',
      description: 'Array of items with title, description, and link',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes',
    },
  },
} satisfies Meta<typeof HoverEffect>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Analytics cards with hover effects for dashboard navigation.
 */
export const AnalyticsCards: Story = {
  args: {
    items: [
      {
        title: 'Game Statistics',
        description:
          'View detailed game statistics, win rates, and performance metrics.',
        link: '#',
      },
      {
        title: 'Player Analytics',
        description:
          'Explore player performance, ELO ratings, and role-based statistics.',
        link: '#',
      },
      {
        title: 'Tournament History',
        description: 'Browse complete tournament history and game records.',
        link: '#',
      },
      {
        title: 'Role Performance',
        description:
          'Analyze performance across different roles (Don, Sheriff, Citizen).',
        link: '#',
      },
      {
        title: 'Trends & Insights',
        description: 'Discover trends and insights from your gameplay data.',
        link: '#',
      },
      {
        title: 'Settings',
        description:
          'Configure your dashboard preferences and display options.',
        link: '#',
      },
    ],
  },
};

/**
 * Role-based performance cards with hover effects.
 */
export const RolePerformance: Story = {
  args: {
    items: [
      {
        title: 'Don Performance',
        description:
          'Mafia leader statistics: 71.1% win rate, 45 games played.',
        link: '#',
      },
      {
        title: 'Sheriff Performance',
        description:
          'Town protector statistics: 65.4% win rate, 52 games played.',
        link: '#',
      },
      {
        title: 'Citizen Performance',
        description: 'Town member statistics: 55.3% win rate, 38 games played.',
        link: '#',
      },
    ],
  },
};

/**
 * Simple navigation cards with hover effects.
 */
export const NavigationCards: Story = {
  args: {
    items: [
      {
        title: 'Dashboard',
        description: 'Main dashboard overview',
        link: '#',
      },
      {
        title: 'Analytics',
        description: 'Detailed analytics and reports',
        link: '#',
      },
      {
        title: 'Profile',
        description: 'User profile and settings',
        link: '#',
      },
    ],
  },
};
