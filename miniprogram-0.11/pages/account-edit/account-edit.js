Page({
  data: {
    accountId: null,
    selectedType: '',
    accountName: '',
    accountBalance: '',
    accountNote: '',
    // 账户类型选项
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
    this.loadAccountData();
  },

  // 加载账户数据
  loadAccountData() {
    const { accountId } = this.data;
    const accounts = wx.getStorageSync('accounts') || [];
    
    const account = accounts.find(acc => acc.id === accountId);
    if (!account) {
      wx.showToast({ 
        title: '账户不存在', 
        icon: 'error' 
      });
      wx.navigateBack();
      return;
    }

    this.setData({
      selectedType: account.type,
      accountName: account.name,
      accountBalance: account.balance.toString(),
      accountNote: account.note || ''
    });
  },

  // 选择账户类型
  onTypeSelect(e) {
    const { type } = e.currentTarget.dataset;
    this.setData({ selectedType: type });
  },

  // 输入账户名称
  onNameInput(e) {
    this.setData({ accountName: e.detail.value });
  },

  // 输入账户余额
  onBalanceInput(e) {
    this.setData({ accountBalance: e.detail.value });
  },

  // 输入备注
  onNoteInput(e) {
    this.setData({ accountNote: e.detail.value });
  },

  // 保存账户修改
  onSaveAccount() {
    const { accountId, selectedType, accountName, accountBalance, accountNote } = this.data;

    // 验证输入
    if (!accountName.trim()) {
      wx.showToast({
        title: '请输入账户名称',
        icon: 'none'
      });
      return;
    }

    if (!accountBalance || parseFloat(accountBalance) < 0) {
      wx.showToast({
        title: '请输入有效的账户余额',
        icon: 'none'
      });
      return;
    }

    // 获取账户类型信息
    const typeInfo = this.data.accountTypes.find(t => t.id === selectedType);
    if (!typeInfo) {
      wx.showToast({
        title: '请选择账户类型',
        icon: 'none'
      });
      return;
    }

    // 更新账户数据
    const accounts = wx.getStorageSync('accounts') || [];
    const accountIndex = accounts.findIndex(acc => acc.id === accountId);
    
    if (accountIndex === -1) {
      wx.showToast({
        title: '账户不存在',
        icon: 'error'
      });
      return;
    }

    // 更新账户信息
    accounts[accountIndex] = {
      ...accounts[accountIndex],
      type: selectedType,
      name: accountName.trim(),
      balance: parseFloat(accountBalance),
      note: accountNote.trim(),
      icon: typeInfo.icon,
      color: typeInfo.color,
      updateTime: new Date().toISOString()
    };

    // 保存到本地存储
    wx.setStorageSync('accounts', accounts);

    wx.showToast({
      title: '保存成功',
      icon: 'success'
    });

    // 返回上一页并刷新
    setTimeout(() => {
      const pages = getCurrentPages();
      if (pages.length > 1) {
        const prevPage = pages[pages.length - 2];
        if (prevPage.route === 'pages/account-detail/account-detail') {
          prevPage.loadAccountDetails();
        }
      }
      wx.navigateBack();
    }, 1500);
  },

  // 删除账户
  onDeleteAccount() {
    const { accountId } = this.data;
    
    // 检查账户是否有关联的交易记录
    const records = wx.getStorageSync('records') || [];
    const relatedRecords = records.filter(rec => rec.accountId === accountId);
    
    if (relatedRecords.length > 0) {
      wx.showModal({
        title: '确认删除',
        content: `该账户有 ${relatedRecords.length} 条交易记录，删除账户将同时删除所有相关记录，确定要删除吗？`,
        confirmText: '删除',
        confirmColor: '#ff4757',
        success: (res) => {
          if (res.confirm) {
            this.deleteAccountAndRecords();
          }
        }
      });
    } else {
      wx.showModal({
        title: '确认删除',
        content: '确定要删除这个账户吗？',
        confirmText: '删除',
        confirmColor: '#ff4757',
        success: (res) => {
          if (res.confirm) {
            this.deleteAccountAndRecords();
          }
        }
      });
    }
  },

  // 执行删除操作
  deleteAccountAndRecords() {
    const { accountId } = this.data;
    
    // 删除账户
    const accounts = wx.getStorageSync('accounts') || [];
    const updatedAccounts = accounts.filter(acc => acc.id !== accountId);
    wx.setStorageSync('accounts', updatedAccounts);

    // 删除相关交易记录
    const records = wx.getStorageSync('records') || [];
    const updatedRecords = records.filter(rec => rec.accountId !== accountId);
    wx.setStorageSync('records', updatedRecords);

    wx.showToast({
      title: '删除成功',
      icon: 'success'
    });

    // 返回账户列表页并刷新
    setTimeout(() => {
      const pages = getCurrentPages();
      if (pages.length > 2) {
        const listPage = pages[pages.length - 3];
        if (listPage.route === 'pages/account/account') {
          listPage.loadAccounts();
        }
      }
      wx.navigateBack({
        delta: 2 // 返回两层，跳过详情页直接到列表页
      });
    }, 1500);
  }
}); 