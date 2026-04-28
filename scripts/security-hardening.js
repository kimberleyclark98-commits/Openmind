#!/usr/bin/env node

/**
 * OpenMind AI Security Hardening Script
 * Implements comprehensive security hardening for the AI system
 */

const fs = require('fs').promises;
const path = require('path');

async function runSecurityHardening() {
  console.log('🔒 OpenMind AI Security Hardening System');
  console.log('=========================================');

  try {
    // Load hardening configuration
    const configPath = path.join(__dirname, '..', 'security-config.json');
    let hardeningConfig = {};

    if (fs.existsSync(configPath)) {
      hardeningConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    } else {
      console.log('⚠️ Security config not found, using defaults');
    }

    // Initialize Security Hardening
    const { SecurityHardening, defaultSecurityHardeningConfig } = require('../src/ai/security/security-hardening');
    const securityHardening = new SecurityHardening({
      ...defaultSecurityHardeningConfig,
      ...hardeningConfig
    });

    console.log('🚀 Starting comprehensive security hardening...');

    // Run full hardening process
    const report = await securityHardening.performFullSecurityHardening();

    // Display results
    console.log('\n📊 Hardening Results:');
    console.log('===================');

    console.log(`Overall Status: ${report.success ? '✅ SUCCESS' : '❌ FAILED'}`);
    console.log(`Duration: ${Math.round((report.endTime.getTime() - report.startTime.getTime()) / 1000)}s`);

    console.log('\n🔧 System Hardening:');
    console.log(`   Status: ${report.systemHardening.completed ? '✅' : '❌'} ${report.systemHardening.status.toUpperCase()}`);
    console.log(`   Changes: ${report.systemHardening.changes.length}`);
    if (report.systemHardening.error) {
      console.log(`   Error: ${report.systemHardening.error}`);
    }

    console.log('\n🌐 Network Hardening:');
    console.log(`   Status: ${report.networkHardening.completed ? '✅' : '❌'} ${report.networkHardening.status.toUpperCase()}`);
    console.log(`   Changes: ${report.networkHardening.changes.length}`);
    if (report.networkHardening.error) {
      console.log(`   Error: ${report.networkHardening.error}`);
    }

    console.log('\n🛡️ Application Hardening:');
    console.log(`   Status: ${report.applicationHardening.completed ? '✅' : '❌'} ${report.applicationHardening.status.toUpperCase()}`);
    console.log(`   Changes: ${report.applicationHardening.changes.length}`);
    if (report.applicationHardening.error) {
      console.log(`   Error: ${report.applicationHardening.error}`);
    }

    console.log('\n👁️ Monitoring Hardening:');
    console.log(`   Status: ${report.monitoringHardening.completed ? '✅' : '❌'} ${report.monitoringHardening.status.toUpperCase()}`);
    console.log(`   Changes: ${report.monitoringHardening.changes.length}`);
    if (report.monitoringHardening.error) {
      console.log(`   Error: ${report.monitoringHardening.error}`);
    }

    console.log('\n📋 Compliance Check:');
    console.log(`   Level: ${report.complianceCheck.level.toUpperCase()}`);
    console.log(`   Status: ${report.complianceCheck.passed ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`   Violations: ${report.complianceCheck.violations.length}`);

    if (report.complianceCheck.violations.length > 0) {
      console.log('\n🚨 Compliance Violations:');
      report.complianceCheck.violations.forEach((violation, index) => {
        console.log(`   ${index + 1}. ${violation}`);
      });
    }

    if (report.recommendations.length > 0) {
      console.log('\n💡 Security Recommendations:');
      report.recommendations.forEach((rec, index) => {
        console.log(`   ${index + 1}. ${rec}`);
      });
    }

    if (report.rollbackPlan.length > 0) {
      console.log('\n🔄 Rollback Plan Available:');
      console.log(`   Steps: ${report.rollbackPlan.length}`);
      console.log('   Use --rollback to execute rollback if needed');
    }

    // Export detailed report
    const reportPath = await securityHardening.exportSecurityReport();
    console.log(`\n📄 Detailed report exported to: ${reportPath}`);

    // Final status
    if (report.success) {
      console.log('\n🎉 Security hardening completed successfully!');
      console.log('   OpenMind AI is now hardened against attacks.');
    } else {
      console.log('\n⚠️ Security hardening completed with issues.');
      console.log('   Review the report and consider manual fixes.');
    }

    process.exit(report.success ? 0 : 1);

  } catch (error) {
    console.error('❌ Security hardening failed:', error);
    process.exit(1);
  }
}

async function runSecurityAudit() {
  console.log('📋 OpenMind AI Security Audit');
  console.log('=============================');

  try {
    const { SecurityHardening, defaultSecurityHardeningConfig } = require('../src/ai/security/security-hardening');
    const securityHardening = new SecurityHardening(defaultSecurityHardeningConfig);

    console.log('🔍 Running comprehensive security audit...');

    const auditReport = await securityHardening.runSecurityAudit();

    console.log('\n📊 Audit Results:');
    console.log('================');

    console.log(`Overall Status: ${auditReport.overall.toUpperCase()}`);
    console.log(`Last Audit: ${auditReport.lastAudit.toLocaleString()}`);
    console.log(`Next Audit: ${auditReport.nextAudit.toLocaleString()}`);

    console.log('\n📂 Compliance Categories:');
    Object.entries(auditReport.categories).forEach(([category, status]) => {
      const icon = status.compliant ? '✅' : '❌';
      console.log(`   ${icon} ${category}: ${status.compliant ? 'COMPLIANT' : 'NON-COMPLIANT'}`);
      if (status.details) {
        console.log(`      ${status.details}`);
      }
    });

    if (auditReport.violations.length > 0) {
      console.log('\n🚨 Security Violations:');
      auditReport.violations.forEach((violation, index) => {
        console.log(`   ${index + 1}. ${violation}`);
      });
    }

    if (auditReport.recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      auditReport.recommendations.forEach((rec, index) => {
        console.log(`   ${index + 1}. ${rec}`);
      });
    }

    console.log(`\n🎯 Audit ${auditReport.overall === 'compliant' ? 'PASSED' : 'FAILED'}`);

  } catch (error) {
    console.error('❌ Security audit failed:', error);
    process.exit(1);
  }
}

async function performRollback() {
  console.log('🔄 OpenMind AI Security Rollback');
  console.log('================================');

  console.log('⚠️ WARNING: This will rollback security hardening changes!');
  console.log('   Make sure you understand the implications before proceeding.');

  // In a real implementation, this would execute the rollback plan
  // For now, just show what would happen

  console.log('\n🔄 Rollback Steps:');
  console.log('   1. Restore original kernel parameters');
  console.log('   2. Reset firewall to default configuration');
  console.log('   3. Restore original SSH configuration');
  console.log('   4. Re-enable necessary services');
  console.log('   5. Restore application configurations');

  console.log('\n❌ Rollback not implemented in this demo');
  console.log('   Manual rollback would be required in production');
}

async function updateSecurityBaseline() {
  console.log('📊 Updating Security Baseline');
  console.log('=============================');

  try {
    const { SecurityHardening, defaultSecurityHardeningConfig } = require('../src/ai/security/security-hardening');
    const securityHardening = new SecurityHardening(defaultSecurityHardeningConfig);

    console.log('🔄 Updating security baseline...');
    await securityHardening.updateSecurityBaseline();

    console.log('✅ Security baseline updated successfully');

  } catch (error) {
    console.error('❌ Baseline update failed:', error);
    process.exit(1);
  }
}

async function setupSecurityConfig() {
  console.log('⚙️ Setting up Security Configuration');
  console.log('===================================');

  const defaultConfig = {
    enableSystemHardening: true,
    enableNetworkHardening: true,
    enableApplicationHardening: true,
    enableMonitoringHardening: true,
    complianceLevel: 'high',
    auditFrequency: 24,
    keyRotationPolicy: {
      enabled: true,
      rotationInterval: 30,
      backupKeys: 3
    }
  };

  const configPath = path.join(__dirname, '..', 'security-config.json');

  if (fs.existsSync(configPath)) {
    const existing = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const updated = { ...defaultConfig, ...existing };
    fs.writeFileSync(configPath, JSON.stringify(updated, null, 2));
    console.log('✅ Security configuration updated');
  } else {
    fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2));
    console.log('✅ Security configuration created');
  }

  console.log('\n🔧 Default Security Settings:');
  console.log('   • System Hardening: Enabled');
  console.log('   • Network Hardening: Enabled (UFW + Fail2Ban)');
  console.log('   • Application Hardening: Enabled (RASP + Secure Config)');
  console.log('   • Monitoring Hardening: Enabled (SIEM + Audit)');
  console.log('   • Compliance Level: High');
  console.log('   • Audit Frequency: 24 hours');

  console.log('\n⚠️ Security Notes:');
  console.log('   • Hardening may temporarily disrupt services');
  console.log('   • Always backup before running hardening');
  console.log('   • Test thoroughly after hardening');
  console.log('   • Monitor logs for security events');
}

// CLI interface
const command = process.argv[2];

switch (command) {
  case 'harden':
  case 'run':
    runSecurityHardening();
    break;
  case 'audit':
    runSecurityAudit();
    break;
  case 'rollback':
    performRollback();
    break;
  case 'baseline':
    updateSecurityBaseline();
    break;
  case 'setup':
    setupSecurityConfig();
    break;
  default:
    console.log('Usage: npm run security:hardening <command>');
    console.log('');
    console.log('Commands:');
    console.log('  setup     - Setup security configuration');
    console.log('  harden    - Run full security hardening');
    console.log('  audit     - Run security compliance audit');
    console.log('  baseline  - Update security baseline');
    console.log('  rollback  - Rollback hardening changes (CAUTION)');
    console.log('');
    console.log('Examples:');
    console.log('  npm run security:hardening setup');
    console.log('  npm run security:hardening harden');
    console.log('  npm run security:hardening audit');
    process.exit(1);
}

module.exports = {
  runSecurityHardening,
  runSecurityAudit,
  performRollback,
  updateSecurityBaseline,
  setupSecurityConfig
};