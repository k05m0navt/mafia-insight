import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import type { ArchitectureOnboardingGuide } from '@/application/contracts';
import type { ArchitectureOnboardingPort } from '@/application/ports';

const PROJECT_ROOT = process.cwd();
const DEFAULT_GUIDE_PATH = resolve(
  PROJECT_ROOT,
  'docs',
  'onboarding',
  'architecture.md'
);

interface GuideMetadata {
  version: string;
  lastUpdated: string;
  overview: string;
  checklist: string[];
  references: string[];
}

export class OnboardingFilesystemAdapter implements ArchitectureOnboardingPort {
  constructor(private readonly guidePath: string = DEFAULT_GUIDE_PATH) {}

  async fetchGuide(): Promise<ArchitectureOnboardingGuide> {
    const content = await readFile(this.guidePath, 'utf-8');
    const metadata = parseFrontMatter(content);
    validateMetadata(metadata);
    return metadata;
  }
}

function parseFrontMatter(content: string): GuideMetadata {
  const match = content.match(/^---\n([\s\S]*?)\n---\n/);
  if (!match) {
    throw new Error(
      'Architecture onboarding guide is missing JSON front matter metadata.'
    );
  }

  try {
    const metadata = JSON.parse(match[1]) as GuideMetadata;
    return metadata;
  } catch (error) {
    throw new Error(
      `Unable to parse architecture onboarding metadata: ${
        error instanceof Error ? error.message : 'unknown error'
      }`
    );
  }
}

function validateMetadata(metadata: GuideMetadata): void {
  const requiredKeys: Array<keyof GuideMetadata> = [
    'version',
    'lastUpdated',
    'overview',
    'checklist',
    'references',
  ];

  for (const key of requiredKeys) {
    if (metadata[key] === undefined || metadata[key] === null) {
      throw new Error(`Architecture onboarding metadata missing "${key}".`);
    }
  }

  if (!Array.isArray(metadata.checklist)) {
    throw new Error('Architecture onboarding checklist must be an array.');
  }

  if (!Array.isArray(metadata.references)) {
    throw new Error('Architecture onboarding references must be an array.');
  }
}
