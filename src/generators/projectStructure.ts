import { ProjectConfig } from '../types';

export async function generateProjectStructure(config: ProjectConfig): Promise<string> {
  // Placeholder - will be implemented in Phase 5
  return `# Project Structure

## Root Directory
\`\`\`
${config.projectName}/
├── src/
│   ├── components/
│   ├── pages/
│   ├── services/
│   └── utils/
├── docs/
├── tests/
└── config/
\`\`\`

## Detailed Structure
[Detailed structure will be added here based on tech stack]
`;
}
