# Enhanced PRP Templates

## Overview

Context Forge now includes four powerful PRP templates designed for different development scenarios, each incorporating validation gates, comprehensive context, and implementation guidance for one-pass success.

## Template Types

### 1. Base Enhanced Template (`base-enhanced`)

The most comprehensive template for feature implementation with deep context integration.

#### Key Features

- **4-Level Validation Gates**: Syntax, Unit Tests, Integration, Creative
- **AI Documentation Integration**: Support for curated `ai_docs/`
- **Common Fixes Section**: Pre-populated solutions for typical errors
- **Integration Points**: Database, Config, Routes, Environment
- **Edge Case Handling**: Comprehensive error scenarios

#### When to Use

- Standard feature implementation
- When you need maximum context
- Projects requiring strict validation
- Complex integrations

#### Structure

```markdown
## All Needed Context
- Version-specific gotchas
- Framework patterns
- Testing conventions

## Model path: app/models/

## Database Integration
- Migration patterns
- Query examples

## Implementation Blueprint
[Detailed pseudocode with validation points]

## Validation Gates

### Level 1: Syntax
✓ Run: npm run lint
Common fixes:
- Missing semicolons
- Import order issues

### Level 2: Unit Tests
✓ Run: npm test
[Test examples]

### Level 3: Integration
✓ Run: npm run test:e2e
[Integration patterns]

### Level 4: Creative Validation
- Performance benchmarks
- Security scanning
- User acceptance
```

### 2. Planning Template (`planning`)

ULTRATHINK methodology for deep architectural analysis and planning.

#### Key Features

- **Problem Decomposition**: Break complex problems into sub-problems
- **Architecture Diagrams**: Mermaid-based visual representations  
- **Risk Analysis**: Probability, impact, mitigation strategies
- **Performance Planning**: Benchmarks, optimization strategies
- **Security Analysis**: Attack vectors, preventive measures
- **Phased Implementation**: 3-phase approach with clear milestones

#### When to Use

- New major features requiring architecture decisions
- Complex integrations with external systems
- Performance-critical implementations
- Security-sensitive features
- Large-scale refactoring

#### Structure

```markdown
## Problem Space Analysis
- Core problem statement
- Sub-problems with complexity ratings
- Dependencies and constraints

## Solution Architecture
[Detailed component diagrams]
[Data flow visualizations]

## Technical Decisions
- Options considered with pros/cons
- Final decisions with rationale

## Implementation Strategy
- Phase 1: Foundation (1 week)
- Phase 2: Core Implementation (2-3 weeks)  
- Phase 3: Integration & Polish (1-2 weeks)

## Risk Analysis
[Risk matrices with mitigation plans]

## Performance Considerations
- Expected load characteristics
- Optimization strategies
- Benchmarking plans

## Security Analysis
[Threat modeling and countermeasures]
```

### 3. Technical Specification Template (`spec`)

Comprehensive technical blueprint with implementation details.

#### Key Features

- **Detailed Requirements**: Functional and non-functional
- **API Specifications**: Complete endpoint documentation
- **Data Architecture**: Models, schemas, migrations
- **Test Specifications**: Coverage targets, test strategies
- **Deployment Architecture**: Environment configurations
- **Monitoring & Observability**: Metrics, logging, alerts

#### When to Use

- API development
- Database schema design
- Microservices architecture
- Enterprise features
- Compliance requirements

#### Structure

```markdown
## Objectives & Success Criteria
- Primary objectives with metrics
- Success indicators

## Technical Architecture
[System context diagram]
[Component architecture]
[Technology stack rationale]

## API Specification
### POST /api/resource
- Headers, body, responses
- Rate limiting
- Authentication
- Implementation snippets

## Data Architecture
[Domain models with validation]
[Database schema with indexes]
[Migration strategies]

## Performance Specifications
| Metric | Target | Degraded | Unacceptable |
|--------|--------|----------|--------------|
| Response Time | <200ms | <500ms | >1s |

## Security Specifications
[Authentication & authorization matrix]
[Data protection measures]

## Testing Specifications
- Unit test coverage: 90%
- Integration test scenarios
- Performance test plans

## Deployment Specifications
[Environment configurations]
[CI/CD pipeline stages]
```

### 4. Task Template (`task`)

Focused template for specific tasks or bug fixes.

#### Key Features

- **Problem/Solution Format**: Clear issue definition
- **Implementation Checklist**: Step-by-step guide
- **Quick Validation**: Streamlined testing
- **Rollback Plan**: Recovery procedures
- **Time Estimates**: Realistic expectations

#### When to Use

- Bug fixes
- Small features
- Refactoring tasks
- Performance optimizations
- Security patches

#### Structure

```markdown
## Quick Context
- Type: bugfix|feature|refactor
- Priority: P0|P1|P2|P3
- Estimated Time: 4-8 hours

## Problem Statement
[Current vs Expected behavior]
[Impact analysis]

## Implementation Checklist
### Pre-Implementation
- [ ] Understand existing code
- [ ] Review similar implementations

### Core Implementation
Step 1: [Title]
- Files to modify
- Implementation code
- Validation steps

### Post-Implementation
- [ ] Run all tests
- [ ] Update documentation

## Success Criteria
- [ ] Feature works as expected
- [ ] All tests pass
- [ ] No performance regression
```

## Template Selection Guide

| Scenario | Recommended Template | Why |
|----------|---------------------|-----|
| New user authentication system | `base-enhanced` | Comprehensive context needed |
| Microservices architecture design | `planning` | Deep analysis required |
| REST API development | `spec` | Detailed contracts needed |
| Fix login timeout bug | `task` | Focused, quick fix |
| Database optimization | `planning` + `spec` | Analysis then implementation |
| Add dark mode toggle | `task` | Simple, well-defined scope |

## Using Templates

### CLI Generation

```bash
# Interactive selection
context-forge init

# Specific template
context-forge init --prp-template base-enhanced

# Multiple templates
context-forge init --prp-template "planning,spec"
```

### Template Customization

Templates use Handlebars for dynamic content:

```handlebars
## Feature: {{featureName}}

{{#if hasDatabase}}
### Database Schema
```sql
{{databaseSchema}}
```
{{/if}}

{{#each validationCommands}}
- Run: {{this}}
{{/each}}
```

### Available Variables

Common variables across templates:
- `projectName`
- `featureName`  
- `language` (typescript, python, etc.)
- `testLanguage`
- `techStack` (frontend, backend, database)
- `validationCommands`
- `gotchas` (version-specific issues)

## Validation Gates Explained

### Level 1: Syntax Check
- Linting (ESLint, Pylint, etc.)
- Type checking (TypeScript, mypy)
- Format validation (Prettier, Black)

### Level 2: Unit Tests
- Function-level testing
- Component testing
- Coverage requirements

### Level 3: Integration Tests
- API endpoint testing
- Database operations
- External service mocks

### Level 4: Creative Validation
- Performance benchmarks
- Security scanning
- Accessibility checks
- User acceptance criteria

## Best Practices

### 1. Context Richness

Always include:
- Version-specific information
- Framework idioms
- Project conventions
- Common pitfalls
- Example implementations

### 2. Validation Completeness

Each task should have:
- Clear success criteria
- Executable validation
- Rollback procedures
- Error recovery steps

### 3. Progressive Enhancement

Start with:
1. Working implementation
2. Add tests
3. Optimize performance
4. Enhance security
5. Improve UX

### 4. Documentation Integration

- Reference existing docs
- Update docs as you go
- Include inline examples
- Link to external resources

## Advanced Features

### Conditional Sections

Templates can adapt based on project configuration:

```handlebars
{{#if techStack.frontend}}
## Frontend Implementation
{{#if_eq techStack.frontend "nextjs"}}
### Next.js 15 Specific
- Use App Router
- Server Components by default
{{/if_eq}}
{{/if}}
```

### Custom Helpers

Register custom Handlebars helpers:

```javascript
Handlebars.registerHelper('inc', (value) => value + 1);
Handlebars.registerHelper('if_eq', (a, b, options) => {
  return a === b ? options.fn(this) : options.inverse(this);
});
```

### Dynamic Validation

Validation commands adapt to tech stack:

```javascript
if (techStack.frontend === 'nextjs') {
  validationCommands.syntax.push('next lint');
  validationCommands.build = 'next build';
}
```

## Integration with AI Docs

### Structure

```
PRPs/
├── feature-prp.md
└── ai_docs/
    ├── auth-patterns.md
    ├── testing-guide.md
    └── api-conventions.md
```

### Referencing

```markdown
## All Needed Context

### From ai_docs:
- [Authentication Patterns](ai_docs/auth-patterns.md)
- [Testing Conventions](ai_docs/testing-guide.md)
```

## Examples

### Example 1: E-commerce Cart Feature

Using `base-enhanced`:

```markdown
## Feature: Shopping Cart Management

## All Needed Context

### Version Notes
- React 19 with Next.js 15
- Using App Router
- Zustand for state management

### From ai_docs:
- [State Management Patterns](ai_docs/state-patterns.md)
- [API Integration Guide](ai_docs/api-guide.md)

## Implementation Blueprint

### Step 1: Cart State Store
```typescript
// src/stores/cartStore.ts
interface CartStore {
  items: CartItem[];
  addItem: (product: Product) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
}
```

### Validation Gates

#### Level 1: Syntax ✓
```bash
npm run lint
npm run typecheck
```

Common fixes:
- Missing 'use client' directive
- Import path using @ alias
```

### Example 2: API Rate Limiting

Using `spec`:

```markdown
# Technical Specification: API Rate Limiting

## Objectives & Success Criteria

### Primary Objectives
- PO-1: Implement rate limiting for all API endpoints
  - Success Metric: 99.9% legitimate requests succeed
- PO-2: Protect against abuse
  - Success Metric: Block 100% of requests exceeding limits

## API Specification

### Rate Limit Headers

All responses include:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 99
X-RateLimit-Reset: 1640995200
```

### Implementation

```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
```
```

## Conclusion

Enhanced PRP templates provide:

- **Structure**: Consistent approach to different scenarios
- **Context**: Rich information for AI success
- **Validation**: Quality gates at every step
- **Flexibility**: Adapt to any tech stack
- **Efficiency**: From idea to implementation faster

Choose the right template for your task and let Context Forge guide you to implementation success!