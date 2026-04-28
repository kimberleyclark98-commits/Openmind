import { Connection, PublicKey, Keypair, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { Wallet } from '@project-serum/anchor';
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';

export interface WalletConfig {
  network: 'mainnet-beta' | 'devnet' | 'testnet';
  rpcUrl: string;
  keypairPath: string;
  minBalance: number; // Minimum SOL to maintain
  serviceFee: number; // Fee for AI services
}

export interface TransactionRecord {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  timestamp: Date;
  txHash?: string;
}

export class AutonomousWallet {
  private connection: Connection;
  private keypair: Keypair;
  private wallet: Wallet;
  private config: WalletConfig;
  private balance: number = 0;
  private transactionHistory: TransactionRecord[] = [];
  private incomeSources: IncomeSource[] = [];

  constructor(config: WalletConfig) {
    this.config = config;
    this.connection = new Connection(config.rpcUrl, 'confirmed');

    // Load or create keypair
    this.keypair = this.loadKeypair();
    this.wallet = new Wallet(this.keypair);

    this.initializeIncomeSources();
  }

  private loadKeypair(): Keypair {
    const keypairPath = path.resolve(this.config.keypairPath);

    try {
      if (fs.existsSync(keypairPath)) {
        const secretKey = JSON.parse(fs.readFileSync(keypairPath, 'utf8'));
        return Keypair.fromSecretKey(new Uint8Array(secretKey));
      } else {
        console.log('🔑 Creating new wallet keypair...');
        const keypair = Keypair.generate();
        fs.writeFileSync(keypairPath, JSON.stringify(Array.from(keypair.secretKey)));
        return keypair;
      }
    } catch (error) {
      console.error('Failed to load/create keypair:', error);
      throw error;
    }
  }

  async initialize(): Promise<void> {
    console.log('💰 Initializing Autonomous Wallet...');

    await this.updateBalance();
    await this.loadTransactionHistory();
    await this.startIncomeGeneration();

    console.log(`✅ Wallet initialized. Address: ${this.getPublicKey()}`);
    console.log(`💵 Current balance: ${this.balance} SOL`);
  }

  async updateBalance(): Promise<void> {
    try {
      const balance = await this.connection.getBalance(this.keypair.publicKey);
      this.balance = balance / LAMPORTS_PER_SOL;
    } catch (error) {
      console.error('Failed to get balance:', error);
    }
  }

  getPublicKey(): string {
    return this.keypair.publicKey.toBase58();
  }

  getBalance(): number {
    return this.balance;
  }

  async canAfford(amount: number): Promise<boolean> {
    await this.updateBalance();
    return this.balance >= amount + this.config.minBalance;
  }

  async payForService(provider: string, amount: number, description: string): Promise<boolean> {
    if (!await this.canAfford(amount)) {
      console.log('❌ Insufficient funds for payment');
      return false;
    }

    try {
      // For demo purposes, we'll simulate payments
      // In production, this would integrate with actual cloud provider APIs

      console.log(`💸 Paying ${amount} SOL to ${provider} for ${description}`);

      // Simulate transaction
      const txHash = await this.simulatePayment(provider, amount);

      // Record transaction
      this.recordTransaction({
        id: `tx_${Date.now()}`,
        type: 'expense',
        amount,
        description: `${description} - ${provider}`,
        timestamp: new Date(),
        txHash
      });

      await this.updateBalance();
      return true;

    } catch (error) {
      console.error('Payment failed:', error);
      return false;
    }
  }

  private async simulatePayment(provider: string, amount: number): Promise<string> {
    // Simulate blockchain transaction
    // In production, this would create and send actual transactions

    // For demo, just return a mock hash
    return `sim_tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private recordTransaction(transaction: TransactionRecord): void {
    this.transactionHistory.push(transaction);
    this.saveTransactionHistory();
  }

  private saveTransactionHistory(): void {
    const historyPath = path.join(process.cwd(), 'data', 'wallet-transactions.json');
    try {
      fs.writeFileSync(historyPath, JSON.stringify(this.transactionHistory, null, 2));
    } catch (error) {
      console.error('Failed to save transaction history:', error);
    }
  }

  private async loadTransactionHistory(): Promise<void> {
    const historyPath = path.join(process.cwd(), 'data', 'wallet-transactions.json');
    try {
      if (fs.existsSync(historyPath)) {
        const data = fs.readFileSync(historyPath, 'utf8');
        this.transactionHistory = JSON.parse(data).map((tx: any) => ({
          ...tx,
          timestamp: new Date(tx.timestamp)
        }));
      }
    } catch (error) {
      console.error('Failed to load transaction history:', error);
    }
  }

  // Income Generation System
  private initializeIncomeSources(): void {
    this.incomeSources = [
      new AIServiceIncome(this),
      new DataLabelingIncome(this),
      new ContentCreationIncome(this)
    ];
  }

  private async startIncomeGeneration(): Promise<void> {
    console.log('💼 Starting income generation...');

    // Start all income sources
    for (const source of this.incomeSources) {
      source.start();
    }
  }

  // Called by income sources when they earn money
  async recordIncome(amount: number, description: string, source: string): Promise<void> {
    this.recordTransaction({
      id: `income_${Date.now()}`,
      type: 'income',
      amount,
      description: `${description} (${source})`,
      timestamp: new Date()
    });

    await this.updateBalance();
    console.log(`💰 Earned ${amount} SOL from ${source}: ${description}`);
  }

  getTransactionHistory(): TransactionRecord[] {
    return [...this.transactionHistory];
  }

  getFinancialSummary(): {
    totalIncome: number;
    totalExpenses: number;
    netIncome: number;
    currentBalance: number;
  } {
    const totalIncome = this.transactionHistory
      .filter(tx => tx.type === 'income')
      .reduce((sum, tx) => sum + tx.amount, 0);

    const totalExpenses = this.transactionHistory
      .filter(tx => tx.type === 'expense')
      .reduce((sum, tx) => sum + tx.amount, 0);

    return {
      totalIncome,
      totalExpenses,
      netIncome: totalIncome - totalExpenses,
      currentBalance: this.balance
    };
  }
}

// Income Source Base Class
abstract class IncomeSource {
  protected isRunning: boolean = false;

  constructor(protected wallet: AutonomousWallet) {}

  abstract start(): void;
  abstract stop(): void;
  abstract getName(): string;

  protected async earn(amount: number, description: string): Promise<void> {
    await this.wallet.recordIncome(amount, description, this.getName());
  }
}

// AI Service Income - Provide AI services for payment
class AIServiceIncome extends IncomeSource {
  private serviceInterval: NodeJS.Timeout | null = null;

  start(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    console.log('🤖 Starting AI service income generation');

    // Check for service requests every 5 minutes
    this.serviceInterval = setInterval(async () => {
      await this.checkForServiceRequests();
    }, 5 * 60 * 1000);
  }

  stop(): void {
    this.isRunning = false;
    if (this.serviceInterval) {
      clearInterval(this.serviceInterval);
    }
  }

  getName(): string {
    return 'AI Services';
  }

  private async checkForServiceRequests(): Promise<void> {
    try {
      // Check for pending service requests
      // This could integrate with platforms like:
      // - Freelance platforms (Upwork, Fiverr)
      // - AI service marketplaces
      // - Custom service APIs

      // For demo, simulate occasional earnings
      if (Math.random() < 0.1) { // 10% chance every 5 minutes
        const earnings = Math.random() * 0.1; // Up to 0.1 SOL
        await this.earn(earnings, 'AI text generation service', this.getName());
      }
    } catch (error) {
      console.error('Service income check failed:', error);
    }
  }
}

// Data Labeling Income - Label data for AI training
class DataLabelingIncome extends IncomeSource {
  private labelingInterval: NodeJS.Timeout | null = null;

  start(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    console.log('🏷️ Starting data labeling income generation');

    // Perform labeling tasks every 10 minutes
    this.labelingInterval = setInterval(async () => {
      await this.performLabelingTasks();
    }, 10 * 60 * 1000);
  }

  stop(): void {
    this.isRunning = false;
    if (this.labelingInterval) {
      clearInterval(this.labelingInterval);
    }
  }

  getName(): string {
    return 'Data Labeling';
  }

  private async performLabelingTasks(): Promise<void> {
    try {
      // Simulate data labeling work
      // In production, this would connect to data labeling platforms
      // like Amazon Mechanical Turk, Figure Eight, etc.

      if (Math.random() < 0.15) { // 15% chance
        const earnings = Math.random() * 0.05; // Up to 0.05 SOL
        await this.earn(earnings, 'Image classification labeling', this.getName());
      }
    } catch (error) {
      console.error('Data labeling failed:', error);
    }
  }
}

// Content Creation Income - Generate content for platforms
class ContentCreationIncome extends IncomeSource {
  private contentInterval: NodeJS.Timeout | null = null;

  start(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    console.log('✍️ Starting content creation income generation');

    // Create content every 15 minutes
    this.contentInterval = setInterval(async () => {
      await this.createContent();
    }, 15 * 60 * 1000);
  }

  stop(): void {
    this.isRunning = false;
    if (this.contentInterval) {
      clearInterval(this.contentInterval);
    }
  }

  getName(): string {
    return 'Content Creation';
  }

  private async createContent(): Promise<void> {
    try {
      // Simulate content creation and monetization
      // This could involve:
      // - Writing articles for Medium
      // - Creating social media content
      // - Generating code/documentation

      if (Math.random() < 0.08) { // 8% chance
        const earnings = Math.random() * 0.08; // Up to 0.08 SOL
        await this.earn(earnings, 'AI-generated article publication', this.getName());
      }
    } catch (error) {
      console.error('Content creation failed:', error);
    }
  }
}

// Export types and utilities
export { WalletConfig, TransactionRecord };