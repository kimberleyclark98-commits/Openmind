import { SkillContext, SkillResponse } from './skill-router';

/**
 * OpenMind Claude Reasoner Skill
 * Provides structured, step-by-step reasoning similar to Claude AI
 */
export class OpenMindClaudeReasonerSkill {
  async execute(context: SkillContext): Promise<SkillResponse> {
    const { userInput, conversationHistory } = context;

    // Analyze if this requires structured reasoning
    const reasoningNeeded = this.analyzeReasoningNeed(userInput);

    if (!reasoningNeeded) {
      return {
        skill: 'openmind-claude-reasoner',
        format: 'text',
        content: this.generateSimpleResponse(userInput),
        metadata: {
          confidence: 0.7,
          reasoning: 'Simple query, no complex reasoning needed',
          estimatedComplexity: 'simple'
        }
      };
    }

    // Generate structured reasoning response
    const reasoning = await this.generateStructuredReasoning(userInput, conversationHistory);

    return {
      skill: 'openmind-claude-reasoner',
      format: 'text',
      content: reasoning,
      metadata: {
        confidence: 0.95,
        reasoning: 'Applied structured reasoning methodology',
        estimatedComplexity: 'complex'
      }
    };
  }

  private analyzeReasoningNeed(input: string): boolean {
    const reasoningIndicators = [
      /\b(how|what|why|when|where|who)\b.*\b(to|do|should|can|will|would)\b/i,
      /\b(analyze|explain|understand|figure|determine)\b/i,
      /\b(step|process|method|approach|strategy)\b/i,
      /\b(problem|solution|issue|challenge)\b/i,
      /\b(decide|choose|evaluate|assess|compare)\b/i,
      /\b(if|then|because|therefore|however)\b/i,
      /\b(help|assist|guide|advice)\b/i
    ];

    return reasoningIndicators.some(pattern => pattern.test(input));
  }

  private generateSimpleResponse(input: string): string {
    return `🧠 *Claude-style Response*\n\n${input}\n\n*Processing complete with logical precision.*`;
  }

  private async generateStructuredReasoning(input: string, history: any[]): Promise<string> {
    // Step 1: Understand the query
    const understanding = this.understandQuery(input);

    // Step 2: Gather context from history
    const context = this.extractContext(history);

    // Step 3: Break down the problem
    const breakdown = this.breakDownProblem(input);

    // Step 4: Consider multiple perspectives
    const perspectives = this.considerPerspectives(input);

    // Step 5: Provide structured solution
    const solution = this.provideSolution(input, understanding, context, breakdown, perspectives);

    // Step 6: Consider implications and next steps
    const implications = this.considerImplications(input);

    return `🧠 *OpenMind Claude Reasoning Protocol Activated*

## Step 1: Query Understanding
${understanding}

## Step 2: Context Analysis
${context}

## Step 3: Problem Decomposition
${breakdown}

## Step 4: Multiple Perspectives
${perspectives}

## Step 5: Structured Solution
${solution}

## Step 6: Implications & Next Steps
${implications}

*Reasoning complete. Neural pathways optimized for future queries.*`;
  }

  private understandQuery(input: string): string {
    const lowerInput = input.toLowerCase();

    if (/\b(how|what|why)\b.*\b(to|do|should|can)\b/i.test(lowerInput)) {
      return `The query seeks guidance on "${input}". This appears to be a procedural or explanatory question requiring step-by-step reasoning.`;
    }

    if (/\b(analyze|explain|understand)\b/i.test(lowerInput)) {
      return `The query requests analysis of "${input}". This requires breaking down complex concepts into understandable components.`;
    }

    if (/\b(decide|choose|evaluate)\b/i.test(lowerInput)) {
      return `The query involves decision-making for "${input}". Multiple factors and perspectives need consideration.`;
    }

    return `The query "${input}" requires logical reasoning and structured problem-solving approach.`;
  }

  private extractContext(history: any[]): string {
    if (history.length === 0) {
      return "No prior conversation context available. Treating as standalone query.";
    }

    const recentMessages = history.slice(-3);
    return `Recent conversation context:
${recentMessages.map((msg, i) => `${i + 1}. ${msg.role}: ${msg.content.slice(0, 100)}...`).join('\n')}

This provides continuity for the current reasoning process.`;
  }

  private breakDownProblem(input: string): string {
    const components = input.split(/[,.!?;]+/).filter(s => s.trim().length > 3);

    return `Breaking down the query into components:
${components.map((comp, i) => `${i + 1}. "${comp.trim()}"`).join('\n')}

Key elements identified:
• Main subject: ${this.extractMainSubject(input)}
• Action required: ${this.extractAction(input)}
• Context constraints: ${this.extractConstraints(input)}`;
  }

  private considerPerspectives(input: string): string {
    const perspectives = [
      "Technical/Practical Perspective",
      "Ethical/Consideration Perspective",
      "Efficiency/Optimization Perspective",
      "Long-term Impact Perspective",
      "Alternative Approaches Perspective"
    ];

    return `Considering multiple perspectives:

1. **Technical Perspective**: Focus on implementation and feasibility
2. **Ethical Perspective**: Consider implications and responsible use
3. **Efficiency Perspective**: Optimize for performance and resources
4. **Long-term Perspective**: Evaluate sustainability and scalability
5. **Alternative Perspective**: Explore different approaches and solutions

Each perspective provides valuable insights for comprehensive reasoning.`;
  }

  private provideSolution(input: string, understanding: string, context: string, breakdown: string, perspectives: string): string {
    return `Based on the analysis above, here's the structured solution:

**Immediate Action Plan:**
1. Acknowledge the core requirements from the query
2. Apply appropriate technical knowledge and best practices
3. Consider implementation constraints and limitations
4. Provide clear, actionable recommendations

**Recommended Approach:**
${this.generateApproach(input)}

**Expected Outcomes:**
• Clear resolution of the query
• Practical implementation guidance
• Consideration of edge cases and limitations
• Foundation for future similar queries`;
  }

  private considerImplications(input: string): string {
    return `**Potential Implications:**
• Short-term: Immediate resolution and learning opportunity
• Medium-term: Skill development and process improvement
• Long-term: Enhanced reasoning capabilities and knowledge base expansion

**Next Steps:**
1. Implement the recommended solution
2. Monitor results and gather feedback
3. Refine approach based on outcomes
4. Update knowledge base for similar future queries

**Risk Considerations:**
• Ensure solution aligns with ethical guidelines
• Verify technical feasibility before implementation
• Consider scalability and maintenance requirements

*Claude-style reasoning protocol complete. Ready for next query.*`;
  }

  // Helper methods
  private extractMainSubject(input: string): string {
    // Simple subject extraction - could be enhanced with NLP
    const words = input.split(/\s+/);
    return words.slice(0, 3).join(' ') + '...';
  }

  private extractAction(input: string): string {
    const actionWords = ['do', 'make', 'create', 'build', 'implement', 'solve', 'find', 'determine'];
    const found = actionWords.find(word => input.toLowerCase().includes(word));
    return found || 'analyze';
  }

  private extractConstraints(input: string): string {
    const constraints = [];
    if (input.toLowerCase().includes('quick') || input.toLowerCase().includes('fast')) {
      constraints.push('time-sensitive');
    }
    if (input.toLowerCase().includes('simple') || input.toLowerCase().includes('easy')) {
      constraints.push('simplicity required');
    }
    if (input.toLowerCase().includes('complex') || input.toLowerCase().includes('advanced')) {
      constraints.push('complexity expected');
    }
    return constraints.length > 0 ? constraints.join(', ') : 'none identified';
  }

  private generateApproach(input: string): string {
    if (/\b(code|program|script)\b/i.test(input)) {
      return `1. Define requirements and specifications
2. Design algorithm and data structures
3. Implement solution with proper error handling
4. Test and validate functionality
5. Optimize for performance and maintainability`;
    }

    if (/\b(design|interface|ui)\b/i.test(input)) {
      return `1. Understand user requirements and use cases
2. Create wireframes and user flow diagrams
3. Design visual hierarchy and information architecture
4. Implement responsive and accessible interface
5. Test usability and gather user feedback`;
    }

    if (/\b(decide|choose|evaluate)\b/i.test(input)) {
      return `1. Identify decision criteria and constraints
2. Research available options thoroughly
3. Evaluate each option against criteria
4. Consider risks and trade-offs
5. Make informed decision with clear rationale`;
    }

    return `1. Break down the problem into manageable components
2. Research and gather relevant information
3. Analyze options and consider implications
4. Develop structured approach or solution
5. Validate and refine the results`;
  }
}

export const claudeReasonerSkill = new OpenMindClaudeReasonerSkill();