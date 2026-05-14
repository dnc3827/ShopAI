# TECHNICAL DESIGN DOCUMENT (TDD) - AI SAAS RESELLER PLATFORM (V3.5)

**Dự án:** Hệ thống bán tài khoản AI/SaaS Tự động hóa 100%
**Mô hình:** Kho hàng nạp sẵn (Inventory-based) - Giao hàng tức thì (Instant Delivery)
**Công nghệ:** React (Vite), Node.js (Express), Supabase, PayOS, Telegram Bot API.

---

## PHẦN 0: THE HUB DESIGN SYSTEM

Hệ thống tuân thủ nghiêm ngặt bộ nhận diện thương hiệu để đảm bảo sự chuyên nghiệp và tin cậy:

* **Nguyên tắc:** Minimalist (Tối giản), Modern (Hiện đại), Trust (Tin cậy).
* **Bảng màu (Color Palette):**
    * **Primary:** `#3b82f6` (Blue) - Nút chính, trạng thái active, Logo.
    * **Secondary:** `#64748b` (Slate) - Văn bản phụ, icon.
    * **Background:** `Surface: #f9f9ff` (Nền chính) | `Container: #ffffff` (Card, Modal).
    * **Semantic:** `Success: #22c55e`, `Error: #ef4444`, `Warning: #f59e0b`.
* **Typography:** Font **Inter**.
    * Headline: Bold (700).
    * Title: Semi-bold (600).
    * Body: Regular (400).
    * Label: Medium (500).
* **UI Components:** Bo tròn góc `8px`, đổ bóng `shadow-sm`.

---

## PHẦN 1: CẤU TRÚC DATABASE (SUPABASE)

| Tên Bảng | Các trường dữ liệu chính | Logic / Vai trò | **RLS Policy (Phân quyền)** |
| :--- | :--- | :--- | :--- |
| **profiles** | id, email, full_name, is_admin | Quản lý người dùng và phân quyền. | User xem profile của mình. |
| **categories** | id, name, slug, icon_url | Phân loại sản phẩm (AI, Giải trí...). | Public Read. |
| **products** | id, category_id, name, description | Thông tin sản phẩm chính. | Public Read. |
| **product_variants** | id, product_id, variant_name, price | Các gói bán (Tự động/Thủ công). | Public Read. |
| **inventory** | id, variant_id, email, pass, link, status | Kho chứa tài khoản nạp sẵn. | **User không đọc được (Service Role only).** |
| **orders** | id, user_id, status, order_code, family_email | Lưu mã đơn PayOS và email Family. | **User chỉ xem đơn của chính mình.** |
| **purchased_items** | id, order_id, user_id, email, pass, link | Tài khoản đã giao cho khách. | **User chỉ xem item của chính mình.** |

---

## PHẦN 2: BACKEND LOGIC & PAYOS (FUNCTIONAL CORE)

### 2.1. Tích hợp PayOS - Các điểm cần lưu ý:
* ⚠️ **order_code:** Phải truyền kiểu **Number** khi gọi PayOS API tạo link, nhưng khi lưu vào Database và so sánh Webhook, phải xử lý dưới dạng **String** để tránh lỗi tràn số (Integer Overflow).
* ⚠️ **isPaid:** Kiểm tra chính xác điều kiện: `req.body.code === '00' && req.body.success === true`.
* ⚠️ **Webhook Response:** **Luôn trả về status 200 dù xử lý thành công hay lỗi.** Nếu không trả về 200, PayOS sẽ retry liên tục gây spam và lỗi logic.
* ⚠️ **Description PayOS:** Tối đa 25 ký tự. Nội dung chuyển khoản nên được xử lý: `product.name.substring(0, 25)`.
* ⚠️ **Verify HMAC:** Luôn sắp xếp keys của `req.body.data` trước khi check chữ ký.
* ⚠️ **Proxy:** `app.set('trust proxy', 1)` để nhận đúng IP trên môi trường Cloud (Railway).

### 2.2. Giao dịch an toàn (ACID Transaction)
Khi Webhook báo `PAID` cho gói `type = account`:
1.  **START TRANSACTION**.
2.  **SELECT FOR UPDATE:** Khóa 1 tài khoản `AVAILABLE` trong kho.
3.  **Hết hàng:** ROLLBACK, giữ đơn ở trạng thái `PAID`, báo "Cháy kho" qua Telegram.
4.  **Có hàng:** Đẩy sang `purchased_items`, cập nhật `inventory.status = SOLD` và `orders.status = FULFILLED`.
5.  **COMMIT**.

---

## PHẦN 3: FRONTEND - CÁC TRANG CHỨC NĂNG

### 3.1. Luồng mua hàng (Storefront)
* Grid sản phẩm 4 cột (Desktop) / 1 cột (Mobile). Badge "Sắp hết hàng" khi tồn kho < 5.
* **Trang Chi tiết Sản phẩm (PDP):** Breadcrumbs, Cột trái (Mô tả, FAQ), Cột phải (Sticky Selector, Giá, CTA).

### 3.2. Làm rõ Family Flow:
* **Validate:** Email khách cung cấp phải hợp lệ (có `@`), không được để trống.
* **Lưu trữ:** Lưu vào trường `orders.family_email_capture`.
* **Webhook PAID:** Nếu `type=family`, giữ `orders.status = 'PAID'` (không auto fulfill).
* **Notification:** Telegram gửi tin nhắn kèm email khách.
* **Fulfillment:** Admin reply tin nhắn -> Bot cập nhật hệ thống -> Chuyển sang `FULFILLED`.

### 3.3. Inventory Admin UI Spec:
Tab Kho hàng trong Dashboard Admin bao gồm:
1.  **Bảng thống kê tồn kho:** `Variant name | Tồn kho | Badge (Đỏ khi < 5)`.
2.  **Nút "Nạp kho" mở Modal:**
    * **Tab 1 — Nhập thủ công:** `Email | Password | Invite Link`. Hỗ trợ thêm nhiều dòng.
    * **Tab 2 — Upload CSV:** Format `email,password,invite_link`. Validate email có `@`, pass không trống. Hiện Preview trước khi lưu.
3.  **Bảng danh sách kho:** `Email | Status (AVAILABLE/SOLD) | Ngày thêm`. Filter theo variant và status.

---

## PHẦN 4: TELEGRAM BOT (REPLY & ADMIN ID)

### 4.1. Chi tiết Telegram Bot Reply:
* **Cách Bot đọc reply:** Kiểm tra `message.reply_to_message` chứa `order_code` -> lấy `order_code` từ text tin nhắn gốc.
* **Validate format:** `email | pass | link` (link có thể bỏ trống).
    * Email phải có `@`, pass không trống.
    * Nếu sai -> Bot reply: *"❌ Sai format. Thử lại: email | pass | link"*.
* **Cách lấy TELEGRAM_ADMIN_ID:** Nhắn `@userinfobot` trên Telegram để lấy và copy ID.

---

## PHẦN 5: CHIẾN LƯỢC TRIỂN KHAI (MODEL STACK)

1.  **Module 1 (Setup & Inventory DB):** Gemini 3 Flash.
2.  **Module 2 (UI Framework & PDP):** Gemini 3.1 Pro High.
3.  **Module 3 (Payment & Transaction):** Claude Sonnet 4.6 Thinking.
4.  **Module 4 (Telegram & User Dashboard):** Claude Sonnet 4.6 Thinking.
5.  **Module 5 (User Dashboard & Frontend Polling):** Claude Sonnet 4.5 Thinking.

---

## PHẦN 6: CHECKLIST VERIFY (FULL)

### AUTH & PHÂN QUYỀN
* [ ] Đăng ký email → tạo profile tự động.
* [ ] User xem đúng profile và đơn hàng của mình (RLS active).
* [ ] User thường vào /admin → redirect /.
* [ ] Admin vào /admin → vào được.

### CHECKOUT & AUTO DELIVERY
* [ ] Chọn variant type=account → tự giao sau PAID.
* [ ] Chọn variant type=family → hiện Family Input.
* [ ] Family Input validate email hợp lệ.
* [ ] QR hiện sau khi bấm "Thanh toán".
* [ ] Kho còn hàng → FULFILLED tự động sau webhook.
* [ ] Kho hết hàng → Modal "Kho tạm hết".

### TELEGRAM BOT
* [ ] Đơn PAID → Bot gửi thông báo đúng format.
* [ ] Kho hết → Bot gửi cảnh báo đỏ.
* [ ] Admin reply đúng format → đơn FULFILLED.

### USER DASHBOARD
* [ ] account_pass ẩn, nút Reveal hoạt động.
* [ ] Badge xanh/vàng/đỏ đúng theo hạn.

### INVENTORY ADMIN
* [ ] Nạp kho thủ công & Upload CSV hoạt động chuẩn.
* [ ] Số tồn kho hiển thị đúng real-time & Badge đỏ khi < 5 acc.

---

## PHẦN 7: CHECKLIST DEPLOY

* [ ] **server/.env đủ các biến bảo mật.**
* [ ] **Railway:** Root Directory = `/server`, `app.set('trust proxy', 1)` đã có.
* [ ] **Vercel:** Root Directory = `client`, Framework = `Vite`.
* [ ] **VITE_API_URL:** Phải có `https://` và `/api` ở cuối.
* [ ] **PayOS Webhook URL:** Đã cấu hình chính xác để nhận status 200.
* [ ] **Test end-to-end trên production.**

---