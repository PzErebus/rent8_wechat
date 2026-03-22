// pages/bill/bill.js
const app = getApp()
import { propertyQueryAll, propertySort, uncollectedQuery, uncollectedAccount, uncollectedReadingTime } from '../../utils/conf'
import Toast from 'tdesign-miniprogram/toast/index';

Page({

  /**
   * 页面的初始数据
   */
  data: {
    houses: [{ label: '选择房产', value: 0 }],
    house_id: 0,
    meter_time: '',
    reading_arr: [{ label: '抄表日期', value: '' }],
    isLoading: false,
    list: [],
    username: '',
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onShow: function () {
    this.query();
    this.queryHouse();
    this.queryReadingTime();
    wx.getStorage({
      key: 'user',
      success: (res) => {
        this.setData({
          username: res.data.name,
        });
      }
    });
  },

  // 房产查询
  async queryHouse() {
    try {
      const res = await app.call({
        path: propertyQueryAll,
        method: 'GET'
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
        });
      }
    } catch (error) {
      // 假设这里使用showToast显示错误
      console.error('查询房产失败:', error);
    }
  },

  // 抄表日期查询
  async queryReadingTime() {
    try {
      const res = await app.call({
        path: uncollectedReadingTime,
        method: 'GET',
      });
      if (res.code === 1) {
        // 初始化抄表日期数组，包含默认“抄表日期”项
        let data = [{ label: '抄表日期', value: '' }];
        res.data.forEach((element) => {
          if (element.meter_reading_time !== null) {
            // 简化日期截取操作，使用substring方法
            const meterReadingTime = element.meter_reading_time.substring(0, 10);
            data.push({ label: meterReadingTime, value: meterReadingTime });
          }
        });
        this.setData({
          reading_arr: data,
        });
      }
    } catch (error) {
      console.error('抄表日期查询失败:', error);
    }
  },

  // 未收账单查询
  async query() {
    this.setData({ isLoading: true, list: [] });
    try {
      const res = await app.call({
        path: uncollectedQuery,
        method: 'POST',
        data: { meter_reading_time: this.data.meter_time }
      });
      if (res.code === 1) {
        this.setData({
          list: res.data,
        });
      }
    } catch (error) {
      console.error('bill页面出错:', error);
    }
    this.setData({ isLoading: false });
  },

  // 房产变更
  async houseChange(e) {
    // 清空抄表时间并设置房产ID
    this.setData({
      meter_time: '',
      house_id: e.detail.value
    });

    try {
      // 调用房产排序API
      const res = await app.call({
        path: propertySort,
        method: 'POST',
        data: { id: e.detail.value }
      });

      // 调用查询账单和抄表时间的方法
      this.query();
      this.queryReadingTime();
      this.queryHouse();
    } catch (error) {
      // 捕获错误并显示Toast提示
      console.error('房产变更失败:', error);
      this.showToast('房产变更失败', 'error');
    }
  },

  // 抄表日期变更
  bindDateChange: function (e) {
    // console.log('picker发送选择改变，携带值为', e.detail.value)
    this.setData({
      meter_time: e.detail.value
    })
    this.query()
  },

  // 跳转详细账单页面
  onShowTap(e) {
    let { index } = e.currentTarget.dataset
    // console.log(this.data.list[index].id)
    let id = this.data.list[index].id
    wx.navigateTo({
      url: '/pages/bill/show?id=' + id
    })
  },

  // 跳转修改页面
  onModifyTap(e) {
    let { index } = e.currentTarget.dataset
    // console.log(this.data.list[index].id)
    let id = this.data.list[index].id
    wx.navigateTo({
      url: '/pages/bill/modify?id=' + id
    })
  },

  // 到账
  onAccountTap(e) {
    let { index } = e.currentTarget.dataset;
    let { name, total_money, id } = this.data.list[index];
    wx.showModal({
      title: '提示',
      content: `${name}的${total_money}元已到账？`,
      success: async ({ confirm }) => {
        if (confirm) {
          try {
            const res = await app.call({
              path: uncollectedAccount,
              method: 'POST',
              data: { id }
            });
            const icon = res.code === 1 ? 'success' : 'warning';
            this.showToast(res.msg, icon);
            this.queryReadingTime();
            this.query();
          } catch (error) {
            console.error('到账处理失败:', error);
            this.showToast('到账失败', 'error');
          }
        }
      },
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