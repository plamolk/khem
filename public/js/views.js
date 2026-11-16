// สร้าง HTML ของแต่ละหน้าจากข้อมูล — pure functions ไม่แตะหน้าเว็บ (document)

const SITE_TITLE = 'หมวดหมู่คำศัพท์';

const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (ch) => ESCAPES[ch]);
}

export function pad2(n) {
  return String(n).padStart(2, '0');
}

export function parseRoute(hash, count) {
  const match = /^#\/c\/(\d+)$/.exec(hash);
  const id = match ? Number(match[1]) : 0;
  return id >= 1 && id <= count ? { name: 'category', id } : { name: 'home' };
}

export function pageTitle(route, categories) {
  if (route.name !== 'category') return SITE_TITLE;
  const category = categories.find((c) => c.id === route.id);
  return `${pad2(category.id)} ${category.th} · ${SITE_TITLE}`;
}

const icon = (paths, cls = 'size-5') =>
  `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;

const ICONS = {
  speaker: icon('<path d="M15 8a5 5 0 0 1 0 8"/><path d="M17.7 5a9 9 0 0 1 0 14"/><path d="M6 15H4a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1h2l3.5-4.5A.8.8 0 0 1 11 5v14a.8.8 0 0 1-1.5.5z"/>'),
  back: icon('<path d="M5 12h14"/><path d="M5 12l6 6"/><path d="M5 12l6-6"/>', 'size-6'),
  chevron: icon('<path d="M9 6l6 6-6 6"/>'),
  next: icon('<path d="M5 12h14"/><path d="M13 18l6-6"/><path d="M13 6l6 6"/>'),
};

export function renderHome(categories) {
  const tiles = categories
    .map(
      (c) => `
      <li>
        <a href="#/c/${c.id}" data-category="${c.id}" class="flex items-center gap-3 rounded-2xl border border-red-200 bg-white px-4 py-4 transition-colors hover:border-red-300 active:bg-red-50">
          <span class="w-7 shrink-0 text-lg font-medium tabular-nums text-red-600">${pad2(c.id)}</span>
          <span class="min-w-0 flex-1">
            <span class="block text-base leading-snug text-stone-800">${escapeHtml(c.th)}</span>
            <span class="mt-0.5 block text-xs text-stone-500" lang="en">${escapeHtml(c.en)} · <span lang="th">${c.items.length} คำ</span></span>
          </span>
          <span class="shrink-0 text-red-500">${ICONS.chevron}</span>
        </a>
      </li>`,
    )
    .join('');

  return `
    <header class="px-5 pt-10 pb-6">
      <h1 class="text-2xl font-medium text-red-800">${SITE_TITLE}</h1>
      <p class="mt-1 text-sm text-stone-500">อังกฤษ · จีน · พินอิน</p>
    </header>
    <ul class="space-y-3 px-4 pb-10">${tiles}
    </ul>`;
}

const speakButton = (lang, text) => {
  const label = lang === 'en' ? 'ฟังเสียงภาษาอังกฤษ' : 'ฟังเสียงภาษาจีน';
  return `<button type="button" data-speak="${lang}" data-text="${escapeHtml(text)}" aria-label="${label}: ${escapeHtml(text)}" aria-pressed="false" class="speak-btn inline-flex size-11 shrink-0 items-center justify-center rounded-full text-red-700">
            <span class="inline-flex size-8 items-center justify-center rounded-full bg-red-50 transition-colors">${ICONS.speaker}</span>
          </button>`;
};

const renderCard = (item, index) => `
      <article data-card class="rounded-2xl border border-red-100 bg-white px-4 py-3">
        <p class="text-xs text-stone-500">${index + 1} · <span lang="th">${escapeHtml(item.th)}</span></p>
        <div class="mt-1 flex items-center justify-between gap-2">
          <p class="min-w-0 text-base text-stone-800" lang="en">${escapeHtml(item.en)}</p>
          ${speakButton('en', item.en)}
        </div>
        <div class="mt-1 flex items-center justify-between gap-2">
          <div class="min-w-0">
            <p class="text-xl text-stone-900" lang="zh-CN">${escapeHtml(item.zh)}</p>
            <p class="text-sm text-red-700" lang="zh-Latn">${escapeHtml(item.pinyin)}</p>
          </div>
          ${speakButton('zh', item.zh)}
        </div>
      </article>`;

const renderFooter = (category, categories) => {
  const next = categories.find((c) => c.id === category.id + 1);
  if (!next) {
    return `
    <nav class="px-4 pb-10">
      <a href="#/" class="flex items-center justify-center gap-2 rounded-2xl border border-red-200 px-4 py-4 text-base text-red-700 active:bg-red-50">${ICONS.back}<span>กลับหน้าแรก</span></a>
    </nav>`;
  }
  return `
    <nav class="px-4 pb-10">
      <a href="#/c/${next.id}" class="flex items-center gap-3 rounded-2xl bg-red-600 px-4 py-4 text-white active:bg-red-700">
        <span class="min-w-0 flex-1">
          <span class="block text-xs">หมวดถัดไป</span>
          <span class="block text-base leading-snug">${pad2(next.id)} ${escapeHtml(next.th)}</span>
        </span>
        <span class="shrink-0">${ICONS.next}</span>
      </a>
    </nav>`;
};

export function renderCategory(category, categories) {
  return `
    <header class="sticky top-0 z-10 flex items-center gap-1 border-b border-red-100 bg-white/95 px-2 py-2 backdrop-blur">
      <a href="#/" aria-label="กลับหน้าแรก" class="inline-flex size-11 shrink-0 items-center justify-center rounded-full text-red-600 active:bg-red-50">${ICONS.back}</a>
      <div class="min-w-0">
        <h1 class="text-base font-medium leading-tight text-red-800">${pad2(category.id)} ${escapeHtml(category.th)}</h1>
        <p class="text-xs text-stone-500" lang="en">${escapeHtml(category.en)}</p>
      </div>
    </header>
    <section class="space-y-3 px-4 py-4">${category.items.map(renderCard).join('')}
    </section>${renderFooter(category, categories)}`;
}
