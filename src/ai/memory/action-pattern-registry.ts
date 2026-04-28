import { promises as fs } from 'fs';
import path from 'path';
import * as crypto from 'crypto';

export interface ActionPattern {
  id: string;
  name: string;
  description: string;
  trigger: ActionTrigger;
  sequence: ActionStep[];
  context: ActionContext;
  performance: {
    executionCount: number;
    averageExecutionTime: number;
    successRate: number;
    lastExecuted: Date;
  };
  metadata: {
    created: Date;
    domain: string;
    confidence: number;
    adaptability: number; // How well it adapts to variations
  };
}

export interface ActionTrigger {
  type: 'intent' | 'context' | 'pattern' | 'schedule';
  conditions: TriggerCondition[];
  priority: number; // 1-10, higher = more likely to trigger
}

export interface TriggerCondition {
  type: 'keyword' | 'context' | 'time' | 'frequency';
  value: any;
  operator: 'equals' | 'contains' | 'greater' | 'less' | 'regex';
}

export interface ActionStep {
  id: string;
  type: 'api_call' | 'data_processing' | 'decision' | 'response' | 'external_command';
  parameters: Record<string, any>;
  timeout: number;
  retryCount: number;
  fallback?: ActionStep;
}

export interface ActionContext {
  domain: string;
  userPreferences: Record<string, any>;
  environmentalFactors: Record<string, any>;
  requiredCapabilities: string[];
}

export interface PatternMatch {
  pattern: ActionPattern;
  confidence: number;
  matchedConditions: TriggerCondition[];
  contextSimilarity: number;
}

export interface ExecutionResult {
  success: boolean;
  executionTime: number;
  stepsExecuted: number;
  dataProcessed: any;
  errors: string[];
}

export class ActionPatternRegistry {
  private patterns: Map<string, ActionPattern> = new Map();
  private patternUsageStats: Map<string, {
    triggerCount: number;
    successCount: number;
    averageExecutionTime: number;
    lastUsed: Date;
  }> = new Map();

  private learningConfig = {
    minExecutionsForPattern: 3, // Minimum executions to create a pattern
    patternSimilarityThreshold: 0.8, // Similarity threshold for pattern matching
    maxPatternsPerDomain: 50, // Maximum patterns per domain
    patternExpirationDays: 90, // Days before unused patterns are removed
    adaptationRate: 0.1 // How quickly patterns adapt to new conditions
  };

  constructor() {
    this.initializeRegistry();
  }

  private async initializeRegistry(): Promise<void> {
    console.log('🎯 Initializing Action Pattern Registry...');

    await this.loadPersistedPatterns();
    this.startPatternMaintenance();

    console.log(`✅ Action Pattern Registry initialized with ${this.patterns.size} patterns`);
  }

  async recordAction(
    intent: string,
    context: ActionContext,
    steps: ActionStep[],
    executionResult: ExecutionResult
  ): Promise<void> {
    const actionSignature = this.generateActionSignature(intent, context, steps);

    // Update usage stats
    if (!this.patternUsageStats.has(actionSignature)) {
      this.patternUsageStats.set(actionSignature, {
        triggerCount: 0,
        successCount: 0,
        averageExecutionTime: 0,
        lastUsed: new Date()
      });
    }

    const stats = this.patternUsageStats.get(actionSignature)!;
    stats.triggerCount++;
    stats.lastUsed = new Date();

    if (executionResult.success) {
      stats.successCount++;
    }

    // Update average execution time
    const currentAvg = stats.averageExecutionTime;
    const newCount = stats.triggerCount;
    stats.averageExecutionTime = ((currentAvg * (newCount - 1)) + executionResult.executionTime) / newCount;

    // Check if we should create/update a pattern
    if (stats.triggerCount >= this.learningConfig.minExecutionsForPattern) {
      await this.createOrUpdatePattern(intent, context, steps, executionResult, stats);
    }
  }

  private generateActionSignature(intent: string, context: ActionContext, steps: ActionStep[]): string {
    // Create a unique signature for the action pattern
    const signatureData = {
      intent,
      domain: context.domain,
      stepCount: steps.length,
      stepTypes: steps.map(s => s.type).join(','),
      capabilities: context.requiredCapabilities.sort().join(',')
    };

    const signatureString = JSON.stringify(signatureData);
    return crypto.createHash('md5').update(signatureString).digest('hex');
  }

  private async createOrUpdatePattern(
    intent: string,
    context: ActionContext,
    steps: ActionStep[],
    executionResult: ExecutionResult,
    stats: any
  ): Promise<void> {
    const signature = this.generateActionSignature(intent, context, steps);

    // Check if pattern already exists
    const existingPattern = Array.from(this.patterns.values())
      .find(p => this.calculatePatternSimilarity(p, { intent, context, steps }) > this.learningConfig.patternSimilarityThreshold);

    if (existingPattern) {
      // Update existing pattern
      await this.updateExistingPattern(existingPattern, intent, context, steps, executionResult, stats);
    } else {
      // Create new pattern
      await this.createNewPattern(intent, context, steps, executionResult, stats);
    }
  }

  private calculatePatternSimilarity(pattern1: ActionPattern, pattern2: any): number {
    let similarity = 0;
    let totalFactors = 0;

    // Domain similarity
    if (pattern1.context.domain === pattern2.context.domain) {
      similarity += 1;
    }
    totalFactors++;

    // Intent similarity (simple string similarity)
    const intentSimilarity = this.calculateStringSimilarity(pattern1.name, pattern2.intent);
    similarity += intentSimilarity;
    totalFactors++;

    // Step sequence similarity
    const stepTypes1 = pattern1.sequence.map(s => s.type).join(',');
    const stepTypes2 = pattern2.steps.map(s => s.type).join(',');
    const stepSimilarity = this.calculateStringSimilarity(stepTypes1, stepTypes2);
    similarity += stepSimilarity;
    totalFactors++;

    // Required capabilities similarity
    const caps1 = pattern1.context.requiredCapabilities.sort().join(',');
    const caps2 = pattern2.context.requiredCapabilities.sort().join(',');
    const capSimilarity = this.calculateStringSimilarity(caps1, caps2);
    similarity += capSimilarity;
    totalFactors++;

    return similarity / totalFactors;
  }

  private calculateStringSimilarity(str1: string, str2: string): number {
    if (str1 === str2) return 1;

    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1;

    return (longer.length - this.levenshteinDistance(longer, shorter)) / longer.length;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  private async createNewPattern(
    intent: string,
    context: ActionContext,
    steps: ActionStep[],
    executionResult: ExecutionResult,
    stats: any
  ): Promise<void> {
    // Check domain limit
    const domainPatterns = Array.from(this.patterns.values())
      .filter(p => p.context.domain === context.domain);

    if (domainPatterns.length >= this.learningConfig.maxPatternsPerDomain) {
      // Remove least used pattern
      const leastUsed = domainPatterns.sort((a, b) => a.performance.executionCount - b.performance.executionCount)[0];
      this.patterns.delete(leastUsed.id);
    }

    // Create trigger from context
    const trigger = this.generateTriggerFromContext(intent, context);

    const pattern: ActionPattern = {
      id: crypto.randomUUID(),
      name: this.generatePatternName(intent, context.domain),
      description: `Automated pattern for ${intent} in ${context.domain}`,
      trigger,
      sequence: steps,
      context,
      performance: {
        executionCount: stats.triggerCount,
        averageExecutionTime: stats.averageExecutionTime,
        successRate: stats.successCount / stats.triggerCount,
        lastExecuted: new Date()
      },
      metadata: {
        created: new Date(),
        domain: context.domain,
        confidence: Math.min(1.0, stats.triggerCount / 10), // Increase with usage
        adaptability: 0.5 // Initial adaptability
      }
    };

    this.patterns.set(pattern.id, pattern);

    console.log(`🆕 Created new action pattern: ${pattern.name} (${pattern.id})`);

    await this.savePatternsToDisk();
  }

  private async updateExistingPattern(
    pattern: ActionPattern,
    intent: string,
    context: ActionContext,
    steps: ActionStep[],
    executionResult: ExecutionResult,
    stats: any
  ): Promise<void> {
    // Update performance metrics
    const totalExecutions = pattern.performance.executionCount + 1;
    pattern.performance.executionCount = totalExecutions;
    pattern.performance.averageExecutionTime =
      ((pattern.performance.averageExecutionTime * (totalExecutions - 1)) + executionResult.executionTime) / totalExecutions;
    pattern.performance.successRate = (pattern.performance.successRate * (totalExecutions - 1) + (executionResult.success ? 1 : 0)) / totalExecutions;
    pattern.performance.lastExecuted = new Date();

    // Adapt trigger conditions based on new context
    this.adaptTriggerConditions(pattern, context);

    // Increase confidence with successful executions
    if (executionResult.success) {
      pattern.metadata.confidence = Math.min(1.0, pattern.metadata.confidence + this.learningConfig.adaptationRate);
    }

    console.log(`🔄 Updated action pattern: ${pattern.name} (confidence: ${pattern.metadata.confidence.toFixed(2)})`);

    await this.savePatternsToDisk();
  }

  private generateTriggerFromContext(intent: string, context: ActionContext): ActionTrigger {
    const conditions: TriggerCondition[] = [];

    // Intent-based trigger
    conditions.push({
      type: 'keyword',
      value: intent.toLowerCase(),
      operator: 'contains'
    });

    // Domain-based trigger
    conditions.push({
      type: 'context',
      value: context.domain,
      operator: 'equals'
    });

    // Frequency-based trigger (encourage reuse)
    conditions.push({
      type: 'frequency',
      value: 3, // Minimum executions
      operator: 'greater'
    });

    return {
      type: 'intent',
      conditions,
      priority: 5 // Medium priority
    };
  }

  private generatePatternName(intent: string, domain: string): string {
    // Create a human-readable name
    const cleanIntent = intent.replace(/[^a-zA-Z0-9\s]/g, ' ').trim();
    const domainPrefix = domain.split('_').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join('');

    return `${domainPrefix}: ${cleanIntent}`;
  }

  private adaptTriggerConditions(pattern: ActionPattern, newContext: ActionContext): void {
    // Adapt trigger conditions based on successful executions
    // This is a simplified adaptation - in practice would use ML

    // Increase priority if pattern is frequently used
    if (pattern.performance.executionCount > 10) {
      pattern.trigger.priority = Math.min(10, pattern.trigger.priority + 1);
    }

    // Add new context conditions if they're consistently present
    const existingContextConditions = pattern.trigger.conditions.filter(c => c.type === 'context');

    for (const [key, value] of Object.entries(newContext.environmentalFactors || {})) {
      const hasCondition = existingContextConditions.some(c =>
        c.value === value && c.operator === 'equals'
      );

      if (!hasCondition && typeof value === 'string') {
        pattern.trigger.conditions.push({
          type: 'context',
          value,
          operator: 'equals'
        });
      }
    }
  }

  async findMatchingPatterns(
    intent: string,
    context: ActionContext,
    environmentalFactors: Record<string, any> = {}
  ): Promise<PatternMatch[]> {
    const matches: PatternMatch[] = [];

    for (const pattern of this.patterns.values()) {
      const matchResult = await this.evaluatePatternMatch(pattern, intent, context, environmentalFactors);

      if (matchResult.confidence > 0.3) { // Minimum confidence threshold
        matches.push(matchResult);
      }
    }

    // Sort by confidence and priority
    return matches.sort((a, b) => {
      const confidenceDiff = b.confidence - a.confidence;
      if (Math.abs(confidenceDiff) > 0.1) return confidenceDiff;

      return b.pattern.trigger.priority - a.pattern.trigger.priority;
    });
  }

  private async evaluatePatternMatch(
    pattern: ActionPattern,
    intent: string,
    context: ActionContext,
    environmentalFactors: Record<string, any>
  ): Promise<PatternMatch> {
    let totalConfidence = 0;
    let factorCount = 0;
    const matchedConditions: TriggerCondition[] = [];

    // Evaluate trigger conditions
    for (const condition of pattern.trigger.conditions) {
      const conditionMet = this.evaluateCondition(condition, {
        intent,
        context,
        environmentalFactors
      });

      if (conditionMet) {
        matchedConditions.push(condition);
        totalConfidence += 0.2; // Each matched condition adds confidence
      }
      factorCount++;
    }

    // Domain match bonus
    if (pattern.context.domain === context.domain) {
      totalConfidence += 0.3;
      factorCount++;
    }

    // Required capabilities match
    const capabilityMatch = this.calculateCapabilityMatch(
      pattern.context.requiredCapabilities,
      context.requiredCapabilities
    );
    totalConfidence += capabilityMatch * 0.2;
    factorCount++;

    // User preferences similarity
    const preferenceSimilarity = this.calculatePreferenceSimilarity(
      pattern.context.userPreferences,
      context.userPreferences
    );
    totalConfidence += preferenceSimilarity * 0.2;
    factorCount++;

    // Performance bonus for successful patterns
    if (pattern.performance.successRate > 0.8) {
      totalConfidence += 0.1;
      factorCount++;
    }

    // Recency bonus
    const daysSinceLastUse = (Date.now() - pattern.performance.lastExecuted.getTime()) / (24 * 60 * 60 * 1000);
    if (daysSinceLastUse < 7) {
      totalConfidence += 0.1;
      factorCount++;
    }

    const finalConfidence = Math.min(1.0, totalConfidence / factorCount);

    return {
      pattern,
      confidence: finalConfidence,
      matchedConditions,
      contextSimilarity: preferenceSimilarity
    };
  }

  private evaluateCondition(
    condition: TriggerCondition,
    evaluationContext: {
      intent: string;
      context: ActionContext;
      environmentalFactors: Record<string, any>;
    }
  ): boolean {
    const { intent, context, environmentalFactors } = evaluationContext;

    switch (condition.type) {
      case 'keyword':
        return this.evaluateKeywordCondition(condition, intent);

      case 'context':
        return this.evaluateContextCondition(condition, context, environmentalFactors);

      case 'time':
        return this.evaluateTimeCondition(condition);

      case 'frequency':
        return this.evaluateFrequencyCondition(condition, context);

      default:
        return false;
    }
  }

  private evaluateKeywordCondition(condition: TriggerCondition, intent: string): boolean {
    const targetValue = condition.value.toString().toLowerCase();
    const searchText = intent.toLowerCase();

    switch (condition.operator) {
      case 'equals':
        return searchText === targetValue;
      case 'contains':
        return searchText.includes(targetValue);
      case 'regex':
        return new RegExp(targetValue, 'i').test(searchText);
      default:
        return false;
    }
  }

  private evaluateContextCondition(
    condition: TriggerCondition,
    context: ActionContext,
    environmentalFactors: Record<string, any>
  ): boolean {
    // Check domain
    if (condition.value === context.domain) return true;

    // Check environmental factors
    for (const [key, value] of Object.entries(environmentalFactors)) {
      if (condition.value === value) return true;
    }

    return false;
  }

  private evaluateTimeCondition(condition: TriggerCondition): boolean {
    const now = new Date();
    const targetTime = new Date(condition.value);

    switch (condition.operator) {
      case 'greater':
        return now.getTime() > targetTime.getTime();
      case 'less':
        return now.getTime() < targetTime.getTime();
      default:
        return false;
    }
  }

  private evaluateFrequencyCondition(condition: TriggerCondition, context: ActionContext): boolean {
    // This would check how often similar actions have been performed
    // For now, return true if we have usage stats
    return true;
  }

  private calculateCapabilityMatch(required: string[], available: string[]): number {
    if (required.length === 0) return 1;

    const matched = required.filter(cap => available.includes(cap));
    return matched.length / required.length;
  }

  private calculatePreferenceSimilarity(
    patternPrefs: Record<string, any>,
    contextPrefs: Record<string, any>
  ): number {
    if (Object.keys(patternPrefs).length === 0) return 0.5;

    let totalSimilarity = 0;
    let comparedFields = 0;

    for (const [key, patternValue] of Object.entries(patternPrefs)) {
      if (contextPrefs[key] !== undefined) {
        const contextValue = contextPrefs[key];

        if (patternValue === contextValue) {
          totalSimilarity += 1;
        } else if (typeof patternValue === 'string' && typeof contextValue === 'string') {
          // String similarity
          totalSimilarity += this.calculateStringSimilarity(patternValue, contextValue);
        }

        comparedFields++;
      }
    }

    return comparedFields > 0 ? totalSimilarity / comparedFields : 0.5;
  }

  async executePattern(
    pattern: ActionPattern,
    parameters: Record<string, any> = {}
  ): Promise<ExecutionResult> {
    console.log(`⚡ Executing action pattern: ${pattern.name}`);

    const startTime = Date.now();
    const result: ExecutionResult = {
      success: true,
      executionTime: 0,
      stepsExecuted: 0,
      dataProcessed: {},
      errors: []
    };

    try {
      for (const step of pattern.sequence) {
        console.log(`  📍 Executing step: ${step.type}`);

        const stepResult = await this.executeStep(step, parameters);

        if (!stepResult.success) {
          result.errors.push(`Step ${step.id} failed: ${stepResult.error}`);

          // Try fallback if available
          if (step.fallback) {
            console.log(`  🔄 Trying fallback for step: ${step.id}`);
            const fallbackResult = await this.executeStep(step.fallback, parameters);
            if (fallbackResult.success) {
              console.log(`  ✅ Fallback succeeded`);
              continue;
            }
          }

          result.success = false;
          break;
        }

        result.stepsExecuted++;
        result.dataProcessed = { ...result.dataProcessed, ...stepResult.data };
      }

    } catch (error) {
      result.success = false;
      result.errors.push(`Execution error: ${error.message}`);
    }

    result.executionTime = Date.now() - startTime;

    // Update pattern performance
    await this.recordPatternExecution(pattern.id, result);

    console.log(`✅ Pattern execution ${result.success ? 'succeeded' : 'failed'} in ${result.executionTime}ms`);

    return result;
  }

  private async executeStep(
    step: ActionStep,
    parameters: Record<string, any>
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      switch (step.type) {
        case 'api_call':
          return await this.executeApiCall(step, parameters);

        case 'data_processing':
          return await this.executeDataProcessing(step, parameters);

        case 'decision':
          return await this.executeDecision(step, parameters);

        case 'response':
          return await this.executeResponse(step, parameters);

        case 'external_command':
          return await this.executeExternalCommand(step, parameters);

        default:
          return { success: false, error: `Unknown step type: ${step.type}` };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  private async executeApiCall(step: ActionStep, parameters: Record<string, any>) {
    // This would make actual API calls
    // Simplified for demonstration
    const { endpoint, method = 'GET', headers = {}, body } = step.parameters;

    console.log(`    🌐 API call: ${method} ${endpoint}`);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 100));

    return {
      success: true,
      data: { response: 'API call successful', endpoint, method }
    };
  }

  private async executeDataProcessing(step: ActionStep, parameters: Record<string, any>) {
    // This would process data according to the step parameters
    const { operation, input, output } = step.parameters;

    console.log(`    📊 Data processing: ${operation}`);

    // Simulate data processing
    const processedData = { processed: true, operation, input, output };

    return {
      success: true,
      data: processedData
    };
  }

  private async executeDecision(step: ActionStep, parameters: Record<string, any>) {
    // This would make decisions based on conditions
    const { conditions, actions } = step.parameters;

    console.log(`    🤔 Decision making with ${conditions.length} conditions`);

    // Simulate decision making
    const decision = Math.random() > 0.5; // Random decision for demo

    return {
      success: true,
      data: { decision, conditions, actions }
    };
  }

  private async executeResponse(step: ActionStep, parameters: Record<string, any>) {
    // This would generate responses
    const { template, variables } = step.parameters;

    console.log(`    💬 Generating response`);

    // Simulate response generation
    const response = `Generated response based on template: ${template}`;

    return {
      success: true,
      data: { response, template, variables }
    };
  }

  private async executeExternalCommand(step: ActionStep, parameters: Record<string, any>) {
    // This would execute external commands safely
    const { command, args = [] } = step.parameters;

    console.log(`    🔧 Executing command: ${command}`);

    // Simulate command execution (would need proper sandboxing)
    await new Promise(resolve => setTimeout(resolve, 50));

    return {
      success: true,
      data: { command, args, output: 'Command executed successfully' }
    };
  }

  private async recordPatternExecution(patternId: string, result: ExecutionResult): Promise<void> {
    const pattern = this.patterns.get(patternId);
    if (!pattern) return;

    // Update pattern performance
    const totalExecutions = pattern.performance.executionCount + 1;
    pattern.performance.executionCount = totalExecutions;
    pattern.performance.averageExecutionTime =
      ((pattern.performance.averageExecutionTime * (totalExecutions - 1)) + result.executionTime) / totalExecutions;

    if (result.success) {
      const totalSuccess = Math.round(pattern.performance.successRate * (totalExecutions - 1)) + 1;
      pattern.performance.successRate = totalSuccess / totalExecutions;
    }

    pattern.performance.lastExecuted = new Date();
  }

  private startPatternMaintenance(): void {
    // Clean up old patterns every 24 hours
    setInterval(async () => {
      await this.cleanupOldPatterns();
    }, 24 * 60 * 60 * 1000);

    // Adapt patterns based on performance every week
    setInterval(async () => {
      await this.adaptPatterns();
    }, 7 * 24 * 60 * 60 * 1000);
  }

  private async cleanupOldPatterns(): Promise<void> {
    console.log('🧹 Cleaning up old action patterns...');

    const now = new Date();
    const expirationMs = this.learningConfig.patternExpirationDays * 24 * 60 * 60 * 1000;
    let removedCount = 0;

    for (const [id, pattern] of this.patterns) {
      const daysSinceLastUse = (now.getTime() - pattern.performance.lastExecuted.getTime()) / (24 * 60 * 60 * 1000);

      if (daysSinceLastUse > this.learningConfig.patternExpirationDays &&
          pattern.performance.executionCount < 5) {
        this.patterns.delete(id);
        removedCount++;
      }
    }

    if (removedCount > 0) {
      console.log(`🗑️ Removed ${removedCount} old patterns`);
      await this.savePatternsToDisk();
    }
  }

  private async adaptPatterns(): Promise<void> {
    console.log('🔄 Adapting action patterns based on performance...');

    for (const pattern of this.patterns.values()) {
      // Increase adaptability for high-performing patterns
      if (pattern.performance.successRate > 0.9 && pattern.performance.executionCount > 10) {
        pattern.metadata.adaptability = Math.min(1.0, pattern.metadata.adaptability + 0.1);
      }

      // Decrease adaptability for low-performing patterns
      if (pattern.performance.successRate < 0.5) {
        pattern.metadata.adaptability = Math.max(0.1, pattern.metadata.adaptability - 0.1);
      }
    }

    console.log('✅ Pattern adaptation complete');
    await this.savePatternsToDisk();
  }

  async createMacroFromPattern(pattern: ActionPattern): Promise<string> {
    // Convert pattern to executable macro
    const macroCode = this.generateMacroCode(pattern);

    // Save macro to disk
    const macroPath = path.join(process.cwd(), 'macros', `${pattern.id}.macro.js`);

    await fs.mkdir(path.dirname(macroPath), { recursive: true });
    await fs.writeFile(macroPath, macroCode);

    console.log(`📝 Created macro: ${macroPath}`);

    return macroPath;
  }

  private generateMacroCode(pattern: ActionPattern): string {
    // Generate executable JavaScript code from pattern
    const macroCode = `
// Auto-generated macro from pattern: ${pattern.name}
// Created: ${pattern.metadata.created.toISOString()}
// Confidence: ${pattern.metadata.confidence}

const { ActionPatternRegistry } = require('../src/ai/memory/action-pattern-registry');

async function execute${pattern.id.replace(/-/g, '_')}Macro(parameters = {}) {
  console.log('🎬 Executing macro: ${pattern.name}');

  const results = [];

  ${pattern.sequence.map(step => `
  // Step: ${step.type}
  try {
    const stepResult = await executeStep${step.id.replace(/-/g, '_')}(${JSON.stringify(step.parameters)});
    results.push(stepResult);
  } catch (error) {
    console.error('Step ${step.id} failed:', error);
    ${step.fallback ? `// Try fallback` : `throw error;`}
  }
  `).join('\n')}

  return {
    success: results.every(r => r.success),
    results,
    executionTime: Date.now()
  };
}

${pattern.sequence.map(step => `
async function executeStep${step.id.replace(/-/g, '_')}(params) {
  // ${step.type} implementation
  return { success: true, data: params };
}
`).join('\n')}

module.exports = { execute${pattern.id.replace(/-/g, '_')}Macro };
    `.trim();

    return macroCode;
  }

  // Public API methods
  getPatterns(): ActionPattern[] {
    return Array.from(this.patterns.values());
  }

  getPatternById(id: string): ActionPattern | null {
    return this.patterns.get(id) || null;
  }

  getPatternsByDomain(domain: string): ActionPattern[] {
    return Array.from(this.patterns.values())
      .filter(p => p.context.domain === domain)
      .sort((a, b) => b.performance.executionCount - a.performance.executionCount);
  }

  getTopPatterns(limit: number = 10): ActionPattern[] {
    return Array.from(this.patterns.values())
      .sort((a, b) => {
        // Sort by combination of success rate, execution count, and recency
        const scoreA = b.performance.successRate * b.performance.executionCount *
                      Math.max(0, 1 - (Date.now() - b.performance.lastExecuted.getTime()) / (30 * 24 * 60 * 60 * 1000));
        const scoreB = a.performance.successRate * a.performance.executionCount *
                      Math.max(0, 1 - (Date.now() - a.performance.lastExecuted.getTime()) / (30 * 24 * 60 * 60 * 1000));
        return scoreB - scoreA;
      })
      .slice(0, limit);
  }

  async savePatternsToDisk(): Promise<void> {
    const dataPath = path.join(process.cwd(), 'data', 'action-patterns.json');

    const data = {
      patterns: Array.from(this.patterns.entries()),
      usageStats: Array.from(this.patternUsageStats.entries()),
      lastSaved: new Date(),
      version: '1.0'
    };

    await fs.writeFile(dataPath, JSON.stringify(data, null, 2));
    console.log(`💾 Action patterns saved (${this.patterns.size} patterns)`);
  }

  async loadPatternsFromDisk(): Promise<void> {
    const dataPath = path.join(process.cwd(), 'data', 'action-patterns.json');

    try {
      const data = JSON.parse(await fs.readFile(dataPath, 'utf8'));

      this.patterns = new Map(data.patterns.map(([id, pattern]: [string, any]) => [
        id,
        {
          ...pattern,
          performance: {
            ...pattern.performance,
            lastExecuted: new Date(pattern.performance.lastExecuted)
          },
          metadata: {
            ...pattern.metadata,
            created: new Date(pattern.metadata.created)
          }
        }
      ]));

      this.patternUsageStats = new Map(data.usageStats);

      console.log(`📚 Action patterns loaded (${this.patterns.size} patterns)`);

    } catch (error) {
      console.log('No existing action patterns found, starting fresh');
    }
  }

  getRegistryStats(): {
    totalPatterns: number;
    domains: string[];
    averageSuccessRate: number;
    averageExecutionTime: number;
    totalExecutions: number;
  } {
    const patterns = Array.from(this.patterns.values());
    const domains = [...new Set(patterns.map(p => p.context.domain))];

    const totalExecutions = patterns.reduce((sum, p) => sum + p.performance.executionCount, 0);
    const weightedSuccessRate = patterns.reduce((sum, p) =>
      sum + (p.performance.successRate * p.performance.executionCount), 0);
    const averageSuccessRate = totalExecutions > 0 ? weightedSuccessRate / totalExecutions : 0;

    const averageExecutionTime = patterns.length > 0 ?
      patterns.reduce((sum, p) => sum + p.performance.averageExecutionTime, 0) / patterns.length : 0;

    return {
      totalPatterns: patterns.length,
      domains,
      averageSuccessRate,
      averageExecutionTime,
      totalExecutions
    };
  }
}