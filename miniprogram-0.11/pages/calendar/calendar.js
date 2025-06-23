Page({
  data: {
    year: 0,
    month: 0,
    today: '',
    weekDays: ['日','一','二','三','四','五','六'],
    days: []
  },
  onLoad() {
    this.initCalendar();
  },
  initCalendar() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    
    // 格式化日期为 YYYY-MM-DD 格式
    const formatDate = (y, m, d) => {
      return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    };
    
    const todayStr = formatDate(year, month, day);
    const firstDay = new Date(year, month - 1, 1);
    const firstWeek = firstDay.getDay();
    const daysInMonth = new Date(year, month, 0).getDate();
    const days = [];
    
    for(let i=0;i<firstWeek;i++){
      days.push({day:'',date:'',isToday:false});
    }
    
    for(let d=1;d<=daysInMonth;d++){
      const dateStr = formatDate(year, month, d);
      days.push({day:d,date:dateStr,isToday:dateStr===todayStr});
    }
    
    this.setData({year,month,today:`${day}`,days});
  },
  onDayTap(e) {
    const date = e.currentTarget.dataset.date;
    if(date){
      wx.navigateTo({
        url: `/pages/calendar-detail/calendar-detail?date=${date}`
      });
    }
  }
}); 