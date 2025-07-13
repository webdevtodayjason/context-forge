import { ProjectConfig } from '../types';
import { GeneratedFile } from '../adapters/base';
import path from 'path';

export async function generateMigrationHooks(config: ProjectConfig): Promise<GeneratedFile[]> {
  const files: GeneratedFile[] = [];

  if (!config.migrationConfig || !config.extras.hooks) {
    return files;
  }

  // Generate migration checkpoint hook
  files.push({
    path: path.join('.claude', 'hooks', 'MigrationCheckpoint.py'),
    content: generateMigrationCheckpointHook(config),
    description: 'Hook for automatic migration checkpoints',
  });

  // Generate data integrity check hook
  files.push({
    path: path.join('.claude', 'hooks', 'DataIntegrityCheck.py'),
    content: generateDataIntegrityCheckHook(config),
    description: 'Hook for validating data integrity during migration',
  });

  // Generate dual system monitor hook
  files.push({
    path: path.join('.claude', 'hooks', 'DualSystemMonitor.py'),
    content: generateDualSystemMonitorHook(config),
    description: 'Hook for monitoring both systems during parallel run',
  });

  // Generate migration validation hook
  files.push({
    path: path.join('.claude', 'hooks', 'MigrationValidation.py'),
    content: generateMigrationValidationHook(config),
    description: 'Hook for continuous migration validation',
  });

  return files;
}

function generateMigrationCheckpointHook(config: ProjectConfig): string {
  const migration = config.migrationConfig!;

  return `#!/usr/bin/env python3
"""
Migration Checkpoint Hook
Creates automatic checkpoints at critical migration milestones
"""

import os
import sys
import json
import subprocess
from datetime import datetime
from typing import Dict, List, Optional, Tuple

class MigrationCheckpointHook:
    def __init__(self):
        self.config = self._load_migration_config()
        self.checkpoint_triggers = ${JSON.stringify(
          migration.checkpoints?.map((cp) => ({
            phaseId: cp.phaseId,
            name: cp.name,
            requiresApproval: cp.requiresApproval,
          })) || [],
          null,
          2
        )
          .split('\n')
          .map((line) => (line ? '        ' + line : line))
          .join('\n')
          .trim()}
        
    def _load_migration_config(self) -> Dict:
        """Load migration configuration from project"""
        try:
            with open('.migration/config.json', 'r') as f:
                return json.load(f)
        except FileNotFoundError:
            return {
                'currentPhase': 'unknown',
                'checkpointsEnabled': True
            }
    
    def should_trigger(self, context: Dict) -> bool:
        """Check if checkpoint should be triggered based on context"""
        # Check for migration-related commands
        command = context.get('command', '')
        migration_commands = [
            'migration', 'migrate', 'rollback', 'checkpoint',
            'database', 'schema', 'data-transfer'
        ]
        
        if any(cmd in command.lower() for cmd in migration_commands):
            return True
        
        # Check for phase completion indicators
        if 'phase complete' in context.get('message', '').lower():
            return True
        
        # Check for critical file changes
        critical_files = [
            'database/migrations/',
            'config/database.',
            '.env',
            'docker-compose',
            'package.json',
            'requirements.txt'
        ]
        
        changed_files = context.get('changed_files', [])
        for file in changed_files:
            if any(critical in file for critical in critical_files):
                return True
        
        return False
    
    def create_checkpoint(self, reason: str) -> Tuple[bool, str]:
        """Create a migration checkpoint"""
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        checkpoint_id = f"auto_{timestamp}"
        
        print(f"\\n🔄 Creating automatic migration checkpoint: {checkpoint_id}")
        print(f"   Reason: {reason}")
        
        # Check if approval needed
        current_phase = self.config.get('currentPhase', 'unknown')
        needs_approval = any(
            cp['requiresApproval'] 
            for cp in self.checkpoint_triggers 
            if cp['phaseId'] == current_phase
        )
        
        if needs_approval:
            response = input("\\n⚠️  This checkpoint requires approval. Continue? (y/N): ")
            if response.lower() != 'y':
                return False, "Checkpoint cancelled by user"
        
        # Create checkpoint
        try:
            result = subprocess.run(
                ['npm', 'run', 'migration:checkpoint', '--', '--id', checkpoint_id, '--reason', reason],
                capture_output=True,
                text=True,
                timeout=60
            )
            
            if result.returncode == 0:
                self._log_checkpoint(checkpoint_id, reason)
                return True, f"Checkpoint {checkpoint_id} created successfully"
            else:
                return False, f"Checkpoint failed: {result.stderr}"
                
        except subprocess.TimeoutExpired:
            return False, "Checkpoint creation timed out"
        except Exception as e:
            return False, f"Checkpoint error: {str(e)}"
    
    def _log_checkpoint(self, checkpoint_id: str, reason: str):
        """Log checkpoint to migration history"""
        log_entry = {
            'id': checkpoint_id,
            'timestamp': datetime.now().isoformat(),
            'reason': reason,
            'phase': self.config.get('currentPhase', 'unknown'),
            'automatic': True
        }
        
        log_file = '.migration/checkpoint-log.json'
        
        try:
            # Read existing log
            if os.path.exists(log_file):
                with open(log_file, 'r') as f:
                    log_data = json.load(f)
            else:
                log_data = {'checkpoints': []}
            
            # Append new entry
            log_data['checkpoints'].append(log_entry)
            
            # Write updated log
            os.makedirs(os.path.dirname(log_file), exist_ok=True)
            with open(log_file, 'w') as f:
                json.dump(log_data, f, indent=2)
                
        except Exception as e:
            print(f"Warning: Failed to log checkpoint: {e}")
    
    def run(self, context: Dict) -> Dict:
        """Main hook execution"""
        if not self.should_trigger(context):
            return {'continue': True}
        
        # Determine checkpoint reason
        command = context.get('command', '')
        if 'phase complete' in context.get('message', '').lower():
            reason = f"Phase completion: {self.config.get('currentPhase', 'unknown')}"
        elif 'database' in command.lower():
            reason = "Database changes detected"
        elif any(f in str(context.get('changed_files', [])) for f in ['.env', 'config']):
            reason = "Configuration changes detected"
        else:
            reason = f"Migration milestone: {command}"
        
        # Create checkpoint
        success, message = self.create_checkpoint(reason)
        
        if success:
            print(f"✅ {message}")
        else:
            print(f"❌ {message}")
            # Ask if should continue despite failure
            response = input("\\nContinue without checkpoint? (y/N): ")
            if response.lower() != 'y':
                return {'continue': False, 'message': 'Aborted due to checkpoint failure'}
        
        return {'continue': True}

if __name__ == '__main__':
    # Read context from stdin
    context = json.loads(sys.stdin.read())
    
    # Run hook
    hook = MigrationCheckpointHook()
    result = hook.run(context)
    
    # Output result
    print(json.dumps(result))
`;
}

function generateDataIntegrityCheckHook(config: ProjectConfig): string {
  const migration = config.migrationConfig!;
  const hasDatabase = migration.sharedResources.some((r) => r.type === 'database');

  return `#!/usr/bin/env python3
"""
Data Integrity Check Hook
Validates data consistency between old and new systems during migration
"""

import os
import sys
import json
import subprocess
import hashlib
from datetime import datetime
from typing import Dict, List, Optional, Tuple

class DataIntegrityCheckHook:
    def __init__(self):
        self.config = self._load_config()
        self.critical_tables = self._get_critical_tables()
        self.check_frequency = 3600  # Check every hour
        self.last_check = self._get_last_check_time()
        
    def _load_config(self) -> Dict:
        """Load database configuration"""
        config = {
            'old_db_url': os.environ.get('OLD_DATABASE_URL', ''),
            'new_db_url': os.environ.get('NEW_DATABASE_URL', ''),
            'shared_db': ${hasDatabase ? 'True' : 'False'},
            'tables': []
        }
        
        # Load table list from config if exists
        try:
            with open('.migration/db-tables.json', 'r') as f:
                table_config = json.load(f)
                config['tables'] = table_config.get('tables', [])
        except FileNotFoundError:
            pass
            
        return config
    
    def _get_critical_tables(self) -> List[str]:
        """Get list of critical tables to monitor"""
        # Default critical tables
        critical = ['users', 'orders', 'payments', 'sessions', 'permissions']
        
        # Add configured tables
        if self.config.get('tables'):
            critical.extend(self.config['tables'])
            
        return list(set(critical))  # Remove duplicates
    
    def _get_last_check_time(self) -> float:
        """Get timestamp of last integrity check"""
        try:
            with open('.migration/last-integrity-check', 'r') as f:
                return float(f.read().strip())
        except:
            return 0
    
    def should_trigger(self, context: Dict) -> bool:
        """Check if integrity check should run"""
        # Always check on data-related operations
        data_operations = ['INSERT', 'UPDATE', 'DELETE', 'migration', 'sync', 'transfer']
        command = context.get('command', '').upper()
        
        if any(op in command for op in data_operations):
            return True
        
        # Check based on frequency
        current_time = datetime.now().timestamp()
        if current_time - self.last_check > self.check_frequency:
            return True
            
        return False
    
    def check_row_counts(self) -> Dict[str, Dict]:
        """Compare row counts between systems"""
        results = {}
        
        if self.config['shared_db']:
            # For shared database, just verify table accessibility
            for table in self.critical_tables:
                try:
                    cmd = f"psql {self.config['new_db_url']} -c 'SELECT COUNT(*) FROM {table}' -t"
                    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
                    count = int(result.stdout.strip()) if result.returncode == 0 else -1
                    
                    results[table] = {
                        'count': count,
                        'status': 'ok' if count >= 0 else 'error',
                        'shared': True
                    }
                except Exception as e:
                    results[table] = {
                        'count': -1,
                        'status': 'error',
                        'error': str(e)
                    }
        else:
            # Compare counts between old and new databases
            for table in self.critical_tables:
                old_count = self._get_table_count(self.config['old_db_url'], table)
                new_count = self._get_table_count(self.config['new_db_url'], table)
                
                results[table] = {
                    'old_count': old_count,
                    'new_count': new_count,
                    'difference': abs(old_count - new_count),
                    'status': 'ok' if old_count == new_count else 'mismatch'
                }
                
        return results
    
    def _get_table_count(self, db_url: str, table: str) -> int:
        """Get row count for a specific table"""
        try:
            cmd = f"psql {db_url} -c 'SELECT COUNT(*) FROM {table}' -t"
            result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
            return int(result.stdout.strip()) if result.returncode == 0 else -1
        except:
            return -1
    
    def check_data_checksums(self, sample_size: int = 1000) -> Dict[str, Dict]:
        """Compare data checksums between systems"""
        results = {}
        
        if self.config['shared_db']:
            return {'status': 'skipped', 'reason': 'shared database'}
        
        for table in self.critical_tables[:3]:  # Limit to avoid performance impact
            old_checksum = self._calculate_table_checksum(
                self.config['old_db_url'], table, sample_size
            )
            new_checksum = self._calculate_table_checksum(
                self.config['new_db_url'], table, sample_size
            )
            
            results[table] = {
                'old_checksum': old_checksum,
                'new_checksum': new_checksum,
                'match': old_checksum == new_checksum and old_checksum is not None
            }
            
        return results
    
    def _calculate_table_checksum(self, db_url: str, table: str, limit: int) -> Optional[str]:
        """Calculate checksum for table data"""
        try:
            # Get sample of data ordered by primary key
            cmd = f"psql {db_url} -c 'SELECT * FROM {table} ORDER BY id LIMIT {limit}' -A -t"
            result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
            
            if result.returncode == 0:
                # Calculate checksum of data
                data_hash = hashlib.sha256(result.stdout.encode()).hexdigest()
                return data_hash[:16]  # Use first 16 chars
            return None
        except:
            return None
    
    def generate_report(self, checks: Dict) -> str:
        """Generate integrity check report"""
        report = f"""
Data Integrity Check Report
==========================
Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
Database Mode: {'Shared' if self.config['shared_db'] else 'Separate'}

Row Count Analysis
-----------------
"""
        
        if 'row_counts' in checks:
            for table, data in checks['row_counts'].items():
                if self.config['shared_db']:
                    report += f"\\n{table}: {data['count']} rows ({data['status']})"
                else:
                    report += f"\\n{table}:"
                    report += f"\\n  Old: {data['old_count']} rows"
                    report += f"\\n  New: {data['new_count']} rows"
                    report += f"\\n  Difference: {data['difference']} ({data['status']})"
        
        if 'checksums' in checks and not self.config['shared_db']:
            report += "\\n\\nData Checksum Verification\\n"
            report += "--------------------------\\n"
            for table, data in checks['checksums'].items():
                status = "✅ MATCH" if data['match'] else "❌ MISMATCH"
                report += f"\\n{table}: {status}"
                if not data['match']:
                    report += f"\\n  Old: {data['old_checksum']}"
                    report += f"\\n  New: {data['new_checksum']}"
        
        return report
    
    def run(self, context: Dict) -> Dict:
        """Main hook execution"""
        if not self.should_trigger(context):
            return {'continue': True}
        
        print("\\n🔍 Running data integrity checks...")
        
        # Perform checks
        checks = {
            'row_counts': self.check_row_counts()
        }
        
        # Only do checksum comparison for non-shared databases
        if not self.config['shared_db']:
            checks['checksums'] = self.check_data_checksums()
        
        # Generate report
        report = self.generate_report(checks)
        print(report)
        
        # Check for critical issues
        critical_issues = []
        
        for table, data in checks['row_counts'].items():
            if data['status'] == 'error':
                critical_issues.append(f"Cannot access table: {table}")
            elif not self.config['shared_db'] and data.get('difference', 0) > 0:
                critical_issues.append(
                    f"Row count mismatch in {table}: {data['difference']} rows"
                )
        
        if 'checksums' in checks:
            for table, data in checks['checksums'].items():
                if not data['match']:
                    critical_issues.append(f"Data mismatch in {table}")
        
        # Update last check time
        os.makedirs('.migration', exist_ok=True)
        with open('.migration/last-integrity-check', 'w') as f:
            f.write(str(datetime.now().timestamp()))
        
        # Save detailed report
        report_file = f".migration/integrity-reports/{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        os.makedirs(os.path.dirname(report_file), exist_ok=True)
        with open(report_file, 'w') as f:
            json.dump({
                'timestamp': datetime.now().isoformat(),
                'checks': checks,
                'issues': critical_issues
            }, f, indent=2)
        
        # Handle critical issues
        if critical_issues:
            print(f"\\n❌ Found {len(critical_issues)} critical issues:")
            for issue in critical_issues:
                print(f"   - {issue}")
            
            response = input("\\nContinue despite issues? (y/N): ")
            if response.lower() != 'y':
                return {
                    'continue': False,
                    'message': 'Aborted due to data integrity issues'
                }
        else:
            print("\\n✅ All integrity checks passed")
        
        return {'continue': True}

if __name__ == '__main__':
    # Read context from stdin
    context = json.loads(sys.stdin.read())
    
    # Run hook
    hook = DataIntegrityCheckHook()
    result = hook.run(context)
    
    # Output result
    print(json.dumps(result))
`;
}

function generateDualSystemMonitorHook(config: ProjectConfig): string {
  const migration = config.migrationConfig!;

  return `#!/usr/bin/env python3
"""
Dual System Monitor Hook
Monitors both old and new systems during parallel-run migration
"""

import os
import sys
import json
import subprocess
import requests
import time
from datetime import datetime
from typing import Dict, List, Optional, Tuple

class DualSystemMonitorHook:
    def __init__(self):
        self.config = {
            'old_system_url': os.environ.get('OLD_SYSTEM_URL', 'http://localhost:3000'),
            'new_system_url': os.environ.get('NEW_SYSTEM_URL', 'http://localhost:4000'),
            'health_endpoint': '/health',
            'metrics_endpoint': '/metrics',
            'comparison_threshold': 0.1,  # 10% difference threshold
            'alert_on_divergence': True
        }
        self.metrics_history = self._load_metrics_history()
        
    def _load_metrics_history(self) -> List[Dict]:
        """Load historical metrics for trend analysis"""
        try:
            with open('.migration/metrics-history.json', 'r') as f:
                return json.load(f)
        except:
            return []
    
    def should_trigger(self, context: Dict) -> bool:
        """Check if monitoring should run"""
        # Monitor on all operations during parallel run
        if self._is_parallel_run_active():
            return True
            
        # Always monitor on deployment or configuration changes
        triggers = ['deploy', 'config', 'restart', 'scale', 'rollout']
        command = context.get('command', '').lower()
        
        return any(trigger in command for trigger in triggers)
    
    def _is_parallel_run_active(self) -> bool:
        """Check if parallel run migration is active"""
        try:
            with open('.migration/config.json', 'r') as f:
                config = json.load(f)
                return config.get('strategy') == 'parallel-run' and \\
                       config.get('status') == 'active'
        except:
            return False
    
    def check_system_health(self) -> Dict[str, Dict]:
        """Check health of both systems"""
        results = {}
        
        for system, url in [('old', self.config['old_system_url']), 
                           ('new', self.config['new_system_url'])]:
            try:
                response = requests.get(
                    f"{url}{self.config['health_endpoint']}",
                    timeout=5
                )
                
                results[system] = {
                    'status': 'healthy' if response.status_code == 200 else 'unhealthy',
                    'response_time': response.elapsed.total_seconds() * 1000,
                    'status_code': response.status_code,
                    'details': response.json() if response.status_code == 200 else {}
                }
            except requests.exceptions.RequestException as e:
                results[system] = {
                    'status': 'unreachable',
                    'error': str(e)
                }
                
        return results
    
    def compare_metrics(self) -> Dict[str, Dict]:
        """Compare key metrics between systems"""
        metrics = {}
        
        for system, url in [('old', self.config['old_system_url']), 
                           ('new', self.config['new_system_url'])]:
            try:
                response = requests.get(
                    f"{url}{self.config['metrics_endpoint']}",
                    timeout=5
                )
                
                if response.status_code == 200:
                    data = response.json()
                    metrics[system] = {
                        'requests_per_second': data.get('rps', 0),
                        'average_response_time': data.get('avg_response_ms', 0),
                        'error_rate': data.get('error_rate', 0),
                        'memory_usage_mb': data.get('memory_mb', 0),
                        'cpu_usage_percent': data.get('cpu_percent', 0),
                        'active_connections': data.get('connections', 0)
                    }
                else:
                    metrics[system] = self._get_system_metrics_fallback(system)
            except:
                metrics[system] = self._get_system_metrics_fallback(system)
        
        # Calculate differences
        if 'old' in metrics and 'new' in metrics:
            metrics['comparison'] = {}
            for key in metrics['old'].keys():
                old_val = metrics['old'][key]
                new_val = metrics['new'][key]
                
                if old_val > 0:
                    diff_percent = ((new_val - old_val) / old_val) * 100
                else:
                    diff_percent = 100 if new_val > 0 else 0
                    
                metrics['comparison'][key] = {
                    'old': old_val,
                    'new': new_val,
                    'difference_percent': round(diff_percent, 2),
                    'status': self._evaluate_metric_status(key, diff_percent)
                }
                
        return metrics
    
    def _get_system_metrics_fallback(self, system: str) -> Dict:
        """Get system metrics using system commands as fallback"""
        metrics = {
            'requests_per_second': 0,
            'average_response_time': 0,
            'error_rate': 0,
            'memory_usage_mb': 0,
            'cpu_usage_percent': 0,
            'active_connections': 0
        }
        
        # Try to get basic system metrics
        try:
            # This is a simplified example - adapt based on your system
            if system == 'old':
                port = 3000
            else:
                port = 4000
                
            # Check connections
            result = subprocess.run(
                f"lsof -i :{port} | grep ESTABLISHED | wc -l",
                shell=True, capture_output=True, text=True
            )
            if result.returncode == 0:
                metrics['active_connections'] = int(result.stdout.strip())
        except:
            pass
            
        return metrics
    
    def _evaluate_metric_status(self, metric: str, diff_percent: float) -> str:
        """Evaluate if metric difference is acceptable"""
        thresholds = {
            'requests_per_second': 20,
            'average_response_time': 50,
            'error_rate': 10,
            'memory_usage_mb': 25,
            'cpu_usage_percent': 30,
            'active_connections': 50
        }
        
        threshold = thresholds.get(metric, self.config['comparison_threshold'] * 100)
        
        if abs(diff_percent) <= threshold:
            return 'normal'
        elif abs(diff_percent) <= threshold * 2:
            return 'warning'
        else:
            return 'critical'
    
    def check_response_parity(self, sample_endpoints: List[str] = None) -> Dict:
        """Check if both systems return same responses"""
        if sample_endpoints is None:
            sample_endpoints = ['/api/health', '/api/version', '/api/status']
            
        results = {
            'total': len(sample_endpoints),
            'matching': 0,
            'differences': []
        }
        
        for endpoint in sample_endpoints:
            try:
                old_response = requests.get(
                    f"{self.config['old_system_url']}{endpoint}",
                    timeout=5
                )
                new_response = requests.get(
                    f"{self.config['new_system_url']}{endpoint}",
                    timeout=5
                )
                
                # Compare status codes
                if old_response.status_code != new_response.status_code:
                    results['differences'].append({
                        'endpoint': endpoint,
                        'type': 'status_code',
                        'old': old_response.status_code,
                        'new': new_response.status_code
                    })
                # Compare response bodies (if JSON)
                elif old_response.headers.get('content-type', '').startswith('application/json'):
                    if old_response.json() != new_response.json():
                        results['differences'].append({
                            'endpoint': endpoint,
                            'type': 'response_body',
                            'message': 'JSON responses differ'
                        })
                    else:
                        results['matching'] += 1
                else:
                    results['matching'] += 1
                    
            except Exception as e:
                results['differences'].append({
                    'endpoint': endpoint,
                    'type': 'error',
                    'message': str(e)
                })
                
        return results
    
    def generate_monitoring_report(self, data: Dict) -> str:
        """Generate monitoring report"""
        report = f"""
Dual System Monitoring Report
============================
Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
Strategy: ${migration.strategy}

System Health
------------
Old System: {data['health']['old']['status']}
New System: {data['health']['new']['status']}
"""
        
        if 'metrics' in data and 'comparison' in data['metrics']:
            report += "\\n\\nMetrics Comparison\\n"
            report += "-----------------\\n"
            
            for metric, values in data['metrics']['comparison'].items():
                status_icon = {
                    'normal': '✅',
                    'warning': '⚠️',
                    'critical': '❌'
                }.get(values['status'], '❓')
                
                report += f"\\n{metric}:"
                report += f"\\n  Old: {values['old']}"
                report += f"\\n  New: {values['new']}"
                report += f"\\n  Difference: {values['difference_percent']}% {status_icon}"
        
        if 'response_parity' in data:
            report += "\\n\\nResponse Parity Check\\n"
            report += "--------------------\\n"
            report += f"Endpoints tested: {data['response_parity']['total']}\\n"
            report += f"Matching: {data['response_parity']['matching']}\\n"
            
            if data['response_parity']['differences']:
                report += "\\nDifferences found:\\n"
                for diff in data['response_parity']['differences']:
                    report += f"  - {diff['endpoint']}: {diff.get('message', diff['type'])}\\n"
        
        return report
    
    def save_metrics_history(self, metrics: Dict):
        """Save metrics for historical analysis"""
        entry = {
            'timestamp': datetime.now().isoformat(),
            'metrics': metrics
        }
        
        self.metrics_history.append(entry)
        
        # Keep only last 1000 entries
        if len(self.metrics_history) > 1000:
            self.metrics_history = self.metrics_history[-1000:]
        
        # Save to file
        os.makedirs('.migration', exist_ok=True)
        with open('.migration/metrics-history.json', 'w') as f:
            json.dump(self.metrics_history, f)
    
    def run(self, context: Dict) -> Dict:
        """Main hook execution"""
        if not self.should_trigger(context):
            return {'continue': True}
        
        print("\\n📊 Running dual system monitoring...")
        
        # Collect monitoring data
        monitoring_data = {
            'health': self.check_system_health(),
            'metrics': self.compare_metrics(),
            'response_parity': self.check_response_parity()
        }
        
        # Generate and display report
        report = self.generate_monitoring_report(monitoring_data)
        print(report)
        
        # Save metrics history
        if 'metrics' in monitoring_data:
            self.save_metrics_history(monitoring_data['metrics'])
        
        # Check for critical issues
        critical_issues = []
        
        # Health issues
        for system, health in monitoring_data['health'].items():
            if health['status'] != 'healthy':
                critical_issues.append(f"{system} system is {health['status']}")
        
        # Metric divergence
        if 'comparison' in monitoring_data.get('metrics', {}):
            for metric, values in monitoring_data['metrics']['comparison'].items():
                if values['status'] == 'critical':
                    critical_issues.append(
                        f"{metric} divergence: {values['difference_percent']}%"
                    )
        
        # Response parity issues
        if monitoring_data.get('response_parity', {}).get('differences'):
            critical_issues.append(
                f"Response parity issues on {len(monitoring_data['response_parity']['differences'])} endpoints"
            )
        
        # Alert if needed
        if critical_issues and self.config['alert_on_divergence']:
            print(f"\\n⚠️  ALERT: {len(critical_issues)} critical issues detected:")
            for issue in critical_issues:
                print(f"   - {issue}")
            
            # In a real implementation, send alerts via Slack, email, etc.
            self._send_alerts(critical_issues)
        
        # Save detailed report
        report_file = f".migration/monitoring/{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        os.makedirs(os.path.dirname(report_file), exist_ok=True)
        with open(report_file, 'w') as f:
            json.dump(monitoring_data, f, indent=2)
        
        return {'continue': True}
    
    def _send_alerts(self, issues: List[str]):
        """Send alerts for critical issues"""
        # This is a placeholder - implement actual alerting
        alert_file = '.migration/alerts.log'
        with open(alert_file, 'a') as f:
            f.write(f"\\n{datetime.now().isoformat()} - ALERT:\\n")
            for issue in issues:
                f.write(f"  - {issue}\\n")

if __name__ == '__main__':
    # Read context from stdin
    context = json.loads(sys.stdin.read())
    
    # Run hook
    hook = DualSystemMonitorHook()
    result = hook.run(context)
    
    # Output result
    print(json.dumps(result))
`;
}

function generateMigrationValidationHook(config: ProjectConfig): string {
  const migration = config.migrationConfig!;

  return `#!/usr/bin/env python3
"""
Migration Validation Hook
Continuous validation during migration process
"""

import os
import sys
import json
import subprocess
import time
from datetime import datetime
from typing import Dict, List, Optional, Tuple

class MigrationValidationHook:
    def __init__(self):
        self.config = self._load_config()
        self.validation_rules = self._load_validation_rules()
        self.validation_cache = {}
        
    def _load_config(self) -> Dict:
        """Load migration configuration"""
        try:
            with open('.migration/config.json', 'r') as f:
                return json.load(f)
        except:
            return {
                'currentPhase': 'unknown',
                'strategy': '${migration.strategy}',
                'riskLevel': '${migration.riskLevel}'
            }
    
    def _load_validation_rules(self) -> List[Dict]:
        """Load phase-specific validation rules"""
        rules = []
        
        # Add validation rules for each phase
        ${migration.migrationPhases
          .map(
            (phase) => `
        # ${phase.name} validations
        rules.extend([
            ${phase.validationCriteria
              .map(
                (criteria) => `{
                'phase': '${phase.id}',
                'name': '${criteria}',
                'type': 'criteria',
                'command': self._get_validation_command('${criteria}')
            }`
              )
              .join(',\n            ')}
        ])
        `
          )
          .join('\n        ')}
        
        return rules
    
    def _get_validation_command(self, criteria: str) -> str:
        """Map validation criteria to executable command"""
        # Map common criteria to commands
        criteria_lower = criteria.lower()
        
        if 'test' in criteria_lower and 'passing' in criteria_lower:
            return 'npm test'
        elif 'database' in criteria_lower and 'connection' in criteria_lower:
            return 'npm run db:test-connection'
        elif 'api' in criteria_lower and 'compatibility' in criteria_lower:
            return 'npm run test:api:compat'
        elif 'performance' in criteria_lower:
            return 'npm run test:performance'
        elif 'data integrity' in criteria_lower:
            return 'npm run migration:verify-data'
        else:
            # Default to a generic validation
            return f'echo "Manual validation required: {criteria}"'
    
    def should_trigger(self, context: Dict) -> bool:
        """Check if validation should run"""
        # Run on migration-related commands
        migration_commands = [
            'migration', 'migrate', 'deploy', 'rollout',
            'switch', 'cutover', 'transfer'
        ]
        
        command = context.get('command', '').lower()
        if any(cmd in command for cmd in migration_commands):
            return True
        
        # Run on phase transitions
        if 'phase' in context.get('message', '').lower():
            return True
            
        # Run periodically during active migration
        if self._is_migration_active():
            last_run = self.validation_cache.get('last_run_time', 0)
            if time.time() - last_run > 3600:  # Run hourly
                return True
                
        return False
    
    def _is_migration_active(self) -> bool:
        """Check if migration is currently active"""
        return self.config.get('status') == 'active'
    
    def run_validations(self, phase: Optional[str] = None) -> Dict[str, List]:
        """Run validations for current or specified phase"""
        results = {
            'passed': [],
            'failed': [],
            'warnings': [],
            'skipped': []
        }
        
        current_phase = phase or self.config.get('currentPhase', 'unknown')
        
        # Get applicable rules
        applicable_rules = [
            rule for rule in self.validation_rules
            if rule['phase'] == current_phase or rule.get('global', False)
        ]
        
        print(f"\\n🔍 Running {len(applicable_rules)} validations for phase: {current_phase}")
        
        for rule in applicable_rules:
            result = self._execute_validation(rule)
            
            if result['status'] == 'passed':
                results['passed'].append(result)
                print(f"  ✅ {rule['name']}")
            elif result['status'] == 'failed':
                results['failed'].append(result)
                print(f"  ❌ {rule['name']}: {result.get('error', 'Failed')}")
            elif result['status'] == 'warning':
                results['warnings'].append(result)
                print(f"  ⚠️  {rule['name']}: {result.get('message', 'Warning')}")
            else:
                results['skipped'].append(result)
                print(f"  ⏭️  {rule['name']}: Skipped")
        
        return results
    
    def _execute_validation(self, rule: Dict) -> Dict:
        """Execute a single validation rule"""
        start_time = time.time()
        
        try:
            # Check cache
            cache_key = f"{rule['phase']}:{rule['name']}"
            cached = self.validation_cache.get(cache_key)
            if cached and time.time() - cached['timestamp'] < 300:  # 5 min cache
                return cached['result']
            
            # Execute command
            result = subprocess.run(
                rule['command'],
                shell=True,
                capture_output=True,
                text=True,
                timeout=60
            )
            
            validation_result = {
                'name': rule['name'],
                'phase': rule['phase'],
                'duration': time.time() - start_time,
                'command': rule['command'],
                'timestamp': datetime.now().isoformat()
            }
            
            if result.returncode == 0:
                validation_result['status'] = 'passed'
                validation_result['output'] = result.stdout
            else:
                validation_result['status'] = 'failed'
                validation_result['error'] = result.stderr or result.stdout
                validation_result['exit_code'] = result.returncode
            
            # Cache result
            self.validation_cache[cache_key] = {
                'timestamp': time.time(),
                'result': validation_result
            }
            
            return validation_result
            
        except subprocess.TimeoutExpired:
            return {
                'name': rule['name'],
                'phase': rule['phase'],
                'status': 'failed',
                'error': 'Validation timed out after 60 seconds',
                'duration': 60
            }
        except Exception as e:
            return {
                'name': rule['name'],
                'phase': rule['phase'],
                'status': 'failed',
                'error': str(e),
                'duration': time.time() - start_time
            }
    
    def check_phase_readiness(self, next_phase: str) -> Tuple[bool, List[str]]:
        """Check if ready to proceed to next phase"""
        issues = []
        
        # Run current phase validations
        current_results = self.run_validations()
        
        # Check for failures
        if current_results['failed']:
            issues.extend([
                f"Failed validation: {v['name']}"
                for v in current_results['failed']
            ])
        
        # Check for critical warnings
        for warning in current_results['warnings']:
            if warning.get('severity') == 'critical':
                issues.append(f"Critical warning: {warning['name']}")
        
        # Phase-specific checks
        if next_phase == 'cutover':
            # Extra checks before production cutover
            extra_checks = [
                ('Backup verified', 'npm run backup:verify'),
                ('Rollback tested', 'npm run rollback:test'),
                ('Performance acceptable', 'npm run perf:check')
            ]
            
            for check_name, command in extra_checks:
                try:
                    result = subprocess.run(
                        command, shell=True, capture_output=True, timeout=30
                    )
                    if result.returncode != 0:
                        issues.append(f"Pre-cutover check failed: {check_name}")
                except:
                    issues.append(f"Could not verify: {check_name}")
        
        return len(issues) == 0, issues
    
    def generate_validation_report(self, results: Dict) -> str:
        """Generate validation report"""
        total = sum(len(results[k]) for k in ['passed', 'failed', 'warnings', 'skipped'])
        
        report = f"""
Migration Validation Report
==========================
Phase: {self.config.get('currentPhase', 'unknown')}
Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

Summary
-------
Total Validations: {total}
✅ Passed: {len(results['passed'])}
❌ Failed: {len(results['failed'])}
⚠️  Warnings: {len(results['warnings'])}
⏭️  Skipped: {len(results['skipped'])}

"""
        
        if results['failed']:
            report += "Failed Validations\\n"
            report += "-----------------\\n"
            for validation in results['failed']:
                report += f"\\n{validation['name']}:\\n"
                report += f"  Command: {validation['command']}\\n"
                report += f"  Error: {validation.get('error', 'Unknown error')}\\n"
        
        if results['warnings']:
            report += "\\nWarnings\\n"
            report += "--------\\n"
            for validation in results['warnings']:
                report += f"\\n{validation['name']}:\\n"
                report += f"  Message: {validation.get('message', 'Warning')}\\n"
        
        # Risk assessment
        risk_score = len(results['failed']) * 10 + len(results['warnings']) * 3
        if risk_score == 0:
            risk_level = "Low"
        elif risk_score < 20:
            risk_level = "Medium"
        elif risk_score < 50:
            risk_level = "High"
        else:
            risk_level = "Critical"
        
        report += f"\\nRisk Assessment: {risk_level} (Score: {risk_score})\\n"
        
        return report
    
    def run(self, context: Dict) -> Dict:
        """Main hook execution"""
        if not self.should_trigger(context):
            return {'continue': True}
        
        print("\\n🔧 Running migration validations...")
        
        # Run validations
        results = self.run_validations()
        
        # Generate report
        report = self.generate_validation_report(results)
        print(report)
        
        # Save report
        report_file = f".migration/validation-reports/{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        os.makedirs(os.path.dirname(report_file), exist_ok=True)
        with open(report_file, 'w') as f:
            json.dump({
                'timestamp': datetime.now().isoformat(),
                'phase': self.config.get('currentPhase'),
                'results': results,
                'report': report
            }, f, indent=2)
        
        # Update last run time
        self.validation_cache['last_run_time'] = time.time()
        
        # Determine if should continue
        critical_failures = [
            v for v in results['failed']
            if 'critical' in v.get('name', '').lower()
        ]
        
        if critical_failures:
            print(f"\\n❌ {len(critical_failures)} critical validation failures!")
            
            # Check if this is a production phase
            if self.config.get('currentPhase') in ['cutover', 'production']:
                print("\\n🛑 BLOCKING: Cannot proceed with critical failures in production phase")
                return {
                    'continue': False,
                    'message': 'Critical validations failed - migration blocked'
                }
            else:
                response = input("\\nContinue despite critical failures? (y/N): ")
                if response.lower() != 'y':
                    return {
                        'continue': False,
                        'message': 'Aborted due to validation failures'
                    }
        
        return {'continue': True}

if __name__ == '__main__':
    # Read context from stdin
    context = json.loads(sys.stdin.read())
    
    # Run hook
    hook = MigrationValidationHook()
    result = hook.run(context)
    
    # Output result
    print(json.dumps(result))
`;
}
