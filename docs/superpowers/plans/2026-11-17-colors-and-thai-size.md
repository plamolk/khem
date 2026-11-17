# ปรับสี 60-30-10 และขยายภาษาไทย — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** เปลี่ยนธีมแดงเป็นชุดสี ขาวนวล/เทาเข้ม/น้ำเงินเข้ม/ส้ม ตามสัดส่วน 60-30-10 และขยายภาษาไทยบนการ์ดเป็น 17px

**Architecture:** กำหนดสีทั้งหมดเป็น token ใน `@theme` ของ `src/input.css` แล้วให้ `views.js` เรียกสีผ่านชื่อ token (`bg-navy`, `bg-accent`, …) แทนสี `red-*`/`stone-*` มีชุดทดสอบตรวจความต่างของสี (contrast) โดยอ่านค่าจากไฟล์ CSS ตรงๆ

**Tech Stack:** Tailwind CSS v4 `@theme`, `node:test`, Playwright (`/home/claude/tools/check.py`)

**Spec:** `docs/superpowers/specs/2026-11-17-colors-and-thai-size-design.md`

## Global Constraints

- **ค่าสี:**
  - `cream #FAF7F0`
  - `ink #3F3F46`
  - `ink-soft #71717A`
  - `line #E6E0D4`
  - `navy #1E3A5F`
  - `navy-soft #C7D2E0`
  - `accent #EA580C`
  - `accent-strong #C2410C`
- ห้ามมีคลาส `red-*` หรือ `stone-*` เหลืออยู่ใน `views.js` และ `index.html`
- **ขนาดตัวอักษร:**
  - ภาษาไทยบนการ์ดและชื่อหมวดไทยในหน้าแรก: `text-[17px] font-medium`
  - ชื่ออังกฤษ/"15 คำ" ในหน้าแรก และคำว่า "หมวดถัดไป": 13px
- ชื่อเว็บเป็น `หมวดหมู่คำศัพท์` (`<title>` และ `SITE_TITLE` ต้องตรงกัน)
- `theme-color` เป็น `#1E3A5F`
- น้ำหนักตัวอักษรใช้แค่ 400 กับ 500 และทุกปุ่มยังต้องมีพื้นที่กดอย่างน้อย 44px
- ห้ามแตะ `data.js` และ `speech.js` ส่วน `app.js` ห้ามเปลี่ยนพฤติกรรม

## Review Focus

1. **จอ 360px กับชื่อไทยยาวที่ตอนนี้ตัวใหญ่ขึ้น** (เช่น "บริการทั่วไปและสิ่งอำนวยความสะดวกส่วนกลาง"): ต้องขึ้นบรรทัดใหม่ ไม่ล้นจอ → ตรวจใน `check.py` (Task 2) ที่ทุกหน้า
2. **ปุ่มตอนกำลังอ่านต้องต่างจากปุ่มปกติชัดเจน** (เดิมคือแดงอ่อนกับแดงเข้ม ตอนนี้คือส้มกับน้ำเงิน): ใน `check.py` ให้ตรวจสีพื้นที่วัดได้จริงของวงกลมตอนกำลังอ่าน ว่าต่างจากตอนปกติ (Task 2)
3. **ตัวหนังสือรองบนแถบน้ำเงิน** (ชื่ออังกฤษของหมวด): ต้องอ่านได้ → ตรวจคู่สี `navy-soft` บน `navy` ใน `theme.test.js` (Task 1)
4. **ปุ่ม "กลับหน้าแรก" ในหมวด 4** ซึ่งเป็นปุ่มขอบส้มบนพื้นขาว: ตัวหนังสือต้องอ่านได้ → ตรวจคู่สี `accent-strong` บนขาว (Task 1)
5. **Tailwind ไม่สร้างคลาสจากชื่อ token** (เช่น พิมพ์ชื่อผิด): หน้าเว็บจะไม่มีสีโดยไม่มี error ใดๆ → ใน `check.py` ให้ตรวจว่าสีพื้นที่วัดได้จริงของ `body` คือ `rgb(250, 247, 240)` และแถบด้านบนคือ `rgb(30, 58, 95)` (Task 2)

---

### Task 1: ชุดสีใน `@theme` และทดสอบความต่างของสี

**Files:**
- Modify: `src/input.css`
- Test: `tests/theme.test.js`

**Interfaces:**
- Produces: CSS custom properties `--color-cream`, `--color-ink`, `--color-ink-soft`, `--color-line`, `--color-navy`, `--color-navy-soft`, `--color-accent`, `--color-accent-strong` ทั้งหมดอยู่ใน `@theme` ซึ่งจะได้ utility `bg-*`, `text-*`, `border-*` ตามชื่อเหล่านี้ (Task 2 ใช้)

- [ ] **Step 1: เขียน test ที่ยังไม่ผ่าน `tests/theme.test.js`**
  - อ่าน `src/input.css` แล้วดึงค่าด้วย `/--color-([a-z-]+):\s*(#[0-9a-fA-F]{6})/g`
  - เขียน helper `contrast(hexA, hexB)` ตามสูตร WCAG 2.x (relative luminance)
  - test `มีครบ 8 สีตามสเปก`: deepEqual กับค่าใน Global Constraints
  - test `ตัวหนังสือผ่าน AA 4.5:1` สำหรับคู่สีเหล่านี้:
    - ink/cream, ink/#FFFFFF
    - ink-soft/cream, ink-soft/#FFFFFF
    - #FFFFFF/navy
    - navy-soft/navy
    - navy/#FFFFFF
    - #FFFFFF/accent-strong
    - accent-strong/#FFFFFF
  - test `ไอคอนผ่าน 3:1` สำหรับ #FFFFFF/accent และ #FFFFFF/navy

- [ ] **Step 2: รัน `node --test tests/theme.test.js` แล้วต้องไม่ผ่าน** เพราะยังไม่มี `--color-*`

- [ ] **Step 3: เพิ่ม `@theme` ทั้ง 8 สีใน `src/input.css`** ใส่ไว้ใน `@theme` เดิม ข้างๆ `--font-sans`

- [ ] **Step 4: รัน `npm test`** ผลที่ต้องได้คือ theme ผ่านทั้งหมด ส่วน `views.test.js` ยังไม่ผ่าน 2 ข้อจากเรื่องชื่อเว็บ (Task 2 จะแก้)

- [ ] **Step 5: Commit** `feat: 60-30-10 color tokens with contrast tests`

---

### Task 2: ใช้สีใหม่และขยายภาษาไทยในหน้าเว็บ

**Files:**
- Modify: `public/js/views.js`, `public/index.html`, `public/favicon.svg`, `src/input.css` (`body`, `.speak-btn.is-speaking`)
- Test: `tests/views.test.js`, `/home/claude/tools/check.py`

**Interfaces:**
- Consumes: ชื่อ token จาก Task 1 (`cream`, `ink`, `ink-soft`, `line`, `navy`, `navy-soft`, `accent`, `accent-strong`)

- [ ] **Step 1: แก้ `tests/views.test.js` ให้ยังไม่ผ่าน**
  - เปลี่ยนชื่อเว็บที่คาดหวังเป็น `หมวดหมู่คำศัพท์` (ใน `pageTitle` และ `renderHome`)
  - เพิ่ม test `ภาษาไทยตัวใหญ่ 17px`:
    - `renderCategory(categories[0])` ต้องมี `text-[17px]` ≥ 15 ครั้ง
    - `renderHome` ต้องมี `text-[17px]` ≥ 4 ครั้ง
  - เพิ่ม test `ไม่มีสีแดง/สีเทาเดิม`: ทั้ง `renderHome` และ `renderCategory` ของทุกหมวด ต้อง doesNotMatch `/\b(red|stone)-\d/`
  - เพิ่ม test `ใช้สีจากธีม`:
    - หน้าแรกมี `bg-navy` และ `text-accent-strong`
    - หน้าหมวดมี `bg-navy`, `bg-accent` และ `text-navy` (พินอิน)
    - footer ของหมวด 1 มี `bg-accent-strong`

- [ ] **Step 2: แก้ `check.py` ให้ยังไม่ผ่าน**
  - (Review Focus 5) computed `backgroundColor` ของ `body` = `rgb(250, 247, 240)` และของ `#app header` ในหน้าหมวด = `rgb(30, 58, 95)`
  - ขนาดตัวหนังสือที่วัดได้จริงของ `[data-card] [lang="th"]` ตัวแรกต้อง ≥ 17px
  - `<meta name="theme-color">` = `#1E3A5F`
  - `document.title` ของหน้าแรก = `หมวดหมู่คำศัพท์`
  - (Review Focus 2) ใช้เสียงปลอม: สีพื้นที่วัดได้จริงของวงกลมในปุ่ม zh ตอนปกติ ≠ ตอน `is-speaking` และตอน `is-speaking` ต้องเป็น `rgb(30, 58, 95)`
  - เปลี่ยนข้อความที่ตรวจชื่อเว็บเดิมใน check ทุกจุด

- [ ] **Step 3: รัน `npm test` และ `check.py` แล้วต้องไม่ผ่าน** ตามข้อที่เพิ่มไป

- [ ] **Step 4: แก้ `views.js` ตามสเปกหัวข้อ "หน้าตาที่เปลี่ยน"**
  - **หน้าแรก:**
    - หัวเว็บเป็นแถบ `bg-navy text-white`
    - การ์ดหมวดเป็น `bg-white border-line`
    - เลขเป็น `text-accent-strong`
    - ชื่อไทยเป็น `text-[17px] font-medium text-ink`
    - ชื่ออังกฤษเป็น `text-[13px] text-ink-soft`
    - ลูกศรเป็น `text-accent`
  - **หน้าหมวด:**
    - header เป็น `sticky top-0 bg-navy text-white` ชื่ออังกฤษเป็น `text-navy-soft`
    - บรรทัดแรกของการ์ด: เลขลำดับ `text-xs text-ink-soft` ตามด้วย `<span lang="th" class="text-[17px] font-medium text-ink">`
    - อังกฤษ `text-base text-ink`, จีน `text-xl text-ink`, พินอิน `text-sm text-navy`
    - วงกลมในปุ่มลำโพงเป็น `bg-accent text-white`
    - ปุ่มหมวดถัดไปเป็น `bg-accent-strong text-white` คำว่า "หมวดถัดไป" เป็น `text-[13px]`
    - ปุ่มกลับหน้าแรกเป็น `bg-white border-accent-strong text-accent-strong`

- [ ] **Step 5: แก้ไฟล์อื่นที่เหลือ**
  - `src/input.css`:
    - `body` เป็น `bg-cream text-ink`
    - `.speak-btn.is-speaking > span` ใช้ `background-color: var(--color-navy)`
  - `index.html`:
    - `<title>หมวดหมู่คำศัพท์</title>`
    - `theme-color` เป็น `#1E3A5F`
    - ข้อความใน `noscript` ใช้ `text-ink`
  - `favicon.svg`: เปลี่ยน `fill` เป็น `#1E3A5F`

- [ ] **Step 6: รัน `npm test && npm run build && python3 -I /home/claude/tools/check.py /home/claude/hotel-vocab /home/claude/tools/shots`** ผลที่ต้องได้คือผ่านทั้งหมดและขึ้น `ALL CHECKS PASSED`

- [ ] **Step 7: เปิดภาพ `home.png` กับ `cat1-top.png` เทียบกับ mockup** สิ่งที่ต้องเห็น:
  - แถบน้ำเงินเข้ม พื้นขาวนวล การ์ดขาว
  - ปุ่มลำโพงส้ม ปุ่มหมวดถัดไปส้มเข้ม
  - ภาษาไทยตัวใหญ่ และพินอินสีน้ำเงิน

- [ ] **Step 8: Commit** `feat: apply 60-30-10 palette and larger Thai text`

- [ ] **Step 9: คัดลอกไฟล์ไปเครื่องผู้ใช้**
  - ไฟล์ที่ต้องส่ง: `src/input.css`, `public/js/views.js`, `public/index.html`, `public/favicon.svg`, `tests/views.test.js`, `tests/theme.test.js` และแผนนี้ ส่งไปไว้ที่ `C:\khem\...` (path เดิม)
  - ตั้งชื่อไฟล์ใน staging ใหม่ทุกครั้ง เพราะเคยเจอปัญหาระบบส่งไฟล์จำของเก่าไว้
  - ตรวจขนาดไฟล์ด้วย `device_list_dir` ว่าตรงกับ repo
