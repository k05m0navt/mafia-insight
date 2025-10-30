import { test, expect } from '@playwright/test';
import { ApiTestUtils } from '../../utils/api/ApiTestUtils';
import { testLogger } from '../../utils/logging/TestLogger';

test.describe('API Endpoints Testing', () => {
  test.beforeEach(async ({ page }) => {
    await ApiTestUtils.navigateToApiTestingPage(page);
  });

  test('should test GET endpoints', async ({ page }) => {
    await testLogger.info('Testing GET endpoints');

    // Test health check endpoint
    await ApiTestUtils.testApiEndpoint(page, '/api/health');
    await ApiTestUtils.verifyApiResponse(page, 200);

    // Test players endpoint
    await ApiTestUtils.testApiEndpoint(page, '/api/players');
    await ApiTestUtils.verifyApiResponse(page, 200);

    // Test clubs endpoint
    await ApiTestUtils.testApiEndpoint(page, '/api/clubs');
    await ApiTestUtils.verifyApiResponse(page, 200);

    // Test tournaments endpoint
    await ApiTestUtils.testApiEndpoint(page, '/api/tournaments');
    await ApiTestUtils.verifyApiResponse(page, 200);

    await testLogger.info('GET endpoints test passed');
  });

  test('should test POST endpoints', async ({ page }) => {
    await testLogger.info('Testing POST endpoints');

    // Test create player endpoint
    await ApiTestUtils.testApiEndpoint(page, '/api/players', 'POST', {
      name: 'Test Player',
      email: 'testplayer@example.com',
      rating: 1500,
    });
    await ApiTestUtils.verifyApiResponse(page, 201);

    // Test import start endpoint
    await ApiTestUtils.testApiEndpoint(page, '/api/import/start', 'POST', {
      source: 'gomafia',
      options: {},
    });
    await ApiTestUtils.verifyApiResponse(page, 202);

    await testLogger.info('POST endpoints test passed');
  });

  test('should test PUT endpoints', async ({ page }) => {
    await testLogger.info('Testing PUT endpoints');

    // Test update player endpoint
    await ApiTestUtils.testApiEndpoint(page, '/api/players/123', 'PUT', {
      name: 'Updated Player',
      rating: 1600,
    });
    await ApiTestUtils.verifyApiResponse(page, 200);

    await testLogger.info('PUT endpoints test passed');
  });

  test('should test DELETE endpoints', async ({ page }) => {
    await testLogger.info('Testing DELETE endpoints');

    // Test delete player endpoint
    await ApiTestUtils.testApiEndpoint(page, '/api/players/123', 'DELETE');
    await ApiTestUtils.verifyApiResponse(page, 204);

    await testLogger.info('DELETE endpoints test passed');
  });

  test('should test PATCH endpoints', async ({ page }) => {
    await testLogger.info('Testing PATCH endpoints');

    // Test partial update endpoint
    await ApiTestUtils.testApiEndpoint(page, '/api/players/123', 'PATCH', {
      rating: 1650,
    });
    await ApiTestUtils.verifyApiResponse(page, 200);

    await testLogger.info('PATCH endpoints test passed');
  });

  test('should test endpoint pagination', async ({ page }) => {
    await testLogger.info('Testing endpoint pagination');

    await ApiTestUtils.testPagination(page, '/api/players');

    await testLogger.info('Endpoint pagination test passed');
  });

  test('should test endpoint filtering', async ({ page }) => {
    await testLogger.info('Testing endpoint filtering');

    await ApiTestUtils.testFiltering(page, '/api/players', {
      search: 'test',
      rating: '1500',
    });

    await testLogger.info('Endpoint filtering test passed');
  });

  test('should test endpoint sorting', async ({ page }) => {
    await testLogger.info('Testing endpoint sorting');

    await ApiTestUtils.testSorting(page, '/api/players', 'rating', 'desc');

    await testLogger.info('Endpoint sorting test passed');
  });

  test('should test endpoint batch operations', async ({ page }) => {
    await testLogger.info('Testing batch operations');

    const batchData = [
      { name: 'Player 1', email: 'player1@example.com', rating: 1500 },
      { name: 'Player 2', email: 'player2@example.com', rating: 1600 },
    ];

    await ApiTestUtils.testBatchOperations(
      page,
      '/api/players/batch',
      batchData
    );

    await testLogger.info('Batch operations test passed');
  });

  test('should test endpoint performance', async ({ page }) => {
    await testLogger.info('Testing endpoint performance');

    await ApiTestUtils.testPerformance(page, '/api/players', 1000);

    await testLogger.info('Endpoint performance test passed');
  });

  test('should test endpoint caching', async ({ page }) => {
    await testLogger.info('Testing endpoint caching');

    await ApiTestUtils.testCaching(page, '/api/players');

    await testLogger.info('Endpoint caching test passed');
  });

  test('should test endpoint versioning', async ({ page }) => {
    await testLogger.info('Testing endpoint versioning');

    await ApiTestUtils.testApiVersioning(page, '/api/players', 'v1');
    await ApiTestUtils.testApiVersioning(page, '/api/players', 'v2');

    await testLogger.info('Endpoint versioning test passed');
  });
});
