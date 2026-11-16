import { test } from 'node:test';
import assert from 'node:assert/strict';
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
  assert.equal(pageTitle({ name: 'home' }, categories), 'คำศัพท์งานโรงแรม');
  assert.equal(pageTitle({ name: 'category', id: 1 }, categories), '01 การต้อนรับและเช็คอิน · คำศัพท์งานโรงแรม');
});

test('renderHome มีหัวเว็บและปุ่มหมวดครบ 4', () => {
  const html = renderHome(categories);
  for (const n of [1, 2, 3, 4]) assert.ok(html.includes(`href="#/c/${n}"`), `link ${n}`);
  assert.ok(html.includes('คำศัพท์งานโรงแรม'));
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
