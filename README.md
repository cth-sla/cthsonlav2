
# Hệ thống Giám sát Cầu truyền hình SLA (E-Meeting)

Ứng dụng quản lý và giám sát chất lượng họp trực tuyến tích hợp AI Gemini.

## 🚀 Hướng dẫn Triển khai

### 1. Yêu cầu hệ thống
- **Node.js**: Phiên bản 18.x trở lên.
- **MySQL**: Phiên bản 8.0 (Sử dụng file `schema.sql` để khởi tạo database).

### 2. Cài đặt môi trường
Sao chép mã nguồn vào thư mục dự án và chạy:
```bash
npm install
```

### 3. Cấu hình Biến môi trường (.env)
Tạo file `.env` tại thư mục gốc và cấu hình các thông số sau:
```env
API_KEY=your_google_gemini_api_key
DB_HOST=localhost
DB_USER=root
DB_PASS=your_password
DB_NAME=emeeting_sla
```

### 4. Chạy ứng dụng
- Chế độ phát triển: `npm start`
- Đóng gói triển khai: `npm run build`

### 5. Hosting khuyến nghị
- **Frontend**: Vercel, Netlify hoặc Firebase Hosting.
- **Backend/Database**: AWS RDS, Google Cloud SQL hoặc DigitalOcean.

---
*Ghi chú: Ứng dụng hiện tại đang sử dụng LocalStorage làm database tạm thời. Để kết nối MySQL thật, hãy triển khai API backend dựa trên interface tại `services/databaseService.ts`.*
