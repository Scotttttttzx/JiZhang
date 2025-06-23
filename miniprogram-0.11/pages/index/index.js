// index.js
const defaultAvatarUrl = 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0'

Page({
  data: {
    userInfo: {},
    hasUserInfo: false,
    canIUseGetUserProfile: false,
    canIUseNicknameComp: false,
    lastGetUserProfileTime: 0,
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    balance: '0.00',
    expense: '0.00',
    income: '0.00',
    budget: '0.00',
    records: [],
    motto: 'Hello World',
    allRecords: [],
    displayRecords: [],
    pageSize: 20,
    currentPage: 1,
    hasMore: true,
    isLoading: false
  },

  onLoad() {
    // 页面加载时初始化数据
    this.initPageData();
    
    // 检查是否支持获取用户信息
    if (wx.getUserProfile) {
      this.setData({
        canIUseGetUserProfile: true
      })
    }
    
    // 检查是否支持昵称组件 - 简化处理
    this.setData({
      canIUseNicknameComp: false
    })
    
    // 启动日期更新定时器
    this.startDateUpdateTimer();
  },

  onShow() {
    // 页面显示时刷新数据
    console.log('页面显示，刷新数据');
    this.initPageData();
  },

  onReady() {
    // 页面初次渲染完成时，确保数据已加载
    console.log('页面渲染完成');
    if (this.data.displayRecords.length === 0 && this.data.allRecords.length > 0) {
      console.log('检测到数据未显示，重新加载');
      this.loadMoreRecords();
    }
  },

  onUnload() {
    // 页面卸载时清除定时器
    if (this.dateUpdateTimer) {
      clearInterval(this.dateUpdateTimer);
      this.dateUpdateTimer = null;
    }
  },

  startDateUpdateTimer() {
    // 每分钟更新一次日期
    this.dateUpdateTimer = setInterval(() => {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;
      
      // 只有当日期发生变化时才更新
      if (this.data.year !== currentYear || this.data.month !== currentMonth) {
        this.setData({
          year: currentYear,
          month: currentMonth
        });
        // 如果切换到新的月份，重新初始化数据
        this.initPageData();
      }
    }, 60000); // 每分钟检查一次
  },

  initPageData() {
    // 获取本地存储的记账记录
    const records = wx.getStorageSync('records') || [];
    const { year, month } = this.data;
    
    console.log('初始化页面数据:', { year, month, totalRecords: records.length });
    
    // 筛选当前月份的记录
    const currentMonthRecords = records.filter(record => {
      const recordDate = new Date(record.date);
      return recordDate.getFullYear() === year && recordDate.getMonth() + 1 === month;
    });
    
    console.log('当前月份记录数量:', currentMonthRecords.length);
    
    // 计算收支统计
    let totalExpense = 0;
    let totalIncome = 0;
    
    currentMonthRecords.forEach(record => {
      if (record.type === 'expense') {
        totalExpense += record.amount;
      } else if (record.type === 'income') {
        totalIncome += record.amount;
      }
    });
    
    // 计算结余
    const balance = totalIncome - totalExpense;
    
    // 获取当前月份的预算数据
    const budgets = wx.getStorageSync('budgets') || [];
    const currentMonthBudgets = budgets.filter(budget => {
      return budget.year === year && budget.month === month;
    });
    const totalBudget = currentMonthBudgets.reduce((sum, budget) => sum + parseFloat(budget.amount || 0), 0);
    const remainingBudget = totalBudget - totalExpense;
    
    // 重置分页数据
    this.setData({
      balance: balance.toFixed(2),
      expense: totalExpense.toFixed(2),
      income: totalIncome.toFixed(2),
      budget: remainingBudget.toFixed(2),
      allRecords: currentMonthRecords,
      displayRecords: [], // 清空显示记录
      currentPage: 1,
      hasMore: currentMonthRecords.length > this.data.pageSize
    });
    
    console.log('分页设置:', {
      allRecordsCount: currentMonthRecords.length,
      pageSize: this.data.pageSize,
      hasMore: currentMonthRecords.length > this.data.pageSize
    });
    
    // 加载第一页数据
    this.loadMoreRecords();
  },

  // 加载更多记录
  loadMoreRecords() {
    if (this.data.isLoading) {
      return;
    }

    // 如果是第一页加载，不需要检查hasMore
    if (this.data.currentPage > 1 && !this.data.hasMore) {
      return;
    }

    this.setData({ isLoading: true });

    const { allRecords, currentPage, pageSize, displayRecords } = this.data;
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const newRecords = allRecords.slice(startIndex, endIndex);

    console.log('加载记录:', {
      startIndex,
      endIndex,
      newRecordsCount: newRecords.length,
      allRecordsCount: allRecords.length
    });

    // 减少延迟时间
    setTimeout(() => {
      try {
        this.setData({
          displayRecords: [...displayRecords, ...newRecords],
          currentPage: currentPage + 1,
          hasMore: endIndex < allRecords.length,
          isLoading: false
        });

        console.log('加载完成:', {
          displayRecordsCount: displayRecords.length + newRecords.length,
          hasMore: endIndex < allRecords.length
        });

        // 如果加载完成，显示提示
        if (endIndex >= allRecords.length && allRecords.length > 0) {
          wx.showToast({
            title: '已加载全部记录',
            icon: 'success',
            duration: 1500
          });
        }
      } catch (error) {
        console.error('加载更多记录失败:', error);
        this.setData({ isLoading: false });
        wx.showToast({
          title: '加载失败',
          icon: 'error'
        });
      }
    }, 100); // 减少延迟到100ms
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.refreshData();
  },

  // 刷新数据
  refreshData() {
    this.setData({ isLoading: true });
    
    setTimeout(() => {
      try {
        this.initPageData();
        wx.stopPullDownRefresh();
        wx.showToast({
          title: '刷新成功',
          icon: 'success',
          duration: 1000
        });
      } catch (error) {
        console.error('刷新数据失败:', error);
        wx.stopPullDownRefresh();
        wx.showToast({
          title: '刷新失败',
          icon: 'error'
        });
      }
    }, 500);
  },

  // 触底加载更多
  onReachBottom() {
    this.loadMoreRecords();
  },

  // 页面滚动到底部时触发
  onScrollToLower() {
    this.loadMoreRecords();
  },

  // 回到顶部
  scrollToTop() {
    wx.pageScrollTo({
      scrollTop: 0,
      duration: 300
    });
    
    wx.showToast({
      title: '已回到顶部',
      icon: 'success',
      duration: 1000
    });
  },

  // 调试功能 - 显示当前数据状态
  debugData() {
    const { allRecords, displayRecords, currentPage, hasMore, isLoading } = this.data;
    console.log('当前数据状态:', {
      allRecordsCount: allRecords.length,
      displayRecordsCount: displayRecords.length,
      currentPage,
      hasMore,
      isLoading
    });
    
    wx.showModal({
      title: '数据状态',
      content: `总记录: ${allRecords.length}\n显示记录: ${displayRecords.length}\n当前页: ${currentPage}\n有更多: ${hasMore}\n加载中: ${isLoading}`,
      confirmText: '强制刷新',
      success: (res) => {
        if (res.confirm) {
          this.forceRefresh();
        }
      }
    });
  },

  // 强制刷新数据
  forceRefresh() {
    console.log('强制刷新数据');
    
    // 重置所有分页相关数据
    this.setData({
      displayRecords: [],
      currentPage: 1,
      hasMore: true,
      isLoading: false
    });
    
    // 重新初始化数据
    this.initPageData();
    
    wx.showToast({
      title: '强制刷新完成',
      icon: 'success'
    });
  },

  onPrevMonth() {
    let { year, month } = this.data;
    month--;
    if (month < 1) {
      month = 12;
      year--;
    }
    this.setData({ year, month });
    this.initPageData();
  },

  onNextMonth() {
    let { year, month } = this.data;
    month++;
    if (month > 12) {
      month = 1;
      year++;
    }
    this.setData({ year, month });
    this.initPageData();
  },

  onAIAnalysis() {
    wx.navigateTo({
      url: '../ai-analysis/ai-analysis'
    });
  },

  onAccount() {
    wx.navigateTo({
      url: '../account/account'
    });
  },

  onBudget() {
    wx.navigateTo({
      url: '../budget/budget'
    });
  },

  onTodayDetail() {
    wx.navigateTo({
      url: '../today/today'
    });
  },

  onAddRecord() {
    wx.navigateTo({
      url: '../add-record/add-record'
    });
  },

  getUserProfile() {
    const now = Date.now();
    const timeDiff = now - this.data.lastGetUserProfileTime;
    
    if (timeDiff < 5000) {
      wx.showToast({
        title: '请稍后再试',
        icon: 'none',
        duration: 2000
      });
      return;
    }

    this.setData({
      lastGetUserProfileTime: now
    });

    wx.getUserProfile({
      desc: '用于完善会员资料',
      success: (res) => {
        this.setData({
          userInfo: res.userInfo,
          hasUserInfo: true
        });
        wx.showToast({
          title: '获取成功',
          icon: 'success'
        });
      },
      fail: (error) => {
        console.log('获取用户信息失败:', error);
        wx.showToast({
          title: '获取失败',
          icon: 'error'
        });
      }
    });
  },

  onChooseAvatar(e) {
    const { avatarUrl } = e.detail 
    this.setData({
      'userInfo.avatarUrl': avatarUrl,
    })
  },

  onInputChange(e) {
    const nickName = e.detail.value
    this.setData({
      'userInfo.nickName': nickName
    })
  },

  bindViewTap() {
    wx.navigateTo({
      url: '../logs/logs'
    })
  },

  onCalendar() {
    wx.navigateTo({
      url: '../calendar/calendar'
    });
  },

  onStatistics() {
    wx.navigateTo({
      url: '../statistics/statistics'
    });
  },

  onSaving() {
    wx.navigateTo({
      url: '../saving/saving'
    });
  },

  onMine() {
    wx.navigateTo({
      url: '../mine/mine'
    });
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
        
        // 重新加载页面数据
        this.initPageData();
        
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
  }
});
