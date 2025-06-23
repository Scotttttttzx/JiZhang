Page({
  data: {
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    day: new Date().getDate(),
    totalExpense: '0.00',
    totalIncome: '0.00',
    todayRecords: []
  },
  
  onLoad() {
    this.loadTodayRecords();
  },
  
  onShow() {
    // 每次显示页面时重新加载数据
    this.loadTodayRecords();
  },
  
  loadTodayRecords() {
    try {
      // 获取今日日期
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0]; // 格式：YYYY-MM-DD
      
      console.log('正在加载今日记录，日期:', todayStr);
      
      // 从本地存储获取所有记录
      const allRecords = wx.getStorageSync('records') || [];
      console.log('所有记录数量:', allRecords.length);
      
      // 筛选今日的记录
      const todayRecords = allRecords.filter(record => {
        return record.date === todayStr;
      });
      
      console.log('今日记录数量:', todayRecords.length);
      
      // 计算今日支出和收入
      let totalExpense = 0;
      let totalIncome = 0;
      
      todayRecords.forEach(record => {
        const amount = Number(record.amount) || 0;
        if (record.type === 'expense') {
          totalExpense += amount;
        } else if (record.type === 'income') {
          totalIncome += amount;
        }
      });
      
      // 按时间倒序排列记录
      const sortedRecords = todayRecords.sort((a, b) => {
        const timeA = a.time || '00:00';
        const timeB = b.time || '00:00';
        return timeB.localeCompare(timeA);
      });
      
      this.setData({
        todayRecords: sortedRecords,
        totalExpense: totalExpense.toFixed(2),
        totalIncome: totalIncome.toFixed(2)
      });
      
      console.log('今日数据加载完成:', {
        expense: totalExpense.toFixed(2),
        income: totalIncome.toFixed(2),
        recordCount: sortedRecords.length
      });
      
    } catch (error) {
      console.error('加载今日记录失败:', error);
      wx.showToast({
        title: '数据加载失败',
        icon: 'error'
      });
    }
  },
  
  // 创建测试数据
  createTestData() {
    try {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      
      const testRecords = [
        {
          id: Date.now() + 1,
          type: 'expense',
          amount: 25.50,
          category: { id: 1, name: '餐饮', icon: '🍽️' },
          remark: '午饭',
          date: todayStr,
          time: '12:30',
          createTime: new Date().getTime()
        },
        {
          id: Date.now() + 2,
          type: 'expense',
          amount: 15.00,
          category: { id: 2, name: '交通', icon: '🚗' },
          remark: '地铁',
          date: todayStr,
          time: '08:15',
          createTime: new Date().getTime()
        },
        {
          id: Date.now() + 3,
          type: 'income',
          amount: 5000.00,
          category: { id: 9, name: '工资', icon: '💰' },
          remark: '月薪',
          date: todayStr,
          time: '09:00',
          createTime: new Date().getTime()
        }
      ];
      
      // 获取现有记录并添加测试数据
      const existingRecords = wx.getStorageSync('records') || [];
      const updatedRecords = [...testRecords, ...existingRecords];
      
      // 保存到本地存储
      wx.setStorageSync('records', updatedRecords);
      
      wx.showToast({
        title: '测试数据已创建',
        icon: 'success'
      });
      
      // 重新加载数据
      this.loadTodayRecords();
      
    } catch (error) {
      console.error('创建测试数据失败:', error);
      wx.showToast({
        title: '创建失败',
        icon: 'error'
      });
    }
  },
  
  onRecordDetail(e) {
    const record = e.currentTarget.dataset.record;
    if (record && record.id) {
      wx.navigateTo({
        url: `/pages/today-detail/today-detail?id=${record.id}`
      });
    }
  },
  
  // 删除记录
  onDeleteRecord(e) {
    const record = e.currentTarget.dataset.record;
    
    wx.showModal({
      title: '确认删除',
      content: `确定要删除这条${record.type === 'expense' ? '支出' : '收入'}记录吗？\n\n${record.category.name} ¥${record.amount}`,
      confirmText: '删除',
      confirmColor: '#dc3545',
      success: (res) => {
        if (res.confirm) {
          this.deleteRecord(record);
        }
      }
    });
  },
  
  // 执行删除操作
  deleteRecord(record) {
    try {
      // 获取所有记录
      const allRecords = wx.getStorageSync('records') || [];
      
      // 找到并删除指定记录
      const recordIndex = allRecords.findIndex(r => r.id === record.id);
      
      if (recordIndex !== -1) {
        allRecords.splice(recordIndex, 1);
        
        // 保存更新后的记录
        wx.setStorageSync('records', allRecords);
        
        wx.showToast({
          title: '删除成功',
          icon: 'success'
        });
        
        // 重新加载今日记录
        this.loadTodayRecords();
      } else {
        wx.showToast({
          title: '记录不存在',
          icon: 'error'
        });
      }
    } catch (error) {
      console.error('删除记录失败:', error);
      wx.showToast({
        title: '删除失败',
        icon: 'error'
      });
    }
  }
}); 