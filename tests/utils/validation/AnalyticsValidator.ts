import { Page, expect } from '@playwright/test';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export class AnalyticsValidator {
  constructor(private page: Page) {}

  /**
   * Validate analytics dashboard structure
   */
  async validateDashboardStructure(): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Check main dashboard container
      await expect(
        this.page.locator('[data-testid="analytics-dashboard"]')
      ).toBeVisible();
    } catch (_error) {
      errors.push('Analytics dashboard container not found');
    }

    // Check overview metrics
    const metrics = [
      'total-players',
      'total-clubs',
      'total-tournaments',
      'active-games',
    ];

    for (const metric of metrics) {
      try {
        await expect(
          this.page.locator(`[data-testid="${metric}"]`)
        ).toBeVisible();
      } catch (_error) {
        errors.push(`Overview metric ${metric} not found`);
      }
    }

    // Check navigation tabs
    const tabs = ['players-tab', 'clubs-tab', 'tournaments-tab'];
    for (const tab of tabs) {
      try {
        await expect(this.page.locator(`[data-testid="${tab}"]`)).toBeVisible();
      } catch (_error) {
        errors.push(`Navigation tab ${tab} not found`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate data display
   */
  async validateDataDisplay(
    dataType: 'players' | 'clubs' | 'tournaments'
  ): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Check section container
      await expect(
        this.page.locator(`[data-testid="${dataType}-section"]`)
      ).toBeVisible();
    } catch (_error) {
      errors.push(`${dataType} section container not found`);
    }

    try {
      // Check data list
      await expect(
        this.page.locator(`[data-testid="${dataType}-list"]`)
      ).toBeVisible();
    } catch (_error) {
      errors.push(`${dataType} list container not found`);
    }

    // Check for data cards
    const cardCount = await this.page
      .locator(`[data-testid="${dataType.slice(0, -1)}-card"]`)
      .count();
    if (cardCount === 0) {
      warnings.push(`No ${dataType} cards found - may be empty state`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate filtering functionality
   */
  async validateFiltering(
    dataType: 'players' | 'clubs' | 'tournaments'
  ): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check filter controls
    const filterSelectors = this.getFilterSelectors(dataType);
    for (const selector of filterSelectors) {
      try {
        await expect(
          this.page.locator(`[data-testid="${selector}"]`)
        ).toBeVisible();
      } catch (_error) {
        warnings.push(`Filter control ${selector} not found`);
      }
    }

    // Check apply filters button
    try {
      await expect(
        this.page.locator('[data-testid="apply-filters-button"]')
      ).toBeVisible();
    } catch (_error) {
      errors.push('Apply filters button not found');
    }

    // Check clear filters button
    try {
      await expect(
        this.page.locator('[data-testid="clear-filters-button"]')
      ).toBeVisible();
    } catch (_error) {
      warnings.push('Clear filters button not found');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate search functionality
   */
  async validateSearch(): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      await expect(
        this.page.locator('[data-testid="search-input"]')
      ).toBeVisible();
    } catch (_error) {
      errors.push('Search input not found');
    }

    try {
      await expect(
        this.page.locator('[data-testid="search-button"]')
      ).toBeVisible();
    } catch (_error) {
      errors.push('Search button not found');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate sorting functionality
   */
  async validateSorting(
    dataType: 'players' | 'clubs' | 'tournaments'
  ): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    const sortFields = this.getSortFields(dataType);
    for (const field of sortFields) {
      try {
        await expect(
          this.page.locator(`[data-testid="sort-by-${field}-button"]`)
        ).toBeVisible();
      } catch (_error) {
        warnings.push(`Sort by ${field} button not found`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate pagination
   */
  async validatePagination(): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      await expect(
        this.page.locator('[data-testid="pagination-container"]')
      ).toBeVisible();
    } catch (_error) {
      warnings.push('Pagination container not found - may not be needed');
    }

    // Check pagination controls if they exist
    const paginationExists = await this.page
      .locator('[data-testid="pagination-container"]')
      .isVisible();
    if (paginationExists) {
      try {
        await expect(
          this.page.locator('[data-testid="page-info"]')
        ).toBeVisible();
      } catch (_error) {
        errors.push('Page info not found');
      }

      try {
        await expect(
          this.page.locator('[data-testid="items-per-page-select"]')
        ).toBeVisible();
      } catch (_error) {
        warnings.push('Items per page select not found');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate export functionality
   */
  async validateExport(): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      await expect(
        this.page.locator('[data-testid="export-button"]')
      ).toBeVisible();
    } catch (_error) {
      errors.push('Export button not found');
    }

    // Check export modal if it exists
    const exportModalExists = await this.page
      .locator('[data-testid="export-modal"]')
      .isVisible();
    if (exportModalExists) {
      try {
        await expect(
          this.page.locator('[data-testid="export-format-select"]')
        ).toBeVisible();
      } catch (_error) {
        errors.push('Export format select not found');
      }

      try {
        await expect(
          this.page.locator('[data-testid="confirm-export-button"]')
        ).toBeVisible();
      } catch (_error) {
        errors.push('Confirm export button not found');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate responsive design
   */
  async validateResponsiveDesign(): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    const viewports = [
      { width: 375, height: 667, name: 'mobile' },
      { width: 768, height: 1024, name: 'tablet' },
      { width: 1920, height: 1080, name: 'desktop' },
    ];

    for (const viewport of viewports) {
      await this.page.setViewportSize({
        width: viewport.width,
        height: viewport.height,
      });

      try {
        await expect(
          this.page.locator('[data-testid="analytics-dashboard"]')
        ).toBeVisible();
      } catch (_error) {
        errors.push(`Dashboard not visible on ${viewport.name} viewport`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate accessibility
   */
  async validateAccessibility(): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check for ARIA labels
    const ariaElements = await this.page.locator('[aria-label]').count();
    if (ariaElements === 0) {
      warnings.push('No ARIA labels found');
    }

    // Check for proper heading structure
    const headings = await this.page.locator('h1, h2, h3, h4, h5, h6').count();
    if (headings === 0) {
      warnings.push('No heading elements found');
    }

    // Check for alt text on images
    const images = await this.page.locator('img').count();
    const imagesWithAlt = await this.page.locator('img[alt]').count();
    if (images > 0 && imagesWithAlt < images) {
      warnings.push('Some images missing alt text');
    }

    // Check for keyboard navigation
    const focusableElements = await this.page
      .locator('button, input, select, textarea, [tabindex]')
      .count();
    if (focusableElements === 0) {
      warnings.push('No focusable elements found');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate data integrity
   */
  async validateDataIntegrity(
    dataType: 'players' | 'clubs' | 'tournaments'
  ): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Get data from API
      const response = await this.page.request.get(
        `/api/analytics/${dataType}`
      );
      const data = await response.json();

      // Validate data structure
      if (!data.data || !Array.isArray(data.data)) {
        errors.push('Invalid data structure - missing data array');
      }

      if (!data.metadata) {
        errors.push('Invalid data structure - missing metadata');
      }

      // Validate metadata
      if (data.metadata) {
        const requiredMetadataFields = ['total', 'page', 'limit'];
        for (const field of requiredMetadataFields) {
          if (data.metadata[field] === undefined) {
            errors.push(`Missing metadata field: ${field}`);
          }
        }
      }

      // Validate data items
      if (data.data && data.data.length > 0) {
        const requiredFields = this.getRequiredFields(dataType);
        for (const field of requiredFields) {
          if (!Object.prototype.hasOwnProperty.call(data.data[0], field)) {
            errors.push(`Missing required field: ${field}`);
          }
        }
      }
    } catch (_error) {
      errors.push(`Failed to validate data integrity: ${error.message}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate performance
   */
  async validatePerformance(): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Check page load time
      const loadTime = await this.page.evaluate(() => {
        return (
          performance.timing.loadEventEnd - performance.timing.navigationStart
        );
      });

      if (loadTime > 5000) {
        warnings.push(
          `Page load time is ${loadTime}ms - consider optimization`
        );
      }

      // Check for memory leaks
      const memoryInfo = await this.page.evaluate(() => {
        return (performance as Record<string, unknown>).memory as Record<
          string,
          unknown
        >;
      });

      if (memoryInfo) {
        const usedMemory = memoryInfo.usedJSHeapSize / 1024 / 1024; // MB
        if (usedMemory > 100) {
          warnings.push(`High memory usage: ${usedMemory.toFixed(2)}MB`);
        }
      }
    } catch (_error) {
      warnings.push(`Could not validate performance: ${error.message}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Run comprehensive validation
   */
  async runComprehensiveValidation(): Promise<ValidationResult> {
    const allErrors: string[] = [];
    const allWarnings: string[] = [];

    // Validate dashboard structure
    const dashboardResult = await this.validateDashboardStructure();
    allErrors.push(...dashboardResult.errors);
    allWarnings.push(...dashboardResult.warnings);

    // Validate data displays
    const dataTypes: ('players' | 'clubs' | 'tournaments')[] = [
      'players',
      'clubs',
      'tournaments',
    ];
    for (const dataType of dataTypes) {
      const dataResult = await this.validateDataDisplay(dataType);
      allErrors.push(...dataResult.errors);
      allWarnings.push(...dataResult.warnings);
    }

    // Validate functionality
    const filteringResult = await this.validateFiltering('players');
    allErrors.push(...filteringResult.errors);
    allWarnings.push(...filteringResult.warnings);

    const searchResult = await this.validateSearch();
    allErrors.push(...searchResult.errors);
    allWarnings.push(...searchResult.warnings);

    const sortingResult = await this.validateSorting('players');
    allErrors.push(...sortingResult.errors);
    allWarnings.push(...sortingResult.warnings);

    const paginationResult = await this.validatePagination();
    allErrors.push(...paginationResult.errors);
    allWarnings.push(...paginationResult.warnings);

    const exportResult = await this.validateExport();
    allErrors.push(...exportResult.errors);
    allWarnings.push(...exportResult.warnings);

    // Validate quality aspects
    const responsiveResult = await this.validateResponsiveDesign();
    allErrors.push(...responsiveResult.errors);
    allWarnings.push(...responsiveResult.warnings);

    const accessibilityResult = await this.validateAccessibility();
    allErrors.push(...accessibilityResult.errors);
    allWarnings.push(...accessibilityResult.warnings);

    const dataIntegrityResult = await this.validateDataIntegrity('players');
    allErrors.push(...dataIntegrityResult.errors);
    allWarnings.push(...dataIntegrityResult.warnings);

    const performanceResult = await this.validatePerformance();
    allErrors.push(...performanceResult.errors);
    allWarnings.push(...performanceResult.warnings);

    return {
      isValid: allErrors.length === 0,
      errors: allErrors,
      warnings: allWarnings,
    };
  }

  /**
   * Get filter selectors for data type
   */
  private getFilterSelectors(dataType: string): string[] {
    const filterMap: Record<string, string[]> = {
      players: [
        'rating-min-input',
        'rating-max-input',
        'category-select',
        'status-select',
      ],
      clubs: [
        'member-count-min-input',
        'member-count-max-input',
        'category-select',
        'status-select',
      ],
      tournaments: [
        'start-date-input',
        'end-date-input',
        'status-select',
        'format-select',
      ],
    };

    return filterMap[dataType] || [];
  }

  /**
   * Get sort fields for data type
   */
  private getSortFields(dataType: string): string[] {
    const sortMap: Record<string, string[]> = {
      players: ['name', 'rating', 'gamesPlayed', 'winRate'],
      clubs: ['name', 'memberCount', 'averageRating', 'totalGames'],
      tournaments: ['name', 'startDate', 'endDate', 'participantCount'],
    };

    return sortMap[dataType] || [];
  }

  /**
   * Get required fields for data type
   */
  private getRequiredFields(dataType: string): string[] {
    const fieldMap: Record<string, string[]> = {
      players: ['id', 'name', 'rating', 'gamesPlayed', 'winRate'],
      clubs: ['id', 'name', 'memberCount', 'averageRating', 'status'],
      tournaments: ['id', 'name', 'startDate', 'endDate', 'status'],
    };

    return fieldMap[dataType] || [];
  }
}
