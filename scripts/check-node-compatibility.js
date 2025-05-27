#!/usr/bin/env node

/**
 * Скрипт для проверки совместимости с разными версиями Node.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function getNodeVersion() {
  return process.version;
}

function getNodeMajorVersion() {
  return parseInt(process.version.slice(1).split('.')[0]);
}

function checkTypeScriptConfig() {
  const majorVersion = getNodeMajorVersion();
  const configFile = 'tsconfig.typecheck.json';
  
  console.log(`Node.js version: ${getNodeVersion()}`);
  console.log(`Major version: ${majorVersion}`);
  console.log(`Using unified TypeScript config: ${configFile}`);
  
  if (!fs.existsSync(configFile)) {
    console.error(`❌ Config file ${configFile} not found!`);
    process.exit(1);
  }
  
  try {
    console.log(`✅ Running TypeScript check with ${configFile}...`);
    execSync(`npx tsc --noEmit --project ${configFile}`, { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    console.log(`✅ TypeScript check passed for Node.js ${majorVersion} (unified config)`);
  } catch (error) {
    console.error(`❌ TypeScript check failed for Node.js ${majorVersion}`);
    process.exit(1);
  }
}

function main() {
  console.log('🔍 Checking Node.js compatibility...\n');
  checkTypeScriptConfig();
  console.log('\n✅ All compatibility checks passed!');
}

if (require.main === module) {
  main();
}

module.exports = { checkTypeScriptConfig, getNodeMajorVersion }; 