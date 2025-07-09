import Handlebars from 'handlebars';
import fs from 'fs-extra';
import path from 'path';
import { ProjectConfig, PRPContext, Feature, PRPTask } from '../types';
import { getValidationCommands } from '../data/validationCommands';

export async function generatePRP(
  config: ProjectConfig,
  type: 'base' | 'planning' | 'spec' = 'base'
): Promise<string> {
  const templatePath = path.join(__dirname, '../../templates/prp', `${type}.md`);
  const templateContent = await fs.readFile(templatePath, 'utf-8');
  const template = Handlebars.compile(templateContent);

  const context = createPRPContext(config, type);
  return template(context);
}

function createPRPContext(config: ProjectConfig, type: string): Partial<PRPContext> {
  const primaryFeature =
    config.features.find((f) => f.priority === 'must-have') || config.features[0];
  const language = getLanguageFromTechStack(config.techStack);
  const testLanguage = getTestLanguageFromTechStack(config.techStack);

  const baseContext = {
    projectName: config.projectName,
    featureName: primaryFeature?.name || 'Core Feature',
    goal: `Implement ${primaryFeature?.name || 'core functionality'} for ${config.projectName}`,
    reasons: [
      primaryFeature?.description || 'Enable core functionality',
      'Provide value to end users',
      'Establish foundation for future features',
    ],
    description: config.description,
    successCriteria: generateSuccessCriteria(config.features),
    documentation: generateDocumentation(config.techStack),
    projectStructure: generateProjectStructure(config.techStack),
    desiredStructure: generateDesiredStructure(config.techStack, config.features),
    language,
    testLanguage,
    gotchas: generateGotchas(config.techStack),
    tasks: generatePRPTasks(config.features, config.techStack),
    validationCommands: generateValidationCommands(config.techStack),
    integrationTests: generateIntegrationTests(config.features, config.techStack),
    expectedResult: 'All tests passing, feature working as expected',
    customValidation: [
      'Load testing with realistic data',
      'End-to-end user journey testing',
      'Performance benchmarking',
      'Security scanning',
    ],
    checklist: generateChecklist(config.techStack),
    antiPatterns: generateAntiPatterns(config.techStack),
  };

  if (type === 'planning') {
    return {
      ...baseContext,
      summary: `Planning document for ${config.projectName} - ${config.description}`,
      architectureDiagram: generateArchitectureDiagram(config),
      components: generateComponents(config),
      dataFlowDiagram: generateDataFlowDiagram(config),
      decisions: generateTechnicalDecisions(config),
      phases: generateImplementationPhases(config),
      risks: generateRisks(config),
      security: generateSecurityConsiderations(config),
      performance: generatePerformanceRequirements(config),
      monitoring: generateMonitoringStrategy(config),
      future: generateFutureConsiderations(config),
    };
  }

  if (type === 'spec') {
    return {
      ...baseContext,
      version: '1.0.0',
      status: 'Draft',
      author: 'Context Forge',
      date: new Date().toISOString().split('T')[0],
      objective: `Technical specification for ${primaryFeature?.name || 'core feature'}`,
      inScope: config.features.filter((f) => f.priority === 'must-have').map((f) => f.name),
      outOfScope: config.features.filter((f) => f.priority === 'nice-to-have').map((f) => f.name),
      functionalRequirements: generateFunctionalRequirements(config.features),
      nonFunctionalRequirements: generateNonFunctionalRequirements(config),
      endpoints: generateAPIEndpoints(config.features, config.techStack),
      entities: generateDataEntities(config.features, config.techStack),
      databaseSchema: generateDatabaseSchema(config.features, config.techStack),
      businessRules: generateBusinessRules(config.features),
      errorScenarios: generateErrorScenarios(config.features),
      unitTests: generateUnitTestStrategy(config),
      integrationTests: generateIntegrationTestScenarios(config.features),
      performanceTests: generatePerformanceTests(config),
      securityRequirements: generateSecurityRequirements(config),
      externalDependencies: generateExternalDependencies(config.techStack),
      libraries: generateLibraryDependencies(config.techStack),
      migrationRequired: false,
      openQuestions: [],
    };
  }

  return baseContext;
}

function getLanguageFromTechStack(techStack: ProjectConfig['techStack']): string {
  if (
    techStack.backend === 'fastapi' ||
    techStack.backend === 'django' ||
    techStack.backend === 'flask'
  ) {
    return 'python';
  }
  if (techStack.backend === 'spring-boot') {
    return 'java';
  }
  if (techStack.backend === 'rails') {
    return 'ruby';
  }
  if (techStack.backend === 'aspnet') {
    return 'csharp';
  }
  if (techStack.backend === 'go') {
    return 'go';
  }
  return 'typescript';
}

function getTestLanguageFromTechStack(techStack: ProjectConfig['techStack']): string {
  const language = getLanguageFromTechStack(techStack);
  if (language === 'python') return 'python';
  if (language === 'java') return 'java';
  if (language === 'ruby') return 'ruby';
  if (language === 'csharp') return 'csharp';
  if (language === 'go') return 'go';
  return 'typescript';
}

function generateSuccessCriteria(features: Feature[]): string[] {
  const criteria: string[] = [];

  features
    .filter((f) => f.priority === 'must-have')
    .forEach((feature) => {
      if (feature.id === 'auth') {
        criteria.push('Users can register and login successfully');
        criteria.push('JWT tokens are properly validated');
        criteria.push('Protected routes require authentication');
      } else if (feature.id === 'crud') {
        criteria.push('All CRUD operations work correctly');
        criteria.push('Data validation is enforced');
        criteria.push('Error handling provides meaningful feedback');
      } else if (feature.id === 'api-docs') {
        criteria.push('API documentation is auto-generated and accurate');
        criteria.push('All endpoints are documented with examples');
      } else {
        criteria.push(`${feature.name} is fully functional`);
      }
    });

  return criteria;
}

function generateDocumentation(techStack: ProjectConfig['techStack']): any[] {
  const docs = [];

  if (techStack.frontend === 'nextjs') {
    docs.push({
      type: 'url',
      url: 'https://nextjs.org/docs',
      reason: 'Next.js 15 documentation for App Router and Server Components',
    });
  }

  if (techStack.backend === 'fastapi') {
    docs.push({
      type: 'url',
      url: 'https://fastapi.tiangolo.com/',
      reason: 'FastAPI documentation for async endpoints and Pydantic models',
    });
  }

  if (techStack.database === 'postgresql') {
    docs.push({
      type: 'url',
      url: 'https://www.postgresql.org/docs/',
      reason: 'PostgreSQL documentation for advanced queries and optimization',
    });
  }

  return docs;
}

function generateProjectStructure(techStack: ProjectConfig['techStack']): string {
  if (techStack.frontend === 'nextjs') {
    return `project-root/
├── src/
│   ├── app/
│   ├── components/
│   ├── lib/
│   └── types/
├── public/
├── tests/
└── package.json`;
  }

  if (techStack.backend === 'fastapi') {
    return `project-root/
├── app/
│   ├── api/
│   ├── models/
│   ├── schemas/
│   └── services/
├── tests/
└── requirements.txt`;
  }

  return `project-root/
├── src/
├── tests/
└── config/`;
}

function generateDesiredStructure(
  techStack: ProjectConfig['techStack'],
  features: Feature[]
): string {
  // Generate structure based on features
  const structure = ['project-root/'];

  if (techStack.frontend) {
    structure.push('├── src/');
    if (features.some((f) => f.id === 'auth')) {
      structure.push('│   ├── features/auth/');
    }
    if (features.some((f) => f.id === 'dashboard')) {
      structure.push('│   ├── features/dashboard/');
    }
  }

  return structure.join('\n');
}

function generateGotchas(techStack: ProjectConfig['techStack']): string[] {
  const gotchas = [];

  if (techStack.frontend === 'nextjs') {
    gotchas.push('Next.js 15 requires "use client" directive for interactive components');
    gotchas.push('Server Components cannot use browser APIs or event handlers');
  }

  if (techStack.backend === 'fastapi') {
    gotchas.push('FastAPI requires async functions for endpoints to enable concurrency');
    gotchas.push('Pydantic v2 has breaking changes from v1 - use v2 syntax');
  }

  if (techStack.auth === 'jwt') {
    gotchas.push('Use RS256 algorithm for production JWT tokens, not HS256');
    gotchas.push('Store refresh tokens in httpOnly cookies for security');
  }

  return gotchas;
}

function generatePRPTasks(features: Feature[], techStack: ProjectConfig['techStack']): PRPTask[] {
  const tasks: PRPTask[] = [];

  // Foundation task
  tasks.push({
    name: 'Set up project foundation',
    action: 'CREATE',
    file: 'project structure',
    steps: [
      'Initialize project with package manager',
      'Set up TypeScript/language configuration',
      'Configure linting and formatting',
      'Set up testing framework',
    ],
  });

  // Feature-specific tasks
  features
    .filter((f) => f.priority === 'must-have')
    .forEach((feature) => {
      tasks.push({
        name: `Implement ${feature.name}`,
        action: 'CREATE',
        file: `features/${feature.id}`,
        steps: feature.subtasks || [`Implement ${feature.name} functionality`],
        pseudocode: generatePseudocode(feature, techStack),
      });
    });

  return tasks;
}

function generatePseudocode(feature: Feature, techStack: ProjectConfig['techStack']): string {
  if (feature.id === 'auth' && techStack.backend === 'fastapi') {
    return `# Authentication endpoint
@router.post("/login")
async def login(credentials: LoginSchema):
    # Validate credentials
    user = await authenticate_user(credentials)
    if not user:
        raise HTTPException(401, "Invalid credentials")
    
    # Generate tokens
    access_token = create_access_token(user.id)
    refresh_token = create_refresh_token(user.id)
    
    # Return tokens
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token
    )`;
  }

  return '# TODO: Implement feature logic';
}

function generateValidationCommands(
  techStack: ProjectConfig['techStack']
): PRPContext['validationCommands'] {
  const validationSet = getValidationCommands(techStack);

  const commands: PRPContext['validationCommands'] = {
    syntax: validationSet.syntax || [],
    tests: validationSet.tests || [],
    start: validationSet.start || '',
    deployment: [
      `${validationSet.build || 'npm run build'} # Build production version`,
      'Run integration tests against staging',
      'Deploy to staging environment',
      'Run smoke tests on staging',
      'Deploy to production with rollback plan',
    ],
  };

  // Add type checking if available
  if (validationSet.typeCheck) {
    commands.syntax.push(validationSet.typeCheck);
  }

  // Add linting if available and not already in syntax
  if (validationSet.lint && !commands.syntax.includes(validationSet.lint)) {
    commands.syntax.push(validationSet.lint);
  }

  // Add security checks to deployment if available
  if (validationSet.security) {
    validationSet.security.forEach((secCmd) => {
      commands.deployment.push(`${secCmd} # Security scan`);
    });
  }

  return commands;
}

function generateIntegrationTests(
  features: Feature[],
  techStack: ProjectConfig['techStack']
): string[] {
  const tests = [];

  if (features.some((f) => f.id === 'auth')) {
    if (techStack.backend === 'fastapi') {
      tests.push(`curl -X POST http://localhost:8000/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"email": "test@example.com", "password": "testpass"}'`);
    }
  }

  if (features.some((f) => f.id === 'crud')) {
    tests.push('# Test CRUD operations');
    tests.push('# Create: POST /api/items');
    tests.push('# Read: GET /api/items');
    tests.push('# Update: PUT /api/items/:id');
    tests.push('# Delete: DELETE /api/items/:id');
  }

  return tests;
}

function generateChecklist(techStack: ProjectConfig['techStack']): string[] {
  const checklist = [
    'All tests pass',
    'No linting errors',
    'No type errors',
    'Manual test successful',
    'Error cases handled gracefully',
    'Logs are informative but not verbose',
  ];

  if (techStack.frontend) {
    checklist.push('UI is responsive on mobile');
    checklist.push('Accessibility requirements met');
  }

  if (techStack.backend) {
    checklist.push('API endpoints return correct status codes');
    checklist.push('Input validation is comprehensive');
  }

  return checklist;
}

function generateAntiPatterns(techStack: ProjectConfig['techStack']): string[] {
  const antiPatterns = [
    "Don't create new patterns when existing ones work",
    "Don't skip validation because 'it should work'",
    "Don't ignore failing tests - fix them",
    "Don't hardcode values that should be config",
    "Don't catch all exceptions - be specific",
  ];

  if (techStack.frontend === 'nextjs') {
    antiPatterns.push("Don't use client components for static content");
    antiPatterns.push("Don't fetch data in client components when server components can do it");
  }

  if (techStack.backend === 'fastapi') {
    antiPatterns.push("Don't use sync functions in async context");
    antiPatterns.push("Don't skip Pydantic validation");
  }

  return antiPatterns;
}

// Planning-specific functions
function generateArchitectureDiagram(_config: ProjectConfig): string {
  return `graph TB
    A[Client] --> B[Frontend]
    B --> C[API Gateway]
    C --> D[Backend Services]
    D --> E[Database]
    D --> F[Cache]`;
}

function generateComponents(config: ProjectConfig): any[] {
  const components = [];

  if (config.techStack.frontend) {
    components.push({
      name: 'Frontend Application',
      purpose: 'User interface and client-side logic',
      responsibilities: ['Render UI', 'Handle user interactions', 'Make API calls'],
      dependencies: ['API Gateway', 'Authentication Service'],
    });
  }

  if (config.techStack.backend) {
    components.push({
      name: 'Backend API',
      purpose: 'Business logic and data processing',
      responsibilities: ['Process requests', 'Validate data', 'Handle business rules'],
      dependencies: ['Database', 'Cache', 'External Services'],
    });
  }

  return components;
}

function generateDataFlowDiagram(_config: ProjectConfig): string {
  return `sequenceDiagram
    participant U as User
    participant F as Frontend
    participant A as API
    participant D as Database
    
    U->>F: Request
    F->>A: API Call
    A->>D: Query
    D-->>A: Data
    A-->>F: Response
    F-->>U: Display`;
}

function generateTechnicalDecisions(config: ProjectConfig): any[] {
  return [
    {
      decision: 'Frontend Framework',
      options: [
        { name: 'Next.js', description: 'Full-stack React framework' },
        { name: 'React SPA', description: 'Single-page application' },
      ],
      chosen: config.techStack.frontend || 'Next.js',
      rationale: 'Provides SSR, routing, and optimization out of the box',
    },
  ];
}

function generateImplementationPhases(_config: ProjectConfig): any[] {
  return [
    {
      name: 'Foundation',
      duration: '1 week',
      goals: ['Set up project', 'Configure tools', 'Create base structure'],
      deliverables: ['Project skeleton', 'CI/CD pipeline', 'Development environment'],
      dependencies: null,
    },
    {
      name: 'Core Features',
      duration: '2-3 weeks',
      goals: ['Implement must-have features', 'Create API endpoints', 'Build UI components'],
      deliverables: ['Working features', 'API documentation', 'Test coverage'],
      dependencies: 'Foundation',
    },
  ];
}

function generateRisks(_config: ProjectConfig): any[] {
  return [
    {
      risk: 'Technical Complexity',
      probability: 'Medium',
      impact: 'High',
      mitigation: 'Break down complex features, use proven patterns',
    },
  ];
}

function generateSecurityConsiderations(_config: ProjectConfig): string[] {
  return [
    'Implement proper authentication and authorization',
    'Validate all user inputs',
    'Use HTTPS for all communications',
    'Implement rate limiting',
    'Regular security updates',
  ];
}

function generatePerformanceRequirements(_config: ProjectConfig): any[] {
  return [
    { metric: 'Response Time', requirement: '< 200ms for API calls' },
    { metric: 'Page Load', requirement: '< 3s initial load' },
    { metric: 'Concurrent Users', requirement: 'Support 1000+ concurrent users' },
  ];
}

function generateMonitoringStrategy(_config: ProjectConfig): any[] {
  return [
    {
      area: 'Application Performance',
      metrics: ['Response times', 'Error rates', 'Throughput'],
      alerts: ['Response time > 500ms', 'Error rate > 1%'],
    },
  ];
}

function generateFutureConsiderations(_config: ProjectConfig): string[] {
  return [
    'Microservices architecture for scaling',
    'Multi-region deployment',
    'Advanced caching strategies',
    'Machine learning integration',
  ];
}

// Spec-specific functions
function generateFunctionalRequirements(features: Feature[]): any[] {
  return features.map((feature, index) => ({
    id: `FR${index + 1}`,
    title: feature.name,
    description: feature.description,
    criteria: feature.subtasks || [],
  }));
}

function generateNonFunctionalRequirements(_config: ProjectConfig): any[] {
  return [
    {
      category: 'Performance',
      requirements: [
        { name: 'Response Time', value: '< 200ms' },
        { name: 'Throughput', value: '1000 req/s' },
      ],
    },
    {
      category: 'Security',
      requirements: [
        { name: 'Authentication', value: 'JWT-based' },
        { name: 'Encryption', value: 'TLS 1.3' },
      ],
    },
  ];
}

function generateAPIEndpoints(features: Feature[], _techStack: ProjectConfig['techStack']): any[] {
  const endpoints = [];

  if (features.some((f) => f.id === 'auth')) {
    endpoints.push({
      method: 'POST',
      path: '/api/auth/login',
      description: 'User login',
      requestExample: JSON.stringify({ email: 'user@example.com', password: 'password' }, null, 2),
      responseExample: JSON.stringify({ access_token: 'jwt...', refresh_token: 'jwt...' }, null, 2),
      statusCodes: [
        { code: 200, description: 'Login successful' },
        { code: 401, description: 'Invalid credentials' },
      ],
    });
  }

  return endpoints;
}

function generateDataEntities(features: Feature[], _techStack: ProjectConfig['techStack']): any[] {
  const entities = [];

  if (features.some((f) => f.id === 'auth')) {
    entities.push({
      name: 'User',
      schema: `interface User {
  id: string;
  email: string;
  password: string; // hashed
  createdAt: Date;
  updatedAt: Date;
}`,
      relationships: ['Has many Sessions', 'Has many Tokens'],
    });
  }

  return entities;
}

function generateDatabaseSchema(
  features: Feature[],
  techStack: ProjectConfig['techStack']
): string {
  if (techStack.database === 'postgresql' && features.some((f) => f.id === 'auth')) {
    return `CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);`;
  }

  return '-- Database schema to be defined';
}

function generateBusinessRules(features: Feature[]): any[] {
  const rules = [];

  if (features.some((f) => f.id === 'auth')) {
    rules.push({
      rule: 'Password Requirements',
      condition: 'User sets password',
      action: 'Validate minimum 8 characters, 1 uppercase, 1 number',
      validation: 'Reject if requirements not met',
    });
  }

  return rules;
}

function generateErrorScenarios(_features: Feature[]): any[] {
  return [
    {
      scenario: 'Invalid Input',
      code: 'VALIDATION_ERROR',
      message: 'The provided input is invalid',
      recovery: 'Return detailed validation errors',
    },
    {
      scenario: 'Unauthorized Access',
      code: 'UNAUTHORIZED',
      message: 'Authentication required',
      recovery: 'Redirect to login',
    },
  ];
}

function generateUnitTestStrategy(_config: ProjectConfig): any[] {
  return [
    { component: 'API Endpoints', coverage: 90 },
    { component: 'Business Logic', coverage: 95 },
    { component: 'Data Models', coverage: 100 },
  ];
}

function generateIntegrationTestScenarios(features: Feature[]): string[] {
  return features
    .filter((f) => f.priority === 'must-have')
    .map((f) => `End-to-end test for ${f.name}`);
}

function generatePerformanceTests(_config: ProjectConfig): any[] {
  return [
    { test: 'Load Test', criteria: 'Handle 1000 concurrent users' },
    { test: 'Stress Test', criteria: 'Graceful degradation under load' },
  ];
}

function generateSecurityRequirements(_config: ProjectConfig): any[] {
  return [
    {
      requirement: 'Input Validation',
      implementation: 'Validate all inputs with Zod/Pydantic',
      validation: 'Penetration testing',
    },
    {
      requirement: 'Authentication',
      implementation: 'JWT with refresh tokens',
      validation: 'Security audit',
    },
  ];
}

function generateExternalDependencies(techStack: ProjectConfig['techStack']): any[] {
  const deps = [];

  if (techStack.database === 'postgresql') {
    deps.push({ service: 'PostgreSQL', purpose: 'Primary database' });
  }

  if (techStack.database?.includes('redis')) {
    deps.push({ service: 'Redis', purpose: 'Caching and sessions' });
  }

  return deps;
}

function generateLibraryDependencies(techStack: ProjectConfig['techStack']): any[] {
  const libs = [];

  if (techStack.frontend === 'nextjs') {
    libs.push({ name: 'next', version: '^15.0.0', purpose: 'React framework' });
    libs.push({ name: 'react', version: '^19.0.0', purpose: 'UI library' });
  }

  if (techStack.backend === 'fastapi') {
    libs.push({ name: 'fastapi', version: '^0.100.0', purpose: 'Web framework' });
    libs.push({ name: 'pydantic', version: '^2.0.0', purpose: 'Data validation' });
  }

  return libs;
}
