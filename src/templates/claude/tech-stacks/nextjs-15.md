# {{projectName}} - Claude Code Context

This file provides comprehensive guidance to Claude Code when working with this Next.js 15 application with React 19 and TypeScript.

## Project Overview
{{description}}

## Core Development Philosophy

### KISS (Keep It Simple, Stupid)
Simplicity should be a key goal in design. Choose straightforward solutions over complex ones whenever possible.

### YAGNI (You Aren't Gonna Need It)
Avoid building functionality on speculation. Implement features only when they are needed.

### Design Principles
- **Dependency Inversion**: High-level modules should not depend on low-level modules
- **Open/Closed Principle**: Software entities should be open for extension but closed for modification
- **Component-First**: Build with reusable, composable components
- **Fail Fast**: Validate inputs early, throw errors immediately

## 🧱 Code Structure & Modularity

### File and Component Limits
- **Never create a file longer than 500 lines of code**
- **Components should be under 200 lines** for better maintainability
- **Functions should be short and focused (sub 50 lines)**

## 🚀 Next.js 15 & React 19 Key Features

### TypeScript Integration (MANDATORY)
- **MUST use `ReactElement` instead of `JSX.Element`** for return types
- **MUST import types from 'react'** explicitly
- **NEVER use `JSX.Element` namespace**

```typescript
// ✅ CORRECT
import { ReactElement } from 'react';

function MyComponent(): ReactElement {
  return <div>Content</div>;
}

// ❌ FORBIDDEN
function MyComponent(): JSX.Element {  // Cannot find namespace 'JSX'
  return <div>Content</div>;
}
```

## 🏗️ Project Structure

```
{{projectStructure}}
```

## 🎯 TypeScript Configuration

### Strict Requirements
- **NEVER use `any` type** - use `unknown` if type is truly unknown
- **MUST have explicit return types** for all functions
- **MUST use type inference from Zod schemas** using `z.infer<typeof schema>`

## 🛡️ Data Validation (MANDATORY)

### Zod Validation Rules
- **MUST validate ALL external data**: API responses, form inputs, URL params
- **MUST use branded types** for IDs
- **MUST fail fast**: Validate at system boundaries

```typescript
import { z } from 'zod';

// Branded types for IDs
const UserIdSchema = z.string().uuid().brand<'UserId'>();
type UserId = z.infer<typeof UserIdSchema>;

// Environment validation
export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']),
  NEXT_PUBLIC_APP_URL: z.string().url(),
});

export const env = envSchema.parse(process.env);
```

## 🧪 Testing Strategy

### Requirements
- **MINIMUM 80% code coverage**
- **MUST co-locate tests** with components in `__tests__` folders
- **MUST use React Testing Library**
- **MUST test user behavior** not implementation details

## 🎨 Component Guidelines

### Documentation Requirements
```typescript
/**
 * Component description
 * 
 * @component
 * @example
 * <Button variant="primary" onClick={handleClick}>
 *   Click me
 * </Button>
 */
```

## 🔄 State Management Hierarchy

1. **Local State**: `useState` for component-specific state
2. **Context**: For cross-component state within a feature
3. **URL State**: Use search params for shareable state
4. **Server State**: TanStack Query for ALL API data
5. **Global State**: Zustand ONLY when truly needed

## 🔐 Security Requirements

- **MUST sanitize ALL user inputs** with Zod
- **MUST validate file uploads**: type, size, content
- **MUST prevent XSS** with proper escaping
- **MUST implement CSRF protection**
- **NEVER use dangerouslySetInnerHTML** without sanitization

## 💅 Code Style & Quality

### ESLint Rules
- `@typescript-eslint/no-explicit-any`: error
- `@typescript-eslint/explicit-function-return-type`: error
- `no-console`: error (except warn/error)

## 📋 Development Commands

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint --max-warnings 0",
    "test": "vitest",
    "test:coverage": "vitest --coverage",
    "type-check": "tsc --noEmit"
  }
}
```

## ⚠️ CRITICAL GUIDELINES

1. **ENFORCE strict TypeScript** - ZERO compromises
2. **VALIDATE everything with Zod** - ALL external data
3. **MINIMUM 80% test coverage** - NO EXCEPTIONS
4. **MAXIMUM 500 lines per file** - Split if larger
5. **MUST handle ALL states** - Loading, error, empty, success
6. **NEVER use `any` type** - Use proper typing or `unknown`

## 📋 Pre-commit Checklist

- [ ] TypeScript compiles with ZERO errors
- [ ] Tests passing with 80%+ coverage
- [ ] ESLint passes with ZERO warnings
- [ ] All components have JSDoc documentation
- [ ] Zod schemas validate ALL external data
- [ ] No console.log statements
- [ ] Component files under 200 lines

## Workflow Rules

### Before Starting Any Task
- Consult `/Docs/Implementation.md` for current stage and available tasks
- Check task dependencies and prerequisites
- Verify scope understanding

### Task Execution Protocol
1. Read task from Implementation.md
2. Check relevant documentation
3. Implement following existing patterns
4. Test thoroughly
5. Mark task complete only when fully working

### File Reference Priority
1. `/Docs/Bug_tracking.md` - Check for known issues first
2. `/Docs/Implementation.md` - Main task reference
3. `/Docs/project_structure.md` - Structure guidance
4. `/Docs/UI_UX_doc.md` - Design requirements

{{#if prpConfig}}
### PRP Workflow
- Check `/PRPs/` directory for detailed implementation prompts
- Follow validation loops defined in PRPs
- Use ai_docs/ for additional context when needed
{{/if}}