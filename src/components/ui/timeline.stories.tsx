import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Timeline } from './timeline';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from './card';
import { Badge } from './badge';

const meta = {
  title: 'UI/Timeline',
  component: Timeline,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'A scroll-animated timeline component perfect for displaying game history, tournament events, and chronological data. Features smooth scroll-based animations and responsive design.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    data: {
      control: 'object',
      description: 'Array of timeline entries with title and content',
    },
  },
} satisfies Meta<typeof Timeline>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Game history timeline showing recent games and performance milestones.
 */
export const GameHistory: Story = {
  args: {
    data: [
      {
        title: '2024',
        content: (
          <Card>
            <CardHeader>
              <CardTitle>Tournament Championship</CardTitle>
              <CardDescription>January 2024</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm mb-2">
                Won the annual tournament with a 75% win rate.
              </p>
              <div className="flex gap-2">
                <Badge>Champion</Badge>
                <Badge variant="secondary">ELO: 1,920</Badge>
              </div>
            </CardContent>
          </Card>
        ),
      },
      {
        title: '2023',
        content: (
          <Card>
            <CardHeader>
              <CardTitle>Best Performance Month</CardTitle>
              <CardDescription>September 2023</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm mb-2">
                Achieved 80% win rate playing as Don role.
              </p>
              <div className="flex gap-2">
                <Badge>Don</Badge>
                <Badge variant="secondary">45 games</Badge>
              </div>
            </CardContent>
          </Card>
        ),
      },
      {
        title: '2022',
        content: (
          <Card>
            <CardHeader>
              <CardTitle>First Tournament</CardTitle>
              <CardDescription>March 2022</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm mb-2">
                Participated in first competitive tournament.
              </p>
              <div className="flex gap-2">
                <Badge variant="outline">Rookie</Badge>
                <Badge variant="secondary">ELO: 1,500</Badge>
              </div>
            </CardContent>
          </Card>
        ),
      },
    ],
  },
};

/**
 * Tournament timeline showing event progression.
 */
export const TournamentTimeline: Story = {
  args: {
    data: [
      {
        title: 'Final',
        content: (
          <Card>
            <CardHeader>
              <CardTitle>Championship Match</CardTitle>
              <CardDescription>Final Round</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                Won as Don with perfect strategy execution.
              </p>
            </CardContent>
          </Card>
        ),
      },
      {
        title: 'Semi',
        content: (
          <Card>
            <CardHeader>
              <CardTitle>Semi-Final</CardTitle>
              <CardDescription>Round 2</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm">Advanced as Sheriff with 68% win rate.</p>
            </CardContent>
          </Card>
        ),
      },
      {
        title: 'Quarter',
        content: (
          <Card>
            <CardHeader>
              <CardTitle>Quarter-Final</CardTitle>
              <CardDescription>Round 1</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                Qualified as Citizen with solid performance.
              </p>
            </CardContent>
          </Card>
        ),
      },
    ],
  },
};

/**
 * Performance milestones timeline.
 */
export const PerformanceMilestones: Story = {
  args: {
    data: [
      {
        title: '2K ELO',
        content: (
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm">Reached 2,000 ELO rating milestone.</p>
            </CardContent>
          </Card>
        ),
      },
      {
        title: '1.5K ELO',
        content: (
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm">Achieved 1,500 ELO rating.</p>
            </CardContent>
          </Card>
        ),
      },
      {
        title: '1K ELO',
        content: (
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm">Started competitive play at 1,000 ELO.</p>
            </CardContent>
          </Card>
        ),
      },
    ],
  },
};
