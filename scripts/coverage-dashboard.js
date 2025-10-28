#!/usr/bin/env node

/**
 * Test Coverage Dashboard
 *
 * Generates a comprehensive test coverage report and dashboard
 * for monitoring test coverage across the application.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const COVERAGE_DIR = './coverage';
const DASHBOARD_DIR = './coverage-dashboard';
const THRESHOLDS = {
  global: { branches: 80, functions: 80, lines: 80, statements: 80 },
  auth: { branches: 90, functions: 90, lines: 90, statements: 90 },
  hooks: { branches: 85, functions: 85, lines: 85, statements: 85 },
  services: { branches: 85, functions: 85, lines: 85, statements: 85 },
};

function ensureDirectoryExists(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function runCoverageTests() {
  console.log('🧪 Running test coverage analysis...');

  try {
    execSync('yarn test:coverage', { stdio: 'inherit' });
    console.log('✅ Coverage tests completed successfully');
  } catch (error) {
    console.error('❌ Coverage tests failed:', error.message);
    process.exit(1);
  }
}

function parseCoverageReport() {
  const coveragePath = path.join(COVERAGE_DIR, 'coverage-summary.json');

  if (!fs.existsSync(coveragePath)) {
    console.error('❌ Coverage report not found. Run tests first.');
    process.exit(1);
  }

  const coverageData = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
  return coverageData;
}

function generateCoverageHTML(coverageData) {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test Coverage Dashboard</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f8fafc;
            color: #1e293b;
            line-height: 1.6;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 2rem;
        }
        
        .header {
            background: white;
            border-radius: 12px;
            padding: 2rem;
            margin-bottom: 2rem;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        
        .header h1 {
            color: #1e293b;
            margin-bottom: 0.5rem;
        }
        
        .header p {
            color: #64748b;
            font-size: 1.1rem;
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1.5rem;
            margin-bottom: 2rem;
        }
        
        .stat-card {
            background: white;
            border-radius: 12px;
            padding: 1.5rem;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            border-left: 4px solid #3b82f6;
        }
        
        .stat-card h3 {
            color: #1e293b;
            margin-bottom: 1rem;
            font-size: 1.1rem;
        }
        
        .stat-value {
            font-size: 2rem;
            font-weight: bold;
            color: #059669;
            margin-bottom: 0.5rem;
        }
        
        .stat-value.warning {
            color: #d97706;
        }
        
        .stat-value.danger {
            color: #dc2626;
        }
        
        .stat-label {
            color: #64748b;
            font-size: 0.9rem;
        }
        
        .coverage-table {
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        
        .coverage-table table {
            width: 100%;
            border-collapse: collapse;
        }
        
        .coverage-table th {
            background: #f1f5f9;
            padding: 1rem;
            text-align: left;
            font-weight: 600;
            color: #1e293b;
            border-bottom: 1px solid #e2e8f0;
        }
        
        .coverage-table td {
            padding: 1rem;
            border-bottom: 1px solid #e2e8f0;
        }
        
        .coverage-table tr:hover {
            background: #f8fafc;
        }
        
        .coverage-bar {
            width: 100%;
            height: 8px;
            background: #e2e8f0;
            border-radius: 4px;
            overflow: hidden;
            margin-top: 0.5rem;
        }
        
        .coverage-fill {
            height: 100%;
            background: #059669;
            transition: width 0.3s ease;
        }
        
        .coverage-fill.warning {
            background: #d97706;
        }
        
        .coverage-fill.danger {
            background: #dc2626;
        }
        
        .status-badge {
            display: inline-block;
            padding: 0.25rem 0.75rem;
            border-radius: 9999px;
            font-size: 0.75rem;
            font-weight: 600;
            text-transform: uppercase;
        }
        
        .status-pass {
            background: #dcfce7;
            color: #166534;
        }
        
        .status-warning {
            background: #fef3c7;
            color: #92400e;
        }
        
        .status-fail {
            background: #fee2e2;
            color: #991b1b;
        }
        
        .footer {
            text-align: center;
            margin-top: 2rem;
            padding: 1rem;
            color: #64748b;
            font-size: 0.9rem;
        }
        
        @media (max-width: 768px) {
            .container {
                padding: 1rem;
            }
            
            .stats-grid {
                grid-template-columns: 1fr;
            }
            
            .coverage-table {
                overflow-x: auto;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🧪 Test Coverage Dashboard</h1>
            <p>Comprehensive test coverage analysis for Mafia Insight application</p>
            <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
        </div>
        
        <div class="stats-grid">
            <div class="stat-card">
                <h3>Overall Coverage</h3>
                <div class="stat-value ${getStatusClass(coverageData.total.lines.pct)}">${coverageData.total.lines.pct}%</div>
                <div class="stat-label">Lines Covered</div>
                <div class="coverage-bar">
                    <div class="coverage-fill ${getStatusClass(coverageData.total.lines.pct)}" style="width: ${coverageData.total.lines.pct}%"></div>
                </div>
            </div>
            
            <div class="stat-card">
                <h3>Functions</h3>
                <div class="stat-value ${getStatusClass(coverageData.total.functions.pct)}">${coverageData.total.functions.pct}%</div>
                <div class="stat-label">Functions Covered</div>
                <div class="coverage-bar">
                    <div class="coverage-fill ${getStatusClass(coverageData.total.functions.pct)}" style="width: ${coverageData.total.functions.pct}%"></div>
                </div>
            </div>
            
            <div class="stat-card">
                <h3>Branches</h3>
                <div class="stat-value ${getStatusClass(coverageData.total.branches.pct)}">${coverageData.total.branches.pct}%</div>
                <div class="stat-label">Branches Covered</div>
                <div class="coverage-bar">
                    <div class="coverage-fill ${getStatusClass(coverageData.total.branches.pct)}" style="width: ${coverageData.total.branches.pct}%"></div>
                </div>
            </div>
            
            <div class="stat-card">
                <h3>Statements</h3>
                <div class="stat-value ${getStatusClass(coverageData.total.statements.pct)}">${coverageData.total.statements.pct}%</div>
                <div class="stat-label">Statements Covered</div>
                <div class="coverage-bar">
                    <div class="coverage-fill ${getStatusClass(coverageData.total.statements.pct)}" style="width: ${coverageData.total.statements.pct}%"></div>
                </div>
            </div>
        </div>
        
        <div class="coverage-table">
            <table>
                <thead>
                    <tr>
                        <th>File</th>
                        <th>Lines</th>
                        <th>Functions</th>
                        <th>Branches</th>
                        <th>Statements</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${Object.entries(coverageData)
                      .filter(([key]) => key !== 'total')
                      .map(
                        ([file, data]) => `
                        <tr>
                            <td><code>${file}</code></td>
                            <td>
                                ${data.lines.pct}%
                                <div class="coverage-bar">
                                    <div class="coverage-fill ${getStatusClass(data.lines.pct)}" style="width: ${data.lines.pct}%"></div>
                                </div>
                            </td>
                            <td>
                                ${data.functions.pct}%
                                <div class="coverage-bar">
                                    <div class="coverage-fill ${getStatusClass(data.functions.pct)}" style="width: ${data.functions.pct}%"></div>
                                </div>
                            </td>
                            <td>
                                ${data.branches.pct}%
                                <div class="coverage-bar">
                                    <div class="coverage-fill ${getStatusClass(data.branches.pct)}" style="width: ${data.branches.pct}%"></div>
                                </div>
                            </td>
                            <td>
                                ${data.statements.pct}%
                                <div class="coverage-bar">
                                    <div class="coverage-fill ${getStatusClass(data.statements.pct)}" style="width: ${data.statements.pct}%"></div>
                                </div>
                            </td>
                            <td>
                                <span class="status-badge ${getStatusClass(data.lines.pct)}">
                                    ${getStatusText(data.lines.pct)}
                                </span>
                            </td>
                        </tr>
                      `
                      )
                      .join('')}
                </tbody>
            </table>
        </div>
        
        <div class="footer">
            <p>Generated by Test Coverage Dashboard | Mafia Insight Application</p>
        </div>
    </div>
</body>
</html>
  `;

  return html;
}

function getStatusClass(percentage) {
  if (percentage >= 90) return '';
  if (percentage >= 80) return 'warning';
  return 'danger';
}

function getStatusText(percentage) {
  if (percentage >= 90) return 'PASS';
  if (percentage >= 80) return 'WARN';
  return 'FAIL';
}

function generateCoverageAlerts(coverageData) {
  const alerts = [];

  // Check global thresholds
  const globalThresholds = THRESHOLDS.global;
  Object.entries(globalThresholds).forEach(([metric, threshold]) => {
    const actual = coverageData.total[metric].pct;
    if (actual < threshold) {
      alerts.push({
        type: 'error',
        message: `Global ${metric} coverage (${actual}%) is below threshold (${threshold}%)`,
        metric,
        actual,
        threshold,
      });
    }
  });

  // Check specific component thresholds
  Object.entries(coverageData)
    .filter(([key]) => key !== 'total')
    .forEach(([file, data]) => {
      let componentThresholds = globalThresholds;

      if (file.includes('components/auth/')) {
        componentThresholds = THRESHOLDS.auth;
      } else if (file.includes('hooks/')) {
        componentThresholds = THRESHOLDS.hooks;
      } else if (file.includes('services/')) {
        componentThresholds = THRESHOLDS.services;
      }

      Object.entries(componentThresholds).forEach(([metric, threshold]) => {
        const actual = data[metric].pct;
        if (actual < threshold) {
          alerts.push({
            type: 'warning',
            message: `${file} ${metric} coverage (${actual}%) is below threshold (${threshold}%)`,
            file,
            metric,
            actual,
            threshold,
          });
        }
      });
    });

  return alerts;
}

function main() {
  console.log('🚀 Starting Test Coverage Dashboard Generation...');

  // Ensure directories exist
  ensureDirectoryExists(COVERAGE_DIR);
  ensureDirectoryExists(DASHBOARD_DIR);

  // Run coverage tests
  runCoverageTests();

  // Parse coverage data
  console.log('📊 Parsing coverage data...');
  const coverageData = parseCoverageReport();

  // Generate HTML dashboard
  console.log('🎨 Generating HTML dashboard...');
  const html = generateCoverageHTML(coverageData);
  fs.writeFileSync(path.join(DASHBOARD_DIR, 'index.html'), html);

  // Generate coverage alerts
  console.log('🚨 Checking coverage thresholds...');
  const alerts = generateCoverageAlerts(coverageData);

  if (alerts.length > 0) {
    console.log('\n⚠️  Coverage Alerts:');
    alerts.forEach((alert) => {
      const icon = alert.type === 'error' ? '❌' : '⚠️';
      console.log(`${icon} ${alert.message}`);
    });

    // Write alerts to file
    fs.writeFileSync(
      path.join(DASHBOARD_DIR, 'alerts.json'),
      JSON.stringify(alerts, null, 2)
    );
  } else {
    console.log('✅ All coverage thresholds met!');
  }

  // Copy coverage files to dashboard
  console.log('📁 Copying coverage files...');
  if (fs.existsSync(path.join(COVERAGE_DIR, 'lcov-report'))) {
    execSync(
      `cp -r ${path.join(COVERAGE_DIR, 'lcov-report')} ${DASHBOARD_DIR}/lcov-report`
    );
  }

  console.log('✅ Coverage dashboard generated successfully!');
  console.log(
    `📊 Dashboard available at: ${path.resolve(DASHBOARD_DIR, 'index.html')}`
  );
  console.log(
    `📈 Detailed coverage report: ${path.resolve(DASHBOARD_DIR, 'lcov-report', 'index.html')}`
  );
}

if (require.main === module) {
  main();
}

module.exports = {
  generateCoverageHTML,
  generateCoverageAlerts,
  getStatusClass,
  getStatusText,
};
