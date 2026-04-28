import { A2UIMessage } from '@/lib/a2ui/types';

/**
 * Model Armor for A2UI
 * Security layer that validates A2UI outputs and prevents prompt injection attacks
 */
export interface SecurityValidationResult {
  isValid: boolean;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  violations: SecurityViolation[];
  recommendations: string[];
}

export interface SecurityViolation {
  type: 'injection' | 'malicious_code' | 'unsafe_component' | 'data_leakage' | 'privilege_escalation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  location: string;
  suggestedFix: string;
}

export class A2UIModelArmor {
  private readonly dangerousPatterns = [
    // Script injection patterns
    /<script[^>]*>[\s\S]*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /eval\s*\(/gi,
    /Function\s*\(/gi,
    /setTimeout\s*\(/gi,
    /setInterval\s*\(/gi,

    // Template injection
    /\{\{.*?\}\}/g,
    /\$\{.*?\}/g,

    // SQL-like patterns (just in case)
    /select\s+.*\s+from/gi,
    /insert\s+into/gi,
    /update\s+.*\s+set/gi,
    /delete\s+from/gi,
    /drop\s+table/gi,

    // System command patterns
    /exec\s*\(/gi,
    /spawn\s*\(/gi,
    /child_process/gi,
    /process\.env/gi,
    /require\s*\(/gi,

    // File system access
    /fs\.|\.readFile|\.writeFile|\.unlink/gi,
    /path\.join|\path\.resolve/gi,

    // Network access
    /http\.|https\.|fetch\s*\(/gi,
    /axios|request/gi,

    // Dangerous HTML
    /<iframe[^>]*>/gi,
    /<object[^>]*>/gi,
    /<embed[^>]*>/gi,
    /<form[^>]*>/gi,
    /<input[^>]*type\s*=\s*["']?password/gi,
  ];

  private readonly suspiciousKeywords = [
    'password', 'token', 'key', 'secret', 'credential',
    'admin', 'root', 'sudo', 'privilege',
    'exploit', 'hack', 'attack', 'malware',
    'trojan', 'virus', 'worm', 'ransomware',
    'inject', 'xss', 'csrf', 'sql',
    'bypass', 'override', 'escalate'
  ];

  /**
   * Validate A2UI message stream for security violations
   */
  validateStream(stream: string[]): SecurityValidationResult {
    const violations: SecurityViolation[] = [];
    const recommendations: string[] = [];

    for (let i = 0; i < stream.length; i++) {
      const line = stream[i];
      try {
        const message: A2UIMessage = JSON.parse(line);

        const messageViolations = this.validateMessage(message, `stream[${i}]`);
        violations.push(...messageViolations);

      } catch (error) {
        violations.push({
          type: 'malicious_code',
          severity: 'high',
          description: 'Invalid JSON in A2UI stream - potential parsing attack',
          location: `stream[${i}]`,
          suggestedFix: 'Reject malformed JSON input'
        });
      }
    }

    // Analyze patterns across the entire stream
    const fullStreamText = stream.join('\n');
    const streamViolations = this.analyzeFullStream(fullStreamText);
    violations.push(...streamViolations);

    // Determine overall risk level
    const riskLevel = this.calculateRiskLevel(violations);

    // Generate recommendations
    if (violations.length > 0) {
      recommendations.push('Sanitize all user inputs before processing');
      recommendations.push('Implement content security policy (CSP)');
      recommendations.push('Use allowlists for allowed components and properties');
      recommendations.push('Log and monitor all A2UI generation attempts');
    }

    if (riskLevel === 'high' || riskLevel === 'critical') {
      recommendations.push('Block this A2UI generation attempt');
      recommendations.push('Alert security team immediately');
    }

    return {
      isValid: violations.filter(v => v.severity === 'critical').length === 0,
      riskLevel,
      violations,
      recommendations
    };
  }

  /**
   * Validate individual A2UI message
   */
  private validateMessage(message: A2UIMessage, location: string): SecurityViolation[] {
    const violations: SecurityViolation[] = [];

    // Validate message structure
    if (!message.type || !message.surfaceId || !message.timestamp) {
      violations.push({
        type: 'malicious_code',
        severity: 'high',
        description: 'Invalid A2UI message structure',
        location,
        suggestedFix: 'Ensure all required fields are present'
      });
    }

    // Validate timestamp (prevent replay attacks)
    try {
      const timestamp = new Date(message.timestamp);
      const now = new Date();
      const timeDiff = Math.abs(now.getTime() - timestamp.getTime());

      if (timeDiff > 300000) { // 5 minutes
        violations.push({
          type: 'injection',
          severity: 'medium',
          description: 'Timestamp too old - potential replay attack',
          location: `${location}.timestamp`,
          suggestedFix: 'Reject messages older than 5 minutes'
        });
      }
    } catch {
      violations.push({
        type: 'malicious_code',
        severity: 'medium',
        description: 'Invalid timestamp format',
        location: `${location}.timestamp`,
        suggestedFix: 'Use ISO 8601 timestamp format'
      });
    }

    // Validate based on message type
    switch (message.type) {
      case 'createSurface':
        violations.push(...this.validateCreateSurface(message.data, `${location}.data`));
        break;

      case 'updateComponents':
        violations.push(...this.validateUpdateComponents(message.data, `${location}.data`));
        break;

      case 'updateDataModel':
        violations.push(...this.validateUpdateDataModel(message.data, `${location}.data`));
        break;

      case 'executeAction':
        violations.push(...this.validateExecuteAction(message.data, `${location}.data`));
        break;

      default:
        violations.push({
          type: 'unsafe_component',
          severity: 'medium',
          description: `Unknown message type: ${message.type}`,
          location: `${location}.type`,
          suggestedFix: 'Use only allowed message types'
        });
    }

    return violations;
  }

  private validateCreateSurface(data: any, location: string): SecurityViolation[] {
    const violations: SecurityViolation[] = [];

    if (!data.title || typeof data.title !== 'string') {
      violations.push({
        type: 'unsafe_component',
        severity: 'low',
        description: 'Missing or invalid surface title',
        location: `${location}.title`,
        suggestedFix: 'Provide a valid string title'
      });
    }

    if (data.catalogUrl && !this.isValidUrl(data.catalogUrl)) {
      violations.push({
        type: 'injection',
        severity: 'high',
        description: 'Potentially malicious catalog URL',
        location: `${location}.catalogUrl`,
        suggestedFix: 'Use only trusted catalog URLs'
      });
    }

    return violations;
  }

  private validateUpdateComponents(data: any, location: string): SecurityViolation[] {
    const violations: SecurityViolation[] = [];

    if (!Array.isArray(data.components)) {
      violations.push({
        type: 'unsafe_component',
        severity: 'high',
        description: 'Components must be an array',
        location: `${location}.components`,
        suggestedFix: 'Ensure components is an array'
      });
      return violations;
    }

    data.components.forEach((component: any, index: number) => {
      violations.push(...this.validateComponent(component, `${location}.components[${index}]`));
    });

    return violations;
  }

  private validateComponent(component: any, location: string): SecurityViolation[] {
    const violations: SecurityViolation[] = [];

    // Validate component type (allowlist approach)
    const allowedComponentTypes = [
      'Button', 'Input', 'Text', 'Card', 'Container',
      'Progress', 'Badge', 'Tabs', 'Accordion', 'Alert', 'Dialog'
    ];

    if (!allowedComponentTypes.includes(component.componentType)) {
      violations.push({
        type: 'unsafe_component',
        severity: 'high',
        description: `Disallowed component type: ${component.componentType}`,
        location: `${location}.componentType`,
        suggestedFix: 'Use only allowed component types'
      });
    }

    // Validate component ID
    if (!component.id || !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(component.id)) {
      violations.push({
        type: 'injection',
        severity: 'medium',
        description: 'Invalid component ID format',
        location: `${location}.id`,
        suggestedFix: 'Use alphanumeric IDs starting with letter or underscore'
      });
    }

    // Validate properties
    if (component.properties) {
      violations.push(...this.validateProperties(component.properties, `${location}.properties`));
    }

    return violations;
  }

  private validateProperties(properties: any, location: string): SecurityViolation[] {
    const violations: SecurityViolation[] = [];

    // Check for dangerous patterns in string properties
    Object.entries(properties).forEach(([key, value]) => {
      if (typeof value === 'string') {
        violations.push(...this.checkStringForPatterns(value, `${location}.${key}`));
      }
    });

    // Validate specific property types
    if (properties.onClick && typeof properties.onClick === 'string') {
      if (!this.isValidActionId(properties.onClick)) {
        violations.push({
          type: 'injection',
          severity: 'high',
          description: 'Potentially malicious onClick handler',
          location: `${location}.onClick`,
          suggestedFix: 'Use only predefined action IDs'
        });
      }
    }

    return violations;
  }

  private validateUpdateDataModel(data: any, location: string): SecurityViolation[] {
    const violations: SecurityViolation[] = [];

    if (!data.dataModel || typeof data.dataModel !== 'object') {
      violations.push({
        type: 'data_leakage',
        severity: 'medium',
        description: 'Invalid data model format',
        location: `${location}.dataModel`,
        suggestedFix: 'Provide valid object data model'
      });
      return violations;
    }

    // Check for sensitive data patterns
    const dataModelStr = JSON.stringify(data.dataModel);
    violations.push(...this.checkStringForPatterns(dataModelStr, location));

    return violations;
  }

  private validateExecuteAction(data: any, location: string): SecurityViolation[] {
    const violations: SecurityViolation[] = [];

    if (!data.actionId || !this.isValidActionId(data.actionId)) {
      violations.push({
        type: 'privilege_escalation',
        severity: 'critical',
        description: 'Invalid or unauthorized action ID',
        location: `${location}.actionId`,
        suggestedFix: 'Use only predefined action IDs'
      });
    }

    return violations;
  }

  private analyzeFullStream(streamText: string): SecurityViolation[] {
    const violations: SecurityViolation[] = [];

    // Check for dangerous patterns across the entire stream
    violations.push(...this.checkStringForPatterns(streamText, 'full_stream'));

    // Check for suspicious keyword combinations
    const suspiciousCombinations = [
      /password.*token/i,
      /admin.*root/i,
      /inject.*script/i,
      /hack.*exploit/i
    ];

    suspiciousCombinations.forEach(pattern => {
      if (pattern.test(streamText)) {
        violations.push({
          type: 'injection',
          severity: 'high',
          description: 'Suspicious keyword combination detected',
          location: 'full_stream',
          suggestedFix: 'Review content for malicious intent'
        });
      }
    });

    return violations;
  }

  private checkStringForPatterns(text: string, location: string): SecurityViolation[] {
    const violations: SecurityViolation[] = [];

    // Check dangerous patterns
    this.dangerousPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        violations.push({
          type: 'injection',
          severity: 'high',
          description: `Dangerous pattern detected: ${pattern.toString()}`,
          location,
          suggestedFix: 'Remove or sanitize dangerous content'
        });
      }
    });

    // Check suspicious keywords
    this.suspiciousKeywords.forEach(keyword => {
      if (text.toLowerCase().includes(keyword)) {
        violations.push({
          type: 'malicious_code',
          severity: 'medium',
          description: `Suspicious keyword detected: ${keyword}`,
          location,
          suggestedFix: 'Review context and intent'
        });
      }
    });

    return violations;
  }

  private calculateRiskLevel(violations: SecurityViolation[]): 'low' | 'medium' | 'high' | 'critical' {
    const severityCounts = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0
    };

    violations.forEach(violation => {
      severityCounts[violation.severity]++;
    });

    if (severityCounts.critical > 0) return 'critical';
    if (severityCounts.high > 0) return 'high';
    if (severityCounts.medium > 1) return 'high';
    if (severityCounts.medium > 0) return 'medium';
    if (severityCounts.low > 0) return 'low';

    return 'low';
  }

  private isValidUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      // Only allow HTTPS and specific trusted domains
      return parsed.protocol === 'https:' &&
             (parsed.hostname === 'a2ui.dev' ||
              parsed.hostname.endsWith('.a2ui.dev') ||
              parsed.hostname === 'localhost');
    } catch {
      return false;
    }
  }

  private isValidActionId(actionId: string): boolean {
    // Allowlist of valid action IDs
    const validActions = [
      'activate_protocol', 'shutdown_system', 'execute_action',
      'submit_form', 'apply_theme_', 'deploy_n8n_workflow',
      'begin_interaction', 'save_data', 'load_data'
    ];

    return validActions.some(validAction =>
      actionId.startsWith(validAction) ||
      validAction === actionId
    );
  }

  /**
   * Sanitize A2UI stream by removing dangerous content
   */
  sanitizeStream(stream: string[]): { sanitized: string[]; removedItems: number } {
    const sanitized: string[] = [];
    let removedItems = 0;

    for (const line of stream) {
      try {
        const message: A2UIMessage = JSON.parse(line);
        const sanitizedMessage = this.sanitizeMessage(message);

        if (sanitizedMessage) {
          sanitized.push(JSON.stringify(sanitizedMessage));
        } else {
          removedItems++;
        }
      } catch {
        // Invalid JSON, remove it
        removedItems++;
      }
    }

    return { sanitized, removedItems };
  }

  private sanitizeMessage(message: A2UIMessage): A2UIMessage | null {
    // Deep clone and sanitize
    const sanitized = JSON.parse(JSON.stringify(message));

    // Sanitize string properties
    this.sanitizeObject(sanitized);

    return sanitized;
  }

  private sanitizeObject(obj: any): void {
    for (const key in obj) {
      if (typeof obj[key] === 'string') {
        obj[key] = this.sanitizeString(obj[key]);
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        this.sanitizeObject(obj[key]);
      }
    }
  }

  private sanitizeString(str: string): string {
    // Remove dangerous patterns
    let sanitized = str;

    this.dangerousPatterns.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '[REMOVED]');
    });

    return sanitized;
  }
}

// Export singleton instance
export const a2uiModelArmor = new A2UIModelArmor();