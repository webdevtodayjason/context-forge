import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { KeyManager, AIProvider } from '../../services/keyManager';

export const aiKeysCommand = new Command('ai-keys')
  .description('Manage AI provider API keys for enhanced PRP generation')
  .option('--list', 'list stored API keys')
  .option('--remove <provider>', 'remove API key for specified provider')
  .option('--test <provider>', 'test API key for specified provider')
  .action(async (options) => {
    console.log(chalk.blue.bold('\n🔑 AI API Key Management\n'));

    // Handle list option
    if (options.list) {
      await KeyManager.listKeys();
      return;
    }

    // Handle remove option
    if (options.remove) {
      const provider = options.remove.toLowerCase() as AIProvider;
      if (!['openai', 'anthropic'].includes(provider)) {
        console.error(chalk.red(`Invalid provider: ${provider}. Use 'openai' or 'anthropic'`));
        process.exit(1);
      }
      await KeyManager.removeKey(provider);
      return;
    }

    // Handle test option
    if (options.test) {
      const provider = options.test.toLowerCase() as AIProvider;
      if (!['openai', 'anthropic'].includes(provider)) {
        console.error(chalk.red(`Invalid provider: ${provider}. Use 'openai' or 'anthropic'`));
        process.exit(1);
      }
      await testApiKey(provider);
      return;
    }

    // Interactive key setup
    await interactiveKeySetup();
  });

async function interactiveKeySetup(): Promise<void> {
  console.log(chalk.gray('Set up API keys for AI-powered PRP generation.\n'));
  
  // Show current status
  const availableProviders = await KeyManager.getAvailableProviders();
  if (availableProviders.length > 0) {
    console.log(chalk.blue('Currently configured providers:'));
    for (const provider of availableProviders) {
      console.log(chalk.green(`  ✓ ${provider}`));
    }
    console.log('');
  }

  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'What would you like to do?',
      choices: [
        { name: 'Add/Update OpenAI API key', value: 'openai' },
        { name: 'Add/Update Anthropic API key', value: 'anthropic' },
        { name: 'Test existing keys', value: 'test' },
        { name: 'View stored keys', value: 'list' },
        { name: 'Exit', value: 'exit' },
      ],
    },
  ]);

  switch (action) {
    case 'openai':
      await addApiKey('openai');
      break;
    case 'anthropic':
      await addApiKey('anthropic');
      break;
    case 'test':
      await testAllKeys();
      break;
    case 'list':
      await KeyManager.listKeys();
      break;
    case 'exit':
      console.log(chalk.blue('👋 Goodbye!'));
      return;
  }

  // Ask if user wants to continue
  const { continue: shouldContinue } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'continue',
      message: 'Would you like to perform another action?',
      default: false,
    },
  ]);

  if (shouldContinue) {
    await interactiveKeySetup();
  }
}

async function addApiKey(provider: AIProvider): Promise<void> {
  console.log(chalk.cyan(`\n📋 Setting up ${provider.toUpperCase()} API key\n`));

  // Show instructions for getting API key
  if (provider === 'openai') {
    console.log(chalk.gray('💡 Get your OpenAI API key from: https://platform.openai.com/api-keys'));
  } else if (provider === 'anthropic') {
    console.log(chalk.gray('💡 Get your Anthropic API key from: https://console.anthropic.com/'));
  }
  console.log('');

  const { apiKey } = await inquirer.prompt([
    {
      type: 'password',
      name: 'apiKey',
      message: `Enter your ${provider.toUpperCase()} API key:`,
      validate: (input) => {
        if (!input || input.trim().length === 0) {
          return 'API key cannot be empty';
        }
        
        // Basic format validation
        if (provider === 'openai' && !input.startsWith('sk-')) {
          return 'OpenAI API keys should start with "sk-"';
        }
        if (provider === 'anthropic' && !input.startsWith('sk-ant-')) {
          return 'Anthropic API keys should start with "sk-ant-"';
        }
        
        return true;
      },
    },
  ]);

  // Test the API key
  const spinner = ora('Testing API key...').start();
  const isValid = await KeyManager.testKey(provider, apiKey.trim());
  
  if (!isValid) {
    spinner.fail('API key test failed');
    console.log(chalk.red('❌ The API key appears to be invalid or there was a connection error.'));
    
    const { proceed } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'proceed',
        message: 'Would you like to store it anyway?',
        default: false,
      },
    ]);

    if (!proceed) {
      console.log(chalk.yellow('API key not stored.'));
      return;
    }
  } else {
    spinner.succeed('API key is valid');
  }

  // Store the key
  const storeSpinner = ora('Storing API key securely...').start();
  try {
    await KeyManager.storeKey(provider, apiKey.trim());
    await KeyManager.ensureGitignore();
    storeSpinner.succeed('API key stored securely');
    
    console.log(chalk.green(`\n✅ ${provider.toUpperCase()} API key configured successfully!`));
    console.log(chalk.blue('🚀 You can now use --ai-prp flag with context-forge init'));
    
  } catch (error) {
    storeSpinner.fail('Failed to store API key');
    console.error(chalk.red(`Error: ${error}`));
  }
}

async function testApiKey(provider: AIProvider): Promise<void> {
  console.log(chalk.cyan(`\n🧪 Testing ${provider.toUpperCase()} API key\n`));
  
  const spinner = ora(`Testing ${provider} connection...`).start();
  const isValid = await KeyManager.testKey(provider);
  
  if (isValid) {
    spinner.succeed(`${provider.toUpperCase()} API key is working`);
    console.log(chalk.green(`✅ ${provider.toUpperCase()} API connection successful`));
  } else {
    spinner.fail(`${provider.toUpperCase()} API key test failed`);
    
    const hasKey = await KeyManager.hasKey(provider);
    if (!hasKey) {
      console.log(chalk.yellow(`⚠️  No ${provider.toUpperCase()} API key found`));
      console.log(chalk.gray(`Run: context-forge ai-keys to add one`));
    } else {
      console.log(chalk.red(`❌ ${provider.toUpperCase()} API key appears to be invalid`));
      console.log(chalk.gray('The key might be expired, invalid, or there might be a network issue'));
    }
  }
}

async function testAllKeys(): Promise<void> {
  console.log(chalk.cyan('\n🧪 Testing all stored API keys\n'));
  
  const providers: AIProvider[] = ['openai', 'anthropic'];
  
  for (const provider of providers) {
    if (await KeyManager.hasKey(provider)) {
      await testApiKey(provider);
    } else {
      console.log(chalk.gray(`⏭️  No ${provider.toUpperCase()} API key stored`));
    }
  }
  
  console.log('\n');
}