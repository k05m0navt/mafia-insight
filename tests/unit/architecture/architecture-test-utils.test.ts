import { describe, it, expect } from 'vitest';
import {
  assertCleanArchitecture,
  runArchitectureCruise,
} from '../../../tests-support/architecture-test-utils';

describe('architecture test utilities', () => {
  it('expose an assertion helper for upcoming guardrail suites', () => {
    expect(typeof assertCleanArchitecture).toBe('function');
  });

  it('allows running targeted cruises with custom entry points', async () => {
    const result = await runArchitectureCruise({ entryPoints: ['src/domain'] });
    expect(result.success).toBe(true);
  });
});
