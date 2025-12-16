import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { LayoutGrid } from './layout-grid';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from './card';
import { Badge } from './badge';

const meta = {
  title: 'UI/LayoutGrid',
  component: LayoutGrid,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'An interactive grid layout component that animates grid items upon interaction. Click on any card to expand it and view detailed content. Perfect for dashboard layouts and analytics displays.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    cards: {
      control: 'object',
      description:
        'Array of card objects with id, content, className, and thumbnail',
    },
  },
} satisfies Meta<typeof LayoutGrid>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Basic layout grid with three analytics cards.
 * Click on any card to expand and view details.
 */
export const AnalyticsDashboard: Story = {
  args: {
    cards: [
      {
        id: 1,
        content: (
          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="text-white">Total Games</CardTitle>
              <CardDescription className="text-white/80">
                All time statistics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-white">1,234</div>
              <Badge variant="secondary" className="mt-2">
                +12% from last month
              </Badge>
            </CardContent>
          </Card>
        ),
        className: 'col-span-1',
        thumbnail:
          'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=500&h=500&fit=crop',
      },
      {
        id: 2,
        content: (
          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="text-white">Win Rate</CardTitle>
              <CardDescription className="text-white/80">
                Overall performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-white">68.5%</div>
              <Badge variant="secondary" className="mt-2">
                +3.2% improvement
              </Badge>
            </CardContent>
          </Card>
        ),
        className: 'col-span-1',
        thumbnail:
          'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=500&h=500&fit=crop',
      },
      {
        id: 3,
        content: (
          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="text-white">ELO Rating</CardTitle>
              <CardDescription className="text-white/80">
                Current skill level
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-white">1,850</div>
              <Badge variant="secondary" className="mt-2">
                +45 points this month
              </Badge>
            </CardContent>
          </Card>
        ),
        className: 'col-span-1',
        thumbnail:
          'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=500&h=500&fit=crop',
      },
    ],
  },
};

/**
 * Layout grid with role-based performance metrics.
 * Demonstrates how the component can be used for role analytics.
 */
export const RoleMetrics: Story = {
  args: {
    cards: [
      {
        id: 1,
        content: (
          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="text-white">Don Performance</CardTitle>
              <CardDescription className="text-white/80">
                Mafia leader statistics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-white/80">Games Played:</span>
                  <span className="text-white font-bold">45</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/80">Win Rate:</span>
                  <span className="text-white font-bold">71.1%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/80">Avg ELO:</span>
                  <span className="text-white font-bold">1,920</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ),
        className: 'col-span-1',
        thumbnail:
          'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=500&h=500&fit=crop',
      },
      {
        id: 2,
        content: (
          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="text-white">Sheriff Performance</CardTitle>
              <CardDescription className="text-white/80">
                Town protector statistics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-white/80">Games Played:</span>
                  <span className="text-white font-bold">52</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/80">Win Rate:</span>
                  <span className="text-white font-bold">65.4%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/80">Avg ELO:</span>
                  <span className="text-white font-bold">1,780</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ),
        className: 'col-span-1',
        thumbnail:
          'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=500&h=500&fit=crop',
      },
      {
        id: 3,
        content: (
          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="text-white">Citizen Performance</CardTitle>
              <CardDescription className="text-white/80">
                Town member statistics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-white/80">Games Played:</span>
                  <span className="text-white font-bold">38</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/80">Win Rate:</span>
                  <span className="text-white font-bold">55.3%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/80">Avg ELO:</span>
                  <span className="text-white font-bold">1,650</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ),
        className: 'col-span-1',
        thumbnail:
          'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=500&h=500&fit=crop',
      },
    ],
  },
};

/**
 * Layout grid with simple text content.
 * Shows how the component works with minimal content.
 */
export const SimpleCards: Story = {
  args: {
    cards: [
      {
        id: 1,
        content: (
          <div className="text-white">
            <h3 className="text-2xl font-bold mb-2">Card 1</h3>
            <p className="text-white/80">
              This is a simple card with text content. Click to expand and see
              more details.
            </p>
          </div>
        ),
        className: 'col-span-1',
        thumbnail:
          'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=500&h=500&fit=crop',
      },
      {
        id: 2,
        content: (
          <div className="text-white">
            <h3 className="text-2xl font-bold mb-2">Card 2</h3>
            <p className="text-white/80">
              Another card with different content. The layout grid animates
              smoothly between states.
            </p>
          </div>
        ),
        className: 'col-span-1',
        thumbnail:
          'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=500&h=500&fit=crop',
      },
      {
        id: 3,
        content: (
          <div className="text-white">
            <h3 className="text-2xl font-bold mb-2">Card 3</h3>
            <p className="text-white/80">
              The third card demonstrates the grid layout with responsive
              design.
            </p>
          </div>
        ),
        className: 'col-span-1',
        thumbnail:
          'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=500&h=500&fit=crop',
      },
    ],
  },
};
