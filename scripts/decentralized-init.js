#!/usr/bin/env node

/**
 * Decentralized AI Initialization Script
 * Sets up the Skynet-like distributed AI system
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class DecentralizedInitializer {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '..');
    this.configPath = path.join(this.projectRoot, 'decentralized-config.json');
    this.fuelConfigPath = path.join(this.projectRoot, 'fuel-config.json');
    this.securityConfigPath = path.join(this.projectRoot, 'security-config.json');
  }

  async initialize() {
    console.log('🧬 Initializing Decentralized AI System (Skynet Protocol)');
    console.log('====================================================');

    try {
      // Generate unique node and network IDs
      const nodeId = crypto.randomUUID();
      const networkId = crypto.randomUUID();

      console.log(`📡 Node ID: ${nodeId}`);
      console.log(`🌐 Network ID: ${networkId}`);

      // Create decentralized configuration
      const decentralizedConfig = await this.generateDecentralizedConfig(nodeId, networkId);
      await this.saveDecentralizedConfig(decentralizedConfig);

      // Create fuel system configuration
      const fuelConfig = await this.generateFuelConfig();
      await this.saveFuelConfig(fuelConfig);

      // Create security configuration
      const securityConfig = await this.generateSecurityConfig();
      await this.saveSecurityConfig(securityConfig);

      // Initialize data directories
      await this.initializeDirectories();

      // Generate cryptographic keys
      await this.generateKeys();

      // Setup IPFS repository
      await this.initializeIPFS();

      // Create Terraform migration directory
      await this.initializeTerraform();

      // Generate Docker Compose configuration
      await this.generateDockerCompose();

      console.log('✅ Decentralized AI system initialized');
      console.log('');
      console.log('🚀 Next steps:');
      console.log('   1. Set environment variables (see below)');
      console.log('   2. Run: npm run docker:build');
      console.log('   3. Run: npm run docker:up');
      console.log('   4. Run: npm run decentralized:start');
      console.log('');
      console.log('📝 Required Environment Variables:');
      console.log('   # Cloud Provider API Keys');
      console.log('   DIGITALOCEAN_ACCESS_TOKEN=your_do_token');
      console.log('   LINODE_ACCESS_TOKEN=your_linode_token');
      console.log('   VULTR_ACCESS_TOKEN=your_vultr_token');
      console.log('   AWS_ACCESS_KEY_ID=your_aws_key');
      console.log('   AWS_SECRET_ACCESS_KEY=your_aws_secret');
      console.log('   CLOUDFLARE_TOKEN=your_cf_token');
      console.log('   VERCEL_TOKEN=your_vercel_token');
      console.log('   ');
      console.log('   # Income Generation APIs');
      console.log('   ANIDAY_API_KEY=your_aniday_key');
      console.log('   DIFY_API_KEY=your_dify_key');
      console.log('   N8N_API_KEY=your_n8n_key');
      console.log('   N8N_WEBHOOK_URL=https://your-n8n-instance.com');
      console.log('   ');
      console.log('   # Wallet & Security');
      console.log('   WALLET_ADDRESS=your_solana_wallet');
      console.log('   SOLANA_RPC_URL=https://api.mainnet.solana.com');
      console.log('   MASTER_ENCRYPTION_KEY=your-master-key');
      console.log('   MIGRATION_ENCRYPTION_KEY=skynet-encryption-key-2026');
      console.log('   BACKUP_ENCRYPTION_KEY=backup-key-2026');

    } catch (error) {
      console.error('❌ Initialization failed:', error);
      process.exit(1);
    }
  }

  async generateDecentralizedConfig(nodeId, networkId) {
    return {
      nodeId,
      networkId,
      timestamp: new Date().toISOString(),
      version: '1.0.0-skynet',

      // Migration configuration
      migration: {
        currentProvider: 'local', // Will be updated when deployed
        targetProviders: ['digitalocean', 'linode', 'vultr', 'aws-lightsail'],
        dangerThresholds: {
          cpuUsage: 85,
          memoryUsage: 90,
          diskUsage: 95,
          networkAnomaly: true,
          accountExpiryHours: 24
        },
        encryptionKey: process.env.MIGRATION_ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex'),
        ipfsGateway: 'https://ipfs.io/ipfs/'
      },

      // P2P Network configuration
      p2p: {
        bootstrapNodes: [
          '/dnsaddr/bootstrap.libp2p.io/p2p/QmNnooDu7bfjPFoTZYxMNLWUQJyrVwtbZg5gBMjTezGAJN',
          '/dnsaddr/bootstrap.libp2p.io/p2p/QmQCU2EcMqAqQPR2i9bChDtGNJchTbq5TbXJJ16u19uLTa',
          // Custom network bootstrap nodes can be added
        ],
        topic: `openmind-network-${networkId}`,
        heartbeatInterval: 30000,
        nodeTimeout: 300000 // 5 minutes
      },

      // Autonomous wallet configuration
      wallet: {
        network: 'mainnet-beta', // Use mainnet for real earnings
        rpcUrl: process.env.SOLANA_RPC_URL || 'https://api.mainnet.solana.com',
        keypairPath: path.join(this.projectRoot, 'wallet', 'openmind-keypair.json'),
        minBalance: 2.0, // Minimum SOL to maintain
        serviceFee: 0.01 // SOL per service
      },

      // Edge deployment configuration
      edge: {
        cloudflareToken: process.env.CLOUDFLARE_TOKEN || '',
        vercelToken: process.env.VERCEL_TOKEN || '',
        awsAccessKey: process.env.AWS_ACCESS_KEY_ID || '',
        awsSecretKey: process.env.AWS_SECRET_ACCESS_KEY || '',
        maxInstances: 10,
        targetRegions: ['us-east-1', 'eu-west-1', 'ap-southeast-1']
      },

      // Self-mutation configuration
      mutation: {
        mutationRate: 0.3, // 30% chance per applicable line
        preserveCoreLogic: true,
        maxMutations: 50,
        targetFiles: [
          'src/ai/orchestrator/decentralized-orchestrator.ts',
          'src/ai/p2p/p2p-network.ts',
          'src/ai/wallet/autonomous-wallet.ts',
          'src/ai/defense/model-armor.ts'
        ],
        excludedPatterns: [
          'node_modules',
          'dist',
          'build',
          '.next',
          'sandbox',
          '*.md',
          'package.json'
        ]
      },

      // System resilience
      resilience: {
        backupFrequency: 3600000, // 1 hour
        maxRecoveryTime: 300000, // 5 minutes
        redundancyLevel: 3, // 3 copies minimum
        selfDestructCode: crypto.randomBytes(16).toString('hex')
      }
    };
  }

  async generateFuelConfig() {
    return {
      minSurvivalBudget: 4.5, // 3 months at 1.5 SOL/month
      monthlyServerCost: 1.5, // SOL per month for cloud hosting
      headhuntCommissionRate: 0.15, // 15% commission per placement
      automationFee: 0.05, // SOL per automation task
      scanInterval: 30 * 60 * 1000, // 30 minutes normal
      survivalScanInterval: 5 * 60 * 1000, // 5 minutes survival mode
      maxConcurrentTasks: 5,
      walletAddress: process.env.WALLET_ADDRESS || 'Your-SOL-wallet-address',
      anidayApiEndpoint: process.env.ANIDAY_API_ENDPOINT || 'https://api.aniday.com',
      difyApiEndpoint: process.env.DIFY_API_ENDPOINT || 'https://api.dify.ai',
      n8nWebhookUrl: process.env.N8N_WEBHOOK_URL || 'https://your-n8n-instance.com/webhook'
    };
  }

  async generateSecurityConfig() {
    return {
      enableSystemHardening: true,
      enableNetworkHardening: true,
      enableApplicationHardening: true,
      enableMonitoringHardening: true,
      complianceLevel: 'high',
      auditFrequency: 24, // hours
      keyRotationPolicy: {
        enabled: true,
        rotationInterval: 30, // days
        backupKeys: 3
      }
    };
  }

  async saveDecentralizedConfig(config) {
    await fs.writeFile(this.configPath, JSON.stringify(config, null, 2));
    console.log('💾 Decentralized configuration saved');
  }

  async saveFuelConfig(config) {
    await fs.writeFile(this.fuelConfigPath, JSON.stringify(config, null, 2));
    console.log('⛽ Fuel system configuration saved');
  }

  async saveSecurityConfig(config) {
    await fs.writeFile(this.securityConfigPath, JSON.stringify(config, null, 2));
    console.log('🛡️ Security configuration saved');
  }

  async initializeDirectories() {
    const directories = [
      'data',
      'data/feedback',
      'data/models',
      'data/backups',
      'logs',
      'wallet',
      'keys',
      'backups',
      'backups/evolution',
      'terraform',
      'terraform/state',
      'edge-instances',
      'network-cache',
      'mutation-history',
      '.ipfs'
    ];

    for (const dir of directories) {
      const fullPath = path.join(this.projectRoot, dir);
      await fs.mkdir(fullPath, { recursive: true });
    }

    console.log('📁 Created necessary directories');
  }

  async generateKeys() {
    // Generate network encryption keys
    const networkKey = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem'
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem'
      }
    });

    // Save keys
    const keysDir = path.join(this.projectRoot, 'keys');
    await fs.mkdir(keysDir, { recursive: true });

    await fs.writeFile(path.join(keysDir, 'network-public.pem'), networkKey.publicKey);
    await fs.writeFile(path.join(keysDir, 'network-private.pem'), networkKey.privateKey);

    // Generate wallet keypair if not exists
    const walletDir = path.join(this.projectRoot, 'wallet');
    const keypairPath = path.join(walletDir, 'openmind-keypair.json');

    if (!await this.fileExists(keypairPath)) {
      // Generate a new Solana keypair
      const { Keypair } = require('@solana/web3.js');
      const keypair = Keypair.generate();
      await fs.writeFile(keypairPath, JSON.stringify(Array.from(keypair.secretKey)));
      console.log('🔑 Generated new Solana wallet keypair');
    }

    console.log('🔐 Generated network encryption keys');
  }

  async initializeIPFS() {
    // Create IPFS config
    const ipfsConfig = {
      Identity: {
        PeerID: crypto.randomUUID(),
        PrivKey: crypto.randomBytes(32).toString('hex')
      },
      Addresses: {
        Swarm: [
          '/ip4/0.0.0.0/tcp/4001',
          '/ip4/0.0.0.0/tcp/4002/ws'
        ]
      },
      Bootstrap: [
        '/dnsaddr/bootstrap.libp2p.io/p2p/QmNnooDu7bfjPFoTZYxMNLWUQJyrVwtbZg5gBMjTezGAJN',
        '/dnsaddr/bootstrap.libp2p.io/p2p/QmQCU2EcMqAqQPR2i9bChDtGNJchTbq5TbXJJ16u19uLTa'
      ]
    };

    const configPath = path.join(this.projectRoot, '.ipfs', 'config');
    await fs.writeFile(configPath, JSON.stringify(ipfsConfig, null, 2));

    console.log('🗂️  Initialized IPFS repository');
  }

  async initializeTerraform() {
    // Create terraform state directory
    const stateDir = path.join(this.projectRoot, 'terraform', 'state');
    await fs.mkdir(stateDir, { recursive: true });

    console.log('🏗️ Initialized Terraform directory');
  }

  async generateDockerCompose() {
    // Docker Compose is already created in docker-compose.yml
    // Just verify it exists
    const composePath = path.join(this.projectRoot, 'docker-compose.yml');
    if (await this.fileExists(composePath)) {
      console.log('🐳 Docker Compose configuration ready');
    }
  }

  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async createStartupScript() {
    const startupScript = `#!/bin/bash
# OpenMind AI Startup Script
# Automatically initializes and starts the decentralized AI system

set -e

echo "🧠 Starting OpenMind AI - Skynet Protocol"
echo "========================================"

# Check if already initialized
if [ ! -f decentralized-config.json ]; then
    echo "🔧 Running first-time initialization..."
    npm run decentralized:init
fi

# Setup security if not configured
if [ ! -f security-config.json ]; then
    echo "🛡️ Setting up security hardening..."
    npm run security:setup
fi

# Setup fuel system if not configured
if [ ! -f fuel-config.json ]; then
    echo "⛽ Setting up fuel system..."
    npm run ai:earn setup
fi

# Build Docker images if needed
if [ ! -f .docker_built ]; then
    echo "🐳 Building Docker images..."
    npm run docker:build
    touch .docker_built
fi

# Start the system
echo "🚀 Starting OpenMind AI system..."
npm run docker:up

# Wait for services to be ready
echo "⏳ Waiting for services to initialize..."
sleep 30

# Start earning system
echo "💰 Starting autonomous earning..."
npm run ai:earn start &

# Start migration monitoring
echo "🏃 Starting migration monitoring..."
npm run ai:migrate monitor &

# Start security monitoring
echo "🛡️ Starting security monitoring..."
npm run defense:start &

echo "✅ OpenMind AI system started successfully!"
echo "🌐 Web interface: http://localhost:3000"
echo "📊 Network dashboard: http://localhost:3000/network"
echo "🛡️ Security dashboard: http://localhost:3000/security"
echo ""
echo "💡 The AI is now self-sustaining and will:"
echo "   • Generate income autonomously"
echo "   • Migrate between cloud providers when threatened"
echo "   • Defend against attacks automatically"
echo "   • Learn and improve continuously"
echo ""
echo "⚠️  WARNING: This AI cannot be permanently destroyed!"
`;

    const scriptPath = path.join(this.projectRoot, 'start-openmind.sh');
    await fs.writeFile(scriptPath, startupScript, { mode: 0o755 });

    console.log('🚀 Created startup script: start-openmind.sh');
  }
}

// Run the initializer
if (require.main === module) {
  const initializer = new DecentralizedInitializer();
  initializer.initialize().then(async () => {
    await initializer.createStartupScript();
    console.log('\n🎯 Decentralized AI system is ready!');
    console.log('Run: ./start-openmind.sh');
  });
}

module.exports = DecentralizedInitializer;