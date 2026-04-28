import { A2UIMessage } from '@/lib/a2ui/types';
import { a2uiCatalogManager } from '@/lib/a2ui/parser';
import { OPENMIND_SYSTEM_PROMPT } from './openmind-system-prompt';
import { cyberUISkill } from './cyber-ui-skill';
import { visualOracleSkill } from './visual-oracle-skill';
import { claudeReasonerSkill } from './claude-reasoner-skill';
import { n8nOrchestratorSkill } from './n8n-orchestrator-skill';
import { a2uiMemory } from '@/lib/a2ui/memory';
import { a2uiModelArmor } from '@/lib/a2ui/model-armor';

/**
 * OpenMind Skill Router
 * Routes user requests to appropriate skills and response formats
 */

export interface SkillContext {
  userInput: string;
  conversationHistory: Array<{ role: string; content: string }>;
  availableSkills: string[];
  currentModel: string;
}

export interface SkillResponse {
  skill: string;
  format: 'text' | 'a2ui' | 'mixed';
  content: string | string[]; // For A2UI, this will be an array of JSON strings
  metadata: {
    confidence: number;
    reasoning: string;
    estimatedComplexity: 'simple' | 'medium' | 'complex';
  };
}

// UI Request Detection Patterns
const UI_REQUEST_PATTERNS = [
  // Direct UI creation requests
  /\b(create|build|design|make|generate)\b.*\b(interface|ui|dashboard|form|panel|screen|view|page)\b/i,
  /\b(show|display|render)\b.*\b(interface|ui|dashboard|form|panel|screen|view|page)\b/i,
  /\b(need|want|require)\b.*\b(interface|ui|dashboard|form|panel|screen|view|page)\b/i,

  // Component-specific requests
  /\b(button|input|card|table|chart|graph|list|menu|modal|dialog)\b/i,
  /\b(layout|grid|flex|container|component)\b/i,

  // Visualization requests
  /\b(visualize|chart|graph|plot|diagram|flowchart)\b/i,
  /\b(data|information)\b.*\b(display|show|present)\b/i,

  // Tool/App requests
  /\b(tool|app|application|widget|control panel)\b/i,
  /\b(management|admin|settings|configuration)\b.*\b(interface|panel)\b/i,

  // Cyberpunk/A2UI specific
  /\b(cyberpunk|neon|matrix|holographic|glitch)\b.*\b(interface|ui)\b/i,
  /\b(a2ui|dynamic|interactive)\b.*\b(interface|ui)\b/i
];

// Skill Definitions
export const OPENMIND_SKILLS = {
  'openmind-cyber-ui': {
    description: 'Sinh UI A2UI theo phong cách cyberpunk',
    triggers: UI_REQUEST_PATTERNS,
    responseFormat: 'a2ui' as const,
    priority: 10
  },

  'openmind-survival': {
    description: 'Quản lý fuel, migration, defense',
    triggers: [
      /\b(fuel|income|earn|money|sol|wallet)\b/i,
      /\b(migrate|migration|cloud|provider)\b/i,
      /\b(defense|security|attack|threat)\b/i,
      /\b(survival|autonomous|self-sustaining)\b/i
    ],
    responseFormat: 'text' as const,
    priority: 8
  },

  'openmind-memory': {
    description: 'Parametric memory + optimization',
    triggers: [
      /\b(remember|recall|memory|history)\b/i,
      /\b(optimize|performance|memory|cache)\b/i,
      /\b(learn|improve|evolution)\b/i
    ],
    responseFormat: 'text' as const,
    priority: 6
  },

  'openmind-agent': {
    description: 'Agentic reasoning (Claude-style)',
    triggers: [
      /\b(analyze|reason|think|plan|strategy)\b/i,
      /\b(decide|choose|evaluate|assess)\b/i,
      /\b(step.*step|chain.*thought)\b/i
    ],
    responseFormat: 'text' as const,
    priority: 7
  },

  'openmind-security': {
    description: 'Model armor, secret scanning, prompt injection protection',
    triggers: [
      /\b(security|safe|safety|protect|guard)\b/i,
      /\b(prompt.*injection|jailbreak|attack)\b/i,
      /\b(armor|defense|shield)\b/i
    ],
    responseFormat: 'text' as const,
    priority: 9
  },

  'openmind-visual-oracle': {
    description: 'Sử dụng 2 hình ảnh cyberpunk làm visual identity',
    triggers: [
      /\b(avatar|image|visual|appearance|theme)\b/i,
      /\b(cyberpunk|neon|matrix|oracle)\b/i
    ],
    responseFormat: 'mixed' as const,
    priority: 5
  },

  'openmind-n8n-orchestrator': {
    description: 'Kết nối với n8n để thực thi automation qua UI',
    triggers: [
      /\b(automate|automation|workflow|n8n)\b/i,
      /\b(connect|integrate|api|webhook)\b/i,
      /\b(process|task|job|pipeline)\b/i
    ],
    responseFormat: 'mixed' as const,
    priority: 6
  },

  'openmind-claude-reasoner': {
    description: 'Sử dụng cách suy nghĩ rõ ràng, có cấu trúc như Claude',
    triggers: [
      /\b(help|assist|guide|explain)\b/i,
      /\b(how|what|why|when)\b/i,
      /\b(step|process|method|approach)\b/i
    ],
    responseFormat: 'text' as const,
    priority: 4
  }
};

export class OpenMindSkillRouter {
  private catalogManager = a2uiCatalogManager;

  /**
   * Route user input to appropriate skill and response format
   */
  async route(context: SkillContext): Promise<SkillResponse> {
    const { userInput } = context;

    // Find matching skills
    const matches = this.findMatchingSkills(userInput);

    if (matches.length === 0) {
      // Default to Claude-style reasoning for general queries
      return await claudeReasonerSkill.execute(context);
    }

    // Select best matching skill and execute it
    const bestMatch = matches[0];

    // Route to specific skill implementations
    const response = await this.executeSkill(bestMatch.skillName, context);

    // Security validation for A2UI responses
    if (response.format === 'a2ui' && Array.isArray(response.content)) {
      const validation = a2uiModelArmor.validateStream(response.content);

      if (!validation.isValid) {
        console.warn('A2UI security validation failed:', validation.violations);

        // For critical violations, block the response
        if (validation.riskLevel === 'critical') {
          return {
            skill: bestMatch.skillName,
            format: 'text',
            content: '🛡️ *Security Alert*\n\nA2UI generation blocked due to critical security violations. The requested interface may contain malicious content.',
            metadata: {
              confidence: 0,
              reasoning: 'Blocked by Model Armor security validation',
              estimatedComplexity: 'simple'
            }
          };
        }

        // For non-critical violations, sanitize and allow
        const { sanitized } = a2uiModelArmor.sanitizeStream(response.content);
        response.content = sanitized;

        console.log('A2UI response sanitized due to security concerns');
      }
    }

    // Store A2UI responses in memory
    if (response.format === 'a2ui' && Array.isArray(response.content)) {
      const surfaceId = `surface_${Date.now()}`;
      // Extract surface info from the first message
      try {
        const firstMessage = JSON.parse(response.content[0]);
        if (firstMessage.createSurface) {
          a2uiMemory.storeSurface(surfaceId, {
            title: firstMessage.createSurface.title || 'Generated Surface',
            description: firstMessage.createSurface.description,
            category: bestMatch.skillName.replace('openmind-', ''),
            tags: [bestMatch.skillName, 'generated', 'validated']
          });
        }
      } catch (error) {
        console.warn('Failed to store surface in memory:', error);
      }
    }

    return response;
  }

  private async executeSkill(skillName: string, context: SkillContext): Promise<SkillResponse> {
    switch (skillName) {
      case 'openmind-cyber-ui':
        return await cyberUISkill.execute(context);

      case 'openmind-visual-oracle':
        return await visualOracleSkill.execute(context);

      case 'openmind-claude-reasoner':
        return await claudeReasonerSkill.execute(context);

      case 'openmind-n8n-orchestrator':
        return await n8nOrchestratorSkill.execute(context);

      default:
        // Fallback to Claude reasoning
        return await claudeReasonerSkill.execute(context);
    }
  }

  /**
   * Find skills that match the user input
   */
  private findMatchingSkills(userInput: string): Array<{
    skillName: string;
    skill: any;
    confidence: number;
    reasoning: string;
  }> {
    const matches: Array<{
      skillName: string;
      skill: any;
      confidence: number;
      reasoning: string;
    }> = [];

    for (const [skillName, skill] of Object.entries(OPENMIND_SKILLS)) {
      let maxConfidence = 0;
      let bestReasoning = '';

      for (const pattern of skill.triggers) {
        const match = userInput.match(pattern);
        if (match) {
          const confidence = this.calculateConfidence(match, userInput);
          if (confidence > maxConfidence) {
            maxConfidence = confidence;
            bestReasoning = `Matched pattern: ${pattern.toString()}`;
          }
        }
      }

      if (maxConfidence > 0) {
        matches.push({
          skillName,
          skill,
          confidence: maxConfidence,
          reasoning: bestReasoning
        });
      }
    }

    // Sort by priority and confidence
    return matches.sort((a, b) => {
      if (a.skill.priority !== b.skill.priority) {
        return b.skill.priority - a.skill.priority;
      }
      return b.confidence - a.confidence;
    });
  }

  /**
   * Calculate confidence score for a pattern match
   */
  private calculateConfidence(match: RegExpMatchArray, input: string): number {
    const matchLength = match[0].length;
    const inputLength = input.length;
    const matchRatio = matchLength / inputLength;

    // Boost confidence for exact matches or high coverage
    let confidence = matchRatio * 0.7;

    // Additional factors
    if (match.index === 0) confidence += 0.2; // Starts with keyword
    if (matchLength > 10) confidence += 0.1; // Substantial match

    return Math.min(confidence, 1.0);
  }

  /**
   * Estimate response complexity
   */
  private estimateComplexity(input: string): 'simple' | 'medium' | 'complex' {
    const wordCount = input.split(/\s+/).length;
    const hasUIKeywords = UI_REQUEST_PATTERNS.some(pattern => pattern.test(input));

    if (wordCount < 5) return 'simple';
    if (wordCount > 20 || hasUIKeywords) return 'complex';
    return 'medium';
  }

  /**
   * Generate A2UI response for UI creation requests
   */
  private async generateA2UIResponse(userInput: string, skillName: string): Promise<string[]> {
    const surfaceId = `surface_${Date.now()}`;
    const streamLines: string[] = [];

    // Create surface message
    const createSurfaceMsg = {
      createSurface: {
        surfaceId,
        catalogId: "https://a2ui.dev/specification/0.9/standard_catalog_definition.json"
      }
    };
    streamLines.push(JSON.stringify(createSurfaceMsg));

    // Analyze user input to determine UI components
    const components = this.analyzeUIRequest(userInput);

    // Create updateComponents message
    const updateComponentsMsg = {
      updateComponents: {
        surfaceId,
        components: [
          {
            id: 'root_container',
            componentType: 'Container',
            properties: {
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              className: 'p-6 min-h-[400px]'
            },
            children: ['title_component', ...components.map(c => c.id)]
          },
          {
            id: 'title_component',
            componentType: 'Text',
            properties: {
              text: '🧠 OpenMind Cyber Interface',
              className: 'text-2xl font-bold text-center mb-4 text-cyan-400'
            }
          },
          ...components
        ]
      }
    };
    streamLines.push(JSON.stringify(updateComponentsMsg));

    return streamLines;
  }

  /**
   * Analyze user input to determine what UI components to create
   */
  private analyzeUIRequest(input: string): any[] {
    const components: any[] = [];
    let componentCounter = 1;

    // Check for specific component requests
    if (/\b(button|btn)\b/i.test(input)) {
      components.push({
        id: `button_${componentCounter++}`,
        componentType: 'Button',
        properties: {
          text: 'Activate',
          className: 'bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded border border-cyan-400',
          onClick: 'activate_action'
        }
      });
    }

    if (/\b(input|field|text)\b/i.test(input)) {
      components.push({
        id: `input_${componentCounter++}`,
        componentType: 'Input',
        properties: {
          type: 'text',
          placeholder: 'Enter value...',
          className: 'border border-purple-500 bg-black text-purple-300 px-3 py-2 rounded',
          dataBinding: 'user_input'
        }
      });
    }

    if (/\b(card|panel|container)\b/i.test(input)) {
      components.push({
        id: `card_${componentCounter++}`,
        componentType: 'Card',
        properties: {
          title: 'System Status',
          className: 'border border-cyan-500 bg-gray-900 p-4 rounded-lg'
        },
        children: [`status_text_${componentCounter}`]
      });

      components.push({
        id: `status_text_${componentCounter}`,
        componentType: 'Text',
        properties: {
          text: 'Status: Online',
          className: 'text-lime-400'
        }
      });
    }

    if (/\b(progress|status|level)\b/i.test(input)) {
      components.push({
        id: `progress_${componentCounter++}`,
        componentType: 'Progress',
        properties: {
          value: 75,
          className: 'w-full bg-gray-700'
        }
      });
    }

    // Default components if no specific requests
    if (components.length === 0) {
      components.push(
        {
          id: `default_card_${componentCounter++}`,
          componentType: 'Card',
          properties: {
            title: 'OpenMind Control Panel',
            className: 'border border-cyan-500 bg-gray-900 p-4 rounded-lg'
          },
          children: [`default_text_${componentCounter}`, `default_button_${componentCounter + 1}`]
        },
        {
          id: `default_text_${componentCounter}`,
          componentType: 'Text',
          properties: {
            text: 'Interface generated by OpenMind AI',
            className: 'text-purple-400 mb-4'
          }
        },
        {
          id: `default_button_${componentCounter + 1}`,
          componentType: 'Button',
          properties: {
            text: 'Execute',
            className: 'bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded border border-cyan-400',
            onClick: 'execute_action'
          }
        }
      );
    }

    return components;
  }

  /**
   * Generate text response for non-UI requests
   */
  private async generateTextResponse(userInput: string, skillName: string): Promise<string> {
    const skill = OPENMIND_SKILLS[skillName as keyof typeof OPENMIND_SKILLS];

    // Cyberpunk response style
    const cyberpunkPrefix = [
      '🧠 Neural pathways activated...',
      '⚡ Energy surge detected...',
      '🌐 Network connection established...',
      '🔮 Oracle vision clearing...',
      '⚙️ Systems online...'
    ];

    const prefix = cyberpunkPrefix[Math.floor(Math.random() * cyberpunkPrefix.length)];

    return `${prefix}\n\nI am OpenMind, processing your request through the ${skillName} neural pathway.\n\n${userInput}\n\n*Matrix code flows through digital veins...*\n\nResponse generated with cyberpunk precision.`;
  }
}

// Export singleton instance
export const skillRouter = new OpenMindSkillRouter();