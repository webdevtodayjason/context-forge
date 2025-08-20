# {{projectName}} - Claude Code Context

This file provides comprehensive guidance to Claude Code when working with this Nuxt 4 application with Vue 3, TypeScript, and modern development practices.

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
- **Component-First**: Build with reusable, composable Vue components
- **Fail Fast**: Validate inputs early, throw errors immediately

## 🧱 Code Structure & Modularity

### File and Component Limits

- **Never create a file longer than 500 lines of code**
- **Components should be under 200 lines** for better maintainability
- **Functions should be short and focused (sub 50 lines)**

## 🚀 Nuxt 4 & Vue 3 Key Features

### TypeScript Integration (MANDATORY)

- **MUST use explicit TypeScript interfaces** for all component props
- **MUST define return types** for all composables and functions
- **NEVER use `any` type** - use proper typing or `unknown`

```vue
<script setup lang="ts">
// ✅ CORRECT - Explicit interface and imports
interface Props {
  title: string;
  count: number;
  isActive?: boolean;
}

const props = defineProps<Props>();

// ✅ CORRECT - Typed composable
const { data, pending, error } = await useFetch<User>('/api/user');
</script>
```

### Nuxt 4 Directory Structure (NEW)

```
{{projectStructure}}
```

The key change in Nuxt 4 is the new `app/` directory structure:

```
my-nuxt-app/
├─ app/                    # NEW: Application code
│  ├─ assets/             # Static assets
│  ├─ components/         # Vue components
│  ├─ composables/        # Vue composables
│  ├─ layouts/            # Layout components
│  ├─ middleware/         # Route middleware
│  ├─ pages/              # File-based routing
│  ├─ plugins/            # Plugins
│  ├─ utils/              # Utility functions
│  ├─ app.vue             # Root component
│  ├─ app.config.ts       # App configuration
│  └─ error.vue           # Error page
├─ content/               # Nuxt Content files (if using @nuxt/content)
├─ public/                # Static files
├─ server/                # Server-side code
├─ shared/                # Shared utilities
└─ nuxt.config.ts         # Nuxt configuration
```

## 🎯 TypeScript Configuration

### Strict Requirements

- **NEVER use `any` type** - use `unknown` if type is truly unknown
- **MUST have explicit return types** for all functions and composables
- **MUST use type inference from Zod schemas** using `z.infer<typeof schema>`
- **MUST use Nuxt's auto-generated types** from `.nuxt/nuxt.d.ts`

```typescript
// ✅ CORRECT - Typed composable
export const useUserStore = () => {
  const user = ref<User | null>(null);
  
  const fetchUser = async (id: string): Promise<User> => {
    const { data } = await $fetch<User>(`/api/users/${id}`);
    user.value = data;
    return data;
  };
  
  return {
    user: readonly(user),
    fetchUser,
  };
};
```

## 🛡️ Data Validation (MANDATORY)

### Zod Validation Rules

- **MUST validate ALL external data**: API responses, form inputs, URL params
- **MUST use branded types** for IDs
- **MUST fail fast**: Validate at system boundaries

```typescript
import { z } from 'zod';

// Branded types for IDs
export const UserIdSchema = z.string().uuid().brand<'UserId'>();
export type UserId = z.infer<typeof UserIdSchema>;

// API response validation
export const UserSchema = z.object({
  id: UserIdSchema,
  name: z.string().min(1),
  email: z.string().email(),
  createdAt: z.string().datetime(),
});

export type User = z.infer<typeof UserSchema>;

// Use in composables
export const useUserApi = () => {
  const getUser = async (id: UserId): Promise<User> => {
    const response = await $fetch(`/api/users/${id}`);
    return UserSchema.parse(response);
  };
  
  return { getUser };
};
```

## 🧪 Testing Strategy

### Requirements

- **MINIMUM 80% code coverage**
- **MUST use Vitest** (built into Nuxt 4)
- **MUST use Vue Testing Library** for component testing
- **MUST test user behavior** not implementation details

```typescript
// ✅ CORRECT - Component test
import { render, screen } from '@testing-library/vue';
import { describe, it, expect } from 'vitest';
import UserCard from '~/components/UserCard.vue';

describe('UserCard', () => {
  it('displays user information correctly', () => {
    const user = { id: '1', name: 'John Doe', email: 'john@example.com' };
    
    render(UserCard, {
      props: { user },
    });
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
  });
});
```

## 🎨 Component Guidelines

### Vue 3 Composition API (MANDATORY)

- **MUST use `<script setup>`** for all components
- **MUST use TypeScript** with explicit prop interfaces
- **MUST use auto-imports** from Nuxt (no need to import `ref`, `computed`, etc.)

```vue
<script setup lang="ts">
// ✅ CORRECT - Auto-imported composables, typed props
interface Props {
  user: User;
  variant?: 'primary' | 'secondary';
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
});

const emit = defineEmits<{
  click: [user: User];
}>();

// Auto-imported from Nuxt
const isHovered = ref(false);
const displayName = computed(() => props.user.name.toUpperCase());

// Nuxt-specific composables
const { $router } = useNuxtApp();
</script>

<template>
  <div 
    :class="[
      'user-card', 
      `user-card--${variant}`
    ]"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
    @click="emit('click', user)"
  >
    <h3>{{ displayName }}</h3>
  </div>
</template>
```

## 🔄 State Management Hierarchy

1. **Component State**: `ref()` and `reactive()` for component-specific state
2. **Nuxt State**: `useState()` for cross-component state within pages
3. **Global State**: Pinia stores for complex application state
4. **Server State**: `useFetch()`, `useLazyFetch()` for ALL API data
5. **Persistent State**: `useCookie()` for user preferences

```typescript
// ✅ CORRECT - Nuxt state patterns

// 1. Component state
const isOpen = ref(false);

// 2. Nuxt cross-component state
const user = useState<User | null>('user', () => null);

// 3. Pinia store
export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);
  const isAuthenticated = computed(() => !!user.value);
  
  return { user, isAuthenticated };
});

// 4. Server state
const { data: users, pending, refresh } = await useFetch<User[]>('/api/users');

// 5. Persistent state
const theme = useCookie<'light' | 'dark'>('theme', {
  default: () => 'light',
});
```

## 🔐 Security Requirements

- **MUST sanitize ALL user inputs** with Zod
- **MUST validate file uploads**: type, size, content
- **MUST prevent XSS** with proper escaping (Vue handles this automatically)
- **MUST implement CSRF protection** in server routes
- **NEVER use `v-html`** without sanitization

## 💅 Code Style & Quality

### ESLint Rules (Nuxt 4 defaults)

- `@typescript-eslint/no-explicit-any`: error
- `@typescript-eslint/explicit-function-return-type`: error  
- `vue/no-unused-vars`: error
- `vue/require-default-prop`: off (using TypeScript defaults)

## 📋 Development Commands

```json
{
  "scripts": {
    "dev": "nuxt dev",
    "build": "nuxt build",
    "preview": "nuxt preview",
    "postinstall": "nuxt prepare",
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "test": "vitest",
    "test:coverage": "vitest --coverage",
    "typecheck": "nuxt typecheck"
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
7. **USE auto-imports** - Don't manually import Vue composables

## 🚀 Nuxt 4 Specific Best Practices

### Server-Side Rendering (SSR)

```typescript
// ✅ CORRECT - SSR-safe data fetching
const { data: product } = await useFetch<Product>(`/api/products/${route.params.id}`, {
  key: `product-${route.params.id}`,
  server: true, // Ensure SSR
});
```

### File-Based Routing

```
app/pages/
├─ index.vue              # /
├─ about.vue              # /about
├─ products/
│  ├─ index.vue          # /products
│  ├─ [id].vue           # /products/:id
│  └─ [id]/
│     └─ edit.vue        # /products/:id/edit
└─ [...slug].vue         # Catch-all route
```

### Middleware

```typescript
// app/middleware/auth.ts
export default defineNuxtRouteMiddleware((to, from) => {
  const { $auth } = useNuxtApp();
  
  if (!$auth.user) {
    return navigateTo('/login');
  }
});
```

### Composables

```typescript
// app/composables/useApi.ts - Auto-imported
export const useApi = () => {
  const config = useRuntimeConfig();
  
  const get = async <T>(path: string): Promise<T> => {
    return await $fetch<T>(`${config.public.apiBase}${path}`);
  };
  
  return { get };
};
```

## 📋 Pre-commit Checklist

- [ ] TypeScript compiles with ZERO errors (`nuxt typecheck`)
- [ ] Tests passing with 80%+ coverage (`npm run test:coverage`)
- [ ] ESLint passes with ZERO warnings (`npm run lint`)
- [ ] All components have proper TypeScript interfaces
- [ ] Zod schemas validate ALL external data
- [ ] No console.log statements (except in development)
- [ ] Component files under 200 lines
- [ ] Proper use of Nuxt 4 auto-imports

## Workflow Rules

### Before Starting Any Task

- Consult `/Docs/Implementation.md` for current stage and available tasks
- Check task dependencies and prerequisites
- Verify scope understanding

### Task Execution Protocol

1. Read task from Implementation.md
2. Check relevant documentation
3. Implement following existing patterns
4. Test thoroughly with Vitest
5. Mark task complete only when fully working

### File Reference Priority

1. `/Docs/Bug_tracking.md` - Check for known issues first
2. `/Docs/Implementation.md` - Main task reference
3. `/Docs/project_structure.md` - Structure guidance
4. `/Docs/UI_UX_doc.md` - Design requirements

{{#if prpConfig}}

## 🎯 PRP-Driven Development Workflow

This project uses **Prompt-Driven Programming (PRPs)** for structured implementation. PRPs are comprehensive implementation blueprints that ensure one-pass success.

### Available PRPs

#### Main Project PRP
- **`/PRPs/{{projectSlug}}-prp.md`** - Base implementation guide for the entire project

{{#if hasFeatures}}
#### Feature-Specific PRPs
{{#each features}}
- **`/PRPs/feature-{{id}}-prp.md`** - Implementation guide for {{name}}
{{/each}}
{{/if}}

#### Complex Project Planning  
- **`/PRPs/{{projectSlug}}-planning.md`** - Architecture and planning document (if applicable)

### PRP Usage Instructions

#### 🚀 **Executing a PRP**
Use the `/prp-execute` slash command:
```
/prp-execute feature-auth-prp
```
This will:
1. Load the specified PRP file
2. Create a comprehensive implementation plan
3. Execute following the PRP blueprint
4. Run all validation gates
5. Complete all checklist items

#### 📝 **Creating New PRPs**
Use the `/prp-create` slash command for new features:
```
/prp-create "New Feature Name"
```
This will:
1. Research the codebase for similar patterns
2. Find relevant documentation
3. Generate a comprehensive PRP with AI assistance (if configured)
4. Include validation gates and implementation steps

#### 🎯 **PRP Execution Rules**

1. **Always start with the PRP** - Don't implement without reading the PRP first
2. **Follow the validation gates** - Each step has specific validation requirements  
3. **Use the TodoWrite tool** - Track progress through the PRP tasks
4. **Complete all checklist items** - Every PRP has a completion checklist
5. **Run validation commands** - Each PRP specifies required validation steps

#### 🔄 **PRP Validation Loop**

Each PRP follows this validation pattern:
```
1. Implement component/feature
2. Run syntax validation (linting, type checking)
3. Run unit tests with Vitest
4. Run integration tests  
5. Manual verification
6. Mark as complete only when ALL validations pass
```

### AI-Enhanced PRPs

If AI-powered PRP generation is enabled, each feature PRP contains:
- **Intelligent implementation strategies** tailored to the specific feature
- **Feature-specific gotchas and best practices**  
- **Custom validation approaches** for the feature type
- **Relevant documentation and examples** curated by AI

### PRP Support Files

- **`/PRPs/ai_docs/`** - Curated documentation for AI context
- **`.claude/commands/`** - Slash commands for PRP management
- **`/Docs/Implementation.md`** - High-level implementation roadmap

{{/if}}