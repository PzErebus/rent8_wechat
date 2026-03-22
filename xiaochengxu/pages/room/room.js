// pages/room/room.js
const app = getApp()

// 模拟数据模式
const MOCK_MODE = true

// 模拟数据
const MOCK_DATA = {
  list: [
    { id: 1, roomNumber: '301', floor: 3, area: 45, rent: 1500, status: 'rented', tenantCount: 1 },
    { id: 2, roomNumber: '302', floor: 3, area: 50, rent: 1800, status: 'available', tenantCount: 0 },
    { id: 3, roomNumber: '201', floor: 2, area: 40, rent: 1300, status: 'rented', tenantCount: 1 },
    { id: 4, roomNumber: '202', floor: 2, area: 42, rent: 1400, status: 'available', tenantCount: 0 },
    { id: 5, roomNumber: '101', floor: 1, area: 35, rent: 1200, status: 'rented', tenantCount: 2 },
    { id: 6, roomNumber: '102', floor: 1, area: 38, rent: 1250, status: 'available', tenantCount: 0 },
  ],
  stats: {
    total: 6,
    vacant: 3,
    occupied: 3,
    monthIncome: 14500
  }
}

Page({
  data: {
    rooms: [],
    stats: { total: 0, vacant: 0, occupied: 0, monthIncome: 0 },
    loading: false,
    page: 1,
    pageSize: 10,
    hasMore: true,
    status: '',
  },

  onLoad() {
    if (MOCK_MODE) {
      this.loadMockData()
    } else {
      this.fetchRooms()
      this.fetchStats()
    }
  },

  onShow() {
    this.setData({ page: 1, rooms: [], hasMore: true })
    if (MOCK_MODE) {
      this.loadMockData()
    } else {
      this.fetchRooms()
    }
  },

  // 加载模拟数据
  loadMockData() {
    this.setData({
      rooms: MOCK_DATA.list,
      stats: MOCK_DATA.stats,
      hasMore: false
    })
  },

  // 获取房间列表
  async fetchRooms() {
    if (this.data.loading || !this.data.hasMore) return
    this.setData({ loading: true })

    try {
      const res = await app.call({
        path: '/room',
        method: 'GET',
        data: { page: this.data.page, pageSize: this.data.pageSize, status: this.data.status },
      })

      if (res.code === 1) {
        const newRooms = res.data.list || []
        this.setData({
          rooms: this.data.page === 1 ? newRooms : [...this.data.rooms, ...newRooms],
          hasMore: newRooms.length >= this.data.pageSize,
          page: this.data.page + 1,
        })
      } else {
        wx.showToast({ title: res.msg || '加载失败', icon: 'none' })
      }
    } catch (err) {
      console.error('获取房间列表失败', err)
      wx.showToast({ title: '网络请求失败', icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  },

  // 获取统计数据
  async fetchStats() {
    try {
      const res = await app.call({ path: '/room/stats', method: 'GET' })
      if (res.code === 1) {
        this.setData({ stats: res.data })
      }
    } catch (err) {
      console.error('获取统计失败', err)
    }
  },

  // 筛选状态
  onFilterChange(e) {
    const status = e.currentTarget.dataset.status
    this.setData({ status, page: 1, rooms: [], hasMore: true })
    if (MOCK_MODE) {
      const filtered = status 
        ? MOCK_DATA.list.filter(r => r.status === status)
        : MOCK_DATA.list
      this.setData({ rooms: filtered })
    } else {
      this.fetchRooms()
    }
  },

  // 上拉加载
  onReachBottom() {
    if (!MOCK_MODE && this.data.hasMore) {
      this.fetchRooms()
    }
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.setData({ page: 1, rooms: [], hasMore: true })
    if (MOCK_MODE) {
      this.loadMockData()
      wx.stopPullDownRefresh()
    } else {
      Promise.all([this.fetchRooms(), this.fetchStats()]).then(() => {
        wx.stopPullDownRefresh()
      })
    }
  },

  // 跳转添加房间
  goAdd() {
    wx.navigateTo({ url: '/pages/room/add' })
  },

  // 跳转房间详情
  goDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/room/detail?id=${id}` })
  },
})
