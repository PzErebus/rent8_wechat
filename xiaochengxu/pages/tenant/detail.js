// pages/tenant/detail.js
const app = getApp()
const MOCK_MODE = true

const MOCK_DETAIL = {
  id: 1,
  name: '张三',
  phone: '13800138001',
  idCard: '110101199001011234',
  roomNumber: '301',
  rent: 1500,
  deposit: 3000,
  checkInDate: '2026-01-01',
  remark: '租客良好，按时缴费',
  status: 'active',
  paidBills: 3,
  unpaidBills: 0
}

Page({
  data: {
    tenant: null,
    loading: true,
    editing: false,
    formData: {}
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
    this.setData({ tenant: MOCK_DETAIL, formData: { ...MOCK_DETAIL }, loading: false })
  },

  async fetchDetail() {
    try {
      const res = await app.call({ path: `/tenant/${this.data.id}`, method: 'GET' })
      if (res.code === 1) {
        this.setData({ tenant: res.data, formData: res.data })
      }
    } catch (err) {
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
      const res = await app.call({ path: `/tenant/${this.data.id}`, method: 'PUT', data: this.data.formData })
      if (res.code === 1) {
        wx.showToast({ title: '保存成功', icon: 'success' })
        this.setData({ editing: false })
        if (!MOCK_MODE) this.fetchDetail()
      } else {
        wx.showToast({ title: res.msg || '保存失败', icon: 'none' })
      }
    } catch (err) {
      wx.showToast({ title: '网络请求失败', icon: 'none' })
    } finally {
      wx.hideLoading()
    }
  },

  callPhone() {
    if (this.data.tenant?.phone) {
      wx.makePhoneCall({ phoneNumber: this.data.tenant.phone })
    }
  },

  checkout() {
    wx.showModal({
      title: '确认退房',
      content: '确定要为该租客办理退房吗？',
      success: (res) => {
        if (res.confirm) {
          wx.showToast({ title: '退房成功', icon: 'success' })
          setTimeout(() => wx.navigateBack(), 1500)
        }
      }
    })
  }
})
