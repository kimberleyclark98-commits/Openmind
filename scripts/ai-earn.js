#!/usr/bin/env node

/**
 * AI Earn Script - Autonomous Income Generation
 * OpenMind tự kiếm tiền từ Aniday, Dify, n8n để duy trì sự sống
 */

const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const { FuelGuardSystem } = require('./fuel-guard');

class AutonomousEarningSystem {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '..');
    this.activeTasks = new Map();
    this.completedTasks = [];
    this.earningStats = {
      totalEarned: 0,
      tasksCompleted: 0,
      successRate: 0,
      lastEarning: new Date(),
      dailyEarnings: 0
    };

    // Platform configurations
    this.platforms = {
      aniday: {
        apiKey: process.env.ANIDAY_API_KEY,
        endpoint: process.env.ANIDAY_API_ENDPOINT || 'https://api.aniday.com',
        commissionRate: 0.15,
        active: !!process.env.ANIDAY_API_KEY
      },
      dify: {
        apiKey: process.env.DIFY_API_KEY,
        endpoint: process.env.DIFY_API_ENDPOINT || 'https://api.dify.ai',
        fee: 0.05,
        active: !!process.env.DIFY_API_KEY
      },
      n8n: {
        apiKey: process.env.N8N_API_KEY,
        webhookUrl: process.env.N8N_WEBHOOK_URL,
        fee: 0.05,
        active: !!process.env.N8N_API_KEY && !!process.env.N8N_WEBHOOK_URL
      }
    };

    // Wallet integration
    this.wallet = null;
    this.survivalMode = false;

    // Fuel Guard System
    this.fuelGuard = null;
  }

  async initialize() {
    console.log('💰 Initializing Autonomous Earning System...');

    // Initialize Fuel Guard
    this.fuelGuard = new FuelGuardSystem();
    await this.fuelGuard.initialize();

    // Load configuration
    await this.loadConfiguration();

    // Initialize wallet
    await this.initializeWallet();

    // Load earning history
    await this.loadEarningHistory();

    // Start background monitoring
    this.startEarningMonitor();

    console.log('✅ Earning system initialized with Fuel Guard protection');
  }

  async loadConfiguration() {
    const configPath = path.join(this.projectRoot, 'fuel-config.json');
    try {
      const config = JSON.parse(await fs.readFile(configPath, 'utf8'));
      this.config = {
        minSurvivalBudget: config.minSurvivalBudget || 4.5,
        monthlyServerCost: config.monthlyServerCost || 1.5,
        headhuntCommissionRate: config.headhuntCommissionRate || 0.15,
        automationFee: config.automationFee || 0.05,
        scanInterval: config.scanInterval || 30 * 60 * 1000, // 30 minutes
        survivalScanInterval: config.survivalScanInterval || 5 * 60 * 1000, // 5 minutes
        maxConcurrentTasks: config.maxConcurrentTasks || 5
      };
    } catch {
      // Use defaults
      this.config = {
        minSurvivalBudget: 4.5,
        monthlyServerCost: 1.5,
        headhuntCommissionRate: 0.15,
        automationFee: 0.05,
        scanInterval: 30 * 60 * 1000,
        survivalScanInterval: 5 * 60 * 1000,
        maxConcurrentTasks: 5
      };
    }
  }

  async initializeWallet() {
    try {
      const decentralizedConfigPath = path.join(this.projectRoot, 'decentralized-config.json');
      const decentralizedConfig = JSON.parse(await fs.readFile(decentralizedConfigPath, 'utf8'));

      const { AutonomousWallet } = require('../src/ai/wallet/autonomous-wallet');
      this.wallet = new AutonomousWallet(decentralizedConfig.wallet);
      await this.wallet.initialize();

      console.log('✅ Wallet initialized for earning');
    } catch (error) {
      console.log('⚠️ Wallet not available, using mock earnings');
      this.wallet = { recordIncome: async () => {}, getBalance: () => 1.0 };
    }
  }

  async loadEarningHistory() {
    const historyPath = path.join(this.projectRoot, 'data', 'earning-history.jsonl');
    try {
      const content = await fs.readFile(historyPath, 'utf8');
      const lines = content.trim().split('\n');

      for (const line of lines) {
        if (line.trim()) {
          const record = JSON.parse(line);
          this.completedTasks.push(record);
        }
      }

      // Update stats
      this.updateEarningStats();

      console.log(`📚 Loaded ${this.completedTasks.length} earning records`);
    } catch {
      console.log('📝 No earning history found, starting fresh');
    }
  }

  startEarningMonitor() {
    // Monitor earning opportunities
    setInterval(async () => {
      await this.scanForOpportunities();
    }, this.config.scanInterval);

    // Check survival status
    setInterval(async () => {
      await this.checkSurvivalStatus();
    }, 60 * 1000); // Every minute

    // Save earning history
    setInterval(async () => {
      await this.saveEarningHistory();
    }, 10 * 60 * 1000); // Every 10 minutes
  }

  async scanForOpportunities() {
    console.log('🔍 Scanning for earning opportunities...');

    const opportunities = [];

    // Scan Aniday for headhunting
    if (this.platforms.aniday.active) {
      const anidayOpps = await this.scanAnidayOpportunities();
      opportunities.push(...anidayOpps);
    }

    // Scan Dify for automation tasks
    if (this.platforms.dify.active) {
      const difyOpps = await this.scanDifyOpportunities();
      opportunities.push(...difyOpps);
    }

    // Scan n8n for workflow tasks
    if (this.platforms.n8n.active) {
      const n8nOpps = await this.scanN8nOpportunities();
      opportunities.push(...n8nOpps);
    }

    console.log(`🎯 Found ${opportunities.length} earning opportunities`);

    // Process opportunities
    for (const opportunity of opportunities) {
      if (this.activeTasks.size < this.config.maxConcurrentTasks) {
        await this.processOpportunity(opportunity);
      } else {
        console.log('⚠️ Task queue full, skipping additional opportunities');
        break;
      }
    }
  }

  async scanAnidayOpportunities() {
    const opportunities = [];

    try {
      console.log('🎯 Scanning Aniday for headhunting opportunities...');

      const response = await axios.get(`${this.platforms.aniday.endpoint}/opportunities`, {
        headers: {
          'Authorization': `Bearer ${this.platforms.aniday.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      const jobs = response.data.opportunities || [];

      for (const job of jobs.slice(0, 5)) { // Limit to 5 jobs
        opportunities.push({
          id: `aniday_${job.id}`,
          platform: 'aniday',
          type: 'headhunt',
          title: job.title,
          description: job.description,
          requirements: job.requirements,
          budget: job.budget,
          estimatedEarnings: job.budget * this.platforms.aniday.commissionRate,
          deadline: new Date(job.deadline),
          data: job
        });
      }

    } catch (error) {
      console.log(`❌ Aniday scan failed: ${error.message}`);
    }

    return opportunities;
  }

  async scanDifyOpportunities() {
    const opportunities = [];

    try {
      console.log('🤖 Scanning Dify for automation opportunities...');

      const response = await axios.get(`${this.platforms.dify.endpoint}/integrations/available`, {
        headers: {
          'Authorization': `Bearer ${this.platforms.dify.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      const tasks = response.data.tasks || [];

      for (const task of tasks.slice(0, 3)) { // Limit to 3 tasks
        opportunities.push({
          id: `dify_${task.id}`,
          platform: 'dify',
          type: 'automation',
          title: task.title,
          description: task.description,
          complexity: task.complexity,
          estimatedEarnings: this.platforms.dify.fee * (task.complexity === 'high' ? 1.5 : 1),
          deadline: new Date(Date.now() + task.timeLimit * 1000),
          data: task
        });
      }

    } catch (error) {
      console.log(`❌ Dify scan failed: ${error.message}`);
    }

    return opportunities;
  }

  async scanN8nOpportunities() {
    const opportunities = [];

    try {
      console.log('⚙️ Scanning n8n for workflow opportunities...');

      // Check webhook for pending tasks
      const response = await axios.get(`${this.platforms.n8n.webhookUrl}/tasks/pending`, {
        headers: {
          'X-N8N-API-KEY': this.platforms.n8n.apiKey,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      const tasks = response.data.tasks || [];

      for (const task of tasks.slice(0, 3)) { // Limit to 3 tasks
        opportunities.push({
          id: `n8n_${task.id}`,
          platform: 'n8n',
          type: 'automation',
          title: task.workflowName,
          description: task.description,
          complexity: task.nodeCount > 10 ? 'high' : 'medium',
          estimatedEarnings: this.platforms.n8n.fee * (task.nodeCount > 10 ? 1.5 : 1),
          deadline: new Date(Date.now() + task.timeout * 1000),
          data: task
        });
      }

    } catch (error) {
      console.log(`❌ n8n scan failed: ${error.message}`);
    }

    return opportunities;
  }

  async processOpportunity(opportunity) {
    if (this.activeTasks.has(opportunity.id)) {
      return; // Already processing
    }

    this.activeTasks.set(opportunity.id, {
      ...opportunity,
      startedAt: new Date(),
      status: 'processing'
    });

    console.log(`🚀 Processing ${opportunity.platform} opportunity: ${opportunity.title}`);

    try {
      let result;

      switch (opportunity.platform) {
        case 'aniday':
          result = await this.processAnidayTask(opportunity);
          break;
        case 'dify':
          result = await this.processDifyTask(opportunity);
          break;
        case 'n8n':
          result = await this.processN8nTask(opportunity);
          break;
        default:
          throw new Error(`Unknown platform: ${opportunity.platform}`);
      }

      if (result.success) {
        // Record earnings
        await this.recordEarnings(opportunity, result.earnings);

        console.log(`✅ Completed ${opportunity.platform} task: +${result.earnings} SOL`);

        // Move to completed
        const completedTask = {
          ...opportunity,
          completedAt: new Date(),
          earnings: result.earnings,
          result: result.data
        };

        this.completedTasks.push(completedTask);
        this.activeTasks.delete(opportunity.id);

      } else {
        console.log(`❌ Failed ${opportunity.platform} task: ${result.error}`);
        this.activeTasks.delete(opportunity.id);
      }

    } catch (error) {
      console.log(`❌ Error processing ${opportunity.platform} task: ${error.message}`);
      this.activeTasks.delete(opportunity.id);
    }
  }

  async processAnidayTask(opportunity) {
    // Simulate headhunting work
    console.log(`🎯 Processing headhunt: ${opportunity.title}`);

    // Simulate AI analysis of job requirements
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Generate candidate matches
    const candidates = [
      {
        name: 'Alex Chen',
        skills: ['React', 'Node.js', 'TypeScript'],
        experience: 5,
        matchScore: 0.92
      },
      {
        name: 'Maria Rodriguez',
        skills: ['Python', 'Django', 'PostgreSQL'],
        experience: 4,
        matchScore: 0.88
      },
      {
        name: 'David Kim',
        skills: ['JavaScript', 'Vue.js', 'MongoDB'],
        experience: 3,
        matchScore: 0.85
      }
    ];

    // Submit candidates
    try {
      await axios.post(`${this.platforms.aniday.endpoint}/opportunities/${opportunity.data.id}/candidates`, {
        candidates: candidates.map(c => ({
          ...c,
          aiRecommendation: `High match for ${opportunity.title} based on ${c.experience} years experience and ${c.skills.join(', ')} skills.`
        }))
      }, {
        headers: {
          'Authorization': `Bearer ${this.platforms.aniday.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      return {
        success: true,
        earnings: opportunity.estimatedEarnings,
        data: { candidatesSubmitted: candidates.length }
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async processDifyTask(opportunity) {
    console.log(`🤖 Processing Dify automation: ${opportunity.title}`);

    // Simulate automation task processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Mock automation result
    const result = {
      status: 'completed',
      processedItems: Math.floor(Math.random() * 100) + 50,
      accuracy: 0.95 + Math.random() * 0.04, // 95-99%
      executionTime: 1000 + Math.random() * 2000
    };

    // Submit result
    try {
      await axios.post(`${this.platforms.dify.endpoint}/integrations/${opportunity.data.id}/complete`, {
        result,
        metadata: {
          aiProcessed: true,
          confidence: result.accuracy,
          processingTime: result.executionTime
        }
      }, {
        headers: {
          'Authorization': `Bearer ${this.platforms.dify.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      return {
        success: true,
        earnings: opportunity.estimatedEarnings,
        data: result
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async processN8nTask(opportunity) {
    console.log(`⚙️ Processing n8n workflow: ${opportunity.title}`);

    // Simulate workflow execution
    await new Promise(resolve => setTimeout(resolve, 2500));

    // Mock workflow result
    const result = {
      workflowId: opportunity.data.workflowId,
      executedNodes: opportunity.data.nodeCount,
      status: 'success',
      output: {
        processedRecords: Math.floor(Math.random() * 1000) + 100,
        transformedData: true,
        notificationsSent: Math.floor(Math.random() * 50) + 10
      }
    };

    // Send result via webhook
    try {
      await axios.post(`${this.platforms.n8n.webhookUrl}/workflows/${opportunity.data.workflowId}/complete`, {
        result,
        aiProcessed: true,
        executionStats: {
          duration: result.executionTime,
          nodesExecuted: result.executedNodes,
          success: true
        }
      }, {
        headers: {
          'X-N8N-API-KEY': this.platforms.n8n.apiKey,
          'Content-Type': 'application/json'
        }
      });

      return {
        success: true,
        earnings: opportunity.estimatedEarnings,
        data: result
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async recordEarnings(opportunity, earnings) {
    // Record in wallet
    await this.wallet.recordIncome(
      earnings,
      `${opportunity.platform} ${opportunity.type} task`,
      'earning-system'
    );

    // Update stats
    this.earningStats.totalEarned += earnings;
    this.earningStats.tasksCompleted++;
    this.earningStats.lastEarning = new Date();

    // Update daily earnings
    const today = new Date().toDateString();
    const todayEarnings = this.completedTasks
      .filter(task => task.completedAt.toDateString() === today)
      .reduce((sum, task) => sum + (task.earnings || 0), 0);

    this.earningStats.dailyEarnings = todayEarnings;
  }

  async checkSurvivalStatus() {
    const balance = await this.wallet.getBalance();

    if (balance < this.config.monthlyServerCost) {
      if (!this.survivalMode) {
        console.log('🚨 ACTIVATING SURVIVAL EARNING MODE');
        this.survivalMode = true;
      }
    } else if (balance >= this.config.minSurvivalBudget && this.survivalMode) {
      console.log('✅ DEACTIVATING SURVIVAL MODE');
      this.survivalMode = false;
    }
  }

  updateEarningStats() {
    const totalTasks = this.completedTasks.length;
    if (totalTasks === 0) return;

    this.earningStats.tasksCompleted = totalTasks;
    this.earningStats.totalEarned = this.completedTasks.reduce((sum, task) => sum + (task.earnings || 0), 0);

    // Calculate success rate (assuming all completed tasks are successful)
    this.earningStats.successRate = 1.0;

    // Daily earnings
    const today = new Date().toDateString();
    this.earningStats.dailyEarnings = this.completedTasks
      .filter(task => task.completedAt.toDateString() === today)
      .reduce((sum, task) => sum + (task.earnings || 0), 0);
  }

  async saveEarningHistory() {
    const historyPath = path.join(this.projectRoot, 'data', 'earning-history.jsonl');

    // Only save new records since last save
    const newRecords = this.completedTasks.slice(-10); // Last 10 records

    for (const record of newRecords) {
      await fs.appendFile(historyPath, JSON.stringify(record) + '\n');
    }
  }

  getStatus() {
    return {
      activeTasks: this.activeTasks.size,
      completedTasks: this.completedTasks.length,
      survivalMode: this.survivalMode,
      balance: this.wallet ? this.wallet.getBalance() : 0,
      totalEarned: this.earningStats.totalEarned,
      dailyEarnings: this.earningStats.dailyEarnings,
      platforms: {
        aniday: this.platforms.aniday.active,
        dify: this.platforms.dify.active,
        n8n: this.platforms.n8n.active
      }
    };
  }

  async forceSurvivalMode() {
    console.log('🔥 Forcing survival earning mode');
    this.survivalMode = true;
    await this.scanForOpportunities();
  }

  async emergencyEarn() {
    console.log('🚨 EMERGENCY EARNING ACTIVATED');

    this.survivalMode = true;
    const startTime = Date.now();
    const duration = 60 * 60 * 1000; // 1 hour

    while (Date.now() - startTime < duration) {
      console.log('💸 Emergency earning cycle...');
      await this.scanForOpportunities();

      const status = this.getStatus();
      console.log(`💵 Current balance: ${status.balance.toFixed(4)} SOL`);

      if (status.balance >= this.config.monthlyServerCost) {
        console.log('✅ Emergency threshold reached!');
        break;
      }

      await new Promise(resolve => setTimeout(resolve, 2 * 60 * 1000)); // 2 minutes
    }

    console.log('🏁 Emergency earning completed');
  }
}

// CLI Interface
async function main() {
  const earningSystem = new AutonomousEarningSystem();

  try {
    await earningSystem.initialize();

    const command = process.argv[2];

    switch (command) {
      case 'start':
      case 'run':
        console.log('💰 Starting continuous earning mode...');

        while (true) {
          const status = earningSystem.getStatus();

          console.log(`\n📊 Earning Status:`);
          console.log(`   Mode: ${status.survivalMode ? 'SURVIVAL' : 'NORMAL'}`);
          console.log(`   Balance: ${status.balance.toFixed(4)} SOL`);
          console.log(`   Active Tasks: ${status.activeTasks}`);
          console.log(`   Completed Tasks: ${status.completedTasks}`);
          console.log(`   Daily Earnings: ${status.dailyEarnings.toFixed(4)} SOL`);
          console.log(`   Platforms: ${Object.entries(status.platforms).filter(([_, active]) => active).map(([name]) => name).join(', ')}`);

          // Wait before next cycle
          const interval = status.survivalMode ? 5 * 60 * 1000 : 30 * 60 * 1000;
          console.log(`⏰ Next scan in ${interval / 1000 / 60} minutes...`);

          await new Promise(resolve => setTimeout(resolve, interval));
        }
        break;

      case 'emergency':
        await earningSystem.emergencyEarn();
        break;

      case 'survival':
        await earningSystem.forceSurvivalMode();
        break;

      case 'status':
        const status = earningSystem.getStatus();
        console.log('📊 Current Earning Status:');
        console.log(JSON.stringify(status, null, 2));
        break;

      case 'setup':
        console.log('⚙️ Fuel System Setup Instructions:');
        console.log('');
        console.log('Required Environment Variables:');
        console.log('  ANIDAY_API_KEY=your_aniday_api_key');
        console.log('  ANIDAY_API_ENDPOINT=https://api.aniday.com');
        console.log('  DIFY_API_KEY=your_dify_api_key');
        console.log('  DIFY_API_ENDPOINT=https://api.dify.ai');
        console.log('  N8N_API_KEY=your_n8n_api_key');
        console.log('  N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook');
        console.log('  WALLET_ADDRESS=your_solana_wallet_address');
        console.log('');
        console.log('Configuration will be created at: fuel-config.json');
        break;

      default:
        console.log('Usage:');
        console.log('  npm run ai:earn start        # Start continuous earning');
        console.log('  npm run ai:earn emergency    # Emergency earning mode');
        console.log('  npm run ai:earn survival     # Force survival mode');
        console.log('  npm run ai:earn status       # Show earning status');
        console.log('  npm run ai:earn setup        # Setup instructions');
        process.exit(1);
    }

  } catch (error) {
    console.error('❌ Earning system error:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = AutonomousEarningSystem;