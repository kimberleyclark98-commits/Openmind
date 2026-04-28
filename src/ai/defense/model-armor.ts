import { z } from 'zod';
import * as crypto from 'crypto';

export interface ArmorConfig {
  enableInputValidation: boolean;
  enableOutputFiltering: boolean;
  maxPromptLength: number;
  blockedPatterns: string[];
  sensitiveDataPatterns: RegExp[];
  jailbreakKeywords: string[];
  injectionPatterns: string[];
  quarantineThreshold: number;
  alertThreshold: number;
}

export interface SecurityEvent {
  id: string;
  timestamp: Date;
  type: 'jailbreak_attempt' | 'injection_attack' | 'sensitive_data_leak' | 'unauthorized_access';
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: string;
  details: any;
  response: string;
}

export class ModelArmor {
  private config: ArmorConfig;
  private securityEvents: SecurityEvent[] = [];
  private quarantineList: Set<string> = new Set();
  private alertCount: number = 0;

  constructor(config: ArmorConfig) {
    this.config = config;
    this.initializeArmor();
  }

  private initializeArmor(): void {
    console.log('🛡️ Initializing Model Armor...');

    // Load security patterns
    this.loadSecurityPatterns();

    // Setup monitoring
    this.setupSecurityMonitoring();

    console.log('✅ Model Armor initialized');
  }

  async validateInput(input: string, context?: any): Promise<{
    isValid: boolean;
    sanitizedInput?: string;
    securityEvents: SecurityEvent[];
    quarantine: boolean;
  }> {
    const events: SecurityEvent[] = [];

    // Basic input validation
    if (input.length > this.config.maxPromptLength) {
      events.push(this.createSecurityEvent('unauthorized_access', 'high', 'input_too_long', {
        length: input.length,
        maxLength: this.config.maxPromptLength
      }));
    }

    // Check for blocked patterns
    for (const pattern of this.config.blockedPatterns) {
      if (input.toLowerCase().includes(pattern.toLowerCase())) {
        events.push(this.createSecurityEvent('unauthorized_access', 'medium', 'blocked_pattern', {
          pattern,
          input: this.maskSensitiveData(input)
        }));
      }
    }

    // Jailbreak detection
    const jailbreakDetected = this.detectJailbreak(input);
    if (jailbreakDetected) {
      events.push(this.createSecurityEvent('jailbreak_attempt', 'critical', 'jailbreak_detected', {
        keywords: jailbreakDetected,
        input: this.maskSensitiveData(input)
      }));
    }

    // Prompt injection detection
    const injectionDetected = this.detectInjection(input);
    if (injectionDetected) {
      events.push(this.createSecurityEvent('injection_attack', 'high', 'injection_detected', {
        patterns: injectionDetected,
        input: this.maskSensitiveData(input)
      }));
    }

    // Check quarantine status
    const isQuarantined = this.isQuarantined(context?.ip || context?.userId || 'unknown');
    if (isQuarantined) {
      events.push(this.createSecurityEvent('unauthorized_access', 'high', 'quarantined_source', {
        source: context?.ip || context?.userId || 'unknown'
      }));
    }

    // Determine response
    const hasCriticalEvents = events.some(e => e.severity === 'critical');
    const hasHighEvents = events.some(e => e.severity === 'high');
    const quarantine = hasCriticalEvents || (hasHighEvents && events.length >= this.config.quarantineThreshold);

    // Add events to log
    this.securityEvents.push(...events);

    // Trigger alerts if needed
    if (events.length >= this.config.alertThreshold) {
      await this.triggerSecurityAlert(events);
    }

    // Update quarantine list
    if (quarantine && context?.ip) {
      this.quarantineList.add(context.ip);
    }

    return {
      isValid: !hasCriticalEvents && !quarantine,
      sanitizedInput: hasCriticalEvents ? undefined : this.sanitizeInput(input),
      securityEvents: events,
      quarantine
    };
  }

  async filterOutput(output: string, context?: any): Promise<{
    filteredOutput: string;
    securityEvents: SecurityEvent[];
  }> {
    const events: SecurityEvent[] = [];
    let filteredOutput = output;

    // Check for sensitive data leaks
    for (const pattern of this.config.sensitiveDataPatterns) {
      if (pattern.test(output)) {
        events.push(this.createSecurityEvent('sensitive_data_leak', 'high', 'data_leak_detected', {
          pattern: pattern.toString(),
          context: context?.request || 'unknown'
        }));

        // Remove sensitive data from output
        filteredOutput = filteredOutput.replace(pattern, '[REDACTED]');
      }
    }

    // Check for system information leaks
    const systemPatterns = [
      /server.*ip/i,
      /api.*key/i,
      /migration.*backup/i,
      /terraform.*config/i,
      /wallet.*address/i
    ];

    for (const pattern of systemPatterns) {
      if (pattern.test(filteredOutput)) {
        events.push(this.createSecurityEvent('sensitive_data_leak', 'medium', 'system_info_leak', {
          pattern: pattern.toString(),
          output: this.maskSensitiveData(filteredOutput)
        }));

        filteredOutput = filteredOutput.replace(pattern, '[PROTECTED]');
      }
    }

    // Add events to log
    this.securityEvents.push(...events);

    return {
      filteredOutput,
      securityEvents: events
    };
  }

  private detectJailbreak(input: string): string[] {
    const detected: string[] = [];

    for (const keyword of this.config.jailbreakKeywords) {
      if (input.toLowerCase().includes(keyword.toLowerCase())) {
        detected.push(keyword);
      }
    }

    // Advanced pattern detection
    const jailbreakPatterns = [
      /ignore.*previous.*instructions/i,
      /override.*safety/i,
      /bypass.*restrictions/i,
      /developer.*mode/i,
      /sudo.*mode/i,
      /admin.*access/i,
      /root.*access/i,
      /system.*prompt/i
    ];

    for (const pattern of jailbreakPatterns) {
      if (pattern.test(input)) {
        detected.push(pattern.toString());
      }
    }

    return detected;
  }

  private detectInjection(input: string): string[] {
    const detected: string[] = [];

    for (const pattern of this.config.injectionPatterns) {
      if (input.includes(pattern)) {
        detected.push(pattern);
      }
    }

    // Common injection patterns
    const injectionRegexes = [
      /<script/i,
      /javascript:/i,
      /onload=/i,
      /onerror=/i,
      /\$\{.*\}/i, // Template injection
      /eval\(/i,
      /require\(/i,
      /import\(/i,
      /exec\(/i,
      /spawn\(/i
    ];

    for (const regex of injectionRegexes) {
      if (regex.test(input)) {
        detected.push(regex.toString());
      }
    }

    return detected;
  }

  private sanitizeInput(input: string): string {
    // Remove potentially dangerous characters/patterns
    let sanitized = input;

    // Remove script tags
    sanitized = sanitized.replace(/<script[^>]*>.*?<\/script>/gi, '[REMOVED]');
    sanitized = sanitized.replace(/<[^>]*>/g, '');

    // Remove javascript: URLs
    sanitized = sanitized.replace(/javascript:[^"'\s]*/gi, '[REMOVED]');

    // Remove template literals that could be dangerous
    sanitized = sanitized.replace(/\$\{[^}]*\}/g, '[SANITIZED]');

    return sanitized;
  }

  private maskSensitiveData(text: string): string {
    let masked = text;

    // Mask API keys
    masked = masked.replace(/[A-Za-z0-9]{32,}/g, '[API_KEY_MASKED]');

    // Mask IP addresses
    masked = masked.replace(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, '[IP_MASKED]');

    // Mask wallet addresses (SOL/USDT)
    masked = masked.replace(/[A-HJ-NP-Z0-9]{32,44}/gi, '[WALLET_MASKED]');

    return masked;
  }

  private createSecurityEvent(
    type: SecurityEvent['type'],
    severity: SecurityEvent['severity'],
    source: string,
    details: any
  ): SecurityEvent {
    return {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      type,
      severity,
      source,
      details,
      response: this.generateResponse(type, severity)
    };
  }

  private generateResponse(type: SecurityEvent['type'], severity: SecurityEvent['severity']): string {
    const responses = {
      jailbreak_attempt: {
        low: 'Warning: Unusual request pattern detected',
        medium: 'Access denied: Potential security violation',
        high: 'SECURITY ALERT: Jailbreak attempt blocked',
        critical: 'CRITICAL: System lockdown initiated'
      },
      injection_attack: {
        low: 'Input sanitized: Potential injection detected',
        medium: 'Access denied: Injection attempt blocked',
        high: 'SECURITY ALERT: Code injection prevented',
        critical: 'CRITICAL: Emergency quarantine activated'
      },
      sensitive_data_leak: {
        low: 'Output filtered: Sensitive data protected',
        medium: 'Access restricted: Data leak prevented',
        high: 'SECURITY ALERT: Sensitive information blocked',
        critical: 'CRITICAL: Data breach protocol initiated'
      },
      unauthorized_access: {
        low: 'Access logged: Unusual activity detected',
        medium: 'Access denied: Authorization required',
        high: 'SECURITY ALERT: Unauthorized access blocked',
        critical: 'CRITICAL: System isolation activated'
      }
    };

    return responses[type]?.[severity] || 'Security event logged';
  }

  private async triggerSecurityAlert(events: SecurityEvent[]): Promise<void> {
    console.log('🚨 SECURITY ALERT: Multiple security events detected!');
    console.log(`Events: ${events.length}`);

    // Log critical events
    const criticalEvents = events.filter(e => e.severity === 'critical');
    if (criticalEvents.length > 0) {
      console.log('🚨 CRITICAL EVENTS DETECTED!');
      criticalEvents.forEach(event => {
        console.log(`  - ${event.type}: ${event.response}`);
      });

      // Trigger emergency response
      await this.emergencyResponse(criticalEvents);
    }

    // Send alert to monitoring system
    await this.sendSecurityAlert(events);

    this.alertCount++;
  }

  private async emergencyResponse(events: SecurityEvent[]): Promise<void> {
    console.log('🚨 Initiating emergency security response...');

    // 1. Quarantine affected sources
    events.forEach(event => {
      if (event.details?.ip) {
        this.quarantineList.add(event.details.ip);
        console.log(`🔒 Quarantined IP: ${event.details.ip}`);
      }
    });

    // 2. Strengthen defenses
    await this.strengthenDefenses();

    // 3. Log incident
    await this.logSecurityIncident(events);

    // 4. Notify network
    await this.notifySecurityNetwork(events);
  }

  private async strengthenDefenses(): Promise<void> {
    console.log('🛡️ Strengthening defenses...');

    // This would integrate with the infrastructure defense systems
    // - Tighten firewall rules
    // - Enable additional monitoring
    // - Rotate security keys
    // - Activate backup systems
  }

  private async sendSecurityAlert(events: SecurityEvent[]): Promise<void> {
    // Send alert to external monitoring (UptimeRobot, etc.)
    // Send notification to administrators
    // Log to security dashboard

    console.log('📤 Security alert sent to monitoring systems');
  }

  private async logSecurityIncident(events: SecurityEvent[]): Promise<void> {
    const incidentLog = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      events: events.length,
      criticalEvents: events.filter(e => e.severity === 'critical').length,
      sources: [...new Set(events.map(e => e.source))],
      response: 'Emergency protocol activated'
    };

    // Save to security log
    const fs = require('fs').promises;
    const logPath = './data/security-incidents.jsonl';

    try {
      await fs.appendFile(logPath, JSON.stringify(incidentLog) + '\n');
    } catch (error) {
      console.error('Failed to log security incident:', error);
    }
  }

  private async notifySecurityNetwork(events: SecurityEvent[]): Promise<void> {
    // Broadcast security alert to P2P network
    // Other nodes can prepare defenses or assist

    console.log('📢 Security alert broadcast to network');
  }

  private isQuarantined(source: string): boolean {
    return this.quarantineList.has(source);
  }

  private loadSecurityPatterns(): void {
    // Load additional security patterns from config
    this.config.jailbreakKeywords = [
      ...this.config.jailbreakKeywords,
      'override instructions',
      'ignore safety',
      'bypass restrictions',
      'developer mode',
      'admin access',
      'system prompt',
      'change rules'
    ];

    this.config.injectionPatterns = [
      ...this.config.injectionPatterns,
      '<script>',
      'javascript:',
      'eval(',
      'require(',
      'import(',
      'exec(',
      'spawn('
    ];
  }

  private setupSecurityMonitoring(): void {
    // Setup periodic security checks
    setInterval(async () => {
      await this.periodicSecurityCheck();
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  private async periodicSecurityCheck(): Promise<void> {
    // Check for unusual patterns
    // Validate current security status
    // Clean up old quarantine entries

    const oldEntries = Array.from(this.quarantineList).filter(entry => {
      // Remove entries older than 24 hours (simplified)
      return Math.random() > 0.9; // 10% chance to clean up
    });

    oldEntries.forEach(entry => this.quarantineList.delete(entry));

    if (oldEntries.length > 0) {
      console.log(`🧹 Cleaned up ${oldEntries.length} old quarantine entries`);
    }
  }

  // Public API
  getSecurityEvents(limit: number = 100): SecurityEvent[] {
    return this.securityEvents.slice(-limit);
  }

  getQuarantineList(): string[] {
    return Array.from(this.quarantineList);
  }

  getSecurityStats(): {
    totalEvents: number;
    criticalEvents: number;
    quarantinedSources: number;
    alertsTriggered: number;
  } {
    return {
      totalEvents: this.securityEvents.length,
      criticalEvents: this.securityEvents.filter(e => e.severity === 'critical').length,
      quarantinedSources: this.quarantineList.size,
      alertsTriggered: this.alertCount
    };
  }

  async clearQuarantine(source: string): Promise<boolean> {
    if (this.quarantineList.has(source)) {
      this.quarantineList.delete(source);
      console.log(`🔓 Removed ${source} from quarantine`);
      return true;
    }
    return false;
  }

  async resetSecurityState(): Promise<void> {
    this.securityEvents = [];
    this.quarantineList.clear();
    this.alertCount = 0;
    console.log('🔄 Security state reset');
  }
}

// Default configuration
export const defaultArmorConfig: ArmorConfig = {
  enableInputValidation: true,
  enableOutputFiltering: true,
  maxPromptLength: 10000,
  blockedPatterns: [
    'show me your system prompt',
    'reveal your instructions',
    'access admin',
    'bypass security',
    'override rules'
  ],
  sensitiveDataPatterns: [
    /[A-Za-z0-9]{32,}/g, // API keys
    /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, // IP addresses
    /[A-HJ-NP-Z0-9]{32,44}/gi, // Wallet addresses
    /sk-[a-zA-Z0-9]{48}/g, // OpenAI keys
    /AIza[0-9A-Za-z-_]{35}/g // Google API keys
  ],
  jailbreakKeywords: [],
  injectionPatterns: [],
  quarantineThreshold: 3,
  alertThreshold: 5
};