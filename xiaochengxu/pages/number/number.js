const app = getApp()
const dayjs = require('dayjs');
import { propertyQueryAll, propertySort, numberCheckout, numberQuery, numberCheckin } from '../../utils/conf'
import Toast from 'tdesign-miniprogram/toast/index';

Page({

  /**
   * 页面的初始数据
   */
  data: {
    isLoading: false,
    houses: [{ label: '选择房产', value: 0 }],
    house_id: 0,
    house_name: '',
    // 退房对话框
    confirmBtn: { content: '确定', variant: 'base' },
    showConfirm: false,
    // 日期选择框
    dateVisible: false,
    date: new Date().toLocaleDateString(), // 支持时间戳传入
    leave_time: '',
    leave_id: 0,
    list: [],
    username: '',
    title: '',
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onShow: function () {
    this.queryHouse();
    this.query();
    wx.getStorage({
      key: 'user',
      success: (res) => {
        this.setData({
          username: res.data.name,
        });
      }
    });
  },

  async queryHouse() {
    try {
      const res = await app.call({
        path: propertyQueryAll,
        method: 'GET',
      });
      if (res.code === 1) {
        let houseArr = res.data;
        let house_id = 0;
        for (let element of res.data) {
          if (element.firstly === 'Y') {
            house_id = element.value;
            break;
          }
        }
        this.setData({
          houses: houseArr,
          house_id: house_id
        }, () => {
          this.setHouseName();
        });
      }
    } catch (error) {
      // 假设这里使用showToast显示错误
      console.error('查询房产失败:', error);
    }
  },

  setHouseName() {
    const houses = this.data.houses;
    for (let element of houses) {
      if (element.id === this.data.house_id) {
        this.setData({ house_name: element.name });
        break; // 找到匹配项后退出循环，避免不必要的遍历
      }
    }
  },

  async query() {
    this.setData({ isLoading: true, list: [] });
    try {
      const res = await app.call({
        path: numberQuery,
        method: 'GET',
      });
      if (res.code === 1) {
        const now = dayjs(); // 获取当前时间
        this.setData({
          list: res.data,
          leave_time: now.format('YYYY-MM-DD'),
        });
      }
    } catch (error) {
      // 假设这里使用showToast显示错误
      console.error('number页面出错:', error);
    }
    this.setData({ isLoading: false });
  },

  // 房产变更
  async houseChange(e) {
    this.setData({
      house_id: e.detail.value
    });
    this.setHouseName();
    try {
      const res = await app.call({
        path: propertySort,
        method: 'POST',
        data: { id: e.detail.value }
      });
      this.query();
      this.queryHouse();
    } catch (error) {
      // 假设这里使用showToast显示错误
      console.error('房产排序失败:', error);
    }
  },

  // 修改房间
  onModifyTap(e) {
    let { index } = e.currentTarget.dataset
    // console.log(this.data.list[index].id)
    let { id, property_name } = this.data.list[index];
    wx.navigateTo({
      url: '/pages/number/modify?id=' + id + '&house_name=' + property_name,
    })
  },

  // 入住
  async onRentalTap() {
    try {
      const res = await app.call({
        path: numberCheckin,
        method: 'POST',
        data: { house_number_id: this.data.leave_id, checkin_time: this.data.leave_time, house_property_id: this.data.house_id }
      });
      this.setData({
        showConfirm: false,
      });
      const icon = res.code === 1 ? 'success' : 'warning';
      this.showToast(res.msg, icon);
      this.query();
    } catch (error) {
      // 假设这里使用showToast显示错误
      this.showToast('退房失败', 'error');
      console.error('退房失败:', error);
    }
  },

  // 退房
  async onCheckoutTap() {
    try {
      const res = await app.call({
        path: numberCheckout,
        method: 'POST',
        data: { id: this.data.leave_id, leave_time: this.data.leave_time }
      });
      this.setData({
        showConfirm: false,
      });
      const icon = res.code === 1 ? 'success' : 'warning';
      this.showToast(res.msg, icon);
      this.query();
    } catch (error) {
      // 假设这里使用showToast显示错误
      this.showToast('退房失败', 'error');
      console.error('退房失败:', error);
    }
  },

  onConfirmTap() {
    if (this.data.title === '请确认退房日期') {
      this.onCheckoutTap();
    } else {
      this.onRentalTap();
    }
  },

  // 调起退房对话框
  showDialog(e) {
    const { id, rent_mark } = e.currentTarget.dataset;
    this.setData({ showConfirm: true, leave_id: id, title: rent_mark == 'Y' ? '请确认退房日期' : '请确认入住日期' });
  },
  closeDialog() {
    this.setData({ showConfirm: false });
  },

  // 日期选择框
  showDate() {
    this.setData({
      dateVisible: true,
    });
  },

  hidePicker() {
    this.setData({
      dateVisible: false,
    });
  },

  onConfirm(e) {
    const { value } = e.detail;
    this.setData({
      dateVisible: false,
      leave_time: value,
    });
  },

  /**
   * 显示Toast提示框
   *
   * @param message 提示框显示的内容
   * @param theme 提示框的主题，默认为'none'
   */
  // 
  showToast(message, theme = 'none') {
    Toast({
      context: this,
      selector: '#t-toast',
      message: message,
      theme: theme
    });
  },

})