const fs = require('fs');
const path = require('path');

const sourcePath = path.resolve(__dirname, '../README.md');
const destPath = path.resolve(__dirname, '../packages/router/README.md');

console.log(`Copying ${sourcePath} to ${destPath}`);

try {
  fs.copyFileSync(sourcePath, destPath);
  console.log('README.md copied successfully to packages/router/');
} catch (err) {
  console.error('Error copying README.md:', err);
  process.exit(1);
} 