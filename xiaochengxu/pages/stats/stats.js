// pages/stats/stats.js
const MOCK_MODE = true

Page({
  data: {
    stats: {
      totalRooms: 12,
      vacantRooms: 3,
      rentedRooms: 9,
      occupancyRate: 75,
      totalTenants: 15,
      monthIncome: 28500,
      monthExpense: 4500,
      yearIncome: 285000
    },
    chartData: [
      { month: '1月', income: 25000 },
      { month: '2月', income: 28000 },
      { month: '3月', income: 28500 }
    ]
  },

  onLoad() {
    if (MOCK_MODE) {
      this.loadMockData()
    }
  },

  loadMockData() {
    // Already set as default
  }
})
