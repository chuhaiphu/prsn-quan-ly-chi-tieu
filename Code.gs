// =============================
// CẤU HÌNH CHUNG VÀ ĐỊNH NGHĨA DỮ LIỆU
// =============================
// File này dùng để xử lý API Google Apps Script cho ứng dụng quản lý tài chính cá nhân.
// Xử lý các thao tác: lấy danh sách, thêm, sửa, xóa giao dịch.
// Có thể mở rộng: Thêm action xuất file, filter nâng cao, phân quyền người dùng...

const SHEET_NAME = 'Sheet1'; // Tên sheet chứa dữ liệu

// Định nghĩa tên các trường dữ liệu giao dịch
const TRANSACTION_FIELDS = {
  ID: 'id',
  DATE: 'date',
  TYPE: 'type',
  CATEGORY: 'category',
  AMOUNT: 'amount',
  NOTE: 'note',
  CREATED_AT: 'createdAt'
};

// Các loại giao dịch
const TRANSACTION_TYPES = {
  INCOME: 'Thu nhập',
  EXPENSE: 'Chi tiêu'
};

// =============================
// HÀM TIỆN ÍCH TẠO RESPONSE CHUẨN
// =============================
// Hàm này trả về kết quả dạng JSON cho client (frontend)
function createResponse(data, status = 'success') {
  return ContentService.createTextOutput(JSON.stringify({
    result: status,
    data: data
  })).setMimeType(ContentService.MimeType.JSON);
}

// Hàm trả về lỗi chuẩn
function createErrorResponse(message) {
  return createResponse({ message }, 'error');
}

// =============================
// HÀM LẤY SHEET LÀM VIỆC
// =============================
function getSheet() {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
}

// =============================
// HÀM CHUYỂN ĐỔI DỮ LIỆU GIỮA ROW VÀ OBJECT
// =============================
// Chuyển 1 dòng từ sheet thành object JS
function rowToObject(row) {
  const obj = {};
  Object.values(TRANSACTION_FIELDS).forEach((field, index) => {
    obj[field] = row[index];
  });
  return obj;
}

// Chuyển 1 object JS thành 1 dòng để ghi vào sheet
function objectToRow(obj) {
  const row = new Array(Object.keys(TRANSACTION_FIELDS).length).fill('');
  Object.entries(TRANSACTION_FIELDS).forEach(([key, field]) => {
    const index = Object.keys(TRANSACTION_FIELDS).indexOf(key);
    row[index] = obj[field] || '';
  });
  return row;
}

// =============================
// API ENDPOINT GET: LẤY DANH SÁCH GIAO DỊCH
// =============================
function doGet() {
  try {
    const sheet = getSheet();
    const data = sheet.getDataRange().getValues();
    const transactions = data.slice(1).map(rowToObject); // Bỏ dòng tiêu đề
    return createResponse(transactions);
  } catch (error) {
    return createErrorResponse('Lỗi khi lấy dữ liệu: ' + error.message);
  }
}

// =============================
// API ENDPOINT POST: XỬ LÝ THÊM/SỬA/XÓA
// =============================
function doPost(e) {
  try {
    const sheet = getSheet();
    let params = {};
    
    // Parse tham số từ request
    if (e.postData && e.postData.type === 'application/json') {
      params = JSON.parse(e.postData.contents);
    } else if (e.parameter) {
      params = e.parameter;
    }

    // Xử lý action tương ứng
    switch (params.action) {
      case 'add':
        return handleAddTransaction(sheet, params);
      case 'delete':
        return handleDeleteTransaction(sheet, params);
      case 'edit':
        return handleEditTransaction(sheet, params);
      default:
        return createErrorResponse('Action không hợp lệ');
    }
  } catch (error) {
    return createErrorResponse('Lỗi xử lý request: ' + error.message);
  }
}

// =============================
// HÀM XỬ LÝ THÊM GIAO DỊCH
// =============================
// Có thể mở rộng: Validate nâng cao, sinh mã giao dịch riêng, ghi lịch sử thao tác...
function handleAddTransaction(sheet, params) {
  // Validate các trường bắt buộc
  const requiredFields = [TRANSACTION_FIELDS.DATE, TRANSACTION_FIELDS.TYPE, 
                        TRANSACTION_FIELDS.CATEGORY, TRANSACTION_FIELDS.AMOUNT];
  const missingFields = requiredFields.filter(field => !params[field]);
  
  if (missingFields.length > 0) {
    return createErrorResponse('Thiếu dữ liệu: ' + missingFields.join(', '));
  }

  // Tạo object giao dịch mới
  const transaction = {
    [TRANSACTION_FIELDS.ID]: new Date().getTime(), // ID dạng timestamp
    [TRANSACTION_FIELDS.DATE]: params.date,
    [TRANSACTION_FIELDS.TYPE]: params.type,
    [TRANSACTION_FIELDS.CATEGORY]: params.category,
    [TRANSACTION_FIELDS.AMOUNT]: params.amount,
    [TRANSACTION_FIELDS.NOTE]: params.note || '',
    [TRANSACTION_FIELDS.CREATED_AT]: new Date()
  };

  // Ghi vào sheet
  sheet.appendRow(objectToRow(transaction));
  return createResponse({ id: transaction[TRANSACTION_FIELDS.ID] });
}

// =============================
// HÀM XỬ LÝ XÓA GIAO DỊCH
// =============================
function handleDeleteTransaction(sheet, params) {
  if (!params.id) {
    return createErrorResponse('Thiếu ID');
  }

  const data = sheet.getDataRange().getValues();
  const idIndex = Object.keys(TRANSACTION_FIELDS).indexOf('ID');
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][idIndex] == params.id) {
      sheet.deleteRow(i + 1);
      return createResponse({ message: 'Xóa thành công' });
    }
  }
  
  return createErrorResponse('Không tìm thấy ID');
}

// =============================
// HÀM XỬ LÝ SỬA GIAO DỊCH
// =============================
function handleEditTransaction(sheet, params) {
  if (!params.id) {
    return createErrorResponse('Thiếu ID');
  }

  const data = sheet.getDataRange().getValues();
  const idIndex = Object.keys(TRANSACTION_FIELDS).indexOf('ID');
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][idIndex] == params.id) {
      const transaction = {
        [TRANSACTION_FIELDS.ID]: params.id,
        [TRANSACTION_FIELDS.DATE]: params.date,
        [TRANSACTION_FIELDS.TYPE]: params.type,
        [TRANSACTION_FIELDS.CATEGORY]: params.category,
        [TRANSACTION_FIELDS.AMOUNT]: params.amount,
        [TRANSACTION_FIELDS.NOTE]: params.note || '',
        [TRANSACTION_FIELDS.CREATED_AT]: data[i][Object.keys(TRANSACTION_FIELDS).indexOf('CREATED_AT')]
      };

      const row = objectToRow(transaction);
      sheet.getRange(i + 1, 1, 1, row.length).setValues([row]);
      return createResponse({ message: 'Cập nhật thành công' });
    }
  }
  
  return createErrorResponse('Không tìm thấy ID');
}
// =============================
// HƯỚNG DẪN MỞ RỘNG
// =============================
// - Để thêm trường dữ liệu mới: thêm vào TRANSACTION_FIELDS, cập nhật các hàm rowToObject, objectToRow, validate ở handleAddTransaction.
// - Để thêm action API mới: bổ sung case ở doPost, viết thêm hàm xử lý.
// - Để xuất file: dùng DriveApp tạo file mới, trả về link download.
// - Để phân quyền: sử dụng Session.getActiveUser() để xác định user hiện tại.