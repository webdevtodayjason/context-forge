import { ProjectConfig } from '../../types';
import { projectInfo } from './projectInfo';
import { ideSelection } from './ideSelection';
import { prdInput } from './prdInput';
import { techStack } from './techStack';
import { features } from './features';
import { projectConfig } from './projectConfig';

export async function runPrompts(): Promise<ProjectConfig> {
  // Step 1: Basic project information
  const basicInfo = await projectInfo();

  // Step 2: IDE selection
  const targetIDEs = await ideSelection();

  // Step 3: PRD input
  const prd = await prdInput();

  // Step 4: Tech stack selection
  const stack = await techStack(basicInfo.projectType);

  // Step 5: Feature selection
  const selectedFeatures = await features(basicInfo.projectType);

  // Step 6: Project configuration
  const config = await projectConfig();

  return {
    ...basicInfo,
    targetIDEs,
    prd,
    techStack: stack,
    features: selectedFeatures,
    ...config,
  };
}
