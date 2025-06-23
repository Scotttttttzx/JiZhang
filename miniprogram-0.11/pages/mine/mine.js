Page({
  data: {
    userInfo: {},
    hasUserInfo: false,
    canIUseGetUserProfile: false,
    canIUseNicknameComp: false,
    // 添加调用时间记录
    lastGetUserProfileTime: 0,
    // 统计数据
    totalRecords: 0,
    totalExpense: '0.00',
    totalIncome: '0.00',
    totalAssets: '0.00',
    totalSaving: '0.00',
    // 功能菜单
    menuItems: [
      {
        id: 'export',
        name: '数据导出',
        icon: '📤',
        color: '#4ECDC4',
        desc: '导出记账数据'
      },
      {
        id: 'backup',
        name: '数据备份',
        icon: '💾',
        color: '#45B7D1',
        desc: '备份到云端'
      },
      {
        id: 'category',
        name: '分类管理',
        icon: '🏷️',
        color: '#96CEB4',
        desc: '管理收支分类'
      },
      {
        id: 'currency',
        name: '货币设置',
        icon: '💰',
        color: '#FFEAA7',
        desc: '设置默认货币'
      },
      {
        id: 'notification',
        name: '消息通知',
        icon: '🔔',
        color: '#DDA0DD',
        desc: '设置提醒通知'
      },
      {
        id: 'privacy',
        name: '隐私设置',
        icon: '🔒',
        color: '#98D8C8',
        desc: '隐私和安全'
      },
      {
        id: 'about',
        name: '关于我们',
        icon: 'ℹ️',
        color: '#F7DC6F',
        desc: '版本信息和帮助'
      },
      {
        id: 'feedback',
        name: '意见反馈',
        icon: '💬',
        color: '#FF6B6B',
        desc: '问题反馈和建议'
      }
    ]
  },

  onLoad() {
    this.initUserInfo();
    this.loadStatistics();
  },

  onShow() {
    this.loadStatistics();
  },

  // 初始化用户信息
  initUserInfo() {
    // 检查是否支持获取用户信息
    if (wx.getUserProfile) {
      this.setData({
        canIUseGetUserProfile: true
      });
    }
    
    // 检查是否支持昵称组件 - 简化处理
    this.setData({
      canIUseNicknameComp: false
    });

    // 获取本地存储的用户信息
    const userInfo = wx.getStorageSync('userInfo') || {};
    if (userInfo.nickName) {
      this.setData({
        userInfo,
        hasUserInfo: true
      });
    }
  },

  // 加载统计数据
  loadStatistics() {
    const records = wx.getStorageSync('records') || [];
    const accounts = wx.getStorageSync('accounts') || [];
    const savingGoals = wx.getStorageSync('savingGoals') || [];
    
    // 计算总收支
    let totalExpense = 0;
    let totalIncome = 0;
    records.forEach(record => {
      if (record.type === 'expense') {
        totalExpense += parseFloat(record.amount || 0);
      } else if (record.type === 'income') {
        totalIncome += parseFloat(record.amount || 0);
      }
    });

    // 计算总资产
    const totalAssets = accounts.reduce((sum, account) => {
      return sum + parseFloat(account.balance || 0);
    }, 0);

    // 计算总存钱
    const totalSaving = savingGoals.reduce((sum, goal) => {
      return sum + parseFloat(goal.currentAmount || 0);
    }, 0);

    this.setData({
      totalRecords: records.length,
      totalExpense: totalExpense.toFixed(2),
      totalIncome: totalIncome.toFixed(2),
      totalAssets: totalAssets.toFixed(2),
      totalSaving: totalSaving.toFixed(2)
    });
  },

  // 获取用户信息
  getUserProfile() {
    // 检查调用频率限制（5秒内只能调用一次）
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

    if (wx.getUserProfile) {
      // 更新调用时间
      this.setData({
        lastGetUserProfileTime: now
      });

      wx.getUserProfile({
        desc: '用于完善会员资料',
        success: (res) => {
          const userInfo = res.userInfo;
          try {
            wx.setStorageSync('userInfo', userInfo);
            this.setData({
              userInfo,
              hasUserInfo: true
            });
            wx.showToast({
              title: '获取成功',
              icon: 'success'
            });
          } catch (error) {
            console.log('保存用户信息失败:', error);
            wx.showToast({
              title: '保存失败',
              icon: 'error'
            });
          }
        },
        fail: (error) => {
          console.log('获取用户信息失败:', error);
          wx.showToast({
            title: '获取失败',
            icon: 'error'
          });
        }
      });
    }
  },

  // 选择头像
  onChooseAvatar(e) {
    try {
      const { avatarUrl } = e.detail;
      const userInfo = { ...this.data.userInfo, avatarUrl };
      wx.setStorageSync('userInfo', userInfo);
      this.setData({
        userInfo
      });
    } catch (error) {
      console.log('选择头像失败:', error);
    }
  },

  // 输入昵称
  onInputChange(e) {
    try {
      const nickName = e.detail.value;
      const userInfo = { ...this.data.userInfo, nickName };
      wx.setStorageSync('userInfo', userInfo);
      this.setData({
        userInfo
      });
    } catch (error) {
      console.log('输入昵称失败:', error);
    }
  },

  // 菜单项点击
  onMenuItemTap(e) {
    const itemId = e.currentTarget.dataset.id;
    
    switch (itemId) {
      case 'export':
        this.onDataExport();
        break;
      case 'backup':
        this.onDataBackup();
        break;
      case 'category':
        this.onCategoryManage();
        break;
      case 'currency':
        this.onCurrencySettings();
        break;
      case 'notification':
        this.onNotificationSettings();
        break;
      case 'privacy':
        this.onPrivacySettings();
        break;
      case 'about':
        this.onAbout();
        break;
      case 'feedback':
        this.onFeedback();
        break;
    }
  },

  // 数据导出
  onDataExport() {
    wx.showModal({
      title: '数据导出',
      content: '确定要导出所有记账数据吗？',
      success: (res) => {
        if (res.confirm) {
          try {
            const records = wx.getStorageSync('records') || [];
            const accounts = wx.getStorageSync('accounts') || [];
            const budgets = wx.getStorageSync('budgets') || [];
            const savingGoals = wx.getStorageSync('savingGoals') || [];
            
            const exportData = {
              records,
              accounts,
              budgets,
              savingGoals,
              exportTime: new Date().toISOString()
            };
            
            // 这里可以调用实际的导出功能
            console.log('导出数据:', exportData);
            
            wx.showToast({
              title: '导出成功',
              icon: 'success'
            });
          } catch (error) {
            console.log('导出数据失败:', error);
            wx.showToast({
              title: '导出失败',
              icon: 'error'
            });
          }
        }
      }
    });
  },

  // 数据备份
  onDataBackup() {
    wx.showModal({
      title: '数据备份',
      content: '确定要备份数据到云端吗？',
      success: (res) => {
        if (res.confirm) {
          wx.showToast({
            title: '备份功能开发中',
            icon: 'none'
          });
        }
      }
    });
  },

  // 分类管理
  onCategoryManage() {
    wx.showToast({
      title: '分类管理功能开发中',
      icon: 'none'
    });
  },

  // 货币设置
  onCurrencySettings() {
    wx.showActionSheet({
      itemList: ['人民币 (CNY)', '美元 (USD)', '欧元 (EUR)', '日元 (JPY)'],
      success: (res) => {
        try {
          const currencies = ['CNY', 'USD', 'EUR', 'JPY'];
          const selectedCurrency = currencies[res.tapIndex];
          wx.setStorageSync('defaultCurrency', selectedCurrency);
          wx.showToast({
            title: '设置成功',
            icon: 'success'
          });
        } catch (error) {
          console.log('设置货币失败:', error);
        }
      }
    });
  },

  // 消息通知设置
  onNotificationSettings() {
    wx.showModal({
      title: '消息通知',
      content: '是否开启记账提醒通知？',
      success: (res) => {
        if (res.confirm) {
          wx.showToast({
            title: '通知功能开发中',
            icon: 'none'
          });
        }
      }
    });
  },

  // 隐私设置
  onPrivacySettings() {
    wx.showModal({
      title: '隐私设置',
      content: '是否开启数据加密保护？',
      success: (res) => {
        if (res.confirm) {
          wx.showToast({
            title: '隐私功能开发中',
            icon: 'none'
          });
        }
      }
    });
  },

  // 关于我们
  onAbout() {
    wx.showModal({
      title: '关于我们',
      content: '记账小程序 v1.0.0\n\n一个简单易用的个人记账工具，帮助您更好地管理财务。\n\n如有问题，请联系客服。',
      showCancel: false,
      confirmText: '确定'
    });
  },

  // 意见反馈
  onFeedback() {
    wx.showModal({
      title: '意见反馈',
      content: '感谢您的使用！\n\n如有问题或建议，请通过以下方式联系我们：\n\n邮箱：feedback@example.com\n微信：feedback_wechat',
      showCancel: false,
      confirmText: '确定'
    });
  },

  // 清除数据
  onClearData() {
    wx.showModal({
      title: '清除数据',
      content: '确定要清除所有数据吗？此操作不可恢复！',
      success: (res) => {
        if (res.confirm) {
          wx.showModal({
            title: '再次确认',
            content: '真的要清除所有数据吗？',
            success: (res2) => {
              if (res2.confirm) {
                try {
                  // 清除所有本地存储数据
                  wx.clearStorageSync();
                  wx.showToast({
                    title: '数据已清除',
                    icon: 'success'
                  });
                  
                  // 重新加载页面
                  setTimeout(() => {
                    this.onLoad();
                  }, 1500);
                } catch (error) {
                  console.log('清除数据失败:', error);
                  wx.showToast({
                    title: '清除失败',
                    icon: 'error'
                  });
                }
              }
            }
          });
        }
      }
    });
  }
}); 