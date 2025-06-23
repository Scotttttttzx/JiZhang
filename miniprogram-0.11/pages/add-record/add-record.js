// add-record.js
Page({
  data: {
    // 记账类型：expense(支出) 或 income(收入)
    recordType: 'expense',
    // 金额
    amount: '',
    // 分类
    categories: {
      expense: [
        { id: 1, name: '餐饮', icon: '🍽️' },
        { id: 2, name: '交通', icon: '🚗' },
        { id: 3, name: '购物', icon: '🛒' },
        { id: 4, name: '娱乐', icon: '🎮' },
        { id: 5, name: '医疗', icon: '💊' },
        { id: 6, name: '教育', icon: '📚' },
        { id: 7, name: '住房', icon: '🏠' },
        { id: 8, name: '其他', icon: '📝' }
      ],
      income: [
        { id: 9, name: '工资', icon: '💰' },
        { id: 10, name: '奖金', icon: '🎁' },
        { id: 11, name: '投资', icon: '📈' },
        { id: 12, name: '兼职', icon: '💼' },
        { id: 13, name: '红包', icon: '🧧' },
        { id: 14, name: '其他', icon: '📝' }
      ]
    },
    selectedCategory: null,
    // 备注
    remark: '',
    // 日期
    date: '',
    // 时间
    time: ''
  },

  onLoad() {
    // 设置当前日期和时间
    const now = new Date();
    const date = this.formatDate(now);
    const time = this.formatTime(now);
    
    this.setData({
      date: date,
      time: time
    });
  },

  // 切换记账类型
  onTypeChange(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({
      recordType: type,
      selectedCategory: null // 清空已选分类
    });
  },

  // 选择分类
  onCategorySelect(e) {
    const category = e.currentTarget.dataset.category;
    this.setData({
      selectedCategory: category
    });
  },

  // 输入金额
  onAmountInput(e) {
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
      amount: value
    });
  },

  // 输入备注
  onRemarkInput(e) {
    this.setData({
      remark: e.detail.value
    });
  },

  // 选择日期
  onDateChange(e) {
    this.setData({
      date: e.detail.value
    });
  },

  // 选择时间
  onTimeChange(e) {
    this.setData({
      time: e.detail.value
    });
  },

  // 保存记录
  onSaveRecord() {
    const { recordType, amount, selectedCategory, remark, date, time } = this.data;
    
    // 验证必填项
    if (!amount || parseFloat(amount) <= 0) {
      wx.showToast({
        title: '请输入有效金额',
        icon: 'none'
      });
      return;
    }
    
    if (!selectedCategory) {
      wx.showToast({
        title: '请选择分类',
        icon: 'none'
      });
      return;
    }

    // 创建记录对象
    const record = {
      id: Date.now(),
      type: recordType,
      amount: parseFloat(amount),
      category: selectedCategory,
      remark: remark,
      date: date,
      time: time,
      createTime: new Date().getTime()
    };

    // 获取现有记录
    const records = wx.getStorageSync('records') || [];
    records.unshift(record);
    
    // 保存到本地存储
    wx.setStorageSync('records', records);

    wx.showToast({
      title: '记录成功',
      icon: 'success',
      duration: 1500
    });

    // 延迟返回上一页
    setTimeout(() => {
      wx.navigateBack();
    }, 1500);
  },

  // 格式化日期
  formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  // 格式化时间
  formatTime(date) {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }
}); 