// pages/index/index.js
const app = getApp()

// 模拟数据开关 - 设为 true 可以在没有后端时预览 UI
const MOCK_MODE = true

Page({
  data: {
    userInfo: null,
    expireDate: '',
    remainingDays: 0,
    isExpired: false,
    list: [
      {
        name: '房屋管理',
        icon: 'houses-2',
        childArr: [
          { name: '房间管理(新)', label: '', url: '/pages/room/room' },
          { name: '房间管理', label: '', url: '/pages/number/number' },
        ],
      },
      {
        name: '账单管理',
        icon: 'bill',
        childArr: [
          { name: '账单列表(新)', label: '', url: '/pages/billlist/billlist' },
          { name: '未收账单', label: '', url: '/pages/bill/bill' },
        ],
      },
      {
        name: '租客管理',
        icon: 'user',
        childArr: [
          { name: '租客列表', label: '即将上线', url: '' },
        ],
      },
      {
        name: '数据统计',
        icon: 'chart',
        childArr: [
          { name: '经营统计', label: '即将上线', url: '' },
        ],
      }
    ]
  },

  onLoad() {
    if (MOCK_MODE) {
      // 模拟模式 - 直接加载模拟数据
      this.loadMockData()
    } else {
      // 正常模式 - 检查登录
      const token = wx.getStorageSync('Authorization')
      if (!token) {
        wx.redirectTo({ url: '/pages/login/login' })
        return
      }
      this.loadUserInfo()
    }
  },

  onShow() {
    if (!MOCK_MODE) {
      const hasPermission = app.checkPermission()
      if (hasPermission) {
        this.loadUserInfo()
      }
    }
  },

  // 加载模拟数据（用于预览）
  loadMockData() {
    const mockUser = {
      nickname: '房东用户',
      user_type: 'formal',
      avatar: '/images/rent.png'
    }
    this.setData({
      userInfo: mockUser,
      expireDate: '2027-12-31',
      remainingDays: 365,
      isExpired: false
    })
  },

  // 加载用户信息
  loadUserInfo() {
    const user = wx.getStorageSync('user')
    if (!user) return

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

  // 页面跳转
  clickHandle(event) {
    const item = event.detail.item
    
    if (!item || !item.url) {
      if (item && item.label === '即将上线') {
        wx.showToast({ title: '功能即将上线', icon: 'none' })
      }
      return
    }

    if (this.data.isExpired && !MOCK_MODE) {
      wx.showModal({
        title: '试用已到期',
        content: '您的试用期已结束，请联系管理员续费',
        showCancel: false
      })
      return
    }

    wx.navigateTo({
      url: item.url
    }).catch((error) => {
      console.error('页面跳转失败：', error)
    })
  },

  // 续费提醒
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
  }
})
