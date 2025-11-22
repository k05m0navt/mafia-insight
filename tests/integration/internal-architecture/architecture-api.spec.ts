import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';

describe('Internal Architecture API', () => {
  it('returns the current architecture map', async () => {
    const { GET } = await import('@/app/internal/architecture/route');
    const request = new NextRequest(
      'http://localhost:3000/internal/architecture'
    );

    const response = await GET(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toHaveProperty('generatedAt');
    expect(Array.isArray(payload.layers)).toBe(true);
    expect(payload.layers.length).toBeGreaterThan(0);
    expect(Array.isArray(payload.violations)).toBe(true);
  });

  it('validates architecture guardrails', async () => {
    const { POST } = await import('@/app/internal/architecture/route');
    const request = new NextRequest(
      'http://localhost:3000/internal/architecture',
      {
        method: 'POST',
        body: JSON.stringify({ targetRef: 'main', mode: 'incremental' }),
        headers: {
          'content-type': 'application/json',
        },
      }
    );

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(typeof payload.passed).toBe('boolean');
    expect(Array.isArray(payload.violations)).toBe(true);
    expect(typeof payload.summary).toBe('string');
    expect(payload.summary.toLowerCase()).toContain('main');
  });

  it('returns onboarding guidance content', async () => {
    const { GET } = await import('@/app/internal/onboarding/guide/route');
    const request = new NextRequest(
      'http://localhost:3000/internal/onboarding/guide'
    );

    const response = await GET(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual({
      version: '2025.11.10',
      lastUpdated: '2025-11-10T09:30:00.000Z',
      overview:
        'Checklist and reference material for contributing to the Clean Architecture refactor.',
      checklist: [
        'Install dependencies with yarn install',
        'Run yarn test:arch to ensure guardrails pass',
        'Generate the latest architecture map via yarn arch:map',
        'Review docs/architecture/inversion-of-control.md and docs/architecture/use-cases.md',
        'Log verification results in docs/architecture/audit-log.md',
      ],
      references: [
        'https://mafiainsight.internal/wiki/architecture-governance',
        'docs/architecture/README.md',
        'docs/architecture/inversion-of-control.md',
        'docs/architecture/migration-backlog.md',
      ],
    });
  });
});
