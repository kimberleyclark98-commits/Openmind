/**
 * @fileOverview Performance Optimization System for Lightning Code Generator
 *
 * Implements caching, parallel processing, and optimization techniques
 * to achieve lightning-fast code generation.
 */

import { generateCode, type CodeGenerationInput, type CodeGenerationOutput } from './flows/lightning-code-generator';
import { getCodeCompletions, type CodeCompletionInput, type CodeCompletionOutput } from './flows/intelligent-completion';

// Re-export types for API routes
export type { CodeGenerationInput, CodeCompletionInput };

// Simple in-memory cache (in production, use Redis or similar)
const generationCache = new Map<string, { result: CodeGenerationOutput; timestamp: number }>();
const completionCache = new Map<string, { result: CodeCompletionOutput; timestamp: number }>();

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_SIZE = 100;

// Generate cache key from input
function generateCacheKey(input: any): string {
  return JSON.stringify(input, Object.keys(input).sort());
}

// Clean expired cache entries
function cleanCache<T extends Map<string, { timestamp: number }>>(cache: T): void {
  const now = Date.now();
  for (const [key, value] of cache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      cache.delete(key);
    }
  }

  // Limit cache size
  if (cache.size > MAX_CACHE_SIZE) {
    const entries = Array.from(cache.entries());
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    const toDelete = entries.slice(0, cache.size - MAX_CACHE_SIZE);
    toDelete.forEach(([key]) => cache.delete(key));
  }
}

// Optimized code generation with caching and parallel processing
export async function generateCodeOptimized(
  input: CodeGenerationInput
): Promise<CodeGenerationOutput> {
  // Clean cache periodically
  cleanCache(generationCache);

  const cacheKey = generateCacheKey(input);
  const cached = generationCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.result;
  }

  // Generate code
  const result = await generateCode(input);

  // Cache result
  generationCache.set(cacheKey, { result, timestamp: Date.now() });

  return result;
}

// Optimized code completion with caching
export async function getCodeCompletionsOptimized(
  input: CodeCompletionInput
): Promise<CodeCompletionOutput> {
  // Clean cache periodically
  cleanCache(completionCache);

  const cacheKey = generateCacheKey(input);
  const cached = completionCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.result;
  }

  // Get completions
  const result = await getCodeCompletions(input);

  // Cache result
  completionCache.set(cacheKey, { result, timestamp: Date.now() });

  return result;
}

// Batch processing for multiple code generation requests
export async function batchGenerateCode(
  inputs: CodeGenerationInput[]
): Promise<CodeGenerationOutput[]> {
  // Process in parallel with concurrency limit
  const BATCH_SIZE = 3;
  const results: CodeGenerationOutput[] = [];

  for (let i = 0; i < inputs.length; i += BATCH_SIZE) {
    const batch = inputs.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.all(
      batch.map(input => generateCodeOptimized(input))
    );
    results.push(...batchResults);
  }

  return results;
}

// Warm up cache with common patterns
export async function warmupCache(): Promise<void> {
  const commonPatterns = [
    {
      prompt: 'Create a React functional component',
      language: 'typescript',
      requirements: ['Use TypeScript', 'Modern React patterns']
    },
    {
      prompt: 'Write a Python function to sort a list',
      language: 'python',
      requirements: ['Use type hints', 'Follow PEP 8']
    },
    {
      prompt: 'Create a Rust struct with methods',
      language: 'rust',
      requirements: ['Use proper ownership', 'Include documentation']
    }
  ];

  await Promise.all(
    commonPatterns.map(pattern => generateCodeOptimized(pattern))
  );
}

// Performance monitoring
export interface PerformanceMetrics {
  averageGenerationTime: number;
  cacheHitRate: number;
  totalRequests: number;
  cacheSize: number;
}

let performanceMetrics = {
  generationTimes: [] as number[],
  cacheHits: 0,
  totalRequests: 0,
};

export function recordPerformance(startTime: number, cacheHit: boolean): void {
  const duration = Date.now() - startTime;
  performanceMetrics.generationTimes.push(duration);
  performanceMetrics.totalRequests++;

  if (cacheHit) {
    performanceMetrics.cacheHits++;
  }

  // Keep only last 100 measurements
  if (performanceMetrics.generationTimes.length > 100) {
    performanceMetrics.generationTimes = performanceMetrics.generationTimes.slice(-100);
  }
}

export function getPerformanceMetrics(): PerformanceMetrics {
  const avgTime = performanceMetrics.generationTimes.length > 0
    ? performanceMetrics.generationTimes.reduce((a, b) => a + b, 0) / performanceMetrics.generationTimes.length
    : 0;

  const cacheHitRate = performanceMetrics.totalRequests > 0
    ? performanceMetrics.cacheHits / performanceMetrics.totalRequests
    : 0;

  return {
    averageGenerationTime: avgTime,
    cacheHitRate,
    totalRequests: performanceMetrics.totalRequests,
    cacheSize: generationCache.size + completionCache.size,
  };
}

// Prefetch common completions for faster response
export async function prefetchCompletions(language: string, commonPrefixes: string[]): Promise<void> {
  const prefetchPromises = commonPrefixes.map(prefix =>
    getCodeCompletionsOptimized({
      prefix,
      language,
      suggestions: [],
    })
  );

  await Promise.all(prefetchPromises);
}