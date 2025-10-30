#!/bin/bash

# CI/CD Integration Script for Comprehensive Testing Framework
# This script runs all tests in the proper order for CI/CD pipelines

set -e

echo "🚀 Starting Comprehensive Testing Framework CI/CD Integration"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
TEST_ENVIRONMENT=${TEST_ENVIRONMENT:-"local"}
PARALLEL_WORKERS=${PARALLEL_WORKERS:-4}
COVERAGE_THRESHOLD=${COVERAGE_THRESHOLD:-80}
PERFORMANCE_THRESHOLD=${PERFORMANCE_THRESHOLD:-2000}

# Function to print colored output
print_status() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] ✅${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] ⚠️${NC} $1"
}

print_error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ❌${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to run tests with error handling
run_tests() {
    local test_type=$1
    local test_command=$2
    local test_name=$3
    
    print_status "Running $test_name..."
    
    if eval "$test_command"; then
        print_success "$test_name completed successfully"
        return 0
    else
        print_error "$test_name failed"
        return 1
    fi
}

# Pre-flight checks
print_status "Running pre-flight checks..."

# Check required commands
required_commands=("node" "yarn" "npx")
for cmd in "${required_commands[@]}"; do
    if ! command_exists "$cmd"; then
        print_error "Required command '$cmd' not found"
        exit 1
    fi
done

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js version 18 or higher is required. Current version: $(node --version)"
    exit 1
fi

print_success "Pre-flight checks passed"

# Install dependencies
print_status "Installing dependencies..."
yarn install --frozen-lockfile

# Lint and format check
print_status "Running linting and formatting checks..."
yarn lint
yarn format --check

# Type checking
print_status "Running TypeScript type checking..."
yarn type-check

# Unit tests
print_status "Running unit tests..."
run_tests "unit" "yarn test:coverage" "Unit Tests"

# Integration tests
print_status "Running integration tests..."
run_tests "integration" "yarn test:integration" "Integration Tests"

# E2E tests
print_status "Running end-to-end tests..."
run_tests "e2e" "yarn test:e2e" "End-to-End Tests"

# Performance tests
print_status "Running performance tests..."
run_tests "performance" "yarn test:performance" "Performance Tests"

# Security tests
print_status "Running security tests..."
run_tests "security" "yarn test:security" "Security Tests"

# Coverage report
print_status "Generating coverage report..."
yarn test:coverage:report

# Check coverage threshold
COVERAGE=$(yarn test:coverage --reporter=json | jq -r '.total.lines.pct')
if (( $(echo "$COVERAGE < $COVERAGE_THRESHOLD" | bc -l) )); then
    print_error "Coverage $COVERAGE% is below threshold $COVERAGE_THRESHOLD%"
    exit 1
fi

print_success "Coverage $COVERAGE% meets threshold $COVERAGE_THRESHOLD%"

# Generate test reports
print_status "Generating test reports..."
yarn test:report

# Cleanup
print_status "Cleaning up test artifacts..."
rm -rf test-results/temp
rm -rf coverage/temp

print_success "🎉 All tests completed successfully!"
print_status "Test results available in test-results/ directory"
print_status "Coverage report available in coverage/ directory"

# Summary
echo ""
echo "📊 Test Summary:"
echo "  - Environment: $TEST_ENVIRONMENT"
echo "  - Parallel Workers: $PARALLEL_WORKERS"
echo "  - Coverage: $COVERAGE%"
echo "  - Coverage Threshold: $COVERAGE_THRESHOLD%"
echo "  - Performance Threshold: ${PERFORMANCE_THRESHOLD}ms"
echo ""

exit 0
