// =============================
// ChartManager: Quản lý biểu đồ chi tiêu
// =============================
// Lớp này dùng để tạo và cập nhật biểu đồ chi tiêu theo hạng mục.
// Sử dụng Chart.js để vẽ biểu đồ dạng pie chart.
// Khi muốn mở rộng: Có thể thêm các loại biểu đồ khác (bar, line...), hoặc thêm tùy chọn filter cho biểu đồ.

class ChartManager {
  constructor() {
    // this.chart: Đối tượng biểu đồ Chart.js hiện tại
    // this.ctx: Context của canvas để vẽ biểu đồ
    this.chart = null;
    this.ctx = document.getElementById('categoryChart')?.getContext('2d');
  }

  // =============================
  // Hàm tạo màu ngẫu nhiên cho từng phần của biểu đồ
  // =============================
  // Để dễ nhìn, mỗi hạng mục sẽ có một màu khác nhau.
  generateColors(count) {
    return Array(count).fill().map(() => 
      `hsl(${Math.random() * 360}, 70%, 70%)`
    );
  }

  // =============================
  // Hàm cập nhật lại biểu đồ với dữ liệu mới
  // =============================
  // Gọi hàm này mỗi khi danh sách giao dịch thay đổi.
  updateChart(transactions) {
    // Lấy lại context mỗi lần update (canvas có thể bị DOM refresh khi resize hoặc modal)
    this.ctx = document.getElementById('categoryChart')?.getContext('2d');
    if (!this.ctx) return;

    // Xử lý dữ liệu giao dịch để tổng hợp theo hạng mục
    const categories = this.processData(transactions);
    const data = {
      labels: Object.keys(categories), // Danh sách hạng mục
      datasets: [{
        label: 'Chi tiêu theo hạng mục',
        data: Object.values(categories), // Tổng số tiền theo từng hạng mục
        backgroundColor: this.generateColors(Object.keys(categories).length)
      }]
    };

    // Cấu hình biểu đồ (pie chart)
    const config = {
      type: 'pie',
      data: data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              font: {
                size: 12
              }
            }
          },
          tooltip: {
            callbacks: {
              // Hiển thị tooltip chi tiết khi hover vào từng phần
              label: function(context) {
                const label = context.label || '';
                const value = context.raw || 0;
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const percentage = Math.round((value / total) * 100);
                return `${label}: ${value.toLocaleString()} VND (${percentage}%)`;
              }
            }
          }
        }
      }
    };

    // Nếu đã có biểu đồ cũ thì hủy trước khi vẽ mới
    if (this.chart) {
      this.chart.destroy();
    }
    this.chart = new Chart(this.ctx, config);
  }

  // =============================
  // Hàm xử lý dữ liệu giao dịch để tổng hợp số tiền theo từng hạng mục (chỉ tính "Chi tiêu")
  // =============================
  // Có thể mở rộng: Thêm filter theo tháng/năm hoặc loại giao dịch khác.
  processData(transactions) {
    const categories = {};
    
    transactions.forEach(t => {
      if (t.type === 'Chi tiêu') {
        categories[t.category] = (categories[t.category] || 0) + Number(t.amount);
      }
    });

    // Sắp xếp hạng mục theo số tiền giảm dần cho dễ nhìn
    return Object.fromEntries(
      Object.entries(categories)
        .sort(([,a], [,b]) => b - a)
    );
  }
}

// =============================
// Export lớp ChartManager để file script.js sử dụng
// =============================
// Có thể mở rộng: Nếu muốn dùng nhiều biểu đồ, export thêm class khác hoặc hàm tiện ích.
window.ChartManager = ChartManager;
