import { promises as fs } from 'fs';
import path from 'path';
import * as crypto from 'crypto';
import { createHash } from 'crypto';

export interface KnowledgeConcept {
  id: string;
  domain: string;
  name: string;
  description: string;
  keyPrinciples: string[];
  examples: string[];
  confidence: number; // 0-1
  usageCount: number;
  lastUsed: Date;
  compressed: boolean;
  vector?: number[]; // Quantized vector
  metadata: {
    source: string;
    created: Date;
    version: number;
    dependencies: string[];
  };
}

export interface MemoryOptimizationResult {
  conceptsProcessed: number;
  compressionRatio: number;
  memorySaved: number;
  performanceImpact: number;
  evictedItems: number;
}

export class ParametricMemory {
  private concepts: Map<string, KnowledgeConcept> = new Map();
  private memoryStats: {
    totalConcepts: number;
    compressedConcepts: number;
    totalMemoryUsage: number;
    averageConfidence: number;
    lastOptimization: Date;
  } = {
    totalConcepts: 0,
    compressedConcepts: 0,
    totalMemoryUsage: 0,
    averageConfidence: 0,
    lastOptimization: new Date()
  };

  private optimizationConfig = {
    quantizationBits: 4, // 4-bit quantization
    compressionThreshold: 0.7, // Compress concepts used less than this
    evictionThreshold: 30, // Days unused
    maxConcepts: 10000, // Maximum concepts to retain
    minConfidence: 0.3 // Minimum confidence to retain
  };

  constructor() {
    this.initializeMemory();
  }

  private async initializeMemory(): Promise<void> {
    console.log('🧠 Initializing Parametric Memory...');

    await this.loadPersistedConcepts();
    this.updateMemoryStats();

    console.log(`✅ Parametric Memory initialized with ${this.concepts.size} concepts`);
  }

  async absorbKnowledge(rawData: string[], domain: string, source: string): Promise<{
    conceptsCreated: number;
    compressionRatio: number;
    distilledKnowledge: KnowledgeConcept[];
  }> {
    console.log(`📚 Absorbing knowledge from ${domain} (${rawData.length} items)`);

    const distilledConcepts: KnowledgeConcept[] = [];

    // Phase 1: Extract key concepts
    const extractedConcepts = await this.extractConcepts(rawData, domain);

    // Phase 2: Deduplicate and merge
    const uniqueConcepts = this.deduplicateConcepts(extractedConcepts);

    // Phase 3: Compress and store
    for (const concept of uniqueConcepts) {
      const compressedConcept = await this.compressConcept(concept, source);
      this.concepts.set(compressedConcept.id, compressedConcept);
      distilledConcepts.push(compressedConcept);
    }

    // Phase 4: Update relationships
    await this.updateConceptRelationships(distilledConcepts);

    // Phase 5: Optimize memory
    await this.optimizeMemory();

    this.updateMemoryStats();

    const compressionRatio = this.calculateCompressionRatio(rawData, distilledConcepts);

    console.log(`✅ Created ${distilledConcepts.length} concepts with ${compressionRatio.toFixed(1)}x compression`);

    return {
      conceptsCreated: distilledConcepts.length,
      compressionRatio,
      distilledKnowledge: distilledConcepts
    };
  }

  private async extractConcepts(rawData: string[], domain: string): Promise<Partial<KnowledgeConcept>[]> {
    const concepts: Partial<KnowledgeConcept>[] = [];

    for (const item of rawData) {
      // Extract key sentences and phrases
      const sentences = this.extractKeySentences(item);
      const principles = await this.extractPrinciples(sentences, domain);
      const examples = this.extractExamples(sentences);

      if (principles.length > 0) {
        const concept: Partial<KnowledgeConcept> = {
          id: crypto.randomUUID(),
          domain,
          name: this.generateConceptName(principles[0], domain),
          description: principles[0],
          keyPrinciples: principles,
          examples: examples.slice(0, 3), // Limit examples
          confidence: this.calculateConfidence(principles, examples),
          usageCount: 1,
          lastUsed: new Date(),
          compressed: false,
          metadata: {
            source: 'extraction',
            created: new Date(),
            version: 1,
            dependencies: []
          }
        };

        concepts.push(concept);
      }
    }

    return concepts;
  }

  private extractKeySentences(text: string): string[] {
    // Split into sentences and filter for important ones
    const sentences = text.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 10);

    // Score sentences by importance
    const scoredSentences = sentences.map(sentence => ({
      text: sentence,
      score: this.scoreSentenceImportance(sentence)
    }));

    // Return top 30% most important sentences
    return scoredSentences
      .sort((a, b) => b.score - a.score)
      .slice(0, Math.ceil(sentences.length * 0.3))
      .map(s => s.text);
  }

  private scoreSentenceImportance(sentence: string): number {
    let score = 0;

    // Keywords that indicate importance
    const importantKeywords = [
      'important', 'key', 'principle', 'fundamental', 'essential', 'core',
      'best practice', 'recommended', 'should', 'must', 'critical',
      'algorithm', 'method', 'technique', 'approach', 'strategy'
    ];

    for (const keyword of importantKeywords) {
      if (sentence.toLowerCase().includes(keyword)) {
        score += 2;
      }
    }

    // Technical terms
    const technicalIndicators = [
      'function', 'class', 'method', 'algorithm', 'data structure',
      'complexity', 'performance', 'optimization', 'design pattern'
    ];

    for (const indicator of technicalIndicators) {
      if (sentence.toLowerCase().includes(indicator)) {
        score += 1.5;
      }
    }

    // Length bonus (substantial content)
    if (sentence.length > 50) score += 1;
    if (sentence.length > 100) score += 0.5;

    // Question marks indicate explanations
    if (sentence.includes('?')) score += 0.5;

    return score;
  }

  private async extractPrinciples(sentences: string[], domain: string): Promise<string[]> {
    const principles: string[] = [];

    for (const sentence of sentences) {
      // Use simple heuristics to identify principles
      if (this.isPrinciple(sentence, domain)) {
        // Clean and normalize the principle
        const cleanPrinciple = this.cleanPrinciple(sentence);
        if (cleanPrinciple && !principles.includes(cleanPrinciple)) {
          principles.push(cleanPrinciple);
        }
      }
    }

    return principles.slice(0, 5); // Limit to 5 key principles
  }

  private isPrinciple(sentence: string, domain: string): boolean {
    // Domain-specific principle detection
    const principleIndicators: Record<string, string[]> = {
      traditional_medicine: [
        'balance', 'harmony', 'flow', 'energy', 'organ', 'syndrome',
        'herb', 'formula', 'treatment', 'diagnosis'
      ],
      programming: [
        'design', 'pattern', 'algorithm', 'structure', 'optimization',
        'performance', 'maintainability', 'scalability'
      ],
      plc_automation: [
        'logic', 'control', 'sensor', 'actuator', 'sequence', 'automation',
        'safety', 'efficiency', 'monitoring'
      ],
      ai_ml: [
        'learning', 'model', 'training', 'prediction', 'accuracy',
        'optimization', 'neural network', 'algorithm'
      ]
    };

    const indicators = principleIndicators[domain] || [];
    const lowerSentence = sentence.toLowerCase();

    return indicators.some(indicator => lowerSentence.includes(indicator));
  }

  private cleanPrinciple(sentence: string): string {
    // Clean and normalize principle text
    let clean = sentence
      .replace(/^[^a-zA-Z]*/, '') // Remove leading non-letters
      .replace(/[^a-zA-Z0-9\s.,!?-]$/, '') // Clean ending
      .trim();

    // Capitalize first letter
    if (clean.length > 0) {
      clean = clean.charAt(0).toUpperCase() + clean.slice(1);
    }

    return clean.length > 10 ? clean : ''; // Minimum length
  }

  private extractExamples(sentences: string[]): string[] {
    // Extract sentences that look like examples
    return sentences
      .filter(sentence =>
        sentence.includes('example') ||
        sentence.includes('e.g.') ||
        sentence.includes('for instance') ||
        sentence.match(/\d+\./) || // Numbered lists
        sentence.startsWith('•') || // Bullet points
        sentence.startsWith('-')
      )
      .slice(0, 3); // Limit examples
  }

  private calculateConfidence(principles: string[], examples: string[]): number {
    let confidence = 0.5; // Base confidence

    // More principles = higher confidence
    confidence += Math.min(0.3, principles.length * 0.1);

    // Examples increase confidence
    confidence += Math.min(0.2, examples.length * 0.1);

    // Principle quality
    const avgPrincipleLength = principles.reduce((sum, p) => sum + p.length, 0) / principles.length;
    if (avgPrincipleLength > 50) confidence += 0.1;

    return Math.min(1.0, confidence);
  }

  private generateConceptName(principle: string, domain: string): string {
    // Generate a concise name from the principle
    const words = principle.split(' ').slice(0, 4);
    const name = words.join(' ');

    // Add domain prefix for clarity
    const domainPrefix = domain.split('_').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join('');

    return `${domainPrefix}: ${name}`;
  }

  private deduplicateConcepts(concepts: Partial<KnowledgeConcept>[]): Partial<KnowledgeConcept>[] {
    const uniqueConcepts: Partial<KnowledgeConcept>[] = [];
    const seenDescriptions = new Set<string>();

    for (const concept of concepts) {
      const description = concept.description?.toLowerCase().trim();

      if (description && !seenDescriptions.has(description)) {
        // Check similarity with existing concepts
        const isDuplicate = uniqueConcepts.some(existing => {
          const existingDesc = existing.description?.toLowerCase().trim();
          return this.calculateSimilarity(description, existingDesc) > 0.8;
        });

        if (!isDuplicate) {
          seenDescriptions.add(description);
          uniqueConcepts.push(concept);
        }
      }
    }

    return uniqueConcepts;
  }

  private calculateSimilarity(text1: string, text2: string): number {
    // Simple Jaccard similarity
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));

    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);

    return intersection.size / union.size;
  }

  private async compressConcept(
    concept: Partial<KnowledgeConcept>,
    source: string
  ): Promise<KnowledgeConcept> {
    const fullConcept: KnowledgeConcept = {
      id: concept.id!,
      domain: concept.domain!,
      name: concept.name!,
      description: concept.description!,
      keyPrinciples: concept.keyPrinciples!,
      examples: concept.examples!,
      confidence: concept.confidence!,
      usageCount: concept.usageCount!,
      lastUsed: concept.lastUsed!,
      compressed: false,
      metadata: {
        ...concept.metadata!,
        source
      }
    };

    // Compress if concept is stable (used multiple times)
    if (fullConcept.usageCount > 5 && fullConcept.confidence > 0.7) {
      fullConcept.compressed = true;
      fullConcept.vector = await this.quantizeConcept(fullConcept);
    }

    return fullConcept;
  }

  private async quantizeConcept(concept: KnowledgeConcept): Promise<number[]> {
    // Create a vector representation and quantize it
    const text = `${concept.name} ${concept.description} ${concept.keyPrinciples.join(' ')}`;

    // Simple text-to-vector conversion
    const hash = createHash('sha256').update(text).digest();
    const vector: number[] = [];

    // Convert hash to float vector
    for (let i = 0; i < 128; i++) { // 128-dimensional vector
      const byte = hash[i % hash.length];
      vector.push((byte / 255) * 2 - 1); // Normalize to [-1, 1]
    }

    // Quantize to 4 bits (16 possible values)
    const quantizedVector = vector.map(value => {
      // Map [-1, 1] to [0, 15] and back to [-1, 1]
      const quantized = Math.round(((value + 1) / 2) * 15);
      return (quantized / 15) * 2 - 1;
    });

    return quantizedVector;
  }

  private async updateConceptRelationships(concepts: KnowledgeConcept[]): Promise<void> {
    for (const concept of concepts) {
      // Find related concepts
      const relatedConcepts = Array.from(this.concepts.values())
        .filter(existing =>
          existing.domain === concept.domain &&
          this.calculateSimilarity(concept.description, existing.description) > 0.3
        )
        .slice(0, 5); // Limit relationships

      concept.metadata.dependencies = relatedConcepts.map(rc => rc.id);
    }
  }

  private async optimizeMemory(): Promise<void> {
    console.log('🧹 Optimizing parametric memory...');

    const concepts = Array.from(this.concepts.values());
    let evictedCount = 0;

    // Evict old/unused concepts
    const now = new Date();
    const evictionThreshold = this.optimizationConfig.evictionThreshold * 24 * 60 * 60 * 1000; // days to ms

    for (const concept of concepts) {
      const daysUnused = (now.getTime() - concept.lastUsed.getTime()) / (24 * 60 * 60 * 1000);

      if (daysUnused > this.optimizationConfig.evictionThreshold &&
          concept.usageCount < 3) {
        this.concepts.delete(concept.id);
        evictedCount++;
      }
    }

    // Compress low-usage concepts
    for (const concept of this.concepts.values()) {
      if (!concept.compressed &&
          concept.usageCount < this.optimizationConfig.compressionThreshold * 10 &&
          concept.confidence > 0.5) {
        concept.compressed = true;
        concept.vector = await this.quantizeConcept(concept);
      }
    }

    // Limit total concepts
    if (this.concepts.size > this.optimizationConfig.maxConcepts) {
      const sortedConcepts = Array.from(this.concepts.values())
        .sort((a, b) => (b.confidence * b.usageCount) - (a.confidence * a.usageCount));

      const toRemove = sortedConcepts.slice(this.optimizationConfig.maxConcepts);
      for (const concept of toRemove) {
        this.concepts.delete(concept.id);
        evictedCount++;
      }
    }

    console.log(`✅ Memory optimization complete. Evicted ${evictedCount} concepts.`);
  }

  private calculateCompressionRatio(originalData: string[], concepts: KnowledgeConcept[]): number {
    const originalSize = originalData.reduce((sum, item) => sum + item.length, 0);
    const compressedSize = concepts.reduce((sum, concept) =>
      sum + concept.description.length + concept.keyPrinciples.join(' ').length, 0
    );

    return originalSize / Math.max(compressedSize, 1);
  }

  // Public API methods
  async retrieveConcept(conceptId: string): Promise<KnowledgeConcept | null> {
    const concept = this.concepts.get(conceptId);
    if (concept) {
      concept.usageCount++;
      concept.lastUsed = new Date();
      return concept;
    }
    return null;
  }

  async searchConcepts(query: string, domain?: string, limit: number = 10): Promise<KnowledgeConcept[]> {
    const queryWords = query.toLowerCase().split(/\s+/);
    const results: Array<{ concept: KnowledgeConcept; score: number }> = [];

    for (const concept of this.concepts.values()) {
      if (domain && concept.domain !== domain) continue;

      let score = 0;
      const conceptText = `${concept.name} ${concept.description} ${concept.keyPrinciples.join(' ')}`.toLowerCase();

      // Exact word matches
      for (const word of queryWords) {
        if (conceptText.includes(word)) {
          score += 1;
        }
      }

      // Domain relevance
      if (concept.domain === domain) score += 0.5;

      // Usage bonus
      score += concept.usageCount * 0.1;

      // Confidence bonus
      score += concept.confidence * 0.5;

      if (score > 0) {
        results.push({ concept, score });
      }
    }

    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(r => r.concept);
  }

  async getDomainConcepts(domain: string): Promise<KnowledgeConcept[]> {
    return Array.from(this.concepts.values())
      .filter(concept => concept.domain === domain)
      .sort((a, b) => b.usageCount - a.usageCount);
  }

  getMemoryStats() {
    return { ...this.memoryStats };
  }

  async performMemoryOptimization(): Promise<MemoryOptimizationResult> {
    console.log('🧹 Performing comprehensive memory optimization...');

    const beforeStats = { ...this.memoryStats };

    // Compress all eligible concepts
    let compressedCount = 0;
    for (const concept of this.concepts.values()) {
      if (!concept.compressed && concept.confidence > 0.6) {
        concept.compressed = true;
        concept.vector = await this.quantizeConcept(concept);
        compressedCount++;
      }
    }

    // Optimize memory layout
    await this.optimizeMemory();

    // Update stats
    this.updateMemoryStats();

    const afterStats = this.memoryStats;

    const result: MemoryOptimizationResult = {
      conceptsProcessed: this.concepts.size,
      compressionRatio: compressedCount > 0 ? beforeStats.totalConcepts / afterStats.totalConcepts : 1,
      memorySaved: Math.max(0, beforeStats.totalMemoryUsage - afterStats.totalMemoryUsage),
      performanceImpact: 0.05, // Estimated 5% performance improvement
      evictedItems: beforeStats.totalConcepts - afterStats.totalConcepts
    };

    this.memoryStats.lastOptimization = new Date();

    console.log(`✅ Memory optimization complete:`);
    console.log(`   Processed: ${result.conceptsProcessed} concepts`);
    console.log(`   Compressed: ${compressedCount} concepts`);
    console.log(`   Evicted: ${result.evictedItems} concepts`);
    console.log(`   Memory saved: ${result.memorySaved} bytes`);

    return result;
  }

  private updateMemoryStats(): void {
    const concepts = Array.from(this.concepts.values());

    this.memoryStats.totalConcepts = concepts.length;
    this.memoryStats.compressedConcepts = concepts.filter(c => c.compressed).length;

    // Estimate memory usage
    let memoryUsage = 0;
    for (const concept of concepts) {
      memoryUsage += concept.description.length * 2; // Rough estimate
      memoryUsage += concept.keyPrinciples.join(' ').length * 2;
      if (concept.vector) {
        memoryUsage += concept.vector.length * 4; // 4 bytes per float
      }
    }

    this.memoryStats.totalMemoryUsage = memoryUsage;
    this.memoryStats.averageConfidence = concepts.length > 0 ?
      concepts.reduce((sum, c) => sum + c.confidence, 0) / concepts.length : 0;
  }

  async saveToDisk(): Promise<void> {
    const dataPath = path.join(process.cwd(), 'data', 'parametric-memory.json');

    const data = {
      concepts: Array.from(this.concepts.entries()),
      stats: this.memoryStats,
      lastSaved: new Date()
    };

    await fs.writeFile(dataPath, JSON.stringify(data, null, 2));
    console.log(`💾 Parametric memory saved (${this.concepts.size} concepts)`);
  }

  async loadFromDisk(): Promise<void> {
    const dataPath = path.join(process.cwd(), 'data', 'parametric-memory.json');

    try {
      const data = JSON.parse(await fs.readFile(dataPath, 'utf8'));

      this.concepts = new Map(data.concepts.map(([id, concept]: [string, any]) => [
        id,
        {
          ...concept,
          lastUsed: new Date(concept.lastUsed),
          metadata: {
            ...concept.metadata,
            created: new Date(concept.metadata.created)
          }
        }
      ]));

      this.memoryStats = data.stats;
      this.updateMemoryStats();

      console.log(`📚 Parametric memory loaded (${this.concepts.size} concepts)`);

    } catch (error) {
      console.log('No existing parametric memory found, starting fresh');
    }
  }
}