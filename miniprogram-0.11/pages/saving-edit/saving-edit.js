Page({
  data: {
    goal: null,
    goalTypes: [
      { id: 'travel', name: '旅行', icon: '✈️', color: '#FF6B6B' },
      { id: 'house', name: '买房', icon: '🏠', color: '#4ECDC4' },
      { id: 'car', name: '买车', icon: '🚗', color: '#45B7D1' },
      { id: 'education', name: '教育', icon: '📚', color: '#96CEB4' },
      { id: 'wedding', name: '婚礼', icon: '💒', color: '#FFEAA7' },
      { id: 'emergency', name: '应急', icon: '🛡️', color: '#DDA0DD' },
      { id: 'investment', name: '投资', icon: '📈', color: '#98D8C8' },
      { id: 'other', name: '其他', icon: '🎯', color: '#F7DC6F' }
    ],
    editedGoal: {
      name: '',
      targetAmount: '',
      deadline: '',
      remark: '',
      type: null
    }
  },

  onLoad: function (options) {
    const goalId = options.goalId;
    this.loadGoal(goalId);
  },

  // 加载目标数据
  loadGoal: function (goalId) {
    const savingGoals = wx.getStorageSync('savingGoals') || [];
    const goal = savingGoals.find(g => g.id === goalId);
    
    if (goal) {
      this.setData({
        goal,
        editedGoal: {
          name: goal.name,
          targetAmount: goal.targetAmount.toString(),
          deadline: goal.deadline || '',
          remark: goal.remark || '',
          type: goal.type
        }
      });
    } else {
      wx.showToast({
        title: '目标不存在',
        icon: 'none'
      });
      wx.navigateBack();
    }
  },

  // 目标名称输入
  onGoalNameInput: function (e) {
    this.setData({
      'editedGoal.name': e.detail.value
    });
  },

  // 目标金额输入
  onGoalAmountInput: function (e) {
    this.setData({
      'editedGoal.targetAmount': e.detail.value
    });
  },

  // 目标截止日期选择
  onGoalDeadlineChange: function (e) {
    this.setData({
      'editedGoal.deadline': e.detail.value
    });
  },

  // 目标备注输入
  onGoalRemarkInput: function (e) {
    this.setData({
      'editedGoal.remark': e.detail.value
    });
  },

  // 选择目标类型
  onSelectGoalType: function (e) {
    const type = e.currentTarget.dataset.type;
    this.setData({
      'editedGoal.type': type
    });
  },

  // 保存编辑
  onSaveGoal: function () {
    const { editedGoal, goal } = this.data;
    
    if (!editedGoal.name.trim()) {
      wx.showToast({
        title: '请输入目标名称',
        icon: 'none'
      });
      return;
    }
    
    if (!editedGoal.targetAmount || parseFloat(editedGoal.targetAmount) <= 0) {
      wx.showToast({
        title: '请输入有效目标金额',
        icon: 'none'
      });
      return;
    }

    const targetAmount = parseFloat(editedGoal.targetAmount);
    if (targetAmount < goal.currentAmount) {
      wx.showToast({
        title: '目标金额不能小于已存金额',
        icon: 'none'
      });
      return;
    }

    // 更新目标数据
    const savingGoals = wx.getStorageSync('savingGoals') || [];
    const updatedGoals = savingGoals.map(g => {
      if (g.id === goal.id) {
        return {
          ...g,
          name: editedGoal.name,
          targetAmount: targetAmount,
          deadline: editedGoal.deadline,
          remark: editedGoal.remark,
          type: editedGoal.type || g.type
        };
      }
      return g;
    });

    wx.setStorageSync('savingGoals', updatedGoals);
    
    wx.showToast({
      title: '保存成功',
      icon: 'success'
    });
    
    wx.navigateBack();
  },

  // 取消编辑
  onCancelEdit: function () {
    wx.navigateBack();
  }
}); 