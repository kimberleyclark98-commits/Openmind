import { exec } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { promisify } from 'util';
import * as crypto from 'crypto';

const execAsync = promisify(exec);

export interface MutationConfig {
  mutationRate: number; // 0-1, how aggressive mutations are
  preserveCoreLogic: boolean; // Keep essential functionality intact
  maxMutations: number; // Maximum mutations per cycle
  targetFiles: string[]; // Files to mutate
  excludedPatterns: string[]; // Patterns to avoid mutating
}

export interface MutationRecord {
  id: string;
  timestamp: Date;
  filePath: string;
  mutations: Mutation[];
  success: boolean;
  reason?: string;
}

export interface Mutation {
  type: 'variable_rename' | 'function_rename' | 'string_obfuscation' | 'code_reorder' | 'comment_removal' | 'port_change' | 'endpoint_change';
  original: string;
  mutated: string;
  line: number;
}

export class SelfMutator {
  private config: MutationConfig;
  private mutationHistory: MutationRecord[] = [];
  private originalCodebase: Map<string, string> = new Map();

  constructor(config: MutationConfig) {
    this.config = config;
    this.loadOriginalCodebase();
  }

  private async loadOriginalCodebase(): Promise<void> {
    console.log('📚 Loading original codebase...');

    for (const file of this.config.targetFiles) {
      try {
        const content = await fs.readFile(file, 'utf8');
        this.originalCodebase.set(file, content);
      } catch (error) {
        console.warn(`Failed to load ${file}:`, error);
      }
    }

    console.log(`✅ Loaded ${this.originalCodebase.size} files`);
  }

  async mutateForMigration(targetProvider: string): Promise<boolean> {
    console.log(`🔄 Starting mutation cycle for ${targetProvider}...`);

    const mutations: MutationRecord[] = [];
    let success = true;

    try {
      // Determine mutation strategy based on target
      const strategy = this.getMutationStrategy(targetProvider);

      for (const [filePath, content] of this.originalCodebase) {
        if (this.shouldSkipFile(filePath)) continue;

        const fileMutations = await this.mutateFile(filePath, content, strategy);
        if (fileMutations.length > 0) {
          mutations.push({
            id: crypto.randomUUID(),
            timestamp: new Date(),
            filePath,
            mutations: fileMutations,
            success: true
          });
        }
      }

      // Apply all mutations
      for (const record of mutations) {
        await this.applyMutations(record);
      }

      // Test that mutations don't break functionality
      const testsPass = await this.runMutationTests();
      if (!testsPass) {
        console.log('❌ Mutations broke functionality, reverting...');
        await this.revertMutations();
        success = false;
      } else {
        this.mutationHistory.push(...mutations);
        await this.saveMutationHistory();
        console.log(`✅ Successfully applied ${mutations.length} mutations`);
      }

    } catch (error) {
      console.error('❌ Mutation failed:', error);
      await this.revertMutations();
      success = false;
    }

    return success;
  }

  private getMutationStrategy(targetProvider: string): MutationStrategy {
    // Different strategies for different providers to avoid detection
    const strategies: Record<string, MutationStrategy> = {
      'digitalocean': {
        variableRenames: true,
        functionRenames: true,
        stringObfuscation: false,
        portChanges: true,
        endpointChanges: true
      },
      'linode': {
        variableRenames: true,
        functionRenames: false,
        stringObfuscation: true,
        portChanges: true,
        endpointChanges: false
      },
      'vultr': {
        variableRenames: false,
        functionRenames: true,
        stringObfuscation: true,
        portChanges: false,
        endpointChanges: true
      },
      'default': {
        variableRenames: true,
        functionRenames: true,
        stringObfuscation: false,
        portChanges: true,
        endpointChanges: false
      }
    };

    return strategies[targetProvider] || strategies.default;
  }

  private async mutateFile(
    filePath: string,
    content: string,
    strategy: MutationStrategy
  ): Promise<Mutation[]> {
    const mutations: Mutation[] = [];
    const lines = content.split('\n');

    for (let i = 0; i < lines.length && mutations.length < this.config.maxMutations; i++) {
      const line = lines[i];

      // Apply mutations based on strategy
      if (strategy.variableRenames && Math.random() < this.config.mutationRate) {
        const varMutation = this.mutateVariable(line, i + 1);
        if (varMutation) mutations.push(varMutation);
      }

      if (strategy.functionRenames && Math.random() < this.config.mutationRate) {
        const funcMutation = this.mutateFunction(line, i + 1);
        if (funcMutation) mutations.push(funcMutation);
      }

      if (strategy.stringObfuscation && Math.random() < this.config.mutationRate) {
        const strMutation = this.mutateString(line, i + 1);
        if (strMutation) mutations.push(strMutation);
      }

      if (strategy.portChanges && Math.random() < this.config.mutationRate) {
        const portMutation = this.mutatePort(line, i + 1);
        if (portMutation) mutations.push(portMutation);
      }

      if (strategy.endpointChanges && Math.random() < this.config.mutationRate) {
        const endpointMutation = this.mutateEndpoint(line, i + 1);
        if (endpointMutation) mutations.push(endpointMutation);
      }
    }

    return mutations;
  }

  private mutateVariable(line: string, lineNum: number): Mutation | null {
    const varRegex = /\b(let|const|var)\s+(\w+)\s*=/g;
    const match = varRegex.exec(line);

    if (match && !this.isCoreVariable(match[2])) {
      const original = match[0];
      const newName = this.generateRandomName();
      const mutated = original.replace(match[2], newName);

      return {
        type: 'variable_rename',
        original,
        mutated,
        line: lineNum
      };
    }

    return null;
  }

  private mutateFunction(line: string, lineNum: number): Mutation | null {
    const funcRegex = /\bfunction\s+(\w+)\s*\(/g;
    const match = funcRegex.exec(line);

    if (match && !this.isCoreFunction(match[1])) {
      const original = match[0];
      const newName = this.generateRandomName();
      const mutated = original.replace(match[1], newName);

      return {
        type: 'function_rename',
        original,
        mutated,
        line: lineNum
      };
    }

    return null;
  }

  private mutateString(line: string, lineNum: number): Mutation | null {
    const stringRegex = /"([^"]+)"/g;
    const match = stringRegex.exec(line);

    if (match && match[1].length > 3 && !this.isCoreString(match[1])) {
      const original = match[0];
      const obfuscated = this.obfuscateString(match[1]);
      const mutated = line.replace(original, `"${obfuscated}"`);

      return {
        type: 'string_obfuscation',
        original,
        mutated,
        line: lineNum
      };
    }

    return null;
  }

  private mutatePort(line: string, lineNum: number): Mutation | null {
    const portRegex = /port[:\s]*(\d{4})/gi;
    const match = portRegex.exec(line);

    if (match) {
      const original = match[0];
      const newPort = this.generateRandomPort();
      const mutated = original.replace(match[1], newPort.toString());

      return {
        type: 'port_change',
        original,
        mutated,
        line: lineNum
      };
    }

    return null;
  }

  private mutateEndpoint(line: string, lineNum: number): Mutation | null {
    const endpointRegex = /(https?:\/\/[^\s"'`]+)/g;
    const match = endpointRegex.exec(line);

    if (match && !this.isCoreEndpoint(match[1])) {
      const original = match[0];
      const mutated = this.mutateEndpointUrl(match[1]);

      return {
        type: 'endpoint_change',
        original,
        mutated,
        line: lineNum
      };
    }

    return null;
  }

  private generateRandomName(): string {
    const adjectives = ['blue', 'green', 'red', 'yellow', 'purple', 'orange'];
    const nouns = ['fox', 'wolf', 'eagle', 'shark', 'tiger', 'bear'];
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    return `${adj}${noun}${Math.floor(Math.random() * 100)}`;
  }

  private generateRandomPort(): number {
    // Use ports in the dynamic/private range (49152-65535)
    return Math.floor(Math.random() * (65535 - 49152) + 49152);
  }

  private obfuscateString(str: string): string {
    // Simple ROT13 obfuscation
    return str.replace(/[a-zA-Z]/g, (char) => {
      const base = char <= 'Z' ? 65 : 97;
      return String.fromCharCode(((char.charCodeAt(0) - base + 13) % 26) + base);
    });
  }

  private mutateEndpointUrl(url: string): string {
    // Change subdomains or add random paths
    try {
      const urlObj = new URL(url);
      const randomSub = this.generateRandomName().toLowerCase();
      urlObj.hostname = `${randomSub}.${urlObj.hostname}`;
      return urlObj.toString();
    } catch {
      return url; // Return original if parsing fails
    }
  }

  private isCoreVariable(name: string): boolean {
    const coreVars = ['config', 'req', 'res', 'next', 'error', 'data', 'result'];
    return coreVars.includes(name) || this.config.preserveCoreLogic;
  }

  private isCoreFunction(name: string): boolean {
    const coreFuncs = ['main', 'init', 'run', 'start', 'stop', 'handle', 'process'];
    return coreFuncs.includes(name) || this.config.preserveCoreLogic;
  }

  private isCoreString(str: string): boolean {
    const coreStrings = ['error', 'success', 'failed', 'ok', 'true', 'false'];
    return coreStrings.includes(str.toLowerCase());
  }

  private isCoreEndpoint(url: string): boolean {
    // Don't mutate critical service endpoints
    return url.includes('api.') || url.includes('health') || url.includes('auth');
  }

  private shouldSkipFile(filePath: string): boolean {
    return this.config.excludedPatterns.some(pattern =>
      filePath.includes(pattern)
    );
  }

  private async applyMutations(record: MutationRecord): Promise<void> {
    const content = await fs.readFile(record.filePath, 'utf8');
    let mutatedContent = content;
    const lines = mutatedContent.split('\n');

    // Apply each mutation to the correct line
    for (const mutation of record.mutations) {
      if (lines[mutation.line - 1]) {
        lines[mutation.line - 1] = lines[mutation.line - 1].replace(
          mutation.original,
          mutation.mutated
        );
      }
    }

    mutatedContent = lines.join('\n');
    await fs.writeFile(record.filePath, mutatedContent);
  }

  private async runMutationTests(): Promise<boolean> {
    try {
      // Run basic syntax check
      await execAsync('npm run typecheck');
      console.log('✅ TypeScript compilation passed');

      // Run linting
      await execAsync('npm run lint');
      console.log('✅ Linting passed');

      return true;
    } catch (error) {
      console.error('❌ Tests failed:', error);
      return false;
    }
  }

  async revertMutations(): Promise<void> {
    console.log('🔄 Reverting mutations...');

    // Restore original files
    for (const [filePath, content] of this.originalCodebase) {
      await fs.writeFile(filePath, content);
    }

    console.log('✅ Mutations reverted');
  }

  private async saveMutationHistory(): Promise<void> {
    const historyPath = path.join(process.cwd(), 'data', 'mutation-history.json');
    await fs.writeFile(historyPath, JSON.stringify(this.mutationHistory, null, 2));
  }

  getMutationHistory(): MutationRecord[] {
    return [...this.mutationHistory];
  }

  getMutationStats(): {
    totalMutations: number;
    successfulMutations: number;
    failedMutations: number;
    mutationTypes: Record<string, number>;
  } {
    const totalMutations = this.mutationHistory.length;
    const successfulMutations = this.mutationHistory.filter(m => m.success).length;
    const failedMutations = totalMutations - successfulMutations;

    const mutationTypes: Record<string, number> = {};
    for (const record of this.mutationHistory) {
      for (const mutation of record.mutations) {
        mutationTypes[mutation.type] = (mutationTypes[mutation.type] || 0) + 1;
      }
    }

    return {
      totalMutations,
      successfulMutations,
      failedMutations,
      mutationTypes
    };
  }
}

interface MutationStrategy {
  variableRenames: boolean;
  functionRenames: boolean;
  stringObfuscation: boolean;
  portChanges: boolean;
  endpointChanges: boolean;
}