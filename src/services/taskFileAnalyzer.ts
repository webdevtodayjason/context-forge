import fs from 'fs-extra';
import path from 'path';
import { ProjectConfig, Feature } from '../types';

export interface TaskFileTask {
  id: string;
  name: string;
  description: string;
  phase: string;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  effort: string;
  category: string;
  dependencies: string[];
  acceptanceCriteria: string[];
  technicalRequirements: string[];
  risks: Array<{
    type: string;
    description: string;
    mitigation: string;
  }>;
}

export interface TaskFilePhase {
  id: string;
  name: string;
  duration: string;
  description: string;
  tasks: TaskFileTask[];
  successCriteria: string[];
}

export interface ParsedTaskFile {
  projectName: string;
  overview: string;
  totalTasks: number;
  estimatedDuration: string;
  phases: TaskFilePhase[];
  riskManagement: {
    keyRisks: string[];
    mitigationStrategies: string[];
  };
  successMetrics: string[];
  resourceRequirements: {
    teamStructure: string[];
    technology: string[];
  };
}

/**
 * Service to analyze and parse comprehensive task implementation files
 * like the HoLaCe COMPLETE_IMPLEMENTATION_TASKS.md
 */
export class TaskFileAnalyzer {
  /**
   * Parse a markdown task file and extract structured data
   */
  async parseTaskFile(filePath: string): Promise<ParsedTaskFile> {
    const content = await fs.readFile(filePath, 'utf-8');

    const projectName = this.extractProjectName(content);
    const overview = this.extractOverview(content);
    const phases = this.extractPhases(content);
    const totalTasks = this.extractTotalTasks(content);
    const estimatedDuration = this.extractEstimatedDuration(content);
    const riskManagement = this.extractRiskManagement(content);
    const successMetrics = this.extractSuccessMetrics(content);
    const resourceRequirements = this.extractResourceRequirements(content);

    return {
      projectName,
      overview,
      totalTasks,
      estimatedDuration,
      phases,
      riskManagement,
      successMetrics,
      resourceRequirements,
    };
  }

  /**
   * Convert parsed task file to Context Forge compatible features
   */
  convertToFeatures(parsedTaskFile: ParsedTaskFile): Feature[] {
    const features: Feature[] = [];

    parsedTaskFile.phases.forEach((phase, phaseIndex) => {
      // Group tasks by category within each phase
      const tasksByCategory = this.groupTasksByCategory(phase.tasks);

      Object.entries(tasksByCategory).forEach(([category, tasks]) => {
        const feature: Feature = {
          id: `${phase.id}-${category.toLowerCase().replace(/\s+/g, '-')}`,
          name: `${phase.name}: ${category}`,
          description: this.generateFeatureDescription(tasks),
          priority: this.determinePriority(tasks),
          complexity: this.determineComplexity(tasks),
          category: this.mapCategoryToStandard(category),
          subtasks: tasks.map((task) => task.name),
          dependencies: this.extractFeatureDependencies(tasks),
          acceptanceCriteria: this.combineAcceptanceCriteria(tasks),
          technicalRequirements: this.combineTechnicalRequirements(tasks),
          risks: this.combineRisks(tasks),
          estimatedEffort: this.calculateEstimatedEffort(tasks),
        };

        features.push(feature);
      });
    });

    return features;
  }

  /**
   * Generate Context Forge project config from parsed task file
   */
  generateProjectConfig(parsedTaskFile: ParsedTaskFile, targetProjectPath: string): ProjectConfig {
    const features = this.convertToFeatures(parsedTaskFile);
    const techStack = this.detectTechStack(targetProjectPath);

    return {
      projectName: parsedTaskFile.projectName,
      description: parsedTaskFile.overview,
      projectType: 'fullstack',
      techStack,
      features,
      timeline: 'enterprise',
      teamSize: this.extractTeamSize(parsedTaskFile.resourceRequirements),
      deployment: 'auto-detect',
      targetIDEs: ['claude'],
      extras: {
        prp: true,
        aiPrp: true,
        aiDocs: true,
        testing: true,
        linting: true,
        hooks: true,
        checkpoints: true,
      },
      // Add task file specific config
      taskFileConfig: {
        originalFile: parsedTaskFile,
        totalTasks: parsedTaskFile.totalTasks,
        phaseCount: parsedTaskFile.phases.length,
        riskProfile: this.calculateRiskProfile(parsedTaskFile),
      },
    };
  }

  private extractProjectName(content: string): string {
    const match = content.match(/# (.+?) Platform - Complete Implementation Tasks/);
    return match ? match[1] : 'Project';
  }

  private extractOverview(content: string): string {
    const overviewMatch = content.match(/## 🎯 Executive Summary\s+([\s\S]*?)---/);
    return overviewMatch ? overviewMatch[1].trim() : '';
  }

  private extractTotalTasks(content: string): number {
    const match = content.match(/\*\*Total Estimated Tasks\*\*:\s*(\d+)/);
    return match ? parseInt(match[1]) : 0;
  }

  private extractEstimatedDuration(content: string): string {
    const match = content.match(/\*\*Timeline\*\*:\s*([^*\n]+)/);
    return match ? match[1].trim() : '12-16 weeks';
  }

  private extractPhases(content: string): TaskFilePhase[] {
    const phases: TaskFilePhase[] = [];

    // First, find all phase headers
    const phaseHeaderRegex = /## .+ \*\*PHASE (\d+): (.+?)\*\* \((.+?)\)/g;
    const phaseHeaders: Array<{
      phaseNum: string;
      phaseName: string;
      duration: string;
      startIndex: number;
    }> = [];

    let headerMatch;
    while ((headerMatch = phaseHeaderRegex.exec(content)) !== null) {
      phaseHeaders.push({
        phaseNum: headerMatch[1],
        phaseName: headerMatch[2].trim(),
        duration: headerMatch[3].trim(),
        startIndex: headerMatch.index,
      });
    }

    // Now extract content for each phase
    for (let i = 0; i < phaseHeaders.length; i++) {
      const currentPhase = phaseHeaders[i];
      const nextPhase = phaseHeaders[i + 1];

      // Extract content from current phase start to next phase start (or end of content)
      const startIndex = currentPhase.startIndex;
      const endIndex = nextPhase ? nextPhase.startIndex : content.length;
      const phaseContent = content.substring(startIndex, endIndex);

      const phase: TaskFilePhase = {
        id: `phase-${currentPhase.phaseNum}`,
        name: currentPhase.phaseName,
        duration: currentPhase.duration,
        description: this.extractPhaseDescription(phaseContent),
        tasks: this.extractPhaseTasks(phaseContent, `phase-${currentPhase.phaseNum}`),
        successCriteria: this.extractPhaseSuccessCriteria(phaseContent),
      };

      phases.push(phase);
    }

    return phases;
  }

  private extractPhaseTasks(phaseContent: string, phaseId: string): TaskFileTask[] {
    const tasks: TaskFileTask[] = [];
    // Updated regex to match the actual format: - [ ] **Task 1.1.1**: Create `/dashboard/service-requests` page route
    const taskRegex =
      /- \[ \] \*\*Task ([^*]+)\*\*: (.+?)(?:\n  - (.+?))?\n  - (.+?)\n  - \*\*Effort\*\*: (.+?)(?=\n\n|- \[ \]|\n###|$)/gs;

    let match;
    let taskIndex = 0;
    while ((match = taskRegex.exec(phaseContent)) !== null) {
      const [, taskId, taskName, description, details, effort] = match;

      const task: TaskFileTask = {
        id: `${phaseId}-task-${++taskIndex}`,
        name: taskName.trim(),
        description: description || taskName.trim(),
        phase: phaseId,
        priority: this.extractTaskPriority(phaseId),
        effort: effort.trim(),
        category: this.extractTaskCategory(taskName),
        dependencies: this.extractTaskDependencies(details || ''),
        acceptanceCriteria: this.extractTaskAcceptanceCriteria(details || ''),
        technicalRequirements: this.extractTaskTechnicalRequirements(details || ''),
        risks: this.extractTaskRisks(details || ''),
      };

      tasks.push(task);
    }

    // Fallback: if no tasks found with complex regex, try simpler approach
    if (tasks.length === 0) {
      const simpleTaskRegex = /- \[ \] \*\*Task ([^*]+)\*\*: (.+)/g;
      let simpleMatch;
      while ((simpleMatch = simpleTaskRegex.exec(phaseContent)) !== null) {
        const [, taskId, taskName] = simpleMatch;

        const task: TaskFileTask = {
          id: `${phaseId}-task-${++taskIndex}`,
          name: taskName.trim(),
          description: taskName.trim(),
          phase: phaseId,
          priority: this.extractTaskPriority(phaseId),
          effort: '1 day',
          category: this.extractTaskCategory(taskName),
          dependencies: [],
          acceptanceCriteria: [],
          technicalRequirements: [],
          risks: [],
        };

        tasks.push(task);
      }
    }

    return tasks;
  }

  private extractTaskPriority(phaseId: string): 'Critical' | 'High' | 'Medium' | 'Low' {
    if (phaseId.includes('1')) return 'Critical';
    if (phaseId.includes('2') || phaseId.includes('3')) return 'High';
    if (phaseId.includes('4') || phaseId.includes('5')) return 'Medium';
    return 'Low';
  }

  private extractTaskCategory(taskName: string): string {
    const name = taskName.toLowerCase();
    if (name.includes('api') || name.includes('endpoint')) return 'API Development';
    if (name.includes('ui') || name.includes('component') || name.includes('page'))
      return 'Frontend';
    if (name.includes('database') || name.includes('schema') || name.includes('migration'))
      return 'Database';
    if (name.includes('auth') || name.includes('security')) return 'Security';
    if (name.includes('test') || name.includes('validation')) return 'Testing';
    if (name.includes('deployment') || name.includes('infrastructure')) return 'Infrastructure';
    return 'Core Feature';
  }

  private extractRiskManagement(content: string): {
    keyRisks: string[];
    mitigationStrategies: string[];
  } {
    const riskMatch = content.match(/## Risk Management\s+([\s\S]*?)(?=##|\n---)/);
    if (!riskMatch) return { keyRisks: [], mitigationStrategies: [] };

    const riskContent = riskMatch[1];
    const keyRisks = this.extractListItems(riskContent, 'Key Risks');
    const mitigationStrategies = this.extractListItems(riskContent, 'Mitigation Strategies');

    return { keyRisks, mitigationStrategies };
  }

  private extractSuccessMetrics(content: string): string[] {
    const metricsMatch = content.match(/## 📊 \*\*SUCCESS METRICS\*\*([\s\S]*?)(?=##|\n---)/);
    if (!metricsMatch) return [];

    return this.extractBulletPoints(metricsMatch[1]);
  }

  private extractResourceRequirements(content: string): {
    teamStructure: string[];
    technology: string[];
  } {
    const resourceMatch = content.match(
      /## 💰 \*\*RESOURCE REQUIREMENTS\*\*([\s\S]*?)(?=##|\n---)/
    );
    if (!resourceMatch) return { teamStructure: [], technology: [] };

    const resourceContent = resourceMatch[1];
    const teamStructure = this.extractListItems(resourceContent, 'Development Team Structure');
    const technology = this.extractListItems(resourceContent, 'Technology Infrastructure');

    return { teamStructure, technology };
  }

  private groupTasksByCategory(tasks: TaskFileTask[]): Record<string, TaskFileTask[]> {
    const grouped: Record<string, TaskFileTask[]> = {};

    tasks.forEach((task) => {
      if (!grouped[task.category]) {
        grouped[task.category] = [];
      }
      grouped[task.category].push(task);
    });

    return grouped;
  }

  private generateFeatureDescription(tasks: TaskFileTask[]): string {
    const taskNames = tasks.map((t) => t.name).join(', ');
    return `Complete ${tasks[0].category} implementation including: ${taskNames}`;
  }

  private determinePriority(tasks: TaskFileTask[]): 'must-have' | 'should-have' | 'nice-to-have' {
    const priorities = tasks.map((t) => t.priority);
    if (priorities.includes('Critical')) return 'must-have';
    if (priorities.includes('High')) return 'should-have';
    return 'nice-to-have';
  }

  private determineComplexity(
    tasks: TaskFileTask[]
  ): 'simple' | 'medium' | 'complex' | 'very-complex' {
    if (tasks.length >= 10) return 'very-complex';
    if (tasks.length >= 5) return 'complex';
    if (tasks.length >= 2) return 'medium';
    return 'simple';
  }

  private mapCategoryToStandard(
    category: string
  ):
    | 'auth'
    | 'ui'
    | 'data'
    | 'integration'
    | 'infrastructure'
    | 'api'
    | 'database'
    | 'security'
    | 'testing'
    | 'feature' {
    const mapping: Record<
      string,
      | 'auth'
      | 'ui'
      | 'data'
      | 'integration'
      | 'infrastructure'
      | 'api'
      | 'database'
      | 'security'
      | 'testing'
      | 'feature'
    > = {
      'API Development': 'api',
      Frontend: 'ui',
      Database: 'database',
      Security: 'security',
      Testing: 'testing',
      Infrastructure: 'infrastructure',
      'Core Feature': 'feature',
    };

    return mapping[category] || 'feature';
  }

  private combineAcceptanceCriteria(tasks: TaskFileTask[]): string[] {
    return tasks.flatMap((task) => task.acceptanceCriteria);
  }

  private combineTechnicalRequirements(tasks: TaskFileTask[]): string[] {
    return tasks.flatMap((task) => task.technicalRequirements);
  }

  private combineRisks(
    tasks: TaskFileTask[]
  ): Array<{ type: string; description: string; mitigation: string }> {
    return tasks.flatMap((task) => task.risks);
  }

  private calculateEstimatedEffort(tasks: TaskFileTask[]): string {
    // Sum up effort estimates from tasks
    const totalDays = tasks.reduce((sum, task) => {
      const effortMatch = task.effort.match(/(\d+(?:\.\d+)?)\s*days?/);
      return sum + (effortMatch ? parseFloat(effortMatch[1]) : 1);
    }, 0);

    return `${totalDays} days`;
  }

  private extractFeatureDependencies(tasks: TaskFileTask[]): string[] {
    return Array.from(new Set(tasks.flatMap((task) => task.dependencies)));
  }

  private detectTechStack(projectPath: string): ProjectConfig['techStack'] {
    // Analyze project to detect tech stack
    try {
      const packageJsonPath = path.join(projectPath, 'package.json');
      if (fs.existsSync(packageJsonPath)) {
        const packageJson = fs.readJsonSync(packageJsonPath);

        return {
          frontend: this.detectFrontend(packageJson),
          backend: this.detectBackend(packageJson),
          database: this.detectDatabase(projectPath),
          auth: this.detectAuth(packageJson),
          orm: this.detectORM(packageJson),
        };
      }
    } catch (error) {
      console.warn('Could not detect tech stack, using defaults');
    }

    return {
      frontend: 'nextjs',
      backend: 'nextjs',
      database: 'postgresql',
      auth: 'clerk',
      orm: 'prisma',
    };
  }

  private detectFrontend(packageJson: any): string {
    if (packageJson.dependencies?.next) return 'nextjs';
    if (packageJson.dependencies?.react) return 'react';
    if (packageJson.dependencies?.vue) return 'vuejs';
    if (packageJson.dependencies?.['@angular/core']) return 'angular';
    return 'nextjs';
  }

  private detectBackend(packageJson: any): string {
    if (packageJson.dependencies?.next) return 'nextjs';
    if (packageJson.dependencies?.express) return 'express';
    if (packageJson.dependencies?.fastify) return 'fastify';
    return 'nextjs';
  }

  private detectDatabase(projectPath: string): string {
    const schemaPath = path.join(projectPath, 'prisma', 'schema.prisma');
    if (fs.existsSync(schemaPath)) {
      const schema = fs.readFileSync(schemaPath, 'utf-8');
      if (schema.includes('postgresql')) return 'postgresql';
      if (schema.includes('mysql')) return 'mysql';
      if (schema.includes('sqlite')) return 'sqlite';
    }
    return 'postgresql';
  }

  private detectAuth(packageJson: any): string {
    if (packageJson.dependencies?.['@clerk/nextjs']) return 'clerk';
    if (packageJson.dependencies?.['next-auth']) return 'nextauth';
    if (packageJson.dependencies?.['@auth0/nextjs-auth0']) return 'auth0';
    return 'clerk';
  }

  private detectORM(packageJson: any): string {
    if (packageJson.dependencies?.['@prisma/client']) return 'prisma';
    if (packageJson.dependencies?.typeorm) return 'typeorm';
    if (packageJson.dependencies?.drizzle) return 'drizzle';
    return 'prisma';
  }

  // Helper methods
  private extractPhaseDescription(content: string): string {
    const lines = content.split('\n').filter((line) => line.trim());
    return lines.slice(0, 3).join(' ').trim();
  }

  private extractPhaseSuccessCriteria(content: string): string[] {
    return this.extractListItems(content, 'Success Criteria');
  }

  private extractTaskDependencies(content: string): string[] {
    return this.extractListItems(content, 'Dependencies');
  }

  private extractTaskAcceptanceCriteria(content: string): string[] {
    return this.extractListItems(content, 'Acceptance Criteria');
  }

  private extractTaskTechnicalRequirements(content: string): string[] {
    return this.extractListItems(content, 'Technical Requirements');
  }

  private extractTaskRisks(
    content: string
  ): Array<{ type: string; description: string; mitigation: string }> {
    const risks = this.extractListItems(content, 'Risks');
    return risks.map((risk) => ({
      type: 'implementation',
      description: risk,
      mitigation: 'Follow best practices and thorough testing',
    }));
  }

  private extractListItems(content: string, section: string): string[] {
    const sectionRegex = new RegExp(`${section}[:\\s]+((?:\\s*[-*]\\s+.+\\n?)+)`, 'i');
    const match = content.match(sectionRegex);
    if (!match) return [];

    return match[1]
      .split('\n')
      .filter((line) => line.trim().match(/^[-*]\s+/))
      .map((line) => line.replace(/^[-*]\s+/, '').trim())
      .filter(Boolean);
  }

  private extractBulletPoints(content: string): string[] {
    return content
      .split('\n')
      .filter((line) => line.trim().match(/^[-*]\s+/))
      .map((line) => line.replace(/^[-*]\s+/, '').trim())
      .filter(Boolean);
  }

  private extractTeamSize(resourceRequirements: {
    teamStructure: string[];
    technology: string[];
  }): 'solo' | 'small' | 'medium' | 'large' {
    const teamCount = resourceRequirements.teamStructure.length;
    if (teamCount >= 6) return 'large';
    if (teamCount >= 3) return 'medium';
    if (teamCount >= 2) return 'small';
    return 'solo';
  }

  private calculateRiskProfile(parsedTaskFile: ParsedTaskFile): 'low' | 'medium' | 'high' {
    const totalRisks = parsedTaskFile.riskManagement.keyRisks.length;
    const complexTasks = parsedTaskFile.phases.reduce(
      (sum, phase) => sum + phase.tasks.filter((t) => t.priority === 'Critical').length,
      0
    );

    if (totalRisks >= 10 || complexTasks >= 50) return 'high';
    if (totalRisks >= 5 || complexTasks >= 25) return 'medium';
    return 'low';
  }
}
