-- Test Database Schema for Comprehensive Testing Framework
-- This schema is used for testing purposes only

-- Test Suites Table
CREATE TABLE IF NOT EXISTS test_suites (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    category VARCHAR(50) NOT NULL CHECK (category IN ('unit', 'integration', 'e2e', 'performance', 'security')),
    priority VARCHAR(10) NOT NULL CHECK (priority IN ('P1', 'P2', 'P3')),
    user_story_id VARCHAR(255),
    status VARCHAR(20) NOT NULL CHECK (status IN ('draft', 'active', 'deprecated')),
    pass_rate DECIMAL(5,2) DEFAULT 0.00 CHECK (pass_rate >= 0 AND pass_rate <= 100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_run_at TIMESTAMP NULL,
    INDEX idx_category (category),
    INDEX idx_priority (priority),
    INDEX idx_status (status),
    INDEX idx_user_story (user_story_id)
);

-- Test Cases Table
CREATE TABLE IF NOT EXISTS test_cases (
    id VARCHAR(255) PRIMARY KEY,
    suite_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(20) NOT NULL CHECK (type IN ('automated', 'manual', 'hybrid')),
    priority VARCHAR(20) NOT NULL CHECK (priority IN ('critical', 'high', 'medium', 'low')),
    tags JSON,
    preconditions JSON,
    steps JSON,
    expected_results JSON,
    data_requirements JSON,
    environment_config JSON,
    timeout INT DEFAULT 30000,
    retry_count INT DEFAULT 0,
    status VARCHAR(20) NOT NULL CHECK (status IN ('draft', 'ready', 'active', 'deprecated')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (suite_id) REFERENCES test_suites(id) ON DELETE CASCADE,
    INDEX idx_suite_id (suite_id),
    INDEX idx_type (type),
    INDEX idx_priority (priority),
    INDEX idx_status (status)
);

-- Test Executions Table
CREATE TABLE IF NOT EXISTS test_executions (
    id VARCHAR(255) PRIMARY KEY,
    test_case_id VARCHAR(255) NOT NULL,
    suite_id VARCHAR(255) NOT NULL,
    execution_id VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('passed', 'failed', 'skipped', 'error', 'timeout')),
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NULL,
    duration INT NULL,
    environment_info JSON,
    browser VARCHAR(255),
    device VARCHAR(255),
    error_message TEXT,
    error_stack TEXT,
    screenshots JSON,
    videos JSON,
    logs JSON,
    metrics JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (test_case_id) REFERENCES test_cases(id) ON DELETE CASCADE,
    FOREIGN KEY (suite_id) REFERENCES test_suites(id) ON DELETE CASCADE,
    INDEX idx_test_case_id (test_case_id),
    INDEX idx_suite_id (suite_id),
    INDEX idx_execution_id (execution_id),
    INDEX idx_status (status),
    INDEX idx_start_time (start_time)
);

-- Test Data Table
CREATE TABLE IF NOT EXISTS test_data (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(20) NOT NULL CHECK (type IN ('anonymized', 'synthetic', 'edge-case', 'production')),
    category VARCHAR(255) NOT NULL,
    size INT NOT NULL,
    format VARCHAR(10) NOT NULL CHECK (format IN ('json', 'csv', 'sql', 'xml')),
    location VARCHAR(500) NOT NULL,
    anonymization_level VARCHAR(20) NOT NULL CHECK (anonymization_level IN ('none', 'partial', 'full')),
    privacy_compliance JSON,
    version VARCHAR(50) NOT NULL,
    checksum VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NULL,
    INDEX idx_type (type),
    INDEX idx_category (category),
    INDEX idx_format (format),
    INDEX idx_anonymization_level (anonymization_level),
    INDEX idx_expires_at (expires_at)
);

-- Test Environments Table
CREATE TABLE IF NOT EXISTS test_environments (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('local', 'staging', 'production', 'custom')),
    description TEXT,
    base_url VARCHAR(500) NOT NULL,
    database_config JSON,
    external_services JSON,
    browser_config JSON,
    device_config JSON,
    network_config JSON,
    security_config JSON,
    performance_config JSON,
    is_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_type (type),
    INDEX idx_is_active (is_active)
);

-- Test Reports Table
CREATE TABLE IF NOT EXISTS test_reports (
    id VARCHAR(255) PRIMARY KEY,
    execution_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('execution', 'coverage', 'performance', 'security', 'compliance')),
    status VARCHAR(20) NOT NULL CHECK (status IN ('generating', 'completed', 'failed')),
    summary JSON,
    coverage_metrics JSON,
    performance_metrics JSON,
    security_metrics JSON,
    recommendations JSON,
    artifacts JSON,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    generated_by VARCHAR(255) NOT NULL,
    INDEX idx_execution_id (execution_id),
    INDEX idx_type (type),
    INDEX idx_status (status),
    INDEX idx_generated_at (generated_at)
);

-- Test Data Usage Table (Many-to-Many relationship between test cases and test data)
CREATE TABLE IF NOT EXISTS test_case_data_usage (
    test_case_id VARCHAR(255) NOT NULL,
    test_data_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (test_case_id, test_data_id),
    FOREIGN KEY (test_case_id) REFERENCES test_cases(id) ON DELETE CASCADE,
    FOREIGN KEY (test_data_id) REFERENCES test_data(id) ON DELETE CASCADE
);

-- Test Execution Data Usage Table (Many-to-Many relationship between test executions and test data)
CREATE TABLE IF NOT EXISTS test_execution_data_usage (
    test_execution_id VARCHAR(255) NOT NULL,
    test_data_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (test_execution_id, test_data_id),
    FOREIGN KEY (test_execution_id) REFERENCES test_executions(id) ON DELETE CASCADE,
    FOREIGN KEY (test_data_id) REFERENCES test_data(id) ON DELETE CASCADE
);

-- Test Metrics Table (for storing aggregated metrics)
CREATE TABLE IF NOT EXISTS test_metrics (
    id VARCHAR(255) PRIMARY KEY,
    execution_id VARCHAR(255) NOT NULL,
    metric_type VARCHAR(50) NOT NULL,
    metric_name VARCHAR(255) NOT NULL,
    metric_value DECIMAL(15,4) NOT NULL,
    metric_unit VARCHAR(20),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSON,
    INDEX idx_execution_id (execution_id),
    INDEX idx_metric_type (metric_type),
    INDEX idx_timestamp (timestamp)
);

-- Test Artifacts Table (for storing file artifacts)
CREATE TABLE IF NOT EXISTS test_artifacts (
    id VARCHAR(255) PRIMARY KEY,
    report_id VARCHAR(255),
    execution_id VARCHAR(255),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('screenshot', 'video', 'log', 'report', 'data', 'coverage', 'performance')),
    format VARCHAR(20) NOT NULL,
    size BIGINT NOT NULL,
    location VARCHAR(500) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NULL,
    FOREIGN KEY (report_id) REFERENCES test_reports(id) ON DELETE CASCADE,
    FOREIGN KEY (execution_id) REFERENCES test_executions(id) ON DELETE CASCADE,
    INDEX idx_report_id (report_id),
    INDEX idx_execution_id (execution_id),
    INDEX idx_type (type),
    INDEX idx_expires_at (expires_at)
);

-- Test Recommendations Table
CREATE TABLE IF NOT EXISTS test_recommendations (
    id VARCHAR(255) PRIMARY KEY,
    report_id VARCHAR(255) NOT NULL,
    category VARCHAR(20) NOT NULL CHECK (category IN ('performance', 'security', 'coverage', 'reliability', 'maintainability')),
    priority VARCHAR(10) NOT NULL CHECK (priority IN ('high', 'medium', 'low')),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    impact TEXT,
    effort VARCHAR(10) NOT NULL CHECK (effort IN ('low', 'medium', 'high')),
    status VARCHAR(20) NOT NULL CHECK (status IN ('open', 'in-progress', 'resolved', 'rejected')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (report_id) REFERENCES test_reports(id) ON DELETE CASCADE,
    INDEX idx_report_id (report_id),
    INDEX idx_category (category),
    INDEX idx_priority (priority),
    INDEX idx_status (status)
);

-- Test Logs Table (for storing detailed test execution logs)
CREATE TABLE IF NOT EXISTS test_logs (
    id VARCHAR(255) PRIMARY KEY,
    execution_id VARCHAR(255) NOT NULL,
    test_case_id VARCHAR(255),
    level VARCHAR(20) NOT NULL CHECK (level IN ('debug', 'info', 'warn', 'error', 'fatal')),
    message TEXT NOT NULL,
    context JSON,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (execution_id) REFERENCES test_executions(id) ON DELETE CASCADE,
    FOREIGN KEY (test_case_id) REFERENCES test_cases(id) ON DELETE CASCADE,
    INDEX idx_execution_id (execution_id),
    INDEX idx_test_case_id (test_case_id),
    INDEX idx_level (level),
    INDEX idx_timestamp (timestamp)
);

-- Test Alerts Table (for storing test alerts and notifications)
CREATE TABLE IF NOT EXISTS test_alerts (
    id VARCHAR(255) PRIMARY KEY,
    execution_id VARCHAR(255),
    suite_id VARCHAR(255),
    alert_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low', 'info')),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('active', 'acknowledged', 'resolved', 'suppressed')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    acknowledged_at TIMESTAMP NULL,
    resolved_at TIMESTAMP NULL,
    acknowledged_by VARCHAR(255),
    resolved_by VARCHAR(255),
    metadata JSON,
    FOREIGN KEY (execution_id) REFERENCES test_executions(id) ON DELETE CASCADE,
    FOREIGN KEY (suite_id) REFERENCES test_suites(id) ON DELETE CASCADE,
    INDEX idx_execution_id (execution_id),
    INDEX idx_suite_id (suite_id),
    INDEX idx_alert_type (alert_type),
    INDEX idx_severity (severity),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
);

-- Test Configurations Table (for storing test configuration snapshots)
CREATE TABLE IF NOT EXISTS test_configurations (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    config_type VARCHAR(50) NOT NULL,
    config_data JSON NOT NULL,
    version VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_config_type (config_type),
    INDEX idx_is_active (is_active)
);

-- Test Tags Table (for managing test tags)
CREATE TABLE IF NOT EXISTS test_tags (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    color VARCHAR(7), -- Hex color code
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Test Case Tags Junction Table
CREATE TABLE IF NOT EXISTS test_case_tags (
    test_case_id VARCHAR(255) NOT NULL,
    tag_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (test_case_id, tag_id),
    FOREIGN KEY (test_case_id) REFERENCES test_cases(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES test_tags(id) ON DELETE CASCADE
);

-- Test Suite Dependencies Table (for managing test suite dependencies)
CREATE TABLE IF NOT EXISTS test_suite_dependencies (
    suite_id VARCHAR(255) NOT NULL,
    depends_on_suite_id VARCHAR(255) NOT NULL,
    dependency_type VARCHAR(20) NOT NULL CHECK (dependency_type IN ('required', 'optional', 'conflicts')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (suite_id, depends_on_suite_id),
    FOREIGN KEY (suite_id) REFERENCES test_suites(id) ON DELETE CASCADE,
    FOREIGN KEY (depends_on_suite_id) REFERENCES test_suites(id) ON DELETE CASCADE,
    INDEX idx_suite_id (suite_id),
    INDEX idx_depends_on_suite_id (depends_on_suite_id)
);

-- Test Execution Queue Table (for managing test execution queue)
CREATE TABLE IF NOT EXISTS test_execution_queue (
    id VARCHAR(255) PRIMARY KEY,
    suite_id VARCHAR(255) NOT NULL,
    test_case_ids JSON,
    priority INT DEFAULT 0,
    status VARCHAR(20) NOT NULL CHECK (status IN ('queued', 'running', 'completed', 'failed', 'cancelled')),
    scheduled_at TIMESTAMP,
    started_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255) NOT NULL,
    metadata JSON,
    FOREIGN KEY (suite_id) REFERENCES test_suites(id) ON DELETE CASCADE,
    INDEX idx_suite_id (suite_id),
    INDEX idx_status (status),
    INDEX idx_priority (priority),
    INDEX idx_scheduled_at (scheduled_at)
);

-- Test Results Summary Table (for storing aggregated test results)
CREATE TABLE IF NOT EXISTS test_results_summary (
    id VARCHAR(255) PRIMARY KEY,
    suite_id VARCHAR(255) NOT NULL,
    execution_id VARCHAR(255) NOT NULL,
    total_tests INT NOT NULL,
    passed_tests INT NOT NULL,
    failed_tests INT NOT NULL,
    skipped_tests INT NOT NULL,
    error_tests INT NOT NULL,
    pass_rate DECIMAL(5,2) NOT NULL,
    execution_time INT NOT NULL, -- in milliseconds
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (suite_id) REFERENCES test_suites(id) ON DELETE CASCADE,
    INDEX idx_suite_id (suite_id),
    INDEX idx_execution_id (execution_id),
    INDEX idx_start_time (start_time)
);

-- Create views for common queries
CREATE VIEW test_suite_summary AS
SELECT 
    ts.id,
    ts.name,
    ts.category,
    ts.priority,
    ts.status,
    ts.pass_rate,
    COUNT(tc.id) as test_case_count,
    ts.created_at,
    ts.updated_at,
    ts.last_run_at
FROM test_suites ts
LEFT JOIN test_cases tc ON ts.id = tc.suite_id
GROUP BY ts.id, ts.name, ts.category, ts.priority, ts.status, ts.pass_rate, ts.created_at, ts.updated_at, ts.last_run_at;

CREATE VIEW test_execution_summary AS
SELECT 
    te.execution_id,
    ts.name as suite_name,
    COUNT(te.id) as total_executions,
    SUM(CASE WHEN te.status = 'passed' THEN 1 ELSE 0 END) as passed_count,
    SUM(CASE WHEN te.status = 'failed' THEN 1 ELSE 0 END) as failed_count,
    SUM(CASE WHEN te.status = 'skipped' THEN 1 ELSE 0 END) as skipped_count,
    SUM(CASE WHEN te.status = 'error' THEN 1 ELSE 0 END) as error_count,
    AVG(te.duration) as avg_duration,
    MIN(te.start_time) as start_time,
    MAX(te.end_time) as end_time
FROM test_executions te
JOIN test_suites ts ON te.suite_id = ts.id
GROUP BY te.execution_id, ts.name;

-- Create indexes for better performance
CREATE INDEX idx_test_executions_composite ON test_executions(execution_id, status, start_time);
CREATE INDEX idx_test_cases_composite ON test_cases(suite_id, status, priority);
CREATE INDEX idx_test_data_composite ON test_data(type, category, anonymization_level);
CREATE INDEX idx_test_reports_composite ON test_reports(execution_id, type, status);
CREATE INDEX idx_test_logs_composite ON test_logs(execution_id, level, timestamp);
CREATE INDEX idx_test_alerts_composite ON test_alerts(execution_id, severity, status, created_at);
