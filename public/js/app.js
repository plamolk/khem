// ต่อข้อมูล + หน้าจอ + เสียงอ่าน เข้ากับหน้าเว็บจริง
import { categories } from './data.js';
import { parseRoute, pageTitle, renderHome, renderCategory } from './views.js';
import { initSpeech, onVoicesChanged, speak } from './speech.js';

const app = document.getElementById('app');
const root = document.documentElement;
let voices = { en: null, zh: null };
let speakingButton = null;
let speechToken = 0;

function setSpeaking(button, on) {
  button.classList.toggle('is-speaking', on);
  button.setAttribute('aria-pressed', String(on));
}

function render() {
  const route = parseRoute(location.hash, categories.length);
  speakingButton = null;
  app.innerHTML =
    route.name === 'category'
      ? renderCategory(categories.find((c) => c.id === route.id), categories)
      : renderHome(categories);
  document.title = pageTitle(route, categories);
  window.scrollTo(0, 0);
}

app.addEventListener('click', (event) => {
  const button = event.target.closest('[data-speak]');
  if (!button) return;
  const lang = button.dataset.speak;
  const voice = voices[lang];
  if (!voice) return;

  if (speakingButton) setSpeaking(speakingButton, false);
  speakingButton = button;
  setSpeaking(button, true);
  const token = ++speechToken;

  // ต้องเรียก speak ทันทีภายในการแตะ ห้าม await ก่อนหน้า (iOS Safari)
  speak(window, button.dataset.text, lang, voice, () => {
    // เสียงเก่าที่ถูกตัดอาจแจ้งจบมาทีหลัง — สนใจเฉพาะเสียงล่าสุด
    if (token !== speechToken) return;
    setSpeaking(button, false);
    speakingButton = null;
  });
});

window.addEventListener('hashchange', render);
render();

// แสดงปุ่มเสียงเฉพาะภาษาที่เครื่องมีเสียง — และอัปเดตถ้ารายการเสียงโหลดเสร็จทีหลัง
function applyVoices(found) {
  voices = found;
  root.classList.toggle('no-tts-en', !found.en);
  root.classList.toggle('no-tts-zh', !found.zh);
}

onVoicesChanged(window, applyVoices);
initSpeech(window).then(applyVoices);
