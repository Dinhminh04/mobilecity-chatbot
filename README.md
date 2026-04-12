

Hệ thống Chatbot tư vấn bán điện thoại tích hợp website MobileCity.

## 📁 Cấu trúc dự án

```
mobilecity/
├── actions/            # Rasa Custom Actions (Python)
│   └── actions.py
├── backend/            # FastAPI REST API
│   ├── main.py
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/           # Next.js Admin Dashboard
│   ├── src/
│   │   ├── app/
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── products/page.tsx
│   │   │   ├── orders/page.tsx
│   │   │   ├── conversations/page.tsx
│   │   │   └── handoffs/page.tsx
│   │   └── lib/api.ts
│   └── Dockerfile
├── database/
│   └── init.sql        # Schema + seed data
├── nginx/
│   └── nginx.conf
├── data/               # Rasa training data
├── models/             # Rasa trained models
├── docker-compose.yml
└── README.md
```

##  Khởi động

### 1. Copy các file vào project Rasa của bạn

```bash
# Từ thư mục chatbot của bạn (D:\MinhQuanchatbot)
# Copy backend/, frontend/, database/, nginx/ vào đó
# Thay docker-compose.yml mới
# Thay actions/actions.py mới
```

### 2. Chạy toàn bộ hệ thống

```bash
docker compose up --build
```

### 3. Truy cập

| Service | URL |
|---------|-----|
|  Admin Dashboard | http://localhost:3001 |
|  FastAPI Docs | http://localhost:8000/docs |
|  Rasa API | http://localhost:5005 |
|  Nginx (gộp) | http://localhost:80 |

## Database

PostgreSQL tự động chạy `database/init.sql` khi khởi động lần đầu.

**Kết nối thủ công:**
```bash
docker exec -it mobilecity_postgres psql -U mobilecity -d mobilecity_db
```

**Xem dữ liệu:**
```sql
SELECT * FROM products;
SELECT * FROM orders;
SELECT * FROM conversations;
SELECT * FROM handoff_requests;
```

## API Endpoints

### Dashboard
- `GET /api/dashboard/stats` — Thống kê tổng quan

### Sản phẩm
- `GET /api/products` — Danh sách (hỗ trợ ?search=&brand=&page=)
- `POST /api/products` — Thêm mới
- `PUT /api/products/{id}` — Cập nhật
- `DELETE /api/products/{id}` — Xoá (soft delete)

### Đơn hàng
- `GET /api/orders` — Danh sách (hỗ trợ ?status=&search=)
- `PUT /api/orders/{id}/status` — Cập nhật trạng thái

### Hội thoại
- `GET /api/conversations` — Danh sách phiên
- `GET /api/conversations/{session_id}` — Chi tiết phiên

### Handoff
- `GET /api/handoffs` — Danh sách yêu cầu
- `PUT /api/handoffs/{id}` — Cập nhật (phân công / giải quyết)

### Rasa Integration
- `POST /api/rasa/log` — Rasa gọi để log conversation

##  Rasa Actions đã tích hợp DB

| Action | Chức năng |
|--------|-----------|
| `action_goi_y_san_pham` | Tư vấn + lọc từ DB |
| `action_xem_thong_so` | Lấy thông số kỹ thuật |
| `action_so_sanh_san_pham` | So sánh 2 sản phẩm |
| `action_bao_gia_tra_gop` | Tính trả góp |
| `action_tao_don_hang` | Tạo đơn trong DB |
| `action_kiem_tra_ton_kho` | Kiểm tra tồn kho |
| `action_gui_thong_bao_handoff` | Tạo handoff request |






##  Dừng hệ thống

```bash
docker compose down          # Dừng container
docker compose down -v       # Dừng + xoá data DB
```
