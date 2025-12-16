import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { AnimatedTabs } from './animated-tabs';
import { Card, CardContent, CardHeader, CardTitle } from './card';

const meta = {
  title: 'UI/AnimatedTabs',
  component: AnimatedTabs,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'An animated tabs component with smooth transitions and 3D effects. Perfect for organizing analytics views, role filters, and dashboard sections.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    tabs: {
      control: 'object',
      description: 'Array of tab objects with title, value, and content',
    },
  },
} satisfies Meta<typeof AnimatedTabs>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Analytics tabs with different metric views.
 */
export const AnalyticsTabs: Story = {
  args: {
    tabs: [
      {
        title: 'Overview',
        value: 'overview',
        content: (
          <Card>
            <CardHeader>
              <CardTitle>Overview Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Total Games: 1,234 | Win Rate: 68.5% | ELO: 1,850
              </p>
            </CardContent>
          </Card>
        ),
      },
      {
        title: 'Performance',
        value: 'performance',
        content: (
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Recent performance trends and statistics over time.
              </p>
            </CardContent>
          </Card>
        ),
      },
      {
        title: 'Roles',
        value: 'roles',
        content: (
          <Card>
            <CardHeader>
              <CardTitle>Role Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Performance breakdown by role (Don, Sheriff, Citizen, Mafia).
              </p>
            </CardContent>
          </Card>
        ),
      },
    ],
  },
};

/**
 * Role filter tabs for analytics views.
 */
export const RoleFilterTabs: Story = {
  args: {
    tabs: [
      {
        title: 'All Roles',
        value: 'all',
        content: (
          <Card>
            <CardContent className="p-6">
              <p className="text-sm">
                Showing statistics for all roles combined.
              </p>
            </CardContent>
          </Card>
        ),
      },
      {
        title: 'Don',
        value: 'don',
        content: (
          <Card>
            <CardContent className="p-6">
              <p className="text-sm">
                Mafia leader performance: 71.1% win rate, 45 games.
              </p>
            </CardContent>
          </Card>
        ),
      },
      {
        title: 'Sheriff',
        value: 'sheriff',
        content: (
          <Card>
            <CardContent className="p-6">
              <p className="text-sm">
                Town protector performance: 65.4% win rate, 52 games.
              </p>
            </CardContent>
          </Card>
        ),
      },
      {
        title: 'Citizen',
        value: 'citizen',
        content: (
          <Card>
            <CardContent className="p-6">
              <p className="text-sm">
                Town member performance: 55.3% win rate, 38 games.
              </p>
            </CardContent>
          </Card>
        ),
      },
    ],
  },
};

/**
 * Simple tabs with text content.
 */
export const SimpleTabs: Story = {
  args: {
    tabs: [
      {
        title: 'Tab 1',
        value: 'tab1',
        content: (
          <div className="p-4">
            <p>Content for Tab 1</p>
          </div>
        ),
      },
      {
        title: 'Tab 2',
        value: 'tab2',
        content: (
          <div className="p-4">
            <p>Content for Tab 2</p>
          </div>
        ),
      },
      {
        title: 'Tab 3',
        value: 'tab3',
        content: (
          <div className="p-4">
            <p>Content for Tab 3</p>
          </div>
        ),
      },
    ],
  },
};
