// pages/room/detail.js
const app = getApp()

// 模拟数据模式
const MOCK_MODE = true

// 模拟数据
const MOCK_ROOM = {
  id: 1,
  roomNumber: '301',
  address: 'xx小区xx栋',
  area: 45,
  rent: 1500,
  deposit: 3000,
  status: 'rented',
  description: '精装套间，南北通透',
  currentTenant: {
    name: '张三',
    phone: '13800138000',
    checkInAt: '2026-01-01'
  },
  recentBills: [
    { id: 1, type: 'rent', amount: 1500, status: 'paid', periodStart: '2026-03-01', periodEnd: '2026-03-31' },
    { id: 2, type: 'electric', amount: 280, status: 'unpaid', periodStart: '2026-02-01', periodEnd: '2026-02-28' }
  ]
}

Page({
  data: {
    id: null,
    room: null,
    loading: true,
    editing: false,
    formData: {},
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ id: options.id })
      if (MOCK_MODE) {
        this.loadMockData()
      } else {
        this.fetchDetail()
      }
    }
  },

  loadMockData() {
    this.setData({
      room: MOCK_ROOM,
      formData: {
        roomNumber: MOCK_ROOM.roomNumber,
        area: MOCK_ROOM.area,
        rent: MOCK_ROOM.rent,
        status: MOCK_ROOM.status,
      },
      loading: false
    })
  },

  async fetchDetail() {
    try {
      const res = await app.call({ path: `/room/${this.data.id}`, method: 'GET' })
      if (res.code === 1) {
        this.setData({
          room: res.data,
          formData: { roomNumber: res.data.roomNumber, area: res.data.area, rent: res.data.rent, status: res.data.status }
        })
      } else {
        wx.showToast({ title: res.msg || '加载失败', icon: 'none' })
      }
    } catch (err) {
      console.error('获取房间详情失败', err)
      wx.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field
    this.setData({ [`formData.${field}`]: e.detail.value })
  },

  toggleEdit() {
    this.setData({ editing: !this.data.editing })
  },

  async save() {
    wx.showLoading({ title: '保存中...' })
    try {
      const res = await app.call({ path: `/room/${this.data.id}`, method: 'PUT', data: this.data.formData })
      if (res.code === 1) {
        wx.showToast({ title: '保存成功', icon: 'success' })
        this.setData({ editing: false })
        if (!MOCK_MODE) this.fetchDetail()
      } else {
        wx.showToast({ title: res.msg || '保存失败', icon: 'none' })
      }
    } catch (err) {
      console.error('保存失败', err)
      wx.showToast({ title: '网络请求失败', icon: 'none' })
    } finally {
      wx.hideLoading()
    }
  },

  delete() {
    wx.showModal({
      title: '确认删除',
      content: '确定要删除该房间吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            const result = await app.call({ path: `/room/${this.data.id}`, method: 'DELETE' })
            if (result.code === 1) {
              wx.showToast({ title: '删除成功', icon: 'success' })
              setTimeout(() => wx.navigateBack(), 1500)
            } else {
              wx.showToast({ title: result.msg || '删除失败', icon: 'none' })
            }
          } catch (err) {
            wx.showToast({ title: '网络请求失败', icon: 'none' })
          }
        }
      }
    })
  },
})
