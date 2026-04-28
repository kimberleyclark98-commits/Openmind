#!/usr/bin/env node

/**
 * Evolution Gate - The Final Guardian
 * Controls the application of AI-generated code optimizations
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class EvolutionGate {
  constructor() {
    this.backupDir = path.join(process.cwd(), 'backups', 'gate');
    this.logFile = path.join(process.cwd(), 'logs', 'evolution-gate.log');
    this.securityThresholds = {
      maxSecurityViolations: 0,
      minTestPassRate: 0.9,
      maxPerformanceRegression: 5.0, // 5% max regression
      requiredStabilityTime: 300000 // 5 minutes
    };
  }

  async evaluateEvolution(proposedCode, targetFile, metadata = {}) {
    console.log('🚪 Evolution Gate: Evaluating proposed code changes');
    console.log(`Target: ${targetFile}`);
    console.log(`Code size: ${proposedCode.length} characters`);

    const evaluationId = crypto.randomUUID();
    const timestamp = new Date();

    try {
      // Phase 1: Security Analysis
      console.log('🔒 Phase 1: Security Analysis');
      const securityResult = await this.performSecurityAnalysis(proposedCode);

      if (!securityResult.passed) {
        throw new Error(`Security check failed: ${securityResult.reason}`);
      }

      // Phase 2: Code Quality Assessment
      console.log('📊 Phase 2: Code Quality Assessment');
      const qualityResult = await this.assessCodeQuality(proposedCode, targetFile);

      // Phase 3: Performance Projection
      console.log('⚡ Phase 3: Performance Projection');
      const performanceResult = await this.projectPerformanceImpact(proposedCode, targetFile);

      // Phase 4: Compatibility Check
      console.log('🔗 Phase 4: Compatibility Check');
      const compatibilityResult = await this.checkCompatibility(proposedCode, targetFile);

      // Phase 5: Risk Assessment
      console.log('🎲 Phase 5: Risk Assessment');
      const riskAssessment = this.assessOverallRisk({
        security: securityResult,
        quality: qualityResult,
        performance: performanceResult,
        compatibility: compatibilityResult
      });

      // Decision
      const decision = this.makeEvolutionDecision(riskAssessment);

      // Log the evaluation
      await this.logEvaluation(evaluationId, {
        timestamp,
        targetFile,
        proposedCode: proposedCode.substring(0, 200) + '...',
        metadata,
        securityResult,
        qualityResult,
        performanceResult,
        compatibilityResult,
        riskAssessment,
        decision
      });

      console.log(`\n🎯 Evolution Decision: ${decision.approved ? 'APPROVED' : 'REJECTED'}`);
      console.log(`Reason: ${decision.reason}`);

      if (decision.approved) {
        console.log('✅ Proceeding with safe evolution...');
        const applicationResult = await this.applyEvolution(proposedCode, targetFile, evaluationId);

        return {
          approved: true,
          evaluationId,
          applicationResult,
          message: 'Evolution approved and applied successfully'
        };
      } else {
        console.log('❌ Evolution rejected for safety');
        return {
          approved: false,
          evaluationId,
          reason: decision.reason,
          message: 'Evolution rejected by safety protocols'
        };
      }

    } catch (error) {
      console.error('❌ Evolution evaluation failed:', error.message);

      await this.logEvaluation(evaluationId, {
        timestamp,
        targetFile,
        error: error.message,
        status: 'failed'
      });

      return {
        approved: false,
        evaluationId,
        error: error.message,
        message: 'Evolution evaluation failed'
      };
    }
  }

  async performSecurityAnalysis(code) {
    const violations = [];

    // Critical security patterns
    const criticalPatterns = [
      { pattern: /require\(['"]child_process['"]\)/, type: 'Dangerous module import' },
      { pattern: /exec\(|spawn\(|eval\(/, type: 'Code execution vulnerability' },
      { pattern: /process\.exit\(/, type: 'Process termination vulnerability' },
      { pattern: /fs\.unlinkSync\(|fs\.rmSync\(/, type: 'File deletion vulnerability' },
      { pattern: /new Function\(/, type: 'Dynamic code execution' }
    ];

    for (const { pattern, type } of criticalPatterns) {
      if (pattern.test(code)) {
        violations.push({ type, pattern: pattern.toString(), severity: 'critical' });
      }
    }

    // High-risk patterns
    const highRiskPatterns = [
      { pattern: /require\(['"]fs['"]\)/, type: 'File system access' },
      { pattern: /require\(['"]http['"]\)/, type: 'Network access' },
      { pattern: /console\.log\(.*password.*\)/i, type: 'Potential credential leak' }
    ];

    for (const { pattern, type } of highRiskPatterns) {
      if (pattern.test(code)) {
        violations.push({ type, pattern: pattern.toString(), severity: 'high' });
      }
    }

    const criticalViolations = violations.filter(v => v.severity === 'critical');

    return {
      passed: criticalViolations.length === 0,
      violations,
      criticalCount: criticalViolations.length,
      totalCount: violations.length,
      reason: criticalViolations.length > 0 ?
        `Found ${criticalViolations.length} critical security violations` :
        'Security analysis passed'
    };
  }

  async assessCodeQuality(code, targetFile) {
    const metrics = {
      linesOfCode: code.split('\n').length,
      complexity: this.calculateComplexity(code),
      maintainabilityIndex: this.calculateMaintainabilityIndex(code),
      duplicationScore: this.checkCodeDuplication(code),
      testCoverage: await this.estimateTestCoverage(code, targetFile)
    };

    // Quality thresholds
    const thresholds = {
      maxComplexity: 15,
      minMaintainability: 50,
      maxDuplication: 20,
      minTestCoverage: 70
    };

    const issues = [];

    if (metrics.complexity > thresholds.maxComplexity) {
      issues.push(`High complexity: ${metrics.complexity} > ${thresholds.maxComplexity}`);
    }

    if (metrics.maintainabilityIndex < thresholds.minMaintainability) {
      issues.push(`Low maintainability: ${metrics.maintainabilityIndex} < ${thresholds.minMaintainability}`);
    }

    if (metrics.duplicationScore > thresholds.maxDuplication) {
      issues.push(`High duplication: ${metrics.duplicationScore}% > ${thresholds.maxDuplication}%`);
    }

    if (metrics.testCoverage < thresholds.minTestCoverage) {
      issues.push(`Low test coverage: ${metrics.testCoverage}% < ${thresholds.minTestCoverage}%`);
    }

    return {
      metrics,
      issues,
      passed: issues.length === 0,
      score: this.calculateQualityScore(metrics, thresholds)
    };
  }

  calculateComplexity(code) {
    let complexity = 1; // Base complexity

    // Control structures
    const controlPatterns = [
      /\bif\s*\(/g,
      /\bfor\s*\(/g,
      /\bwhile\s*\(/g,
      /\bswitch\s*\(/g,
      /\bcatch\s*\(/g,
      /\bcase\s+/g
    ];

    controlPatterns.forEach(pattern => {
      const matches = code.match(pattern);
      if (matches) complexity += matches.length;
    });

    // Logical operators
    const logicalOps = (code.match(/\|\||&&/g) || []).length;
    complexity += Math.floor(logicalOps / 2);

    return complexity;
  }

  calculateMaintainabilityIndex(code) {
    // Simplified maintainability index calculation
    const linesOfCode = code.split('\n').length;
    const complexity = this.calculateComplexity(code);

    // Very simplified formula
    let mi = 171 - 5.2 * Math.log(linesOfCode) - 0.23 * complexity;

    // Normalize to 0-100 scale
    mi = Math.max(0, Math.min(100, mi));

    return Math.round(mi);
  }

  checkCodeDuplication(code) {
    // Simplified duplication check
    const lines = code.split('\n').filter(line => line.trim().length > 10);
    const uniqueLines = new Set(lines);

    const duplicationRate = ((lines.length - uniqueLines.size) / lines.length) * 100;
    return Math.round(duplicationRate);
  }

  async estimateTestCoverage(code, targetFile) {
    // Check if corresponding test file exists
    const testFile = targetFile.replace(/\.ts$/, '.test.ts').replace(/\.js$/, '.test.js');

    try {
      await fs.access(testFile);
      return 85; // Assume good coverage if test file exists
    } catch {
      return 0; // No test coverage
    }
  }

  calculateQualityScore(metrics, thresholds) {
    let score = 100;

    // Complexity penalty
    if (metrics.complexity > thresholds.maxComplexity) {
      score -= (metrics.complexity - thresholds.maxComplexity) * 5;
    }

    // Maintainability bonus/penalty
    const maintainabilityDiff = metrics.maintainabilityIndex - thresholds.minMaintainability;
    score += maintainabilityDiff;

    // Duplication penalty
    if (metrics.duplicationScore > thresholds.maxDuplication) {
      score -= (metrics.duplicationScore - thresholds.maxDuplication) * 2;
    }

    // Test coverage bonus
    const coverageDiff = metrics.testCoverage - thresholds.minTestCoverage;
    score += coverageDiff;

    return Math.max(0, Math.min(100, score));
  }

  async projectPerformanceImpact(proposedCode, targetFile) {
    // Simplified performance projection
    const originalSize = (await fs.stat(targetFile)).size;
    const proposedSize = Buffer.byteLength(proposedCode, 'utf8');

    const sizeChange = ((proposedSize - originalSize) / originalSize) * 100;

    // Estimate performance impact based on code changes
    let performanceImpact = 0;

    // Async/await improvements
    if (proposedCode.includes('await') && !proposedCode.includes('.then(')) {
      performanceImpact += 5; // Better async handling
    }

    // Memory optimizations
    if (proposedCode.includes('stream') || proposedCode.includes('pipeline')) {
      performanceImpact += 3; // Better memory usage
    }

    // Algorithm optimizations (simplified detection)
    if (proposedCode.includes('Map(') || proposedCode.includes('Set(')) {
      performanceImpact += 2; // Better data structures
    }

    return {
      sizeChange: Math.round(sizeChange * 100) / 100,
      estimatedPerformanceImpact: performanceImpact,
      riskLevel: sizeChange > 50 ? 'high' : sizeChange > 20 ? 'medium' : 'low',
      projectedRegression: Math.max(0, -performanceImpact + Math.abs(sizeChange) * 0.1)
    };
  }

  async checkCompatibility(proposedCode, targetFile) {
    const issues = [];

    try {
      // Check syntax validity
      const syntaxValid = await this.validateSyntax(proposedCode);
      if (!syntaxValid) {
        issues.push('Invalid syntax detected');
      }

      // Check import/export compatibility
      const importIssues = this.checkImportCompatibility(proposedCode, targetFile);
      issues.push(...importIssues);

      // Check framework compatibility (if applicable)
      if (targetFile.includes('react') || targetFile.includes('component')) {
        const reactIssues = this.checkReactCompatibility(proposedCode);
        issues.push(...reactIssues);
      }

      // Check TypeScript compatibility
      if (targetFile.endsWith('.ts') || targetFile.endsWith('.tsx')) {
        const tsIssues = this.checkTypeScriptCompatibility(proposedCode);
        issues.push(...tsIssues);
      }

    } catch (error) {
      issues.push(`Compatibility check failed: ${error.message}`);
    }

    return {
      compatible: issues.length === 0,
      issues,
      confidence: Math.max(0, 100 - issues.length * 20)
    };
  }

  async validateSyntax(code) {
    try {
      // Use Node.js to validate syntax
      const { exec } = require('child_process');
      const util = require('util');
      const execAsync = util.promisify(exec);

      const tempFile = `/tmp/syntax-check-${Date.now()}.js`;
      await fs.writeFile(tempFile, code);

      await execAsync(`node -c ${tempFile}`);
      await fs.unlink(tempFile);

      return true;
    } catch {
      return false;
    }
  }

  checkImportCompatibility(code, targetFile) {
    const issues = [];

    // Check for invalid imports
    const importMatches = code.match(/import\s+.*from\s+['"]([^'"]+)['"]/g) || [];
    for (const match of importMatches) {
      const importPath = match.match(/from\s+['"]([^'"]+)['"]/)[1];

      // Check if import path exists or is valid
      if (importPath.startsWith('.') && !importPath.includes('node_modules')) {
        const resolvedPath = path.resolve(path.dirname(targetFile), importPath);
        try {
          // Try to resolve the path
          require.resolve(resolvedPath);
        } catch {
          issues.push(`Import path may not exist: ${importPath}`);
        }
      }
    }

    return issues;
  }

  checkReactCompatibility(code) {
    const issues = [];

    // Check for common React issues
    if (code.includes('useState') && !code.includes('import.*useState')) {
      issues.push('useState used without import');
    }

    if (code.includes('useEffect') && !code.includes('import.*useEffect')) {
      issues.push('useEffect used without import');
    }

    // Check for JSX without proper setup
    if (code.includes('<') && code.includes('>') && !code.includes('React.')) {
      const jsxMatches = code.match(/<[^>]+>/g) || [];
      if (jsxMatches.length > 0) {
        issues.push('JSX detected without React import');
      }
    }

    return issues;
  }

  checkTypeScriptCompatibility(code) {
    const issues = [];

    // Check for TypeScript-specific issues
    const typeAnnotations = code.match(/:\s*[A-Z]\w*/g) || [];
    for (const annotation of typeAnnotations) {
      // Check for potentially invalid type annotations
      if (annotation.includes(':')) {
        const typeName = annotation.split(':')[1].trim();
        if (!['string', 'number', 'boolean', 'any', 'void', 'unknown'].includes(typeName) &&
            !typeName.match(/^[A-Z]\w*$/)) {
          issues.push(`Potentially invalid type annotation: ${annotation}`);
        }
      }
    }

    return issues;
  }

  assessOverallRisk(components) {
    let riskScore = 0;
    const riskFactors = [];

    // Security risk
    if (!components.security.passed) {
      riskScore += 50;
      riskFactors.push(`Security violations: ${components.security.criticalCount} critical`);
    }

    // Quality risk
    if (!components.quality.passed) {
      riskScore += 20;
      riskFactors.push(`Quality issues: ${components.quality.issues.length}`);
    }

    // Performance risk
    if (components.performance.projectedRegression > this.securityThresholds.maxPerformanceRegression) {
      riskScore += 15;
      riskFactors.push(`Performance regression: ${components.performance.projectedRegression.toFixed(1)}%`);
    }

    // Compatibility risk
    if (!components.compatibility.compatible) {
      riskScore += 15;
      riskFactors.push(`Compatibility issues: ${components.compatibility.issues.length}`);
    }

    // Size change risk
    if (Math.abs(components.performance.sizeChange) > 100) {
      riskScore += 10;
      riskFactors.push(`Size change: ${components.performance.sizeChange}%`);
    }

    const riskLevel = riskScore >= 60 ? 'critical' :
                     riskScore >= 30 ? 'high' :
                     riskScore >= 15 ? 'medium' : 'low';

    return {
      riskScore,
      riskLevel,
      riskFactors,
      acceptable: riskScore < 30
    };
  }

  makeEvolutionDecision(riskAssessment) {
    const { riskScore, riskLevel, acceptable } = riskAssessment;

    if (acceptable) {
      return {
        approved: true,
        reason: `Low risk evolution (${riskScore} points, ${riskLevel} level)`,
        confidence: Math.max(70, 100 - riskScore)
      };
    } else {
      return {
        approved: false,
        reason: `High risk evolution rejected (${riskScore} points, ${riskLevel} level)`,
        confidence: Math.max(0, 50 - riskScore)
      };
    }
  }

  async applyEvolution(proposedCode, targetFile, evaluationId) {
    console.log('🔧 Applying approved evolution...');

    try {
      // Create backup
      const backupId = await this.createBackup(targetFile, evaluationId);

      // Apply the code
      await fs.writeFile(targetFile, proposedCode);

      // Verify the application
      const verification = await this.verifyApplication(targetFile);

      if (!verification.success) {
        // Rollback on failure
        await this.rollbackToBackup(backupId, targetFile);
        throw new Error(`Application verification failed: ${verification.error}`);
      }

      // Log successful application
      await this.logApplication(evaluationId, {
        backupId,
        appliedAt: new Date(),
        verification
      });

      console.log('✅ Evolution applied successfully');

      return {
        success: true,
        backupId,
        appliedAt: new Date(),
        verification
      };

    } catch (error) {
      console.error('❌ Evolution application failed:', error.message);
      throw error;
    }
  }

  async createBackup(targetFile, evaluationId) {
    await fs.mkdir(this.backupDir, { recursive: true });

    const originalCode = await fs.readFile(targetFile, 'utf8');
    const backupId = `backup-${evaluationId}-${Date.now()}`;

    const backupData = {
      id: backupId,
      evaluationId,
      targetFile,
      originalCode,
      hash: crypto.createHash('sha256').update(originalCode).digest('hex'),
      createdAt: new Date()
    };

    const backupPath = path.join(this.backupDir, `${backupId}.json`);
    await fs.writeFile(backupPath, JSON.stringify(backupData, null, 2));

    console.log(`💾 Backup created: ${backupId}`);
    return backupId;
  }

  async verifyApplication(targetFile) {
    try {
      // Syntax check
      const syntaxValid = await this.validateSyntax(await fs.readFile(targetFile, 'utf8'));

      if (!syntaxValid) {
        return { success: false, error: 'Syntax validation failed' };
      }

      // Import resolution check
      const importCheck = await this.checkImportResolution(targetFile);

      if (!importCheck.success) {
        return { success: false, error: `Import resolution failed: ${importCheck.error}` };
      }

      return { success: true };

    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async checkImportResolution(targetFile) {
    try {
      // Basic import resolution check
      const code = await fs.readFile(targetFile, 'utf8');

      // This is a simplified check - in production would use TypeScript compiler API
      const importMatches = code.match(/import\s+.*from\s+['"]([^'"]+)['"]/g) || [];

      for (const match of importMatches) {
        const importPath = match.match(/from\s+['"]([^'"]+)['"]/)[1];

        if (importPath.startsWith('.')) {
          // Relative import - check if file exists
          const resolvedPath = path.resolve(path.dirname(targetFile), importPath);
          try {
            await fs.access(resolvedPath + '.ts');
          } catch {
            try {
              await fs.access(resolvedPath + '.js');
            } catch {
              return { success: false, error: `Cannot resolve import: ${importPath}` };
            }
          }
        }
      }

      return { success: true };

    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async rollbackToBackup(backupId, targetFile) {
    const backupPath = path.join(this.backupDir, `${backupId}.json`);

    try {
      const backupData = JSON.parse(await fs.readFile(backupPath, 'utf8'));
      await fs.writeFile(targetFile, backupData.originalCode);

      console.log(`🔄 Rolled back ${targetFile} to backup ${backupId}`);

    } catch (error) {
      console.error(`Failed to rollback to backup ${backupId}:`, error);
      throw error;
    }
  }

  async logEvaluation(evaluationId, data) {
    const logEntry = {
      evaluationId,
      ...data,
      loggedAt: new Date()
    };

    try {
      await fs.appendFile(this.logFile, JSON.stringify(logEntry) + '\n');
    } catch (error) {
      console.error('Failed to log evaluation:', error);
    }
  }

  async logApplication(evaluationId, data) {
    const logEntry = {
      type: 'application',
      evaluationId,
      ...data,
      loggedAt: new Date()
    };

    try {
      await fs.appendFile(this.logFile, JSON.stringify(logEntry) + '\n');
    } catch (error) {
      console.error('Failed to log application:', error);
    }
  }

  // Emergency rollback function
  async emergencyRollback(targetFile, evaluationId) {
    console.log('🚨 Emergency rollback initiated');

    // Find the most recent backup for this file
    try {
      const files = await fs.readdir(this.backupDir);
      const backups = [];

      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = path.join(this.backupDir, file);
          const data = JSON.parse(await fs.readFile(filePath, 'utf8'));

          if (data.targetFile === targetFile) {
            backups.push(data);
          }
        }
      }

      // Sort by creation time (newest first)
      backups.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      if (backups.length > 0) {
        const latestBackup = backups[0];
        await fs.writeFile(targetFile, latestBackup.originalCode);

        console.log(`✅ Emergency rollback successful: ${latestBackup.id}`);

        return { success: true, backupId: latestBackup.id };
      } else {
        console.error('No backups found for emergency rollback');
        return { success: false, error: 'No backups available' };
      }

    } catch (error) {
      console.error('Emergency rollback failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Get evaluation history
  async getEvaluationHistory(limit = 50) {
    try {
      const logContent = await fs.readFile(this.logFile, 'utf8');
      const entries = logContent.trim().split('\n').map(line => JSON.parse(line));

      return entries
        .filter(entry => entry.evaluationId) // Only evaluation entries
        .sort((a, b) => new Date(b.timestamp || b.loggedAt).getTime() - new Date(a.timestamp || a.loggedAt).getTime())
        .slice(0, limit);

    } catch (error) {
      console.error('Failed to read evaluation history:', error);
      return [];
    }
  }

  // Get gate statistics
  async getGateStats() {
    const history = await this.getEvaluationHistory(1000);

    const totalEvaluations = history.length;
    const approved = history.filter(h => h.decision?.approved).length;
    const rejected = totalEvaluations - approved;

    const avgRiskScore = history.reduce((sum, h) => sum + (h.riskAssessment?.riskScore || 0), 0) / totalEvaluations;

    return {
      totalEvaluations,
      approved,
      rejected,
      approvalRate: totalEvaluations > 0 ? approved / totalEvaluations : 0,
      averageRiskScore: avgRiskScore || 0,
      lastEvaluation: history[0]?.timestamp || null
    };
  }
}

// Export for use in other modules
module.exports = EvolutionGate;