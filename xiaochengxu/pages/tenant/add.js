// pages/tenant/add.js
const app = getApp()
const MOCK_MODE = true

Page({
  data: {
    formData: {
      name: '',
      phone: '',
      idCard: '',
      roomId: '',
      roomNumber: '',
      rent: '',
      deposit: '',
      checkInDate: '',
      remark: ''
    },
    rooms: [],
    loading: false
  },

  onLoad() {
    if (MOCK_MODE) {
      this.setData({
        rooms: [
          { id: 1, roomNumber: '301' },
          { id: 2, roomNumber: '302' },
          { id: 3, roomNumber: '201' },
          { id: 4, roomNumber: '101' },
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
      'formData.roomNumber': room.roomNumber
    })
  },

  onDateChange(e) {
    this.setData({ [`formData.checkInDate`]: e.detail.value })
  },

  validate() {
    const { name, phone, roomId, rent } = this.data.formData
    if (!name) { wx.showToast({ title: '请输入姓名', icon: 'none' }); return false }
    if (!phone) { wx.showToast({ title: '请输入电话', icon: 'none' }); return false }
    if (!roomId) { wx.showToast({ title: '请选择房间', icon: 'none' }); return false }
    if (!rent) { wx.showToast({ title: '请输入租金', icon: 'none' }); return false }
    return true
  },

  submit() {
    if (!this.validate()) return

    if (MOCK_MODE) {
      wx.showToast({ title: '添加成功', icon: 'success' })
      setTimeout(() => wx.navigateBack(), 1500)
      return
    }

    this.setData({ loading: true })
    app.call({ path: '/tenant', method: 'POST', data: this.data.formData })
      .then(res => {
        if (res.code === 1) {
          wx.showToast({ title: '添加成功', icon: 'success' })
          setTimeout(() => wx.navigateBack(), 1500)
        } else {
          wx.showToast({ title: res.msg || '添加失败', icon: 'none' })
        }
      })
      .catch(err => wx.showToast({ title: '网络请求失败', icon: 'none' }))
      .finally(() => this.setData({ loading: false }))
  }
})
