// 尝试使用 npm install，但绕过缓存问题
const { execSync } = require('child_process');
const path = require('path');

const backendDir = path.join(__dirname);

console.log('Starting npm install...');

try {
  // 使用 --ignore-scripts 避免脚本问题
  // 使用 --no-audit 加快速度
  execSync('npm install --no-audit --prefer-online', {
    cwd: backendDir,
    stdio: 'inherit',
    env: { ...process.env, npm_config_cache: '' }
  });
  console.log('npm install completed!');
} catch (error) {
  console.error('npm install failed:', error.message);
  process.exit(1);
}
