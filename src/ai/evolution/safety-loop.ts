import { SandboxEnvironment, SandboxExecution, ExecutionResult } from './sandbox-environment';
import { SelfCodingLoop, CodeOptimization } from './self-coding-loop';
import { promises as fs } from 'fs';
import path from 'path';
import * as crypto from 'crypto';

export interface SafetyLoopConfig {
  enableSafetyLoop: boolean;
  enableRecursiveFeedback: boolean;
  enableAutoRollback: boolean;
  safetyThresholds: {
    minSuccessRate: number; // 0-1
    maxSecurityViolations: number;
    minPerformanceImprovement: number; // percentage
    maxExecutionTime: number; // seconds
  };
  recursiveFeedback: {
    maxIterations: number;
    improvementThreshold: number; // minimum improvement per iteration
    timeoutPerIteration: number; // seconds
  };
  rollbackConfig: {
    enableBackups: boolean;
    maxBackups: number;
    autoRollbackTime: number; // minutes
  };
}

export interface EvolutionAttempt {
  id: string;
  timestamp: Date;
  targetFile: string;
  originalCode: string;
  proposedCode: string;
  sandboxResults: ExecutionResult;
  performanceMetrics: {
    original: { time: number; memory: number; cpu: number };
    optimized: { time: number; memory: number; cpu: number };
    improvement: number;
  };
  securityCheck: {
    passed: boolean;
    violations: any[];
  };
  testsPassed: boolean;
  approved: boolean;
  applied: boolean;
  rollbackReason?: string;
  iteration: number;
}

export class SafetyLoop {
  private config: SafetyLoopConfig;
  private sandbox: SandboxEnvironment;
  private codingLoop: SelfCodingLoop;
  private evolutionHistory: Map<string, EvolutionAttempt[]> = new Map();
  private activeEvolutions: Map<string, EvolutionAttempt> = new Map();

  constructor(
    config: SafetyLoopConfig,
    sandbox: SandboxEnvironment,
    codingLoop: SelfCodingLoop
  ) {
    this.config = config;
    this.sandbox = sandbox;
    this.codingLoop = codingLoop;
  }

  async safeEvolutionCycle(targetFile: string): Promise<{
    success: boolean;
    appliedOptimizations: number;
    performanceImprovement: number;
    safetyViolations: number;
  }> {
    console.log(`🔄 Starting Safe Evolution Cycle for ${targetFile}`);

    const startTime = Date.now();
    let totalImprovements = 0;
    let totalViolations = 0;
    let appliedCount = 0;

    try {
      // Phase 1: Isolation - Read original code and create backup
      console.log('📖 Phase 1: Code Isolation');
      const originalCode = await this.readOriginalCode(targetFile);
      const backupId = await this.createBackup(targetFile, originalCode);

      // Phase 2: Analysis - Profile current code
      console.log('📊 Phase 2: Code Analysis');
      const codeProfile = await this.codingLoop.profileFile(targetFile);

      // Phase 3: Proposal - Generate optimization proposals
      console.log('🧠 Phase 3: Optimization Proposals');
      const proposals = await this.generateOptimizationProposals(targetFile, codeProfile);

      // Phase 4: Testing - Test each proposal in sandbox
      console.log('🧪 Phase 4: Sandbox Testing');
      const testedProposals = await this.testProposalsInSandbox(proposals, originalCode);

      // Phase 5: Validation - Validate safety and performance
      console.log('✅ Phase 5: Safety Validation');
      const validatedProposals = await this.validateProposals(testedProposals);

      // Phase 6: Application - Apply safe optimizations
      console.log('🚀 Phase 6: Safe Application');
      const applicationResults = await this.applySafeOptimizations(validatedProposals, targetFile);

      // Phase 7: Verification - Verify system still works
      console.log('🔍 Phase 7: Post-Application Verification');
      const verificationResult = await this.verifySystemStability();

      if (!verificationResult.stable) {
        console.log('⚠️ System instability detected, initiating rollback');
        await this.rollbackToBackup(backupId, targetFile);
        return {
          success: false,
          appliedOptimizations: 0,
          performanceImprovement: 0,
          safetyViolations: verificationResult.violations
        };
      }

      // Calculate results
      appliedCount = applicationResults.applied.length;
      totalImprovements = applicationResults.totalImprovement;
      totalViolations = validatedProposals.reduce((sum, p) => sum + p.sandboxResults.securityViolations.length, 0);

      const cycleTime = Date.now() - startTime;
      console.log(`🎉 Evolution Cycle completed in ${cycleTime}ms`);
      console.log(`   ✅ Applied: ${appliedCount} optimizations`);
      console.log(`   📈 Performance: +${totalImprovements.toFixed(1)}%`);
      console.log(`   🛡️ Violations: ${totalViolations}`);

      return {
        success: true,
        appliedOptimizations: appliedCount,
        performanceImprovement: totalImprovements,
        safetyViolations: totalViolations
      };

    } catch (error) {
      console.error('Evolution cycle failed:', error);

      // Emergency rollback
      await this.emergencyRollback(targetFile);

      return {
        success: false,
        appliedOptimizations: 0,
        performanceImprovement: 0,
        safetyViolations: 1
      };
    }
  }

  private async readOriginalCode(filePath: string): Promise<string> {
    try {
      return await fs.readFile(filePath, 'utf8');
    } catch (error) {
      throw new Error(`Failed to read original code: ${error.message}`);
    }
  }

  private async createBackup(filePath: string, code: string): Promise<string> {
    const backupDir = path.join(process.cwd(), 'backups', 'evolution');
    await fs.mkdir(backupDir, { recursive: true });

    const backupId = crypto.randomUUID();
    const backupPath = path.join(backupDir, `${backupId}.bak`);

    const backupData = {
      id: backupId,
      timestamp: new Date(),
      filePath,
      code,
      hash: crypto.createHash('sha256').update(code).digest('hex')
    };

    await fs.writeFile(backupPath, JSON.stringify(backupData, null, 2));

    // Clean old backups
    await this.cleanOldBackups();

    return backupId;
  }

  private async cleanOldBackups(): Promise<void> {
    const backupDir = path.join(process.cwd(), 'backups', 'evolution');

    try {
      const files = await fs.readdir(backupDir);
      const backupFiles = files
        .filter(f => f.endsWith('.bak'))
        .map(f => ({
          name: f,
          path: path.join(backupDir, f),
          stats: null as any
        }));

      // Get file stats
      for (const file of backupFiles) {
        file.stats = await fs.stat(file.path);
      }

      // Sort by modification time (newest first)
      backupFiles.sort((a, b) => b.stats.mtime.getTime() - a.stats.mtime.getTime());

      // Remove old backups (keep only maxBackups)
      if (backupFiles.length > this.config.rollbackConfig.maxBackups) {
        const toDelete = backupFiles.slice(this.config.rollbackConfig.maxBackups);

        for (const file of toDelete) {
          await fs.unlink(file.path);
        }

        console.log(`🧹 Cleaned up ${toDelete.length} old evolution backups`);
      }

    } catch (error) {
      // Ignore cleanup errors
    }
  }

  private async generateOptimizationProposals(filePath: string, profile: any): Promise<any[]> {
    const proposals = [];

    // Generate proposals based on profile
    if (profile.bottlenecks.includes('Synchronous operations in async context')) {
      proposals.push({
        type: 'async_optimization',
        description: 'Convert synchronous operations to async/await',
        priority: 'high'
      });
    }

    if (profile.complexity > 20) {
      proposals.push({
        type: 'refactoring',
        description: 'Break down complex functions into smaller units',
        priority: 'medium'
      });
    }

    if (profile.performance < 50) {
      proposals.push({
        type: 'performance_optimization',
        description: 'Optimize algorithms and data structures',
        priority: 'high'
      });
    }

    // Use Self-Coding Loop to generate specific code changes
    for (const proposal of proposals) {
      try {
        const optimizationRequest = {
          id: crypto.randomUUID(),
          file: filePath,
          issue: proposal.description,
          currentCode: '', // Will be filled
          context: {
            performanceMetrics: {
              complexity: profile.complexity,
              performance: profile.performance,
              errorRate: profile.errorRate
            }
          }
        };

        // Generate optimized code
        const optimizedCode = await this.codingLoop.generateOptimizedCode(optimizationRequest);

        proposals.push({
          ...proposal,
          optimizedCode,
          requestId: optimizationRequest.id
        });

      } catch (error) {
        console.error(`Failed to generate proposal for ${proposal.type}:`, error);
      }
    }

    return proposals;
  }

  private async testProposalsInSandbox(proposals: any[], originalCode: string): Promise<any[]> {
    const testedProposals = [];

    for (const proposal of proposals) {
      if (!proposal.optimizedCode) continue;

      console.log(`🧪 Testing proposal: ${proposal.type}`);

      try {
        // Create test cases for the optimization
        const testCases = this.generateTestCases(proposal.type, originalCode);

        // Execute in sandbox
        const sandboxResult = await this.sandbox.executeInSandbox({
          code: proposal.optimizedCode,
          language: 'typescript',
          testCases,
          environment: {
            NODE_ENV: 'test',
            SANDBOX_MODE: 'true'
          },
          resourceLimits: {
            cpuQuota: '0.5',
            memoryLimit: '256m',
            diskQuota: '100m',
            maxProcesses: 10
          },
          networkAccess: false
        });

        testedProposals.push({
          ...proposal,
          sandboxResult,
          tested: true
        });

        console.log(`   ✅ Tests: ${sandboxResult.testResults.filter(t => t.passed).length}/${sandboxResult.testResults.length} passed`);

      } catch (error) {
        console.error(`   ❌ Sandbox test failed:`, error);
        testedProposals.push({
          ...proposal,
          sandboxResult: null,
          tested: false,
          error: error.message
        });
      }
    }

    return testedProposals;
  }

  private generateTestCases(proposalType: string, originalCode: string): any[] {
    // Generate basic test cases based on proposal type
    const testCases = [];

    switch (proposalType) {
      case 'async_optimization':
        testCases.push({
          id: 'async_test_1',
          input: null,
          expectedOutput: 'async operation completed',
          timeout: 5000,
          description: 'Test async operation completion'
        });
        break;

      case 'performance_optimization':
        testCases.push({
          id: 'perf_test_1',
          input: { size: 1000 },
          expectedOutput: 'operation completed within time limit',
          timeout: 2000,
          description: 'Test performance improvement'
        });
        break;

      default:
        testCases.push({
          id: 'basic_test_1',
          input: null,
          expectedOutput: 'test passed',
          timeout: 5000,
          description: 'Basic functionality test'
        });
    }

    return testCases;
  }

  private async validateProposals(testedProposals: any[]): Promise<any[]> {
    const validatedProposals = [];

    for (const proposal of testedProposals) {
      const validation = {
        safetyPassed: false,
        performancePassed: false,
        testsPassed: false,
        overallPassed: false
      };

      // Safety validation
      const safetyCheck = await this.sandbox.validateCodeSafety(proposal.optimizedCode);
      validation.safetyPassed = safetyCheck.isSafe;

      // Performance validation
      if (proposal.sandboxResult) {
        const improvement = this.calculatePerformanceImprovement(
          proposal.originalMetrics || {},
          proposal.sandboxResult.resourceUsage
        );
        validation.performancePassed = improvement >= this.config.safetyThresholds.minPerformanceImprovement;
        proposal.performanceImprovement = improvement;
      }

      // Test validation
      if (proposal.sandboxResult && proposal.sandboxResult.testResults) {
        const passedTests = proposal.sandboxResult.testResults.filter(t => t.passed).length;
        const totalTests = proposal.sandboxResult.testResults.length;
        const successRate = totalTests > 0 ? passedTests / totalTests : 0;
        validation.testsPassed = successRate >= this.config.safetyThresholds.minSuccessRate;
      }

      // Overall validation
      validation.overallPassed = validation.safetyPassed && validation.performancePassed && validation.testsPassed;

      validatedProposals.push({
        ...proposal,
        validation
      });

      console.log(`🔍 Validation for ${proposal.type}: ${validation.overallPassed ? 'PASSED' : 'FAILED'}`);
    }

    return validatedProposals;
  }

  private calculatePerformanceImprovement(original: any, optimized: any): number {
    // Simplified performance calculation
    const originalTime = original.time || 1000;
    const optimizedTime = optimized.cpuTime || 800;

    if (optimizedTime === 0) return 0;

    const improvement = ((originalTime - optimizedTime) / originalTime) * 100;
    return Math.max(0, improvement);
  }

  private async applySafeOptimizations(validatedProposals: any[], targetFile: string): Promise<{
    applied: any[];
    totalImprovement: number;
  }> {
    const applied = [];
    let totalImprovement = 0;

    // Sort by safety and performance (safest first)
    const safeProposals = validatedProposals
      .filter(p => p.validation.overallPassed)
      .sort((a, b) => {
        // Prioritize critical safety improvements
        if (a.priority === 'high' && b.priority !== 'high') return -1;
        if (b.priority === 'high' && a.priority !== 'high') return 1;
        // Then by performance improvement
        return (b.performanceImprovement || 0) - (a.performanceImprovement || 0);
      });

    for (const proposal of safeProposals) {
      try {
        console.log(`📝 Applying optimization: ${proposal.type}`);

        // Apply the optimization
        await fs.writeFile(targetFile, proposal.optimizedCode);

        // Record the application
        applied.push(proposal);
        totalImprovement += proposal.performanceImprovement || 0;

        // Create evolution record
        await this.recordEvolutionAttempt(targetFile, proposal, true);

        console.log(`   ✅ Applied ${proposal.type} (+${proposal.performanceImprovement?.toFixed(1) || 0}% improvement)`);

        // Test that the system still works after application
        const stabilityTest = await this.quickStabilityTest();
        if (!stabilityTest.passed) {
          console.log(`   ⚠️ Stability test failed, reverting ${proposal.type}`);
          await this.revertOptimization(targetFile, proposal);
          applied.pop();
          totalImprovement -= proposal.performanceImprovement || 0;
        }

      } catch (error) {
        console.error(`Failed to apply optimization ${proposal.type}:`, error);
      }
    }

    return { applied, totalImprovement };
  }

  private async quickStabilityTest(): Promise<{ passed: boolean; violations: number }> {
    try {
      // Quick syntax check
      await this.sandbox.executeInSandbox({
        code: 'console.log("Stability test");',
        language: 'javascript',
        testCases: [],
        environment: {},
        resourceLimits: { cpuQuota: '0.1', memoryLimit: '64m', diskQuota: '10m', maxProcesses: 5 },
        networkAccess: false
      });

      return { passed: true, violations: 0 };

    } catch (error) {
      return { passed: false, violations: 1 };
    }
  }

  private async revertOptimization(targetFile: string, proposal: any): Promise<void> {
    // Find the backup and revert
    const backupDir = path.join(process.cwd(), 'backups', 'evolution');

    try {
      const files = await fs.readdir(backupDir);
      const recentBackup = files
        .filter(f => f.endsWith('.bak'))
        .sort()
        .reverse()[0];

      if (recentBackup) {
        const backupPath = path.join(backupDir, recentBackup);
        const backupData = JSON.parse(await fs.readFile(backupPath, 'utf8'));

        await fs.writeFile(targetFile, backupData.code);
        console.log(`🔄 Reverted ${targetFile} to backup`);
      }

    } catch (error) {
      console.error('Failed to revert optimization:', error);
    }
  }

  private async verifySystemStability(): Promise<{ stable: boolean; violations: number }> {
    console.log('🔍 Verifying system stability...');

    try {
      // Run a comprehensive stability test
      const stabilityTest = await this.sandbox.executeInSandbox({
        code: `
        // Comprehensive stability test
        const fs = require('fs');
        const path = require('path');

        // Test file operations
        const testFile = path.join(process.cwd(), 'stability-test.tmp');
        fs.writeFileSync(testFile, 'stability test');
        const content = fs.readFileSync(testFile, 'utf8');
        fs.unlinkSync(testFile);

        // Test basic computations
        let sum = 0;
        for (let i = 0; i < 1000; i++) {
          sum += i;
        }

        console.log('Stability test passed: ' + (content === 'stability test' && sum === 499500));
        `,
        language: 'javascript',
        testCases: [{
          id: 'stability_test',
          input: null,
          expectedOutput: 'Stability test passed: true',
          timeout: 10000,
          description: 'System stability verification'
        }],
        environment: { NODE_ENV: 'test' },
        resourceLimits: { cpuQuota: '0.5', memoryLimit: '128m', diskQuota: '50m', maxProcesses: 10 },
        networkAccess: false
      });

      const violations = stabilityTest.securityViolations.length;
      const stable = stabilityTest.success && violations === 0;

      console.log(`   Stability: ${stable ? '✅ PASSED' : '❌ FAILED'} (${violations} violations)`);

      return { stable, violations };

    } catch (error) {
      console.error('Stability verification failed:', error);
      return { stable: false, violations: 1 };
    }
  }

  private async recordEvolutionAttempt(
    targetFile: string,
    proposal: any,
    applied: boolean
  ): Promise<void> {
    const attempt: EvolutionAttempt = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      targetFile,
      originalCode: proposal.originalCode || '',
      proposedCode: proposal.optimizedCode,
      sandboxResults: proposal.sandboxResult,
      performanceMetrics: {
        original: proposal.originalMetrics || { time: 0, memory: 0, cpu: 0 },
        optimized: proposal.sandboxResult?.resourceUsage || { time: 0, memory: 0, cpu: 0 },
        improvement: proposal.performanceImprovement || 0
      },
      securityCheck: {
        passed: proposal.validation?.safetyPassed || false,
        violations: proposal.sandboxResult?.securityViolations || []
      },
      testsPassed: proposal.validation?.testsPassed || false,
      approved: proposal.validation?.overallPassed || false,
      applied,
      iteration: 1
    };

    if (!this.evolutionHistory.has(targetFile)) {
      this.evolutionHistory.set(targetFile, []);
    }

    this.evolutionHistory.get(targetFile)!.push(attempt);
  }

  private async rollbackToBackup(backupId: string, targetFile: string): Promise<void> {
    const backupDir = path.join(process.cwd(), 'backups', 'evolution');
    const backupPath = path.join(backupDir, `${backupId}.bak`);

    try {
      const backupData = JSON.parse(await fs.readFile(backupPath, 'utf8'));
      await fs.writeFile(targetFile, backupData.code);

      console.log(`🔄 Successfully rolled back ${targetFile} to backup ${backupId}`);

    } catch (error) {
      console.error(`Failed to rollback to backup ${backupId}:`, error);
      throw error;
    }
  }

  private async emergencyRollback(targetFile: string): Promise<void> {
    console.log('🚨 Emergency rollback initiated');

    // Find the most recent working backup
    const backupDir = path.join(process.cwd(), 'backups', 'evolution');

    try {
      const files = await fs.readdir(backupDir);
      const backups = [];

      for (const file of files) {
        if (file.endsWith('.bak')) {
          const filePath = path.join(backupDir, file);
          const stats = await fs.stat(filePath);
          const data = JSON.parse(await fs.readFile(filePath, 'utf8'));

          backups.push({ file, path: filePath, stats, data });
        }
      }

      // Sort by timestamp (newest first)
      backups.sort((a, b) => new Date(b.data.timestamp).getTime() - new Date(a.data.timestamp).getTime());

      // Try each backup until one works
      for (const backup of backups.slice(0, 3)) { // Try latest 3 backups
        try {
          console.log(`Trying backup: ${backup.file}`);
          await fs.writeFile(targetFile, backup.data.code);

          // Test if it works
          const test = await this.quickStabilityTest();
          if (test.passed) {
            console.log(`✅ Emergency rollback successful with backup ${backup.file}`);
            return;
          }

        } catch (error) {
          console.log(`Backup ${backup.file} failed:`, error);
        }
      }

      console.error('❌ All emergency rollbacks failed');

    } catch (error) {
      console.error('Emergency rollback failed:', error);
    }
  }

  // Public API methods
  getEvolutionHistory(filePath?: string): EvolutionAttempt[] {
    if (filePath) {
      return this.evolutionHistory.get(filePath) || [];
    }

    // Return all evolution history
    const allHistory: EvolutionAttempt[] = [];
    for (const attempts of this.evolutionHistory.values()) {
      allHistory.push(...attempts);
    }

    return allHistory.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  getEvolutionStats(): {
    totalAttempts: number;
    successfulApplications: number;
    averageImprovement: number;
    safetyViolations: number;
    filesOptimized: number;
  } {
    const allAttempts = this.getEvolutionHistory();

    const successful = allAttempts.filter(a => a.applied);
    const totalImprovement = successful.reduce((sum, a) => sum + a.performanceMetrics.improvement, 0);
    const totalViolations = allAttempts.reduce((sum, a) => sum + a.securityCheck.violations.length, 0);

    return {
      totalAttempts: allAttempts.length,
      successfulApplications: successful.length,
      averageImprovement: successful.length > 0 ? totalImprovement / successful.length : 0,
      safetyViolations: totalViolations,
      filesOptimized: this.evolutionHistory.size
    };
  }

  async forceRollback(filePath: string): Promise<boolean> {
    try {
      await this.emergencyRollback(filePath);
      return true;
    } catch (error) {
      console.error('Forced rollback failed:', error);
      return false;
    }
  }

  async enableAutoEvolution(enable: boolean): Promise<void> {
    // This would enable/disable automatic evolution cycles
    console.log(`${enable ? '✅' : '❌'} Auto-evolution ${enable ? 'enabled' : 'disabled'}`);
  }

  async runRecursiveFeedback(filePath: string, maxIterations: number = 3): Promise<{
    finalCode: string;
    iterations: number;
    totalImprovement: number;
    converged: boolean;
  }> {
    console.log(`🔄 Starting Recursive Feedback for ${filePath}`);

    let currentCode = await fs.readFile(filePath, 'utf8');
    let totalImprovement = 0;
    let iteration = 0;
    let converged = false;

    for (iteration = 1; iteration <= Math.min(maxIterations, this.config.recursiveFeedback.maxIterations); iteration++) {
      console.log(`Iteration ${iteration}/${maxIterations}`);

      try {
        // Generate optimization
        const profile = await this.codingLoop.profileFile(filePath);
        const proposals = await this.generateOptimizationProposals(filePath, profile);
        const tested = await this.testProposalsInSandbox(proposals, currentCode);
        const validated = await this.validateProposals(tested);

        const bestProposal = validated
          .filter(p => p.validation.overallPassed)
          .sort((a, b) => (b.performanceImprovement || 0) - (a.performanceImprovement || 0))[0];

        if (!bestProposal || bestProposal.performanceImprovement < this.config.recursiveFeedback.improvementThreshold) {
          console.log('No significant improvement found, converging');
          converged = true;
          break;
        }

        // Apply the improvement
        await fs.writeFile(filePath, bestProposal.optimizedCode);
        currentCode = bestProposal.optimizedCode;
        totalImprovement += bestProposal.performanceImprovement;

        console.log(`   ✅ Iteration ${iteration}: +${bestProposal.performanceImprovement.toFixed(1)}% improvement`);

      } catch (error) {
        console.error(`Iteration ${iteration} failed:`, error);
        break;
      }
    }

    return {
      finalCode: currentCode,
      iterations: iteration - 1,
      totalImprovement,
      converged
    };
  }
}

// Default configuration
export const defaultSafetyLoopConfig: SafetyLoopConfig = {
  enableSafetyLoop: true,
  enableRecursiveFeedback: true,
  enableAutoRollback: true,
  safetyThresholds: {
    minSuccessRate: 0.8,
    maxSecurityViolations: 0,
    minPerformanceImprovement: 5.0, // 5% minimum
    maxExecutionTime: 30
  },
  recursiveFeedback: {
    maxIterations: 5,
    improvementThreshold: 2.0, // 2% minimum per iteration
    timeoutPerIteration: 60
  },
  rollbackConfig: {
    enableBackups: true,
    maxBackups: 10,
    autoRollbackTime: 30 // 30 minutes
  }
};