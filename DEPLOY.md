# DEPLOY CHECKLIST — ShopAI

## 1. Supabase Setup
- [ ] Run migration `001_initial_schema.sql` in SQL Editor
- [ ] Run migration `002_rls_policies.sql` (idempotent — safe to re-run)
- [ ] Run migration `003_fulfill_order_transaction.sql`
- [ ] Run migration `004_order_items.sql`
- [ ] Verify RLS is enabled on all tables
- [ ] Copy `SUPABASE_URL` and keys from Project Settings → API

## 2. PayOS Setup
- [ ] Create account at payos.vn
- [ ] Get: `PAYOS_CLIENT_ID`, `PAYOS_API_KEY`, `PAYOS_CHECKSUM_KEY`
- [ ] Configure Webhook URL in PayOS dashboard:
  ```
  https://YOUR_RAILWAY_URL/api/orders/webhook/payos
  ```
- [ ] Test webhook returns 200

## 3. Telegram Bot Setup
- [ ] Message @BotFather → /newbot → get `TELEGRAM_BOT_TOKEN`
- [ ] Message @userinfobot → get your `TELEGRAM_ADMIN_ID`
- [ ] Set webhook for bot:
  ```
  https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://YOUR_RAILWAY_URL/api/telegram/webhook
  ```

## 4. Railway (Server Deploy)
- [ ] Connect GitHub repo to Railway
- [ ] **Root Directory:** `/server`
- [ ] **Build Command:** `npm run build`
- [ ] **Start Command:** `node dist/index.js`
- [ ] Add all environment variables:
  ```env
  NODE_ENV=production
  PORT=5000
  SUPABASE_URL=https://xxx.supabase.co
  SUPABASE_ANON_KEY=...
  SUPABASE_SERVICE_ROLE_KEY=...
  PAYOS_CLIENT_ID=...
  PAYOS_API_KEY=...
  PAYOS_CHECKSUM_KEY=...
  TELEGRAM_BOT_TOKEN=...
  TELEGRAM_ADMIN_ID=...
  CLIENT_URL=https://YOUR_VERCEL_APP.vercel.app
  ```
- [ ] `app.set('trust proxy', 1)` — đã có trong code ✅
- [ ] Note Railway URL after deploy

## 5. Vercel (Client Deploy)
- [ ] Connect GitHub repo to Vercel
- [ ] **Root Directory:** `client`
- [ ] **Framework Preset:** Vite
- [ ] **Build Command:** `npm run build`
- [ ] **Output Directory:** `dist`
- [ ] Add environment variables:
  ```env
  VITE_SUPABASE_URL=https://xxx.supabase.co
  VITE_SUPABASE_ANON_KEY=...
  VITE_API_URL=https://YOUR_RAILWAY_URL/api
  ```
  ⚠️ `VITE_API_URL` phải có `https://` và `/api` ở cuối
- [ ] `vercel.json` đã có — SPA routing tự động ✅

## 6. Post-Deploy Verification
- [ ] `GET https://YOUR_RAILWAY_URL/health` → `{"status":"ok"}`
- [ ] Đăng ký tài khoản mới → profile tự tạo
- [ ] User thường vào /admin → redirect về /
- [ ] Admin vào /admin → vào được
- [ ] Mua sản phẩm type=account → giao tự động sau webhook
- [ ] Mua gói Family → Telegram nhận thông báo → Admin reply → FULFILLED
- [ ] Nạp kho thủ công & CSV hoạt động
- [ ] Badge đỏ khi < 5 tồn kho

## 7. Security Hardening
- [ ] Ensure `SUPABASE_SERVICE_ROLE_KEY` không bao giờ expose ra client
- [ ] Ensure `PAYOS_CHECKSUM_KEY` chỉ có ở server
- [ ] CORS chỉ allow `CLIENT_URL`
- [ ] PayOS webhook verify HMAC trước khi xử lý ✅
- [ ] Telegram webhook chỉ xử lý message từ `TELEGRAM_ADMIN_ID` ✅
