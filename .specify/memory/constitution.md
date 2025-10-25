<!--
Sync Impact Report:
Version change: 0.0.0 → 1.0.0
Modified principles: All principles updated to reflect Clean Architecture and modern development practices
Added sections: Clean Architecture Principles, Technology Standards, Development Workflow
Removed sections: None (template was empty)
Templates requiring updates: ✅ plan-template.md, ✅ spec-template.md, ✅ tasks-template.md
Follow-up TODOs: None
-->

# Mafia Insight Constitution

## Core Principles

### I. Clean Architecture (NON-NEGOTIABLE)
All code MUST follow Clean Architecture principles with clear separation of concerns. 
The architecture MUST enforce dependency inversion - inner layers cannot depend on outer layers. 
Business logic MUST be isolated from frameworks, databases, and external services. 
Use cases MUST be the primary organizing principle, not technical layers.

### II. Test-Driven Development (NON-NEGOTIABLE)
TDD is MANDATORY for all development. Tests MUST be written before implementation. 
Follow Red-Green-Refactor cycle strictly. All code MUST have corresponding tests. 
Test coverage MUST be maintained above 80%. Integration tests MUST be written for 
all user journeys and API contracts.

### III. Spec-Driven Development
All features MUST start with comprehensive specifications before any code is written. 
User stories MUST be prioritized and independently testable. Each user story MUST 
deliver standalone value. Specifications MUST include acceptance criteria, edge cases, 
and measurable success criteria.

### IV. Modern Frontend Best Practices
Frontend code MUST follow modern design patterns and best practices. 
Components MUST be reusable, accessible, and performant. State management MUST 
be predictable and testable. UI/UX MUST follow established design systems and 
accessibility standards (WCAG 2.1 AA minimum).

### V. Package Management & Documentation
Yarn MUST be used exclusively for package management (never npm). 
All dependencies MUST be documented with clear rationale. Use Context7 MCP 
for accessing actual, up-to-date documentation. Documentation MUST be 
kept current with code changes.

### VI. Code Quality & Standards
All code MUST pass linting and formatting checks. Code reviews MUST 
verify architecture compliance and test coverage. Complexity MUST be 
justified with clear documentation. Performance requirements MUST be 
defined and measured.

## Technology Standards

### Package Management
- **MUST**: Use yarn exclusively for all package operations
- **MUST**: Lock dependency versions in yarn.lock
- **MUST**: Document dependency rationale in package.json
- **FORBIDDEN**: Mixing npm and yarn in the same project

### Documentation Access
- **MUST**: Use Context7 MCP for accessing current documentation
- **MUST**: Verify documentation accuracy before implementation
- **MUST**: Update local documentation when external docs change

### Testing Requirements
- **MUST**: Maintain minimum 80% test coverage
- **MUST**: Write tests before implementation (TDD)
- **MUST**: Include unit, integration, and contract tests
- **MUST**: Test all user stories independently

## Development Workflow

### Feature Development Process
1. **Specification**: Create comprehensive spec with user stories
2. **Planning**: Break down into testable, independent tasks
3. **Testing**: Write tests first, ensure they fail
4. **Implementation**: Implement to make tests pass
5. **Refactoring**: Improve code while keeping tests green
6. **Validation**: Verify feature works independently

### Code Review Requirements
- **MUST**: Verify Clean Architecture compliance
- **MUST**: Check test coverage and quality
- **MUST**: Validate specification alignment
- **MUST**: Ensure no architectural violations

### Quality Gates
- All tests MUST pass before merge
- Architecture compliance MUST be verified
- Performance benchmarks MUST be met
- Security requirements MUST be satisfied

## Governance

This constitution supersedes all other development practices and guidelines. 
All team members MUST comply with these principles. Amendments require 
documentation of rationale, impact assessment, and migration plan. 
Complexity additions MUST be justified with clear business value.

**Version**: 1.0.0 | **Ratified**: 2025-01-27 | **Last Amended**: 2025-01-27
