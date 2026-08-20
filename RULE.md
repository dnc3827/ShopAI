# RULE.md — ShopAI UI Upgrade Rules
# Nguồn: DESIGN.md (cũ) + DESIGN2.md (mới)
# Chỉ dùng cho nâng cấp UI storefront. Không áp dụng cho /admin.

---

## 1. TYPOGRAPHY

| Token              | Giá trị       | Ghi chú                  |
|--------------------|---------------|--------------------------|
| font.family        | sans-serif    | Thay Inter (cũ)          |
| font.size.base     | 12px          | Line-height: normal      |
| font.weight.base   | 400           | Giữ nguyên               |
| font.size.xs       | 12px          |                          |
| font.size.sm       | 14px          |                          |
| font.size.md       | 15px          |                          |
| font.size.lg       | 16px          |                          |
| font.size.xl       | 22px          |                          |
| font.size.2xl      | 26px          |                          |
| font.size.3xl      | 42px          | Bổ sung từ DESIGN-NEW    |
| font.size.4xl      | 60px          | Hero/display text        |

---

## 2. COLOR PALETTE

### Màu thay đổi (từ DESIGN-NEW)
| Token                 | Giá trị   | Thay thế cái cũ       |
|-----------------------|-----------|-----------------------|
| color.surface.base    | #000000   | Giữ nguyên            |
| color.surface.raised  | #ff9752   | Cũ: #3b82f6 (xanh)   |
| color.surface.strong  | #f7f7f7   | Cũ: #f9f9ff           |
| color.text.secondary  | #ffffff   | Cũ: #64748b           |
| color.text.tertiary   | #0000ee   | Cũ: #1e293b           |

### Màu giữ nguyên (từ DESIGN-OLD, không bị ghi đè)
| Token                 | Giá trị   |
|-----------------------|-----------|
| color.text.primary    | #0f172a   |
| color.surface.muted   | #ffffff   |
| color.border.default  | #e5e7eb   |
| color.border.muted    | #f1f5f9   |
| color.border.strong   | #e2e8f0   |

---

## 3. SPACING (Compact scale — từ DESIGN-NEW)

| Token   | Giá trị | Cũ     |
|---------|---------|--------|
| space.1 | 6px     | 8px    |
| space.2 | 8px     | 10px   |
| space.3 | 10px    | 14px   |
| space.4 | 12px    | 16px   |
| space.5 | 14px    | 24px   |
| space.6 | 16px    | 32px   |
| space.7 | 20px    | 44px   |
| space.8 | 24px    | 48px   |

---

## 4. BORDER RADIUS (Ultra-rounded — từ DESIGN-NEW)

| Token      | Giá trị  | Cũ          |
|------------|----------|-------------|
| radius.xs  | 28px     | 8px         |
| radius.sm  | 32px     | 12px        |
| radius.md  | 9999px   | 9999px (giữ)|

---

## 5. SHADOW

| Token    | Giá trị                                                                                  |
|----------|------------------------------------------------------------------------------------------|
| shadow.1 | rgba(0,0,0,0.04) 0 1px 2px, rgba(0,0,0,0.02) 0 2px 4px, rgba(0,0,0,0.02) 0 4px 8px   |
| shadow.2 | none (rgba(0,0,0,0) 0 0 0 0)                                                            |

---

## 6. MOTION (Giữ nguyên từ DESIGN-OLD)

| Token                   | Giá trị |
|-------------------------|---------|
| motion.duration.instant | 150ms   |
| motion.duration.fast    | 200ms   |
| motion.duration.normal  | 300ms   |

---

## 7. COMPONENT RULES (Áp dụng cho mọi component)

Mỗi component PHẢI định nghĩa đủ 7 trạng thái:
`default` | `hover` | `focus-visible` | `active` | `disabled` | `loading` | `error`

Mỗi component PHẢI xử lý:
- Responsive (mobile → desktop)
- Long content / overflow / empty-state
- Keyboard + pointer + touch behavior

---

## 8. ACCESSIBILITY

- Tiêu chuẩn bắt buộc: **WCAG 2.2 AA**
- Bắt buộc focus-visible rõ ràng trên mọi element tương tác
- Cấm text độ tương phản thấp
- Mọi rule accessibility phải kiểm thử được trong code

---

## 9. RULES: DO / DON'T

### ✅ DO
- Dùng semantic token, KHÔNG dùng hex thô trong component
- Mọi label phải rõ nghĩa, không mơ hồ
- Ưu tiên nhất quán hệ thống hơn ngoại lệ cục bộ

### ❌ DON'T
- Không tự sáng tác giá trị spacing/typography ngoài bảng token ở trên
- Không ẩn focus indicator
- Không phát hành component thiếu state rules
- Không động vào bất kỳ file nào trong `/admin`

---

## 10. SCOPE

| Phạm vi nâng cấp            | Ghi chú              |
|-----------------------------|----------------------|
| `index.css`, `tailwind.config` | Global — làm đầu tiên |
| `components/layout/*`       | Header, Footer, MainLayout |
| `components/ui/*`           | Button, Badge, Card, ProductCard, QRPaymentModal, Typography |
| `pages/*` (trừ AdminPage)   | 7 pages storefront   |
| ⛔ `components/admin/*`     | KHÔNG CHẠM           |
| ⛔ `pages/AdminPage.tsx`    | KHÔNG CHẠM           |
