import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { BentoGrid, BentoGridItem } from './bento-grid';
import {
  IconChartBar,
  IconUsers,
  IconTrophy,
  IconTrendingUp,
} from '@tabler/icons-react';
import { Card, CardContent } from './card';

const meta = {
  title: 'UI/BentoGrid',
  component: BentoGrid,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'A flexible grid layout component perfect for organizing metric cards and dashboard content. Supports responsive layouts with automatic row sizing.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof BentoGrid>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Analytics dashboard with performance metrics displayed in a bento grid layout.
 */
export const AnalyticsDashboard: Story = {
  render: () => (
    <BentoGrid>
      <BentoGridItem
        title="Total Games"
        description="All time statistics"
        header={
          <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-neutral-200 dark:from-neutral-900 dark:to-neutral-800 to-neutral-100" />
        }
        icon={<IconChartBar className="h-4 w-4 text-neutral-500" />}
        className="md:col-span-2"
      />
      <BentoGridItem
        title="Win Rate"
        description="Overall performance"
        header={
          <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-neutral-200 dark:from-neutral-900 dark:to-neutral-800 to-neutral-100" />
        }
        icon={<IconTrophy className="h-4 w-4 text-neutral-500" />}
      />
      <BentoGridItem
        title="Active Players"
        description="Current month"
        header={
          <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-neutral-200 dark:from-neutral-900 dark:to-neutral-800 to-neutral-100" />
        }
        icon={<IconUsers className="h-4 w-4 text-neutral-500" />}
      />
      <BentoGridItem
        title="ELO Rating"
        description="Current skill level"
        header={
          <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-neutral-200 dark:from-neutral-900 dark:to-neutral-800 to-neutral-100" />
        }
        icon={<IconTrendingUp className="h-4 w-4 text-neutral-500" />}
        className="md:col-span-2"
      />
    </BentoGrid>
  ),
};

/**
 * Role-based performance metrics in a bento grid layout.
 */
export const RoleMetrics: Story = {
  render: () => (
    <BentoGrid>
      <BentoGridItem
        title="Don Performance"
        description="Mafia leader statistics - 71.1% win rate"
        header={
          <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-red-200 dark:from-red-900 dark:to-red-800 to-red-100" />
        }
        icon={<IconTrophy className="h-4 w-4 text-red-500" />}
        className="md:col-span-2"
      />
      <BentoGridItem
        title="Sheriff Performance"
        description="Town protector statistics - 65.4% win rate"
        header={
          <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-blue-200 dark:from-blue-900 dark:to-blue-800 to-blue-100" />
        }
        icon={<IconTrophy className="h-4 w-4 text-blue-500" />}
      />
      <BentoGridItem
        title="Citizen Performance"
        description="Town member statistics - 55.3% win rate"
        header={
          <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-green-200 dark:from-green-900 dark:to-green-800 to-green-100" />
        }
        icon={<IconTrophy className="h-4 w-4 text-green-500" />}
      />
    </BentoGrid>
  ),
};

/**
 * Simple bento grid with card content.
 */
export const SimpleCards: Story = {
  render: () => (
    <BentoGrid>
      <BentoGridItem
        title="Card 1"
        description="First card in the grid layout"
        header={
          <Card>
            <CardContent className="p-4">
              <p className="text-sm">Card content area</p>
            </CardContent>
          </Card>
        }
        className="md:col-span-1"
      />
      <BentoGridItem
        title="Card 2"
        description="Second card with different content"
        header={
          <Card>
            <CardContent className="p-4">
              <p className="text-sm">Another card content area</p>
            </CardContent>
          </Card>
        }
        className="md:col-span-2"
      />
    </BentoGrid>
  ),
};
