import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { TooltipCard } from './tooltip-card';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Badge } from './badge';

const meta = {
  title: 'UI/TooltipCard',
  component: TooltipCard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A rich tooltip component that displays contextual information on hover. Perfect for analytics data points, player information, and detailed metric explanations.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    content: {
      control: 'text',
      description: 'Tooltip content (string or React node)',
    },
    children: {
      control: false,
      description: 'Element that triggers the tooltip',
    },
  },
} satisfies Meta<typeof TooltipCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Simple text tooltip on a metric card.
 */
export const SimpleTooltip: Story = {
  args: {
    content:
      'Total number of games played across all tournaments and casual matches.',
    children: (
      <Card className="cursor-help">
        <CardHeader>
          <CardTitle>Total Games</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold">1,234</div>
        </CardContent>
      </Card>
    ),
  },
};

/**
 * Rich tooltip with formatted content and badges.
 */
export const RichTooltip: Story = {
  args: {
    content: (
      <div className="space-y-2">
        <div className="font-semibold">Win Rate Calculation</div>
        <p className="text-xs">
          Win rate is calculated as the percentage of games won out of total
          games played.
        </p>
        <div className="flex gap-2 pt-2">
          <Badge variant="secondary">Wins: 845</Badge>
          <Badge variant="secondary">Total: 1,234</Badge>
        </div>
      </div>
    ),
    children: (
      <Card className="cursor-help">
        <CardHeader>
          <CardTitle>Win Rate</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold">68.5%</div>
        </CardContent>
      </Card>
    ),
  },
};

/**
 * Tooltip on a player avatar showing player details.
 */
export const PlayerTooltip: Story = {
  args: {
    content: (
      <div className="space-y-2">
        <div className="font-semibold">Top Performer</div>
        <p className="text-xs">ELO: 1,920 | Win Rate: 71.1%</p>
        <p className="text-xs">Games: 45 | Favorite Role: Don</p>
      </div>
    ),
    children: (
      <div className="h-14 w-14 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold cursor-help">
        TP
      </div>
    ),
  },
};

/**
 * Analytics tooltip with detailed statistics.
 */
export const AnalyticsTooltip: Story = {
  args: {
    content: (
      <div className="space-y-2">
        <div className="font-semibold">ELO Rating System</div>
        <p className="text-xs">
          ELO rating reflects your skill level. Higher ratings indicate better
          performance.
        </p>
        <div className="pt-2 space-y-1 text-xs">
          <div className="flex justify-between">
            <span>Current Rating:</span>
            <span className="font-semibold">1,850</span>
          </div>
          <div className="flex justify-between">
            <span>Peak Rating:</span>
            <span className="font-semibold">1,920</span>
          </div>
          <div className="flex justify-between">
            <span>Change (30d):</span>
            <span className="font-semibold text-green-600">+45</span>
          </div>
        </div>
      </div>
    ),
    children: (
      <Card className="cursor-help">
        <CardHeader>
          <CardTitle>ELO Rating</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold">1,850</div>
        </CardContent>
      </Card>
    ),
  },
};
