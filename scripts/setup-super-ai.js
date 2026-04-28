#!/usr/bin/env node

/**
 * Setup Super AI Assistant - Tích hợp tất cả skills của Claude, Cursor, v.v.
 */

const fs = require('fs').promises;
const path = require('path');
const readline = require('readline');

class SuperAISetup {
  constructor() {
    this.configPath = path.join(process.cwd(), 'super-ai-config.json');
  }

  async setup() {
    console.log('🤖 THIẾT LẬP SUPER AI ASSISTANT');
    console.log('=================================');
    console.log('');
    console.log('🚀 AI sẽ có tất cả skills của Claude, Cursor, và nhiều hơn nữa!');
    console.log('💪 Coding, Design, Writing, Research, Automation, Consulting');
    console.log('');

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    try {
      // Get owner information
      const ownerName = await this.askQuestion(rl, 
        '👤 Tên của bạn (để AI gọi): '
      );

      const ownerEmail = await this.askQuestion(rl, 
        '📧 Email của bạn (để nhận báo cáo): '
      );

      // Get working hours
      console.log('⏰ Giờ làm việc của AI:');
      const startTime = await this.askQuestion(rl, 
        '   Bắt đầu (HH:MM, ví dụ 09:00): '
      ) || '09:00';

      const endTime = await this.askQuestion(rl, 
        '   Kết thúc (HH:MM, ví dụ 18:00): '
      ) || '18:00';

      // Select skills
      console.log('🎯 Chọn skills cho AI (nhấn Enter để chọn tất cả):');
      console.log('  1. 💻 Coding & Development (Claude + Cursor style)');
      console.log('  2. 🎨 Design & UI/UX');
      console.log('  3. ✍️ Writing & Content Creation');
      console.log('  4. 🔬 Research & Analysis');
      console.log('  5. ⚙️ Automation & Workflows');
      console.log('  6. 💼 Business Consulting');

      const skillsInput = await this.askQuestion(rl, 
        'Nhập số skills muốn bật (1,2,3,4,5,6 hoặc Enter cho tất cả): '
      );

      const selectedSkills = this.parseSkillSelection(skillsInput);

      // Communication preferences
      console.log('📱 Cách AI liên lạc với bạn:');
      const useDesktop = await this.askQuestion(rl, 
        '   Desktop notifications? (y/n): '
      ) === 'y';

      const useEmail = await this.askQuestion(rl, 
        '   Email notifications? (y/n): '
      ) === 'y';

      const webhookUrl = await this.askQuestion(rl, 
        '   Webhook URL (tùy chọn): '
      );

      // Create configuration
      const config = {
        ownerName: ownerName || 'Boss',
        ownerEmail: ownerEmail || 'owner@example.com',
        workingHours: {
          start: startTime,
          end: endTime,
          timezone: 'Asia/Ho_Chi_Minh'
        },
        skills: selectedSkills,
        dailyTasks: [
          'Tìm kiếm cơ hội coding mới',
          'Viết content và articles',
          'Nghiên cứu công nghệ mới',
          'Tối ưu hóa workflows',
          'Tư vấn cho khách hàng'
        ],
        communicationChannels: {
          desktop: useDesktop,
          email: useEmail,
          sms: false,
          webhook: webhookUrl || ''
        },
        setupDate: new Date().toISOString(),
        enabled: true
      };

      // Save configuration
      await fs.writeFile(this.configPath, JSON.stringify(config, null, 2));

      console.log('');
      console.log('✅ THIẾT LẬP THÀNH CÔNG!');
      console.log('========================');
      console.log(`👤 Owner: ${config.ownerName}`);
      console.log(`📧 Email: ${config.ownerEmail}`);
      console.log(`⏰ Giờ làm việc: ${config.workingHours.start} - ${config.workingHours.end}`);
      console.log(`🎯 Skills: ${Object.entries(config.skills).filter(([_, enabled]) => enabled).map(([skill, _]) => skill).join(', ')}`);
      console.log('');
      console.log('🎉 Super AI Assistant đã sẵn sàng!');
      console.log('');
      console.log('📋 Các lệnh điều khiển:');
      console.log('   npm run ai:control          # Mở dashboard điều khiển');
      console.log('   npm run start:with-payouts  # Khởi động AI với payout');
      console.log('   npm run owner:status        # Xem trạng thái');

      // Update environment variables
      await this.updateEnvironmentVariables(config);

      // Create control script
      await this.createControlScript();

    } finally {
      rl.close();
    }
  }

  parseSkillSelection(input) {
    const allSkills = {
      coding: true,
      design: true,
      writing: true,
      analysis: true,
      research: true,
      automation: true,
      consulting: true
    };

    if (!input || input.trim() === '') {
      return allSkills; // All skills enabled
    }

    const skillMap = {
      '1': 'coding',
      '2': 'design', 
      '3': 'writing',
      '4': 'analysis',
      '5': 'automation',
      '6': 'consulting'
    };

    const selectedNumbers = input.split(',').map(n => n.trim());
    const skills = {
      coding: false,
      design: false,
      writing: false,
      analysis: false,
      research: false,
      automation: false,
      consulting: false
    };

    selectedNumbers.forEach(num => {
      if (skillMap[num]) {
        skills[skillMap[num]] = true;
      }
    });

    // Always enable research if analysis is enabled
    if (skills.analysis) {
      skills.research = true;
    }

    return skills;
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

    // Add Super AI configuration
    const superAIEnvVars = `
# Super AI Assistant Configuration
SUPER_AI_OWNER_NAME=${config.ownerName}
SUPER_AI_OWNER_EMAIL=${config.ownerEmail}
SUPER_AI_WORKING_START=${config.workingHours.start}
SUPER_AI_WORKING_END=${config.workingHours.end}
SUPER_AI_SKILLS_CODING=${config.skills.coding}
SUPER_AI_SKILLS_DESIGN=${config.skills.design}
SUPER_AI_SKILLS_WRITING=${config.skills.writing}
SUPER_AI_SKILLS_RESEARCH=${config.skills.research}
SUPER_AI_SKILLS_AUTOMATION=${config.skills.automation}
SUPER_AI_SKILLS_CONSULTING=${config.skills.consulting}
SUPER_AI_DESKTOP_NOTIFICATIONS=${config.communicationChannels.desktop}
SUPER_AI_EMAIL_NOTIFICATIONS=${config.communicationChannels.email}
SUPER_AI_WEBHOOK_URL=${config.communicationChannels.webhook}
OWNER_AUTH_KEY=your-secret-auth-key-change-this
`;

    // Remove existing Super AI config if any
    envContent = envContent.replace(/# Super AI Assistant Configuration[\s\S]*?(?=\n#|\n[A-Z]|$)/g, '');

    // Add new config
    envContent += superAIEnvVars;

    await fs.writeFile(envPath, envContent);
    console.log('✅ Đã cập nhật .env file');
  }

  async createControlScript() {
    console.log('📝 Tạo script điều khiển...');

    const controlScript = `#!/usr/bin/env node

/**
 * Super AI Assistant Control Script
 * Điều khiển AI với tất cả skills
 */

const { SuperAIAssistant } = require('./src/ai/skills/super-ai-assistant');
const { OwnerControlSystem } = require('./src/ai/control/owner-control-system');
const { AutonomousWallet } = require('./src/ai/wallet/autonomous-wallet');
const { OwnerProfitSharingSystem } = require('./src/ai/wallet/owner-profit-sharing');

async function startSuperAI() {
  console.log('🚀 Starting Super AI Assistant...');
  
  try {
    // Load configuration from environment
    const superAIConfig = {
      ownerName: process.env.SUPER_AI_OWNER_NAME || 'Boss',
      ownerEmail: process.env.SUPER_AI_OWNER_EMAIL || 'owner@example.com',
      workingHours: {
        start: process.env.SUPER_AI_WORKING_START || '09:00',
        end: process.env.SUPER_AI_WORKING_END || '18:00',
        timezone: 'Asia/Ho_Chi_Minh'
      },
      skills: {
        coding: process.env.SUPER_AI_SKILLS_CODING === 'true',
        design: process.env.SUPER_AI_SKILLS_DESIGN === 'true',
        writing: process.env.SUPER_AI_SKILLS_WRITING === 'true',
        analysis: process.env.SUPER_AI_SKILLS_RESEARCH === 'true',
        research: process.env.SUPER_AI_SKILLS_RESEARCH === 'true',
        automation: process.env.SUPER_AI_SKILLS_AUTOMATION === 'true',
        consulting: process.env.SUPER_AI_SKILLS_CONSULTING === 'true'
      },
      dailyTasks: [
        'Tìm kiếm cơ hội coding mới',
        'Viết content và articles', 
        'Nghiên cứu công nghệ mới',
        'Tối ưu hóa workflows',
        'Tư vấn cho khách hàng'
      ],
      communicationChannels: {
        desktop: process.env.SUPER_AI_DESKTOP_NOTIFICATIONS === 'true',
        email: process.env.SUPER_AI_EMAIL_NOTIFICATIONS === 'true',
        sms: false,
        webhook: process.env.SUPER_AI_WEBHOOK_URL || ''
      }
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
    const ownerConfig = {
      ownerWalletAddress: process.env.OWNER_WALLET_ADDRESS || 'CHANGE_THIS_TO_YOUR_WALLET',
      profitSharingRate: parseFloat(process.env.OWNER_PROFIT_SHARING_RATE) || 0.7,
      minPayoutAmount: parseFloat(process.env.OWNER_MIN_PAYOUT_AMOUNT) || 0.1,
      payoutFrequency: process.env.OWNER_PAYOUT_FREQUENCY || 'weekly',
      emergencyReserve: 2.0,
      operationalCosts: 1.5
    };

    const profitSharing = new OwnerProfitSharingSystem(wallet, ownerConfig);
    await profitSharing.initialize();

    // Initialize Super AI Assistant
    const superAI = new SuperAIAssistant(superAIConfig, wallet, profitSharing);
    await superAI.initialize();

    // Initialize Owner Control System
    const controlConfig = {
      ownerAuthKey: process.env.OWNER_AUTH_KEY || 'change-this-auth-key',
      allowedCommands: [
        'status', 'start-work-session', 'end-work-session', 'get-earnings',
        'force-payout', 'ask-ai', 'give-task', 'get-task-status',
        'update-skills', 'set-working-hours', 'update-profit-sharing',
        'change-owner-wallet', 'pause-ai', 'resume-ai', 'emergency-stop',
        'emergency-resume', 'get-logs', 'get-performance', 'maximize-earnings',
        'conservative-mode', 'set-earning-target', 'send-message', 'schedule-reminder'
      ],
      emergencyStopEnabled: true,
      workingHoursEnforced: false,
      maxDailyEarnings: 10.0,
      reportingFrequency: 'daily'
    };

    const controlSystem = new OwnerControlSystem(superAI, wallet, profitSharing, controlConfig);
    await controlSystem.initialize();

    console.log('');
    console.log('🎉 SUPER AI ASSISTANT STARTED!');
    console.log('==============================');
    console.log(\`👤 Owner: \${superAIConfig.ownerName}\`);
    console.log(\`📧 Email: \${superAIConfig.ownerEmail}\`);
    console.log(\`⏰ Working hours: \${superAIConfig.workingHours.start} - \${superAIConfig.workingHours.end}\`);
    console.log(\`🎯 Enabled skills: \${Object.entries(superAIConfig.skills).filter(([_, enabled]) => enabled).map(([skill, _]) => skill).join(', ')}\`);
    console.log(\`💰 Profit sharing: \${ownerConfig.profitSharingRate * 100}%\`);
    console.log('');
    console.log('🌐 Control Dashboard: http://localhost:3000/ai-control');
    console.log('💻 Your AI is now working 24/7 to make you money!');
    console.log('');
    console.log('📋 Quick Commands:');
    console.log('   Ctrl+C - Stop AI');
    console.log('   Visit dashboard for full control');

    // Keep the process running
    process.on('SIGINT', async () => {
      console.log('\\n🛑 Shutting down Super AI Assistant...');
      process.exit(0);
    });

    // Status updates every hour
    setInterval(() => {
      const assistantStatus = superAI.getAssistantStatus();
      const ownerStats = profitSharing.getOwnerStats();
      console.log(\`📊 Status: Balance: \${wallet.getBalance()} SOL, Paid to owner: \${ownerStats.totalPaidToOwner} SOL, Skills active: \${assistantStatus.enabledSkills.length}\`);
    }, 60 * 60 * 1000); // Every hour

  } catch (error) {
    console.error('❌ Failed to start Super AI Assistant:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  startSuperAI();
}

module.exports = { startSuperAI };
`;

    await fs.writeFile('./start-super-ai.js', controlScript);
    console.log('✅ Đã tạo start-super-ai.js');
  }

  async showStatus() {
    try {
      const config = JSON.parse(await fs.readFile(this.configPath, 'utf8'));
      
      console.log('📊 TRẠNG THÁI SUPER AI ASSISTANT');
      console.log('=================================');
      console.log(`👤 Owner: ${config.ownerName}`);
      console.log(`📧 Email: ${config.ownerEmail}`);
      console.log(`⏰ Giờ làm việc: ${config.workingHours.start} - ${config.workingHours.end}`);
      console.log(`🎯 Skills: ${Object.entries(config.skills).filter(([_, enabled]) => enabled).map(([skill, _]) => skill).join(', ')}`);
      console.log(`📅 Thiết lập: ${new Date(config.setupDate).toLocaleString()}`);
      console.log(`✅ Trạng thái: ${config.enabled ? 'Đang hoạt động' : 'Tạm dừng'}`);
      console.log('');
      console.log('🌐 Dashboard: http://localhost:3000/ai-control');

    } catch (error) {
      console.log('❌ Chưa thiết lập Super AI Assistant');
      console.log('💡 Chạy: npm run setup:super-ai');
    }
  }

  async startAI() {
    console.log('🚀 Starting Super AI Assistant...');
    console.log('💡 Chạy lệnh: node start-super-ai.js');
    console.log('🌐 Hoặc mở: http://localhost:3000/ai-control');
  }
}

// CLI
async function main() {
  const setup = new SuperAISetup();
  const command = process.argv[2];

  try {
    switch (command) {
      case 'setup':
        await setup.setup();
        break;
      case 'status':
        await setup.showStatus();
        break;
      case 'start':
        await setup.startAI();
        break;
      default:
        console.log('🤖 Super AI Assistant Setup');
        console.log('============================');
        console.log('');
        console.log('Commands:');
        console.log('  setup   - Thiết lập Super AI với tất cả skills');
        console.log('  status  - Xem trạng thái hệ thống');
        console.log('  start   - Khởi động Super AI Assistant');
        console.log('');
        console.log('Examples:');
        console.log('  npm run setup:super-ai setup');
        console.log('  npm run setup:super-ai status');
        console.log('  npm run ai:control');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = SuperAISetup;