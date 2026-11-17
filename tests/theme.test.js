import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// อ่านชุดสีจาก src/input.css ตรงๆ — ถ้าวันหลังเปลี่ยนสีจนอ่านยาก ทดสอบนี้จะไม่ผ่าน
const css = readFileSync(new URL('../src/input.css', import.meta.url), 'utf8');
const colors = Object.fromEntries(
  [...css.matchAll(/--color-([a-z-]+):\s*(#[0-9a-fA-F]{6})/g)].map(([, name, hex]) => [name, hex.toUpperCase()]),
);

const WHITE = '#FFFFFF';
const resolve = (c) => (c.startsWith('#') ? c : colors[c]);

// WCAG 2.x relative luminance / contrast ratio
function luminance(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const v = parseInt(hex.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

function assertContrast(fg, bg, min) {
  assert.ok(resolve(fg) && resolve(bg), `ไม่พบสี ${fg} หรือ ${bg}`);
  const ratio = contrast(resolve(fg), resolve(bg));
  assert.ok(ratio >= min, `${fg} บน ${bg} = ${ratio.toFixed(2)}:1 ต่ำกว่า ${min}:1`);
}

test('มีครบ 8 สีตามสเปก', () => {
  assert.deepEqual(colors, {
    cream: '#FAF7F0',
    ink: '#3F3F46',
    'ink-soft': '#71717A',
    line: '#E6E0D4',
    navy: '#1E3A5F',
    'navy-soft': '#C7D2E0',
    accent: '#EA580C',
    'accent-strong': '#C2410C',
  });
});

test('ตัวหนังสือผ่าน AA 4.5:1', () => {
  const pairs = [
    ['ink', 'cream'], ['ink', WHITE],
    ['ink-soft', 'cream'], ['ink-soft', WHITE],
    [WHITE, 'navy'], ['navy-soft', 'navy'], ['navy', WHITE],
    [WHITE, 'accent-strong'], ['accent-strong', WHITE],
  ];
  for (const [fg, bg] of pairs) assertContrast(fg, bg, 4.5);
});

test('ไอคอนผ่าน 3:1', () => {
  assertContrast(WHITE, 'accent', 3);
  assertContrast(WHITE, 'navy', 3);
});
