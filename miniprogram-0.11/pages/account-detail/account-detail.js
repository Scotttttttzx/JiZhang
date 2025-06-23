Page({
  data: {
    accountId: null,
    accountInfo: {},
    records: [],
    // 用于筛选
    filterType: 'all', // all, expense, income
    // 图标库
    accountTypes: [
      { id: 'cash', name: '现金', icon: '💰', color: '#FFC107' },
      { id: 'deposit', name: '储蓄卡', icon: '💳', color: '#03A9F4' },
      { id: 'credit', name: '信用卡', icon: '💳', color: '#E91E63' },
      { id: 'alipay', name: '支付宝', icon: '📱', color: '#1677FF' },
      { id: 'wechat', name: '微信钱包', icon: '📱', color: '#28C445' },
      { id: 'investment', name: '投资理财', icon: '📈', color: '#FF5722' },
      { id: 'other', name: '其它', icon: '💼', color: '#9E9E9E' }
    ]
  },

  onLoad(options) {
    const { id } = options;
    this.setData({ accountId: id });
    this.loadAccountDetails();
  },

  onShow() {
    this.loadAccountDetails();
  },

  loadAccountDetails() {
    const { accountId } = this.data;
    const accounts = wx.getStorageSync('accounts') || [];
    const records = wx.getStorageSync('records') || [];

    const accountInfo = accounts.find(acc => acc.id === accountId);
    if (!accountInfo) {
      wx.showToast({ title: '账户不存在', icon: 'error' });
      wx.navigateBack();
      return;
    }
    
    // 匹配图标和颜色
    const typeInfo = this.data.accountTypes.find(t => t.id === accountInfo.type);
    if (typeInfo) {
      accountInfo.icon = typeInfo.icon;
      accountInfo.color = typeInfo.color;
    }

    const relatedRecords = records.filter(rec => rec.accountId === accountId);

    this.setData({
      accountInfo: accountInfo,
      records: relatedRecords
    });

    wx.setNavigationBarTitle({
      title: accountInfo.name
    });
  },

  onFilterChange(e) {
    const { type } = e.currentTarget.dataset;
    this.setData({ filterType: type });
    // WXML中通过wx:if实现筛选，无需JS中再处理records
  },

  onEditAccount() {
    wx.navigateTo({
      url: `../account-edit/account-edit?id=${this.data.accountId}`
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
        
        // 重新加载账户详情
        this.loadAccountDetails();
        
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

  onAddRecord() {
    wx.navigateTo({
      url: '../add-record/add-record'
    });
  }
}); 