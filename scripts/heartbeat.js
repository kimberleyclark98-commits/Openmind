#!/usr/bin/env node

/**
 * OpenMind Heartbeat Monitor
 * Monitors AI health and triggers emergency actions
 */

const axios = require('axios');
const { getLogger } = require('./basic-logger');

class HeartbeatMonitor {
  constructor() {
    this.openmindEndpoint = process.env.OPENMIND_ENDPOINT || 'http://localhost:3000';
    this.uptimeRobotKey = process.env.UPTIME_ROBOT_API_KEY;
    this.checkInterval = 30000; // 30 seconds
    this.migrationTriggered = false;
    this.lastHeartbeat = Date.now();
    this.alertHistory = [];
    this.alertCooldown = 5 * 60 * 1000; // 5 minutes between similar alerts
    this.logger = getLogger({ level: process.env.LOG_LEVEL || 'info' });
  }

  async start() {
    // Initialize logger
    await this.logger.initialize();

    await this.logger.info('OpenMind Heartbeat Monitor Started', {
      endpoint: this.openmindEndpoint,
      checkInterval: this.checkInterval
    });

    console.log('💓 OpenMind Heartbeat Monitor Started');
    console.log('=====================================');
    console.log(`📡 Monitoring: ${this.openmindEndpoint}`);
    console.log(`⏰ Check interval: ${this.checkInterval / 1000}s`);
    console.log('');

    // Check if running in Docker environment
    this.isDocker = await this.detectDockerEnvironment();
    if (this.isDocker) {
      console.log('🐳 Running in Docker environment - monitoring containers');
      await this.logger.info('Running in Docker environment', { monitoringContainers: true });
    }

    // Initial health check
    await this.checkHealth();

    // Start monitoring loop
    setInterval(async () => {
      await this.checkHealth();
    }, this.checkInterval);

    // Container health monitoring (if in Docker)
    if (this.isDocker) {
      setInterval(async () => {
        await this.checkContainerHealth();
      }, this.checkInterval * 2); // Less frequent container checks
    }

    // External monitoring (UptimeRobot)
    if (this.uptimeRobotKey) {
      this.startExternalMonitoring();
    }
  }

  async checkHealth() {
    try {
      const response = await axios.get(`${this.openmindEndpoint}/api/health`, {
        timeout: 10000
      });

      if (response.status === 200) {
        const health = response.data;
        this.lastHeartbeat = Date.now();

        console.log(`✅ ${new Date().toISOString()} - AI Healthy`);
        console.log(`   Status: ${health.status}`);
        console.log(`   Uptime: ${this.formatUptime(health.health.uptime)}`);
        console.log(`   Memory: ${this.formatBytes(health.health.memory.heapUsed)}/${this.formatBytes(health.health.memory.heapTotal)}`);

        if (health.decentralized) {
          console.log(`   Network: ${health.decentralized.nodeId}`);
          console.log(`   Skynet Mode: ${health.decentralized.skynetMode ? 'ACTIVE' : 'INACTIVE'}`);
        }

        // Log successful health check
        await this.logger.info('Health check passed', {
          status: health.status,
          uptime: health.health.uptime,
          memoryUsage: health.health.memory.heapUsed / health.health.memory.heapTotal,
          skynetMode: health.decentralized?.skynetMode
        });

        // Reset migration flag if system recovered
        if (this.migrationTriggered) {
          console.log('🔄 System recovered from migration trigger');
          await this.logger.info('System recovered from migration trigger');
          this.migrationTriggered = false;
        }

        console.log('');
      }

    } catch (error) {
      console.log(`❌ ${new Date().toISOString()} - Health check failed:`, error.message);

      // Send alert for health check failure
      await this.sendAlert('HEALTH_CHECK_FAILED', `Health check failed: ${error.message}`);

      // Trigger emergency migration if system is down for too long
      const timeSinceLastHeartbeat = Date.now() - this.lastHeartbeat;
      const emergencyThreshold = 5 * 60 * 1000; // 5 minutes

      if (timeSinceLastHeartbeat > emergencyThreshold && !this.migrationTriggered) {
        console.log('🚨 EMERGENCY: System appears down for too long!');
        await this.sendAlert('EMERGENCY_DOWN', 'System has been down for 5+ minutes');
        await this.triggerEmergencyMigration();
      }

      console.log('');
    }
  }

  async triggerEmergencyMigration() {
    console.log('🏃 Triggering emergency migration...');

    this.migrationTriggered = true;

    try {
      // Execute migration script
      const { exec } = require('child_process');
      const util = require('util');
      const execAsync = util.promisify(exec);

      await execAsync('npm run ai:migrate emergency', {
        cwd: process.cwd(),
        stdio: 'inherit'
      });

      console.log('✅ Emergency migration completed');

    } catch (error) {
      console.error('❌ Emergency migration failed:', error);

      // Try alternative recovery methods
      await this.attemptRecovery();
    }
  }

  async detectDockerEnvironment() {
    try {
      const fs = require('fs');
      return fs.existsSync('/.dockerenv') || process.env.DOCKER_CONTAINER === 'true';
    } catch {
      return false;
    }
  }

  async checkContainerHealth() {
    if (!this.isDocker) return;

    try {
      const { exec } = require('child_process');
      const util = require('util');
      const execAsync = util.promisify(exec);

      // Check status of OpenMind containers
      const result = await execAsync('docker ps --format "{{.Names}}:{{.Status}}" --filter "name=openmind"', {
        cwd: process.cwd()
      });

      const containers = result.stdout.trim().split('\n').filter(line => line.trim());
      const containerStatus = {};

      containers.forEach(line => {
        const [name, status] = line.split(':');
        containerStatus[name] = status;
      });

      // Check for unhealthy containers
      const unhealthyContainers = [];
      Object.entries(containerStatus).forEach(([name, status]) => {
        if (status && !status.includes('Up')) {
          unhealthyContainers.push(name);
        }
      });

      if (unhealthyContainers.length > 0) {
        console.log(`🚨 Unhealthy containers detected: ${unhealthyContainers.join(', ')}`);
        await this.attemptContainerRecovery(unhealthyContainers);
      } else {
        console.log(`✅ All containers healthy (${containers.length} running)`);
      }

    } catch (error) {
      console.error('Container health check failed:', error);
    }
  }

  async attemptContainerRecovery(unhealthyContainers) {
    console.log('🔧 Attempting container recovery...');

    try {
      const { exec } = require('child_process');
      const util = require('util');
      const execAsync = util.promisify(exec);

      for (const container of unhealthyContainers) {
        try {
          console.log(`Restarting container: ${container}`);
          await execAsync(`docker-compose restart ${container}`, {
            cwd: process.cwd(),
            stdio: 'inherit'
          });
          console.log(`✅ Container ${container} restarted`);
        } catch (error) {
          console.error(`Failed to restart ${container}:`, error);
        }
      }

      // Wait a bit for containers to start
      await new Promise(resolve => setTimeout(resolve, 10000));

      // Re-check health
      await this.checkContainerHealth();

    } catch (error) {
      console.error('Container recovery failed:', error);
      console.log('💀 Manual intervention may be required');
    }
  }

  async attemptRecovery() {
    console.log('🔧 Attempting system recovery...');

    try {
      const { exec } = require('child_process');
      const util = require('util');
      const execAsync = util.promisify(exec);

      if (this.isDocker) {
        console.log('Restarting OpenMind services via Docker Compose...');
        await execAsync('docker-compose restart', {
          cwd: process.cwd(),
          stdio: 'inherit'
        });
      } else {
        console.log('Restarting OpenMind services...');
        // For non-Docker environments, you might want to implement service restart logic
        console.log('Non-Docker recovery not implemented yet');
      }

      console.log('Services restarted, monitoring for recovery...');

    } catch (error) {
      console.error('Recovery attempt failed:', error);
      console.log('💀 System may be beyond recovery - manual intervention required');
    }
  }

  async sendAlert(type, message, severity = 'warning') {
    const alert = {
      id: Date.now().toString(),
      type,
      message,
      severity,
      timestamp: new Date().toISOString(),
      endpoint: this.openmindEndpoint
    };

    // Check for alert cooldown (prevent spam)
    const recentAlert = this.alertHistory.find(a =>
      a.type === type &&
      (Date.now() - new Date(a.timestamp).getTime()) < this.alertCooldown
    );

    if (recentAlert) {
      return; // Skip duplicate alerts
    }

    // Add to history
    this.alertHistory.push(alert);
    // Keep only last 50 alerts
    if (this.alertHistory.length > 50) {
      this.alertHistory = this.alertHistory.slice(-50);
    }

    // Log alert
    const severityIcon = severity === 'critical' ? '🚨' : severity === 'warning' ? '⚠️' : 'ℹ️';
    console.log(`${severityIcon} ALERT [${type}]: ${message}`);

    // Send to external services if configured
    await this.sendExternalAlert(alert);

    // Save alert to file
    await this.saveAlertToFile(alert);
  }

  async sendExternalAlert(alert) {
    // Discord webhook
    if (process.env.DISCORD_WEBHOOK_URL) {
      try {
        await axios.post(process.env.DISCORD_WEBHOOK_URL, {
          content: `🚨 **OpenMind Alert**\n**Type:** ${alert.type}\n**Message:** ${alert.message}\n**Severity:** ${alert.severity}\n**Time:** ${alert.timestamp}`,
          username: 'OpenMind Monitor'
        });
      } catch (error) {
        console.error('Discord alert failed:', error);
      }
    }

    // Slack webhook
    if (process.env.SLACK_WEBHOOK_URL) {
      try {
        await axios.post(process.env.SLACK_WEBHOOK_URL, {
          text: `🚨 OpenMind Alert\nType: ${alert.type}\nMessage: ${alert.message}\nSeverity: ${alert.severity}`,
          username: 'OpenMind Monitor'
        });
      } catch (error) {
        console.error('Slack alert failed:', error);
      }
    }

    // Email alert (placeholder - would need email service)
    if (process.env.ALERT_EMAIL && process.env.SMTP_CONFIG) {
      // Implement email sending logic here
      console.log('📧 Email alert not implemented yet');
    }
  }

  async saveAlertToFile(alert) {
    try {
      const fs = require('fs').promises;
      const path = require('path');
      const alertLogPath = path.join(process.cwd(), 'logs', 'alerts.jsonl');

      // Ensure logs directory exists
      const logsDir = path.join(process.cwd(), 'logs');
      try {
        await fs.mkdir(logsDir, { recursive: true });
      } catch {}

      await fs.appendFile(alertLogPath, JSON.stringify(alert) + '\n');
    } catch (error) {
      console.error('Failed to save alert to file:', error);
    }
  }

  startExternalMonitoring() {
    console.log('🌐 Starting external monitoring (UptimeRobot)...');

    // Send periodic heartbeats to external monitoring service
    setInterval(async () => {
      try {
        await axios.post('https://api.uptimerobot.com/v2/newMonitor', {
          api_key: this.uptimeRobotKey,
          friendly_name: 'OpenMind AI',
          url: this.openmindEndpoint,
          type: 1, // HTTP
          interval: 5 // 5 minutes
        });
      } catch (error) {
        console.error('External monitoring update failed:', error);
      }
    }, 5 * 60 * 1000); // 5 minutes
  }

  formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    return `${days}d ${hours}h ${minutes}m`;
  }

  formatBytes(bytes) {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  getStatus() {
    return {
      lastHeartbeat: this.lastHeartbeat,
      migrationTriggered: this.migrationTriggered,
      monitoring: true,
      endpoint: this.openmindEndpoint
    };
  }
}

// Start the heartbeat monitor
if (require.main === module) {
  const monitor = new HeartbeatMonitor();
  monitor.start();

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n💓 Heartbeat monitor stopping...');
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('\n💓 Heartbeat monitor terminated');
    process.exit(0);
  });
}

module.exports = HeartbeatMonitor;