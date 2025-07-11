# {{projectName}} - Claude Code Context

This file provides comprehensive guidance to Claude Code when working with this React application with TypeScript.

## Project Overview

{{description}}

## Core Development Philosophy

### KISS (Keep It Simple, Stupid)

Simplicity should be a key goal in design. Choose straightforward solutions over complex ones whenever possible.

### YAGNI (You Aren't Gonna Need It)

Avoid building functionality on speculation. Implement features only when they are needed.

### Design Principles

- **Component Composition**: Build with small, reusable components
- **Single Responsibility**: Each component does one thing well
- **Props over State**: Prefer stateless components
- **Immutability**: Never mutate state directly

## 🧱 Code Structure & Modularity

### File and Component Limits

- **Never create a file longer than 300 lines**
- **Components should be under 150 lines**
- **Custom hooks should be under 50 lines**
- **Extract complex logic into custom hooks**

## 🚀 React & TypeScript Best Practices

### TypeScript Integration (MANDATORY)

- **MUST use `ReactElement` or `ReactNode`** for return types
- **MUST define props interfaces** for all components
- **NEVER use `any` type**

```typescript
import { ReactElement, useState } from 'react';

interface ButtonProps {
  variant: 'primary' | 'secondary';
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
}

export function Button({
  variant,
  onClick,
  children,
  disabled = false
}: ButtonProps): ReactElement {
  return (
    <button
      className={`btn btn-${variant}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
```

## 🏗️ Project Structure

```
{{projectStructure}}
```

## 🎣 React Hooks Rules

### Custom Hooks Pattern

```typescript
// hooks/useUser.ts
import { useState, useEffect } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
}

export function useUser(userId: string) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/users/${userId}`);
        if (!response.ok) throw new Error('Failed to fetch user');
        const data = await response.json();
        setUser(data);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [userId]);

  return { user, loading, error };
}
```

## 🛡️ Data Validation

### Form Validation with React Hook Form + Zod

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type LoginForm = z.infer<typeof loginSchema>;

export function LoginForm(): ReactElement {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    // Handle form submission
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Form fields */}
    </form>
  );
}
```

## 🧪 Testing Strategy

### Requirements

- **MINIMUM 80% code coverage**
- **MUST use React Testing Library**
- **MUST test user interactions**
- **MUST NOT test implementation details**

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(
      <Button variant="primary" onClick={handleClick}>
        Click me
      </Button>
    );

    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

## 🔄 State Management

### State Management Hierarchy

1. **Local State**: useState for component state
2. **Lifted State**: Lift to parent when shared
3. **Context**: For cross-cutting concerns
4. **URL State**: For shareable state
5. **External Store**: Zustand/Redux for complex global state

### Context Pattern

```typescript
import { createContext, useContext, ReactNode } from 'react';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Implementation
  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

## 💅 Code Style & Quality

### ESLint Configuration

```javascript
module.exports = {
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  rules: {
    'react/prop-types': 'off',
    '@typescript-eslint/explicit-function-return-type': 'error',
    '@typescript-eslint/no-explicit-any': 'error',
  },
};
```

## 📋 Development Commands

```json
{
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test --coverage",
    "lint": "eslint src --ext .ts,.tsx",
    "type-check": "tsc --noEmit"
  }
}
```

## ⚠️ CRITICAL GUIDELINES

1. **NEVER mutate state directly**
2. **ALWAYS use proper TypeScript types**
3. **MINIMUM 80% test coverage**
4. **MAXIMUM 300 lines per file**
5. **MUST handle loading and error states**
6. **NEVER use index as key in lists with dynamic items**

## 📋 Pre-commit Checklist

- [ ] TypeScript compiles without errors
- [ ] All tests passing with 80%+ coverage
- [ ] ESLint passes without warnings
- [ ] No console.log statements
- [ ] All components have proper TypeScript types
- [ ] Loading and error states handled
- [ ] Accessibility attributes added (aria-labels, etc.)

## Performance Guidelines

### Optimization Techniques

- Use React.memo for expensive components
- Use useMemo for expensive computations
- Use useCallback for stable function references
- Lazy load routes and heavy components

```typescript
import { memo, useMemo, useCallback } from 'react';

const ExpensiveComponent = memo(({ data }: Props) => {
  const processedData = useMemo(
    () => expensiveProcessing(data),
    [data]
  );

  const handleClick = useCallback(
    (id: string) => {
      // Handle click
    },
    []
  );

  return <div>{/* Component JSX */}</div>;
});
```

## Workflow Rules

### Before Starting Any Task

- Consult `/Docs/Implementation.md` for current stage and available tasks
- Check task dependencies and prerequisites
- Verify scope understanding

### Component Development Flow

1. Define TypeScript interfaces
2. Create component structure
3. Implement functionality
4. Add proper error handling
5. Write comprehensive tests
6. Document with JSDoc if complex

{{#if prpConfig}}

### PRP Workflow

- Check `/PRPs/` directory for detailed implementation prompts
- Follow validation loops defined in PRPs
- Use ai_docs/ for additional context when needed
  {{/if}}
