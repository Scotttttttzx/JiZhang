Page({
  data: {
    detail: {}
  },
  onLoad(options) {
    const { id } = options;
    this.loadDetail(id);
  },
  loadDetail(id) {
    try {
      // 从本地存储获取所有记录
      const allRecords = wx.getStorageSync('records') || [];
      
      // 根据ID查找记录
      const record = allRecords.find(r => r.id === id);
      
      if (record) {
        this.setData({ detail: record });
        
        // 更新页面标题
        wx.setNavigationBarTitle({
          title: `${record.date} 明细详情`
        });
      } else {
        wx.showToast({
          title: '记录不存在',
          icon: 'error'
        });
        
        // 延迟返回上一页
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      }
    } catch (error) {
      console.error('加载记录详情失败:', error);
      wx.showToast({
        title: '数据加载失败',
        icon: 'error'
      });
    }
  },

  // 删除记录
  onDeleteRecord(e) {
    const record = e.currentTarget.dataset.record;
    
    wx.showModal({
      title: '确认删除',
      content: `确定要删除这条${record.type === 'expense' ? '支出' : '收入'}记录吗？\n\n${record.category.name} ¥${record.amount}`,
      confirmText: '删除',
      confirmColor: '#dc3545',
      success: (res) => {
        if (res.confirm) {
          this.deleteRecord(record);
        }
      }
    });
  },

  // 执行删除操作
  deleteRecord(record) {
    try {
      // 获取所有记录
      const allRecords = wx.getStorageSync('records') || [];
      
      // 找到并删除指定记录
      const recordIndex = allRecords.findIndex(r => r.id === record.id);
      
      if (recordIndex !== -1) {
        allRecords.splice(recordIndex, 1);
        
        // 保存更新后的记录
        wx.setStorageSync('records', allRecords);
        
        wx.showToast({
          title: '删除成功',
          icon: 'success'
        });
        
        // 延迟返回上一页
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      } else {
        wx.showToast({
          title: '记录不存在',
          icon: 'error'
        });
      }
    } catch (error) {
      console.error('删除记录失败:', error);
      wx.showToast({
        title: '删除失败',
        icon: 'error'
      });
    }
  }
}); 