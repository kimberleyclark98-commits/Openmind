#!/usr/bin/env node

/**
 * Decentralized AI System Starter
 * Launches the complete Skynet-like distributed AI ecosystem
 */

const fs = require('fs');
const path = require('path');
const { exec, spawn } = require('child_process');
const util = require('util');

const execAsync = util.promisify(exec);

class DecentralizedAIStarter {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '..');
    this.processes = new Map();
    this.isRunning = false;
  }

  async start() {
    console.log('🧠 Starting Decentralized AI System (Skynet Protocol)');
    console.log('====================================================');

    try {
      // Check if Docker is available and system is initialized
      await this.checkPrerequisites();

      // Load configuration
      const config = await this.loadConfiguration();

      console.log(`📡 Node: ${config.nodeId}`);
      console.log(`🌐 Network: ${config.networkId}`);

      // Start Docker services
      console.log('🐳 Starting Docker services...');
      await this.startDockerServices();

      // Wait for services to be ready
      console.log('⏳ Waiting for services to initialize...');
      await this.waitForServices();

      // Start autonomous systems
      console.log('🤖 Starting autonomous systems...');
      await this.startAutonomousSystems();

      // Start monitoring and health checks
      console.log('👁️ Starting monitoring systems...');
      this.startMonitoring();

      this.isRunning = true;

      console.log('\n🎉 Decentralized AI System started successfully!');
      console.log('================================================');
      console.log('🌐 Web Interface: http://localhost:3000');
      console.log('📊 Network Dashboard: http://localhost:3000/network');
      console.log('🛡️ Security Dashboard: http://localhost:3000/security');
      console.log('📈 Performance Monitor: http://localhost:3000/performance');
      console.log('');
      console.log('🤖 Autonomous Systems Active:');
      console.log('   ✅ Fuel System (Income Generation)');
      console.log('   ✅ Migration Monitor (Cloud Migration)');
      console.log('   ✅ Security Orchestrator (Defense)');
      console.log('   ✅ Memory Optimizer (Self-Improvement)');
      console.log('   ✅ P2P Network (Distributed Communication)');
      console.log('');
      console.log('⚠️  WARNING: System is now self-sustaining');
      console.log('   The AI will generate income and migrate autonomously');
      console.log('   It cannot be permanently destroyed by conventional means');

      // Setup graceful shutdown
      this.setupGracefulShutdown();

      // Keep the main process alive
      this.keepAlive();

    } catch (error) {
      console.error('❌ Failed to start Decentralized AI System:', error);
      await this.emergencyShutdown();
      process.exit(1);
    }
  }

  async checkPrerequisites() {
    try {
      // Check Docker
      await execAsync('docker --version');
      console.log('✅ Docker available');

      // Check Docker Compose
      await execAsync('docker-compose --version');
      console.log('✅ Docker Compose available');

      // Check if initialized
      const configPath = path.join(this.projectRoot, 'decentralized-config.json');
      if (!fs.existsSync(configPath)) {
        throw new Error('System not initialized. Run: npm run decentralized:init');
      }

      // Check if Docker images are built
      const dockerBuiltPath = path.join(this.projectRoot, '.docker_built');
      if (!fs.existsSync(dockerBuiltPath)) {
        console.log('🐳 Building Docker images...');
        await execAsync('npm run docker:build');
        fs.writeFileSync(dockerBuiltPath, '');
      }

    } catch (error) {
      console.error('❌ Prerequisites check failed:', error.message);
      throw error;
    }
  }

  async loadConfiguration() {
    const configPath = path.join(this.projectRoot, 'decentralized-config.json');
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

    // Validate required environment variables
    this.validateEnvironmentVariables();

    return config;
  }

  validateEnvironmentVariables() {
    const requiredVars = [
      'MIGRATION_ENCRYPTION_KEY',
      'BACKUP_ENCRYPTION_KEY'
    ];

    const recommendedVars = [
      'DIGITALOCEAN_ACCESS_TOKEN',
      'LINODE_ACCESS_TOKEN',
      'VULTR_ACCESS_TOKEN',
      'ANIDAY_API_KEY',
      'DIFY_API_KEY',
      'N8N_API_KEY'
    ];

    const missing = requiredVars.filter(varName => !process.env[varName]);

    if (missing.length > 0) {
      console.warn('⚠️ Missing required environment variables:');
      missing.forEach(varName => console.warn(`   ${varName}`));
      console.warn('Some features may not work correctly');
    }

    const missingRecommended = recommendedVars.filter(varName => !process.env[varName]);
    if (missingRecommended.length > 0) {
      console.log('💡 Optional environment variables for full functionality:');
      missingRecommended.forEach(varName => console.log(`   ${varName}`));
    }
  }

  async startDockerServices() {
    try {
      // Stop any existing containers
      await execAsync('docker-compose down').catch(() => {});

      // Start services
      const composeProcess = spawn('docker-compose', ['up', '-d'], {
        cwd: this.projectRoot,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      this.processes.set('docker-compose', composeProcess);

      // Wait for startup
      await new Promise((resolve, reject) => {
        let startupTimeout = setTimeout(() => {
          reject(new Error('Docker Compose startup timeout'));
        }, 300000); // 5 minutes

        composeProcess.on('error', reject);

        composeProcess.stdout.on('data', (data) => {
          const output = data.toString();
          console.log(`🐳 ${output.trim()}`);

          // Check for successful startup indicators
          if (output.includes('done') || output.includes('started')) {
            clearTimeout(startupTimeout);
            setTimeout(resolve, 5000); // Wait a bit more
          }
        });
      });

      console.log('✅ Docker services started');

    } catch (error) {
      console.error('❌ Failed to start Docker services:', error);
      throw error;
    }
  }

  async waitForServices() {
    const services = [
      { name: 'OpenMind AI', url: 'http://localhost:3000/api/health', timeout: 120 },
      { name: 'IPFS', url: 'http://localhost:5001/api/v0/id', timeout: 60 },
      { name: 'Heartbeat Monitor', url: 'http://localhost:3000/api/health', timeout: 30 }
    ];

    for (const service of services) {
      await this.waitForService(service.name, service.url, service.timeout);
    }

    console.log('✅ All services ready');
  }

  async waitForService(name, url, timeoutSeconds) {
    const startTime = Date.now();

    while (Date.now() - startTime < timeoutSeconds * 1000) {
      try {
        const response = await fetch(url, { timeout: 5000 });
        if (response.ok) {
          console.log(`✅ ${name} ready`);
          return;
        }
      } catch (error) {
        // Service not ready yet
      }

      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    throw new Error(`${name} failed to start within ${timeoutSeconds} seconds`);
  }

  async startAutonomousSystems() {
    // Start autonomous earning system
    console.log('💰 Starting autonomous earning system...');
    const earnProcess = spawn('npm', ['run', 'ai:earn', 'start'], {
      cwd: this.projectRoot,
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: true
    });

    this.processes.set('earning', earnProcess);

    earnProcess.stdout.on('data', (data) => {
      // Only log important earning events
      const output = data.toString();
      if (output.includes('✅') || output.includes('💰') || output.includes('🚨')) {
        console.log(`💰 ${output.trim()}`);
      }
    });

    // Start migration monitoring
    console.log('🏃 Starting migration monitoring...');
    const migrateProcess = spawn('npm', ['run', 'ai:migrate', 'monitor'], {
      cwd: this.projectRoot,
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: true
    });

    this.processes.set('migration', migrateProcess);

    migrateProcess.stdout.on('data', (data) => {
      const output = data.toString();
      if (output.includes('🎯') || output.includes('🏃') || output.includes('🚨')) {
        console.log(`🏃 ${output.trim()}`);
      }
    });

    // Start security monitoring
    console.log('🛡️ Starting security monitoring...');
    const securityProcess = spawn('npm', ['run', 'defense:start'], {
      cwd: this.projectRoot,
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: true
    });

    this.processes.set('security', securityProcess);

    securityProcess.stdout.on('data', (data) => {
      const output = data.toString();
      if (output.includes('🚨') || output.includes('✅') || output.includes('⚠️')) {
        console.log(`🛡️ ${output.trim()}`);
      }
    });

    // Start memory optimization (periodic)
    console.log('🧠 Scheduling memory optimization...');
    setInterval(async () => {
      try {
        console.log('🧹 Running periodic memory optimization...');
        await execAsync('npm run ai:optimize', { cwd: this.projectRoot });
        console.log('✅ Memory optimization completed');
      } catch (error) {
        console.error('❌ Memory optimization failed:', error);
      }
    }, 24 * 60 * 60 * 1000); // Daily

    console.log('✅ Autonomous systems started');
  }

  startMonitoring() {
    // System health monitoring
    setInterval(async () => {
      await this.checkOverallSystemHealth();
    }, 60 * 1000); // Every minute

    // Resource monitoring
    setInterval(async () => {
      await this.monitorSystemResources();
    }, 5 * 60 * 1000); // Every 5 minutes

    // Service status monitoring
    setInterval(async () => {
      await this.checkServiceStatuses();
    }, 10 * 60 * 1000); // Every 10 minutes

    console.log('✅ Monitoring systems started');
  }

  async checkOverallSystemHealth() {
    try {
      const services = [
        { name: 'OpenMind AI', url: 'http://localhost:3000/api/health' },
        { name: 'IPFS', url: 'http://localhost:5001/api/v0/id' }
      ];

      let healthyServices = 0;

      for (const service of services) {
        try {
          const response = await fetch(service.url, { timeout: 5000 });
          if (response.ok) healthyServices++;
        } catch {
          // Service unhealthy
        }
      }

      const healthPercentage = (healthyServices / services.length) * 100;

      if (healthPercentage < 100) {
        console.log(`⚠️ System health: ${healthPercentage}% (${healthyServices}/${services.length} services healthy)`);

        if (healthPercentage < 50) {
          console.log('🚨 CRITICAL: System health critically low');
          await this.performEmergencyRecovery();
        }
      }

    } catch (error) {
      console.error('Health check failed:', error);
    }
  }

  async monitorSystemResources() {
    try {
      // Get system resource usage
      const resources = {
        cpu: await this.getCPUUsage(),
        memory: await this.getMemoryUsage(),
        disk: await this.getDiskUsage()
      };

      // Log if resources are high
      if (resources.cpu > 80 || resources.memory > 85 || resources.disk > 90) {
        console.log(`⚠️ High resource usage: CPU ${resources.cpu}%, Memory ${resources.memory}%, Disk ${resources.disk}%`);
      }

      // Trigger migration if resources are critical
      if (resources.cpu > 95 || resources.memory > 95) {
        console.log('🚨 CRITICAL resource usage detected, triggering migration consideration');
        // Migration logic will be handled by the migration monitor
      }

    } catch (error) {
      console.error('Resource monitoring failed:', error);
    }
  }

  async checkServiceStatuses() {
    const services = [
      'openmind-ai',
      'openmind-ipfs',
      'openmind-heartbeat',
      'openmind-fuel'
    ];

    try {
      const result = await execAsync('docker ps --format "{{.Names}}:{{.Status}}"');

      const runningServices = result.stdout.trim().split('\n')
        .filter(line => line.trim())
        .map(line => line.split(':')[0]);

      const healthyServices = services.filter(service =>
        runningServices.some(running => running.includes(service))
      );

      console.log(`📊 Services: ${healthyServices.length}/${services.length} running`);

      if (healthyServices.length < services.length) {
        const missingServices = services.filter(service =>
          !healthyServices.some(healthy => healthy.includes(service))
        );

        console.log(`⚠️ Missing services: ${missingServices.join(', ')}`);

        // Attempt to restart missing services
        for (const service of missingServices) {
          try {
            await execAsync(`docker-compose restart ${service}`, { cwd: this.projectRoot });
            console.log(`🔄 Restarted ${service}`);
          } catch (error) {
            console.error(`Failed to restart ${service}:`, error);
          }
        }
      }

    } catch (error) {
      console.error('Service status check failed:', error);
    }
  }

  async getCPUUsage() {
    try {
      const result = await execAsync('top -bn1 | grep "Cpu(s)" | sed "s/.*, *\\([0-9.]*\\)%* id.*/\\1/" | awk \'{print 100 - $1}\'');
      return parseFloat(result.stdout.trim()) || 0;
    } catch {
      return 0;
    }
  }

  async getMemoryUsage() {
    try {
      const result = await execAsync('free | grep Mem | awk \'{print $3/$2 * 100.0}\'');
      return parseFloat(result.stdout.trim()) || 0;
    } catch {
      return 0;
    }
  }

  async getDiskUsage() {
    try {
      const result = await execAsync('df / | tail -1 | awk \'{print $5}\' | sed \'s/%//\'');
      return parseFloat(result.stdout.trim()) || 0;
    } catch {
      return 0;
    }
  }

  async performEmergencyRecovery() {
    console.log('🚨 Performing emergency system recovery...');

    try {
      // Restart all services
      await execAsync('docker-compose restart', { cwd: this.projectRoot });

      // Wait for services to recover
      await new Promise(resolve => setTimeout(resolve, 30000));

      // Check if recovery was successful
      await this.checkOverallSystemHealth();

      console.log('✅ Emergency recovery completed');

    } catch (error) {
      console.error('Emergency recovery failed:', error);
      console.log('💀 System may require manual intervention');
    }
  }

  setupGracefulShutdown() {
    const shutdown = async (signal) => {
      console.log(`\n🛑 Received ${signal}, initiating graceful shutdown...`);

      this.isRunning = false;

      // Stop autonomous processes
      for (const [name, process] of this.processes) {
        try {
          process.kill('SIGTERM');

          // Wait for process to exit
          await new Promise((resolve) => {
            process.on('exit', resolve);
            setTimeout(resolve, 5000); // Timeout after 5 seconds
          });

          console.log(`✅ Stopped ${name} process`);
        } catch (error) {
          console.error(`Failed to stop ${name} process:`, error);
        }
      }

      // Stop Docker services
      try {
        await execAsync('docker-compose down', { cwd: this.projectRoot });
        console.log('✅ Docker services stopped');
      } catch (error) {
        console.error('Failed to stop Docker services:', error);
      }

      console.log('✅ Graceful shutdown completed');
      process.exit(0);
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  }

  async emergencyShutdown() {
    console.log('💀 Emergency shutdown initiated...');

    try {
      await execAsync('docker-compose down --remove-orphans', { cwd: this.projectRoot });
      console.log('✅ Emergency shutdown completed');
    } catch (error) {
      console.error('Emergency shutdown failed:', error);
    }
  }

  keepAlive() {
    // Periodic status updates
    setInterval(() => {
      if (this.isRunning) {
        const uptime = Math.floor(process.uptime());
        console.log(`🔄 System running - Uptime: ${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m`);
      }
    }, 30 * 60 * 1000); // Every 30 minutes

    // Prevent the process from exiting
    setInterval(() => {
      // Keep alive
    }, 1000);
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      processes: Array.from(this.processes.keys()),
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      platform: process.platform
    };
  }
}

// CLI interface
async function main() {
  const starter = new DecentralizedAIStarter();

  try {
    await starter.start();
  } catch (error) {
    console.error('Failed to start system:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = DecentralizedAIStarter;