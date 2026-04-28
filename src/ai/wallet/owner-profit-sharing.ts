import { AutonomousWallet } from './autonomous-wallet';
import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';

export interface OwnerConfig {
  ownerWalletAddress: string; // Địa chỉ ví của bạn
  profitSharingRate: number; // % lợi nhuận chia sẻ (0.0 - 1.0)
  minPayoutAmount: number; // Số tiền tối thiểu để gửi (SOL)
  payoutFrequency: 'daily' | 'weekly' | 'monthly'; // Tần suất gửi tiền
  emergencyReserve: number; // Dự trữ khẩn cấp (SOL)
  operationalCosts: number; // Chi phí vận hành hàng tháng (SOL)
}

export interface PayoutRecord {
  id: string;
  amount: number;
  timestamp: Date;
  txHash: string;
  reason: string;
  ownerBalance: number;
}

export class OwnerProfitSharingSystem {
  private wallet: AutonomousWallet;
  private config: OwnerConfig;
  private payoutHistory: PayoutRecord[] = [];
  private lastPayout: Date = new Date();
  private totalPaidToOwner: number = 0;

  constructor(wallet: AutonomousWallet, config: OwnerConfig) {
    this.wallet = wallet;
    this.config = config;
  }

  async initialize(): Promise<void> {
    console.log('👑 Initializing Owner Profit Sharing System...');
    console.log(`💰 Owner wallet: ${this.config.ownerWalletAddress}`);
    console.log(`📊 Profit sharing rate: ${this.config.profitSharingRate * 100}%`);

    this.startPayoutScheduler();
    await this.loadPayoutHistory();

    console.log('✅ Owner Profit Sharing System initialized');
  }

  private startPayoutScheduler(): void {
    const intervals = {
      daily: 24 * 60 * 60 * 1000, // 24 hours
      weekly: 7 * 24 * 60 * 60 * 1000, // 7 days
      monthly: 30 * 24 * 60 * 60 * 1000 // 30 days
    };

    const interval = intervals[this.config.payoutFrequency];

    setInterval(async () => {
      await this.processScheduledPayout();
    }, interval);

    // Also check every hour for emergency payouts
    setInterval(async () => {
      await this.checkEmergencyPayout();
    }, 60 * 60 * 1000); // 1 hour
  }

  async processScheduledPayout(): Promise<void> {
    console.log('💸 Processing scheduled payout to owner...');

    const profitAnalysis = await this.analyzeProfits();

    if (profitAnalysis.availableForPayout > this.config.minPayoutAmount) {
      await this.sendPayoutToOwner(
        profitAnalysis.availableForPayout,
        `Scheduled ${this.config.payoutFrequency} profit sharing`
      );
    } else {
      console.log(`💰 Profit (${profitAnalysis.availableForPayout} SOL) below minimum payout threshold`);
    }
  }

  async checkEmergencyPayout(): Promise<void> {
    const balance = this.wallet.getBalance();
    const financialSummary = this.wallet.getFinancialSummary();

    // Emergency payout if AI is making too much money
    const excessThreshold = this.config.emergencyReserve * 3; // 3x emergency reserve

    if (balance > excessThreshold) {
      const excessAmount = balance - this.config.emergencyReserve;
      const payoutAmount = excessAmount * this.config.profitSharingRate;

      console.log('🚨 EMERGENCY PAYOUT: AI has excess funds!');
      await this.sendPayoutToOwner(
        payoutAmount,
        'Emergency excess funds payout'
      );
    }
  }

  private async analyzeProfits(): Promise<{
    totalRevenue: number;
    operationalCosts: number;
    netProfit: number;
    availableForPayout: number;
    reserveNeeded: number;
  }> {
    const financialSummary = this.wallet.getFinancialSummary();
    const currentBalance = this.wallet.getBalance();

    // Calculate operational costs (server, API calls, etc.)
    const monthlyOperationalCosts = this.config.operationalCosts;

    // Calculate net profit
    const netProfit = Math.max(0, financialSummary.netIncome - monthlyOperationalCosts);

    // Reserve needed for operations
    const reserveNeeded = this.config.emergencyReserve + monthlyOperationalCosts;

    // Available for payout (current balance - reserves)
    const availableBalance = Math.max(0, currentBalance - reserveNeeded);
    const availableForPayout = availableBalance * this.config.profitSharingRate;

    return {
      totalRevenue: financialSummary.totalIncome,
      operationalCosts: monthlyOperationalCosts,
      netProfit,
      availableForPayout,
      reserveNeeded
    };
  }

  async sendPayoutToOwner(amount: number, reason: string): Promise<boolean> {
    try {
      console.log(`💰 Sending ${amount} SOL to owner: ${reason}`);

      // Validate owner wallet address
      const ownerPublicKey = new PublicKey(this.config.ownerWalletAddress);

      // Check if we have enough balance
      const currentBalance = this.wallet.getBalance();
      if (currentBalance < amount) {
        console.log('❌ Insufficient balance for owner payout');
        return false;
      }

      // Create transaction to send SOL to owner
      const txHash = await this.createOwnerPayoutTransaction(ownerPublicKey, amount);

      // Record the payout
      const payoutRecord: PayoutRecord = {
        id: `payout_${Date.now()}`,
        amount,
        timestamp: new Date(),
        txHash,
        reason,
        ownerBalance: currentBalance - amount
      };

      this.payoutHistory.push(payoutRecord);
      this.totalPaidToOwner += amount;
      this.lastPayout = new Date();

      console.log(`✅ Successfully sent ${amount} SOL to owner!`);
      console.log(`📊 Total paid to owner: ${this.totalPaidToOwner} SOL`);

      // Save payout history
      await this.savePayoutHistory();

      // Notify owner (could send email, SMS, etc.)
      await this.notifyOwner(payoutRecord);

      return true;

    } catch (error) {
      console.error('❌ Owner payout failed:', error);
      return false;
    }
  }

  private async createOwnerPayoutTransaction(ownerPublicKey: PublicKey, amount: number): Promise<string> {
    // For demo purposes, simulate the transaction
    // In production, this would create and send actual Solana transactions

    const lamports = amount * LAMPORTS_PER_SOL;

    // Simulate transaction hash
    const txHash = `owner_payout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    console.log(`📤 Transaction simulated: ${txHash}`);
    console.log(`💸 Sent ${amount} SOL (${lamports} lamports) to ${ownerPublicKey.toBase58()}`);

    return txHash;
  }

  private async notifyOwner(payout: PayoutRecord): Promise<void> {
    // Notification system for owner
    console.log('📧 Notifying owner of payout...');

    const message = `
🎉 OpenMind AI Profit Sharing Payout!

💰 Amount: ${payout.amount} SOL
📅 Date: ${payout.timestamp.toLocaleString()}
💡 Reason: ${payout.reason}
🔗 Transaction: ${payout.txHash}

📊 Total earned for you: ${this.totalPaidToOwner} SOL

Your AI is working hard to make you money! 🤖💪
    `.trim();

    // In production, this could:
    // - Send email via SendGrid/Mailgun
    // - Send SMS via Twilio
    // - Push notification via Firebase
    // - Discord/Telegram bot message
    // - Webhook to your system

    console.log(message);
  }

  async forcePayoutNow(reason: string = 'Manual payout requested'): Promise<boolean> {
    console.log('🚀 FORCE PAYOUT: Owner requested immediate payout');

    const profitAnalysis = await this.analyzeProfits();

    if (profitAnalysis.availableForPayout > 0.001) { // Minimum 0.001 SOL
      return await this.sendPayoutToOwner(profitAnalysis.availableForPayout, reason);
    } else {
      console.log('❌ No profits available for payout');
      return false;
    }
  }

  async setOwnerWallet(newWalletAddress: string): Promise<void> {
    console.log(`🔄 Updating owner wallet: ${newWalletAddress}`);
    
    // Validate new address
    try {
      new PublicKey(newWalletAddress);
      this.config.ownerWalletAddress = newWalletAddress;
      console.log('✅ Owner wallet updated successfully');
    } catch (error) {
      throw new Error('Invalid wallet address');
    }
  }

  async updateProfitSharingRate(newRate: number): Promise<void> {
    if (newRate < 0 || newRate > 1) {
      throw new Error('Profit sharing rate must be between 0 and 1');
    }

    console.log(`📊 Updating profit sharing rate: ${newRate * 100}%`);
    this.config.profitSharingRate = newRate;
  }

  getOwnerStats(): {
    totalPaidToOwner: number;
    lastPayoutDate: Date;
    nextScheduledPayout: Date;
    currentProfitSharingRate: number;
    payoutHistory: PayoutRecord[];
    estimatedNextPayout: number;
  } {
    const intervals = {
      daily: 24 * 60 * 60 * 1000,
      weekly: 7 * 24 * 60 * 60 * 1000,
      monthly: 30 * 24 * 60 * 60 * 1000
    };

    const nextScheduledPayout = new Date(
      this.lastPayout.getTime() + intervals[this.config.payoutFrequency]
    );

    return {
      totalPaidToOwner: this.totalPaidToOwner,
      lastPayoutDate: this.lastPayout,
      nextScheduledPayout,
      currentProfitSharingRate: this.config.profitSharingRate,
      payoutHistory: [...this.payoutHistory],
      estimatedNextPayout: this.estimateNextPayout()
    };
  }

  private estimateNextPayout(): number {
    const profitAnalysis = this.analyzeProfits();
    return profitAnalysis.then(analysis => analysis.availableForPayout).catch(() => 0);
  }

  private async loadPayoutHistory(): Promise<void> {
    // Load payout history from file
    // Implementation similar to wallet transaction history
  }

  private async savePayoutHistory(): Promise<void> {
    // Save payout history to file
    // Implementation similar to wallet transaction history
  }

  // Emergency functions
  async emergencyStopPayouts(): Promise<void> {
    console.log('🛑 EMERGENCY: Stopping all payouts to owner');
    this.config.profitSharingRate = 0;
  }

  async emergencyMaxPayouts(): Promise<void> {
    console.log('🚨 EMERGENCY: Maximizing payouts to owner');
    this.config.profitSharingRate = 0.9; // 90% to owner, 10% for operations
    await this.forcePayoutNow('Emergency maximum payout');
  }
}

// Default configuration for Vietnamese users
export const DEFAULT_OWNER_CONFIG: OwnerConfig = {
  ownerWalletAddress: 'YOUR_SOLANA_WALLET_ADDRESS_HERE', // Thay bằng địa chỉ ví của bạn
  profitSharingRate: 0.7, // 70% lợi nhuận cho owner, 30% cho AI vận hành
  minPayoutAmount: 0.1, // Tối thiểu 0.1 SOL mới gửi
  payoutFrequency: 'weekly', // Gửi tiền hàng tuần
  emergencyReserve: 2.0, // Dự trữ 2 SOL cho khẩn cấp
  operationalCosts: 1.5 // Chi phí vận hành 1.5 SOL/tháng
};