# เว็บคำศัพท์งานโรงแรม — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** สร้างเว็บ static แบบ mobile-first สำหรับเปิดดูคำศัพท์งานโรงแรม 60 รายการ (ไทย/อังกฤษ/จีน/พินอิน) แบ่ง 4 หมวด มีปุ่มฟังเสียงอ่าน และพร้อม deploy ขึ้น Cloudflare Pages ผ่าน GitHub

**Architecture:** ใช้ HTML หน้าเดียว (`public/index.html`) ส่วน JavaScript แบบ ES modules เปลี่ยนหน้าตาม hash (`#/`, `#/c/1`–`#/c/4`) แล้วสร้าง HTML จากไฟล์ข้อมูล `data.js` แยกโค้ดที่ไม่แตะ DOM (`views.js`, `speech.js`) ออกมา เพื่อให้ทดสอบด้วย `node --test` ได้ ไฟล์ `app.js` มีหน้าที่แค่ต่อ DOM กับ event และ Tailwind CLI สร้าง `public/styles.css` ตอน build

**Tech Stack:** HTML, Tailwind CSS v4 (`@tailwindcss/cli` ^4.3.5), JavaScript (ES modules, ไม่ใช้ framework), Node 22 (`node:test`), Web Speech API, Cloudflare Pages + GitHub

**Spec:** `docs/superpowers/specs/2026-11-16-hotel-vocab-design.md`

## Global Constraints

- ไม่ใช้ framework และไม่ bundle โดย JS ทุกไฟล์เป็น ES module ที่เบราว์เซอร์โหลดได้ตรงๆ
- Node `22` (ไฟล์ `.node-version`) โดย Cloudflare Pages ใช้ build command `npm run build` และ output directory `public`
- ไฟล์ `public/styles.css` สร้างจาก build และอยู่ใน `.gitignore` ส่วน `node_modules/` ก็อยู่ใน `.gitignore` เช่นกัน
- ฟอนต์ไทยเป็น Noto Sans Thai จาก Google Fonts น้ำหนัก 400 และ 500 เท่านั้น ใช้ `display=swap` ส่วนภาษาจีนใช้ฟอนต์ระบบ
- น้ำหนักตัวอักษรในหน้าเว็บใช้แค่ 400 กับ 500 (`font-normal`, `font-medium`)
- ใช้ธีมสว่างเท่านั้น พื้นขาว สีหลักใช้ชุด `red-*` ของ Tailwind ข้อความใช้ชุด `stone-*`
- ต้องใช้ได้ที่ความกว้าง 360px โดยไม่มี scroll แนวนอน ปุ่มทุกปุ่มมีพื้นที่กดอย่างน้อย 44×44px ส่วนบนจอใหญ่ให้เนื้อหาอยู่ตรงกลาง กว้างไม่เกิน `max-w-md`
- ข้อความ UI ที่กำหนดไว้แล้ว: ชื่อเว็บ `คำศัพท์งานโรงแรม`, บรรทัดรอง `อังกฤษ · จีน · พินอิน`, `15 คำ`, `หมวดถัดไป`, `กลับหน้าแรก`
- ชื่อหมวดใช้ตามนี้ทุกตัวอักษร:
  1. `การต้อนรับและเช็คอิน` / `Reception & Check-in`
  2. `แม่บ้านและสิ่งอำนวยความสะดวกในห้อง` / `Housekeeping & Room Amenities`
  3. `บริการทั่วไปและสิ่งอำนวยความสะดวกส่วนกลาง` / `Hotel Facilities & Services`
  4. `การแจ้งปัญหาและการเช็คเอาท์` / `Problem Solving & Check-out`
- เสียงอ่าน:
  - อังกฤษ: ใช้ `en-US` ถ้าไม่มีใช้ `en-*` ตัวไหนก็ได้ ความเร็ว 0.9
  - จีน: ใช้ `zh-CN` ถ้าไม่มีใช้ `zh-TW` และห้ามใช้ `zh-HK` หรือ `yue` เด็ดขาด ความเร็ว 0.8
  - ถ้าไม่มีเสียงของภาษาไหน ให้ซ่อนปุ่มของภาษานั้น
  - รอรายการเสียงไม่เกิน 1500ms
- แต่ละข้อความต้องมี `lang` ของตัวเอง: ไทย `th`, อังกฤษ `en`, จีน `zh-CN`, พินอิน `zh-Latn`

## Review Focus

1. **เปิดใน LINE บน Android ซึ่งไม่มี `speechSynthesis`:** ต้องไม่มี error ใน console และไม่เห็นปุ่มฟังเสียงเลย → ทดสอบใน Task 2 (`initSpeech` เมื่อไม่มี synth) และ Task 4 (สคริปต์ตรวจในเบราว์เซอร์)
2. **รายการเสียงไม่โหลดเลย เพราะ `voiceschanged` ไม่เคยถูกเรียก:** หลัง 1500ms ต้องได้ผลลัพธ์ และซ่อนปุ่ม ไม่ใช่ค้างรอไปเรื่อยๆ → ทดสอบใน Task 2
3. **กดปุ่มเสียงรัวๆ หรือกดปุ่มอื่นระหว่างที่ยังอ่านอยู่:** ต้องตัดเสียงเดิมก่อนอ่านใหม่ (`cancel()` ทุกครั้ง) และปุ่มเดิมกลับสถานะปกติ → ทดสอบใน Task 2 และ Task 4
4. **จอแคบ 360px กับข้อความยาว** (เช่น "Please fill out the registration form", "Lián bù shàng wúxiàn wǎngluò"): ต้องตัดขึ้นบรรทัดใหม่ ไม่ล้นออกด้านข้าง → ตรวจใน Task 4 (`scrollWidth <= clientWidth` ทุกหน้า)
5. **iOS Safari ต้องเรียก `speak()` ภายในการแตะของผู้ใช้:** ใน click handler ต้องเรียก `speak` ทันที ห้าม `await` อะไรก่อนหน้า → ทดสอบใน Task 4 (เสียงปลอมต้องถูกเรียกแบบ sync ภายใน click)

---

### Task 1: โครงโปรเจกต์ + ข้อมูลคำศัพท์

**Files:**
- Create: `package.json`, `.gitignore`, `.node-version`, `public/js/data.js`
- Copy in: `docs/superpowers/specs/2026-11-16-hotel-vocab-design.md`, `docs/superpowers/plans/2026-11-16-hotel-vocab.md`
- Test: `tests/data.test.js`

**Interfaces:**
- Produces: `export const categories` อยู่ใน `public/js/data.js`
  - ชนิดข้อมูล: `Array<{ id: number, th: string, en: string, items: Array<{ th: string, en: string, zh: string, pinyin: string }> }>`
  - `id` เป็น 1–4 เรียงตามลำดับ
  - `th` ของ item ไม่มีเลขนำหน้า (เช่น ไม่มี "1. ")

- [ ] **Step 1: สร้าง repo ทำงานที่ `/home/claude/hotel-vocab`**
  - รัน `git init`
  - คัดลอก spec และ plan เข้าไปไว้ใต้ `docs/superpowers/`
  - `.gitignore` = `node_modules/`, `public/styles.css`
  - `.node-version` = `22`

- [ ] **Step 2: สร้าง `package.json`**
  - `"name": "hotel-vocab"`, `"private": true`, `"type": "module"`
  - scripts:
    - `"build": "tailwindcss -i ./src/input.css -o ./public/styles.css --minify"`
    - `"watch": "tailwindcss -i ./src/input.css -o ./public/styles.css --watch"`
    - `"serve": "serve public -l 5173"`
    - `"dev": "concurrently -k \"npm:watch\" \"npm:serve\""`
    - `"test": "node --test"`
  - devDependencies: `@tailwindcss/cli`, `tailwindcss`, `concurrently`, `serve`
  - จากนั้นรัน `npm install`

- [ ] **Step 3: เขียน test ที่ยังไม่ผ่าน `tests/data.test.js`**

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { categories } from '../public/js/data.js';

test('มี 4 หมวด id 1-4 ชื่อตรงสเปก', () => {
  assert.deepEqual(categories.map(c => c.id), [1, 2, 3, 4]);
  assert.deepEqual(categories.map(c => c.th), ['การต้อนรับและเช็คอิน', 'แม่บ้านและสิ่งอำนวยความสะดวกในห้อง', 'บริการทั่วไปและสิ่งอำนวยความสะดวกส่วนกลาง', 'การแจ้งปัญหาและการเช็คเอาท์']);
  assert.deepEqual(categories.map(c => c.en), ['Reception & Check-in', 'Housekeeping & Room Amenities', 'Hotel Facilities & Services', 'Problem Solving & Check-out']);
});
test('หมวดละ 15 รายการ ทุกช่องไม่ว่าง', () => { /* ทุก item มี th,en,zh,pinyin เป็น string ที่ trim แล้วไม่ว่าง */ });
test('th ไม่มีเลขนำหน้า', () => { /* ไม่มี item.th ที่ match /^\d+\.\s/ */ });
test('ภาษาไทยไม่เพี้ยนแบบข้อความจาก PDF', () => {
  // ไม่มีช่องว่างหน้าสระบน/ล่าง/วรรณยุกต์: /\s[\u0E31\u0E34-\u0E3A\u0E47-\u0E4E]/
  // ไม่มีสระอำแบบแยกตัว: /\u0E4D\u0E32/
});
test('แต่ละภาษาอยู่ถูกช่อง', () => {
  // en และ pinyin ไม่มีอักษรไทย /[\u0E00-\u0E7F]/ และไม่มีอักษรจีน /[\u4E00-\u9FFF]/
  // zh มีอักษรจีนอย่างน้อย 1 ตัว
});
```

- [ ] **Step 4: รัน `npm test` แล้วต้องไม่ผ่าน** เพราะยังไม่มี `public/js/data.js`

- [ ] **Step 5: เขียน `public/js/data.js` ครบ 60 รายการ**
  - อังกฤษ/จีน/พินอิน: คัดจาก `pdftotext -layout` ของ PDF
  - ภาษาไทย: พิมพ์ตามภาพหน้าจอ Excel (`/mnt/user-data/uploads/58c1f3ae-image.png`, `d52e1d62-…`, `c94896d2-…`, `f110524d-…`) **ห้ามคัดลอกภาษาไทยจาก PDF**

- [ ] **Step 6: รัน `npm test` แล้วต้องผ่าน 5/5**

- [ ] **Step 7: ตรวจข้อมูลด้วยตา**
  - เปิดภาพ Excel ทั้ง 4 ภาพ แล้วเทียบกับ `data.js` ทีละหมวด
  - ช่องที่ต้องดู: ไทย, อังกฤษ, จีน, วรรณยุกต์ของพินอิน
  - ผลที่ต้องได้: ตรงกันครบ 60 แถว

- [ ] **Step 8: Commit** `feat: project scaffold and vocabulary data`

---

### Task 2: เสียงอ่าน (`speech.js`)

**Files:**
- Create: `public/js/speech.js`
- Test: `tests/speech.test.js`

**Interfaces:**
- Produces:
  - `toSpeechText(text: string, lang: 'en'|'zh'): string` แทน `/\s*\/\s*/g` ด้วย `', '` (en) หรือ `'，'` (zh)
  - `pickVoice(voices: Array<{lang: string}>, lang: 'en'|'zh'): voice | null`
    - normalize `lang` ก่อนเทียบ: แปลง `_` เป็น `-` และเทียบแบบไม่สนตัวพิมพ์เล็ก-ใหญ่
    - en: ลำดับคือ `en-US` → `en-*` ตัวแรก
    - zh: ลำดับคือ `zh-CN` หรือ `cmn-Hans-CN` → `zh-TW` หรือ `cmn-Hant-TW` → null และห้ามคืน `zh-HK` หรือ `yue*`
  - `loadVoices(synth, timeoutMs = 1500): Promise<voice[]>`
    - ถ้า `getVoices()` มีเสียงแล้ว คืนทันที
    - ถ้ายังไม่มี รอ `voiceschanged` หรือรอจนหมดเวลา แล้วคืน `getVoices()`
  - `initSpeech(win = globalThis, timeoutMs = 1500): Promise<{ en: voice|null, zh: voice|null }>` ถ้า `win.speechSynthesis` หรือ `win.SpeechSynthesisUtterance` ไม่มี ให้คืน `{en:null, zh:null}` ทันที
  - `speak(win, text: string, lang: 'en'|'zh', voice, onDone: () => void): void`
    - เรียก `synth.cancel()` ก่อนเสมอ
    - utterance ตั้งค่า `voice`, `lang = voice.lang`, `rate` = 0.9 (en) หรือ 0.8 (zh) และใช้ข้อความจาก `toSpeechText`
    - `onDone` ถูกเรียกเมื่อเกิด `end` หรือ `error`
    - เรียก `synth.speak()` แบบ synchronous

- [ ] **Step 1: เขียน test ที่ยังไม่ผ่าน `tests/speech.test.js`** ใช้ fake `win` (object ธรรมดาที่มี `speechSynthesis` กับ `SpeechSynthesisUtterance` class ปลอมที่บันทึกการเรียกไว้)
  - `toSpeechText('Key card / Room key','en') === 'Key card, Room key'`
  - `toSpeechText('房卡 / 房间钥匙','zh') === '房卡，房间钥匙'`
  - `toSpeechText('Check-in','en') === 'Check-in'`
  - `pickVoice([{lang:'en-GB'},{lang:'en_US'}],'en').lang === 'en_US'`
  - `pickVoice([{lang:'en-GB'}],'en').lang === 'en-GB'`
  - `pickVoice([{lang:'zh-HK'},{lang:'zh-TW'}],'zh').lang === 'zh-TW'`
  - `pickVoice([{lang:'zh-HK'},{lang:'yue-HK'}],'zh') === null`
  - `pickVoice([{lang:'zh-TW'},{lang:'cmn-Hans-CN'}],'zh').lang === 'cmn-Hans-CN'`
  - `pickVoice([],'en') === null`
  - (Review Focus 1) `await initSpeech({}, 50)` deepEqual `{en:null, zh:null}`
  - (Review Focus 2) fake synth ที่ `getVoices()` คืน `[]` และไม่เคยยิง `voiceschanged` → `await initSpeech(fake, 50)` ได้ `{en:null, zh:null}` ภายในประมาณ 50ms
  - fake synth ที่ยิง `voiceschanged` หลัง 10ms พร้อมเสียง `en-US` กับ `zh-CN` → ได้เสียงทั้งสองภาษา
  - (Review Focus 3) เรียก `speak()` สองครั้งติดกัน → `cancel` ถูกเรียก 2 ครั้ง, utterance ล่าสุดมี `rate === 0.8` กับ `lang === 'zh-CN'` เมื่อ lang เป็น zh และ `onDone` ถูกเรียกเมื่อ fake ยิง `error`

- [ ] **Step 2: รัน `node --test tests/speech.test.js` แล้วต้องไม่ผ่าน** (ยังไม่มีโมดูล)

- [ ] **Step 3: เขียน `public/js/speech.js` ตาม Interfaces** ไฟล์นี้ห้ามแตะ `document`

- [ ] **Step 4: รัน `npm test` แล้วต้องผ่านทั้งหมด**

- [ ] **Step 5: Commit** `feat: speech helpers with voice selection and fallbacks`

---

### Task 3: สร้างหน้าจอ + แปลงลิงก์ (`views.js`)

**Files:**
- Create: `public/js/views.js`
- Test: `tests/views.test.js`

**Interfaces:**
- Consumes: `categories` จาก Task 1 (ส่งเข้ามาเป็นพารามิเตอร์ `views.js` ไม่ import data เอง)
- Produces:
  - `escapeHtml(s: string): string` แปลง `& < > " '`
  - `pad2(n: number): string` เช่น `1 → '01'`
  - `parseRoute(hash: string, count: number): { name: 'home' } | { name: 'category', id: number }`
    - `''`, `'#'`, `'#/'` และค่าที่ไม่รู้จัก → home
    - `'#/c/N'` เมื่อ 1 ≤ N ≤ count → category
  - `pageTitle(route, categories): string`
    - home → `'คำศัพท์งานโรงแรม'`
    - category → `'01 การต้อนรับและเช็คอิน · คำศัพท์งานโรงแรม'`
  - `renderHome(categories): string` ได้ HTML ของหน้าแรก
    - หัวเว็บกับบรรทัดรอง
    - ลิงก์ `<a href="#/c/N" data-category="N">` 4 อัน แต่ละอันมี `pad2(N)`, ชื่อไทย, `ชื่ออังกฤษ · 15 คำ`
  - `renderCategory(category, categories): string`
    - header แบบ `sticky top-0` มีลิงก์ `href="#/"` พร้อม `aria-label="กลับหน้าแรก"` และชื่อ `01 ชื่อหมวด`
    - การ์ด `<article data-card>` 15 ใบ แต่ละใบมี:
      - บรรทัดเล็ก `N · ไทย` (`lang="th"`)
      - อังกฤษ (`lang="en"`) + ปุ่ม `<button type="button" data-speak="en" data-text="…" aria-label="ฟังเสียงภาษาอังกฤษ: …">`
      - จีน (`lang="zh-CN"`, ตัวใหญ่) + พินอิน (`lang="zh-Latn"`, สีแดง) + ปุ่ม `data-speak="zh"`
    - ท้ายหน้า:
      - ถ้า id < จำนวนหมวด: ลิงก์ `href="#/c/{id+1}"` ข้อความ `หมวดถัดไป` และชื่อหมวดถัดไป
      - ถ้าเป็นหมวดสุดท้าย: ลิงก์ `href="#/"` ข้อความ `กลับหน้าแรก`
  - ไอคอนลำโพงกับลูกศรใช้ inline SVG มี `aria-hidden="true"` ส่วน class ของ Tailwind ใช้ตาม mockup แบบ A

- [ ] **Step 1: เขียน test ที่ยังไม่ผ่าน `tests/views.test.js`** โดยใช้ `categories` ตัวจริง
  - `parseRoute('',4)`, `('#',4)`, `('#/',4)`, `('#/c/0',4)`, `('#/c/5',4)`, `('#/c/abc',4)`, `('#/x',4)` → `{name:'home'}`
  - `parseRoute('#/c/3',4)` → `{name:'category', id:3}`
  - `pad2(1)==='01'`
  - `escapeHtml('<a & "b">')==='&lt;a &amp; &quot;b&quot;&gt;'`
  - `pageTitle({name:'category',id:1}, categories) === '01 การต้อนรับและเช็คอิน · คำศัพท์งานโรงแรม'`
  - `renderHome`: มี `href="#/c/1"` ถึง `"#/c/4"` และมี `คำศัพท์งานโรงแรม`, `อังกฤษ · จีน · พินอิน` และ `15 คำ` ครบ 4 ครั้ง
  - `renderCategory(categories[0], categories)`:
    - นับ `data-card` ได้ 15
    - นับ `data-speak="en"` ได้ 15 และ `data-speak="zh"` ได้ 15
    - มี `欢迎光临我们酒店`, `Huānyíng guānglín wǒmen jiǔdiàn`, `href="#/c/2"`, `หมวดถัดไป`
    - มี `Reception &amp; Check-in` (ข้อความถูก escape)
  - `renderCategory(categories[3], categories)`: มี `กลับหน้าแรก` คู่กับ `href="#/"` อยู่ท้ายหน้า และไม่มี `#/c/5`

- [ ] **Step 2: รัน `node --test tests/views.test.js` แล้วต้องไม่ผ่าน**

- [ ] **Step 3: เขียน `public/js/views.js` ตาม Interfaces** ไฟล์นี้เป็น pure functions ทั้งหมด ห้ามแตะ DOM

- [ ] **Step 4: รัน `npm test` แล้วต้องผ่านทั้งหมด**

- [ ] **Step 5: Commit** `feat: views and hash routing`

---

### Task 4: หน้าเว็บ + สไตล์ + ต่อ DOM

**Files:**
- Create: `public/index.html`, `public/favicon.svg`, `src/input.css`, `public/js/app.js`
- Scratch (ไม่อยู่ใน repo): `/home/claude/tools/check.py`

**Interfaces:**
- Consumes: `categories` (Task 1), ฟังก์ชัน `initSpeech` และ `speak` (Task 2), ฟังก์ชัน `parseRoute`, `renderHome`, `renderCategory` และ `pageTitle` (Task 3)

- [ ] **Step 1: เขียน `src/input.css`**
  - `@import "tailwindcss";`
  - `@theme { --font-sans: "Noto Sans Thai", ui-sans-serif, system-ui, sans-serif; }`
  - กฎซ่อนปุ่ม: `html.no-tts-en [data-speak="en"], html.no-tts-zh [data-speak="zh"] { display: none; }`
  - ใส่ `overflow-wrap: anywhere` ให้ข้อความในการ์ด

- [ ] **Step 2: เขียน `public/index.html`**
  - `<html lang="th" class="no-tts-en no-tts-zh">` ให้ปุ่มเสียงซ่อนไว้ก่อน แล้วค่อยแสดงเมื่อเจอเสียง
  - meta: `viewport`, `theme-color` `#dc2626`, `description` และ `<title>คำศัพท์งานโรงแรม</title>`
  - ฟอนต์: `preconnect` ไปที่ fonts.googleapis.com และ fonts.gstatic.com แล้วโหลด `Noto+Sans+Thai:wght@400;500&display=swap`
  - `<link rel="stylesheet" href="styles.css">` และ `<link rel="icon" href="favicon.svg">`
  - `<main id="app" class="mx-auto max-w-md">`
  - `<noscript>` ข้อความไทยว่าต้องเปิด JavaScript
  - `<script type="module" src="js/app.js">`

- [ ] **Step 3: เขียน `public/favicon.svg`** เป็นสี่เหลี่ยมมุมมนสี `#dc2626` มีตัวอักษร "中" สีขาว

- [ ] **Step 4: เขียน `public/js/app.js`**
  - `render()`: เรียก `parseRoute(location.hash, categories.length)` → ใส่ HTML ลง `#app` → เปลี่ยน `document.title` ด้วย `pageTitle(...)` → `scrollTo(0,0)`
  - เรียก `render()` ตอนโหลดหน้าและตอนเกิด `hashchange`
  - ตอนเริ่มเรียก `initSpeech(window)` ได้ `voices` → ถ้ามีเสียงภาษาไหน ให้ลบ class `no-tts-en` หรือ `no-tts-zh` ออกจาก `<html>`
  - จับ click ที่ `#app` แบบ delegation สำหรับ `[data-speak]`:
    - เรียก `speak(window, btn.dataset.text, btn.dataset.speak, voices[lang], onDone)` **ทันทีแบบ sync** (Review Focus 5)
    - ปุ่มที่กำลังอ่าน: ใส่ `aria-pressed="true"` และ class `is-speaking` (พื้น `red-600` ตัวขาว)
    - ปุ่มก่อนหน้า: ล้างสถานะทันทีที่กดปุ่มใหม่
    - `onDone`: ล้างสถานะของปุ่มนั้น

- [ ] **Step 5: รัน `npm run build` แล้วต้องได้ไฟล์ `public/styles.css`** และใน CSS ต้องมี `.sticky` กับ `.max-w-md` (ยืนยันว่า Tailwind เจอ class ใน `views.js`)

- [ ] **Step 6: เขียน `/home/claude/tools/check.py`** (Playwright + `google-chrome`, รันการตรวจที่เกี่ยวกับขนาดจอสองรอบ คือ viewport 360×740 และ 390×844)
  - เปิด `serve public` ไว้ที่ port 5173
  - ตรวจว่าแต่ละหน้า `#/`, `#/c/1`–`#/c/4`, `#/c/9` ได้ผลตามนี้:
    - หน้าแรกมีลิงก์ 4 อัน
    - หน้าหมวดมี `[data-card]` 15 ใบ
    - `#/c/9` แสดงหน้าแรก
    - ทุกหน้า `documentElement.scrollWidth <= clientWidth` (Review Focus 4)
  - header หน้าหมวดต้องมี computed `position` เป็น `sticky`
  - คลิก "หมวดถัดไป" ใน `#/c/1` แล้ว hash ต้องเป็น `#/c/2`
  - หน้า `#/c/4` ต้องมีลิงก์ "กลับหน้าแรก" ที่ไป `#/`
  - **กรณีไม่มีเสียง** (ใช้ `add_init_script` ลบ `window.speechSynthesis`):
    - ปุ่ม `[data-speak]` ทุกปุ่มต้องมองไม่เห็น
    - console ไม่มี error (Review Focus 1)
  - **กรณีมีเสียงปลอม** (ใช้ `add_init_script` สร้าง synth ปลอมที่มีเสียง `en-US` กับ `zh-CN` และบันทึก `speak`/`cancel` ลง `window.__calls`):
    - ปุ่มต้องมองเห็น
    - คลิกปุ่ม zh ของ "Key card / Room key" ใน `#/c/1` → ใน handler เดียวกันต้องมีการเรียก `speak` ด้วยข้อความ `房卡，房间钥匙` และ `lang` `zh-CN` (Review Focus 5)
    - คลิกปุ่ม en ต่อทันที → `cancel` ถูกเรียก และปุ่ม zh ไม่มี `is-speaking` แล้ว (Review Focus 3)
  - ถ่ายภาพหน้าจอ `home.png` และ `cat1.png` (เต็มหน้า)

- [ ] **Step 7: รัน `python3 -I /home/claude/tools/check.py` แล้วต้องขึ้น ALL CHECKS PASSED**

- [ ] **Step 8: เปิดดูภาพหน้าจอเทียบกับ mockup แบบ A**
  - สีแดงมินิมอล ตัวเลข 01–04 สีแดง พินอินสีแดง ภาษาจีนตัวใหญ่ ภาษาไทยไม่เพี้ยน
  - ถ้าไม่ตรง ให้แก้แล้วกลับไปรัน Step 7 ใหม่

- [ ] **Step 9: Commit** `feat: page shell, styles, and app wiring`

---

### Task 5: README + ส่งมอบเข้า `C:\khem`

**Files:**
- Create: `README.md` (ภาษาไทย)
- Copy to device: ทุกไฟล์ใน repo ยกเว้น `node_modules/`, `public/styles.css` และ `.git/` → `C:\khem\...` (ใช้โครงสร้างโฟลเดอร์เดิม)

- [ ] **Step 1: เขียน `README.md`** มีหัวข้อดังนี้ (ทุกคำสั่งต้องตรงกับ `package.json`):
  1. **สิ่งที่ต้องมีในเครื่อง:** Node.js 22 LTS และ Git
  2. **ดูตัวอย่างในเครื่อง:** `npm install` แล้ว `npm run dev` จากนั้นเปิด `http://localhost:5173`
  3. **แก้หรือเพิ่มคำศัพท์:** แก้ที่ `public/js/data.js` แล้วรัน `npm test`
  4. **ขึ้น GitHub ครั้งแรก:** สร้าง repo แบบ private ชื่อ `hotel-vocab` แล้วรัน `git init` → `git add .` → `git commit` → `git remote add` → `git push`
  5. **สร้าง Cloudflare Pages:** Workers & Pages → Create → Pages → Connect to Git → เลือก repo → ตั้งค่าดังนี้
     - Project name `hotel-vocab`
     - Build command `npm run build`
     - Output `public`
     - หลังสร้างเสร็จ ให้ดูลิงก์จริงที่ได้ ถ้าชื่อซ้ำ Cloudflare อาจเติมตัวอักษรต่อท้าย
  6. **ทดสอบบนมือถือก่อนทำ QR:** iPhone Safari, Android Chrome และ LINE ทั้งสองระบบ
  7. **อัปเดตเว็บครั้งต่อไป:** แก้ไฟล์ แล้ว push ลิงก์เดิมใช้ได้ต่อ
  8. **(ไม่บังคับ)** เปิด Web Analytics ได้ในหน้าตั้งค่าโปรเจกต์

- [ ] **Step 2: รัน `npm test && npm run build` อีกรอบ แล้วต้องผ่านทั้งหมด**

- [ ] **Step 3: Commit** `docs: README with dev and deploy guide`

- [ ] **Step 4: คัดลอกไฟล์ไปเครื่องผู้ใช้**
  - copy ไฟล์ที่จะส่งมอบไปไว้ใต้ `/mnt/user-data/outputs/hotel-vocab/` แล้วใช้ `device_commit_files` เขียนลง `C:\khem\` (ไม่เกิน 50 ไฟล์ต่อครั้ง)
  - ตรวจด้วย `device_list_dir C:\khem` (recursive) → ต้องมีครบตามรายการ และต้องไม่มี `node_modules` หรือ `styles.css`
