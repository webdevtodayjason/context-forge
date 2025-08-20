import inquirer from 'inquirer';
import chalk from 'chalk';

interface TechStackAnswers {
  frontend?: string;
  backend?: string;
  database?: string;
  auth?: string;
  styling?: string;
  stateManagement?: string;
}

export async function techStack(projectType: string): Promise<TechStackAnswers> {
  console.log(chalk.blue('\n🛠️  Step 4 of 7: Technology Stack'));
  console.log(chalk.gray('Choose the technologies that best fit your project.\n'));

  const answers: TechStackAnswers = {};
  let stepCounter = 1;

  // Frontend selection (skip for API-only projects)
  if (projectType !== 'api') {
    console.log(chalk.cyan(`🌐 ${stepCounter++}. Frontend Framework`));
    const frontendAnswer = await inquirer.prompt([
      {
        type: 'list',
        name: 'frontend',
        message: 'Select your frontend framework:',
        choices: [
          { name: '🚀 Next.js (React-based, full-stack)', value: 'nextjs' },
          { name: '🦄 Nuxt 4 (Vue-based, full-stack)', value: 'nuxt4' },
          { name: '⚙️  React (SPA)', value: 'react' },
          { name: '💅 Vue.js', value: 'vuejs' },
          { name: '🌶️  Angular', value: 'angular' },
          { name: '🦄 Svelte/SvelteKit', value: 'svelte' },
          { name: '🐍 Vanilla JavaScript', value: 'vanilla' },
          { name: '❌ None (API only)', value: 'none' },
        ],
      },
    ]);
    answers.frontend = frontendAnswer.frontend;

    // Styling options for frontend projects
    if (frontendAnswer.frontend !== 'none') {
      console.log(chalk.cyan(`🎨 ${stepCounter++}. Styling Framework`));
      const stylingAnswer = await inquirer.prompt([
        {
          type: 'list',
          name: 'styling',
          message: 'Select your styling approach:',
          choices: [
            { name: '🌪️  Tailwind CSS', value: 'tailwind' },
            { name: '📦 CSS Modules', value: 'css-modules' },
            { name: '👌 Styled Components', value: 'styled-components' },
            { name: '😍 Emotion', value: 'emotion' },
            { name: '😎 Sass/SCSS', value: 'sass' },
            { name: '📋 Plain CSS', value: 'css' },
          ],
        },
      ]);
      answers.styling = stylingAnswer.styling;

      // State management for React/Vue/Angular/Nuxt
      if (['react', 'nextjs', 'vuejs', 'nuxt4', 'angular'].includes(frontendAnswer.frontend)) {
        console.log(chalk.cyan(`📊 ${stepCounter++}. State Management`));
        const stateAnswer = await inquirer.prompt([
          {
            type: 'list',
            name: 'stateManagement',
            message: 'Select state management solution:',
            choices: getStateManagementChoices(frontendAnswer.frontend),
          },
        ]);
        answers.stateManagement = stateAnswer.stateManagement;
      }
    }
  }

  // Backend selection (skip for frontend-only projects)
  if (projectType !== 'web' && projectType !== 'mobile' && projectType !== 'desktop') {
    console.log(chalk.cyan(`🔌 ${stepCounter++}. Backend Framework`));
    const backendAnswer = await inquirer.prompt([
      {
        type: 'list',
        name: 'backend',
        message: 'Select your backend framework:',
        choices: [
          { name: '⚡ FastAPI (Python)', value: 'fastapi' },
          { name: '🚀 Express.js (Node.js)', value: 'express' },
          { name: '🐍 Django (Python)', value: 'django' },
          { name: '🌶️  Flask (Python)', value: 'flask' },
          { name: '☕ Spring Boot (Java)', value: 'spring-boot' },
          { name: '💎 Ruby on Rails', value: 'rails' },
          { name: '🔵 ASP.NET Core (C#)', value: 'aspnet' },
          { name: '🐹 Go (Gin/Echo)', value: 'go' },
          { name: '❌ None (Frontend only)', value: 'none' },
        ],
      },
    ]);
    answers.backend = backendAnswer.backend;
  }

  // Database selection
  if (answers.backend !== 'none' || projectType === 'fullstack') {
    console.log(chalk.cyan(`💾 ${stepCounter++}. Database`));
    const databaseAnswer = await inquirer.prompt([
      {
        type: 'list',
        name: 'database',
        message: 'Select your database:',
        choices: [
          { name: '🐘 PostgreSQL', value: 'postgresql' },
          { name: '🐬 MySQL', value: 'mysql' },
          { name: '🍃 MongoDB', value: 'mongodb' },
          { name: '💾 SQLite', value: 'sqlite' },
          { name: '⚡ Redis + PostgreSQL', value: 'redis-postgresql' },
          { name: '⚡ Redis + MongoDB', value: 'redis-mongodb' },
          { name: '🚀 Supabase (PostgreSQL)', value: 'supabase' },
          { name: '🔥 Firebase', value: 'firebase' },
          { name: '❌ None', value: 'none' },
        ],
      },
    ]);
    answers.database = databaseAnswer.database;
  }

  // Authentication method
  if (answers.backend !== 'none' || answers.frontend !== 'none') {
    console.log(chalk.cyan(`🔒 ${stepCounter++}. Authentication`));
    const authAnswer = await inquirer.prompt([
      {
        type: 'list',
        name: 'auth',
        message: 'Authentication method:',
        choices: [
          { name: '🏠 JWT-based', value: 'jwt' },
          { name: '🔗 OAuth 2.0 (Google, GitHub)', value: 'oauth' },
          { name: '🍪 Session-based', value: 'session' },
          { name: '✨ Magic links', value: 'magic-links' },
          { name: '🚀 Supabase Auth', value: 'supabase-auth' },
          { name: '🔥 Firebase Auth', value: 'firebase-auth' },
          { name: '🔐 Auth0', value: 'auth0' },
          { name: '👤 Clerk', value: 'clerk' },
          { name: '❌ None', value: 'none' },
        ],
      },
    ]);
    answers.auth = authAnswer.auth;
  }

  console.log(chalk.green('\n✓ Technology stack configured\n'));
  return answers;
}

function getStateManagementChoices(framework: string) {
  switch (framework) {
    case 'react':
    case 'nextjs':
      return [
        { name: 'Redux Toolkit', value: 'redux-toolkit' },
        { name: 'Zustand', value: 'zustand' },
        { name: 'MobX', value: 'mobx' },
        { name: 'Recoil', value: 'recoil' },
        { name: 'Context API (built-in)', value: 'context' },
        { name: 'TanStack Query (React Query)', value: 'tanstack-query' },
        { name: 'None', value: 'none' },
      ];
    case 'vuejs':
      return [
        { name: 'Vuex', value: 'vuex' },
        { name: 'Pinia', value: 'pinia' },
        { name: 'None', value: 'none' },
      ];
    case 'nuxt4':
      return [
        { name: 'Pinia (Recommended)', value: 'pinia' },
        { name: 'Vuex (Legacy)', value: 'vuex' },
        { name: 'useState (Nuxt built-in)', value: 'nuxt-usestate' },
        { name: 'useCookie (Nuxt built-in)', value: 'nuxt-usecookie' },
        { name: 'None', value: 'none' },
      ];
    case 'angular':
      return [
        { name: 'NgRx', value: 'ngrx' },
        { name: 'Akita', value: 'akita' },
        { name: 'RxJS (built-in)', value: 'rxjs' },
        { name: 'None', value: 'none' },
      ];
    default:
      return [{ name: 'None', value: 'none' }];
  }
}
