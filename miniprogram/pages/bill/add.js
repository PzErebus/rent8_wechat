// pages/bill/add.js
const app = getApp()
const MOCK_MODE = true

Page({
  data: {
    formData: { roomId: '', roomNumber: '', type: 'rent', amount: '', month: '', remark: '' },
    rooms: [],
    billTypes: [
      { value: 'rent', label: '租金' },
      { value: 'electric', label: '电费' },
      { value: 'water', label: '水费' },
      { value: 'property', label: '物业费' },
      { value: 'other', label: '其他' }
    ],
    loading: false
  },

  onLoad() {
    const now = new Date()
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    this.setData({ 'formData.month': month })
    
    if (MOCK_MODE) {
      this.setData({
        rooms: [
          { id: 1, roomNumber: '301', rent: 1500 },
          { id: 2, roomNumber: '302', rent: 1800 },
          { id: 3, roomNumber: '201', rent: 1300 },
          { id: 4, roomNumber: '101', rent: 1200 },
        ]
      })
    }
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field
    this.setData({ [`formData.${field}`]: e.detail.value })
  },

  onRoomChange(e) {
    const index = e.detail.value
    const rooms = this.data.rooms
    if (!rooms || rooms.length === 0) return
    const room = rooms[index]
    if (!room) return
    this.setData({
      'formData.roomId': room.id,
      'formData.roomNumber': room.roomNumber,
      'formData.amount': room.rent || ''
    })
  },

  onTypeChange(e) {
    const index = e.detail.value
    const types = this.data.billTypes
    if (!types || types.length === 0) return
    this.setData({ 'formData.type': types[index]?.value || 'rent' })
  },

  onMonthChange(e) {
    this.setData({ 'formData.month': e.detail.value })
  },

  validate() {
    const { roomId, type, amount, month } = this.data.formData
    if (!roomId) { wx.showToast({ title: '请选择房间', icon: 'none' }); return false }
    if (!amount) { wx.showToast({ title: '请输入金额', icon: 'none' }); return false }
    if (!month) { wx.showToast({ title: '请选择月份', icon: 'none' }); return false }
    return true
  },

  submit() {
    if (!this.validate()) return
    if (MOCK_MODE) {
      wx.showToast({ title: '创建成功', icon: 'success' })
      setTimeout(() => wx.navigateBack(), 1500)
      return
    }
    this.setData({ loading: true })
    app.call({ path: '/bill', method: 'POST', data: this.data.formData })
      .then(res => {
        if (res.code === 1) {
          wx.showToast({ title: '创建成功', icon: 'success' })
          setTimeout(() => wx.navigateBack(), 1500)
        } else {
          wx.showToast({ title: res.msg || '创建失败', icon: 'none' })
        }
      })
      .catch(err => wx.showToast({ title: '网络请求失败', icon: 'none' }))
      .finally(() => this.setData({ loading: false }))
  }
})
