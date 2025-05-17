const fs = require('node:fs');
const path = require('node:path');
const { globSync } = require('glob'); // Используем globSync из glob v9+

const newVersion = process.argv[2];

if (!newVersion) {
  console.error('Error: New version argument not provided.');
  console.error('Usage: node scripts/update-package-versions.js <new-version>');
  process.exit(1);
}

console.log(`Updating packages to version: ${newVersion}`);

const packageFiles = globSync('packages/*/package.json', { absolute: true });
const packageNames = packageFiles.map(file => JSON.parse(fs.readFileSync(file, 'utf8')).name);

packageFiles.forEach(filePath => {
  const packageJson = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const oldVersion = packageJson.version;

  console.log(`Updating ${packageJson.name} from ${oldVersion} to ${newVersion}`);
  packageJson.version = newVersion;

  ['dependencies', 'devDependencies', 'peerDependencies'].forEach(depType => {
    if (packageJson[depType]) {
      Object.keys(packageJson[depType]).forEach(depName => {
        // Обновляем только те зависимости, которые являются частью нашего монорепозитория
        if (packageNames.includes(depName)) {
          const currentDepVersion = packageJson[depType][depName];
          // Сохраняем префикс (например, ^, ~), если он есть, или добавляем ^ по умолчанию
          const prefix = currentDepVersion.match(/^[^\d]*/)?.[0] || '^';
          console.log(`  Updating ${depType}.${depName} from ${currentDepVersion} to ${prefix}${newVersion}`);
          packageJson[depType][depName] = `${prefix}${newVersion}`;
        }
      });
    }
  });

  fs.writeFileSync(filePath, JSON.stringify(packageJson, null, 2) + '\n');
});

console.log('All specified package versions and their inter-dependencies have been updated.'); 