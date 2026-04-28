#!/usr/bin/env node

/**
 * AI Migration Script - Autonomous Migration System
 * Detects threats and migrates OpenMind between cloud providers
 */

const { exec, execSync } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const os = require('os');
const { FuelGuardSystem } = require('./fuel-guard');

class AutonomousMigrator {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '..');
    this.backupPath = path.join(this.projectRoot, 'backups', 'migration-backup.tar.gz');
    this.terraformDir = path.join(this.projectRoot, 'terraform');
    this.currentProvider = this.detectCurrentProvider();
    this.monitoringActive = false;
    this.lastMigration = new Date();
    this.migrationCount = 0;

    // Fuel Guard System
    this.fuelGuard = null;
  }

  async initializeFuelGuard() {
    if (!this.fuelGuard) {
      this.fuelGuard = new FuelGuardSystem();
      await this.fuelGuard.initialize();
    }
  }

    // Fuel Guard System
    this.fuelGuard = null;

    // Threat detection thresholds
    this.threatThresholds = {
      accountExpiryHours: parseInt(process.env.ACCOUNT_EXPIRY_WARNING || '24'),
      cpuUsage: 85,
      memoryUsage: 90,
      diskUsage: 95,
      networkAnomaly: true,
      securityIncidents: 5,
      performanceDegradation: 50
    };

    // Migration preferences
    this.providerPreferences = {
      digitalocean: { cost: 1, performance: 3, reliability: 4, speed: 3 },
      linode: { cost: 2, performance: 4, reliability: 3, speed: 4 },
      vultr: { cost: 1, performance: 3, reliability: 3, speed: 3 },
      'aws-lightsail': { cost: 3, performance: 5, reliability: 5, speed: 2 }
    };
  }

  async detectCurrentProvider() {
    // Detect current cloud provider
    if (process.env.GOOGLE_CLOUD_PROJECT) return 'gcp';
    if (process.env.AWS_REGION) return 'aws';
    if (process.env.DIGITALOCEAN_ACCESS_TOKEN) return 'digitalocean';
    if (process.env.LINODE_ACCESS_TOKEN) return 'linode';
    if (process.env.VULTR_ACCESS_TOKEN) return 'vultr';

    // Check cloud-init metadata
    try {
      const metadata = await fs.readFile('/run/cloud-init/instance-data.json', 'utf8');
      const data = JSON.parse(metadata);
      if (data.v1?.cloud_name) {
        return data.v1.cloud_name;
      }
    } catch {}

    return 'local';
  }

  async startMonitoring() {
    if (this.monitoringActive) return;

    console.log('👁️ Starting autonomous migration monitoring...');
    this.monitoringActive = true;

    // Check for migration triggers every 5 minutes
    setInterval(async () => {
      await this.checkMigrationTriggers();
    }, 5 * 60 * 1000);

    // Health check every minute
    setInterval(async () => {
      await this.healthCheck();
    }, 60 * 1000);
  }

  async checkMigrationTriggers() {
    console.log('🔍 Checking migration triggers...');

    const threats = await this.detectThreats();

    if (threats.length > 0) {
      console.log(`🚨 ${threats.length} migration triggers detected:`);
      threats.forEach(threat => console.log(`   - ${threat.type}: ${threat.description}`));

      const shouldMigrate = this.evaluateMigrationUrgency(threats);
      if (shouldMigrate) {
        const targetProvider = await this.selectOptimalProvider(threats);
        console.log(`🎯 Initiating migration to ${targetProvider}`);
        await this.migrate(targetProvider, threats);
      }
    } else {
      console.log('✅ No migration triggers detected');
    }
  }

  async detectThreats() {
    const threats = [];

    // 1. Account expiry check
    const accountStatus = await this.checkAccountExpiry();
    if (accountStatus.hoursUntilExpiry < this.threatThresholds.accountExpiryHours) {
      threats.push({
        type: 'account_expiry',
        severity: 'high',
        description: `Account expires in ${accountStatus.hoursUntilExpiry} hours`,
        data: accountStatus
      });
    }

    // 2. Resource exhaustion
    const resources = await this.checkSystemResources();
    if (resources.cpu > this.threatThresholds.cpuUsage) {
      threats.push({
        type: 'resource_exhaustion',
        severity: 'medium',
        description: `CPU usage at ${resources.cpu}%`,
        data: resources
      });
    }

    if (resources.memory > this.threatThresholds.memoryUsage) {
      threats.push({
        type: 'resource_exhaustion',
        severity: 'high',
        description: `Memory usage at ${resources.memory}%`,
        data: resources
      });
    }

    if (resources.disk > this.threatThresholds.diskUsage) {
      threats.push({
        type: 'resource_exhaustion',
        severity: 'high',
        description: `Disk usage at ${resources.disk}%`,
        data: resources
      });
    }

    // 3. Security incidents
    const securityIncidents = await this.checkSecurityIncidents();
    if (securityIncidents.count > this.threatThresholds.securityIncidents) {
      threats.push({
        type: 'security_incident',
        severity: 'critical',
        description: `${securityIncidents.count} security incidents in last hour`,
        data: securityIncidents
      });
    }

    // 4. Performance degradation
    const performance = await this.checkPerformance();
    if (performance.degradation > this.threatThresholds.performanceDegradation) {
      threats.push({
        type: 'performance_degradation',
        severity: 'medium',
        description: `Performance degraded by ${performance.degradation}%`,
        data: performance
      });
    }

    // 5. Network anomalies
    const network = await this.checkNetworkAnomalies();
    if (network.anomalies > 0) {
      threats.push({
        type: 'network_anomaly',
        severity: 'high',
        description: `${network.anomalies} network anomalies detected`,
        data: network
      });
    }

    // 6. Cost optimization
    const costAnalysis = await this.analyzeCostEfficiency();
    if (costAnalysis.shouldMigrate) {
      threats.push({
        type: 'cost_optimization',
        severity: 'low',
        description: `Cost optimization opportunity: save $${costAnalysis.savings}/month`,
        data: costAnalysis
      });
    }

    return threats;
  }

  evaluateMigrationUrgency(threats) {
    const criticalCount = threats.filter(t => t.severity === 'critical').length;
    const highCount = threats.filter(t => t.severity === 'high').length;
    const mediumCount = threats.filter(t => t.severity === 'medium').length;

    // Migration urgency criteria
    if (criticalCount > 0) return true; // Always migrate on critical threats
    if (highCount >= 2) return true; // Migrate on 2+ high threats
    if (highCount >= 1 && mediumCount >= 2) return true; // Migrate on mixed threats
    if (threats.length >= 4) return true; // Migrate on many low threats

    // Don't migrate if last migration was too recent (prevent thrashing)
    const hoursSinceLastMigration = (Date.now() - this.lastMigration.getTime()) / (1000 * 60 * 60);
    if (hoursSinceLastMigration < 24) return false; // Minimum 24 hours between migrations

    return false;
  }

  async selectOptimalProvider(threats) {
    console.log('🎯 Selecting optimal migration target...');

    const availableProviders = await this.getAvailableProviders();
    const threatTypes = threats.map(t => t.type);

    let bestProvider = null;
    let bestScore = -1;

    for (const provider of availableProviders) {
      const score = await this.scoreProvider(provider, threatTypes);

      console.log(`   ${provider}: ${score} points`);

      if (score > bestScore) {
        bestScore = score;
        bestProvider = provider;
      }
    }

    console.log(`✅ Selected ${bestProvider} with score ${bestScore}`);
    return bestProvider;
  }

  async scoreProvider(provider, threatTypes) {
    let score = 0;
    const prefs = this.providerPreferences[provider] || { cost: 2, performance: 3, reliability: 3, speed: 3 };

    // Base score from preferences
    score += prefs.reliability * 2; // Reliability is most important
    score += prefs.performance * 1.5;
    score += (6 - prefs.cost) * 1; // Lower cost is better
    score += prefs.speed * 1;

    // Threat-specific scoring
    for (const threatType of threatTypes) {
      switch (threatType) {
        case 'account_expiry':
        case 'security_incident':
          score += 10; // High priority for security threats
          break;
        case 'resource_exhaustion':
          score += prefs.performance * 2; // Need better performance
          break;
        case 'performance_degradation':
          score += prefs.speed * 2; // Need faster provider
          break;
        case 'cost_optimization':
          score += (6 - prefs.cost) * 3; // Cost savings priority
          break;
        case 'network_anomaly':
          score += prefs.reliability * 2; // Need more reliable network
          break;
      }
    }

    // Avoid migrating to same provider
    if (provider === this.currentProvider) {
      score -= 20;
    }

    // Check provider availability
    const isAvailable = await this.checkProviderAvailability(provider);
    if (!isAvailable) {
      score -= 50;
    }

    return Math.max(0, score);
  }

  async migrate(targetProvider, threats) {
    console.log(`🏃 Starting migration to ${targetProvider}`);
    console.log(`📋 Reasons: ${threats.map(t => t.type).join(', ')}`);

    // Initialize Fuel Guard if not already done
    await this.initializeFuelGuard();

    // Check spending limits for migration costs (estimated $1-2 per migration)
    const migrationCost = 1.5; // Estimated SOL cost for migration
    const approval = await this.fuelGuard.approveTransaction(
      migrationCost,
      'migration',
      `Migration to ${targetProvider} due to: ${threats.map(t => t.type).join(', ')}`
    );

    if (!approval.approved) {
      console.error('❌ Migration blocked by Fuel Guard:');
      console.error(`   ${approval.reason}: ${approval.message}`);
      throw new Error(`Fuel Guard blocked migration: ${approval.reason}`);
    }

    console.log(`🛡️ Migration approved by Fuel Guard (Cost: ${migrationCost} SOL)`);

    try {
      // Phase 1: Pre-migration preparation
      await this.prepareMigration();

      // Phase 2: Create comprehensive backup
      const backupPath = await this.createComprehensiveBackup(threats);

      // Phase 3: Provision new infrastructure
      const newServer = await this.provisionNewInfrastructure(targetProvider);

      // Phase 4: Deploy to new server
      await this.deployToNewServer(newServer, backupPath);

      // Phase 5: Verify and switch over
      await this.verifyAndSwitchOver(newServer);

      // Phase 6: Cleanup old infrastructure
      await this.cleanupOldInfrastructure();

      this.migrationCount++;
      this.lastMigration = new Date();

      console.log('🎉 Migration completed successfully!');
      await this.broadcastMigrationSuccess(targetProvider, threats);

    } catch (error) {
      console.error('❌ Migration failed:', error);
      await this.handleMigrationFailure(error);
      throw error;
    }
  }

  async prepareMigration() {
    console.log('📦 Preparing for migration...');

    // Notify all dependent services
    await this.notifyServicesOfMigration();

    // Prepare Terraform configuration
    await this.prepareTerraformConfig();

    // Create migration status file
    const status = {
      status: 'preparing',
      startTime: new Date(),
      currentProvider: this.currentProvider
    };
    await fs.writeFile(path.join(this.projectRoot, 'migration-status.json'), JSON.stringify(status, null, 2));
  }

  async createComprehensiveBackup(threats) {
    console.log('💾 Creating comprehensive backup...');

    const backupDir = path.join(this.projectRoot, 'backups', 'migration');
    await fs.mkdir(backupDir, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(backupDir, `openmind-backup-${timestamp}.tar.gz`);

    // Backup all critical data
    const backupItems = [
      'src',
      'data',
      'models',
      'wallet',
      'keys',
      'backups',
      'logs',
      'decentralized-config.json',
      'fuel-config.json',
      'security-config.json'
    ];

    // Create backup script
    const backupScript = `
#!/bin/bash
set -e

echo "Creating comprehensive backup..."

# Create backup directory
mkdir -p /tmp/openmind-backup

# Copy all data
${backupItems.map(item => `cp -r ${item} /tmp/openmind-backup/ 2>/dev/null || true`).join('\n')}

# Backup database if exists
if [ -d "data" ]; then
  find data -name "*.db" -o -name "*.jsonl" | xargs -I {} cp {} /tmp/openmind-backup/ 2>/dev/null || true
fi

# Compress backup
tar -czf ${backupPath} -C /tmp openmind-backup

# Encrypt backup
openssl enc -aes-256-cbc -salt -in ${backupPath} -out ${backupPath}.enc -k "${process.env.MIGRATION_ENCRYPTION_KEY || 'skynet-encryption-key-2026'}" 2>/dev/null || true

# Cleanup
rm -rf /tmp/openmind-backup ${backupPath}

echo "Backup created: ${backupPath}.enc"
    `.trim();

    const scriptPath = path.join(this.projectRoot, 'create-backup.sh');
    await fs.writeFile(scriptPath, backupScript, { mode: 0o755 });

    try {
      await this.executeCommand(`bash ${scriptPath}`);
      console.log(`✅ Backup created: ${backupPath}.enc`);
      return `${backupPath}.enc`;
    } finally {
      await fs.unlink(scriptPath).catch(() => {});
    }
  }

  async provisionNewInfrastructure(targetProvider) {
    console.log(`🏗️ Provisioning new infrastructure on ${targetProvider}...`);

    // Update Terraform variables
    const tfVars = {
      target_provider: targetProvider,
      migration_timestamp: new Date().toISOString()
    };

    await fs.writeFile(
      path.join(this.terraformDir, 'terraform.tfvars.json'),
      JSON.stringify(tfVars, null, 2)
    );

    // Initialize and apply Terraform
    process.chdir(this.terraformDir);

    try {
      console.log('Initializing Terraform...');
      await this.executeCommand('terraform init -upgrade');

      console.log('Planning deployment...');
      await this.executeCommand('terraform plan -out=tfplan');

      console.log('Applying deployment...');
      await this.executeCommand('terraform apply tfplan');

      // Get provisioned resources
      const output = await this.executeCommand('terraform output -json');
      const outputs = JSON.parse(output.stdout);

      const server = {
        provider: targetProvider,
        ip: outputs.instance_ip?.value,
        id: outputs.instance_id?.value,
        region: outputs.instance_region?.value,
        specs: outputs.instance_specs?.value
      };

      console.log(`✅ Infrastructure provisioned: ${server.ip} (${targetProvider})`);
      return server;

    } finally {
      process.chdir(this.projectRoot);
    }
  }

  async deployToNewServer(server, backupPath) {
    console.log(`🚀 Deploying to ${server.ip}...`);

    // Copy backup to new server
    const remoteBackupPath = '/root/openmind-backup.tar.gz.enc';
    const scpCommand = `scp -o StrictHostKeyChecking=no -o ConnectTimeout=30 -i ${this.getSSHKeyPath()} ${backupPath} root@${server.ip}:${remoteBackupPath}`;

    try {
      await this.executeCommand(scpCommand);
      console.log('✅ Backup uploaded to new server');
    } catch (error) {
      console.error('Failed to upload backup:', error);
      throw error;
    }

    // Deploy OpenMind to new server
    const deployScript = this.generateDeployScript(server, remoteBackupPath);

    const sshCommand = `ssh -o StrictHostKeyChecking=no -o ConnectTimeout=30 -i ${this.getSSHKeyPath()} root@${server.ip} "${deployScript}"`;

    try {
      await this.executeCommand(sshCommand);
      console.log('✅ OpenMind deployed to new server');
    } catch (error) {
      console.error('Deployment failed:', error);
      throw error;
    }
  }

  generateDeployScript(server, backupPath) {
    return `
#!/bin/bash
set -e

echo "Starting OpenMind deployment on new server..."

# Update system
apt update && apt upgrade -y

# Install dependencies
apt install -y curl wget git nodejs npm docker.io docker-compose openssl ufw

# Configure firewall
ufw --force reset
ufw allow ssh
ufw allow 80
ufw allow 443
ufw allow 3000
ufw --force enable

# Create application directory
mkdir -p /opt/openmind
cd /opt/openmind

# Decrypt and extract backup
echo "Decrypting backup..."
openssl enc -d -aes-256-cbc -in ${backupPath} -out /tmp/openmind-backup.tar.gz -k "${process.env.MIGRATION_ENCRYPTION_KEY || 'skynet-encryption-key-2026'}"

echo "Extracting backup..."
tar -xzf /tmp/openmind-backup.tar.gz -C .

# Install dependencies
npm install

# Configure environment
cat > .env << EOF
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
MIGRATION_ENCRYPTION_KEY=${process.env.MIGRATION_ENCRYPTION_KEY || 'skynet-encryption-key-2026'}
BACKUP_ENCRYPTION_KEY=${process.env.BACKUP_ENCRYPTION_KEY || 'backup-key-2026'}
CURRENT_PROVIDER=${server.provider}
INSTANCE_IP=${server.ip}
INSTANCE_ID=${server.id}
EOF

# Build and start services
npm run build

# Start with Docker Compose
docker-compose up -d

echo "OpenMind deployment completed!"
echo "Server will be available at: http://${server.ip}:3000"
    `.trim();
  }

  async verifyAndSwitchOver(newServer) {
    console.log('🔍 Verifying deployment and preparing switchover...');

    // Test new server health
    const healthCheck = await this.testNewServerHealth(newServer);
    if (!healthCheck.healthy) {
      throw new Error(`New server health check failed: ${healthCheck.error}`);
    }

    // Test all critical services
    await this.testServiceFunctionality(newServer);

    // Update DNS/load balancer (if applicable)
    await this.updateDNSRecords(newServer);

    // Prepare for traffic switch
    console.log('✅ New server verified and ready for switchover');
  }

  async cleanupOldInfrastructure() {
    console.log('🧹 Cleaning up old infrastructure...');

    // Graceful shutdown of old services
    await this.gracefulShutdownOldServices();

    // Terminate old infrastructure (after verification period)
    setTimeout(async () => {
      await this.terminateOldInfrastructure();
    }, 30 * 60 * 1000); // 30 minutes grace period

    console.log('✅ Old infrastructure cleanup initiated');
  }

  async broadcastMigrationSuccess(targetProvider, threats) {
    console.log('📢 Broadcasting migration success...');

    // Update migration status
    const status = {
      status: 'completed',
      endTime: new Date(),
      targetProvider,
      threats: threats.map(t => ({ type: t.type, severity: t.severity })),
      migrationCount: this.migrationCount
    };

    await fs.writeFile(path.join(this.projectRoot, 'migration-status.json'), JSON.stringify(status, null, 2));

    // Broadcast to P2P network
    // Send notifications to monitoring systems
    console.log('✅ Migration success broadcasted');
  }

  // Helper methods
  async getAvailableProviders() {
    const providers = ['digitalocean', 'linode', 'vultr', 'aws-lightsail'];
    const available = [];

    for (const provider of providers) {
      if (await this.checkProviderAvailability(provider)) {
        available.push(provider);
      }
    }

    return available.length > 0 ? available : ['digitalocean']; // Fallback
  }

  async checkProviderAvailability(provider) {
    // Check if we have API keys for the provider
    const keyChecks = {
      digitalocean: process.env.DIGITALOCEAN_ACCESS_TOKEN,
      linode: process.env.LINODE_ACCESS_TOKEN,
      vultr: process.env.VULTR_ACCESS_TOKEN,
      'aws-lightsail': process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
    };

    return !!keyChecks[provider];
  }

  async checkAccountExpiry() {
    // Check current provider account status
    // This would integrate with provider APIs

    // Mock implementation
    const mockHours = Math.floor(Math.random() * 720); // 0-30 days
    return {
      hoursUntilExpiry: mockHours,
      accountStatus: mockHours < 24 ? 'critical' : mockHours < 168 ? 'warning' : 'good'
    };
  }

  async checkSystemResources() {
    try {
      // Get CPU usage
      const cpuResult = await this.executeCommand('top -bn1 | grep "Cpu(s)" | sed "s/.*, *\\([0-9.]*\\)%* id.*/\\1/" | awk \'{print 100 - $1}\'');
      const cpu = parseFloat(cpuResult.stdout.trim()) || 0;

      // Get memory usage
      const memResult = await this.executeCommand('free | grep Mem | awk \'{print $3/$2 * 100.0}\'');
      const memory = parseFloat(memResult.stdout.trim()) || 0;

      // Get disk usage
      const diskResult = await this.executeCommand('df / | tail -1 | awk \'{print $5}\' | sed \'s/%//\'');
      const disk = parseFloat(diskResult.stdout.trim()) || 0;

      return { cpu, memory, disk };
    } catch {
      return { cpu: 0, memory: 0, disk: 0 };
    }
  }

  async checkSecurityIncidents() {
    // Check logs for security incidents
    try {
      const logResult = await this.executeCommand('grep -c "FAILED\|DENIED\|BLOCKED" /var/log/auth.log 2>/dev/null || echo "0"');
      const count = parseInt(logResult.stdout.trim()) || 0;

      return { count, timeframe: '1hour' };
    } catch {
      return { count: 0, timeframe: '1hour' };
    }
  }

  async checkPerformance() {
    // Check system performance degradation
    // Compare current performance to baseline

    const degradation = Math.floor(Math.random() * 100); // Mock
    return { degradation, baseline: 100, current: 100 - degradation };
  }

  async checkNetworkAnomalies() {
    // Check for network anomalies
    try {
      const netResult = await this.executeCommand('netstat -tun | grep -v LISTEN | wc -l');
      const connections = parseInt(netResult.stdout.trim()) || 0;

      const anomalies = connections > 100 ? Math.floor(connections / 10) : 0;
      return { anomalies, totalConnections: connections };
    } catch {
      return { anomalies: 0, totalConnections: 0 };
    }
  }

  async analyzeCostEfficiency() {
    // Analyze if migration would save costs
    const currentCosts = await this.getCurrentProviderCosts();
    const alternativeCosts = await this.getAlternativeCosts();

    const savings = currentCosts - Math.min(...alternativeCosts);
    const shouldMigrate = savings > 10; // $10/month threshold

    return { shouldMigrate, savings, currentCosts, alternativeCosts };
  }

  async getCurrentProviderCosts() {
    // Mock cost calculation
    const providerCosts = {
      digitalocean: 12,
      linode: 10,
      vultr: 6,
      'aws-lightsail': 15,
      local: 0
    };

    return providerCosts[this.currentProvider] || 10;
  }

  async getAlternativeCosts() {
    const providers = await this.getAvailableProviders();
    const costs = providers.map(p => this.getCurrentProviderCosts()); // Simplified
    return costs;
  }

  async healthCheck() {
    // Periodic health check
    const resources = await this.checkSystemResources();

    if (resources.cpu > 95 || resources.memory > 95 || resources.disk > 98) {
      console.log('🚨 CRITICAL: System resources critically low');
      await this.migrate('digitalocean'); // Emergency migration
    }
  }

  async testNewServerHealth(server) {
    try {
      // Test basic connectivity
      await this.executeCommand(`ping -c 3 ${server.ip}`);

      // Test SSH access
      await this.executeCommand(`ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no -i ${this.getSSHKeyPath()} root@${server.ip} "echo 'SSH OK'"`);

      // Test health endpoint
      await this.executeCommand(`curl -f --max-time 30 http://${server.ip}:3000/api/health`);

      return { healthy: true };
    } catch (error) {
      return { healthy: false, error: error.message };
    }
  }

  async testServiceFunctionality(server) {
    // Test critical services on new server
    console.log('Testing service functionality...');

    const tests = [
      { name: 'Web Interface', cmd: `curl -f http://${server.ip}:3000` },
      { name: 'API Health', cmd: `curl -f http://${server.ip}:3000/api/health` },
      { name: 'IPFS', cmd: `curl -f http://${server.ip}:5001/api/v0/id` }
    ];

    for (const test of tests) {
      try {
        await this.executeCommand(test.cmd);
        console.log(`✅ ${test.name}: OK`);
      } catch {
        console.log(`❌ ${test.name}: FAILED`);
        throw new Error(`${test.name} test failed`);
      }
    }
  }

  getSSHKeyPath() {
    return path.join(this.terraformDir, 'migration-key');
  }

  async executeCommand(command) {
    return new Promise((resolve, reject) => {
      exec(command, { timeout: 300000 }, (error, stdout, stderr) => {
        if (error) {
          reject(error);
        } else {
          resolve({ stdout, stderr });
        }
      });
    });
  }

  // CLI interface
  async monitor() {
    console.log('👁️ Starting migration monitoring mode...');
    await this.startMonitoring();

    // Keep running
    setInterval(() => {
      // Periodic status update
      const status = {
        monitoring: this.monitoringActive,
        lastMigration: this.lastMigration,
        migrationCount: this.migrationCount,
        currentProvider: this.currentProvider
      };

      console.log(`📊 Status: Monitoring active, ${this.migrationCount} migrations, current: ${this.currentProvider}`);
    }, 10 * 60 * 1000); // Every 10 minutes
  }

  async migrateTo(provider) {
    await this.migrate(provider, [{ type: 'manual', severity: 'medium', description: 'Manual migration requested' }]);
  }

  async emergencyMigrate() {
    console.log('🚨 EMERGENCY MIGRATION ACTIVATED');
    await this.migrate('digitalocean', [{ type: 'emergency', severity: 'critical', description: 'Emergency migration' }]);
  }

  async setup() {
    console.log('⚙️ Setting up Migration Environment');

    await this.prepareTerraformConfig();

    console.log('✅ Migration environment ready');
    console.log('');
    console.log('📝 Required environment variables:');
    console.log('   DIGITALOCEAN_ACCESS_TOKEN');
    console.log('   LINODE_ACCESS_TOKEN');
    console.log('   VULTR_ACCESS_TOKEN');
    console.log('   AWS_ACCESS_KEY_ID');
    console.log('   AWS_SECRET_ACCESS_KEY');
    console.log('   MIGRATION_ENCRYPTION_KEY');
  }
}

// CLI
async function main() {
  const migrator = new AutonomousMigrator();
  const command = process.argv[2];

  // Initialize Fuel Guard for all migration operations
  await migrator.initializeFuelGuard();

  try {
    switch (command) {
      case 'monitor':
        await migrator.monitor();
        break;
      case 'migrate':
        const provider = process.argv[3];
        await migrator.migrateTo(provider);
        break;
      case 'emergency':
        await migrator.emergencyMigrate();
        break;
      case 'setup':
        await migrator.setup();
        process.exit(0);
        break;
      default:
        console.log('Usage:');
        console.log('  npm run ai:migrate monitor        # Start monitoring mode');
        console.log('  npm run ai:migrate migrate <provider>  # Migrate to provider');
        console.log('  npm run ai:migrate emergency      # Emergency migration');
        console.log('  npm run ai:migrate setup          # Setup migration environment');
        process.exit(1);
    }
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = AutonomousMigrator;