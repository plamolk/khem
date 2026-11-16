import { test } from 'node:test';
import assert from 'node:assert/strict';
import v8 from 'node:v8';
import vm from 'node:vm';
import { toSpeechText, pickVoice, initSpeech, speak, onVoicesChanged } from '../public/js/speech.js';

v8.setFlagsFromString('--expose-gc');
const gc = vm.runInNewContext('gc');

class FakeUtterance {
  constructor(text) {
    this.text = text;
  }
}

function fakeSynth({ voices = [], lateVoices = null, lateMs = 10 } = {}) {
  let current = voices;
  const listeners = [];
  const calls = { speak: [], cancel: 0 };
  const synth = {
    calls,
    getVoices: () => current,
    cancel: () => { calls.cancel += 1; },
    speak: (u) => { calls.speak.push(u); },
    addEventListener: (type, fn) => { if (type === 'voiceschanged') listeners.push(fn); },
  };
  if (lateVoices) {
    setTimeout(() => { current = lateVoices; listeners.forEach((fn) => fn()); }, lateMs);
  }
  return synth;
}

const fakeWin = (synthOpts) => ({ speechSynthesis: fakeSynth(synthOpts), SpeechSynthesisUtterance: FakeUtterance });

test('toSpeechText แทน / ด้วยการเว้นจังหวะ', () => {
  assert.equal(toSpeechText('Key card / Room key', 'en'), 'Key card, Room key');
  assert.equal(toSpeechText('房卡 / 房间钥匙', 'zh'), '房卡，房间钥匙');
  assert.equal(toSpeechText('Check-in', 'en'), 'Check-in');
});

test('pickVoice ภาษาอังกฤษ: en-US ก่อน แล้วค่อย en-* ใดก็ได้', () => {
  assert.equal(pickVoice([{ lang: 'en-GB' }, { lang: 'en_US' }], 'en').lang, 'en_US');
  assert.equal(pickVoice([{ lang: 'en-GB' }], 'en').lang, 'en-GB');
  assert.equal(pickVoice([], 'en'), null);
});

test('pickVoice ภาษาจีน: จีนกลางเท่านั้น ห้ามกวางตุ้ง', () => {
  assert.equal(pickVoice([{ lang: 'zh-HK' }, { lang: 'zh-TW' }], 'zh').lang, 'zh-TW');
  assert.equal(pickVoice([{ lang: 'zh-HK' }, { lang: 'yue-HK' }], 'zh'), null);
  assert.equal(pickVoice([{ lang: 'zh-TW' }, { lang: 'cmn-Hans-CN' }], 'zh').lang, 'cmn-Hans-CN');
  assert.equal(pickVoice([{ lang: 'zh-tw' }, { lang: 'ZH-CN' }], 'zh').lang, 'ZH-CN');
});

test('initSpeech เมื่อเบราว์เซอร์ไม่มี speechSynthesis (เช่น LINE บน Android)', async () => {
  assert.deepEqual(await initSpeech({}, 50), { en: null, zh: null });
});

test('initSpeech ไม่ค้างเมื่อ voiceschanged ไม่เคยเกิด', async () => {
  const started = Date.now();
  const result = await initSpeech(fakeWin({ voices: [] }), 50);
  assert.deepEqual(result, { en: null, zh: null });
  assert.ok(Date.now() - started < 500, 'ต้องจบภายในเวลาที่กำหนด');
});

test('initSpeech รอเสียงที่โหลดมาทีหลังผ่าน voiceschanged', async () => {
  const win = fakeWin({ voices: [], lateVoices: [{ lang: 'en-US' }, { lang: 'zh-CN' }] });
  const result = await initSpeech(win, 1000);
  assert.equal(result.en.lang, 'en-US');
  assert.equal(result.zh.lang, 'zh-CN');
});

test('speak ตัดเสียงเดิมทุกครั้ง ตั้งค่าเสียง/ภาษา/ความเร็ว และเรียก onDone เมื่อ error', () => {
  const win = fakeWin();
  const enVoice = { lang: 'en-US' };
  const zhVoice = { lang: 'zh-CN' };
  let done = 0;
  speak(win, 'Key card / Room key', 'en', enVoice, () => {});
  speak(win, '房卡 / 房间钥匙', 'zh', zhVoice, () => { done += 1; });
  const { calls } = win.speechSynthesis;
  assert.equal(calls.cancel, 2);
  assert.equal(calls.speak.length, 2);
  const [first, last] = calls.speak;
  assert.equal(first.text, 'Key card, Room key');
  assert.equal(first.rate, 0.9);
  assert.equal(first.voice, enVoice);
  assert.equal(last.text, '房卡，房间钥匙');
  assert.equal(last.rate, 0.8);
  assert.equal(last.lang, 'zh-CN');
  assert.equal(last.voice, zhVoice);
  last.onerror();
  assert.equal(done, 1);
  last.onend();
  assert.equal(done, 1, 'onDone ถูกเรียกครั้งเดียวต่อการอ่านหนึ่งครั้ง');
});

test('pickVoice ไม่เลือกเสียงตลก/เสียงหุ่นยนต์ของ iOS ถ้ามีเสียงปกติ', () => {
  const en = [{ lang: 'en-US', name: 'Albert' }, { lang: 'en-US', name: 'Bad News' }, { lang: 'en-US', name: 'Eddy (English (US))' }, { lang: 'en-US', name: 'Samantha' }];
  assert.equal(pickVoice(en, 'en').name, 'Samantha');
  const zh = [{ lang: 'zh-CN', name: 'Eddy (中文（中国大陆）)' }, { lang: 'zh-CN', name: 'Grandma (中文（中国大陆）)' }, { lang: 'zh-CN', name: 'Tingting' }];
  assert.equal(pickVoice(zh, 'zh').name, 'Tingting');
  assert.equal(pickVoice([{ lang: 'en-GB', name: 'Daniel' }, { lang: 'en-US', name: 'Albert' }], 'en').name, 'Daniel');
  assert.equal(pickVoice([{ lang: 'en-US', name: 'Albert' }], 'en').name, 'Albert', 'มีแต่เสียงตลกก็ยังดีกว่าไม่มีเสียง');
});

test('pickVoice เลือกเสียงหลักของเครื่อง (default) ก่อน', () => {
  const voices = [{ lang: 'en-US', name: 'Fred2' }, { lang: 'en-US', name: 'Nice', default: true }];
  assert.equal(pickVoice(voices, 'en').name, 'Nice');
});

test('onVoicesChanged แจ้งเสียงที่มาทีหลัง (หลังหมดเวลา 1.5 วินาที)', async () => {
  const win = fakeWin({ voices: [], lateVoices: [{ lang: 'en-US', name: 'Samantha' }, { lang: 'zh-CN', name: 'Tingting' }], lateMs: 80 });
  const updates = [];
  onVoicesChanged(win, (found) => updates.push(found));
  assert.deepEqual(await initSpeech(win, 20), { en: null, zh: null });
  await new Promise((r) => setTimeout(r, 120));
  assert.equal(updates.length, 1);
  assert.equal(updates[0].en.name, 'Samantha');
  assert.equal(updates[0].zh.name, 'Tingting');
});

test('onVoicesChanged ไม่พังเมื่อไม่มี speechSynthesis', () => {
  assert.doesNotThrow(() => onVoicesChanged({}, () => {}));
});

test('speak: watchdog ล้างสถานะเมื่อเบราว์เซอร์ไม่แจ้งว่าอ่านจบ', (t) => {
  t.mock.timers.enable({ apis: ['setInterval', 'Date'] });
  const win = fakeWin();
  win.speechSynthesis.speaking = true;
  win.speechSynthesis.pending = false;
  let done = 0;
  speak(win, 'Lobby', 'en', { lang: 'en-US' }, () => { done += 1; });
  t.mock.timers.tick(1500);
  assert.equal(done, 0, 'ยังพูดอยู่ ต้องไม่ล้างสถานะ');
  win.speechSynthesis.speaking = false;
  t.mock.timers.tick(300);
  assert.equal(done, 1, 'หยุดพูดแล้วแต่ไม่มี onend ต้องล้างสถานะเอง');
  t.mock.timers.tick(1000);
  win.speechSynthesis.calls.speak[0].onend();
  assert.equal(done, 1);
});

test('speak เก็บ utterance ไว้ไม่ให้ถูก garbage collect ระหว่างพูด', async () => {
  let ref;
  const win = {
    speechSynthesis: { speaking: true, pending: false, cancel() {}, speak(u) { ref = new WeakRef(u); } },
    SpeechSynthesisUtterance: FakeUtterance,
  };
  speak(win, 'Lobby', 'en', { lang: 'en-US' }, () => {});
  await new Promise((r) => setImmediate(r));
  gc();
  const alive = ref.deref();
  assert.ok(alive, 'utterance ถูกเก็บกวาดไปแล้ว — onend จะไม่มีวันมา');
  alive.onend();
});
