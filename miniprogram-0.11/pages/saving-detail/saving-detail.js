Page({
  data: {
    goal: null,
    records: [],
    showAddRecordModal: false,
    newRecord: {
      amount: '',
      remark: ''
    }
  },

  onLoad: function (options) {
    const goalId = options.goalId;
    this.loadGoalDetail(goalId);
  },

  onShow: function () {
    if (this.data.goal) {
      this.loadGoalDetail(this.data.goal.id);
    }
  },

  // 加载目标详情
  loadGoalDetail: function (goalId) {
    const savingGoals = wx.getStorageSync('savingGoals') || [];
    const savingRecords = wx.getStorageSync('savingRecords') || [];
    
    const goal = savingGoals.find(g => g.id === goalId);
    const records = savingRecords.filter(r => r.goalId === goalId);
    
    if (goal) {
      // 确保数据类型为数字
      const targetAmount = parseFloat(goal.targetAmount) || 0;
      const currentAmount = parseFloat(goal.currentAmount) || 0;
      
      // 计算剩余金额
      const remainingAmount = Math.round(targetAmount - currentAmount);
      
      const goalWithCalculations = {
        ...goal,
        targetAmount: targetAmount,
        currentAmount: currentAmount,
        remainingAmount: remainingAmount
      };
      
      this.setData({
        goal: goalWithCalculations,
        records: records.sort((a, b) => new Date(b.createTime) - new Date(a.createTime))
      });
    } else {
      wx.showToast({
        title: '目标不存在',
        icon: 'none'
      });
      wx.navigateBack();
    }
  },

  // 显示添加记录弹窗
  onShowAddRecordModal: function () {
    this.setData({
      showAddRecordModal: true,
      newRecord: {
        amount: '',
        remark: ''
      }
    });
  },

  // 隐藏添加记录弹窗
  onHideAddRecordModal: function () {
    this.setData({
      showAddRecordModal: false
    });
  },

  // 记录金额输入
  onRecordAmountInput: function (e) {
    this.setData({
      'newRecord.amount': e.detail.value
    });
  },

  // 记录备注输入
  onRecordRemarkInput: function (e) {
    this.setData({
      'newRecord.remark': e.detail.value
    });
  },

  // 添加存钱记录
  onAddRecord: function () {
    const { newRecord, goal } = this.data;
    
    if (!newRecord.amount || parseFloat(newRecord.amount) <= 0) {
      wx.showToast({
        title: '请输入有效金额',
        icon: 'none'
      });
      return;
    }

    const record = {
      id: Date.now().toString(),
      goalId: goal.id,
      amount: parseFloat(newRecord.amount),
      remark: newRecord.remark,
      createTime: new Date().toISOString()
    };

    // 更新目标当前金额
    const savingGoals = wx.getStorageSync('savingGoals') || [];
    const updatedGoals = savingGoals.map(g => {
      if (g.id === goal.id) {
        const currentAmount = parseFloat(g.currentAmount) || 0;
        const newAmount = parseFloat(newRecord.amount) || 0;
        return {
          ...g,
          currentAmount: currentAmount + newAmount
        };
      }
      return g;
    });

    // 保存记录和目标
    const savingRecords = wx.getStorageSync('savingRecords') || [];
    const updatedRecords = [...savingRecords, record];
    
    wx.setStorageSync('savingRecords', updatedRecords);
    wx.setStorageSync('savingGoals', updatedGoals);
    
    // 更新页面数据
    const updatedGoal = updatedGoals.find(g => g.id === goal.id);
    const goalRecords = updatedRecords.filter(r => r.goalId === goal.id);
    
    // 确保数据类型为数字
    const targetAmount = parseFloat(updatedGoal.targetAmount) || 0;
    const currentAmount = parseFloat(updatedGoal.currentAmount) || 0;
    
    // 重新计算剩余金额
    const remainingAmount = Math.round(targetAmount - currentAmount);
    
    const goalWithCalculations = {
      ...updatedGoal,
      targetAmount: targetAmount,
      currentAmount: currentAmount,
      remainingAmount: remainingAmount
    };
    
    this.setData({
      goal: goalWithCalculations,
      records: goalRecords.sort((a, b) => new Date(b.createTime) - new Date(a.createTime)),
      showAddRecordModal: false
    });

    wx.showToast({
      title: '存钱成功',
      icon: 'success'
    });
  },

  // 删除记录
  onDeleteRecord: function (e) {
    const record = e.currentTarget.dataset.record;
    const { goal } = this.data;
    
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这条存钱记录吗？',
      success: (res) => {
        if (res.confirm) {
          const savingRecords = wx.getStorageSync('savingRecords') || [];
          const updatedRecords = savingRecords.filter(r => r.id !== record.id);
          
          // 更新目标当前金额
          const savingGoals = wx.getStorageSync('savingGoals') || [];
          const updatedGoals = savingGoals.map(g => {
            if (g.id === goal.id) {
              const currentAmount = parseFloat(g.currentAmount) || 0;
              const recordAmount = parseFloat(record.amount) || 0;
              return {
                ...g,
                currentAmount: currentAmount - recordAmount
              };
            }
            return g;
          });
          
          wx.setStorageSync('savingRecords', updatedRecords);
          wx.setStorageSync('savingGoals', updatedGoals);
          
          // 更新页面数据
          const updatedGoal = updatedGoals.find(g => g.id === goal.id);
          const goalRecords = updatedRecords.filter(r => r.goalId === goal.id);
          
          // 确保数据类型为数字
          const targetAmount = parseFloat(updatedGoal.targetAmount) || 0;
          const currentAmount = parseFloat(updatedGoal.currentAmount) || 0;
          
          // 重新计算剩余金额
          const remainingAmount = Math.round(targetAmount - currentAmount);
          
          const goalWithCalculations = {
            ...updatedGoal,
            targetAmount: targetAmount,
            currentAmount: currentAmount,
            remainingAmount: remainingAmount
          };
          
          this.setData({
            goal: goalWithCalculations,
            records: goalRecords.sort((a, b) => new Date(b.createTime) - new Date(a.createTime))
          });

          wx.showToast({
            title: '删除成功',
            icon: 'success'
          });
        }
      }
    });
  },

  // 编辑目标
  onEditGoal: function () {
    wx.navigateTo({
      url: `/pages/saving-edit/saving-edit?goalId=${this.data.goal.id}`
    });
  },

  // 删除目标
  onDeleteGoal: function () {
    const { goal } = this.data;
    
    wx.showModal({
      title: '确认删除',
      content: `确定要删除目标"${goal.name}"吗？这将同时删除所有相关记录。`,
      success: (res) => {
        if (res.confirm) {
          const savingGoals = wx.getStorageSync('savingGoals') || [];
          const savingRecords = wx.getStorageSync('savingRecords') || [];
          
          const updatedGoals = savingGoals.filter(g => g.id !== goal.id);
          const updatedRecords = savingRecords.filter(r => r.goalId !== goal.id);
          
          wx.setStorageSync('savingGoals', updatedGoals);
          wx.setStorageSync('savingRecords', updatedRecords);
          
          wx.showToast({
            title: '删除成功',
            icon: 'success'
          });
          
          wx.navigateBack();
        }
      }
    });
  },

  // 阻止事件冒泡
  stopPropagation: function () {}
}); 