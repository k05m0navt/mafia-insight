import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Alert, AlertTitle, AlertDescription } from './alert';
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from 'lucide-react';

const meta = {
  title: 'UI/Alert',
  component: Alert,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Alert component for displaying important messages to users. Supports default and destructive variants.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'destructive'],
      description: 'Alert variant style',
    },
  },
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default alert variant.
 */
export const Default: Story = {
  args: {
    variant: 'default',
    children: (
      <>
        <Info className="h-4 w-4" />
        <AlertTitle>Information</AlertTitle>
        <AlertDescription>
          This is a default alert message with information for the user.
        </AlertDescription>
      </>
    ),
  },
};

/**
 * Destructive alert variant for errors or warnings.
 */
export const Destructive: Story = {
  args: {
    variant: 'destructive',
    children: (
      <>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          This is a destructive alert message indicating an error or warning.
        </AlertDescription>
      </>
    ),
  },
};

/**
 * Alert with title only.
 */
export const TitleOnly: Story = {
  args: {
    variant: 'default',
    children: (
      <>
        <Info className="h-4 w-4" />
        <AlertTitle>Alert Title</AlertTitle>
      </>
    ),
  },
};

/**
 * Alert with description only.
 */
export const DescriptionOnly: Story = {
  args: {
    variant: 'default',
    children: (
      <>
        <Info className="h-4 w-4" />
        <AlertDescription>
          This alert only has a description without a title.
        </AlertDescription>
      </>
    ),
  },
};

/**
 * Alert examples with different icons.
 */
export const WithIcons: Story = {
  render: () => (
    <div className="space-y-4 w-full max-w-md">
      <Alert variant="default">
        <Info className="h-4 w-4" />
        <AlertTitle>Info</AlertTitle>
        <AlertDescription>
          This is an informational alert with an info icon.
        </AlertDescription>
      </Alert>
      <Alert variant="default">
        <CheckCircle2 className="h-4 w-4" />
        <AlertTitle>Success</AlertTitle>
        <AlertDescription>
          This is a success message with a checkmark icon.
        </AlertDescription>
      </Alert>
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Warning</AlertTitle>
        <AlertDescription>
          This is a warning message with a triangle icon.
        </AlertDescription>
      </Alert>
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          This is an error message with an alert circle icon.
        </AlertDescription>
      </Alert>
    </div>
  ),
  parameters: {
    layout: 'padded',
  },
};

/**
 * All alert variants displayed together.
 */
export const AllVariants: Story = {
  render: () => (
    <div className="space-y-4 w-full max-w-md">
      <Alert variant="default">
        <Info className="h-4 w-4" />
        <AlertTitle>Default Alert</AlertTitle>
        <AlertDescription>This is the default alert variant.</AlertDescription>
      </Alert>
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Destructive Alert</AlertTitle>
        <AlertDescription>
          This is the destructive alert variant.
        </AlertDescription>
      </Alert>
    </div>
  ),
  parameters: {
    layout: 'padded',
  },
};
