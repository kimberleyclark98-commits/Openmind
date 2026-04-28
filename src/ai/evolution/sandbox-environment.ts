import { exec, execSync } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import * as crypto from 'crypto';
import { createHash } from 'crypto';

export interface SandboxConfig {
  enableDockerSandbox: boolean;
  enableResourceLimits: boolean;
  enableNetworkIsolation: boolean;
  enableFileSystemIsolation: boolean;
  resourceLimits: {
    cpuQuota: string; // e.g., '0.5' (50% of CPU)
    memoryLimit: string; // e.g., '512m'
    diskQuota: string; // e.g., '1G'
    maxProcesses: number;
  };
  networkConfig: {
    disableNetwork: boolean;
    allowedDomains: string[]; // whitelist for external access
  };
  securityConfig: {
    disableSyscalls: boolean; // prevent dangerous system calls
    readOnlyRootFS: boolean; // make root filesystem read-only
    dropCapabilities: string[]; // drop specific Linux capabilities
  };
  timeoutConfig: {
    executionTimeout: number; // seconds
    testTimeout: number; // seconds
    cleanupTimeout: number; // seconds
  };
}

export interface SandboxExecution {
  id: string;
  code: string;
  language: 'javascript' | 'typescript' | 'python';
  testCases: TestCase[];
  environment: Record<string, string>;
  resourceLimits: SandboxConfig['resourceLimits'];
  networkAccess: boolean;
  startTime: Date;
  endTime?: Date;
  result: ExecutionResult;
}

export interface TestCase {
  id: string;
  input: any;
  expectedOutput: any;
  timeout: number;
  description: string;
}

export interface ExecutionResult {
  success: boolean;
  output: string;
  error: string;
  exitCode: number;
  executionTime: number;
  resourceUsage: {
    cpuTime: number;
    memoryPeak: number;
    networkCalls: number;
  };
  testResults: TestResult[];
  securityViolations: SecurityViolation[];
}

export interface TestResult {
  testId: string;
  passed: boolean;
  actualOutput: any;
  executionTime: number;
  error?: string;
}

export interface SecurityViolation {
  type: 'syscall' | 'network' | 'filesystem' | 'resource';
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: number;
}

export class SandboxEnvironment {
  private config: SandboxConfig;
  private activeSandboxes: Map<string, SandboxExecution> = new Map();
  private dockerImageName: string;
  private sandboxBasePath: string;

  constructor(config: SandboxConfig) {
    this.config = config;
    this.dockerImageName = 'openmind-sandbox:latest';
    this.sandboxBasePath = path.join(process.cwd(), 'sandbox');
    this.initializeSandbox();
  }

  private async initializeSandbox(): Promise<void> {
    console.log('🏗️ Initializing Sandbox Environment...');

    // Create sandbox directory
    await fs.mkdir(this.sandboxBasePath, { recursive: true });

    // Build Docker image if enabled
    if (this.config.enableDockerSandbox) {
      await this.buildSandboxImage();
    }

    console.log('✅ Sandbox Environment initialized');
  }

  private async buildSandboxImage(): Promise<void> {
    console.log('🐳 Building sandbox Docker image...');

    const dockerfile = `
FROM node:18-alpine

# Install Python and security tools
RUN apk add --no-cache python3 py3-pip strace lsof curl \
    && rm -rf /var/cache/apk/*

# Create sandbox user
RUN addgroup -g 1000 sandbox && \
    adduser -S sandbox -u 1000 -G sandbox

# Setup working directory
WORKDIR /sandbox

# Copy security scripts
COPY security-monitor.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/security-monitor.sh

# Switch to non-root user
USER sandbox

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD echo "Sandbox healthy"

CMD ["node"]
    `.trim();

    const dockerfilePath = path.join(this.sandboxBasePath, 'Dockerfile');
    await fs.writeFile(dockerfilePath, dockerfile);

    // Create security monitor script
    const securityScript = `
#!/bin/sh
# Security monitor for sandbox

# Monitor system calls
strace -f -e trace=network,file,process -o /tmp/strace.log node /sandbox/code.js &

# Monitor network activity
while true; do
  lsof -i 2>/dev/null | grep -v "COMMAND" >> /tmp/network.log
  sleep 1
done
    `.trim();

    const securityScriptPath = path.join(this.sandboxBasePath, 'security-monitor.sh');
    await fs.writeFile(securityScriptPath, securityScript);

    // Build Docker image
    try {
      await this.executeCommand(`cd ${this.sandboxBasePath} && docker build -t ${this.dockerImageName} .`);
      console.log('✅ Sandbox Docker image built');
    } catch (error) {
      console.error('Failed to build sandbox image:', error);
      throw error;
    }
  }

  async executeInSandbox(execution: Omit<SandboxExecution, 'id' | 'startTime' | 'result'>): Promise<ExecutionResult> {
    const executionId = crypto.randomUUID();
    const startTime = new Date();

    const sandboxExecution: SandboxExecution = {
      id: executionId,
      ...execution,
      startTime,
      result: {
        success: false,
        output: '',
        error: '',
        exitCode: -1,
        executionTime: 0,
        resourceUsage: { cpuTime: 0, memoryPeak: 0, networkCalls: 0 },
        testResults: [],
        securityViolations: []
      }
    };

    this.activeSandboxes.set(executionId, sandboxExecution);

    try {
      console.log(`🏃 Executing code in sandbox: ${executionId}`);

      if (this.config.enableDockerSandbox) {
        return await this.executeInDockerSandbox(sandboxExecution);
      } else {
        return await this.executeInLocalSandbox(sandboxExecution);
      }

    } catch (error) {
      console.error(`Sandbox execution failed: ${executionId}`, error);

      sandboxExecution.result.error = error.message;
      sandboxExecution.result.success = false;

      return sandboxExecution.result;

    } finally {
      sandboxExecution.endTime = new Date();
      sandboxExecution.result.executionTime = sandboxExecution.endTime.getTime() - startTime.getTime();

      // Clean up after timeout
      setTimeout(() => {
        this.activeSandboxes.delete(executionId);
      }, this.config.timeoutConfig.cleanupTimeout * 1000);
    }
  }

  private async executeInDockerSandbox(execution: SandboxExecution): Promise<ExecutionResult> {
    const tempDir = path.join(this.sandboxBasePath, `temp-${execution.id}`);
    await fs.mkdir(tempDir, { recursive: true });

    try {
      // Write code to file
      const codeFile = path.join(tempDir, 'code.js');
      await fs.writeFile(codeFile, execution.code);

      // Write test cases
      const testFile = path.join(tempDir, 'tests.json');
      await fs.writeFile(testFile, JSON.stringify(execution.testCases, null, 2));

      // Prepare environment variables
      const envVars = Object.entries(execution.environment)
        .map(([key, value]) => `-e ${key}="${value}"`)
        .join(' ');

      // Build Docker run command
      const dockerCmd = this.buildDockerCommand(execution, tempDir, envVars);

      console.log(`🐳 Running Docker command: ${dockerCmd}`);

      // Execute in Docker with timeout
      const result = await this.executeWithTimeout(dockerCmd, execution.language === 'typescript' ? 60000 : 30000);

      // Parse results
      const executionResult = await this.parseExecutionResult(result, execution);

      return executionResult;

    } finally {
      // Clean up temp directory
      await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
    }
  }

  private buildDockerCommand(execution: SandboxExecution, tempDir: string, envVars: string): string {
    const baseCmd = `docker run --rm --name sandbox-${execution.id}`;

    // Resource limits
    const resourceLimits = this.config.enableResourceLimits ?
      `--cpus=${this.config.resourceLimits.cpuQuota} --memory=${this.config.resourceLimits.memoryLimit} --pids-limit=${this.config.resourceLimits.maxProcesses}` :
      '';

    // Network isolation
    const networkConfig = this.config.enableNetworkIsolation && !execution.networkAccess ?
      '--network none' :
      '';

    // File system isolation
    const fsConfig = this.config.enableFileSystemIsolation ?
      '--read-only --tmpfs /tmp:rw,noexec,nosuid,size=100m' :
      '';

    // Security options
    const securityOpts = this.config.securityConfig.disableSyscalls ?
      '--security-opt=no-new-privileges --cap-drop=ALL' :
      '';

    // Volume mounts
    const volumes = `-v ${tempDir}:/sandbox:ro`;

    // Execution script
    const execScript = `
    cd /sandbox &&
    timeout ${this.config.timeoutConfig.executionTimeout}s node code.js > output.log 2> error.log;
    echo $? > exit_code.txt
    `;

    return `${baseCmd} ${resourceLimits} ${networkConfig} ${fsConfig} ${securityOpts} ${volumes} ${envVars} alpine:latest sh -c "${execScript}"`;
  }

  private async executeInLocalSandbox(execution: SandboxExecution): Promise<ExecutionResult> {
    // Fallback to local execution (less secure, for development)
    console.log('⚠️ Using local sandbox (less secure)');

    const tempDir = path.join(this.sandboxBasePath, `temp-${execution.id}`);
    await fs.mkdir(tempDir, { recursive: true });

    try {
      const codeFile = path.join(tempDir, 'code.js');
      await fs.writeFile(codeFile, execution.code);

      // Execute with resource limits (simplified)
      const result = await this.executeWithTimeout(
        `cd ${tempDir} && timeout ${this.config.timeoutConfig.executionTimeout}s node code.js`,
        this.config.timeoutConfig.executionTimeout * 1000
      );

      return await this.parseExecutionResult(result, execution);

    } finally {
      await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
    }
  }

  private async executeWithTimeout(command: string, timeoutMs: number): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    return new Promise((resolve, reject) => {
      const child = exec(command, { timeout: timeoutMs }, (error, stdout, stderr) => {
        const exitCode = error ? (error.code || 1) : 0;
        resolve({ stdout, stderr, exitCode });
      });

      // Force kill after timeout
      setTimeout(() => {
        if (!child.killed) {
          child.kill('SIGKILL');
        }
      }, timeoutMs);
    });
  }

  private async parseExecutionResult(
    execResult: { stdout: string; stderr: string; exitCode: number },
    execution: SandboxExecution
  ): Promise<ExecutionResult> {
    const result: ExecutionResult = {
      success: execResult.exitCode === 0,
      output: execResult.stdout,
      error: execResult.stderr,
      exitCode: execResult.exitCode,
      executionTime: 0, // Will be set by caller
      resourceUsage: {
        cpuTime: 0, // Would need system monitoring
        memoryPeak: 0,
        networkCalls: 0
      },
      testResults: [],
      securityViolations: []
    };

    // Run test cases if provided
    if (execution.testCases && execution.testCases.length > 0) {
      result.testResults = await this.runTestCases(execution.testCases, execResult);
    }

    // Check for security violations
    result.securityViolations = await this.checkSecurityViolations(execResult);

    // Determine overall success
    result.success = result.exitCode === 0 &&
                    result.securityViolations.filter(v => v.severity === 'critical').length === 0 &&
                    result.testResults.every(t => t.passed);

    return result;
  }

  private async runTestCases(testCases: TestCase[], execResult: any): Promise<TestResult[]> {
    const results: TestResult[] = [];

    // This is a simplified test runner
    // In production, would integrate with Jest, Mocha, etc.

    for (const testCase of testCases) {
      const result: TestResult = {
        testId: testCase.id,
        passed: false,
        actualOutput: null,
        executionTime: 0
      };

      try {
        const startTime = Date.now();

        // Simple test execution (would need proper test framework)
        if (execResult.stdout.includes(testCase.expectedOutput.toString())) {
          result.passed = true;
          result.actualOutput = testCase.expectedOutput;
        } else {
          result.actualOutput = execResult.stdout;
          result.error = 'Output does not match expected result';
        }

        result.executionTime = Date.now() - startTime;

      } catch (error) {
        result.error = error.message;
      }

      results.push(result);
    }

    return results;
  }

  private async checkSecurityViolations(execResult: any): Promise<SecurityViolation[]> {
    const violations: SecurityViolation[] = [];

    // Check stderr for security-related messages
    const stderr = execResult.stderr || '';

    // Network violations
    if (stderr.includes('ECONNREFUSED') || stderr.includes('ENOTFOUND')) {
      violations.push({
        type: 'network',
        description: 'Attempted unauthorized network access',
        severity: 'medium',
        timestamp: Date.now()
      });
    }

    // File system violations
    if (stderr.includes('EACCES') || stderr.includes('EPERM')) {
      violations.push({
        type: 'filesystem',
        description: 'Attempted unauthorized file access',
        severity: 'high',
        timestamp: Date.now()
      });
    }

    // Resource violations
    if (stderr.includes('SIGKILL') || stderr.includes('SIGTERM')) {
      violations.push({
        type: 'resource',
        description: 'Process terminated due to resource limits',
        severity: 'low',
        timestamp: Date.now()
      });
    }

    // Check stdout for dangerous patterns
    const stdout = execResult.stdout || '';

    // Dangerous function calls
    const dangerousPatterns = [
      /require\(['"]child_process['"]\)/,
      /require\(['"]fs['"]\)/,
      /exec\(/,
      /spawn\(/,
      /eval\(/,
      /process\.exit/
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(stdout)) {
        violations.push({
          type: 'syscall',
          description: `Detected dangerous function call: ${pattern}`,
          severity: 'critical',
          timestamp: Date.now()
        });
      }
    }

    return violations;
  }

  async validateCodeSafety(code: string): Promise<{
    isSafe: boolean;
    violations: SecurityViolation[];
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
  }> {
    const violations: SecurityViolation[] = [];

    // Static analysis for dangerous patterns
    const dangerousPatterns = [
      { pattern: /require\(['"]child_process['"]\)/, type: 'syscall', severity: 'critical' as const },
      { pattern: /require\(['"]fs['"]\)/, type: 'filesystem', severity: 'high' as const },
      { pattern: /exec\(/, type: 'syscall', severity: 'critical' as const },
      { pattern: /spawn\(/, type: 'syscall', severity: 'critical' as const },
      { pattern: /eval\(/, type: 'syscall', severity: 'critical' as const },
      { pattern: /process\.exit/, type: 'syscall', severity: 'high' as const },
      { pattern: /require\(['"]http['"]\)/, type: 'network', severity: 'medium' as const },
      { pattern: /fetch\(/, type: 'network', severity: 'medium' as const },
      { pattern: /new WebSocket/, type: 'network', severity: 'medium' as const }
    ];

    for (const { pattern, type, severity } of dangerousPatterns) {
      if (pattern.test(code)) {
        violations.push({
          type,
          description: `Detected dangerous pattern: ${pattern}`,
          severity,
          timestamp: Date.now()
        });
      }
    }

    // Check for infinite loops (simplified)
    const loopPatterns = /for\s*\(\s*;;\s*\)|while\s*\(\s*true\s*\)/g;
    if (loopPatterns.test(code)) {
      violations.push({
        type: 'resource',
        description: 'Potential infinite loop detected',
        severity: 'high',
        timestamp: Date.now()
      });
    }

    // Determine risk level
    const criticalCount = violations.filter(v => v.severity === 'critical').length;
    const highCount = violations.filter(v => v.severity === 'high').length;

    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
    if (criticalCount > 0) riskLevel = 'critical';
    else if (highCount > 2) riskLevel = 'high';
    else if (violations.length > 3) riskLevel = 'medium';

    return {
      isSafe: riskLevel !== 'critical' && violations.filter(v => v.severity === 'critical').length === 0,
      violations,
      riskLevel
    };
  }

  getActiveSandboxes(): SandboxExecution[] {
    return Array.from(this.activeSandboxes.values());
  }

  async cleanupSandbox(sandboxId: string): Promise<boolean> {
    const sandbox = this.activeSandboxes.get(sandboxId);
    if (!sandbox) return false;

    // Clean up Docker containers if any
    try {
      await this.executeCommand(`docker rm -f sandbox-${sandboxId}`).catch(() => {});
    } catch (error) {
      console.error(`Failed to cleanup sandbox ${sandboxId}:`, error);
    }

    this.activeSandboxes.delete(sandboxId);
    return true;
  }

  async cleanupAllSandboxes(): Promise<void> {
    console.log('🧹 Cleaning up all sandboxes...');

    for (const [id] of this.activeSandboxes) {
      await this.cleanupSandbox(id);
    }

    // Clean up Docker containers
    await this.executeCommand('docker container prune -f').catch(() => {});

    console.log('✅ All sandboxes cleaned up');
  }

  getSandboxStats(): {
    activeSandboxes: number;
    totalExecutions: number;
    successRate: number;
    averageExecutionTime: number;
  } {
    const executions = Array.from(this.activeSandboxes.values());
    const completed = executions.filter(e => e.result);
    const successful = completed.filter(e => e.result.success);

    const avgTime = completed.length > 0 ?
      completed.reduce((sum, e) => sum + e.result.executionTime, 0) / completed.length : 0;

    return {
      activeSandboxes: executions.length,
      totalExecutions: completed.length,
      successRate: completed.length > 0 ? successful.length / completed.length : 0,
      averageExecutionTime: avgTime
    };
  }

  private async executeCommand(command: string): Promise<{ stdout: string; stderr: string }> {
    return new Promise((resolve, reject) => {
      exec(command, (error, stdout, stderr) => {
        if (error) {
          reject(error);
        } else {
          resolve({ stdout, stderr });
        }
      });
    });
  }
}

// Default configuration
export const defaultSandboxConfig: SandboxConfig = {
  enableDockerSandbox: true,
  enableResourceLimits: true,
  enableNetworkIsolation: true,
  enableFileSystemIsolation: true,
  resourceLimits: {
    cpuQuota: '0.5',
    memoryLimit: '512m',
    diskQuota: '1G',
    maxProcesses: 50
  },
  networkConfig: {
    disableNetwork: true,
    allowedDomains: ['api.openmind.ai', 'localhost']
  },
  securityConfig: {
    disableSyscalls: true,
    readOnlyRootFS: true,
    dropCapabilities: ['NET_RAW', 'SYS_ADMIN', 'DAC_OVERRIDE']
  },
  timeoutConfig: {
    executionTimeout: 30, // seconds
    testTimeout: 60, // seconds
    cleanupTimeout: 10 // seconds
  }
};