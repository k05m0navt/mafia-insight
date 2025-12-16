import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Badge } from './badge';

const meta = {
  title: 'UI/Badge',
  component: Badge,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Badge component for displaying labels, status indicators, and tags. Supports multiple variants.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'secondary', 'destructive', 'outline'],
      description: 'Badge variant style',
    },
    children: {
      control: 'text',
      description: 'Badge content',
    },
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default badge variant with primary styling.
 */
export const Default: Story = {
  args: {
    variant: 'default',
    children: 'Badge',
  },
};

/**
 * Secondary badge variant.
 */
export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Secondary',
  },
};

/**
 * Destructive badge variant for errors or warnings.
 */
export const Destructive: Story = {
  args: {
    variant: 'destructive',
    children: 'Destructive',
  },
};

/**
 * Outline badge variant with border.
 */
export const Outline: Story = {
  args: {
    variant: 'outline',
    children: 'Outline',
  },
};

/**
 * All badge variants displayed together.
 */
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <Badge variant="default">Default</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="destructive">Destructive</Badge>
      <Badge variant="outline">Outline</Badge>
    </div>
  ),
  parameters: {
    layout: 'padded',
  },
};

/**
 * Badge with different content examples.
 */
export const ContentExamples: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4 items-center">
      <Badge>Status</Badge>
      <Badge variant="secondary">New</Badge>
      <Badge variant="destructive">Error</Badge>
      <Badge variant="outline">Tag</Badge>
      <Badge>123</Badge>
      <Badge variant="secondary">Beta</Badge>
    </div>
  ),
  parameters: {
    layout: 'padded',
  },
};
