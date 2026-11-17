import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { categories } from '../public/js/data.js';
import { escapeHtml, pad2, parseRoute, pageTitle, renderHome, renderCategory } from '../public/js/views.js';

const count = (html, needle) => html.split(needle).length - 1;
const afterLastCard = (html) => html.slice(html.lastIndexOf('</article>'));

test('parseRoute: ลิงก์ที่ไม่รู้จักกลับหน้าแรก', () => {
  for (const hash of ['', '#', '#/', '#/c/0', '#/c/5', '#/c/abc', '#/x', '#/c/1/extra', '#/c/01x']) {
    assert.deepEqual(parseRoute(hash, 4), { name: 'home' }, hash);
  }
});

test('parseRoute: ลิงก์หมวด', () => {
  assert.deepEqual(parseRoute('#/c/3', 4), { name: 'category', id: 3 });
  assert.deepEqual(parseRoute('#/c/1', 4), { name: 'category', id: 1 });
  assert.deepEqual(parseRoute('#/c/4', 4), { name: 'category', id: 4 });
});

test('pad2 และ escapeHtml', () => {
  assert.equal(pad2(1), '01');
  assert.equal(pad2(12), '12');
  assert.equal(escapeHtml('<a & "b">'), '&lt;a &amp; &quot;b&quot;&gt;');
  assert.equal(escapeHtml("it's"), 'it&#39;s');
});

test('pageTitle', () => {
  assert.equal(pageTitle({ name: 'home' }, categories), 'หมวดหมู่คำศัพท์');
  assert.equal(pageTitle({ name: 'category', id: 1 }, categories), '01 การต้อนรับและเช็คอิน · หมวดหมู่คำศัพท์');
});

test('renderHome มีหัวเว็บและปุ่มหมวดครบ 4', () => {
  const html = renderHome(categories);
  for (const n of [1, 2, 3, 4]) assert.ok(html.includes(`href="#/c/${n}"`), `link ${n}`);
  assert.ok(html.includes('หมวดหมู่คำศัพท์'));
  assert.ok(html.includes('อังกฤษ · จีน · พินอิน'));
  assert.equal(count(html, '15 คำ'), 4);
  assert.ok(html.includes('แม่บ้านและสิ่งอำนวยความสะดวกในห้อง'));
  assert.ok(html.includes('Reception &amp; Check-in'));
});

test('renderCategory หมวด 1: การ์ด 15 ใบ ครบทุกภาษา และไปหมวดถัดไป', () => {
  const html = renderCategory(categories[0], categories);
  assert.equal(count(html, 'data-card'), 15);
  assert.equal(count(html, 'data-speak="en"'), 15);
  assert.equal(count(html, 'data-speak="zh"'), 15);
  assert.ok(html.includes('欢迎光临我们酒店'));
  assert.ok(html.includes('Huānyíng guānglín wǒmen jiǔdiàn'));
  assert.ok(html.includes('Reception &amp; Check-in'));
  assert.ok(html.includes('aria-label="กลับหน้าแรก"'));
  assert.ok(html.includes('sticky top-0'));
  assert.ok(html.includes('lang="zh-CN"'));
  assert.ok(html.includes('lang="zh-Latn"'));
  assert.ok(html.includes('data-text="Key card / Room key"'));
  assert.ok(html.includes('aria-label="ฟังเสียงภาษาจีน: 房卡 / 房间钥匙"'));
  const footer = afterLastCard(html);
  assert.ok(footer.includes('href="#/c/2"'));
  assert.ok(footer.includes('หมวดถัดไป'));
  assert.ok(footer.includes('แม่บ้านและสิ่งอำนวยความสะดวกในห้อง'));
});

test('renderCategory หมวดสุดท้าย: ปุ่มกลับหน้าแรก', () => {
  const html = renderCategory(categories[3], categories);
  const footer = afterLastCard(html);
  assert.ok(footer.includes('href="#/"'));
  assert.ok(footer.includes('กลับหน้าแรก'));
  assert.ok(!html.includes('#/c/5'));
  assert.ok(!footer.includes('หมวดถัดไป'));
});

test('ภาษาไทยตัวใหญ่ 17px', () => {
  assert.ok(count(renderCategory(categories[0], categories), 'text-[17px]') >= 15, 'ภาษาไทยบนการ์ด');
  assert.ok(count(renderHome(categories), 'text-[17px]') >= 4, 'ชื่อหมวดภาษาไทยในหน้าแรก');
});

test('ไม่มีสีแดง/สีเทาเดิม', () => {
  const pages = [renderHome(categories), ...categories.map((c) => renderCategory(c, categories))];
  for (const html of pages) assert.doesNotMatch(html, /\b(red|stone)-\d/);
});

// ตรวจคลาสแบบทั้งคำ: 'text-navy' ต้องไม่ไปตรงกับ 'text-navy-soft' หรือ 'active:text-navy'
const hasClass = (html, cls) => {
  const esc = cls.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
  return new RegExp(`class="[^"]*(?<![\\w:-])${esc}(?![\\w-])`).test(html);
};

test('hasClass ตรวจคลาสแบบทั้งคำ', () => {
  assert.ok(hasClass('<p class="a text-navy b">', 'text-navy'));
  assert.ok(!hasClass('<p class="text-navy-soft">', 'text-navy'));
  assert.ok(!hasClass('<a class="active:bg-navy">', 'bg-navy'));
  assert.ok(hasClass('<p class="text-[17px] x">', 'text-[17px]'));
});

test('ใช้สีจากธีม', () => {
  const home = renderHome(categories);
  for (const cls of ['bg-navy', 'text-navy-soft', 'border-line', 'text-accent-strong', 'text-[17px]', 'text-ink', 'text-ink-soft', 'text-accent']) {
    assert.ok(hasClass(home, cls), `หน้าแรกขาด ${cls}`);
  }
  const cat1 = renderCategory(categories[0], categories);
  for (const cls of ['bg-navy', 'text-navy-soft', 'border-line', 'bg-accent', 'text-navy', 'text-[17px]', 'text-ink', 'text-ink-soft']) {
    assert.ok(hasClass(cat1, cls), `หน้าหมวดขาด ${cls}`);
  }
  assert.ok(hasClass(afterLastCard(cat1), 'bg-accent-strong'), 'ปุ่มหมวดถัดไปสีส้มเข้ม');
  const footer4 = afterLastCard(renderCategory(categories[3], categories));
  assert.ok(hasClass(footer4, 'border-accent-strong') && hasClass(footer4, 'text-accent-strong'), 'ปุ่มกลับหน้าแรกขอบ/ตัวหนังสือส้มเข้ม');
});

// มือถือ (<640px) = คอลัมน์เดียวเสมอ, ตั้งแต่ 640px = เติมคอลัมน์ตามความกว้าง การ์ดกว้าง ≥ 17.5rem (280px)
const GRID = 'sm:grid-cols-[repeat(auto-fill,minmax(17.5rem,1fr))]';
const headerClass = (html) => (/<header class="([^"]*)"/.exec(html) || [])[1];

test('หน้าหมวดเป็นตารางปรับคอลัมน์เอง', () => {
  const cat1 = renderCategory(categories[0], categories);
  assert.ok(hasClass(cat1, GRID), 'ตาราง auto-fill');
  assert.ok(hasClass(cat1, 'max-w-6xl'), 'กล่องเนื้อหา max-w-6xl');
  assert.ok(hasClass(cat1, 'sm:gap-5'), 'ระยะห่างการ์ด 20px บนจอกว้าง');
  assert.ok(hasClass(cat1, 'md:px-6'), 'ขอบข้าง 24px ตั้งแต่ 768px (640–767 ใช้ 16px ให้ได้ 2 คอลัมน์)');
});

test('แถบด้านบนพื้นเต็มจอ', () => {
  for (const html of [renderHome(categories), renderCategory(categories[0], categories)]) {
    const cls = headerClass(html);
    assert.ok(cls !== undefined, 'มี <header>');
    assert.doesNotMatch(cls, /max-w-/);
  }
});

test('ท้ายหน้าหมวด 1–3 มีปุ่มหน้าแรกและหมวดถัดไป', () => {
  for (const n of [1, 2, 3]) {
    const footer = afterLastCard(renderCategory(categories[n - 1], categories));
    assert.ok(footer.includes('href="#/"'), `หมวด ${n}: ลิงก์หน้าแรก`);
    assert.ok(hasClass(footer, 'sm:inline-flex'), `หมวด ${n}: ปุ่มหน้าแรกโชว์ตั้งแต่ sm`);
    assert.ok(footer.includes(`href="#/c/${n + 1}"`), `หมวด ${n}: ลิงก์หมวดถัดไป`);
  }
});

test('หน้าแรกปุ่มหมวด 2×2 บนจอกว้าง', () => {
  const home = renderHome(categories);
  assert.ok(hasClass(home, 'sm:grid-cols-2'));
  assert.ok(hasClass(home, 'max-w-3xl'));
});

test('index.html ไม่บีบความกว้างทั้งหน้า', () => {
  const html = readFileSync(new URL('../public/index.html', import.meta.url), 'utf8');
  assert.doesNotMatch(html, /id="app"[^>]*max-w-md/);
});
