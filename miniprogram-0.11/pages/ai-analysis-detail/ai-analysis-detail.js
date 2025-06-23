Page({
  data: {
    period: '',
    totalExpense: 0,
    totalIncome: 0,
    suggestions: [],
    chatList: [
      { role: 'ai', content: '您好，我是您的私人财务分析师，有什么账单问题可以问我~' }
    ],
    chatInput: ''
  },
  onLoad() {
    this.analyzeBills();
  },
  analyzeBills() {
    // 模拟分析本月账单
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const period = `${year}年${month}月`;
    const records = wx.getStorageSync('records') || [];
    let totalExpense = 0, totalIncome = 0;
    records.forEach(r => {
      const d = new Date(r.date);
      if (d.getFullYear() === year && d.getMonth() + 1 === month) {
        if (r.type === 'expense') totalExpense += Number(r.amount);
        if (r.type === 'income') totalIncome += Number(r.amount);
      }
    });
    // 简单建议模拟
    const suggestions = [];
    if (totalExpense > totalIncome) {
      suggestions.push({ title: '收支提醒', content: '本月支出已超过收入，请注意控制消费。' });
    } else {
      suggestions.push({ title: '收支良好', content: '本月收支平衡，继续保持！' });
    }
    if (totalExpense > 2000) {
      suggestions.push({ title: '高支出预警', content: '本月支出较高，建议制定预算并减少不必要的开销。' });
    }
    if (totalIncome > 5000) {
      suggestions.push({ title: '收入提升', content: '本月收入较高，可以考虑增加储蓄或投资。' });
    }
    this.setData({ period, totalExpense: totalExpense.toFixed(2), totalIncome: totalIncome.toFixed(2), suggestions });
  },
  onChatInput(e) {
    this.setData({ chatInput: e.detail.value });
  },
  onSendChat() {
    const q = this.data.chatInput.trim();
    if (!q) return;
    const chatList = this.data.chatList.concat([{ role: 'user', content: q }]);
    // 简单AI模拟
    let aiReply = '很抱歉，我暂时无法理解您的问题。';
    if (q.includes('支出')) aiReply = '本月支出为：' + this.data.totalExpense + '元。';
    if (q.includes('收入')) aiReply = '本月收入为：' + this.data.totalIncome + '元。';
    if (q.includes('建议')) aiReply = '建议：' + (this.data.suggestions[0] ? this.data.suggestions[0].content : '暂无建议');
    setTimeout(() => {
      this.setData({
        chatList: chatList.concat([{ role: 'ai', content: aiReply }]),
        chatInput: ''
      });
    }, 500);
  }
}); 