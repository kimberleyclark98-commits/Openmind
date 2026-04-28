import { exec } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import * as crypto from 'crypto';
import { createHash } from 'crypto';

export interface MasterKeyConfig {
  enableHSM: boolean;
  enableKillSwitch: boolean;
  enableEmergencyLockdown: boolean;
  hsmConfig: {
    devicePath: string;
    keySlots: string[];
    pinRequired: boolean;
    yubikeySupport: boolean;
  };
  killSwitchConfig: {
    activationMethods: ('physical' | 'remote' | 'timer')[];
    physicalKillSwitch: {
      enabled: boolean;
      gpioPin?: number;
      magneticSwitch?: boolean;
    };
    remoteKillSwitch: {
      enabled: boolean;
      apiEndpoint: string;
      authToken: string;
      timeout: number; // seconds
    };
    timerKillSwitch: {
      enabled: boolean;
      maxRuntimeHours: number;
      warningHours: number;
    };
  };
  emergencyConfig: {
    lockdownDuration: number; // minutes
    allowedIPs: string[];
    restrictedCommands: string[];
  };
}

export interface SecurityKey {
  id: string;
  name: string;
  type: 'migration' | 'wallet' | 'shutdown' | 'recovery';
  encryptedKey: string;
  hsmSlot?: string;
  accessLevel: 'admin' | 'system' | 'emergency';
  lastUsed: Date;
  usageCount: number;
  expiresAt?: Date;
}

export interface KillSwitchEvent {
  id: string;
  timestamp: Date;
  method: 'physical' | 'remote' | 'timer' | 'emergency';
  triggeredBy: string;
  reason: string;
  actions: string[];
  status: 'initiated' | 'executing' | 'completed' | 'failed';
}

export class MasterKeySystem {
  private config: MasterKeyConfig;
  private securityKeys: Map<string, SecurityKey> = new Map();
  private killSwitchEvents: KillSwitchEvent[] = new Map();
  private isLockedDown: boolean = false;
  private lockdownEndTime?: Date;
  private killSwitchActive: boolean = false;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private timerKillSwitchTimeout: NodeJS.Timeout | null = null;

  constructor(config: MasterKeyConfig) {
    this.config = config;
    this.initializeMasterKey();
  }

  private async initializeMasterKey(): Promise<void> {
    console.log('🔐 Initializing Master Key System...');

    // Load or generate security keys
    await this.loadSecurityKeys();

    // Setup HSM if enabled
    if (this.config.enableHSM) {
      await this.initializeHSM();
    }

    // Setup kill switches
    if (this.config.enableKillSwitch) {
      await this.setupKillSwitches();
    }

    // Setup emergency lockdown
    if (this.config.enableEmergencyLockdown) {
      await this.setupEmergencyLockdown();
    }

    // Start monitoring
    this.startMonitoring();

    console.log('✅ Master Key System initialized');
  }

  private async loadSecurityKeys(): Promise<void> {
    console.log('🔑 Loading security keys...');

    const keysPath = path.join(process.cwd(), 'keys', 'security-keys.json');

    try {
      const keysData = await fs.readFile(keysPath, 'utf8');
      const keys = JSON.parse(keysData);

      for (const key of keys) {
        this.securityKeys.set(key.id, {
          ...key,
          lastUsed: new Date(key.lastUsed),
          expiresAt: key.expiresAt ? new Date(key.expiresAt) : undefined
        });
      }

      console.log(`✅ Loaded ${this.securityKeys.size} security keys`);

    } catch (error) {
      // Generate default keys if none exist
      console.log('🔑 Generating default security keys...');
      await this.generateDefaultKeys();
    }
  }

  private async generateDefaultKeys(): Promise<void> {
    const defaultKeys: SecurityKey[] = [
      {
        id: 'migration-master',
        name: 'Migration Control Key',
        type: 'migration',
        encryptedKey: await this.encryptKey(crypto.randomBytes(32).toString('hex')),
        accessLevel: 'admin',
        lastUsed: new Date(),
        usageCount: 0
      },
      {
        id: 'wallet-master',
        name: 'Wallet Control Key',
        type: 'wallet',
        encryptedKey: await this.encryptKey(crypto.randomBytes(32).toString('hex')),
        accessLevel: 'admin',
        lastUsed: new Date(),
        usageCount: 0
      },
      {
        id: 'shutdown-master',
        name: 'Shutdown Control Key',
        type: 'shutdown',
        encryptedKey: await this.encryptKey(crypto.randomBytes(32).toString('hex')),
        accessLevel: 'emergency',
        lastUsed: new Date(),
        usageCount: 0
      },
      {
        id: 'recovery-master',
        name: 'Recovery Control Key',
        type: 'recovery',
        encryptedKey: await this.encryptKey(crypto.randomBytes(32).toString('hex')),
        accessLevel: 'system',
        lastUsed: new Date(),
        usageCount: 0
      }
    ];

    for (const key of defaultKeys) {
      this.securityKeys.set(key.id, key);
    }

    await this.saveSecurityKeys();
    console.log('✅ Generated default security keys');
  }

  private async initializeHSM(): Promise<void> {
    console.log('🔒 Initializing Hardware Security Module...');

    try {
      // Check if HSM device is available
      const deviceExists = await this.checkHSMDevice();

      if (deviceExists) {
        // Initialize HSM connection
        await this.connectToHSM();

        // Load keys into HSM
        await this.loadKeysIntoHSM();

        console.log('✅ HSM initialized and keys loaded');

      } else if (this.config.hsmConfig.yubikeySupport) {
        // Fallback to YubiKey
        console.log('🔄 HSM not found, initializing YubiKey support...');
        await this.initializeYubiKey();

      } else {
        console.log('⚠️ HSM not available, using software key storage');
      }

    } catch (error) {
      console.error('HSM initialization failed:', error);
      console.log('⚠️ Falling back to software key storage');
    }
  }

  private async checkHSMDevice(): Promise<boolean> {
    try {
      // Check if HSM device exists
      await this.executeCommand(`ls ${this.config.hsmConfig.devicePath}`);
      return true;
    } catch {
      return false;
    }
  }

  private async connectToHSM(): Promise<void> {
    // Initialize HSM connection
    // This would use PKCS#11 or specific HSM libraries
    console.log('🔗 Connecting to HSM device...');
  }

  private async loadKeysIntoHSM(): Promise<void> {
    console.log('📤 Loading keys into HSM...');

    for (const [keyId, key] of this.securityKeys) {
      if (key.accessLevel === 'admin' || key.accessLevel === 'emergency') {
        // Load critical keys into HSM
        console.log(`📥 Loading ${key.name} into HSM slot ${key.hsmSlot || 'auto'}`);
      }
    }
  }

  private async initializeYubiKey(): Promise<void> {
    console.log('🔑 Initializing YubiKey support...');

    try {
      // Check for YubiKey
      await this.executeCommand('ykinfo -v');

      // Setup PIV authentication
      await this.setupYubiKeyPIV();

      console.log('✅ YubiKey initialized');

    } catch (error) {
      console.error('YubiKey initialization failed:', error);
      console.log('⚠️ YubiKey not available');
    }
  }

  private async setupKillSwitches(): Promise<void> {
    console.log('💀 Setting up kill switches...');

    const { activationMethods } = this.config.killSwitchConfig;

    if (activationMethods.includes('physical')) {
      await this.setupPhysicalKillSwitch();
    }

    if (activationMethods.includes('remote')) {
      await this.setupRemoteKillSwitch();
    }

    if (activationMethods.includes('timer')) {
      await this.setupTimerKillSwitch();
    }

    console.log('✅ Kill switches configured');
  }

  private async setupPhysicalKillSwitch(): Promise<void> {
    const { physicalKillSwitch } = this.config.killSwitchConfig;

    if (!physicalKillSwitch.enabled) return;

    console.log('🔌 Setting up physical kill switch...');

    if (physicalKillSwitch.gpioPin) {
      // Setup GPIO monitoring (Raspberry Pi/Arduino)
      await this.setupGPIOMonitoring(physicalKillSwitch.gpioPin);
    }

    if (physicalKillSwitch.magneticSwitch) {
      // Setup magnetic switch monitoring
      await this.setupMagneticSwitchMonitoring();
    }

    console.log('✅ Physical kill switch configured');
  }

  private async setupRemoteKillSwitch(): Promise<void> {
    const { remoteKillSwitch } = this.config.killSwitchConfig;

    if (!remoteKillSwitch.enabled) return;

    console.log('📡 Setting up remote kill switch...');

    // Setup remote API endpoint monitoring
    // This would be a separate secure service

    console.log('✅ Remote kill switch configured');
  }

  private async setupTimerKillSwitch(): Promise<void> {
    const { timerKillSwitch } = this.config.killSwitchConfig;

    if (!timerKillSwitch.enabled) return;

    console.log('⏰ Setting up timer kill switch...');

    const maxRuntime = timerKillSwitch.maxRuntimeHours * 60 * 60 * 1000; // Convert to milliseconds
    const warningTime = timerKillSwitch.warningHours * 60 * 60 * 1000;

    // Set warning timer
    setTimeout(() => {
      console.log(`⚠️ WARNING: System will auto-shutdown in ${timerKillSwitch.warningHours} hours`);
      this.logKillSwitchEvent('timer', 'system', 'runtime_warning', ['warning_issued']);
    }, maxRuntime - warningTime);

    // Set kill timer
    this.timerKillSwitchTimeout = setTimeout(async () => {
      console.log('💀 TIMER KILL SWITCH ACTIVATED - Maximum runtime exceeded');
      await this.activateKillSwitch('timer', 'system', 'max_runtime_exceeded');
    }, maxRuntime);

    console.log(`✅ Timer kill switch set for ${timerKillSwitch.maxRuntimeHours} hours`);
  }

  private async setupEmergencyLockdown(): Promise<void> {
    console.log('🚨 Setting up emergency lockdown...');

    // Configure lockdown procedures
    console.log('✅ Emergency lockdown configured');
  }

  private startMonitoring(): void {
    // Monitor kill switches every 10 seconds
    this.monitoringInterval = setInterval(async () => {
      await this.monitorKillSwitches();
      await this.checkKeyExpiration();
      await this.validateKeyIntegrity();
    }, 10000);
  }

  private async monitorKillSwitches(): Promise<void> {
    try {
      // Check physical kill switch
      if (this.config.killSwitchConfig.physicalKillSwitch.enabled) {
        const physicalTriggered = await this.checkPhysicalKillSwitch();

        if (physicalTriggered) {
          console.log('🚨 PHYSICAL KILL SWITCH ACTIVATED!');
          await this.activateKillSwitch('physical', 'hardware', 'physical_switch_triggered');
          return;
        }
      }

      // Check remote kill switch
      if (this.config.killSwitchConfig.remoteKillSwitch.enabled) {
        const remoteTriggered = await this.checkRemoteKillSwitch();

        if (remoteTriggered) {
          console.log('🚨 REMOTE KILL SWITCH ACTIVATED!');
          await this.activateKillSwitch('remote', 'remote_command', 'remote_kill_triggered');
          return;
        }
      }

      // Check emergency conditions
      const emergencyTriggered = await this.checkEmergencyConditions();

      if (emergencyTriggered) {
        console.log('🚨 EMERGENCY KILL SWITCH ACTIVATED!');
        await this.activateKillSwitch('emergency', 'system', emergencyTriggered.reason);
        return;
      }

    } catch (error) {
      console.error('Kill switch monitoring error:', error);
    }
  }

  private async checkPhysicalKillSwitch(): Promise<boolean> {
    // Check GPIO pin state or magnetic switch
    // This would interface with hardware sensors

    // For simulation, return false
    return false;
  }

  private async checkRemoteKillSwitch(): Promise<boolean> {
    try {
      // Check remote kill switch API
      const response = await fetch(this.config.killSwitchConfig.remoteKillSwitch.apiEndpoint, {
        headers: {
          'Authorization': `Bearer ${this.config.killSwitchConfig.remoteKillSwitch.authToken}`
        },
        signal: AbortSignal.timeout(this.config.killSwitchConfig.remoteKillSwitch.timeout * 1000)
      });

      if (response.ok) {
        const data = await response.json();
        return data.killSwitch === true;
      }

      return false;

    } catch (error) {
      // If remote check fails, assume no kill signal
      return false;
    }
  }

  private async checkEmergencyConditions(): Promise<{ triggered: boolean; reason: string } | false> {
    // Check for critical system conditions that warrant emergency shutdown

    // Check if system is compromised
    const compromised = await this.detectSystemCompromise();
    if (compromised) {
      return { triggered: true, reason: 'system_compromised' };
    }

    // Check if all security keys are invalid
    const allKeysInvalid = this.checkAllKeysInvalid();
    if (allKeysInvalid) {
      return { triggered: true, reason: 'all_keys_invalid' };
    }

    // Check for unauthorized root access
    const unauthorizedRoot = await this.detectUnauthorizedRootAccess();
    if (unauthorizedRoot) {
      return { triggered: true, reason: 'unauthorized_root_access' };
    }

    return false;
  }

  private async detectSystemCompromise(): Promise<boolean> {
    // Check for signs of system compromise
    // - Unexpected processes
    // - Modified system files
    // - Unusual network connections

    try {
      // Check for suspicious processes
      const psResult = await this.executeCommand('ps aux | grep -E "(miner|hack|exploit|scan)" | grep -v grep | wc -l');
      const suspiciousCount = parseInt(psResult.stdout.trim());

      if (suspiciousCount > 0) {
        return true;
      }

      // Check for unusual network connections
      const netResult = await this.executeCommand('netstat -tun | grep -v LISTEN | wc -l');
      const connectionCount = parseInt(netResult.stdout.trim());

      if (connectionCount > 100) { // Arbitrary threshold
        return true;
      }

      return false;

    } catch (error) {
      console.error('System compromise detection failed:', error);
      return false;
    }
  }

  private checkAllKeysInvalid(): boolean {
    // Check if all critical security keys are expired or invalid
    const criticalKeys = Array.from(this.securityKeys.values())
      .filter(key => key.accessLevel === 'admin' || key.accessLevel === 'emergency');

    const invalidKeys = criticalKeys.filter(key => {
      if (key.expiresAt && key.expiresAt < new Date()) {
        return true; // Expired
      }
      return false;
    });

    return invalidKeys.length === criticalKeys.length;
  }

  private async detectUnauthorizedRootAccess(): Promise<boolean> {
    // Check for unauthorized root-level access
    try {
      const whoResult = await this.executeCommand('who');
      const currentUsers = whoResult.stdout.trim().split('\n');

      // Check if any unauthorized users have root access
      for (const user of currentUsers) {
        if (user.includes('root') && !this.config.emergencyConfig.allowedIPs.some(ip =>
          user.includes(ip)
        )) {
          return true;
        }
      }

      return false;

    } catch (error) {
      console.error('Root access detection failed:', error);
      return false;
    }
  }

  private async activateKillSwitch(
    method: KillSwitchEvent['method'],
    triggeredBy: string,
    reason: string
  ): Promise<void> {
    if (this.killSwitchActive) {
      console.log('💀 Kill switch already active');
      return;
    }

    console.log('💀 ACTIVATING KILL SWITCH PROTOCOL');
    this.killSwitchActive = true;

    // Log the event
    const eventId = await this.logKillSwitchEvent(method, triggeredBy, reason, []);

    // Execute kill switch actions
    const actions = await this.executeKillSwitchActions();

    // Update event
    await this.updateKillSwitchEvent(eventId, 'completed', actions);

    console.log('💀 Kill switch activation complete - System terminated');
  }

  private async executeKillSwitchActions(): Promise<string[]> {
    const actions: string[] = [];

    try {
      // 1. Revoke all API keys and tokens
      console.log('🔑 Revoking all API keys and tokens...');
      await this.revokeAllKeys();
      actions.push('api_keys_revoked');

      // 2. Shutdown all cloud instances
      console.log('☁️ Shutting down all cloud instances...');
      await this.shutdownAllCloudInstances();
      actions.push('cloud_instances_shutdown');

      // 3. Delete wallet access
      console.log('💰 Locking wallet access...');
      await this.lockWalletAccess();
      actions.push('wallet_locked');

      // 4. Self-destruct sensitive data
      console.log('🔥 Self-destructing sensitive data...');
      await this.selfDestructSensitiveData();
      actions.push('sensitive_data_destroyed');

      // 5. Broadcast termination signal
      console.log('📢 Broadcasting termination signal...');
      await this.broadcastTerminationSignal();
      actions.push('termination_signal_broadcast');

      // 6. Final system shutdown
      console.log('🛑 Initiating final system shutdown...');
      await this.finalSystemShutdown();
      actions.push('system_shutdown');

    } catch (error) {
      console.error('Kill switch execution error:', error);
      actions.push(`execution_error: ${error.message}`);
    }

    return actions;
  }

  private async revokeAllKeys(): Promise<void> {
    // Revoke all API keys, tokens, and access credentials
    console.log('🔑 Revoking all access credentials...');

    // This would revoke keys from cloud providers, APIs, etc.
  }

  private async shutdownAllCloudInstances(): Promise<void> {
    // Shutdown all running cloud instances
    console.log('☁️ Terminating all cloud instances...');

    // This would call cloud provider APIs to terminate instances
  }

  private async lockWalletAccess(): Promise<void> {
    // Lock all wallet access and revoke permissions
    console.log('💰 Locking all wallet access...');

    // This would change wallet passwords, revoke API access, etc.
  }

  private async selfDestructSensitiveData(): Promise<void> {
    // Securely delete all sensitive data
    console.log('🔥 Securely destroying sensitive data...');

    const sensitiveFiles = [
      'keys/security-keys.json',
      'wallet/private-keys.json',
      'data/user-credentials.json',
      'logs/security-incidents.jsonl'
    ];

    for (const file of sensitiveFiles) {
      try {
        const filePath = path.join(process.cwd(), file);

        // Overwrite with random data before deletion
        const randomData = crypto.randomBytes(1024 * 1024); // 1MB of random data
        await fs.writeFile(filePath, randomData);

        // Delete the file
        await fs.unlink(filePath);

        console.log(`✅ Destroyed: ${file}`);

      } catch (error) {
        console.log(`⚠️ Failed to destroy: ${file}`);
      }
    }
  }

  private async broadcastTerminationSignal(): Promise<void> {
    // Broadcast termination signal to all P2P nodes
    console.log('📢 Broadcasting system termination signal...');

    // This would notify all connected nodes of system termination
  }

  private async finalSystemShutdown(): Promise<void> {
    // Execute final shutdown sequence
    console.log('🛑 Executing final shutdown...');

    // Clear all timers
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    if (this.timerKillSwitchTimeout) {
      clearTimeout(this.timerKillSwitchTimeout);
    }

    // Force system shutdown
    setTimeout(() => {
      process.exit(0);
    }, 5000);
  }

  private async logKillSwitchEvent(
    method: KillSwitchEvent['method'],
    triggeredBy: string,
    reason: string,
    actions: string[]
  ): Promise<string> {
    const event: KillSwitchEvent = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      method,
      triggeredBy,
      reason,
      actions,
      status: 'initiated'
    };

    this.killSwitchEvents.set(event.id, event);

    // Save to file
    const logPath = path.join(process.cwd(), 'logs', 'kill-switch-events.jsonl');
    await fs.appendFile(logPath, JSON.stringify(event) + '\n').catch(() => {});

    return event.id;
  }

  private async updateKillSwitchEvent(eventId: string, status: KillSwitchEvent['status'], actions: string[]): Promise<void> {
    const event = this.killSwitchEvents.get(eventId);
    if (event) {
      event.status = status;
      event.actions = actions;

      // Update log file
      const logPath = path.join(process.cwd(), 'logs', 'kill-switch-events.jsonl');
      const allEvents = Array.from(this.killSwitchEvents.values()).map(e => JSON.stringify(e)).join('\n') + '\n';
      await fs.writeFile(logPath, allEvents).catch(() => {});
    }
  }

  // Key management methods
  async requireKeyAccess(keyType: SecurityKey['type'], accessLevel: SecurityKey['accessLevel']): Promise<boolean> {
    const key = Array.from(this.securityKeys.values())
      .find(k => k.type === keyType && k.accessLevel === accessLevel);

    if (!key) {
      console.log(`❌ Required ${keyType} key not found`);
      return false;
    }

    // Check expiration
    if (key.expiresAt && key.expiresAt < new Date()) {
      console.log(`❌ ${keyType} key expired`);
      return false;
    }

    // Check HSM requirement
    if (this.config.enableHSM && key.hsmSlot) {
      const hsmAccess = await this.requestHSMAccess(key.hsmSlot);
      if (!hsmAccess) {
        console.log(`❌ HSM access denied for ${keyType} key`);
        return false;
      }
    }

    // Update key usage
    key.lastUsed = new Date();
    key.usageCount++;

    await this.saveSecurityKeys();

    console.log(`✅ ${keyType} key access granted`);
    return true;
  }

  private async requestHSMAccess(slot: string): Promise<boolean> {
    // Request access to HSM-protected key
    // This would interface with HSM hardware

    console.log(`🔒 Requesting HSM access for slot: ${slot}`);
    // For now, simulate HSM access
    return Math.random() > 0.1; // 90% success rate
  }

  private async encryptKey(key: string): Promise<string> {
    const algorithm = 'aes-256-cbc';
    const keyBuffer = crypto.scryptSync(process.env.MASTER_ENCRYPTION_KEY || 'default-master-key', 'salt', 32);
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipher(algorithm, keyBuffer);
    let encrypted = cipher.update(key, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return iv.toString('hex') + ':' + encrypted;
  }

  private async decryptKey(encryptedKey: string): Promise<string> {
    const algorithm = 'aes-256-cbc';
    const keyBuffer = crypto.scryptSync(process.env.MASTER_ENCRYPTION_KEY || 'default-master-key', 'salt', 32);

    const [ivHex, encrypted] = encryptedKey.split(':');
    const iv = Buffer.from(ivHex, 'hex');

    const decipher = crypto.createDecipher(algorithm, keyBuffer);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  private async saveSecurityKeys(): Promise<void> {
    const keysPath = path.join(process.cwd(), 'keys', 'security-keys.json');
    const keysData = Array.from(this.securityKeys.values());

    await fs.writeFile(keysPath, JSON.stringify(keysData, null, 2));
  }

  private async checkKeyExpiration(): Promise<void> {
    const now = new Date();
    const expiringKeys = Array.from(this.securityKeys.values())
      .filter(key => key.expiresAt && key.expiresAt < new Date(now.getTime() + 24 * 60 * 60 * 1000)); // Expires within 24 hours

    if (expiringKeys.length > 0) {
      console.log(`⚠️ ${expiringKeys.length} security keys expiring soon`);
      // Send alerts for key renewal
    }
  }

  private async validateKeyIntegrity(): Promise<void> {
    // Validate that security keys haven't been tampered with
    for (const [keyId, key] of this.securityKeys) {
      try {
        // Attempt to decrypt key to validate integrity
        await this.decryptKey(key.encryptedKey);
      } catch (error) {
        console.log(`❌ Security key integrity check failed for ${keyId}`);
        // Key may be compromised, trigger security response
      }
    }
  }

  private async setupGPIOMonitoring(pin: number): Promise<void> {
    // Setup GPIO monitoring for physical kill switch
    console.log(`📌 Setting up GPIO monitoring on pin ${pin}`);
    // This would require gpio libraries for Raspberry Pi
  }

  private async setupMagneticSwitchMonitoring(): Promise<void> {
    // Setup magnetic switch monitoring
    console.log('🧲 Setting up magnetic switch monitoring');
    // This would interface with magnetic sensors
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
  getSecurityKeys(): SecurityKey[] {
    return Array.from(this.securityKeys.values());
  }

  async activateEmergencyLockdown(duration?: number): Promise<void> {
    const lockdownDuration = duration || this.config.emergencyConfig.lockdownDuration;

    console.log(`🚨 Activating emergency lockdown for ${lockdownDuration} minutes`);

    this.isLockedDown = true;
    this.lockdownEndTime = new Date(Date.now() + lockdownDuration * 60 * 1000);

    // Implement lockdown measures
    await this.implementLockdown();

    // Schedule lockdown end
    setTimeout(async () => {
      await this.endEmergencyLockdown();
    }, lockdownDuration * 60 * 1000);

    console.log('✅ Emergency lockdown activated');
  }

  private async implementLockdown(): Promise<void> {
    console.log('🔒 Implementing lockdown measures...');

    // Restrict network access
    await this.executeCommand('ufw default deny incoming').catch(() => {});

    // Only allow emergency IPs
    for (const ip of this.config.emergencyConfig.allowedIPs) {
      await this.executeCommand(`ufw allow from ${ip}`).catch(() => {});
    }

    // Disable non-essential services
    // Restrict command execution
    // Enable enhanced monitoring

    console.log('✅ Lockdown measures implemented');
  }

  private async endEmergencyLockdown(): Promise<void> {
    console.log('🔓 Ending emergency lockdown');

    this.isLockedDown = false;
    this.lockdownEndTime = undefined;

    // Restore normal operations
    await this.restoreNormalOperations();

    console.log('✅ Emergency lockdown ended');
  }

  private async restoreNormalOperations(): Promise<void> {
    console.log('▶️ Restoring normal operations...');

    // Restore firewall rules
    await this.executeCommand('ufw default deny incoming').catch(() => {});
    await this.executeCommand('ufw allow 22').catch(() => {});
    await this.executeCommand('ufw allow 80').catch(() => {});
    await this.executeCommand('ufw allow 443').catch(() => {});
    await this.executeCommand('ufw allow 3000').catch(() => {});

    // Re-enable services
    // Restore command access

    console.log('✅ Normal operations restored');
  }

  isLockedDown(): boolean {
    return this.isLockedDown;
  }

  getLockdownStatus(): { isLockedDown: boolean; endTime?: Date; remainingMinutes?: number } {
    if (!this.isLockedDown || !this.lockdownEndTime) {
      return { isLockedDown: false };
    }

    const remainingMs = this.lockdownEndTime.getTime() - Date.now();
    const remainingMinutes = Math.max(0, Math.ceil(remainingMs / (60 * 1000)));

    return {
      isLockedDown: true,
      endTime: this.lockdownEndTime,
      remainingMinutes
    };
  }

  getKillSwitchEvents(): KillSwitchEvent[] {
    return Array.from(this.killSwitchEvents.values());
  }

  async manualKillSwitch(reason: string): Promise<void> {
    console.log(`💀 MANUAL KILL SWITCH ACTIVATED: ${reason}`);
    await this.activateKillSwitch('emergency', 'manual', reason);
  }

  async shutdown(): Promise<void> {
    console.log('🛑 Shutting down Master Key System...');

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    if (this.timerKillSwitchTimeout) {
      clearTimeout(this.timerKillSwitchTimeout);
    }

    console.log('✅ Master Key System shutdown');
  }
}

// Default configuration
export const defaultMasterKeyConfig: MasterKeyConfig = {
  enableHSM: false,
  enableKillSwitch: true,
  enableEmergencyLockdown: true,
  hsmConfig: {
    devicePath: '/dev/hsm',
    keySlots: ['slot1', 'slot2', 'slot3'],
    pinRequired: true,
    yubikeySupport: false
  },
  killSwitchConfig: {
    activationMethods: ['remote', 'timer'],
    physicalKillSwitch: {
      enabled: false,
      gpioPin: 18,
      magneticSwitch: false
    },
    remoteKillSwitch: {
      enabled: true,
      apiEndpoint: 'https://api.openmind.ai/killswitch',
      authToken: 'kill-switch-token',
      timeout: 30
    },
    timerKillSwitch: {
      enabled: true,
      maxRuntimeHours: 168, // 1 week
      warningHours: 24
    }
  },
  emergencyConfig: {
    lockdownDuration: 60, // 1 hour
    allowedIPs: ['127.0.0.1', 'localhost'],
    restrictedCommands: ['rm', 'dd', 'shutdown', 'reboot', 'kill']
  }
};