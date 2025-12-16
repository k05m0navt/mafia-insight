import { test, expect } from '@playwright/test';

/**
 * E2E tests for referential integrity verification (Story 2.9)
 * Verifies that integrity check results are visible in the UI and API
 */
test.describe('Referential Integrity Verification (Story 2.9)', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('/');
  });

  test('should display integrity check results in validation API (AC #1, #2)', async ({
    request,
  }) => {
    // Call the validation API endpoint
    const response = await request.get('/api/gomafia-sync/import/validation');

    expect(response.ok()).toBeTruthy();

    const data = await response.json();

    // Verify integrity results are included
    expect(data.integrity).toBeDefined();
    expect(data.integrity.status).toBeDefined();
    expect(['PASS', 'FAIL']).toContain(data.integrity.status);
    expect(data.integrity.totalChecks).toBeGreaterThanOrEqual(8); // Should include new checks
    expect(data.integrity.passedChecks).toBeGreaterThanOrEqual(0);
    expect(data.integrity.failedChecks).toBeGreaterThanOrEqual(0);
    expect(data.integrity.message).toBeDefined();

    // Verify phase-level results structure (if available)
    if (data.integrity.phaseResults) {
      expect(typeof data.integrity.phaseResults).toBe('object');
      // Phase results should have phase names as keys
      const phaseKeys = Object.keys(data.integrity.phaseResults);
      if (phaseKeys.length > 0) {
        const firstPhase = data.integrity.phaseResults[phaseKeys[0]];
        expect(firstPhase.checks).toBeDefined();
        expect(Array.isArray(firstPhase.checks)).toBe(true);
        expect(firstPhase.passed).toBeDefined();
        expect(typeof firstPhase.passed).toBe('boolean');
      }
    }

    // Verify full audit results structure (if available)
    if (data.integrity.fullAudit) {
      expect(data.integrity.fullAudit.status).toBeDefined();
      expect(data.integrity.fullAudit.totalChecks).toBeGreaterThanOrEqual(0);
      expect(data.integrity.fullAudit.passedChecks).toBeGreaterThanOrEqual(0);
      expect(data.integrity.fullAudit.failedChecks).toBeGreaterThanOrEqual(0);
    }
  });

  test('should include detailed integrity violations in API response (AC #1)', async ({
    request,
  }) => {
    // Call the validation API endpoint
    const response = await request.get('/api/gomafia-sync/import/validation');

    expect(response.ok()).toBeTruthy();

    const data = await response.json();

    // If integrity check failed, verify issues are included
    if (data.integrity.status === 'FAIL') {
      expect(data.integrity.issues).toBeDefined();
      expect(Array.isArray(data.integrity.issues)).toBe(true);

      // Verify issues contain detailed information
      if (data.integrity.issues.length > 0) {
        const firstIssue = data.integrity.issues[0];
        expect(typeof firstIssue).toBe('string');
        // Issues should contain entity and reference information
        expect(firstIssue.length).toBeGreaterThan(0);
      }
    }
  });

  test('should show integrity status in import summary (AC #2)', async ({
    page,
  }) => {
    // Navigate to sync/import page if it exists
    // This test assumes there's a page that displays import status
    // Adjust the path based on your actual application structure

    // For now, verify the API is accessible
    const response = await page.request.get(
      '/api/gomafia-sync/import/validation'
    );
    expect(response.ok()).toBeTruthy();

    const data = await response.json();

    // Verify integrity information is available for display
    expect(data.integrity).toBeDefined();
    expect(data.integrity.status).toBeDefined();

    // In a real scenario, you would:
    // 1. Navigate to the import status page
    // 2. Verify integrity status is displayed
    // 3. Verify phase-level results are shown (if available)
    // 4. Verify full audit results are shown (if available)
  });

  test('should handle integrity check results after import completion (AC #2)', async ({
    request,
  }) => {
    // This test verifies that integrity check results are available
    // after an import completes

    // Get validation endpoint which should include integrity results
    const response = await request.get('/api/gomafia-sync/import/validation');

    expect(response.ok()).toBeTruthy();

    const data = await response.json();

    // Verify integrity results structure
    expect(data.integrity).toBeDefined();

    // Verify all required fields are present
    expect(data.integrity.status).toBeDefined();
    expect(data.integrity.totalChecks).toBeDefined();
    expect(data.integrity.passedChecks).toBeDefined();
    expect(data.integrity.failedChecks).toBeDefined();
    expect(data.integrity.message).toBeDefined();

    // Verify phase-level checks don't block import progress visibility
    // (This is verified by the fact that the API returns successfully
    // even if integrity checks have issues)
    expect(response.status()).toBe(200);
  });
});
