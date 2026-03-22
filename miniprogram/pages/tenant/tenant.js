// pages/tenant/tenant.js
const app = getApp()
const MOCK_MODE = true

const MOCK_DATA = [
  { id: 1, name: '张三', phone: '13800138001', roomNumber: '301', checkInDate: '2026-01-01', rent: 1500, deposit: 3000, status: 'active' },
  { id: 2, name: '李四', phone: '13800138002', roomNumber: '201', checkInDate: '2026-02-15', rent: 1300, deposit: 2600, status: 'active' },
  { id: 3, name: '王五', phone: '13800138003', roomNumber: '101', checkInDate: '2025-11-20', rent: 1200, deposit: 2400, status: 'active' },
  { id: 4, name: '赵六', phone: '13800138004', roomNumber: '302', checkInDate: '2025-12-01', rent: 1800, deposit: 3600, status: 'active' },
]

Page({
  data: {
    tenants: [],
    loading: false,
    page: 1,
    pageSize: 10,
    hasMore: true,
    keyword: '',
    stats: { total: 0, active: 0 }
  },

  onLoad() {
    if (MOCK_MODE) {
      this.loadMockData()
    } else {
      this.fetchTenants()
    }
  },

  onShow() {
    this.setData({ page: 1, tenants: [], hasMore: true })
    if (MOCK_MODE) {
      this.loadMockData()
    } else {
      this.fetchTenants()
    }
  },

  loadMockData() {
    this.setData({
      tenants: MOCK_DATA,
      stats: { total: MOCK_DATA.length, active: MOCK_DATA.length },
      hasMore: false
    })
  },

  async fetchTenants() {
    if (this.data.loading || !this.data.hasMore) return
    this.setData({ loading: true })

    try {
      const res = await app.call({
        path: '/tenant',
        method: 'GET',
        data: { page: this.data.page, pageSize: this.data.pageSize, keyword: this.data.keyword }
      })

      if (res.code === 1) {
        const newTenants = res.data.list || []
        this.setData({
          tenants: this.data.page === 1 ? newTenants : [...this.data.tenants, ...newTenants],
          hasMore: newTenants.length >= this.data.pageSize,
          page: this.data.page + 1
        })
      }
    } catch (err) {
      console.error('获取租客列表失败', err)
    } finally {
      this.setData({ loading: false })
    }
  },

  onSearch(e) {
    const keyword = e.detail.value || ''
    this.setData({ keyword: keyword, page: 1, tenants: [], hasMore: true })
    if (MOCK_MODE) {
      if (!keyword) {
        this.setData({ tenants: MOCK_DATA })
      } else {
        const lowerKeyword = keyword.toLowerCase()
        const filtered = MOCK_DATA.filter(t => 
          (t.name && t.name.toLowerCase().includes(lowerKeyword)) || 
          (t.phone && t.phone.includes(keyword)) ||
          (t.roomNumber && t.roomNumber.includes(keyword))
        )
        this.setData({ tenants: filtered })
      }
    } else {
      this.fetchTenants()
    }
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/tenant/detail?id=${id}` })
  },

  goAdd() {
    wx.navigateTo({ url: '/pages/tenant/add' })
  },

  onReachBottom() {
    if (!MOCK_MODE && this.data.hasMore) {
      this.fetchTenants()
    }
  },

  onPullDownRefresh() {
    this.setData({ page: 1, tenants: [], hasMore: true })
    if (MOCK_MODE) {
      this.loadMockData()
      wx.stopPullDownRefresh()
    } else {
      this.fetchTenants().then(() => wx.stopPullDownRefresh())
    }
  }
})
