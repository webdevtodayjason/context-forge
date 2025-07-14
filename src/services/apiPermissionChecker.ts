import { EventEmitter } from 'events';
import chalk from 'chalk';

export interface APIEndpoint {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  requiredPermissions: string[];
  description: string;
}

export interface PermissionCheckResult {
  endpoint: string;
  hasPermission: boolean;
  missingPermissions: string[];
  errorMessage?: string;
}

export class APIPermissionChecker extends EventEmitter {
  private endpoints: Map<string, APIEndpoint> = new Map();
  private userPermissions: Set<string> = new Set();

  constructor() {
    super();
    this.loadCommonEndpoints();
  }

  /**
   * Register API endpoint with permission requirements
   */
  registerEndpoint(endpoint: APIEndpoint): void {
    const key = `${endpoint.method}:${endpoint.path}`;
    this.endpoints.set(key, endpoint);
    console.log(chalk.gray(`Registered API endpoint: ${key}`));
  }

  /**
   * Set user permissions
   */
  setUserPermissions(permissions: string[]): void {
    this.userPermissions.clear();
    permissions.forEach((perm) => this.userPermissions.add(perm));
    console.log(chalk.blue(`Set user permissions: ${permissions.join(', ')}`));
  }

  /**
   * Check if user has permission for API call
   */
  checkPermission(method: string, path: string): PermissionCheckResult {
    const key = `${method.toUpperCase()}:${path}`;
    const endpoint = this.endpoints.get(key);

    if (!endpoint) {
      // Unknown endpoint - allow by default but warn
      console.log(chalk.yellow(`Unknown API endpoint: ${key}`));
      return {
        endpoint: key,
        hasPermission: true,
        missingPermissions: [],
      };
    }

    const missingPermissions = endpoint.requiredPermissions.filter(
      (perm) => !this.userPermissions.has(perm)
    );

    const hasPermission = missingPermissions.length === 0;

    if (!hasPermission) {
      const errorMessage = `Access denied to ${key}. Missing permissions: ${missingPermissions.join(', ')}`;
      console.error(chalk.red(errorMessage));

      this.emit('permission-denied', {
        endpoint: key,
        missingPermissions,
        userPermissions: Array.from(this.userPermissions),
      });
    }

    return {
      endpoint: key,
      hasPermission,
      missingPermissions,
      errorMessage: hasPermission
        ? undefined
        : `Missing permissions: ${missingPermissions.join(', ')}`,
    };
  }

  /**
   * Validate multiple API calls
   */
  validateAPIAccess(calls: Array<{ method: string; path: string }>): PermissionCheckResult[] {
    return calls.map((call) => this.checkPermission(call.method, call.path));
  }

  /**
   * Generate permission report
   */
  generatePermissionReport(): string {
    const report = [
      `API Permission Report`,
      `User Permissions: ${Array.from(this.userPermissions).join(', ')}`,
      '',
    ];

    for (const [key, endpoint] of this.endpoints) {
      const result = this.checkPermission(endpoint.method, endpoint.path);
      const status = result.hasPermission ? '✅' : '❌';
      report.push(`${status} ${key} - ${endpoint.description}`);

      if (!result.hasPermission) {
        report.push(`   Missing: ${result.missingPermissions.join(', ')}`);
      }
    }

    return report.join('\n');
  }

  /**
   * Create permission middleware for express-like APIs
   */
  createMiddleware() {
    return (req: any, res: any, next: any) => {
      const result = this.checkPermission(req.method, req.path);

      if (!result.hasPermission) {
        return res.status(403).json({
          error: 'Insufficient permissions',
          required: result.missingPermissions,
          endpoint: result.endpoint,
        });
      }

      next();
    };
  }

  /**
   * Load common API endpoints and their permission requirements
   */
  private loadCommonEndpoints(): void {
    const commonEndpoints: APIEndpoint[] = [
      {
        path: '/api/v2/clients/:id/firewall',
        method: 'GET',
        requiredPermissions: ['firewall:read'],
        description: 'Read firewall configuration',
      },
      {
        path: '/api/v2/clients/:id/firewall',
        method: 'POST',
        requiredPermissions: ['firewall:write'],
        description: 'Update firewall configuration',
      },
      {
        path: '/api/v2/clients/:id/database',
        method: 'GET',
        requiredPermissions: ['database:read'],
        description: 'Read database configuration',
      },
      {
        path: '/api/v2/clients/:id/database',
        method: 'POST',
        requiredPermissions: ['database:write'],
        description: 'Update database configuration',
      },
      {
        path: '/api/v2/clients',
        method: 'GET',
        requiredPermissions: ['clients:list'],
        description: 'List all clients',
      },
      {
        path: '/api/v2/clients/:id',
        method: 'GET',
        requiredPermissions: ['clients:read'],
        description: 'Read client details',
      },
      {
        path: '/api/v2/clients/:id',
        method: 'PUT',
        requiredPermissions: ['clients:write'],
        description: 'Update client',
      },
      {
        path: '/api/v2/clients/:id',
        method: 'DELETE',
        requiredPermissions: ['clients:delete'],
        description: 'Delete client',
      },
    ];

    commonEndpoints.forEach((endpoint) => this.registerEndpoint(endpoint));
  }

  /**
   * Create permission checker for orchestration agents
   */
  static createForOrchestration(userRole: string): APIPermissionChecker {
    const checker = new APIPermissionChecker();

    // Define role-based permissions
    const rolePermissions: Record<string, string[]> = {
      admin: [
        'firewall:read',
        'firewall:write',
        'database:read',
        'database:write',
        'clients:list',
        'clients:read',
        'clients:write',
        'clients:delete',
      ],
      developer: ['firewall:read', 'database:read', 'clients:list', 'clients:read'],
      readonly: ['firewall:read', 'database:read', 'clients:list', 'clients:read'],
      guest: ['clients:list'],
    };

    const permissions = rolePermissions[userRole] || rolePermissions['guest'];
    checker.setUserPermissions(permissions);

    return checker;
  }
}
