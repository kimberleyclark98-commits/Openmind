#!/usr/bin/env node

/**
 * OpenMind AI - Fuel System v1
 * Basic wallet balance checking and mock earning simulation
 */

const { Connection, PublicKey, LAMPORTS_PER_SOL } = require('@solana/web3.js');
const { FuelGuardSystem } = require('./fuel-guard');

class BasicFuelSystem {
  constructor() {
    this.connection = null;
    this.walletAddress = null;
    this.fuelGuard = null;
    this.mockEarnings = [];
  }

  async initialize() {
    console.log('⛽ Initializing Basic Fuel System...');

    // Initialize Solana connection
    this.connection = new Connection(
      process.env.SOLANA_RPC_URL || 'https://api.mainnet.solana.com',
      'confirmed'
    );

    // Set wallet address
    this.walletAddress = process.env.WALLET_ADDRESS;
    if (!this.walletAddress) {
      console.log('⚠️ No wallet address configured, using mock data');
    }

    // Initialize Fuel Guard
    this.fuelGuard = new FuelGuardSystem();
    await this.fuelGuard.initialize();

    // Generate mock earnings data
    this.generateMockEarnings();

    console.log('✅ Basic Fuel System initialized');
  }

  async getWalletBalance() {
    if (!this.walletAddress) {
      // Return mock balance for demo
      return 2.5 + Math.random() * 2; // 2.5-4.5 SOL
    }

    try {
      const publicKey = new PublicKey(this.walletAddress);
      const balance = await this.connection.getBalance(publicKey);
      return balance / LAMPORTS_PER_SOL;
    } catch (error) {
      console.error('Error getting wallet balance:', error);
      return 0;
    }
  }

  async checkFuelStatus() {
    const balance = await this.getWalletBalance();
    const guardStatus = await this.fuelGuard.getFullStatus();

    const status = {
      balance,
      isHealthy: balance > guardStatus.monthlyLimit * 0.1, // At least 10% of monthly limit
      emergencyMode: guardStatus.emergencyMode,
      dailySpent: guardStatus.dailySpent,
      monthlySpent: guardStatus.monthlySpent,
      dailyLimit: guardStatus.dailyLimit,
      monthlyLimit: guardStatus.monthlyLimit,
      needsFunding: balance < guardStatus.monthlyLimit * 0.2, // Below 20% of monthly limit
      recommendations: []
    };

    // Generate recommendations
    if (status.needsFunding) {
      status.recommendations.push('URGENT: Wallet balance critically low. Manual funding required.');
    } else if (balance < guardStatus.monthlyLimit * 0.5) {
      status.recommendations.push('WARNING: Wallet balance below 50% of monthly limit.');
    }

    if (status.emergencyMode) {
      status.recommendations.push('EMERGENCY MODE ACTIVE: All automated spending suspended.');
    }

    if (guardStatus.dailySpent > guardStatus.dailyLimit * 0.8) {
      status.recommendations.push('Daily spending limit approaching (80% used).');
    }

    return status;
  }

  generateMockEarnings() {
    // Generate last 7 days of mock earnings
    const now = new Date();
    this.mockEarnings = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);

      const earnings = {
        date: date.toISOString().split('T')[0],
        amount: Math.random() * 0.5, // 0-0.5 SOL per day
        source: ['headhunting', 'automation', 'consulting'][Math.floor(Math.random() * 3)],
        transactions: Math.floor(Math.random() * 5) + 1
      };

      this.mockEarnings.push(earnings);
    }
  }

  getEarningsHistory(days = 7) {
    return this.mockEarnings.slice(-days);
  }

  async simulateEarning() {
    // Simulate a small earning transaction
    const amount = 0.01 + Math.random() * 0.05; // 0.01-0.06 SOL
    const operation = 'earning_simulation';

    // Check if we can "earn" (mock approval)
    const approval = await this.fuelGuard.approveTransaction(amount, operation, 'Simulated earning');

    if (approval.approved) {
      console.log(`💰 Simulated earning: +${amount.toFixed(4)} SOL`);

      // Add to mock earnings
      const today = new Date().toISOString().split('T')[0];
      const todayEarning = this.mockEarnings.find(e => e.date === today);
      if (todayEarning) {
        todayEarning.amount += amount;
        todayEarning.transactions += 1;
      } else {
        this.mockEarnings.push({
          date: today,
          amount,
          source: 'simulation',
          transactions: 1
        });
      }

      return { success: true, amount, message: 'Earning simulated successfully' };
    } else {
      return { success: false, amount: 0, message: approval.message };
    }
  }

  async getFuelReport() {
    const status = await this.checkFuelStatus();
    const earnings = this.getEarningsHistory(7);

    const report = {
      timestamp: new Date().toISOString(),
      wallet: {
        address: this.walletAddress ? `${this.walletAddress.substring(0, 8)}...${this.walletAddress.substring(this.walletAddress.length - 8)}` : 'Not configured',
        balance: status.balance,
        status: status.isHealthy ? 'healthy' : 'warning'
      },
      spending: {
        daily: `${status.dailySpent.toFixed(4)} / ${status.dailyLimit} SOL`,
        monthly: `${status.monthlySpent.toFixed(4)} / ${status.monthlyLimit} SOL`,
        emergencyMode: status.emergencyMode
      },
      earnings: {
        last7Days: earnings,
        total7Days: earnings.reduce((sum, e) => sum + e.amount, 0),
        averageDaily: earnings.reduce((sum, e) => sum + e.amount, 0) / earnings.length
      },
      recommendations: status.recommendations
    };

    return report;
  }
}

// CLI Interface
async function main() {
  const fuelSystem = new BasicFuelSystem();
  await fuelSystem.initialize();

  const command = process.argv[2];

  try {
    switch (command) {
      case 'balance':
        const balance = await fuelSystem.getWalletBalance();
        console.log(`💰 Wallet Balance: ${balance.toFixed(4)} SOL`);
        break;

      case 'status':
        const status = await fuelSystem.checkFuelStatus();
        console.log('\n⛽ Fuel System Status:');
        console.log(`   Balance: ${status.balance.toFixed(4)} SOL`);
        console.log(`   Status: ${status.isHealthy ? 'HEALTHY' : 'WARNING'}`);
        console.log(`   Emergency Mode: ${status.emergencyMode ? 'ACTIVE' : 'INACTIVE'}`);
        console.log(`   Daily Spent: ${status.dailySpent.toFixed(4)} / ${status.dailyLimit} SOL`);
        console.log(`   Monthly Spent: ${status.monthlySpent.toFixed(4)} / ${status.monthlyLimit} SOL`);
        if (status.recommendations.length > 0) {
          console.log('   Recommendations:');
          status.recommendations.forEach(rec => console.log(`     - ${rec}`));
        }
        break;

      case 'earn':
        const earning = await fuelSystem.simulateEarning();
        if (earning.success) {
          console.log(`✅ ${earning.message}`);
        } else {
          console.log(`❌ Earning failed: ${earning.message}`);
        }
        break;

      case 'earnings':
        const earnings = fuelSystem.getEarningsHistory(7);
        console.log('\n📈 Recent Earnings (Last 7 days):');
        earnings.forEach(day => {
          console.log(`   ${day.date}: +${day.amount.toFixed(4)} SOL (${day.transactions} tx, ${day.source})`);
        });
        const total = earnings.reduce((sum, e) => sum + e.amount, 0);
        console.log(`   Total: ${total.toFixed(4)} SOL`);
        break;

      case 'report':
        const report = await fuelSystem.getFuelReport();
        console.log('\n📊 Fuel System Report:');
        console.log(`   Generated: ${report.timestamp}`);
        console.log(`   Wallet: ${report.wallet.address} (${report.wallet.balance.toFixed(4)} SOL, ${report.wallet.status})`);
        console.log(`   Spending: Daily ${report.spending.daily}, Monthly ${report.spending.monthly}`);
        console.log(`   Earnings (7d): ${report.earnings.total7Days.toFixed(4)} SOL (avg ${report.earnings.averageDaily.toFixed(4)}/day)`);
        if (report.recommendations.length > 0) {
          console.log('   Recommendations:');
          report.recommendations.forEach(rec => console.log(`     - ${rec}`));
        }
        break;

      default:
        console.log('OpenMind AI Basic Fuel System v1');
        console.log('');
        console.log('Commands:');
        console.log('  balance     - Check wallet balance');
        console.log('  status      - Show fuel system status');
        console.log('  earn        - Simulate earning transaction');
        console.log('  earnings    - Show recent earnings history');
        console.log('  report      - Generate full fuel report');
        console.log('');
        console.log('Integration with Fuel Guard for spending limits and emergency controls.');
        break;
    }

  } catch (error) {
    console.error('Fuel System Error:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = BasicFuelSystem;