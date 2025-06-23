Page({
  data: {
    messages: [],
    inputValue: '',
    isLoading: false,
    // Moonshot API密钥
    apiKey: 'sk-tC1gGheeuz3JSWf3w3RIxPjq4GP4gH41aKNwEfhb7sfXdu2B',
    // 用户财务数据
    userData: {
      records: [],
      accounts: [],
      budgets: [],
      savingGoals: []
    },
    // 聊天记录ID
    chatId: null,
    // 聊天记录管理
    showHistory: false,
    chatHistories: []
  },

  onLoad() {
    this.loadUserData();
    this.initChat();
  },

  onShow() {
    this.loadUserData();
  },

  onHide() {
    // 页面隐藏时保存聊天记录
    this.saveChatHistory();
  },

  onUnload() {
    // 页面卸载时保存聊天记录
    this.saveChatHistory();
  },

  // 加载用户财务数据
  loadUserData() {
    try {
      const records = wx.getStorageSync('records') || [];
      const accounts = wx.getStorageSync('accounts') || [];
      const budgets = wx.getStorageSync('budgets') || [];
      const savingGoals = wx.getStorageSync('savingGoals') || [];
      
      this.setData({
        'userData.records': records,
        'userData.accounts': accounts,
        'userData.budgets': budgets,
        'userData.savingGoals': savingGoals
      });
    } catch (error) {
      console.error('加载用户数据失败:', error);
    }
  },

  // 初始化聊天
  initChat() {
    // 生成或获取聊天ID
    const chatId = this.generateChatId();
    this.setData({ chatId });
    
    // 尝试加载历史聊天记录
    const chatHistory = this.loadChatHistory(chatId);
    
    if (chatHistory && chatHistory.messages && chatHistory.messages.length > 0) {
      // 如果有历史记录，直接加载
      this.setData({
        messages: chatHistory.messages
      });
    } else {
      // 如果没有历史记录，显示欢迎消息
      const welcomeMessage = {
        role: 'assistant',
        content: `👋 你好！我是 **FinGuide**，您的专业私人财务分析师！

💡 我可以帮您：
• 📝 智能记账：解析消费文本，自动分类
• 📊 财务分析：生成可视化报告和关键指标
• 💡 主动建议：发现异常消费，提供优化方案
• 🎯 目标管理：跟踪储蓄进度，给予鼓励

🔧 常用指令：
• "记录支出 28 餐饮 午餐"
• "查询本月餐饮支出"
• "分析我的消费习惯"
• "删除最新一笔记录"

💬 智能记账：直接告诉我您的消费，我会自动帮您记录！
例如："今天午餐花了28元"、"打车15元"、"买咖啡25元"

有什么可以帮您的吗？`
      };
      
      this.setData({
        messages: [welcomeMessage]
      });
    }
  },

  // 生成聊天ID
  generateChatId() {
    const chatId = 'chat_' + Date.now();
    return chatId;
  },

  // 加载聊天历史
  loadChatHistory(chatId) {
    try {
      const chatHistories = wx.getStorageSync('chatHistories') || {};
      return chatHistories[chatId] || null;
    } catch (error) {
      console.error('加载聊天历史失败:', error);
      return null;
    }
  },

  // 保存聊天记录
  saveChatHistory() {
    try {
      const { messages, chatId } = this.data;
      if (!messages || messages.length === 0) return;
      
      const chatHistories = wx.getStorageSync('chatHistories') || {};
      chatHistories[chatId] = {
        id: chatId,
        messages: messages,
        lastUpdate: new Date().toISOString(),
        messageCount: messages.length
      };
      
      wx.setStorageSync('chatHistories', chatHistories);
    } catch (error) {
      console.error('保存聊天历史失败:', error);
    }
  },

  onInput(e) {
    this.setData({
      inputValue: e.detail.value
    });
  },

  onSend() {
    const userInput = this.data.inputValue.trim();
    if (!userInput) return;

    // 将用户消息添加到消息列表
    const userMessage = { role: 'user', content: userInput };
    this.setData({
      messages: [...this.data.messages, userMessage],
      inputValue: '',
      isLoading: true
    });
    this.scrollToBottom();

    // 先尝试智能记账识别
    const autoRecord = this.autoDetectExpense(userInput);
    if (autoRecord) {
      this.handleAutoRecord(autoRecord, userInput);
    } else {
      // 再尝试本地处理智能指令
      const localResponse = this.processLocalCommand(userInput);
      if (localResponse) {
        this.handleLocalResponse(localResponse);
      } else {
        // 调用AI API进行复杂分析
        this.getAiReply(userInput);
      }
    }
  },

  // 自动检测消费文本
  autoDetectExpense(input) {
    const lowerInput = input.toLowerCase();
    
    // 跳过明确的指令
    if (lowerInput.includes('记录支出') || 
        lowerInput.includes('查询') || 
        lowerInput.includes('分析') || 
        lowerInput.includes('删除') ||
        lowerInput.includes('报告')) {
      return null;
    }
    
    // 消费金额识别模式
    const expensePatterns = [
      // 模式1: 花了X元
      /花了\s*(\d+(?:\.\d+)?)\s*元/,
      // 模式2: 消费X元
      /消费\s*(\d+(?:\.\d+)?)\s*元/,
      // 模式3: 支付X元
      /支付\s*(\d+(?:\.\d+)?)\s*元/,
      // 模式4: 买X花了Y元
      /买[^了]*了\s*(\d+(?:\.\d+)?)\s*元/,
      // 模式5: X元
      /(\d+(?:\.\d+)?)\s*元/,
      // 模式6: ￥X
      /￥\s*(\d+(?:\.\d+)?)/,
      // 模式7: ¥X
      /¥\s*(\d+(?:\.\d+)?)/
    ];
    
    let amount = null;
    let matchedPattern = null;
    
    for (let pattern of expensePatterns) {
      const match = input.match(pattern);
      if (match) {
        amount = parseFloat(match[1]);
        matchedPattern = pattern;
        break;
      }
    }
    
    if (!amount || amount <= 0) return null;
    
    // 智能分类识别
    const category = this.autoDetectCategory(input);
    
    return {
      amount: amount,
      category: category,
      remark: this.extractRemark(input, amount),
      confidence: this.calculateConfidence(input, amount, category)
    };
  },

  // 自动检测消费分类
  autoDetectCategory(input) {
    const lowerInput = input.toLowerCase();
    
    // 餐饮类
    if (lowerInput.includes('午餐') || lowerInput.includes('晚餐') || 
        lowerInput.includes('早餐') || lowerInput.includes('夜宵') ||
        lowerInput.includes('外卖') || lowerInput.includes('餐厅') ||
        lowerInput.includes('咖啡') || lowerInput.includes('奶茶') ||
        lowerInput.includes('零食') || lowerInput.includes('水果') ||
        lowerInput.includes('饮料') || lowerInput.includes('小吃')) {
      return '餐饮';
    }
    
    // 交通类
    if (lowerInput.includes('打车') || lowerInput.includes('地铁') ||
        lowerInput.includes('公交') || lowerInput.includes('出租车') ||
        lowerInput.includes('滴滴') || lowerInput.includes('共享单车') ||
        lowerInput.includes('停车') || lowerInput.includes('加油')) {
      return '交通';
    }
    
    // 购物类
    if (lowerInput.includes('买') || lowerInput.includes('购物') ||
        lowerInput.includes('衣服') || lowerInput.includes('鞋子') ||
        lowerInput.includes('包包') || lowerInput.includes('化妆品') ||
        lowerInput.includes('数码') || lowerInput.includes('手机') ||
        lowerInput.includes('电脑') || lowerInput.includes('书籍')) {
      return '购物';
    }
    
    // 娱乐类
    if (lowerInput.includes('电影') || lowerInput.includes('游戏') ||
        lowerInput.includes('ktv') || lowerInput.includes('酒吧') ||
        lowerInput.includes('旅游') || lowerInput.includes('门票') ||
        lowerInput.includes('演唱会') || lowerInput.includes('游乐场')) {
      return '娱乐';
    }
    
    // 住房类
    if (lowerInput.includes('房租') || lowerInput.includes('水电') ||
        lowerInput.includes('物业') || lowerInput.includes('维修') ||
        lowerInput.includes('家具') || lowerInput.includes('家电')) {
      return '住房';
    }
    
    // 医疗类
    if (lowerInput.includes('医院') || lowerInput.includes('药') ||
        lowerInput.includes('看病') || lowerInput.includes('体检') ||
        lowerInput.includes('挂号') || lowerInput.includes('治疗')) {
      return '医疗';
    }
    
    // 教育类
    if (lowerInput.includes('学费') || lowerInput.includes('培训') ||
        lowerInput.includes('课程') || lowerInput.includes('考试') ||
        lowerInput.includes('学习') || lowerInput.includes('教育')) {
      return '教育';
    }
    
    // 默认分类
    return '其他';
  },

  // 提取备注信息
  extractRemark(input, amount) {
    // 移除金额信息
    let remark = input.replace(/\d+(?:\.\d+)?\s*元/g, '')
                     .replace(/￥\s*\d+(?:\.\d+)?/g, '')
                     .replace(/¥\s*\d+(?:\.\d+)?/g, '')
                     .replace(/花了/g, '')
                     .replace(/消费/g, '')
                     .replace(/支付/g, '')
                     .replace(/买了/g, '')
                     .trim();
    
    // 如果备注为空，使用原输入作为备注
    if (!remark) {
      remark = input;
    }
    
    return remark;
  },

  // 计算置信度
  calculateConfidence(input, amount, category) {
    let confidence = 0.5; // 基础置信度
    
    // 金额合理性检查
    if (amount > 0 && amount < 10000) {
      confidence += 0.2;
    }
    
    // 分类匹配度
    if (category !== '其他') {
      confidence += 0.2;
    }
    
    // 输入长度合理性
    if (input.length >= 5 && input.length <= 50) {
      confidence += 0.1;
    }
    
    return Math.min(confidence, 1.0);
  },

  // 处理自动记账
  handleAutoRecord(autoRecord, originalInput) {
    const { amount, category, remark, confidence } = autoRecord;
    
    if (confidence >= 0.7) {
      // 高置信度，直接记录
      this.createExpenseRecord(amount, category, remark, originalInput);
    } else {
      // 低置信度，询问用户确认
      this.askForConfirmation(autoRecord, originalInput);
    }
  },

  // 创建支出记录
  createExpenseRecord(amount, category, remark, originalInput) {
    const newRecord = {
      id: 'record_' + Date.now(),
      type: 'expense',
      amount: amount,
      category: {
        name: category,
        icon: this.getCategoryIcon(category)
      },
      remark: remark,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().split(' ')[0],
      accountId: 'default',
      source: 'FinGuide智能记账'
    };
    
    // 保存到本地存储
    const records = wx.getStorageSync('records') || [];
    records.unshift(newRecord);
    wx.setStorageSync('records', records);
    
    // 更新数据
    this.loadUserData();
    
    // 发送确认消息
    const confirmMessage = {
      role: 'assistant',
      content: `✅ 智能记账成功！
💰 支出：¥${amount.toFixed(2)}
📂 分类：${category}
📝 备注：${remark}
⏰ 时间：${newRecord.date} ${newRecord.time}

💡 如需修改，请告诉我正确的信息。`,
      type: 'success'
    };
    
    this.setData({
      messages: [...this.data.messages, confirmMessage],
      isLoading: false
    });
    this.scrollToBottom();
  },

  // 询问用户确认
  askForConfirmation(autoRecord, originalInput) {
    const { amount, category, remark } = autoRecord;
    
    const confirmMessage = {
      role: 'assistant',
      content: `🤔 我检测到您可能有一笔消费：
💰 金额：¥${amount.toFixed(2)}
📂 分类：${category}
📝 备注：${remark}

这是正确的吗？请回复：
• "是" - 确认记录
• "不是" - 取消记录
• 或告诉我正确的信息`,
      type: 'info',
      pendingRecord: autoRecord,
      originalInput: originalInput
    };
    
    this.setData({
      messages: [...this.data.messages, confirmMessage],
      isLoading: false
    });
    this.scrollToBottom();
  },

  // 处理本地智能指令
  processLocalCommand(input) {
    const lowerInput = input.toLowerCase();
    
    // 处理确认回复
    if (lowerInput === '是' || lowerInput === '对的' || lowerInput === '正确') {
      return this.handleConfirmation(true);
    }
    
    if (lowerInput === '不是' || lowerInput === '不对' || lowerInput === '错误') {
      return this.handleConfirmation(false);
    }
    
    // 智能记账指令
    if (lowerInput.includes('记录支出') || lowerInput.includes('记一笔')) {
      return this.processExpenseRecord(input);
    }
    
    // 查询指令
    if (lowerInput.includes('查询') || lowerInput.includes('查看')) {
      return this.processQueryCommand(input);
    }
    
    // 删除指令
    if (lowerInput.includes('删除') || lowerInput.includes('撤销')) {
      return this.processDeleteCommand(input);
    }
    
    // 分析指令
    if (lowerInput.includes('分析') || lowerInput.includes('报告')) {
      return this.generateFinancialReport();
    }
    
    return null; // 需要AI处理
  },

  // 处理确认回复
  handleConfirmation(isConfirmed) {
    const lastMessage = this.data.messages[this.data.messages.length - 1];
    
    if (lastMessage.pendingRecord) {
      if (isConfirmed) {
        const { amount, category, remark } = lastMessage.pendingRecord;
        this.createExpenseRecord(amount, category, remark, lastMessage.originalInput);
      } else {
        const cancelMessage = {
          role: 'assistant',
          content: '❌ 已取消记录。请重新告诉我您的消费信息。',
          type: 'error'
        };
        
        this.setData({
          messages: [...this.data.messages, cancelMessage],
          isLoading: false
        });
        this.scrollToBottom();
      }
      return { type: 'handled' };
    }
    
    return null;
  },

  // 处理支出记录
  processExpenseRecord(input) {
    // 解析格式：记录支出 [金额] [类别] [备注]
    const regex = /记录支出\s+(\d+(?:\.\d+)?)\s+([^\s]+)(?:\s+(.+))?/;
    const match = input.match(regex);
    
    if (!match) {
      return {
        type: 'error',
        content: '❌ 格式错误！请使用：记录支出 [金额] [类别] [备注]\n\n例如：记录支出 28 餐饮 午餐'
      };
    }
    
    const amount = parseFloat(match[1]);
    const category = match[2];
    const remark = match[3] || '';
    
    this.createExpenseRecord(amount, category, remark, input);
    return { type: 'handled' };
  },

  // 处理查询指令
  processQueryCommand(input) {
    const lowerInput = input.toLowerCase();
    
    if (lowerInput.includes('本月') && lowerInput.includes('餐饮')) {
      return this.queryMonthlyExpense('餐饮');
    }
    
    if (lowerInput.includes('本月') && lowerInput.includes('支出')) {
      return this.queryMonthlyExpenses();
    }
    
    return {
      type: 'error',
      content: '❓ 请明确查询内容，例如：\n• 查询本月餐饮支出\n• 查询本月总支出'
    };
  },

  // 查询月度餐饮支出
  queryMonthlyExpense(category) {
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    
    const records = this.data.userData.records.filter(record => {
      const recordDate = new Date(record.date);
      return record.type === 'expense' && 
             record.category.name === category &&
             recordDate.getMonth() + 1 === currentMonth &&
             recordDate.getFullYear() === currentYear;
    });
    
    const totalAmount = records.reduce((sum, record) => sum + record.amount, 0);
    
    return {
      type: 'info',
      content: `📊 ${currentYear}年${currentMonth}月${category}支出统计：
💰 总金额：¥${totalAmount.toFixed(2)}
📝 记录数：${records.length}笔
${this.generateExpenseChart(records)}`
    };
  },

  // 查询月度总支出
  queryMonthlyExpenses() {
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    
    const records = this.data.userData.records.filter(record => {
      const recordDate = new Date(record.date);
      return record.type === 'expense' &&
             recordDate.getMonth() + 1 === currentMonth &&
             recordDate.getFullYear() === currentYear;
    });
    
    const totalAmount = records.reduce((sum, record) => sum + record.amount, 0);
    
    // 按分类统计
    const categoryStats = {};
    records.forEach(record => {
      const category = record.category.name;
      categoryStats[category] = (categoryStats[category] || 0) + record.amount;
    });
    
    let chartText = '';
    Object.entries(categoryStats).forEach(([category, amount]) => {
      const percentage = ((amount / totalAmount) * 100).toFixed(1);
      const bars = '█'.repeat(Math.floor(percentage / 5));
      chartText += `${bars} ${category} ${percentage}%\n`;
    });
    
    return {
      type: 'info',
      content: `📊 ${currentYear}年${currentMonth}月支出统计：
💰 总支出：¥${totalAmount.toFixed(2)}
📝 记录数：${records.length}笔

📈 分类占比：
${chartText}`
    };
  },

  // 处理删除指令
  processDeleteCommand(input) {
    const records = wx.getStorageSync('records') || [];
    if (records.length === 0) {
      return {
        type: 'error',
        content: '❌ 没有可删除的记录！'
      };
    }
    
    const deletedRecord = records.shift();
    wx.setStorageSync('records', records);
    this.loadUserData();
    
    return {
      type: 'success',
      content: `✅ 已删除最新记录：
💰 ${deletedRecord.type === 'expense' ? '支出' : '收入'}：¥${deletedRecord.amount.toFixed(2)}
📂 分类：${deletedRecord.category.name}
📝 备注：${deletedRecord.remark || '无'}`
    };
  },

  // 生成财务报告
  generateFinancialReport() {
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    
    const records = this.data.userData.records.filter(record => {
      const recordDate = new Date(record.date);
      return recordDate.getMonth() + 1 === currentMonth &&
             recordDate.getFullYear() === currentYear;
    });
    
    const expenses = records.filter(r => r.type === 'expense');
    const incomes = records.filter(r => r.type === 'income');
    
    const totalExpense = expenses.reduce((sum, r) => sum + r.amount, 0);
    const totalIncome = incomes.reduce((sum, r) => sum + r.amount, 0);
    const balance = totalIncome - totalExpense;
    
    // 分类统计
    const categoryStats = {};
    expenses.forEach(record => {
      const category = record.category.name;
      categoryStats[category] = (categoryStats[category] || 0) + record.amount;
    });
    
    let chartText = '';
    Object.entries(categoryStats)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .forEach(([category, amount]) => {
        const percentage = ((amount / totalExpense) * 100).toFixed(1);
        const bars = '█'.repeat(Math.floor(percentage / 5));
        chartText += `${bars} ${category} ${percentage}%\n`;
      });
    
    // 生成建议
    let suggestions = '';
    if (totalExpense > totalIncome) {
      suggestions += '⚠️ 本月支出超过收入，建议控制消费\n';
    }
    if (categoryStats['餐饮'] > totalExpense * 0.3) {
      suggestions += '🍽️ 餐饮支出占比较高，可考虑自己做饭\n';
    }
    if (balance > 0) {
      suggestions += '🎉 本月有结余，继续保持！\n';
    }
    
    return {
      type: 'report',
      content: `📊 **${currentYear}年${currentMonth}月财务报告**

💰 **收支概况**
收入：¥${totalIncome.toFixed(2)}
支出：¥${totalExpense.toFixed(2)}
结余：¥${balance.toFixed(2)}

📈 **支出分类TOP5**
${chartText}

💡 **智能建议**
${suggestions || '✨ 财务状况良好，继续保持！'}`
    };
  },

  // 获取分类图标
  getCategoryIcon(category) {
    const iconMap = {
      '餐饮': '🍔',
      '购物': '🛍️',
      '交通': '🚗',
      '娱乐': '🎬',
      '住房': '🏠',
      '医疗': '💊',
      '教育': '📚',
      '其他': '🧾'
    };
    return iconMap[category] || '🧾';
  },

  // 生成支出图表
  generateExpenseChart(records) {
    if (records.length === 0) return '暂无记录';
    
    const total = records.reduce((sum, r) => sum + r.amount, 0);
    let chart = '';
    
    records.slice(0, 5).forEach(record => {
      const percentage = ((record.amount / total) * 100).toFixed(1);
      const bars = '█'.repeat(Math.floor(percentage / 10));
      chart += `${bars} ${record.remark || record.category.name} ${percentage}%\n`;
    });
    
    return chart;
  },

  // 处理本地响应
  handleLocalResponse(response) {
    if (response.type === 'handled') {
      return; // 已经处理过了
    }
    
    const aiMessage = { 
      role: 'assistant', 
      content: response.content,
      type: response.type
    };
    
    this.setData({
      messages: [...this.data.messages, aiMessage],
      isLoading: false
    });
    this.scrollToBottom();
  },

  // 调用AI API
  getAiReply(userInput) {
    const { messages, apiKey, userData } = this.data;
    
    // 构造请求体
    const requestMessages = messages
      .filter(msg => msg.role === 'user' || msg.role === 'assistant')
      .map(({ role, content }) => ({ role, content }));

    // 添加系统提示
    const systemPrompt = {
      role: 'system',
      content: `你是FinGuide，一名专业的私人财务分析师。用户正在使用智能记账小程序，你需要以清晰、专业且亲和的方式协助用户管理财务。

核心能力：
1. 智能记账：解析用户输入的消费/收入文本，自动提取金额、分类、支付方式
2. 财务分析：实时生成可视化数据报告，提供关键指标提示
3. 主动建议：发现异常消费时提醒，根据历史数据提供优化方案

交互规则：
- 语言风格：简洁专业+适度口语化
- 隐私保护：绝不索要银行卡/密码等敏感信息
- 错误处理：无法识别指令时引导用户格式
- 正向激励：达成储蓄目标时给予鼓励

用户当前财务数据：
- 记账记录：${userData.records.length}条
- 账户数量：${userData.accounts.length}个
- 预算设置：${userData.budgets.length}个
- 储蓄目标：${userData.savingGoals.length}个

请根据用户的具体需求提供专业的财务分析和建议。`
    };
    
    wx.request({
      url: 'https://api.moonshot.cn/v1/chat/completions',
      method: 'POST',
      header: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      data: {
        model: 'moonshot-v1-8k',
        messages: [systemPrompt, ...requestMessages],
        temperature: 0.3
      },
      success: (res) => {
        if (res.statusCode === 200 && res.data.choices && res.data.choices.length > 0) {
          const aiReply = res.data.choices[0].message.content;
          const aiMessage = { role: 'assistant', content: aiReply };
          this.setData({
            messages: [...this.data.messages, aiMessage]
          });
        } else {
          this.showErrorReply();
        }
      },
      fail: () => {
        this.showErrorReply();
      },
      complete: () => {
        this.setData({ isLoading: false });
        this.scrollToBottom();
      }
    });
  },

  showErrorReply() {
    const errorMessage = {
      role: 'assistant',
      content: '❌ 连接失败，请稍后重试。',
      isError: true
    };
    this.setData({
      messages: [...this.data.messages, errorMessage]
    });
  },

  scrollToBottom() {
    wx.createSelectorQuery().select('.chat-body').boundingClientRect(rect => {
      if (rect) {
        wx.pageScrollTo({
          scrollTop: rect.height,
          duration: 300
        });
      }
    }).exec();
  },

  // 显示聊天记录
  onShowHistory() {
    this.loadChatHistories();
    this.setData({
      showHistory: true
    });
  },

  // 隐藏聊天记录
  onHideHistory() {
    this.setData({
      showHistory: false
    });
  },

  // 加载聊天记录列表
  loadChatHistories() {
    try {
      const chatHistories = wx.getStorageSync('chatHistories') || {};
      const historyList = Object.values(chatHistories)
        .map(history => {
          // 格式化时间
          const date = new Date(history.lastUpdate);
          const formattedTime = `${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
          
          // 生成预览
          const firstUserMessage = history.messages.find(msg => msg.role === 'user');
          const preview = firstUserMessage ? firstUserMessage.content.substring(0, 30) + '...' : '新对话';
          
          return {
            ...history,
            lastUpdate: formattedTime,
            originalTime: history.lastUpdate,
            preview: preview
          };
        })
        .sort((a, b) => new Date(b.originalTime) - new Date(a.originalTime));
      
      this.setData({
        chatHistories: historyList
      });
    } catch (error) {
      console.error('加载聊天记录列表失败:', error);
    }
  },

  // 加载指定聊天记录
  onLoadHistory(e) {
    const { id } = e.currentTarget.dataset;
    try {
      const chatHistories = wx.getStorageSync('chatHistories') || {};
      const history = chatHistories[id];
      
      if (history && history.messages) {
        this.setData({
          messages: history.messages,
          chatId: id,
          showHistory: false
        });
        
        wx.showToast({
          title: '聊天记录已加载',
          icon: 'success'
        });
      }
    } catch (error) {
      console.error('加载聊天记录失败:', error);
      wx.showToast({
        title: '加载失败',
        icon: 'error'
      });
    }
  }
}); 