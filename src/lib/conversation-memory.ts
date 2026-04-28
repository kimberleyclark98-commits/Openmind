import { promises as fs } from 'fs';
import path from 'path';

export interface ConversationEntry {
  id: string;
  userId?: string;
  timestamp: Date;
  userMessage: string;
  aiResponse: string;
  metadata?: {
    sentiment?: number; // -1 to 1
    topics?: string[];
    language?: string;
    helpfulness?: number; // 1-5
  };
}

export class ConversationMemory {
  private conversations: Map<string, ConversationEntry> = new Map();
  private maxConversations = 10000;
  private memoryFile = path.join(process.cwd(), 'data', 'conversations.json');

  constructor() {
    this.loadConversations();
  }

  /**
   * Store a new conversation
   */
  async storeConversation(conversation: Omit<ConversationEntry, 'id' | 'timestamp'>): Promise<string> {
    const id = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const entry: ConversationEntry = {
      id,
      timestamp: new Date(),
      ...conversation
    };

    this.conversations.set(id, entry);

    // Keep only recent conversations
    if (this.conversations.size > this.maxConversations) {
      const oldest = Array.from(this.conversations.entries())
        .sort((a, b) => a[1].timestamp.getTime() - b[1].timestamp.getTime())
        .slice(0, this.conversations.size - this.maxConversations);

      oldest.forEach(([id]) => this.conversations.delete(id));
    }

    await this.saveConversations();
    return id;
  }

  /**
   * Get conversations by user
   */
  getConversationsByUser(userId: string, limit = 50): ConversationEntry[] {
    return Array.from(this.conversations.values())
      .filter(conv => conv.userId === userId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Search conversations by content
   */
  searchConversations(query: string, limit = 10): ConversationEntry[] {
    const queryLower = query.toLowerCase();
    const results = Array.from(this.conversations.values())
      .filter(conv =>
        conv.userMessage.toLowerCase().includes(queryLower) ||
        conv.aiResponse.toLowerCase().includes(queryLower)
      )
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);

    return results;
  }

  /**
   * Get conversation statistics
   */
  getStats(): {
    totalConversations: number;
    averageLength: number;
    mostActiveUsers: string[];
    recentActivity: number;
  } {
    const convs = Array.from(this.conversations.values());
    const userCounts = new Map<string, number>();

    convs.forEach(conv => {
      if (conv.userId) {
        userCounts.set(conv.userId, (userCounts.get(conv.userId) || 0) + 1);
      }
    });

    const mostActiveUsers = Array.from(userCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([user]) => user);

    const avgLength = convs.length > 0
      ? convs.reduce((sum, conv) => sum + conv.userMessage.length + conv.aiResponse.length, 0) / convs.length
      : 0;

    const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentActivity = convs.filter(conv => conv.timestamp > lastWeek).length;

    return {
      totalConversations: convs.length,
      averageLength: avgLength,
      mostActiveUsers,
      recentActivity
    };
  }

  /**
   * Learn from conversations - extract patterns and insights
   */
  analyzeLearning(): {
    commonTopics: string[];
    sentimentTrend: number;
    userPreferences: Record<string, any>;
  } {
    const convs = Array.from(this.conversations.values());

    // Simple topic extraction (placeholder - could use NLP)
    const topics = new Map<string, number>();
    convs.forEach(conv => {
      const words = conv.userMessage.toLowerCase().split(/\s+/);
      words.forEach(word => {
        if (word.length > 4) { // Simple filter for meaningful words
          topics.set(word, (topics.get(word) || 0) + 1);
        }
      });
    });

    const commonTopics = Array.from(topics.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([topic]) => topic);

    // Average sentiment
    const sentiments = convs
      .filter(conv => conv.metadata?.sentiment !== undefined)
      .map(conv => conv.metadata!.sentiment!);

    const sentimentTrend = sentiments.length > 0
      ? sentiments.reduce((sum, s) => sum + s, 0) / sentiments.length
      : 0;

    // Placeholder for user preferences
    const userPreferences: Record<string, any> = {};

    return {
      commonTopics,
      sentimentTrend,
      userPreferences
    };
  }

  private async loadConversations(): Promise<void> {
    try {
      const data = await fs.readFile(this.memoryFile, 'utf8');
      const parsed = JSON.parse(data);
      if (parsed.conversations && Array.isArray(parsed.conversations)) {
        this.conversations.clear();
        parsed.conversations.forEach((entry: ConversationEntry) => {
          entry.timestamp = new Date(entry.timestamp);
          this.conversations.set(entry.id, entry);
        });
      }
    } catch (error) {
      // File doesn't exist, start fresh
      console.log('Starting with fresh conversation memory');
    }
  }

  private async saveConversations(): Promise<void> {
    try {
      await fs.mkdir(path.dirname(this.memoryFile), { recursive: true });
      const data = {
        exportedAt: new Date().toISOString(),
        conversations: Array.from(this.conversations.values())
      };
      await fs.writeFile(this.memoryFile, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Failed to save conversations:', error);
    }
  }
}

// Export singleton
export const conversationMemory = new ConversationMemory();