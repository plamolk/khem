// เสียงอ่านจากเครื่องของผู้ใช้ (Web Speech API) — ไฟล์นี้ไม่แตะหน้าเว็บ (document)

const RATES = { en: 0.9, zh: 0.8 };
const PAUSES = { en: ', ', zh: '，' };

// ลำดับเสียงที่ต้องการ: ตัวแรกที่เจอในรายการจะถูกเลือก
const PREFERENCES = {
  en: [(l) => l === 'en-us', (l) => l.startsWith('en-') || l === 'en'],
  zh: [(l) => l === 'zh-cn' || l === 'cmn-hans-cn', (l) => l === 'zh-tw' || l === 'cmn-hant-tw'],
};

// เสียงตลก/เสียงหุ่นยนต์ที่ iOS และ macOS ใส่มาให้ — เลือกเป็นอันดับสุดท้าย
const NOVELTY_VOICE = /^(albert|bad news|bahh|bells|boing|bubbles|cellos|good news|jester|organ|superstar|trinoids|whisper|wobble|zarvox|eddy|flo|grandma|grandpa|reed|rocko|sandy|shelley|fred|junior|kathy|ralph)\b/i;

const normalizeLang = (lang) => String(lang || '').replace(/_/g, '-').toLowerCase();

let currentUtterance = null; // กันไม่ให้เบราว์เซอร์เก็บกวาด utterance ระหว่างพูด (onend จะไม่มา)

/** แทน " / " ด้วยการเว้นจังหวะ เพื่อไม่ให้เครื่องอ่านคำว่า "slash" */
export function toSpeechText(text, lang) {
  return text.replace(/\s*\/\s*/g, PAUSES[lang]);
}

/**
 * เลือกเสียงที่เหมาะกับภาษา หรือ null ถ้าไม่มี (จีนจะไม่เลือกเสียงกวางตุ้ง zh-HK / yue)
 * ลำดับ: เสียงปกติก่อนเสียงตลก → สำเนียงที่ต้องการ → เสียงหลักของเครื่อง → เสียงในเครื่องก่อนเสียงออนไลน์
 */
export function pickVoice(voices, lang) {
  const ranked = [];
  voices.forEach((v, index) => {
    const tier = PREFERENCES[lang].findIndex((matches) => matches(normalizeLang(v.lang)));
    if (tier === -1) return;
    const key = [NOVELTY_VOICE.test(String(v.name || '')) ? 1 : 0, tier, v.default ? 0 : 1, v.localService === false ? 1 : 0, index];
    ranked.push({ v, key });
  });
  ranked.sort((a, b) => a.key.reduce((d, k, i) => d || k - b.key[i], 0));
  return ranked.length > 0 ? ranked[0].v : null;
}

const pickBoth = (voices) => ({ en: pickVoice(voices, 'en'), zh: pickVoice(voices, 'zh') });

/** รายการเสียงในบางเบราว์เซอร์โหลดช้า: รอ voiceschanged แต่ไม่เกิน timeoutMs */
export function loadVoices(synth, timeoutMs = 1500) {
  const now = synth.getVoices();
  if (now.length > 0) return Promise.resolve(now);
  return new Promise((resolve) => {
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      resolve(synth.getVoices());
    };
    const timer = setTimeout(finish, timeoutMs);
    if (typeof synth.addEventListener === 'function') {
      synth.addEventListener('voiceschanged', finish);
    } else {
      synth.onvoiceschanged = finish;
    }
  });
}

/** หาเสียงอังกฤษและจีนที่ใช้ได้ ถ้าเบราว์เซอร์ไม่รองรับ คืน { en: null, zh: null } */
export async function initSpeech(win = globalThis, timeoutMs = 1500) {
  const synth = win.speechSynthesis;
  if (!synth || !win.SpeechSynthesisUtterance) return { en: null, zh: null };
  try {
    return pickBoth(await loadVoices(synth, timeoutMs));
  } catch {
    return { en: null, zh: null };
  }
}

/** แจ้งทุกครั้งที่รายการเสียงเปลี่ยน (เช่น เสียงโหลดเสร็จหลังหมดเวลารอ) */
export function onVoicesChanged(win, callback) {
  const synth = win.speechSynthesis;
  if (!synth || !win.SpeechSynthesisUtterance || typeof synth.addEventListener !== 'function') return;
  synth.addEventListener('voiceschanged', () => callback(pickBoth(synth.getVoices())));
}

/**
 * อ่านออกเสียง — ต้องเรียกตรงๆ ภายในการแตะของผู้ใช้ (iOS Safari บังคับ)
 * onDone ถูกเรียกครั้งเดียว เมื่ออ่านจบ เกิด error หรือ watchdog พบว่าหยุดพูดแล้วแต่ไม่มี onend
 */
export function speak(win, text, lang, voice, onDone, { pollMs = 250, graceMs = 1000 } = {}) {
  const synth = win.speechSynthesis;
  synth.cancel();
  const utterance = new win.SpeechSynthesisUtterance(toSpeechText(text, lang));
  utterance.voice = voice;
  utterance.lang = String(voice.lang).replace(/_/g, '-');
  utterance.rate = RATES[lang];

  const startedAt = Date.now();
  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    clearInterval(watchdog);
    if (currentUtterance === utterance) currentUtterance = null;
    onDone();
  };
  const watchdog = setInterval(() => {
    if (Date.now() - startedAt >= graceMs && !synth.speaking && !synth.pending) finish();
  }, pollMs);

  utterance.onend = finish;
  utterance.onerror = finish;
  currentUtterance = utterance;
  synth.speak(utterance);
}
