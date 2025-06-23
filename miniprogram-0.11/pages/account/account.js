// account.js
Page({
  data: {
    // 账户列表
    accounts: [],
    // 总资产
    totalAssets: '0.00',
    // 账户类型
    accountTypes: [
      {
        id: 'cash',
        name: '现金',
        icon: '💰',
        color: '#FFC107'
      },
      {
        id: 'deposit',
        name: '储蓄卡',
        icon: '💳',
        color: '#03A9F4'
      },
      {
        id: 'credit',
        name: '信用卡',
        icon: '💳',
        color: '#E91E63'
      },
      {
        id: 'alipay',
        name: '支付宝',
        icon: '📱',
        color: '#1677FF'
      },
      {
        id: 'wechat',
        name: '微信钱包',
        icon: '📱',
        color: '#28C445'
      },
      {
        id: 'investment',
        name: '投资理财',
        icon: '📈',
        color: '#FF5722'
      },
      {
        id: 'other',
        name: '其它',
        icon: '💼',
        color: '#9E9E9E'
      }
    ],
    // 显示添加账户弹窗
    showAddForm: false,
    // 新账户信息
    newAccount: {
      name: '',
      balance: '',
      type: 'cash'
    },
    selectedTypeIndex: 0,
    selectedTypeName: '现金'
  },

  onLoad() {
    this.loadAccounts();
  },

  onShow() {
    this.loadAccounts();
  },

  // 加载账户数据
  loadAccounts() {
    const accounts = wx.getStorageSync('accounts') || [];
    let totalAssets = 0;
    accounts.forEach(acc => {
      totalAssets += parseFloat(acc.balance) || 0;
      const typeInfo = this.data.accountTypes.find(t => t.id === acc.type);
      if (typeInfo) {
        acc.icon = typeInfo.icon;
        acc.color = typeInfo.color;
      }
    });

    this.setData({
      accounts: accounts,
      totalAssets: totalAssets.toFixed(2)
    });
  },

  // 显示添加账户弹窗
  onAddAccount() {
    const defaultType = 'cash';
    const defaultIndex = this.data.accountTypes.findIndex(t => t.id === defaultType) || 0;
    const defaultName = this.data.accountTypes[defaultIndex].name;

    this.setData({
      showAddForm: true,
      newAccount: {
        name: '',
        balance: '',
        type: defaultType
      },
      selectedTypeIndex: defaultIndex,
      selectedTypeName: defaultName
    });
  },

  onCloseForm() {
    this.setData({
      showAddForm: false,
    });
  },

  onInputChange(e) {
    const {
      field
    } = e.currentTarget.dataset;
    this.setData({
      [`newAccount.${field}`]: e.detail.value
    });
  },

  onTypeChange(e) {
    const selectedIndex = e.detail.value;
    const selectedTypeInfo = this.data.accountTypes[selectedIndex];
    this.setData({
      selectedTypeIndex: selectedIndex,
      selectedTypeName: selectedTypeInfo.name,
      'newAccount.type': selectedTypeInfo.id
    });
  },

  onFormSubmit() {
    const {
      newAccount
    } = this.data;
    if (!newAccount.name || !newAccount.balance) {
      wx.showToast({
        title: '请填写完整信息',
        icon: 'none'
      });
      return;
    }

    const accounts = this.data.accounts;
    const newId = 'acc_' + Date.now();
    const accountToAdd = {
      id: newId,
      ...newAccount,
      balance: parseFloat(newAccount.balance).toFixed(2)
    };

    accounts.push(accountToAdd);
    wx.setStorageSync('accounts', accounts);

    wx.showToast({
      title: '添加成功',
      icon: 'success'
    });

    this.onCloseForm();
    this.loadAccounts();
  },

  // 编辑账户
  onEditAccount(e) {
    const account = e.currentTarget.dataset.account;
    wx.showModal({
      title: '编辑账户',
      content: '是否要编辑该账户？',
      success: (res) => {
        if (res.confirm) {
          // 这里可以实现编辑功能，暂时显示提示
          wx.showToast({
            title: '编辑功能开发中',
            icon: 'none'
          });
        }
      }
    });
  },

  // 删除账户
  onDeleteAccount(e) {
    const account = e.currentTarget.dataset.account;
    wx.showModal({
      title: '删除账户',
      content: `确定要删除账户"${account.name}"吗？`,
      success: (res) => {
        if (res.confirm) {
          // 获取现有账户
          const accounts = wx.getStorageSync('accounts') || [];
          const updatedAccounts = accounts.filter(acc => acc.id !== account.id);
          
          // 保存到本地存储
          wx.setStorageSync('accounts', updatedAccounts);
          
          wx.showToast({
            title: '删除成功',
            icon: 'success'
          });
          
          // 刷新数据
          this.loadAccounts();
        }
      }
    });
  },

  // 账户详情
  onAccountDetail(e) {
    const account = e.currentTarget.dataset.account;
    wx.navigateTo({
      url: `/pages/account-detail/account-detail?id=${account.id}`
    });
  },

  onAccountTap(e) {
    const {
      id
    } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `../account-detail/account-detail?id=${id}`
    });
  }
}); 