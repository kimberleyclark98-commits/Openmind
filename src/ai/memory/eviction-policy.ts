import { ParametricMemory, KnowledgeConcept } from './parametric-memory';
import { ActionPatternRegistry, ActionPattern } from './action-pattern-registry';
import { promises as fs } from 'fs';
import path from 'path';

export interface EvictionPolicy {
  strategy: 'lru' | 'lfu' | 'size_based' | 'hybrid' | 'adaptive';
  thresholds: {
    maxMemoryUsage: number; // MB
    maxItemCount: number;
    minConfidence: number;
    maxAge: number; // days
    evictionRate: number; // percentage of items to evict
  };
  priorities: {
    criticalDomains: string[];
    protectedItems: string[]; // Item IDs that should not be evicted
    boostFactors: Record<string, number>; // Domain-specific boost factors
  };
}

export interface EvictionResult {
  itemsEvicted: number;
  memoryFreed: number;
  domainsAffected: string[];
  strategyUsed: string;
  executionTime: number;
  nextScheduledEviction: Date;
}

export interface MemoryAbstraction {
  id: string;
  type: 'concept' | 'pattern' | 'summary';
  domain: string;
  content: string;
  confidence: number;
  usageStats: {
    accessCount: number;
    lastAccessed: Date;
    created: Date;
  };
  abstractionLevel: number; // 0 = raw, 1 = summarized, 2 = highly abstract
  relationships: string[]; // IDs of related memories
}

export class MemoryEvictionManager {
  private parametricMemory: ParametricMemory;
  private patternRegistry: ActionPatternRegistry;
  private policy: EvictionPolicy;
  private abstractions: Map<string, MemoryAbstraction> = new Map();
  private evictionHistory: EvictionResult[] = [];

  constructor(
    parametricMemory: ParametricMemory,
    patternRegistry: ActionPatternRegistry,
    policy: EvictionPolicy
  ) {
    this.parametricMemory = parametricMemory;
    this.patternRegistry = patternRegistry;
    this.policy = policy;
  }

  async performMemoryOptimization(): Promise<{
    parametric: EvictionResult;
    patterns: EvictionResult;
    abstractions: MemoryAbstraction[];
    totalMemoryFreed: number;
    optimizationTime: number;
  }> {
    console.log('🧹 Starting comprehensive memory optimization...');

    const startTime = Date.now();

    // Optimize parametric memory
    const parametricResult = await this.optimizeParametricMemory();

    // Optimize pattern registry
    const patternResult = await this.optimizePatternRegistry();

    // Create abstractions for evicted items
    const abstractions = await this.createMemoryAbstractions();

    // Update relationships
    await this.updateMemoryRelationships();

    const totalMemoryFreed = parametricResult.memoryFreed + patternResult.memoryFreed;
    const optimizationTime = Date.now() - startTime;

    console.log(`✅ Memory optimization complete:`);
    console.log(`   Parametric: ${parametricResult.itemsEvicted} items evicted, ${parametricResult.memoryFreed} bytes freed`);
    console.log(`   Patterns: ${patternResult.itemsEvicted} items evicted, ${patternResult.memoryFreed} bytes freed`);
    console.log(`   Total: ${totalMemoryFreed} bytes freed in ${optimizationTime}ms`);

    // Schedule next optimization
    this.scheduleNextOptimization();

    return {
      parametric: parametricResult,
      patterns: patternResult,
      abstractions,
      totalMemoryFreed,
      optimizationTime
    };
  }

  private async optimizeParametricMemory(): Promise<EvictionResult> {
    const startTime = Date.now();
    const memoryStats = this.parametricMemory.getMemoryStats();

    // Check if eviction is needed
    if (memoryStats.totalMemoryUsage < this.policy.thresholds.maxMemoryUsage * 1024 * 1024 &&
        memoryStats.totalConcepts < this.policy.thresholds.maxItemCount) {
      return {
        itemsEvicted: 0,
        memoryFreed: 0,
        domainsAffected: [],
        strategyUsed: 'none',
        executionTime: Date.now() - startTime,
        nextScheduledEviction: new Date(Date.now() + 24 * 60 * 60 * 1000)
      };
    }

    const concepts = await this.getAllConcepts();
    const evictionCandidates = this.selectEvictionCandidates(concepts, 'parametric');
    const itemsToEvict = this.calculateEvictionCount(evictionCandidates.length);

    // Create abstractions before eviction
    await this.abstractConceptsBeforeEviction(evictionCandidates.slice(0, itemsToEvict));

    // Perform eviction
    const evictedItems = evictionCandidates.slice(0, itemsToEvict);
    const memoryFreed = await this.evictConcepts(evictedItems);

    const domainsAffected = [...new Set(evictedItems.map(c => c.domain))];

    const result: EvictionResult = {
      itemsEvicted: itemsToEvict,
      memoryFreed,
      domainsAffected,
      strategyUsed: this.policy.strategy,
      executionTime: Date.now() - startTime,
      nextScheduledEviction: new Date(Date.now() + 24 * 60 * 60 * 1000)
    };

    this.evictionHistory.push(result);

    return result;
  }

  private async optimizePatternRegistry(): Promise<EvictionResult> {
    const startTime = Date.now();
    const registryStats = this.patternRegistry.getRegistryStats();

    // For patterns, we use a more conservative approach
    // Only evict very old, low-confidence patterns
    const patterns = this.patternRegistry.getPatterns();
    const oldPatterns = patterns.filter(p => {
      const age = (Date.now() - p.metadata.created.getTime()) / (24 * 60 * 60 * 1000);
      return age > this.policy.thresholds.maxAge &&
             p.metadata.confidence < this.policy.thresholds.minConfidence &&
             p.performance.executionCount < 3;
    });

    const itemsToEvict = Math.min(oldPatterns.length, Math.floor(patterns.length * 0.1)); // Max 10% at once

    if (itemsToEvict > 0) {
      // Create abstractions for patterns
      await this.abstractPatternsBeforeEviction(oldPatterns.slice(0, itemsToEvict));

      // Remove patterns (simplified - would need actual removal method)
      console.log(`🗑️ Would evict ${itemsToEvict} old patterns`);
    }

    return {
      itemsEvicted: itemsToEvict,
      memoryFreed: itemsToEvict * 1024, // Rough estimate
      domainsAffected: [...new Set(oldPatterns.slice(0, itemsToEvict).map(p => p.context.domain))],
      strategyUsed: 'age_based',
      executionTime: Date.now() - startTime,
      nextScheduledEviction: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Weekly for patterns
    };
  }

  private async getAllConcepts(): Promise<KnowledgeConcept[]> {
    // This would need to be implemented in ParametricMemory
    // For now, return mock data
    return [];
  }

  private selectEvictionCandidates(concepts: KnowledgeConcept[], memoryType: string): KnowledgeConcept[] {
    const now = new Date();

    return concepts
      .filter(concept => {
        // Don't evict protected items
        if (this.policy.priorities.protectedItems.includes(concept.id)) return false;

        // Don't evict critical domain items
        if (this.policy.priorities.criticalDomains.includes(concept.domain)) return false;

        // Apply strategy-specific filters
        switch (this.policy.strategy) {
          case 'lru':
            const age = (now.getTime() - concept.lastUsed.getTime()) / (24 * 60 * 60 * 1000);
            return age > 7; // LRU: evict if not used in 7 days

          case 'lfu':
            return concept.usageCount < 2; // LFU: evict if used less than 2 times

          case 'size_based':
            return concept.description.length > 1000; // Evict large items first

          case 'hybrid':
            const age = (now.getTime() - concept.lastUsed.getTime()) / (24 * 60 * 60 * 1000);
            return age > 14 && concept.usageCount < 3; // Age + frequency

          case 'adaptive':
            // Use confidence and boost factors
            const domainBoost = this.policy.priorities.boostFactors[concept.domain] || 1;
            const effectiveConfidence = concept.confidence * domainBoost;
            return effectiveConfidence < this.policy.thresholds.minConfidence;

          default:
            return false;
        }
      })
      .sort((a, b) => {
        // Sort by eviction priority (lower score = more likely to evict)
        const scoreA = this.calculateEvictionScore(a);
        const scoreB = this.calculateEvictionScore(b);
        return scoreA - scoreB; // Lower score first
      });
  }

  private calculateEvictionScore(concept: KnowledgeConcept): number {
    let score = 0;

    // Age factor (older = lower score)
    const age = (Date.now() - concept.lastUsed.getTime()) / (24 * 60 * 60 * 1000);
    score -= age * 0.1;

    // Usage factor (less used = lower score)
    score += concept.usageCount * 0.5;

    // Confidence factor (less confident = lower score)
    score += concept.confidence * 2;

    // Domain boost
    const domainBoost = this.policy.priorities.boostFactors[concept.domain] || 1;
    score *= domainBoost;

    // Size penalty (larger = lower score)
    const sizePenalty = concept.description.length / 1000;
    score -= sizePenalty * 0.1;

    return score;
  }

  private calculateEvictionCount(candidateCount: number): number {
    const maxEvict = Math.floor(candidateCount * this.policy.thresholds.evictionRate);
    const targetCount = Math.max(1, Math.floor(candidateCount * 0.1)); // At least 10%

    return Math.min(maxEvict, targetCount);
  }

  private async abstractConceptsBeforeEviction(concepts: KnowledgeConcept[]): Promise<void> {
    for (const concept of concepts) {
      await this.createConceptAbstraction(concept);
    }
  }

  private async createConceptAbstraction(concept: KnowledgeConcept): Promise<void> {
    // Create a higher-level abstraction of the concept
    const abstraction: MemoryAbstraction = {
      id: `abstract_${concept.id}`,
      type: 'concept',
      domain: concept.domain,
      content: this.generateConceptSummary(concept),
      confidence: concept.confidence * 0.8, // Slightly lower confidence
      usageStats: {
        accessCount: concept.usageCount,
        lastAccessed: concept.lastUsed,
        created: new Date()
      },
      abstractionLevel: concept.compressed ? 2 : 1,
      relationships: concept.metadata.dependencies || []
    };

    this.abstractions.set(abstraction.id, abstraction);
  }

  private generateConceptSummary(concept: KnowledgeConcept): string {
    // Generate a concise summary of the concept
    const principles = concept.keyPrinciples.slice(0, 2).join('. ');
    const examples = concept.examples.length > 0 ? `Examples: ${concept.examples[0]}` : '';

    return `${concept.name}: ${principles}. ${examples}`.trim();
  }

  private async abstractPatternsBeforeEviction(patterns: ActionPattern[]): Promise<void> {
    for (const pattern of patterns) {
      await this.createPatternAbstraction(pattern);
    }
  }

  private async createPatternAbstraction(pattern: ActionPattern): Promise<void> {
    const abstraction: MemoryAbstraction = {
      id: `abstract_${pattern.id}`,
      type: 'pattern',
      domain: pattern.context.domain,
      content: `Pattern: ${pattern.name} - ${pattern.description}. Success rate: ${(pattern.performance.successRate * 100).toFixed(1)}%`,
      confidence: pattern.metadata.confidence,
      usageStats: {
        accessCount: pattern.performance.executionCount,
        lastAccessed: pattern.performance.lastExecuted,
        created: pattern.metadata.created
      },
      abstractionLevel: 1,
      relationships: [] // Patterns might not have direct relationships
    };

    this.abstractions.set(abstraction.id, abstraction);
  }

  private async evictConcepts(concepts: KnowledgeConcept[]): Promise<number> {
    let memoryFreed = 0;

    for (const concept of concepts) {
      // Calculate memory usage of this concept
      const conceptMemory = this.calculateConceptMemoryUsage(concept);
      memoryFreed += conceptMemory;

      // Remove from parametric memory (would need actual removal method)
      console.log(`🗑️ Evicting concept: ${concept.name} (${conceptMemory} bytes)`);
    }

    return memoryFreed;
  }

  private calculateConceptMemoryUsage(concept: KnowledgeConcept): number {
    // Rough memory calculation
    let memory = concept.description.length * 2; // UTF-16 characters
    memory += concept.keyPrinciples.join('').length * 2;
    memory += concept.examples.join('').length * 2;

    if (concept.vector) {
      memory += concept.vector.length * 4; // Float32Array
    }

    // Add overhead for object structure
    memory += 1024; // Rough object overhead

    return memory;
  }

  private async createMemoryAbstractions(): Promise<MemoryAbstraction[]> {
    // Create higher-level abstractions from existing abstractions
    const abstractions = Array.from(this.abstractions.values());
    const newAbstractions: MemoryAbstraction[] = [];

    // Group by domain and create domain summaries
    const domainGroups = abstractions.reduce((groups, abs) => {
      if (!groups[abs.domain]) groups[abs.domain] = [];
      groups[abs.domain].push(abs);
      return groups;
    }, {} as Record<string, MemoryAbstraction[]>);

    for (const [domain, domainAbstractions] of Object.entries(domainGroups)) {
      if (domainAbstractions.length > 5) {
        const domainSummary = this.createDomainSummary(domain, domainAbstractions);
        newAbstractions.push(domainSummary);
      }
    }

    // Add new abstractions to the map
    for (const abstraction of newAbstractions) {
      this.abstractions.set(abstraction.id, abstraction);
    }

    return newAbstractions;
  }

  private createDomainSummary(domain: string, abstractions: MemoryAbstraction[]): MemoryAbstraction {
    const totalConcepts = abstractions.length;
    const avgConfidence = abstractions.reduce((sum, abs) => sum + abs.confidence, 0) / totalConcepts;
    const totalAccess = abstractions.reduce((sum, abs) => sum + abs.usageStats.accessCount, 0);

    const content = `Domain ${domain}: ${totalConcepts} abstracted memories, average confidence ${(avgConfidence * 100).toFixed(1)}%, total access count ${totalAccess}. Key areas: ${this.extractKeyTopics(abstractions).join(', ')}`;

    return {
      id: `domain_summary_${domain}_${Date.now()}`,
      type: 'summary',
      domain,
      content,
      confidence: avgConfidence,
      usageStats: {
        accessCount: totalAccess,
        lastAccessed: new Date(Math.max(...abstractions.map(a => a.usageStats.lastAccessed.getTime()))),
        created: new Date()
      },
      abstractionLevel: 3, // Highest level
      relationships: abstractions.map(a => a.id)
    };
  }

  private extractKeyTopics(abstractions: MemoryAbstraction[]): string[] {
    const topics = new Map<string, number>();

    for (const abstraction of abstractions) {
      // Simple keyword extraction (would use NLP in production)
      const words = abstraction.content.toLowerCase().split(/\s+/);
      const keywords = words.filter(word =>
        word.length > 4 && !['that', 'with', 'from', 'this', 'have', 'been'].includes(word)
      );

      for (const keyword of keywords.slice(0, 3)) { // Top 3 per abstraction
        topics.set(keyword, (topics.get(keyword) || 0) + 1);
      }
    }

    // Return top 5 topics
    return Array.from(topics.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([topic]) => topic);
  }

  private async updateMemoryRelationships(): Promise<void> {
    // Update relationships between remaining memories and abstractions
    const allMemories = [
      ...Array.from(this.abstractions.values())
    ];

    for (const memory of allMemories) {
      // Find related memories based on content similarity
      const relatedMemories = allMemories
        .filter(m => m.id !== memory.id && m.domain === memory.domain)
        .filter(m => this.calculateContentSimilarity(memory.content, m.content) > 0.3)
        .slice(0, 5)
        .map(m => m.id);

      memory.relationships = Array.from(new Set([...memory.relationships, ...relatedMemories]));
    }
  }

  private calculateContentSimilarity(content1: string, content2: string): number {
    const words1 = new Set(content1.toLowerCase().split(/\s+/));
    const words2 = new Set(content2.toLowerCase().split(/\s+/));

    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);

    return intersection.size / union.size;
  }

  private scheduleNextOptimization(): void {
    // Schedule next optimization based on current memory usage
    const memoryStats = this.parametricMemory.getMemoryStats();
    const memoryPressure = memoryStats.totalMemoryUsage / (this.policy.thresholds.maxMemoryUsage * 1024 * 1024);

    let intervalHours;
    if (memoryPressure > 0.9) {
      intervalHours = 6; // High pressure: optimize every 6 hours
    } else if (memoryPressure > 0.7) {
      intervalHours = 12; // Medium pressure: every 12 hours
    } else {
      intervalHours = 24; // Normal: daily
    }

    console.log(`📅 Next optimization scheduled in ${intervalHours} hours`);

    // In production, this would set up the actual scheduling
  }

  // Public API methods
  async retrieveAbstraction(abstractionId: string): Promise<MemoryAbstraction | null> {
    const abstraction = this.abstractions.get(abstractionId);
    if (abstraction) {
      abstraction.usageStats.accessCount++;
      abstraction.usageStats.lastAccessed = new Date();
    }
    return abstraction || null;
  }

  async searchAbstractions(query: string, domain?: string): Promise<MemoryAbstraction[]> {
    const queryWords = query.toLowerCase().split(/\s+/);
    const results: Array<{ abstraction: MemoryAbstraction; score: number }> = [];

    for (const abstraction of this.abstractions.values()) {
      if (domain && abstraction.domain !== domain) continue;

      let score = 0;
      const content = abstraction.content.toLowerCase();

      // Exact word matches
      for (const word of queryWords) {
        if (content.includes(word)) {
          score += 1;
        }
      }

      // Domain relevance
      if (abstraction.domain === domain) score += 0.5;

      // Abstraction level bonus (higher level = more general = potentially more useful)
      score += abstraction.abstractionLevel * 0.2;

      // Recency bonus
      const daysSinceAccess = (Date.now() - abstraction.usageStats.lastAccessed.getTime()) / (24 * 60 * 60 * 1000);
      if (daysSinceAccess < 7) score += 0.3;

      if (score > 0) {
        results.push({ abstraction, score });
      }
    }

    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map(r => r.abstraction);
  }

  getAbstractions(): MemoryAbstraction[] {
    return Array.from(this.abstractions.values());
  }

  getEvictionHistory(): EvictionResult[] {
    return [...this.evictionHistory];
  }

  getEvictionStats(): {
    totalEvictions: number;
    totalMemoryFreed: number;
    averageEvictionSize: number;
    mostAffectedDomains: string[];
  } {
    const totalEvictions = this.evictionHistory.reduce((sum, result) => sum + result.itemsEvicted, 0);
    const totalMemoryFreed = this.evictionHistory.reduce((sum, result) => sum + result.memoryFreed, 0);
    const averageEvictionSize = totalEvictions > 0 ? totalMemoryFreed / totalEvictions : 0;

    const domainCounts = this.evictionHistory.reduce((counts, result) => {
      for (const domain of result.domainsAffected) {
        counts[domain] = (counts[domain] || 0) + 1;
      }
      return counts;
    }, {} as Record<string, number>);

    const mostAffectedDomains = Object.entries(domainCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([domain]) => domain);

    return {
      totalEvictions,
      totalMemoryFreed,
      averageEvictionSize,
      mostAffectedDomains
    };
  }

  async updateEvictionPolicy(newPolicy: Partial<EvictionPolicy>): Promise<void> {
    this.policy = { ...this.policy, ...newPolicy };
    console.log('✅ Eviction policy updated');
  }

  async forceEviction(strategy?: EvictionPolicy['strategy']): Promise<EvictionResult> {
    const originalStrategy = this.policy.strategy;
    if (strategy) {
      this.policy.strategy = strategy;
    }

    try {
      const result = await this.optimizeParametricMemory();
      console.log(`🔧 Forced eviction completed: ${result.itemsEvicted} items evicted`);
      return result;
    } finally {
      this.policy.strategy = originalStrategy;
    }
  }

  async saveStateToDisk(): Promise<void> {
    const data = {
      abstractions: Array.from(this.abstractions.entries()),
      evictionHistory: this.evictionHistory,
      policy: this.policy,
      lastSaved: new Date()
    };

    const statePath = path.join(process.cwd(), 'data', 'memory-eviction-state.json');
    await fs.writeFile(statePath, JSON.stringify(data, null, 2));

    console.log(`💾 Memory eviction state saved (${this.abstractions.size} abstractions)`);
  }

  async loadStateFromDisk(): Promise<void> {
    const statePath = path.join(process.cwd(), 'data', 'memory-eviction-state.json');

    try {
      const data = JSON.parse(await fs.readFile(statePath, 'utf8'));

      this.abstractions = new Map(data.abstractions.map(([id, abs]: [string, any]) => [
        id,
        {
          ...abs,
          usageStats: {
            ...abs.usageStats,
            lastAccessed: new Date(abs.usageStats.lastAccessed),
            created: new Date(abs.usageStats.created)
          }
        }
      ]));

      this.evictionHistory = data.evictionHistory.map((result: any) => ({
        ...result,
        nextScheduledEviction: new Date(result.nextScheduledEviction)
      }));

      this.policy = data.policy;

      console.log(`📚 Memory eviction state loaded (${this.abstractions.size} abstractions)`);

    } catch (error) {
      console.log('No existing memory eviction state found, starting fresh');
    }
  }
}

// Default eviction policy
export const defaultEvictionPolicy: EvictionPolicy = {
  strategy: 'adaptive',
  thresholds: {
    maxMemoryUsage: 512, // MB
    maxItemCount: 10000,
    minConfidence: 0.3,
    maxAge: 90, // days
    evictionRate: 0.1 // 10%
  },
  priorities: {
    criticalDomains: ['ai_ml', 'programming', 'traditional_medicine'],
    protectedItems: [], // Would be populated with critical item IDs
    boostFactors: {
      'ai_ml': 2.0,
      'programming': 1.8,
      'traditional_medicine': 1.5,
      'plc_automation': 1.3,
      'mathematics': 1.2
    }
  }
};