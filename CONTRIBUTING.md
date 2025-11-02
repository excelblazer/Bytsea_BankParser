# Contributing to Bytsea Statement Parser

Thank you for considering contributing to Bytsea Statement Parser! This document provides guidelines and instructions for contributing.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Testing Guidelines](#testing-guidelines)
- [Documentation](#documentation)

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inclusive environment for all contributors.

### Our Standards

- Use welcoming and inclusive language
- Respect differing viewpoints and experiences
- Accept constructive criticism gracefully
- Focus on what's best for the community
- Show empathy towards other community members

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- Git
- Code editor (VS Code recommended)

### Initial Setup

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/Bytsea_BankParser.git
   cd Bytsea_BankParser
   ```
3. **Add upstream remote**:
   ```bash
   git remote add upstream https://github.com/excelblazer/Bytsea_BankParser.git
   ```
4. **Install dependencies**:
   ```bash
   npm install
   ```
5. **Start development server**:
   ```bash
   npm run dev
   ```

## Development Workflow

### Creating a Feature Branch

```bash
# Sync with upstream
git checkout main
git pull upstream main

# Create feature branch
git checkout -b feature/your-feature-name
```

### Branch Naming Convention

- `feature/` - New features (e.g., `feature/add-openai-support`)
- `fix/` - Bug fixes (e.g., `fix/csv-export-bug`)
- `docs/` - Documentation updates (e.g., `docs/update-readme`)
- `refactor/` - Code refactoring (e.g., `refactor/improve-hooks`)
- `test/` - Adding tests (e.g., `test/add-unit-tests`)
- `chore/` - Maintenance tasks (e.g., `chore/update-dependencies`)

### Making Changes

1. Make your changes in your feature branch
2. Follow the coding standards (see below)
3. Test your changes thoroughly
4. Commit with descriptive messages
5. Push to your fork
6. Create a pull request

## Coding Standards

### TypeScript

- Use TypeScript for all new code
- Define proper interfaces and types
- Avoid `any` type unless absolutely necessary
- Use meaningful variable and function names

```typescript
// Good
interface UserPreferences {
  theme: 'light' | 'dark';
  language: string;
}

// Bad
interface Prefs {
  t: string;
  l: string;
}
```

### React Components

- Use functional components with hooks
- Extract reusable logic into custom hooks
- Keep components focused and small (< 200 lines)
- Use props destructuring

```typescript
// Good
interface ButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

const Button: React.FC<ButtonProps> = ({ label, onClick, disabled = false }) => {
  return <button onClick={onClick} disabled={disabled}>{label}</button>;
};

// Export with JSDoc
export default Button;
```

### File Organization

```
NewFeature/
├── Component.tsx          # Main component
├── Component.types.ts     # Type definitions
├── Component.styles.ts    # Styles (if needed)
├── Component.test.tsx     # Tests
└── index.ts              # Barrel export
```

### Naming Conventions

- **Files**: PascalCase for components (`UserProfile.tsx`), camelCase for utilities (`fileUtils.ts`)
- **Components**: PascalCase (`UserProfile`)
- **Functions**: camelCase (`validateFile`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_FILE_SIZE`)
- **Interfaces/Types**: PascalCase (`ParsedTransaction`)

### Code Style

- Use 2 spaces for indentation
- Use single quotes for strings
- Add semicolons
- Max line length: 100 characters
- Use meaningful comments

```typescript
/**
 * Validates file type and size
 * @param file - File to validate
 * @returns Validation result with error message if invalid
 */
export const validateFile = (file: File): ValidationResult => {
  // Validation logic here
};
```

### Error Handling

Always handle errors properly:

```typescript
try {
  const result = await someAsyncOperation();
  logger.info('Operation completed', result);
} catch (error) {
  logger.error('Operation failed', error);
  throw new Error(`Failed to complete operation: ${error.message}`);
}
```

### Logging

Use the logger service instead of console.log:

```typescript
import { logger } from './services/logger';

logger.debug('Debug information', data);
logger.info('Operation started');
logger.warn('Warning message');
logger.error('Error occurred', error);
```

## Commit Guidelines

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance tasks

### Examples

```bash
feat(parser): add support for OpenAI API

- Implement OpenAI provider in llmService
- Add OpenAI configuration to llm.config
- Update UI to support provider selection

Closes #123
```

```bash
fix(export): correct CSV filename generation

- Fix special character handling in client names
- Add proper date formatting in filenames

Fixes #456
```

### Commit Best Practices

- Write clear, concise commit messages
- Use present tense ("add feature" not "added feature")
- Reference issue numbers when applicable
- Keep commits atomic (one logical change per commit)

## Pull Request Process

### Before Submitting

1. ✅ Code builds without errors (`npm run build`)
2. ✅ All tests pass (`npm test`)
3. ✅ Code follows style guidelines
4. ✅ Documentation is updated
5. ✅ Commits are clean and well-organized

### PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
Describe testing performed

## Screenshots (if applicable)
Add screenshots here

## Checklist
- [ ] Code builds successfully
- [ ] Tests pass
- [ ] Documentation updated
- [ ] Follows coding standards
```

### Review Process

1. Maintainers will review your PR
2. Address any requested changes
3. Once approved, your PR will be merged
4. Your contribution will be credited

## Testing Guidelines

### Unit Tests

Test individual functions and utilities:

```typescript
import { validateFile } from './utils/fileUtils';

describe('validateFile', () => {
  it('should validate supported file types', () => {
    const mockFile = new File(['content'], 'test.pdf', { type: 'application/pdf' });
    const result = validateFile(mockFile);
    expect(result.isValid).toBe(true);
  });

  it('should reject unsupported file types', () => {
    const mockFile = new File(['content'], 'test.exe', { type: 'application/exe' });
    const result = validateFile(mockFile);
    expect(result.isValid).toBe(false);
  });
});
```

### Integration Tests

Test component interactions:

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import FileUpload from './FileUpload';

describe('FileUpload', () => {
  it('should handle file selection', async () => {
    const onFileSelect = jest.fn();
    render(<FileUpload onFileSelect={onFileSelect} />);
    
    const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
    const input = screen.getByLabelText('file-upload');
    
    fireEvent.change(input, { target: { files: [file] } });
    expect(onFileSelect).toHaveBeenCalledWith(file);
  });
});
```

### E2E Tests

Test complete workflows using Playwright or Cypress.

## Documentation

### Code Documentation

- Add JSDoc comments to all exported functions
- Document complex logic with inline comments
- Keep README.md up to date
- Update API documentation when changing interfaces

### Documentation Structure

```typescript
/**
 * Brief description of what the function does
 * 
 * @param paramName - Description of parameter
 * @returns Description of return value
 * @throws Description of errors thrown
 * 
 * @example
 * ```typescript
 * const result = myFunction('example');
 * ```
 */
export function myFunction(paramName: string): ReturnType {
  // Implementation
}
```

## Questions?

- Open an issue for bug reports or feature requests
- Join our community discussions
- Email: support@bytsea.com

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Recognition

Contributors will be recognized in:
- README.md Contributors section
- Release notes
- Project documentation

Thank you for contributing to Bytsea Statement Parser! 🎉
