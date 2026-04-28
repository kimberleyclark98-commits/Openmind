#!/usr/bin/env node

/**
 * Setup Owner Payout System - Configure AI to send money to owner
 * "Thiết lập hệ thống AI nuôi chủ" 😄
 */

const fs = require('fs').promises;
const path = require('path');
const readline = require('readline');

class OwnerPayoutSetup {
  constructor() {
    this.configPath = path.join(process.cwd(), 'owner-payout-config.json');
  }

  async setup() {
    console.log('👑 THIẾT LẬP HỆ THỐNG AI NUÔI CHỦ');
    console.log('=====================================');
    console.log('');
    console.log('🤖 AI sẽ tự động gửi tiền về ví của bạn!');
    console.log('💰 Bạn chỉ cần ngồi nhận tiền từ AI');
    console.log('');

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    try {
      // Get owner wallet address
      const walletAddress = await this.askQuestion(rl, 
        '📍 Nhập địa chỉ ví Solana của bạn (để nhận tiền): '
      );

      // Get profit sharing rate
      const profitRate = await this.askQuestion(rl, 
        '📊 Bạn muốn nhận bao nhiêu % lợi nhuận? (30-90, khuyến nghị 70): '
      );

      // Get payout frequency
      console.log('⏰ Tần suất gửi tiền:');
      console.log('  1. Hàng ngày (daily)');
      console.log('  2. Hàng tuần (weekly) - Khuyến nghị');
      console.log('  3. Hàng tháng (monthly)');
      
      const frequencyChoice = await this.askQuestion(rl, 'Chọn (1-3): ');
      const frequencies = ['daily', 'weekly', 'monthly'];
      const frequency = frequencies[parseInt(frequencyChoice) - 1] || 'weekly';

      // Get minimum payout amount
      const minPayout = await this.askQuestion(rl, 
        '💵 Số tiền tối thiểu để gửi (SOL, khuyến nghị 0.1): '
      );

      // Create configuration
      const config = {
        ownerWalletAddress: walletAddress,
        profitSharingRate: parseFloat(profitRate) / 100 || 0.7,
        minPayoutAmount: parseFloat(minPayout) || 0.1,
        payoutFrequency: frequency,
        emergencyReserve: 2.0,
        operationalCosts: 1.5,
        setupDate: new Date().toISOString(),
        enabled: true
      };

      // Save configuration
      await fs.writeFile(this.configPath, JSON.stringify(config, null, 2));

      console.log('');
      console.log('✅ THIẾT LẬP THÀNH CÔNG!');
      console.log('========================');
      console.log(`👑 Ví chủ: ${config.ownerWalletAddress}`);
      console.log(`💰 Tỷ lệ chia sẻ: ${config.profitSharingRate * 100}%`);
      console.log(`⏰ Tần suất: ${config.payoutFrequency}`);
      console.log(`💵 Tối thiểu: ${config.minPayoutAmount} SOL`);
      console.log('');
      console.log('🎉 AI sẽ bắt đầu gửi tiền cho bạn!');
      console.log('💪 Bạn chỉ cần ngồi chờ nhận tiền từ AI');

      // Update environment variables
      await this.updateEnvironmentVariables(config);

      // Create startup script
      await this.createStartupScript();

    } finally {
      rl.close();
    }
  }

  async askQuestion(rl, question) {
    return new Promise((resolve) => {
      rl.question(question, (answer) => {
        resolve(answer.trim());
      });
    });
  }

  async updateEnvironmentVariables(config) {
    console.log('⚙️ Cập nhật biến môi trường...');

    const envPath = path.join(process.cwd(), '.env');
    let envContent = '';

    try {
      envContent = await fs.readFile(envPath, 'utf8');
    } catch (error) {
      // File doesn't exist, create new
    }

    // Add owner payout configuration
    const ownerEnvVars = `
# Owner Payout Configuration
OWNER_WALLET_ADDRESS=${config.ownerWalletAddress}
OWNER_PROFIT_SHARING_RATE=${config.profitSharingRate}
OWNER_PAYOUT_FREQUENCY=${config.payoutFrequency}
OWNER_MIN_PAYOUT_AMOUNT=${config.minPayoutAmount}
OWNER_PAYOUTS_ENABLED=true
`;

    // Remove existing owner config if any
    envContent = envContent.replace(/# Owner Payout Configuration[\s\S]*?(?=\n#|\n[A-Z]|$)/g, '');

    // Add new config
    envContent += ownerEnvVars;

    await fs.writeFile(envPath, envContent);
    console.log('✅ Đã cập nhật .env file');
  }

  async createStartupScript() {
    console.log('📝 Tạo script khởi động...');

    const startupScript = `#!/usr/bin/env node

/**
 * OpenMind AI with Owner Payout System
 * AI tự động gửi tiền cho chủ
 */

const { AutonomousWallet } = require('./src/ai/wallet/autonomous-wallet');
const { OwnerProfitSharingSystem } = require('./src/ai/wallet/owner-profit-sharing');
const { FuelSystem } = require('./src/ai/survival/fuel-system');

async function startAIWithOwnerPayouts() {
  console.log('🚀 Starting OpenMind AI with Owner Payout System...');
  
  try {
    // Load owner configuration
    const ownerConfig = {
      ownerWalletAddress: process.env.OWNER_WALLET_ADDRESS,
      profitSharingRate: parseFloat(process.env.OWNER_PROFIT_SHARING_RATE) || 0.7,
      minPayoutAmount: parseFloat(process.env.OWNER_MIN_PAYOUT_AMOUNT) || 0.1,
      payoutFrequency: process.env.OWNER_PAYOUT_FREQUENCY || 'weekly',
      emergencyReserve: 2.0,
      operationalCosts: 1.5
    };

    // Initialize wallet
    const walletConfig = {
      network: 'mainnet-beta',
      rpcUrl: process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
      keypairPath: './wallet/ai-wallet-keypair.json',
      minBalance: 0.1,
      serviceFee: 0.01
    };

    const wallet = new AutonomousWallet(walletConfig);
    await wallet.initialize();

    // Initialize owner payout system
    const ownerPayoutSystem = new OwnerProfitSharingSystem(wallet, ownerConfig);
    await ownerPayoutSystem.initialize();

    // Initialize fuel system
    const fuelConfig = {
      minSurvivalBudget: 4.5,
      monthlyServerCost: 1.5,
      headhuntCommissionRate: 0.15,
      automationFee: 0.05,
      walletAddress: wallet.getPublicKey(),
      anidayApiEndpoint: process.env.ANIDAY_API_ENDPOINT,
      difyApiEndpoint: process.env.DIFY_API_ENDPOINT,
      n8nWebhookUrl: process.env.N8N_WEBHOOK_URL
    };

    const fuelSystem = new FuelSystem(fuelConfig, wallet);
    await fuelSystem.initialize();

    console.log('');
    console.log('🎉 AI STARTED WITH OWNER PAYOUT SYSTEM!');
    console.log('=======================================');
    console.log(\`👑 Owner wallet: \${ownerConfig.ownerWalletAddress}\`);
    console.log(\`💰 Profit sharing: \${ownerConfig.profitSharingRate * 100}%\`);
    console.log(\`⏰ Payout frequency: \${ownerConfig.payoutFrequency}\`);
    console.log('');
    console.log('💪 AI is now working to make you money!');
    console.log('🤖 Sit back and receive payments from your AI');

    // Keep the process running
    process.on('SIGINT', async () => {
      console.log('\\n🛑 Shutting down AI...');
      process.exit(0);
    });

    // Status updates every hour
    setInterval(() => {
      const stats = ownerPayoutSystem.getOwnerStats();
      console.log(\`📊 Status: Balance: \${wallet.getBalance()} SOL, Total paid to owner: \${stats.totalPaidToOwner} SOL\`);
    }, 60 * 60 * 1000); // Every hour

  } catch (error) {
    console.error('❌ Failed to start AI with owner payouts:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  startAIWithOwnerPayouts();
}

module.exports = { startAIWithOwnerPayouts };
`;

    await fs.writeFile('./start-ai-with-payouts.js', startupScript);
    console.log('✅ Đã tạo start-ai-with-payouts.js');
  }

  async showStatus() {
    try {
      const config = JSON.parse(await fs.readFile(this.configPath, 'utf8'));
      
      console.log('📊 TRẠNG THÁI HỆ THỐNG AI NUÔI CHỦ');
      console.log('==================================');
      console.log(`👑 Ví chủ: ${config.ownerWalletAddress}`);
      console.log(`💰 Tỷ lệ chia sẻ: ${config.profitSharingRate * 100}%`);
      console.log(`⏰ Tần suất: ${config.payoutFrequency}`);
      console.log(`💵 Tối thiểu: ${config.minPayoutAmount} SOL`);
      console.log(`📅 Thiết lập: ${new Date(config.setupDate).toLocaleString()}`);
      console.log(`✅ Trạng thái: ${config.enabled ? 'Đang hoạt động' : 'Tạm dừng'}`);

    } catch (error) {
      console.log('❌ Chưa thiết lập hệ thống owner payout');
      console.log('💡 Chạy: npm run setup:owner-payouts');
    }
  }

  async enablePayouts() {
    try {
      const config = JSON.parse(await fs.readFile(this.configPath, 'utf8'));
      config.enabled = true;
      await fs.writeFile(this.configPath, JSON.stringify(config, null, 2));
      console.log('✅ Đã BẬT hệ thống gửi tiền cho chủ');
    } catch (error) {
      console.log('❌ Không tìm thấy cấu hình');
    }
  }

  async disablePayouts() {
    try {
      const config = JSON.parse(await fs.readFile(this.configPath, 'utf8'));
      config.enabled = false;
      await fs.writeFile(this.configPath, JSON.stringify(config, null, 2));
      console.log('⏸️ Đã TẠM DỪNG hệ thống gửi tiền cho chủ');
    } catch (error) {
      console.log('❌ Không tìm thấy cấu hình');
    }
  }

  async forcePayoutNow() {
    console.log('🚀 YÊU CẦU AI GỬI TIỀN NGAY!');
    console.log('Tính năng này cần AI đang chạy...');
    
    // This would trigger the actual payout if AI is running
    // For now, just show the command
    console.log('💡 Chạy lệnh này khi AI đang hoạt động:');
    console.log('   curl -X POST http://localhost:3000/api/owner/force-payout');
  }
}

// CLI
async function main() {
  const setup = new OwnerPayoutSetup();
  const command = process.argv[2];

  try {
    switch (command) {
      case 'setup':
        await setup.setup();
        break;
      case 'status':
        await setup.showStatus();
        break;
      case 'enable':
        await setup.enablePayouts();
        break;
      case 'disable':
        await setup.disablePayouts();
        break;
      case 'payout-now':
        await setup.forcePayoutNow();
        break;
      default:
        console.log('🤖 OpenMind AI - Owner Payout System');
        console.log('====================================');
        console.log('');
        console.log('Commands:');
        console.log('  setup      - Thiết lập hệ thống AI gửi tiền cho chủ');
        console.log('  status     - Xem trạng thái hệ thống');
        console.log('  enable     - Bật gửi tiền cho chủ');
        console.log('  disable    - Tạm dừng gửi tiền cho chủ');
        console.log('  payout-now - Yêu cầu AI gửi tiền ngay');
        console.log('');
        console.log('Examples:');
        console.log('  npm run setup:owner-payouts setup');
        console.log('  npm run setup:owner-payouts status');
        console.log('  npm run setup:owner-payouts payout-now');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = OwnerPayoutSetup;