import { conversationMemory, ConversationEntry } from './conversation-memory';

export interface LearningInsight {
  topic: string;
  frequency: number;
  sentiment: number;
  lastSeen: Date;
}

export class LearningEngine {
  private insights: Map<string, LearningInsight> = new Map();
  private lastAnalysis: Date | null = null;

  /**
   * Analyze recent conversations to extract learning insights
   */
  async analyzeConversations(): Promise<void> {
    const conversations = Array.from(conversationMemory['conversations'].values());
    const recentConversations = conversations.filter(conv =>
      conv.timestamp > new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
    );

    // Extract topics using simple keyword analysis
    const topicCounts = new Map<string, { count: number; sentiments: number[]; dates: Date[] }>();

    recentConversations.forEach(conv => {
      const words = this.extractKeywords(conv.userMessage + ' ' + conv.aiResponse);

      words.forEach(word => {
        if (!topicCounts.has(word)) {
          topicCounts.set(word, { count: 0, sentiments: [], dates: [] });
        }
        const data = topicCounts.get(word)!;
        data.count++;
        if (conv.metadata?.sentiment !== undefined) {
          data.sentiments.push(conv.metadata.sentiment);
        }
        data.dates.push(conv.timestamp);
      });
    });

    // Update insights
    topicCounts.forEach((data, topic) => {
      const avgSentiment = data.sentiments.length > 0
        ? data.sentiments.reduce((a, b) => a + b, 0) / data.sentiments.length
        : 0;

      this.insights.set(topic, {
        topic,
        frequency: data.count,
        sentiment: avgSentiment,
        lastSeen: new Date(Math.max(...data.dates.map(d => d.getTime())))
      });
    });

    this.lastAnalysis = new Date();
  }

  /**
   * Get personalized response suggestions based on learned patterns
   */
  getPersonalizedSuggestions(userId: string, currentTopic?: string): {
    suggestedResponses: string[];
    learnedTopics: string[];
    userPreferences: Record<string, any>;
  } {
    const userConversations = conversationMemory.getConversationsByUser(userId, 20);

    // Extract learned topics for this user
    const userTopics = new Set<string>();
    userConversations.forEach(conv => {
      this.extractKeywords(conv.userMessage).forEach(word => userTopics.add(word));
    });

    // Find similar past responses
    const suggestedResponses: string[] = [];
    if (currentTopic) {
      const similarConvs = conversationMemory.searchConversations(currentTopic, 5);
      similarConvs.forEach(conv => {
        if (conv.aiResponse.length > 10) {
          suggestedResponses.push(conv.aiResponse);
        }
      });
    }

    // Simple user preferences based on conversation patterns
    const userPreferences: Record<string, any> = {};
    const language = userConversations.some(conv => conv.metadata?.language === 'vi') ? 'vi' : 'en';
    userPreferences.language = language;

    return {
      suggestedResponses: [...new Set(suggestedResponses)].slice(0, 3),
      learnedTopics: Array.from(userTopics),
      userPreferences
    };
  }

  /**
   * Get learning statistics
   */
  getLearningStats(): {
    totalInsights: number;
    mostFrequentTopic: string | null;
    averageSentiment: number;
    lastAnalysis: Date | null;
  } {
    const insights = Array.from(this.insights.values());

    const mostFrequent = insights.reduce((max, curr) =>
      curr.frequency > max.frequency ? curr : max,
      insights[0] || null
    );

    const avgSentiment = insights.length > 0
      ? insights.reduce((sum, ins) => sum + ins.sentiment, 0) / insights.length
      : 0;

    return {
      totalInsights: insights.length,
      mostFrequentTopic: mostFrequent?.topic || null,
      averageSentiment: avgSentiment,
      lastAnalysis: this.lastAnalysis
    };
  }

  /**
   * Simple keyword extraction (placeholder for more sophisticated NLP)
   */
  private extractKeywords(text: string): string[] {
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3 && !this.isStopWord(word));

    return [...new Set(words)]; // Remove duplicates
  }

  /**
   * Basic stop word filter
   */
  private isStopWord(word: string): boolean {
    const stopWords = new Set([
      'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
      'an', 'a', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has',
      'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might',
      'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we',
      'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his', 'its', 'our',
      'their', 'what', 'when', 'where', 'why', 'how', 'which', 'who', 'all', 'any',
      'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor',
      'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just', 'also'
    ]);

    return stopWords.has(word);
  }
}

// Export singleton
export const learningEngine = new LearningEngine();

// Auto-analyze conversations periodically
setInterval(() => {
  learningEngine.analyzeConversations().catch(console.error);
}, 60 * 60 * 1000); // Every hour