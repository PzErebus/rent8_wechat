/**
 * API 请求工具
 * 与现有的 app.call() 方式兼容
 */

const app = getApp();

/**
 * 发送请求
 * @param {Object} options 请求配置
 * @param {string} options.url API 路径
 * @param {string} options.method 请求方法
 * @param {Object} options.data 请求数据
 */
function request(options) {
  return app.call({
    path: options.url,
    method: options.method || 'GET',
    data: options.data || {},
  });
}

module.exports = {
  request,
  get: (url, data) => request({ url, method: 'GET', data }),
  post: (url, data) => request({ url, method: 'POST', data }),
  put: (url, data) => request({ url, method: 'PUT', data }),
  delete: (url, data) => request({ url, method: 'DELETE', data }),
};
