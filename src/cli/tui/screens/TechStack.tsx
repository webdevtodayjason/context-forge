import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import SelectInput from 'ink-select-input';
import { Hint } from '../components/Hint.js';
import type { ProjectConfig } from '../../../types/index.js';
import type { WizardState } from '../types.js';

export interface TechStackProps {
  projectType: ProjectConfig['projectType'];
  initial?: WizardState['techStack'];
  onSubmit: (stack: WizardState['techStack']) => void;
  onBack: () => void;
}

type SubStep =
  | 'frontend'
  | 'styling'
  | 'stateManagement'
  | 'backend'
  | 'database'
  | 'auth'
  | 'done';

const FRONTEND_CHOICES = [
  { label: '🚀  Next.js (React, full-stack)', value: 'nextjs' },
  { label: '🦄  Nuxt 4 (Vue, full-stack)', value: 'nuxt4' },
  { label: '⚛️   React (SPA)', value: 'react' },
  { label: '💚  Vue.js', value: 'vuejs' },
  { label: '🅰️   Angular', value: 'angular' },
  { label: '🧡  Svelte / SvelteKit', value: 'svelte' },
  { label: '🟨  Vanilla JavaScript', value: 'vanilla' },
  { label: '❌  None (API only)', value: 'none' },
];

const STYLING_CHOICES = [
  { label: '🌪   Tailwind CSS', value: 'tailwind' },
  { label: '📦  CSS Modules', value: 'css-modules' },
  { label: '💅  Styled Components', value: 'styled-components' },
  { label: '😍  Emotion', value: 'emotion' },
  { label: '🎨  Sass/SCSS', value: 'sass' },
  { label: '📋  Plain CSS', value: 'css' },
];

const STATE_CHOICES_BY_FRAMEWORK: Record<string, Array<{ label: string; value: string }>> = {
  react: [
    { label: 'Redux Toolkit', value: 'redux-toolkit' },
    { label: 'Zustand', value: 'zustand' },
    { label: 'MobX', value: 'mobx' },
    { label: 'Context API (built-in)', value: 'context' },
    { label: 'TanStack Query', value: 'tanstack-query' },
    { label: 'None', value: 'none' },
  ],
  nextjs: [
    { label: 'Zustand', value: 'zustand' },
    { label: 'Redux Toolkit', value: 'redux-toolkit' },
    { label: 'Context API (built-in)', value: 'context' },
    { label: 'TanStack Query', value: 'tanstack-query' },
    { label: 'None', value: 'none' },
  ],
  vuejs: [
    { label: 'Pinia', value: 'pinia' },
    { label: 'Vuex', value: 'vuex' },
    { label: 'None', value: 'none' },
  ],
  nuxt4: [
    { label: 'Pinia (recommended)', value: 'pinia' },
    { label: 'useState (Nuxt built-in)', value: 'nuxt-usestate' },
    { label: 'None', value: 'none' },
  ],
  angular: [
    { label: 'NgRx', value: 'ngrx' },
    { label: 'RxJS (built-in)', value: 'rxjs' },
    { label: 'None', value: 'none' },
  ],
};

const BACKEND_CHOICES = [
  { label: '⚡  FastAPI (Python)', value: 'fastapi' },
  { label: '🚀  Express.js (Node.js)', value: 'express' },
  { label: '🐍  Django (Python)', value: 'django' },
  { label: '🌶   Flask (Python)', value: 'flask' },
  { label: '☕  Spring Boot (Java)', value: 'spring-boot' },
  { label: '💎  Ruby on Rails', value: 'rails' },
  { label: '🔵  ASP.NET Core (C#)', value: 'aspnet' },
  { label: '🐹  Go (Gin/Echo)', value: 'go' },
  { label: '❌  None (frontend only)', value: 'none' },
];

const DATABASE_CHOICES = [
  { label: '🐘  PostgreSQL', value: 'postgresql' },
  { label: '🐬  MySQL', value: 'mysql' },
  { label: '🍃  MongoDB', value: 'mongodb' },
  { label: '💾  SQLite', value: 'sqlite' },
  { label: '⚡  Redis + PostgreSQL', value: 'redis-postgresql' },
  { label: '🚀  Supabase', value: 'supabase' },
  { label: '🔥  Firebase', value: 'firebase' },
  { label: '❌  None', value: 'none' },
];

const AUTH_CHOICES = [
  { label: '🏷   JWT-based', value: 'jwt' },
  { label: '🔗  OAuth 2.0', value: 'oauth' },
  { label: '🍪  Session-based', value: 'session' },
  { label: '✨  Magic links', value: 'magic-links' },
  { label: '🚀  Supabase Auth', value: 'supabase-auth' },
  { label: '🔥  Firebase Auth', value: 'firebase-auth' },
  { label: '🔐  Auth0', value: 'auth0' },
  { label: '👤  Clerk', value: 'clerk' },
  { label: '❌  None', value: 'none' },
];

export const TechStack: React.FC<TechStackProps> = ({
  projectType,
  initial,
  onSubmit,
  onBack,
}) => {
  const [stack, setStack] = useState<WizardState['techStack']>(initial ?? {});
  const firstStep: SubStep = projectType === 'api' ? 'backend' : 'frontend';
  const [substep, setSubstep] = useState<SubStep>(firstStep);

  // dynamic flow based on choices made
  const advance = (next: Partial<WizardState['techStack']>): void => {
    const newStack = { ...stack, ...next };
    setStack(newStack);

    const nextStep = computeNextStep(substep, newStack, projectType);
    if (nextStep === 'done') {
      onSubmit(newStack);
    } else {
      setSubstep(nextStep);
    }
  };

  useInput((_input, key) => {
    if (key.escape) {
      const prev = computePrevStep(substep, stack, projectType);
      if (prev === null) {
        onBack();
      } else {
        setSubstep(prev);
      }
    }
  });

  const renderSelect = (
    title: string,
    choices: Array<{ label: string; value: string }>,
    currentValue: string | undefined,
    onPick: (v: string) => void
  ) => (
    <Box flexDirection="column">
      <Text color="cyan" bold>
        Step 4 — Tech stack · {title}
      </Text>
      <Box marginTop={1}>
        <SelectInput
          items={choices}
          initialIndex={Math.max(
            0,
            choices.findIndex((c) => c.value === currentValue)
          )}
          onSelect={(item) => onPick(item.value as string)}
        />
      </Box>
      <Hint />
    </Box>
  );

  switch (substep) {
    case 'frontend':
      return renderSelect('Frontend framework', FRONTEND_CHOICES, stack.frontend, (v) =>
        advance({ frontend: v })
      );
    case 'styling':
      return renderSelect('Styling', STYLING_CHOICES, stack.styling, (v) =>
        advance({ styling: v })
      );
    case 'stateManagement': {
      const choices = STATE_CHOICES_BY_FRAMEWORK[stack.frontend ?? ''] ?? [
        { label: 'None', value: 'none' },
      ];
      return renderSelect('State management', choices, stack.stateManagement, (v) =>
        advance({ stateManagement: v })
      );
    }
    case 'backend':
      return renderSelect('Backend framework', BACKEND_CHOICES, stack.backend, (v) =>
        advance({ backend: v })
      );
    case 'database':
      return renderSelect('Database', DATABASE_CHOICES, stack.database, (v) =>
        advance({ database: v })
      );
    case 'auth':
      return renderSelect('Authentication', AUTH_CHOICES, stack.auth, (v) =>
        advance({ auth: v })
      );
    default:
      return null;
  }
};

function computeNextStep(
  current: SubStep,
  stack: WizardState['techStack'],
  projectType: ProjectConfig['projectType']
): SubStep {
  const wantsFrontend = projectType !== 'api' && stack.frontend && stack.frontend !== 'none';
  const wantsBackend =
    projectType === 'api' ||
    projectType === 'fullstack' ||
    (projectType !== 'web' && projectType !== 'mobile' && projectType !== 'desktop');
  const wantsState =
    wantsFrontend && ['react', 'nextjs', 'vuejs', 'nuxt4', 'angular'].includes(stack.frontend ?? '');

  switch (current) {
    case 'frontend':
      if (wantsFrontend) return 'styling';
      return wantsBackend ? 'backend' : 'auth';
    case 'styling':
      if (wantsState) return 'stateManagement';
      return wantsBackend ? 'backend' : 'auth';
    case 'stateManagement':
      return wantsBackend ? 'backend' : 'auth';
    case 'backend':
      if (stack.backend && stack.backend !== 'none') return 'database';
      return 'auth';
    case 'database':
      return 'auth';
    case 'auth':
      return 'done';
    default:
      return 'done';
  }
}

function computePrevStep(
  current: SubStep,
  stack: WizardState['techStack'],
  projectType: ProjectConfig['projectType']
): SubStep | null {
  const wantsFrontend = projectType !== 'api';
  const wantsState =
    wantsFrontend && ['react', 'nextjs', 'vuejs', 'nuxt4', 'angular'].includes(stack.frontend ?? '');

  switch (current) {
    case 'frontend':
      return null;
    case 'styling':
      return 'frontend';
    case 'stateManagement':
      return 'styling';
    case 'backend':
      if (wantsState) return 'stateManagement';
      if (wantsFrontend && stack.frontend && stack.frontend !== 'none') return 'styling';
      return wantsFrontend ? 'frontend' : null;
    case 'database':
      return 'backend';
    case 'auth':
      if (stack.backend && stack.backend !== 'none') return 'database';
      return wantsFrontend ? 'frontend' : 'backend';
    default:
      return null;
  }
}
