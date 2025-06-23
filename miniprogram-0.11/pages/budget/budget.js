// budget.js
Page({
  data: {
    // 当前年月
    currentYear: 2024,
    currentMonth: 7,
    // 预算列表
    budgets: [],
    // 总预算
    totalBudget: '0.00',
    // 已支出
    totalExpense: '0.00',
    // 剩余预算
    remainingAmount: '0.00',
    // 剩余预算百分比
    remainingPercentage: 100,
    // 预算分类
    budgetCategories: [
      { id: 1, name: '餐饮', icon: '🍽️', color: '#ff6b35' },
      { id: 2, name: '交通', icon: '🚗', color: '#357aff' },
      { id: 3, name: '购物', icon: '🛒', color: '#ffa502' },
      { id: 4, name: '娱乐', icon: '🎮', color: '#ff4757' },
      { id: 5, name: '医疗', icon: '💊', color: '#27c27c' },
      { id: 6, name: '教育', icon: '📚', color: '#8e44ad' },
      { id: 7, name: '住房', icon: '🏠', color: '#ff6b6b' },
      { id: 8, name: '其他', icon: '📝', color: '#747d8c' }
    ],
    // 显示添加预算弹窗
    showAddModal: false,
    // 新预算信息
    newBudget: {
      category: null,
      amount: '',
      remark: ''
    },
    categoryBudgets: []
  },

  onLoad() {
    this.initDate();
  },

  onShow() {
    this.loadBudgetData();
  },

  initDate() {
    const now = new Date();
    this.setData({
      currentYear: now.getFullYear(),
      currentMonth: now.getMonth() + 1
    });
  },

  // 加载预算数据
  loadBudgetData() {
    const { currentYear, currentMonth } = this.data;
    const budgets = wx.getStorageSync('budgets') || [];
    const records = wx.getStorageSync('records') || [];

    // 筛选当前月份的预算
    const currentMonthBudget = budgets.find(b => b.year === currentYear && b.month === currentMonth);

    if (!currentMonthBudget) {
      this.setData({
        totalBudget: '0.00',
        totalExpense: '0.00',
        remainingAmount: '0.00',
        remainingPercentage: 100,
        categoryBudgets: []
      });
      return;
    }

    const totalBudget = parseFloat(currentMonthBudget.amount) || 0;
    const categoryBudgets = currentMonthBudget.categories || [];

    // 筛选当前月份的支出记录
    const currentMonthExpenses = records.filter(r => {
      const recordDate = new Date(r.date);
      return r.type === 'expense' &&
             recordDate.getFullYear() === currentYear &&
             recordDate.getMonth() + 1 === currentMonth;
    });
    
    // 计算总支出
    const totalExpense = currentMonthExpenses.reduce((sum, r) => sum + parseFloat(r.amount), 0);

    // 计算各分类支出和进度
    const processedCategoryBudgets = categoryBudgets.map(catBudget => {
      const categoryExpense = currentMonthExpenses
        .filter(r => r.category && r.category.id === catBudget.id)
        .reduce((sum, r) => sum + parseFloat(r.amount), 0);
      
      const percentage = (catBudget.amount > 0) ? Math.min((categoryExpense / catBudget.amount) * 100, 100) : 0;
      const remaining = Math.max(catBudget.amount - categoryExpense, 0);
      
      return {
        ...catBudget,
        expense: categoryExpense.toFixed(2),
        percentage: percentage.toFixed(1),
        remaining: remaining.toFixed(2)
      };
    });
    
    const remainingAmount = totalBudget - totalExpense;
    const remainingPercentage = totalBudget > 0 ? Math.max((remainingAmount / totalBudget) * 100, 0) : 0;

    this.setData({
      totalBudget: totalBudget.toFixed(2),
      totalExpense: totalExpense.toFixed(2),
      remainingAmount: remainingAmount.toFixed(2),
      remainingPercentage: remainingPercentage.toFixed(2),
      categoryBudgets: processedCategoryBudgets
    });
  },

  onDateChange(e) {
    const [year, month] = e.detail.value.split('-').map(Number);
    this.setData({
      currentYear: year,
      currentMonth: month
    });
    this.loadBudgetData();
  },

  // 显示添加预算弹窗
  onShowAddModal() {
    this.setData({
      showAddModal: true,
      newBudget: {
        category: null,
        amount: '',
        remark: ''
      }
    });
  },

  // 隐藏添加预算弹窗
  onHideAddModal() {
    this.setData({
      showAddModal: false
    });
  },

  // 选择预算分类
  onSelectBudgetCategory(e) {
    const category = e.currentTarget.dataset.category;
    this.setData({
      'newBudget.category': category
    });
  },

  // 输入预算金额
  onBudgetAmountInput(e) {
    let value = e.detail.value;
    // 只允许输入数字和小数点
    value = value.replace(/[^\d.]/g, '');
    // 限制小数点后两位
    if (value.includes('.')) {
      const parts = value.split('.');
      if (parts[1].length > 2) {
        value = parts[0] + '.' + parts[1].substring(0, 2);
      }
    }
    this.setData({
      'newBudget.amount': value
    });
  },

  // 输入预算备注
  onBudgetRemarkInput(e) {
    this.setData({
      'newBudget.remark': e.detail.value
    });
  },

  // 添加预算
  onAddBudget() {
    const { category, amount, remark } = this.data.newBudget;
    const { currentYear, currentMonth } = this.data;
    
    // 验证必填项
    if (!category) {
      wx.showToast({
        title: '请选择预算分类',
        icon: 'none'
      });
      return;
    }
    
    if (!amount || parseFloat(amount) <= 0) {
      wx.showToast({
        title: '请输入有效金额',
        icon: 'none'
      });
      return;
    }

    // 检查是否已存在该分类的预算
    const existingBudget = this.data.budgets.find(budget => budget.category.id === category.id);
    if (existingBudget) {
      wx.showToast({
        title: '该分类已有预算',
        icon: 'none'
      });
      return;
    }

    // 创建新预算
    const newBudget = {
      id: Date.now(),
      category: category,
      amount: parseFloat(amount),
      remark: remark.trim(),
      year: currentYear,
      month: currentMonth,
      createTime: new Date().getTime()
    };

    // 获取现有预算
    const budgets = wx.getStorageSync('budgets') || [];
    budgets.push(newBudget);
    
    // 保存到本地存储
    wx.setStorageSync('budgets', budgets);

    wx.showToast({
      title: '添加成功',
      icon: 'success'
    });

    // 关闭弹窗并刷新数据
    this.onHideAddModal();
    this.loadBudgetData();
  },

  // 删除预算
  onDeleteBudget(e) {
    const budget = e.currentTarget.dataset.budget;
    wx.showModal({
      title: '删除预算',
      content: `确定要删除"${budget.category.name}"的预算吗？`,
      success: (res) => {
        if (res.confirm) {
          // 获取现有预算
          const budgets = wx.getStorageSync('budgets') || [];
          const updatedBudgets = budgets.filter(b => b.id !== budget.id);
          
          // 保存到本地存储
          wx.setStorageSync('budgets', updatedBudgets);
          
          wx.showToast({
            title: '删除成功',
            icon: 'success'
          });
          
          // 刷新数据
          this.loadBudgetData();
        }
      }
    });
  },

  // 计算预算使用率
  calculateUsageRate(budget) {
    const { currentYear, currentMonth } = this.data;
    const records = wx.getStorageSync('records') || [];
    
    // 获取该分类在当前月份的实际支出
    const categoryExpenses = records.filter(record => {
      const recordDate = new Date(record.date);
      return recordDate.getFullYear() === currentYear && 
             recordDate.getMonth() + 1 === currentMonth && 
             record.type === 'expense' &&
             record.category.id === budget.category.id;
    });
    
    const totalExpense = categoryExpenses.reduce((sum, record) => sum + record.amount, 0);
    const usageRate = (totalExpense / budget.amount) * 100;
    
    return {
      expense: totalExpense,
      rate: Math.min(usageRate, 100),
      remaining: Math.max(budget.amount - totalExpense, 0)
    };
  },

  // 获取进度条颜色
  getProgressColor(rate) {
    if (rate >= 90) return '#ff4757';
    if (rate >= 70) return '#ffa502';
    return '#27c27c';
  },

  // 预算详情
  onBudgetDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/budget-detail/budget-detail?id=${id}`
    });
  },

  onSetBudget() {
    wx.navigateTo({
      url: '../budget-detail/budget-detail'
    });
  }
}); 