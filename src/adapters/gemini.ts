import { IDEAdapter, GeneratedFile } from './base';
import path from 'path';

export class GeminiAdapter extends IDEAdapter {
  get name(): string {
    return 'Gemini';
  }

  get description(): string {
    return "Google's Gemini AI tools (CLI and Code Assist)";
  }

  get configFiles(): string[] {
    return ['GEMINI.md', '.gemini/'];
  }

  get supportsValidation(): boolean {
    return true;
  }

  get supportsPRP(): boolean {
    return true;
  }

  async generateFiles(outputPath: string): Promise<GeneratedFile[]> {
    const files: GeneratedFile[] = [];

    // Generate GEMINI.md (main configuration)
    files.push({
      path: path.join(outputPath, 'GEMINI.md'),
      content: this.generateGeminiMd(),
      description: 'Main Gemini configuration file',
    });

    // Generate .gemini/context/project.md
    files.push({
      path: path.join(outputPath, '.gemini', 'context', 'project.md'),
      content: this.generateProjectContext(),
      description: 'Project-specific context',
    });

    // Generate .gemini/context/architecture.md
    files.push({
      path: path.join(outputPath, '.gemini', 'context', 'architecture.md'),
      content: this.generateArchitectureContext(),
      description: 'Architecture documentation',
    });

    // Generate .gemini/context/guidelines.md
    files.push({
      path: path.join(outputPath, '.gemini', 'context', 'guidelines.md'),
      content: this.generateGuidelines(),
      description: 'Development guidelines',
    });

    // Generate PRP files if features are defined
    if (this.config.features && this.config.features.length > 0) {
      files.push({
        path: path.join(outputPath, '.gemini', 'prp', 'overview.md'),
        content: this.generatePRPOverview(),
        description: 'PRP implementation overview',
      });

      files.push({
        path: path.join(outputPath, '.gemini', 'prp', 'stage-1-foundation.md'),
        content: this.generatePRPStage1(),
        description: 'PRP Stage 1: Foundation setup',
      });

      files.push({
        path: path.join(outputPath, '.gemini', 'prp', 'stage-2-core.md'),
        content: this.generatePRPStage2(),
        description: 'PRP Stage 2: Core features',
      });

      files.push({
        path: path.join(outputPath, '.gemini', 'prp', 'stage-3-advanced.md'),
        content: this.generatePRPStage3(),
        description: 'PRP Stage 3: Advanced features',
      });

      files.push({
        path: path.join(outputPath, '.gemini', 'prp', 'validation.md'),
        content: this.generatePRPValidation(),
        description: 'PRP validation gates',
      });

      // Update .gemini/config.yaml with PRP settings
      files.push({
        path: path.join(outputPath, '.gemini', 'config.yaml'),
        content: this.generateConfigYaml(),
        description: 'Gemini configuration with PRP settings',
      });
    }

    return files;
  }

  private generateGeminiMd(): string {
    const techStackRules = this.generateTechStackRules();

    return `# Gemini CLI Configuration

## Project: ${this.config.projectName}

### Overview
${this.config.description}

### Quick Start
\`\`\`bash
# Use Gemini CLI for code generation
gemini generate component MyComponent

# Get AI assistance
gemini assist "How do I implement authentication?"

# Analyze code
gemini analyze src/
\`\`\`

### Context Files
- **Project Context**: .gemini/context/project.md
- **Architecture**: .gemini/context/architecture.md  
- **Guidelines**: .gemini/context/guidelines.md

### Development Mode
\`\`\`yaml
mode: development
context_depth: full
include_tests: true
follow_conventions: strict
\`\`\`

${techStackRules}

### Key Commands
1. **gemini init** - Initialize Gemini in project
2. **gemini context** - View current context
3. **gemini generate** - Generate code from templates
4. **gemini review** - AI code review
5. **gemini test** - Generate tests

### Integration Points
- VS Code: Gemini Code Assist extension
- CLI: Direct terminal access
- CI/CD: Automated code review

### Best Practices
- Keep context files updated
- Use specific prompts
- Review all generated code
- Maintain consistent patterns
`;
  }

  private generateProjectContext(): string {
    const { projectName, features, timeline, teamSize } = this.config;

    return `# Project Context: ${projectName}

${this.generateCommonContext()}

## Project Hierarchy

### Level 1: Core Infrastructure
- Development environment setup
- Base project structure
- Core dependencies
- Configuration management

### Level 2: Foundation Features
${features
  .filter((f) => f.priority === 'must-have')
  .map((f) => `- **${f.name}**: ${f.description}`)
  .join('\n')}

### Level 3: Enhanced Features
${features
  .filter((f) => f.priority === 'should-have')
  .map((f) => `- **${f.name}**: ${f.description}`)
  .join('\n')}

### Level 4: Nice-to-Have Features
${features
  .filter((f) => f.priority === 'nice-to-have')
  .map((f) => `- **${f.name}**: ${f.description}`)
  .join('\n')}

## Implementation Strategy

### Timeline: ${timeline}
${this.generateTimelineStrategy()}

### Team Structure: ${teamSize}
${this.generateTeamStructure()}

## Key Files and Directories
\`\`\`
${this.generateAnnotatedStructure()}
\`\`\`

## External Resources
- Documentation: ${this.generateDocLinks()}
- APIs: ${this.generateAPILinks()}
- Libraries: ${this.generateLibraryLinks()}
`;
  }

  private generateArchitectureContext(): string {
    const { projectType } = this.config;

    return `# Architecture Documentation

## System Architecture

### Project Type: ${projectType}

### Technology Stack
${this.generateDetailedTechStack()}

### Architecture Pattern
${this.generateArchitecturePattern()}

### Component Hierarchy

#### Frontend Architecture
${this.generateFrontendArchitecture()}

#### Backend Architecture
${this.generateBackendArchitecture()}

#### Database Architecture
${this.generateDatabaseArchitecture()}

### Data Flow
\`\`\`mermaid
${this.generateDataFlowDiagram()}
\`\`\`

### API Design
${this.generateAPIDesign()}

### Security Architecture
${this.generateSecurityArchitecture()}

### Deployment Architecture
${this.generateDeploymentArchitecture()}

### Performance Considerations
${this.generatePerformanceConsiderations()}

### Scalability Plan
${this.generateScalabilityPlan()}
`;
  }

  private generateGuidelines(): string {
    const testingRequirements = this.generateTestingRequirements();
    const securityGuidelines = this.generateSecurityGuidelines();

    return `# Development Guidelines

## Code Standards

### General Principles
1. **DRY** - Don't Repeat Yourself
2. **KISS** - Keep It Simple, Stupid
3. **YAGNI** - You Aren't Gonna Need It
4. **SOLID** - Single responsibility, Open/closed, Liskov substitution, Interface segregation, Dependency inversion

### Code Organization
- Maximum file length: 500 lines
- Maximum function length: 50 lines
- Maximum cyclomatic complexity: 10
- Descriptive naming conventions

### Gemini-Specific Guidelines

#### Prompt Engineering
- Be specific and contextual
- Reference existing patterns
- Include expected output format
- Specify constraints clearly

#### Code Generation
\`\`\`yaml
generate:
  follow_patterns: true
  include_tests: true
  documentation: inline
  style: project_conventions
\`\`\`

${testingRequirements}

${securityGuidelines}

## Development Workflow

### Feature Development
1. **Plan**: Review requirements and create design
2. **Implement**: Follow existing patterns
3. **Test**: Write comprehensive tests
4. **Document**: Update relevant documentation
5. **Review**: AI and peer code review

### Gemini Workflow
1. **Context Setup**: Ensure .gemini/ files are current
2. **Generate**: Use Gemini for boilerplate
3. **Customize**: Adapt to specific needs
4. **Validate**: Run tests and linting
5. **Iterate**: Refine with Gemini assistance

## Quality Checklist
- [ ] Code follows project conventions
- [ ] All tests passing
- [ ] Documentation updated
- [ ] Security review completed
- [ ] Performance impact assessed
- [ ] Gemini context files updated
`;
  }

  private generateTimelineStrategy(): string {
    const { timeline } = this.config;

    switch (timeline) {
      case 'mvp':
        return `### MVP Strategy (4-6 weeks)
- Week 1-2: Core infrastructure and setup
- Week 3-4: Must-have features
- Week 5: Testing and bug fixes
- Week 6: Deployment preparation`;

      case 'standard':
        return `### Standard Strategy (8-12 weeks)
- Week 1-2: Planning and setup
- Week 3-6: Core feature development
- Week 7-9: Enhanced features
- Week 10-11: Testing and optimization
- Week 12: Deployment and documentation`;

      case 'enterprise':
        return `### Enterprise Strategy (16-24 weeks)
- Week 1-4: Architecture and planning
- Week 5-12: Core development
- Week 13-18: Advanced features
- Week 19-22: Testing and security
- Week 23-24: Deployment and training`;

      default:
        return '### Custom Timeline Strategy';
    }
  }

  private generateTeamStructure(): string {
    const { teamSize } = this.config;

    switch (teamSize) {
      case 'solo':
        return `- Single developer
- Focus on automation
- Leverage Gemini for productivity`;

      case 'small':
        return `- 2-5 developers
- Shared code ownership
- Regular sync meetings`;

      case 'medium':
        return `- 6-15 developers
- Feature teams
- Designated tech leads`;

      case 'large':
        return `- 15+ developers
- Multiple teams
- Architecture committee`;

      default:
        return '- Flexible team structure';
    }
  }

  private generateAnnotatedStructure(): string {
    const { techStack } = this.config;

    if (techStack.frontend === 'nextjs') {
      return `src/
├── app/              # Next.js app directory
├── components/       # Reusable components
├── lib/             # Utility functions
├── hooks/           # Custom React hooks
└── types/           # TypeScript definitions`;
    }

    if (techStack.backend === 'fastapi') {
      return `app/
├── api/             # API endpoints
├── core/            # Core configuration
├── models/          # Data models
├── schemas/         # Pydantic schemas
└── services/        # Business logic`;
    }

    return `src/
├── components/      # UI components
├── services/        # Business logic
├── utils/          # Utilities
└── tests/          # Test files`;
  }

  private generateDocLinks(): string {
    const { techStack } = this.config;
    const links = [];

    if (techStack.frontend === 'nextjs') links.push('[Next.js Docs](https://nextjs.org/docs)');
    if (techStack.frontend === 'react') links.push('[React Docs](https://react.dev)');
    if (techStack.backend === 'fastapi') links.push('[FastAPI Docs](https://fastapi.tiangolo.com)');
    if (techStack.backend === 'express') links.push('[Express Docs](https://expressjs.com)');

    return links.join(', ') || 'Project documentation';
  }

  private generateAPILinks(): string {
    const { features } = this.config;

    if (features.some((f) => f.category === 'integration')) {
      return 'External API integrations documented in /docs/apis/';
    }

    return 'Internal APIs only';
  }

  private generateLibraryLinks(): string {
    const { techStack } = this.config;
    const libs = [];

    if (techStack.auth === 'jwt') libs.push('JWT libraries');
    if (techStack.database === 'postgresql') libs.push('PostgreSQL drivers');

    return libs.join(', ') || 'See package dependencies';
  }

  private generateDetailedTechStack(): string {
    const { techStack } = this.config;
    const details = [];

    if (techStack.frontend) {
      details.push(`#### Frontend: ${techStack.frontend}
- Component library: ${this.getComponentLibrary()}
- State management: ${this.getStateManagement()}
- Styling: ${techStack.styling || 'CSS Modules'}`);
    }

    if (techStack.backend) {
      details.push(`#### Backend: ${techStack.backend}
- API style: RESTful
- Authentication: ${techStack.auth || 'Session-based'}
- ORM/ODM: ${this.getORM()}`);
    }

    if (techStack.database) {
      details.push(`#### Database: ${techStack.database}
- Type: ${this.getDatabaseType()}
- Caching: ${this.getCaching()}`);
    }

    return details.join('\n\n');
  }

  private generateArchitecturePattern(): string {
    const { projectType } = this.config;

    if (projectType === 'fullstack') {
      return `### Microservices Architecture
- Frontend: SPA/SSR application
- Backend: RESTful API service
- Database: Persistent data store
- Cache: Performance optimization`;
    }

    if (projectType === 'api') {
      return `### API-First Architecture
- Clean architecture principles
- Domain-driven design
- Repository pattern
- Service layer abstraction`;
    }

    return '### Modular Monolith Architecture';
  }

  private generateFrontendArchitecture(): string {
    const { techStack } = this.config;

    if (!techStack.frontend) return 'N/A - Backend only project';

    return `- **Framework**: ${techStack.frontend}
- **Routing**: ${this.getRoutingStrategy()}
- **State Management**: ${this.getStateManagement()}
- **Component Structure**: Atomic design
- **Data Fetching**: ${this.getDataFetchingStrategy()}`;
  }

  private generateBackendArchitecture(): string {
    const { techStack } = this.config;

    if (!techStack.backend) return 'N/A - Frontend only project';

    return `- **Framework**: ${techStack.backend}
- **API Design**: RESTful with OpenAPI spec
- **Middleware Stack**: ${this.getMiddlewareStack()}
- **Service Layer**: Business logic separation
- **Data Access**: ${this.getDataAccessPattern()}`;
  }

  private generateDatabaseArchitecture(): string {
    const { techStack } = this.config;

    if (!techStack.database) return 'N/A - No database';

    return `- **Database**: ${techStack.database}
- **Schema Design**: ${this.getSchemaDesign()}
- **Indexing Strategy**: Performance-optimized
- **Migration Tool**: ${this.getMigrationTool()}
- **Backup Strategy**: Regular automated backups`;
  }

  private generateDataFlowDiagram(): string {
    return `graph LR
    A[Client] -->|HTTP Request| B[API Gateway]
    B --> C[Backend Service]
    C --> D[Database]
    D -->|Data| C
    C -->|Response| B
    B -->|JSON| A`;
  }

  private generateAPIDesign(): string {
    return `### RESTful API Design
- Version prefix: /api/v1
- Resource-based URLs
- Standard HTTP methods
- JSON request/response
- Pagination support
- Error handling standards`;
  }

  private generateSecurityArchitecture(): string {
    return `### Security Layers
1. **Authentication**: ${this.config.techStack.auth || 'Session-based'}
2. **Authorization**: Role-based access control
3. **Data Validation**: Input sanitization
4. **Encryption**: HTTPS, encrypted storage
5. **Rate Limiting**: API throttling
6. **Security Headers**: CORS, CSP, etc.`;
  }

  private generateDeploymentArchitecture(): string {
    return `### Deployment Strategy
- **Platform**: ${this.config.deployment || 'Cloud-based'}
- **Containerization**: Docker
- **Orchestration**: Kubernetes/Docker Compose
- **CI/CD**: GitHub Actions
- **Monitoring**: Logs and metrics
- **Scaling**: Horizontal scaling ready`;
  }

  private generatePerformanceConsiderations(): string {
    return `### Performance Optimization
- Code splitting and lazy loading
- Caching strategy (Redis/Memory)
- Database query optimization
- CDN for static assets
- Compression (gzip/brotli)
- Image optimization`;
  }

  private generateScalabilityPlan(): string {
    return `### Scalability Roadmap
1. **Phase 1**: Single server deployment
2. **Phase 2**: Load balancing
3. **Phase 3**: Database replication
4. **Phase 4**: Microservices migration
5. **Phase 5**: Multi-region deployment`;
  }

  // Helper methods
  private getComponentLibrary(): string {
    const { techStack } = this.config;
    if (techStack.frontend === 'nextjs' || techStack.frontend === 'react')
      return 'Custom components';
    if (techStack.frontend === 'vue') return 'Vuetify';
    return 'Framework default';
  }

  private getStateManagement(): string {
    const { techStack } = this.config;
    if (techStack.frontend === 'nextjs') return 'React Context + Server State';
    if (techStack.frontend === 'react') return 'Context API / Zustand';
    if (techStack.frontend === 'vue') return 'Pinia';
    return 'Built-in';
  }

  private getORM(): string {
    const { techStack } = this.config;
    if (techStack.backend === 'express') return 'Prisma / TypeORM';
    if (techStack.backend === 'fastapi') return 'SQLAlchemy';
    if (techStack.backend === 'django') return 'Django ORM';
    return 'Native drivers';
  }

  private getDatabaseType(): string {
    const { techStack } = this.config;
    if (techStack.database === 'postgresql' || techStack.database === 'mysql') return 'Relational';
    if (techStack.database === 'mongodb') return 'Document';
    return 'Key-Value';
  }

  private getCaching(): string {
    const { techStack } = this.config;
    return techStack.database === 'redis' ? 'Built-in' : 'Redis (optional)';
  }

  private getRoutingStrategy(): string {
    const { techStack } = this.config;
    if (techStack.frontend === 'nextjs') return 'File-based (App Router)';
    if (techStack.frontend === 'react') return 'React Router';
    if (techStack.frontend === 'vue') return 'Vue Router';
    return 'Framework routing';
  }

  private getDataFetchingStrategy(): string {
    const { techStack } = this.config;
    if (techStack.frontend === 'nextjs') return 'Server Components + Client fetching';
    return 'Axios / Fetch API';
  }

  private getMiddlewareStack(): string {
    const { techStack } = this.config;
    if (techStack.backend === 'express') return 'CORS, Body Parser, Auth, Error Handler';
    if (techStack.backend === 'fastapi') return 'CORS, Auth, Validation';
    return 'Framework defaults';
  }

  private getDataAccessPattern(): string {
    const { techStack } = this.config;
    if (techStack.backend === 'express' || techStack.backend === 'fastapi')
      return 'Repository Pattern';
    if (techStack.backend === 'django') return 'Active Record';
    return 'Direct database access';
  }

  private getSchemaDesign(): string {
    const { techStack } = this.config;
    if (techStack.database === 'postgresql' || techStack.database === 'mysql')
      return 'Normalized relational';
    if (techStack.database === 'mongodb') return 'Document-oriented';
    return 'Key-value pairs';
  }

  private getMigrationTool(): string {
    const { techStack } = this.config;
    if (techStack.backend === 'express') return 'Prisma Migrate';
    if (techStack.backend === 'fastapi') return 'Alembic';
    if (techStack.backend === 'django') return 'Django Migrations';
    return 'Manual migrations';
  }

  // PRP Generation Methods
  private generatePRPOverview(): string {
    const { projectName, features } = this.config;
    const mustHaveFeatures = features.filter((f) => f.priority === 'must-have');
    const shouldHaveFeatures = features.filter((f) => f.priority === 'should-have');

    return `# PRP Implementation Overview: ${projectName}

## What is PRP?

Product Requirement Prompts (PRP) provide a structured approach to implementing features with clear validation gates between stages. This methodology helps Gemini understand your project's implementation phases and success criteria.

## How to Use PRP with Gemini

### CLI Commands
\`\`\`bash
# View current PRP stage
gemini prp status

# Generate code for specific stage
gemini generate --prp-stage 1

# Validate current stage completion
gemini prp validate
\`\`\`

### Context Integration
Gemini automatically loads PRP files from \`.gemini/prp/\` when generating code. Reference these stages in your prompts:
- "Following PRP stage 1 guidelines..."
- "Implement the User Authentication feature from stage 2"
- "Validate stage 2 completion criteria"

## Implementation Stages

### 📋 Stage 1: Foundation
- Project setup and configuration
- Core infrastructure
- Basic models and schemas
- Database setup

### 🚀 Stage 2: Core Features
${mustHaveFeatures.map((f) => `- ${f.name}: ${f.description}`).join('\n')}

### ✨ Stage 3: Advanced Features
${shouldHaveFeatures.map((f) => `- ${f.name}: ${f.description}`).join('\n')}

### ✅ Validation Gates
- Each stage has validation requirements
- Must pass before proceeding to next stage
- Automated testing and quality checks

## Success Criteria

- All must-have features implemented and tested
- Code coverage meets requirements (>80%)
- All validation gates passed
- Documentation complete
- Security best practices followed

## Tips for Using PRP with Gemini

- Keep PRP files in \`.gemini/prp/\` directory
- Reference current stage in your prompts
- Use \`gemini prp validate\` before moving stages
- Update config.yaml as you progress
- Commit after each stage completion
`;
  }

  private generatePRPStage1(): string {
    const { techStack } = this.config;

    return `# PRP Stage 1: Foundation

## Objective
Set up the project foundation with proper structure, configuration, and core infrastructure.

## Tasks Checklist

### Project Setup
- [ ] Initialize ${techStack.frontend || 'frontend'} project
- [ ] Set up ${techStack.backend || 'backend'} server
- [ ] Configure ${techStack.database || 'database'}
- [ ] Set up development environment
- [ ] Configure linting and formatting

### Core Infrastructure
- [ ] Set up project structure
- [ ] Configure environment variables
- [ ] Set up error handling
- [ ] Configure logging
- [ ] Set up testing framework

### Database Setup
${
  techStack.database
    ? `- [ ] Design database schema
- [ ] Set up migrations
- [ ] Create base models
- [ ] Set up connection pooling
- [ ] Configure backups`
    : '- [ ] Configure data storage solution'
}

### Development Tools
- [ ] Configure Gemini CLI
- [ ] Set up Git hooks
- [ ] Configure CI/CD pipeline
- [ ] Set up monitoring
- [ ] Configure debugging tools

## Gemini Commands

\`\`\`bash
# Generate project structure
gemini generate structure --stage 1

# Create base models
gemini generate models --from-schema

# Set up database
gemini db setup
\`\`\`

## Validation Requirements

Run these commands before proceeding to Stage 2:

\`\`\`bash
# Check project setup
gemini prp validate --stage 1

# Run initial tests
npm test

# Check database connection
gemini db test
\`\`\`

## Success Criteria

- [ ] Project builds without errors
- [ ] All dependencies installed
- [ ] Database connection established
- [ ] Base tests passing
- [ ] Development environment functional

## Next Steps

Once validation passes, proceed to Stage 2 for core feature implementation.
`;
  }

  private generatePRPStage2(): string {
    const mustHaveFeatures = this.config.features.filter((f) => f.priority === 'must-have');

    return `# PRP Stage 2: Core Features

## Objective
Implement all must-have features with proper testing and documentation.

## Features to Implement

${mustHaveFeatures
  .map(
    (feature) => `### ${feature.name}
**Description**: ${feature.description}
**Complexity**: ${feature.complexity}

#### Tasks:
- [ ] Create data models/schemas
- [ ] Implement business logic
- [ ] Create API endpoints
- [ ] Add validation
- [ ] Write unit tests
- [ ] Create UI components
- [ ] Implement state management
- [ ] Connect to API
- [ ] Add error handling
- [ ] Write component tests

#### Acceptance Criteria:
${this.generateAcceptanceCriteria(feature)}

#### Gemini Implementation:
\`\`\`bash
# Generate feature scaffolding
gemini generate feature ${feature.id}

# Generate tests
gemini generate tests ${feature.id}

# Validate implementation
gemini validate feature ${feature.id}
\`\`\`
`
  )
  .join('\n')}

## Integration Requirements

### API Integration
- [ ] All endpoints documented
- [ ] Error responses standardized
- [ ] Authentication implemented (if required)
- [ ] Rate limiting configured

### Frontend Integration
- [ ] All UI components functional
- [ ] Forms validated
- [ ] Error states handled
- [ ] Loading states implemented

### Testing Requirements
- [ ] Unit tests for all features
- [ ] Integration tests for critical paths
- [ ] E2E tests for user journeys
- [ ] Performance tests for key operations

## Gemini Workflow

For each feature:
1. \`gemini generate feature [feature-id]\`
2. Implement custom logic
3. \`gemini generate tests [feature-id]\`
4. \`gemini validate feature [feature-id]\`
5. Commit with conventional message

## Validation Requirements

Run these commands before proceeding:

1. **All tests pass with coverage**
   \`\`\`bash
   npm run test:coverage
   \`\`\`

2. **Build succeeds**
   \`\`\`bash
   npm run build
   \`\`\`

3. **Gemini validation passes**
   \`\`\`bash
   gemini prp validate --stage 2
   \`\`\`

## Success Criteria

- [ ] All must-have features are working
- [ ] Test coverage > 80%
- [ ] All features are documented
- [ ] Code review completed
- [ ] Performance benchmarks met

## Next Steps

Once validation passes, proceed to Stage 3 for advanced features.
`;
  }

  private generatePRPStage3(): string {
    const shouldHaveFeatures = this.config.features.filter((f) => f.priority === 'should-have');
    const niceToHaveFeatures = this.config.features.filter((f) => f.priority === 'nice-to-have');

    if (shouldHaveFeatures.length === 0 && niceToHaveFeatures.length === 0) {
      return `# PRP Stage 3: Advanced Features

## Objective
This stage is reserved for future advanced features and optimizations.

## Potential Enhancements

### Performance Optimization
- [ ] Implement caching strategies
- [ ] Optimize database queries
- [ ] Add CDN support
- [ ] Implement lazy loading

### Advanced Security
- [ ] Add two-factor authentication
- [ ] Implement audit logging
- [ ] Add data encryption at rest
- [ ] Set up intrusion detection

### Scalability Features
- [ ] Add horizontal scaling support
- [ ] Implement message queuing
- [ ] Add microservices support
- [ ] Set up load balancing

## Gemini Commands

\`\`\`bash
# Analyze performance
gemini analyze performance

# Generate optimization suggestions
gemini suggest optimizations

# Validate security
gemini security audit
\`\`\`

## Success Criteria

- [ ] All optimizations tested
- [ ] Performance improved by 20%+
- [ ] Security audit passed
- [ ] Scalability tested
`;
    }

    return `# PRP Stage 3: Advanced Features

## Objective
Implement should-have and nice-to-have features to enhance the application.

## Features to Implement

${
  shouldHaveFeatures.length > 0
    ? `### Should-Have Features
${shouldHaveFeatures
  .map(
    (feature) => `
#### ${feature.name}
**Description**: ${feature.description}
**Complexity**: ${feature.complexity}

**Tasks**:
- [ ] Design feature architecture
- [ ] Implement core functionality
- [ ] Add tests
- [ ] Update documentation
- [ ] Performance optimization

**Gemini Commands**:
\`\`\`bash
gemini generate feature ${feature.id} --advanced
gemini optimize ${feature.id}
\`\`\`
`
  )
  .join('\n')}`
    : ''
}

${
  niceToHaveFeatures.length > 0
    ? `### Nice-to-Have Features
${niceToHaveFeatures.map((feature) => `- **${feature.name}**: ${feature.description}`).join('\n')}`
    : ''
}

## Enhancement Areas

### Performance Optimization
- [ ] Implement advanced caching
- [ ] Optimize bundle size
- [ ] Add progressive web app features
- [ ] Implement service workers

### User Experience
- [ ] Add animations and transitions
- [ ] Implement dark mode
- [ ] Add keyboard shortcuts
- [ ] Improve accessibility

### Developer Experience
- [ ] Add development tools
- [ ] Improve error messages
- [ ] Add debugging utilities
- [ ] Create component library

## Validation Requirements

1. **Performance benchmarks**
   \`\`\`bash
   gemini benchmark performance
   \`\`\`

2. **Feature validation**
   \`\`\`bash
   gemini prp validate --stage 3
   \`\`\`

3. **Security audit**
   \`\`\`bash
   gemini security audit --deep
   \`\`\`

## Success Criteria

- [ ] All should-have features implemented
- [ ] Performance targets met
- [ ] User experience enhanced
- [ ] Code quality maintained
- [ ] Documentation complete

## Final Steps

- [ ] Full system testing
- [ ] Performance optimization
- [ ] Security hardening
- [ ] Deployment preparation
- [ ] Documentation finalization
`;
  }

  private generatePRPValidation(): string {
    return `# PRP Validation Gates

## Overview

Each stage must pass validation before proceeding to the next. This ensures quality and completeness at every phase.

## Stage 1 Validation

### Automated Checks
\`\`\`bash
gemini prp validate --stage 1
\`\`\`

### Manual Checklist
- [ ] Project structure follows conventions
- [ ] All dependencies properly configured
- [ ] Environment variables documented
- [ ] Database schema finalized
- [ ] Base tests are passing

### Required Files
- [ ] README.md with setup instructions
- [ ] .env.example with all variables
- [ ] Database schema documentation
- [ ] API specification draft

## Stage 2 Validation

### Automated Checks
\`\`\`bash
gemini prp validate --stage 2
\`\`\`

### Manual Checklist
- [ ] All must-have features implemented
- [ ] Unit test coverage > 80%
- [ ] Integration tests passing
- [ ] API documentation complete
- [ ] No critical security issues

### Quality Metrics
- Code coverage: minimum 80%
- Performance: < 3s page load
- Bundle size: < 500KB initial
- Accessibility: WCAG 2.1 AA

## Stage 3 Validation

### Automated Checks
\`\`\`bash
gemini prp validate --stage 3 --final
\`\`\`

### Manual Checklist
- [ ] All planned features complete
- [ ] Performance optimized
- [ ] Security hardened
- [ ] Documentation finalized
- [ ] Deployment ready

### Production Readiness
- [ ] Load testing completed
- [ ] Security audit passed
- [ ] Monitoring configured
- [ ] Backup strategy implemented
- [ ] Rollback plan documented

## Validation Commands

### Quick Validation
\`\`\`bash
# Current stage validation
gemini prp validate

# Specific stage validation
gemini prp validate --stage 2

# Full project validation
gemini prp validate --all
\`\`\`

### Detailed Reports
\`\`\`bash
# Generate validation report
gemini prp report

# Export validation results
gemini prp report --export validation-report.md
\`\`\`

## Troubleshooting

### Common Validation Failures

1. **Test Coverage Too Low**
   - Run: \`gemini generate tests --missing\`
   - Focus on untested critical paths

2. **Performance Issues**
   - Run: \`gemini analyze performance\`
   - Implement suggested optimizations

3. **Security Vulnerabilities**
   - Run: \`gemini security scan\`
   - Apply recommended fixes

## Moving Between Stages

### Stage Progression
\`\`\`bash
# Check current stage
gemini prp status

# Move to next stage (after validation)
gemini prp next

# Skip to specific stage (not recommended)
gemini prp goto --stage 3
\`\`\`

### Best Practices
- Never skip validation gates
- Document any exceptions
- Review with team before progression
- Commit code after each stage
- Tag releases for each stage
`;
  }

  private generateConfigYaml(): string {
    const { features } = this.config;

    return `# Gemini Code Assist Configuration

# PRP Settings
prp:
  enabled: true
  current_stage: 1
  stages:
    - name: "Foundation"
      status: "pending"
      path: ".gemini/prp/stage-1-foundation.md"
    - name: "Core Features"
      status: "pending"
      path: ".gemini/prp/stage-2-core.md"
    - name: "Advanced Features"
      status: "pending"
      path: ".gemini/prp/stage-3-advanced.md"

# Feature Tracking
features:
${features
  .map(
    (f) => `  - id: "${f.id}"
    name: "${f.name}"
    priority: "${f.priority}"
    complexity: "${f.complexity}"
    status: "pending"`
  )
  .join('\n')}

# Code Generation Settings
generation:
  follow_patterns: true
  include_tests: true
  documentation: inline
  style: project_conventions
  
# Context Settings
context:
  include_prp: true
  max_depth: 3
  exclude_patterns:
    - "node_modules/**"
    - ".git/**"
    - "dist/**"
    - "build/**"

# Validation Settings  
validation:
  test_coverage_threshold: 80
  performance_budget:
    page_load: 3000  # ms
    bundle_size: 512000  # bytes
  security:
    scan_dependencies: true
    check_secrets: true

# Development Mode
mode: development
debug: false
telemetry: false
`;
  }

  private generateAcceptanceCriteria(feature: any): string {
    // Generate specific acceptance criteria based on feature type
    const criteria = [
      '- [ ] Feature is fully functional',
      '- [ ] All edge cases handled',
      '- [ ] Performance meets requirements',
      '- [ ] Accessible to all users',
    ];

    // Add feature-specific criteria
    if (feature.name.toLowerCase().includes('auth')) {
      criteria.push('- [ ] Secure authentication flow implemented');
      criteria.push('- [ ] Session management working correctly');
    }

    if (feature.name.toLowerCase().includes('api')) {
      criteria.push('- [ ] API documentation complete');
      criteria.push('- [ ] Rate limiting implemented');
    }

    if (feature.complexity === 'complex') {
      criteria.push('- [ ] Architecture documented');
      criteria.push('- [ ] Performance optimized');
    }

    return criteria.join('\n');
  }
}
