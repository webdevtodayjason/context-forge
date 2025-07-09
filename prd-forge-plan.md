# PRD-Forge Implementation Plan for Claude Code

## Project Overview

**Tool Name:** `prd-forge`  
**Purpose:** A CLI tool that generates context engineering documentation for Claude Code, enabling efficient AI-powered development workflows without requiring AI APIs.

## Core Concept

Based on Andre Karpathy's context engineering principles, this tool creates a structured documentation system that:
- Manages Claude Code's context window efficiently
- Provides clear implementation stages and tasks
- Maintains project consistency through documented rules
- Enables step-by-step development without hallucination

## Key Generated Files

### 1. CLAUDE.md (Main Context File)
- Contains the PRD implementation rules
- Defines how Claude Code should analyze and generate documentation
- Includes workflow instructions

### 2. /Docs/Implementation.md
- Staged development plan with checkboxes
- Feature analysis and categorization
- Tech stack documentation links
- Time estimates and dependencies

### 3. /Docs/project_structure.md
- Complete folder hierarchy
- File organization patterns
- Module structure

### 4. /Docs/UI_UX_doc.md
- Design system specifications
- Component guidelines
- User flow documentation

### 5. /Docs/Bug_tracking.md
- Error documentation template
- Solution tracking system

## Technical Architecture

### Stack
- **Language:** Node.js (vanilla JavaScript/TypeScript)
- **CLI Framework:** Commander.js
- **Prompts:** Inquirer.js
- **Templates:** Handlebars or simple string templates
- **File Operations:** fs-extra
- **Styling:** Chalk for colored output
- **No AI Dependencies:** Pure template-based generation

### Project Structure
```
prd-forge/
├── bin/
│   └── prd-forge.js              # CLI entry point
├── src/
│   ├── cli/
│   │   ├── index.js             # Main CLI logic
│   │   └── prompts/
│   │       ├── projectInfo.js   # Basic project questions
│   │       ├── techStack.js     # Tech stack selection
│   │       ├── features.js      # Feature selection
│   │       └── prdInput.js      # PRD input methods
│   ├── generators/
│   │   ├── claudeMd.js          # CLAUDE.md generator
│   │   ├── implementation.js    # Implementation.md generator
│   │   ├── projectStructure.js  # project_structure.md generator
│   │   ├── uiUx.js             # UI_UX_doc.md generator
│   │   └── bugTracking.js      # Bug_tracking.md generator
│   ├── templates/
│   │   ├── claude/
│   │   │   ├── generate.md      # PRD analysis template
│   │   │   └── workflow.md      # Development workflow template
│   │   ├── docs/
│   │   │   ├── implementation/
│   │   │   │   ├── header.md
│   │   │   │   ├── stages/
│   │   │   │   └── tech-stacks/
│   │   │   ├── structures/      # Framework-specific structures
│   │   │   └── ui-ux/          # UI/UX templates
│   │   └── tech-configs/        # Tech stack configurations
│   ├── data/
│   │   ├── techStacks.js        # Available tech combinations
│   │   ├── features.js          # Common feature lists
│   │   └── prompts.js           # Question templates
│   └── utils/
│       ├── fileWriter.js        # File creation utilities
│       ├── validator.js         # Input validation
│       └── formatter.js         # Markdown formatting
├── package.json
├── README.md
└── examples/                     # Example outputs
```

## User Flow

### 1. Installation & Execution
```bash
# Install globally
npm install -g prd-forge

# Run in project directory
cd my-new-project
prd-forge init
```

### 2. Interactive Prompts Flow

#### Step 1: Project Basics
```
? Project name: TaskMaster Pro
? Project type: (Use arrow keys)
  > Web Application
    Mobile Application
    Desktop Application
    API Service
    Full-Stack Application
? Brief description: A collaborative task management platform
```

#### Step 2: PRD Input Method
```
? Do you have a Product Requirements Document (PRD)? (Y/n)

If Yes:
? How would you like to provide the PRD?
  > Type/paste it here
    Load from file (prd.md)
    Create one through guided questions

If No or Guided:
? What problem does this solve?
? Who are the target users?
? What are the main user stories?
```

#### Step 3: Tech Stack Selection
```
? Select your frontend framework:
  > Next.js (React-based, full-stack)
    React (SPA)
    Vue.js
    Angular
    None (API only)

? Select your backend framework:
  > FastAPI (Python)
    Express.js (Node.js)
    Django (Python)
    Spring Boot (Java)
    Ruby on Rails

? Select your database:
  > PostgreSQL
    MySQL
    MongoDB
    SQLite
    Redis + PostgreSQL

? Authentication method:
  > JWT-based
    OAuth 2.0 (Google, GitHub)
    Session-based
    Magic links
    None
```

#### Step 4: Feature Selection
```
? Select core features for your MVP: (Press <space> to select)
  ◯ User Authentication & Authorization
  ◯ User Dashboard
  ◯ CRUD Operations
  ◯ File Upload/Management
  ◯ Real-time Updates (WebSocket)
  ◯ Payment Processing
  ◯ Email Notifications
  ◯ API Documentation
  ◯ Admin Panel
  ◯ Search Functionality
  ◯ Data Export/Import
  ◯ Multi-language Support
```

#### Step 5: Project Configuration
```
? Estimated timeline:
  > 2-4 weeks (MVP)
    1-2 months (Full product)
    3-6 months (Enterprise)

? Team size:
  > Solo developer
    2-3 developers
    4-10 developers
    10+ developers

? Deployment target:
  > Vercel/Netlify
    AWS
    Google Cloud
    Heroku
    Self-hosted
```

#### Step 6: Additional Options
```
? Include these extras?
  ◉ Docker configuration
  ◯ CI/CD pipeline setup
  ◉ Testing framework setup
  ◉ ESLint/Prettier configuration
  ◯ Example implementations
```

## Implementation Details

### 1. Template Engine Logic

```javascript
// Example: Generate Implementation.md stages based on features
function generateStages(projectConfig) {
  const stages = [];
  
  // Stage 1 is always foundation
  stages.push({
    name: "Foundation & Setup",
    duration: "3-5 days",
    tasks: generateFoundationTasks(projectConfig.techStack)
  });
  
  // Stage 2: Core features (based on selected features)
  if (projectConfig.features.length > 0) {
    stages.push({
      name: "Core Features",
      duration: calculateDuration(projectConfig.features),
      tasks: generateFeatureTasks(projectConfig.features.filter(f => f.priority === 'must-have'))
    });
  }
  
  // Continue for other stages...
  return stages;
}
```

### 2. Tech Stack Configurations

```javascript
// Pre-defined tech stack combinations with documentation links
const techStacks = {
  nextjs: {
    name: "Next.js",
    type: "frontend",
    docs: "https://nextjs.org/docs",
    structure: "app-router", // or "pages-router"
    dependencies: ["react", "react-dom", "next"],
    devDependencies: ["@types/react", "typescript", "eslint"]
  },
  fastapi: {
    name: "FastAPI",
    type: "backend",
    docs: "https://fastapi.tiangolo.com/",
    structure: "modular",
    dependencies: ["fastapi", "uvicorn", "sqlalchemy", "pydantic"],
    files: ["main.py", "requirements.txt", ".env.example"]
  }
  // ... more configurations
};
```

### 3. File Generation Strategy

```javascript
// Generate CLAUDE.md with context engineering rules
function generateClaudeMd(config) {
  return `# ${config.projectName} - Claude Code Context

## Project Overview
${config.description}

## Context Engineering Setup
This project uses context engineering principles for efficient AI-assisted development.

### Key Files:
- \`/Docs/Implementation.md\` - Staged development plan
- \`/Docs/project_structure.md\` - Project organization
- \`/Docs/UI_UX_doc.md\` - Design specifications
- \`/Docs/Bug_tracking.md\` - Error tracking

${generatePRDAnalysisRules(config)}

${generateWorkflowRules()}
`;
}
```

### 4. Stage-Based Task Generation

```javascript
// Generate checkbox tasks for Implementation.md
function generateTaskList(stage, features) {
  const tasks = [];
  
  switch(stage) {
    case 'foundation':
      tasks.push(
        '- [ ] Initialize project repository',
        '- [ ] Set up development environment',
        '- [ ] Install core dependencies',
        '- [ ] Configure build tools',
        '- [ ] Set up folder structure',
        '- [ ] Create configuration files',
        '- [ ] Initialize database schema',
        '- [ ] Set up environment variables'
      );
      break;
    case 'core-features':
      features.forEach(feature => {
        tasks.push(`- [ ] Implement ${feature.name}`);
        if (feature.subtasks) {
          feature.subtasks.forEach(subtask => {
            tasks.push(`  - [ ] ${subtask}`);
          });
        }
      });
      break;
    // ... more stages
  }
  
  return tasks.join('\n');
}
```

## Generated Output Structure

```
my-project/
├── CLAUDE.md                    # Main context file for Claude Code
├── Docs/
│   ├── Implementation.md       # Staged development plan
│   ├── project_structure.md    # Detailed folder structure
│   ├── UI_UX_doc.md           # Design specifications
│   └── Bug_tracking.md        # Bug tracking template
├── .clinerules                # Additional Claude Code rules (optional)
└── README.md                  # Basic project README
```

## Key Features

### 1. No AI Dependencies
- Pure template-based generation
- Pre-configured tech stack options
- Rule-based document creation

### 2. Context Window Management
- Separate files for different concerns
- Workflow file kept minimal
- Staged implementation approach

### 3. Framework-Specific Templates
- Next.js app router structure
- FastAPI modular architecture
- Database schema templates
- Authentication boilerplates

### 4. Smart Defaults
- Recommended tech stacks based on project type
- Feature suggestions based on project category
- Timeline estimates based on complexity

## Development Stages

### Stage 1: Core CLI (Week 1)
- [ ] Set up Node.js project structure
- [ ] Implement Commander.js CLI
- [ ] Create Inquirer.js prompt flows
- [ ] Build configuration management
- [ ] Add input validation

### Stage 2: Template System (Week 1-2)
- [ ] Create base templates for each document
- [ ] Build tech stack configurations
- [ ] Implement template interpolation
- [ ] Add framework-specific structures
- [ ] Create feature mapping system

### Stage 3: Generators (Week 2)
- [ ] Build CLAUDE.md generator
- [ ] Create Implementation.md generator
- [ ] Implement project_structure.md logic
- [ ] Add UI_UX_doc.md templates
- [ ] Set up Bug_tracking.md template

### Stage 4: Testing & Polish (Week 3)
- [ ] Add comprehensive error handling
- [ ] Create example projects
- [ ] Write unit tests
- [ ] Add CLI help documentation
- [ ] Optimize performance

### Stage 5: Release (Week 3-4)
- [ ] Prepare NPM package
- [ ] Write comprehensive README
- [ ] Create tutorial documentation
- [ ] Set up GitHub repository
- [ ] Publish to NPM

## Usage Examples

### Basic Usage
```bash
# Initialize in current directory
prd-forge init

# Specify output directory
prd-forge init --output ./my-project

# Use preset configurations
prd-forge init --preset nextjs-fastapi

# Skip interactive mode with config file
prd-forge init --config prd-forge.json
```

### Configuration File
```json
{
  "projectName": "TaskMaster Pro",
  "projectType": "fullstack",
  "description": "Task management platform",
  "techStack": {
    "frontend": "nextjs",
    "backend": "fastapi",
    "database": "postgresql",
    "auth": "jwt"
  },
  "features": [
    "authentication",
    "dashboard",
    "crud-operations",
    "real-time-updates"
  ],
  "timeline": "mvp",
  "teamSize": "small"
}
```

## Benefits Over Manual Setup

1. **Consistency** - Same structure every time
2. **Speed** - Minutes instead of hours
3. **Best Practices** - Built-in patterns
4. **Context Optimization** - Efficient Claude Code usage
5. **No AI Required** - Works offline, no API keys

## Future Enhancements

1. **Plugin System** - Custom templates
2. **Update Command** - Modify existing projects
3. **Import PRDs** - From various formats
4. **Team Templates** - Shared configurations
5. **VS Code Extension** - GUI interface

This plan provides a complete blueprint for building prd-forge as a standalone CLI tool that sets up context engineering for Claude Code projects without requiring AI APIs.