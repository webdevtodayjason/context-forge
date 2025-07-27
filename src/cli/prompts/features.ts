import inquirer from 'inquirer';
import { Feature } from '../../types';

interface FeatureChoice {
  name: string;
  value: string;
  checked?: boolean;
  disabled?: boolean;
}

export async function features(projectType: string): Promise<Feature[]> {
  console.log('\n✨ Select core features for your MVP:\n');

  const featureChoices = getFeatureChoices(projectType);

  const { selectedFeatures } = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'selectedFeatures',
      message: 'Select features (use space to select, enter to confirm):',
      choices: featureChoices,
      validate: (input) => input.length > 0 || 'Please select at least one feature',
    },
  ]);

  // Map selected feature IDs to full Feature objects
  const selectedFeatureObjects: Feature[] = selectedFeatures.map((featureId: string) => {
    const featureData = getFeatureData(featureId);
    return featureData;
  });

  // Ask about custom features
  const { hasCustomFeatures } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'hasCustomFeatures',
      message: 'Do you want to add custom features?',
      default: false,
    },
  ]);

  if (hasCustomFeatures) {
    const customFeatures = await addCustomFeatures();
    selectedFeatureObjects.push(...customFeatures);
  }

  // Prioritize features
  console.log("\n🎯 Let's prioritize your features:\n");
  const prioritizedFeatures = await prioritizeFeatures(selectedFeatureObjects);

  return prioritizedFeatures;
}

function getFeatureChoices(projectType: string): FeatureChoice[] {
  const commonFeatures: FeatureChoice[] = [
    { name: 'User Authentication & Authorization', value: 'auth', checked: true, disabled: false },
    { name: 'User Dashboard', value: 'dashboard', disabled: false },
    { name: 'CRUD Operations', value: 'crud', checked: true, disabled: false },
    { name: 'File Upload/Management', value: 'file-upload', disabled: false },
    { name: 'Real-time Updates (WebSocket)', value: 'realtime', disabled: false },
    { name: 'Email Notifications', value: 'email', disabled: false },
    { name: 'Search Functionality', value: 'search', disabled: false },
    { name: 'Data Export/Import', value: 'data-io', disabled: false },
    { name: 'Multi-language Support', value: 'i18n', disabled: false },
    { name: 'Dark Mode', value: 'dark-mode', disabled: false },
    { name: 'User Profile Management', value: 'profile', disabled: false },
    { name: 'Settings/Preferences', value: 'settings', disabled: false },
  ];

  const apiFeatures: FeatureChoice[] = [
    { name: 'RESTful API Endpoints', value: 'rest-api', checked: true, disabled: false },
    { name: 'GraphQL API', value: 'graphql', disabled: false },
    {
      name: 'API Documentation (Swagger/OpenAPI)',
      value: 'api-docs',
      checked: true,
      disabled: false,
    },
    { name: 'API Rate Limiting', value: 'rate-limiting', disabled: false },
    { name: 'API Versioning', value: 'api-versioning', disabled: false },
    { name: 'Webhook Support', value: 'webhooks', disabled: false },
  ];

  const webFeatures: FeatureChoice[] = [
    { name: 'Responsive Design', value: 'responsive', checked: true, disabled: false },
    { name: 'Progressive Web App (PWA)', value: 'pwa', disabled: false },
    { name: 'SEO Optimization', value: 'seo', disabled: false },
    { name: 'Analytics Integration', value: 'analytics', disabled: false },
    { name: 'Social Media Integration', value: 'social', disabled: false },
  ];

  const enterpriseFeatures: FeatureChoice[] = [
    { name: 'Admin Panel', value: 'admin', disabled: false },
    { name: 'Role-Based Access Control (RBAC)', value: 'rbac', disabled: false },
    { name: 'Audit Logging', value: 'audit', disabled: false },
    { name: 'Payment Processing', value: 'payment', disabled: false },
    { name: 'Subscription Management', value: 'subscription', disabled: false },
    { name: 'Multi-tenancy', value: 'multi-tenant', disabled: false },
  ];

  // Return features based on project type
  switch (projectType) {
    case 'api':
      return [...commonFeatures, ...apiFeatures];
    case 'web':
      return [...commonFeatures, ...webFeatures, ...enterpriseFeatures];
    case 'fullstack':
      return [...commonFeatures, ...apiFeatures, ...webFeatures, ...enterpriseFeatures];
    case 'mobile':
      return commonFeatures.filter((f) => !['seo', 'pwa'].includes(f.value));
    default:
      return commonFeatures;
  }
}

function getFeatureData(featureId: string): Feature {
  const featureMap: Record<string, Feature> = {
    auth: {
      id: 'auth',
      name: 'User Authentication & Authorization',
      description: 'Secure user registration, login, and access control',
      priority: 'must-have',
      complexity: 'medium',
      category: 'auth',
      subtasks: [
        'User registration flow',
        'Login/logout functionality',
        'Password reset mechanism',
        'JWT token management',
        'Session handling',
      ],
    },
    dashboard: {
      id: 'dashboard',
      name: 'User Dashboard',
      description: 'Personalized dashboard with key metrics and actions',
      priority: 'should-have',
      complexity: 'medium',
      category: 'ui',
      subtasks: [
        'Dashboard layout design',
        'Widget system',
        'Data visualization',
        'Quick actions panel',
      ],
      dependencies: ['auth'],
    },
    crud: {
      id: 'crud',
      name: 'CRUD Operations',
      description: 'Create, Read, Update, Delete functionality for core entities',
      priority: 'must-have',
      complexity: 'simple',
      category: 'data',
      subtasks: [
        'Create forms',
        'List views with pagination',
        'Detail views',
        'Edit functionality',
        'Delete with confirmation',
      ],
    },
    'file-upload': {
      id: 'file-upload',
      name: 'File Upload/Management',
      description: 'Upload, store, and manage user files',
      priority: 'should-have',
      complexity: 'medium',
      category: 'data',
      subtasks: [
        'File upload interface',
        'File validation',
        'Storage integration',
        'File preview',
        'Download functionality',
      ],
    },
    realtime: {
      id: 'realtime',
      name: 'Real-time Updates',
      description: 'WebSocket-based real-time data synchronization',
      priority: 'nice-to-have',
      complexity: 'complex',
      category: 'integration',
      subtasks: [
        'WebSocket server setup',
        'Client-side socket handling',
        'Event system',
        'Reconnection logic',
        'Real-time notifications',
      ],
    },
    email: {
      id: 'email',
      name: 'Email Notifications',
      description: 'Transactional and notification emails',
      priority: 'should-have',
      complexity: 'simple',
      category: 'integration',
      subtasks: [
        'Email service integration',
        'Email templates',
        'Notification preferences',
        'Email queue system',
      ],
    },
    search: {
      id: 'search',
      name: 'Search Functionality',
      description: 'Full-text search across entities',
      priority: 'should-have',
      complexity: 'medium',
      category: 'data',
      subtasks: [
        'Search interface',
        'Search indexing',
        'Filters and facets',
        'Search results display',
      ],
    },
    admin: {
      id: 'admin',
      name: 'Admin Panel',
      description: 'Administrative interface for system management',
      priority: 'should-have',
      complexity: 'complex',
      category: 'ui',
      subtasks: [
        'Admin authentication',
        'User management',
        'System settings',
        'Analytics dashboard',
        'Content moderation',
      ],
      dependencies: ['auth', 'rbac'],
    },
    payment: {
      id: 'payment',
      name: 'Payment Processing',
      description: 'Accept and process payments',
      priority: 'nice-to-have',
      complexity: 'complex',
      category: 'integration',
      subtasks: [
        'Payment gateway integration',
        'Checkout flow',
        'Payment method management',
        'Invoice generation',
        'Refund handling',
      ],
    },
    'rest-api': {
      id: 'rest-api',
      name: 'RESTful API',
      description: 'Well-structured REST API endpoints',
      priority: 'must-have',
      complexity: 'medium',
      category: 'infrastructure',
      subtasks: [
        'API route structure',
        'Request validation',
        'Response formatting',
        'Error handling',
        'API authentication',
      ],
    },
    'api-docs': {
      id: 'api-docs',
      name: 'API Documentation',
      description: 'Interactive API documentation',
      priority: 'must-have',
      complexity: 'simple',
      category: 'infrastructure',
      subtasks: [
        'OpenAPI/Swagger setup',
        'Endpoint documentation',
        'Example requests/responses',
        'Authentication docs',
      ],
      dependencies: ['rest-api'],
    },
  };

  // Return feature data or create a basic one if not found
  return (
    featureMap[featureId] || {
      id: featureId,
      name: featureId.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
      description: 'Custom feature',
      priority: 'should-have',
      complexity: 'medium',
      category: 'ui',
    }
  );
}

async function addCustomFeatures(): Promise<Feature[]> {
  const customFeatures: Feature[] = [];
  let addMore = true;

  while (addMore) {
    const customFeature = await inquirer.prompt([
      {
        type: 'input',
        name: 'name',
        message: 'Feature name:',
        validate: (input) => input.length > 2 || 'Feature name must be at least 3 characters',
      },
      {
        type: 'input',
        name: 'description',
        message: 'Feature description:',
        validate: (input) => input.length > 10 || 'Please provide a meaningful description',
      },
      {
        type: 'list',
        name: 'complexity',
        message: 'Feature complexity:',
        choices: [
          { name: 'Simple (1-2 days)', value: 'simple' },
          { name: 'Medium (3-5 days)', value: 'medium' },
          { name: 'Complex (1-2 weeks)', value: 'complex' },
        ],
      },
      {
        type: 'list',
        name: 'category',
        message: 'Feature category:',
        choices: [
          { name: 'Authentication', value: 'auth' },
          { name: 'User Interface', value: 'ui' },
          { name: 'Data Management', value: 'data' },
          { name: 'Integration', value: 'integration' },
          { name: 'Infrastructure', value: 'infrastructure' },
        ],
      },
    ]);

    const feature: Feature = {
      id: customFeature.name.toLowerCase().replace(/\s+/g, '-'),
      name: customFeature.name,
      description: customFeature.description,
      priority: 'should-have',
      complexity: customFeature.complexity,
      category: customFeature.category,
    };

    customFeatures.push(feature);

    const { continueAdding } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'continueAdding',
        message: 'Add another custom feature?',
        default: false,
      },
    ]);

    addMore = continueAdding;
  }

  return customFeatures;
}

async function prioritizeFeatures(features: Feature[]): Promise<Feature[]> {
  const priorityChoices = features.map((f) => ({
    name: `${f.name} (${f.complexity})`,
    value: f.id,
    disabled: false,
  }));

  const { mustHaveFeatures } = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'mustHaveFeatures',
      message: 'Which features are MUST-HAVE for the MVP?',
      choices: priorityChoices,
      default: features.filter((f) => f.priority === 'must-have').map((f) => f.id),
    },
  ]);

  const { niceToHaveFeatures } = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'niceToHaveFeatures',
      message: 'Which features are NICE-TO-HAVE (can be added later)?',
      choices: priorityChoices
        .filter((c) => !mustHaveFeatures.includes(c.value))
        .map((c) => ({ ...c, disabled: false })),
    },
  ]);

  // Update priorities based on user selection
  return features.map((feature) => ({
    ...feature,
    priority: mustHaveFeatures.includes(feature.id)
      ? 'must-have'
      : niceToHaveFeatures.includes(feature.id)
        ? 'nice-to-have'
        : 'should-have',
  }));
}
