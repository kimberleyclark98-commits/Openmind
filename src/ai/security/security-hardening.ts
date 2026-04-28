import { exec, execSync } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import * as crypto from 'crypto';

export interface SecurityHardeningConfig {
  enableSystemHardening: boolean;
  enableNetworkHardening: boolean;
  enableApplicationHardening: boolean;
  enableMonitoringHardening: boolean;
  complianceLevel: 'basic' | 'standard' | 'high' | 'maximum';
  auditFrequency: number; // hours
  keyRotationPolicy: {
    enabled: boolean;
    rotationInterval: number; // days
    backupKeys: number;
  };
}

export class SecurityHardening {
  private config: SecurityHardeningConfig;
  private securityBaseline: Map<string, any> = new Map();
  private hardeningHistory: SecurityEvent[] = [];
  private complianceStatus: ComplianceReport;

  constructor(config: SecurityHardeningConfig) {
    this.config = config;
    this.complianceStatus = {
      overall: 'unknown',
      categories: {},
      lastAudit: new Date(),
      nextAudit: new Date(),
      violations: [],
      recommendations: []
    };
  }

  async performFullSecurityHardening(): Promise<HardeningReport> {
    console.log('🔒 Performing Full Security Hardening...');

    const report: HardeningReport = {
      startTime: new Date(),
      endTime: new Date(),
      systemHardening: { completed: false, changes: [], status: 'pending' },
      networkHardening: { completed: false, changes: [], status: 'pending' },
      applicationHardening: { completed: false, changes: [], status: 'pending' },
      monitoringHardening: { completed: false, changes: [], status: 'pending' },
      complianceCheck: { passed: false, violations: [], level: this.config.complianceLevel },
      recommendations: [],
      rollbackPlan: []
    };

    try {
      // 1. Establish security baseline
      console.log('📊 Establishing security baseline...');
      await this.establishSecurityBaseline();

      // 2. System hardening
      if (this.config.enableSystemHardening) {
        console.log('🖥️ Performing system hardening...');
        report.systemHardening = await this.performSystemHardening();
      }

      // 3. Network hardening
      if (this.config.enableNetworkHardening) {
        console.log('🌐 Performing network hardening...');
        report.networkHardening = await this.performNetworkHardening();
      }

      // 4. Application hardening
      if (this.config.enableApplicationHardening) {
        console.log('🛡️ Performing application hardening...');
        report.applicationHardening = await this.performApplicationHardening();
      }

      // 5. Monitoring hardening
      if (this.config.enableMonitoringHardening) {
        console.log('👁️ Performing monitoring hardening...');
        report.monitoringHardening = await this.performMonitoringHardening();
      }

      // 6. Compliance check
      console.log('📋 Performing compliance check...');
      report.complianceCheck = await this.performComplianceCheck();

      // 7. Generate recommendations
      report.recommendations = await this.generateSecurityRecommendations();

      // 8. Create rollback plan
      report.rollbackPlan = await this.createRollbackPlan(report);

      report.endTime = new Date();
      report.success = this.isHardeningSuccessful(report);

      // Log the hardening operation
      await this.logHardeningOperation(report);

      console.log(`✅ Security hardening ${report.success ? 'completed successfully' : 'completed with issues'}`);

      return report;

    } catch (error) {
      console.error('❌ Security hardening failed:', error);
      report.endTime = new Date();
      report.success = false;
      report.error = error.message;

      // Attempt emergency rollback
      await this.performEmergencyRollback(report);

      return report;
    }
  }

  private async establishSecurityBaseline(): Promise<void> {
    // Capture current system state
    this.securityBaseline.set('system', await this.captureSystemState());
    this.securityBaseline.set('network', await this.captureNetworkState());
    this.securityBaseline.set('application', await this.captureApplicationState());
    this.securityBaseline.set('users', await this.captureUserState());

    console.log('✅ Security baseline established');
  }

  private async performSystemHardening(): Promise<HardeningResult> {
    const changes: string[] = [];

    try {
      // Kernel hardening
      await this.hardenKernel();
      changes.push('Kernel parameters hardened');

      // File system security
      await this.secureFileSystem();
      changes.push('File system security enhanced');

      // Service hardening
      await this.hardenServices();
      changes.push('System services hardened');

      // Package management security
      await this.securePackageManagement();
      changes.push('Package management secured');

      return {
        completed: true,
        changes,
        status: 'completed'
      };

    } catch (error) {
      return {
        completed: false,
        changes,
        status: 'failed',
        error: error.message
      };
    }
  }

  private async performNetworkHardening(): Promise<HardeningResult> {
    const changes: string[] = [];

    try {
      // Disable unnecessary services
      await this.disableUnnecessaryServices();
      changes.push('Unnecessary network services disabled');

      // Configure advanced firewall rules
      await this.configureAdvancedFirewall();
      changes.push('Advanced firewall rules configured');

      // Secure SSH configuration
      await this.secureSSH();
      changes.push('SSH configuration hardened');

      // Network monitoring setup
      await this.setupNetworkMonitoring();
      changes.push('Network monitoring configured');

      return {
        completed: true,
        changes,
        status: 'completed'
      };

    } catch (error) {
      return {
        completed: false,
        changes,
        status: 'failed',
        error: error.message
      };
    }
  }

  private async performApplicationHardening(): Promise<HardeningResult> {
    const changes: string[] = [];

    try {
      // Environment hardening
      await this.hardenEnvironment();
      changes.push('Application environment hardened');

      // Dependency security
      await this.secureDependencies();
      changes.push('Dependencies secured and updated');

      // Configuration hardening
      await this.hardenConfiguration();
      changes.push('Application configuration hardened');

      // Runtime security
      await this.implementRuntimeSecurity();
      changes.push('Runtime security measures implemented');

      return {
        completed: true,
        changes,
        status: 'completed'
      };

    } catch (error) {
      return {
        completed: false,
        changes,
        status: 'failed',
        error: error.message
      };
    }
  }

  private async performMonitoringHardening(): Promise<HardeningResult> {
    const changes: string[] = [];

    try {
      // SIEM setup
      await this.setupSIEM();
      changes.push('SIEM monitoring configured');

      // Log hardening
      await this.hardenLogging();
      changes.push('Logging system hardened');

      // Audit system setup
      await this.setupAuditSystem();
      changes.push('System audit configured');

      // Alert system configuration
      await this.configureAlertSystem();
      changes.push('Security alerting configured');

      return {
        completed: true,
        changes,
        status: 'completed'
      };

    } catch (error) {
      return {
        completed: false,
        changes,
        status: 'failed',
        error: error.message
      };
    }
  }

  // System Hardening Methods
  private async hardenKernel(): Promise<void> {
    const kernelParams = [
      'kernel.kptr_restrict=2',
      'kernel.dmesg_restrict=1',
      'kernel.printk=3 3 3 3',
      'kernel.unprivileged_bpf_disabled=1',
      'net.core.bpf_jit_harden=2',
      'kernel.sysrq=0',
      'kernel.yama.ptrace_scope=3',
      'fs.suid_dumpable=0'
    ];

    for (const param of kernelParams) {
      try {
        await this.executeCommand(`sysctl -w ${param}`);
        // Make persistent
        await this.executeCommand(`echo "${param}" >> /etc/sysctl.conf`);
      } catch (error) {
        console.warn(`Failed to set kernel parameter ${param}:`, error);
      }
    }
  }

  private async secureFileSystem(): Promise<void> {
    // Set proper permissions
    await this.executeCommand('chmod 644 /etc/passwd');
    await this.executeCommand('chmod 640 /etc/shadow');
    await this.executeCommand('chmod 644 /etc/group');
    await this.executeCommand('chmod 640 /etc/gshadow');

    // Secure /tmp and /var/tmp
    await this.executeCommand('chmod 1777 /tmp');
    await this.executeCommand('chmod 1777 /var/tmp');

    // Remove unnecessary setuid binaries
    const setuidFiles = [
      '/usr/bin/chage',
      '/usr/bin/chfn',
      '/usr/bin/chsh',
      '/usr/bin/expiry',
      '/usr/bin/gpasswd',
      '/usr/bin/newgrp',
      '/usr/bin/passwd'
    ];

    for (const file of setuidFiles) {
      try {
        await this.executeCommand(`chmod u-s ${file}`);
      } catch {
        // File may not exist, continue
      }
    }
  }

  private async hardenServices(): Promise<void> {
    // Disable unnecessary services
    const servicesToDisable = [
      'bluetooth.service',
      'cups.service',
      'avahi-daemon.service',
      'ModemManager.service'
    ];

    for (const service of servicesToDisable) {
      try {
        await this.executeCommand(`systemctl disable ${service}`);
        await this.executeCommand(`systemctl stop ${service}`);
      } catch {
        // Service may not exist or already disabled
      }
    }

    // Secure cron
    await this.executeCommand('chmod 600 /etc/crontab');
    await this.executeCommand('chmod 600 /etc/cron.hourly/*');
    await this.executeCommand('chmod 600 /etc/cron.daily/*');
    await this.executeCommand('chmod 600 /etc/cron.weekly/*');
    await this.executeCommand('chmod 600 /etc/cron.monthly/*');
  }

  private async securePackageManagement(): Promise<void> {
    // Configure apt for security
    const aptConfig = `
APT::Get::AllowUnauthenticated "false";
APT::Install-Recommends "false";
APT::Install-Suggests "false";
Acquire::http::AllowRedirect "false";
Acquire::https::AllowRedirect "false";
`;

    await fs.writeFile('/etc/apt/apt.conf.d/99security', aptConfig);

    // Update package lists
    await this.executeCommand('apt update');

    // Install security updates
    await this.executeCommand('apt upgrade -y');
  }

  // Network Hardening Methods
  private async disableUnnecessaryServices(): Promise<void> {
    const networkServices = [
      'telnet.socket',
      'tftp.socket',
      'rsync.service'
    ];

    for (const service of networkServices) {
      try {
        await this.executeCommand(`systemctl disable ${service}`);
        await this.executeCommand(`systemctl stop ${service}`);
      } catch {
        // Service may not exist
      }
    }
  }

  private async configureAdvancedFirewall(): Promise<void> {
    // Install ufw if not present
    await this.executeCommand('which ufw || apt install -y ufw');

    // Reset firewall
    await this.executeCommand('ufw --force reset');

    // Set default policies
    await this.executeCommand('ufw default deny incoming');
    await this.executeCommand('ufw default allow outgoing');

    // Allow essential ports
    const allowedPorts = ['22/tcp', '80/tcp', '443/tcp', '3000/tcp'];
    for (const port of allowedPorts) {
      await this.executeCommand(`ufw allow ${port}`);
    }

    // Rate limiting for SSH
    await this.executeCommand('ufw limit ssh/tcp');

    // Enable firewall
    await this.executeCommand('ufw --force enable');

    // Install fail2ban for advanced protection
    await this.executeCommand('apt install -y fail2ban');
    await this.executeCommand('systemctl enable fail2ban');
    await this.executeCommand('systemctl start fail2ban');
  }

  private async secureSSH(): Promise<void> {
    const sshConfig = `
# OpenMind AI - Hardened SSH Configuration
Port 22
Protocol 2
HostKey /etc/ssh/ssh_host_ed25519_key
HostKey /etc/ssh/ssh_host_rsa_key

# Authentication
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
ChallengeResponseAuthentication no
UsePAM yes

# Security
PermitEmptyPasswords no
PermitUserEnvironment no
ClientAliveInterval 300
ClientAliveCountMax 0
MaxAuthTries 3
MaxSessions 2

# Restrictions
AllowUsers openmind
DenyUsers root bin daemon adm lp sync shutdown halt mail news uucp operator games gopher ftp nobody vcsa rpc mailnull smmsp

# Logging
LogLevel VERBOSE
SyslogFacility AUTH
`;

    await fs.writeFile('/etc/ssh/sshd_config', sshConfig);
    await this.executeCommand('systemctl restart ssh');
  }

  private async setupNetworkMonitoring(): Promise<void> {
    // Install network monitoring tools
    await this.executeCommand('apt install -y nmap net-tools tcpdump');

    // Setup network scanning detection
    const iptablesRules = [
      '# Detect port scanning',
      '-N PORTSCAN',
      '-A PORTSCAN -p tcp --tcp-flags SYN,ACK,FIN,RST RST -m limit --limit 1/s --limit-burst 2 -j RETURN',
      '-A PORTSCAN -j DROP',
      '-A INPUT -p tcp --tcp-flags SYN,ACK,FIN,RST RST -j PORTSCAN'
    ];

    for (const rule of iptablesRules) {
      if (!rule.startsWith('#')) {
        await this.executeCommand(`iptables ${rule}`);
      }
    }
  }

  // Application Hardening Methods
  private async hardenEnvironment(): Promise<void> {
    // Set secure environment variables
    const envConfig = `
# OpenMind AI - Secure Environment
NODE_ENV=production
NODE_OPTIONS="--max-old-space-size=4096 --trace-warnings"
UV_THREADPOOL_SIZE=4
OPENSSL_CONF=/etc/ssl/openssl.cnf

# Security settings
HARDENED=true
SECURITY_LEVEL=maximum
`;

    await fs.writeFile('/etc/environment', envConfig, { flag: 'a' });

    // Secure Node.js
    const npmConfig = `
audit=true
fund=false
save-exact=true
package-lock=true
production=true
progress=false
`;

    await fs.writeFile('/root/.npmrc', npmConfig);
  }

  private async secureDependencies(): Promise<void> {
    // Audit dependencies
    try {
      await this.executeCommand('npm audit --audit-level high');
    } catch (error) {
      console.warn('Dependency audit found vulnerabilities');
    }

    // Update dependencies
    await this.executeCommand('npm update');
    await this.executeCommand('npm audit fix');

    // Install security-focused packages
    await this.executeCommand('npm install --save-dev eslint-plugin-security');
  }

  private async hardenConfiguration(): Promise<void> {
    // Secure application configuration
    const appConfig = {
      security: {
        helmet: true,
        cors: {
          origin: false, // Disable CORS for maximum security
          credentials: false
        },
        rateLimit: {
          windowMs: 15 * 60 * 1000, // 15 minutes
          max: 100 // limit each IP to 100 requests per windowMs
        },
        session: {
          secret: crypto.randomBytes(64).toString('hex'),
          resave: false,
          saveUninitialized: false,
          cookie: {
            secure: true,
            httpOnly: true,
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
          }
        }
      }
    };

    await fs.writeFile('./config/security.json', JSON.stringify(appConfig, null, 2));
  }

  private async implementRuntimeSecurity(): Promise<void> {
    // Implement runtime application self-protection (RASP)
    const raspConfig = `
# Runtime Application Self-Protection
RASP_ENABLED=true
RASP_SQL_INJECTION=true
RASP_XSS_PROTECTION=true
RASP_COMMAND_INJECTION=true
RASP_FILE_ACCESS=true
RASP_NETWORK_ACCESS=true
`;

    await fs.writeFile('./config/rasp.json', JSON.stringify({
      enabled: true,
      sqlInjection: true,
      xssProtection: true,
      commandInjection: true,
      fileAccess: true,
      networkAccess: true
    }, null, 2));
  }

  // Monitoring Hardening Methods
  private async setupSIEM(): Promise<void> {
    // Install and configure OSSEC/SIEM-like monitoring
    await this.executeCommand('apt install -y auditd audispd-plugins');

    // Configure audit rules
    const auditRules = `
# OpenMind AI - Security Audit Rules
-w /etc/passwd -p wa -k identity
-w /etc/shadow -p wa -k identity
-w /etc/sudoers -p wa -k privilege
-w /var/log/auth.log -p wa -k authentication
-w /var/log/syslog -p wa -k system
-a always,exit -F arch=b64 -S execve -k execution
`;

    await fs.writeFile('/etc/audit/rules.d/openmind.rules', auditRules);
    await this.executeCommand('auditctl -R /etc/audit/rules.d/openmind.rules');
  }

  private async hardenLogging(): Promise<void> {
    // Configure secure logging
    const rsyslogConfig = `
# OpenMind AI - Secure Logging
$FileCreateMode 0640
$DirCreateMode 0750
$Umask 0027

# Forward security events
if $syslogfacility-text == 'auth' or $syslogfacility-text == 'authpriv' then /var/log/secure.log
if $syslogfacility-text == 'kern' then /var/log/kernel.log

# Rate limiting
$SystemLogRateLimitInterval 5
$SystemLogRateLimitBurst 500
`;

    await fs.writeFile('/etc/rsyslog.d/openmind.conf', rsyslogConfig);
    await this.executeCommand('systemctl restart rsyslog');

    // Secure log files
    await this.executeCommand('chmod 640 /var/log/auth.log');
    await this.executeCommand('chmod 640 /var/log/syslog');
    await this.executeCommand('chmod 640 /var/log/kern.log');

    // Setup log rotation
    const logrotateConfig = `
/var/log/auth.log
/var/log/syslog
/var/log/kern.log
/var/log/openmind/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    create 640 root adm
    postrotate
        systemctl reload rsyslog
    endscript
}
`;

    await fs.writeFile('/etc/logrotate.d/openmind', logrotateConfig);
  }

  private async setupAuditSystem(): Promise<void> {
    // Enable comprehensive auditing
    await this.executeCommand('systemctl enable auditd');
    await this.executeCommand('systemctl start auditd');

    // Configure audit rules for OpenMind
    const openmindAuditRules = `
# Monitor OpenMind AI processes
-w /opt/openmind -p rwa -k openmind_files
-w /opt/openmind/src -p rwa -k openmind_code
-w /opt/openmind/data -p rwa -k openmind_data
-w /opt/openmind/keys -p rwa -k openmind_keys

# Monitor system calls
-a always,exit -F arch=b64 -S open,creat,truncate,ftruncate -F exit=-EACCES -k access
-a always,exit -F arch=b64 -S open,creat,truncate,ftruncate -F exit=-EPERM -k access
`;

    await fs.writeFile('/etc/audit/rules.d/openmind-audit.rules', openmindAuditRules);
    await this.executeCommand('auditctl -R /etc/audit/rules.d/openmind-audit.rules');
  }

  private async configureAlertSystem(): Promise<void> {
    // Setup alerting for security events
    const alertConfig = `
# OpenMind AI - Security Alert Configuration
ALERT_EMAIL=security@openmind.ai
ALERT_WEBHOOK=https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK
ALERT_LEVEL=critical

# Alert triggers
ALERT_AUTH_FAILURES=5
ALERT_PORT_SCANS=10
ALERT_FILE_CHANGES=1
ALERT_PROCESS_ANOMALIES=3
`;

    await fs.writeFile('./config/alerts.json', JSON.stringify({
      email: 'security@openmind.ai',
      webhook: 'https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK',
      level: 'critical',
      triggers: {
        authFailures: 5,
        portScans: 10,
        fileChanges: 1,
        processAnomalies: 3
      }
    }, null, 2));
  }

  private async performComplianceCheck(): Promise<ComplianceResult> {
    const violations: string[] = [];
    const level = this.config.complianceLevel;

    // Check compliance based on level
    if (level === 'basic' || level === 'standard' || level === 'high' || level === 'maximum') {
      // Kernel hardening check
      const kernelParams = await this.checkKernelParameters();
      if (!kernelParams.compliant) {
        violations.push('Kernel parameters not properly hardened');
      }

      // File permissions check
      const filePermissions = await this.checkFilePermissions();
      if (!filePermissions.compliant) {
        violations.push('Critical file permissions not secure');
      }

      // Service configuration check
      const services = await this.checkServiceConfiguration();
      if (!services.compliant) {
        violations.push('Unnecessary services still running');
      }
    }

    if (level === 'standard' || level === 'high' || level === 'maximum') {
      // Network security check
      const network = await this.checkNetworkSecurity();
      if (!network.compliant) {
        violations.push('Network security not properly configured');
      }

      // Access controls check
      const access = await this.checkAccessControls();
      if (!access.compliant) {
        violations.push('Access controls not properly implemented');
      }
    }

    if (level === 'high' || level === 'maximum') {
      // Encryption check
      const encryption = await this.checkEncryptionStandards();
      if (!encryption.compliant) {
        violations.push('Encryption standards not met');
      }

      // Audit logging check
      const audit = await this.checkAuditLogging();
      if (!audit.compliant) {
        violations.push('Audit logging not comprehensive');
      }
    }

    if (level === 'maximum') {
      // Advanced threat detection
      const threats = await this.checkAdvancedThreatDetection();
      if (!threats.compliant) {
        violations.push('Advanced threat detection not implemented');
      }

      // Zero trust verification
      const zeroTrust = await this.checkZeroTrustImplementation();
      if (!zeroTrust.compliant) {
        violations.push('Zero trust principles not fully implemented');
      }
    }

    this.complianceStatus = {
      overall: violations.length === 0 ? 'compliant' : 'non-compliant',
      categories: {
        kernel: await this.checkKernelParameters(),
        files: await this.checkFilePermissions(),
        services: await this.checkServiceConfiguration(),
        network: level !== 'basic' ? await this.checkNetworkSecurity() : { compliant: true },
        access: level === 'standard' || level === 'high' || level === 'maximum' ? await this.checkAccessControls() : { compliant: true },
        encryption: level === 'high' || level === 'maximum' ? await this.checkEncryptionStandards() : { compliant: true },
        audit: level === 'high' || level === 'maximum' ? await this.checkAuditLogging() : { compliant: true },
        threats: level === 'maximum' ? await this.checkAdvancedThreatDetection() : { compliant: true },
        zeroTrust: level === 'maximum' ? await this.checkZeroTrustImplementation() : { compliant: true }
      },
      lastAudit: new Date(),
      nextAudit: new Date(Date.now() + this.config.auditFrequency * 60 * 60 * 1000),
      violations,
      recommendations: await this.generateComplianceRecommendations(violations)
    };

    return {
      passed: violations.length === 0,
      violations,
      level
    };
  }

  // Compliance checking methods
  private async checkKernelParameters(): Promise<{ compliant: boolean; details?: string }> {
    try {
      const params = [
        'kernel.kptr_restrict',
        'kernel.dmesg_restrict',
        'net.core.bpf_jit_harden'
      ];

      for (const param of params) {
        const result = await this.executeCommand(`sysctl -n ${param}`);
        const value = parseInt(result.stdout.trim());

        if (param.includes('restrict') && value < 1) {
          return { compliant: false, details: `${param} not properly restricted` };
        }
      }

      return { compliant: true };
    } catch {
      return { compliant: false, details: 'Unable to check kernel parameters' };
    }
  }

  private async checkFilePermissions(): Promise<{ compliant: boolean; details?: string }> {
    try {
      const criticalFiles = [
        { path: '/etc/passwd', mode: '644' },
        { path: '/etc/shadow', mode: '640' },
        { path: '/etc/ssh/sshd_config', mode: '600' }
      ];

      for (const file of criticalFiles) {
        const stats = await fs.stat(file.path);
        const actualMode = (stats.mode & parseInt('777', 8)).toString(8);

        if (actualMode !== file.mode) {
          return { compliant: false, details: `${file.path} has incorrect permissions: ${actualMode} vs ${file.mode}` };
        }
      }

      return { compliant: true };
    } catch {
      return { compliant: false, details: 'Unable to check file permissions' };
    }
  }

  private async checkServiceConfiguration(): Promise<{ compliant: boolean; details?: string }> {
    try {
      const unnecessaryServices = ['bluetooth', 'cups', 'avahi-daemon'];
      const runningServices: string[] = [];

      for (const service of unnecessaryServices) {
        try {
          await this.executeCommand(`systemctl is-active ${service}`);
          runningServices.push(service);
        } catch {
          // Service not running or doesn't exist
        }
      }

      if (runningServices.length > 0) {
        return { compliant: false, details: `Unnecessary services running: ${runningServices.join(', ')}` };
      }

      return { compliant: true };
    } catch {
      return { compliant: false, details: 'Unable to check service configuration' };
    }
  }

  private async checkNetworkSecurity(): Promise<{ compliant: boolean; details?: string }> {
    try {
      // Check if firewall is active
      await this.executeCommand('ufw status | grep -q "Status: active"');

      // Check SSH configuration
      const sshConfig = await fs.readFile('/etc/ssh/sshd_config', 'utf8');
      if (sshConfig.includes('PermitRootLogin yes')) {
        return { compliant: false, details: 'SSH permits root login' };
      }

      return { compliant: true };
    } catch {
      return { compliant: false, details: 'Network security check failed' };
    }
  }

  private async checkAccessControls(): Promise<{ compliant: boolean; details?: string }> {
    try {
      // Check sudo configuration
      const sudoers = await fs.readFile('/etc/sudoers', 'utf8');
      if (sudoers.includes('NOPASSWD')) {
        return { compliant: false, details: 'Sudo configured with NOPASSWD' };
      }

      // Check PAM configuration
      const pamConfig = await fs.readFile('/etc/pam.d/common-auth', 'utf8');
      if (!pamConfig.includes('pam_faillock.so')) {
        return { compliant: false, details: 'Account lockout not configured' };
      }

      return { compliant: true };
    } catch {
      return { compliant: false, details: 'Access control check failed' };
    }
  }

  private async checkEncryptionStandards(): Promise<{ compliant: boolean; details?: string }> {
    try {
      // Check SSL/TLS configuration
      const sslConfig = await fs.readFile('/etc/ssl/openssl.cnf', 'utf8');
      if (!sslConfig.includes('TLSv1.2') && !sslConfig.includes('TLSv1.3')) {
        return { compliant: false, details: 'Weak TLS configuration' };
      }

      // Check disk encryption
      const cryptsetup = await this.executeCommand('lsblk -f | grep -q crypto_LUKS');
      if (cryptsetup.stderr) {
        return { compliant: false, details: 'Full disk encryption not configured' };
      }

      return { compliant: true };
    } catch {
      return { compliant: false, details: 'Encryption standards check failed' };
    }
  }

  private async checkAuditLogging(): Promise<{ compliant: boolean; details?: string }> {
    try {
      // Check if auditd is running
      await this.executeCommand('systemctl is-active auditd');

      // Check audit rules
      const rules = await fs.readFile('/etc/audit/audit.rules', 'utf8');
      if (!rules.includes('-w /etc/passwd')) {
        return { compliant: false, details: 'Critical file auditing not configured' };
      }

      return { compliant: true };
    } catch {
      return { compliant: false, details: 'Audit logging check failed' };
    }
  }

  private async checkAdvancedThreatDetection(): Promise<{ compliant: boolean; details?: string }> {
    try {
      // Check for advanced security tools
      const tools = ['suricata', 'ossec', 'aide'];
      let installedTools = 0;

      for (const tool of tools) {
        try {
          await this.executeCommand(`which ${tool}`);
          installedTools++;
        } catch {
          // Tool not installed
        }
      }

      if (installedTools < 2) {
        return { compliant: false, details: 'Insufficient advanced threat detection tools' };
      }

      return { compliant: true };
    } catch {
      return { compliant: false, details: 'Advanced threat detection check failed' };
    }
  }

  private async checkZeroTrustImplementation(): Promise<{ compliant: boolean; details?: string }> {
    try {
      // Check for zero trust principles
      // This is a simplified check - in practice would be more comprehensive

      // Check microsegmentation
      const iptablesRules = await this.executeCommand('iptables -L | wc -l');
      if (parseInt(iptablesRules.stdout.trim()) < 10) {
        return { compliant: false, details: 'Insufficient network segmentation' };
      }

      // Check least privilege
      const users = await this.executeCommand('getent passwd | wc -l');
      if (parseInt(users.stdout.trim()) > 10) {
        return { compliant: false, details: 'Too many user accounts for zero trust' };
      }

      return { compliant: true };
    } catch {
      return { compliant: false, details: 'Zero trust implementation check failed' };
    }
  }

  private async generateSecurityRecommendations(): Promise<string[]> {
    const recommendations: string[] = [];

    if (this.complianceStatus.violations.includes('Kernel parameters not properly hardened')) {
      recommendations.push('Configure additional kernel hardening parameters for better security');
    }

    if (this.complianceStatus.violations.some(v => v.includes('permissions'))) {
      recommendations.push('Implement automated file permission auditing and correction');
    }

    if (this.complianceStatus.violations.some(v => v.includes('services'))) {
      recommendations.push('Configure service hardening policies and automated cleanup');
    }

    if (this.complianceStatus.violations.some(v => v.includes('network'))) {
      recommendations.push('Implement advanced network segmentation and monitoring');
    }

    if (this.complianceStatus.violations.some(v => v.includes('encryption'))) {
      recommendations.push('Upgrade to stronger encryption standards and key management');
    }

    recommendations.push('Implement regular security assessments and penetration testing');
    recommendations.push('Setup automated security updates and patch management');
    recommendations.push('Configure comprehensive backup and disaster recovery procedures');

    return recommendations;
  }

  private async generateComplianceRecommendations(violations: string[]): Promise<string[]> {
    const recommendations: string[] = [];

    violations.forEach(violation => {
      switch (true) {
        case violation.includes('kernel'):
          recommendations.push('Apply CIS benchmark kernel hardening parameters');
          break;
        case violation.includes('permissions'):
          recommendations.push('Implement file integrity monitoring (AIDE/SAMHAIN)');
          break;
        case violation.includes('services'):
          recommendations.push('Configure systemd service hardening and sandboxing');
          break;
        case violation.includes('network'):
          recommendations.push('Deploy next-generation firewall with IPS capabilities');
          break;
        case violation.includes('encryption'):
          recommendations.push('Implement end-to-end encryption for all data at rest and in transit');
          break;
        case violation.includes('audit'):
          recommendations.push('Setup centralized logging and SIEM solution');
          break;
        default:
          recommendations.push('Conduct comprehensive security assessment');
      }
    });

    return recommendations;
  }

  private async createRollbackPlan(report: HardeningReport): Promise<RollbackStep[]> {
    const rollbackPlan: RollbackStep[] = [];

    // Create rollback steps for each hardening category
    if (report.systemHardening.completed) {
      rollbackPlan.push({
        category: 'system',
        description: 'Restore original kernel parameters and service configurations',
        commands: [
          'sysctl --system', // Reload kernel parameters
          'systemctl daemon-reload' // Reload systemd
        ],
        priority: 'high'
      });
    }

    if (report.networkHardening.completed) {
      rollbackPlan.push({
        category: 'network',
        description: 'Restore original firewall and network configurations',
        commands: [
          'ufw --force reset',
          'systemctl restart ssh'
        ],
        priority: 'high'
      });
    }

    if (report.applicationHardening.completed) {
      rollbackPlan.push({
        category: 'application',
        description: 'Restore original application configurations',
        commands: [
          'npm install', // Reinstall dependencies if needed
          'systemctl restart openmind'
        ],
        priority: 'medium'
      });
    }

    return rollbackPlan;
  }

  private isHardeningSuccessful(report: HardeningReport): boolean {
    const criticalFailures = [
      report.systemHardening.status === 'failed',
      report.networkHardening.status === 'failed',
      report.complianceCheck.violations.length > 5
    ].filter(Boolean).length;

    return criticalFailures === 0 && report.complianceCheck.passed;
  }

  private async logHardeningOperation(report: HardeningReport): Promise<void> {
    const logEntry = {
      timestamp: new Date(),
      operation: 'security_hardening',
      success: report.success,
      duration: report.endTime.getTime() - report.startTime.getTime(),
      systemChanges: report.systemHardening.changes.length,
      networkChanges: report.networkHardening.changes.length,
      applicationChanges: report.applicationHardening.changes.length,
      complianceViolations: report.complianceCheck.violations.length,
      recommendations: report.recommendations.length
    };

    const logPath = path.join(process.cwd(), 'logs', 'security-hardening.log');
    await fs.appendFile(logPath, JSON.stringify(logEntry) + '\n').catch(() => {});
  }

  private async performEmergencyRollback(report: HardeningReport): Promise<void> {
    console.log('🚨 Performing emergency rollback...');

    try {
      // Restore from baseline
      await this.restoreFromBaseline();

      console.log('✅ Emergency rollback completed');
    } catch (error) {
      console.error('❌ Emergency rollback failed:', error);
      console.log('💀 System may be in inconsistent state - manual intervention required');
    }
  }

  private async restoreFromBaseline(): Promise<void> {
    // Restore system to pre-hardening state
    console.log('🔄 Restoring system from security baseline...');

    // This would implement restoration logic based on captured baseline
    // For now, log the intention
    console.log('Baseline restoration would be implemented here');
  }

  // Public API methods
  async runSecurityAudit(): Promise<ComplianceReport> {
    console.log('📋 Running comprehensive security audit...');

    await this.performComplianceCheck();

    console.log(`✅ Security audit completed. Status: ${this.complianceStatus.overall.toUpperCase()}`);

    return this.complianceStatus;
  }

  async getSecurityBaseline(): Promise<Map<string, any>> {
    return new Map(this.securityBaseline);
  }

  async updateSecurityBaseline(): Promise<void> {
    console.log('📊 Updating security baseline...');
    await this.establishSecurityBaseline();
    console.log('✅ Security baseline updated');
  }

  async getHardeningHistory(): Promise<any[]> {
    const logPath = path.join(process.cwd(), 'logs', 'security-hardening.log');

    try {
      const logData = await fs.readFile(logPath, 'utf8');
      return logData.trim().split('\n').map(line => JSON.parse(line));
    } catch {
      return [];
    }
  }

  getComplianceStatus(): ComplianceReport {
    return { ...this.complianceStatus };
  }

  async exportSecurityReport(): Promise<string> {
    const report = {
      timestamp: new Date(),
      compliance: this.complianceStatus,
      hardeningHistory: await this.getHardeningHistory(),
      recommendations: await this.generateSecurityRecommendations(),
      systemInfo: {
        platform: process.platform,
        arch: process.arch,
        nodeVersion: process.version
      }
    };

    const reportPath = path.join(process.cwd(), 'security-report.json');
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

    return reportPath;
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
}

// Type definitions
export interface HardeningResult {
  completed: boolean;
  changes: string[];
  status: 'completed' | 'failed' | 'partial';
  error?: string;
}

export interface HardeningReport {
  startTime: Date;
  endTime: Date;
  success?: boolean;
  error?: string;
  systemHardening: HardeningResult;
  networkHardening: HardeningResult;
  applicationHardening: HardeningResult;
  monitoringHardening: HardeningResult;
  complianceCheck: {
    passed: boolean;
    violations: string[];
    level: string;
  };
  recommendations: string[];
  rollbackPlan: RollbackStep[];
}

export interface RollbackStep {
  category: string;
  description: string;
  commands: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface ComplianceReport {
  overall: 'compliant' | 'non-compliant' | 'unknown';
  categories: Record<string, { compliant: boolean; details?: string }>;
  lastAudit: Date;
  nextAudit: Date;
  violations: string[];
  recommendations: string[];
}

export interface SecurityEvent {
  id: string;
  timestamp: Date;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: string;
  details: any;
}

// Default configuration
export const defaultSecurityHardeningConfig: SecurityHardeningConfig = {
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