import { Page, expect } from '@playwright/test';

export class ImportTestUtils {
  static async navigateToImportPage(page: Page) {
    await page.goto('/admin/import');
    await expect(page.locator('[data-testid="import-page"]')).toBeVisible();
  }

  static async startImport(
    page: Page,
    options: {
      source?: string;
      batchSize?: number;
      concurrency?: number;
      retryAttempts?: number;
    } = {}
  ) {
    const {
      source = 'gomafia',
      batchSize = 100,
      concurrency = 5,
      retryAttempts = 3,
    } = options;

    // Select data source
    await page.selectOption('[data-testid="data-source-select"]', source);

    // Configure import options
    await page.fill('[data-testid="batch-size-input"]', String(batchSize));
    await page.fill('[data-testid="concurrency-input"]', String(concurrency));
    await page.fill(
      '[data-testid="retry-attempts-input"]',
      String(retryAttempts)
    );

    // Start import
    await page.click('[data-testid="start-import-button"]');
  }

  static async pauseImport(page: Page) {
    await page.click('[data-testid="pause-import-button"]');
    await expect(page.locator('[data-testid="import-status"]')).toContainText(
      'Paused'
    );
  }

  static async resumeImport(page: Page) {
    await page.click('[data-testid="resume-import-button"]');
    await expect(page.locator('[data-testid="import-status"]')).toContainText(
      'Importing'
    );
  }

  static async stopImport(page: Page) {
    await page.click('[data-testid="stop-import-button"]');

    // Confirm stop dialog
    await expect(
      page.locator('[data-testid="confirm-stop-dialog"]')
    ).toBeVisible();
    await page.click('[data-testid="confirm-stop-button"]');

    await expect(page.locator('[data-testid="import-status"]')).toContainText(
      'Stopped'
    );
  }

  static async validateImportData(page: Page, data: unknown) {
    // Navigate to validation section
    await page.click('[data-testid="validation-tab"]');

    // Upload or input data
    await page.fill('[data-testid="data-input"]', JSON.stringify(data));

    // Run validation
    await page.click('[data-testid="validate-button"]');

    // Wait for validation results
    await expect(
      page.locator('[data-testid="validation-results"]')
    ).toBeVisible();
  }

  static async verifyImportStatus(page: Page, expectedStatus: string) {
    await expect(page.locator('[data-testid="import-status"]')).toContainText(
      expectedStatus
    );
  }

  static async verifyProgress(page: Page, expectedProgress: number) {
    const progressText = await page
      .locator('[data-testid="progress-percentage"]')
      .textContent();
    const progress = parseInt(progressText?.replace('%', '') || '0');
    expect(progress).toBeGreaterThanOrEqual(expectedProgress);
  }

  static async verifyImportMetrics(
    page: Page,
    metrics: {
      imported?: number;
      total?: number;
      errors?: number;
      speed?: number;
    }
  ) {
    if (metrics.imported !== undefined) {
      await expect(
        page.locator('[data-testid="imported-count"]')
      ).toContainText(String(metrics.imported));
    }

    if (metrics.total !== undefined) {
      await expect(page.locator('[data-testid="total-count"]')).toContainText(
        String(metrics.total)
      );
    }

    if (metrics.errors !== undefined) {
      await expect(page.locator('[data-testid="error-count"]')).toContainText(
        String(metrics.errors)
      );
    }

    if (metrics.speed !== undefined) {
      await expect(page.locator('[data-testid="import-speed"]')).toContainText(
        String(metrics.speed)
      );
    }
  }

  static async verifyImportLogs(page: Page, expectedLogCount?: number) {
    await expect(page.locator('[data-testid="import-logs"]')).toBeVisible();
    await expect(page.locator('[data-testid="log-entries"]')).toBeVisible();

    if (expectedLogCount !== undefined) {
      const logEntries = page.locator('[data-testid="log-entry"]');
      await expect(logEntries).toHaveCount(expectedLogCount);
    }
  }

  static async verifyErrorHandling(page: Page, errorType: string) {
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-message"]')).toContainText(
      errorType
    );

    // Check retry options
    await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();
  }

  static async verifyImportHistory(page: Page, expectedEntryCount?: number) {
    await expect(page.locator('[data-testid="import-history"]')).toBeVisible();
    await expect(page.locator('[data-testid="history-list"]')).toBeVisible();

    if (expectedEntryCount !== undefined) {
      const historyEntries = page.locator('[data-testid="history-entry"]');
      await expect(historyEntries).toHaveCount(expectedEntryCount);
    }
  }

  static async verifyImportConfiguration(
    page: Page,
    config: {
      batchSize?: number;
      concurrency?: number;
      retryAttempts?: number;
    }
  ) {
    if (config.batchSize !== undefined) {
      await expect(
        page.locator('[data-testid="batch-size-input"]')
      ).toHaveValue(String(config.batchSize));
    }

    if (config.concurrency !== undefined) {
      await expect(
        page.locator('[data-testid="concurrency-input"]')
      ).toHaveValue(String(config.concurrency));
    }

    if (config.retryAttempts !== undefined) {
      await expect(
        page.locator('[data-testid="retry-attempts-input"]')
      ).toHaveValue(String(config.retryAttempts));
    }
  }

  static async verifyImportScheduling(
    page: Page,
    schedule: {
      enabled: boolean;
      frequency?: string;
      time?: string;
      timezone?: string;
    }
  ) {
    const scheduleToggle = page.locator('[data-testid="schedule-toggle"]');

    if (schedule.enabled) {
      await expect(scheduleToggle).toBeChecked();
      await expect(
        page.locator('[data-testid="schedule-frequency"]')
      ).toBeVisible();
      await expect(page.locator('[data-testid="schedule-time"]')).toBeVisible();
      await expect(
        page.locator('[data-testid="schedule-timezone"]')
      ).toBeVisible();

      if (schedule.frequency) {
        await expect(
          page.locator('[data-testid="schedule-frequency"]')
        ).toHaveValue(schedule.frequency);
      }

      if (schedule.time) {
        await expect(page.locator('[data-testid="schedule-time"]')).toHaveValue(
          schedule.time
        );
      }

      if (schedule.timezone) {
        await expect(
          page.locator('[data-testid="schedule-timezone"]')
        ).toHaveValue(schedule.timezone);
      }
    } else {
      await expect(scheduleToggle).not.toBeChecked();
    }
  }

  static async verifyImportAnalytics(page: Page) {
    await expect(
      page.locator('[data-testid="import-analytics"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="import-speed-chart"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="error-rate-chart"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="throughput-metrics"]')
    ).toBeVisible();
  }

  static async verifyImportMilestones(
    page: Page,
    expectedMilestones: string[]
  ) {
    await expect(page.locator('[data-testid="milestones"]')).toBeVisible();

    for (const milestone of expectedMilestones) {
      await expect(
        page.locator(`[data-testid="milestone-${milestone}"]`)
      ).toBeVisible();
    }
  }

  static async verifyImportCheckpoints(
    page: Page,
    expectedCheckpoints: string[]
  ) {
    await expect(page.locator('[data-testid="checkpoints"]')).toBeVisible();

    for (const checkpoint of expectedCheckpoints) {
      await expect(
        page.locator(`[data-testid="checkpoint-${checkpoint}"]`)
      ).toBeVisible();
    }
  }

  static async verifyImportPhases(page: Page, expectedPhases: string[]) {
    await expect(page.locator('[data-testid="import-phases"]')).toBeVisible();

    for (const phase of expectedPhases) {
      await expect(
        page.locator(`[data-testid="phase-${phase}"]`)
      ).toBeVisible();
    }
  }

  static async verifyResourceUtilization(page: Page) {
    await expect(
      page.locator('[data-testid="resource-utilization"]')
    ).toBeVisible();
    await expect(page.locator('[data-testid="cpu-usage"]')).toBeVisible();
    await expect(page.locator('[data-testid="memory-usage"]')).toBeVisible();
    await expect(page.locator('[data-testid="disk-usage"]')).toBeVisible();
    await expect(page.locator('[data-testid="network-usage"]')).toBeVisible();
  }

  static async verifyQualityMetrics(page: Page) {
    await expect(page.locator('[data-testid="quality-metrics"]')).toBeVisible();
    await expect(
      page.locator('[data-testid="data-quality-score"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="validation-errors"]')
    ).toBeVisible();
    await expect(page.locator('[data-testid="duplicate-count"]')).toBeVisible();
    await expect(page.locator('[data-testid="skipped-count"]')).toBeVisible();
  }

  static async verifyOptimizationSuggestions(page: Page) {
    await expect(
      page.locator('[data-testid="optimization-suggestions"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="performance-tips"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="bottleneck-indicators"]')
    ).toBeVisible();
  }

  static async verifyImportCompletion(
    page: Page,
    expectedSummary: {
      imported: number;
      total: number;
      errors: number;
      duration: number;
    }
  ) {
    await expect(
      page.locator('[data-testid="completion-summary"]')
    ).toBeVisible();
    await expect(page.locator('[data-testid="imported-count"]')).toContainText(
      String(expectedSummary.imported)
    );
    await expect(page.locator('[data-testid="total-count"]')).toContainText(
      String(expectedSummary.total)
    );
    await expect(page.locator('[data-testid="error-count"]')).toContainText(
      String(expectedSummary.errors)
    );
    await expect(page.locator('[data-testid="duration"]')).toContainText(
      String(expectedSummary.duration)
    );
  }

  static async verifyImportErrorRecovery(page: Page, errorType: string) {
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-message"]')).toContainText(
      errorType
    );

    // Check recovery options
    await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();
    await expect(
      page.locator('[data-testid="error-suggestion"]')
    ).toBeVisible();
  }

  static async verifyImportDataIntegrity(
    page: Page,
    integrityIssues: string[]
  ) {
    await expect(
      page.locator('[data-testid="integrity-errors"]')
    ).toBeVisible();

    for (const issue of integrityIssues) {
      await expect(
        page.locator(`[data-testid="integrity-${issue}"]`)
      ).toBeVisible();
    }
  }

  static async verifyImportLogFiltering(
    page: Page,
    filterOptions: {
      level?: string;
      limit?: number;
      startTime?: string;
      endTime?: string;
    }
  ) {
    if (filterOptions.level) {
      await page.selectOption(
        '[data-testid="log-level-filter"]',
        filterOptions.level
      );
    }

    if (filterOptions.limit) {
      await page.fill(
        '[data-testid="log-limit-input"]',
        String(filterOptions.limit)
      );
    }

    if (filterOptions.startTime) {
      await page.fill(
        '[data-testid="log-start-time"]',
        filterOptions.startTime
      );
    }

    if (filterOptions.endTime) {
      await page.fill('[data-testid="log-end-time"]', filterOptions.endTime);
    }

    await page.click('[data-testid="apply-log-filter"]');
    await page.waitForLoadState('networkidle');
  }

  static async verifyImportExport(page: Page, exportType: string) {
    await page.click(`[data-testid="export-${exportType}-button"]`);

    // Wait for download to start
    const downloadPromise = page.waitForEvent('download');
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toContain(exportType);
  }

  static async verifyImportNotifications(
    page: Page,
    expectedNotifications: string[]
  ) {
    for (const notification of expectedNotifications) {
      await expect(
        page.locator(`[data-testid="notification-${notification}"]`)
      ).toBeVisible();
    }
  }

  static async verifyImportAccessibility(page: Page) {
    // Check keyboard navigation
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toBeVisible();

    // Check ARIA labels
    await expect(page.locator('[data-testid="import-page"]')).toHaveAttribute(
      'aria-label'
    );
    await expect(page.locator('[data-testid="progress-bar"]')).toHaveAttribute(
      'aria-valuenow'
    );
    await expect(page.locator('[data-testid="progress-bar"]')).toHaveAttribute(
      'aria-valuemax'
    );
  }

  static async verifyImportResponsiveness(page: Page) {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('[data-testid="import-page"]')).toBeVisible();

    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('[data-testid="import-page"]')).toBeVisible();

    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page.locator('[data-testid="import-page"]')).toBeVisible();
  }
}
