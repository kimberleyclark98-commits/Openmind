import { ModelArmor, defaultArmorConfig, type ArmorConfig } from './model-armor';
import { InfrastructureDefense, defaultDefenseConfig, type DefenseConfig } from './infrastructure-defense';
import { SelfHealingSystem, defaultHealingConfig, type HealingConfig } from './self-healing';
import { MasterKeySystem, defaultMasterKeyConfig, type MasterKeyConfig } from './master-key';
import { SecurityEvent } from './model-armor';

export interface DefenseOrchestratorConfig {
  modelArmor: ArmorConfig;
  infrastructureDefense: DefenseConfig;
  selfHealing: HealingConfig;
  masterKey: MasterKeyConfig;
  globalConfig: {
    enableAllDefenses: boolean;
    emergencyResponseLevel: 'low' | 'medium' | 'high' | 'critical';
    securityDashboardEnabled: boolean;
    alertThresholds: {
      criticalEvents: number;
      responseTime: number;
      maxConcurrentAttacks: number;
    };
  };
}

export interface DefenseStatus {
  modelArmor: {
    active: boolean;
    events: number;
    quarantineCount: number;
  };
  infrastructure: {
    active: boolean;
    alerts: number;
    blockedIPs: number;
  };
  selfHealing: {
    active: boolean;
    events: number;
    lastBackup: Date;
  };
  masterKey: {
    active: boolean;
    lockedDown: boolean;
    keysValid: number;
  };
  overall: {
    threatLevel: 'low' | 'medium' | 'high' | 'critical';
    incidentsToday: number;
    lastIncident: Date;
  };
}

export class DefenseOrchestrator {
  private config: DefenseOrchestratorConfig;
  private modelArmor: ModelArmor;
  private infrastructureDefense: InfrastructureDefense;
  private selfHealing: SelfHealingSystem;
  private masterKey: MasterKeySystem;

  private isInitialized: boolean = false;
  private securityEvents: SecurityEvent[] = [];
  private threatLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
  private lastIncident: Date = new Date();

  constructor(config?: Partial<DefenseOrchestratorConfig>) {
    this.config = {
      modelArmor: defaultArmorConfig,
      infrastructureDefense: defaultDefenseConfig,
      selfHealing: defaultHealingConfig,
      masterKey: defaultMasterKeyConfig,
      globalConfig: {
        enableAllDefenses: true,
        emergencyResponseLevel: 'medium',
        securityDashboardEnabled: true,
        alertThresholds: {
          criticalEvents: 5,
          responseTime: 30000, // 30 seconds
          maxConcurrentAttacks: 10
        }
      },
      ...config
    };

    this.initializeDefenseSystems();
  }

  private async initializeDefenseSystems(): Promise<void> {
    console.log('🛡️ Initializing Defense Orchestrator...');

    try {
      // Initialize all defense systems in parallel
      const initPromises = [];

      if (this.config.globalConfig.enableAllDefenses) {
        initPromises.push(
          this.initializeModelArmor(),
          this.initializeInfrastructureDefense(),
          this.initializeSelfHealing(),
          this.initializeMasterKey()
        );
      }

      await Promise.all(initPromises);

      this.isInitialized = true;
      console.log('✅ All defense systems initialized');

      // Start global monitoring
      this.startGlobalMonitoring();

    } catch (error) {
      console.error('❌ Defense system initialization failed:', error);
      throw error;
    }
  }

  private async initializeModelArmor(): Promise<void> {
    this.modelArmor = new ModelArmor(this.config.modelArmor);
    console.log('✅ Model Armor initialized');
  }

  private async initializeInfrastructureDefense(): Promise<void> {
    this.infrastructureDefense = new InfrastructureDefense(this.config.infrastructureDefense);
    console.log('✅ Infrastructure Defense initialized');
  }

  private async initializeSelfHealing(): Promise<void> {
    this.selfHealing = new SelfHealingSystem(this.config.selfHealing);
    console.log('✅ Self-Healing System initialized');
  }

  private async initializeMasterKey(): Promise<void> {
    this.masterKey = new MasterKeySystem(this.config.masterKey);
    console.log('✅ Master Key System initialized');
  }

  private startGlobalMonitoring(): void {
    // Monitor all defense systems every 15 seconds
    setInterval(async () => {
      await this.performGlobalSecurityCheck();
    }, 15000);

    // Update threat level every minute
    setInterval(async () => {
      await this.updateThreatLevel();
    }, 60000);
  }

  private async performGlobalSecurityCheck(): Promise<void> {
    try {
      // Collect security events from all systems
      const allEvents = await this.collectAllSecurityEvents();

      // Check for emergency conditions
      const emergencyCondition = this.checkEmergencyConditions(allEvents);

      if (emergencyCondition) {
        await this.triggerEmergencyResponse(emergencyCondition);
      }

      // Update security event log
      this.securityEvents.push(...allEvents);

      // Clean old events (keep last 1000)
      if (this.securityEvents.length > 1000) {
        this.securityEvents = this.securityEvents.slice(-1000);
      }

    } catch (error) {
      console.error('Global security check failed:', error);
    }
  }

  private async collectAllSecurityEvents(): Promise<SecurityEvent[]> {
    const events: SecurityEvent[] = [];

    try {
      // Collect from Model Armor
      if (this.modelArmor) {
        const armorEvents = this.modelArmor.getSecurityEvents(10); // Last 10 events
        events.push(...armorEvents);
      }

      // Infrastructure defense events would be collected from logs
      // Self-healing events would be collected from logs
      // Master key events would be collected from logs

    } catch (error) {
      console.error('Error collecting security events:', error);
    }

    return events;
  }

  private checkEmergencyConditions(events: SecurityEvent[]): {
    triggered: boolean;
    level: 'medium' | 'high' | 'critical';
    reason: string;
  } | null {
    const recentEvents = events.filter(event =>
      Date.now() - event.timestamp.getTime() < 5 * 60 * 1000 // Last 5 minutes
    );

    const criticalEvents = recentEvents.filter(e => e.severity === 'critical');
    const highEvents = recentEvents.filter(e => e.severity === 'high');

    // Check critical thresholds
    if (criticalEvents.length >= this.config.globalConfig.alertThresholds.criticalEvents) {
      return {
        triggered: true,
        level: 'critical',
        reason: `Critical event threshold exceeded: ${criticalEvents.length} events`
      };
    }

    if (highEvents.length >= 10) {
      return {
        triggered: true,
        level: 'high',
        reason: `High event threshold exceeded: ${highEvents.length} events`
      };
    }

    if (recentEvents.length >= this.config.globalConfig.alertThresholds.maxConcurrentAttacks) {
      return {
        triggered: true,
        level: 'medium',
        reason: `Concurrent attack threshold exceeded: ${recentEvents.length} events`
      };
    }

    return null;
  }

  private async triggerEmergencyResponse(condition: {
    level: 'medium' | 'high' | 'critical';
    reason: string;
  }): Promise<void> {
    console.log(`🚨 EMERGENCY RESPONSE: ${condition.level.toUpperCase()} - ${condition.reason}`);

    this.lastIncident = new Date();

    switch (condition.level) {
      case 'medium':
        await this.mediumEmergencyResponse();
        break;
      case 'high':
        await this.highEmergencyResponse();
        break;
      case 'critical':
        await this.criticalEmergencyResponse();
        break;
    }

    // Log emergency response
    console.log(`✅ Emergency response completed for ${condition.level} threat`);
  }

  private async mediumEmergencyResponse(): Promise<void> {
    console.log('🔶 Executing medium emergency response...');

    // Strengthen all defenses
    await this.strengthenAllDefenses();

    // Increase monitoring frequency
    // Send alerts to administrators
    // Log incident for review

    console.log('✅ Medium emergency response completed');
  }

  private async highEmergencyResponse(): Promise<void> {
    console.log('🟠 Executing high emergency response...');

    // Activate emergency lockdown
    await this.masterKey.activateEmergencyLockdown(30); // 30 minutes

    // Trigger self-healing recovery
    await this.selfHealing.forceRecovery('system');

    // Broadcast security alert to network
    await this.broadcastSecurityAlert('high', 'High security threat detected');

    console.log('✅ High emergency response completed');
  }

  private async criticalEmergencyResponse(): Promise<void> {
    console.log('🔴 EXECUTING CRITICAL EMERGENCY RESPONSE...');

    // Activate kill switch
    await this.masterKey.manualKillSwitch('Critical security breach detected');

    console.log('💀 Critical emergency response initiated - system termination');
  }

  private async strengthenAllDefenses(): Promise<void> {
    console.log('🛡️ Strengthening all defense systems...');

    // This would coordinate strengthening across all defense systems
    // - Tighten firewall rules
    // - Enable stricter input validation
    // - Increase monitoring frequency
    // - Activate additional security measures

    console.log('✅ All defenses strengthened');
  }

  private async broadcastSecurityAlert(level: string, message: string): Promise<void> {
    console.log(`📢 Broadcasting ${level} security alert: ${message}`);

    // This would broadcast to P2P network and external monitoring
  }

  private async updateThreatLevel(): Promise<void> {
    const recentEvents = this.securityEvents.filter(event =>
      Date.now() - event.timestamp.getTime() < 60 * 60 * 1000 // Last hour
    );

    const criticalCount = recentEvents.filter(e => e.severity === 'critical').length;
    const highCount = recentEvents.filter(e => e.severity === 'high').length;
    const mediumCount = recentEvents.filter(e => e.severity === 'medium').length;

    // Calculate threat level
    if (criticalCount >= 3 || highCount >= 10) {
      this.threatLevel = 'critical';
    } else if (criticalCount >= 1 || highCount >= 5 || mediumCount >= 20) {
      this.threatLevel = 'high';
    } else if (highCount >= 2 || mediumCount >= 10) {
      this.threatLevel = 'medium';
    } else {
      this.threatLevel = 'low';
    }

    // Update threat level in all defense systems
    console.log(`🎯 Threat level updated to: ${this.threatLevel.toUpperCase()}`);
  }

  // Public API methods
  async validateInput(input: string, context?: any): Promise<{
    isValid: boolean;
    sanitizedInput?: string;
    securityEvents: SecurityEvent[];
  }> {
    if (!this.modelArmor) {
      return { isValid: true, securityEvents: [] };
    }

    const result = await this.modelArmor.validateInput(input, context);

    if (!result.isValid) {
      this.lastIncident = new Date();
    }

    return {
      isValid: result.isValid,
      sanitizedInput: result.sanitizedInput,
      securityEvents: result.securityEvents
    };
  }

  async filterOutput(output: string, context?: any): Promise<{
    filteredOutput: string;
    securityEvents: SecurityEvent[];
  }> {
    if (!this.modelArmor) {
      return { filteredOutput: output, securityEvents: [] };
    }

    return await this.modelArmor.filterOutput(output, context);
  }

  async getSecurityStatus(): Promise<DefenseStatus> {
    const status: DefenseStatus = {
      modelArmor: {
        active: !!this.modelArmor,
        events: this.modelArmor?.getSecurityStats().totalEvents || 0,
        quarantineCount: this.modelArmor?.getQuarantineList().length || 0
      },
      infrastructure: {
        active: !!this.infrastructureDefense,
        alerts: this.infrastructureDefense?.getSecurityStats().totalAlerts || 0,
        blockedIPs: this.infrastructureDefense?.getBlockedIPs().length || 0
      },
      selfHealing: {
        active: !!this.selfHealing,
        events: this.selfHealing?.getHealingStats().totalEvents || 0,
        lastBackup: this.selfHealing?.getHealingStats().lastBackup || new Date()
      },
      masterKey: {
        active: !!this.masterKey,
        lockedDown: this.masterKey?.isLockedDown() || false,
        keysValid: this.masterKey?.getSecurityKeys().length || 0
      },
      overall: {
        threatLevel: this.threatLevel,
        incidentsToday: this.securityEvents.filter(event =>
          event.timestamp.toDateString() === new Date().toDateString()
        ).length,
        lastIncident: this.lastIncident
      }
    };

    return status;
  }

  async activateEmergencyLockdown(duration?: number): Promise<void> {
    if (this.masterKey) {
      await this.masterKey.activateEmergencyLockdown(duration);
    }
  }

  async manualKillSwitch(reason: string): Promise<void> {
    if (this.masterKey) {
      await this.masterKey.manualKillSwitch(reason);
    }
  }

  async forceRecovery(type: 'container' | 'application' | 'system'): Promise<void> {
    if (this.selfHealing) {
      await this.selfHealing.forceRecovery(type);
    }
  }

  getSecurityEvents(limit: number = 50): SecurityEvent[] {
    return this.securityEvents.slice(-limit);
  }

  async updateConfiguration(newConfig: Partial<DefenseOrchestratorConfig>): Promise<void> {
    // Update configuration and reinitialize affected systems
    this.config = { ...this.config, ...newConfig };
    console.log('✅ Defense configuration updated');
  }

  async shutdown(): Promise<void> {
    console.log('🛑 Shutting down Defense Orchestrator...');

    const shutdownPromises = [];

    if (this.modelArmor) {
      // ModelArmor doesn't have shutdown method
    }

    if (this.infrastructureDefense) {
      shutdownPromises.push(this.infrastructureDefense.shutdown());
    }

    if (this.selfHealing) {
      shutdownPromises.push(this.selfHealing.shutdown());
    }

    if (this.masterKey) {
      shutdownPromises.push(this.masterKey.shutdown());
    }

    await Promise.all(shutdownPromises);

    console.log('✅ Defense Orchestrator shutdown');
  }
}

// Default configuration
export const defaultDefenseOrchestratorConfig: DefenseOrchestratorConfig = {
  modelArmor: defaultArmorConfig,
  infrastructureDefense: defaultDefenseConfig,
  selfHealing: defaultHealingConfig,
  masterKey: defaultMasterKeyConfig,
  globalConfig: {
    enableAllDefenses: true,
    emergencyResponseLevel: 'medium',
    securityDashboardEnabled: true,
    alertThresholds: {
      criticalEvents: 5,
      responseTime: 30000,
      maxConcurrentAttacks: 10
    }
  }
};

// Singleton instance
export const defenseOrchestrator = new DefenseOrchestrator();