// =============================
// script.js: Xử lý logic giao diện và API cho ứng dụng quản lý tài chính cá nhân
// =============================
// File này kết nối frontend (index.html) với backend (Google Apps Script qua API)
// - Xử lý thêm/sửa/xóa giao dịch, cập nhật bảng, filter, gọi biểu đồ...
// - Có thể mở rộng: Thêm filter nâng cao, xuất file, dark mode, validate nâng cao...

// =============================
// 1. HẰNG SỐ VÀ CẤU HÌNH
// =============================
const API_URL = 'https://script.google.com/macros/s/AKfycbxxuyPZf_w1D9rS5AA1nW3vxRMpQjxpiKnEXE8mGdiYU94Bdtpv2riT1digMuPMKbtG/exec'

const TRANSACTION_TYPES = {
  INCOME: 'Thu nhập',
  EXPENSE: 'Chi tiêu'
};

// Danh sách hạng mục cho từng loại giao dịch
const CATEGORY_OPTIONS = {
  'Thu nhập': [
    'Lương',
    'Thưởng',
    'Đầu tư',
    'Khác'
  ],
  'Chi tiêu': [
    'Ăn uống',
    'Đi lại',
    'Hóa đơn',
    'Giải trí',
    'Mua sắm',
    'Sức khỏe',
    'Giáo dục',
    'Khác'
  ]
};

let transactions = [];
let chartManager;

// =============================
// 2. HÀM GỌI API GOOGLE APPS SCRIPT
// =============================
// Hàm này dùng để gọi API backend (Code.gs) với method GET/POST
// Có thể mở rộng: Thêm loading spinner, xử lý lỗi nâng cao, retry khi lỗi mạng...
async function callApi(method = 'GET', data = null) {
  try {
    const options = {
      method,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    };
    
    if (data) {
      options.body = new URLSearchParams(data);
    }
    
    const response = await fetch(API_URL, options);
    const result = await response.json();
    
    if (result.result !== 'success') {
      throw new Error(result.data?.message || 'Lỗi không xác định');
    }
    
    return result.data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

// =============================
// 3. HÀM HIỂN THỊ MESSAGE VÀ LOADER
// =============================
// Dùng để hiển thị thông báo lỗi/thành công hoặc loading khi submit form
function showFormMessage(message, type = 'error') {
  const msgDiv = document.getElementById('form-messages');
  msgDiv.innerHTML = `<div class="form-message ${type}">${message}</div>`;
}
function clearFormMessage() {
  document.getElementById('form-messages').innerHTML = '';
}
function showLoader() {
  document.getElementById('form-messages').innerHTML = '<div class="loader"></div>';
}

// =============================
// 4. VALIDATE FORM GIAO DỊCH
// =============================
// Kiểm tra dữ liệu nhập vào hợp lệ trước khi gửi API
// Có thể mở rộng: Validate nâng cao, kiểm tra số tiền tối đa, kiểm tra ngày hợp lệ...
function validateTransactionForm() {
  let valid = true;
  let messages = [];
  const date = document.getElementById('date').value;
  const type = document.getElementById('type').value;
  const category = document.getElementById('category').value;
  const amount = document.getElementById('amount').value;

  if (!date) {
    valid = false;
    messages.push('Vui lòng chọn ngày.');
  }
  if (!type) {
    valid = false;
    messages.push('Vui lòng chọn loại giao dịch.');
  }
  if (!category) {
    valid = false;
    messages.push('Vui lòng chọn hạng mục.');
  }
  if (!amount || isNaN(amount) || Number(amount) <= 0) {
    valid = false;
    messages.push('Vui lòng nhập số tiền hợp lệ.');
  }
  if (!valid) {
    showFormMessage(messages.join('<br>'), 'error');
  } else {
    clearFormMessage();
  }
  return valid;
}

// =============================
// 5. CẬP NHẬT HẠNG MỤC THEO LOẠI GIAO DỊCH
// =============================
// Khi chọn loại giao dịch sẽ tự động đổi danh sách hạng mục phù hợp
// Có thể mở rộng: Cho phép chỉnh sửa danh sách hạng mục từ giao diện
function updateCategoryOptions(typeSelectId, categorySelectId) {
  const type = document.getElementById(typeSelectId).value;
  const categorySelect = document.getElementById(categorySelectId);
  let options = '<option value="">Chọn hạng mục</option>';
  if (CATEGORY_OPTIONS[type]) {
    options += CATEGORY_OPTIONS[type].map(c => `<option value="${c}">${c}</option>`).join('');
  }
  categorySelect.innerHTML = options;
}

// =============================
// 6. SỰ KIỆN SUBMIT FORM THÊM GIAO DỊCH
// =============================
// Khi bấm nút "Thêm giao dịch" sẽ gọi API để lưu giao dịch mới
// Có thể mở rộng: Sau khi thêm thành công, chuyển focus về trường đầu tiên, hoặc hiển thị popup.
document.getElementById('transaction-form').addEventListener('submit', async function(e) {
  e.preventDefault();
  clearFormMessage();
  // Nếu chưa chọn ngày thì tự động set ngày hiện tại
  const dateInput = document.getElementById('date');
  if (dateInput && !dateInput.value) {
    dateInput.value = new Date().toISOString().split('T')[0];
  }
  if (!validateTransactionForm()) return;
  showLoader();
  try {
    const transaction = {
      action: 'add',
      date: document.getElementById('date').value,
      type: document.getElementById('type').value,
      category: document.getElementById('category').value,
      amount: parseFloat(document.getElementById('amount').value),
      note: document.getElementById('note').value
    };

    await callApi('POST', transaction);
    this.reset();
    // Sau khi reset, set lại ngày hiện tại cho input date
    if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];
    await loadTransactions();
    showFormMessage('Thêm giao dịch thành công!', 'success');
  } catch (error) {
    showFormMessage(error.message);
  }
});

// =============================
// 7. SỰ KIỆN ĐỔI LOẠI GIAO DỊCH (FORM THÊM)
// =============================
document.getElementById('type').addEventListener('change', function() {
  updateCategoryOptions('type', 'category');
});

// =============================
// 8. HÀM TẢI DANH SÁCH GIAO DỊCH TỪ API
// =============================
// Gọi API để lấy danh sách, sau đó vẽ lại bảng, tổng kết, biểu đồ, filter.
// Có thể mở rộng: Thêm loading spinner khi tải dữ liệu, phân trang nếu dữ liệu lớn.
async function loadTransactions() {
  try {
    transactions = await callApi();
    renderTransactions(transactions);
    renderSummary();
    chartManager.updateChart(transactions);
    fillFilters();
  } catch (error) {
    alert('Lỗi khi tải dữ liệu: ' + error.message);
  }
}

// =============================
// 9. HÀM HIỂN THỊ BẢNG GIAO DỊCH
// =============================
function renderTransactions(data) {
  const tbody = document.querySelector('#transactions-table tbody');
  tbody.innerHTML = '';
  
  data.forEach(tran => {
    const formattedDate = new Date(tran.date).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${formattedDate}</td>
      <td>${tran.type}</td>
      <td>${tran.category}</td>
      <td>${Number(tran.amount).toLocaleString()}</td>
      <td>${tran.note}</td>
      <td>
        <button class="edit-btn" data-id="${tran.id}">Sửa</button>
        <button class="delete-btn" data-id="${tran.id}">Xóa</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// =============================
// 10. HÀM HIỂN THỊ TỔNG SỐ DƯ
// =============================
function renderSummary() {
  const balance = transactions.reduce((total, tran) => {
    return total + (tran.type === TRANSACTION_TYPES.INCOME ? Number(tran.amount) : -Number(tran.amount));
  }, 0);
  
  document.getElementById('balance').textContent = balance.toLocaleString();
}

// =============================
// 11. HÀM XÓA GIAO DỊCH
// =============================
// Khi bấm nút "Xóa" sẽ xác nhận rồi gọi API để xóa
async function deleteTransaction(id) {
  if (!confirm('Bạn có chắc muốn xóa giao dịch này?')) return;
  showLoader();
  try {
    await callApi('POST', { action: 'delete', id });
    await loadTransactions();
    showFormMessage('Xóa giao dịch thành công!', 'success');
  } catch (error) {
    showFormMessage('Lỗi khi xóa giao dịch: ' + error.message, 'error');
  }
}

// =============================
// 12. SỰ KIỆN ĐỔI LOẠI GIAO DỊCH (FORM SỬA)
// =============================
// Đảm bảo khi sửa giao dịch, hạng mục sẽ cập nhật đúng loại
const editType = document.getElementById('edit-type');
if (editType) {
  editType.addEventListener('change', function() {
    updateCategoryOptions('edit-type', 'edit-category');
  });
}

// =============================
// 13. ĐÓNG MODAL SỬA GIAO DỊCH
// =============================
// Đóng modal khi bấm dấu X hoặc click ra ngoài
// Có thể mở rộng: Thêm xác nhận trước khi đóng nếu dữ liệu đã thay đổi
const closeModalBtn = document.getElementById('close-edit-modal');
if (closeModalBtn) {
  closeModalBtn.onclick = function() {
    document.getElementById('edit-modal').style.display = 'none';
  };
}
window.onclick = function(event) {
  const modal = document.getElementById('edit-modal');
  if (event.target == modal) {
    modal.style.display = 'none';
  }
};

// =============================
// 14. SUBMIT FORM SỬA GIAO DỊCH
// =============================
// Xử lý lưu thay đổi khi sửa giao dịch
const editForm = document.getElementById('edit-transaction-form');
if (editForm) {
  editForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    document.getElementById('edit-form-messages').innerHTML = '';
    // Nếu chưa chọn ngày thì tự động set ngày hiện tại
    const editDateInput = document.getElementById('edit-date');
    if (editDateInput && !editDateInput.value) {
      editDateInput.value = new Date().toISOString().split('T')[0];
    }
    // Validate dữ liệu sửa
    const date = editDateInput.value;
    const type = document.getElementById('edit-type').value;
    const category = document.getElementById('edit-category').value;
    const amount = document.getElementById('edit-amount').value;
    if (!date || !type || !category || !amount || isNaN(amount) || Number(amount) <= 0) {
      document.getElementById('edit-form-messages').innerHTML = '<div class="form-message error">Vui lòng nhập đủ và đúng thông tin!</div>';
      return;
    }
    try {
      await callApi('POST', {
        action: 'edit',
        id: document.getElementById('edit-id').value,
        date,
        type,
        category,
        amount: parseFloat(amount),
        note: document.getElementById('edit-note').value
      });
      document.getElementById('edit-modal').style.display = 'none';
      await loadTransactions();
    } catch (error) {
      document.getElementById('edit-form-messages').innerHTML = '<div class="form-message error">' + error.message + '</div>';
    }
  });
}

// =============================
// 15. HÀM ĐỔ DỮ LIỆU FILTER THÁNG/NĂM
// =============================
// Tự động sinh danh sách tháng/năm có trong dữ liệu để filter
// Có thể mở rộng: Thêm filter theo số tiền, theo hạng mục, tìm kiếm nâng cao...
function fillFilters() {
  const monthSelect = document.getElementById('filter-month');
  const yearSelect = document.getElementById('filter-year');
  if (!monthSelect || !yearSelect) return;
  // Lấy tất cả tháng/năm xuất hiện trong dữ liệu
  const months = Array.from(new Set(transactions.map(t => new Date(t.date).getMonth() + 1))).sort((a, b) => a - b);
  const years = Array.from(new Set(transactions.map(t => new Date(t.date).getFullYear()))).sort((a, b) => a - b);
  monthSelect.innerHTML = '<option value="">Tháng</option>' + months.map(m => `<option value="${m}">${m}</option>`).join('');
  yearSelect.innerHTML = '<option value="">Năm</option>' + years.map(y => `<option value="${y}">${y}</option>`).join('');
}

// =============================
// 16. HÀM ÁP DỤNG FILTER
// =============================
function applyFilter() {
  const month = document.getElementById('filter-month').value;
  const year = document.getElementById('filter-year').value;
  let filtered = transactions;
  if (month) {
    filtered = filtered.filter(t => new Date(t.date).getMonth() + 1 == month);
  }
  if (year) {
    filtered = filtered.filter(t => new Date(t.date).getFullYear() == year);
  }
  renderTransactions(filtered);
  chartManager.updateChart(filtered);
}

// =============================
// 17. HÀM RESET FILTER
// =============================
function resetFilter() {
  renderTransactions(transactions);
  chartManager.updateChart(transactions);
  document.getElementById('filter-month').value = '';
  document.getElementById('filter-year').value = '';
}

// =============================
// 18. SỰ KIỆN BẤM NÚT SỬA/XÓA TRÊN BẢNG
// =============================
document.querySelector('#transactions-table tbody').addEventListener('click', function(e) {
  if (e.target.classList.contains('delete-btn')) {
    deleteTransaction(e.target.dataset.id);
  } else if (e.target.classList.contains('edit-btn')) {
    // Lấy dữ liệu giao dịch cần sửa
    const tran = transactions.find(t => t.id == e.target.dataset.id);
    if (!tran) return;
    document.getElementById('edit-id').value = tran.id;
    // Đảm bảo ngày đúng định dạng yyyy-MM-dd cho input date
    if (tran.date) {
      const d = new Date(tran.date);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      document.getElementById('edit-date').value = `${yyyy}-${mm}-${dd}`;
    } else {
      document.getElementById('edit-date').value = '';
    }
    document.getElementById('edit-type').value = tran.type;
    updateCategoryOptions('edit-type', 'edit-category');
    document.getElementById('edit-category').value = tran.category;
    document.getElementById('edit-amount').value = tran.amount;
    document.getElementById('edit-note').value = tran.note;
    document.getElementById('edit-modal').style.display = 'block';
    document.getElementById('edit-form-messages').innerHTML = '';
  }
});

// =============================
// 19. SỰ KIỆN FILTER
// =============================
document.getElementById('filter-apply').addEventListener('click', applyFilter);
document.getElementById('filter-reset').addEventListener('click', resetFilter);

// =============================
// 20. KHỞI TẠO CHART VÀ LOAD DỮ LIỆU BAN ĐẦU
// =============================
window.addEventListener('DOMContentLoaded', function() {
  const now = new Date();
  // Lấy ngày hiện tại theo định dạng yyyy-MM-dd
  const today = now.toISOString().split('T')[0];
  const dateInput = document.getElementById('date');
  if (dateInput && !dateInput.value) dateInput.value = today;
  const editDateInput = document.getElementById('edit-date');
  if (editDateInput && !editDateInput.value) editDateInput.value = today;
  chartManager = new ChartManager();
  updateCategoryOptions('type', 'category');
  loadTransactions();
});