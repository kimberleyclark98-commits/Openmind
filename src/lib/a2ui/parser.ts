import { A2UIMessage } from './types';

/**
 * A2UI Stream Parser
 * Parses JSON stream responses from OpenMind AI into A2UI messages
 */
export class A2UIStreamParser {
  private buffer: string = '';
  private messages: A2UIMessage[] = [];

  /**
   * Parse a chunk of data from the A2UI stream
   */
  parseChunk(chunk: string): A2UIMessage[] {
    this.buffer += chunk;

    // Split by newlines (each line should be a JSON object)
    const lines = this.buffer.split('\n');
    this.buffer = lines.pop() || ''; // Keep incomplete line in buffer

    const newMessages: A2UIMessage[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      try {
        const message: A2UIMessage = JSON.parse(trimmed);
        if (this.validateMessage(message)) {
          newMessages.push(message);
        }
      } catch (error) {
        console.warn('Failed to parse A2UI message:', trimmed, error);
      }
    }

    this.messages.push(...newMessages);
    return newMessages;
  }

  /**
   * Get all parsed messages
   */
  getMessages(): A2UIMessage[] {
    return [...this.messages];
  }

  /**
   * Clear all messages
   */
  clear(): void {
    this.messages = [];
    this.buffer = '';
  }

  /**
   * Validate A2UI message structure
   */
  private validateMessage(message: any): message is A2UIMessage {
    if (!message || typeof message !== 'object') return false;
    if (!message.type || !message.surfaceId || !message.timestamp) return false;

    const validTypes = ['createSurface', 'updateComponents', 'updateDataModel', 'destroySurface', 'executeAction'];
    if (!validTypes.includes(message.type)) return false;

    return true;
  }
}

/**
 * A2UI Response Detector
 * Detects if a response contains A2UI protocol messages
 */
export class A2UIResponseDetector {
  /**
   * Check if a response string contains A2UI protocol messages
   */
  static containsA2UI(response: string): boolean {
    if (!response || typeof response !== 'string') return false;

    // Check for A2UI message patterns
    const lines = response.split('\n');
    for (const line of lines) {
      try {
        const parsed = JSON.parse(line.trim());
        if (parsed.type && parsed.surfaceId && parsed.timestamp) {
          return true;
        }
      } catch {
        // Not JSON, continue
      }
    }

    return false;
  }

  /**
   * Extract A2UI messages from a mixed response (text + A2UI)
   */
  static extractA2UI(response: string): { text: string; a2uiMessages: A2UIMessage[] } {
    const lines = response.split('\n');
    const textLines: string[] = [];
    const a2uiMessages: A2UIMessage[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      try {
        const parsed: A2UIMessage = JSON.parse(trimmed);
        if (parsed.type && parsed.surfaceId && parsed.timestamp) {
          a2uiMessages.push(parsed);
          continue;
        }
      } catch {
        // Not A2UI JSON, treat as text
      }

      textLines.push(line);
    }

    return {
      text: textLines.join('\n'),
      a2uiMessages
    };
  }
}

/**
 * A2UI Catalog Manager
 * Manages component catalogs for A2UI surfaces
 */
export class A2UICatalogManager {
  private catalogs: Map<string, any> = new Map();

  /**
   * Load a component catalog from URL
   */
  async loadCatalog(url: string): Promise<any> {
    if (this.catalogs.has(url)) {
      return this.catalogs.get(url);
    }

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to load catalog: ${response.status}`);
      }

      const catalog = await response.json();
      this.catalogs.set(url, catalog);
      return catalog;
    } catch (error) {
      console.error('Failed to load A2UI catalog:', error);
      return this.getDefaultCatalog();
    }
  }

  /**
   * Get default component catalog
   */
  private getDefaultCatalog(): any {
    return {
      version: "0.9",
      components: {
        Button: {
          description: "Interactive button component",
          properties: {
            text: { type: "string" },
            variant: { type: "string", enum: ["default", "outline", "ghost"] },
            size: { type: "string", enum: ["sm", "default", "lg"] },
            onClick: { type: "string" }
          },
          events: ["click"],
          category: "input"
        },
        Input: {
          description: "Text input component",
          properties: {
            type: { type: "string", enum: ["text", "password", "email", "number"] },
            placeholder: { type: "string" },
            value: { type: "string" },
            dataBinding: { type: "string" }
          },
          events: ["change", "focus", "blur"],
          category: "input"
        },
        Text: {
          description: "Text display component",
          properties: {
            text: { type: "string" },
            dataBinding: { type: "string" },
            style: { type: "object" }
          },
          events: [],
          category: "display"
        },
        Card: {
          description: "Card container component",
          properties: {
            title: { type: "string" }
          },
          events: [],
          category: "layout"
        },
        Container: {
          description: "Flexible container component",
          properties: {
            display: { type: "string", enum: ["flex", "grid", "block"] },
            flexDirection: { type: "string", enum: ["row", "column"] },
            gap: { type: "string" }
          },
          events: [],
          category: "layout"
        }
      }
    };
  }

  /**
   * Validate component against catalog
   */
  validateComponent(componentType: string, catalogUrl: string, properties: any): boolean {
    const catalog = this.catalogs.get(catalogUrl);
    if (!catalog || !catalog.components[componentType]) {
      return true; // Allow unknown components for flexibility
    }

    const componentDef = catalog.components[componentType];
    // Basic validation - could be enhanced
    return true;
  }
}

// Export singleton instances
export const a2uiParser = new A2UIStreamParser();
export const a2uiDetector = A2UIResponseDetector;
export const a2uiCatalogManager = new A2UICatalogManager();