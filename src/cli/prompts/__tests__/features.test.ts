import inquirer from 'inquirer';
import { features } from '../features';

jest.mock('inquirer');

describe('features prompt', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should handle case where all features are selected as must-have', async () => {
    const mockPrompt = jest.mocked(inquirer.prompt);

    // Mock initial feature selection - select all features
    mockPrompt.mockResolvedValueOnce({
      selectedFeatures: ['auth', 'dashboard', 'crud', 'file-upload', 'realtime', 'email', 'search'],
    });

    // Mock no custom features
    mockPrompt.mockResolvedValueOnce({
      hasCustomFeatures: false,
    });

    // Mock must-have selection - this should validate against selecting all
    mockPrompt.mockResolvedValueOnce({
      mustHaveFeatures: ['auth', 'crud', 'dashboard'],
    });

    // Mock nice-to-have selection - should have remaining features
    mockPrompt.mockResolvedValueOnce({
      niceToHaveFeatures: ['search', 'email'],
    });

    const result = await features('web');

    expect(result).toHaveLength(7);
    expect(result.filter((f) => f.priority === 'must-have')).toHaveLength(3);
    expect(result.filter((f) => f.priority === 'nice-to-have')).toHaveLength(2);
    expect(result.filter((f) => f.priority === 'should-have')).toHaveLength(2);
  });

  it('should skip nice-to-have prompt when all features are must-have', async () => {
    const mockPrompt = jest.mocked(inquirer.prompt);

    // Mock initial feature selection - select only 2 features
    mockPrompt.mockResolvedValueOnce({
      selectedFeatures: ['auth', 'crud'],
    });

    // Mock no custom features
    mockPrompt.mockResolvedValueOnce({
      hasCustomFeatures: false,
    });

    // Mock must-have selection - select all available features
    mockPrompt.mockResolvedValueOnce({
      mustHaveFeatures: ['auth', 'crud'],
    });

    const result = await features('web');

    // Should only call prompt 3 times (not 4) since nice-to-have is skipped
    expect(mockPrompt).toHaveBeenCalledTimes(3);
    expect(result).toHaveLength(2);
    expect(result.every((f) => f.priority === 'must-have')).toBe(true);
  });
});
