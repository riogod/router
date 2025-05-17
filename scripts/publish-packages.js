const fs = require('node:fs');
const path = require('node:path');
const { execSync } = require('node:child_process');
const { globSync } = require('glob');

console.log('Starting publication of packages...');

const packageFiles = globSync('packages/*/package.json', { absolute: true });

packageFiles.forEach(filePath => {
  const packageJsonPath = path.resolve(filePath);
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const packageName = packageJson.name;
  const packageDir = path.dirname(filePath);

  if (packageJson.private) {
    console.log(`Skipping private package: ${packageName}`);
    return;
  }

  console.log(`Publishing ${packageName} from ${packageDir}...`);
  try {
    // NPM_TOKEN должен быть установлен в окружении CI
    // Флаг --access public берется из publishConfig в package.json каждого пакета
    // Если его там нет, npm cli может потребовать этот флаг для скоуп-пакетов
    execSync('npm publish', { cwd: packageDir, stdio: 'inherit' });
    console.log(`Successfully published ${packageName}`);
  } catch (error) {
    console.error(`Failed to publish ${packageName}:`, error.message);
    // Можно добавить process.exit(1) если нужно прервать при ошибке публикации одного пакета
  }
});

console.log('All specified packages have been processed for publishing.'); 