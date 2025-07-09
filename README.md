# Context Forge

A CLI tool that generates context engineering documentation for Claude Code projects, enabling efficient AI-assisted development workflows without requiring any AI APIs.

## Overview

Context Forge helps developers quickly set up their projects with proper context engineering principles based on Andre Karpathy's methodology. It generates structured documentation that:

- Manages Claude Code's context window efficiently
- Provides clear implementation stages and tasks
- Maintains project consistency through documented rules
- Enables step-by-step development without hallucination

## Features

- 🚀 **No AI Dependencies** - Works completely offline without API keys
- 📋 **Interactive CLI** - Guided project setup with smart prompts
- 🎯 **Template-based Generation** - Consistent, high-quality documentation
- 🛠️ **Multiple Tech Stacks** - Support for Next.js, FastAPI, React, Express, and more
- 📁 **Structured Output** - Organized documentation following best practices
- ⚡ **Fast Setup** - Go from zero to Claude Code-ready in minutes

## Installation

```bash
npm install -g context-forge
```

## Usage

### Basic Usage

```bash
# Initialize in current directory
context-forge init

# Specify output directory
context-forge init --output ./my-project

# Use preset configurations
context-forge init --preset nextjs-fastapi
```

### Generated Files Structure

Context Forge creates the following documentation structure:

```
project-folder/
├── CLAUDE.md                    # Main context file with rules
├── Docs/
│   ├── Implementation.md       # Staged development plan
│   ├── project_structure.md    # Folder organization
│   ├── UI_UX_doc.md           # Design specifications
│   └── Bug_tracking.md        # Bug tracking template
```

## Interactive Setup

When you run `context-forge init`, you'll be guided through:

1. **Project Information** - Name, type, and description
2. **PRD Input** - Provide or create product requirements
3. **Tech Stack Selection** - Choose frontend, backend, and database
4. **Feature Selection** - Pick core features for your MVP
5. **Configuration** - Timeline, team size, and deployment

## Supported Tech Stacks

### Frontend
- Next.js (App Router/Pages Router)
- React
- Vue.js
- Angular
- Vanilla JavaScript

### Backend
- FastAPI (Python)
- Express.js (Node.js)
- Django (Python)
- Spring Boot (Java)
- Ruby on Rails

### Databases
- PostgreSQL
- MySQL
- MongoDB
- SQLite
- Redis

## Configuration File

You can skip the interactive prompts by providing a configuration file:

```json
{
  "projectName": "My App",
  "projectType": "fullstack",
  "description": "A collaborative platform",
  "techStack": {
    "frontend": "nextjs",
    "backend": "fastapi",
    "database": "postgresql",
    "auth": "jwt"
  },
  "features": [
    "authentication",
    "dashboard",
    "crud-operations"
  ]
}
```

Use with: `context-forge init --config context-forge.json`

## Development

```bash
# Clone the repository
git clone https://github.com/yourusername/context-forge.git
cd context-forge

# Install dependencies
npm install

# Build the project
npm run build

# Run in development mode
npm run dev

# Run tests
npm test
```

## Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Based on context engineering principles by Andre Karpathy
- Designed for use with Claude Code by Anthropic
- Built with Commander.js, Inquirer.js, and Handlebars

## Support

- Report issues: [GitHub Issues](https://github.com/yourusername/context-forge/issues)
- Documentation: [Wiki](https://github.com/yourusername/context-forge/wiki)
- Discussions: [GitHub Discussions](https://github.com/yourusername/context-forge/discussions)