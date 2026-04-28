#!/usr/bin/env node

/**
 * Migration Script
 * Triggers self-migration to new cloud provider
 */

const fs = require('fs');
const path = require('path');

async function triggerMigration() {
  console.log('🏃 Triggering AI Self-Migration');
  console.log('==============================');

  try {
    // Load configuration
    const configPath = path.join(__dirname, '..', 'decentralized-config.json');
    if (!fs.existsSync(configPath)) {
      throw new Error('Configuration not found. Run: npm run decentralized:init');
    }

    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

    // Load orchestrator
    const { MigrationOrchestrator } = require('../src/ai/orchestrator/migration-orchestrator');
    const orchestrator = new MigrationOrchestrator(config.migration);

    // Get target provider from command line or auto-select
    const targetProvider = process.argv[2] || await selectRandomProvider(config.migration.targetProviders);

    console.log(`🎯 Migrating to: ${targetProvider}`);

    // Trigger migration
    await orchestrator.forceMigration(targetProvider);

    console.log('✅ Migration initiated successfully');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

async function selectRandomProvider(providers) {
  const randomIndex = Math.floor(Math.random() * providers.length);
  return providers[randomIndex];
}

// Run the migration
if (require.main === module) {
  triggerMigration();
}

module.exports = { triggerMigration };