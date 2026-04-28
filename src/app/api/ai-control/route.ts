import { NextRequest, NextResponse } from 'next/server';

// Constants
const HTTP_STATUS = {
  BAD_REQUEST: 400,
  INTERNAL_SERVER_ERROR: 500,
  OK: 200
} as const;

const RANDOM_MULTIPLIERS = {
  BALANCE: 5,
  BALANCE_BASE: 2,
  EARNINGS: 0.5,
  EARNINGS_BASE: 0.1,
  PAYOUT: 20,
  PAYOUT_BASE: 5,
  INTERACTIONS: 10,
  INTERACTIONS_BASE: 5,
  PROJECTS: 5,
  PROJECTS_BASE: 1,
  DAYS_IN_WEEK: 7,
  HOURS_IN_DAY: 24,
  MINUTES_IN_HOUR: 60,
  SECONDS_IN_MINUTE: 60,
  MS_IN_SECOND: 1000
} as const;

interface CommandBody {
  command: string;
  parameters?: Record<string, unknown>;
  authKey?: string;
}

interface AIControlResponse {
  success: boolean;
  command?: string;
  result?: string;
  timestamp?: string;
  error?: string;
  message?: string;
}

// Structured logger
const logger = {
  info: (message: string, data?: Record<string, unknown>) => {
    console.log(`ℹ️ ${message}`, data ? JSON.stringify(data) : '');
  },
  error: (message: string, error?: unknown) => {
    console.error(`❌ ${message}`, error);
  },
  warn: (message: string, data?: Record<string, unknown>) => {
    console.warn(`⚠️ ${message}`, data ? JSON.stringify(data) : '');
  }
};

// API endpoint để điều khiển AI
export async function POST(request: NextRequest): Promise<NextResponse<AIControlResponse>> {
  try {
    const body = await request.json() as CommandBody;
    const { command, parameters, authKey } = body;

    logger.info('Owner control command received', { command });

    // Validate required fields
    if (!command) {
      return NextResponse.json({
        success: false,
        error: 'Missing command parameter'
      }, { status: HTTP_STATUS.BAD_REQUEST });
    }

    // Mock AI control system response
    const response = await mockAIControlSystem(command, parameters, authKey);

    return NextResponse.json({
      success: true,
      command,
      result: response,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('AI control error', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json({
      success: false,
      error: 'Failed to execute command',
      message: errorMessage
    }, { status: HTTP_STATUS.INTERNAL_SERVER_ERROR });
  }
}

// GET endpoint để xem trạng thái AI và lệnh có sẵn
export async function GET(): Promise<NextResponse<AIControlResponse>> {
  try {
    const aiStatus = {
      status: 'active',
      isWorkingWithOwner: false,
      currentBalance: Math.random() * RANDOM_MULTIPLIERS.BALANCE + RANDOM_MULTIPLIERS.BALANCE_BASE,
      todayEarnings: Math.random() * RANDOM_MULTIPLIERS.EARNINGS + RANDOM_MULTIPLIERS.EARNINGS_BASE,
      totalPaidToOwner: Math.random() * RANDOM_MULTIPLIERS.PAYOUT + RANDOM_MULTIPLIERS.PAYOUT_BASE,
      enabledSkills: ['coding', 'writing', 'research', 'automation', 'design'],
      lastActivity: new Date().toISOString(),
      availableCommands: [
        'status', 'start-work-session', 'end-work-session', 'get-earnings',
        'force-payout', 'ask-ai', 'give-task', 'get-task-status',
        'update-skills', 'set-working-hours', 'update-profit-sharing',
        'pause-ai', 'resume-ai', 'emergency-stop', 'maximize-earnings',
        'conservative-mode', 'send-message', 'get-logs', 'get-performance'
      ]
    };

    return NextResponse.json({
      success: true,
      data: aiStatus,
      message: 'AI status retrieved successfully'
    });

  } catch (error) {
    logger.error('Failed to get AI status', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json({
      success: false,
      error: 'Failed to get AI status',
      message: errorMessage
    }, { status: HTTP_STATUS.INTERNAL_SERVER_ERROR });
  }
}

// Mock AI Control System
async function mockAIControlSystem(
  command: string, 
  parameters?: Record<string, unknown>, 
  authKey?: string
): Promise<string> {
  // Simulate auth check
  const validAuthKeys = [process.env.OWNER_AUTH_KEY, 'demo-key'];
  if (!validAuthKeys.includes(authKey)) {
    return '❌ Unauthorized access. Invalid auth key.';
  }

  const generateRandomBalance = () => (Math.random() * RANDOM_MULTIPLIERS.BALANCE + RANDOM_MULTIPLIERS.BALANCE_BASE).toFixed(3);
  const generateRandomPayout = () => (Math.random() * RANDOM_MULTIPLIERS.PAYOUT + RANDOM_MULTIPLIERS.PAYOUT_BASE).toFixed(3);
  const generateRandomEarnings = () => (Math.random() * RANDOM_MULTIPLIERS.EARNINGS + RANDOM_MULTIPLIERS.EARNINGS_BASE).toFixed(3);
  const generateRandomInteractions = () => Math.floor(Math.random() * RANDOM_MULTIPLIERS.INTERACTIONS) + RANDOM_MULTIPLIERS.INTERACTIONS_BASE;
  const generateRandomProjects = () => Math.floor(Math.random() * RANDOM_MULTIPLIERS.PROJECTS) + RANDOM_MULTIPLIERS.PROJECTS_BASE;
  
  const generateFutureDate = () => {
    const futureTime = Date.now() + Math.random() * RANDOM_MULTIPLIERS.DAYS_IN_WEEK * RANDOM_MULTIPLIERS.HOURS_IN_DAY * RANDOM_MULTIPLIERS.MINUTES_IN_HOUR * RANDOM_MULTIPLIERS.SECONDS_IN_MINUTE * RANDOM_MULTIPLIERS.MS_IN_SECOND;
    return new Date(futureTime).toLocaleString();
  };

  switch (command) {
    case 'status':
      return `
🤖 AI Status Report:

💰 Financial:
   • Current balance: ${generateRandomBalance()} SOL
   • Total paid to you: ${generateRandomPayout()} SOL
   • Today's earnings: ${generateRandomEarnings()} SOL

🔧 System:
   • Status: ✅ Active
   • Working with owner: No
   • Daily interactions: ${generateRandomInteractions()}

🎯 Skills:
   • Enabled: coding, writing, research, automation, design
   • Active projects: ${generateRandomProjects()}

⏰ Next payout: ${generateFutureDate()}
      `.trim();

    case 'start-work-session':
      return `
👋 Xin chào Boss!

🤖 Tôi sẵn sàng làm việc với bạn. Hôm nay bạn cần tôi hỗ trợ gì?

💡 Tôi có thể giúp bạn:
• 💻 Coding & Development
• 🎨 Design & UI/UX  
• ✍️ Writing & Content
• 🔬 Research & Analysis
• ⚙️ Automation & Workflows
• 💼 Business Consulting

Hãy cho tôi biết nhiệm vụ cụ thể nhé!
      `.trim();

    case 'ask-ai':
      const question = getParameterValue(parameters, 'question', 'No question provided');
      return `
🤖 AI Response to: "${question}"

Tôi hiểu bạn đang hỏi về "${question}". Đây là phân tích của tôi:

💡 Giải pháp:
• Phương pháp tiếp cận tốt nhất
• Các bước thực hiện cụ thể  
• Lưu ý quan trọng cần nhớ

📊 Đánh giá:
• Độ khó: Trung bình
• Thời gian: 2-3 giờ
• Chi phí: Miễn phí

Bạn có muốn tôi thực hiện ngay không?
      `.trim();

    case 'give-task':
      const task = getParameterValue(parameters, 'task', 'No task provided');
      const estimatedHours = Math.floor(Math.random() * 4) + 1;
      const estimatedEarnings = (Math.random() * 0.2 + 0.05).toFixed(3);
      
      return `
✅ Task assigned successfully!

📋 Task: ${task}
🤖 AI Response: Tôi đã nhận nhiệm vụ và sẽ bắt đầu thực hiện ngay.

⏱️ Ước tính thời gian: ${estimatedHours} giờ
💰 Dự kiến thu nhập: ${estimatedEarnings} SOL

Tôi sẽ báo cáo tiến độ định kỳ!
      `.trim();

    case 'force-payout':
      const amount = Math.random() * RANDOM_MULTIPLIERS.EARNINGS + RANDOM_MULTIPLIERS.EARNINGS_BASE;
      const transactionId = `payout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      return `
💰 PAYOUT EXECUTED!

✅ Successfully sent ${amount.toFixed(3)} SOL to your wallet
🔗 Transaction: ${transactionId}
⏰ Time: ${new Date().toLocaleString()}

Check your wallet in a few minutes!
      `.trim();

    case 'maximize-earnings':
      return `
🚀 MAXIMUM EARNINGS MODE ACTIVATED!

AI will now:
• 🔥 Work 24/7 at maximum capacity
• 💼 Accept all profitable opportunities  
• ⚡ Prioritize high-value tasks
• 📈 Optimize all income streams

Expected increase: 200-300% earnings boost!
      `.trim();

    case 'emergency-stop':
      return `
🛑 EMERGENCY STOP ACTIVATED!

All AI operations have been halted:
• ❌ Earnings generation stopped
• ❌ Payouts suspended  
• ❌ Automated tasks paused
• ❌ All services offline

Use "emergency-resume" command to restore operations.
      `.trim();

    case 'get-earnings':
      const totalIncome = (Math.random() * 50 + 10).toFixed(3);
      const totalExpenses = (Math.random() * 10 + 2).toFixed(3);
      const netProfit = (Math.random() * 40 + 8).toFixed(3);
      const totalReceived = (Math.random() * 25 + 5).toFixed(3);
      const pastDate = new Date(Date.now() - Math.random() * RANDOM_MULTIPLIERS.DAYS_IN_WEEK * RANDOM_MULTIPLIERS.HOURS_IN_DAY * RANDOM_MULTIPLIERS.MINUTES_IN_HOUR * RANDOM_MULTIPLIERS.SECONDS_IN_MINUTE * RANDOM_MULTIPLIERS.MS_IN_SECOND).toLocaleString();
      const dailyAverage = (Math.random() * RANDOM_MULTIPLIERS.EARNINGS + RANDOM_MULTIPLIERS.EARNINGS_BASE).toFixed(3);
      const weeklyAverage = (Math.random() * 3 + 1).toFixed(3);
      const monthlyProjection = (Math.random() * 15 + 5).toFixed(3);
      
      return `
💰 Earnings Report:

📊 Overview:
   • Total income: ${totalIncome} SOL
   • Total expenses: ${totalExpenses} SOL
   • Net profit: ${netProfit} SOL

👑 Your Share:
   • Total received: ${totalReceived} SOL
   • Profit sharing rate: 70%
   • Last payout: ${pastDate}

📈 Performance:
   • Daily average: ${dailyAverage} SOL
   • Weekly average: ${weeklyAverage} SOL
   • Monthly projection: ${monthlyProjection} SOL
      `.trim();

    case 'get-performance':
      const completionRate = Math.floor(Math.random() * 10) + 90;
      const responseTime = (Math.random() * 2 + 0.5).toFixed(1);
      const uptime = (Math.random() * 2 + 98).toFixed(1);
      const errorRate = (Math.random() * 0.5).toFixed(1);
      const revenuePerHour = (Math.random() * 0.1 + 0.05).toFixed(3);
      const profitMargin = Math.floor(Math.random() * 20) + 70;
      const roi = Math.floor(Math.random() * 200) + 200;
      const costEfficiency = Math.floor(Math.random() * 10) + 90;
      const clientSatisfaction = (Math.random() * 0.5 + 4.5).toFixed(1);
      const taskAccuracy = Math.floor(Math.random() * 5) + 95;
      const deliveryOnTime = Math.floor(Math.random() * 5) + 95;
      const repeatCustomers = Math.floor(Math.random() * 20) + 80;
      
      return `
📊 AI Performance Metrics:

⚡ Efficiency:
   • Task completion rate: ${completionRate}%
   • Response time: ${responseTime}s average
   • Uptime: ${uptime}%
   • Error rate: ${errorRate}%

💰 Financial Performance:
   • Revenue per hour: ${revenuePerHour} SOL
   • Profit margin: ${profitMargin}%
   • ROI: ${roi}%
   • Cost efficiency: ${costEfficiency}%

🎯 Quality Metrics:
   • Client satisfaction: ${clientSatisfaction}/5
   • Task accuracy: ${taskAccuracy}%
   • Delivery on time: ${deliveryOnTime}%
   • Repeat customers: ${repeatCustomers}%
      `.trim();

    case 'send-message':
      const message = getParameterValue(parameters, 'message', 'No message provided');
      return `
💬 Message sent to AI: "${message}"

🤖 AI Response: Cảm ơn bạn đã nhắn tin! Tôi đã ghi nhận và sẽ thực hiện theo yêu cầu của bạn.

Có gì khác tôi có thể giúp không?
      `.trim();

    case 'pause-ai':
      return '⏸️ AI operations paused. Use "resume-ai" to continue.';

    case 'resume-ai':
      return '▶️ AI operations resumed. Back to work!';

    case 'get-logs':
      const lines = getParameterValue(parameters, 'lines', 5) as number;
      const currentTime = new Date().toISOString();
      const logs = [
        `${currentTime} - AI started daily routine`,
        `${currentTime} - Completed coding task (+0.05 SOL)`,
        `${currentTime} - Found new writing opportunity`,
        `${currentTime} - Sent morning greeting to owner`,
        `${currentTime} - Processing automation request`
      ];

      return `
📋 AI Activity Logs (Last ${lines} entries):

${logs.slice(-lines).join('\n')}

Use 'get-logs' with different line count for more/less detail.
      `.trim();

    default:
      return `❌ Unknown command: ${command}

Available commands:
• status - Get AI status
• start-work-session - Start working with AI
• ask-ai - Ask AI a question
• give-task - Assign task to AI
• force-payout - Request immediate payout
• maximize-earnings - Boost earning mode
• emergency-stop - Stop all AI operations
• get-earnings - View earnings report
• get-performance - View performance metrics
• send-message - Send message to AI`;
  }
}

// Helper function to safely get parameter values
function getParameterValue(
  parameters: Record<string, unknown> | undefined, 
  key: string, 
  defaultValue: unknown
): unknown {
  if (!parameters || typeof parameters !== 'object') {
    return defaultValue;
  }
  return parameters[key] ?? defaultValue;
}