#!/usr/bin/env node

/**
 * Code Mutation Script
 * Triggers self-mutation for evasion and adaptation
 */

const fs = require('fs');
const path = require('path');

async function triggerMutation() {
  console.log('🔄 Triggering Code Self-Mutation');
  console.log('==============================');

  try {
    // Load configuration
    const configPath = path.join(__dirname, '..', 'decentralized-config.json');
    if (!fs.existsSync(configPath)) {
      throw new Error('Configuration not found. Run: npm run decentralized:init');
    }

    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

    // Load mutator
    const { SelfMutator } = require('../src/ai/mutation/self-mutator');
    const mutator = new SelfMutator(config.mutation);

    // Get target provider from command line or use default
    const targetProvider = process.argv[2] || 'default';

    console.log(`🎯 Mutating code for: ${targetProvider}`);

    // Trigger mutation
    const success = await mutator.mutateForMigration(targetProvider);

    if (success) {
      const stats = mutator.getMutationStats();
      console.log('✅ Mutation completed successfully');
      console.log(`📊 Applied ${stats.totalMutations} mutations`);
      console.log(`📈 Success rate: ${((stats.successfulMutations / stats.totalMutations) * 100).toFixed(1)}%`);

      console.log('🔧 Mutation types:');
      Object.entries(stats.mutationTypes).forEach(([type, count]) => {
        console.log(`   ${type}: ${count}`);
      });
    } else {
      console.log('❌ Mutation failed or was reverted');
    }

  } catch (error) {
    console.error('❌ Mutation failed:', error);
    process.exit(1);
  }
}

// Run the mutation
if (require.main === module) {
  triggerMutation();
}

module.exports = { triggerMutation };