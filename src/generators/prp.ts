/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-nocheck
import Handlebars from 'handlebars';
import fs from 'fs-extra';
import path from 'path';
import {
  ProjectConfig,
  PRPContext,
  Feature,
  PRPTask,
  AIDocItem,
  ComponentItem,
  DecisionItem,
  PhaseItem,
  RiskItem,
  RequirementItem,
  EndpointItem,
  EntityItem,
  TestCaseItem,
  DocumentationItem,
  CodeExampleItem,
  MetricItem,
  OptimizationItem,
  BenchmarkItem,
  AttackVectorItem,
  LoggingItem,
} from '../types';
import { getValidationCommands } from '../data/validationCommands';

export async function generatePRP(
  config: ProjectConfig,
  type: 'base' | 'base-enhanced' | 'planning' | 'spec' | 'task' = 'base'
): Promise<string> {
  const templatePath = path.join(__dirname, '../../templates/prp', `${type}.md`);
  const templateContent = await fs.readFile(templatePath, 'utf-8');

  // Register custom Handlebars helpers
  registerHandlebarsHelpers();

  const template = Handlebars.compile(templateContent);

  const context = createPRPContext(config, type);
  return template(context);
}

function registerHandlebarsHelpers() {
  // Helper to increment index for display
  Handlebars.registerHelper('inc', function (value: number) {
    return value + 1;
  });

  // Helper for conditional rendering
  Handlebars.registerHelper(
    'if_eq',
    function (
      this: unknown,
      a: unknown,
      b: unknown,
      options: { fn: (context: unknown) => string; inverse: (context: unknown) => string }
    ) {
      if (a === b) {
        return options.fn(this);
      }
      return options.inverse(this);
    }
  );
}

function createPRPContext(config: ProjectConfig, type: string): Partial<PRPContext> {
  const primaryFeature =
    config.features.find((f) => f.priority === 'must-have') || config.features[0];
  const language = getLanguageFromTechStack(config.techStack);
  const testLanguage = getTestLanguageFromTechStack(config.techStack);

  const baseContext: Partial<PRPContext> = {
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

  if (type === 'base-enhanced') {
    return {
      ...baseContext,
      // Enhanced base template with AI docs and validation loops
      hasAiDocs: false, // Will be true when AI docs are added
      aiDocs: [],
      versionNotes: generateVersionNotes(config.techStack),
      modelPath: getModelPath(config.techStack),
      database: generateDatabaseIntegration(config.techStack),
      config: generateConfigIntegration(config.techStack),
      routes: generateRoutesIntegration(config.features, config.techStack),
      environment: generateEnvironmentVariables(config),
      testCases: generateDetailedTestCases(config.features, config.techStack),
      edgeCases: generateEdgeCases(config.features),
      logPath: getLogPath(config.techStack),
      creativeValidation: generateCreativeValidation(config),
      commonFixes: {
        syntax: generateCommonFixes(config.techStack, 'syntax'),
        tests: generateCommonFixes(config.techStack, 'tests'),
      },
    };
  }

  if (type === 'planning') {
    return {
      ...baseContext,
      featureName: primaryFeature?.name || config.projectName,
      executiveSummary: `Deep architectural planning for ${config.projectName} - ${config.description}`,
      problemStatement: generateProblemStatement(config),
      subProblems: generateSubProblems(config.features),
      constraints: generateConstraints(config),
      architectureDiagram: generateDetailedArchitectureDiagram(config),
      components: generateDetailedComponents(config),
      dataFlowDiagram: generateDetailedDataFlowDiagram(config),
      decisions: generateDetailedTechnicalDecisions(config),
      phase1Duration: '1 week',
      phase1Tasks: generatePhaseTasks(config, 1),
      phase2Duration: '2-3 weeks',
      phase2Tasks: generatePhaseTasks(config, 2),
      phase3Duration: '1-2 weeks',
      phase3Tasks: generatePhaseTasks(config, 3),
      risks: generateDetailedRisks(config),
      expectedUsers: '1000+ concurrent',
      expectedRPS: '100-500',
      dataVolume: '10GB initial, 1TB growth/year',
      optimizations: generateOptimizationStrategies(config),
      benchmarks: generateBenchmarks(config),
      attackVectors: generateAttackVectors(config),
      securityMeasures: generateSecurityMeasures(config),
      coverageTarget: 90,
      unitTestAreas: generateUnitTestAreas(config),
      performanceTests: generateDetailedPerformanceTests(config),
      securityTests: generateSecurityTests(config),
      metrics: generateMetrics(config),
      loggingPoints: generateLoggingPoints(config),
      traces: generateTraces(config.features),
      apiDocFormat: 'OpenAPI 3.0',
      apiDocLocation: '/docs/api',
      userDocs: generateUserDocumentation(config),
      devDocs: generateDeveloperDocumentation(config),
      externalResources: generateExternalResources(config),
      codeExamples: generateCodeExamples(config),
      proofOfConcepts: [],
      successMetrics: generateSuccessMetrics(config),
      milestones: generateMilestones(config),
      openQuestions: generateOpenQuestions(config),
      researchNotes: '',
    };
  }

  if (type === 'spec') {
    const now = new Date();
    return {
      ...baseContext,
      featureName: primaryFeature?.name || 'Core Feature',
      version: '1.0.0',
      status: 'Draft',
      author: 'Context Forge',
      createdDate: now.toISOString().split('T')[0],
      lastUpdated: now.toISOString().split('T')[0],
      reviewers: 'TBD',
      executiveSummary: `Technical specification for implementing ${primaryFeature?.name} in ${config.projectName}`,
      primaryObjectives: generatePrimaryObjectives(config.features),
      secondaryObjectives: generateSecondaryObjectives(config.features),
      inScope: config.features.filter((f) => f.priority === 'must-have').map((f) => f.name),
      outOfScope: config.features.filter((f) => f.priority === 'nice-to-have').map((f) => f.name),
      futureConsiderations: generateFutureConsiderations(config),
      systemContextDiagram: generateSystemContextDiagram(config),
      componentDiagram: generateComponentDiagram(config),
      techStack: generateTechStackDetails(config.techStack),
      functionalRequirements: generateDetailedFunctionalRequirements(config.features),
      nfrs: generateDetailedNFRs(config),
      endpoints: generateDetailedAPIEndpoints(config.features, config.techStack),
      hasGraphQL: false,
      hasWebSocket: config.features.some((f) => f.id === 'realtime'),
      websocketEvents: generateWebSocketEvents(config.features),
      domainModels: generateDetailedDomainModels(config.features, config.techStack),
      databaseSchema: generateDetailedDatabaseSchema(config.features, config.techStack),
      indexes: generateIndexes(config.features, config.techStack),
      hasMigration: true,
      migrationScript: generateMigrationScript(config.features, config.techStack),
      rollbackScript: generateRollbackScript(config.features, config.techStack),
      algorithms: generateAlgorithms(config.features),
      stateDiagram: generateStateDiagram(config),
      businessRules: generateDetailedBusinessRules(config.features),
      integrations: generateIntegrations(config),
      hasMessageQueue: false,
      authMethod: config.techStack.auth || 'JWT',
      roles: generateRoles(config),
      resources: generateResources(config.features),
      securityControls: generateSecurityControls(config),
      dataProtection: generateDataProtection(config),
      performanceTargets: generatePerformanceTargets(config),
      optimizations: generateOptimizations(config),
      cachingLayers: generateCachingLayers(config.techStack),
      testPyramid: generateTestPyramid(),
      coverageTarget: 90,
      unitTestSuites: generateUnitTestSuites(config),
      integrationTests: generateDetailedIntegrationTests(config.features),
      performanceTests: generateDetailedPerformanceTests(config),
      securityTests: generateSecurityTests(config),
      deploymentDiagram: generateDeploymentDiagram(config),
      environments: generateEnvironments(config),
      pipelineDiagram: generatePipelineDiagram(),
      pipelineStages: generatePipelineStages(),
      metrics: generateDetailedMetrics(config),
      logLevels: generateLogLevels(),
      healthChecks: generateHealthChecks(config),
      risks: generateDetailedRisks(config),
      dependencies: generateDetailedDependencies(config.techStack),
      constraints: generateDetailedConstraints(config),
      documentationDeliverables: generateDocumentationDeliverables(config),
      training: generateTrainingRequirements(config),
      techLead: 'TBD',
      productOwner: 'TBD',
      securityLead: 'TBD',
      architect: 'TBD',
      glossary: generateGlossary(config),
      references: generateReferences(config.techStack),
      changelog: [`v1.0.0 (${now.toISOString().split('T')[0]}) - Initial draft by Context Forge`],
    };
  }

  if (type === 'task') {
    return {
      ...baseContext,
      taskName: primaryFeature?.name || 'Task',
      taskType: 'feature',
      priority: 'P1',
      estimatedTime: '4-8 hours',
      assignee: 'Developer',
      problemDescription: primaryFeature?.description || 'Task description',
      currentBehavior: 'N/A',
      expectedBehavior: generateExpectedBehavior(primaryFeature),
      usersAffected: 'All users',
      severity: 'Medium',
      businessImpact: 'Feature delivery',
      solutionSummary: `Implement ${primaryFeature?.name} following project patterns`,
      implementationSteps: generateImplementationSteps(primaryFeature, config.techStack),
      keyFiles: generateKeyFiles(config.techStack, primaryFeature),
      patterns: generatePatterns(config.techStack),
      unitTests: generateTaskUnitTests(primaryFeature, config.techStack),
      integrationTests: generateTaskIntegrationTests(primaryFeature),
      manualTests: generateManualTests(primaryFeature),
      syntaxCommand: getValidationCommands(config.techStack).syntax?.[0] || 'npm run lint',
      testCommand: getValidationCommands(config.techStack).tests?.[0] || 'npm test',
      integrationCommand: getValidationCommands(config.techStack).start || 'npm run dev',
      verificationSteps: generateVerificationSteps(primaryFeature),
      rollbackSteps: ['Revert commit', 'Deploy previous version', 'Verify rollback successful'],
      documentationNeeded: false,
      relatedItems: [],
      resources: generateTaskResources(config.techStack),
      notes: '',
      lintCommand: getValidationCommands(config.techStack).lint || 'npm run lint',
      devCommand: getValidationCommands(config.techStack).start || 'npm run dev',
      buildCommand: getValidationCommands(config.techStack).build || 'npm run build',
    };
  }

  // Add planning-specific context
  if (type === 'planning') {
    baseContext.architectureDiagram = generateArchitectureDiagram(config);
    baseContext.dataFlowDiagram = generateDataFlowDiagram(config);
    baseContext.technicalDecisions = generateTechnicalDecisions(config);
    baseContext.implementationPhases = generateImplementationPhases(config);
    baseContext.risks = generateRisks(config);
    baseContext.securityConsiderations = generateSecurityConsiderations(config);
    baseContext.performanceRequirements = generatePerformanceRequirements(config);
    baseContext.monitoringStrategy = generateMonitoringStrategy(config);
    baseContext.futureConsiderations = generateFutureConsiderations(config);
  }

  // Add spec-specific context
  if (type === 'spec') {
    baseContext.functionalRequirements = generateFunctionalRequirements(config.features);
    baseContext.nonFunctionalRequirements = generateNonFunctionalRequirements(config);
    baseContext.apiEndpoints = generateAPIEndpoints(config.features, config.techStack);
    baseContext.dataEntities = generateDataEntities(config.features, config.techStack);
    baseContext.databaseSchema = generateDatabaseSchema(config.features, config.techStack);
    baseContext.businessRules = generateBusinessRules(config.features);
    baseContext.errorScenarios = generateErrorScenarios(config.features);
    baseContext.unitTestStrategy = generateUnitTestStrategy(config);
    baseContext.integrationTestScenarios = generateIntegrationTestScenarios(config.features);
    baseContext.performanceTests = generatePerformanceTests(config);
    baseContext.securityRequirements = generateSecurityRequirements(config);
    baseContext.externalDependencies = generateExternalDependencies(config.techStack);
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

function generateDocumentation(techStack: ProjectConfig['techStack']): AIDocItem[] {
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
): TestCaseItem[] {
  const tests: TestCaseItem[] = [];

  if (features.some((f) => f.id === 'auth')) {
    if (techStack.backend === 'fastapi') {
      tests.push({
        name: 'Authentication API Test',
        type: 'integration',
        description: 'Test user authentication endpoint',
        file: 'tests/integration/auth.test.js',
        assertions: ['Returns JWT token on successful login'],
      });
    }
  }

  if (features.some((f) => f.id === 'crud')) {
    tests.push({
      name: 'CRUD Operations Test',
      type: 'integration',
      description: 'Test basic CRUD operations',
      file: 'tests/integration/crud.test.js',
      assertions: [
        'Create: POST /api/items',
        'Read: GET /api/items',
        'Update: PUT /api/items/:id',
        'Delete: DELETE /api/items/:id',
      ],
    });
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

function generateComponents(_config: ProjectConfig): ComponentItem[] {
  const components = [];

  if (_config.techStack.frontend) {
    components.push({
      name: 'Frontend Application',
      purpose: 'User interface and client-side logic',
      responsibilities: ['Render UI', 'Handle user interactions', 'Make API calls'],
      dependencies: ['API Gateway', 'Authentication Service'],
    });
  }

  if (_config.techStack.backend) {
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

function generateTechnicalDecisions(_config: ProjectConfig): DecisionItem[] {
  return [
    {
      decision: 'Frontend Framework',
      options: [
        { name: 'Next.js', description: 'Full-stack React framework' },
        { name: 'React SPA', description: 'Single-page application' },
      ],
      chosen: _config.techStack.frontend || 'Next.js',
      rationale: 'Provides SSR, routing, and optimization out of the box',
    },
  ];
}

function generateImplementationPhases(_config: ProjectConfig): PhaseItem[] {
  return [
    {
      name: 'Foundation',
      duration: '1 week',
      goals: ['Set up project', 'Configure tools', 'Create base structure'],
      deliverables: ['Project skeleton', 'CI/CD pipeline', 'Development environment'],
      dependencies: undefined,
    },
    {
      name: 'Core Features',
      duration: '2-3 weeks',
      goals: ['Implement must-have features', 'Create API endpoints', 'Build UI components'],
      deliverables: ['Working features', 'API documentation', 'Test coverage'],
      dependencies: ['Foundation'],
    },
  ];
}

function generateRisks(_config: ProjectConfig): RiskItem[] {
  return [
    {
      risk: 'Technical Complexity',
      probability: 'medium',
      impact: 'high',
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

function generatePerformanceRequirements(_config: ProjectConfig): RequirementItem[] {
  return [
    { metric: 'Response Time', requirement: '< 200ms for API calls' },
    { metric: 'Page Load', requirement: '< 3s initial load' },
    { metric: 'Concurrent Users', requirement: 'Support 1000+ concurrent users' },
  ];
}

function generateMonitoringStrategy(_config: ProjectConfig): MetricItem[] {
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
function generateFunctionalRequirements(features: Feature[]): RequirementItem[] {
  return features.map((feature, index) => ({
    id: `FR${index + 1}`,
    title: feature.name,
    description: feature.description,
    criteria: feature.subtasks || [],
  }));
}

function generateNonFunctionalRequirements(_config: ProjectConfig): RequirementItem[] {
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

function generateAPIEndpoints(
  features: Feature[],
  _techStack: ProjectConfig['techStack']
): EndpointItem[] {
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

function generateDataEntities(
  features: Feature[],
  _techStack: ProjectConfig['techStack']
): EntityItem[] {
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

function generateBusinessRules(features: Feature[]): string[] {
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

function generateErrorScenarios(_features: Feature[]): TestCaseItem[] {
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

function generateUnitTestStrategy(_config: ProjectConfig): string[] {
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

function generatePerformanceTests(_config: ProjectConfig): TestCaseItem[] {
  return [
    { test: 'Load Test', criteria: 'Handle 1000 concurrent users' },
    { test: 'Stress Test', criteria: 'Graceful degradation under load' },
  ];
}

function generateSecurityRequirements(_config: ProjectConfig): RequirementItem[] {
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

function generateExternalDependencies(techStack: ProjectConfig['techStack']): string[] {
  const deps = [];

  if (techStack.database === 'postgresql') {
    deps.push({ service: 'PostgreSQL', purpose: 'Primary database' });
  }

  if (techStack.database?.includes('redis')) {
    deps.push({ service: 'Redis', purpose: 'Caching and sessions' });
  }

  return deps;
}

function generateLibraryDependencies(techStack: ProjectConfig['techStack']): string[] {
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

// Enhanced template generator functions
function generateVersionNotes(techStack: ProjectConfig['techStack']): string[] {
  const notes = [];

  if (techStack.frontend === 'nextjs') {
    notes.push('Next.js 15 uses React 19 with new features');
    notes.push('App Router is the recommended approach');
  }

  if (techStack.backend === 'fastapi') {
    notes.push('FastAPI 0.100+ with Pydantic v2 support');
    notes.push('Use async/await for all endpoints');
  }

  return notes;
}

function getModelPath(techStack: ProjectConfig['techStack']): string {
  if (techStack.backend === 'fastapi') return 'app/models/';
  if (techStack.backend === 'django') return 'apps/*/models.py';
  if (techStack.backend === 'express') return 'src/models/';
  return 'src/models/';
}

function generateDatabaseIntegration(techStack: ProjectConfig['techStack']): DatabaseItem[] {
  const integration: DatabaseItem[] = [];

  if (techStack.database === 'postgresql') {
    integration.push({
      name: 'PostgreSQL Migration',
      type: 'migration',
      description: 'Database schema migration',
      schema: 'public',
      operations: ['CREATE TABLE', 'ALTER TABLE', 'CREATE INDEX'],
    });
  }

  return integration;
}

function generateConfigIntegration(techStack: ProjectConfig['techStack']): ConfigItem[] {
  return [
    {
      name: 'Environment Configuration',
      type: 'environment',
      description: 'Application configuration settings',
      file: techStack.frontend === 'nextjs' ? '.env.local' : '.env',
      values: {
        DATABASE_URL: 'Connection string for database',
        JWT_SECRET: 'Secret key for JWT tokens',
        API_URL: 'Base URL for API endpoints',
      },
    },
  ];
}

function generateRoutesIntegration(
  features: Feature[],
  techStack: ProjectConfig['techStack']
): RouteItem[] {
  const routes: RouteItem[] = [];

  features.forEach((feature) => {
    if (feature.id === 'auth') {
      const file = techStack.backend === 'fastapi' ? 'app/api/auth.py' : 'routes/auth.js';
      routes.push({
        name: 'Authentication Route',
        path: '/auth/login',
        method: 'POST',
        description: 'User authentication endpoint',
        file,
        middleware: ['cors', 'helmet'],
      });
    }
  });

  return routes;
}

function generateEnvironmentVariables(_config: ProjectConfig): EnvironmentItem[] {
  const vars: EnvironmentItem[] = [
    {
      name: 'DATABASE_URL',
      type: 'string',
      description: 'Database connection string',
      value: 'postgresql://localhost/db',
      required: true,
    },
  ];

  if (_config.techStack.auth === 'jwt') {
    vars.push({
      name: 'JWT_SECRET',
      type: 'string',
      description: 'JWT signing secret',
      value: 'dev-secret',
      required: true,
    });
  }

  return vars;
}

function generateDetailedTestCases(
  features: Feature[],
  _techStack: ProjectConfig['techStack']
): TestCaseItem[] {
  const testCases: TestCaseItem[] = [];

  features.forEach((feature) => {
    if (feature.id === 'auth') {
      testCases.push({
        name: 'login_success',
        description: 'User can login with valid credentials',
        implementation: `
    # Arrange
    user = create_test_user()
    
    # Act
    response = client.post("/auth/login", {
        "email": user.email,
        "password": "testpass"
    })
    
    # Assert
    assert response.status_code == 200
    assert "access_token" in response.json()`,
      });
    }
  });

  return testCases;
}

function generateEdgeCases(features: Feature[]): string[] {
  const edgeCases = ['Empty input handling', 'Maximum length validation'];

  if (features.some((f) => f.id === 'auth')) {
    edgeCases.push('SQL injection attempts');
    edgeCases.push('Concurrent login attempts');
  }

  return edgeCases;
}

function getLogPath(techStack: ProjectConfig['techStack']): string {
  if (techStack.backend === 'fastapi') return 'logs/app.log';
  if (techStack.backend === 'express') return 'logs/combined.log';
  return 'logs/application.log';
}

function generateCreativeValidation(_config: ProjectConfig): ValidationItem[] {
  return [
    {
      name: 'Load Testing',
      type: 'performance',
      description: 'Test with 1000 concurrent users',
      criteria: 'Response time < 500ms',
      tools: ['k6', 'artillery'],
    },
    {
      name: 'Security Scan',
      type: 'security',
      description: 'Run OWASP ZAP scan',
      criteria: 'No high or critical vulnerabilities',
      tools: ['OWASP ZAP', 'Snyk'],
    },
  ];
}

function generateCommonFixes(techStack: ProjectConfig['techStack'], type: string): string[] {
  if (type === 'syntax') {
    if (techStack.frontend === 'nextjs') {
      return [
        'Missing "use client" directive',
        'Import path issues - use @ alias',
        'TypeScript strict mode errors',
      ];
    }
  }

  if (type === 'tests') {
    return ['Mock external API calls', 'Set up test database', 'Clear test data between runs'];
  }

  return [];
}

// Planning template functions
function generateProblemStatement(_config: ProjectConfig): string {
  return `Build a ${_config.projectType} application that ${_config.description}. The system needs to handle ${_config.features.length} core features while maintaining scalability and performance.`;
}

function generateSubProblems(features: Feature[]): string[] {
  return features.map((feature) => ({
    name: feature.name,
    description: feature.description,
    complexity: feature.complexity || 'medium',
    dependencies: feature.dependencies || [],
  }));
}

function generateConstraints(_config: ProjectConfig): string[] {
  return [
    { type: 'Timeline', description: `${_config.timeline} delivery` },
    { type: 'Team Size', description: `${_config.teamSize} team` },
    { type: 'Budget', description: 'Cost-effective solution required' },
  ];
}

function generateDetailedArchitectureDiagram(_config: ProjectConfig): string {
  return `graph TB
    subgraph "Client Layer"
      A[Web Browser]
      B[Mobile App]
    end
    
    subgraph "Application Layer"
      C[Load Balancer]
      D[Web Server]
      E[API Gateway]
    end
    
    subgraph "Service Layer"
      F[Auth Service]
      G[Business Logic]
      H[Background Jobs]
    end
    
    subgraph "Data Layer"
      I[(Database)]
      J[(Cache)]
      K[(File Storage)]
    end
    
    A --> C
    B --> C
    C --> D
    C --> E
    E --> F
    E --> G
    G --> I
    G --> J
    G --> H
    H --> I`;
}

function generateDetailedComponents(_config: ProjectConfig): ComponentItem[] {
  const components = generateComponents(_config);

  // Add more detail to each component
  return components.map((comp) => ({
    ...comp,
    interfaces: ['REST API', 'WebSocket', 'GraphQL'],
    responsibilities: [...comp.responsibilities, 'Monitoring', 'Logging'],
  }));
}

function generateDetailedDataFlowDiagram(_config: ProjectConfig): string {
  return `sequenceDiagram
    participant U as User
    participant C as Client
    participant LB as Load Balancer
    participant API as API Gateway
    participant Auth as Auth Service
    participant BL as Business Logic
    participant DB as Database
    participant Cache as Redis Cache
    
    U->>C: User Action
    C->>LB: HTTPS Request
    LB->>API: Route Request
    API->>Auth: Validate Token
    Auth->>Cache: Check Session
    Cache-->>Auth: Session Data
    Auth-->>API: Valid/Invalid
    API->>BL: Process Request
    BL->>DB: Query Data
    DB-->>BL: Result Set
    BL->>Cache: Cache Result
    BL-->>API: Response Data
    API-->>C: JSON Response
    C-->>U: Update UI`;
}

function generateDetailedTechnicalDecisions(_config: ProjectConfig): DecisionItem[] {
  return [
    {
      title: 'Architecture Pattern',
      options: [
        {
          name: 'Microservices',
          description: 'Distributed services',
          pros: 'Scalable',
          cons: 'Complex',
        },
        {
          name: 'Monolith',
          description: 'Single application',
          pros: 'Simple',
          cons: 'Less scalable',
        },
      ],
      decision: 'Modular Monolith',
      rationale: 'Balance between simplicity and future scalability',
    },
    {
      title: 'Database Strategy',
      options: [
        {
          name: 'Single DB',
          description: 'One database for all',
          pros: 'Simple',
          cons: 'Bottleneck',
        },
        {
          name: 'Read Replicas',
          description: 'Master-slave setup',
          pros: 'Read scaling',
          cons: 'Complexity',
        },
      ],
      decision: 'Single DB with read replicas',
      rationale: 'Start simple, add replicas as needed',
    },
  ];
}

function generatePhaseTasks(config: ProjectConfig, phase: number): string[] {
  if (phase === 1) {
    return [
      'Set up development environment',
      'Initialize project structure',
      'Configure CI/CD pipeline',
      'Set up database and migrations',
      'Implement authentication foundation',
    ];
  }

  if (phase === 2) {
    return config.features
      .filter((f) => f.priority === 'must-have')
      .map((f) => `Implement ${f.name}`);
  }

  return [
    'Performance optimization',
    'Security hardening',
    'Documentation completion',
    'Deployment preparation',
  ];
}

function generateDetailedRisks(_config: ProjectConfig): RiskItem[] {
  return [
    {
      title: 'Technical Debt',
      probability: 'high',
      impact: 'medium',
      mitigation: 'Regular refactoring sprints',
      contingency: 'Allocate 20% time for debt reduction',
    },
    {
      title: 'Scalability Issues',
      probability: 'medium',
      impact: 'high',
      detection: 'Load testing metrics',
      mitigation: 'Design for horizontal scaling',
      contingency: 'Cloud auto-scaling',
      owner: 'Tech Lead',
    },
  ];
}

function generateOptimizationStrategies(_config: ProjectConfig): OptimizationItem[] {
  return [
    { area: 'Database', strategy: 'Query optimization and indexing' },
    { area: 'Caching', strategy: 'Redis for session and API responses' },
    { area: 'Frontend', strategy: 'Code splitting and lazy loading' },
  ];
}

function generateBenchmarks(_config: ProjectConfig): BenchmarkItem[] {
  return [
    { metric: 'API Response Time', target: '< 100ms p95' },
    { metric: 'Page Load Time', target: '< 2s' },
    { metric: 'Database Query Time', target: '< 50ms' },
  ];
}

function generateAttackVectors(_config: ProjectConfig): AttackVectorItem[] {
  return [
    {
      vector: 'SQL Injection',
      description: 'Malicious SQL in inputs',
      prevention: 'Parameterized queries',
    },
    { vector: 'XSS', description: 'Script injection', prevention: 'Input sanitization' },
    { vector: 'CSRF', description: 'Cross-site requests', prevention: 'CSRF tokens' },
  ];
}

function generateSecurityMeasures(_config: ProjectConfig): string[] {
  return [
    'Implement rate limiting on all endpoints',
    'Use HTTPS everywhere with HSTS',
    'Regular security dependency updates',
    'Input validation on all user data',
    'Secure session management',
  ];
}

function generateUnitTestAreas(_config: ProjectConfig): string[] {
  return [
    'Authentication logic',
    'Data validation',
    'Business rules',
    'Error handling',
    'Utility functions',
  ];
}

function generateDetailedPerformanceTests(_config: ProjectConfig): TestCaseItem[] {
  return [
    {
      scenario: 'Normal Load',
      description: '100 concurrent users',
      expected: 'All requests < 200ms',
      testName: 'Normal Load Test',
      type: 'Load',
      loadProfile: '100 users over 10 minutes',
      duration: '10 minutes',
    },
    {
      scenario: 'Peak Load',
      description: '1000 concurrent users',
      expected: '95% requests < 500ms',
      testName: 'Peak Load Test',
      type: 'Stress',
      loadProfile: 'Ramp to 1000 users',
      duration: '30 minutes',
    },
  ];
}

function generateSecurityTests(_config: ProjectConfig): TestCaseItem[] {
  return [
    {
      test: 'OWASP ZAP Scan',
      description: 'Automated security testing',
      tool: 'OWASP ZAP',
      frequency: 'Weekly',
    },
    {
      test: 'Dependency Scan',
      description: 'Check for vulnerabilities',
      tool: 'npm audit',
      frequency: 'Daily',
    },
  ];
}

function generateMetrics(_config: ProjectConfig): MetricItem[] {
  return [
    { name: 'Request Rate', description: 'Requests per second', threshold: '> 1000 RPS alert' },
    { name: 'Error Rate', description: 'Failed requests percentage', threshold: '> 1% alert' },
    { name: 'Response Time', description: 'Average response time', threshold: '> 500ms alert' },
  ];
}

function generateLoggingPoints(_config: ProjectConfig): LoggingItem[] {
  return [
    { event: 'Authentication', details: 'Login attempts, failures, token generation' },
    { event: 'API Requests', details: 'Method, path, user, duration, status' },
    { event: 'Errors', details: 'Stack trace, context, user info' },
  ];
}

function generateTraces(features: Feature[]): string[] {
  return features.filter((f) => f.priority === 'must-have').map((f) => `${f.name} complete flow`);
}

function generateUserDocumentation(_config: ProjectConfig): DocumentationItem[] {
  return [
    { type: 'User Guide', description: 'How to use the application' },
    { type: 'API Reference', description: 'Endpoint documentation' },
  ];
}

function generateDeveloperDocumentation(_config: ProjectConfig): DocumentationItem[] {
  return [
    { type: 'Architecture Guide', description: 'System design and patterns' },
    { type: 'Setup Guide', description: 'Development environment setup' },
  ];
}

function generateExternalResources(_config: ProjectConfig): DocumentationItem[] {
  const resources = [];

  if (_config.techStack.frontend === 'nextjs') {
    resources.push({
      title: 'Next.js 15 Documentation',
      url: 'https://nextjs.org/docs',
      insight: 'App Router patterns and best practices',
    });
  }

  return resources;
}

function generateCodeExamples(_config: ProjectConfig): CodeExampleItem[] {
  return [
    {
      title: 'Authentication Flow',
      language: getLanguageFromTechStack(_config.techStack),
      code: generatePseudocode(
        { id: 'auth', name: 'Authentication' } as Feature,
        _config.techStack
      ),
    },
  ];
}

function generateSuccessMetrics(_config: ProjectConfig): MetricItem[] {
  return [
    {
      metric: 'User Adoption',
      target: '1000 active users in 3 months',
      howToMeasure: 'Analytics dashboard',
    },
    { metric: 'Performance', target: '< 200ms average response', howToMeasure: 'APM monitoring' },
  ];
}

function generateMilestones(_config: ProjectConfig): any[] {
  return [
    {
      name: 'MVP Launch',
      date: '4 weeks',
      deliverables: ['Core features', 'Basic UI', 'Authentication'],
      criteria: ['All tests pass', 'Security review complete'],
    },
  ];
}

function generateOpenQuestions(_config: ProjectConfig): any[] {
  return [
    { question: 'Preferred cloud provider?', whoToAsk: 'DevOps team', deadline: 'Week 1' },
    { question: 'Compliance requirements?', whoToAsk: 'Legal team', deadline: 'Week 2' },
  ];
}

// Spec template functions
function generatePrimaryObjectives(features: Feature[]): any[] {
  return features
    .filter((f) => f.priority === 'must-have')
    .map((f, i) => ({
      id: `PO-${i + 1}`,
      description: f.description,
      metric: `${f.name} fully functional`,
    }));
}

function generateSecondaryObjectives(features: Feature[]): string[] {
  return features.filter((f) => f.priority === 'should-have').map((f) => f.description);
}

function generateSystemContextDiagram(_config: ProjectConfig): string {
  return `graph TB
    subgraph "External Systems"
      EXT1[Payment Gateway]
      EXT2[Email Service]
      EXT3[Analytics]
    end
    
    subgraph "Our System"
      SYS[${_config.projectName}]
    end
    
    subgraph "Users"
      U1[End Users]
      U2[Admins]
      U3[API Consumers]
    end
    
    U1 --> SYS
    U2 --> SYS
    U3 --> SYS
    SYS --> EXT1
    SYS --> EXT2
    SYS --> EXT3`;
}

function generateComponentDiagram(_config: ProjectConfig): string {
  return `graph LR
    subgraph "Frontend"
      UI[UI Components]
      STATE[State Management]
      API_CLIENT[API Client]
    end
    
    subgraph "Backend"
      CONTROLLER[Controllers]
      SERVICE[Services]
      REPO[Repositories]
    end
    
    subgraph "Infrastructure"
      DB[(Database)]
      CACHE[(Cache)]
      QUEUE[Message Queue]
    end
    
    UI --> STATE
    STATE --> API_CLIENT
    API_CLIENT --> CONTROLLER
    CONTROLLER --> SERVICE
    SERVICE --> REPO
    REPO --> DB
    SERVICE --> CACHE
    SERVICE --> QUEUE`;
}

function generateTechStackDetails(techStack: ProjectConfig['techStack']): any[] {
  const details = [];

  if (techStack.frontend) {
    details.push({
      layer: 'Frontend',
      technology: techStack.frontend,
      version: 'Latest stable',
      rationale: 'Modern, performant, good ecosystem',
    });
  }

  if (techStack.backend) {
    details.push({
      layer: 'Backend',
      technology: techStack.backend,
      version: 'Latest stable',
      rationale: 'Scalable, well-documented, active community',
    });
  }

  return details;
}

function generateDetailedFunctionalRequirements(features: Feature[]): any[] {
  return features.map((feature, index) => ({
    id: index + 1,
    title: feature.name,
    priority: feature.priority,
    description: feature.description,
    acceptanceCriteria: feature.subtasks || [`${feature.name} works as expected`],
    implementationNotes: `Follow existing patterns for ${feature.name}`,
    language: 'typescript',
  }));
}

function generateDetailedNFRs(_config: ProjectConfig): any[] {
  return [
    {
      category: 'Performance',
      requirements: [
        { name: 'Response Time', target: '< 200ms p95', measurement: 'APM monitoring' },
        { name: 'Throughput', target: '1000 RPS', measurement: 'Load testing' },
      ],
    },
    {
      category: 'Reliability',
      requirements: [
        { name: 'Uptime', target: '99.9%', measurement: 'Monitoring alerts' },
        { name: 'Error Rate', target: '< 0.1%', measurement: 'Error tracking' },
      ],
    },
  ];
}

function generateDetailedAPIEndpoints(
  features: Feature[],
  techStack: ProjectConfig['techStack']
): any[] {
  const endpoints = generateAPIEndpoints(features, techStack);

  return endpoints.map((endpoint) => ({
    ...endpoint,
    authentication: 'Bearer token',
    rateLimit: '100 requests per minute',
    headers: [
      { name: 'Authorization', value: 'Bearer {token}' },
      { name: 'Content-Type', value: 'application/json' },
    ],
    requestSchema: endpoint.requestExample,
    successCode: 200,
    successResponse: endpoint.responseExample,
    errorResponses: endpoint.statusCodes.filter((s: any) => s.code !== 200),
    implementationSnippet: `// ${endpoint.method} ${endpoint.path}\n// TODO: Implement`,
    language: getLanguageFromTechStack(techStack),
  }));
}

function generateWebSocketEvents(features: Feature[]): any[] {
  if (!features.some((f) => f.id === 'realtime')) return [];

  return [
    {
      name: 'connection',
      direction: 'Client -> Server',
      payload: '{ "type": "auth", "token": "jwt..." }',
    },
    {
      name: 'message',
      direction: 'Server -> Client',
      payload: '{ "type": "update", "data": {...} }',
    },
  ];
}

function generateDetailedDomainModels(
  features: Feature[],
  techStack: ProjectConfig['techStack']
): any[] {
  const models = [];
  const language = getLanguageFromTechStack(techStack);

  if (features.some((f) => f.id === 'auth')) {
    models.push({
      name: 'User',
      language,
      definition:
        language === 'python'
          ? `class User(BaseModel):
    id: UUID
    email: EmailStr
    password_hash: str
    created_at: datetime
    updated_at: datetime
    is_active: bool = True`
          : `interface User {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}`,
      businessRules: ['Email must be unique', 'Password must meet complexity requirements'],
      validations: [
        { field: 'email', rule: 'Valid email format' },
        { field: 'password', rule: 'Min 8 chars, 1 upper, 1 number' },
      ],
    });
  }

  return models;
}

function generateDetailedDatabaseSchema(
  features: Feature[],
  techStack: ProjectConfig['techStack']
): string {
  if (techStack.database === 'postgresql') {
    return `-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Sessions table
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Audit log
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100),
    entity_id UUID,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);`;
  }

  return '-- Database schema to be defined';
}

function generateIndexes(features: Feature[], techStack: ProjectConfig['techStack']): any[] {
  if (techStack.database === 'postgresql') {
    return [
      { name: 'idx_users_email', table: 'users', columns: 'email', purpose: 'Fast email lookups' },
      {
        name: 'idx_sessions_token',
        table: 'sessions',
        columns: 'token',
        purpose: 'Fast token validation',
      },
      {
        name: 'idx_audit_user_created',
        table: 'audit_logs',
        columns: 'user_id, created_at',
        purpose: 'User activity queries',
      },
    ];
  }

  return [];
}

function generateMigrationScript(
  features: Feature[],
  techStack: ProjectConfig['techStack']
): string {
  return generateDetailedDatabaseSchema(features, techStack);
}

function generateRollbackScript(
  features: Feature[],
  techStack: ProjectConfig['techStack']
): string {
  if (techStack.database === 'postgresql') {
    return `-- Rollback migration
DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS users;`;
  }

  return '-- Rollback script';
}

function generateAlgorithms(features: Feature[]): any[] {
  const algorithms = [];

  if (features.some((f) => f.id === 'auth')) {
    algorithms.push({
      name: 'Token Generation',
      purpose: 'Generate secure JWT tokens',
      pseudocode: `function generateToken(userId):
    payload = {
        sub: userId,
        iat: now(),
        exp: now() + TOKEN_LIFETIME
    }
    return jwt.sign(payload, SECRET_KEY, algorithm='RS256')`,
      timeComplexity: '1',
      spaceComplexity: '1',
    });
  }

  return algorithms;
}

function generateStateDiagram(_config: ProjectConfig): string {
  return `stateDiagram-v2
    [*] --> Idle
    Idle --> Loading: Request
    Loading --> Success: Data Received
    Loading --> Error: Request Failed
    Success --> Idle: Reset
    Error --> Idle: Retry
    Error --> Loading: Retry`;
}

function generateDetailedBusinessRules(features: Feature[]): any[] {
  const rules = generateBusinessRules(features);

  return rules.map((rule) => ({
    ...rule,
    language: 'typescript',
    alternativeAction: 'Return validation error',
  }));
}

function generateIntegrations(_config: ProjectConfig): any[] {
  const integrations = [];

  if ((_config.extras as any)?.payment) {
    integrations.push({
      serviceName: 'Stripe',
      type: 'REST API',
      authMethod: 'API Key',
      baseUrl: 'https://api.stripe.com/v1',
      operations: [
        {
          name: 'Create Payment',
          description: 'Process payment',
          endpoint: '/charges',
          timeout: 5000,
          retryPolicy: '3 retries with exponential backoff',
        },
      ],
      errorHandling: [
        { scenario: 'Network timeout', strategy: 'Retry with backoff' },
        { scenario: 'Invalid card', strategy: 'Return user-friendly error' },
      ],
    });
  }

  return integrations;
}

function generateRoles(_config: ProjectConfig): any[] {
  return [
    { name: 'Admin', permissions: ['read', 'write', 'delete'] },
    { name: 'User', permissions: ['read', 'write', ''] },
    { name: 'Guest', permissions: ['read', '', ''] },
  ];
}

function generateResources(features: Feature[]): any[] {
  return features.map((f) => ({ name: f.name }));
}

function generateSecurityControls(_config: ProjectConfig): any[] {
  return [
    {
      control: 'Input Validation',
      language: getLanguageFromTechStack(_config.techStack),
      implementation: 'Use Zod/Joi/Pydantic for validation',
      validation: 'All user inputs validated before processing',
    },
  ];
}

function generateDataProtection(_config: ProjectConfig): any[] {
  return [
    {
      dataType: 'Passwords',
      method: 'bcrypt hashing',
      implementation: 'bcrypt with cost factor 12',
    },
    { dataType: 'PII', method: 'Encryption at rest', implementation: 'AES-256 encryption' },
  ];
}

function generatePerformanceTargets(_config: ProjectConfig): any[] {
  return [
    { metric: 'Response Time', target: '< 200ms', degraded: '< 500ms', unacceptable: '> 1s' },
    { metric: 'Uptime', target: '99.9%', degraded: '99.5%', unacceptable: '< 99%' },
  ];
}

function generateOptimizations(_config: ProjectConfig): any[] {
  return generateOptimizationStrategies(_config).map((opt) => ({
    ...opt,
    language: getLanguageFromTechStack(_config.techStack),
    implementation: '// Implementation details',
    impact: '20-50% improvement',
  }));
}

function generateCachingLayers(techStack: ProjectConfig['techStack']): any[] {
  const layers = [];

  if (techStack.frontend) {
    layers.push({
      layer: 'Browser Cache',
      ttl: '1 hour for static assets',
      invalidation: 'Version-based URLs',
      keyPattern: 'asset-{version}',
    });
  }

  layers.push({
    layer: 'Application Cache',
    ttl: '5 minutes for API responses',
    invalidation: 'Event-based',
    keyPattern: 'api:{endpoint}:{params}',
  });

  return layers;
}

function generateTestPyramid(): string {
  return `graph TB
    subgraph "Test Pyramid"
      E2E[E2E Tests - 10%]
      INT[Integration Tests - 30%]
      UNIT[Unit Tests - 60%]
    end
    
    UNIT --> INT
    INT --> E2E`;
}

function generateUnitTestSuites(_config: ProjectConfig): any[] {
  return [
    {
      component: 'Authentication Service',
      testCases: [
        { name: 'validatePassword', description: 'Password validation rules' },
        { name: 'generateToken', description: 'JWT token generation' },
      ],
      exampleTest: `test('should validate strong password', () => {
  const result = validatePassword('StrongP@ss123');
  expect(result).toBe(true);
});`,
      testLanguage: getTestLanguageFromTechStack(_config.techStack),
    },
  ];
}

function generateDetailedIntegrationTests(features: Feature[]): any[] {
  return features.map((feature) => ({
    scenario: `${feature.name} Integration`,
    components: 'API + Database + Cache',
    testData: 'Fixture data with edge cases',
    steps: [
      'Set up test database',
      'Seed test data',
      'Execute feature flow',
      'Verify all components',
    ],
    validations: ['Data persisted correctly', 'Cache updated', 'Response format correct'],
  }));
}

function generateDeploymentDiagram(_config: ProjectConfig): string {
  return `graph TB
    subgraph "Production"
      LB[Load Balancer]
      WEB1[Web Server 1]
      WEB2[Web Server 2]
      API1[API Server 1]
      API2[API Server 2]
      DB[(Primary DB)]
      DBR[(Read Replica)]
      CACHE[(Redis Cluster)]
    end
    
    LB --> WEB1
    LB --> WEB2
    WEB1 --> API1
    WEB2 --> API2
    API1 --> DB
    API2 --> DBR
    API1 --> CACHE
    API2 --> CACHE`;
}

function generateEnvironments(_config: ProjectConfig): any[] {
  return [
    {
      name: 'Development',
      compute: 'Local machine',
      storage: '10GB',
      network: 'localhost',
      configuration: `NODE_ENV: development
DATABASE_URL: postgresql://localhost/dev_db
REDIS_URL: redis://localhost:6379`,
    },
    {
      name: 'Production',
      compute: '4 vCPU, 16GB RAM',
      storage: '100GB SSD',
      network: 'VPC with public subnet',
      configuration: `NODE_ENV: production
DATABASE_URL: \${secrets.DATABASE_URL}
REDIS_URL: \${secrets.REDIS_URL}`,
    },
  ];
}

function generatePipelineDiagram(): string {
  return `graph LR
    A[Code Push] --> B[Lint & Format]
    B --> C[Unit Tests]
    C --> D[Build]
    D --> E[Integration Tests]
    E --> F[Security Scan]
    F --> G[Deploy Staging]
    G --> H[E2E Tests]
    H --> I[Deploy Production]`;
}

function generatePipelineStages(): any[] {
  return [
    {
      stage: 'Lint',
      description: 'Code quality checks',
      duration: '1 min',
      validation: 'No errors',
    },
    { stage: 'Test', description: 'Run all tests', duration: '5 min', validation: '100% pass' },
    {
      stage: 'Build',
      description: 'Create production build',
      duration: '3 min',
      validation: 'Build succeeds',
    },
    {
      stage: 'Deploy',
      description: 'Deploy to environment',
      duration: '5 min',
      validation: 'Health check passes',
    },
  ];
}

function generateDetailedMetrics(_config: ProjectConfig): any[] {
  return generateMetrics(_config).map((metric) => ({
    ...metric,
    type: 'gauge',
    dashboardLink: '/grafana/dashboard/1',
  }));
}

function generateLogLevels(): any[] {
  return [
    {
      level: 'ERROR',
      whenToUse: 'Unrecoverable errors, exceptions',
      example: `logger.error('Database connection failed', { error: err, userId });`,
      language: 'typescript',
    },
    {
      level: 'INFO',
      whenToUse: 'Important business events',
      example: `logger.info('User logged in', { userId, ip });`,
      language: 'typescript',
    },
  ];
}

function generateHealthChecks(_config: ProjectConfig): any[] {
  const checks = [
    {
      name: 'API Health',
      endpoint: '/health',
      frequency: '30s',
      timeout: 5000,
      criteria: 'HTTP 200 and response time < 1s',
    },
  ];

  if (_config.techStack.database) {
    checks.push({
      name: 'Database Health',
      endpoint: '/health/db',
      frequency: '60s',
      timeout: 10000,
      criteria: 'Can connect and query',
    });
  }

  return checks;
}

function generateDetailedDependencies(techStack: ProjectConfig['techStack']): any[] {
  const deps = generateLibraryDependencies(techStack);

  return deps.map((dep) => ({
    ...dep,
    critical: true,
    alternative: 'None - core dependency',
  }));
}

function generateDetailedConstraints(_config: ProjectConfig): any[] {
  return [
    {
      type: 'Technical',
      description: 'Must use existing infrastructure',
      impact: 'Limited technology choices',
    },
    { type: 'Timeline', description: `${_config.timeline} deadline`, impact: 'Scope limitations' },
  ];
}

function generateDocumentationDeliverables(_config: ProjectConfig): any[] {
  return [
    {
      type: 'API Documentation',
      description: 'OpenAPI spec',
      audience: 'Developers',
      format: 'Swagger UI',
    },
    {
      type: 'User Guide',
      description: 'End-user documentation',
      audience: 'Users',
      format: 'Markdown',
    },
  ];
}

function generateTrainingRequirements(_config: ProjectConfig): any[] {
  return [
    {
      audience: 'Developers',
      topics: 'Architecture, deployment, debugging',
      duration: '2 days',
      format: 'Workshop',
    },
    {
      audience: 'Users',
      topics: 'Feature walkthrough',
      duration: '2 hours',
      format: 'Video + docs',
    },
  ];
}

function generateGlossary(_config: ProjectConfig): any[] {
  return [
    { term: 'JWT', definition: 'JSON Web Token for authentication' },
    { term: 'API', definition: 'Application Programming Interface' },
  ];
}

function generateReferences(techStack: ProjectConfig['techStack']): any[] {
  const refs = [];

  if (techStack.frontend === 'nextjs') {
    refs.push({ title: 'Next.js Documentation', url: 'https://nextjs.org/docs' });
  }

  if (techStack.backend === 'fastapi') {
    refs.push({ title: 'FastAPI Documentation', url: 'https://fastapi.tiangolo.com/' });
  }

  return refs;
}

// Task template functions
function generateExpectedBehavior(feature: Feature | undefined): string {
  if (!feature) return 'Feature works as designed';
  return `${feature.name} is fully functional with proper validation and error handling`;
}

function generateImplementationSteps(
  feature: Feature | undefined,
  _techStack: ProjectConfig['techStack']
): any[] {
  if (!feature) return [];

  return [
    {
      title: 'Set up base structure',
      files: [{ path: `src/features/${feature.id}/index.ts`, change: 'Create feature module' }],
      code: '// Feature implementation',
      validations: ['File structure created', 'Imports working'],
    },
  ];
}

function generateKeyFiles(
  techStack: ProjectConfig['techStack'],
  feature: Feature | undefined
): any[] {
  const files = [];

  if (feature && feature.id === 'auth') {
    files.push({
      path: techStack.backend === 'fastapi' ? 'app/api/auth.py' : 'src/routes/auth.ts',
      purpose: 'Authentication endpoints',
      functions: 'login, logout, refresh',
      dependencies: 'JWT library, database',
    });
  }

  return files;
}

function generatePatterns(_techStack: ProjectConfig['techStack']): any[] {
  return [
    { pattern: 'Error Handling', example: 'Try-catch with specific error types' },
    { pattern: 'Validation', example: 'Schema validation before processing' },
  ];
}

function generateTaskUnitTests(
  feature: Feature | undefined,
  techStack: ProjectConfig['techStack']
): any[] {
  if (!feature) return [];

  const testLanguage = getTestLanguageFromTechStack(techStack);

  return [
    {
      name: `test_${feature.id}_success`,
      testLanguage,
      testCode: `// Test ${feature.name} success case
test('${feature.name} works correctly', async () => {
  // Arrange
  const input = createTestInput();
  
  // Act
  const result = await ${feature.id}Function(input);
  
  // Assert
  expect(result).toBeDefined();
  expect(result.status).toBe('success');
});`,
    },
  ];
}

function generateTaskIntegrationTests(feature: Feature | undefined): any[] {
  if (!feature) return [];

  return [
    {
      scenario: `${feature.name} end-to-end`,
      setup: 'Create test data',
      action: `Execute ${feature.name} flow`,
      expected: 'All components work together',
    },
  ];
}

function generateManualTests(feature: Feature | undefined): string[] {
  if (!feature) return ['Test feature manually'];

  return [
    `Open application`,
    `Navigate to ${feature.name}`,
    'Verify functionality works',
    'Check error cases',
  ];
}

function generateVerificationSteps(_feature: Feature | undefined): string[] {
  return [
    'Feature works as expected',
    'No console errors',
    'Performance acceptable',
    'Security considerations addressed',
  ];
}

function generateTaskResources(techStack: ProjectConfig['techStack']): any[] {
  const resources = [];

  if (techStack.frontend === 'nextjs') {
    resources.push({
      title: 'Next.js Patterns',
      url: 'https://nextjs.org/docs/app/building-your-application',
    });
  }

  return resources;
}
