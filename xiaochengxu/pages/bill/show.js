// pages/bill/show.js
const app = getApp()
import { uncollectedReport } from '../../utils/conf';
import Toast from 'tdesign-miniprogram/toast/index';
let interstitialAd = null

Page({
  width: 0, // 窗口宽度
  /**
   * 页面的初始数据
   */
  data: {
    data: {
      'number_id': '',
      'start_time': '',
      'end_time': '',
      'electricity_meter_this_month': '',
      'electricity_meter_last_month': '',
      'electricity_consumption': '',
      'electricity_price': '',
      'electricity': '',
      'water_meter_this_month': '',
      'water_meter_last_month': '',
      'water_consumption': '',
      'water_price': '',
      'water': '',
      'rental': '',
      'deposit': '',
      'management': '',
      'network': '',
      'garbage_fee': '',
      'other_charges': '',
      'total_money': '',
      'note': '',
    },
    billId: '',
    isLandlord: false,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.setData({ billId: options.id });
    this.getData(options.id);
    if (wx.createInterstitialAd) {
      interstitialAd = wx.createInterstitialAd({
        adUnitId: 'adunit-e37bacc72559c9d8'
      })
      interstitialAd.onLoad(() => { })
      interstitialAd.onError((err) => {
        console.error('插屏广告加载失败', err)
      })
      interstitialAd.onClose(() => { })
    }
    if (wx.getStorageSync('Authorization')) {
      this.setData({
        isLandlord: true,
      });
    } else {
      setTimeout(() => {
        if (interstitialAd) {
          interstitialAd.show().catch((err) => {
            console.error(err);
          });
        }
      }, 10000);
    }
  },


  async getData(id) {
    try {
      const res = await app.call({
        path: uncollectedReport,
        method: 'POST',
        data: { id }
      });
      if (res.code === 1) {
        this.setData({
          data: res.data,
        });
      } else {
        this.showToast(res.msg, 'warning');
      }
    } catch (error) {
      // 可以在这里处理请求错误，比如弹出提示或者记录日志
      console.error('获取数据失败:', error);
      this.showToast('获取数据失败', 'error');
    }
  },

  onShareAppMessage: function () {
    return {
      title: '请查收房租账单',
      path: '/pages/bill/show?id=' + this.data.billId,//这里是被分享的人点击进来之后的页面
    }
  },

  drawSJ(ctx, bill) {
    ctx.setFontSize(13);
    ctx.textAlign = 'left';

    if (!bill.end_time) {
      ctx.textAlign = 'center';
      ctx.fillText('(退房清算)', (this.width - 2) / 2, 50);
      ctx.setFontSize(13);
      ctx.textAlign = 'left';
      ctx.fillText('房号:' + bill.number_id, 5, 75);
    } else {
      ctx.fillText('房号:' + bill.number_id, 5, 55);
      ctx.fillText('租期:' + bill.start_time + '至' + bill.end_time.substring(0, 10), 5, 75);
    }

    // 使用模板字符串增强可读性
    let temp1 = `电费:${bill.electricity_meter_this_month}-${bill.electricity_meter_last_month}=${bill.electricity_consumption}*${bill.electricity_price}=${bill.electricity}`;
    ctx.fillText(temp1, 5, 95);

    temp1 = `水费:${bill.water_meter_this_month}-${bill.water_meter_last_month}=${bill.water_consumption}*${bill.water_price}=${bill.water}`;
    ctx.fillText(temp1, 5, 115);

    ctx.fillText('租金:' + bill.rental, 5, 135);
    ctx.fillText('押金:' + bill.deposit, 5, 155);
    ctx.fillText('其他费用:' + bill.other_charges, 5, 175);
    ctx.fillText('合计:' + bill.total_money, 5, 195);

    bill.note = '备注:' + bill.note;
    const lines = bill.note.split('\n'); // 假设备注中的换行符是 \n
    const lineHeight = 20; // 定义行高
    for (let index = 0; index < lines.length; index++) {
      ctx.fillText(lines[index], 5, 215 + index * lineHeight);
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