const { execSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const { globSync } = require('glob');

console.log('🚀 Publishing packages to npm...');

const packageFiles = globSync('packages/*/package.json', { absolute: true });

packageFiles.forEach(filePath => {
  const packageDir = path.dirname(filePath);
  const packageJson = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  
  console.log(`\n📦 Publishing ${packageJson.name}@${packageJson.version}...`);
  
  try {
    // Переходим в директорию пакета и публикуем
    process.chdir(packageDir);
    
    // Проверяем наличие NPM_TOKEN в CI окружении
    if (process.env.CI && !process.env.NODE_AUTH_TOKEN && !process.env.NPM_TOKEN) {
      console.warn('⚠️  Warning: No NPM_TOKEN or NODE_AUTH_TOKEN found in CI environment');
    }
    
    execSync('npm publish --access public', { 
      stdio: 'inherit',
      env: {
        ...process.env,
        // NODE_AUTH_TOKEN имеет приоритет в GitHub Actions
        NPM_TOKEN: process.env.NODE_AUTH_TOKEN || process.env.NPM_TOKEN
      }
    });
    console.log(`✅ Successfully published ${packageJson.name}@${packageJson.version}`);
  } catch (error) {
    console.error(`❌ Failed to publish ${packageJson.name}:`, error.message);
    process.exit(1);
  }
});

console.log('\n🎉 All packages published successfully!'); 