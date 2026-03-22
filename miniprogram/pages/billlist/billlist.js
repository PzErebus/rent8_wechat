// pages/billlist/billlist.js
const app = getApp()

// 模拟数据模式
const MOCK_MODE = true

// 模拟数据
const MOCK_DATA = {
  list: [
    { id: 1, roomNumber: '301', type: 'rent', amount: 1500, month: '2026-03', status: 'paid', paidAt: '2026-03-05' },
    { id: 2, roomNumber: '301', type: 'electric', amount: 280, month: '2026-02', status: 'paid', paidAt: '2026-02-28' },
    { id: 3, roomNumber: '201', type: 'rent', amount: 1300, month: '2026-03', status: 'unpaid' },
    { id: 4, roomNumber: '101', type: 'rent', amount: 1200, month: '2026-03', status: 'paid', paidAt: '2026-03-01' },
    { id: 5, roomNumber: '101', type: 'water', amount: 50, month: '2026-02', status: 'paid', paidAt: '2026-02-25' },
    { id: 6, roomNumber: '302', type: 'rent', amount: 1800, month: '2026-03', status: 'unpaid' },
  ],
  stats: { unpaidAmount: 3100, paidAmount: 4230, totalCount: 6 }
}

Page({
  data: {
    bills: [],
    stats: { unpaidAmount: 0, paidAmount: 0, totalCount: 0 },
    loading: false,
    page: 1,
    pageSize: 10,
    hasMore: true,
    month: '',
    status: '',
    months: [],
    currentMonth: '',
  },

  onLoad() {
    this.initMonths()
    const currentMonth = this.data.months[0] || ''
    this.setData({ currentMonth })
    
    if (MOCK_MODE) {
      this.loadMockData()
    } else {
      this.fetchBills()
      this.fetchStats()
    }
  },

  onShow() {
    this.setData({ page: 1, bills: [], hasMore: true })
    if (MOCK_MODE) {
      this.loadMockData()
    } else {
      this.fetchBills()
    }
  },

  initMonths() {
    const months = []
    const now = new Date()
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      months.push(month)
    }
    this.setData({ months, month: months[0] })
  },

  // 加载模拟数据
  loadMockData() {
    const filtered = this.data.status 
      ? MOCK_DATA.list.filter(b => b.status === this.data.status)
      : MOCK_DATA.list
    
    this.setData({
      bills: filtered,
      stats: MOCK_DATA.stats,
      hasMore: false
    })
  },

  async fetchBills() {
    if (this.data.loading || !this.data.hasMore) return
    this.setData({ loading: true })

    try {
      const res = await app.call({
        path: '/bill',
        method: 'GET',
        data: { page: this.data.page, pageSize: this.data.pageSize, month: this.data.currentMonth, status: this.data.status },
      })

      if (res.code === 1) {
        const newBills = res.data.list || []
        this.setData({
          bills: this.data.page === 1 ? newBills : [...this.data.bills, ...newBills],
          hasMore: newBills.length >= this.data.pageSize,
          page: this.data.page + 1,
        })
      } else {
        wx.showToast({ title: res.msg || '加载失败', icon: 'none' })
      }
    } catch (err) {
      console.error('获取账单列表失败', err)
      wx.showToast({ title: '网络请求失败', icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  },

  async fetchStats() {
    try {
      const res = await app.call({ path: '/bill/stats', method: 'GET', data: { month: this.data.currentMonth } })
      if (res.code === 1) {
        this.setData({ stats: res.data })
      }
    } catch (err) {
      console.error('获取统计失败', err)
    }
  },

  onMonthChange(e) {
    const index = e.detail.value
    const month = this.data.months[index]
    this.setData({ currentMonth: month, page: 1, bills: [], hasMore: true })
    if (MOCK_MODE) {
      this.loadMockData()
    } else {
      this.fetchBills()
      this.fetchStats()
    }
  },

  onStatusChange(e) {
    const status = e.currentTarget.dataset.status
    this.setData({ status, page: 1, bills: [], hasMore: true })
    if (MOCK_MODE) {
      this.loadMockData()
    } else {
      this.fetchBills()
    }
  },

  onReachBottom() {
    if (!MOCK_MODE && this.data.hasMore) {
      this.fetchBills()
    }
  },

  goAdd() {
    wx.navigateTo({ url: '/pages/bill/add' })
  },

  goDetail(e) {
    wx.navigateTo({ url: `/pages/bill/detail?id=${e.currentTarget.dataset.id}` })
  },

  onPullDownRefresh() {
    this.setData({ page: 1, bills: [], hasMore: true })
    if (MOCK_MODE) {
      this.loadMockData()
      wx.stopPullDownRefresh()
    } else {
      Promise.all([this.fetchBills(), this.fetchStats()]).then(() => {
        wx.stopPullDownRefresh()
      })
    }
  },
})
