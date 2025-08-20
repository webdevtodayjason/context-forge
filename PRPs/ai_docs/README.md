# AI Documentation Curation

This directory contains curated documentation for AI-assisted development. These docs are referenced in PRPs to provide comprehensive context.

## Purpose

When creating PRPs, you may need to include specific documentation that isn't easily accessible via URLs or is critical for implementation success. This directory serves as a repository for such documentation.

## Usage in PRPs

Reference documents in your PRPs using:

```yaml
- docfile: PRPs/ai_docs/library-guide.md
  why: Specific implementation patterns and gotchas
```

## What to Include

1. **Library Documentation** - Key sections from official docs
2. **Implementation Patterns** - Common patterns and best practices
3. **API References** - Detailed API documentation for complex integrations
4. **Migration Guides** - When upgrading versions or switching libraries
5. **Internal Standards** - Team-specific coding standards and practices

## File Naming Convention

- Use descriptive names: `react-hooks-guide.md`, `fastapi-async-patterns.md`
- Include version if relevant: `nextjs-15-app-router.md`
- Use lowercase with hyphens

## Example Structure

```
PRPs/ai_docs/
├── README.md (this file)
├── react-hooks-guide.md
├── fastapi-async-patterns.md
├── postgres-optimization.md
└── aws-lambda-best-practices.md
```

Remember: The goal is to provide AI with all necessary context for one-pass implementation success.