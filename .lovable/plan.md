
# POS ร้านกาแฟ (iPhone-first) — แผนงาน

แอป POS สำหรับใช้บนไอโฟน สไตล์คล้าย Loyverse โทน Loyverse Blue, ฟอนต์ Space Grotesk + DM Sans (คู่กับ Noto Sans Thai), เลย์เอาต์สินค้าแบบผสมรูป+ปุ่ม

## ขอบเขต

**ฟีเจอร์หลัก**
- ล็อกอิน 2 บทบาท: เจ้าของ (owner) และพนักงาน (staff)
- หน้าขาย: หมวดหมู่ + กริดสินค้า + ตะกร้า + เก็บเงิน (เงินสด/โอน)
- ใบเสร็จ: แสดง/พิมพ์เบื้องต้น (บันทึกภาพ/พิมพ์ผ่าน browser)
- ประวัติการขาย: รายการบิล, ยอดรวมวัน, ดูรายละเอียดบิล
- จัดการเมนู/สินค้า: เพิ่ม/แก้/ลบสินค้า, หมวดหมู่, ราคา, สี/รูป (owner เท่านั้น)

**นอกขอบเขต (รอบนี้)** — พิมพ์ผ่านเครื่องพิมพ์บลูทูธ, สต็อกวัตถุดิบ, สมาชิก/แต้ม, รายงานสถิติขั้นสูง, ภาษี, ส่วนลดขั้นสูง

## หน้าจอ (mobile 390px)

1. `/auth` — Login (อีเมล + รหัสผ่าน)
2. `/` — หน้าขาย: header ชื่อร้าน + shift, category chips เลื่อนแนวนอน, กริดสินค้า 2 คอลัมน์, floating cart bar ด้านล่างเหนือ tab
3. `/cart` (sheet) — รายการในตะกร้า, ปรับจำนวน, ยอดรวม, ปุ่ม "เก็บเงิน"
4. `/checkout` — เลือกวิธีจ่าย (เงินสด/โอน), รับเงิน + คำนวณเงินทอน, ยืนยัน
5. `/receipt/:id` — ใบเสร็จหลังจ่ายเสร็จ
6. `/history` — รายการบิลย้อนหลัง + ยอดสรุปวัน
7. `/history/:id` — รายละเอียดบิล
8. `/products` (owner) — จัดการสินค้า + หมวดหมู่
9. `/settings` — โปรไฟล์, ชื่อร้าน, ออกจากระบบ

**Bottom tab bar** (แสดงในหน้าหลัก): ขาย · ประวัติ · สินค้า · ตั้งค่า

## Backend (Lovable Cloud)

**Auth**: อีเมล + รหัสผ่าน. Auto-confirm เปิดไว้เพื่อทดสอบง่าย

**ตาราง**
- `profiles` (id → auth.users, full_name, shop_name)
- `user_roles` (id, user_id, role: 'owner'|'staff') — enum + `has_role()` security definer
- `categories` (id, name, color, sort_order, owner_id)
- `products` (id, category_id, name, price, image_url, color, is_active, owner_id)
- `orders` (id, cashier_id, owner_id, subtotal, total, payment_method: 'cash'|'transfer', cash_received, change_amount, created_at)
- `order_items` (id, order_id, product_id, name_snapshot, price_snapshot, qty, line_total)

**RLS**
- profiles: read/update ของตัวเอง
- user_roles: `SELECT` ตัวเอง; INSERT/UPDATE เฉพาะ owner (ผ่าน `has_role`)
- categories/products: owner ที่เป็นเจ้าของร้านแก้ได้, staff อ่านได้ (join ผ่าน `owner_id` ที่ตรงกับ shop ของ staff — เวอร์ชันแรกใช้โมเดล single-shop-per-owner: staff ถูก assign owner_id ตอน invite/สมัคร)
- orders/order_items: staff/owner ของร้านเดียวกันเห็นได้, insert เฉพาะตัวเอง

**Seed**: สร้าง trigger auto-insert profile + role='owner' เมื่อสมัครใหม่ (ผู้สมัครคนแรกจากอีเมลใหม่ = owner)

## เทคนิค (สำหรับผู้พัฒนา)

- TanStack Start + React 19, Tailwind v4, shadcn/ui
- ฟอนต์: `<link>` Google Fonts (Space Grotesk, DM Sans, Noto Sans Thai) ใน `__root.tsx` head
- Design tokens ใน `src/styles.css` @theme: primary `#2d8ac9`, primary-dark `#1a4a6e`, bg `#f5f7fa`, border `#e4e9f0`
- State ตะกร้า: Zustand หรือ React context (ไม่ persist ข้าม session)
- Route โครงสร้าง: `_authenticated/` layout สำหรับทุกหน้ายกเว้น `/auth`
- Server functions ใช้ `requireSupabaseAuth` สำหรับ read/write orders + products
- Preview viewport → mobile

## ลำดับการทำ

1. Enable Lovable Cloud + สร้าง schema/RLS/trigger
2. ตั้ง design tokens + ฟอนต์ + shell (bottom tab, header)
3. หน้า auth + protected layout
4. หน้าขาย + ตะกร้า + checkout + receipt
5. หน้าประวัติ + รายละเอียดบิล
6. หน้าจัดการสินค้า/หมวดหมู่ (owner-only guard)
7. หน้าตั้งค่า + logout
8. Seed ข้อมูลตัวอย่างเมนูกาแฟ (เอสเปรสโซ่, ลาเต้, คาปูชิโน่, อเมริกาโน่, มอคค่า, มัทฉะ ฯลฯ)
