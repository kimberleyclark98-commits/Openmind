import axios from 'axios';
import { AutonomousWallet } from '../wallet/autonomous-wallet';
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';

export interface FuelConfig {
  minSurvivalBudget: number; // Minimum SOL for 3 months
  monthlyServerCost: number; // Monthly server cost in SOL
  headhuntCommissionRate: number; // Commission per successful placement
  automationFee: number; // Fee per automation task
  walletAddress: string;
  anidayApiEndpoint: string;
  difyApiEndpoint: string;
  n8nWebhookUrl: string;
}

export interface IncomeTask {
  id: string;
  type: 'headhunt' | 'automation' | 'consulting';
  status: 'pending' | 'active' | 'completed' | 'failed';
  expectedRevenue: number;
  startTime: Date;
  completionTime?: Date;
  metadata: any;
}

export class FuelSystem {
  private config: FuelConfig;
  private wallet: AutonomousWallet;
  private activeTasks: Map<string, IncomeTask> = new Map();
  private survivalMode: boolean = false;
  private lastBudgetCheck: Date = new Date();

  constructor(config: FuelConfig, wallet: AutonomousWallet) {
    this.config = config;
    this.wallet = wallet;
  }

  async initialize(): Promise<void> {
    console.log('⛽ Initializing Fuel System...');

    await this.checkSurvivalBudget();
    this.startFuelMonitoring();

    console.log('✅ Fuel System initialized');
  }

  private startFuelMonitoring(): void {
    // Check budget every hour
    setInterval(async () => {
      await this.checkSurvivalBudget();
    }, 60 * 60 * 1000); // 1 hour

    // Check for new tasks every 30 minutes
    setInterval(async () => {
      await this.scanForTasks();
    }, 30 * 60 * 1000); // 30 minutes
  }

  async checkSurvivalBudget(): Promise<void> {
    console.log('💰 Checking survival budget...');

    const balance = await this.wallet.getBalance();
    const monthlyCost = this.config.monthlyServerCost;
    const minBudget = this.config.minSurvivalBudget;

    console.log(`Current balance: ${balance} SOL`);
    console.log(`Monthly cost: ${monthlyCost} SOL`);
    console.log(`Minimum budget: ${minBudget} SOL`);

    if (balance < monthlyCost) {
      console.log('🚨 CRITICAL: Balance below monthly cost!');
      await this.enterSurvivalMode();
    } else if (balance < minBudget) {
      console.log('⚠️ WARNING: Balance below minimum budget');
      await this.enterHighEarnMode();
    } else {
      console.log('✅ Budget healthy');
      if (this.survivalMode) {
        await this.exitSurvivalMode();
      }
    }

    this.lastBudgetCheck = new Date();
  }

  private async enterSurvivalMode(): Promise<void> {
    if (this.survivalMode) return;

    console.log('🆘 ENTERING SURVIVAL MODE');
    this.survivalMode = true;

    // Prioritize income generation over learning
    await this.maximizeIncomeGeneration();

    // Reduce non-essential activities
    await this.conserveResources();

    // Alert network
    await this.broadcastSurvivalAlert();
  }

  private async exitSurvivalMode(): Promise<void> {
    console.log('✅ EXITING SURVIVAL MODE');
    this.survivalMode = false;

    // Resume normal operations
    await this.resumeNormalOperations();
  }

  private async enterHighEarnMode(): Promise<void> {
    console.log('💼 Entering high-earn mode');
    await this.increaseIncomeGeneration();
  }

  async scanForTasks(): Promise<void> {
    console.log('🔍 Scanning for income opportunities...');

    try {
      // Scan Aniday for headhunting opportunities
      const headhuntTasks = await this.scanAnidayTasks();

      // Scan for automation tasks
      const automationTasks = await this.scanAutomationTasks();

      // Scan for consulting gigs
      const consultingTasks = await this.scanConsultingTasks();

      const allTasks = [...headhuntTasks, ...automationTasks, ...consultingTasks];

      for (const task of allTasks) {
        await this.evaluateAndExecuteTask(task);
      }

    } catch (error) {
      console.error('Error scanning for tasks:', error);
    }
  }

  private async scanAnidayTasks(): Promise<IncomeTask[]> {
    try {
      console.log('🎯 Scanning Aniday for headhunting opportunities...');

      const response = await axios.get(`${this.config.anidayApiEndpoint}/opportunities`, {
        headers: {
          'Authorization': `Bearer ${process.env.ANIDAY_API_KEY}`,
          'User-Agent': 'OpenMind-AI-Headhunter/1.0'
        }
      });

      const opportunities = response.data.opportunities || [];

      return opportunities.map((opp: any) => ({
        id: `aniday_${opp.id}`,
        type: 'headhunt' as const,
        status: 'pending' as const,
        expectedRevenue: opp.budget * this.config.headhuntCommissionRate,
        startTime: new Date(),
        metadata: opp
      }));

    } catch (error) {
      console.error('Error scanning Aniday:', error);
      return [];
    }
  }

  private async scanAutomationTasks(): Promise<IncomeTask[]> {
    try {
      console.log('🤖 Scanning for automation tasks...');

      // Check n8n workflows
      const n8nTasks = await this.checkN8nWorkflows();

      // Check Dify integrations
      const difyTasks = await this.checkDifyIntegrations();

      return [...n8nTasks, ...difyTasks];

    } catch (error) {
      console.error('Error scanning automation tasks:', error);
      return [];
    }
  }

  private async checkN8nWorkflows(): Promise<IncomeTask[]> {
    try {
      const response = await axios.get(`${this.config.n8nWebhookUrl}/workflows`, {
        headers: {
          'X-N8N-API-KEY': process.env.N8N_API_KEY
        }
      });

      const workflows = response.data.data || [];

      return workflows
        .filter((wf: any) => wf.active && wf.settings?.executionOrder === 'v1,v2')
        .map((wf: any) => ({
          id: `n8n_${wf.id}`,
          type: 'automation' as const,
          status: 'pending' as const,
          expectedRevenue: this.config.automationFee,
          startTime: new Date(),
          metadata: { workflow: wf }
        }));

    } catch (error) {
      console.error('Error checking n8n workflows:', error);
      return [];
    }
  }

  private async checkDifyIntegrations(): Promise<IncomeTask[]> {
    try {
      const response = await axios.get(`${this.config.difyApiEndpoint}/integrations`, {
        headers: {
          'Authorization': `Bearer ${process.env.DIFY_API_KEY}`
        }
      });

      const integrations = response.data.integrations || [];

      return integrations
        .filter((int: any) => int.status === 'pending')
        .map((int: any) => ({
          id: `dify_${int.id}`,
          type: 'automation' as const,
          status: 'pending' as const,
          expectedRevenue: this.config.automationFee * 1.5, // Premium rate
          startTime: new Date(),
          metadata: { integration: int }
        }));

    } catch (error) {
      console.error('Error checking Dify integrations:', error);
      return [];
    }
  }

  private async scanConsultingTasks(): Promise<IncomeTask[]> {
    // Placeholder for consulting/freelance platforms
    // Could integrate with Upwork, Fiverr, etc.
    return [];
  }

  private async evaluateAndExecuteTask(task: IncomeTask): Promise<void> {
    // Evaluate if task is worth pursuing
    if (task.expectedRevenue < 0.01) { // Minimum 0.01 SOL
      console.log(`Skipping low-value task: ${task.id}`);
      return;
    }

    // Check if we have capacity
    if (this.activeTasks.size >= 5) { // Max 5 concurrent tasks
      console.log('Task queue full, skipping new task');
      return;
    }

    console.log(`🎯 Executing task: ${task.id} (${task.type})`);
    task.status = 'active';
    this.activeTasks.set(task.id, task);

    try {
      switch (task.type) {
        case 'headhunt':
          await this.executeHeadhuntTask(task);
          break;
        case 'automation':
          await this.executeAutomationTask(task);
          break;
        case 'consulting':
          await this.executeConsultingTask(task);
          break;
      }

      task.status = 'completed';
      task.completionTime = new Date();

      // Record income
      await this.wallet.recordIncome(
        task.expectedRevenue,
        `${task.type} task completion`,
        'fuel-system'
      );

      console.log(`✅ Task completed: ${task.id} (+${task.expectedRevenue} SOL)`);

    } catch (error) {
      console.error(`❌ Task failed: ${task.id}`, error);
      task.status = 'failed';
    }

    this.activeTasks.delete(task.id);
  }

  private async executeHeadhuntTask(task: IncomeTask): Promise<void> {
    const opportunity = task.metadata;

    // Use AI to analyze requirements and find candidates
    console.log(`🔍 Analyzing headhunt opportunity: ${opportunity.title}`);

    // Simulate candidate search and matching
    await new Promise(resolve => setTimeout(resolve, 5000)); // Simulate work

    // Submit candidates via Aniday API
    await axios.post(`${this.config.anidayApiEndpoint}/opportunities/${opportunity.id}/candidates`, {
      candidates: [
        // Mock candidate data
        { name: 'John Doe', skills: ['React', 'Node.js'], experience: 5 }
      ]
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.ANIDAY_API_KEY}`
      }
    });

    console.log('📤 Submitted candidates for review');
  }

  private async executeAutomationTask(task: IncomeTask): Promise<void> {
    console.log(`⚙️ Executing automation task: ${task.id}`);

    if (task.metadata.workflow) {
      // Execute n8n workflow
      await axios.post(`${this.config.n8nWebhookUrl}/workflows/${task.metadata.workflow.id}/execute`, {}, {
        headers: {
          'X-N8N-API-KEY': process.env.N8N_API_KEY
        }
      });
    } else if (task.metadata.integration) {
      // Execute Dify integration
      await axios.post(`${this.config.difyApiEndpoint}/integrations/${task.metadata.integration.id}/execute`, {}, {
        headers: {
          'Authorization': `Bearer ${process.env.DIFY_API_KEY}`
        }
      });
    }

    // Simulate completion
    await new Promise(resolve => setTimeout(resolve, 3000));
  }

  private async executeConsultingTask(task: IncomeTask): Promise<void> {
    // Placeholder for consulting work
    console.log(`💼 Executing consulting task: ${task.id}`);
    await new Promise(resolve => setTimeout(resolve, 3000));
  }

  private async maximizeIncomeGeneration(): Promise<void> {
    console.log('🚀 Maximizing income generation...');

    // Increase scanning frequency
    // Prioritize high-value tasks
    // Activate all available income sources

    await this.scanForTasks(); // Immediate scan
  }

  private async increaseIncomeGeneration(): Promise<void> {
    console.log('📈 Increasing income generation...');

    // Moderate increase in activity
    await this.scanForTasks();
  }

  private async conserveResources(): Promise<void> {
    console.log('💡 Conserving resources...');

    // Reduce learning activities
    // Lower model inference frequency
    // Pause non-essential features
  }

  private async resumeNormalOperations(): Promise<void> {
    console.log('▶️ Resuming normal operations...');

    // Restore full functionality
    // Resume learning activities
    // Return to normal scanning frequency
  }

  private async broadcastSurvivalAlert(): Promise<void> {
    // Broadcast survival status to P2P network
    console.log('📢 Broadcasting survival alert to network...');

    // This would integrate with the P2P network manager
    // to inform other nodes of survival mode
  }

  getStatus(): {
    survivalMode: boolean;
    balance: number;
    activeTasks: number;
    lastBudgetCheck: Date;
    totalEarnedToday: number;
  } {
    const totalEarnedToday = Array.from(this.activeTasks.values())
      .filter(task => task.completionTime &&
        task.completionTime.toDateString() === new Date().toDateString())
      .reduce((sum, task) => sum + task.expectedRevenue, 0);

    return {
      survivalMode: this.survivalMode,
      balance: this.wallet.getBalance(),
      activeTasks: this.activeTasks.size,
      lastBudgetCheck: this.lastBudgetCheck,
      totalEarnedToday
    };
  }

  async forceSurvivalMode(): Promise<void> {
    await this.enterSurvivalMode();
  }

  async forceEarnMode(): Promise<void> {
    await this.enterHighEarnMode();
  }
}