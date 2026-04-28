import { SkillContext, SkillResponse } from './skill-router';

/**
 * OpenMind N8N Orchestrator Skill
 * Integrates with n8n for workflow automation through A2UI interfaces
 */
export class OpenMindN8NOrchestratorSkill {
  private n8nConfig = {
    baseUrl: process.env.N8N_BASE_URL || 'https://your-n8n-instance.com',
    apiKey: process.env.N8N_API_KEY || '',
    webhookUrl: process.env.N8N_WEBHOOK_URL || ''
  };

  async execute(context: SkillContext): Promise<SkillResponse> {
    const { userInput } = context;

    // Analyze if this is a workflow automation request
    const workflowRequest = this.analyzeWorkflowRequest(userInput);

    if (!workflowRequest) {
      return {
        skill: 'openmind-n8n-orchestrator',
        format: 'text',
        content: `🧠 *N8N Orchestrator Online*\n\nI can help you automate workflows using n8n. What kind of automation would you like to create?\n\nExamples:\n• Data processing pipelines\n• API integrations\n• Notification systems\n• Content automation\n• Social media workflows`,
        metadata: {
          confidence: 0.7,
          reasoning: 'General workflow inquiry',
          estimatedComplexity: 'simple'
        }
      };
    }

    // Create A2UI interface for workflow configuration
    const workflowUI = await this.createWorkflowInterface(workflowRequest);

    return {
      skill: 'openmind-n8n-orchestrator',
      format: 'a2ui',
      content: workflowUI,
      metadata: {
        confidence: 0.9,
        reasoning: `Created workflow interface for: ${workflowRequest.type}`,
        estimatedComplexity: 'complex'
      }
    };
  }

  private analyzeWorkflowRequest(input: string): {
    type: string;
    triggers: string[];
    actions: string[];
  } | null {
    const lowerInput = input.toLowerCase();

    // Email automation
    if (/\b(email|mail|newsletter|notification)\b/i.test(lowerInput)) {
      return {
        type: 'email_automation',
        triggers: ['schedule', 'event', 'form_submission'],
        actions: ['send_email', 'template_render', 'list_management']
      };
    }

    // Social media automation
    if (/\b(social|twitter|facebook|instagram|linkedin)\b/i.test(lowerInput)) {
      return {
        type: 'social_media',
        triggers: ['schedule', 'content_ready', 'engagement'],
        actions: ['post_content', 'schedule_posts', 'engagement_tracking']
      };
    }

    // Data processing
    if (/\b(data|process|transform|sync|backup)\b/i.test(lowerInput)) {
      return {
        type: 'data_processing',
        triggers: ['file_upload', 'api_call', 'schedule'],
        actions: ['transform_data', 'sync_systems', 'generate_reports']
      };
    }

    // API integration
    if (/\b(api|webhook|integration|connect)\b/i.test(lowerInput)) {
      return {
        type: 'api_integration',
        triggers: ['webhook', 'schedule', 'event'],
        actions: ['api_call', 'data_sync', 'notification']
      };
    }

    // Content automation
    if (/\b(content|blog|article|generate|create)\b/i.test(lowerInput)) {
      return {
        type: 'content_automation',
        triggers: ['schedule', 'keyword', 'topic'],
        actions: ['generate_content', 'publish', 'seo_optimize']
      };
    }

    return null;
  }

  private async createWorkflowInterface(workflowRequest: any): Promise<string[]> {
    const surfaceId = `n8n_workflow_${Date.now()}`;
    const stream: string[] = [];

    // Create surface
    stream.push(JSON.stringify({
      createSurface: {
        surfaceId,
        catalogId: "https://a2ui.dev/specification/0.9/standard_catalog_definition.json"
      }
    }));

    // Create workflow configuration interface
    const components = this.buildWorkflowComponents(surfaceId, workflowRequest);
    stream.push(JSON.stringify({
      updateComponents: {
        surfaceId,
        components
      }
    }));

    return stream;
  }

  private buildWorkflowComponents(surfaceId: string, workflowRequest: any): any[] {
    const components: any[] = [];

    // Root container
    components.push({
      id: 'root_container',
      componentType: 'Container',
      properties: {
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
        className: 'p-6 min-h-[600px] bg-black border border-cyan-500/30 rounded-lg'
      },
      children: ['header', 'workflow_type', 'triggers_section', 'actions_section', 'config_section', 'execute_btn']
    });

    // Header
    components.push({
      id: 'header',
      componentType: 'Text',
      properties: {
        text: `⚙️ N8N ${workflowRequest.type.replace('_', ' ').toUpperCase()} Orchestrator`,
        className: 'text-2xl font-bold text-center mb-4 text-cyan-400 cyberpunk-neon-glow'
      }
    });

    // Workflow type display
    components.push({
      id: 'workflow_type',
      componentType: 'Card',
      properties: {
        title: 'Workflow Type',
        className: 'cyberpunk-matrix-bg p-4'
      },
      children: ['type_description']
    });

    components.push({
      id: 'type_description',
      componentType: 'Text',
      properties: {
        text: `Configuring ${workflowRequest.type.replace('_', ' ')} automation workflow`,
        className: 'text-purple-400 cyberpunk-neon-purple'
      }
    });

    // Triggers section
    components.push({
      id: 'triggers_section',
      componentType: 'Card',
      properties: {
        title: 'Workflow Triggers',
        className: 'cyberpunk-holographic p-4'
      },
      children: ['triggers_list']
    });

    components.push({
      id: 'triggers_list',
      componentType: 'Container',
      properties: {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem'
      },
      children: workflowRequest.triggers.map((trigger: string, index: number) => `trigger_${index}`)
    });

    // Add trigger items
    workflowRequest.triggers.forEach((trigger: string, index: number) => {
      components.push({
        id: `trigger_${index}`,
        componentType: 'Text',
        properties: {
          text: `🔥 ${trigger.replace('_', ' ')}`,
          className: 'text-orange-400 cyberpunk-neon-orange'
        }
      });
    });

    // Actions section
    components.push({
      id: 'actions_section',
      componentType: 'Card',
      properties: {
        title: 'Workflow Actions',
        className: 'cyberpunk-matrix-bg p-4'
      },
      children: ['actions_list']
    });

    components.push({
      id: 'actions_list',
      componentType: 'Container',
      properties: {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem'
      },
      children: workflowRequest.actions.map((action: string, index: number) => `action_${index}`)
    });

    // Add action items
    workflowRequest.actions.forEach((action: string, index: number) => {
      components.push({
        id: `action_${index}`,
        componentType: 'Text',
        properties: {
          text: `⚡ ${action.replace('_', ' ')}`,
          className: 'text-lime-400 cyberpunk-neon-lime'
        }
      });
    });

    // Configuration section
    components.push({
      id: 'config_section',
      componentType: 'Card',
      properties: {
        title: 'Configuration',
        className: 'cyberpunk-holographic p-4'
      },
      children: ['webhook_url', 'api_key_input', 'schedule_input']
    });

    components.push({
      id: 'webhook_url',
      componentType: 'Input',
      properties: {
        type: 'text',
        placeholder: 'Webhook URL (optional)',
        className: 'cyberpunk-hover-glow border border-purple-500 bg-black text-purple-300 px-3 py-2 rounded mb-3',
        dataBinding: 'webhook_url'
      }
    });

    components.push({
      id: 'api_key_input',
      componentType: 'Input',
      properties: {
        type: 'password',
        placeholder: 'API Key (optional)',
        className: 'cyberpunk-hover-glow border border-purple-500 bg-black text-purple-300 px-3 py-2 rounded mb-3',
        dataBinding: 'api_key'
      }
    });

    components.push({
      id: 'schedule_input',
      componentType: 'Input',
      properties: {
        type: 'text',
        placeholder: 'Schedule (cron format, optional)',
        className: 'cyberpunk-hover-glow border border-purple-500 bg-black text-purple-300 px-3 py-2 rounded',
        dataBinding: 'schedule'
      }
    });

    // Execute button
    components.push({
      id: 'execute_btn',
      componentType: 'Button',
      properties: {
        text: '🚀 Deploy N8N Workflow',
        className: 'cyberpunk-hover-glow bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-3 rounded border border-cyan-400 mx-auto text-lg font-semibold',
        onClick: 'deploy_n8n_workflow'
      }
    });

    return components;
  }

  /**
   * Execute a workflow through n8n
   */
  async executeWorkflow(workflowId: string, parameters: any): Promise<any> {
    try {
      // This would make actual API calls to n8n
      // For now, return a mock response
      console.log('Executing N8N workflow:', workflowId, parameters);

      return {
        success: true,
        workflowId,
        executionId: `exec_${Date.now()}`,
        status: 'running',
        message: 'Workflow deployed successfully'
      };
    } catch (error) {
      console.error('N8N workflow execution failed:', error);
      throw error;
    }
  }

  /**
   * Get available n8n workflows
   */
  async getAvailableWorkflows(): Promise<any[]> {
    try {
      // This would fetch from n8n API
      // Mock data for now
      return [
        {
          id: 'email_campaign',
          name: 'Email Campaign Automation',
          description: 'Automated email marketing campaigns'
        },
        {
          id: 'social_scheduler',
          name: 'Social Media Scheduler',
          description: 'Schedule and post to social media platforms'
        },
        {
          id: 'data_sync',
          name: 'Data Synchronization',
          description: 'Sync data between different systems'
        }
      ];
    } catch (error) {
      console.error('Failed to fetch n8n workflows:', error);
      return [];
    }
  }
}

export const n8nOrchestratorSkill = new OpenMindN8NOrchestratorSkill();