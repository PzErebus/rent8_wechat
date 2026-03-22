// pages/room/add.js
const app = getApp()
const MOCK_MODE = true

Page({
  data: {
    formData: { roomNumber: '', floor: '', area: '', rent: '', description: '' },
    loading: false,
  },

  onLoad() {},

  onInput(e) {
    const field = e.currentTarget.dataset.field
    const value = e.detail.value
    this.setData({ [`formData.${field}`]: value })
  },

  validate() {
    const { formData } = this.data
    if (!formData.roomNumber) {
      wx.showToast({ title: '请输入房间号', icon: 'none' })
      return false
    }
    if (!formData.area || formData.area <= 0) {
      wx.showToast({ title: '请输入有效面积', icon: 'none' })
      return false
    }
    if (!formData.rent || formData.rent <= 0) {
      wx.showToast({ title: '请输入有效租金', icon: 'none' })
      return false
    }
    return true
  },

  submit() {
    if (!this.validate()) return

    // 模拟模式直接成功
    if (MOCK_MODE) {
      wx.showToast({ title: '添加成功', icon: 'success' })
      setTimeout(() => wx.navigateBack(), 1500)
      return
    }

    this.setData({ loading: true })

    app.call({ path: '/room', method: 'POST', data: this.data.formData })
      .then(res => {
        if (res.code === 1) {
          wx.showToast({ title: '添加成功', icon: 'success' })
          setTimeout(() => wx.navigateBack(), 1500)
        } else {
          wx.showToast({ title: res.msg || '添加失败', icon: 'none' })
        }
      })
      .catch(err => {
        console.error('添加房间失败', err)
        wx.showToast({ title: '网络请求失败', icon: 'none' })
      })
      .finally(() => {
        this.setData({ loading: false })
      })
  },
})
