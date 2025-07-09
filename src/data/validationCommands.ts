import { ProjectConfig } from '../types';

export interface ValidationCommandSet {
  syntax: string[];
  tests: string[];
  build: string;
  start: string;
  typeCheck?: string;
  lint?: string;
  format?: string;
  security?: string[];
  coverage?: string;
}

export const techStackValidationCommands: Record<string, ValidationCommandSet> = {
  // Frontend frameworks
  nextjs: {
    syntax: ['npm run type-check', 'npm run lint'],
    tests: ['npm test -- --coverage'],
    build: 'npm run build',
    start: 'npm run dev',
    typeCheck: 'npm run type-check',
    lint: 'npm run lint',
    format: 'npm run format',
    coverage: 'npm test -- --coverage --watchAll=false',
    security: ['npm audit', 'next-secure-headers --check'],
  },

  react: {
    syntax: ['npm run type-check', 'npm run lint'],
    tests: ['npm test -- --coverage --watchAll=false'],
    build: 'npm run build',
    start: 'npm start',
    typeCheck: 'tsc --noEmit',
    lint: 'eslint src --ext .ts,.tsx',
    format: 'prettier --write "src/**/*.{ts,tsx}"',
    coverage: 'npm test -- --coverage --watchAll=false',
  },

  vue: {
    syntax: ['npm run type-check', 'npm run lint'],
    tests: ['npm run test:unit', 'npm run test:coverage'],
    build: 'npm run build',
    start: 'npm run dev',
    typeCheck: 'vue-tsc --noEmit',
    lint: 'eslint . --ext .vue,.ts,.tsx',
    format: 'prettier --write "src/**/*.{vue,ts,tsx}"',
    coverage: 'vitest --coverage',
  },

  angular: {
    syntax: ['ng lint', 'ng build --configuration development'],
    tests: ['ng test --no-watch --code-coverage'],
    build: 'ng build --configuration production',
    start: 'ng serve',
    lint: 'ng lint',
    format: 'prettier --write "src/**/*.{ts,html,scss}"',
    coverage: 'ng test --no-watch --code-coverage',
    security: [
      'npm audit',
      'ng build --configuration production --stats-json && webpack-bundle-analyzer dist/stats.json',
    ],
  },

  // Backend frameworks
  express: {
    syntax: ['npm run type-check', 'npm run lint'],
    tests: ['npm test', 'npm run test:integration'],
    build: 'npm run build',
    start: 'npm run dev',
    typeCheck: 'tsc --noEmit',
    lint: 'eslint src --ext .ts',
    format: 'prettier --write "src/**/*.ts"',
    coverage: 'jest --coverage',
    security: ['npm audit', 'npm run security:check'],
  },

  fastapi: {
    syntax: ['mypy app', 'ruff check .'],
    tests: ['pytest', 'pytest --cov=app --cov-report=html'],
    build: 'python -m compileall app',
    start: 'uvicorn app.main:app --reload',
    lint: 'ruff check . --fix',
    format: 'black .',
    typeCheck: 'mypy app',
    coverage: 'pytest --cov=app --cov-report=term-missing',
    security: ['bandit -r app', 'safety check'],
  },

  django: {
    syntax: ['python manage.py check', 'ruff check .', 'mypy .'],
    tests: ['python manage.py test', 'pytest --cov'],
    build: 'python manage.py collectstatic --noinput',
    start: 'python manage.py runserver',
    lint: 'ruff check . --fix',
    format: 'black .',
    typeCheck: 'mypy .',
    coverage: 'pytest --cov --cov-report=html',
    security: ['python manage.py check --deploy', 'bandit -r . -ll', 'safety check'],
  },

  spring: {
    syntax: ['mvn compile', 'mvn checkstyle:check'],
    tests: ['mvn test', 'mvn verify'],
    build: 'mvn clean package',
    start: 'mvn spring-boot:run',
    lint: 'mvn checkstyle:check',
    format: 'mvn spotless:apply',
    coverage: 'mvn test jacoco:report',
    security: ['mvn dependency-check:check', 'mvn spotbugs:check'],
  },

  rails: {
    syntax: ['bundle exec rubocop', 'rails zeitwerk:check'],
    tests: ['bundle exec rspec', 'rails test'],
    build: 'rails assets:precompile',
    start: 'rails server',
    lint: 'bundle exec rubocop',
    format: 'bundle exec rubocop -A',
    coverage: 'bundle exec rspec --format RspecJunitFormatter --out rspec.xml',
    security: ['bundle exec brakeman', 'bundle audit check'],
  },
};

// Helper function to get validation commands for a tech stack
export function getValidationCommands(techStack: ProjectConfig['techStack']): ValidationCommandSet {
  const frontend = techStack.frontend;
  const backend = techStack.backend;

  // Try to find specific commands for frontend or backend
  if (frontend && techStackValidationCommands[frontend]) {
    return techStackValidationCommands[frontend];
  }

  if (backend && techStackValidationCommands[backend]) {
    return techStackValidationCommands[backend];
  }

  // Default commands
  return {
    syntax: ['npm run lint', 'npm run type-check'],
    tests: ['npm test'],
    build: 'npm run build',
    start: 'npm start',
    lint: 'npm run lint',
    coverage: 'npm test -- --coverage',
  };
}

// Validation levels with descriptions
export const validationLevels = {
  syntax: {
    name: 'Syntax Check',
    description: 'Validates code syntax and type safety',
    critical: true,
  },
  lint: {
    name: 'Linting',
    description: 'Checks code style and potential errors',
    critical: true,
  },
  tests: {
    name: 'Unit Tests',
    description: 'Runs unit and integration tests',
    critical: true,
  },
  coverage: {
    name: 'Test Coverage',
    description: 'Checks test coverage meets minimum requirements',
    critical: false,
  },
  build: {
    name: 'Build',
    description: 'Builds the project for production',
    critical: true,
  },
  security: {
    name: 'Security Check',
    description: 'Scans for security vulnerabilities',
    critical: false,
  },
};
