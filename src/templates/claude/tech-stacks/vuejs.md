# {{projectName}} - Claude Code Context

This file provides comprehensive guidance to Claude Code when working with this Vue.js 3 application with TypeScript and Composition API.

## Project Overview
{{description}}

## Core Development Philosophy

### KISS (Keep It Simple, Stupid)
Simplicity should be a key goal in design. Choose straightforward solutions over complex ones whenever possible.

### YAGNI (You Aren't Gonna Need It)
Avoid building functionality on speculation. Implement features only when they are needed.

### Design Principles
- **Composition over Options API**: Use Composition API for better TypeScript support
- **Single File Components**: Keep templates, logic, and styles together
- **Reactive by Design**: Leverage Vue's reactivity system
- **Props Down, Events Up**: Maintain unidirectional data flow

## 🧱 Code Structure & Modularity

### File and Component Limits
- **Never create a file longer than 300 lines**
- **Components should be under 200 lines**
- **Composables should be under 100 lines**
- **Extract complex logic into composables**

## 🚀 Vue 3 & TypeScript Best Practices

### TypeScript Integration (MANDATORY)
- **MUST use `<script setup lang="ts">`** for all components
- **MUST define props with TypeScript**
- **MUST type all refs and computed properties**
- **NEVER use `any` type**

```vue
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { PropType } from 'vue'

interface User {
  id: number
  name: string
  email: string
}

// Props with TypeScript
const props = defineProps({
  user: {
    type: Object as PropType<User>,
    required: true
  },
  isActive: {
    type: Boolean,
    default: false
  }
})

// Typed emits
const emit = defineEmits<{
  update: [user: User]
  delete: [id: number]
}>()

// Typed refs
const count = ref<number>(0)
const users = ref<User[]>([])

// Typed computed
const fullName = computed<string>(() => {
  return `${props.user.name} (${props.user.email})`
})
</script>
```

## 🏗️ Project Structure

```
{{projectStructure}}
```

### Typical Vue.js Structure
```
src/
├── assets/               # Static assets
├── components/           # Reusable components
│   ├── common/          # Generic components
│   └── features/        # Feature-specific
├── composables/         # Composition functions
├── layouts/             # Layout components
├── pages/               # Page components
├── router/              # Vue Router config
├── stores/              # Pinia stores
├── types/               # TypeScript types
├── utils/               # Utility functions
└── App.vue              # Root component
```

## 🎣 Composables Pattern

### Creating Reusable Composables
```typescript
// composables/useUser.ts
import { ref, computed, Ref } from 'vue'
import type { User } from '@/types'

export function useUser(userId: Ref<number>) {
  const user = ref<User | null>(null)
  const loading = ref(false)
  const error = ref<Error | null>(null)

  const isAdmin = computed(() => user.value?.role === 'admin')

  async function fetchUser() {
    loading.value = true
    error.value = null
    
    try {
      const response = await fetch(`/api/users/${userId.value}`)
      if (!response.ok) throw new Error('Failed to fetch user')
      user.value = await response.json()
    } catch (e) {
      error.value = e as Error
    } finally {
      loading.value = false
    }
  }

  return {
    user: readonly(user),
    loading: readonly(loading),
    error: readonly(error),
    isAdmin,
    fetchUser
  }
}
```

## 🛡️ Form Validation

### VeeValidate with TypeScript and Zod
```vue
<script setup lang="ts">
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import * as z from 'zod'

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

type FormData = z.infer<typeof schema>

const { handleSubmit, errors, defineField } = useForm<FormData>({
  validationSchema: toTypedSchema(schema)
})

const [email, emailAttrs] = defineField('email')
const [password, passwordAttrs] = defineField('password')
const [confirmPassword, confirmPasswordAttrs] = defineField('confirmPassword')

const onSubmit = handleSubmit(async (values) => {
  // Handle form submission
  console.log(values)
})
</script>

<template>
  <form @submit="onSubmit">
    <input v-model="email" v-bind="emailAttrs" />
    <span v-if="errors.email">{{ errors.email }}</span>
    
    <input v-model="password" v-bind="passwordAttrs" type="password" />
    <span v-if="errors.password">{{ errors.password }}</span>
    
    <button type="submit">Submit</button>
  </form>
</template>
```

## 🧪 Testing Strategy

### Requirements
- **MINIMUM 80% code coverage**
- **MUST use Vitest** for unit tests
- **MUST use Vue Test Utils** for component tests
- **MUST test user interactions**

```typescript
import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import UserCard from '@/components/UserCard.vue'
import type { User } from '@/types'

describe('UserCard', () => {
  const mockUser: User = {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com'
  }

  it('renders user information', () => {
    const wrapper = mount(UserCard, {
      props: { user: mockUser }
    })
    
    expect(wrapper.text()).toContain('John Doe')
    expect(wrapper.text()).toContain('john@example.com')
  })

  it('emits update event when clicked', async () => {
    const wrapper = mount(UserCard, {
      props: { user: mockUser }
    })
    
    await wrapper.find('button').trigger('click')
    
    expect(wrapper.emitted()).toHaveProperty('update')
    expect(wrapper.emitted('update')?.[0]).toEqual([mockUser])
  })
})
```

## 🔄 State Management with Pinia

### Type-Safe Stores
```typescript
// stores/user.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User } from '@/types'

export const useUserStore = defineStore('user', () => {
  // State
  const users = ref<User[]>([])
  const currentUser = ref<User | null>(null)
  const loading = ref(false)

  // Getters
  const userCount = computed(() => users.value.length)
  const isAuthenticated = computed(() => !!currentUser.value)
  
  // Actions
  async function fetchUsers() {
    loading.value = true
    try {
      const response = await fetch('/api/users')
      users.value = await response.json()
    } finally {
      loading.value = false
    }
  }

  function setCurrentUser(user: User | null) {
    currentUser.value = user
  }

  return {
    // State
    users: readonly(users),
    currentUser: readonly(currentUser),
    loading: readonly(loading),
    // Getters
    userCount,
    isAuthenticated,
    // Actions
    fetchUsers,
    setCurrentUser
  }
})
```

## 💅 Code Style & Quality

### ESLint Configuration
```javascript
module.exports = {
  extends: [
    'eslint:recommended',
    'plugin:vue/vue3-recommended',
    'plugin:@typescript-eslint/recommended',
    '@vue/typescript/recommended'
  ],
  rules: {
    'vue/multi-word-component-names': 'error',
    'vue/component-api-style': ['error', ['script-setup']],
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/explicit-function-return-type': 'off'
  }
}
```

## 📋 Development Commands

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vue-tsc && vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "lint": "eslint . --ext .vue,.ts,.tsx",
    "type-check": "vue-tsc --noEmit"
  }
}
```

## 🎨 Component Patterns

### Async Components with Suspense
```vue
<script setup lang="ts">
import { defineAsyncComponent } from 'vue'

const AsyncUserList = defineAsyncComponent(() => 
  import('@/components/UserList.vue')
)
</script>

<template>
  <Suspense>
    <template #default>
      <AsyncUserList />
    </template>
    <template #fallback>
      <div>Loading users...</div>
    </template>
  </Suspense>
</template>
```

### Provide/Inject with TypeScript
```typescript
// types/injection-keys.ts
import type { InjectionKey } from 'vue'
import type { User } from './user'

export const UserKey: InjectionKey<User> = Symbol('user')

// Parent component
import { provide } from 'vue'
import { UserKey } from '@/types/injection-keys'

provide(UserKey, currentUser)

// Child component
import { inject } from 'vue'
import { UserKey } from '@/types/injection-keys'

const user = inject(UserKey) // Type-safe!
```

## ⚠️ CRITICAL GUIDELINES

1. **ALWAYS use Composition API** - Not Options API
2. **ALWAYS use `<script setup>`** - Better DX and performance
3. **MINIMUM 80% test coverage** - NO EXCEPTIONS
4. **MAXIMUM 300 lines per file** - Split if larger
5. **MUST handle loading and error states**
6. **NEVER mutate props directly**

## 📋 Pre-commit Checklist

- [ ] TypeScript compiles without errors (vue-tsc)
- [ ] All tests passing with 80%+ coverage
- [ ] ESLint passes without warnings
- [ ] No console.log statements
- [ ] All components use script setup
- [ ] Props are properly typed
- [ ] Loading and error states handled
- [ ] Accessibility attributes added

## Performance Guidelines

### Optimization Techniques
```vue
<script setup lang="ts">
import { shallowRef, computed, watchEffect } from 'vue'

// Use shallowRef for large objects
const largeData = shallowRef<LargeObject>({})

// Computed with getter and setter
const fullName = computed({
  get: () => `${firstName.value} ${lastName.value}`,
  set: (value) => {
    const [first, last] = value.split(' ')
    firstName.value = first
    lastName.value = last
  }
})

// Efficient watchers
watchEffect(() => {
  // Only runs when dependencies change
  console.log(user.value.name)
})
</script>

<template>
  <!-- Use v-show for frequent toggling -->
  <div v-show="isVisible">Frequently toggled</div>
  
  <!-- Use v-if for conditional rendering -->
  <div v-if="user">{{ user.name }}</div>
  
  <!-- Key for list items -->
  <li v-for="item in items" :key="item.id">
    {{ item.name }}
  </li>
</template>
```

## Workflow Rules

### Before Starting Any Task
- Consult `/Docs/Implementation.md` for current stage and available tasks
- Check Vue 3 migration guide if updating from Vue 2
- Review existing component patterns

### Component Development Flow
1. Define TypeScript interfaces
2. Create component with script setup
3. Implement template with proper bindings
4. Add scoped styles if needed
5. Write comprehensive tests
6. Document props and events

{{#if prpConfig}}
### PRP Workflow
- Check `/PRPs/` directory for detailed implementation prompts
- Follow validation loops defined in PRPs
- Use ai_docs/ for Vue-specific documentation
{{/if}}