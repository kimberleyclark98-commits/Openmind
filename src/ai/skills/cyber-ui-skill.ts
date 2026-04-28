import { SkillContext, SkillResponse } from './skill-router';

/**
 * OpenMind Cyber UI Skill
 * Generates A2UI interfaces with cyberpunk styling
 */
export class OpenMindCyberUISkill {
  async execute(context: SkillContext): Promise<SkillResponse> {
    const { userInput } = context;

    // Analyze the UI request
    const uiAnalysis = this.analyzeUIRequest(userInput);

    // Generate A2UI stream
    const a2uiStream = this.generateCyberpunkUI(uiAnalysis);

    return {
      skill: 'openmind-cyber-ui',
      format: 'a2ui',
      content: a2uiStream,
      metadata: {
        confidence: 0.9,
        reasoning: `Generated cyberpunk UI for: ${uiAnalysis.type}`,
        estimatedComplexity: uiAnalysis.complexity
      }
    };
  }

  private analyzeUIRequest(input: string): {
    type: string;
    components: string[];
    complexity: 'simple' | 'medium' | 'complex';
  } {
    const lowerInput = input.toLowerCase();

    // Dashboard requests
    if (/\b(dashboard|control.panel|monitor)\b/i.test(lowerInput)) {
      return {
        type: 'dashboard',
        components: ['card', 'progress', 'button', 'text'],
        complexity: 'complex'
      };
    }

    // Form requests
    if (/\b(form|input|field|submit)\b/i.test(lowerInput)) {
      return {
        type: 'form',
        components: ['input', 'button', 'text'],
        complexity: 'medium'
      };
    }

    // Gallery/Media requests
    if (/\b(gallery|image|media|player)\b/i.test(lowerInput)) {
      return {
        type: 'gallery',
        components: ['card', 'button', 'container'],
        complexity: 'medium'
      };
    }

    // Default UI
    return {
      type: 'interface',
      components: ['card', 'button', 'text'],
      complexity: 'simple'
    };
  }

  private generateCyberpunkUI(analysis: any): string[] {
    const surfaceId = `cyber_ui_${Date.now()}`;
    const stream: string[] = [];

    // Create surface
    stream.push(JSON.stringify({
      createSurface: {
        surfaceId,
        catalogId: "https://a2ui.dev/specification/0.9/standard_catalog_definition.json"
      }
    }));

    // Generate components based on type
    const components = this.buildComponents(surfaceId, analysis);
    stream.push(JSON.stringify({
      updateComponents: {
        surfaceId,
        components
      }
    }));

    return stream;
  }

  private buildComponents(surfaceId: string, analysis: any): any[] {
    const components: any[] = [];

    // Root container with cyberpunk styling
    components.push({
      id: 'root_container',
      componentType: 'Container',
      properties: {
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        className: 'p-6 min-h-[400px] bg-black border border-cyan-500/30 rounded-lg'
      },
      children: ['header', 'content']
    });

    // Header
    components.push({
      id: 'header',
      componentType: 'Text',
      properties: {
        text: `🧠 OpenMind ${analysis.type.charAt(0).toUpperCase() + analysis.type.slice(1)}`,
        className: 'text-2xl font-bold text-center mb-4 text-cyan-400 cyberpunk-neon-glow'
      }
    });

    // Content based on type
    switch (analysis.type) {
      case 'dashboard':
        components.push(
          {
            id: 'content',
            componentType: 'Container',
            properties: {
              display: 'grid',
              gap: '1rem',
              className: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
            },
            children: ['stats_card', 'control_card', 'status_card']
          },
          {
            id: 'stats_card',
            componentType: 'Card',
            properties: {
              title: 'System Stats',
              className: 'cyberpunk-matrix-bg p-4'
            },
            children: ['cpu_progress', 'memory_progress']
          },
          {
            id: 'cpu_progress',
            componentType: 'Progress',
            properties: {
              value: 75,
              className: 'mb-2'
            }
          },
          {
            id: 'memory_progress',
            componentType: 'Progress',
            properties: {
              value: 60,
              className: 'mb-2'
            }
          },
          {
            id: 'control_card',
            componentType: 'Card',
            properties: {
              title: 'Controls',
              className: 'cyberpunk-holographic p-4'
            },
            children: ['activate_btn', 'shutdown_btn']
          },
          {
            id: 'activate_btn',
            componentType: 'Button',
            properties: {
              text: 'Activate Protocol',
              className: 'cyberpunk-hover-glow bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded border border-cyan-400 mr-2',
              onClick: 'activate_protocol'
            }
          },
          {
            id: 'shutdown_btn',
            componentType: 'Button',
            properties: {
              text: 'Shutdown',
              className: 'cyberpunk-hover-glow bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded border border-red-400',
              onClick: 'shutdown_system'
            }
          },
          {
            id: 'status_card',
            componentType: 'Card',
            properties: {
              title: 'Network Status',
              className: 'cyberpunk-matrix-bg p-4'
            },
            children: ['status_text']
          },
          {
            id: 'status_text',
            componentType: 'Text',
            properties: {
              text: '🟢 Online | 🔗 Connected | ⚡ Powered',
              className: 'text-lime-400 cyberpunk-neon-lime'
            }
          }
        );
        break;

      case 'form':
        components.push(
          {
            id: 'content',
            componentType: 'Container',
            properties: {
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              className: 'max-w-md mx-auto'
            },
            children: ['name_input', 'email_input', 'message_input', 'submit_btn']
          },
          {
            id: 'name_input',
            componentType: 'Input',
            properties: {
              type: 'text',
              placeholder: 'Enter your name...',
              className: 'cyberpunk-hover-glow border border-purple-500 bg-black text-purple-300 px-3 py-2 rounded',
              dataBinding: 'name'
            }
          },
          {
            id: 'email_input',
            componentType: 'Input',
            properties: {
              type: 'email',
              placeholder: 'Enter your email...',
              className: 'cyberpunk-hover-glow border border-purple-500 bg-black text-purple-300 px-3 py-2 rounded',
              dataBinding: 'email'
            }
          },
          {
            id: 'message_input',
            componentType: 'Input',
            properties: {
              type: 'text',
              placeholder: 'Enter your message...',
              className: 'cyberpunk-hover-glow border border-purple-500 bg-black text-purple-300 px-3 py-2 rounded',
              dataBinding: 'message'
            }
          },
          {
            id: 'submit_btn',
            componentType: 'Button',
            properties: {
              text: 'Submit Form',
              className: 'cyberpunk-hover-glow bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded border border-cyan-400',
              onClick: 'submit_form'
            }
          }
        );
        break;

      default:
        // Simple interface
        components.push(
          {
            id: 'content',
            componentType: 'Card',
            properties: {
              title: 'OpenMind Interface',
              className: 'cyberpunk-matrix-bg p-6 text-center'
            },
            children: ['welcome_text', 'action_btn']
          },
          {
            id: 'welcome_text',
            componentType: 'Text',
            properties: {
              text: 'Welcome to the cyberpunk realm of OpenMind AI',
              className: 'text-purple-400 mb-4 cyberpunk-neon-purple'
            }
          },
          {
            id: 'action_btn',
            componentType: 'Button',
            properties: {
              text: 'Begin Interaction',
              className: 'cyberpunk-hover-glow bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-3 rounded border border-cyan-400 text-lg font-semibold',
              onClick: 'begin_interaction'
            }
          }
        );
    }

    return components;
  }
}

export const cyberUISkill = new OpenMindCyberUISkill();