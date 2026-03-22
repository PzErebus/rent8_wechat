// pages/personal/personal.js
const app = getApp()
import Toast from 'tdesign-miniprogram/toast/index'

Page({
  /**
   * 页面的初始数据
   */
  data: {
    userInfo: null,
    expireDate: '',
    remainingDays: 0,
    isExpired: false
  },

  onLoad() {
    this.loadUserInfo()
  },

  onShow() {
    // 每次显示页面时检查权限
    app.checkPermission()
    this.loadUserInfo()
  },

  // 加载用户信息
  loadUserInfo() {
    const user = wx.getStorageSync('user')
    if (!user) return

    // 计算到期时间和剩余天数
    let expireDate = ''
    let remainingDays = 0
    let isExpired = false

    if (user.user_type === 'trial') {
      expireDate = user.trial_end_date
      remainingDays = this.calculateRemainingDays(user.trial_end_date)
    } else {
      expireDate = user.formal_end_date
      remainingDays = this.calculateRemainingDays(user.formal_end_date)
    }

    isExpired = remainingDays <= 0

    this.setData({
      userInfo: user,
      expireDate: expireDate,
      remainingDays: remainingDays,
      isExpired: isExpired
    })
  },

  // 计算剩余天数
  calculateRemainingDays(dateStr) {
    if (!dateStr) return 0
    const endDate = new Date(dateStr)
    const today = new Date()
    const diffTime = endDate - today
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  },

  // 跳转"使用说明"页面
  onUseTap() {
    wx.navigateTo({
      url: '/pages/personal/use'
    })
  },

  // 联系客服续费
  onRenewTap() {
    wx.showModal({
      title: '续费咨询',
      content: '请联系客服进行续费\n客服电话：400-888-8888',
      showCancel: true,
      cancelText: '取消',
      confirmText: '拨打',
      success: (res) => {
        if (res.confirm) {
          wx.makePhoneCall({
            phoneNumber: '400-888-8888'
          })
        }
      }
    })
  },

  // 退出登录
  async onExitTap() {
    try {
      // 清除登录数据
      app.clearLoginData()
      this.showToast('退出成功', 'success')
      
      setTimeout(() => {
        wx.redirectTo({
          url: '/pages/login/login'
        })
      }, 1000)
    } catch (error) {
      console.error('退出登录时发生错误', error)
      this.showToast('退出失败', 'error')
    }
  },

  onShareAppMessage: function () {
    return {
      title: 'rent8 - 出租屋管理神器',
      path: '/pages/index/index',
      imageUrl: '/images/rent.png',
    }
  },

  /**
   * 显示Toast提示框
   */
  showToast(message, theme = 'none') {
    Toast({
      context: this,
      selector: '#t-toast',
      message: message,
      theme: theme
    })
  }
})
