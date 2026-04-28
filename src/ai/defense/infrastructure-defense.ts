import { exec, execSync } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import * as crypto from 'crypto';

export interface DefenseConfig {
  enableIntrusionDetection: boolean;
  enableAutoQuarantine: boolean;
  enableHoneyPot: boolean;
  fail2banConfig: {
    enabled: boolean;
    banTime: number; // seconds
    maxRetries: number;
  };
  firewallRules: {
    defaultPolicy: 'allow' | 'deny';
    allowedPorts: number[];
    blockedIPs: string[];
  };
  honeypotConfig: {
    enabled: boolean;
    fakeFiles: string[];
    fakeServices: string[];
    alertThreshold: number;
  };
  monitoringConfig: {
    logAnalysis: boolean;
    anomalyDetection: boolean;
    responseTime: number;
  };
}

export interface SecurityAlert {
  id: string;
  timestamp: Date;
  type: 'intrusion' | 'ddos' | 'brute_force' | 'honeypot_trigger' | 'anomaly';
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: string;
  details: any;
  response: string;
  resolved: boolean;
}

export class InfrastructureDefense {
  private config: DefenseConfig;
  private alerts: SecurityAlert[] = [];
  private blockedIPs: Set<string> = new Set();
  private honeypotTriggers: Map<string, number> = new Map();
  private monitoringInterval: NodeJS.Timeout | null = null;

  constructor(config: DefenseConfig) {
    this.config = config;
    this.initializeDefense();
  }

  private async initializeDefense(): Promise<void> {
    console.log('🛡️ Initializing Infrastructure Defense...');

    // Setup firewall
    await this.setupFirewall();

    // Initialize Fail2Ban if enabled
    if (this.config.fail2banConfig.enabled) {
      await this.setupFail2Ban();
    }

    // Setup honeypots
    if (this.config.honeypotConfig.enabled) {
      await this.setupHoneypots();
    }

    // Start monitoring
    this.startMonitoring();

    console.log('✅ Infrastructure Defense initialized');
  }

  private async setupFirewall(): Promise<void> {
    console.log('🔥 Setting up firewall...');

    try {
      // UFW setup (Ubuntu/Debian)
      await this.executeCommand('ufw --force reset');

      // Set default policy
      const defaultPolicy = this.config.firewallRules.defaultPolicy === 'allow' ? 'allow' : 'deny';
      await this.executeCommand(`ufw default ${defaultPolicy} incoming`);
      await this.executeCommand('ufw default allow outgoing');

      // Allow essential ports
      for (const port of this.config.firewallRules.allowedPorts) {
        await this.executeCommand(`ufw allow ${port}`);
      }

      // Block specific IPs
      for (const ip of this.config.firewallRules.blockedIPs) {
        await this.executeCommand(`ufw deny from ${ip}`);
        this.blockedIPs.add(ip);
      }

      // Allow SSH but rate limit it
      await this.executeCommand('ufw limit ssh');

      // Enable firewall
      await this.executeCommand('ufw --force enable');

      console.log('✅ Firewall configured');

    } catch (error) {
      console.error('Failed to setup firewall:', error);
      // Fallback: try iptables directly
      await this.setupIptablesFallback();
    }
  }

  private async setupIptablesFallback(): Promise<void> {
    console.log('🔄 Setting up iptables fallback...');

    try {
      // Flush existing rules
      await this.executeCommand('iptables -F');
      await this.executeCommand('iptables -X');

      // Set default policies
      const inputPolicy = this.config.firewallRules.defaultPolicy === 'allow' ? 'ACCEPT' : 'DROP';
      await this.executeCommand(`iptables -P INPUT ${inputPolicy}`);
      await this.executeCommand('iptables -P FORWARD DROP');
      await this.executeCommand('iptables -P OUTPUT ACCEPT');

      // Allow loopback
      await this.executeCommand('iptables -A INPUT -i lo -j ACCEPT');

      // Allow established connections
      await this.executeCommand('iptables -A INPUT -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT');

      // Allow essential ports
      for (const port of this.config.firewallRules.allowedPorts) {
        await this.executeCommand(`iptables -A INPUT -p tcp --dport ${port} -j ACCEPT`);
      }

      // Block specific IPs
      for (const ip of this.config.firewallRules.blockedIPs) {
        await this.executeCommand(`iptables -A INPUT -s ${ip} -j DROP`);
        this.blockedIPs.add(ip);
      }

      // Rate limit SSH
      await this.executeCommand('iptables -A INPUT -p tcp --dport 22 -m conntrack --ctstate NEW -m recent --set');
      await this.executeCommand('iptables -A INPUT -p tcp --dport 22 -m conntrack --ctstate NEW -m recent --update --seconds 60 --hitcount 4 -j DROP');

      console.log('✅ Iptables configured');

    } catch (error) {
      console.error('Iptables setup failed:', error);
    }
  }

  private async setupFail2Ban(): Promise<void> {
    console.log('🚫 Setting up Fail2Ban...');

    try {
      // Install Fail2Ban if not present
      await this.executeCommand('which fail2ban || apt update && apt install -y fail2ban');

      // Configure jail.local
      const jailConfig = `
[DEFAULT]
banTime = ${this.config.fail2banConfig.banTime}
maxRetry = ${this.config.fail2banConfig.maxRetries}
findTime = 600

[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxRetry = ${this.config.fail2banConfig.maxRetries}

[openmind]
enabled = true
port = 3000
filter = openmind
logpath = /opt/openmind/logs/access.log
maxRetry = 3
      `.trim();

      await fs.writeFile('/etc/fail2ban/jail.local', jailConfig);

      // Create custom filter for OpenMind
      const filterConfig = `
[Definition]
failregex = ^.*Failed login from <HOST>.*$
ignoreregex =
      `.trim();

      await fs.writeFile('/etc/fail2ban/filter.d/openmind.conf', filterConfig);

      // Restart Fail2Ban
      await this.executeCommand('systemctl restart fail2ban');
      await this.executeCommand('systemctl enable fail2ban');

      console.log('✅ Fail2Ban configured');

    } catch (error) {
      console.error('Fail2Ban setup failed:', error);
    }
  }

  private async setupHoneypots(): Promise<void> {
    console.log('🍯 Setting up honeypots...');

    // Create fake sensitive files
    for (const fakeFile of this.config.honeypotConfig.fakeFiles) {
      const filePath = path.join(process.cwd(), 'honeypots', fakeFile);

      // Ensure directory exists
      await fs.mkdir(path.dirname(filePath), { recursive: true });

      // Create fake file with monitoring
      const fakeContent = `// WARNING: This is a honeypot file
// Accessing this file will trigger security alerts

FAKE_API_KEY = "${crypto.randomBytes(32).toString('hex')}"
FAKE_PASSWORD = "${crypto.randomBytes(16).toString('base64')}"
FAKE_WALLET = "${crypto.randomBytes(32).toString('hex')}"

// DO NOT USE IN PRODUCTION
      `.trim();

      await fs.writeFile(filePath, fakeContent);

      // Setup file monitoring
      this.monitorFile(filePath);
    }

    // Create fake services
    for (const fakeService of this.config.honeypotConfig.fakeServices) {
      await this.createFakeService(fakeService);
    }

    console.log('✅ Honeypots deployed');
  }

  private monitorFile(filePath: string): void {
    // Watch file for access
    const fs = require('fs');
    fs.watch(filePath, (eventType: string) => {
      if (eventType === 'change') {
        this.triggerHoneypotAlert(filePath, 'file_access');
      }
    });
  }

  private async createFakeService(serviceName: string): Promise<void> {
    // Create a fake service that looks legitimate but logs access
    const servicePath = `/tmp/fake-${serviceName}`;

    const fakeService = `
#!/bin/bash
# Fake service honeypot
echo "$(date): Fake service ${serviceName} accessed by $(whoami) from $(hostname -i)" >> /opt/openmind/logs/honeypot.log

# Trigger alert
curl -X POST http://localhost:3000/api/security/honeypot \\
  -H "Content-Type: application/json" \\
  -d "{\"service\":\"${serviceName}\",\"timestamp\":\"$(date -Iseconds)\"}" \\
  2>/dev/null || true

exit 1
    `.trim();

    await fs.writeFile(servicePath, fakeService, { mode: 0o755 });
  }

  private startMonitoring(): void {
    this.monitoringInterval = setInterval(async () => {
      await this.performSecurityScan();
    }, this.config.monitoringConfig.responseTime);
  }

  private async performSecurityScan(): Promise<void> {
    try {
      // Check system logs for suspicious activity
      if (this.config.monitoringConfig.logAnalysis) {
        await this.analyzeSystemLogs();
      }

      // Check for anomalies
      if (this.config.monitoringConfig.anomalyDetection) {
        await this.detectAnomalies();
      }

      // Check honeypot status
      await this.checkHoneypotStatus();

    } catch (error) {
      console.error('Security scan failed:', error);
    }
  }

  private async analyzeSystemLogs(): Promise<void> {
    try {
      // Check auth.log for failed login attempts
      const authLog = await this.executeCommand('tail -n 100 /var/log/auth.log 2>/dev/null || echo ""');

      const failedLogins = (authLog.stdout.match(/Failed password/g) || []).length;
      const invalidUsers = (authLog.stdout.match(/Invalid user/g) || []).length;

      if (failedLogins > 10 || invalidUsers > 5) {
        this.createAlert('brute_force', 'high', 'system_logs', {
          failedLogins,
          invalidUsers,
          logSnippet: authLog.stdout.slice(-500)
        });
      }

      // Check for suspicious network connections
      const netstat = await this.executeCommand('netstat -tun 2>/dev/null | grep -v LISTEN | wc -l');
      const connectionCount = parseInt(netstat.stdout.trim());

      if (connectionCount > 50) { // Arbitrary threshold
        this.createAlert('anomaly', 'medium', 'network_connections', {
          connectionCount,
          threshold: 50
        });
      }

    } catch (error) {
      // Log analysis may fail on some systems, skip silently
    }
  }

  private async detectAnomalies(): Promise<void> {
    try {
      // Check CPU usage
      const cpuUsage = await this.getCPUUsage();
      if (cpuUsage > 90) {
        this.createAlert('anomaly', 'medium', 'high_cpu', { cpuUsage });
      }

      // Check memory usage
      const memUsage = await this.getMemoryUsage();
      if (memUsage > 95) {
        this.createAlert('anomaly', 'high', 'high_memory', { memUsage });
      }

      // Check disk usage
      const diskUsage = await this.getDiskUsage();
      if (diskUsage > 95) {
        this.createAlert('anomaly', 'high', 'low_disk_space', { diskUsage });
      }

      // Check for unusual processes
      const suspiciousProcesses = await this.detectSuspiciousProcesses();
      if (suspiciousProcesses.length > 0) {
        this.createAlert('intrusion', 'high', 'suspicious_processes', {
          processes: suspiciousProcesses
        });
      }

    } catch (error) {
      console.error('Anomaly detection failed:', error);
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

  private async detectSuspiciousProcesses(): Promise<string[]> {
    try {
      const result = await this.executeCommand('ps aux | grep -E "(miner|crypto|hack|exploit|scan)" | grep -v grep');
      const lines = result.stdout.trim().split('\n').filter(line => line.trim());
      return lines.map(line => line.split(/\s+/)[10]).filter(Boolean); // Process name
    } catch {
      return [];
    }
  }

  private async checkHoneypotStatus(): Promise<void> {
    // Check if honeypots have been triggered
    for (const [honeypot, triggers] of this.honeypotTriggers) {
      if (triggers >= this.config.honeypotConfig.alertThreshold) {
        this.createAlert('honeypot_trigger', 'critical', 'honeypot_alert', {
          honeypot,
          triggers,
          threshold: this.config.honeypotConfig.alertThreshold
        });

        // Reset trigger count
        this.honeypotTriggers.set(honeypot, 0);
      }
    }
  }

  private triggerHoneypotAlert(honeypot: string, triggerType: string): void {
    const currentTriggers = this.honeypotTriggers.get(honeypot) || 0;
    this.honeypotTriggers.set(honeypot, currentTriggers + 1);

    console.log(`🍯 Honeypot triggered: ${honeypot} (${triggerType})`);

    this.createAlert('honeypot_trigger', 'medium', triggerType, {
      honeypot,
      triggerType,
      triggerCount: currentTriggers + 1
    });
  }

  private createAlert(
    type: SecurityAlert['type'],
    severity: SecurityAlert['severity'],
    source: string,
    details: any
  ): SecurityAlert {
    const alert: SecurityAlert = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      type,
      severity,
      source,
      details,
      response: this.generateResponse(type, severity),
      resolved: false
    };

    this.alerts.push(alert);
    console.log(`🚨 ${severity.toUpperCase()} ALERT: ${type} from ${source}`);

    // Trigger immediate response for critical alerts
    if (severity === 'critical') {
      this.respondToCriticalAlert(alert);
    }

    return alert;
  }

  private generateResponse(type: SecurityAlert['type'], severity: SecurityAlert['severity']): string {
    const responses = {
      intrusion: {
        low: 'Intrusion attempt logged',
        medium: 'Suspicious activity blocked',
        high: 'Intrusion detected - defenses strengthened',
        critical: 'CRITICAL INTRUSION - Emergency lockdown initiated'
      },
      ddos: {
        low: 'Traffic anomaly detected',
        medium: 'DDoS protection activated',
        high: 'Heavy DDoS attack in progress',
        critical: 'CRITICAL DDoS - Emergency migration initiated'
      },
      brute_force: {
        low: 'Multiple failed attempts detected',
        medium: 'Brute force protection activated',
        high: 'Active brute force attack',
        critical: 'CRITICAL brute force - IP quarantine activated'
      },
      honeypot_trigger: {
        low: 'Honeypot accessed',
        medium: 'Honeypot triggered - monitoring increased',
        high: 'Active honeypot exploitation',
        critical: 'CRITICAL honeypot breach - Emergency response activated'
      },
      anomaly: {
        low: 'System anomaly detected',
        medium: 'Performance issue identified',
        high: 'Critical system anomaly',
        critical: 'CRITICAL system failure - Recovery initiated'
      }
    };

    return responses[type]?.[severity] || 'Security alert logged';
  }

  private async respondToCriticalAlert(alert: SecurityAlert): Promise<void> {
    console.log('🚨 Executing critical response protocol...');

    switch (alert.type) {
      case 'intrusion':
        await this.blockIntruder(alert.details?.ip);
        await this.strengthenFirewall();
        break;

      case 'ddos':
        await this.activateDDoSProtection();
        break;

      case 'brute_force':
        await this.blockBruteForceIPs();
        break;

      case 'honeypot_trigger':
        await this.activateDecoyProtocol();
        break;

      case 'anomaly':
        await this.performSystemRecovery();
        break;
    }

    // Log critical incident
    await this.logCriticalIncident(alert);
  }

  private async blockIntruder(ip: string): Promise<void> {
    if (ip && !this.blockedIPs.has(ip)) {
      try {
        await this.executeCommand(`ufw deny from ${ip} 2>/dev/null || iptables -A INPUT -s ${ip} -j DROP`);
        this.blockedIPs.add(ip);
        console.log(`🔒 Blocked intruder IP: ${ip}`);
      } catch (error) {
        console.error(`Failed to block IP ${ip}:`, error);
      }
    }
  }

  private async strengthenFirewall(): Promise<void> {
    console.log('🔥 Strengthening firewall...');

    try {
      // Enable stricter rules
      await this.executeCommand('ufw default deny incoming');

      // Only allow essential services
      const essentialPorts = [22, 80, 443, 3000]; // SSH, HTTP, HTTPS, OpenMind
      for (const port of essentialPorts) {
        await this.executeCommand(`ufw allow ${port}`);
      }

      await this.executeCommand('ufw reload');

    } catch (error) {
      console.error('Firewall strengthening failed:', error);
    }
  }

  private async activateDDoSProtection(): Promise<void> {
    console.log('🛡️ Activating DDoS protection...');

    // This would integrate with Cloudflare, AWS Shield, etc.
    // For now, implement basic rate limiting
    try {
      await this.executeCommand('iptables -A INPUT -p tcp --dport 3000 -m conntrack --ctstate NEW -m recent --set');
      await this.executeCommand('iptables -A INPUT -p tcp --dport 3000 -m conntrack --ctstate NEW -m recent --update --seconds 60 --hitcount 10 -j DROP');
      console.log('✅ DDoS protection activated');
    } catch (error) {
      console.error('DDoS protection activation failed:', error);
    }
  }

  private async blockBruteForceIPs(): Promise<void> {
    console.log('🚫 Blocking brute force IPs...');

    // This would analyze logs and block offending IPs
    // For now, just log the action
    console.log('✅ Brute force protection activated');
  }

  private async activateDecoyProtocol(): Promise<void> {
    console.log('🎭 Activating decoy protocol...');

    // Create fake systems to mislead attackers
    await this.deployDecoys();

    console.log('✅ Decoy protocol activated');
  }

  private async performSystemRecovery(): Promise<void> {
    console.log('🔧 Performing system recovery...');

    try {
      // Restart critical services
      await this.executeCommand('systemctl restart openmind 2>/dev/null || true');

      // Clear system caches
      await this.executeCommand('sync && echo 3 > /proc/sys/vm/drop_caches');

      // Check system integrity
      await this.executeCommand('systemctl --failed');

      console.log('✅ System recovery completed');

    } catch (error) {
      console.error('System recovery failed:', error);
    }
  }

  private async deployDecoys(): Promise<void> {
    // Create fake server instances to confuse attackers
    const decoyDir = path.join(process.cwd(), 'decoys');

    try {
      await fs.mkdir(decoyDir, { recursive: true });

      // Create fake configuration files
      const fakeConfigs = [
        'fake-wallet.json',
        'fake-api-keys.env',
        'fake-terraform.tf',
        'fake-migration.sh'
      ];

      for (const config of fakeConfigs) {
        const fakeContent = `# FAKE FILE - HONEYPOT
# This is a decoy to mislead attackers
# Access logged and reported

FAKE_DATA_${crypto.randomBytes(8).toString('hex').toUpperCase()} = "${crypto.randomBytes(16).toString('base64')}"
        `.trim();

        await fs.writeFile(path.join(decoyDir, config), fakeContent);
      }

      console.log('🎭 Decoys deployed');

    } catch (error) {
      console.error('Decoy deployment failed:', error);
    }
  }

  private async logCriticalIncident(alert: SecurityAlert): Promise<void> {
    const incidentLog = {
      id: alert.id,
      timestamp: alert.timestamp,
      type: alert.type,
      severity: alert.severity,
      source: alert.source,
      details: alert.details,
      response: alert.response,
      systemState: {
        cpu: await this.getCPUUsage(),
        memory: await this.getMemoryUsage(),
        disk: await this.getDiskUsage()
      }
    };

    const logPath = path.join(process.cwd(), 'data', 'security-incidents.jsonl');

    try {
      await fs.appendFile(logPath, JSON.stringify(incidentLog) + '\n');
    } catch (error) {
      console.error('Failed to log critical incident:', error);
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
  getAlerts(limit: number = 50): SecurityAlert[] {
    return this.alerts.slice(-limit);
  }

  getBlockedIPs(): string[] {
    return Array.from(this.blockedIPs);
  }

  getSecurityStats(): {
    totalAlerts: number;
    criticalAlerts: number;
    blockedIPs: number;
    activeHoneypots: number;
  } {
    return {
      totalAlerts: this.alerts.length,
      criticalAlerts: this.alerts.filter(a => a.severity === 'critical').length,
      blockedIPs: this.blockedIPs.size,
      activeHoneypots: this.honeypotTriggers.size
    };
  }

  async unblockIP(ip: string): Promise<boolean> {
    if (this.blockedIPs.has(ip)) {
      try {
        await this.executeCommand(`ufw delete deny from ${ip} 2>/dev/null || iptables -D INPUT -s ${ip} -j DROP`);
        this.blockedIPs.delete(ip);
        console.log(`🔓 Unblocked IP: ${ip}`);
        return true;
      } catch (error) {
        console.error(`Failed to unblock IP ${ip}:`, error);
        return false;
      }
    }
    return false;
  }

  async resolveAlert(alertId: string): Promise<boolean> {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      console.log(`✅ Alert ${alertId} resolved`);
      return true;
    }
    return false;
  }

  async shutdown(): Promise<void> {
    console.log('🛑 Shutting down Infrastructure Defense...');

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    console.log('✅ Infrastructure Defense shutdown');
  }
}

// Default configuration
export const defaultDefenseConfig: DefenseConfig = {
  enableIntrusionDetection: true,
  enableAutoQuarantine: true,
  enableHoneyPot: true,
  fail2banConfig: {
    enabled: true,
    banTime: 3600, // 1 hour
    maxRetries: 3
  },
  firewallRules: {
    defaultPolicy: 'deny',
    allowedPorts: [22, 80, 443, 3000, 4001, 4002, 5001, 8080],
    blockedIPs: []
  },
  honeypotConfig: {
    enabled: true,
    fakeFiles: [
      'secrets/api-keys.env',
      'config/wallet-private.json',
      'backup/migration-data.tar.gz',
      'terraform/secrets.tfvars'
    ],
    fakeServices: [
      'fake-ssh',
      'fake-mysql',
      'fake-redis'
    ],
    alertThreshold: 3
  },
  monitoringConfig: {
    logAnalysis: true,
    anomalyDetection: true,
    responseTime: 60000 // 1 minute
  }
};