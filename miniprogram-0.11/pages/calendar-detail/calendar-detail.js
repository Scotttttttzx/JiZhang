Page({
  data: {
    date: '',
    records: [],
    expense: 0,
    income: 0,
    // 添加同步状态
    isRefreshing: false,
    lastSyncTime: '',
    // 添加统计信息
    totalRecords: 0,
    expenseCount: 0,
    incomeCount: 0
  },
  onLoad(options) {
    const date = options.date;
    this.setData({ date });
    this.loadRecords(date);
  },
  onShow() {
    // 页面显示时自动刷新数据
    this.refreshData();
  },
  // 下拉刷新
  onPullDownRefresh() {
    this.refreshData();
  },
  // 刷新数据
  refreshData() {
    this.setData({ isRefreshing: true });
    
    // 模拟网络延迟
    setTimeout(() => {
      try {
        this.loadRecords(this.data.date);
        this.setData({ 
          isRefreshing: false,
          lastSyncTime: this.formatTime(new Date())
        });
        
        // 停止下拉刷新动画
        wx.stopPullDownRefresh();
        
        wx.showToast({
          title: '数据已同步',
          icon: 'success',
          duration: 1000
        });
      } catch (error) {
        console.error('刷新数据失败:', error);
        this.setData({ isRefreshing: false });
        wx.stopPullDownRefresh();
        wx.showToast({
          title: '同步失败',
          icon: 'error'
        });
      }
    }, 500);
  },
  loadRecords(date) {
    try {
      console.log('正在加载日期:', date);
      
      const all = wx.getStorageSync('records') || [];
      console.log('所有记录数量:', all.length);
      
      // 显示所有记录的日期，用于调试
      if (all.length > 0) {
        console.log('记录日期示例:', all.slice(0, 5).map(r => r.date));
      }
      
      const records = all.filter(r => r.date === date);
      console.log('匹配日期的记录数量:', records.length);
      
      // 数据验证和清理
      const validRecords = records.filter(record => {
        const isValid = record && 
               record.id && 
               record.type && 
               record.amount !== undefined && 
               record.category && 
               record.date;
        
        if (!isValid) {
          console.warn('发现无效记录:', record);
        }
        
        return isValid;
      });
      
      console.log('有效记录数量:', validRecords.length);
      
      let expense = 0, income = 0;
      let expenseCount = 0, incomeCount = 0;
      
      validRecords.forEach(r => {
        const amount = Number(r.amount) || 0;
        if(r.type === 'expense') {
          expense += amount;
          expenseCount++;
        }
        if(r.type === 'income') {
          income += amount;
          incomeCount++;
        }
      });

      // 计算结余
      const balance = income - expense;
      
      // 按时间倒序排列记录
      const sortedRecords = validRecords.sort((a, b) => {
        const timeA = a.time || '00:00';
        const timeB = b.time || '00:00';
        return timeB.localeCompare(timeA);
      });
      
      this.setData({ 
        records: sortedRecords,
        expense: expense.toFixed(2), 
        income: income.toFixed(2),
        balance: balance.toFixed(2),
        totalRecords: validRecords.length,
        expenseCount: expenseCount,
        incomeCount: incomeCount,
        lastSyncTime: this.formatTime(new Date())
      });

      // 更新页面标题
      wx.setNavigationBarTitle({
        title: `${date} 明细`
      });

      // 如果发现无效数据，记录警告
      if (validRecords.length !== records.length) {
        console.warn(`发现 ${records.length - validRecords.length} 条无效记录`);
      }

      // 如果没有找到记录，显示提示
      if (validRecords.length === 0) {
        console.log('该日期没有找到记录');
        wx.showToast({
          title: '该日期暂无记录',
          icon: 'none',
          duration: 2000
        });
      }

    } catch (error) {
      console.error('加载记录失败:', error);
      wx.showToast({
        title: '数据加载失败',
        icon: 'error'
      });
      throw error; // 重新抛出错误以便上层处理
    }
  },
  // 格式化时间
  formatTime(date) {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
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
        
        // 重新加载当前日期的记录
        this.loadRecords(this.data.date);
        
        wx.showToast({
          title: '删除成功',
          icon: 'success'
        });
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
  },
  // 手动同步数据
  onManualSync() {
    this.refreshData();
  },
  // 导出当日数据
  onExportData() {
    const { date, records, expense, income, balance, totalRecords, expenseCount, incomeCount } = this.data;
    
    const exportData = {
      date: date,
      summary: {
        totalExpense: expense,
        totalIncome: income,
        balance: balance,
        totalRecords: totalRecords,
        expenseCount: expenseCount,
        incomeCount: incomeCount
      },
      records: records,
      exportTime: new Date().toISOString()
    };
    
    // 显示导出数据
    wx.showModal({
      title: '数据导出',
      content: `日期：${date}\n支出：¥${expense}\n收入：¥${income}\n结余：¥${balance}\n记录数：${totalRecords}条`,
      confirmText: '复制数据',
      success: (res) => {
        if (res.confirm) {
          // 复制数据到剪贴板（小程序中实际无法直接复制，这里只是示例）
          wx.showToast({
            title: '数据已准备',
            icon: 'success'
          });
          console.log('导出数据:', exportData);
        }
      }
    });
  },
  // 创建测试数据（仅用于调试）
  createTestData() {
    const { date } = this.data;
    
    wx.showModal({
      title: '创建测试数据',
      content: `将为 ${date} 创建测试收支记录，用于验证同步功能`,
      confirmText: '创建',
      success: (res) => {
        if (res.confirm) {
          this.addTestRecords(date);
        }
      }
    });
  },
  // 添加测试记录
  addTestRecords(date) {
    try {
      const testRecords = [
        {
          id: Date.now() + 1,
          type: 'expense',
          amount: 25.50,
          category: { name: '餐饮', icon: '🍽️' },
          remark: '午餐',
          date: date,
          time: '12:30',
          createTime: new Date().getTime()
        },
        {
          id: Date.now() + 2,
          type: 'income',
          amount: 100.00,
          category: { name: '工资', icon: '💰' },
          remark: '兼职收入',
          date: date,
          time: '09:00',
          createTime: new Date().getTime()
        },
        {
          id: Date.now() + 3,
          type: 'expense',
          amount: 15.80,
          category: { name: '交通', icon: '🚗' },
          remark: '地铁费',
          date: date,
          time: '08:15',
          createTime: new Date().getTime()
        }
      ];

      // 获取现有记录
      const allRecords = wx.getStorageSync('records') || [];
      
      // 添加测试记录
      allRecords.unshift(...testRecords);
      
      // 保存到本地存储
      wx.setStorageSync('records', allRecords);
      
      // 重新加载数据
      this.loadRecords(date);
      
      wx.showToast({
        title: '测试数据已创建',
        icon: 'success'
      });
      
    } catch (error) {
      console.error('创建测试数据失败:', error);
      wx.showToast({
        title: '创建失败',
        icon: 'error'
      });
    }
  }
}); 