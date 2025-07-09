export interface ProjectConfig {
  // Basic project info
  projectName: string;
  projectType: 'web' | 'mobile' | 'desktop' | 'api' | 'fullstack';
  description: string;

  // PRD
  prd?: {
    content: string;
    problemStatement?: string;
    targetUsers?: string;
    userStories?: string[];
  };

  // Tech stack
  techStack: {
    frontend?: string;
    backend?: string;
    database?: string;
    auth?: string;
    styling?: string;
    stateManagement?: string;
  };

  // Features
  features: Feature[];

  // Project configuration
  timeline: 'mvp' | 'standard' | 'enterprise';
  teamSize: 'solo' | 'small' | 'medium' | 'large';
  deployment: string;

  // Extras
  extras: {
    docker?: boolean;
    cicd?: boolean;
    testing?: boolean;
    linting?: boolean;
    examples?: boolean;
  };
}

export interface Feature {
  id: string;
  name: string;
  description: string;
  priority: 'must-have' | 'should-have' | 'nice-to-have';
  complexity: 'simple' | 'medium' | 'complex';
  category: 'auth' | 'ui' | 'data' | 'integration' | 'infrastructure';
  subtasks?: string[];
  dependencies?: string[];
}

export interface TechStackInfo {
  name: string;
  type: 'frontend' | 'backend' | 'database' | 'auth' | 'styling';
  docs: string;
  structure?: string;
  dependencies: string[];
  devDependencies?: string[];
  files?: string[];
  folders?: string[];
}

export interface Stage {
  name: string;
  duration: string;
  dependencies: string[];
  tasks: Task[];
}

export interface Task {
  description: string;
  subtasks?: string[];
  completed: boolean;
}
