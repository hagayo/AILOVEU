let activeTab = "presets";
let selectedPreset = PALETTES[0].colors;
let selectedPresetIndex = 0;
let variationSeed = Math.floor(Math.random() * 100000);
let variationIndex = 0;
let uploadedLogoFile = null;
let logoPreviewUrl = null;
let logoExtractedColors = null;
let logoColorsActive = false;

const TRUST_STYLES = ["logos", "customers", "stars", "certifications", "experience", "counters", "reviews"];
const AUTO_STYLE_BY_INDUSTRY = { technology:"bold", finance:"corporate", healthcare:"modern", retail:"friendly", food:"friendly", education:"modern", creative:"creative", realestate:"corporate", hospitality:"luxury", fitness:"bold", ngo:"friendly", construction:"corporate", other:"modern" };
const AUTO_LAYOUT_BY_INDUSTRY = { technology:"saas", finance:"classic", healthcare:"classic", retail:"local", food:"hospitality", education:"classic", creative:"portfolio", realestate:"local", hospitality:"hospitality", fitness:"local", ngo:"classic", construction:"classic", other:"split-hero" };
const AUTO_IMAGE_BY_INDUSTRY = { technology:"workspaces", healthcare:"people", finance:"architecture", retail:"people", food:"food", education:"people", creative:"abstract", realestate:"architecture", hospitality:"architecture", fitness:"people", ngo:"people", construction:"architecture", other:"abstract" };
const IMAGE_PERSONALITIES = {
  abstract: "abstract shapes color light",
  people: "people portrait teamwork",
  nature: "nature landscape organic",
  architecture: "architecture building interior",
  workspaces: "workspace desk office",
  food: "food table restaurant"
};

const $ = (id) => document.getElementById(id);
const valueOf = (id, fallback = "") => $(id)?.value ?? fallback;
const checked = (id) => $(id)?.checked ?? false;

const SETTINGS_KEY = "make-me-a-website:v22";
const isPersistableField = (el) => el && el.id && !["file", "button", "submit"].includes(el.type);
function persistableFields() { return Array.from(document.querySelectorAll("input, select, textarea")).filter(isPersistableField); }
function saveSettings() {
  const data = { values: {}, activeTab, selectedPresetIndex, details: {} };
  persistableFields().forEach(el => {
    data.values[el.id] = el.type === "checkbox" ? el.checked : el.value;
  });
  document.querySelectorAll("details[id]").forEach(el => { data.details[el.id] = el.open; });
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(data)); } catch (e) { /* storage may be disabled */ }
}
function restoreSettings() {
  try {
    const data = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "null");
    if (!data) return;
    Object.entries(data.values || {}).forEach(([id, value]) => {
      const el = $(id);
      if (!el || !isPersistableField(el)) return;
      if (el.type === "checkbox") el.checked = Boolean(value); else el.value = value;
    });
    activeTab = data.activeTab === "manual" ? "manual" : "presets";
    selectedPresetIndex = Number.isInteger(data.selectedPresetIndex) ? Math.max(0, Math.min(PALETTES.length - 1, data.selectedPresetIndex)) : 0;
    selectedPreset = PALETTES[selectedPresetIndex].colors;
    Object.entries(data.details || {}).forEach(([id, open]) => { const el = $(id); if (el?.tagName === "DETAILS") el.open = Boolean(open); });
  } catch (e) { /* ignore corrupted saved settings */ }
}
function bindSettingsPersistence() {
  persistableFields().forEach(el => {
    el.addEventListener("input", saveSettings);
    el.addEventListener("change", saveSettings);
  });
  document.querySelectorAll("details[id]").forEach(el => el.addEventListener("toggle", saveSettings));
}


const UI_LANG_KEY = "make-me-a-website:ui-lang";
let uiLanguage = "en";
const UI_COPY = {
  en: {
    dir: "ltr",
    htmlLang: "en",
    selectors: {
      ".top-back-link": "← Back to AILOVEU",
      ".eyebrow": "Static website starter-kit generator",
      ".page-header h1": "Make me a website!",
      ".page-header p:last-child": "Enter a few details and download a polished, multi-page static website ZIP.",
      "#business-label": "Business details",
      "label[for='biz-name']": "Business name <span class='required'>*</span>",
      "label[for='site-language']": "Site language",
      "label[for='logo-input']": "Logo or icon",
      ".logo-color-label": "Extracted colors",
      "label[for='biz-industry']": "Industry <span class='required'>*</span>",
      "label[for='brand-voice']": "Brand voice",
      "label[for='website-type']": "Website type",
      "label[for='site-domain']": "Domain URL <span class='optional'>optional</span>",
      "#contact-details-label": "Contact Details",
      "label[for='biz-email']": "Email",
      "label[for='biz-phone']": "Phone",
      "label[for='biz-area']": "City / service area",
      "label[for='biz-address']": "Address",
      "label[for='biz-hours']": "Opening hours",
      "#cta-goals-label": "CTA-Goals-Slogans",
      "label[for='main-headline']": "Main headline <span class='optional'>optional</span>",
      "label[for='biz-tagline']": "Tagline <span class='muted-label'>optional</span>",
      "label[for='about-text']": "About text <span class='optional'>optional</span>",
      "label[for='website-goal']": "Main website goal",
      "label[for='primary-cta']": "Primary CTA",
      "label[for='custom-cta-url']": "Custom CTA URL <span class='optional'>optional</span>",
      "label[for='product-payment-url']": "Product / payments page link <span class='optional'>optional</span>",
      "#social-links-card summary": "Social links",
      "#social-links-card .card-help": "Optional. Add only the profiles you want shown in the generated footer and contact page.",
      "label[for='social-instagram']": "Instagram",
      "label[for='social-linkedin']": "LinkedIn",
      "label[for='social-facebook']": "Facebook",
      "label[for='social-tiktok']": "TikTok",
      "label[for='social-youtube']": "YouTube",
      "#integrations-card summary": "Analytics placeholders",
      "#integrations-card .card-help": "Optional. Adds clearly marked placeholder snippets to the generated site head.",
      "label[for='ga-id']": "GA measurement ID",
      "label[for='meta-pixel-id']": "Meta Pixel ID",
      "#brand-label": "Styling & Colors",
      "#tab-manual": "Enter colors",
      "#tab-presets": "Presets",
      "label[for='col1']": "Primary",
      "label[for='col2']": "Secondary",
      "label[for='col3']": "Accent",
      "#style-label": "Site style engine",
      "label[for='design-style']": "Design style",
      "label[for='trust-style']": "Trust section",
      "label[for='image-personality']": "Image feel",
      "#features-label": "Generated website options",
      "label[for='form-mode']": "Contact form behavior",
      "#alert-success": "Files ready - your download should start automatically.",
      "#quality-label": "Site quality score",
      "#quality-score": "Not generated yet",
      "#quality-summary": "Generate a site to see the launch checklist.",
      "#generation-card .section-label": "Generation progress",
      "#preview-label": "Live preview",
      "#preview-card .card-help": "Preview the homepage before downloading. Regenerate to explore another visual version.",
      "#regen-btn": "↻ Generate another version",
      "label[for='preview-page-select']": "Preview page",
      ".device-btn[data-device='desktop']": "Desktop",
      ".device-btn[data-device='tablet']": "Tablet",
      ".device-btn[data-device='mobile']": "Mobile",
      "#preview-btn": "Preview website",
      "#gen-btn": "<span aria-hidden='true'>⬇</span> Generate & Download Website ZIP",
      ".footer-note": "Generates: static site, Picsum images, dark mode, compare content, schema, launch kit, sitemap, robots, manifest, README.",
      ".app-footer": "By <a href='https://ailoveu.art' target='_blank' rel='noopener'>AILOVEU</a> &amp; <a href='https://il.linkedin.com/in/hagaytech' target='_blank' rel='noopener'>Hagay</a>"
    },
    checks: ["Add Google Analytics placeholder", "Add Meta Pixel placeholder"],
    featureChecks: ["Add faq.html", "Add pricing.html", "Add blog.html", "Add thank-you.html", "Add 404.html"],
    generationSteps: ["Reading your business details", "Choosing layout and image direction", "Building pages and local business data", "Adding SEO, schema, sitemap, and assets", "Packing the ZIP"],
    qualityItems: ["Goal-aware structure", "CTA strategy", "Brand voice", "SEO files", "Dark-mode toggle", "Schema.org data", "Launch kit"],
    placeholders: {
      "biz-name": "e.g. Bright Studio", "site-domain": "https://yourdomain.com", "biz-email": "hello@yourbusiness.com", "biz-phone": "+1 (555) 000-0000", "biz-area": "e.g. Tel Aviv, online worldwide", "biz-address": "123 Main Street, City", "biz-hours": "Mon-Fri, 9:00-18:00", "main-headline": "e.g. Websites that sell while you sleep", "biz-tagline": "e.g. Building better tomorrows", "about-text": "Tell visitors who you are, who you help, and what makes your approach different.", "custom-cta-url": "https://calendly.com/your-link", "product-payment-url": "https://your-store.com/product-or-payment", "social-instagram": "https://instagram.com/yourbrand", "social-linkedin": "https://linkedin.com/company/yourbrand", "social-facebook": "https://facebook.com/yourbrand", "social-tiktok": "https://tiktok.com/@yourbrand", "social-youtube": "https://youtube.com/@yourbrand", "ga-id": "G-XXXXXXXXXX", "meta-pixel-id": "1234567890"
    },
    options: {
      "site-language": { en:"English", he:"Hebrew / עברית" },
      "biz-industry": { "":"Select industry", technology:"Technology / Software", healthcare:"Healthcare / Medical", finance:"Finance / Legal", retail:"Retail / E-commerce", food:"Food & Beverage", education:"Education / Training", creative:"Creative / Design / Media", realestate:"Real Estate / Property", hospitality:"Hospitality / Travel", fitness:"Fitness / Wellness", ngo:"Non-profit / NGO", construction:"Construction / Manufacturing", other:"Other" },
      "brand-voice": { professional:"Professional", friendly:"Friendly", bold:"Bold", luxury:"Luxury", playful:"Playful", technical:"Technical", calm:"Calm" },
      "website-type": { full:"Full site", onepage:"One-page site" },
      "website-goal": { leads:"Get leads", bookings:"Book appointments", credibility:"Build credibility", portfolio:"Show portfolio", sales:"Sell products or packages", donations:"Collect donations", event:"Promote an event", hiring:"Hire employees" },
      "primary-cta": { auto:"Auto choose from goal", "Book a call":"Book a call", "Get a quote":"Get a quote", "Start free":"Start free", "Reserve now":"Reserve now", "Join now":"Join now", "Donate now":"Donate now", "View portfolio":"View portfolio", "Shop now":"Shop now", "Apply now":"Apply now" },
      "design-style": { auto:"Auto choose from business type", modern:"Modern clean", bold:"Bold startup", luxury:"Luxury editorial", friendly:"Friendly local business", creative:"Creative studio", wellness:"Calm wellness", corporate:"Corporate professional" },
      "trust-style": { auto:"Random / auto choose", logos:"Client logo strip", customers:"Trusted by 250+ customers", stars:"Star rating block", certifications:"Certifications", experience:"Years of experience", counters:"Number counters", reviews:"Review cards" },
      "image-personality": { auto:"Auto from industry", abstract:"Abstract", people:"People", nature:"Nature", architecture:"Architecture", workspaces:"Workspaces", food:"Food" },
      "form-mode": { netlify:"Netlify-ready form + thank-you page", mailto:"Mailto fallback", static:"Static demo form" },
      "preview-page-select": { "index.html":"Home", "about.html":"About", "services.html":"Services", "pricing.html":"Pricing", "faq.html":"FAQ", "blog.html":"Blog", "compare.html":"Compare", "contact.html":"Contact" }
    }
  },
  he: {
    dir: "rtl",
    htmlLang: "he",
    selectors: {
      ".top-back-link": "חזרה ל-AILOVEU →",
      ".eyebrow": "יוצר אתר שלם בשבילכם!",
      ".page-header h1": "בנה לי אתר!",
      ".page-header p:last-child": "ממלאים כמה פרטים ומורידים קובץ ZIP עם אתר סטטי מעוצב ומוכן לעריכה.",
      "#business-label": "פרטי העסק",
      "label[for='biz-name']": "שם העסק <span class='required'>*</span>",
      "label[for='site-language']": "שפת האתר",
      "label[for='logo-input']": "לוגו או אייקון",
      ".logo-color-label": "צבעים שחולצו",
      "label[for='biz-industry']": "תחום פעילות <span class='required'>*</span>",
      "label[for='brand-voice']": "סגנון כתיבה",
      "label[for='website-type']": "סוג אתר",
      "label[for='site-domain']": "כתובת דומיין <span class='optional'>אופציונלי</span>",
      "#contact-details-label": "פרטי יצירת קשר",
      "label[for='biz-email']": "אימייל",
      "label[for='biz-phone']": "טלפון",
      "label[for='biz-area']": "עיר / אזור שירות",
      "label[for='biz-address']": "כתובת",
      "label[for='biz-hours']": "שעות פעילות",
      "#cta-goals-label": "מטרות, כותרות וקריאה לפעולה",
      "label[for='main-headline']": "כותרת ראשית <span class='optional'>אופציונלי</span>",
      "label[for='biz-tagline']": "סלוגן <span class='muted-label'>אופציונלי</span>",
      "label[for='about-text']": "טקסט אודות <span class='optional'>אופציונלי</span>",
      "label[for='website-goal']": "מטרת האתר המרכזית",
      "label[for='primary-cta']": "קריאה ראשית לפעולה",
      "label[for='custom-cta-url']": "קישור CTA מותאם <span class='optional'>אופציונלי</span>",
      "label[for='product-payment-url']": "קישור מוצר / תשלום <span class='optional'>אופציונלי</span>",
      "#social-links-card summary": "קישורים חברתיים",
      "#social-links-card .card-help": "אופציונלי. הוסיפו רק פרופילים שתרצו להציג בפוטר ובעמוד יצירת הקשר.",
      "label[for='social-instagram']": "אינסטגרם",
      "label[for='social-linkedin']": "לינקדאין",
      "label[for='social-facebook']": "פייסבוק",
      "label[for='social-tiktok']": "טיקטוק",
      "label[for='social-youtube']": "יוטיוב",
      "#integrations-card summary": "תוספי אנליטיקה",
      "#integrations-card .card-help": "אופציונלי. מוסיף קטעי קוד מסומנים וברורים ל-head של האתר שנוצר.",
      "label[for='ga-id']": "מזהה Google Analytics",
      "label[for='meta-pixel-id']": "מזהה Meta Pixel",
      "#brand-label": "עיצוב וצבעים",
      "#tab-manual": "הזנת צבעים",
      "#tab-presets": "פלטות מוכנות",
      "label[for='col1']": "ראשי",
      "label[for='col2']": "משני",
      "label[for='col3']": "הדגשה",
      "#style-label": "מנוע סגנון האתר",
      "label[for='design-style']": "סגנון עיצוב",
      "label[for='trust-style']": "סגנון אמון",
      "label[for='image-personality']": "אופי תמונות",
      "#features-label": "אפשרויות האתר שייווצר",
      "label[for='form-mode']": "התנהגות טופס יצירת קשר",
      "#alert-success": "הקבצים מוכנים - ההורדה אמורה להתחיל אוטומטית.",
      "#quality-label": "ציון מוכנות האתר",
      "#quality-score": "עדיין לא נוצר",
      "#quality-summary": "צרו אתר כדי לראות את רשימת ההשקה.",
      "#generation-card .section-label": "התקדמות הבנייה",
      "#preview-label": "תצוגה מקדימה חיה",
      "#preview-card .card-help": "צפו באתר לפני ההורדה. צרו גרסה נוספת כדי לראות כיוון ויזואלי אחר.",
      "#regen-btn": "↻ צור גרסה נוספת",
      "label[for='preview-page-select']": "עמוד לתצוגה",
      ".device-btn[data-device='desktop']": "דסקטופ",
      ".device-btn[data-device='tablet']": "טאבלט",
      ".device-btn[data-device='mobile']": "מובייל",
      "#preview-btn": "תצוגה מקדימה",
      "#gen-btn": "<span aria-hidden='true'>⬇</span> יצירת והורדת ZIP לאתר",
      ".footer-note": "יוצר: אתר סטטי, תמונות Picsum, מצב כהה, עמוד השוואה, Schema, קיט השקה, sitemap, robots, manifest ו-README.",
      ".app-footer": "מאת <a href='https://ailoveu.art' target='_blank' rel='noopener'>AILOVEU</a> ו-<a href='https://il.linkedin.com/in/hagaytech' target='_blank' rel='noopener'>Hagay</a>"
    },
    checks: ["הוסף Google Analytics", "הוסף Meta Pixel"],
    featureChecks: ["הוסף faq.html", "הוסף pricing.html", "הוסף blog.html", "הוסף thank-you.html", "הוסף 404.html"],
    generationSteps: ["קורא את פרטי העסק", "בוחר מבנה וכיוון תמונות", "בונה עמודים ונתוני עסק מקומי", "מוסיף SEO, Schema, Sitemap ונכסים", "אורז את קובץ ה-ZIP"],
    qualityItems: ["מבנה לפי מטרה", "אסטרטגיית CTA", "סגנון כתיבה", "קבצי SEO", "מתג מצב כהה", "נתוני Schema.org", "קיט השקה"],
    placeholders: {
      "biz-name": "לדוגמה: Bright Studio", "site-domain": "https://yourdomain.com", "biz-email": "hello@yourbusiness.com", "biz-phone": "+972 50-000-0000", "biz-area": "לדוגמה: תל אביב או שירות אונליין", "biz-address": "רחוב ראשי 123, עיר", "biz-hours": "א׳-ה׳, 9:00-18:00", "main-headline": "לדוגמה: אתרים שמוכרים בזמן שאתם ישנים", "biz-tagline": "לדוגמה: בונים מחר טוב יותר", "about-text": "ספרו למבקרים מי אתם, למי אתם עוזרים ומה מייחד את הגישה שלכם.", "custom-cta-url": "https://calendly.com/your-link", "product-payment-url": "https://your-store.com/product-or-payment", "social-instagram": "https://instagram.com/yourbrand", "social-linkedin": "https://linkedin.com/company/yourbrand", "social-facebook": "https://facebook.com/yourbrand", "social-tiktok": "https://tiktok.com/@yourbrand", "social-youtube": "https://youtube.com/@yourbrand", "ga-id": "G-XXXXXXXXXX", "meta-pixel-id": "1234567890"
    },
    options: {
      "site-language": { en:"אנגלית", he:"עברית" },
      "biz-industry": { "":"בחרו תחום", technology:"טכנולוגיה / תוכנה", healthcare:"בריאות / רפואה", finance:"פיננסים / משפטים", retail:"קמעונאות / מסחר", food:"אוכל ומשקאות", education:"חינוך / הכשרה", creative:"קריאייטיב / עיצוב / מדיה", realestate:"נדל״ן", hospitality:"אירוח / תיירות", fitness:"כושר / וולנס", ngo:"עמותה / ארגון חברתי", construction:"בנייה / ייצור", other:"אחר" },
      "brand-voice": { professional:"מקצועי", friendly:"ידידותי", bold:"נועז", luxury:"יוקרתי", playful:"שובב", technical:"טכני", calm:"רגוע" },
      "website-type": { full:"אתר מלא", onepage:"עמוד אחד" },
      "website-goal": { leads:"קבלת לידים", bookings:"קביעת פגישות", credibility:"בניית אמון", portfolio:"הצגת פורטפוליו", sales:"מכירת מוצרים או חבילות", donations:"איסוף תרומות", event:"קידום אירוע", hiring:"גיוס עובדים" },
      "primary-cta": { auto:"בחירה אוטומטית לפי המטרה", "Book a call":"קביעת שיחה", "Get a quote":"קבלת הצעת מחיר", "Start free":"להתחיל בחינם", "Reserve now":"להזמין עכשיו", "Join now":"להצטרף עכשיו", "Donate now":"לתרום עכשיו", "View portfolio":"צפייה בפורטפוליו", "Shop now":"לקנייה", "Apply now":"להגשת מועמדות" },
      "design-style": { auto:"בחירה אוטומטית לפי העסק", modern:"מודרני ונקי", bold:"סטארטאפ נועז", luxury:"יוקרתי / מגזיני", friendly:"עסק מקומי ידידותי", creative:"סטודיו קריאייטיב", wellness:"וולנס רגוע", corporate:"מקצועי / תאגידי" },
      "trust-style": { auto:"אקראי / אוטומטי", logos:"רצועת לוגואים", customers:"250+ לקוחות", stars:"דירוג כוכבים", certifications:"הסמכות", experience:"שנות ניסיון", counters:"מספרים חזקים", reviews:"כרטיסי ביקורות" },
      "image-personality": { auto:"אוטומטי לפי תחום", abstract:"אבסטרקטי", people:"אנשים", nature:"טבע", architecture:"אדריכלות", workspaces:"סביבת עבודה", food:"אוכל" },
      "form-mode": { netlify:"טופס מותאם Netlify + עמוד תודה", mailto:"פתיחה באימייל", static:"טופס דמו סטטי" },
      "preview-page-select": { "index.html":"בית", "about.html":"אודות", "services.html":"שירותים", "pricing.html":"מחירים", "faq.html":"שאלות נפוצות", "blog.html":"בלוג", "compare.html":"השוואה", "contact.html":"יצירת קשר" }
    }
  }
};
function setText(selector, html) {
  document.querySelectorAll(selector).forEach(el => { el.innerHTML = html; });
}
function setOptions(selectId, options) {
  const select = $(selectId);
  if (!select) return;
  Array.from(select.options).forEach(opt => {
    if (Object.prototype.hasOwnProperty.call(options, opt.value)) opt.textContent = options[opt.value];
  });
}
function setPlaceholders(placeholders) {
  Object.entries(placeholders).forEach(([id, text]) => { const el = $(id); if (el) el.placeholder = text; });
}
function setListText(selector, items) {
  const nodes = Array.from(document.querySelectorAll(selector));
  nodes.forEach((node, index) => { if (items[index]) node.textContent = items[index]; });
}
function setCheckboxLabels(selector, items) {
  const labels = Array.from(document.querySelectorAll(selector));
  labels.forEach((label, index) => {
    const input = label.querySelector("input");
    if (input && items[index]) label.replaceChildren(input, document.createTextNode(" " + items[index]));
  });
}
function applyUiLanguage(lang = "en") {
  uiLanguage = lang === "he" ? "he" : "en";
  const copy = UI_COPY[uiLanguage];
  document.documentElement.lang = copy.htmlLang;
  document.documentElement.dir = copy.dir;
  document.body.classList.toggle("ui-rtl", uiLanguage === "he");
  document.title = uiLanguage === "he" ? "בנה לי אתר!" : "Make me a website!";
  const topBack = document.querySelector(".top-back-link");
  if (topBack) topBack.setAttribute("aria-label", uiLanguage === "he" ? "חזרה ל-AILOVEU" : "Back to AILOVEU");
  Object.entries(copy.selectors).forEach(([selector, html]) => setText(selector, html));
  setPlaceholders(copy.placeholders);
  Object.entries(copy.options).forEach(([id, opts]) => setOptions(id, opts));
  setListText("#generation-steps li", copy.generationSteps);
  setListText("#quality-list li", copy.qualityItems);
  const deviceToggle = document.querySelector(".device-toggle");
  if (deviceToggle) deviceToggle.setAttribute("aria-label", uiLanguage === "he" ? "גודל תצוגה" : "Preview size");
  setCheckboxLabels(".checks label", copy.featureChecks);
  setCheckboxLabels("#integrations-card .check-line", copy.checks);
  document.querySelectorAll(".ui-lang-btn").forEach(btn => {
    const active = btn.dataset.uiLang === uiLanguage;
    btn.classList.toggle("active", active);
    btn.setAttribute("aria-pressed", String(active));
  });
  try { localStorage.setItem(UI_LANG_KEY, uiLanguage); } catch (e) { /* ignore */ }
}
function bindUiLanguageSwitch() {
  try { uiLanguage = localStorage.getItem(UI_LANG_KEY) || "en"; } catch (e) { uiLanguage = "en"; }
  applyUiLanguage(uiLanguage);
  document.querySelectorAll(".ui-lang-btn").forEach(btn => {
    btn.addEventListener("click", () => applyUiLanguage(btn.dataset.uiLang));
  });
}


document.addEventListener("DOMContentLoaded", () => {
  restoreSettings();
  bindUiLanguageSwitch();
  buildPresetGrid();
  bindTabs();
  applyColorTabUI();
  bindColorInputs();
  bindValidation();
  bindSettingsPersistence();
  bindLogoInput();
  bindPreviewControls();
  bindAutoPreview();
  updatePreviewPageOptions();
  $("preview-page-select")?.addEventListener("change", () => renderPreview(false, false));
  $("gen-btn").addEventListener("click", generateSite);
  $("preview-btn")?.addEventListener("click", () => renderPreview(true));
  $("regen-btn")?.addEventListener("click", regenerateVersion);
});

function regenerateVersion() {
  variationIndex += 1;
  variationSeed = Math.floor(Math.random() * 100000);
  renderPreview(true);
}

function variantSlot(count, offset = 0) {
  return Math.abs((variationSeed + variationIndex * 97 + offset) % count);
}

function bindLogoInput() {
  const input = $("logo-input");
  const wrap = $("logo-preview-wrap");
  const img = $("logo-preview");
  const name = $("logo-file-name");
  if (!input) return;
  input.addEventListener("change", async () => {
    const file = input.files?.[0];
    if (logoPreviewUrl) URL.revokeObjectURL(logoPreviewUrl);
    logoPreviewUrl = null;
    uploadedLogoFile = null;
    logoExtractedColors = null;
    logoColorsActive = false;
    updateLogoColorSwatches(null);
    if (!file) { if (wrap) wrap.hidden = true; return; }
    const ok = ["image/png", "image/jpeg", "image/svg+xml", "image/webp"].includes(file.type);
    if (!ok) { input.value = ""; if (wrap) wrap.hidden = true; showError("Please upload a PNG, JPG, SVG, or WebP logo."); return; }
    uploadedLogoFile = file;
    logoPreviewUrl = URL.createObjectURL(file);
    if (img) img.src = logoPreviewUrl;
    if (name) name.textContent = file.name;
    if (wrap) wrap.hidden = false;
    try {
      const extracted = await extractLogoColors(file);
      if (extracted?.length === 3) {
        logoExtractedColors = extracted;
        logoColorsActive = true;
        updateLogoColorSwatches(extracted);
        syncManualColors(extracted);
      }
    } catch (e) {
      logoExtractedColors = null;
      logoColorsActive = false;
      updateLogoColorSwatches(null);
    }
    clearAlerts();
    saveSettings();
    const card = $("preview-card");
    if (card && !card.hidden) renderPreview(false, false);
  });
}

function updateLogoColorSwatches(colors) {
  const box = $("logo-color-swatches");
  if (!box) return;
  box.hidden = !(colors && colors.length === 3);
  if (!colors || colors.length !== 3) return;
  colors.forEach((color, index) => {
    const dot = $(`logo-color-${index + 1}`);
    if (dot) {
      dot.style.background = color;
      dot.title = color;
      dot.setAttribute("aria-label", color);
    }
  });
}

function syncManualColors(colors) {
  [["col1","hex1"],["col2","hex2"],["col3","hex3"]].forEach(([colorId, hexId], index) => {
    const color = $(colorId);
    const hex = $(hexId);
    if (color && hex && colors[index]) {
      color.value = colors[index];
      hex.value = colors[index];
      validateField(hex, false);
    }
  });
}

function extractLogoColors(file) {
  return new Promise((resolve, reject) => {
    if (file.type === "image/svg+xml") {
      const reader = new FileReader();
      reader.onload = () => extractSvgColors(String(reader.result || ""), resolve, reject);
      reader.onerror = reject;
      reader.readAsText(file);
      return;
    }
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      try {
        const colors = extractImageElementColors(img);
        URL.revokeObjectURL(url);
        resolve(colors);
      } catch (e) {
        URL.revokeObjectURL(url);
        reject(e);
      }
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Could not read logo colors")); };
    img.src = url;
  });
}

function extractSvgColors(svgText, resolve, reject) {
  const matches = svgText.match(/#[0-9a-fA-F]{3,8}|rgba?\([^\)]+\)/g) || [];
  const scored = new Map();
  matches.map(normalizeCssColor).filter(Boolean).forEach(color => {
    const rgb = hexToRgbArr(color);
    if (!isUsefulLogoRgb(rgb[0], rgb[1], rgb[2], 255)) return;
    scored.set(color, (scored.get(color) || 0) + colorScore(rgb[0], rgb[1], rgb[2]));
  });
  const colors = Array.from(scored.entries()).sort((a,b) => b[1] - a[1]).map(([c]) => c);
  const picked = pickDistinctHexColors(colors);
  if (picked.length === 3) resolve(picked); else reject(new Error("Not enough SVG colors"));
}

function normalizeCssColor(value) {
  value = value.trim();
  if (value.startsWith("#")) {
    let hex = value.slice(1);
    if (hex.length === 3) hex = hex.split("").map(ch => ch + ch).join("");
    if (hex.length >= 6) return "#" + hex.slice(0, 6).toLowerCase();
  }
  const nums = value.match(/[\d.]+/g)?.map(Number) || [];
  if (nums.length >= 3) return rgbToHexArr(nums.slice(0, 3));
  return null;
}

function extractImageElementColors(img) {
  const canvas = document.createElement("canvas");
  const size = 96;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, size, size);
  const data = ctx.getImageData(0, 0, size, size).data;
  const buckets = new Map();
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
    if (!isUsefulLogoRgb(r, g, b, a)) continue;
    const key = [Math.round(r / 24) * 24, Math.round(g / 24) * 24, Math.round(b / 24) * 24].map(v => clamp(v)).join(",");
    const score = colorScore(r, g, b);
    const current = buckets.get(key) || { count: 0, score: 0, r: 0, g: 0, b: 0 };
    current.count += 1;
    current.score += score;
    current.r += r;
    current.g += g;
    current.b += b;
    buckets.set(key, current);
  }
  const ranked = Array.from(buckets.values())
    .map(item => ({ hex: rgbToHexArr([item.r / item.count, item.g / item.count, item.b / item.count]), score: item.score * Math.log(item.count + 2) }))
    .sort((a, b) => b.score - a.score)
    .map(item => item.hex);
  return pickDistinctHexColors(ranked);
}

function isUsefulLogoRgb(r, g, b, a) {
  if (a < 80) return false;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const saturation = max - min;
  const brightness = (r + g + b) / 3;
  if (brightness > 246) return false;
  if (brightness < 10) return false;
  if (saturation < 14 && brightness > 36 && brightness < 220) return false;
  return true;
}

function colorScore(r, g, b) {
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const saturation = max - min;
  const brightness = (r + g + b) / 3;
  const vivid = 1 + saturation / 128;
  const balanced = 1 - Math.abs(brightness - 128) / 220;
  return Math.max(.2, vivid + balanced);
}

function pickDistinctHexColors(colors) {
  const picked = [];
  for (const color of colors) {
    const rgb = hexToRgbArr(color);
    const tooClose = picked.some(existing => {
      const other = hexToRgbArr(existing);
      return Math.abs(rgb[0] - other[0]) + Math.abs(rgb[1] - other[1]) + Math.abs(rgb[2] - other[2]) < 90;
    });
    if (!tooClose) picked.push(color);
    if (picked.length === 3) break;
  }
  return picked.length === 3 ? picked : null;
}

function logoExtension(file) {
  const fromType = { "image/png": "png", "image/jpeg": "jpg", "image/svg+xml": "svg", "image/webp": "webp" }[file.type];
  if (fromType) return fromType;
  const match = file.name.toLowerCase().match(/\.([a-z0-9]+)$/);
  return match ? match[1] : "png";
}

function logoAsset(file) {
  if (!file) return null;
  const ext = logoExtension(file);
  const mime = file.type || (ext === "svg" ? "image/svg+xml" : ext === "webp" ? "image/webp" : ext === "jpg" || ext === "jpeg" ? "image/jpeg" : "image/png");
  return { filename: `logo.${ext}`, path: `assets/img/logo.${ext}`, mime };
}

function localDetails(biz) {
  const fallbackEmail = `hello@${emailSlug(biz)}.com`;
  return {
    email: valueOf("biz-email").trim() || fallbackEmail,
    phone: valueOf("biz-phone").trim() || "+1 (555) 000-0000",
    area: valueOf("biz-area").trim() || "Your service area",
    address: valueOf("biz-address").trim() || "123 Main Street, Your City",
    hours: valueOf("biz-hours").trim() || "Mon-Fri, 9:00-18:00"
  };
}

function bindPreviewControls() {
  document.querySelectorAll("[data-device]").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("[data-device]").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const shell = $("preview-shell");
      if (shell) shell.className = `preview-shell ${btn.dataset.device}`;
    });
  });
}

let autoPreviewTimer = null;
function bindAutoPreview() {
  const handler = () => {
    saveSettings();
    updatePreviewPageOptions();
    const card = $("preview-card");
    if (!card || card.hidden) return;
    clearTimeout(autoPreviewTimer);
    autoPreviewTimer = setTimeout(() => renderPreview(false, false), 350);
  };
  persistableFields().forEach(el => {
    el.addEventListener("input", handler);
    el.addEventListener("change", handler);
  });
}

function availablePreviewPages(ctx) {
  if (ctx.siteType === "onepage") return [["index.html", "Home"]];
  return [
    ["index.html", "Home"],
    ["about.html", "About"],
    ["services.html", "Services"],
    ctx.options?.pricing && ["pricing.html", "Pricing"],
    ctx.options?.faq && ["faq.html", "FAQ"],
    ctx.options?.blog && ["blog.html", "Blog"],
    ["compare.html", "Compare"],
    ["contact.html", "Contact"]
  ].filter(Boolean);
}

function updatePreviewPageOptions() {
  const select = $("preview-page-select");
  if (!select) return;
  const ctx = validContextFromForm(false);
  const pages = ctx ? availablePreviewPages(ctx) : [["index.html", "Home"]];
  const current = select.value;
  select.innerHTML = pages.map(([value, label]) => `<option value="${value}">${label}</option>`).join("");
  select.value = pages.some(([value]) => value === current) ? current : pages[0][0];
}

function validContextFromForm(showMessages = true) {
  const biz = valueOf("biz-name").trim();
  const industry = valueOf("biz-industry");
  const tagline = valueOf("biz-tagline").trim();
  if (!biz) { if (showMessages) showError("Please enter a business name."); return null; }
  if (!industry) { if (showMessages) showError("Please select an industry."); return null; }
  const emailField = $("biz-email");
  if (emailField && !validateField(emailField, true)) { if (showMessages) showError("Please enter a valid email address, or leave the email field empty."); return null; }
  const colors = getColors();
  if (!colors) { if (showMessages) showError(activeTab === "presets" ? "Please select a color preset." : "Please enter valid hex colors for all three colors."); return null; }
  return buildContext(biz, industry, tagline, colors);
}

function previewPage(ctx) {
  const previewCtx = { ...ctx, preview: true, logo: ctx.logo ? { ...ctx.logo, previewSrc: logoPreviewUrl } : null };
  const requested = valueOf("preview-page-select", "index.html");
  const pages = Object.fromEntries(generatedPages(previewCtx));
  const html = pages[requested] || pages["index.html"] || onePage(previewCtx);
  return html.replace(`<link rel="stylesheet" href="assets/css/style.css">`, `<style>${siteCSS(previewCtx)}</style>`)
    .replace(`<script src="assets/js/main.js" defer></script>`, `<script>${siteJS()}<\/script>`)
    .replace(/<link rel="manifest" href="[^"]+">/, "");
}

async function renderPreview(withSteps = false, showMessages = true) {
  clearAlerts();
  const ctx = validContextFromForm(showMessages);
  if (!ctx) return;
  updatePreviewPageOptions();
  if (withSteps) await runGenerationSteps(false);
  const card = $("preview-card");
  if (card) card.hidden = false;
  const iframe = $("site-preview");
  if (iframe) iframe.srcdoc = previewPage(ctx);
}

function delay(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

async function runGenerationSteps(includeZipStep = true) {
  const card = $("generation-card");
  const items = Array.from(document.querySelectorAll("#generation-steps li"));
  if (!card || !items.length) return;
  card.hidden = false;
  items.forEach(li => li.classList.remove("active", "done"));
  const total = includeZipStep ? items.length : items.length - 1;
  for (let i = 0; i < total; i++) {
    items[i].classList.add("active");
    await delay(170);
    items[i].classList.remove("active");
    items[i].classList.add("done");
  }
}

function buildPresetGrid() {
  const grid = $("preset-grid");
  PALETTES.forEach((p, index) => {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "preset-opt" + (index === selectedPresetIndex ? " selected" : "");
    item.setAttribute("aria-label", p.name);
    item.title = p.name;
    item.innerHTML = `<div class="preset-swatches">${p.colors.map(c => `<span style="background:${c}"></span>`).join("")}</div>`;
    item.addEventListener("click", () => {
      document.querySelectorAll(".preset-opt").forEach(el => el.classList.remove("selected"));
      item.classList.add("selected");
      selectedPreset = p.colors;
      selectedPresetIndex = index;
      logoColorsActive = false;
      saveSettings();
      clearAlerts();
    });
    grid.appendChild(item);
  });
}
function applyColorTabUI() {
  document.querySelectorAll(".tab-btn").forEach(btn => {
    const isActive = btn.dataset.tab === activeTab;
    btn.classList.toggle("active", isActive);
    btn.setAttribute("aria-selected", isActive ? "true" : "false");
  });
  $("panel-manual").hidden = activeTab !== "manual";
  $("panel-presets").hidden = activeTab !== "presets";
}
function bindTabs() {
  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      activeTab = btn.dataset.tab;
      logoColorsActive = false;
      applyColorTabUI();
      saveSettings();
      clearAlerts();
    });
  });
}
function bindColorInputs() {
  [["col1","hex1"],["col2","hex2"],["col3","hex3"]].forEach(([colorId, hexId]) => {
    const color = $(colorId);
    const hex = $(hexId);
    color.addEventListener("input", () => { logoColorsActive = false; hex.value = color.value; validateField(hex, false); saveSettings(); });
    hex.addEventListener("input", () => { logoColorsActive = false; if (/^#[0-9a-fA-F]{6}$/.test(hex.value)) color.value = hex.value; validateField(hex, false); });
  });
}
function isValidEmailValue(value) { return !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value); }
function isValidHexValue(value) { return /^#[0-9a-fA-F]{6}$/.test(value); }
function validateField(el, showEmpty = false) {
  if (!el) return true;
  const value = el.value.trim();
  let valid = true;
  if (el.type === "email") valid = isValidEmailValue(value);
  if (el.classList.contains("hex-input")) valid = (!showEmpty && value === "") || isValidHexValue(value);
  el.classList.toggle("is-invalid", !valid);
  el.setAttribute("aria-invalid", valid ? "false" : "true");
  return valid;
}
function bindValidation() {
  document.querySelectorAll('input[type="email"], .hex-input').forEach(el => {
    el.addEventListener("blur", () => validateField(el, true));
    el.addEventListener("input", () => validateField(el, false));
  });
}
function showError(msg) { const el = $("alert-error"); el.textContent = msg; el.classList.add("visible"); $("alert-success").classList.remove("visible"); }
function showSuccess() { $("alert-success").classList.add("visible"); $("alert-error").classList.remove("visible"); }
function clearAlerts() { $("alert-error").classList.remove("visible"); $("alert-success").classList.remove("visible"); }
function getBaseColors() {
  if (logoColorsActive && logoExtractedColors?.length === 3) return ["#ffffff", ...logoExtractedColors];
  if (activeTab === "presets") return selectedPreset;
  const hexEls = ["hex1", "hex2", "hex3"].map(id => $(id));
  hexEls.forEach(el => validateField(el, true));
  const colors = hexEls.map(el => el.value.trim());
  return colors.every(v => /^#[0-9a-fA-F]{6}$/.test(v)) ? ["#ffffff", ...colors] : null;
}
function getColors() {
  const base = getBaseColors();
  return base ? colorVariation(base) : null;
}
function clamp(n, min = 0, max = 255) { return Math.max(min, Math.min(max, Math.round(n))); }
function hexToRgbArr(hex) { return [parseInt(hex.slice(1,3),16), parseInt(hex.slice(3,5),16), parseInt(hex.slice(5,7),16)]; }
function rgbToHexArr(rgb) { return "#" + rgb.map(v => clamp(v).toString(16).padStart(2,"0")).join(""); }
function mixHex(a, b, amount = .5) {
  const ar = hexToRgbArr(a), br = hexToRgbArr(b);
  return rgbToHexArr(ar.map((v, i) => v * (1 - amount) + br[i] * amount));
}
function adjustHex(hex, percent = 0) {
  const rgb = hexToRgbArr(hex);
  const target = percent >= 0 ? 255 : 0;
  const amount = Math.abs(percent) / 100;
  return rgbToHexArr(rgb.map(v => v * (1 - amount) + target * amount));
}
function colorVariation(colors) {
  const normalized = colors.length >= 4 ? colors.slice(0, 4) : ["#ffffff", ...colors.slice(0, 3)];
  const [bg, primary, secondary, accent] = normalized;
  switch (variantSlot(4, 23)) {
    case 1:
      return [bg, adjustHex(primary, -8), mixHex(secondary, accent, .18), adjustHex(accent, 8)];
    case 2:
      return [bg, adjustHex(secondary, -12), mixHex(primary, secondary, .22), adjustHex(accent, -6)];
    case 3:
      return [bg, mixHex(primary, secondary, .28), adjustHex(secondary, 10), mixHex(accent, primary, .12)];
    default:
      return normalized;
  }
}

function tech(s) { return `<span class="tech-value" dir="ltr">${esc(s)}</span>`; }

function esc(s) { return String(s ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;"); }
function textToParagraphs(s) {
  return String(s || "").split(/\n{2,}/).map(p => p.trim()).filter(Boolean).map(p => `<p>${esc(p).replace(/\n/g,"<br>")}</p>`).join("");
}
function slugify(s) { return String(s || "site").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"") || "site"; }
function emailSlug(s) { return slugify(s).replace(/-/g, ""); }
function normalizeDomainUrl(raw) {
  const value = String(raw || "").trim();
  if (!value) return "https://example.com";
  const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  try {
    const url = new URL(withProtocol);
    return `${url.protocol}//${url.host}${url.pathname.replace(/\/$/, "")}`;
  } catch (e) {
    return "https://example.com";
  }
}

function normalizeOptionalUrl(raw) {
  const value = String(raw || "").trim();
  if (!value) return "";
  const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  try {
    return new URL(withProtocol).href.replace(/\/$/, "");
  } catch (e) {
    return "";
  }
}

function socialDetails() {
  const items = [
    ["instagram", "Instagram"],
    ["linkedin", "LinkedIn"],
    ["facebook", "Facebook"],
    ["tiktok", "TikTok"],
    ["youtube", "YouTube"]
  ];
  return items
    .map(([key, label]) => ({ label, url: normalizeOptionalUrl(valueOf(`social-${key}`)) }))
    .filter(item => item.url);
}

function analyticsOptions() {
  return {
    googleAnalytics: checked("analytics-ga"),
    googleAnalyticsId: valueOf("ga-id").trim(),
    metaPixel: checked("analytics-meta"),
    metaPixelId: valueOf("meta-pixel-id").trim()
  };
}

function absoluteUrl(ctx, path = "index.html") {
  const clean = path === "index.html" ? "" : String(path || "").replace(/^\/+/, "");
  return `${ctx.siteUrl || "https://example.com"}/${clean}`;
}
function pick(map, key, fallback = "other") { return map[key] || map[fallback]; }
function chooseStyle(industry, selected) {
  if (selected && selected !== "auto") return selected;
  const base = AUTO_STYLE_BY_INDUSTRY[industry] || "modern";
  const pool = Array.from(new Set([base, "modern", "bold", "creative", "friendly", "corporate"]));
  return pool[variantSlot(pool.length, 11)];
}
function chooseLayout(industry, selected) {
  if (selected && selected !== "auto") return selected;
  const base = AUTO_LAYOUT_BY_INDUSTRY[industry] || "classic";
  const options = Array.from(new Set([base, "impact", "showcase"]));
  return options[variantSlot(options.length, String(industry || "").length)];
}
function chooseImagePersonality(industry, selected) { return selected && selected !== "auto" ? selected : AUTO_IMAGE_BY_INDUSTRY[industry] || "abstract"; }
function chooseTrust(selected) { return selected && selected !== "auto" ? selected : TRUST_STYLES[variantSlot(TRUST_STYLES.length, 37)]; }
function chooseCTA(goal, selected) { return selected && selected !== "auto" ? selected : (GOALS[goal] || GOALS.leads).cta; }
function luminance(hex) { const rgb = [1,3,5].map(i => parseInt(hex.slice(i,i+2),16) / 255).map(v => v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4)); return .2126 * rgb[0] + .7152 * rgb[1] + .0722 * rgb[2]; }
function textColor(bg) { return luminance(bg) > .32 ? "#111827" : "#ffffff"; }
function imageUrl(w, h, label, ctx = null) {
  const mood = ctx?.imagePersonality ? `${ctx.imagePersonality}-${IMAGE_PERSONALITIES[ctx.imagePersonality] || ""}` : "demo";
  return `https://picsum.photos/seed/${encodeURIComponent(mood + '-' + label + '-' + variationSeed + '-v' + variationIndex)}/${w}/${h}`;
}
function updateQualityScore(ctx) {
  const items = Array.from(document.querySelectorAll("#quality-list li"));
  items.forEach(li => li.classList.add("done"));
  $("quality-score").textContent = "96 / 100";
  $("quality-summary").textContent = `${ctx.goal.name}, ${ctx.cta} CTA, ${ctx.voiceKey} voice, ${ctx.styleKey} style.`;
}



const HEBREW_SITE_FONTS = [
  { name: "Heebo", cssFamily: "Heebo", cssUrl: "https://fonts.googleapis.com/css2?family=Heebo:wght@400;500;600;700;800;900&display=swap", stack: "'Heebo', 'Rubik', 'Noto Sans Hebrew', Arial, sans-serif" },
  { name: "Inter", cssFamily: "Inter", cssUrl: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap", stack: "'Inter', 'Heebo', 'Rubik', 'Noto Sans Hebrew', Arial, sans-serif" },
  { name: "Rubik", cssFamily: "Rubik", cssUrl: "https://fonts.googleapis.com/css2?family=Rubik:wght@400;500;600;700;800;900&display=swap", stack: "'Rubik', 'Heebo', 'Noto Sans Hebrew', Arial, sans-serif" },
  { name: "Alef", cssFamily: "Alef", cssUrl: "https://fonts.googleapis.com/css2?family=Alef:wght@400;700&display=swap", stack: "'Alef', 'Rubik', 'Noto Sans Hebrew', Arial, sans-serif" },
  { name: "Noto Sans Hebrew", cssFamily: "Noto Sans Hebrew", cssUrl: "https://fonts.googleapis.com/css2?family=Noto+Sans+Hebrew:wght@400;500;600;700;800;900&display=swap", stack: "'Noto Sans Hebrew', 'Rubik', 'Heebo', Arial, sans-serif" },
  { name: "Varela Round", cssFamily: "Varela Round", cssUrl: "https://fonts.googleapis.com/css2?family=Varela+Round&display=swap", stack: "'Varela Round', 'Rubik', 'Heebo', Arial, sans-serif" }
];
function chooseHebrewSiteFont(industry) {
  return HEBREW_SITE_FONTS[variantSlot(HEBREW_SITE_FONTS.length, String(industry || "").length + 71)];
}
function generatedFontLinks(ctx) {
  if (ctx.lang !== "he" || !ctx.hebrewFont) return "";
  return `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="${ctx.hebrewFont.cssUrl}" rel="stylesheet">`;
}

function analyticsSnippets(ctx) {
  const ga = ctx.analytics?.googleAnalytics ? `
<!-- Google Analytics placeholder. Replace with your real ID before launch. -->
<script async src="https://www.googletagmanager.com/gtag/js?id=${esc(ctx.analytics.googleAnalyticsId || "G-XXXXXXXXXX")}"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${esc(ctx.analytics.googleAnalyticsId || "G-XXXXXXXXXX")}');<\/script>` : "";
  const meta = ctx.analytics?.metaPixel ? `
<!-- Meta Pixel placeholder. Replace with your real Pixel ID before launch. -->
<script>!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${esc(ctx.analytics.metaPixelId || "YOUR_PIXEL_ID")}');fbq('track','PageView');<\/script>` : "";
  return ga + meta;
}
function meta(ctx, title, description, prefix = "") {
  const faviconHref = ctx.logo ? prefix + ctx.logo.path : prefix + "assets/img/favicon.svg";
  const ogImage = absoluteUrl(ctx, "assets/img/og-image.svg");
  return `<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><meta name="description" content="${esc(description)}"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:type" content="website"><meta property="og:url" content="${ctx.siteUrl}/"><meta property="og:image" content="${ogImage}"><link rel="canonical" href="${ctx.siteUrl}/"><link rel="icon" href="${faviconHref}"><link rel="apple-touch-icon" href="${faviconHref}"><link rel="manifest" href="${prefix}site.webmanifest">${generatedFontLinks(ctx)}<link rel="stylesheet" href="${prefix}assets/css/style.css"><script type="application/ld+json">${schema(ctx)}</script>${analyticsSnippets(ctx)}<script src="${prefix}assets/js/main.js" defer></script><title>${esc(title)}</title>`;
}
function schema(ctx) {
  const schemaImage = ctx.logo ? absoluteUrl(ctx, ctx.logo.path) : absoluteUrl(ctx, "assets/img/og-image.svg");
  const data = { "@context":"https://schema.org", "@type": ctx.data.type || "Organization", name: ctx.biz, url: ctx.siteUrl + "/", description: ctx.tagline || ctx.data.sub, email: ctx.local.email, telephone: ctx.local.phone, areaServed: ctx.local.area, openingHours: ctx.local.hours, image: schemaImage };
  if (ctx.socials?.length) data.sameAs = ctx.socials.map(s => s.url);
  if (["Restaurant","Hotel","LocalBusiness","FitnessCenter","Store","RealEstateAgent","MedicalBusiness"].includes(data["@type"])) data.address = { "@type":"PostalAddress", streetAddress: ctx.local.address, addressLocality: ctx.local.area };
  return JSON.stringify(data).replace(/</g,"\\u003c");
}
function nav(ctx, prefix = "") {
  const one = ctx.siteType === "onepage";
  const oneHref = (anchor) => prefix ? `${prefix}index.html${anchor}` : anchor;
  const links = one
    ? [[oneHref("#services"), txt(ctx,"services")], [oneHref("#pricing"), txt(ctx,"pricing")], [oneHref("#compare"), txt(ctx,"compare")], [oneHref("#faq"), txt(ctx,"faq")], [oneHref("#contact"), txt(ctx,"contact")]]
    : [
        ["about.html", txt(ctx,"about")],
        ["services.html", txt(ctx,"services")],
        ctx.options?.pricing && ["pricing.html", txt(ctx,"pricing")],
        ctx.options?.faq && ["faq.html", txt(ctx,"faq")],
        ctx.options?.blog && ["blog.html", txt(ctx,"blog")],
        ["compare.html", txt(ctx,"compare")],
        ["contact.html", txt(ctx,"contact")]
      ].filter(Boolean).map(([path,label]) => [`${prefix}${path}`, label]);
  const homeHref = one && prefix ? `${prefix}index.html` : (one ? "#main" : `${prefix}index.html`);
  const ctaHref = ctx.ctaUrl || (one && prefix ? `${prefix}index.html#contact` : (one ? "#contact" : `${prefix}contact.html`));
  const logoSrc = ctx.preview && ctx.logo?.previewSrc ? ctx.logo.previewSrc : (ctx.logo ? `${prefix}${ctx.logo.path}` : "");
  const logo = ctx.logo ? `<img class="brand-logo" src="${logoSrc}" alt="${esc(ctx.biz)} logo">` : "";
  return `<a class="skip-link" href="#main">${txt(ctx,"skip")}</a><header class="site-header"><nav class="nav" aria-label="${txt(ctx,"navLabel")}"><a class="brand" href="${homeHref}">${logo}<span>${esc(ctx.biz)}</span></a><div class="nav-links" data-nav-links>${links.map(([href,label])=>`<a href="${href}">${esc(label)}</a>`).join("")}</div><div class="nav-actions"><button class="theme-toggle" type="button" data-theme-toggle data-light-label="${txt(ctx,"light")}" data-dark-label="${txt(ctx,"dark")}" aria-label="Toggle dark mode">${txt(ctx,"dark")}</button><a class="nav-cta" href="${ctaHref}">${esc(ctx.cta)}</a><button class="menu-btn" type="button" data-menu-button aria-expanded="false" data-open-label="${txt(ctx,"openMenu")}" data-close-label="${txt(ctx,"closeMenu")}" aria-label="${txt(ctx,"openMenu")}">☰</button></div></nav></header>`;
}
function pageLink(prefix, path, label) { return `<a href="${prefix}${path}">${label}</a>`; }
function onePageHref(prefix, anchor) { return prefix ? `${prefix}index.html${anchor}` : anchor; }
function onePage(ctx) { return wrapPage(ctx, pageTitle(ctx,"One Page","עמוד אחד"), ctx.tagline || ctx.data.sub, onePageBody(ctx)); }
function socialLinksHtml(ctx, className = "social-links") {
  if (!ctx.socials?.length) return "";
  return `<div class="${className}">${ctx.socials.map(item => `<a href="${esc(item.url)}" target="_blank" rel="noopener">${esc(item.label)}</a>`).join("")}</div>`;
}
function footer(ctx, prefix = "") {
  const y = new Date().getFullYear();
  const resources = ctx.siteType === "onepage"
    ? [[onePageHref(prefix,"#pricing"),txt(ctx,"pricing")],[onePageHref(prefix,"#faq"),txt(ctx,"faq")],[onePageHref(prefix,"#compare"),txt(ctx,"compare")]].map(([href,label])=>`<a href="${href}">${label}</a>`).join("")
    : [ctx.options?.pricing && ["pricing.html", txt(ctx,"pricing")], ctx.options?.faq && ["faq.html", txt(ctx,"faq")], ctx.options?.blog && ["blog.html", txt(ctx,"blog")], ["compare.html", txt(ctx,"compare")]].filter(Boolean).map(([path, label]) => pageLink(prefix, path, label)).join("");
  const company = ctx.siteType === "onepage"
    ? `${pageLink(prefix,"index.html",txt(ctx,"home"))}<a href="${onePageHref(prefix,"#services")}">${txt(ctx,"services")}</a><a href="${onePageHref(prefix,"#compare")}">${txt(ctx,"compare")}</a><a href="${onePageHref(prefix,"#contact")}">${txt(ctx,"contact")}</a>`
    : `${pageLink(prefix,"index.html",txt(ctx,"home"))}${pageLink(prefix,"about.html",txt(ctx,"about"))}${pageLink(prefix,"services.html",txt(ctx,"services"))}${pageLink(prefix,"compare.html",txt(ctx,"compare"))}`;
  return `<footer class="footer"><div class="footer-inner"><div class="footer-grid"><div><h3>${esc(ctx.biz)}</h3><p>${esc(ctx.tagline || ctx.data.foot)}</p><p><strong>${txt(ctx,"contactDetails")}</strong><br>${tech(ctx.local.email)}<br>${tech(ctx.local.phone)}<br>${esc(ctx.local.area)}<br>${esc(ctx.local.address)}<br>${esc(ctx.local.hours)}</p>${socialLinksHtml(ctx)}</div><div><h4>${txt(ctx,"company")}</h4>${company}</div><div><h4>${txt(ctx,"resources")}</h4>${resources}</div><div><h4>${txt(ctx,"legal")}</h4>${pageLink(prefix,"legal/privacy-policy.html",txt(ctx,"privacy"))}${pageLink(prefix,"legal/terms-of-usage.html",txt(ctx,"terms"))}${pageLink(prefix,"legal/cookie-policy.html",txt(ctx,"cookies"))}</div></div><div class="footer-bottom"><span>© ${y} ${esc(ctx.biz)}. ${txt(ctx,"rights")}.</span><span>${esc(ctx.goal.name)} - ${esc(ctx.voice.adjective)} by design.</span></div></div></footer>`;
}
function wrapPage(ctx, title, description, body, prefix = "") { return `<!DOCTYPE html><html lang="${langOf(ctx)}" dir="${dirOf(ctx)}"><head>${meta(ctx,title,description,prefix)}</head><body>${nav(ctx,prefix)}<main id="main">${body}</main>${footer(ctx,prefix)}</body></html>`; }
function hero(ctx, title, subtitle, seed) {
  const contactHref = actionHref(ctx);
  const servicesHref = ctx.siteType === "onepage" ? "#services" : "services.html";
  return `<section class="hero ${DESIGN_STYLES[ctx.styleKey].heroClass}"><div class="hero-inner"><div class="hero-copy"><p class="kicker">${esc(ctx.goal.name)}</p><h1>${esc(title)}</h1><p>${esc(subtitle)}</p><p>${esc(ctx.voice.opener)}</p><div class="hero-actions"><a class="btn btn-primary" href="${contactHref}">${esc(ctx.cta)}</a><a class="btn btn-secondary" href="${servicesHref}">${txt(ctx,"explore")}</a></div></div><div class="hero-media"><img src="${imageUrl(900,650,ctx.slug+'-'+seed,ctx)}" alt="${esc(ctx.biz)} visual placeholder"></div></div></section>`;
}
function trustSection(ctx) {
  const style = ctx.trustStyle;
  if (style === "logos") return `<section class="trust logo-strip" aria-label="Client logos">${["North","Acme","Bright","Union","Atlas"].map(n=>`<div class="fake-logo">${n}</div>`).join("")}</section>`;
  if (isHebrew(ctx)) {
    if (style === "stars") return `<section class="trust grid4"><div><strong class="stars">★★★★★</strong><span>ביקורת ממוצעת</span></div><div><strong>4.9/5</strong><span>דירוג לקוחות</span></div><div><strong>250+</strong><span>לקוחות מרוצים</span></div><div><strong>24 שעות</strong><span>זמן תגובה</span></div></section>`;
    if (style === "certifications") return `<section class="trust grid4"><div><strong>מוסמך</strong><span>מוכן לתעשייה</span></div><div><strong>מבוטח</strong><span>שקט נפשי</span></div><div><strong>מאובטח</strong><span>תהליך אחראי</span></div><div><strong>אמין</strong><span>לקוחות חוזרים</span></div></section>`;
    if (style === "experience") return `<section class="trust grid4"><div><strong>10+</strong><span>שנות ניסיון</span></div><div><strong>500+</strong><span>פרויקטים</span></div><div><strong>98%</strong><span>שביעות רצון</span></div><div><strong>1:1</strong><span>ליווי אישי</span></div></section>`;
    if (style === "reviews") return `<section class="trust grid4"><div><strong>“ברור.”</strong><span>תהליך שימושי מהיום הראשון.</span></div><div><strong>“מהיר.”</strong><span>צעדים פשוטים ומענה מהיר.</span></div><div><strong>“שווה.”</strong><span>מלוטש מספיק כדי לסמוך.</span></div><div><strong>“אנושי.”</strong><span>תקשורת מצוינת.</span></div></section>`;
    return `<section class="trust grid4"><div><strong>250+</strong><span>לקוחות</span></div><div><strong>4.9/5</strong><span>דירוג ממוצע</span></div><div><strong>10+</strong><span>שנות ניסיון</span></div><div><strong>24 שעות</strong><span>זמן תגובה</span></div></section>`;
  }
  if (style === "stars") return `<section class="trust grid4"><div><strong class="stars">★★★★★</strong><span>Average review</span></div><div><strong>4.9/5</strong><span>Customer rating</span></div><div><strong>250+</strong><span>Happy customers</span></div><div><strong>24h</strong><span>Response time</span></div></section>`;
  if (style === "certifications") return `<section class="trust grid4"><div><strong>Certified</strong><span>Industry ready</span></div><div><strong>Insured</strong><span>Peace of mind</span></div><div><strong>Secure</strong><span>Responsible process</span></div><div><strong>Trusted</strong><span>Repeat clients</span></div></section>`;
  if (style === "experience") return `<section class="trust grid4"><div><strong>10+</strong><span>Years experience</span></div><div><strong>500+</strong><span>Projects delivered</span></div><div><strong>98%</strong><span>Client satisfaction</span></div><div><strong>1:1</strong><span>Personal support</span></div></section>`;
  if (style === "reviews") return `<section class="trust grid4"><div><strong>“Clear.”</strong><span>A useful process from day one.</span></div><div><strong>“Fast.”</strong><span>Easy next steps and quick response.</span></div><div><strong>“Worth it.”</strong><span>Polished enough to trust.</span></div><div><strong>“Human.”</strong><span>Great communication.</span></div></section>`;
  return `<section class="trust grid4"><div><strong>250+</strong><span>Customers served</span></div><div><strong>4.9/5</strong><span>Average rating</span></div><div><strong>10+</strong><span>Years experience</span></div><div><strong>24h</strong><span>Response time</span></div></section>`;
}
function servicesCards(ctx, count=3, withImages=false) {
  const helper = isHebrew(ctx)
    ? "השתמשו במקום הזה כדי להסביר את התוצאה שהלקוח מקבל, למי זה מתאים ומה מייחד את הגישה שלכם. שמרו על ניסוח ספציפי וממוקד תועלת."
    : "Use this space to explain the customer outcome, who it helps, and what makes your approach different. Keep it specific and benefit-led.";
  return `<div class="grid cards">${Array.from({length:count},(_,i)=>{ const title=ctx.data.sections[i%ctx.data.sections.length]; return `<article class="card">${withImages?`<img src="${imageUrl(600,380,ctx.slug+'-card-'+i,ctx)}" alt="${esc(title)} image">`:`<div class="icon">${["✦","⚡","✓","★","↗","●"][i%6]}</div>`}<h3>${esc(title)}</h3><p>${helper}</p></article>`;}).join("")}</div>`;
}
function goalSection(ctx) {
  const g = ctx.goal;
  return `<section class="section alt"><div class="section-inner"><div class="section-head"><p class="kicker">${txt(ctx,"websiteGoal")}</p><h2>${esc(g.hero)}</h2><p class="lead">${esc(g.focus)}</p></div>${servicesCards(ctx,3,false)}</div></section>`;
}
function industryModule(ctx) {
  if (isHebrew(ctx)) {
    if (ctx.industry === "food" || ctx.layoutKey === "hospitality") return `<section class="section"><div class="section-head"><p class="kicker">תפריט ורגעים</p><h2>הראו את הטעם עוד לפני שהלקוח מגיע.</h2></div>${servicesCards(ctx,3,true)}</section>`;
    if (ctx.industry === "technology" || ctx.layoutKey === "saas") return `<section class="section"><div class="section-head"><p class="kicker">הוכחת מוצר</p><h2>פיצ׳רים, אינטגרציות ואבטחה בסיפור נקי אחד.</h2></div>${servicesCards(ctx,6,false)}</section>`;
    if (ctx.industry === "creative" || ctx.layoutKey === "portfolio") return `<section class="section"><div class="section-head"><p class="kicker">עבודות נבחרות</p><h2>אזור גלריה להוכחות, פרויקטים ומקרי בוחן.</h2></div>${servicesCards(ctx,6,true)}</section>`;
    if (ctx.goalKey === "hiring") return `<section class="section"><div class="section-head"><p class="kicker">קריירה</p><h2>תנו לאנשים טובים סיבה להצטרף.</h2></div><div class="grid cards"><article class="card"><h3>תרבות</h3><p>הסבירו איך הצוות עובד, מתקשר ותומך בצמיחה.</p></article><article class="card"><h3>תנאים</h3><p>ציינו את הסיבות המעשיות להצטרף אליכם.</p></article><article class="card"><h3>משרות פתוחות</h3><p>הוסיפו תפקידים וקשרו כל אחד לטופס פנייה.</p></article></div></section>`;
  } else {
    if (ctx.industry === "food" || ctx.layoutKey === "hospitality") return `<section class="section"><div class="section-head"><p class="kicker">Menu and moments</p><h2>Show the taste before they arrive.</h2></div>${servicesCards(ctx,3,true)}</section>`;
    if (ctx.industry === "technology" || ctx.layoutKey === "saas") return `<section class="section"><div class="section-head"><p class="kicker">Product proof</p><h2>Features, integrations, and security in one clean story.</h2></div>${servicesCards(ctx,6,false)}</section>`;
    if (ctx.industry === "creative" || ctx.layoutKey === "portfolio") return `<section class="section"><div class="section-head"><p class="kicker">Selected work</p><h2>A gallery-style section for proof, projects, and case studies.</h2></div>${servicesCards(ctx,6,true)}</section>`;
    if (ctx.goalKey === "hiring") return `<section class="section"><div class="section-head"><p class="kicker">Careers</p><h2>Give good people a reason to apply.</h2></div><div class="grid cards"><article class="card"><h3>Culture</h3><p>Explain how the team works, communicates, and supports growth.</p></article><article class="card"><h3>Benefits</h3><p>List the practical reasons people should consider joining.</p></article><article class="card"><h3>Open roles</h3><p>Add current roles and link each one to an application form.</p></article></div></section>`;
  }
  return `<section class="section"><div class="section-head"><p class="kicker">${txt(ctx,"whatWeDo")}</p><h2>${txt(ctx,"clearOffers")}</h2></div>${servicesCards(ctx,3,true)}</section>`;
}
function actionHref(ctx) {
  if (ctx.ctaUrl) return ctx.ctaUrl;
  if (ctx.productPaymentUrl && ctx.goalKey === "sales") return ctx.productPaymentUrl;
  return ctx.siteType === "onepage" ? "#contact" : "contact.html";
}
function productHref(ctx) { return ctx.productPaymentUrl || actionHref(ctx); }
function finalCta(ctx) { return `<section class="cta"><h2>${esc(ctx.voice.ctaLine)}</h2><p>${esc(ctx.goal.focus)}</p><a class="btn btn-primary" href="${actionHref(ctx)}">${esc(ctx.cta)}</a></section>`; }
function featureBand(ctx) {
  const head = isHebrew(ctx) ? "אתר שבונה אמון מהר יותר." : "A page that builds trust faster.";
  const lead = isHebrew(ctx) ? "הבלוק הזה מחבר תמונה חזקה, מסר קצר וצעדים ברורים כדי שהמבקר יבין מיד למה להמשיך." : "This block combines a strong visual, short positioning, and clear next steps so visitors instantly understand why to continue.";
  const points = isHebrew(ctx) ? ["מסר חד", "הוכחה מוקדמת", "פעולה ברורה"] : ["Sharp positioning", "Early proof", "Obvious action"];
  return `<section class="section"><div class="grid cards" style="align-items:center"><article class="card" style="padding:0;overflow:hidden"><img src="${imageUrl(900,620,ctx.slug+'-feature',ctx)}" alt="${esc(ctx.biz)} feature image"></article><article class="card"><p class="kicker">${isHebrew(ctx)?"פוקוס":"Focus"}</p><h2>${head}</h2><p>${lead}</p><ul class="list">${points.map(p=>`<li>${p}</li>`).join("")}</ul><a class="btn btn-primary" href="${actionHref(ctx)}">${esc(ctx.cta)}</a></article></div></section>`;
}
function showcaseWall(ctx) {
  const head = isHebrew(ctx) ? "תנו לאנשים להרגיש את המותג לפני שהם קוראים הכול." : "Let people feel the brand before they read everything.";
  const lead = isHebrew(ctx) ? "וריאציית תצוגה שמדגישה תמונות, כרטיסים קצרים והוכחה חברתית מוקדמת." : "A showcase variation that emphasizes visuals, short cards, and early social proof.";
  return `<section class="section alt"><div class="section-inner"><div class="section-head"><p class="kicker">${isHebrew(ctx)?"תצוגה":"Showcase"}</p><h2>${head}</h2><p class="lead">${lead}</p></div><div class="grid cards"><article class="card" style="grid-row:span 2"><img src="${imageUrl(700,900,ctx.slug+'-showcase-tall',ctx)}" alt="${esc(ctx.biz)} showcase image"><h3>${esc(ctx.data.sections[0])}</h3><p>${esc(ctx.voice.opener)}</p></article><article class="card"><img src="${imageUrl(700,420,ctx.slug+'-showcase-wide',ctx)}" alt="${esc(ctx.biz)} showcase image"><h3>${esc(ctx.data.sections[1])}</h3><p>${esc(ctx.goal.focus)}</p></article><article class="card"><div class="icon">★</div><h3>${isHebrew(ctx)?"סיבה להאמין":"Reason to believe"}</h3><p>${isHebrew(ctx)?"הוסיפו כאן הוכחה קצרה, מספר או ציטוט שמוריד ספק.":"Add a short proof point, number, or quote that reduces doubt."}</p></article></div></div></section>`;
}
function homeBodyClassic(ctx) { return hero(ctx, ctx.mainHeadline || ctx.data.hero, ctx.tagline || ctx.data.sub, "hero") + trustSection(ctx) + goalSection(ctx) + industryModule(ctx) + finalCta(ctx); }
function homeBodyImpact(ctx) { return hero(ctx, ctx.mainHeadline || ctx.goal.hero || ctx.data.hero, ctx.tagline || ctx.data.sub, "impact") + goalSection(ctx) + featureBand(ctx) + trustSection(ctx) + pricingSection(ctx) + finalCta(ctx); }
function homeBodyShowcase(ctx) { return hero(ctx, ctx.mainHeadline || ctx.data.hero, ctx.tagline || ctx.data.sub, "showcase") + showcaseWall(ctx) + industryModule(ctx) + trustSection(ctx) + compareSection(ctx) + finalCta(ctx); }
function homeBody(ctx) {
  if (ctx.layoutKey === "impact") return homeBodyImpact(ctx);
  if (ctx.layoutKey === "showcase") return homeBodyShowcase(ctx);
  return homeBodyClassic(ctx);
}
function homePage(ctx) { return wrapPage(ctx, pageTitle(ctx,"Home","בית"), ctx.tagline || ctx.data.sub, homeBody(ctx)); }
function pricingSection(ctx) {
  const names = isHebrew(ctx) ? ["בסיסי","מקצועי","פרימיום"] : ["Starter","Professional","Premium"];
  const bullets = isHebrew(ctx) ? ["תכולה ברורה","לוח זמנים מוגדר","תמיכה בצעד הבא"] : ["Clear deliverables","Defined timeline","Next-step support"];
  return `<section class="section" id="pricing"><div class="section-head"><p class="kicker">${txt(ctx,"pricing")}</p><h2>${txt(ctx,"pricingHead")}</h2><p class="lead">${txt(ctx,"pricingLead")}</p></div><div class="grid pricing">${names.map((n,i)=>`<article class="card"><h3>${n}</h3><div class="price">${["$99","$299",isHebrew(ctx)?"מותאם":"Custom"][i]}</div><ul class="list">${bullets.map(b=>`<li>${b}</li>`).join("")}</ul><a class="btn btn-primary" href="${productHref(ctx)}">${esc(ctx.cta)}</a></article>`).join("")}</div></section>`;
}
function faqSection(ctx) {
  const qs = isHebrew(ctx)
    ? ["מה הצעד הראשון הכי נכון?","כמה זמן התהליך בדרך כלל לוקח?","מה כדאי להכין לפני שפונים?","האם אפשר להתאים את זה אישית?","מה קורה אחרי שליחת הטופס?"]
    : ["What is the best first step?","How long does the process usually take?","What should I prepare before contacting you?","Can this be customized?","What happens after I submit the form?"];
  const answer = isHebrew(ctx) ? "כתבו תשובה ישירה שמורידה ספק ומסבירה לקורא מה הצעד הבא." : "Write a direct answer that removes doubt and tells the reader what to do next.";
  return `<section class="section" id="faq"><div class="section-head"><p class="kicker">${txt(ctx,"faq")}</p><h2>${txt(ctx,"faqHead")}</h2><p class="lead">${txt(ctx,"faqLead")}</p></div>${qs.map(q=>`<details class="faq-item"><summary>${q}</summary><p>${answer}</p></details>`).join("")}</section>`;
}
function compareSection(ctx) {
  if (isHebrew(ctx)) {
    return `<section class="section" id="compare"><div class="section-head"><p class="kicker">השוואה</p><h2>למה לבחור ב-${esc(ctx.biz)}?</h2><p class="lead">אזור השוואה עוזר לקונים להבין מה שונה בגישה שלכם בלי להישמע מתגוננים.</p></div><table class="compare-table"><thead><tr><th>צורך</th><th>${esc(ctx.biz)}</th><th>חלופה גנרית</th></tr></thead><tbody><tr><td>תהליך</td><td>צעדים ברורים וליווי אישי</td><td>לעיתים לא ברור או מבוסס תבנית</td></tr><tr><td>התאמה</td><td>נבנה סביב ${esc(ctx.goal.name)}</td><td>פתרון כללי לכולם</td></tr><tr><td>זמינות</td><td>${esc(ctx.local.hours)}</td><td>זמני מענה לא ברורים</td></tr><tr><td>פעולה</td><td>${esc(ctx.cta)} מופיע בצורה עקבית באתר</td><td>קריאה לפעולה לא תמיד עקבית</td></tr></tbody></table></section>`;
  }
  return `<section class="section" id="compare"><div class="section-head"><p class="kicker">Comparison</p><h2>Why choose ${esc(ctx.biz)}?</h2><p class="lead">A comparison section helps buyers understand what makes your approach different without sounding defensive.</p></div><table class="compare-table"><thead><tr><th>Need</th><th>${esc(ctx.biz)}</th><th>Generic alternative</th></tr></thead><tbody><tr><td>Process</td><td>Clear next steps and personal guidance</td><td>Often unclear or template-based</td></tr><tr><td>Fit</td><td>Built around ${esc(ctx.goal.name.toLowerCase())}</td><td>One-size-fits-most</td></tr><tr><td>Availability</td><td>${esc(ctx.local.hours)}</td><td>Unclear timing</td></tr><tr><td>Action</td><td>${esc(ctx.cta)} is visible across the site</td><td>CTA may be inconsistent</td></tr></tbody></table></section>`;
}
function contactForm(ctx) {
  let formAttrs = `data-demo-form data-mode="static" data-demo-message="${isHebrew(ctx)?"פניית דמו נקלטה. חברו נקודת קצה אמיתית לפני השקה.":"Demo submission captured. Connect a real endpoint before launch."}"`;
  let action = "";
  if (ctx.formMode === "netlify") formAttrs = `name="contact" method="POST" data-netlify="true" action="thank-you.html"`;
  if (ctx.formMode === "mailto") {
    formAttrs = `method="POST" action="mailto:${ctx.local.email}" enctype="text/plain"`;
    action = `<p class="notice">${isHebrew(ctx)?"הטופס משתמש ב-mailto. לפרודקשן, חברו אותו ל-Netlify Forms, Formspree, Basin או לשרת שלכם.":"This form uses a mailto fallback. For production, connect it to Netlify Forms, Formspree, Basin, or your backend."}</p>`;
  }
  const note = ctx.formMode==='netlify'
    ? (isHebrew(ctx)?'מוכן ל-Netlify. אחרי פריסה ל-Netlify, הפניות יופיעו בדשבורד.':'Netlify-ready. Deploy to Netlify and submissions will appear in your dashboard.')
    : (isHebrew(ctx)?'טופס דמו מוכן.':'Demo-ready form.');
  return `<form class="card form" ${formAttrs}><input type="hidden" name="form-name" value="contact"><p class="honeypot"><label>Do not fill this out <input name="bot-field" autocomplete="off"></label></p><label>${txt(ctx,"name")}<input name="name" required autocomplete="name"></label><label>${txt(ctx,"email")}<input class="ltr-field" dir="ltr" type="email" name="email" required autocomplete="email"></label><label>${txt(ctx,"phone")}<input class="ltr-field" dir="ltr" type="tel" name="phone" autocomplete="tel"></label><label>${txt(ctx,"subject")}<input name="subject" autocomplete="on"></label><label>${txt(ctx,"message")}<textarea name="message" required autocomplete="on"></textarea></label><button class="btn btn-primary" type="submit">${esc(ctx.cta)}</button><p data-form-note class="notice">${note}</p>${action}</form>`;
}
function contactBlock(ctx) {
  return `<div class="contact-grid"><div class="card"><h3>${txt(ctx,"contactDetails")}</h3><p>${txt(ctx,"email")}: ${tech(ctx.local.email)}</p><p>${txt(ctx,"phone")}: ${tech(ctx.local.phone)}</p><p>${txt(ctx,"serviceArea")}: ${esc(ctx.local.area)}</p><p>${txt(ctx,"address")}: ${esc(ctx.local.address)}</p><p>${txt(ctx,"hours")}: ${esc(ctx.local.hours)}</p>${socialLinksHtml(ctx,"social-links contact-socials")}</div>${contactForm(ctx)}</div>`;
}
function onePageServices(ctx) { return `<section class="section" id="services"><div class="section-head"><p class="kicker">${txt(ctx,"services")}</p><h2>${txt(ctx,"onePageHead")}</h2><p class="lead">${txt(ctx,"onePageLead")}</p></div>${servicesCards(ctx,4,true)}</section>`; }
function onePageContact(ctx) { return `<section class="section" id="contact"><div class="section-head"><p class="kicker">${txt(ctx,"contact")}</p><h2>${esc(ctx.cta)}</h2><p class="lead">${esc(ctx.voice.ctaLine)}</p></div>${contactBlock(ctx)}</section>`; }
function onePageBodyClassic(ctx) { return hero(ctx, ctx.mainHeadline || ctx.data.hero, ctx.tagline || ctx.data.sub, "hero") + trustSection(ctx) + onePageServices(ctx) + pricingSection(ctx) + compareSection(ctx) + faqSection(ctx) + onePageContact(ctx); }
function onePageBodyImpact(ctx) { return hero(ctx, ctx.mainHeadline || ctx.goal.hero || ctx.data.hero, ctx.tagline || ctx.data.sub, "impact") + goalSection(ctx) + pricingSection(ctx) + trustSection(ctx) + onePageServices(ctx) + faqSection(ctx) + onePageContact(ctx); }
function onePageBodyShowcase(ctx) { return hero(ctx, ctx.mainHeadline || ctx.data.hero, ctx.tagline || ctx.data.sub, "showcase") + showcaseWall(ctx) + onePageServices(ctx) + compareSection(ctx) + trustSection(ctx) + pricingSection(ctx) + onePageContact(ctx); }
function onePageBody(ctx) {
  if (ctx.layoutKey === "impact") return onePageBodyImpact(ctx);
  if (ctx.layoutKey === "showcase") return onePageBodyShowcase(ctx);
  return onePageBodyClassic(ctx);
}
function onePage(ctx) { return wrapPage(ctx, `${ctx.biz} - One Page`, ctx.tagline || ctx.data.sub, onePageBody(ctx)); }
function customAboutSection(ctx) {
  if (!ctx.aboutText) return "";
  const title = isHebrew(ctx) ? "על העסק" : "About the business";
  const kicker = isHebrew(ctx) ? "אודות" : "About";
  return `<section class="section about-custom"><div class="section-head"><p class="kicker">${kicker}</p><h2>${title}</h2></div><div class="card rich-text">${textToParagraphs(ctx.aboutText)}</div></section>`;
}
function aboutPage(ctx) {
  const intro = customAboutSection(ctx);
  const body = isHebrew(ctx)
    ? hero(ctx, `אודות ${ctx.biz}`, ctx.tagline || ctx.data.sub, "about") + intro + `<section class="section"><div class="section-head"><p class="kicker">הסיפור שלנו</p><h2>סיפור פתיחה עם הנחיות שימושיות.</h2><p class="lead">השתמשו באזור הזה כדי להסביר למה העסק קיים, את מי הוא משרת ומה לקוחות יכולים לצפות לקבל. התמקדו באמון, לא באוטוביוגרפיה.</p></div><div class="grid cards"><article class="card"><h3>הבטחה</h3><p>כתבו את ההבטחה הפשוטה שהלקוחות יכולים לסמוך עליה.</p></article><article class="card"><h3>תהליך</h3><p>הסבירו איך אתם עובדים כדי שאנשים ירגישו בטוחים להתקדם.</p></article><article class="card"><h3>הוכחה</h3><p>הוסיפו הסמכות, מספרים, המלצות או תוצאות נראות.</p></article></div></section>`
    : hero(ctx, `About ${ctx.biz}`, ctx.tagline || ctx.data.sub, "about") + intro + `<section class="section"><div class="section-head"><p class="kicker">Our story</p><h2>A starter story with useful prompts built in.</h2><p class="lead">Use this area to explain why the business exists, who it serves, and what customers can expect. Focus on trust, not autobiography.</p></div><div class="grid cards"><article class="card"><h3>Promise</h3><p>Write the simple promise customers can hold you to.</p></article><article class="card"><h3>Process</h3><p>Explain how you work so people feel safe taking the next step.</p></article><article class="card"><h3>Proof</h3><p>Add credentials, numbers, testimonials, or visible outcomes.</p></article></div></section>`;
  return wrapPage(ctx, pageTitle(ctx,"About","אודות"), isHebrew(ctx) ? `מידע על ${ctx.biz}.` : `Learn about ${ctx.biz}.`, body);
}
function servicesPage(ctx) { return wrapPage(ctx, pageTitle(ctx,"Services","שירותים"), isHebrew(ctx) ? `שירותים של ${ctx.biz}.` : `Services offered by ${ctx.biz}.`, hero(ctx, txt(ctx,"services"), isHebrew(ctx)?"הצעות ברורות, הסברים פשוטים וצעדים הבאים ברורים.":"Clear offers, simple explanations, and obvious next steps.", "services") + `<section class="section"><div class="section-head"><p class="kicker">${txt(ctx,"services")}</p><h2>${isHebrew(ctx)?"כרטיסי שירות ממוקדי תוצאה.":"Outcome-first service cards."}</h2><p class="lead">${isHebrew(ctx)?"כל כרטיס צריך להסביר איזו תוצאה מקבלים, למי זה מתאים ומה קורה אחרי הלחיצה.":"Each card should tell the reader what result they get, who it is for, and what happens after they click."}</p></div>${servicesCards(ctx,6,true)}</section>`); }
function pricingPage(ctx) { return wrapPage(ctx, pageTitle(ctx,"Pricing","מחירים"), isHebrew(ctx) ? `אפשרויות מחיר עבור ${ctx.biz}.` : `Pricing options for ${ctx.biz}.`, pricingSection(ctx)); }
function faqPage(ctx) { return wrapPage(ctx, pageTitle(ctx,"FAQ","שאלות נפוצות"), isHebrew(ctx) ? `שאלות נפוצות עבור ${ctx.biz}.` : `Frequently asked questions for ${ctx.biz}.`, faqSection(ctx)); }
function blogPage(ctx) {
  const body = `<section class="section"><div class="section-head"><p class="kicker">${txt(ctx,"blog")}</p><h2>${txt(ctx,"blogHead")}</h2><p class="lead">${txt(ctx,"blogLead")}</p></div><div class="grid cards">${[1,2,3].map(i=>`<article class="card blog-card"><img src="${imageUrl(600,360,ctx.slug+'-blog-'+i,ctx)}" alt="Blog image ${i}"><time>${isHebrew(ctx)?`מאמר ${i}`:`Article ${i}`}</time><h3>${isHebrew(ctx)?"כותרת מאמר שימושית כאן":"Helpful article title goes here"}</h3><p>${isHebrew(ctx)?"כתבו תקציר שמבטיח רעיון שימושי אחד, לא חדשות גנריות.":"Write a preview that promises one useful idea, not generic news."}</p></article>`).join("")}</div></section>`;
  return wrapPage(ctx, pageTitle(ctx,"Blog","בלוג"), isHebrew(ctx) ? `מאמרים ועדכונים מאת ${ctx.biz}.` : `Articles and updates from ${ctx.biz}.`, body);
}
function comparePage(ctx) { return wrapPage(ctx, pageTitle(ctx,"Compare","השוואה"), isHebrew(ctx) ? `השוואת ${ctx.biz} לחלופות נפוצות.` : `Compare ${ctx.biz} with common alternatives.`, compareSection(ctx)); }
function contactPage(ctx) { return wrapPage(ctx, pageTitle(ctx,"Contact","צור קשר"), isHebrew(ctx) ? `יצירת קשר עם ${ctx.biz}.` : `Contact ${ctx.biz}.`, `<section class="section"><div class="section-head"><p class="kicker">${txt(ctx,"contact")}</p><h2>${esc(ctx.cta)}</h2><p class="lead">${esc(ctx.voice.ctaLine)}</p></div>${contactBlock(ctx)}</section>`); }
function thanksPage(ctx) { return wrapPage(ctx, pageTitle(ctx,"Thank You","תודה"), isHebrew(ctx) ? `תודה שפניתם אל ${ctx.biz}.` : `Thank you for contacting ${ctx.biz}.`, `<section class="section"><div class="card"><p class="kicker">${txt(ctx,"messageReceived")}</p><h1>${txt(ctx,"thankYou")}</h1><p>${txt(ctx,"thanksText")}</p><a class="btn btn-primary" href="index.html">${txt(ctx,"backHome")}</a></div></section>`); }
function notFoundPage(ctx) { return wrapPage(ctx, pageTitle(ctx,"Page Not Found","העמוד לא נמצא"), txt(ctx,"pageNotFound"), `<section class="section"><div class="card"><p class="kicker">404</p><h1>${txt(ctx,"lost")}</h1><p>${txt(ctx,"lostText")}</p><a class="btn btn-primary" href="index.html">${txt(ctx,"backHome")}</a></div></section>`); }
function legalNotice(ctx, updated) {
  return isHebrew(ctx)
    ? `<p class="notice"><strong>חשוב:</strong> זהו נוסח פתיחה כללי ואינו ייעוץ משפטי. לפני פרסום, התאימו אותו לעסק, למדינה, לספקים, לכלי האנליטיקה ולדרך שבה אתם אוספים מידע בפועל. עדכון אחרון: ${updated}</p>`
    : `<p class="notice"><strong>Important:</strong> This is a general starter template and is not legal advice. Before publishing, adapt it to your business, jurisdiction, vendors, analytics tools, and actual data practices. Last updated: ${updated}</p>`;
}
function legalContact(ctx) {
  return isHebrew(ctx)
    ? `<h2>יצירת קשר</h2><p>לשאלות לגבי עמוד זה, פרטיות או בקשות משתמשים, ניתן לפנות אלינו בכתובת <a class="tech-value" dir="ltr" href="mailto:${esc(ctx.local.email)}">${esc(ctx.local.email)}</a>.</p>`
    : `<h2>Contact</h2><p>For questions about this page, privacy matters, or user requests, contact us at <a class="tech-value" dir="ltr" href="mailto:${esc(ctx.local.email)}">${esc(ctx.local.email)}</a>.</p>`;
}
function privacyLegalContent(ctx, updated) {
  return isHebrew(ctx)
    ? `<section class="section"><div class="section-head"><p class="kicker">משפטי</p><h1>מדיניות פרטיות</h1><p class="lead">איך ${esc(ctx.biz)} אוספת, משתמשת, שומרת ומגנה על מידע אישי.</p></div><div class="card legal-card">${legalNotice(ctx, updated)}
<h2>1. מי אנחנו</h2><p>${esc(ctx.biz)} מפעילה אתר ושירותים הקשורים ל-${esc(ctx.data.foot)}. מדיניות זו מסבירה איזה מידע עשוי להיאסף כאשר משתמשים באתר, יוצרים קשר, נרשמים לשירות או מתקשרים איתנו.</p>
<h2>2. מידע שאנו עשויים לאסוף</h2><ul class="list"><li><strong>מידע שמסרתם:</strong> שם, אימייל, טלפון, נושא הפנייה, תוכן הודעה ופרטים נוספים שתבחרו לשלוח.</li><li><strong>מידע עסקי או תפעולי:</strong> העדפות שירות, אזור פעילות, בקשות להצעת מחיר, פגישות או פרויקטים.</li><li><strong>מידע טכני בסיסי:</strong> כתובת IP, סוג דפדפן, מכשיר, מערכת הפעלה, עמודים שנצפו, זמני ביקור ונתוני אבטחה.</li><li><strong>עוגיות וטכנולוגיות דומות:</strong> ראו גם את מדיניות העוגיות שלנו.</li></ul>
<h2>3. למה אנו משתמשים במידע</h2><ul class="list"><li>כדי לענות לפניות ולספק שירות.</li><li>כדי לתאם שיחות, הצעות מחיר, הזמנות או תמיכה.</li><li>כדי לשפר את האתר, התוכן וחוויית המשתמש.</li><li>כדי לשמור על אבטחה, למנוע ספאם, שימוש לרעה או ניסיונות הונאה.</li><li>כדי לעמוד בחובות חוקיות, חשבונאיות או רגולטוריות.</li></ul>
<h2>4. בסיס משפטי לעיבוד</h2><p>בהתאם לדין החל, אנו עשויים לעבד מידע על בסיס הסכמה, ביצוע חוזה או צעדים טרום חוזיים, אינטרס לגיטימי בהפעלת ושיפור השירותים, או חובה חוקית.</p>
<h2>5. שיתוף מידע עם ספקים</h2><p>אנו עשויים לשתף מידע עם ספקי תשתית, אחסון, אימייל, טפסים, אנליטיקה, אבטחה, סליקה או שירות לקוחות. ספקים אלה אמורים להשתמש במידע רק לצורך מתן השירות עבורנו.</p>
<h2>6. שמירת מידע</h2><p>אנו שומרים מידע רק כל עוד הוא נחוץ למטרות המתוארות במדיניות זו, אלא אם נדרש או מותר לשמור אותו לתקופה ארוכה יותר לפי חוק, לצורכי תיעוד, אבטחה, פתרון מחלוקות או אכיפת הסכמים.</p>
<h2>7. אבטחת מידע</h2><p>אנו משתמשים באמצעי אבטחה סבירים כדי להגן על מידע אישי. עם זאת, אף מערכת אינטרנטית אינה מאובטחת לחלוטין, ולכן אין אפשרות להבטיח הגנה מוחלטת.</p>
<h2>8. זכויות משתמשים</h2><p>בהתאם לדין החל, ייתכן שיש לכם זכות לבקש גישה, תיקון, מחיקה, הגבלה, ניידות מידע או התנגדות לעיבוד. ייתכן גם שתוכלו למשוך הסכמה במקום שבו העיבוד מבוסס על הסכמה.</p>
<h2>9. פרטיות ילדים</h2><p>האתר והשירותים אינם מיועדים לילדים. אם נודע לנו שנאסף מידע אישי מילד בניגוד לדין, נפעל למחיקתו או לטיפול בו בהתאם לחוק.</p>
<h2>10. העברות בינלאומיות</h2><p>ספקים מסוימים עשויים לפעול במדינות אחרות. במקרים כאלה, מידע עשוי להיות מעובד מחוץ למדינתכם, בכפוף לאמצעי הגנה מתאימים ככל שנדרש.</p>
<h2>11. עדכונים למדיניות</h2><p>אנו עשויים לעדכן מדיניות זו מעת לעת. תאריך העדכון האחרון יוצג בראש העמוד, ושימוש מתמשך באתר לאחר שינוי מהווה הסכמה לגרסה המעודכנת, ככל שהדין מאפשר זאת.</p>
${legalContact(ctx)}</div></section>`
    : `<section class="section"><div class="section-head"><p class="kicker">Legal</p><h1>Privacy Policy</h1><p class="lead">How ${esc(ctx.biz)} collects, uses, stores, and protects personal information.</p></div><div class="card legal-card">${legalNotice(ctx, updated)}
<h2>1. Who we are</h2><p>${esc(ctx.biz)} operates this website and related services connected to ${esc(ctx.data.foot)}. This policy explains what information may be collected when you use the site, contact us, request a service, or otherwise interact with us.</p>
<h2>2. Information we may collect</h2><ul class="list"><li><strong>Information you provide:</strong> name, email, phone, inquiry subject, message content, and any other details you choose to send.</li><li><strong>Business or service information:</strong> service preferences, location or service area, quote requests, bookings, or project details.</li><li><strong>Basic technical information:</strong> IP address, browser type, device, operating system, pages viewed, timestamps, and security logs.</li><li><strong>Cookies and similar technologies:</strong> see our Cookie Policy for more detail.</li></ul>
<h2>3. How we use information</h2><ul class="list"><li>To respond to inquiries and provide services.</li><li>To schedule calls, quotes, bookings, support, or follow-up communication.</li><li>To improve the website, content, and user experience.</li><li>To protect security, prevent spam, abuse, fraud, or technical misuse.</li><li>To comply with legal, accounting, regulatory, or recordkeeping obligations.</li></ul>
<h2>4. Legal bases for processing</h2><p>Depending on applicable law, we may process information based on consent, performance of a contract or pre-contract steps, legitimate interests in operating and improving our services, or legal obligations.</p>
<h2>5. Sharing information with service providers</h2><p>We may share information with providers that help with hosting, forms, email, analytics, security, payment processing, customer support, and business operations. These providers should use the information only to provide services to us.</p>
<h2>6. Data retention</h2><p>We keep information only as long as needed for the purposes described in this policy, unless a longer period is required or permitted by law for records, security, dispute resolution, or enforcing agreements.</p>
<h2>7. Security</h2><p>We use reasonable safeguards to protect personal information. However, no internet-based system is completely secure, and we cannot guarantee absolute security.</p>
<h2>8. Your rights</h2><p>Depending on your location, you may have rights to request access, correction, deletion, restriction, portability, or objection to processing. You may also be able to withdraw consent where processing is based on consent.</p>
<h2>9. Children’s privacy</h2><p>The website and services are not intended for children. If we learn that personal information from a child was collected contrary to applicable law, we will take appropriate steps to delete or handle it lawfully.</p>
<h2>10. International transfers</h2><p>Some providers may operate in other countries. In those cases, information may be processed outside your country, subject to appropriate safeguards where required.</p>
<h2>11. Updates to this policy</h2><p>We may update this policy from time to time. The latest update date will appear on this page, and continued use of the site after changes may indicate acceptance where allowed by law.</p>
${legalContact(ctx)}</div></section>`;
}
function termsLegalContent(ctx, updated) {
  return isHebrew(ctx)
    ? `<section class="section"><div class="section-head"><p class="kicker">משפטי</p><h1>תנאי שימוש</h1><p class="lead">הכללים הבסיסיים לשימוש באתר ובשירותים של ${esc(ctx.biz)}.</p></div><div class="card legal-card">${legalNotice(ctx, updated)}
<h2>1. קבלת התנאים</h2><p>שימוש באתר או בשירותים של ${esc(ctx.biz)} מהווה הסכמה לתנאים אלה. אם אינכם מסכימים, אין להשתמש באתר או בשירותים.</p>
<h2>2. שימוש מותר</h2><p>אתם מסכימים להשתמש באתר למטרות חוקיות בלבד ולא לבצע פעולות שעלולות לפגוע באתר, במשתמשים אחרים או ב-${esc(ctx.biz)}.</p><ul class="list"><li>אין לנסות לקבל גישה לא מורשית למערכות.</li><li>אין לשלוח ספאם, תוכן מזיק, מטעה או מפר זכויות.</li><li>אין להעתיק, לסרוק או לאסוף מידע באופן אוטומטי ללא רשות.</li><li>אין להשתמש באתר באופן שמפר חוק, תקנה או זכויות צד שלישי.</li></ul>
<h2>3. מידע באתר</h2><p>המידע באתר נועד למטרות כלליות בלבד. למרות שאנו משתדלים לשמור על דיוק ועדכניות, ייתכנו טעויות, חוסרים או שינויים ללא הודעה מוקדמת.</p>
<h2>4. הצעות, מחירים וזמינות</h2><p>תיאורי שירותים, מחירים, זמינות, זמני תגובה או הצעות באתר הם התחלתיים ועשויים להשתנות. התקשרות מחייבת תתבצע רק לאחר אישור מפורש או הסכם מתאים.</p>
<h2>5. קניין רוחני</h2><p>האתר, העיצוב, הטקסטים, הסימנים, התמונות, הקוד והתכנים הם בבעלות ${esc(ctx.biz)} או מורשיה, אלא אם צוין אחרת. אין להעתיק, לשנות, להפיץ או להשתמש בהם מסחרית ללא אישור מראש.</p>
<h2>6. תוכן משתמשים ופניות</h2><p>אם אתם שולחים מידע, קבצים, רעיונות או הודעות, אתם מצהירים שיש לכם זכות לעשות זאת. אתם מעניקים לנו רשות להשתמש בתוכן ככל שנדרש כדי לענות, לספק שירות או לטפל בבקשה.</p>
<h2>7. קישורים ושירותי צד שלישי</h2><p>האתר עשוי לכלול קישורים או רכיבים של צדדים שלישיים. איננו אחראים לתוכן, למדיניות, לאבטחה או לזמינות של אתרים ושירותים חיצוניים.</p>
<h2>8. הגבלת אחריות</h2><p>במידה המרבית המותרת לפי חוק, ${esc(ctx.biz)} לא תישא באחריות לנזק עקיף, מיוחד, תוצאתי, אובדן רווחים, אובדן מידע או הפרעה עסקית הנובעים משימוש באתר או בשירותים.</p>
<h2>9. היעדר אחריות</h2><p>האתר והשירותים מסופקים כפי שהם וכפי שהם זמינים. איננו מתחייבים שהאתר יהיה ללא תקלות, מאובטח לחלוטין, זמין תמיד או מתאים לכל צורך מסוים.</p>
<h2>10. סיום או הגבלת גישה</h2><p>אנו רשאים להגביל, להשעות או להפסיק גישה לאתר או לשירותים במקרה של הפרת תנאים, שימוש לרעה, סיכון אבטחה או דרישה חוקית.</p>
<h2>11. דין וסמכות שיפוט</h2><p>יש להתאים סעיף זה למדינה ולדין הרלוונטיים לעסק שלכם. עדכון נכון של סעיף זה חשוב במיוחד לפני פרסום.</p>
<h2>12. שינויים בתנאים</h2><p>אנו עשויים לעדכן תנאים אלה מעת לעת. המשך שימוש באתר לאחר פרסום שינוי עשוי להיחשב כהסכמה לתנאים המעודכנים, ככל שהדין מאפשר זאת.</p>
${legalContact(ctx)}</div></section>`
    : `<section class="section"><div class="section-head"><p class="kicker">Legal</p><h1>Terms of Use</h1><p class="lead">The basic rules for using the ${esc(ctx.biz)} website and services.</p></div><div class="card legal-card">${legalNotice(ctx, updated)}
<h2>1. Acceptance of terms</h2><p>By using the website or services of ${esc(ctx.biz)}, you agree to these terms. If you do not agree, you should not use the website or services.</p>
<h2>2. Permitted use</h2><p>You agree to use the website only for lawful purposes and not to harm the website, other users, or ${esc(ctx.biz)}.</p><ul class="list"><li>Do not attempt to gain unauthorized access to systems.</li><li>Do not send spam, harmful, misleading, or infringing content.</li><li>Do not scrape, copy, or collect information automatically without permission.</li><li>Do not use the website in a way that violates laws, regulations, or third-party rights.</li></ul>
<h2>3. Website information</h2><p>Information on the website is provided for general purposes. Although we try to keep it accurate and current, it may contain errors, omissions, or changes without notice.</p>
<h2>4. Offers, pricing, and availability</h2><p>Service descriptions, pricing, availability, response times, or offers shown on the site are preliminary and may change. A binding engagement is created only after explicit confirmation or an appropriate agreement.</p>
<h2>5. Intellectual property</h2><p>The website, design, text, marks, images, code, and content are owned by ${esc(ctx.biz)} or its licensors unless stated otherwise. You may not copy, modify, distribute, or commercially use them without prior permission.</p>
<h2>6. User content and submissions</h2><p>If you send information, files, ideas, or messages, you confirm that you have the right to do so. You give us permission to use that content as needed to respond, provide services, or handle your request.</p>
<h2>7. Third-party links and services</h2><p>The website may include links or components from third parties. We are not responsible for the content, policies, security, or availability of external websites or services.</p>
<h2>8. Limitation of liability</h2><p>To the maximum extent permitted by law, ${esc(ctx.biz)} will not be liable for indirect, special, consequential, incidental, punitive damages, lost profits, data loss, or business interruption arising from use of the website or services.</p>
<h2>9. Disclaimer of warranties</h2><p>The website and services are provided as is and as available. We do not promise that the site will be error-free, fully secure, always available, or suitable for every particular purpose.</p>
<h2>10. Suspension or termination</h2><p>We may restrict, suspend, or terminate access to the website or services if there is a violation of these terms, misuse, security risk, or legal requirement.</p>
<h2>11. Governing law and venue</h2><p>This section should be adapted to the country and law relevant to your business. Updating this correctly is especially important before publishing.</p>
<h2>12. Changes to terms</h2><p>We may update these terms from time to time. Continued use of the website after changes may be treated as acceptance of the updated terms where allowed by law.</p>
${legalContact(ctx)}</div></section>`;
}
function cookiesLegalContent(ctx, updated) {
  return isHebrew(ctx)
    ? `<section class="section"><div class="section-head"><p class="kicker">משפטי</p><h1>מדיניות עוגיות</h1><p class="lead">איך ${esc(ctx.biz)} עשויה להשתמש בעוגיות ובטכנולוגיות דומות.</p></div><div class="card legal-card">${legalNotice(ctx, updated)}
<h2>1. מהן עוגיות?</h2><p>עוגיות הן קבצי טקסט קטנים הנשמרים בדפדפן או במכשיר שלכם. הן עוזרות לאתר לפעול, לזכור העדפות, להבין שימוש ולשפר אבטחה.</p>
<h2>2. סוגי עוגיות אפשריים</h2><ul class="list"><li><strong>עוגיות חיוניות:</strong> נדרשות להפעלת האתר, אבטחה, טעינת עמודים, טפסים והעדפות בסיסיות.</li><li><strong>עוגיות פונקציונליות:</strong> זוכרות בחירות כמו שפה, מצב כהה/בהיר או העדפות תצוגה.</li><li><strong>עוגיות אנליטיקה:</strong> עוזרות להבין אילו עמודים נצפים, כמה זמן מבקרים נשארים, ואיך ניתן לשפר את האתר.</li><li><strong>עוגיות שיווק:</strong> אם יופעלו בעתיד, הן עשויות לעזור למדוד קמפיינים או להציג תוכן רלוונטי. יש להוסיף פירוט ספציפי לפני שימוש בהן.</li></ul>
<h2>3. דוגמאות לשימושים</h2><p>האתר עשוי להשתמש בעוגיות כדי לשמור העדפות, להפעיל טפסים, למדוד ביצועים, למנוע ספאם, לאבטח חיבורים ולשפר את חוויית המשתמש.</p>
<h2>4. שירותי צד שלישי</h2><p>אם תחברו כלים כמו Google Analytics, Meta Pixel, Hotjar, Plausible, מערכות טפסים, צ׳אט, סליקה או שירותי וידאו, ייתכן שספקים אלה יציבו עוגיות משלהם. יש לעדכן מדיניות זו בהתאם לכלים שהוטמעו בפועל.</p>
<h2>5. ניהול עוגיות</h2><p>ניתן לחסום, למחוק או להגביל עוגיות דרך הגדרות הדפדפן. חסימה של עוגיות מסוימות עשויה להשפיע על תפקוד האתר, טפסים, העדפות משתמש או מדידה.</p>
<h2>6. הסכמה והעדפות</h2><p>במקומות שבהם החוק דורש זאת, יש להציג באנר עוגיות או מנגנון בחירה לפני שימוש בעוגיות שאינן חיוניות. ודאו שהאתר שלכם מתאים לדרישות המקומיות.</p>
<h2>7. עדכונים למדיניות</h2><p>אנו עשויים לעדכן מדיניות זו כאשר מתווספים או משתנים כלי מדידה, שיווק, אבטחה או צד שלישי. תאריך העדכון האחרון יוצג בראש העמוד.</p>
${legalContact(ctx)}</div></section>`
    : `<section class="section"><div class="section-head"><p class="kicker">Legal</p><h1>Cookie Policy</h1><p class="lead">How ${esc(ctx.biz)} may use cookies and similar technologies.</p></div><div class="card legal-card">${legalNotice(ctx, updated)}
<h2>1. What are cookies?</h2><p>Cookies are small text files stored in your browser or on your device. They help websites function, remember preferences, understand usage, and improve security.</p>
<h2>2. Types of cookies we may use</h2><ul class="list"><li><strong>Essential cookies:</strong> needed for website operation, security, page loading, forms, and basic preferences.</li><li><strong>Functional cookies:</strong> remember choices such as language, dark/light mode, or display preferences.</li><li><strong>Analytics cookies:</strong> help understand which pages are viewed, how long visitors stay, and how the website can be improved.</li><li><strong>Marketing cookies:</strong> if enabled in the future, these may help measure campaigns or show relevant content. Add specific details before using them.</li></ul>
<h2>3. Examples of use</h2><p>The website may use cookies to store preferences, operate forms, measure performance, prevent spam, secure connections, and improve the user experience.</p>
<h2>4. Third-party services</h2><p>If you connect tools such as Google Analytics, Meta Pixel, Hotjar, Plausible, form platforms, chat widgets, payment systems, or video embeds, those providers may set their own cookies. Update this policy based on the tools actually installed.</p>
<h2>5. Managing cookies</h2><p>You can block, delete, or limit cookies through your browser settings. Blocking some cookies may affect website features, forms, preferences, or analytics.</p>
<h2>6. Consent and preferences</h2><p>Where required by law, you should display a cookie banner or preference mechanism before using non-essential cookies. Make sure your site matches local requirements.</p>
<h2>7. Updates to this policy</h2><p>We may update this policy when analytics, marketing, security, or third-party tools are added or changed. The latest update date will appear on this page.</p>
${legalContact(ctx)}</div></section>`;
}
function legalPage(ctx,type) {
  const titles = isHebrew(ctx) ? {privacy:"מדיניות פרטיות",terms:"תנאי שימוש",cookies:"מדיניות עוגיות"} : {privacy:"Privacy Policy",terms:"Terms of Use",cookies:"Cookie Policy"};
  const updated = new Date().toLocaleDateString(isHebrew(ctx) ? "he-IL" : "en-US", { year:"numeric", month:"long", day:"numeric" });
  const body = type === "privacy" ? privacyLegalContent(ctx, updated) : type === "terms" ? termsLegalContent(ctx, updated) : cookiesLegalContent(ctx, updated);
  const desc = isHebrew(ctx) ? `${titles[type]} עבור ${ctx.biz}.` : `${titles[type]} for ${ctx.biz}.`;
  return wrapPage(ctx, `${ctx.biz} - ${titles[type]}`, desc, body, "../");
}
function sitemap(ctx) {
  const pages = [...generatedPages(ctx).map(([path]) => path), "legal/privacy-policy.html", "legal/terms-of-usage.html", "legal/cookie-policy.html"];
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${pages.map(p => `<url><loc>${absoluteUrl(ctx, p)}</loc></url>`).join("")}</urlset>`;
}
function manifest(ctx) { const icon = ctx.logo ? { src: ctx.logo.path, sizes: "any", type: ctx.logo.mime } : { src: "assets/img/favicon.svg", sizes: "any", type: "image/svg+xml" }; return JSON.stringify({ name: ctx.biz, short_name: ctx.biz.slice(0,12), start_url: "index.html", display: "standalone", background_color: "#ffffff", theme_color: ctx.colors[0], icons: [icon] }, null, 2); }
function favicon(ctx) { return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="22" fill="${ctx.colors[0]}"/><circle cx="68" cy="32" r="18" fill="${ctx.colors[2]}"/><text x="50" y="62" text-anchor="middle" font-family="Arial" font-size="42" font-weight="800" fill="${textColor(ctx.colors[0])}">${esc(ctx.biz[0]||"W")}</text></svg>`; }
function ogImage(ctx) { return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630"><rect width="1200" height="630" fill="${ctx.colors[0]}"/><circle cx="980" cy="120" r="220" fill="${ctx.colors[2]}" opacity=".75"/><text x="80" y="300" font-family="Arial" font-size="82" font-weight="800" fill="${textColor(ctx.colors[0])}">${esc(ctx.biz)}</text><text x="84" y="380" font-family="Arial" font-size="34" fill="${textColor(ctx.colors[0])}" opacity=".82">${esc(ctx.tagline||ctx.data.sub)}</text></svg>`; }
function launchKitFiles(ctx) {
  return {
    "launch-kit/copy-checklist.md": `# Copy checklist\n\n- Homepage headline names the customer and result.\n- CTA uses: ${ctx.cta}.\n- Each service card explains outcome, audience, and next step.\n- FAQ answers pricing, timeline, preparation, and support.\n- Comparison page stays fair and specific.\n`,
    "launch-kit/content-prompts.md": `# Content prompts\n\n## Homepage\nI help [audience] achieve [result] without [pain].\n\n## About\nWe started ${ctx.biz} because [problem]. Today we help [audience] by [solution].\n\n## Proof\nAdd numbers, testimonials, certifications, before/after examples, or case studies.\n`,
    "launch-kit/image-replacement-guide.md": `# Image replacement guide\n\nThis starter uses stable Picsum URLs for demo impact. Replace them with real images before launch. Keep similar aspect ratios: hero 900x650, cards 600x380, blog 600x360.\n`,
    "launch-kit/seo-checklist.md": `# SEO checklist\n\n- If you entered a domain in the generator, canonical, robots.txt, sitemap.xml, and schema URLs already use it. If not, replace example.com after deployment.\n- Write a unique meta description per page.\n- Rename image alt text to match real images.\n- Submit sitemap.xml after deployment.\n`,
    "launch-kit/deployment-guide.md": deployGuide(ctx)
  };
}
function deployGuide(ctx) { return `# Deployment guide

This website is plain HTML, CSS, and JavaScript. You can host it on any static hosting service.

## Option 1 - GitHub Pages, browser-only upload

Official GitHub Pages quickstart:
https://docs.github.com/pages/quickstart

Official guide for choosing the publishing source:
https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site

### Step-by-step

1. Create or sign in to your GitHub account:
   https://github.com

2. Create a new repository:
   https://github.com/new

3. Repository name options:
   - For a personal main site, use: your-username.github.io
   - For a project/business site, use any name, for example: ${slugify(ctx.biz)}-website

4. Keep the repository public if you are on GitHub Free and want GitHub Pages to publish normally.

5. Click Create repository.

6. Open your newly created repository and click Add file > Upload files.

7. Drag the CONTENTS of this generated website folder into GitHub.
   Important: index.html must be at the top level of the repository, not inside another nested folder.

8. Click Commit changes.

9. Go to Settings > Pages.

10. Under Build and deployment, choose:
    - Source: Deploy from a branch
    - Branch: main
    - Folder: / root

11. Click Save.

12. Wait 1-3 minutes. Your site URL will appear on the same Pages settings screen.

### Expected URLs

Personal main site:
https://your-username.github.io

Project/business repository site:
https://your-username.github.io/repository-name/

## Option 2 - GitHub Desktop

GitHub Desktop download:
https://desktop.github.com

1. Create a new repository in GitHub Desktop.
2. Copy all generated website files into the repository folder.
3. Commit the files.
4. Publish the repository to GitHub.
5. In the GitHub website, open the repository Settings > Pages.
6. Set Source to Deploy from a branch, Branch to main, Folder to / root.

## Custom domain

Official custom domain guide:
https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site

Managing a custom domain:
https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site

Verifying your domain is recommended to prevent domain takeover issues:
https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/verifying-your-custom-domain-for-github-pages

### Simple custom-domain checklist

1. Buy or use a domain you already own.
2. In GitHub, open your repository > Settings > Pages.
3. Add your custom domain in the Custom domain field.
4. Update your DNS records at your domain provider according to GitHub's custom-domain guide.
5. Enable Enforce HTTPS after GitHub verifies the domain.

## After deployment

- If you entered your domain in the generator, canonical, robots.txt, sitemap.xml, and schema data already use it. If not, replace every example.com URL after deployment.
- Test the main CTA: ${ctx.cta}.
- Open these URLs in your browser after publishing:
  - /robots.txt
  - /sitemap.xml
  - /404.html
- Submit sitemap.xml to Google Search Console when the real domain is ready:
  https://search.google.com/search-console
`; }
function readme(ctx) { return `# ${ctx.biz} Website Starter Kit

Open index.html in your browser.

## Included
- External CSS and JS
- Mobile navigation
- Dark-mode toggle, light and dark theme variables
- SEO meta tags
- Schema.org JSON-LD
- robots.txt and sitemap.xml
- uploaded logo used in header and favicon when provided; fallback favicon and OG image SVG
- Contact page with selected form behavior: ${ctx.formMode}
- Comparison page: compare.html
- Launch kit folder
- Goal: ${ctx.goal.name}
- CTA: ${ctx.cta}
- Product / payment link: ${ctx.productPaymentUrl || "Not provided"}
- Brand voice: ${ctx.voiceKey}
- Layout: ${ctx.layoutKey}
- Design style: ${ctx.styleKey}
- Trust section: ${ctx.trustStyle}

## Deploy to GitHub Pages

Full step-by-step instructions are in:
launch-kit/deployment-guide.md

Helpful official links:
- GitHub Pages quickstart: https://docs.github.com/pages/quickstart
- Configure publishing source: https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site
- Create a new GitHub repository: https://github.com/new

Fast path:
1. Create a repository at https://github.com/new
2. Upload the contents of this folder. Make sure index.html is at the repository root.
3. Go to repository Settings > Pages.
4. Choose Deploy from a branch, main, / root.
5. Wait for GitHub to show your live Pages URL.

## Replace before publishing
- Placeholder copy
- Picsum image URLs
- Contact information
- Legal pages
- Canonical, sitemap, robots, and schema URLs. If you entered a domain, they already use it. Otherwise they use https://example.com as a safe placeholder
`; }


function selectedOptions() {
  return { faq: checked("page-faq"), pricing: checked("page-pricing"), blog: checked("page-blog"), thanks: checked("page-thanks"), notFound: checked("page-404") };
}

function buildContext(biz, industry, tagline, colors) {
  const goalKey = valueOf("website-goal");
  const voiceKey = valueOf("brand-voice");
  const lang = valueOf("site-language", "en");
  const rawCta = chooseCTA(goalKey, valueOf("primary-cta"));
  const dataSource = lang === "he" ? HEBREW_INDUSTRIES : INDUSTRIES;
  const goalSource = lang === "he" ? HEBREW_GOALS : GOALS;
  const voiceSource = lang === "he" ? HEBREW_VOICES : VOICES;
  const ctx = {
    biz, industry, tagline, colors, goalKey, voiceKey, lang,
    hebrewFont: lang === "he" ? chooseHebrewSiteFont(industry) : null,
    logo: logoAsset(uploadedLogoFile),
    local: localDetails(biz),
    socials: socialDetails(),
    analytics: analyticsOptions(),
    mainHeadline: valueOf("main-headline").trim(),
    aboutText: valueOf("about-text").trim(),
    ctaUrl: normalizeOptionalUrl(valueOf("custom-cta-url")),
    productPaymentUrl: normalizeOptionalUrl(valueOf("product-payment-url")),
    siteUrl: normalizeDomainUrl(valueOf("site-domain")),
    siteType: valueOf("website-type", "full"),
    styleKey: chooseStyle(industry, valueOf("design-style")),
    layoutKey: chooseLayout(industry, valueOf("home-layout", "auto")),
    trustStyle: chooseTrust(valueOf("trust-style")),
    imagePersonality: chooseImagePersonality(industry, valueOf("image-personality", "auto")),
    data: pick(dataSource, industry),
    slug: slugify(biz),
    goal: goalSource[goalKey] || goalSource.leads,
    voice: voiceSource[voiceKey] || voiceSource.professional,
    formMode: valueOf("form-mode"),
    options: selectedOptions()
  };
  ctx.cta = ctaForLang(ctx, rawCta);
  return ctx;
}

function generatedPages(ctx) {
  if (ctx.siteType === "onepage") {
    return [
      ["index.html", onePage(ctx)],
      ctx.options.thanks && ["thank-you.html", thanksPage(ctx)],
      ctx.options.notFound && ["404.html", notFoundPage(ctx)]
    ].filter(Boolean);
  }
  return [
    ["index.html", homePage(ctx)],
    ["about.html", aboutPage(ctx)],
    ["services.html", servicesPage(ctx)],
    ctx.options.pricing && ["pricing.html", pricingPage(ctx)],
    ctx.options.faq && ["faq.html", faqPage(ctx)],
    ctx.options.blog && ["blog.html", blogPage(ctx)],
    ["compare.html", comparePage(ctx)],
    ["contact.html", contactPage(ctx)],
    ctx.options.thanks && ["thank-you.html", thanksPage(ctx)],
    ctx.options.notFound && ["404.html", notFoundPage(ctx)]
  ].filter(Boolean);
}


function projectConfig(ctx) {
  return {
    version: "1.0",
    exportedAt: new Date().toISOString(),
    generator: "Make me a website",
    business: {
      name: ctx.biz,
      slug: ctx.slug,
      industry: ctx.industry,
      tagline: ctx.tagline,
      mainHeadline: ctx.mainHeadline || null,
      aboutText: ctx.aboutText || null,
      language: ctx.lang,
      direction: dirOf(ctx),
      domainUrl: ctx.siteUrl,
      logo: ctx.logo ? { filename: ctx.logo.filename, href: ctx.logo.href, mimeType: ctx.logo.mimeType || null } : null
    },
    strategy: {
      websiteType: ctx.siteType,
      goal: ctx.goalKey,
      primaryCta: ctx.cta,
      customCtaUrl: ctx.ctaUrl || null,
      productPaymentUrl: ctx.productPaymentUrl || null,
      brandVoice: ctx.voiceKey
    },
    styling: {
      colors: {
        background: ctx.colors[0],
        primary: ctx.colors[1],
        secondary: ctx.colors[2],
        accent: ctx.colors[3]
      },
      designStyle: ctx.styleKey,
      layout: ctx.layoutKey,
      trustSection: ctx.trustStyle,
      imagePersonality: ctx.imagePersonality,
      hebrewFont: ctx.hebrewFont ? ctx.hebrewFont.name : null
    },
    localBusiness: ctx.local,
    socialLinks: ctx.socials,
    analytics: ctx.analytics,
    generatedFiles: generatedPages(ctx).map(([path]) => path).concat([
      "assets/css/style.css",
      "assets/js/main.js",
      "assets/img/favicon.svg",
      "assets/img/og-image.svg",
      "legal/privacy-policy.html",
      "legal/terms-of-usage.html",
      "legal/cookie-policy.html",
      "robots.txt",
      "sitemap.xml",
      "site.webmanifest",
      "README.md"
    ]),
    options: ctx.options,
    notes: [
      "This file captures the generator choices used to create the website.",
      "It does not embed uploaded image binary data. The uploaded logo is saved separately in assets/img when provided."
    ]
  };
}

function pageUrl(ctx, path = "index.html") {
  return absoluteUrl(ctx, path);
}
function applyPageUrls(html, path, ctx) {
  const url = pageUrl(ctx, path);
  return html
    .replace(/<link rel="canonical" href="[^"]*">/, `<link rel="canonical" href="${url}">`)
    .replace(/<meta property="og:url" content="[^"]*">/, `<meta property="og:url" content="${url}">`);
}

function writeWebsiteZip(root, ctx) {
  generatedPages(ctx).forEach(([path, content]) => root.file(path, applyPageUrls(content, path, ctx)));
  root.folder("assets").folder("css").file("style.css", siteCSS(ctx));
  root.folder("assets").folder("js").file("main.js", siteJS());
  const imgFolder = root.folder("assets").folder("img");
  if (uploadedLogoFile && ctx.logo) imgFolder.file(ctx.logo.filename, uploadedLogoFile);
  imgFolder.file("favicon.svg", favicon(ctx));
  imgFolder.file("og-image.svg", ogImage(ctx));
  const legal = root.folder("legal");
  legal.file("privacy-policy.html", applyPageUrls(legalPage(ctx,"privacy"), "legal/privacy-policy.html", ctx));
  legal.file("terms-of-usage.html", applyPageUrls(legalPage(ctx,"terms"), "legal/terms-of-usage.html", ctx));
  legal.file("cookie-policy.html", applyPageUrls(legalPage(ctx,"cookies"), "legal/cookie-policy.html", ctx));
  root.file("robots.txt", `User-agent: *\nAllow: /\nSitemap: ${absoluteUrl(ctx, "sitemap.xml")}\n`);
  root.file("sitemap.xml", sitemap(ctx));
  root.file("site.webmanifest", manifest(ctx));
  root.file(".nojekyll", "");
  root.file("site-config.json", JSON.stringify(projectConfig(ctx), null, 2));
  root.file("README.md", readme(ctx));
  Object.entries(launchKitFiles(ctx)).forEach(([path, content]) => root.file(path, content));
}

function downloadBlob(blob, filename) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 12000);
}

async function generateSite() {
  clearAlerts();
  const ctx = validContextFromForm(true);
  if (!ctx) return;
  const btn = $("gen-btn");
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Generating...';
  try {
    await runGenerationSteps(true);
    const zip = new JSZip();
    const root = zip.folder(`${ctx.slug}-website`);
    writeWebsiteZip(root, ctx);
    const blob = await zip.generateAsync({ type: "blob", compression: "DEFLATE", compressionOptions: { level: 6 } });
    downloadBlob(blob, `${ctx.slug}-website.zip`);
    const iframe = $("site-preview");
    if (iframe) iframe.srcdoc = previewPage(ctx);
    updateQualityScore(ctx);
    showSuccess();
  } catch (err) {
    showError("Something went wrong: " + err.message);
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<span aria-hidden="true">⬇</span> Generate & Download Website ZIP';
  }
}
