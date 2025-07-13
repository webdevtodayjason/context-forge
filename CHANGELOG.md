# Changelog

All notable changes to this project will be documented in this file.

## [3.1.4] - 2025-07-12

### 🚀 Major Feature Release: Migration Assistant & Enhanced Claude Code Integration

This release introduces powerful new features for technology migration, human-in-the-loop development, and deeper Claude Code integration.

### ✨ New Features

- **🔄 Technology Migration Assistant** (`context-forge migrate`):
  - Analyzes existing projects and complexity
  - Detects shared resources (databases, auth systems, APIs)
  - Generates phased migration plans with rollback strategies
  - Supports big-bang, incremental, and parallel-run strategies
  - Creates migration-specific PRPs and validation procedures

- **🛑 Human-in-the-Loop Checkpoints**:
  - Pause AI development at critical milestones
  - Human verification before proceeding
  - Configurable checkpoint triggers
  - Integration with migration and PRP workflows
  - Commands: `/checkpoint`, `/should-checkpoint`, `/milestone-gate`

- **🪝 Enhanced Claude Code Hooks** (4 types):
  - **PreCompact**: Context preservation during compaction
  - **ContextRotation**: Smart file management
  - **PreSubmit**: Quality gates before submission
  - **PRPTracking**: Progress monitoring
  - New `copy-hooks` command to import from other projects

- **⚡ Expanded Slash Commands** (20+ commands):
  - Migration commands: `/migration-status`, `/migration-validate`, `/migration-rollback`
  - Checkpoint commands: `/checkpoint`, `/milestone-gate`
  - Development commands: `/debug-issue`, `/review-code`, `/refactor-code`
  - Git commands: `/smart-commit`, `/create-pr`

### 🔧 Improvements

- Enhanced PRP templates with migration support
- Better file structure with `.claude/` directory organization
- Improved interactive prompts with checkpoint and hooks options
- SEO-optimized npm description and keywords
- Comprehensive documentation updates

### 📚 Documentation

- Added migration system documentation
- Expanded Claude Code features guide
- Updated all examples to show new features
- Added Human-in-the-Loop checkpoint guide
- Enhanced hooks documentation for all 4 types

### 🐛 Bug Fixes

- Fixed TypeScript type issues in migration components
- Resolved ESLint warnings in migration generators
- Fixed import issues in migration analyzer

## [3.1.2] - 2025-01-10

### 🚀 Major Version Release

This major version release solidifies Context Forge as the premier universal AI IDE configuration tool with comprehensive PRP support.

### ✨ Highlights

- **Production-Ready PRP**: Battle-tested Product Requirement Prompt implementation across 6 major AI IDEs
- **Claude Hooks Integration**: Seamless context preservation with PreCompact hook support
- **Enterprise-Grade**: Ready for large-scale development teams and complex projects
- **Universal Compatibility**: Proven support for Claude, Cursor, Windsurf, Cline, Copilot, and Gemini

### 🔧 Stability Improvements

- Enhanced error handling across all IDE adapters
- Improved file generation reliability
- Optimized PRP validation gates
- Refined documentation and examples

### 📚 Documentation

- Production deployment guidelines
- Enterprise usage patterns
- Team collaboration workflows
- Performance optimization tips

## [0.3.0] - 2025-01-10

### 🚀 Major Feature: PRP Support for 6 AI IDEs

This release adds comprehensive Product Requirement Prompt (PRP) support across 6 major AI coding assistants, enabling structured feature implementation with validation gates.

### ✨ New Features

- **PRP Implementation for Multiple IDEs**:
  - **Cursor IDE**: PRP files in `.cursor/rules/` using MDC format
  - **Windsurf IDE**: Staged implementation with character limit compliance
  - **Cline**: Combined markdown approach in `.clinerules/` directory
  - **GitHub Copilot**: Slash command prompts in `.github/prompts/*.prompt.md`
  - **Gemini**: CLI-integrated PRP with `.gemini/prp/` structure and config.yaml

- **Structured Implementation Stages**:
  - Stage 1: Foundation setup and infrastructure
  - Stage 2: Core features (must-have functionality)
  - Stage 3: Advanced features (should-have/nice-to-have)
  - Validation gates between each stage

- **Claude Hooks Manager Integration**:
  - Seamless integration with PreCompact hook (Claude Code v1.0.48+)
  - Automatic PRP file re-injection during conversation compaction
  - Persistent context preservation for long-running development sessions

### 🔧 Technical Improvements

- Added PRP generation methods to all supported IDE adapters
- Implemented IDE-specific PRP file structures and naming conventions
- Enhanced feature tracking and validation gate systems
- Improved documentation with PRP workflow examples

### 📚 Documentation

- Updated all IDE-specific documentation with PRP examples
- Added PRP workflow guides for each supported IDE
- Included Claude Hooks Manager integration guide
- Enhanced README with PRP feature highlights

## [0.2.1] - 2025-01-10

### 🔧 Improvements

- Updated welcome message to be AI-agnostic: "Let's set up AI-optimized documentation for your project"
- Updated init command description to reflect multi-IDE support
- Added windsurf and copilot to the --ide flag help text
- Fixed messaging throughout to remove Claude Code-specific references

### 📚 Documentation

- Added npm downloads badge to README
- Added GitHub release badge to README
- Made npm installation section more prominent
- Added npm package visualization badge

## [0.2.0] - 2025-01-10

### 🎉 Major Release: Multi-IDE Support

This release transforms Context Forge from a Claude Code-specific tool into a universal AI IDE configuration generator, supporting 7+ major AI coding assistants.

### ✨ Features

- **Multi-IDE Support**: Added support for 7 AI-powered IDEs and assistants:
  - Claude Code (Anthropic) - Full PRP support
  - Cursor IDE - MDC format with hierarchical rules
  - Windsurf IDE - Cascade AI integration with workflows
  - Cline (formerly Claude Dev) - Advanced context management
  - Roo Code - Workspace rules with YAML configuration
  - GitHub Copilot - Custom instructions with VS Code settings
  - Gemini (Google) - CLI and Code Assist integration

- **Interactive IDE Selection**: New interactive prompt during `init` to select one or multiple IDEs
- **IDE-Specific Adapters**: Modular adapter architecture for easy extensibility
- **Enhanced Documentation**: Comprehensive guides for each IDE in `docs/ide-configs/`
- **Improved Marketing**: Updated README with IDE comparison table and feature highlights

### 🔧 Technical Improvements

- Implemented adapter pattern for IDE configurations
- Added `--ide` flag support for CLI
- Created `IDEAdapter` base class for consistent implementation
- Added TypeScript types for IDE information and selection
- Enhanced project configuration to support multiple target IDEs

### 📚 Documentation

- Created detailed configuration guides for all 7 IDEs
- Added examples of generated files for each IDE
- Updated README with comprehensive IDE support information
- Added banner and footer logos for better branding

### 🐛 Bug Fixes

- Fixed ESLint configuration for v9 compatibility
- Resolved TypeScript compilation errors
- Fixed Jest test configuration for ESM modules
- Corrected linting errors with unused imports

## [0.1.0] - 2025-01-09

### Initial Release

- Basic Context Forge CLI functionality
- Support for Claude Code configuration generation
- Interactive project setup wizard
- PRP (Product Requirement Prompt) integration
- Validation system for code quality
- Tech-stack specific templates
- Support for 9+ frameworks
- Comprehensive documentation generation

### Features

- `context-forge init` command for project initialization
- `context-forge validate` command for code validation
- Multiple tech stack support (Next.js, React, FastAPI, Express, etc.)
- Staged implementation plans
- Bug tracking templates
- Pre-commit checklists
