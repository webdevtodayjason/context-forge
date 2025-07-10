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
    return false;
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
}
