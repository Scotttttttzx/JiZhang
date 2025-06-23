const app = getApp();

Page({
  data: {
    currentYear: 2024,
    currentMonth: 7,
    totalBudget: '',
    categoryBudgets: [],
    // 预设的支出分类
    expenseCategories: [
      { id: 'cate_food', name: '餐饮', icon: '🍔' },
      { id: 'cate_transport', name: '交通', icon: '🚗' },
      { id: 'cate_shopping', name: '购物', icon: '🛒' },
      { id: 'cate_housing', name: '住房', icon: '🏠' },
      { id: 'cate_entertainment', name: '娱乐', icon: '🎬' },
      { id: 'cate_health', name: '医疗', icon: '💊' },
      { id: 'cate_edu', name: '教育', icon: '📚' },
      { id: 'cate_other', name: '其它', icon: '📦' }
    ]
  },

  onLoad(options) {
    const date = new Date();
    const currentYear = date.getFullYear();
    const currentMonth = date.getMonth() + 1;

    this.setData({
      currentYear,
      currentMonth
    });

    this.loadBudgetData(currentYear, currentMonth);
  },

  loadBudgetData(year, month) {
    // 从本地存储加载预算数据
    const budgets = wx.getStorageSync('budgets') || [];
    const currentMonthBudget = budgets.find(b => b.year === year && b.month === month);

    // 获取分类数据
    const categories = this.getMockCategories();
    
    let categoryBudgets = categories.map(cat => ({
      ...cat,
      amount: ''
    }));

    if (currentMonthBudget) {
      // 如果有现有预算数据，填充到分类中
      categoryBudgets = categories.map(cat => {
        const existing = currentMonthBudget.categories ? 
          currentMonthBudget.categories.find(b => b.id === cat.id) : null;
        return {
          ...cat,
          amount: existing ? existing.amount.toString() : ''
        };
      });
    }

    this.setData({
      totalBudget: currentMonthBudget ? currentMonthBudget.amount.toString() : '',
      categoryBudgets: categoryBudgets
    });
  },

  getMockCategories() {
    // 实际项目中应从全局或服务器获取
    return [
      { id: 1, name: '餐饮', icon: '🍔' },
      { id: 2, name: '购物', icon: '🛍️' },
      { id: 3, name: '交通', icon: '🚗' },
      { id: 4, name: '娱乐', icon: '🎬' },
      { id: 5, name: '住房', icon: '🏠' },
      { id: 6, name: '医疗', icon: '💊' },
      { id: 7, name: '其他', icon: '🧾' },
    ];
  },

  // 处理总预算输入
  onTotalBudgetInput(e) {
    this.setData({
      totalBudget: e.detail.value
    });
  },

  // 处理分类预算输入
  onCategoryBudgetInput(e) {
    const { id } = e.currentTarget.dataset;
    const { value } = e.detail;
    const { categoryBudgets } = this.data;
    const index = categoryBudgets.findIndex(item => item.id == id);
    if (index !== -1) {
      this.setData({
        [`categoryBudgets[${index}].amount`]: value
      });
    }
  },

  // 保存预算
  onSaveBudget() {
    const { currentYear, currentMonth, totalBudget, categoryBudgets } = this.data;
    
    if (totalBudget === '' || parseFloat(totalBudget) <= 0) {
      wx.showToast({
        title: '请输入有效的总预算',
        icon: 'none'
      });
      return;
    }
    
    const budgets = wx.getStorageSync('budgets') || [];
    const currentMonthBudget = budgets.find(b => b.year === currentYear && b.month === currentMonth);
    
    // 只保存有输入的分类预算
    const savedCategoryBudgets = categoryBudgets.filter(cat => cat.amount && parseFloat(cat.amount) > 0).map(cat => ({
      id: cat.id,
      name: cat.name,
      icon: cat.icon,
      amount: parseFloat(cat.amount)
    }));

    if (currentMonthBudget) {
      // 如果有现有预算数据，更新现有数据
      const updatedBudget = {
        ...currentMonthBudget,
        amount: parseFloat(totalBudget),
        categories: savedCategoryBudgets
      };
      const index = budgets.findIndex(b => b.year === currentYear && b.month === currentMonth);
      if (index !== -1) {
        budgets[index] = updatedBudget;
      } else {
        budgets.push({
          year: currentYear,
          month: currentMonth,
          amount: parseFloat(totalBudget),
          categories: savedCategoryBudgets
        });
      }
    } else {
      // 如果没有现有预算数据，创建新数据
      budgets.push({
        year: currentYear,
        month: currentMonth,
        amount: parseFloat(totalBudget),
        categories: savedCategoryBudgets
      });
    }

    wx.setStorageSync('budgets', budgets);

    wx.showToast({
      title: '预算保存成功',
      icon: 'success'
    });

    // 触发前一个页面的更新
    const pages = getCurrentPages();
    if (pages.length > 1) {
      const prevPage = pages[pages.length - 2];
      if (prevPage.route === 'pages/budget/budget') {
        prevPage.onShow(); // 直接调用 onShow 重新加载数据
      }
    }

    setTimeout(() => {
      wx.navigateBack();
    }, 1500);
  }
}); 