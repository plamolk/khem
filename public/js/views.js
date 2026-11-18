// สร้าง HTML ของแต่ละหน้าจากข้อมูล — pure functions ไม่แตะหน้าเว็บ (document)

const SITE_TITLE = 'คำศัพท์ภาษาอังกฤษ-จีนสำหรับงานบริการ';

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
        <a href="#/c/${c.id}" data-category="${c.id}" class="flex h-full items-center gap-3 rounded-2xl border border-line bg-white px-4 py-4 transition-colors hover:border-primary active:bg-page">
          <span class="w-8 shrink-0 rounded-md bg-highlight py-0.5 text-center text-lg font-medium tabular-nums text-ink">${pad2(c.id)}</span>
          <span class="min-w-0 flex-1">
            <span class="block text-[17px] font-medium leading-snug text-ink">${escapeHtml(c.th)}</span>
            <span class="mt-0.5 block text-[13px] text-ink-soft" lang="en">${escapeHtml(c.en)} · <span lang="th" class="whitespace-nowrap">${c.items.length} คำ</span></span>
          </span>
          <span class="shrink-0 text-primary">${ICONS.chevron}</span>
        </a>
      </li>`,
    )
    .join('');

  return `
    <header class="bg-navy text-white">
      <div class="mx-auto max-w-3xl px-5 pt-3 pb-3 sm:px-6">
        <h1 class="text-2xl font-medium">${SITE_TITLE}</h1>
        <p class="mt-1 text-sm text-navy-soft">อังกฤษ · จีน · พินอิน</p>
      </div>
    </header>
    <ul class="mx-auto grid max-w-3xl gap-3 px-4 pt-4 pb-10 sm:grid-cols-2 sm:px-6">${tiles}
    </ul>`;
}

const speakButton = (lang, text) => {
  const label = lang === 'en' ? 'ฟังเสียงภาษาอังกฤษ' : 'ฟังเสียงภาษาจีน';
  return `<button type="button" data-speak="${lang}" data-text="${escapeHtml(text)}" aria-label="${label}: ${escapeHtml(text)}" aria-pressed="false" class="speak-btn inline-flex size-11 shrink-0 items-center justify-center rounded-full">
            <span class="inline-flex size-8 items-center justify-center rounded-full bg-highlight text-ink transition-colors">${ICONS.speaker}</span>
          </button>`;
};

const renderCard = (item, index) => `
      <article data-card class="rounded-2xl border border-line bg-white px-4 py-3 sm:px-5 sm:py-4">
        <p class="flex items-baseline gap-2"><span class="text-xs text-ink-soft">${index + 1}</span><span lang="th" class="text-[17px] font-medium leading-snug text-ink">${escapeHtml(item.th)}</span></p>
        <div class="mt-1 flex items-center justify-between gap-2">
          <p class="min-w-0 text-base text-ink" lang="en">${escapeHtml(item.en)}</p>
          ${speakButton('en', item.en)}
        </div>
        <div class="mt-1 flex items-center justify-between gap-2">
          <div class="min-w-0">
            <p class="text-xl text-ink" lang="zh-CN">${escapeHtml(item.zh)}</p>
            <p class="text-sm text-navy" lang="zh-Latn">${escapeHtml(item.pinyin)}</p>
          </div>
          ${speakButton('zh', item.zh)}
        </div>
      </article>`;

// ท้ายหน้า: มือถือเป็นปุ่มเต็มความกว้าง, ตั้งแต่ 640px เป็นแถว ซ้าย = หน้าแรก ขวา = หมวดถัดไป
const NAV = 'mx-auto flex max-w-6xl flex-col gap-3 px-4 pb-10 sm:flex-row sm:items-center md:px-6';

const renderFooter = (category, categories) => {
  const next = categories.find((c) => c.id === category.id + 1);
  if (!next) {
    return `
    <nav class="${NAV}">
      <a href="#/" class="flex w-full items-center justify-center gap-2 rounded-2xl bg-highlight px-4 py-4 text-base text-ink active:bg-amber-400 sm:w-auto sm:px-5">${ICONS.back}<span>กลับหน้าแรก</span></a>
    </nav>`;
  }
  return `
    <nav class="${NAV}">
      <a href="#/" class="hidden items-center justify-center gap-2 rounded-2xl bg-highlight px-5 py-4 text-base text-ink active:bg-amber-400 sm:inline-flex">${ICONS.back}<span>หน้าแรก</span></a>
      <a href="#/c/${next.id}" class="flex w-full items-center gap-3 rounded-2xl bg-primary px-4 py-4 text-white active:bg-navy sm:ml-auto sm:max-w-md">
        <span class="min-w-0 flex-1">
          <span class="block text-[13px]">หมวดถัดไป</span>
          <span class="block text-base leading-snug">${pad2(next.id)} ${escapeHtml(next.th)}</span>
        </span>
        <span class="shrink-0">${ICONS.next}</span>
      </a>
    </nav>`;
};

export function renderCategory(category, categories) {
  return `
    <header class="sticky top-0 z-10 bg-navy text-white">
      <div class="mx-auto flex max-w-6xl items-center gap-1 px-2 py-2 md:px-4">
      <a href="#/" aria-label="กลับหน้าแรก" class="inline-flex size-11 shrink-0 items-center justify-center rounded-full text-white active:bg-white/10">${ICONS.back}</a>
      <div class="min-w-0">
        <h1 class="text-base font-medium leading-tight">${pad2(category.id)} ${escapeHtml(category.th)}</h1>
        <p class="text-xs text-navy-soft" lang="en">${escapeHtml(category.en)}</p>
      </div>
      </div>
    </header>
    <section class="mx-auto grid max-w-6xl gap-3 px-4 py-4 sm:grid-cols-[repeat(auto-fill,minmax(17.5rem,1fr))] sm:gap-5 sm:py-6 md:px-6">${category.items.map(renderCard).join('')}
    </section>${renderFooter(category, categories)}`;
}
