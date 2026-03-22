// pages/number/modify.js
const app = getApp()
import { numberEdit, numberSave } from '../../utils/conf'
import Toast from 'tdesign-miniprogram/toast/index';

Page({

  /**
   * 页面的初始数据
   */
  data: {
    overlay: false,
    title: '',
    list: {
      'name': '',
      'rental': '',
      'deposit': '',
      'lease_type': 1,
      'management': '',
      'network': '',
      'garbage_fee': '',
      'daily_rent': '',
      'water_price': '',
      'electricity_price': '',
    },
    cityText: '1个月',
    cityValue: [1],
    citys: [
      { label: '1个月', value: '1' },
      { label: '2个月', value: '2' },
      { label: '3个月', value: '3' },
      { label: '6个月', value: '6' },
      { label: '12个月', value: '12' },
    ],
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.getData(options.id);
    wx.setNavigationBarTitle({
      title: '房间管理-编辑',
    })
    this.setData({
      title: options.house_name,
    })
  },

  async getData(id) {
    try {
      const res = await app.call({
        path: numberEdit,
        method: 'POST',
        data: { 'id': id }
      });
      // console.log(res);
      this.setData({
        list: res.data,
        cityText: `${res.data.lease_type}个月`,
        cityValue: [res.data.lease_type],
      });
    } catch (error) {
      // 添加错误处理逻辑，可以在这里弹出提示或者记录错误
      console.error('获取数据失败:', error);
      this.showToast('获取数据失败', 'error');
    }
  },

  bindDataChange(e) {
    let { key } = e.currentTarget.dataset;
    // 确保e.detail有value属性，防止运行时错误
    let value = e.detail && e.detail.value || '';
    // 使用扩展运算符创建新的对象，避免直接修改this.data.list
    let newData = { ...this.data.list, [key]: value };
    this.setData({
      list: newData
    });
  },

  verify() {
    const { list } = this.data;
    const requiredFields = {
      name: '房间名称',
      rental: '租金',
      deposit: '押金',
      management: '管理费',
      network: '网络费',
      garbage_fee: '卫生费',
      daily_rent: '日租金',
      water_price: '水费单价',
      electricity_price: '电费单价'
    };

    for (const key in requiredFields) {
      if (list[key] === '' || list[key] === null || list[key] === undefined) {
        return { res: false, msg: `${requiredFields[key]}不能为空` };
      }
    }

    return { res: true, msg: '' };
  },

  async bindSave() {
    let verification = this.verify();
    if (!verification.res) {
      this.showToast(verification.msg);
      return;
    }
    this.setData({ overlay: true });
    try {
      const saveResult = await app.call({
        path: numberSave,
        method: 'POST',
        data: this.data.list
      });
      this.setData({ overlay: false });
      let icon = saveResult.code === 1 ? 'success' : 'warning';
      this.showToast(saveResult.msg, icon);
      setTimeout(() => {
        wx.navigateBack({ delta: 1 });
      }, 1000);
    } catch (error) {
      this.setData({ overlay: false });
      console.error('保存数据失败:', error);
      this.showToast('保存数据失败', 'error');
    }
  },

  onPickerChange(e) {
    let newData = { ...this.data.list };
    newData['lease_type'] = e.detail.value[0];
    this.setData({
      cityVisible: false,
      cityText: e.detail.label,
      cityValue: e.detail.value,
      list: newData
    })
  },
  onCityPicker() {
    this.setData({ cityVisible: true });
  },

  showToast(message, theme = 'none') {
    Toast({
      context: this,
      selector: '#t-toast',
      message: message,
      theme: theme
    });
  }
})