import { promises as fs } from 'fs';
import path from 'path';
import * as crypto from 'crypto';
import { createHash } from 'crypto';

export interface SkillDomain {
  name: string;
  description: string;
  sourcePaths: string[];
  vectorDimensions: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  crossDomainLinks: string[]; // Links to other domains
}

export interface KnowledgeVector {
  id: string;
  domain: string;
  content: string;
  vector: number[];
  metadata: {
    source: string;
    timestamp: Date;
    quality: number; // 0-1
    connections: string[]; // IDs of related vectors
  };
}

export interface IngestionResult {
  domain: string;
  vectorsCreated: number;
  processingTime: number;
  quality: number;
  crossDomainLinks: number;
}

export class SkillIngestionSystem {
  private domains: Map<string, SkillDomain> = new Map();
  private knowledgeBase: Map<string, KnowledgeVector> = new Map();
  private processingQueue: string[] = [];
  private isProcessing: boolean = false;

  constructor() {
    this.initializeDomains();
  }

  private initializeDomains(): void {
    // Define core knowledge domains
    const defaultDomains: SkillDomain[] = [
      {
        name: 'traditional_medicine',
        description: 'Traditional Chinese Medicine and herbal knowledge',
        sourcePaths: [
          'docs/yhct/',
          'data/traditional_medicine/',
          'external/knowledge/yhct/'
        ],
        vectorDimensions: 512,
        priority: 'high',
        crossDomainLinks: ['programming', 'data_analysis', 'healthcare']
      },
      {
        name: 'programming',
        description: 'Programming languages, algorithms, and software engineering',
        sourcePaths: [
          'src/',
          'scripts/',
          'docs/programming/',
          'external/knowledge/programming/'
        ],
        vectorDimensions: 768,
        priority: 'critical',
        crossDomainLinks: ['automation', 'ai_ml', 'system_administration']
      },
      {
        name: 'plc_automation',
        description: 'PLC programming and industrial automation',
        sourcePaths: [
          'docs/plc/',
          'data/automation/',
          'external/knowledge/plc/'
        ],
        vectorDimensions: 512,
        priority: 'high',
        crossDomainLinks: ['programming', 'electronics', 'industrial_control']
      },
      {
        name: 'ai_ml',
        description: 'Artificial Intelligence and Machine Learning',
        sourcePaths: [
          'src/ai/',
          'docs/ai/',
          'models/',
          'external/knowledge/ai/'
        ],
        vectorDimensions: 1024,
        priority: 'critical',
        crossDomainLinks: ['programming', 'mathematics', 'data_science']
      },
      {
        name: 'mathematics',
        description: 'Advanced mathematics and algorithms',
        sourcePaths: [
          'docs/math/',
          'external/knowledge/mathematics/'
        ],
        vectorDimensions: 512,
        priority: 'medium',
        crossDomainLinks: ['programming', 'ai_ml', 'physics']
      },
      {
        name: 'business_strategy',
        description: 'Business development and strategic planning',
        sourcePaths: [
          'docs/business/',
          'external/knowledge/business/'
        ],
        vectorDimensions: 384,
        priority: 'medium',
        crossDomainLinks: ['marketing', 'finance', 'management']
      }
    ];

    defaultDomains.forEach(domain => {
      this.domains.set(domain.name, domain);
    });
  }

  async ultraParallelLearn(targetDomains: string[]): Promise<IngestionResult[]> {
    console.log('🧬 Starting Ultra-Parallel Learning Process...');
    console.log(`🎯 Target domains: ${targetDomains.join(', ')}`);

    const results: IngestionResult[] = [];
    const startTime = Date.now();

    // Process domains in parallel
    const promises = targetDomains.map(domain => this.ingestDomain(domain));
    const domainResults = await Promise.allSettled(promises);

    domainResults.forEach((result, index) => {
      const domain = targetDomains[index];
      if (result.status === 'fulfilled') {
        results.push(result.value);
        console.log(`✅ ${domain}: ${result.value.vectorsCreated} vectors created`);
      } else {
        console.error(`❌ ${domain} failed:`, result.reason);
      }
    });

    // Perform cross-domain synthesis
    await this.performCrossDomainSynthesis(results);

    const totalTime = Date.now() - startTime;
    console.log(`🎉 Ultra-Parallel Learning completed in ${totalTime}ms`);
    console.log(`📊 Total vectors created: ${results.reduce((sum, r) => sum + r.vectorsCreated, 0)}`);

    return results;
  }

  private async ingestDomain(domainName: string): Promise<IngestionResult> {
    const domain = this.domains.get(domainName);
    if (!domain) {
      throw new Error(`Domain ${domainName} not found`);
    }

    console.log(`📚 Ingesting domain: ${domainName}`);
    const startTime = Date.now();
    let vectorsCreated = 0;

    // Process all source paths in parallel
    const sourcePromises = domain.sourcePaths.map(sourcePath =>
      this.processSourcePath(domain, sourcePath)
    );

    const sourceResults = await Promise.allSettled(sourcePromises);

    sourceResults.forEach(result => {
      if (result.status === 'fulfilled') {
        vectorsCreated += result.value;
      }
    });

    // Create domain-specific vectors
    const domainVectors = await this.createDomainVectors(domain);
    vectorsCreated += domainVectors;

    const processingTime = Date.now() - startTime;
    const quality = this.calculateIngestionQuality(domain, vectorsCreated);

    return {
      domain: domainName,
      vectorsCreated,
      processingTime,
      quality,
      crossDomainLinks: domain.crossDomainLinks.length
    };
  }

  private async processSourcePath(domain: SkillDomain, sourcePath: string): Promise<number> {
    const fullPath = path.resolve(sourcePath);
    let vectorsCreated = 0;

    try {
      const stats = await fs.stat(fullPath);

      if (stats.isDirectory()) {
        // Process directory recursively
        vectorsCreated += await this.processDirectory(domain, fullPath);
      } else if (stats.isFile()) {
        // Process single file
        vectorsCreated += await this.processFile(domain, fullPath);
      }

    } catch (error) {
      // Path doesn't exist, skip silently
      console.log(`⚠️ Source path not found: ${sourcePath}`);
    }

    return vectorsCreated;
  }

  private async processDirectory(domain: SkillDomain, dirPath: string): Promise<number> {
    let vectorsCreated = 0;

    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      // Process files and subdirectories in parallel
      const processPromises = entries.map(async (entry) => {
        const fullPath = path.join(dirPath, entry.name);

        if (entry.isDirectory()) {
          return this.processDirectory(domain, fullPath);
        } else if (entry.isFile() && this.isProcessableFile(entry.name)) {
          return this.processFile(domain, fullPath);
        }

        return 0;
      });

      const results = await Promise.all(processPromises);
      vectorsCreated = results.reduce((sum, count) => sum + count, 0);

    } catch (error) {
      console.error(`Error processing directory ${dirPath}:`, error);
    }

    return vectorsCreated;
  }

  private async processFile(domain: SkillDomain, filePath: string): Promise<number> {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const chunks = this.chunkContent(content);

      // Process chunks in parallel
      const vectorPromises = chunks.map(chunk =>
        this.createKnowledgeVector(domain, chunk, filePath)
      );

      await Promise.all(vectorPromises);
      return chunks.length;

    } catch (error) {
      console.error(`Error processing file ${filePath}:`, error);
      return 0;
    }
  }

  private isProcessableFile(filename: string): boolean {
    const processableExtensions = [
      '.md', '.txt', '.js', '.ts', '.py', '.java', '.cpp', '.c',
      '.json', '.yaml', '.yml', '.xml', '.html', '.css'
    ];

    const ext = path.extname(filename).toLowerCase();
    return processableExtensions.includes(ext) || filename.startsWith('README');
  }

  private chunkContent(content: string, chunkSize: number = 1000): string[] {
    const chunks: string[] = [];
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);

    let currentChunk = '';

    for (const sentence of sentences) {
      if ((currentChunk + sentence).length > chunkSize && currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
        currentChunk = sentence;
      } else {
        currentChunk += (currentChunk ? '. ' : '') + sentence;
      }
    }

    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }

  private async createKnowledgeVector(
    domain: SkillDomain,
    content: string,
    source: string
  ): Promise<KnowledgeVector> {
    // Create vector embedding (simplified - in reality would use actual ML model)
    const vector = this.createVectorEmbedding(content, domain.vectorDimensions);

    // Calculate content quality
    const quality = this.assessContentQuality(content, domain);

    const knowledgeVector: KnowledgeVector = {
      id: crypto.randomUUID(),
      domain: domain.name,
      content,
      vector,
      metadata: {
        source,
        timestamp: new Date(),
        quality,
        connections: []
      }
    };

    this.knowledgeBase.set(knowledgeVector.id, knowledgeVector);
    return knowledgeVector;
  }

  private createVectorEmbedding(content: string, dimensions: number): number[] {
    // Simplified vector embedding - in production would use actual ML model
    const hash = createHash('sha256').update(content).digest();
    const vector: number[] = [];

    for (let i = 0; i < dimensions; i++) {
      // Convert hash bytes to normalized float values
      const byteValue = hash[i % hash.length];
      vector.push((byteValue - 128) / 128); // Normalize to [-1, 1]
    }

    return vector;
  }

  private assessContentQuality(content: string, domain: SkillDomain): number {
    let quality = 0.5; // Base quality

    // Assess based on content characteristics
    const wordCount = content.split(/\s+/).length;
    if (wordCount > 50) quality += 0.2; // Substantial content
    if (wordCount > 200) quality += 0.1; // Very detailed

    // Check for code-like content in programming domain
    if (domain.name === 'programming' && /function|class|const|let|var/.test(content)) {
      quality += 0.2;
    }

    // Check for technical terms in technical domains
    if (domain.name === 'ai_ml' && /neural|network|learning|model|algorithm/.test(content)) {
      quality += 0.2;
    }

    // Check for medical terms in medicine domain
    if (domain.name === 'traditional_medicine' && /herb|syndrome|meridian|qi|yin|yang/.test(content)) {
      quality += 0.2;
    }

    return Math.min(1.0, quality);
  }

  private async createDomainVectors(domain: SkillDomain): Promise<number> {
    // Create synthetic vectors representing domain concepts
    const domainConcepts = this.getDomainConcepts(domain.name);

    const vectorPromises = domainConcepts.map(concept =>
      this.createKnowledgeVector(domain, concept, `domain:${domain.name}`)
    );

    await Promise.all(vectorPromises);
    return domainConcepts.length;
  }

  private getDomainConcepts(domainName: string): string[] {
    const concepts: Record<string, string[]> = {
      traditional_medicine: [
        'Yin-Yang balance is fundamental to health and disease prevention',
        'Meridian pathways conduct Qi energy throughout the body',
        'Herbal formulas combine multiple ingredients for synergistic effects',
        'Tongue diagnosis reveals internal organ health and energy flow',
        'Pulse diagnosis detects subtle changes in organ function and energy'
      ],
      programming: [
        'Object-oriented design principles promote code reusability and maintainability',
        'Asynchronous programming enables non-blocking execution and better performance',
        'Version control systems track changes and enable collaborative development',
        'Testing frameworks ensure code reliability and catch regressions early',
        'Design patterns provide proven solutions to common software problems'
      ],
      plc_automation: [
        'Ladder logic diagrams represent electrical control circuits symbolically',
        'Programmable controllers execute logic based on input conditions',
        'Industrial networks connect controllers, sensors, and actuators',
        'Safety instrumented systems prevent hazardous conditions',
        'SCADA systems monitor and control industrial processes remotely'
      ],
      ai_ml: [
        'Neural networks learn patterns from data through gradient descent optimization',
        'Supervised learning requires labeled training examples for prediction',
        'Unsupervised learning discovers hidden structures in unlabeled data',
        'Reinforcement learning agents maximize rewards through environmental interaction',
        'Transfer learning adapts pre-trained models to new tasks with limited data'
      ]
    };

    return concepts[domainName] || [];
  }

  private async performCrossDomainSynthesis(results: IngestionResult[]): Promise<void> {
    console.log('🔗 Performing Cross-Domain Synthesis...');

    const highQualityDomains = results.filter(r => r.quality > 0.7);

    for (const result of highQualityDomains) {
      const domain = this.domains.get(result.domain);
      if (!domain) continue;

      for (const linkDomain of domain.crossDomainLinks) {
        await this.synthesizeDomainLink(result.domain, linkDomain);
      }
    }

    console.log('✅ Cross-Domain Synthesis completed');
  }

  private async synthesizeDomainLink(sourceDomain: string, targetDomain: string): Promise<void> {
    // Find high-quality vectors from source domain
    const sourceVectors = Array.from(this.knowledgeBase.values())
      .filter(v => v.domain === sourceDomain && v.metadata.quality > 0.8);

    // Find related concepts in target domain
    const targetVectors = Array.from(this.knowledgeBase.values())
      .filter(v => v.domain === targetDomain);

    // Create synthesis vectors
    for (const sourceVector of sourceVectors.slice(0, 5)) { // Limit to top 5
      for (const targetVector of targetVectors.slice(0, 3)) { // Limit to top 3
        const synthesisContent = `Synthesis: ${sourceVector.content.substring(0, 100)}... connects with ${targetVector.content.substring(0, 100)}... in ${targetDomain} context.`;

        const synthesisDomain: SkillDomain = {
          name: `${sourceDomain}_${targetDomain}_synthesis`,
          description: `Cross-domain synthesis between ${sourceDomain} and ${targetDomain}`,
          sourcePaths: [],
          vectorDimensions: 512,
          priority: 'medium',
          crossDomainLinks: []
        };

        await this.createKnowledgeVector(synthesisDomain, synthesisContent, `synthesis:${sourceDomain}-${targetDomain}`);
      }
    }
  }

  private calculateIngestionQuality(domain: SkillDomain, vectorsCreated: number): number {
    let quality = 0.5; // Base quality

    // Higher quality for more vectors
    if (vectorsCreated > 100) quality += 0.2;
    if (vectorsCreated > 500) quality += 0.1;

    // Higher quality for critical domains
    if (domain.priority === 'critical') quality += 0.2;
    if (domain.priority === 'high') quality += 0.1;

    // Quality bonus for cross-domain links
    quality += domain.crossDomainLinks.length * 0.05;

    return Math.min(1.0, quality);
  }

  // Public API methods
  getKnowledgeBase(): KnowledgeVector[] {
    return Array.from(this.knowledgeBase.values());
  }

  getDomainKnowledge(domain: string): KnowledgeVector[] {
    return Array.from(this.knowledgeBase.values())
      .filter(vector => vector.domain === domain);
  }

  searchKnowledge(query: string, domain?: string): KnowledgeVector[] {
    const queryVector = this.createVectorEmbedding(query, 512);

    let candidates = Array.from(this.knowledgeBase.values());
    if (domain) {
      candidates = candidates.filter(v => v.domain === domain);
    }

    // Calculate cosine similarity and rank
    const ranked = candidates.map(vector => ({
      vector,
      similarity: this.cosineSimilarity(queryVector, vector.vector.slice(0, queryVector.length))
    })).sort((a, b) => b.similarity - a.similarity);

    return ranked.slice(0, 10).map(r => r.vector);
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  addDomain(domain: SkillDomain): void {
    this.domains.set(domain.name, domain);
  }

  getDomains(): SkillDomain[] {
    return Array.from(this.domains.values());
  }

  getIngestionStats(): {
    totalVectors: number;
    domainsCovered: number;
    averageQuality: number;
    crossDomainLinks: number;
  } {
    const vectors = Array.from(this.knowledgeBase.values());
    const qualities = vectors.map(v => v.metadata.quality);

    return {
      totalVectors: vectors.length,
      domainsCovered: this.domains.size,
      averageQuality: qualities.length > 0 ? qualities.reduce((a, b) => a + b, 0) / qualities.length : 0,
      crossDomainLinks: Array.from(this.domains.values()).reduce((sum, d) => sum + d.crossDomainLinks.length, 0)
    };
  }

  async saveKnowledgeBase(): Promise<void> {
    const data = {
      domains: Array.from(this.domains.entries()),
      knowledgeBase: Array.from(this.knowledgeBase.entries()),
      timestamp: new Date()
    };

    await fs.writeFile('./data/knowledge-base.json', JSON.stringify(data, null, 2));
  }

  async loadKnowledgeBase(): Promise<void> {
    try {
      const data = JSON.parse(await fs.readFile('./data/knowledge-base.json', 'utf8'));

      this.domains = new Map(data.domains);
      this.knowledgeBase = new Map(data.knowledgeBase.map(([id, vector]: [string, any]) => [
        id,
        { ...vector, metadata: { ...vector.metadata, timestamp: new Date(vector.metadata.timestamp) } }
      ]));

      console.log(`✅ Loaded ${this.knowledgeBase.size} knowledge vectors`);
    } catch (error) {
      console.log('No existing knowledge base found, starting fresh');
    }
  }
}