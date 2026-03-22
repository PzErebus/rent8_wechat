// pages/login/login.js
const app = getApp()
import Toast from 'tdesign-miniprogram/toast/index'

// 模拟登录模式 - 设为 true 可以跳过后端直接登录
const MOCK_LOGIN = true

Page({
  data: {
    overlay: false
  },

  onLoad() {
    // 检查是否已登录
    const token = wx.getStorageSync('Authorization')
    if (token) {
      wx.switchTab({ url: '/pages/home/home' })
    }
  },

  // 模拟登录（用于预览）
  mockLogin() {
    const mockUser = {
      id: 1,
      nickname: '房东用户',
      phone: '13800138000',
      user_type: 'formal',
      status: 'active',
      token: 'mock_token_12345'
    }
    wx.setStorageSync('user', mockUser)
    wx.setStorageSync('Authorization', mockUser.token)
    wx.switchTab({ url: '/pages/home/home' })
  },

  // 微信登录
  async onLoginTap() {
    // 模拟模式直接登录
    if (MOCK_LOGIN) {
      this.mockLogin()
      return
    }

    try {
      this.setData({ overlay: true })
      
      // 获取微信登录凭证
      const loginRes = await wx.login()
      
      // 调用后端登录接口
      const res = await app.call({
        path: 'api/landlord/login',
        method: 'POST',
        data: { 
          code: loginRes.code
        }
      });
      
      this.setData({ overlay: false });

      if (res.code === 1) {
        // 新用户需要授权获取手机号
        if (res.data.is_new) {
          wx.setStorageSync('temp_openid', res.data.openid)
          this.showToast('请授权获取手机号完成注册', 'success')
          return
        }
        
        // 检查用户状态
        if (res.data.status === 'expired') {
          this.showToast('您的试用已过期，请联系管理员续费', 'warning')
          return
        }
        
        if (res.data.status === 'disabled') {
          this.showToast('您的账号已被禁用，请联系管理员', 'error')
          return
        }
        
        // 保存登录信息
        wx.setStorageSync('user', res.data)
        wx.setStorageSync('Authorization', res.data.token)
        
        this.showToast('登录成功', 'success')
        wx.switchTab({ url: '/pages/home/home' })
      } else {
        this.showToast(res.msg || '登录失败', 'warning')
      }
    } catch (err) {
      console.error('登录发生错误:', err);
      this.setData({ overlay: false });
      this.showToast('登录失败，请重试', 'error')
    }
  },

  // 获取手机号回调
  async onGetPhoneNumber(e) {
    // 模拟模式直接注册
    if (MOCK_LOGIN) {
      this.mockLogin()
      return
    }

    if (e.detail.errMsg !== 'getPhoneNumber:ok') {
      this.showToast('请授权手机号完成注册', 'warning')
      return
    }
    
    try {
      this.setData({ overlay: true })
      
      const openid = wx.getStorageSync('temp_openid')
      const res = await app.call({
        path: 'api/landlord/register',
        method: 'POST',
        data: {
          openid: openid,
          encryptedData: e.detail.encryptedData,
          iv: e.detail.iv
        }
      })
      
      this.setData({ overlay: false })
      
      if (res.code === 1) {
        wx.removeStorageSync('temp_openid')
        wx.setStorageSync('user', res.data)
        wx.setStorageSync('Authorization', res.data.token)
        
        this.showToast('注册成功', 'success')
        wx.switchTab({ url: '/pages/home/home' })
      } else {
        this.showToast(res.msg || '注册失败', 'error')
      }
    } catch (err) {
      console.error('注册失败:', err)
      this.setData({ overlay: false })
      this.showToast('注册失败，请重试', 'error')
    }
  },

  showToast(message, theme = 'none') {
    Toast({
      context: this,
      selector: '#t-toast',
      message: message,
      theme: theme
    });
  }
})
