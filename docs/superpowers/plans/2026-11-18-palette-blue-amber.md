# ชุดสีน้ำเงินสด + ส้มอุ่น — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** เปลี่ยน token สีใน `@theme` เป็นชุดใหม่ 8 สี แล้วให้ `views.js`, `index.html` และ favicon ใช้สีตามตำแหน่งในสเปก

**Architecture:** เปลี่ยนชื่อ token เดิม (`cream`, `accent`, `accent-strong`) เป็น `page`, `primary` และ `highlight` ส่วน `ink`, `ink-soft`, `line`, `navy` และ `navy-soft` ใช้ชื่อเดิม แค่เปลี่ยนค่า ชุดทดสอบความต่างของสีที่อ่านค่าจาก CSS ตรงๆ จะเป็นตัวกัน

**Tech Stack:** Tailwind CSS v4 `@theme`, `node:test`, Playwright (`/home/claude/tools/check.py`)

**Spec:** `docs/superpowers/specs/2026-11-18-palette-blue-amber-design.md`

## Global Constraints

- **ค่าสี:**
  - `page #F8F9FA`
  - `ink #222222`
  - `ink-soft #6B7280`
  - `line #E5E7EB`
  - `navy #1E3A8A`
  - `navy-soft #BFDBFE`
  - `primary #2563EB`
  - `highlight #F59E0B`
- **ห้ามมีคลาสเหล่านี้เหลืออยู่ใน `views.js` และ `input.css`:** `cream`, `accent` หรือ `accent-strong` (ทั้งแบบมีและไม่มี prefix)
- **บนพื้น `highlight`:** ตัวหนังสือและไอคอนต้องเป็น `text-ink` เสมอ ห้ามใช้ `text-white`
- **ห้ามแตะ:** ขนาดตัวหนังสือ คลาสจัดหน้า (`grid`, `px`, `gap`, `max-w`) และระยะขอบแถบหน้าแรกของเจ้าของ `pt-3 pb-3`

## Review Focus

1. **ปุ่มลำโพงตอนกำลังอ่าน:** ต้องต่างจากตอนปกติชัดเจน (ส้มเป็นน้ำเงินเข้ม) และไอคอนต้องเปลี่ยนเป็นสีขาวด้วย ไม่ใช่ไอคอนสีเข้มบนพื้นน้ำเงินเข้ม → `check.py` ตรวจทั้งสีพื้นและสีไอคอนของวงกลมตอนกำลังอ่าน
2. **ปุ่มรองสีส้มที่ถูกกด** (`active:`): ตัวหนังสือต้องยังอ่านได้ → สีตอนกดใช้ `active:bg-amber-400` แทน ไม่เปลี่ยนเป็นพื้นเข้มที่ทำให้ตัวหนังสือสีเข้มอ่านไม่ออก (ตรวจในภาพหน้าจอ)
3. **ป้ายเลข 01–04 ส้มบนการ์ดขาว:** ตัวเลขต้องอ่านได้ → คู่สี ink บน highlight ใน `theme.test.js`
4. **คลาสชื่อใหม่พิมพ์ผิด จนสีหายไปเงียบๆ:** → การตรวจ `audit_classes` ใน `check.py` ที่มีอยู่แล้ว
5. **ลืมแก้สีใน favicon หรือ `theme-color`:** → `check.py` ตรวจ `theme-color` และ grep หา `#1E3A5F` ใน `favicon.svg`

---

### Task 1: เปลี่ยนชุดสี

**Files:**
- Modify: `src/input.css`, `public/js/views.js`, `public/index.html`, `public/favicon.svg`
- Test: `tests/theme.test.js`, `tests/views.test.js`, `/home/claude/tools/check.py`

**Interfaces:**
- Produces: token `--color-{page,ink,ink-soft,line,navy,navy-soft,primary,highlight}` ใน `@theme`

- [ ] **Step 1: แก้ `tests/theme.test.js` ให้ยังไม่ผ่าน**
  - deepEqual 8 สีตาม Global Constraints
  - คู่สีตัวหนังสือ ≥ 4.5:
    - `ink/page`, `ink/#FFF`
    - `ink-soft/page`, `ink-soft/#FFF`
    - `#FFF/navy`, `navy-soft/navy`, `navy/#FFF`
    - `#FFF/primary`, `ink/highlight`
  - คู่สีไอคอน ≥ 3: `primary/#FFF`, `ink/highlight`, `#FFF/navy`

- [ ] **Step 2: แก้ `tests/views.test.js` ให้ยังไม่ผ่าน**
  - test `ใช้สีจากธีม`:
    - หน้าแรกต้องมี `bg-navy`, `text-navy-soft`, `border-line`, `bg-highlight`, `text-primary`, `text-[17px]`, `text-ink`, `text-ink-soft`
    - หน้าหมวด 1 ต้องมี `bg-navy`, `text-navy-soft`, `border-line`, `bg-highlight`, `text-navy`, `text-[17px]`, `text-ink`, `text-ink-soft`
    - footer หมวด 1 ต้องมี `bg-primary`
    - footer หมวด 4 ต้องมี `bg-highlight` และ `text-ink`
  - test ใหม่ `ไม่มีชื่อสีชุดเก่า`: ทุกหน้าต้อง doesNotMatch `/(?<![\w-])(?:[a-z]+:)?(?:bg|text|border)-(?:cream|accent|accent-strong)(?![\w-])/`

- [ ] **Step 3: แก้ `check.py` ให้ยังไม่ผ่าน**
  - `body` = `rgb(248, 249, 250)`
  - แถบหน้าหมวด = `rgb(30, 58, 138)`
  - `theme-color` = `#1E3A8A`
  - วงกลมลำโพงตอนปกติ = `rgb(245, 158, 11)`
  - วงกลมลำโพงตอนกำลังอ่าน: พื้น `rgb(30, 58, 138)` และสีไอคอน `rgb(255, 255, 255)` (Review Focus 1)
  - `favicon.svg` ต้องไม่มี `#1E3A5F` (Review Focus 5)

- [ ] **Step 4: รัน `npm test` และ `check.py` แล้วต้องไม่ผ่าน** ตามข้อที่แก้ไป

- [ ] **Step 5: แก้ `src/input.css`**
  - `@theme`: ใส่ 8 สีใหม่ และลบ `cream`, `accent`, `accent-strong`
  - `body`: `bg-page text-ink`
  - `.speak-btn.is-speaking > span`: `background-color: var(--color-navy); color: var(--color-white);` (ค่านี้มีอยู่แล้ว ตรวจให้แน่ใจว่ายังเป็นแบบนี้)

- [ ] **Step 6: แก้คลาสใน `views.js` ตามสเปกหัวข้อ "ใช้สีกับอะไร"**
  - **การ์ดหมวดในหน้าแรก:**
    - `hover:border-accent` → `hover:border-primary`
    - `active:bg-cream` → `active:bg-page`
  - **เลขหมวด:** `text-accent-strong` → `rounded-md bg-highlight px-1.5 text-ink` (เพิ่ม `text-center` ถ้าความกว้าง `w-7` เดิมทำให้ป้ายไม่สวย)
  - **ลูกศร:** `text-accent` → `text-primary`
  - **วงกลมลำโพง:** `bg-accent text-white` → `bg-highlight text-ink`
  - **ปุ่มหมวดถัดไป:** `bg-accent-strong` → `bg-primary`
  - **ปุ่มหน้าแรกทั้งสองแบบ:**
    - `border border-accent-strong bg-white … text-accent-strong active:bg-cream` → `bg-highlight … text-ink active:bg-amber-400`
    - ไม่ต้องมีเส้นขอบ

- [ ] **Step 7: แก้ `index.html` และ `favicon.svg`**
  - `index.html`: `theme-color` เป็น `#1E3A8A`
  - `favicon.svg`: `fill` เป็น `#1E3A8A`

- [ ] **Step 8: รัน `npm test && npm run build && python3 -I /home/claude/tools/check.py /home/claude/hotel-vocab /home/claude/tools/shots`** ผลที่ต้องได้คือผ่านทั้งหมดและขึ้น `ALL CHECKS PASSED`

- [ ] **Step 9: ดูภาพหน้าจอ**
  - **ภาพ:** หน้าแรก มือถือ 390 และ 1366
  - **สิ่งที่ต้องเห็น:**
    - ป้ายเลขสีส้ม ลูกศรน้ำเงิน
    - ปุ่มลำโพงส้มทั้งสองปุ่ม
    - ปุ่มหมวดถัดไปน้ำเงิน ปุ่มหน้าแรกส้ม
    - แถบ `#1E3A8A` พื้นเทาอ่อน การ์ดขาว

- [ ] **Step 10: Commit** `feat: blue and amber palette`

- [ ] **Step 11: คัดลอกไฟล์ไปที่ `C:\khem`**
  - ไฟล์ที่ต้องส่ง: `input.css`, `views.js`, `index.html`, `favicon.svg`, `theme.test.js`, `views.test.js`, สเปก และแผนนี้
  - ใช้ชื่อไฟล์ใหม่ใน staging
  - ก่อนเขียนทับ `views.js` ให้ใส่ `expectedMtimeMs` = `1794928614022`
  - ตรวจขนาดไฟล์ทีละโฟลเดอร์

## แก้ตามเจ้าของ (2026-11-18, ก่อนเริ่มทำ)
- **ตอนปุ่มลำโพงกำลังอ่าน:** ไม่ต้องเป็นน้ำเงินเข้ม ให้ใช้ "ส้มที่เข้มกว่านิดนึง" แทน
  - เพิ่ม token `highlight-strong` = `#D97706`
  - `.speak-btn.is-speaking > span` ใช้ `background-color: var(--color-highlight-strong)` ไอคอนยังเป็น `ink`
  - ink บน highlight-strong ได้ 5.0:1
- **ตัวเลขที่ใช้ตรวจเปลี่ยนตาม:**
  - `theme.test.js` ต้องมี 9 สี (เพิ่ม `highlight-strong`) และตรวจไอคอน ink บน highlight-strong ≥ 3
  - `check.py` ตรวจว่าวงกลมตอนกำลังอ่านเป็น `rgb(217, 119, 6)` และไอคอนเป็น `rgb(34, 34, 34)`
