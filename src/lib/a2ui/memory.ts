import { A2UIMessage } from '@/lib/a2ui/types';

/**
 * A2UI Memory System
 * Remembers created surfaces, user interactions, and preferences
 */
export interface A2UIMemoryEntry {
  surfaceId: string;
  title: string;
  description?: string;
  createdAt: Date;
  lastAccessed: Date;
  accessCount: number;
  userInteractions: UserInteraction[];
  components: Record<string, any>;
  dataModel: Record<string, any>;
  tags: string[];
  category: string;
}

export interface UserInteraction {
  timestamp: Date;
  componentId: string;
  action: string;
  data?: any;
  context?: string;
}

export class A2UIMemorySystem {
  private memory: Map<string, A2UIMemoryEntry> = new Map();
  private maxMemoryEntries = 100;
  private memoryFile = 'data/a2ui-memory.json';

  constructor() {
    this.loadMemory();
  }

  /**
   * Store a new A2UI surface in memory
   */
  storeSurface(surfaceId: string, surfaceData: Partial<A2UIMemoryEntry>): void {
    const entry: A2UIMemoryEntry = {
      surfaceId,
      title: surfaceData.title || 'Unnamed Surface',
      description: surfaceData.description,
      createdAt: surfaceData.createdAt || new Date(),
      lastAccessed: new Date(),
      accessCount: 0,
      userInteractions: [],
      components: surfaceData.components || {},
      dataModel: surfaceData.dataModel || {},
      tags: surfaceData.tags || [],
      category: surfaceData.category || 'general'
    };

    this.memory.set(surfaceId, entry);
    this.saveMemory();
  }

  /**
   * Record user interaction with a surface
   */
  recordInteraction(surfaceId: string, interaction: Omit<UserInteraction, 'timestamp'>): void {
    const entry = this.memory.get(surfaceId);
    if (!entry) return;

    entry.userInteractions.push({
      ...interaction,
      timestamp: new Date()
    });

    entry.lastAccessed = new Date();
    entry.accessCount++;

    // Keep only last 50 interactions per surface
    if (entry.userInteractions.length > 50) {
      entry.userInteractions = entry.userInteractions.slice(-50);
    }

    this.memory.set(surfaceId, entry);
    this.saveMemory();
  }

  /**
   * Retrieve surface from memory
   */
  getSurface(surfaceId: string): A2UIMemoryEntry | null {
    const entry = this.memory.get(surfaceId);
    if (entry) {
      entry.lastAccessed = new Date();
      entry.accessCount++;
      this.memory.set(surfaceId, entry);
      this.saveMemory();
    }
    return entry;
  }

  /**
   * Get all surfaces, optionally filtered by category or tags
   */
  getSurfaces(filters?: { category?: string; tags?: string[]; limit?: number }): A2UIMemoryEntry[] {
    let surfaces = Array.from(this.memory.values());

    if (filters?.category) {
      surfaces = surfaces.filter(s => s.category === filters.category);
    }

    if (filters?.tags && filters.tags.length > 0) {
      surfaces = surfaces.filter(s =>
        filters.tags!.some(tag => s.tags.includes(tag))
      );
    }

    // Sort by last accessed (most recent first)
    surfaces.sort((a, b) => b.lastAccessed.getTime() - a.lastAccessed.getTime());

    if (filters?.limit) {
      surfaces = surfaces.slice(0, filters.limit);
    }

    return surfaces;
  }

  /**
   * Find similar surfaces based on title, description, or tags
   */
  findSimilarSurfaces(query: string, limit = 5): A2UIMemoryEntry[] {
    const queryLower = query.toLowerCase();
    const surfaces = Array.from(this.memory.values());

    const scored = surfaces.map(surface => {
      let score = 0;

      // Title match
      if (surface.title.toLowerCase().includes(queryLower)) {
        score += 10;
      }

      // Description match
      if (surface.description?.toLowerCase().includes(queryLower)) {
        score += 5;
      }

      // Tag matches
      surface.tags.forEach(tag => {
        if (queryLower.includes(tag.toLowerCase())) {
          score += 3;
        }
      });

      // Category match
      if (surface.category.toLowerCase().includes(queryLower)) {
        score += 2;
      }

      return { surface, score };
    });

    return scored
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => item.surface);
  }

  /**
   * Get user interaction patterns for a surface
   */
  getInteractionPatterns(surfaceId: string): {
    mostUsedComponents: string[];
    commonActions: string[];
    usageFrequency: number;
  } {
    const entry = this.memory.get(surfaceId);
    if (!entry) {
      return { mostUsedComponents: [], commonActions: [], usageFrequency: 0 };
    }

    const interactions = entry.userInteractions;

    // Count component usage
    const componentCounts = new Map<string, number>();
    const actionCounts = new Map<string, number>();

    interactions.forEach(interaction => {
      componentCounts.set(
        interaction.componentId,
        (componentCounts.get(interaction.componentId) || 0) + 1
      );

      actionCounts.set(
        interaction.action,
        (actionCounts.get(interaction.action) || 0) + 1
      );
    });

    const mostUsedComponents = Array.from(componentCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([component]) => component);

    const commonActions = Array.from(actionCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([action]) => action);

    // Calculate usage frequency (interactions per day)
    const daysSinceCreation = Math.max(1,
      (Date.now() - entry.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );
    const usageFrequency = entry.accessCount / daysSinceCreation;

    return {
      mostUsedComponents,
      commonActions,
      usageFrequency
    };
  }

  /**
   * Generate A2UI stream to recreate a surface from memory
   */
  recreateSurface(surfaceId: string): string[] | null {
    const entry = this.memory.get(surfaceId);
    if (!entry) return null;

    const stream: string[] = [];

    // Create surface
    stream.push(JSON.stringify({
      createSurface: {
        surfaceId: entry.surfaceId,
        catalogId: "https://a2ui.dev/specification/0.9/standard_catalog_definition.json"
      }
    }));

    // Recreate components
    if (Object.keys(entry.components).length > 0) {
      stream.push(JSON.stringify({
        updateComponents: {
          surfaceId: entry.surfaceId,
          components: Object.values(entry.components)
        }
      }));
    }

    // Restore data model
    if (Object.keys(entry.dataModel).length > 0) {
      stream.push(JSON.stringify({
        updateDataModel: {
          surfaceId: entry.surfaceId,
          dataModel: entry.dataModel
        }
      }));
    }

    return stream;
  }

  /**
   * Clean up old/unused surfaces
   */
  cleanup(maxAgeDays = 30, maxEntries = 50): void {
    const cutoffDate = new Date(Date.now() - maxAgeDays * 24 * 60 * 60 * 1000);

    // Remove old entries
    for (const [surfaceId, entry] of this.memory.entries()) {
      if (entry.lastAccessed < cutoffDate && entry.accessCount < 3) {
        this.memory.delete(surfaceId);
      }
    }

    // If still too many, remove least accessed
    if (this.memory.size > maxEntries) {
      const sorted = Array.from(this.memory.entries())
        .sort((a, b) => {
          // Sort by access count, then by last accessed
          if (a[1].accessCount !== b[1].accessCount) {
            return a[1].accessCount - b[1].accessCount;
          }
          return a[1].lastAccessed.getTime() - b[1].lastAccessed.getTime();
        });

      const toRemove = sorted.slice(0, this.memory.size - maxEntries);
      toRemove.forEach(([surfaceId]) => {
        this.memory.delete(surfaceId);
      });
    }

    this.saveMemory();
  }

  /**
   * Export memory for backup
   */
  exportMemory(): string {
    const data = {
      exportedAt: new Date().toISOString(),
      surfaces: Array.from(this.memory.entries())
    };
    return JSON.stringify(data, null, 2);
  }

  /**
   * Import memory from backup
   */
  importMemory(jsonData: string): void {
    try {
      const data = JSON.parse(jsonData);
      if (data.surfaces && Array.isArray(data.surfaces)) {
        this.memory.clear();
        data.surfaces.forEach(([surfaceId, entry]: [string, A2UIMemoryEntry]) => {
          // Convert date strings back to Date objects
          entry.createdAt = new Date(entry.createdAt);
          entry.lastAccessed = new Date(entry.lastAccessed);
          entry.userInteractions = entry.userInteractions.map(interaction => ({
            ...interaction,
            timestamp: new Date(interaction.timestamp)
          }));
          this.memory.set(surfaceId, entry);
        });
        this.saveMemory();
      }
    } catch (error) {
      console.error('Failed to import memory:', error);
    }
  }

  private async loadMemory(): Promise<void> {
    try {
      const fs = require('fs').promises;
      const data = await fs.readFile(this.memoryFile, 'utf8');
      this.importMemory(data);
    } catch (error) {
      // Memory file doesn't exist or is corrupted, start fresh
      console.log('Starting with fresh A2UI memory');
    }
  }

  private async saveMemory(): Promise<void> {
    try {
      const fs = require('fs').promises;
      const data = this.exportMemory();
      await fs.writeFile(this.memoryFile, data);
    } catch (error) {
      console.error('Failed to save A2UI memory:', error);
    }
  }

  /**
   * Get memory statistics
   */
  getStats(): {
    totalSurfaces: number;
    totalInteractions: number;
    averageUsage: number;
    oldestSurface: Date | null;
    newestSurface: Date | null;
  } {
    const surfaces = Array.from(this.memory.values());

    return {
      totalSurfaces: surfaces.length,
      totalInteractions: surfaces.reduce((sum, s) => sum + s.userInteractions.length, 0),
      averageUsage: surfaces.length > 0
        ? surfaces.reduce((sum, s) => sum + s.accessCount, 0) / surfaces.length
        : 0,
      oldestSurface: surfaces.length > 0
        ? new Date(Math.min(...surfaces.map(s => s.createdAt.getTime())))
        : null,
      newestSurface: surfaces.length > 0
        ? new Date(Math.max(...surfaces.map(s => s.createdAt.getTime())))
        : null
    };
  }
}

// Export singleton instance
export const a2uiMemory = new A2UIMemorySystem();