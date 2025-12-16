import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { MultiStepLoader } from './multi-step-loader';
import { useState } from 'react';
import { Button } from './button';

const meta = {
  title: 'UI/MultiStepLoader',
  component: MultiStepLoader,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'A multi-step loading component that shows progress through sequential operations. Perfect for data import flows, multi-step processes, and long-running operations.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    loadingStates: {
      control: 'object',
      description: 'Array of loading state objects with text',
    },
    loading: {
      control: 'boolean',
      description: 'Whether the loader is active',
    },
    duration: {
      control: 'number',
      description: 'Duration in milliseconds for each step',
    },
    loop: {
      control: 'boolean',
      description: 'Whether to loop through steps',
    },
  },
} satisfies Meta<typeof MultiStepLoader>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Data import loader showing progress through import steps.
 */
const DataImportComponent = () => {
  const [loading, setLoading] = useState(false);
  return (
    <div className="p-8">
      <Button onClick={() => setLoading(!loading)}>
        {loading ? 'Stop Import' : 'Start Import'}
      </Button>
      <MultiStepLoader
        loading={loading}
        loadingStates={[
          { text: 'Connecting to GoMafia Pro API...' },
          { text: 'Fetching player data...' },
          { text: 'Fetching game records...' },
          { text: 'Validating data quality...' },
          { text: 'Importing to database...' },
          { text: 'Building indexes...' },
          { text: 'Import complete!' },
        ]}
        duration={1500}
        loop={false}
      />
    </div>
  );
};

export const DataImport: Story = {
  args: {
    loadingStates: [
      { text: 'Connecting to GoMafia Pro API...' },
      { text: 'Fetching player data...' },
      { text: 'Fetching game records...' },
      { text: 'Validating data quality...' },
      { text: 'Importing to database...' },
      { text: 'Building indexes...' },
      { text: 'Import complete!' },
    ],
    loading: false,
    duration: 1500,
    loop: false,
  },
  render: () => <DataImportComponent />,
};

/**
 * Tournament synchronization loader.
 */
const TournamentSyncComponent = () => {
  const [loading, setLoading] = useState(false);
  return (
    <div className="p-8">
      <Button onClick={() => setLoading(!loading)}>
        {loading ? 'Stop Sync' : 'Start Sync'}
      </Button>
      <MultiStepLoader
        loading={loading}
        loadingStates={[
          { text: 'Initializing sync...' },
          { text: 'Checking for updates...' },
          { text: 'Downloading tournament data...' },
          { text: 'Processing game results...' },
          { text: 'Updating player statistics...' },
          { text: 'Sync complete!' },
        ]}
        duration={2000}
        loop={false}
      />
    </div>
  );
};

export const TournamentSync: Story = {
  args: {
    loadingStates: [
      { text: 'Initializing sync...' },
      { text: 'Checking for updates...' },
      { text: 'Downloading tournament data...' },
      { text: 'Processing game results...' },
      { text: 'Updating player statistics...' },
      { text: 'Sync complete!' },
    ],
    loading: false,
    duration: 2000,
    loop: false,
  },
  render: () => <TournamentSyncComponent />,
};

/**
 * Looping loader for continuous operations.
 */
const ContinuousLoaderComponent = () => {
  const [loading, setLoading] = useState(false);
  return (
    <div className="p-8">
      <Button onClick={() => setLoading(!loading)}>
        {loading ? 'Stop Processing' : 'Start Processing'}
      </Button>
      <MultiStepLoader
        loading={loading}
        loadingStates={[
          { text: 'Processing step 1...' },
          { text: 'Processing step 2...' },
          { text: 'Processing step 3...' },
          { text: 'Processing step 4...' },
        ]}
        duration={1000}
        loop={true}
      />
    </div>
  );
};

export const ContinuousLoader: Story = {
  args: {
    loadingStates: [
      { text: 'Processing step 1...' },
      { text: 'Processing step 2...' },
      { text: 'Processing step 3...' },
      { text: 'Processing step 4...' },
    ],
    loading: false,
    duration: 1000,
    loop: true,
  },
  render: () => <ContinuousLoaderComponent />,
};
