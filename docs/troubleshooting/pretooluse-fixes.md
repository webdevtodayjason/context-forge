# PreToolUse Issues - Diagnosis and Solutions

## Issue Summary

You were experiencing two main issues in your clientsync2 project:

1. **Firewall Section Data Inconsistency**: `hasData: true` but `sectionData: {}` (empty object)
2. **Python Hook Permission Denied**: PreToolUse hooks failing with status code 126

## Root Causes Identified

### 1. React State Inconsistency

**Problem**: JavaScript treats empty objects as truthy, causing logic errors:

```javascript
// Problematic code
const hasData = Boolean(sectionData); // {} evaluates to true!
```

**Solution**: Check actual data presence:

```javascript
// Correct approach
const hasData = Object.keys(sectionData || {}).length > 0;
```

### 2. Python Hook Execution Issues

**Problem**: Multiple factors causing Python hooks to fail:
- Permission denied errors (status code 126)
- Hooks hanging or timing out
- Missing proper execution environment

## Solutions Implemented

### 1. API Permission Checker

Created `APIPermissionChecker` service to:
- Validate API access before making calls
- Provide clear permission error messages
- Support role-based permission models
- Generate permission reports

```typescript
const checker = APIPermissionChecker.createForOrchestration('developer');
const result = checker.checkPermission('GET', '/api/v2/clients/123/firewall');

if (!result.hasPermission) {
  console.error(`Access denied: ${result.errorMessage}`);
}
```

### 2. Hook Manager Service

Created `HookManager` to handle all hook types:
- Validates Python, JavaScript, and shell hooks
- Provides timeout and error handling
- Can disable problematic hooks
- Supports multiple execution strategies

```typescript
const hookManager = new HookManager();
await hookManager.initialize();

// Disable problematic Python hooks
hookManager.disablePythonHooks();

// Execute hooks safely
const result = await hookManager.executeHook('api-endpoint-verifier', ['GET', '/api/firewall']);
```

## Quick Fixes for Your Project

### For Firewall Section (InfrastructureManager.tsx)

```typescript
// Replace the data validation logic
const processFirewallData = (response: any) => {
  const data = response?.data || response || {};
  const dataKeys = Object.keys(data);
  
  return {
    isLoading: false,
    error: null,
    sectionData: data,
    hasData: dataKeys.length > 0,  // Derive from actual data
    dataKeys
  };
};

// Add validation before rendering
const renderFirewallSection = () => {
  if (state.hasData && state.dataKeys.length === 0) {
    console.warn('State inconsistency detected');
    return <div>No firewall data available</div>;
  }
  
  return state.hasData ? <FirewallData /> : <EmptyState />;
};
```

### For Python Hook Issues

**Option 1: Disable Python hooks temporarily**
```bash
cd ~/.claude/hooks
find . -name "*.py" -exec chmod -x {} \;
```

**Option 2: Use JavaScript hooks instead**
```javascript
// Create ~/.claude/hooks/api-permission-check.js
module.exports = function(endpoint, method) {
  // Your permission checking logic here
  return { hasPermission: true, data: {} };
};
```

**Option 3: Fix Python hook shebangs**
```bash
cd ~/.claude/hooks
for file in *.py; do
  if ! head -1 "$file" | grep -q "#!/usr/bin/env python3"; then
    echo "#!/usr/bin/env python3" | cat - "$file" > temp && mv temp "$file"
    chmod +x "$file"
  fi
done
```

## Integration with Context Forge Orchestration

The orchestration system now includes:

1. **Permission-Aware Agents**: Agents check API permissions before making calls
2. **Hook Validation**: Validates all hooks before deployment
3. **Error Recovery**: Graceful handling of permission issues
4. **Monitoring**: Tracks permission-related errors

```typescript
// In orchestration deployment
const permissionChecker = APIPermissionChecker.createForOrchestration(agentRole);
const hookManager = new HookManager();

// Validate permissions before deploying agents
const requiredAPIs = [
  { method: 'GET', path: '/api/v2/clients/:id/firewall' },
  { method: 'POST', path: '/api/v2/clients/:id/database' }
];

const permissionResults = permissionChecker.validateAPIAccess(requiredAPIs);
const hasAllPermissions = permissionResults.every(r => r.hasPermission);

if (!hasAllPermissions) {
  console.error('Agent deployment blocked due to insufficient permissions');
  // Handle permission issues
}
```

## Prevention Strategies

### 1. Type Safety
```typescript
interface FirewallData {
  rules: Array<any>;
  enabled: boolean;
}

// Use proper typing instead of generic objects
const hasData = (data: FirewallData | null): data is FirewallData => {
  return data !== null && data.rules.length > 0;
};
```

### 2. Hook Testing
```bash
# Test hooks before deployment
cd ~/.claude/hooks
python3 api-endpoint-verifier.py --test
```

### 3. Permission Validation
```typescript
// Always validate permissions in PreToolUse hooks
export default function(toolName, args, context) {
  const permissionChecker = new APIPermissionChecker();
  permissionChecker.setUserPermissions(context.user.permissions);
  
  const result = permissionChecker.checkPermission('GET', args.endpoint);
  if (!result.hasPermission) {
    return { error: result.errorMessage };
  }
  
  // Proceed with API call
}
```

## Monitoring and Debugging

### Enable Debug Logging
```bash
export DEBUG=hooks:*,api:*,orchestration:*
context-forge orchestrate
```

### Check Hook Status
```typescript
const hookManager = new HookManager();
await hookManager.initialize();
console.log(hookManager.getHookStatus());
```

### Validate API Permissions
```typescript
const checker = APIPermissionChecker.createForOrchestration('your-role');
console.log(checker.generatePermissionReport());
```

## Conclusion

These solutions address both the immediate React state issues and the broader PreToolUse hook problems. The Context Forge orchestration system now includes robust permission checking and hook management to prevent these issues in autonomous AI teams.

**Key Takeaways**:
1. Always validate actual data presence, not just object truthiness
2. Implement proper permission checking before API calls
3. Use hook managers to handle execution issues gracefully
4. Add monitoring and debugging capabilities for troubleshooting