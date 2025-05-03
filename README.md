# Quản Lý Chi Tiêu Cá Nhân 💸📊

Dự án này giúp bạn quản lý chi tiêu cá nhân bằng Google Sheets, Google Apps Script (API), và giao diện web thuần HTML/CSS/JS + Chart.js.

## ✨ Tính năng
- Ghi nhận, chỉnh sửa, xóa các khoản thu/chi
- Xem báo cáo chi tiêu bằng biểu đồ
- Dữ liệu lưu trên Google Sheets cá nhân của bạn

---

## 🚀 Hướng dẫn triển khai cho người mới bắt đầu

### 1️⃣ Chuẩn bị tài khoản Google
Bạn cần có một tài khoản Google để sử dụng Google Sheets và Google Apps Script.

### 2️⃣ Tạo Google Sheet làm database
1. 🗂️ Vào [Google Sheets](https://sheets.google.com) → Nhấn **Blank** để tạo file mới.
2. ✏️ Đổi tên sheet (ví dụ: `QuanLyChiTieu`).
3. 📑 Tạo các cột ở hàng đầu tiên: `ID`, `Loại`, `Số tiền`, `Mô tả`, `Ngày`
4. 🔗 Ghi nhớ **ID** của Google Sheet (trong URL: `https://docs.google.com/spreadsheets/d/ID_CUA_BAN/edit#gid=0`).

### 3️⃣ Tạo Google Apps Script (API)
1. 🧩 Trong Google Sheets, vào menu **Extensions** → **Apps Script**.
2. 🧹 Xóa toàn bộ nội dung mặc định, dán code từ file `Code.gs` của dự án này vào.
3. 🔍 Ở đầu file `Code.gs`, tìm dòng có biến `SPREADSHEET_ID` và thay bằng ID Google Sheet của bạn.
4. 💾 Nhấn **Save** (Ctrl+S).
5. 🚀 Vào **Deploy** → **New deployment**.
6. 🛠️ Nhấn **Select type** → chọn **Web app**.
7. 🏷️ Đặt tên (ví dụ: `QuanLyChiTieuAPI`).
8. 👤 **Execute as**: chọn `Me`. **Who has access**: chọn `Anyone`.
9. ✅ Nhấn **Deploy**. Lần đầu sẽ yêu cầu cấp quyền, hãy làm theo hướng dẫn cấp quyền cho Apps Script.
10. 🌐 Sau khi deploy xong, copy **URL Web App** (dùng ở bước sau).

### 4️⃣ Fork & clone source code về máy 💻
#### 🅰️ Nếu bạn chưa biết GitHub:
1. 🔑 Đăng nhập [GitHub](https://github.com/).
2. 🌟 Truy cập repository chứa source code này (ví dụ: `https://github.com/tenrepo/quan-ly-chi-tieu`).
3. Nhấn nút **Fork** (góc trên cùng bên phải) để tạo bản sao về tài khoản của bạn.
4. Vào repo vừa fork trong tài khoản của bạn, nhấn **Code** → **Download ZIP** để tải về máy.
5. Giải nén file ZIP.

#### 🅱️ Nếu bạn biết dùng Git:
1. 🔑 Đăng nhập [GitHub](https://github.com/).
2. 🌟 Truy cập repository chứa source code này, nhấn **Fork**.
3. Vào repo vừa fork, nhấn **Code** → copy link HTTPS.
4. Mở terminal/cmd, chạy lệnh:
   ```bash
   git clone https://github.com/tenban/quan-ly-chi-tieu.git
   ```
   (thay link bằng repo của bạn)
5. `cd` vào thư mục vừa clone.

### 5️⃣ Tạo repository cá nhân nếu muốn tách riêng 🏠
1. Vào GitHub → **New repository** → đặt tên repo (ví dụ: `my-chi-tieu`), nhấn **Create**.
2. Trong thư mục source code trên máy, mở terminal/cmd:
   ```bash
   git init
   git add .
   git commit -m "first commit"
   git remote add origin https://github.com/tenban/my-chi-tieu.git
   git branch -M main
   git push -u origin main
   ```
   (thay link bằng repo của bạn)

### 6️⃣ Cấu hình và chạy giao diện web 🌐
1. Mở file `script.js` bằng Notepad/VS Code.
2. Tìm dòng khai báo biến chứa **URL Web App** (API) và thay bằng URL của bạn.
3. Lưu lại.
4. Mở file `index.html` trên trình duyệt để sử dụng thử.

### 7️⃣ Deploy web lên GitHub Pages 🚩
1. Lên GitHub repo của bạn, vào **Settings** → **Pages** (hoặc **Pages** ở menu bên trái).
2. **Source**: chọn branch `main` (hoặc `master`).
3. **Folder**: chọn `/root` (nếu file `index.html` nằm ở thư mục gốc) hoặc `/docs` (nếu bạn để trong thư mục docs).
4. Nhấn **Save**.
5. Đợi 1-2 phút, GitHub sẽ hiện link trang web cá nhân của bạn ở phía trên.
6. Truy cập link để sử dụng web mọi lúc, mọi nơi!

### 8️⃣ Sử dụng & kiểm tra 🧪
- Truy cập web, nhập dữ liệu, xem báo cáo.
- Nếu có lỗi:
  - Kiểm tra lại URL API (phải là URL Web App vừa deploy).
  - Kiểm tra quyền truy cập Apps Script (phải để Anyone).
  - Mở console trình duyệt (F12 → Console) để xem log lỗi nếu cần.

---

## 🛠️ Công nghệ sử dụng
- **Google Sheets**: Lưu trữ dữ liệu
- **Google Apps Script**: Xử lý API
- **HTML/CSS/JavaScript**: Giao diện người dùng
- **Chart.js**: Vẽ biểu đồ

## 💡 Gợi ý mở rộng
- Thêm xác thực bằng Google OAuth
- Thêm phân loại chi tiêu nâng cao
- Xuất dữ liệu ra file Excel/PDF

---

## 🤝 Liên hệ & đóng góp
Nếu bạn gặp khó khăn, hãy tạo Issue trên GitHub hoặc liên hệ tôi 
https://www.linkedin.com/in/doanvinhphu62/

---

**Chúc bạn triển khai thành công và quản lý chi tiêu hiệu quả! 🎉**
