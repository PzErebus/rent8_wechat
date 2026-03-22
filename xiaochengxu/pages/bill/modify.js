// pages/bill/modify.js
const app = getApp()
import { uncollectedEdit, uncollectedSave } from '../../utils/conf';
import Toast from 'tdesign-miniprogram/toast/index';
const dayjs = require("./dayjs");

Page({

  /**
   * 页面的初始数据
   */
  data: {
    overlay: false,
    autosize: {
      maxHeight: 120,
      minHeight: 40,
    },
    list: {
      'meter_reading_time': '',
      'electricity_meter_last_month': '',
      'water_meter_last_month': '',
      'electricity_meter_this_month': '',
      'water_meter_this_month': '',
      'rental': '',
      'deposit': '',
      'management': '',
      'network': '',
      'garbage_fee': '',
      'other_charges': '',
      'note': '',
    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.getData(options.id);
  },

  async getData(id) {
    try {
      const res = await app.call({
        path: uncollectedEdit,
        method: 'POST',
        data: { id }
      });
      this.setData({
        list: res.data,
      });
    } catch (error) {
      console.error('获取数据失败:', error);
      this.showToast('获取数据失败', 'error');
    }
  },

  bindDataChange(e) {
    const { key } = e.currentTarget.dataset;
    const { value } = e.detail;
    // 直接对this.data.list进行修改，并调用this.setData
    this.setData({
      ['list.' + key]: value
    });
  },

  bindNoteChange(e) {
    const { value } = e.detail;
    this.setData({
      'list.note': value
    });
  },

  verification() {
    const { list } = this.data;
    const requiredFields = {
      electricity_meter_last_month: '旧电表度数不能为空',
      water_meter_last_month: '旧水表度数不能为空',
      electricity_meter_this_month: '电表度数不能为空',
      water_meter_this_month: '水表度数不能为空',
      rental: '租金不能为空',
      deposit: '押金不能为空',
      management: '管理费不能为空',
      network: '网络费不能为空',
      garbage_fee: '卫生费不能为空',
      other_charges: '其他费用不能为空',
    };

    for (const key in requiredFields) {
      if (list[key] === '' || list[key] === undefined || list[key] === null) {
        return { res: false, msg: requiredFields[key] };
      }
    }

    return { res: true, msg: '' };
  },

  async bindSave() {
    let res = this.verification();
    if (!res.res) {
      this.showToast(res.msg);
      return;
    }
    this.setData({ overlay: true });
    let list = { ...this.data.list };
    if (!list.meter_reading_time) {
      list.meter_reading_time = dayjs().format('YYYY-MM-DD');
    }

    try {
      const saveResult = await app.call({
        path: uncollectedSave,
        method: 'POST',
        data: list
      });
      this.setData({ overlay: false });
      let icon = saveResult.code === 1 ? 'success' : 'warning';
      this.showToast(saveResult.msg, icon);
      setTimeout(() => {
        wx.navigateBack({ delta: 1 });
      }, 1000);
    } catch (err) {
      this.setData({ overlay: false });
      // 增加错误处理逻辑，比如显示Toast提示用户
      console.error('保存失败:', err);
      this.showToast('保存失败，请稍后再试', 'error');
    }
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