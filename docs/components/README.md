# Component Documentation

This directory contains comprehensive documentation for all UI components in the Mafia Insight application.

## Component Categories

### Authentication Components

- [AuthProvider](./auth/AuthProvider.md) - Authentication context provider
- [LoginForm](./auth/LoginForm.md) - User login form
- [SignupForm](./auth/SignupForm.md) - User registration form
- [UserMenu](./auth/UserMenu.md) - User profile menu
- [AuthStatus](./auth/AuthStatus.md) - Authentication status indicator

### Navigation Components

- [AccessibleNavbar](./navigation/AccessibleNavbar.md) - WCAG 2.1 AA compliant navigation
- [NavItem](./navigation/NavItem.md) - Individual navigation item
- [ThemeToggle](./navigation/ThemeToggle.md) - Theme switching control
- [AuthControls](./navigation/AuthControls.md) - Authentication controls

### Protected Components

- [ProtectedRoute](./protected/ProtectedRoute.md) - Route-level permission protection
- [ProtectedComponent](./protected/ProtectedComponent.md) - Component-level permission protection
- [PermissionGate](./protected/PermissionGate.md) - Permission-based rendering

### Admin Components

- [PerformanceDashboard](./admin/PerformanceDashboard.md) - Performance monitoring dashboard
- [UserRoleSelector](./admin/UserRoleSelector.md) - User role selection
- [PermissionManager](./admin/PermissionManager.md) - Permission management interface

### UI Components

- [ErrorBoundary](./ui/ErrorBoundary.md) - Error boundary wrapper
- [LoadingSpinner](./ui/LoadingSpinner.md) - Loading state indicator
- [Modal](./ui/Modal.md) - Modal dialog component

## Component Standards

### Naming Convention

- Use PascalCase for component names
- Use descriptive names that indicate purpose
- Include component type in name when appropriate (e.g., `AuthButton`, `NavItem`)

### File Structure

```
src/components/
├── [category]/
│   ├── ComponentName.tsx
│   ├── ComponentName.test.tsx
│   ├── ComponentName.stories.tsx
│   └── index.ts
```

### Documentation Template

Each component should have:

1. **Overview** - What the component does
2. **Props** - All props with types and descriptions
3. **Usage Examples** - Code examples
4. **Accessibility** - ARIA attributes and keyboard support
5. **Styling** - CSS classes and theming
6. **Testing** - Test coverage and examples

### Accessibility Requirements

- All interactive elements must be keyboard accessible
- Proper ARIA labels and roles
- Screen reader compatibility
- Focus management
- High contrast support

### Performance Requirements

- Component rendering < 100ms
- No unnecessary re-renders
- Lazy loading when appropriate
- Memoization for expensive operations

## Development Guidelines

### Creating New Components

1. Create component file with TypeScript
2. Add comprehensive JSDoc comments
3. Include accessibility attributes
4. Write unit tests with 90%+ coverage
5. Add Storybook stories
6. Update this documentation

### Testing Components

- Use React Testing Library
- Test user interactions, not implementation details
- Include accessibility tests
- Test error states and edge cases
- Mock external dependencies

### Styling Components

- Use Tailwind CSS classes
- Support dark/light themes
- Ensure responsive design
- Follow design system guidelines
- Use CSS custom properties for theming

## Component Library

### Installation

```bash
# Install dependencies
yarn install

# Start development server
yarn dev

# Run component tests
yarn test components/

# Start Storybook
yarn storybook
```

### Usage

```tsx
import { AccessibleNavbar } from '@/components/navigation/AccessibleNavbar';
import { ThemeProvider } from '@/components/theme/ThemeProvider';

function App() {
  return (
    <ThemeProvider>
      <AccessibleNavbar />
      {/* Rest of your app */}
    </ThemeProvider>
  );
}
```

## Contributing

When contributing to components:

1. Follow the established patterns
2. Update documentation
3. Add comprehensive tests
4. Ensure accessibility compliance
5. Test across different browsers
6. Update this README if adding new categories

## Resources

- [React Documentation](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Storybook](https://storybook.js.org/)
