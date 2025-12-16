import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { FloatingNav } from './floating-navbar';
import {
  IconHome,
  IconChartBar,
  IconUser,
  IconSettings,
} from '@tabler/icons-react';

const meta = {
  title: 'UI/FloatingNavbar',
  component: FloatingNav,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'A modern floating navigation bar that appears on scroll. Perfect for maintaining navigation accessibility while reducing visual clutter.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof FloatingNav>;

export default meta;
type Story = StoryObj<typeof meta>;

export const DashboardNav: Story = {
  args: {
    navItems: [
      { name: 'Home', link: '#', icon: <IconHome className="h-4 w-4" /> },
      {
        name: 'Analytics',
        link: '#',
        icon: <IconChartBar className="h-4 w-4" />,
      },
      { name: 'Profile', link: '#', icon: <IconUser className="h-4 w-4" /> },
      {
        name: 'Settings',
        link: '#',
        icon: <IconSettings className="h-4 w-4" />,
      },
    ],
  },
  render: (args) => (
    <div className="h-[200vh] p-8">
      <div className="h-screen flex items-center justify-center">
        <p className="text-lg">Scroll down to see the floating navbar appear</p>
      </div>
      <FloatingNav {...args} />
    </div>
  ),
};
