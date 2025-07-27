# Changelog

All notable changes to this project will be documented in this file.

## [3.2.6] - 2025-07-27 - Feature PRP Generation Fix

### 🐛 Bug Fixes

- **Fixed missing feature PRPs**: Individual PRPs are now generated for each selected feature during init
  - Added feature PRP generation logic to Claude adapter
  - Each feature gets its own PRP file with feature-specific context
  - PRPs include feature name, description, priority, and complexity

## [3.2.5] - 2025-07-27 - Feature Prioritization Checkbox Fix

### 🐛 Bug Fixes

- **Fixed feature prioritization checkbox error**: Resolved "No selectable choices. All choices are disabled" error during feature prioritization step in init command
  - Added explicit `disabled: false` to priorityChoices in prioritizeFeatures function
  - Fixed both must-have and nice-to-have feature selection prompts
  - Resolves GitHub issue #6

## [3.2.4] - 2025-07-24 - Inquirer v12 Compatibility Fix

### 🐛 Bug Fixes

- **Fixed checkbox prompt error**: Resolved "No selectable choices. All choices are disabled" error in init command
  - Added explicit `disabled: false` to all selectable checkbox choices for Inquirer v12 compatibility
  - Fixed invalid `disabled` string values in IDE selection (changed to boolean)
  - Updated all checkbox prompts across the codebase: features.ts, ideSelection.ts, projectConfig.ts, checkpointConfig.ts
  - Users can now successfully run `context-forge init` and select features without errors

### 🔧 Technical Details

- Issue: Inquirer v12 requires explicit `disabled` property configuration for checkbox choices
- Solution: Added `disabled: false` to all selectable choices and `disabled: true` for unavailable options
- Affected files: features selection, IDE selection, project configuration extras, and checkpoint configuration

## [3.2.1] - 2025-07-15 - Smart Project Detection & Architect Mode

### 🏗️ Enhanced Prime Context Command

- **Smart Project Detection**: Automatically identifies new vs existing projects
- **Architect Mode**: For new projects, Claude becomes Lead Software Architect
- **TodoWrite Integration**: Creates concrete development tasks immediately
- **Clean Commit Enforcement**: Prevents Claude Code signatures in commit messages

### 📊 Transparent File Operations

- **Accurate File Path Reporting**: Shows actual paths instead of misleading basenames
- **Comprehensive Logging**: Generates detailed `context-forge.log` for all operations
- **Operation Statistics**: Tracks created/updated/skipped/failed files
- **FileLogger Service**: Centralized file operation tracking and logging

### 🔧 Enhanced User Experience

- **Before**: `✔ Created smart-commit.md` (misleading)
- **After**: `✔ .claude/commands/git/smart-commit.md` (accurate)
- **Project Summary**: Shows operation counts and success rates
- **Error Handling**: Clear error messages with actionable feedback

### 📝 Documentation Updates

- Updated README.md with new features
- Enhanced slash-commands.md with architect mode details
- Updated claude-features documentation

## [3.2.0] - 2025-07-14 - Orchestration & UX Enhancement Release

### 🤖 Autonomous AI Orchestration

This release introduces groundbreaking autonomous AI orchestration capabilities, enabling teams of AI agents to work on your project 24/7 without human intervention.

### ✨ New Features

- **🚀 Orchestration Command** (`context-forge orchestrate`):
  - Deploy autonomous AI agent teams in small, medium, or large configurations
  - Three-tier hierarchy: Orchestrator → Project Managers → Developers/QA/DevOps
  - Multiple deployment strategies: big-bang, phased, adaptive
  - Communication models: hub-and-spoke, hierarchical, mesh
  - Self-managing agents with automatic workload distribution
  
- **🔄 Self-Scheduling System**:
  - Agents schedule their own check-ins (5-60 minute intervals)
  - Adaptive scheduling based on workload
  - Automatic recovery from crashes or disconnections
  - Continuous operation without human intervention
  
- **📝 Git Discipline Enforcement**:
  - Automatic commits every 30 minutes prevent work loss
  - Feature branch creation for new work
  - Meaningful commit messages with task context
  - Stable version tagging before major changes
  
- **🖥️ Tmux Integration**:
  - Full tmux session management for AI agents
  - Automatic window creation and naming
  - Real-time monitoring capabilities
  - Agent health checks and status tracking
  
- **💬 Inter-Agent Communication**:
  - Structured message protocols
  - Status updates and task assignments
  - Escalation handling for blockers
  - Performance metrics tracking
  
- **📊 Orchestration Monitoring**:
  - `/orchestrate-status` - View team status and metrics
  - Real-time agent activity monitoring
  - Conversation logging and archival
  - Performance analytics and reporting

### 🏗️ Technical Implementation

- **New Services**:
  - `TmuxManager` - Complete tmux session control
  - `OrchestrationService` - Agent deployment and management
  - `AgentCommunicationService` - Message routing and validation
  - `SelfSchedulingService` - Adaptive scheduling system
  - `GitDisciplineService` - Automated git operations
  - Comprehensive TypeScript types for orchestration
  
- **Agent Roles**:
  - Orchestrator - Strategic oversight
  - Project Manager - Team coordination
  - Developer - Feature implementation
  - QA Engineer - Quality assurance
  - DevOps - Infrastructure management
  - Code Reviewer - Code quality
  
- **Slash Commands**:
  - `/orchestrate-project` - Deploy full autonomous team
  - `/orchestrate-feature` - Deploy feature-focused team
  - `/orchestrate-status` - Check team status
  - `/feature-status` - Monitor feature progress
  
### 📊 Test Results

- **Unit Tests**: 54/54 passed (100%)
- **Integration Tests**: All passing
- **Code Coverage**: 97.6% overall
- **Performance**: Deployment in <30s for small teams
- **Stability**: No critical errors in 30+ minute tests

### 📚 Documentation

- Added comprehensive orchestration guide (`.claude/docs/orchestration.md`)
- Created implementation documentation (`docs/orchestration/IMPLEMENTATION.md`)
- Added step-by-step tutorial (`docs/orchestration/tutorial.md`)
- Created test plan and results (`docs/orchestration/test-plan.md`)
- Updated command reference with orchestration details
- Added troubleshooting for tmux and agent issues
- Created best practices for autonomous development

### 🔐 Security & Reliability

- Isolated tmux sessions for each agent
- Communication validation prevents unauthorized messaging
- Automatic error recovery with configurable strategies
- Git compliance tracking and enforcement
- Comprehensive logging and archival

## [3.1.5] - 2025-07-13

### 🚀 Enhancement Feature Release

This release introduces the powerful `enhance` command for systematic feature planning and implementation in existing projects.

### ✨ New Features

- **📈 Enhancement Command** (`context-forge enhance`):
  - Plan and implement new features for existing projects
  - Interactive feature definition with dependencies
  - Feasibility analysis with complexity scoring
  - Phased implementation strategies (sequential/parallel/hybrid)
  - Generates feature-specific PRPs and implementation guides
  
- **🔍 Feature Analysis**:
  - Automatic feasibility assessment
  - Risk identification and mitigation strategies
  - Integration point analysis
  - Dependency management with topological sorting
  
- **📊 Progress Tracking**:
  - `/enhancement-status` - Overall progress monitoring
  - `/feature-status` - Individual feature tracking
  - `/enhancement-metrics` - Implementation metrics
  - `/feature-dependencies` - Dependency visualization
  - Automated progress hooks for real-time updates
  
- **✅ Validation System**:
  - Pre-implementation environment checks
  - Feature validation against acceptance criteria
  - Integration testing hooks
  - Phase completion checkpoints
  - Automated quality gates

### 📚 Documentation

- Added comprehensive enhancement guide (`.claude/docs/enhance.md`)
- Created command-specific documentation structure
- Added workflow guides for all major commands
- Updated main CLAUDE.md with enhancement feature details

### 🔧 Improvements

- Fixed TypeScript type definitions for enhancement system
- Added support for `very-complex` feature complexity
- Enhanced checkpoint configuration with custom commands
- Improved error handling in enhancement planner

### 🐛 Bug Fixes

- Fixed `analyzeDetailed` method call in enhance command
- Resolved type casting issues in enhancement prompts
- Fixed missing architecture patterns in PRP generator
- Corrected TypeScript build errors

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
