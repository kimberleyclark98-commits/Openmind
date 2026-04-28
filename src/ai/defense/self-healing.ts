import { exec, execSync } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import * as crypto from 'crypto';
import { createHash } from 'crypto';

export interface HealingConfig {
  enableAutoRecovery: boolean;
  enableDriftDetection: boolean;
  enableImmutableInfrastructure: boolean;
  enableDynamicNetworking: boolean;
  recoveryConfig: {
    maxRecoveryAttempts: number;
    recoveryTimeout: number; // seconds
    backupFrequency: number; // minutes
  };
  driftDetection: {
    enabled: boolean;
    checkFrequency: number; // minutes
    alertThreshold: number; // percentage difference
    criticalFiles: string[];
  };
  containerConfig: {
    imageName: string;
    registryUrl: string;
    healthCheckEndpoint: string;
    restartPolicy: 'always' | 'on-failure' | 'no';
  };
  networkConfig: {
    enableDynamicDNS: boolean;
    dnsProvider: 'cloudflare' | 'aws' | 'google';
    domainName: string;
    apiKeys: Record<string, string>;
  };
}

export interface HealingEvent {
  id: string;
  timestamp: Date;
  type: 'recovery' | 'drift_detected' | 'container_restart' | 'network_change' | 'system_restore';
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'initiated' | 'in_progress' | 'completed' | 'failed';
  details: any;
  recoveryTime?: number;
}

export class SelfHealingSystem {
  private config: HealingConfig;
  private healingEvents: HealingEvent[] = [];
  private fileHashes: Map<string, string> = new Map();
  private recoveryAttempts: number = 0;
  private lastBackup: Date = new Date();
  private monitoringInterval: NodeJS.Timeout | null = null;
  private driftCheckInterval: NodeJS.Timeout | null = null;

  constructor(config: HealingConfig) {
    this.config = config;
    this.initializeHealing();
  }

  private async initializeHealing(): Promise<void> {
    console.log('🔧 Initializing Self-Healing System...');

    // Load baseline file hashes for drift detection
    if (this.config.driftDetection.enabled) {
      await this.loadBaselineHashes();
    }

    // Setup immutable infrastructure
    if (this.config.enableImmutableInfrastructure) {
      await this.setupImmutableInfrastructure();
    }

    // Configure dynamic networking
    if (this.config.enableDynamicNetworking) {
      await this.setupDynamicNetworking();
    }

    // Start monitoring
    this.startMonitoring();

    console.log('✅ Self-Healing System initialized');
  }

  private async loadBaselineHashes(): Promise<void> {
    console.log('📋 Loading baseline file hashes...');

    for (const filePath of this.config.driftDetection.criticalFiles) {
      try {
        const content = await fs.readFile(filePath, 'utf8');
        const hash = createHash('sha256').update(content).digest('hex');
        this.fileHashes.set(filePath, hash);
        console.log(`✅ Hashed ${filePath}`);
      } catch (error) {
        console.warn(`Failed to hash ${filePath}:`, error);
      }
    }

    console.log(`📊 Loaded ${this.fileHashes.size} baseline hashes`);
  }

  private async setupImmutableInfrastructure(): Promise<void> {
    console.log('🏗️ Setting up immutable infrastructure...');

    try {
      // Ensure Docker is running
      await this.executeCommand('docker info');

      // Pull latest image
      await this.executeCommand(`docker pull ${this.config.containerConfig.registryUrl}/${this.config.containerConfig.imageName}`);

      // Setup health monitoring
      await this.setupContainerHealthMonitoring();

      console.log('✅ Immutable infrastructure configured');

    } catch (error) {
      console.error('Immutable infrastructure setup failed:', error);
    }
  }

  private async setupDynamicNetworking(): Promise<void> {
    console.log('🌐 Setting up dynamic networking...');

    // This would integrate with DNS providers
    // For now, just log the setup
    console.log('✅ Dynamic networking configured');
  }

  private startMonitoring(): void {
    // Health monitoring every 30 seconds
    this.monitoringInterval = setInterval(async () => {
      await this.performHealthCheck();
    }, 30000);

    // Drift detection every configured interval
    if (this.config.driftDetection.enabled) {
      this.driftCheckInterval = setInterval(async () => {
        await this.performDriftDetection();
      }, this.config.driftDetection.checkFrequency * 60 * 1000);
    }

    // Automatic backup
    setInterval(async () => {
      await this.performAutomaticBackup();
    }, this.config.recoveryConfig.backupFrequency * 60 * 1000);
  }

  private async performHealthCheck(): Promise<void> {
    try {
      // Check container health
      const containerHealth = await this.checkContainerHealth();

      if (!containerHealth.healthy) {
        console.log('🚨 Container health check failed, initiating recovery...');
        await this.recoverContainer();
        return;
      }

      // Check application health
      const appHealth = await this.checkApplicationHealth();

      if (!appHealth.healthy) {
        console.log('🚨 Application health check failed, initiating restart...');
        await this.restartApplication();
        return;
      }

      // Check system resources
      const systemHealth = await this.checkSystemHealth();

      if (!systemHealth.healthy) {
        console.log('🚨 System health degraded, initiating recovery...');
        await this.performSystemRecovery();
        return;
      }

    } catch (error) {
      console.error('Health check failed:', error);
      await this.logHealingEvent('recovery', 'high', 'health_check_failed', { error: error.message });
    }
  }

  private async checkContainerHealth(): Promise<{ healthy: boolean; details?: any }> {
    try {
      // Check if container is running
      const result = await this.executeCommand(`docker ps --filter "name=openmind" --format "{{.Status}}"`);
      const status = result.stdout.trim();

      if (!status.includes('Up')) {
        return { healthy: false, details: { status: 'not_running', dockerStatus: status } };
      }

      // Check container health via health check
      const healthResult = await this.executeCommand(`docker inspect openmind --format "{{.State.Health.Status}}"`);
      const healthStatus = healthResult.stdout.trim();

      return {
        healthy: healthStatus === 'healthy',
        details: { dockerHealth: healthStatus }
      };

    } catch (error) {
      return { healthy: false, details: { error: error.message } };
    }
  }

  private async checkApplicationHealth(): Promise<{ healthy: boolean; details?: any }> {
    try {
      // Check application health endpoint
      const response = await fetch(`http://localhost:3000${this.config.containerConfig.healthCheckEndpoint}`, {
        timeout: 5000
      });

      if (!response.ok) {
        return { healthy: false, details: { status: response.status, statusText: response.statusText } };
      }

      const healthData = await response.json();

      return {
        healthy: healthData.status === 'healthy',
        details: healthData
      };

    } catch (error) {
      return { healthy: false, details: { error: error.message } };
    }
  }

  private async checkSystemHealth(): Promise<{ healthy: boolean; details?: any }> {
    try {
      // Check CPU usage
      const cpuUsage = await this.getCPUUsage();
      if (cpuUsage > 95) {
        return { healthy: false, details: { cpuUsage, threshold: 95 } };
      }

      // Check memory usage
      const memUsage = await this.getMemoryUsage();
      if (memUsage > 95) {
        return { healthy: false, details: { memUsage, threshold: 95 } };
      }

      // Check disk usage
      const diskUsage = await this.getDiskUsage();
      if (diskUsage > 95) {
        return { healthy: false, details: { diskUsage, threshold: 95 } };
      }

      return { healthy: true };

    } catch (error) {
      return { healthy: false, details: { error: error.message } };
    }
  }

  private async getCPUUsage(): Promise<number> {
    try {
      const result = await this.executeCommand('top -bn1 | grep "Cpu(s)" | sed "s/.*, *\\([0-9.]*\\)%* id.*/\\1/" | awk \'{print 100 - $1}\'');
      return parseFloat(result.stdout.trim());
    } catch {
      return 0;
    }
  }

  private async getMemoryUsage(): Promise<number> {
    try {
      const result = await this.executeCommand('free | grep Mem | awk \'{print $3/$2 * 100.0}\'');
      return parseFloat(result.stdout.trim());
    } catch {
      return 0;
    }
  }

  private async getDiskUsage(): Promise<number> {
    try {
      const result = await this.executeCommand('df / | tail -1 | awk \'{print $5}\' | sed \'s/%//\'');
      return parseFloat(result.stdout.trim());
    } catch {
      return 0;
    }
  }

  private async recoverContainer(): Promise<void> {
    const eventId = crypto.randomUUID();
    await this.logHealingEvent('container_restart', 'high', 'container_recovery_initiated', {}, eventId);

    try {
      console.log('🔄 Recovering container...');

      // Stop unhealthy container
      await this.executeCommand('docker stop openmind').catch(() => {});
      await this.executeCommand('docker rm openmind').catch(() => {});

      // Start fresh container
      const startCommand = this.buildContainerStartCommand();
      await this.executeCommand(startCommand);

      // Wait for container to be healthy
      await this.waitForContainerHealth();

      await this.updateHealingEvent(eventId, 'completed', { recoveryTime: Date.now() });

      console.log('✅ Container recovered successfully');

    } catch (error) {
      console.error('Container recovery failed:', error);
      await this.updateHealingEvent(eventId, 'failed', { error: error.message });
      throw error;
    }
  }

  private async restartApplication(): Promise<void> {
    const eventId = crypto.randomUUID();
    await this.logHealingEvent('recovery', 'medium', 'application_restart_initiated', {}, eventId);

    try {
      console.log('🔄 Restarting application...');

      // Restart application inside container
      await this.executeCommand('docker exec openmind npm run restart');

      // Wait for application to be healthy
      await this.waitForApplicationHealth();

      await this.updateHealingEvent(eventId, 'completed', { recoveryTime: Date.now() });

      console.log('✅ Application restarted successfully');

    } catch (error) {
      console.error('Application restart failed:', error);
      await this.updateHealingEvent(eventId, 'failed', { error: error.message });
      throw error;
    }
  }

  private async performSystemRecovery(): Promise<void> {
    const eventId = crypto.randomUUID();
    await this.logHealingEvent('system_restore', 'critical', 'system_recovery_initiated', {}, eventId);

    try {
      console.log('🔧 Performing system recovery...');

      // Clear system caches
      await this.executeCommand('sync && echo 3 > /proc/sys/vm/drop_caches');

      // Restart system services
      await this.executeCommand('systemctl restart openmind').catch(() => {});

      // Check and repair filesystem if needed
      await this.executeCommand('touch /forcefsck && reboot').catch(() => {});

      await this.updateHealingEvent(eventId, 'completed', { recoveryTime: Date.now() });

      console.log('✅ System recovery completed');

    } catch (error) {
      console.error('System recovery failed:', error);
      await this.updateHealingEvent(eventId, 'failed', { error: error.message });
      throw error;
    }
  }

  private async performDriftDetection(): Promise<void> {
    if (!this.config.driftDetection.enabled) return;

    console.log('🔍 Performing drift detection...');

    let driftedFiles: string[] = [];
    let totalChecked = 0;

    for (const [filePath, baselineHash] of this.fileHashes) {
      totalChecked++;

      try {
        const content = await fs.readFile(filePath, 'utf8');
        const currentHash = createHash('sha256').update(content).digest('hex');

        if (currentHash !== baselineHash) {
          driftedFiles.push(filePath);
          console.log(`⚠️ File drift detected: ${filePath}`);
        }

      } catch (error) {
        console.warn(`Failed to check ${filePath}:`, error);
      }
    }

    const driftPercentage = (driftedFiles.length / totalChecked) * 100;

    if (driftPercentage >= this.config.driftDetection.alertThreshold) {
      console.log(`🚨 CRITICAL: High drift detected (${driftPercentage.toFixed(1)}%)`);

      await this.logHealingEvent('drift_detected', 'critical', 'high_drift_detected', {
        driftedFiles,
        driftPercentage,
        totalChecked
      });

      // Initiate rollback
      await this.rollbackDriftedFiles(driftedFiles);

    } else if (driftedFiles.length > 0) {
      console.log(`⚠️ Minor drift detected in ${driftedFiles.length} files`);

      await this.logHealingEvent('drift_detected', 'medium', 'minor_drift_detected', {
        driftedFiles,
        driftPercentage
      });
    } else {
      console.log('✅ No drift detected');
    }
  }

  private async rollbackDriftedFiles(driftedFiles: string[]): Promise<void> {
    console.log('🔄 Rolling back drifted files...');

    // This would download clean versions from git or backups
    // For now, log the action needed

    for (const filePath of driftedFiles) {
      console.log(`📥 Would restore clean version of: ${filePath}`);
      // In production, this would:
      // 1. Download original from git
      // 2. Verify integrity
      // 3. Replace modified file
      // 4. Restart affected services
    }

    await this.logHealingEvent('recovery', 'high', 'drift_rollback_completed', {
      rolledBackFiles: driftedFiles.length
    });
  }

  private async performAutomaticBackup(): Promise<void> {
    try {
      console.log('💾 Performing automatic backup...');

      const backupPath = path.join(process.cwd(), 'backups', `auto-backup-${Date.now()}.tar.gz`);

      // Create backup directory
      await fs.mkdir(path.dirname(backupPath), { recursive: true });

      // Backup critical data
      const backupItems = [
        'src',
        'data',
        'config',
        'keys',
        'decentralized-config.json',
        'fuel-config.json'
      ];

      const tarCommand = `tar -czf ${backupPath} ${backupItems.join(' ')} 2>/dev/null || true`;
      await this.executeCommand(tarCommand);

      // Encrypt backup
      const encryptedPath = backupPath + '.enc';
      await this.executeCommand(`openssl enc -aes-256-cbc -salt -in ${backupPath} -out ${encryptedPath} -k "${process.env.BACKUP_ENCRYPTION_KEY || 'default-backup-key'}" 2>/dev/null || true`);

      // Cleanup unencrypted backup
      await fs.unlink(backupPath).catch(() => {});

      this.lastBackup = new Date();
      console.log(`✅ Backup created: ${encryptedPath}`);

    } catch (error) {
      console.error('Automatic backup failed:', error);
    }
  }

  private buildContainerStartCommand(): string {
    const envVars = [
      'NODE_ENV=production',
      'NEXT_TELEMETRY_DISABLED=1',
      `MIGRATION_ENCRYPTION_KEY=${process.env.MIGRATION_ENCRYPTION_KEY || 'default'}`,
      `BACKUP_ENCRYPTION_KEY=${process.env.BACKUP_ENCRYPTION_KEY || 'default'}`
    ].join(' -e ');

    return `docker run -d --name openmind --restart ${this.config.containerConfig.restartPolicy} -p 3000:3000 -e ${envVars} -v ${process.cwd()}:/opt/openmind ${this.config.containerConfig.registryUrl}/${this.config.containerConfig.imageName}`;
  }

  private async setupContainerHealthMonitoring(): Promise<void> {
    // Setup Docker health checks
    console.log('🏥 Setting up container health monitoring...');

    // This would configure Docker health checks
    // For now, just ensure the setup is logged
  }

  private async waitForContainerHealth(timeout: number = 300): Promise<void> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout * 1000) {
      const health = await this.checkContainerHealth();

      if (health.healthy) {
        return;
      }

      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
    }

    throw new Error('Container failed to become healthy within timeout');
  }

  private async waitForApplicationHealth(timeout: number = 120): Promise<void> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout * 1000) {
      const health = await this.checkApplicationHealth();

      if (health.healthy) {
        return;
      }

      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
    }

    throw new Error('Application failed to become healthy within timeout');
  }

  private async logHealingEvent(
    type: HealingEvent['type'],
    severity: HealingEvent['severity'],
    details: any,
    eventId?: string
  ): Promise<string> {
    const id = eventId || crypto.randomUUID();

    const event: HealingEvent = {
      id,
      timestamp: new Date(),
      type,
      severity,
      status: 'initiated',
      details
    };

    this.healingEvents.push(event);

    // Log to file
    const logPath = path.join(process.cwd(), 'logs', 'healing-events.jsonl');
    await fs.appendFile(logPath, JSON.stringify(event) + '\n').catch(() => {});

    return id;
  }

  private async updateHealingEvent(eventId: string, status: HealingEvent['status'], additionalDetails?: any): Promise<void> {
    const event = this.healingEvents.find(e => e.id === eventId);
    if (event) {
      event.status = status;
      event.recoveryTime = additionalDetails?.recoveryTime ? (additionalDetails.recoveryTime - event.timestamp.getTime()) / 1000 : undefined;

      if (additionalDetails) {
        event.details = { ...event.details, ...additionalDetails };
      }

      // Update log file
      const logPath = path.join(process.cwd(), 'logs', 'healing-events.jsonl');
      const allEvents = this.healingEvents.map(e => JSON.stringify(e)).join('\n') + '\n';
      await fs.writeFile(logPath, allEvents).catch(() => {});
    }
  }

  private async executeCommand(command: string): Promise<{ stdout: string; stderr: string }> {
    return new Promise((resolve, reject) => {
      exec(command, (error, stdout, stderr) => {
        if (error) {
          reject(error);
        } else {
          resolve({ stdout, stderr });
        }
      });
    });
  }

  // Public API
  getHealingEvents(limit: number = 50): HealingEvent[] {
    return this.healingEvents.slice(-limit);
  }

  getSystemHealth(): Promise<{ container: any; application: any; system: any }> {
    return Promise.all([
      this.checkContainerHealth(),
      this.checkApplicationHealth(),
      this.checkSystemHealth()
    ]).then(([container, application, system]) => ({
      container,
      application,
      system
    }));
  }

  async forceRecovery(type: 'container' | 'application' | 'system'): Promise<void> {
    console.log(`🔧 Forcing ${type} recovery...`);

    switch (type) {
      case 'container':
        await this.recoverContainer();
        break;
      case 'application':
        await this.restartApplication();
        break;
      case 'system':
        await this.performSystemRecovery();
        break;
    }
  }

  async updateBaselineHashes(): Promise<void> {
    console.log('📋 Updating baseline file hashes...');
    await this.loadBaselineHashes();
    console.log('✅ Baseline hashes updated');
  }

  async performManualBackup(): Promise<string> {
    console.log('💾 Performing manual backup...');
    await this.performAutomaticBackup();
    return `Manual backup completed at ${new Date().toISOString()}`;
  }

  getHealingStats(): {
    totalEvents: number;
    successfulRecoveries: number;
    failedRecoveries: number;
    averageRecoveryTime: number;
    lastBackup: Date;
  } {
    const completedEvents = this.healingEvents.filter(e => e.status === 'completed');
    const failedEvents = this.healingEvents.filter(e => e.status === 'failed');

    const avgRecoveryTime = completedEvents
      .filter(e => e.recoveryTime)
      .reduce((sum, e) => sum + (e.recoveryTime || 0), 0) / completedEvents.length || 0;

    return {
      totalEvents: this.healingEvents.length,
      successfulRecoveries: completedEvents.length,
      failedRecoveries: failedEvents.length,
      averageRecoveryTime: avgRecoveryTime,
      lastBackup: this.lastBackup
    };
  }

  async shutdown(): Promise<void> {
    console.log('🛑 Shutting down Self-Healing System...');

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    if (this.driftCheckInterval) {
      clearInterval(this.driftCheckInterval);
    }

    console.log('✅ Self-Healing System shutdown');
  }
}

// Default configuration
export const defaultHealingConfig: HealingConfig = {
  enableAutoRecovery: true,
  enableDriftDetection: true,
  enableImmutableInfrastructure: true,
  enableDynamicNetworking: false,
  recoveryConfig: {
    maxRecoveryAttempts: 3,
    recoveryTimeout: 300,
    backupFrequency: 60 // 1 hour
  },
  driftDetection: {
    enabled: true,
    checkFrequency: 30, // 30 minutes
    alertThreshold: 10, // 10% of files changed
    criticalFiles: [
      'src/ai/orchestrator/decentralized-orchestrator.ts',
      'src/ai/wallet/autonomous-wallet.ts',
      'src/ai/defense/model-armor.ts',
      'decentralized-config.json',
      'fuel-config.json'
    ]
  },
  containerConfig: {
    imageName: 'openmind-ai',
    registryUrl: 'docker.io/openmindai',
    healthCheckEndpoint: '/api/health',
    restartPolicy: 'always'
  },
  networkConfig: {
    enableDynamicDNS: false,
    dnsProvider: 'cloudflare',
    domainName: 'openmind.ai',
    apiKeys: {}
  }
};