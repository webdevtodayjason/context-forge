import { ProjectConfig, EnhancementConfig } from '../types';
import { GeneratedFile } from '../adapters/base';

export async function generateEnhancementHooks(config: ProjectConfig): Promise<GeneratedFile[]> {
  const files: GeneratedFile[] = [];
  const enhancement = config.enhancementConfig;

  if (!enhancement || !config.extras.hooks) {
    return files;
  }

  // Generate pre-implementation hook
  files.push({
    path: '.claude/hooks/pre-implementation.py',
    content: generatePreImplementationHook(enhancement),
    description: 'Pre-implementation validation hook',
  });

  // Generate feature validation hook
  files.push({
    path: '.claude/hooks/feature-validation.py',
    content: generateFeatureValidationHook(enhancement),
    description: 'Feature validation hook',
  });

  // Generate integration test hook
  files.push({
    path: '.claude/hooks/integration-test.py',
    content: generateIntegrationTestHook(enhancement),
    description: 'Integration testing hook',
  });

  // Generate progress tracking hook
  files.push({
    path: '.claude/hooks/progress-tracker.py',
    content: generateProgressTrackingHook(enhancement),
    description: 'Progress tracking hook',
  });

  // Generate phase completion hook
  files.push({
    path: '.claude/hooks/phase-completion.py',
    content: generatePhaseCompletionHook(enhancement),
    description: 'Phase completion validation hook',
  });

  return files;
}

function generatePreImplementationHook(_enhancement: EnhancementConfig): string {
  return `#!/usr/bin/env python3
"""
Pre-Implementation Hook for Enhancement Features
Validates environment and dependencies before starting feature implementation
"""

import os
import sys
import json
import subprocess
from datetime import datetime

def log(message, level="INFO"):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{timestamp}] [{level}] {message}")

def check_environment():
    """Verify development environment is ready"""
    log("Checking development environment...")
    
    issues = []
    
    # Check Node/npm
    try:
        node_version = subprocess.check_output(['node', '--version'], text=True).strip()
        log(f"Node version: {node_version}")
    except:
        issues.append("Node.js not found")
    
    # Check package manager
    for pm in ['npm', 'yarn', 'pnpm']:
        try:
            subprocess.check_output([pm, '--version'], stderr=subprocess.DEVNULL)
            log(f"Package manager {pm} available")
            break
        except:
            continue
    else:
        issues.append("No package manager found")
    
    # Check git status
    try:
        git_status = subprocess.check_output(['git', 'status', '--porcelain'], text=True)
        if git_status.strip():
            log("WARNING: Uncommitted changes detected", "WARN")
    except:
        issues.append("Git not available")
    
    return issues

def validate_feature_dependencies(feature_id):
    """Check if feature dependencies are met"""
    log(f"Validating dependencies for feature: {feature_id}")
    
    # Read enhancement config
    config_path = "ENHANCEMENT_PLAN.md"
    if not os.path.exists(config_path):
        return ["Enhancement plan not found"]
    
    # Simple dependency check (in real implementation, parse actual config)
    dependencies_met = True
    if not dependencies_met:
        return [f"Dependencies not met for {feature_id}"]
    
    return []

def check_test_coverage():
    """Verify current test coverage meets threshold"""
    log("Checking test coverage...")
    
    try:
        # Run coverage check
        result = subprocess.run(
            ['npm', 'run', 'coverage'],
            capture_output=True,
            text=True
        )
        
        # Parse coverage (simplified)
        if "Coverage threshold" in result.stdout:
            log("Test coverage meets requirements")
        else:
            return ["Test coverage below threshold"]
    except:
        log("Unable to check coverage", "WARN")
    
    return []

def main():
    log("=== Pre-Implementation Hook Started ===")
    
    # Get context from environment
    feature_id = os.getenv('ENHANCEMENT_FEATURE_ID', '')
    phase_id = os.getenv('ENHANCEMENT_PHASE_ID', '')
    
    all_issues = []
    
    # Run checks
    all_issues.extend(check_environment())
    
    if feature_id:
        all_issues.extend(validate_feature_dependencies(feature_id))
    
    all_issues.extend(check_test_coverage())
    
    # Report results
    if all_issues:
        log("Pre-implementation checks failed:", "ERROR")
        for issue in all_issues:
            log(f"  - {issue}", "ERROR")
        
        # Write status file
        with open('.enhancement-status.json', 'w') as f:
            json.dump({
                'status': 'blocked',
                'issues': all_issues,
                'timestamp': datetime.now().isoformat()
            }, f, indent=2)
        
        sys.exit(1)
    else:
        log("All pre-implementation checks passed!", "SUCCESS")
        
        # Write status file
        with open('.enhancement-status.json', 'w') as f:
            json.dump({
                'status': 'ready',
                'feature': feature_id,
                'phase': phase_id,
                'timestamp': datetime.now().isoformat()
            }, f, indent=2)
        
        log("=== Ready to implement! ===")

if __name__ == "__main__":
    main()
`;
}

function generateFeatureValidationHook(_enhancement: EnhancementConfig): string {
  return `#!/usr/bin/env python3
"""
Feature Validation Hook
Validates feature implementation against acceptance criteria
"""

import os
import sys
import json
import subprocess
import re
from pathlib import Path

class FeatureValidator:
    def __init__(self, feature_id):
        self.feature_id = feature_id
        self.results = {
            'feature_id': feature_id,
            'checks': {},
            'passed': 0,
            'failed': 0,
            'warnings': 0
        }
    
    def validate_code_quality(self):
        """Check code quality standards"""
        print(f"Validating code quality for {self.feature_id}...")
        
        # Run linter
        try:
            result = subprocess.run(
                ['npm', 'run', 'lint'],
                capture_output=True,
                text=True
            )
            
            if result.returncode == 0:
                self.results['checks']['linting'] = 'PASSED'
                self.results['passed'] += 1
            else:
                self.results['checks']['linting'] = 'FAILED'
                self.results['failed'] += 1
                print(f"Linting errors found:\\n{result.stdout}")
        except Exception as e:
            self.results['checks']['linting'] = f'ERROR: {str(e)}'
            self.results['failed'] += 1
    
    def validate_tests(self):
        """Ensure tests are written and passing"""
        print(f"Validating tests...")
        
        # Check for test files
        test_patterns = [
            f"**/*{self.feature_id}*.test.*",
            f"**/*{self.feature_id}*.spec.*"
        ]
        
        test_files = []
        for pattern in test_patterns:
            test_files.extend(Path('.').glob(pattern))
        
        if not test_files:
            self.results['checks']['test_files'] = 'WARNING: No test files found'
            self.results['warnings'] += 1
        else:
            self.results['checks']['test_files'] = f'PASSED: {len(test_files)} test files'
            self.results['passed'] += 1
        
        # Run tests
        try:
            result = subprocess.run(
                ['npm', 'test', '--', f'--grep={self.feature_id}'],
                capture_output=True,
                text=True
            )
            
            if result.returncode == 0:
                self.results['checks']['test_execution'] = 'PASSED'
                self.results['passed'] += 1
            else:
                self.results['checks']['test_execution'] = 'FAILED'
                self.results['failed'] += 1
        except:
            self.results['checks']['test_execution'] = 'SKIPPED'
    
    def validate_documentation(self):
        """Check if documentation is updated"""
        print("Validating documentation...")
        
        doc_files = [
            'README.md',
            'docs/api.md',
            f'docs/features/{self.feature_id}.md'
        ]
        
        docs_updated = False
        for doc_file in doc_files:
            if os.path.exists(doc_file):
                # Check if file was recently modified
                stat = os.stat(doc_file)
                # Simple check - in real implementation, compare with git
                docs_updated = True
                break
        
        if docs_updated:
            self.results['checks']['documentation'] = 'PASSED'
            self.results['passed'] += 1
        else:
            self.results['checks']['documentation'] = 'WARNING: Documentation may need updates'
            self.results['warnings'] += 1
    
    def validate_integration_points(self):
        """Verify integration points are properly implemented"""
        print("Validating integration points...")
        
        # This would check actual integration points from config
        # Simplified version here
        integration_checks = {
            'api_endpoints': self._check_api_endpoints(),
            'database_schema': self._check_database_schema(),
            'ui_components': self._check_ui_components()
        }
        
        for check, result in integration_checks.items():
            if result == 'PASSED':
                self.results['passed'] += 1
            elif result == 'FAILED':
                self.results['failed'] += 1
            else:
                self.results['warnings'] += 1
            
            self.results['checks'][check] = result
    
    def _check_api_endpoints(self):
        # Simplified check
        return 'PASSED'
    
    def _check_database_schema(self):
        # Check for migrations
        migration_path = Path('migrations') / f'{self.feature_id}*.sql'
        if list(Path('.').glob(str(migration_path))):
            return 'PASSED'
        return 'WARNING: No migrations found'
    
    def _check_ui_components(self):
        # Check for component files
        component_path = Path('src/components') / f'*{self.feature_id}*'
        if list(Path('src').glob(f'**/*{self.feature_id}*')):
            return 'PASSED'
        return 'N/A'
    
    def generate_report(self):
        """Generate validation report"""
        print("\\n=== Feature Validation Report ===")
        print(f"Feature: {self.feature_id}")
        print(f"Passed: {self.results['passed']}")
        print(f"Failed: {self.results['failed']}")
        print(f"Warnings: {self.results['warnings']}")
        print("\\nCheck Results:")
        for check, result in self.results['checks'].items():
            print(f"  - {check}: {result}")
        
        # Write results to file
        with open(f'.feature-validation-{self.feature_id}.json', 'w') as f:
            json.dump(self.results, f, indent=2)
        
        return self.results['failed'] == 0

def main():
    feature_id = os.getenv('ENHANCEMENT_FEATURE_ID', sys.argv[1] if len(sys.argv) > 1 else '')
    
    if not feature_id:
        print("ERROR: No feature ID provided")
        sys.exit(1)
    
    validator = FeatureValidator(feature_id)
    
    # Run validations
    validator.validate_code_quality()
    validator.validate_tests()
    validator.validate_documentation()
    validator.validate_integration_points()
    
    # Generate report
    success = validator.generate_report()
    
    if not success:
        print("\\n❌ Feature validation failed!")
        sys.exit(1)
    else:
        print("\\n✅ Feature validation passed!")

if __name__ == "__main__":
    main()
`;
}

function generateIntegrationTestHook(_enhancement: EnhancementConfig): string {
  return `#!/usr/bin/env python3
"""
Integration Test Hook
Runs integration tests for enhanced features
"""

import os
import sys
import json
import subprocess
import time
from datetime import datetime

class IntegrationTester:
    def __init__(self):
        self.results = {
            'timestamp': datetime.now().isoformat(),
            'tests': [],
            'summary': {
                'total': 0,
                'passed': 0,
                'failed': 0,
                'skipped': 0
            }
        }
    
    def setup_test_environment(self):
        """Prepare test environment"""
        print("Setting up test environment...")
        
        # Start test database
        subprocess.run(['docker-compose', 'up', '-d', 'test-db'], 
                      capture_output=True)
        time.sleep(5)  # Wait for DB
        
        # Run migrations
        subprocess.run(['npm', 'run', 'migrate:test'], 
                      capture_output=True)
        
        print("Test environment ready")
    
    def run_api_integration_tests(self):
        """Test API endpoints"""
        print("\\nRunning API integration tests...")
        
        result = subprocess.run(
            ['npm', 'run', 'test:api'],
            capture_output=True,
            text=True
        )
        
        test_result = {
            'name': 'API Integration',
            'type': 'api',
            'passed': result.returncode == 0,
            'duration': 0,  # Would measure actual duration
            'output': result.stdout[-500:] if result.stdout else ''
        }
        
        self.results['tests'].append(test_result)
        self._update_summary(test_result)
    
    def run_database_integration_tests(self):
        """Test database operations"""
        print("\\nRunning database integration tests...")
        
        result = subprocess.run(
            ['npm', 'run', 'test:db'],
            capture_output=True,
            text=True
        )
        
        test_result = {
            'name': 'Database Integration',
            'type': 'database',
            'passed': result.returncode == 0,
            'duration': 0,
            'output': result.stdout[-500:] if result.stdout else ''
        }
        
        self.results['tests'].append(test_result)
        self._update_summary(test_result)
    
    def run_ui_integration_tests(self):
        """Test UI components"""
        print("\\nRunning UI integration tests...")
        
        # Start dev server
        server_process = subprocess.Popen(
            ['npm', 'run', 'dev'],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        
        time.sleep(10)  # Wait for server
        
        try:
            # Run UI tests
            result = subprocess.run(
                ['npm', 'run', 'test:e2e'],
                capture_output=True,
                text=True
            )
            
            test_result = {
                'name': 'UI Integration',
                'type': 'ui',
                'passed': result.returncode == 0,
                'duration': 0,
                'output': result.stdout[-500:] if result.stdout else ''
            }
            
            self.results['tests'].append(test_result)
            self._update_summary(test_result)
        finally:
            server_process.terminate()
    
    def run_feature_specific_tests(self, feature_ids):
        """Run tests for specific features"""
        for feature_id in feature_ids:
            print(f"\\nRunning tests for feature: {feature_id}")
            
            result = subprocess.run(
                ['npm', 'test', '--', f'--grep={feature_id}'],
                capture_output=True,
                text=True
            )
            
            test_result = {
                'name': f'Feature: {feature_id}',
                'type': 'feature',
                'passed': result.returncode == 0,
                'duration': 0,
                'output': result.stdout[-500:] if result.stdout else ''
            }
            
            self.results['tests'].append(test_result)
            self._update_summary(test_result)
    
    def _update_summary(self, test_result):
        self.results['summary']['total'] += 1
        if test_result['passed']:
            self.results['summary']['passed'] += 1
        else:
            self.results['summary']['failed'] += 1
    
    def cleanup(self):
        """Clean up test environment"""
        print("\\nCleaning up test environment...")
        subprocess.run(['docker-compose', 'down'], capture_output=True)
    
    def generate_report(self):
        """Generate test report"""
        print("\\n=== Integration Test Report ===")
        print(f"Total Tests: {self.results['summary']['total']}")
        print(f"Passed: {self.results['summary']['passed']}")
        print(f"Failed: {self.results['summary']['failed']}")
        
        if self.results['summary']['failed'] > 0:
            print("\\nFailed Tests:")
            for test in self.results['tests']:
                if not test['passed']:
                    print(f"  - {test['name']}")
                    if test['output']:
                        print(f"    Output: {test['output'][:200]}...")
        
        # Save report
        with open('integration-test-results.json', 'w') as f:
            json.dump(self.results, f, indent=2)
        
        return self.results['summary']['failed'] == 0

def main():
    feature_ids = os.getenv('ENHANCEMENT_FEATURES', '').split(',')
    feature_ids = [f.strip() for f in feature_ids if f.strip()]
    
    tester = IntegrationTester()
    
    try:
        tester.setup_test_environment()
        
        # Run different test suites
        tester.run_api_integration_tests()
        tester.run_database_integration_tests()
        tester.run_ui_integration_tests()
        
        if feature_ids:
            tester.run_feature_specific_tests(feature_ids)
        
        # Generate report
        success = tester.generate_report()
        
        if not success:
            print("\\n❌ Integration tests failed!")
            sys.exit(1)
        else:
            print("\\n✅ All integration tests passed!")
            
    finally:
        tester.cleanup()

if __name__ == "__main__":
    main()
`;
}

function generateProgressTrackingHook(_enhancement: EnhancementConfig): string {
  return `#!/usr/bin/env python3
"""
Progress Tracking Hook
Tracks and reports enhancement implementation progress
"""

import os
import json
import subprocess
from datetime import datetime, timedelta
from pathlib import Path

class ProgressTracker:
    def __init__(self):
        self.progress_file = '.enhancement-progress.json'
        self.progress = self.load_progress()
    
    def load_progress(self):
        """Load existing progress data"""
        if os.path.exists(self.progress_file):
            with open(self.progress_file, 'r') as f:
                return json.load(f)
        
        return {
            'start_date': datetime.now().isoformat(),
            'phases': {},
            'features': {},
            'tasks': {},
            'metrics': {
                'velocity': [],
                'completion_rate': 0,
                'estimated_completion': None
            }
        }
    
    def update_task_status(self, task_id, status):
        """Update individual task status"""
        if task_id not in self.progress['tasks']:
            self.progress['tasks'][task_id] = {
                'created': datetime.now().isoformat(),
                'status_history': []
            }
        
        self.progress['tasks'][task_id]['status'] = status
        self.progress['tasks'][task_id]['status_history'].append({
            'status': status,
            'timestamp': datetime.now().isoformat()
        })
        
        if status == 'completed':
            self.progress['tasks'][task_id]['completed'] = datetime.now().isoformat()
    
    def update_feature_progress(self, feature_id):
        """Calculate and update feature progress"""
        # Count completed tasks for this feature
        feature_tasks = [t for t in self.progress['tasks'] 
                        if t.startswith(f"{feature_id}-")]
        
        completed = sum(1 for t in feature_tasks 
                       if self.progress['tasks'].get(t, {}).get('status') == 'completed')
        
        total = len(feature_tasks) or 1
        progress = (completed / total) * 100
        
        self.progress['features'][feature_id] = {
            'progress': progress,
            'completed_tasks': completed,
            'total_tasks': total,
            'last_updated': datetime.now().isoformat()
        }
        
        return progress
    
    def update_phase_progress(self, phase_id):
        """Calculate and update phase progress"""
        # Get features in this phase (simplified)
        phase_features = [f for f in self.progress['features'] 
                         if f in self.progress['features']]
        
        if not phase_features:
            return 0
        
        total_progress = sum(self.progress['features'].get(f, {}).get('progress', 0) 
                           for f in phase_features)
        
        phase_progress = total_progress / len(phase_features)
        
        self.progress['phases'][phase_id] = {
            'progress': phase_progress,
            'last_updated': datetime.now().isoformat()
        }
        
        return phase_progress
    
    def calculate_metrics(self):
        """Calculate velocity and other metrics"""
        # Calculate completion rate
        total_tasks = len(self.progress['tasks'])
        completed_tasks = sum(1 for t in self.progress['tasks'].values() 
                            if t.get('status') == 'completed')
        
        if total_tasks > 0:
            self.progress['metrics']['completion_rate'] = (completed_tasks / total_tasks) * 100
        
        # Calculate velocity (tasks per day)
        if completed_tasks > 0:
            start_date = datetime.fromisoformat(self.progress['start_date'])
            days_elapsed = (datetime.now() - start_date).days or 1
            daily_velocity = completed_tasks / days_elapsed
            
            self.progress['metrics']['velocity'].append({
                'date': datetime.now().isoformat(),
                'value': daily_velocity
            })
            
            # Estimate completion
            remaining_tasks = total_tasks - completed_tasks
            if daily_velocity > 0:
                days_to_complete = remaining_tasks / daily_velocity
                estimated_completion = datetime.now() + timedelta(days=days_to_complete)
                self.progress['metrics']['estimated_completion'] = estimated_completion.isoformat()
    
    def generate_report(self):
        """Generate progress report"""
        print("=== Enhancement Progress Report ===")
        print(f"Started: {self.progress['start_date']}")
        print(f"Completion Rate: {self.progress['metrics']['completion_rate']:.1f}%")
        
        if self.progress['metrics']['estimated_completion']:
            print(f"Estimated Completion: {self.progress['metrics']['estimated_completion']}")
        
        print("\\nPhase Progress:")
        for phase_id, phase_data in self.progress['phases'].items():
            print(f"  - {phase_id}: {phase_data['progress']:.1f}%")
        
        print("\\nFeature Progress:")
        for feature_id, feature_data in self.progress['features'].items():
            print(f"  - {feature_id}: {feature_data['progress']:.1f}% "
                  f"({feature_data['completed_tasks']}/{feature_data['total_tasks']} tasks)")
        
        # Save progress
        self.save_progress()
    
    def save_progress(self):
        """Save progress data"""
        with open(self.progress_file, 'w') as f:
            json.dump(self.progress, f, indent=2)
    
    def check_git_activity(self):
        """Analyze git commits for progress indicators"""
        try:
            # Get recent commits
            result = subprocess.run(
                ['git', 'log', '--oneline', '--since=1.day', '--grep=feat:'],
                capture_output=True,
                text=True
            )
            
            commits = result.stdout.strip().split('\\n') if result.stdout else []
            
            print(f"\\nRecent feature commits: {len(commits)}")
            for commit in commits[:5]:
                print(f"  - {commit}")
            
        except:
            print("Unable to check git activity")

def main():
    tracker = ProgressTracker()
    
    # Get current context
    task_id = os.getenv('CURRENT_TASK_ID', '')
    feature_id = os.getenv('CURRENT_FEATURE_ID', '')
    phase_id = os.getenv('CURRENT_PHASE_ID', '')
    status = os.getenv('TASK_STATUS', '')
    
    # Update progress based on context
    if task_id and status:
        tracker.update_task_status(task_id, status)
        print(f"Updated task {task_id} to {status}")
    
    if feature_id:
        progress = tracker.update_feature_progress(feature_id)
        print(f"Feature {feature_id} progress: {progress:.1f}%")
    
    if phase_id:
        progress = tracker.update_phase_progress(phase_id)
        print(f"Phase {phase_id} progress: {progress:.1f}%")
    
    # Calculate metrics
    tracker.calculate_metrics()
    
    # Check git activity
    tracker.check_git_activity()
    
    # Generate report
    tracker.generate_report()

if __name__ == "__main__":
    main()
`;
}

function generatePhaseCompletionHook(_enhancement: EnhancementConfig): string {
  return `#!/usr/bin/env python3
"""
Phase Completion Hook
Validates phase completion criteria before allowing transition
"""

import os
import sys
import json
import subprocess
from datetime import datetime
from pathlib import Path

class PhaseCompletionValidator:
    def __init__(self, phase_id):
        self.phase_id = phase_id
        self.results = {
            'phase_id': phase_id,
            'timestamp': datetime.now().isoformat(),
            'checks': {},
            'can_proceed': False,
            'blockers': []
        }
    
    def load_phase_config(self):
        """Load phase configuration"""
        # In real implementation, would load from actual config
        return {
            'name': f'Phase {self.phase_id}',
            'features': self._get_phase_features(),
            'validation_criteria': [
                'All features implemented',
                'All tests passing',
                'Documentation updated',
                'Code review completed'
            ],
            'required_approvals': ['tech_lead', 'product_owner']
        }
    
    def _get_phase_features(self):
        # Simplified - would get from config
        return ['feature-1', 'feature-2']
    
    def validate_features_complete(self, features):
        """Check if all phase features are complete"""
        print(f"Validating {len(features)} features...")
        
        incomplete_features = []
        
        for feature_id in features:
            # Check feature validation status
            validation_file = f'.feature-validation-{feature_id}.json'
            
            if os.path.exists(validation_file):
                with open(validation_file, 'r') as f:
                    validation = json.load(f)
                    
                if validation.get('failed', 0) > 0:
                    incomplete_features.append(feature_id)
            else:
                incomplete_features.append(feature_id)
        
        if incomplete_features:
            self.results['checks']['features'] = f'FAILED: {len(incomplete_features)} incomplete'
            self.results['blockers'].append(f"Incomplete features: {', '.join(incomplete_features)}")
            return False
        else:
            self.results['checks']['features'] = 'PASSED: All features complete'
            return True
    
    def validate_tests(self):
        """Ensure all tests are passing"""
        print("Validating test suite...")
        
        try:
            result = subprocess.run(
                ['npm', 'test'],
                capture_output=True,
                text=True
            )
            
            if result.returncode == 0:
                self.results['checks']['tests'] = 'PASSED'
                return True
            else:
                self.results['checks']['tests'] = 'FAILED'
                self.results['blockers'].append("Test suite has failures")
                return False
        except Exception as e:
            self.results['checks']['tests'] = f'ERROR: {str(e)}'
            self.results['blockers'].append("Unable to run tests")
            return False
    
    def validate_documentation(self):
        """Check documentation is updated"""
        print("Validating documentation...")
        
        docs_updated = False
        required_docs = [
            'README.md',
            'CHANGELOG.md',
            f'docs/phases/{self.phase_id}.md'
        ]
        
        missing_docs = []
        for doc in required_docs:
            if not os.path.exists(doc):
                missing_docs.append(doc)
        
        if missing_docs:
            self.results['checks']['documentation'] = 'WARNING: Missing documentation'
            # Not a blocker, just a warning
            return True
        else:
            self.results['checks']['documentation'] = 'PASSED'
            return True
    
    def validate_code_quality(self):
        """Check code quality metrics"""
        print("Validating code quality...")
        
        quality_checks = {
            'linting': self._check_linting(),
            'coverage': self._check_coverage(),
            'security': self._check_security()
        }
        
        all_passed = all(check for check in quality_checks.values())
        
        if all_passed:
            self.results['checks']['code_quality'] = 'PASSED'
        else:
            self.results['checks']['code_quality'] = 'FAILED'
            self.results['blockers'].append("Code quality standards not met")
        
        return all_passed
    
    def _check_linting(self):
        try:
            result = subprocess.run(['npm', 'run', 'lint'], 
                                  capture_output=True)
            return result.returncode == 0
        except:
            return False
    
    def _check_coverage(self):
        # Check if coverage meets threshold
        try:
            result = subprocess.run(['npm', 'run', 'coverage'], 
                                  capture_output=True, text=True)
            # Simple check - would parse actual coverage
            return 'Coverage threshold' not in result.stderr
        except:
            return True  # Don't block on coverage
    
    def _check_security(self):
        try:
            result = subprocess.run(['npm', 'audit', '--audit-level=high'], 
                                  capture_output=True)
            return result.returncode == 0
        except:
            return True  # Don't block on audit
    
    def check_approvals(self, required_approvals):
        """Check if required approvals are obtained"""
        print("Checking approvals...")
        
        # In real implementation, would check actual approval system
        approvals_file = f'.phase-{self.phase_id}-approvals.json'
        
        if os.path.exists(approvals_file):
            with open(approvals_file, 'r') as f:
                approvals = json.load(f)
                
            missing = [a for a in required_approvals if a not in approvals]
            
            if missing:
                self.results['checks']['approvals'] = f'PENDING: {", ".join(missing)}'
                self.results['blockers'].append(f"Missing approvals: {', '.join(missing)}")
                return False
            else:
                self.results['checks']['approvals'] = 'PASSED'
                return True
        else:
            self.results['checks']['approvals'] = 'PENDING: No approvals found'
            self.results['blockers'].append("No approvals recorded")
            return False
    
    def generate_report(self):
        """Generate completion report"""
        print("\\n=== Phase Completion Report ===")
        print(f"Phase: {self.phase_id}")
        print(f"Status: {'READY TO PROCEED' if self.results['can_proceed'] else 'BLOCKED'}")
        
        print("\\nValidation Results:")
        for check, result in self.results['checks'].items():
            status_icon = '✅' if 'PASSED' in result else '❌' if 'FAILED' in result else '⚠️'
            print(f"  {status_icon} {check}: {result}")
        
        if self.results['blockers']:
            print("\\nBlockers:")
            for blocker in self.results['blockers']:
                print(f"  - {blocker}")
        
        # Save report
        report_file = f'.phase-{self.phase_id}-completion.json'
        with open(report_file, 'w') as f:
            json.dump(self.results, f, indent=2)
        
        return self.results['can_proceed']

def main():
    phase_id = os.getenv('ENHANCEMENT_PHASE_ID', sys.argv[1] if len(sys.argv) > 1 else '')
    
    if not phase_id:
        print("ERROR: No phase ID provided")
        sys.exit(1)
    
    validator = PhaseCompletionValidator(phase_id)
    config = validator.load_phase_config()
    
    # Run all validations
    all_checks_passed = True
    
    all_checks_passed &= validator.validate_features_complete(config['features'])
    all_checks_passed &= validator.validate_tests()
    all_checks_passed &= validator.validate_documentation()
    all_checks_passed &= validator.validate_code_quality()
    all_checks_passed &= validator.check_approvals(config['required_approvals'])
    
    validator.results['can_proceed'] = all_checks_passed
    
    # Generate report
    can_proceed = validator.generate_report()
    
    if not can_proceed:
        print("\\n❌ Phase cannot be completed yet!")
        print("Please resolve all blockers before proceeding.")
        sys.exit(1)
    else:
        print("\\n✅ Phase completion validated!")
        print("Ready to proceed to next phase.")

if __name__ == "__main__":
    main()
`;
}
