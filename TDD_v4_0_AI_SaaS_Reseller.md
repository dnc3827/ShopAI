# TECHNICAL DESIGN DOCUMENT (TDD) - AI SAAS RESELLER PLATFORM (V4.0)

**Dự án:** Hệ thống bán tài khoản AI/SaaS Tự động hóa 100%  
**Mô hình:** Kho hàng nạp sẵn (Inventory-based) - Giao hàng tức thì (Instant Delivery)  
**Công nghệ:** React (Vite), Node.js (Express) - JavaScript thuần (CommonJS), Supabase, PayOS, Telegram Bot API.

⚠️ **Backend dùng JavaScript thuần (CommonJS):**
- `require()` thay vì `import`
- `module.exports` thay vì `export`
- Không dùng TypeScript, không có bước build
- Render.com chạy thẳng: `node server.js`

---

## PHẦN 0: THE HUB DESIGN SYSTEM (ĐẦY ĐỦ)

### 0.1. Color Tokens

**Brand Colors:**
- Primary:    `#3b82f6` — nút chính, logo, active state
- Secondary:  `#64748b` — text phụ, icon

**Semantic Colors:**
- Success: `#22c55e` — badge "Còn hạn", trạng thái thành công
- Error:   `#ef4444` — badge "Hết hạn", lỗi, countdown đỏ
- Warning: `#f59e0b` — badge "Sắp hết hàng", "Sắp hết hạn"

**Neutral & Surface:**
- Surface (nền chính):    `#f9f9ff`
- Container (card/modal): `#ffffff`
- Border:                 `#e2e8f0`
- Text Primary:           `#0f172a`
- Text Secondary:         `#64748b`

### 0.2. Typography

Font duy nhất: **Inter**, sans-serif

| Level        | Size  | Weight | Line Height |
|--------------|-------|--------|-------------|
| Headline     | 32px  | 700    | 1.2         |
| Title Large  | 24px  | 600    | 1.3         |
| Title Medium | 18px  | 600    | 1.4         |
| Body         | 16px  | 400    | 1.5         |
| Label/Small  | 14px  | 500    | 1.4         |

### 0.3. Spacing & Layout

**Grid:**
- Desktop: 12 cột, gap 24px, max-width 1280px
- Sản phẩm: 4 cột desktop / 2 cột tablet / 1 cột mobile

**Spacing Scale:**
- Section padding: 64px (trục y)
- Card padding:    24px
- Element gap:     8px / 12px / 16px / 20px

**Breakpoints:**
- Mobile:  < 640px
- Tablet:  640px – 1024px
- Desktop: > 1024px

### 0.4. Components

**Button:**
- Primary: `bg-[#3b82f6] text-white hover:bg-blue-600 transition-colors py-2 px-4 rounded-lg font-medium`
- Ghost:   `bg-transparent border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all py-2 px-4 rounded-lg`

**Product Card:**
- Base:  `bg-white rounded-lg shadow-sm overflow-hidden border border-slate-100 flex flex-col`
- Hover: `hover:shadow-md transition-shadow cursor-pointer`

**Input Field:**
- Default: `w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all`

### 0.5. Border & Shadow

- Border radius: 8px (`rounded-lg`)
- Shadow sm:     `0 1px 2px 0 rgb(0 0 0 / 0.05)`
- Shadow md:     `0 4px 6px -1px rgb(0 0 0 / 0.1)`

### 0.6. Badges & Status Indicators

- Stock Warning: `bg-[#f59e0b]/10 text-[#f59e0b] text-xs font-bold px-2 py-1 rounded`
- Status Xanh:   `bg-[#22c55e]/10 text-[#22c55e] text-xs font-medium px-2 py-1 rounded-full`
- Status Vàng:   `bg-[#f59e0b]/10 text-[#f59e0b] text-xs font-medium px-2 py-1 rounded-full`
- Status Đỏ:     `bg-[#ef4444]/10 text-[#ef4444] text-xs font-medium px-2 py-1 rounded-full`

### 0.7. Tailwind Config (tailwind.config.js)

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#3b82f6',
          dark:    '#2563eb',
        },
        secondary: '#64748b',
        success:   '#22c55e',
        error:     '#ef4444',
        warning:   '#f59e0b',
        surface:   '#f9f9ff',
        container: '#ffffff',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      maxWidth: {
        container: '1280px',
      },
      boxShadow: {
        card:  '0 1px 2px 0 rgba(0,0,0,0.05)',
        modal: '0 4px 6px -1px rgba(0,0,0,0.1)',
      },
    },
  },
  plugins: [],
}
```

⚠️ **AI CODE BẮT BUỘC:**
- Dùng đúng class Tailwind từ config trên
- KHÔNG tự thêm màu ngoài bảng màu
- KHÔNG dùng màu hardcode `#xxx` trong JSX khi đã có class Tailwind tương ứng
- Khai báo `tailwind.config.js` TRƯỚC khi implement bất kỳ component nào

---

## PHẦN 1: CẤU TRÚC DATABASE (SUPABASE)

| Tên Bảng | Các trường dữ liệu chính và bổ sung | Logic / Vai trò | RLS Policy (Phân quyền) |
| :--- | :--- | :--- | :--- |
| **profiles** | id, email, full_name, is_admin | Quản lý người dùng và phân quyền. | User xem profile của mình. |
| **categories** | id, name, slug, icon_url | Phân loại sản phẩm (AI, Giải trí...). | Public Read. |
| **products** | id, category_id, name, description, slug (text, unique, not null), status (text, default 'visible', CHECK IN ('visible','hidden','coming_soon')), is_featured (boolean, default false), thumbnail_url (text), sold_count (integer, default 0), avg_rating (numeric, default 0) | Thông tin sản phẩm chính và siêu dữ liệu hiển thị. | Public Read. |
| **product_variants** | id, product_id, variant_name, price, duration_days (integer, not null), type (text, CHECK IN ('account','family')) | Các gói bán (Tự động/Thủ công). | Public Read. |
| **inventory** | id, variant_id, email, pass, link, status (AVAILABLE/SOLD) | Kho chứa tài khoản nạp sẵn. | User không đọc được (Service Role only). |
| **orders** | id, user_id, status (PENDING/PAID/FULFILLED), order_code (unique), family_email_capture, total_price (numeric, not null), paid_at (timestamptz), created_at (timestamptz, default now()), qr_code (text), payos_id (text) | Lưu mã đơn PayOS, thông tin thanh toán và email gói Family. | User chỉ xem đơn của chính mình. |
| **purchased_items** | id, order_id, user_id, email, pass, link, expiry_date (timestamptz), variant_id (uuid, FK → product_variants), status (text, default 'active'), created_at (timestamptz, default now()) | Tài khoản thực tế đã giao và thời hạn sử dụng của khách. | User chỉ xem item của chính mình. |

---

## PHẦN 2: BACKEND LOGIC & PAYOS (FUNCTIONAL CORE)

### 2.1. Tích hợp PayOS - Các điểm cần lưu ý

⚠️ **order_code:** Phải truyền kiểu **Number** khi gọi PayOS API tạo link, nhưng khi lưu vào Database và so sánh Webhook, phải xử lý dưới dạng **String** để tránh lỗi tràn số (Integer Overflow).

⚠️ **isPaid:** Kiểm tra chính xác điều kiện: `req.body.code === '00' && req.body.success === true`.

⚠️ **Webhook Response:** Luôn trả về `status 200` dù xử lý thành công hay lỗi. Nếu không trả về 200, PayOS sẽ retry liên tục gây lỗi và spam hệ thống.

⚠️ **Description PayOS:** Tối đa 25 ký tự: `product.name.substring(0, 25)`.

⚠️ **Verify HMAC:** Luôn sắp xếp keys của `req.body.data` trước khi check chữ ký. Dùng `Object.keys(req.body.data).sort()`. KHÔNG hardcode danh sách fields.

⚠️ **Proxy:** `app.set('trust proxy', 1)` để nhận đúng IP trên môi trường Cloud. Thêm NGAY SAU khi khởi tạo Express.

### 2.2. Giao dịch an toàn (ACID Transaction)

Khi Webhook báo `PAID` cho gói `type = account`:

1. **START TRANSACTION**
2. **SELECT FOR UPDATE:** Khóa 1 tài khoản `AVAILABLE` trong kho.
3. **Hết hàng:** ROLLBACK, giữ đơn ở trạng thái `PAID`, báo "Cháy kho" qua Telegram.
4. **Có hàng:** Đẩy sang `purchased_items`, cập nhật `inventory.status = SOLD` và `orders.status = FULFILLED`.
5. **COMMIT**

---

## PHẦN 3: FRONTEND - CÁC TRANG CHỨC NĂNG

### 3.1. Luồng mua hàng (Storefront)

- Grid sản phẩm 4 cột (Desktop) / 2 cột (Tablet) / 1 cột (Mobile).
- Badge "Sắp hết hàng" khi tồn kho < 5.
- **Trang Chi tiết Sản phẩm (PDP):** Breadcrumbs, Cột trái (Mô tả Rich Text, FAQ), Cột phải Sticky (Variant Selector, Giá real-time, CTA).

### 3.2. Family Flow

- **Validate:** Email phải hợp lệ (có `@`), không để trống.
- **Lưu trữ:** Lưu vào `orders.family_email_capture`.
- **Webhook PAID:** Nếu `type=family`, giữ `orders.status = 'PAID'` (không auto fulfill).
- **Notification:** Telegram gửi tin nhắn kèm email khách.
- **Fulfillment:** Admin reply → Bot cập nhật → `FULFILLED`.

### 3.3. Inventory Admin UI Spec

Tab **Kho hàng** trong Admin Dashboard:

1. **Bảng thống kê tồn kho:** `Variant name | Tồn kho | Badge đỏ khi < 5`
2. **Nút "Nạp kho" → Modal:**
   - Tab 1 — Nhập thủ công: `Email | Password | Invite Link`, hỗ trợ thêm nhiều dòng.
   - Tab 2 — Upload CSV: format `email,password,invite_link`. Validate email có `@`, pass không trống. Hiện Preview trước khi lưu.
3. **Bảng danh sách kho:** `Email | Status (AVAILABLE/SOLD) | Ngày thêm`. Filter theo variant và status.

### 3.4. Admin Dashboard CRUD Specs

#### QUẢN LÝ SẢN PHẨM (Products)

- **Danh sách:** Bảng có filter theo category và status.
- **Thêm mới:** Form gồm: `name`, `slug` (tự tạo từ name), `description` (Rich Text Editor TipTap — xem 3.6), `category_id` (dropdown), `thumbnail_url`, `status`, `is_featured` (checkbox).
- **Sửa:** Form pre-filled với data hiện tại.
- **Xóa:** Soft Delete — chuyển `status = 'hidden'`. Confirm dialog bắt buộc.

#### QUẢN LÝ GÓI GIÁ (Product Variants)

- **Hiển thị:** Nested theo từng sản phẩm.
- **Thêm mới:** `variant_name`, `price`, `duration_days`, `type` (account/family).
- **Sửa/Xóa:** Confirm dialog bắt buộc.

#### QUẢN LÝ DANH MỤC (Categories)

- CRUD đầy đủ.
- **Ràng buộc xóa:** Kiểm tra còn sản phẩm không → có thì chặn và báo lỗi.

#### QUẢN LÝ ĐƠN HÀNG (Orders)

- **Filter:** PENDING / PAID / FULFILLED.
- **Hiển thị:** Tên khách, sản phẩm, gói, ngày mua, tổng tiền.
- **Giao thủ công:** Nút dành cho đơn PAID bị lỗi auto fulfill.
- **Tiện ích:** Nút Copy `family_email_capture`.

#### QUẢN LÝ KHÁCH HÀNG (Users)

- Danh sách + search theo email.
- Xem lịch sử mua hàng từng user.
- Không có chức năng xóa user.

### 3.5. Auth Flow

- **Đăng ký:** email + password → trigger tạo profile tự động.
- **Đăng nhập:** email + password qua Supabase Auth.
- **Quên mật khẩu:** Supabase Magic Link gửi email.
- **Google OAuth:** Không có trong v1.
- **Phân quyền:** `profiles.is_admin = true`.
- **Route guard:** User thường vào `/admin` → `useEffect` redirect về `/`.

### 3.6. Rich Text Editor (TipTap)

Trường `description` trong form thêm/sửa sản phẩm dùng **TipTap**:

- Hỗ trợ: Bold, Italic, Underline, Heading H1/H2/H3, bullet list, numbered list, căn lề, link.
- Cài đặt: `npm install @tiptap/react @tiptap/starter-kit`
- Hiển thị ngoài PDP: `dangerouslySetInnerHTML`
- KHÔNG dùng `<textarea>` thường cho `description`.

---

## PHẦN 4: TELEGRAM BOT (REPLY & ADMIN ID)

### 4.1. Chi tiết Telegram Bot Reply

- **Cách Bot đọc reply:** Kiểm tra `message.reply_to_message` chứa `order_code` → lấy `order_code` từ text tin nhắn gốc.
- **Validate format:** `email | pass | link` (link có thể bỏ trống: `email | pass |`)
  - Email phải có `@`, pass không trống.
  - Sai format → Bot reply: `❌ Sai format. Thử lại: email | pass | link`
- **Cách lấy TELEGRAM_ADMIN_ID:** Nhắn `@userinfobot` trên Telegram → copy ID.

---

## PHẦN 5: CHIẾN LƯỢC TRIỂN KHAI (MODEL STACK)

1. **Module 1 (Setup & Inventory DB):** Gemini 3 Flash
2. **Module 2 (UI Framework & PDP):** Gemini 3.1 Pro High
3. **Module 3 (Payment & Transaction - PayOS Webhook):** Claude Sonnet 4.6 Thinking
4. **Module 4 (Telegram Bot Integration):** Claude Sonnet 4.6 Thinking
5. **Module 5 (User Dashboard & Frontend Polling):** Claude Sonnet 4.6 Thinking

### ⚠️ Điểm dễ sai Frontend (BẮT BUỘC)

⚠️ **File JSX:** Phải đặt đuôi `.jsx`, không phải `.js`

⚠️ **Guard/Redirect:** Dùng `useEffect`, KHÔNG dùng `if(!user) return redirect` trực tiếp trong render
```javascript
// SAI
if (!user) return <Navigate to="/" />

// ĐÚNG
useEffect(() => {
  if (!user) navigate('/')
}, [user])
```

⚠️ **Supabase Client:** Chỉ khởi tạo 1 instance duy nhất trong `lib/supabase.js`

⚠️ **Token:** Dùng `supabase.auth.getSession()`, KHÔNG dùng localStorage key cứng

⚠️ **API URL:** Dùng `import.meta.env.VITE_API_URL`, KHÔNG hardcode `/api`
```javascript
// SAI
const res = await fetch('/api/products')

// ĐÚNG
const res = await fetch(`${import.meta.env.VITE_API_URL}/products`)
```

⚠️ **Tailwind:** Khai báo custom colors trong `tailwind.config.js` TRƯỚC khi dùng

---

## PHẦN 6: CHECKLIST VERIFY (FULL)

### AUTH & PHÂN QUYỀN
- [ ] Đăng ký email → hệ thống tự tạo profile trong DB.
- [ ] Đăng nhập đúng → chuyển hướng vào dashboard thành công.
- [ ] Đăng nhập sai → hiển thị thông báo lỗi rõ ràng.
- [ ] Magic link quên mật khẩu → nhận được email khôi phục.
- [ ] User xem đúng profile và đơn hàng của mình (RLS active).
- [ ] User thường vào `/admin` → redirect về `/`.
- [ ] Admin vào `/admin` → vào được giao diện quản trị.

### CHECKOUT & AUTO DELIVERY
- [ ] Chọn variant type=account → tự giao sau PAID.
- [ ] Chọn variant type=family → hiện Family Input bắt buộc.
- [ ] Family Input validate email hợp lệ.
- [ ] QR Code hiện ngay sau khi bấm "Thanh toán".
- [ ] Kho còn hàng → FULFILLED tự động sau webhook.
- [ ] Kho hết hàng → Modal cảnh báo "Kho tạm hết".
- [ ] `expiry_date` = now + duration_days đúng.

### ADMIN CRUD
- [ ] Thêm sản phẩm → hiện ngay trang chủ.
- [ ] Ẩn sản phẩm → biến mất khỏi storefront.
- [ ] Thêm variant → hiện đúng trong PDP.
- [ ] Xóa category còn sản phẩm → chặn và báo lỗi.
- [ ] Giao hàng thủ công → đơn FULFILLED.
- [ ] Rich Text Editor hoạt động đầy đủ tính năng.

### TELEGRAM BOT
- [ ] Đơn PAID → Bot thông báo đúng format.
- [ ] Kho hết → Bot cảnh báo đỏ.
- [ ] Đơn Family PAID → Bot gửi kèm email khách.
- [ ] Admin reply đúng format → FULFILLED.
- [ ] Admin reply sai format → Bot báo lỗi.

### USER DASHBOARD
- [ ] `account_pass` ẩn mặc định, nút Reveal hoạt động.
- [ ] `invite_link` copy được vào clipboard.
- [ ] Badge xanh/vàng/đỏ đúng theo hạn.
- [ ] Tab lịch sử đơn hàng hiện đúng.

### INVENTORY ADMIN
- [ ] Nạp kho thủ công hoạt động.
- [ ] Upload CSV validate và import đúng.
- [ ] Tồn kho cập nhật real-time.
- [ ] Badge đỏ khi variant < 5 acc.

### RESPONSIVE
- [ ] Mobile: 1 cột, không vỡ layout.
- [ ] Tablet: 2 cột hợp lý.
- [ ] Desktop: 4 cột đều đặn.

---

## PHẦN 7: CHECKLIST DEPLOY

- [ ] **server/.env đủ:** `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `PAYOS_CLIENT_ID`, `PAYOS_API_KEY`, `PAYOS_CHECKSUM_KEY`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_ADMIN_ID`, `ALLOWED_ORIGINS`, `PORT=3001`
- [ ] **Render.com:** Root Directory = `/server`, Start Command = `node server.js`, `app.set('trust proxy', 1)` có trong code.
- [ ] **Vercel:** Root Directory = `client`, Framework Preset = `Vite`.
- [ ] **VITE_API_URL:** `https://xxx.onrender.com/api` (có `https://` VÀ `/api` ở cuối).
- [ ] **CORS:** `ALLOWED_ORIGINS` = URL Vercel thật sau khi deploy.
- [ ] **PayOS Webhook URL:** `https://xxx.onrender.com/api/webhook/payos`
- [ ] **Test end-to-end** trên production trước khi ra mắt.