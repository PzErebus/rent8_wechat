// app.js
App({
  globalData: {
    // 开发环境使用本地后端
    // 生产环境请修改为你的服务器地址
    apiBaseUrl: 'http://localhost:3000/', 
    userInfo: null
  },

  onLaunch() {
    // 检查登录状态
    this.checkLoginStatus()
  },

  // 检查登录状态
  checkLoginStatus() {
    const token = wx.getStorageSync('Authorization')
    const user = wx.getStorageSync('user')
    
    if (!token || !user) {
      // 未登录，跳转到登录页
      wx.redirectTo({
        url: '/pages/login/login'
      })
      return
    }
    
    // 检查用户是否过期
    if (user.status === 'expired') {
      wx.showModal({
        title: '试用已到期',
        content: '您的试用期已结束，请联系管理员续费',
        showCancel: false,
        success: () => {
          this.clearLoginData()
          wx.redirectTo({ url: '/pages/login/login' })
        }
      })
      return
    }
    
    // 更新全局数据
    this.globalData.userInfo = user
  },

  // 清除登录数据
  clearLoginData() {
    wx.removeStorageSync('Authorization')
    wx.removeStorageSync('user')
    wx.removeStorageSync('temp_openid')
    this.globalData.userInfo = null
  },

  // API请求封装
  async call(obj) {
    const that = this
    return new Promise((resolve, reject) => {
      wx.request({
        url: that.globalData.apiBaseUrl + obj.path,
        method: obj.method || 'GET',
        header: {
          'content-type': 'application/json',
          'Authorization': wx.getStorageSync('Authorization')
        },
        data: obj.data,
        success: function (res) {
          // 处理token过期
          if (res.statusCode === 401) {
            that.clearLoginData()
            wx.showToast({
              title: '登录已过期',
              icon: 'none'
            })
            setTimeout(() => {
              wx.redirectTo({ url: '/pages/login/login' })
            }, 1500)
            return
          }
          
          // 处理权限不足
          if (res.statusCode === 403) {
            wx.showModal({
              title: '权限不足',
              content: res.data.msg || '您的账号已被禁用或已过期',
              showCancel: false
            })
            return
          }
          
          resolve(res.data)
        },
        fail: function (err) {
          wx.showToast({
            title: '网络请求失败',
            icon: 'none'
          })
          reject(err)
        }
      })
    })
  },

  // 检查用户权限（在页面onShow时调用）
  async checkPermission() {
    const user = wx.getStorageSync('user')
    if (!user) {
      wx.redirectTo({ url: '/pages/login/login' })
      return false
    }
    
    if (user.status === 'expired') {
      wx.showModal({
        title: '试用已到期',
        content: '您的试用期已结束，请联系管理员续费',
        showCancel: false,
        success: () => {
          this.clearLoginData()
          wx.redirectTo({ url: '/pages/login/login' })
        }
      })
      return false
    }
    
    if (user.status === 'disabled') {
      wx.showModal({
        title: '账号已禁用',
        content: '您的账号已被禁用，请联系管理员',
        showCancel: false,
        success: () => {
          this.clearLoginData()
          wx.redirectTo({ url: '/pages/login/login' })
        }
      })
      return false
    }
    
    return true
  }
})
