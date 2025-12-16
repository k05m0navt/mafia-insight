import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Button } from './button';
import { Download, Heart, Settings } from 'lucide-react';

const meta = {
  title: 'UI/Button',
  component: Button,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Button component with multiple variants and sizes. Supports icons and different states.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: [
        'default',
        'destructive',
        'outline',
        'secondary',
        'ghost',
        'link',
      ],
      description: 'Button variant style',
    },
    size: {
      control: 'select',
      options: ['default', 'sm', 'lg', 'icon'],
      description: 'Button size',
    },
    disabled: {
      control: 'boolean',
      description: 'Disabled state',
    },
    children: {
      control: 'text',
      description: 'Button content',
    },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default button variant.
 */
export const Default: Story = {
  args: {
    variant: 'default',
    children: 'Button',
  },
};

/**
 * Destructive button variant for dangerous actions.
 */
export const Destructive: Story = {
  args: {
    variant: 'destructive',
    children: 'Delete',
  },
};

/**
 * Outline button variant.
 */
export const Outline: Story = {
  args: {
    variant: 'outline',
    children: 'Outline',
  },
};

/**
 * Secondary button variant.
 */
export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Secondary',
  },
};

/**
 * Ghost button variant.
 */
export const Ghost: Story = {
  args: {
    variant: 'ghost',
    children: 'Ghost',
  },
};

/**
 * Link button variant.
 */
export const Link: Story = {
  args: {
    variant: 'link',
    children: 'Link',
  },
};

/**
 * Button sizes.
 */
export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Button size="sm">Small</Button>
      <Button size="default">Default</Button>
      <Button size="lg">Large</Button>
      <Button size="icon">
        <Settings className="h-4 w-4" />
      </Button>
    </div>
  ),
  parameters: {
    layout: 'padded',
  },
};

/**
 * Buttons with icons.
 */
export const WithIcons: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <Button>
          <Download className="h-4 w-4 mr-2" />
          Download
        </Button>
        <Button variant="outline">
          <Heart className="h-4 w-4 mr-2" />
          Favorite
        </Button>
        <Button variant="ghost">
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </Button>
      </div>
      <div className="flex items-center gap-4">
        <Button>
          Download
          <Download className="h-4 w-4 ml-2" />
        </Button>
        <Button variant="outline">
          Favorite
          <Heart className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  ),
  parameters: {
    layout: 'padded',
  },
};

/**
 * All button variants displayed together.
 */
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <Button variant="default">Default</Button>
      <Button variant="destructive">Destructive</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="link">Link</Button>
    </div>
  ),
  parameters: {
    layout: 'padded',
  },
};

/**
 * Disabled button states.
 */
export const Disabled: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <Button variant="default" disabled>
        Default
      </Button>
      <Button variant="destructive" disabled>
        Destructive
      </Button>
      <Button variant="outline" disabled>
        Outline
      </Button>
      <Button variant="secondary" disabled>
        Secondary
      </Button>
      <Button variant="ghost" disabled>
        Ghost
      </Button>
      <Button variant="link" disabled>
        Link
      </Button>
    </div>
  ),
  parameters: {
    layout: 'padded',
  },
};
