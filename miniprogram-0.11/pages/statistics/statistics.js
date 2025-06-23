Page({
  data: {
    year: 0,
    month: 0,
    expense: 0,
    income: 0
  },
  onLoad() {
    this.initStatistics();
  },
  initStatistics() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const records = wx.getStorageSync('records') || [];
    let expense = 0, income = 0;
    records.forEach(r => {
      const d = new Date(r.date);
      if (d.getFullYear() === year && d.getMonth() + 1 === month) {
        if (r.type === 'expense') expense += Number(r.amount);
        if (r.type === 'income') income += Number(r.amount);
      }
    });
    this.setData({ year, month, expense: expense.toFixed(2), income: income.toFixed(2) });
  },
  onGoDetail() {
    wx.navigateTo({
      url: '/pages/statistics-detail/statistics-detail'
    });
  }
}); 