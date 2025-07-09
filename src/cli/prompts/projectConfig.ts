import inquirer from 'inquirer';

interface ProjectConfigAnswers {
  timeline: 'mvp' | 'standard' | 'enterprise';
  teamSize: 'solo' | 'small' | 'medium' | 'large';
  deployment: string;
  extras: {
    docker?: boolean;
    cicd?: boolean;
    testing?: boolean;
    linting?: boolean;
    examples?: boolean;
    prp?: boolean;
    aiDocs?: boolean;
    claudeCommands?: boolean;
  };
}

export async function projectConfig(): Promise<ProjectConfigAnswers> {
  console.log("\n⚙️  Let's configure your project settings:\n");

  const { timeline } = await inquirer.prompt([
    {
      type: 'list',
      name: 'timeline',
      message: 'Estimated timeline:',
      choices: [
        { name: '2-4 weeks (MVP)', value: 'mvp' },
        { name: '1-2 months (Full product)', value: 'standard' },
        { name: '3-6 months (Enterprise)', value: 'enterprise' },
      ],
    },
  ]);

  const { teamSize } = await inquirer.prompt([
    {
      type: 'list',
      name: 'teamSize',
      message: 'Team size:',
      choices: [
        { name: 'Solo developer', value: 'solo' },
        { name: '2-3 developers', value: 'small' },
        { name: '4-10 developers', value: 'medium' },
        { name: '10+ developers', value: 'large' },
      ],
    },
  ]);

  const { deployment } = await inquirer.prompt([
    {
      type: 'list',
      name: 'deployment',
      message: 'Deployment target:',
      choices: [
        { name: 'Vercel', value: 'vercel' },
        { name: 'Netlify', value: 'netlify' },
        { name: 'AWS', value: 'aws' },
        { name: 'Google Cloud', value: 'gcp' },
        { name: 'Azure', value: 'azure' },
        { name: 'Heroku', value: 'heroku' },
        { name: 'Railway', value: 'railway' },
        { name: 'Render', value: 'render' },
        { name: 'DigitalOcean', value: 'digitalocean' },
        { name: 'Self-hosted', value: 'self-hosted' },
        { name: 'Other', value: 'other' },
      ],
    },
  ]);

  console.log('\n📦 Additional options:\n');

  const { selectedExtras } = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'selectedExtras',
      message: 'Include these extras:',
      choices: [
        { name: 'Docker configuration', value: 'docker', checked: true },
        { name: 'CI/CD pipeline setup', value: 'cicd' },
        { name: 'Testing framework setup', value: 'testing', checked: true },
        { name: 'ESLint/Prettier configuration', value: 'linting', checked: true },
        { name: 'Example implementations', value: 'examples' },
        { name: 'PRP (Product Requirement Prompts)', value: 'prp' },
        { name: 'AI Documentation directory', value: 'aiDocs' },
        { name: 'Claude Code commands', value: 'claudeCommands' },
      ],
    },
  ]);

  // Convert array of selected extras to object
  const extras: ProjectConfigAnswers['extras'] = {
    docker: selectedExtras.includes('docker'),
    cicd: selectedExtras.includes('cicd'),
    testing: selectedExtras.includes('testing'),
    linting: selectedExtras.includes('linting'),
    examples: selectedExtras.includes('examples'),
    prp: selectedExtras.includes('prp'),
    aiDocs: selectedExtras.includes('aiDocs'),
    claudeCommands: selectedExtras.includes('claudeCommands'),
  };

  return {
    timeline,
    teamSize,
    deployment,
    extras,
  };
}
