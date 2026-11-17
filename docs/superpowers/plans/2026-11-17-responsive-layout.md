# รองรับทุกขนาดจอ — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** แถบน้ำเงินเต็มจอ และการ์ดคำศัพท์เรียงเป็นตารางที่คำนวณจำนวนคอลัมน์จากความกว้างจอเอง ส่วนท้ายหน้าเป็นแถวปุ่มซ้าย-ขวาบนจอ ≥ 640px

**Architecture:** เอา `max-w-md` ออกจาก `#app` ให้ `views.js` จัดความกว้างของแต่ละหน้าเอง แถบด้านบนให้พื้นเต็มจอ และมีกล่องด้านในกว้างเท่ากล่องเนื้อหา การ์ดใช้ grid `auto-fill` ส่วนปุ่มท้ายหน้าใช้ flex ตั้งแต่ `sm:`

**Tech Stack:** Tailwind CSS v4 (arbitrary grid value, `sm:`), `node:test`, Playwright (`/home/claude/tools/check.py`)

**Spec:** `docs/superpowers/specs/2026-11-17-responsive-layout-design.md`

## Global Constraints

- **คลาสของตารางการ์ด** (ใช้ตามนี้ทุกตัวอักษร): `grid-cols-[repeat(auto-fill,minmax(min(100%,18rem),1fr))]`
- **กล่องเนื้อหา:** หน้าหมวดใช้ `mx-auto max-w-6xl px-4 sm:px-6` ส่วนหน้าแรกใช้ `mx-auto max-w-3xl px-4 sm:px-6`
- **แถบน้ำเงิน:** `<header>` ห้ามมีคลาส `max-w-*` (ให้พื้นเต็มจอ) กล่องด้านในใช้ `max-w-*` เดียวกับเนื้อหาของหน้านั้น
- **ระยะห่าง:**
  - ระหว่างการ์ด: `gap-3 sm:gap-5`
  - ขอบในการ์ด: `px-4 py-3 sm:px-5 sm:py-4`
  - ปุ่มหมวดหน้าแรก: `grid gap-3 sm:grid-cols-2`
- **ท้ายหน้าหมวด:**
  - หมวด 1–3: ลิงก์ `#/` ข้อความ `หน้าแรก` ใช้ `hidden sm:inline-flex` (ซ่อนบนมือถือ) ลิงก์หมวดถัดไปใช้ `w-full sm:ml-auto sm:max-w-md`
  - หมวด 4: ลิงก์ `#/` ข้อความ `กลับหน้าแรก` เต็มความกว้างบนมือถือ และ `sm:w-auto` อยู่ซ้ายบนจอที่กว้างกว่า
- **สิ่งที่ห้ามเปลี่ยน:** สี ขนาดตัวหนังสือ หน้าตาบนมือถือ (<640px) ข้อมูล เสียงอ่าน และการเปลี่ยนหน้า
- **จำนวนคอลัมน์ที่ต้องได้ในหน้าหมวด:**

  | ความกว้างจอ (px) | คอลัมน์ |
  |---|---|
  | 390, 600, 640 | 1 |
  | 744, 820 | 2 |
  | 1024, 1133, 1180, 1366, 1440 | 3 |

- **ความกว้างการ์ด:** ทุกใบ ≥ 280px

## Review Focus

1. **จอกว้าง (1366px) แล้วเลื่อนลง:** แถบด้านบนยังติดอยู่บนสุดและเต็มความกว้าง → `check.py` เลื่อนลง 800px แล้วตรวจ `top == 0` และความกว้างเท่ากับ `clientWidth`
2. **จอระหว่างมือถือกับแท็บเล็ต (600px**, เช่น มือถือแนวนอน): ไม่ล้น ได้ 1 คอลัมน์ และปุ่มท้ายหน้าเป็นแบบมือถือ → `check.py` ที่ 600×900
3. **จอพอดีเกณฑ์ 640px:** ปุ่ม "หน้าแรก" กับ "หมวดถัดไป" ต้องอยู่แถวเดียวกันโดยไม่ล้น → `check.py` ที่ 640×960
4. **ชื่อหมวดไทยยาวในแถบด้านบนที่ 744px:** ขึ้นบรรทัดใหม่ ไม่ล้น → การตรวจล้นแนวนอนของหมวด 3 ที่ทุกขนาดจอ
5. **คลิก "หมวดถัดไป" ซึ่งตอนนี้มี 2 ลิงก์ใน `<nav>`:** การตรวจเดิมที่ใช้ `nav a` จะคลิกได้ไม่ชัดว่าตัวไหน → เปลี่ยนเป็น `nav a[href="#/c/2"]`

---

### Task 1: จัดหน้าใหม่ให้รองรับทุกขนาดจอ

**Files:**
- Modify: `public/js/views.js` (`renderHome`, `renderCategory`, `renderCard`, `renderFooter`), `public/index.html` (`#app`)
- Test: `tests/views.test.js`, `/home/claude/tools/check.py`

**Interfaces:**
- Consumes: `hasClass(html, cls)` และ `afterLastCard(html)` ที่มีอยู่แล้วใน `tests/views.test.js`
- Produces: ไม่มี (ไม่มีฟังก์ชันใหม่ที่ส่งออก)

- [ ] **Step 1: เพิ่ม test ที่ยังไม่ผ่านใน `tests/views.test.js`**
  - `หน้าหมวดเป็นตารางปรับคอลัมน์เอง`:
    - `hasClass(cat1, 'grid-cols-[repeat(auto-fill,minmax(min(100%,18rem),1fr))]')`
    - `hasClass(cat1, 'max-w-6xl')`
    - `hasClass(cat1, 'sm:gap-5')`
  - `แถบด้านบนพื้นเต็มจอ`: ในทั้ง `renderHome` และ `renderCategory` ค่า `class` ของแท็ก `<header` ต้องไม่ match `/max-w-/`
  - `ท้ายหน้าหมวด 1–3 มีปุ่มหน้าแรกและหมวดถัดไป`: footer ของหมวด N (N = 1..3) มีทั้ง `href="#/"` (พร้อม `hasClass(footer, 'sm:inline-flex')`) และ `href="#/c/${N+1}"`
  - `หน้าแรกปุ่มหมวด 2×2 บนจอกว้าง`: `hasClass(home, 'sm:grid-cols-2')` และ `hasClass(home, 'max-w-3xl')`
  - `index.html ไม่บีบความกว้างทั้งหน้า`: อ่าน `public/index.html` แล้วต้อง doesNotMatch `/id="app"[^>]*max-w-md/`

- [ ] **Step 2: แก้ `check.py` ให้ยังไม่ผ่าน**
  - เปลี่ยนการคลิก `nav a` ในหมวด 1 เป็น `nav a[href="#/c/2"]` (Review Focus 5)
  - เพิ่มลูปขนาดจอ `RESPONSIVE = [(390,844),(600,900),(640,960),(744,1133),(820,1180),(1024,1366),(1133,744),(1180,820),(1366,1024),(1440,900)]` และตารางคอลัมน์ที่ต้องได้ `{390:1,600:1,640:1,744:2,820:2,1024:3,1133:3,1180:3,1366:3,1440:3}`
    - ที่ 640 ได้ 1 คอลัมน์ เพราะ (592+20)/308 = 1.99 ตามสูตร
  - ทุกขนาดจอ ตรวจทั้งหน้าแรกและหมวด 1, 3:
    - ไม่ล้นแนวนอน
    - `#app header` มีความกว้างเท่ากับ `clientWidth`
  - ทุกขนาดจอ ตรวจเพิ่มในหมวด 1:
    - จำนวนค่า `left` (ปัดเป็นจำนวนเต็ม) ที่ต่างกันของ `[data-card]` ต้องเท่ากับจำนวนคอลัมน์ที่คาดไว้
    - การ์ดทุกใบกว้าง ≥ 280
  - หน้าแรก: ค่า `left` ที่ต่างกันของ `a[data-category]` ต้องเป็น 2 เมื่อกว้าง ≥ 640 ถ้าแคบกว่าต้องเป็น 1
  - **ท้ายหน้าหมวด 1:**
    - กว้าง ≥ 640: ลิงก์ `nav a[href="#/"]` มองเห็นได้ อยู่ซ้ายของ `nav a[href="#/c/2"]` และค่า `top` ห่างกันไม่เกิน 4px (Review Focus 3)
    - แคบกว่า 640: ลิงก์ `nav a[href="#/"]` ต้องมองไม่เห็น
  - **(Review Focus 1)** ที่ 1366: อยู่ในหมวด 1 แล้ว `scrollTo(0,800)` → `header.getBoundingClientRect().top == 0` และความกว้างเท่ากับ `clientWidth`
  - ถ่ายภาพ viewport ของหมวด 1 ทุกขนาด `resp-{w}x{h}.png` และหน้าแรกที่ 1366 `resp-home-1366.png`

- [ ] **Step 3: รัน `npm test` และ `check.py` แล้วต้องไม่ผ่าน** ตามข้อที่เพิ่มไป

- [ ] **Step 4: แก้ `views.js` และ `index.html` ตาม Global Constraints**
  - หน้าแรก: `<header class="bg-navy text-white">` ข้างในเป็น `<div class="mx-auto max-w-3xl px-5 pt-10 pb-6 sm:px-6">` ส่วน `<ul>` ใช้ `mx-auto grid max-w-3xl gap-3 px-4 pt-4 pb-10 sm:grid-cols-2 sm:px-6` (เอา `space-y-3` ออก)
  - หน้าหมวด: `<header class="sticky top-0 z-10 bg-navy text-white">` ข้างในเป็น `<div class="mx-auto flex max-w-6xl items-center gap-1 px-2 py-2 sm:px-4">` แล้ว `<section>` ใช้ grid ตาม Global Constraints พร้อม `py-4 sm:py-6`
  - `<nav>`: `mx-auto flex max-w-6xl flex-col gap-3 px-4 pb-10 sm:flex-row sm:items-center sm:px-6`
  - ปุ่มหน้าแรก (หมวด 1–3): ขอบ `accent-strong` พื้นขาว ไอคอน back กับคำว่า "หน้าแรก"
  - `index.html`: `<main id="app" class="min-h-dvh">`

- [ ] **Step 5: รัน `npm test && npm run build && python3 -I /home/claude/tools/check.py /home/claude/hotel-vocab /home/claude/tools/shots`** ผลที่ต้องได้คือผ่านทั้งหมดและขึ้น `ALL CHECKS PASSED`

- [ ] **Step 6: เปิดภาพ `resp-744x1133.png`, `resp-1024x1366.png`, `resp-1366x1024.png` และ `resp-home-1366.png`** สิ่งที่ต้องเห็น:
  - แถบเต็มจอ
  - การ์ดมีระยะห่าง ไม่เบียด
  - ปุ่มท้ายหน้าอยู่ซ้าย-ขวา
  - ภาพมือถือ 390 ต้องเหมือนก่อนแก้ทุกอย่าง

- [ ] **Step 7: Commit** `feat: responsive layout for tablet and desktop`

- [ ] **Step 8: คัดลอก `views.js`, `index.html`, `tests/views.test.js` และแผนนี้ไปที่ `C:\khem`**
  - ใช้ชื่อไฟล์ใหม่ใน staging
  - ตรวจขนาดไฟล์ด้วย `device_list_dir` เฉพาะโฟลเดอร์ย่อย (ห้าม recursive ที่ root เพราะ `node_modules` ใหญ่)

## แก้หลังตรวจทาน (2026-11-17)
- **ปัญหาเดิม:** จอ 640–659px ซึ่งรวมหน้าต่าง Windows ที่มีแถบเลื่อนและจัดไว้ครึ่งจอ 1280px ได้การ์ดคอลัมน์เดียวกว้างเกือบ 600px ซึ่งคือการ์ดยืดแบบที่เจ้าของไม่ต้องการ ส่วนที่ 620–639px กลับได้ 2 คอลัมน์
- **ตารางการ์ด:** เปลี่ยนเป็น `grid sm:grid-cols-[repeat(auto-fill,minmax(17.5rem,1fr))]`
  - ต่ำกว่า 640px เป็นคอลัมน์เดียวเสมอ (แบบมือถือ)
  - ตั้งแต่ 640px การ์ดกว้างขั้นต่ำ 280px
- **ขอบข้างของการ์ด แถบ และปุ่มท้ายหน้า:** ใช้ 16px จนถึง 767px และ 24px ตั้งแต่ 768px (`md:px-6`) ทำให้ 640px ได้ 2 คอลัมน์แม้มีแถบเลื่อน
- **จำนวนคอลัมน์ใหม่:**

  | ความกว้างจอ (px) | คอลัมน์ |
  |---|---|
  | 390, 600, 630 | 1 |
  | 640, 744, 820 | 2 |
  | 1024 ขึ้นไป | 3 |

- **การตรวจแถบติดค้าง:** ย้ายไปตรวจที่ 1366×600 แบบมีปุ่มเสียง หน้าจะเลื่อนได้จริง
