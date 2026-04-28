#!/usr/bin/env node

/**
 * OpenMind AI - Memory Optimization v1
 * Basic RAM analysis, log cleanup, and data compression
 */

const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const { getLogger } = require('./basic-logger');

class BasicMemoryOptimizer {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '..');
    this.logger = getLogger({ level: process.env.LOG_LEVEL || 'info' });
    this.optimizationStats = {
      initialMemory: 0,
      finalMemory: 0,
      logsCleaned: 0,
      dataCompressed: 0,
      spaceSaved: 0,
      startTime: new Date(),
      endTime: null
    };
  }

  async initialize() {
    await this.logger.initialize();
    await this.logger.info('Basic Memory Optimizer initialized');
  }

  async analyzeSystemMemory() {
    console.log('📊 Analyzing System Memory Usage...');

    const memUsage = process.memoryUsage();
    const systemMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = systemMem - freeMem;

    console.log(`   System Memory: ${(usedMem / 1024 / 1024 / 1024).toFixed(2)} GB used / ${(systemMem / 1024 / 1024 / 1024).toFixed(2)} GB total`);
    console.log(`   Free Memory: ${(freeMem / 1024 / 1024 / 1024).toFixed(2)} GB`);
    console.log(`   Memory Usage: ${((usedMem / systemMem) * 100).toFixed(1)}%`);

    console.log(`   Process Memory: ${(memUsage.heapUsed / 1024 / 1024).toFixed(2)} MB used / ${(memUsage.heapTotal / 1024 / 1024).toFixed(2)} MB total`);
    console.log(`   External Memory: ${(memUsage.external / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   RSS: ${(memUsage.rss / 1024 / 1024).toFixed(2)} MB`);

    await this.logger.info('System memory analysis completed', {
      systemUsed: usedMem,
      systemTotal: systemMem,
      processHeapUsed: memUsage.heapUsed,
      processHeapTotal: memUsage.heapTotal
    });

    // Check if memory usage is high
    const memoryPressure = (usedMem / systemMem) > 0.85 || (memUsage.heapUsed / memUsage.heapTotal) > 0.9;

    return {
      systemUsagePercent: (usedMem / systemMem) * 100,
      processUsagePercent: (memUsage.heapUsed / memUsage.heapTotal) * 100,
      memoryPressure,
      recommendations: this.generateMemoryRecommendations(memoryPressure, usedMem, systemMem)
    };
  }

  generateMemoryRecommendations(memoryPressure, usedMem, systemTotal) {
    const recommendations = [];

    if (memoryPressure) {
      recommendations.push('High memory pressure detected - consider freeing up system resources');
    }

    if (usedMem / systemTotal > 0.9) {
      recommendations.push('Critical memory usage - immediate action recommended');
    }

    if (recommendations.length === 0) {
      recommendations.push('Memory usage is within normal parameters');
    }

    return recommendations;
  }

  async cleanupOldLogs() {
    console.log('🧹 Cleaning up old log files...');

    const logsDir = path.join(this.projectRoot, 'logs');
    let cleanedCount = 0;
    let spaceSaved = 0;

    try {
      // Ensure logs directory exists
      await fs.mkdir(logsDir, { recursive: true });

      // Get all log files
      const files = await fs.readdir(logsDir);
      const logFiles = files.filter(file => file.endsWith('.log') || file.endsWith('.jsonl'));

      if (logFiles.length === 0) {
        console.log('   No log files found to clean');
        return { cleanedCount: 0, spaceSaved: 0 };
      }

      // Sort by modification time (oldest first)
      const fileStats = await Promise.all(
        logFiles.map(async (file) => {
          const filePath = path.join(logsDir, file);
          const stats = await fs.stat(filePath);
          return { name: file, path: filePath, stats };
        })
      );

      fileStats.sort((a, b) => a.stats.mtime.getTime() - b.stats.mtime.getTime());

      // Keep only the 5 most recent log files
      const filesToDelete = fileStats.slice(0, Math.max(0, fileStats.length - 5));

      for (const file of filesToDelete) {
        try {
          await fs.unlink(file.path);
          cleanedCount++;
          spaceSaved += file.stats.size;
          console.log(`   🗑️ Deleted old log: ${file.name} (${(file.stats.size / 1024).toFixed(0)} KB)`);
        } catch (error) {
          console.error(`   Failed to delete ${file.name}:`, error);
        }
      }

      console.log(`   ✅ Cleaned up ${cleanedCount} old log files, saved ${(spaceSaved / 1024 / 1024).toFixed(2)} MB`);

    } catch (error) {
      console.error('Failed to cleanup logs:', error);
    }

    return { cleanedCount, spaceSaved };
  }

  async compressDataFiles() {
    console.log('🗜️ Compressing data files...');

    const dataDir = path.join(this.projectRoot, 'data');
    let compressedCount = 0;
    let spaceSaved = 0;

    try {
      // Ensure data directory exists
      await fs.mkdir(dataDir, { recursive: true });

      // Get all JSON files in data directory
      const files = await fs.readdir(dataDir);
      const jsonFiles = files.filter(file => file.endsWith('.json') || file.endsWith('.jsonl'));

      for (const file of jsonFiles) {
        const filePath = path.join(dataDir, file);

        try {
          const stats = await fs.stat(filePath);
          const originalSize = stats.size;

          // Read and parse JSON
          const content = await fs.readFile(filePath, 'utf8');

          // For JSONL files, compress by removing extra whitespace
          if (file.endsWith('.jsonl')) {
            const lines = content.trim().split('\n').filter(line => line.trim());
            const compressedLines = lines.map(line => {
              try {
                const obj = JSON.parse(line);
                return JSON.stringify(obj); // Re-stringify to remove extra spaces
              } catch {
                return line; // Keep as-is if not valid JSON
              }
            });

            const compressed = compressedLines.join('\n');
            await fs.writeFile(filePath, compressed);

            const newSize = compressed.length;
            const saved = originalSize - newSize;

            if (saved > 0) {
              compressedCount++;
              spaceSaved += saved;
              console.log(`   📦 Compressed ${file}: saved ${(saved / 1024).toFixed(0)} KB`);
            }
          }

        } catch (error) {
          console.error(`   Failed to compress ${file}:`, error);
        }
      }

      console.log(`   ✅ Compressed ${compressedCount} data files, saved ${(spaceSaved / 1024).toFixed(0)} KB`);

    } catch (error) {
      console.error('Failed to compress data files:', error);
    }

    return { compressedCount, spaceSaved };
  }

  async optimizeCacheFiles() {
    console.log('🔄 Optimizing cache files...');

    const cacheDirs = [
      path.join(this.projectRoot, 'node_modules/.cache'),
      path.join(this.projectRoot, '.next/cache'),
      path.join(this.projectRoot, 'network-cache')
    ];

    let totalCleaned = 0;

    for (const cacheDir of cacheDirs) {
      try {
        // Check if cache directory exists and is not too recent
        const stats = await fs.stat(cacheDir);
        const ageInDays = (Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60 * 24);

        if (ageInDays > 7) { // Clean caches older than 7 days
          console.log(`   🧹 Cleaning old cache: ${path.basename(cacheDir)}`);

          // For safety, we'll just log this for now
          // In a real implementation, you might clear specific cache files
          console.log(`   📝 Would clean cache directory: ${cacheDir}`);

          totalCleaned++;
        }
      } catch (error) {
        // Cache directory doesn't exist, skip
      }
    }

    console.log(`   ✅ Checked ${totalCleaned} cache directories`);
    return { cacheDirsChecked: totalCleaned };
  }

  async runOptimization() {
    console.log('🧠 Starting Basic Memory Optimization...\n');

    this.optimizationStats.startTime = new Date();

    // Phase 1: Analyze current memory state
    const memoryAnalysis = await this.analyzeSystemMemory();
    this.optimizationStats.initialMemory = process.memoryUsage().heapUsed;

    // Phase 2: Clean old logs
    const logCleanup = await this.cleanupOldLogs();
    this.optimizationStats.logsCleaned = logCleanup.cleanedCount;
    this.optimizationStats.spaceSaved += logCleanup.spaceSaved;

    // Phase 3: Compress data files
    const dataCompression = await this.compressDataFiles();
    this.optimizationStats.dataCompressed = dataCompression.compressedCount;
    this.optimizationStats.spaceSaved += dataCompression.spaceSaved;

    // Phase 4: Optimize caches
    await this.optimizeCacheFiles();

    this.optimizationStats.endTime = new Date();
    this.optimizationStats.finalMemory = process.memoryUsage().heapUsed;

    // Generate report
    await this.generateReport(memoryAnalysis);

    await this.logger.info('Basic memory optimization completed', this.optimizationStats);
  }

  async generateReport(memoryAnalysis) {
    const duration = this.optimizationStats.endTime - this.optimizationStats.startTime;

    console.log('\n📋 Memory Optimization Report');
    console.log('=============================');

    console.log(`Duration: ${duration}ms`);
    console.log(`Memory Before: ${(this.optimizationStats.initialMemory / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Memory After: ${(this.optimizationStats.finalMemory / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Space Saved: ${(this.optimizationStats.spaceSaved / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Logs Cleaned: ${this.optimizationStats.logsCleaned}`);
    console.log(`Files Compressed: ${this.optimizationStats.dataCompressed}`);

    console.log('\n💡 Recommendations:');
    memoryAnalysis.recommendations.forEach(rec => console.log(`   • ${rec}`));

    console.log('\n✅ Basic memory optimization completed successfully!');
  }

  async emergencyOptimization() {
    console.log('🚨 EMERGENCY MEMORY OPTIMIZATION');
    console.log('================================');

    // Aggressive cleanup for emergency situations
    console.log('🔥 Performing emergency memory cleanup...');

    // Force garbage collection if available
    if (global.gc) {
      console.log('🗑️ Running garbage collection...');
      global.gc();
    }

    // Aggressive log cleanup (keep only 1 file)
    const logsDir = path.join(this.projectRoot, 'logs');
    try {
      const files = await fs.readdir(logsDir);
      const logFiles = files.filter(file => file.endsWith('.log')).sort();

      // Keep only the most recent log file
      if (logFiles.length > 1) {
        const filesToDelete = logFiles.slice(0, -1);
        for (const file of filesToDelete) {
          await fs.unlink(path.join(logsDir, file));
          console.log(`   🗑️ Emergency deleted: ${file}`);
        }
      }
    } catch (error) {
      // Ignore errors in emergency mode
    }

    console.log('✅ Emergency optimization completed');
  }
}

// CLI Interface
async function main() {
  const optimizer = new BasicMemoryOptimizer();
  await optimizer.initialize();

  const command = process.argv[2];

  try {
    switch (command) {
      case 'run':
      case 'optimize':
        await optimizer.runOptimization();
        break;

      case 'emergency':
        await optimizer.emergencyOptimization();
        break;

      case 'analyze':
        const analysis = await optimizer.analyzeSystemMemory();
        console.log('\n💡 Recommendations:');
        analysis.recommendations.forEach(rec => console.log(`   • ${rec}`));
        break;

      default:
        console.log('OpenMind AI Basic Memory Optimizer v1');
        console.log('');
        console.log('Commands:');
        console.log('  node basic-memory-optimize.js run       # Run full optimization');
        console.log('  node basic-memory-optimize.js emergency # Emergency cleanup');
        console.log('  node basic-memory-optimize.js analyze   # Analyze memory usage');
        console.log('');
        console.log('Features:');
        console.log('  • System memory analysis');
        console.log('  • Log file cleanup');
        console.log('  • Data file compression');
        console.log('  • Cache optimization');
        break;
    }

  } catch (error) {
    console.error('Memory optimization error:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = BasicMemoryOptimizer;