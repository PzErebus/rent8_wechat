const ci = require('miniprogram-ci');
const path = require('path');

(async () => {
  const projectPath = path.resolve(__dirname, 'miniprogram');

  try {
    // 执行 npm 构建
    console.log('开始构建 npm...');
    const warning = await ci.packNpmManually({
      packageJsonPath: path.resolve(__dirname, 'package.json'),
      miniprogramNpmDistDir: projectPath,
    });
    console.log('npm 构建完成:', warning);
  } catch (error) {
    console.error('构建失败:', error);
    process.exit(1);
  }
})();
