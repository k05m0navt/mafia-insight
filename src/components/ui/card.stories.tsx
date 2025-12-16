import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from './card';
import { Button } from './button';
import { Badge } from './badge';

const meta = {
  title: 'UI/Card',
  component: Card,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Card component with enhanced variants for different use cases. Supports metric, chart, info, and role-based variants.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: [
        'default',
        'elevated',
        'outlined',
        'ghost',
        'interactive',
        'metric',
        'chart',
        'info',
        'role',
      ],
      description: 'Card variant style',
    },
    padding: {
      control: 'select',
      options: ['none', 'sm', 'default', 'lg'],
      description: 'Card padding size',
    },
    roleType: {
      control: 'select',
      options: ['don', 'mafia', 'sheriff', 'citizen'],
      description: 'Role type for role variant',
      if: { arg: 'variant', eq: 'role' },
    },
  },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default card variant with standard styling.
 */
export const Default: Story = {
  args: {
    variant: 'default',
    children: (
      <>
        <CardHeader>
          <CardTitle>Card Title</CardTitle>
          <CardDescription>Card description goes here</CardDescription>
        </CardHeader>
        <CardContent>
          <p>This is the default card variant with standard styling.</p>
        </CardContent>
      </>
    ),
  },
};

/**
 * Elevated card with enhanced shadow and hover effect.
 */
export const Elevated: Story = {
  args: {
    variant: 'elevated',
    children: (
      <>
        <CardHeader>
          <CardTitle>Elevated Card</CardTitle>
          <CardDescription>Enhanced shadow with hover effect</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Hover over this card to see the enhanced shadow effect.</p>
        </CardContent>
      </>
    ),
  },
};

/**
 * Outlined card with border emphasis and no shadow.
 */
export const Outlined: Story = {
  args: {
    variant: 'outlined',
    children: (
      <>
        <CardHeader>
          <CardTitle>Outlined Card</CardTitle>
          <CardDescription>Border emphasis, no shadow</CardDescription>
        </CardHeader>
        <CardContent>
          <p>This card uses a 2px border for emphasis.</p>
        </CardContent>
      </>
    ),
  },
};

/**
 * Ghost card with transparent background.
 */
export const Ghost: Story = {
  args: {
    variant: 'ghost',
    children: (
      <>
        <CardHeader>
          <CardTitle>Ghost Card</CardTitle>
          <CardDescription>Transparent background</CardDescription>
        </CardHeader>
        <CardContent>
          <p>This card has no border or shadow, perfect for subtle content.</p>
        </CardContent>
      </>
    ),
  },
};

/**
 * Interactive card with clickable hover states.
 */
export const Interactive: Story = {
  args: {
    variant: 'interactive',
    children: (
      <>
        <CardHeader>
          <CardTitle>Interactive Card</CardTitle>
          <CardDescription>Clickable with hover effects</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Hover over this card to see the interactive effects.</p>
        </CardContent>
        <CardFooter>
          <Button>Action</Button>
        </CardFooter>
      </>
    ),
  },
};

/**
 * Metric card optimized for displaying large numbers with trend indicators.
 * Uses 8px border radius and 20px padding.
 */
export const Metric: Story = {
  args: {
    variant: 'metric',
    children: (
      <>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Games
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">1,234</div>
          <p className="text-xs text-muted-foreground mt-1">
            <span className="text-green-600">+12.5%</span> from last month
          </p>
        </CardContent>
      </>
    ),
  },
};

/**
 * Chart card for full chart display with title and controls area.
 */
export const Chart: Story = {
  args: {
    variant: 'chart',
    children: (
      <>
        <CardHeader>
          <CardTitle>Performance Chart</CardTitle>
          <CardDescription>Win rate over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center bg-muted rounded-md">
            <p className="text-muted-foreground">Chart visualization area</p>
          </div>
        </CardContent>
        <CardFooter className="justify-between">
          <Button variant="outline" size="sm">
            Export
          </Button>
          <Button variant="outline" size="sm">
            Settings
          </Button>
        </CardFooter>
      </>
    ),
  },
};

/**
 * Info card optimized for text content with icon support.
 */
export const Info: Story = {
  args: {
    variant: 'info',
    children: (
      <>
        <CardHeader>
          <CardTitle>Information</CardTitle>
          <CardDescription>Important details</CardDescription>
        </CardHeader>
        <CardContent>
          <p>
            This card variant is optimized for displaying informational content
            with icons and text.
          </p>
        </CardContent>
      </>
    ),
  },
};

/**
 * Role card with role-based color theming for Don role.
 * Uses 12px border radius and 24px padding.
 */
export const RoleDon: Story = {
  args: {
    variant: 'role',
    roleType: 'don',
    children: (
      <>
        <CardHeader>
          <CardTitle>Don Role</CardTitle>
          <CardDescription>Mafia leader</CardDescription>
        </CardHeader>
        <CardContent>
          <p>This card uses purple theming for the Don role.</p>
        </CardContent>
      </>
    ),
  },
};

/**
 * Role card with role-based color theming for Mafia role.
 */
export const RoleMafia: Story = {
  args: {
    variant: 'role',
    roleType: 'mafia',
    children: (
      <>
        <CardHeader>
          <CardTitle>Mafia Role</CardTitle>
          <CardDescription>Mafia member</CardDescription>
        </CardHeader>
        <CardContent>
          <p>This card uses gray theming for the Mafia role.</p>
        </CardContent>
      </>
    ),
  },
};

/**
 * Role card with role-based color theming for Sheriff role.
 */
export const RoleSheriff: Story = {
  args: {
    variant: 'role',
    roleType: 'sheriff',
    children: (
      <>
        <CardHeader>
          <CardTitle>Sheriff Role</CardTitle>
          <CardDescription>Law enforcement</CardDescription>
        </CardHeader>
        <CardContent>
          <p>This card uses yellow theming for the Sheriff role.</p>
        </CardContent>
      </>
    ),
  },
};

/**
 * Role card with role-based color theming for Citizen role.
 */
export const RoleCitizen: Story = {
  args: {
    variant: 'role',
    roleType: 'citizen',
    children: (
      <>
        <CardHeader>
          <CardTitle>Citizen Role</CardTitle>
          <CardDescription>Town member</CardDescription>
        </CardHeader>
        <CardContent>
          <p>This card uses red theming for the Citizen role.</p>
        </CardContent>
      </>
    ),
  },
};

/**
 * Card with different padding sizes.
 */
export const PaddingSizes: Story = {
  render: () => (
    <div className="space-y-4">
      <Card variant="default" padding="none">
        <CardContent className="p-4">
          <p>No padding (custom content padding)</p>
        </CardContent>
      </Card>
      <Card variant="default" padding="sm">
        <CardContent>
          <p>Small padding (16px)</p>
        </CardContent>
      </Card>
      <Card variant="default" padding="default">
        <CardContent>
          <p>Default padding (24px)</p>
        </CardContent>
      </Card>
      <Card variant="default" padding="lg">
        <CardContent>
          <p>Large padding (32px)</p>
        </CardContent>
      </Card>
    </div>
  ),
  parameters: {
    layout: 'padded',
  },
};

/**
 * Complete card example with all sections.
 */
export const Complete: Story = {
  args: {
    variant: 'default',
    children: (
      <>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Complete Card Example</CardTitle>
            <Badge variant="secondary">New</Badge>
          </div>
          <CardDescription>
            This card demonstrates all available sections
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>
            This is the main content area. You can place any content here,
            including charts, tables, forms, or other components.
          </p>
        </CardContent>
        <CardFooter className="justify-between">
          <Button variant="outline">Cancel</Button>
          <Button>Confirm</Button>
        </CardFooter>
      </>
    ),
  },
};
