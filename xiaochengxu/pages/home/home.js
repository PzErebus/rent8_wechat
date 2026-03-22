// pages/home/home.js
const app = getApp()
const MOCK_MODE = true

Page({
  data: {
    userInfo: {},
    currentDate: '',
    greeting: '',
    stats: {
      totalRooms: 0,
      vacantRooms: 0,
      rentedRooms: 0,
      monthIncome: 0
    },
    activities: []
  },

  onLoad() {
    this.initData()
  },

  onShow() {
    this.loadData()
  },

  initData() {
    const now = new Date()
    const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    
    let greeting = '早上好'
    const hour = now.getHours()
    if (hour >= 12 && hour < 18) greeting = '下午好'
    else if (hour >= 18) greeting = '晚上好'

    this.setData({
      currentDate: date,
      greeting: greeting
    })
  },

  loadData() {
    if (MOCK_MODE) {
      this.loadMockData()
    } else {
      this.fetchStats()
    }
  },

  loadMockData() {
    const mockUser = {
      nickname: '房东用户',
      avatar: ''
    }
    
    const mockStats = {
      totalRooms: 12,
      vacantRooms: 3,
      rentedRooms: 9,
      monthIncome: 28500
    }
    
    const mockActivities = [
      { id: 1, type: 'rent', content: '301房间租客张三已缴费 ¥1500', time: '2小时前' },
      { id: 2, type: 'bill', content: '新建账单：202房间 2月电费 ¥280', time: '5小时前' },
      { id: 3, type: 'tenant', content: '新租客李四入住 302房间', time: '昨天' },
      { id: 4, type: 'room', content: '添加新房间：501', time: '昨天' },
    ]

    this.setData({
      userInfo: mockUser,
      stats: mockStats,
      activities: mockActivities
    })
  },

  async fetchStats() {
    try {
      const [roomRes, billRes] = await Promise.all([
        app.call({ path: '/room/stats', method: 'GET' }),
        app.call({ path: '/bill/stats', method: 'GET' })
      ])
      
      if (roomRes.code === 1) {
        this.setData({ stats: roomRes.data })
      }
    } catch (err) {
      console.error('获取数据失败', err)
    }
  },

  // 跳转功能
  goRoom() {
    wx.navigateTo({ url: '/pages/room/room' })
  },
  
  goBill() {
    wx.navigateTo({ url: '/pages/billlist/billlist' })
  },
  
  goTenant() {
    wx.navigateTo({ url: '/pages/tenant/tenant' })
  },
  
  goStats() {
    wx.navigateTo({ url: '/pages/stats/stats' })
  },

  goAddRoom() {
    wx.navigateTo({ url: '/pages/room/add' })
  },

  goAddBill() {
    wx.navigateTo({ url: '/pages/bill/add' })
  },

  goAddTenant() {
    wx.navigateTo({ url: '/pages/tenant/add' })
  },

  goNotification() {
    wx.showToast({ title: '消息功能即将上线', icon: 'none' })
  },

  goActivity() {
    wx.showToast({ title: '动态功能即将上线', icon: 'none' })
  }
})
