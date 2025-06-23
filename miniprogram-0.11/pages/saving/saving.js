// pages/saving/saving.js
Page({
  data: {
    // 存钱目标列表
    savingGoals: [],
    // 存钱记录列表
    savingRecords: [],
    // 总存钱金额
    totalSaved: '0.00',
    // 显示添加目标弹窗
    showAddGoalModal: false,
    // 显示添加记录弹窗
    showAddRecordModal: false,
    // 新目标数据
    newGoal: {
      name: '',
      targetAmount: '',
      currentAmount: '0',
      deadline: '',
      remark: ''
    },
    // 新记录数据
    newRecord: {
      goalId: '',
      amount: '',
      remark: ''
    },
    // 目标类型
    goalTypes: [
      { id: 'travel', name: '旅行', icon: '✈️', color: '#FF6B6B' },
      { id: 'house', name: '买房', icon: '🏠', color: '#4ECDC4' },
      { id: 'car', name: '买车', icon: '🚗', color: '#45B7D1' },
      { id: 'education', name: '教育', icon: '📚', color: '#96CEB4' },
      { id: 'wedding', name: '婚礼', icon: '💒', color: '#FFEAA7' },
      { id: 'emergency', name: '应急', icon: '🛡️', color: '#DDA0DD' },
      { id: 'investment', name: '投资', icon: '📈', color: '#98D8C8' },
      { id: 'other', name: '其他', icon: '🎯', color: '#F7DC6F' }
    ]
  },

  onLoad: function (options) {
    this.loadSavingData();
  },

  onShow: function () {
    this.loadSavingData();
  },

  // 加载存钱数据
  loadSavingData: function () {
    // 从本地存储加载数据
    const savingGoals = wx.getStorageSync('savingGoals') || [];
    const savingRecords = wx.getStorageSync('savingRecords') || [];
    
    // 为记录添加目标名称
    const recordsWithGoalName = savingRecords.map(record => {
      const goal = savingGoals.find(g => g.id === record.goalId);
      return {
        ...record,
        goalName: goal ? goal.name : '未知目标'
      };
    });
    
    // 为目标添加百分比计算
    const goalsWithPercentage = savingGoals.map(goal => {
      const targetAmount = parseFloat(goal.targetAmount) || 0;
      const currentAmount = parseFloat(goal.currentAmount) || 0;
      return {
        ...goal,
        targetAmount: targetAmount,
        currentAmount: currentAmount
      };
    });
    
    // 计算总存钱金额
    let totalSaved = 0;
    savingGoals.forEach(goal => {
      totalSaved += parseFloat(goal.currentAmount || 0);
    });

    this.setData({
      savingGoals: goalsWithPercentage,
      savingRecords: recordsWithGoalName,
      totalSaved: totalSaved.toFixed(2)
    });
  },

  // 显示添加目标弹窗
  onShowAddGoalModal: function () {
    this.setData({
      showAddGoalModal: true,
      newGoal: {
        name: '',
        targetAmount: '',
        currentAmount: '0',
        deadline: '',
        remark: ''
      }
    });
  },

  // 隐藏添加目标弹窗
  onHideAddGoalModal: function () {
    this.setData({
      showAddGoalModal: false
    });
  },

  // 目标名称输入
  onGoalNameInput: function (e) {
    this.setData({
      'newGoal.name': e.detail.value
    });
  },

  // 目标金额输入
  onGoalAmountInput: function (e) {
    this.setData({
      'newGoal.targetAmount': e.detail.value
    });
  },

  // 目标截止日期选择
  onGoalDeadlineChange: function (e) {
    this.setData({
      'newGoal.deadline': e.detail.value
    });
  },

  // 目标备注输入
  onGoalRemarkInput: function (e) {
    this.setData({
      'newGoal.remark': e.detail.value
    });
  },

  // 添加存钱目标
  onAddGoal: function () {
    const { newGoal, goalTypes } = this.data;
    
    if (!newGoal.name.trim()) {
      wx.showToast({
        title: '请输入目标名称',
        icon: 'none'
      });
      return;
    }
    
    if (!newGoal.targetAmount || parseFloat(newGoal.targetAmount) <= 0) {
      wx.showToast({
        title: '请输入有效目标金额',
        icon: 'none'
      });
      return;
    }

    const goal = {
      id: Date.now().toString(),
      name: newGoal.name,
      targetAmount: parseFloat(newGoal.targetAmount),
      currentAmount: 0,
      deadline: newGoal.deadline,
      remark: newGoal.remark,
      type: goalTypes[0], // 默认类型
      createTime: new Date().toISOString()
    };

    const savingGoals = [...this.data.savingGoals, goal];
    wx.setStorageSync('savingGoals', savingGoals);
    
    this.setData({
      savingGoals,
      showAddGoalModal: false
    });

    wx.showToast({
      title: '添加成功',
      icon: 'success'
    });
  },

  // 显示添加记录弹窗
  onShowAddRecordModal: function (e) {
    const goalId = e.currentTarget.dataset.goalId;
    this.setData({
      showAddRecordModal: true,
      'newRecord.goalId': goalId,
      'newRecord.amount': '',
      'newRecord.remark': ''
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
    const { newRecord, savingGoals } = this.data;
    
    if (!newRecord.amount || parseFloat(newRecord.amount) <= 0) {
      wx.showToast({
        title: '请输入有效金额',
        icon: 'none'
      });
      return;
    }

    const goal = savingGoals.find(g => g.id === newRecord.goalId);
    if (!goal) {
      wx.showToast({
        title: '目标不存在',
        icon: 'none'
      });
      return;
    }

    const record = {
      id: Date.now().toString(),
      goalId: newRecord.goalId,
      goalName: goal.name,
      amount: parseFloat(newRecord.amount),
      remark: newRecord.remark,
      createTime: new Date().toISOString()
    };

    const updatedGoals = savingGoals.map(g => {
      if (g.id === newRecord.goalId) {
        const currentAmount = parseFloat(g.currentAmount) || 0;
        const newAmount = parseFloat(newRecord.amount) || 0;
        return {
          ...g,
          currentAmount: currentAmount + newAmount
        };
      }
      return g;
    });

    const savingRecords = [...this.data.savingRecords, record];
    wx.setStorageSync('savingRecords', savingRecords);
    wx.setStorageSync('savingGoals', updatedGoals);
    
    this.setData({
      savingGoals: updatedGoals,
      savingRecords,
      showAddRecordModal: false
    });

    wx.showToast({
      title: '存钱成功',
      icon: 'success'
    });
  },

  // 查看目标详情
  onGoalDetail: function (e) {
    const goal = e.currentTarget.dataset.goal;
    wx.navigateTo({
      url: `/pages/saving-detail/saving-detail?goalId=${goal.id}`
    });
  },

  // 删除目标
  onDeleteGoal: function (e) {
    const goal = e.currentTarget.dataset.goal;
    
    wx.showModal({
      title: '确认删除',
      content: `确定要删除目标"${goal.name}"吗？`,
      success: (res) => {
        if (res.confirm) {
          const savingGoals = this.data.savingGoals.filter(g => g.id !== goal.id);
          const savingRecords = this.data.savingRecords.filter(r => r.goalId !== goal.id);
          
          wx.setStorageSync('savingGoals', savingGoals);
          wx.setStorageSync('savingRecords', savingRecords);
          
          this.setData({
            savingGoals,
            savingRecords
          });

          wx.showToast({
            title: '删除成功',
            icon: 'success'
          });
        }
      }
    });
  },

  // 阻止事件冒泡
  stopPropagation: function () {}
}); 