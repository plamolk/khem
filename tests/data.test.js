import { test } from 'node:test';
import assert from 'node:assert/strict';
import { categories } from '../public/js/data.js';

const allItems = () => categories.flatMap((c) => c.items);

test('มี 4 หมวด id 1-4 ชื่อตรงสเปก', () => {
  assert.deepEqual(categories.map((c) => c.id), [1, 2, 3, 4]);
  assert.deepEqual(categories.map((c) => c.th), [
    'การต้อนรับและเช็คอิน',
    'แม่บ้านและสิ่งอำนวยความสะดวกในห้อง',
    'บริการทั่วไปและสิ่งอำนวยความสะดวกส่วนกลาง',
    'การแจ้งปัญหาและการเช็คเอาท์',
  ]);
  assert.deepEqual(categories.map((c) => c.en), [
    'Reception & Check-in',
    'Housekeeping & Room Amenities',
    'Hotel Facilities & Services',
    'Problem Solving & Check-out',
  ]);
});

test('หมวดละ 15 รายการ ทุกช่องไม่ว่าง', () => {
  for (const c of categories) {
    assert.equal(c.items.length, 15, `หมวด ${c.id}`);
    for (const item of c.items) {
      for (const key of ['th', 'en', 'zh', 'pinyin']) {
        assert.equal(typeof item[key], 'string', `${c.id} ${key}`);
        assert.ok(item[key].trim().length > 0, `${c.id} ${key} ว่าง`);
        assert.equal(item[key], item[key].trim(), `${c.id} ${key} มีช่องว่างหัวท้าย: "${item[key]}"`);
      }
    }
  }
});

test('th ไม่มีเลขนำหน้า', () => {
  for (const item of allItems()) {
    assert.doesNotMatch(item.th, /^\d+\.\s/, item.th);
  }
});

test('ภาษาไทยไม่เพี้ยนแบบข้อความจาก PDF', () => {
  const texts = [...categories.map((c) => c.th), ...allItems().map((i) => i.th)];
  for (const t of texts) {
    assert.doesNotMatch(t, /\s[ัิ-ฺ็-๎]/, `ช่องว่างหน้าสระ/วรรณยุกต์: ${t}`);
    assert.doesNotMatch(t, /ํา/, `สระอำแยกตัว: ${t}`);
  }
});

test('แต่ละภาษาอยู่ถูกช่อง', () => {
  for (const item of allItems()) {
    for (const key of ['en', 'pinyin']) {
      assert.doesNotMatch(item[key], /[฀-๿]/, `${key} มีอักษรไทย: ${item[key]}`);
      assert.doesNotMatch(item[key], /[一-鿿]/, `${key} มีอักษรจีน: ${item[key]}`);
    }
    assert.match(item.zh, /[一-鿿]/, `zh ไม่มีอักษรจีน: ${item.zh}`);
    assert.match(item.th, /[฀-๿]/, `th ไม่มีอักษรไทย: ${item.th}`);
  }
});
