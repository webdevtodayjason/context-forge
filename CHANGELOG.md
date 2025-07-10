# Changelog

All notable changes to this project will be documented in this file.

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
