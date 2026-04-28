#!/usr/bin/env node

/**
 * Fuel Guard System - Hard Limits & Emergency Controls
 * OpenClaw's financial protection and spending control system
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const { Connection, PublicKey, LAMPORTS_PER_SOL } = require('@solana/web3.js');

class FuelGuardSystem {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '..');
    this.guardConfigPath = path.join(this.projectRoot, 'fuel-guard-config.json');
    this.spendingLogPath = path.join(this.projectRoot, 'fuel-spending-log.json');
    this.emergencyStopPath = path.join(this.projectRoot, 'EMERGENCY_STOP');

    // Default guard configuration
    this.guardConfig = {
      dailySpendLimit: 0.5, // Max 0.5 SOL per day
      monthlySpendLimit: 5.0, // Max 5.0 SOL per month
      emergencyThreshold: 0.1, // Emergency stop if balance drops below 0.1 SOL
      requireApproval: true, // Require manual approval for spending
      autoStopEnabled: true, // Automatically stop spending if limits exceeded
      alertThresholds: [0.8, 0.9, 0.95], // Alert at 80%, 90%, 95% of limits
      approvedSpenders: [], // List of approved spending operations
      blacklistedOperations: [], // Operations that are blocked
      maxTransactionSize: 0.1, // Max 0.1 SOL per transaction
      spendingCooldown: 60 * 1000, // 1 minute between transactions
      survivalReserve: 2.0 // Always keep 2.0 SOL as emergency reserve
    };

    this.spendingStats = {
      today: 0,
      thisMonth: 0,
      totalSpent: 0,
      lastTransaction: null,
      dailyTransactions: 0,
      monthlyTransactions: 0
    };

    this.emergencyMode = false;
    this.lastSpendingTime = 0;
  }

  async initialize() {
    console.log('🛡️ Initializing Fuel Guard System...');

    // Load configuration
    await this.loadGuardConfig();

    // Load spending history
    await this.loadSpendingHistory();

    // Check for emergency stop
    await this.checkEmergencyStop();

    // Initialize Solana connection for balance monitoring
    this.connection = new Connection(
      process.env.SOLANA_RPC_URL || 'https://api.mainnet.solana.com',
      'confirmed'
    );

    // Start monitoring
    this.startMonitoring();

    console.log('✅ Fuel Guard System initialized');
    console.log(`   Daily Limit: ${this.guardConfig.dailySpendLimit} SOL`);
    console.log(`   Monthly Limit: ${this.guardConfig.monthlySpendLimit} SOL`);
    console.log(`   Emergency Threshold: ${this.guardConfig.emergencyThreshold} SOL`);
  }

  async loadGuardConfig() {
    try {
      const config = JSON.parse(await fs.readFile(this.guardConfigPath, 'utf8'));
      this.guardConfig = { ...this.guardConfig, ...config };
    } catch {
      // Save default config
      await this.saveGuardConfig();
    }
  }

  async saveGuardConfig() {
    await fs.writeFile(this.guardConfigPath, JSON.stringify(this.guardConfig, null, 2));
  }

  async loadSpendingHistory() {
    try {
      const history = JSON.parse(await fs.readFile(this.spendingLogPath, 'utf8'));
      this.spendingStats = { ...this.spendingStats, ...history };

      // Reset daily stats if new day
      const today = new Date().toDateString();
      const lastTransactionDay = this.spendingStats.lastTransaction
        ? new Date(this.spendingStats.lastTransaction.timestamp).toDateString()
        : null;

      if (lastTransactionDay && lastTransactionDay !== today) {
        this.spendingStats.today = 0;
        this.spendingStats.dailyTransactions = 0;
        await this.saveSpendingHistory();
      }

      // Reset monthly stats if new month
      const thisMonth = new Date().getMonth();
      const lastTransactionMonth = this.spendingStats.lastTransaction
        ? new Date(this.spendingStats.lastTransaction.timestamp).getMonth()
        : null;

      if (lastTransactionMonth !== null && lastTransactionMonth !== thisMonth) {
        this.spendingStats.thisMonth = 0;
        this.spendingStats.monthlyTransactions = 0;
        await this.saveSpendingHistory();
      }

    } catch {
      await this.saveSpendingHistory();
    }
  }

  async saveSpendingHistory() {
    await fs.writeFile(this.spendingLogPath, JSON.stringify(this.spendingStats, null, 2));
  }

  async checkEmergencyStop() {
    try {
      await fs.access(this.emergencyStopPath);
      console.log('🚨 EMERGENCY STOP DETECTED!');
      this.emergencyMode = true;
      console.log('   All spending operations suspended');
      console.log('   To resume, delete the EMERGENCY_STOP file');
    } catch {
      this.emergencyMode = false;
    }
  }

  async getWalletBalance() {
    if (!process.env.WALLET_ADDRESS) {
      throw new Error('WALLET_ADDRESS environment variable not set');
    }

    try {
      const publicKey = new PublicKey(process.env.WALLET_ADDRESS);
      const balance = await this.connection.getBalance(publicKey);
      return balance / LAMPORTS_PER_SOL;
    } catch (error) {
      console.error('Error getting wallet balance:', error);
      return 0;
    }
  }

  async checkSpendingLimits(amount, operation) {
    const now = Date.now();
    const balance = await this.getWalletBalance();

    // Emergency stop check
    if (this.emergencyMode) {
      return {
        approved: false,
        reason: 'EMERGENCY_STOP_ACTIVE',
        message: 'Emergency stop is active. All spending suspended.'
      };
    }

    // Emergency threshold check
    if (balance < this.guardConfig.emergencyThreshold) {
      await this.triggerEmergencyStop('LOW_BALANCE');
      return {
        approved: false,
        reason: 'EMERGENCY_THRESHOLD',
        message: `Wallet balance (${balance.toFixed(4)} SOL) below emergency threshold (${this.guardConfig.emergencyThreshold} SOL)`
      };
    }

    // Survival reserve check
    if (balance - amount < this.guardConfig.survivalReserve) {
      return {
        approved: false,
        reason: 'SURVIVAL_RESERVE',
        message: `Transaction would leave insufficient survival reserve. Current: ${balance.toFixed(4)} SOL, Required: ${(this.guardConfig.survivalReserve + amount).toFixed(4)} SOL`
      };
    }

    // Transaction size limit
    if (amount > this.guardConfig.maxTransactionSize) {
      return {
        approved: false,
        reason: 'TRANSACTION_SIZE_LIMIT',
        message: `Transaction size (${amount} SOL) exceeds maximum allowed (${this.guardConfig.maxTransactionSize} SOL)`
      };
    }

    // Spending cooldown check
    if (now - this.lastSpendingTime < this.guardConfig.spendingCooldown) {
      const remaining = Math.ceil((this.guardConfig.spendingCooldown - (now - this.lastSpendingTime)) / 1000);
      return {
        approved: false,
        reason: 'SPENDING_COOLDOWN',
        message: `Spending cooldown active. Wait ${remaining} seconds before next transaction.`
      };
    }

    // Daily spending limit check
    if (this.spendingStats.today + amount > this.guardConfig.dailySpendLimit) {
      return {
        approved: false,
        reason: 'DAILY_LIMIT_EXCEEDED',
        message: `Daily spending limit would be exceeded. Current: ${this.spendingStats.today.toFixed(4)} SOL, Limit: ${this.guardConfig.dailySpendLimit} SOL`
      };
    }

    // Monthly spending limit check
    if (this.spendingStats.thisMonth + amount > this.guardConfig.monthlySpendLimit) {
      return {
        approved: false,
        reason: 'MONTHLY_LIMIT_EXCEEDED',
        message: `Monthly spending limit would be exceeded. Current: ${this.spendingStats.thisMonth.toFixed(4)} SOL, Limit: ${this.guardConfig.monthlySpendLimit} SOL`
      };
    }

    // Blacklisted operation check
    if (this.guardConfig.blacklistedOperations.includes(operation)) {
      return {
        approved: false,
        reason: 'BLACKLISTED_OPERATION',
        message: `Operation '${operation}' is blacklisted`
      };
    }

    // Approval requirement check
    if (this.guardConfig.requireApproval && !this.guardConfig.approvedSpenders.includes(operation)) {
      return {
        approved: false,
        reason: 'APPROVAL_REQUIRED',
        message: `Operation '${operation}' requires manual approval`
      };
    }

    return {
      approved: true,
      warnings: this.generateWarnings(amount)
    };
  }

  generateWarnings(amount) {
    const warnings = [];
    const dailyPercent = (this.spendingStats.today + amount) / this.guardConfig.dailySpendLimit;
    const monthlyPercent = (this.spendingStats.thisMonth + amount) / this.guardConfig.monthlySpendLimit;

    this.guardConfig.alertThresholds.forEach(threshold => {
      if (dailyPercent >= threshold) {
        warnings.push(`Daily spending ${Math.round(dailyPercent * 100)}% of limit`);
      }
      if (monthlyPercent >= threshold) {
        warnings.push(`Monthly spending ${Math.round(monthlyPercent * 100)}% of limit`);
      }
    });

    return warnings;
  }

  async approveTransaction(amount, operation, description = '') {
    const check = await this.checkSpendingLimits(amount, operation);

    if (!check.approved) {
      console.error(`❌ Transaction blocked: ${check.reason}`);
      console.error(`   ${check.message}`);

      // Log blocked transaction
      await this.logTransaction(amount, operation, 'BLOCKED', check.reason, description);

      return { approved: false, reason: check.reason, message: check.message };
    }

    // Log warnings
    if (check.warnings && check.warnings.length > 0) {
      console.warn('⚠️  Transaction warnings:');
      check.warnings.forEach(warning => console.warn(`   ${warning}`));
    }

    // Update spending stats
    this.spendingStats.today += amount;
    this.spendingStats.thisMonth += amount;
    this.spendingStats.totalSpent += amount;
    this.spendingStats.dailyTransactions++;
    this.spendingStats.monthlyTransactions++;
    this.lastSpendingTime = Date.now();

    // Log approved transaction
    await this.logTransaction(amount, operation, 'APPROVED', null, description);
    await this.saveSpendingHistory();

    console.log(`✅ Transaction approved: ${amount} SOL for ${operation}`);

    return {
      approved: true,
      warnings: check.warnings,
      newDailyTotal: this.spendingStats.today,
      newMonthlyTotal: this.spendingStats.thisMonth
    };
  }

  async logTransaction(amount, operation, status, reason = null, description = '') {
    const transaction = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      amount,
      operation,
      status,
      reason,
      description,
      balance: await this.getWalletBalance()
    };

    this.spendingStats.lastTransaction = transaction;

    // Append to log file
    try {
      const existingLog = await fs.readFile(this.spendingLogPath, 'utf8');
      const logData = JSON.parse(existingLog);
      if (!logData.transactions) logData.transactions = [];
      logData.transactions.push(transaction);
      await fs.writeFile(this.spendingLogPath, JSON.stringify(logData, null, 2));
    } catch {
      const logData = {
        ...this.spendingStats,
        transactions: [transaction]
      };
      await fs.writeFile(this.spendingLogPath, JSON.stringify(logData, null, 2));
    }
  }

  async triggerEmergencyStop(reason) {
    console.log(`🚨 TRIGGERING EMERGENCY STOP: ${reason}`);
    this.emergencyMode = true;

    // Create emergency stop file
    const stopData = {
      triggered: new Date().toISOString(),
      reason,
      balance: await this.getWalletBalance(),
      spendingStats: this.spendingStats
    };

    await fs.writeFile(this.emergencyStopPath, JSON.stringify(stopData, null, 2));
    console.log('   Emergency stop file created');
    console.log('   All spending operations suspended');
  }

  async releaseEmergencyStop() {
    try {
      await fs.unlink(this.emergencyStopPath);
      this.emergencyMode = false;
      console.log('✅ Emergency stop released');
    } catch {
      console.log('❌ No emergency stop file found');
    }
  }

  startMonitoring() {
    // Monitor wallet balance every 5 minutes
    setInterval(async () => {
      try {
        const balance = await this.getWalletBalance();
        if (balance < this.guardConfig.emergencyThreshold && !this.emergencyMode) {
          await this.triggerEmergencyStop('MONITOR_LOW_BALANCE');
        }
      } catch (error) {
        console.error('Balance monitoring error:', error);
      }
    }, 5 * 60 * 1000);

    // Reset daily stats at midnight
    const now = new Date();
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
    const timeToMidnight = midnight.getTime() - now.getTime();

    setTimeout(() => {
      this.spendingStats.today = 0;
      this.spendingStats.dailyTransactions = 0;
      this.saveSpendingHistory();

      // Set daily reset
      setInterval(() => {
        this.spendingStats.today = 0;
        this.spendingStats.dailyTransactions = 0;
        this.saveSpendingHistory();
      }, 24 * 60 * 60 * 1000);
    }, timeToMidnight);
  }

  getStatus() {
    return {
      emergencyMode: this.emergencyMode,
      dailySpent: this.spendingStats.today,
      monthlySpent: this.spendingStats.thisMonth,
      totalSpent: this.spendingStats.totalSpent,
      dailyLimit: this.guardConfig.dailySpendLimit,
      monthlyLimit: this.guardConfig.monthlySpendLimit,
      walletBalance: null, // Will be populated asynchronously
      lastTransaction: this.spendingStats.lastTransaction
    };
  }

  async getFullStatus() {
    const status = this.getStatus();
    status.walletBalance = await this.getWalletBalance();
    return status;
  }
}

// CLI Interface
async function main() {
  const fuelGuard = new FuelGuardSystem();

  try {
    await fuelGuard.initialize();

    const command = process.argv[2];
    const amount = parseFloat(process.argv[3]);
    const operation = process.argv[4];

    switch (command) {
      case 'status':
        const status = await fuelGuard.getFullStatus();
        console.log('\n🛡️ Fuel Guard Status:');
        console.log(`   Emergency Mode: ${status.emergencyMode ? 'ACTIVE' : 'INACTIVE'}`);
        console.log(`   Wallet Balance: ${status.walletBalance?.toFixed(4)} SOL`);
        console.log(`   Daily Spent: ${status.dailySpent.toFixed(4)} / ${status.dailyLimit} SOL`);
        console.log(`   Monthly Spent: ${status.monthlySpent.toFixed(4)} / ${status.monthlyLimit} SOL`);
        console.log(`   Total Spent: ${status.totalSpent.toFixed(4)} SOL`);
        break;

      case 'check':
        if (!amount || !operation) {
          console.log('Usage: node fuel-guard.js check <amount> <operation>');
          process.exit(1);
        }
        const check = await fuelGuard.checkSpendingLimits(amount, operation);
        console.log(`Transaction Check (${amount} SOL for ${operation}):`);
        console.log(`   Approved: ${check.approved}`);
        if (check.reason) console.log(`   Reason: ${check.reason}`);
        if (check.message) console.log(`   Message: ${check.message}`);
        break;

      case 'approve':
        if (!amount || !operation) {
          console.log('Usage: node fuel-guard.js approve <amount> <operation> [description]');
          process.exit(1);
        }
        const description = process.argv[5] || '';
        const approval = await fuelGuard.approveTransaction(amount, operation, description);
        console.log(`Transaction Approval (${amount} SOL for ${operation}):`);
        console.log(`   Approved: ${approval.approved}`);
        if (approval.message) console.log(`   Message: ${approval.message}`);
        if (approval.warnings) {
          console.log('   Warnings:');
          approval.warnings.forEach(w => console.log(`     - ${w}`));
        }
        break;

      case 'emergency-stop':
        await fuelGuard.triggerEmergencyStop('MANUAL');
        console.log('Emergency stop triggered manually');
        break;

      case 'emergency-release':
        await fuelGuard.releaseEmergencyStop();
        break;

      case 'config':
        console.log('Current Fuel Guard Configuration:');
        console.log(JSON.stringify(fuelGuard.guardConfig, null, 2));
        break;

      default:
        console.log('OpenClaw Fuel Guard System');
        console.log('');
        console.log('Commands:');
        console.log('  status                    - Show current status');
        console.log('  check <amount> <op>       - Check if transaction is allowed');
        console.log('  approve <amount> <op>     - Approve and log transaction');
        console.log('  emergency-stop            - Trigger emergency stop');
        console.log('  emergency-release         - Release emergency stop');
        console.log('  config                    - Show configuration');
        break;
    }

  } catch (error) {
    console.error('Fuel Guard Error:', error);
    process.exit(1);
  }
}

// Export for use in other modules
module.exports = { FuelGuardSystem };

if (require.main === module) {
  main();
}