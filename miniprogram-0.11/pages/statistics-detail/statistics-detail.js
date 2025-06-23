Page({
  data: {
    year: 0,
    month: 0,
    expense: 0,
    income: 0,
    categoryStats: []
  },
  onLoad() {
    const now = new Date();
    this.setData({ year: now.getFullYear(), month: now.getMonth() + 1 });
    this.calcStats();
  },
  onMonthChange(e) {
    const val = e.detail.value.split('-');
    this.setData({ year: Number(val[0]), month: Number(val[1]) }, this.calcStats);
  },
  calcStats() {
    const { year, month } = this.data;
    const records = wx.getStorageSync('records') || [];
    let expense = 0, income = 0;
    const categoryMap = {};
    records.forEach(r => {
      const d = new Date(r.date);
      if (d.getFullYear() === year && d.getMonth() + 1 === month) {
        if (!categoryMap[r.category.name]) {
          categoryMap[r.category.name] = {
            category: r.category.name,
            icon: r.category.icon,
            expense: 0,
            income: 0
          };
        }
        if (r.type === 'expense') {
          expense += Number(r.amount);
          categoryMap[r.category.name].expense += Number(r.amount);
        }
        if (r.type === 'income') {
          income += Number(r.amount);
          categoryMap[r.category.name].income += Number(r.amount);
        }
      }
    });
    const categoryStats = Object.values(categoryMap).map(item => ({
      ...item,
      expense: item.expense.toFixed(2),
      income: item.income.toFixed(2)
    }));
    this.setData({ expense: expense.toFixed(2), income: income.toFixed(2), categoryStats });
  }
}); 