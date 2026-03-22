const ci = require('miniprogram-ci');
const path = require('path');

(async () => {
  try {
    // 创建项目对象
    const project = new ci.Project({
      appid: 'wx1234567890abcdef', // 测试用的 AppID
      type: 'miniProgram',
      projectPath: path.resolve(__dirname, 'miniprogram'),
      privateKeyPath: '', // 不需要上传，所以不需要私钥
      ignores: ['node_modules/**/*'],
    });

    // 预览（生成二维码）
    console.log('正在生成预览二维码...');
    const previewResult = await ci.preview({
      project,
      desc: 'rent8 出租屋管理系统预览',
      setting: {
        es6: true,
        minified: true,
        urlCheck: false, // 不校验合法域名
      },
      qrcodeFormat: 'terminal', // 在终端显示二维码
      qrcodeOutputDest: path.resolve(__dirname, 'preview-qrcode.png'),
      pagePath: 'pages/index/index',
      searchQuery: '',
      scene: 1001,
    });

    console.log('预览成功！');
    console.log('二维码已保存到:', path.resolve(__dirname, 'preview-qrcode.png'));
  } catch (error) {
    console.error('预览失败:', error.message);
    console.log('\n注意：预览功能需要有效的微信小程序 AppID 和私钥。');
    console.log('请前往 https://mp.weixin.qq.com 注册小程序获取 AppID。');
  }
})();
