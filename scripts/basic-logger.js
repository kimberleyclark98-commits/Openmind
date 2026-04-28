/**
 * OpenMind AI - Basic Logging System
 * Provides console and file logging with different log levels
 */

const fs = require('fs').promises;
const path = require('path');

class BasicLogger {
  constructor(options = {}) {
    this.logLevel = options.level || 'info'; // error, warn, info, debug
    this.logToFile = options.logToFile !== false;
    this.logToConsole = options.logToConsole !== false;
    this.logDir = options.logDir || path.join(process.cwd(), 'logs');
    this.maxFileSize = options.maxFileSize || 10 * 1024 * 1024; // 10MB
    this.maxFiles = options.maxFiles || 5; // Keep 5 log files

    this.levels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3
    };

    this.currentLogFile = null;
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      // Ensure log directory exists
      await fs.mkdir(this.logDir, { recursive: true });

      // Generate log file name with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      this.currentLogFile = path.join(this.logDir, `openmind-${timestamp}.log`);

      // Initialize log file
      await fs.writeFile(this.currentLogFile, `# OpenMind AI Log - ${new Date().toISOString()}\n`);
      await fs.appendFile(this.currentLogFile, '# Log Level: ' + this.logLevel + '\n');
      await fs.appendFile(this.currentLogFile, '# PID: ' + process.pid + '\n');
      await fs.appendFile(this.currentLogFile, '# Node Version: ' + process.version + '\n');
      await fs.appendFile(this.currentLogFile, '# Platform: ' + process.platform + '\n\n');

      this.initialized = true;
      console.log(`📝 Logger initialized - writing to ${this.currentLogFile}`);

    } catch (error) {
      console.error('Failed to initialize logger:', error);
      this.logToFile = false; // Fallback to console only
    }
  }

  async log(level, message, meta = {}) {
    if (this.levels[level] > this.levels[this.logLevel]) {
      return; // Skip if below current log level
    }

    const timestamp = new Date().toISOString();
    const pid = process.pid;

    // Format log entry
    const logEntry = {
      timestamp,
      level: level.toUpperCase(),
      pid,
      message,
      ...meta
    };

    // Console output
    if (this.logToConsole) {
      const consoleMessage = this.formatConsoleMessage(logEntry);
      console.log(consoleMessage);
    }

    // File output
    if (this.logToFile && this.initialized) {
      try {
        const fileMessage = JSON.stringify(logEntry) + '\n';
        await fs.appendFile(this.currentLogFile, fileMessage);

        // Check if we need to rotate the log file
        await this.checkLogRotation();

      } catch (error) {
        console.error('Failed to write to log file:', error);
        // Fallback to console
        console.log('FALLBACK LOG:', JSON.stringify(logEntry));
      }
    }
  }

  formatConsoleMessage(entry) {
    const levelColors = {
      ERROR: '\x1b[31m', // Red
      WARN: '\x1b[33m',  // Yellow
      INFO: '\x1b[36m',  // Cyan
      DEBUG: '\x1b[35m'  // Magenta
    };

    const color = levelColors[entry.level] || '\x1b[37m'; // White default
    const reset = '\x1b[0m';

    const timestamp = entry.timestamp.slice(11, 19); // HH:MM:SS
    const level = entry.level.padEnd(5);
    const pid = entry.pid.toString().padStart(5);

    return `${color}[${timestamp}] ${level} ${pid}: ${entry.message}${reset}`;
  }

  async checkLogRotation() {
    try {
      const stats = await fs.stat(this.currentLogFile);
      if (stats.size > this.maxFileSize) {
        await this.rotateLogFile();
      }
    } catch (error) {
      // Ignore stat errors
    }
  }

  async rotateLogFile() {
    try {
      // Generate new log file name
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const newLogFile = path.join(this.logDir, `openmind-${timestamp}.log`);

      // Initialize new log file
      await fs.writeFile(newLogFile, `# OpenMind AI Log (Rotated) - ${new Date().toISOString()}\n\n`);
      this.currentLogFile = newLogFile;

      // Clean up old log files if we have too many
      await this.cleanupOldLogs();

      console.log(`🔄 Log file rotated to ${newLogFile}`);

    } catch (error) {
      console.error('Failed to rotate log file:', error);
    }
  }

  async cleanupOldLogs() {
    try {
      const files = await fs.readdir(this.logDir);
      const logFiles = files
        .filter(file => file.startsWith('openmind-') && file.endsWith('.log'))
        .map(file => ({
          name: file,
          path: path.join(this.logDir, file),
          stats: null
        }));

      // Get file stats
      for (const file of logFiles) {
        try {
          file.stats = await fs.stat(file.path);
        } catch {}
      }

      // Sort by modification time (newest first)
      logFiles.sort((a, b) => {
        if (!a.stats || !b.stats) return 0;
        return b.stats.mtime.getTime() - a.stats.mtime.getTime();
      });

      // Remove old files beyond the limit
      if (logFiles.length > this.maxFiles) {
        const filesToDelete = logFiles.slice(this.maxFiles);
        for (const file of filesToDelete) {
          try {
            await fs.unlink(file.path);
            console.log(`🗑️ Cleaned up old log file: ${file.name}`);
          } catch (error) {
            console.error(`Failed to delete old log file ${file.name}:`, error);
          }
        }
      }

    } catch (error) {
      console.error('Failed to cleanup old logs:', error);
    }
  }

  // Convenience methods for different log levels
  async error(message, meta = {}) {
    await this.log('error', message, meta);
  }

  async warn(message, meta = {}) {
    await this.log('warn', message, meta);
  }

  async info(message, meta = {}) {
    await this.log('info', message, meta);
  }

  async debug(message, meta = {}) {
    await this.log('debug', message, meta);
  }

  // System event logging
  async logSystemEvent(event, details = {}) {
    await this.info(`System Event: ${event}`, {
      eventType: 'system',
      ...details
    });
  }

  async logAPIRequest(endpoint, method, status, duration) {
    await this.info(`API Request: ${method} ${endpoint}`, {
      eventType: 'api',
      method,
      endpoint,
      status,
      duration
    });
  }

  async logAgentAction(action, confidence, result) {
    await this.info(`Agent Action: ${action}`, {
      eventType: 'agent',
      action,
      confidence,
      result
    });
  }

  async logFuelTransaction(type, amount, balance) {
    await this.info(`Fuel Transaction: ${type} ${amount} SOL`, {
      eventType: 'fuel',
      type,
      amount,
      balance
    });
  }

  async logMigrationEvent(event, details = {}) {
    await this.warn(`Migration Event: ${event}`, {
      eventType: 'migration',
      ...details
    });
  }

  async logSecurityEvent(event, severity = 'info', details = {}) {
    const level = severity === 'critical' ? 'error' : severity === 'warning' ? 'warn' : 'info';
    await this.log(level, `Security Event: ${event}`, {
      eventType: 'security',
      severity,
      ...details
    });
  }

  // Get recent logs
  async getRecentLogs(lines = 50) {
    if (!this.initialized) return [];

    try {
      const content = await fs.readFile(this.currentLogFile, 'utf8');
      const logLines = content.trim().split('\n').filter(line => line.trim() && !line.startsWith('#'));

      return logLines.slice(-lines).map(line => {
        try {
          return JSON.parse(line);
        } catch {
          return { message: line, raw: true };
        }
      });

    } catch (error) {
      console.error('Failed to read recent logs:', error);
      return [];
    }
  }

  // Get log statistics
  async getLogStats() {
    if (!this.initialized) return null;

    try {
      const stats = await fs.stat(this.currentLogFile);
      const logs = await this.getRecentLogs(1000);

      const levelCounts = logs.reduce((acc, log) => {
        const level = log.level || 'unknown';
        acc[level] = (acc[level] || 0) + 1;
        return acc;
      }, {});

      return {
        currentFile: path.basename(this.currentLogFile),
        fileSize: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
        totalEntries: logs.length,
        levelCounts
      };

    } catch (error) {
      console.error('Failed to get log stats:', error);
      return null;
    }
  }
}

// Global logger instance
let globalLogger = null;

function getLogger(options = {}) {
  if (!globalLogger) {
    globalLogger = new BasicLogger(options);
  }
  return globalLogger;
}

// Export both class and singleton
module.exports = {
  BasicLogger,
  getLogger
};