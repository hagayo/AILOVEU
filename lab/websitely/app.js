const PALETTES = [
  { name: "Ocean Signal", colors: ["#0f172a", "#2563eb", "#38bdf8"] },
  { name: "Forest Gold", colors: ["#12372a", "#436850", "#f5c542"] },
  { name: "Ink Coral", colors: ["#111827", "#334155", "#fb7185"] },
  { name: "Desert Luxe", colors: ["#2b2118", "#a16207", "#facc15"] },
  { name: "Mint Charcoal", colors: ["#1f2937", "#10b981", "#f59e0b"] },
  { name: "Lavender Tech", colors: ["#1e1b4b", "#7c3aed", "#c4b5fd"] },
  { name: "Warm Local", colors: ["#3f2e2a", "#c76f42", "#f2b880"] },
  { name: "Blue Steel", colors: ["#0b1220", "#475569", "#60a5fa"] },
  { name: "Wellness Sage", colors: ["#243528", "#6b8f71", "#d8c3a5"] }
];

const DESIGN_STYLES = {
  modern: { radius: "18px", sectionPad: "5.5rem", shadow: "0 18px 45px rgba(15,23,42,.09)", heroClass: "hero-modern", fontHead: "Inter, ui-sans-serif, system-ui, sans-serif", fontBody: "Inter, ui-sans-serif, system-ui, sans-serif" },
  bold: { radius: "26px", sectionPad: "6.2rem", shadow: "0 24px 70px rgba(15,23,42,.16)", heroClass: "hero-bold", fontHead: "Inter, ui-sans-serif, system-ui, sans-serif", fontBody: "Inter, ui-sans-serif, system-ui, sans-serif" },
  luxury: { radius: "4px", sectionPad: "7rem", shadow: "0 10px 30px rgba(0,0,0,.05)", heroClass: "hero-luxury", fontHead: "Georgia, 'Times New Roman', serif", fontBody: "Inter, ui-sans-serif, system-ui, sans-serif" },
  friendly: { radius: "22px", sectionPad: "4.8rem", shadow: "0 16px 36px rgba(15,23,42,.08)", heroClass: "hero-friendly", fontHead: "Trebuchet MS, Inter, system-ui, sans-serif", fontBody: "Inter, ui-sans-serif, system-ui, sans-serif" },
  creative: { radius: "32px", sectionPad: "6rem", shadow: "0 26px 80px rgba(15,23,42,.15)", heroClass: "hero-creative", fontHead: "Impact, Inter, system-ui, sans-serif", fontBody: "Inter, ui-sans-serif, system-ui, sans-serif" },
  wellness: { radius: "28px", sectionPad: "5.2rem", shadow: "0 14px 38px rgba(15,23,42,.06)", heroClass: "hero-wellness", fontHead: "Georgia, 'Times New Roman', serif", fontBody: "Inter, ui-sans-serif, system-ui, sans-serif" },
  corporate: { radius: "10px", sectionPad: "5rem", shadow: "0 10px 28px rgba(15,23,42,.07)", heroClass: "hero-corporate", fontHead: "Inter, ui-sans-serif, system-ui, sans-serif", fontBody: "Inter, ui-sans-serif, system-ui, sans-serif" }
};

const INDUSTRIES = {
  technology: { hero: "Software that moves faster than meetings.", sub: "Modern tools, automation, and digital products for teams that need momentum.", nav: ["Platform", "Pricing", "Resources", "Contact"], sections: ["Platform", "Automation", "Integrations", "Security"], type: "SoftwareApplication", foot: "Build better systems." },
  healthcare: { hero: "Care designed around people.", sub: "Trusted healthcare services with a calmer, clearer patient experience.", nav: ["Services", "Team", "FAQ", "Contact"], sections: ["Care Services", "Specialists", "Patient Resources", "Appointments"], type: "MedicalBusiness", foot: "Better care, every day." },
  finance: { hero: "Confidence for every decision.", sub: "Practical financial and legal guidance for individuals and growing businesses.", nav: ["Services", "Pricing", "FAQ", "Contact"], sections: ["Advisory", "Planning", "Compliance", "Reports"], type: "FinancialService", foot: "Trusted guidance." },
  retail: { hero: "Products people remember.", sub: "A sharp shopping experience for modern brands, stores, and makers.", nav: ["Shop", "Collections", "Reviews", "Contact"], sections: ["Collections", "New Arrivals", "Customer Favorites", "Shipping"], type: "Store", foot: "Made to be loved." },
  food: { hero: "Flavor with a fan club.", sub: "Fresh, memorable food experiences crafted for real people and hungry calendars.", nav: ["Menu", "Reservations", "Gallery", "Contact"], sections: ["Menu Highlights", "Catering", "Reservations", "Location"], type: "Restaurant", foot: "Served with heart." },
  education: { hero: "Learning that actually sticks.", sub: "Programs, courses, and training experiences that turn curiosity into capability.", nav: ["Courses", "Programs", "Pricing", "Contact"], sections: ["Courses", "Programs", "Mentors", "Outcomes"], type: "EducationalOrganization", foot: "Learn forward." },
  creative: { hero: "Ideas with fingerprints.", sub: "Brand, design, and media work for people who refuse to look generic.", nav: ["Work", "Services", "Studio", "Contact"], sections: ["Selected Work", "Creative Direction", "Production", "Brand Systems"], type: "ProfessionalService", foot: "Make it unforgettable." },
  realestate: { hero: "Find the place that fits your life.", sub: "Property guidance for buyers, sellers, renters, and investors.", nav: ["Properties", "Sell", "Agents", "Contact"], sections: ["Featured Properties", "Selling", "Neighborhoods", "Agents"], type: "RealEstateAgent", foot: "Move with confidence." },
  hospitality: { hero: "Stay somewhere worth remembering.", sub: "Beautiful experiences, warm service, and the small details that make trips feel effortless.", nav: ["Rooms", "Dining", "Experiences", "Book"], sections: ["Rooms", "Dining", "Experiences", "Offers"], type: "Hotel", foot: "Hospitality with soul." },
  fitness: { hero: "Stronger starts here.", sub: "Programs, coaching, and routines built for real progress.", nav: ["Classes", "Plans", "Trainers", "Join"], sections: ["Programs", "Coaching", "Nutrition", "Results"], type: "FitnessCenter", foot: "Move better." },
  ngo: { hero: "Change needs a home base.", sub: "A clear, credible website for missions, communities, and measurable impact.", nav: ["Mission", "Impact", "Volunteer", "Donate"], sections: ["Mission", "Programs", "Impact", "Get Involved"], type: "NGO", foot: "Purpose in motion." },
  construction: { hero: "Built clean. Built strong. Built once.", sub: "Reliable construction and manufacturing services for demanding projects.", nav: ["Services", "Projects", "Safety", "Contact"], sections: ["Services", "Projects", "Process", "Safety"], type: "LocalBusiness", foot: "Built to last." },
  other: { hero: "A sharper home for your business.", sub: "A complete starter website that looks polished before the first edit.", nav: ["Services", "Pricing", "FAQ", "Contact"], sections: ["What We Do", "How It Works", "Why Us", "Testimonials"], type: "Organization", foot: "Ready for what is next." }
};

const GOALS = {
  leads: { name: "Get leads", cta: "Get a quote", hero: "Turn interest into qualified conversations.", focus: "Lead-focused sections repeat the offer, proof, and contact path so visitors know exactly what to do next." },
  bookings: { name: "Book appointments", cta: "Book a call", hero: "Make booking the obvious next step.", focus: "Booking-focused pages highlight availability, simple steps, and fast response expectations." },
  credibility: { name: "Build credibility", cta: "Start a conversation", hero: "Look established before the first handshake.", focus: "Credibility-focused pages emphasize trust, credentials, process, testimonials, and clear proof." },
  portfolio: { name: "Show portfolio", cta: "View portfolio", hero: "Let the work do the talking.", focus: "Portfolio-focused pages bring visuals, case studies, and project outcomes closer to the top." },
  sales: { name: "Sell products or packages", cta: "Shop now", hero: "Make the offer easy to understand and easy to buy.", focus: "Sales-focused pages emphasize products, packages, pricing, and purchase-ready calls to action." },
  donations: { name: "Collect donations", cta: "Donate now", hero: "Turn belief into action.", focus: "Donation-focused pages make impact visible and the donation path simple." },
  event: { name: "Promote an event", cta: "Reserve now", hero: "Give people a reason to show up.", focus: "Event-focused pages surface dates, benefits, schedule, location, and registration CTAs." },
  hiring: { name: "Hire employees", cta: "Apply now", hero: "Attract people who want to build with you.", focus: "Hiring-focused pages highlight culture, values, open roles, and application next steps." }
};

const VOICES = {
  professional: { opener: "Practical, polished, and ready for real customers.", ctaLine: "Let us discuss the right next step for your goals.", adjective: "reliable" },
  friendly: { opener: "Helpful service from people who care about the details.", ctaLine: "Tell us what you need. We will help you figure out the rest.", adjective: "approachable" },
  bold: { opener: "Built for teams that want momentum, not more meetings.", ctaLine: "Ready to move faster? Let us make the next step obvious.", adjective: "decisive" },
  luxury: { opener: "Quiet excellence, shaped with attention to every detail.", ctaLine: "Begin with a conversation. The details follow.", adjective: "refined" },
  playful: { opener: "Useful, memorable, and allergic to boring websites.", ctaLine: "Bring the idea. We will bring the good kind of trouble.", adjective: "memorable" },
  technical: { opener: "Clear systems, measurable outcomes, and fewer loose ends.", ctaLine: "Share the requirements and we will map the path.", adjective: "precise" },
  calm: { opener: "A clear path, a steady process, and no unnecessary noise.", ctaLine: "Start simply. We will guide the next step.", adjective: "focused" }
};


const HEBREW_INDUSTRIES = {
  technology: { hero: "תוכנה שזזה מהר יותר מישיבות.", sub: "כלים מודרניים, אוטומציה ומוצרים דיגיטליים לצוותים שרוצים להתקדם.", nav: ["פלטפורמה", "מחירים", "מאמרים", "צור קשר"], sections: ["פלטפורמה", "אוטומציה", "אינטגרציות", "אבטחה"], type: "SoftwareApplication", foot: "בונים מערכות טובות יותר." },
  healthcare: { hero: "טיפול שמתחיל באנשים.", sub: "שירותי בריאות אמינים עם חוויית מטופל רגועה וברורה יותר.", nav: ["שירותים", "צוות", "שאלות", "צור קשר"], sections: ["שירותי טיפול", "מומחים", "מידע למטופלים", "תורים"], type: "MedicalBusiness", foot: "טיפול טוב יותר, כל יום." },
  finance: { hero: "ביטחון בכל החלטה.", sub: "ליווי פיננסי ומשפטי מעשי לאנשים ולעסקים בצמיחה.", nav: ["שירותים", "מחירים", "שאלות", "צור קשר"], sections: ["ייעוץ", "תכנון", "ציות", "דוחות"], type: "FinancialService", foot: "ליווי שאפשר לסמוך עליו." },
  retail: { hero: "מוצרים שאנשים זוכרים.", sub: "חוויית קנייה חדה למותגים, חנויות ויוצרים מודרניים.", nav: ["חנות", "קולקציות", "ביקורות", "צור קשר"], sections: ["קולקציות", "חדש באתר", "מועדפים", "משלוחים"], type: "Store", foot: "נוצר כדי שיאהבו אותו." },
  food: { hero: "טעם עם קהל מעריצים.", sub: "חוויות אוכל טריות וזכירות לאנשים אמיתיים וליומנים רעבים.", nav: ["תפריט", "הזמנות", "גלריה", "צור קשר"], sections: ["מנות מובילות", "קייטרינג", "הזמנות", "מיקום"], type: "Restaurant", foot: "מוגש מכל הלב." },
  education: { hero: "למידה שבאמת נשארת.", sub: "קורסים ותוכניות שהופכים סקרנות ליכולת אמיתית.", nav: ["קורסים", "תוכניות", "סגל", "הרשמה"], sections: ["קורסים", "תוכניות", "מנטורים", "בוגרים"], type: "EducationalOrganization", foot: "ידע שמניע קדימה." },
  creative: { hero: "רעיונות שנראים בלתי אפשריים להתעלם מהם.", sub: "עבודה יצירתית למותגים שרוצים להיראות, להישמע ולהיזכר.", nav: ["עבודות", "שירותים", "סטודיו", "צור קשר"], sections: ["עבודות נבחרות", "מיתוג", "קמפיינים", "תוכן"], type: "ProfessionalService", foot: "רעיונות עם נוכחות." },
  realestate: { hero: "המקום הנכון מתחיל כאן.", sub: "שירותי נדל״ן ברורים לקונים, מוכרים ומשקיעים.", nav: ["נכסים", "מכירה", "סוכנים", "צור קשר"], sections: ["נכסים מובילים", "שירותי מכירה", "הצוות", "מדריך אזורים"], type: "RealEstateAgent", foot: "הבית שלכם, המומחיות שלנו." },
  hospitality: { hero: "חוויה שנשארת אחרי הצ׳ק-אאוט.", sub: "אירוח נעים, מוקפד וזכיר לכל אורח.", nav: ["חדרים", "חוויות", "הצעות", "הזמנה"], sections: ["חדרים", "אוכל", "חוויות", "הטבות"], type: "Hotel", foot: "יוצרים רגעים טובים." },
  fitness: { hero: "להתחזק בלי להתחיל מחדש כל פעם.", sub: "אימונים, ליווי ותוכניות שבנויות לתוצאות אמיתיות.", nav: ["שיעורים", "מאמנים", "מסלולים", "הצטרפות"], sections: ["תוכניות", "אימון אישי", "תזונה", "סיפורי הצלחה"], type: "FitnessCenter", foot: "חזקים יותר, כל יום." },
  ngo: { hero: "שינוי מתחיל בצעד ברור.", sub: "פעילות קהילתית עם אימפקט שאפשר לראות ולהרגיש.", nav: ["משימה", "פרויקטים", "התנדבות", "תרומה"], sections: ["המשימה", "פרויקטים", "אימפקט", "הצטרפות"], type: "NGO", foot: "עושים טוב ביחד." },
  construction: { hero: "בנוי לעמוד במבחן הזמן.", sub: "בנייה, ייצור וביצוע מדויק לפרויקטים רציניים.", nav: ["שירותים", "פרויקטים", "תהליך", "צור קשר"], sections: ["שירותים", "פרויקטים", "תהליך", "בטיחות"], type: "LocalBusiness", foot: "חוזק בכל פרט." },
  other: { hero: "עושים עבודה שאפשר לסמוך עליה.", sub: "שירות ברור, מקצועי וממוקד תוצאה.", nav: ["שירותים", "אודות", "עבודות", "צור קשר"], sections: ["מה אנחנו עושים", "הגישה שלנו", "תוצאות", "לקוחות"], type: "Organization", foot: "מצוינות, כל יום." }
};

const HEBREW_GOALS = {
  leads: { name: "קבלת לידים", cta: "קבלו הצעת מחיר", hero: "להפוך מבקרים לפניות אמיתיות.", focus: "אתר שמוביל את המבקר לצעד הבא בצורה ברורה ומהירה." },
  bookings: { name: "קביעת פגישות", cta: "קבעו שיחה", hero: "להפוך קביעת פגישה לצעד הטבעי הבא.", focus: "הדף מדגיש זמינות, תהליך פשוט וציפייה למענה מהיר." },
  credibility: { name: "בניית אמון", cta: "בואו נדבר", hero: "להיראות מבוססים עוד לפני השיחה הראשונה.", focus: "האתר מדגיש אמון, תהליך, הוכחות, המלצות וניסיון." },
  portfolio: { name: "הצגת תיק עבודות", cta: "צפו בעבודות", hero: "לתת לעבודה לדבר.", focus: "האתר שם ויזואליות, פרויקטים ותוצאות בחזית." },
  sales: { name: "מכירת מוצרים או חבילות", cta: "לקנייה", hero: "להפוך את ההצעה לברורה וקלה לרכישה.", focus: "האתר מדגיש מוצרים, חבילות, מחירים וקריאות לפעולה." },
  donations: { name: "איסוף תרומות", cta: "תרמו עכשיו", hero: "להפוך אמונה לפעולה.", focus: "האתר מציג אימפקט ומקל על תהליך התרומה." },
  event: { name: "קידום אירוע", cta: "שריינו מקום", hero: "לתת לאנשים סיבה להגיע.", focus: "האתר מציג תאריך, ערך, לו״ז, מיקום והרשמה." },
  hiring: { name: "גיוס עובדים", cta: "הגישו מועמדות", hero: "למשוך אנשים שרוצים לבנות איתכם.", focus: "האתר מציג תרבות, ערכים, תפקידים פתוחים וצעד הבא ברור." }
};

const HEBREW_VOICES = {
  professional: { opener: "מקצועי, ברור ומוכן ללקוחות אמיתיים.", ctaLine: "בואו נדבר על הצעד הנכון למטרות שלכם.", adjective: "אמין" },
  friendly: { opener: "שירות אנושי מאנשים שאכפת להם מהפרטים.", ctaLine: "ספרו לנו מה אתם צריכים, ונעזור להבין את הצעד הבא.", adjective: "נגיש" },
  bold: { opener: "בנוי לאנשים שרוצים תנועה, לא עוד ישיבות.", ctaLine: "מוכנים לזוז מהר יותר? בואו נעשה את הצעד הבא ברור.", adjective: "חד" },
  luxury: { opener: "מצוינות שקטה, עם תשומת לב לכל פרט.", ctaLine: "מתחילים בשיחה. הפרטים יבואו אחר כך.", adjective: "יוקרתי" },
  playful: { opener: "שימושי, זכיר ואלרגי לאתרים משעממים.", ctaLine: "תביאו את הרעיון. אנחנו נביא את האנרגיה.", adjective: "זכיר" },
  technical: { opener: "מערכות ברורות, תוצאות מדידות ופחות קצוות פתוחים.", ctaLine: "שלחו את הדרישות ונמפה את הדרך.", adjective: "מדויק" },
  calm: { opener: "דרך ברורה, תהליך יציב ובלי רעש מיותר.", ctaLine: "מתחילים פשוט. אנחנו נוביל את הצעד הבא.", adjective: "ממוקד" }
};

const UI_TEXT = {
  en: {
    skip:"Skip to content", navLabel:"Main navigation", dark:"Dark", light:"Light", openMenu:"Open navigation menu", closeMenu:"Close navigation menu",
    home:"Home", about:"About", services:"Services", pricing:"Pricing", faq:"FAQ", blog:"Blog", compare:"Compare", contact:"Contact", company:"Company", resources:"Resources", legal:"Legal", privacy:"Privacy", terms:"Terms", cookies:"Cookies", rights:"All rights reserved", explore:"Explore services",
    websiteGoal:"Website goal", whatWeDo:"What we do", clearOffers:"Clear offers, better proof, and a next step that is hard to miss.", servicesKicker:"Services", contactDetails:"Contact details", email:"Email", phone:"Phone", serviceArea:"Service area", address:"Address", hours:"Hours", name:"Name", subject:"Subject", message:"Message",
    pricingHead:"Simple pricing that gives people a starting point.", pricingLead:"Replace these packages with real offers, ranges, or a request-a-quote model.", faqHead:"Questions customers ask before saying yes.", faqLead:"Answer with specifics: timeline, pricing model, requirements, guarantees, and response time.", blogHead:"Useful articles that can support SEO and trust.", blogLead:"Use posts for educational content, case studies, customer questions, and updates.", onePageHead:"Everything visitors need on one focused page.", onePageLead:"Designed for speed: proof, offer, pricing cues, comparison, FAQ, and contact stay close together.",
    thankYou:"Thank you!", messageReceived:"Message received", thanksText:"Your message has been received. We will get back to you soon.", backHome:"Back to homepage", pageNotFound:"Page not found", lost:"Oops. This page wandered off.", lostText:"The page you are looking for may have moved, changed, or joined a startup."
  },
  he: {
    skip:"דילוג לתוכן", navLabel:"ניווט ראשי", dark:"כהה", light:"בהיר", openMenu:"פתחו תפריט ניווט", closeMenu:"סגרו תפריט ניווט",
    home:"בית", about:"אודות", services:"שירותים", pricing:"מחירים", faq:"שאלות", blog:"בלוג", compare:"השוואה", contact:"צור קשר", company:"חברה", resources:"משאבים", legal:"משפטי", privacy:"פרטיות", terms:"תנאי שימוש", cookies:"עוגיות", rights:"כל הזכויות שמורות", explore:"גלו שירותים",
    websiteGoal:"מטרת האתר", whatWeDo:"מה אנחנו עושים", clearOffers:"הצעות ברורות, הוכחות טובות וצעד הבא שקשה לפספס.", servicesKicker:"שירותים", contactDetails:"פרטי התקשרות", email:"אימייל", phone:"טלפון", serviceArea:"אזור שירות", address:"כתובת", hours:"שעות פעילות", name:"שם", subject:"נושא", message:"הודעה",
    pricingHead:"מחירים פשוטים שנותנים נקודת פתיחה.", pricingLead:"החליפו את החבילות בהצעות אמיתיות, טווחי מחיר או מודל של בקשת הצעת מחיר.", faqHead:"שאלות שלקוחות שואלים לפני שהם אומרים כן.", faqLead:"ענו בצורה ספציפית: זמנים, מודל תמחור, דרישות, אחריות וזמן תגובה.", blogHead:"מאמרים שימושיים שמחזקים אמון וקידום אורגני.", blogLead:"השתמשו בפוסטים לתוכן לימודי, מקרי בוחן, שאלות לקוחות ועדכונים.", onePageHead:"כל מה שמבקרים צריכים בעמוד אחד ממוקד.", onePageLead:"נבנה למהירות: הוכחה, הצעה, מחירים, השוואה, שאלות ויצירת קשר נשארים קרובים.",
    thankYou:"תודה!", messageReceived:"ההודעה התקבלה", thanksText:"ההודעה שלכם התקבלה. נחזור אליכם בקרוב.", backHome:"חזרה לדף הבית", pageNotFound:"העמוד לא נמצא", lost:"אופס. העמוד הזה יצא לטיול.", lostText:"העמוד שחיפשתם אולי עבר מקום, השתנה או הצטרף לסטארטאפ."
  }
};

const CTA_HE = { "Book a call":"קבעו שיחה", "Get a quote":"קבלו הצעת מחיר", "Start free":"התחילו בחינם", "Reserve now":"שריינו עכשיו", "Join now":"הצטרפו עכשיו", "Donate now":"תרמו עכשיו", "View portfolio":"צפו בעבודות", "Shop now":"לקנייה", "Apply now":"הגישו מועמדות", "Start a conversation":"בואו נדבר" };

function isHebrew(ctx) { return ctx?.lang === "he"; }
function dirOf(ctx) { return isHebrew(ctx) ? "rtl" : "ltr"; }
function langOf(ctx) { return isHebrew(ctx) ? "he" : "en"; }
function txt(ctx, key) { return (UI_TEXT[langOf(ctx)] && UI_TEXT[langOf(ctx)][key]) || UI_TEXT.en[key] || key; }
function ctaForLang(ctx, raw) { return isHebrew(ctx) ? (CTA_HE[raw] || raw) : raw; }
function pageTitle(ctx, nameEn, nameHe) { return `${ctx.biz} - ${isHebrew(ctx) ? nameHe : nameEn}`; }

let activeTab = "presets";
let selectedPreset = PALETTES[0].colors;
let variationSeed = Math.floor(Math.random() * 100000);
let uploadedLogoFile = null;
let logoPreviewUrl = null;

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

document.addEventListener("DOMContentLoaded", () => {
  buildPresetGrid();
  bindTabs();
  bindColorInputs();
  bindLogoInput();
  bindPreviewControls();
  $("gen-btn").addEventListener("click", generateSite);
  $("preview-btn")?.addEventListener("click", () => renderPreview(true));
  $("regen-btn")?.addEventListener("click", () => { variationSeed = Math.floor(Math.random() * 100000); renderPreview(true); });
});

function bindLogoInput() {
  const input = $("logo-input");
  const wrap = $("logo-preview-wrap");
  const img = $("logo-preview");
  const name = $("logo-file-name");
  if (!input) return;
  input.addEventListener("change", () => {
    const file = input.files?.[0];
    if (logoPreviewUrl) URL.revokeObjectURL(logoPreviewUrl);
    logoPreviewUrl = null;
    uploadedLogoFile = null;
    if (!file) { if (wrap) wrap.hidden = true; return; }
    const ok = ["image/png", "image/jpeg", "image/svg+xml", "image/webp"].includes(file.type);
    if (!ok) { input.value = ""; if (wrap) wrap.hidden = true; showError("Please upload a PNG, JPG, SVG, or WebP logo."); return; }
    uploadedLogoFile = file;
    logoPreviewUrl = URL.createObjectURL(file);
    if (img) img.src = logoPreviewUrl;
    if (name) name.textContent = file.name;
    if (wrap) wrap.hidden = false;
      clearAlerts();
  });
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

function validContextFromForm(showMessages = true) {
  const biz = valueOf("biz-name").trim();
  const industry = valueOf("biz-industry");
  const tagline = valueOf("biz-tagline").trim();
  if (!biz) { if (showMessages) showError("Please enter a business name."); return null; }
  if (!industry) { if (showMessages) showError("Please select an industry."); return null; }
  const colors = getColors();
  if (!colors) { if (showMessages) showError(activeTab === "presets" ? "Please select a color preset." : "Please enter valid hex colors for all three colors."); return null; }
  return buildContext(biz, industry, tagline, colors);
}

function previewPage(ctx) {
  const previewCtx = { ...ctx, preview: true, logo: ctx.logo ? { ...ctx.logo, previewSrc: logoPreviewUrl } : null };
  const body = ctx.siteType === "onepage" ? onePageBody(previewCtx) : homeBody(previewCtx);
  return `<!DOCTYPE html><html lang="${langOf(previewCtx)}" dir="${dirOf(previewCtx)}"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><style>${siteCSS(previewCtx)}</style><script>${siteJS()}<\/script><title>${esc(ctx.biz)} preview</title></head><body>${nav(previewCtx)}<main id="main">${body}</main>${footer(previewCtx)}</body></html>`;
}

async function renderPreview(withSteps = false) {
  clearAlerts();
  const ctx = validContextFromForm(true);
  if (!ctx) return;
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
    item.className = "preset-opt" + (index === 0 ? " selected" : "");
    item.innerHTML = `<div class="preset-swatches">${p.colors.map(c => `<span style="background:${c}"></span>`).join("")}</div><div class="preset-name">${p.name}</div>`;
    item.addEventListener("click", () => {
      document.querySelectorAll(".preset-opt").forEach(el => el.classList.remove("selected"));
      item.classList.add("selected");
      selectedPreset = p.colors;
      clearAlerts();
    });
    grid.appendChild(item);
  });
}
function bindTabs() {
  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      activeTab = btn.dataset.tab;
      document.querySelectorAll(".tab-btn").forEach(b => {
        b.classList.toggle("active", b === btn);
        b.setAttribute("aria-selected", b === btn ? "true" : "false");
      });
      $("panel-manual").hidden = activeTab !== "manual";
      $("panel-presets").hidden = activeTab !== "presets";
      clearAlerts();
    });
  });
}
function bindColorInputs() {
  [["col1","hex1"],["col2","hex2"],["col3","hex3"]].forEach(([colorId, hexId]) => {
    const color = $(colorId);
    const hex = $(hexId);
    color.addEventListener("input", () => { hex.value = color.value; });
    hex.addEventListener("input", () => { if (/^#[0-9a-fA-F]{6}$/.test(hex.value)) color.value = hex.value; });
  });
}
function showError(msg) { const el = $("alert-error"); el.textContent = msg; el.classList.add("visible"); $("alert-success").classList.remove("visible"); }
function showSuccess() { $("alert-success").classList.add("visible"); $("alert-error").classList.remove("visible"); }
function clearAlerts() { $("alert-error").classList.remove("visible"); $("alert-success").classList.remove("visible"); }
function getColors() { if (activeTab === "presets") return selectedPreset; const colors = ["hex1", "hex2", "hex3"].map(id => $(id).value.trim()); return colors.every(v => /^#[0-9a-fA-F]{6}$/.test(v)) ? colors : null; }
function esc(s) { return String(s ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;"); }
function slugify(s) { return String(s || "site").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"") || "site"; }
function emailSlug(s) { return slugify(s).replace(/-/g, ""); }
function pick(map, key, fallback = "other") { return map[key] || map[fallback]; }
function chooseStyle(industry, selected) { return selected && selected !== "auto" ? selected : AUTO_STYLE_BY_INDUSTRY[industry] || "modern"; }
function chooseLayout(industry, selected) { return selected && selected !== "auto" ? selected : AUTO_LAYOUT_BY_INDUSTRY[industry] || "classic"; }
function chooseImagePersonality(industry, selected) { return selected && selected !== "auto" ? selected : AUTO_IMAGE_BY_INDUSTRY[industry] || "abstract"; }
function chooseTrust(selected) { return selected && selected !== "auto" ? selected : TRUST_STYLES[variationSeed % TRUST_STYLES.length]; }
function chooseCTA(goal, selected) { return selected && selected !== "auto" ? selected : (GOALS[goal] || GOALS.leads).cta; }
function luminance(hex) { const rgb = [1,3,5].map(i => parseInt(hex.slice(i,i+2),16) / 255).map(v => v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4)); return .2126 * rgb[0] + .7152 * rgb[1] + .0722 * rgb[2]; }
function textColor(bg) { return luminance(bg) > .32 ? "#111827" : "#ffffff"; }
function imageUrl(w, h, label, ctx = null) {
  const mood = ctx?.imagePersonality ? `${ctx.imagePersonality}-${IMAGE_PERSONALITIES[ctx.imagePersonality] || ""}` : "demo";
  return `https://picsum.photos/seed/${encodeURIComponent(mood + '-' + label + '-' + variationSeed)}/${w}/${h}`;
}
function updateQualityScore(ctx) {
  const items = Array.from(document.querySelectorAll("#quality-list li"));
  items.forEach(li => li.classList.add("done"));
  $("quality-score").textContent = "96 / 100";
  $("quality-summary").textContent = `${ctx.goal.name}, ${ctx.cta} CTA, ${ctx.voiceKey} voice, ${ctx.styleKey} style.`;
}

function cssVars(ctx) {
  const s = DESIGN_STYLES[ctx.styleKey];
  const [c1, c2, c3] = ctx.colors;
  return `:root{--brand-primary:${c1};--brand-secondary:${c2};--brand-accent:${c3};--on-primary:${textColor(c1)};--on-secondary:${textColor(c2)};--on-accent:${textColor(c3)};--bg:#ffffff;--surface:#f8fafc;--surface-strong:#eef2f7;--text:#111827;--muted:#64748b;--border:rgba(15,23,42,.12);--card:#ffffff;--nav-bg:rgba(255,255,255,.86);--footer-bg:#0f172a;--footer-text:#cbd5e1;--radius:${s.radius};--section-pad:${s.sectionPad};--shadow:${s.shadow};--font-head:${s.fontHead};--font-body:${s.fontBody}}\n[data-theme="dark"]{--bg:#0b1120;--surface:#111827;--surface-strong:#1f2937;--text:#f8fafc;--muted:#a7b2c3;--border:rgba(255,255,255,.14);--card:#111827;--nav-bg:rgba(15,23,42,.86);--footer-bg:#030712;--footer-text:#d1d5db}`;
}
function siteCSS(ctx) {
  return `${cssVars(ctx)}
*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;font-family:var(--font-body);color:var(--text);background:var(--bg);line-height:1.65}img{max-width:100%;display:block}a{color:inherit;text-decoration:none}.skip-link{position:absolute;left:-999px;top:auto;width:1px;height:1px;overflow:hidden}.skip-link:focus{left:1rem;top:1rem;width:auto;height:auto;background:var(--brand-accent);color:var(--on-accent);padding:.6rem 1rem;border-radius:999px;z-index:9999}.site-header{position:sticky;top:0;z-index:50;background:var(--nav-bg);backdrop-filter:blur(16px);border-bottom:1px solid var(--border)}.nav{max-width:1180px;margin:auto;min-height:72px;padding:0 1.25rem;display:flex;align-items:center;justify-content:space-between;gap:1rem}.brand{font-weight:900;letter-spacing:-.03em;color:var(--brand-primary);font-family:var(--font-head);font-size:1.2rem;display:inline-flex;align-items:center;gap:.6rem}.brand-logo{width:36px;height:36px;object-fit:contain;border-radius:9px;background:#fff;padding:2px;border:1px solid var(--border)}.nav-actions{display:flex;gap:.55rem;align-items:center}.nav-links{display:flex;gap:1.15rem;align-items:center}.nav-links a{font-size:.94rem;color:var(--text);font-weight:750;opacity:.86}.nav-links a:hover{opacity:1;color:var(--brand-secondary)}.btn,.nav-cta,.theme-toggle{display:inline-flex;align-items:center;justify-content:center;gap:.45rem;border-radius:999px;font-weight:850;border:0;cursor:pointer}.nav-cta,.btn-primary{background:var(--brand-accent);color:var(--on-accent);padding:.72rem 1.2rem;box-shadow:0 12px 30px rgba(0,0,0,.12)}.btn-secondary{border:1px solid currentColor;color:inherit;padding:.68rem 1.15rem}.theme-toggle,.menu-btn{background:transparent;border:1px solid var(--border);border-radius:999px;padding:.58rem .8rem;color:var(--text)}.menu-btn{display:none;border-radius:12px}main{overflow:hidden}.hero{position:relative;padding:calc(var(--section-pad) + 1rem) 1.25rem;color:var(--on-primary);background:linear-gradient(135deg,var(--brand-primary),var(--brand-secondary));}.hero::before{content:"";position:absolute;inset:0;background:radial-gradient(circle at 75% 15%,var(--brand-accent),transparent 30rem);opacity:.35}.hero-inner{position:relative;max-width:1180px;margin:auto;display:grid;grid-template-columns:1.05fr .95fr;gap:3rem;align-items:center}.hero-copy h1{font-family:var(--font-head);font-size:clamp(2.4rem,6vw,5rem);line-height:.98;letter-spacing:-.055em;margin:0 0 1.1rem}.hero-copy p{font-size:clamp(1.05rem,2vw,1.25rem);max-width:58ch;opacity:.9}.hero-actions{display:flex;gap:.9rem;flex-wrap:wrap;margin-top:1.7rem}.hero-media{border-radius:var(--radius);overflow:hidden;box-shadow:var(--shadow);transform:rotate(1.5deg);border:8px solid rgba(255,255,255,.14)}.hero-media img{width:100%;height:440px;object-fit:cover}.hero-bold{background:linear-gradient(135deg,var(--brand-primary),var(--brand-secondary) 55%,var(--brand-accent))}.hero-luxury .hero-copy h1{letter-spacing:-.02em}.hero-luxury{background:var(--brand-primary)}.hero-friendly{border-bottom-left-radius:60px;border-bottom-right-radius:60px}.hero-creative .hero-media{transform:rotate(-3deg) translateY(1rem)}.hero-wellness{background:linear-gradient(135deg,var(--brand-primary),var(--brand-secondary))}.hero-corporate{background:linear-gradient(135deg,var(--brand-primary),#1e293b)}.section{max-width:1180px;margin:auto;padding:var(--section-pad) 1.25rem}.section.alt{max-width:none;background:var(--surface)}.section.alt>.section-inner{max-width:1180px;margin:auto}.section-head{max-width:760px;margin-bottom:2.4rem}.kicker{color:var(--brand-secondary);font-weight:900;letter-spacing:.12em;text-transform:uppercase;font-size:.78rem}.section h1,.section h2{font-family:var(--font-head);font-size:clamp(1.8rem,4vw,3rem);line-height:1.08;letter-spacing:-.04em;margin:.4rem 0 .75rem}.section p.lead{color:var(--muted);font-size:1.08rem}.grid{display:grid;gap:1.4rem}.cards{grid-template-columns:repeat(3,minmax(0,1fr))}.card{background:var(--card);border:1px solid var(--border);border-radius:var(--radius);padding:1.5rem;box-shadow:var(--shadow)}.card img{border-radius:calc(var(--radius) - 6px);height:190px;width:100%;object-fit:cover;margin-bottom:1rem}.icon{width:48px;height:48px;border-radius:16px;background:rgba(249,115,22,.12);display:grid;place-items:center;margin-bottom:.9rem}.card h3{font-size:1.1rem;margin:.2rem 0 .45rem}.card p{color:var(--muted);margin:0}.trust{max-width:1180px;margin:-2.3rem auto 0;position:relative;z-index:5;background:var(--card);border:1px solid var(--border);border-radius:var(--radius);box-shadow:var(--shadow);padding:1.2rem;display:grid;gap:1rem}.trust.grid4{grid-template-columns:repeat(4,1fr);text-align:center}.trust strong{font-size:1.55rem;color:var(--brand-primary);display:block}.trust span{color:var(--muted);font-size:.9rem}.logo-strip{grid-template-columns:repeat(5,1fr)}.fake-logo{border:1px solid var(--border);border-radius:14px;padding:.9rem;text-align:center;font-weight:900;color:var(--muted);background:var(--surface)}.stars{font-size:1.4rem;color:var(--brand-accent)}.split{display:grid;grid-template-columns:1fr 1fr;gap:2.5rem;align-items:center}.split img{border-radius:var(--radius);box-shadow:var(--shadow)}.pricing{grid-template-columns:repeat(3,minmax(0,1fr))}.price{font-size:2.4rem;font-weight:950;color:var(--brand-primary);letter-spacing:-.05em}.list{padding-left:1.2rem;color:var(--muted)}.faq-item{border-bottom:1px solid var(--border);padding:1rem 0}.faq-item summary{cursor:pointer;font-weight:850}.faq-item p{color:var(--muted)}.blog-card time{font-size:.82rem;color:var(--muted);font-weight:750}.compare-table{width:100%;border-collapse:collapse;background:var(--card);border-radius:var(--radius);overflow:hidden;box-shadow:var(--shadow)}.compare-table th,.compare-table td{border:1px solid var(--border);padding:1rem;text-align:start}.compare-table th{background:var(--surface)}.cta{background:var(--brand-primary);color:var(--on-primary);text-align:center;padding:var(--section-pad) 1.25rem}.cta h2{font-family:var(--font-head);font-size:clamp(2rem,4vw,3.4rem);letter-spacing:-.04em;margin:0 0 .7rem}.footer{background:var(--footer-bg);color:var(--footer-text);padding:3.5rem 1.25rem 1.5rem}.footer-inner{max-width:1180px;margin:auto}.footer-grid{display:grid;grid-template-columns:2fr repeat(3,1fr);gap:2rem;margin-bottom:2rem}.footer h3,.footer h4{color:#fff}.footer a{display:block;color:var(--footer-text);margin:.35rem 0}.footer-bottom{border-top:1px solid rgba(255,255,255,.1);padding-top:1rem;color:#94a3b8;font-size:.88rem;display:flex;justify-content:space-between;gap:1rem;flex-wrap:wrap}.contact-grid{display:grid;grid-template-columns:.9fr 1.1fr;gap:2rem}.form input,.form textarea{width:100%;border:1px solid var(--border);border-radius:14px;padding:.8rem 1rem;margin-bottom:.9rem;font:inherit;background:var(--bg);color:var(--text)}.form textarea{min-height:150px}.honeypot{position:absolute;left:-9999px}.notice{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:1rem;color:var(--muted)}:focus-visible{outline:3px solid var(--brand-accent);outline-offset:3px}[dir="rtl"] .list{padding-right:1.2rem;padding-left:0}[dir="rtl"] .compare-table th,[dir="rtl"] .compare-table td{text-align:right}[dir="rtl"] .hero-media{transform:rotate(-1.5deg)}[dir="rtl"] .hero-creative .hero-media{transform:rotate(3deg) translateY(1rem)}[dir="rtl"] .footer-bottom{direction:rtl}[dir="rtl"] .contact-grid,[dir="rtl"] .split{direction:rtl}@media(max-width:840px){.menu-btn{display:inline-flex}.nav-links{position:absolute;left:1rem;right:1rem;top:78px;background:var(--card);border:1px solid var(--border);border-radius:18px;box-shadow:var(--shadow);padding:1rem;display:none;flex-direction:column;align-items:stretch}.nav-links.open{display:flex}.nav-links a{padding:.65rem}.hero-inner,.split,.contact-grid{grid-template-columns:1fr}.hero-media img{height:300px}.cards,.pricing,.trust.grid4,.logo-strip,.footer-grid{grid-template-columns:1fr}.trust{margin:0 1.25rem}.section{padding:4rem 1.25rem}}@media(prefers-reduced-motion:reduce){*,*::before,*::after{animation:none!important;transition:none!important;scroll-behavior:auto!important}}`;
}
function siteJS() { return `document.addEventListener('DOMContentLoaded',()=>{const btn=document.querySelector('[data-menu-button]');const links=document.querySelector('[data-nav-links]');const theme=document.querySelector('[data-theme-toggle]');const openLabel=btn?.dataset.openLabel||'Open navigation menu';const closeLabel=btn?.dataset.closeLabel||'Close navigation menu';const lightLabel=theme?.dataset.lightLabel||'Light';const darkLabel=theme?.dataset.darkLabel||'Dark';const close=()=>{if(!links||!btn)return;links.classList.remove('open');btn.setAttribute('aria-expanded','false');btn.setAttribute('aria-label',openLabel);};if(btn&&links){btn.addEventListener('click',()=>{const open=!links.classList.contains('open');links.classList.toggle('open',open);btn.setAttribute('aria-expanded',String(open));btn.setAttribute('aria-label',open?closeLabel:openLabel);});links.querySelectorAll('a').forEach(a=>a.addEventListener('click',close));document.addEventListener('keydown',e=>{if(e.key==='Escape')close();});document.addEventListener('click',e=>{if(!links.contains(e.target)&&!btn.contains(e.target))close();});}if(theme){const saved=localStorage.getItem('theme')||'light';document.documentElement.dataset.theme=saved;theme.textContent=saved==='dark'?lightLabel:darkLabel;theme.addEventListener('click',()=>{const next=document.documentElement.dataset.theme==='dark'?'light':'dark';document.documentElement.dataset.theme=next;localStorage.setItem('theme',next);theme.textContent=next==='dark'?lightLabel:darkLabel;});}document.querySelectorAll('[data-demo-form]').forEach(form=>{form.addEventListener('submit',e=>{e.preventDefault();const note=form.querySelector('[data-form-note]');if(note)note.textContent=form.dataset.demoMessage||'Demo submission captured. Connect a real endpoint before launch.';});});});`; }

function meta(ctx, title, description, prefix = "") {
  const faviconHref = ctx.logo ? prefix + ctx.logo.path : prefix + "assets/img/favicon.svg";
  return `<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><meta name="description" content="${esc(description)}"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:type" content="website"><meta property="og:image" content="${prefix}assets/img/og-image.svg"><link rel="canonical" href="https://example.com/"><link rel="icon" href="${faviconHref}"><link rel="apple-touch-icon" href="${faviconHref}"><link rel="manifest" href="${prefix}site.webmanifest"><link rel="stylesheet" href="${prefix}assets/css/style.css"><script type="application/ld+json">${schema(ctx)}</script><script src="${prefix}assets/js/main.js" defer></script><title>${esc(title)}</title>`;
}
function schema(ctx) {
  const schemaImage = ctx.logo ? `https://example.com/${ctx.logo.path}` : "https://example.com/assets/img/og-image.svg";
  const data = { "@context":"https://schema.org", "@type": ctx.data.type || "Organization", name: ctx.biz, url: "https://example.com/", description: ctx.tagline || ctx.data.sub, email: ctx.local.email, telephone: ctx.local.phone, areaServed: ctx.local.area, openingHours: ctx.local.hours, image: schemaImage };
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
  const ctaHref = one && prefix ? `${prefix}index.html#contact` : (one ? "#contact" : `${prefix}contact.html`);
  const logoSrc = ctx.preview && ctx.logo?.previewSrc ? ctx.logo.previewSrc : (ctx.logo ? `${prefix}${ctx.logo.path}` : "");
  const logo = ctx.logo ? `<img class="brand-logo" src="${logoSrc}" alt="${esc(ctx.biz)} logo">` : "";
  return `<a class="skip-link" href="#main">${txt(ctx,"skip")}</a><header class="site-header"><nav class="nav" aria-label="${txt(ctx,"navLabel")}"><a class="brand" href="${homeHref}">${logo}<span>${esc(ctx.biz)}</span></a><div class="nav-links" data-nav-links>${links.map(([href,label])=>`<a href="${href}">${esc(label)}</a>`).join("")}</div><div class="nav-actions"><button class="theme-toggle" type="button" data-theme-toggle data-light-label="${txt(ctx,"light")}" data-dark-label="${txt(ctx,"dark")}" aria-label="Toggle dark mode">${txt(ctx,"dark")}</button><a class="nav-cta" href="${ctaHref}">${esc(ctx.cta)}</a><button class="menu-btn" type="button" data-menu-button aria-expanded="false" data-open-label="${txt(ctx,"openMenu")}" data-close-label="${txt(ctx,"closeMenu")}" aria-label="${txt(ctx,"openMenu")}">☰</button></div></nav></header>`;
}
function pageLink(prefix, path, label) { return `<a href="${prefix}${path}">${label}</a>`; }
function onePage(ctx) { return wrapPage(ctx, pageTitle(ctx,"One Page","עמוד אחד"), ctx.tagline || ctx.data.sub, onePageBody(ctx)); }
function footer(ctx, prefix = "") {
  const y = new Date().getFullYear();
  const resources = ctx.siteType === "onepage"
    ? [[onePageHref(prefix,"#pricing"),txt(ctx,"pricing")],[onePageHref(prefix,"#faq"),txt(ctx,"faq")],[onePageHref(prefix,"#compare"),txt(ctx,"compare")]].map(([href,label])=>`<a href="${href}">${label}</a>`).join("")
    : [ctx.options?.pricing && ["pricing.html", txt(ctx,"pricing")], ctx.options?.faq && ["faq.html", txt(ctx,"faq")], ctx.options?.blog && ["blog.html", txt(ctx,"blog")], ["compare.html", txt(ctx,"compare")]].filter(Boolean).map(([path, label]) => pageLink(prefix, path, label)).join("");
  const company = ctx.siteType === "onepage"
    ? `${pageLink(prefix,"index.html",txt(ctx,"home"))}<a href="${onePageHref(prefix,"#services")}">${txt(ctx,"services")}</a><a href="${onePageHref(prefix,"#compare")}">${txt(ctx,"compare")}</a><a href="${onePageHref(prefix,"#contact")}">${txt(ctx,"contact")}</a>`
    : `${pageLink(prefix,"index.html",txt(ctx,"home"))}${pageLink(prefix,"about.html",txt(ctx,"about"))}${pageLink(prefix,"services.html",txt(ctx,"services"))}${pageLink(prefix,"compare.html",txt(ctx,"compare"))}`;
  return `<footer class="footer"><div class="footer-inner"><div class="footer-grid"><div><h3>${esc(ctx.biz)}</h3><p>${esc(ctx.tagline || ctx.data.foot)}</p><p>${esc(ctx.local.area)} · ${esc(ctx.local.phone)}</p></div><div><h4>${txt(ctx,"company")}</h4>${company}</div><div><h4>${txt(ctx,"resources")}</h4>${resources}</div><div><h4>${txt(ctx,"legal")}</h4>${pageLink(prefix,"legal/privacy-policy.html",txt(ctx,"privacy"))}${pageLink(prefix,"legal/terms-of-usage.html",txt(ctx,"terms"))}${pageLink(prefix,"legal/cookie-policy.html",txt(ctx,"cookies"))}</div></div><div class="footer-bottom"><span>© ${y} ${esc(ctx.biz)}. ${txt(ctx,"rights")}.</span><span>${esc(ctx.goal.name)} - ${esc(ctx.voice.adjective)} by design.</span></div></div></footer>`;
}
function wrapPage(ctx, title, description, body, prefix = "") { return `<!DOCTYPE html><html lang="${langOf(ctx)}" dir="${dirOf(ctx)}"><head>${meta(ctx,title,description,prefix)}</head><body>${nav(ctx,prefix)}<main id="main">${body}</main>${footer(ctx,prefix)}</body></html>`; }
function hero(ctx, title, subtitle, seed) {
  const contactHref = ctx.siteType === "onepage" ? "#contact" : "contact.html";
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
function homeBody(ctx) { return hero(ctx, ctx.data.hero, ctx.tagline || ctx.data.sub, "hero") + trustSection(ctx) + goalSection(ctx) + industryModule(ctx) + `<section class="cta"><h2>${esc(ctx.voice.ctaLine)}</h2><p>${esc(ctx.goal.focus)}</p><a class="btn btn-primary" href="contact.html">${esc(ctx.cta)}</a></section>`; }
function homePage(ctx) { return wrapPage(ctx, pageTitle(ctx,"Home","בית"), ctx.tagline || ctx.data.sub, homeBody(ctx)); }
function pricingSection(ctx) {
  const names = isHebrew(ctx) ? ["בסיסי","מקצועי","פרימיום"] : ["Starter","Professional","Premium"];
  const bullets = isHebrew(ctx) ? ["תכולה ברורה","לוח זמנים מוגדר","תמיכה בצעד הבא"] : ["Clear deliverables","Defined timeline","Next-step support"];
  return `<section class="section" id="pricing"><div class="section-head"><p class="kicker">${txt(ctx,"pricing")}</p><h2>${txt(ctx,"pricingHead")}</h2><p class="lead">${txt(ctx,"pricingLead")}</p></div><div class="grid pricing">${names.map((n,i)=>`<article class="card"><h3>${n}</h3><div class="price">${["$99","$299",isHebrew(ctx)?"מותאם":"Custom"][i]}</div><ul class="list">${bullets.map(b=>`<li>${b}</li>`).join("")}</ul><a class="btn btn-primary" href="${ctx.siteType==='onepage'?'#contact':'contact.html'}">${esc(ctx.cta)}</a></article>`).join("")}</div></section>`;
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
  return `<form class="card form" ${formAttrs}><input type="hidden" name="form-name" value="contact"><p class="honeypot"><label>Do not fill this out <input name="bot-field"></label></p><label>${txt(ctx,"name")}<input name="name" required autocomplete="name"></label><label>${txt(ctx,"email")}<input type="email" name="email" required autocomplete="email"></label><label>${txt(ctx,"subject")}<input name="subject"></label><label>${txt(ctx,"message")}<textarea name="message" required></textarea></label><button class="btn btn-primary" type="submit">${esc(ctx.cta)}</button><p data-form-note class="notice">${note}</p>${action}</form>`;
}
function contactBlock(ctx) {
  return `<div class="contact-grid"><div class="card"><h3>${txt(ctx,"contactDetails")}</h3><p>${txt(ctx,"email")}: ${esc(ctx.local.email)}</p><p>${txt(ctx,"phone")}: ${esc(ctx.local.phone)}</p><p>${txt(ctx,"serviceArea")}: ${esc(ctx.local.area)}</p><p>${txt(ctx,"address")}: ${esc(ctx.local.address)}</p><p>${txt(ctx,"hours")}: ${esc(ctx.local.hours)}</p></div>${contactForm(ctx)}</div>`;
}
function onePageBody(ctx) { return hero(ctx, ctx.data.hero, ctx.tagline || ctx.data.sub, "hero") + trustSection(ctx) + `<section class="section" id="services"><div class="section-head"><p class="kicker">${txt(ctx,"services")}</p><h2>${txt(ctx,"onePageHead")}</h2><p class="lead">${txt(ctx,"onePageLead")}</p></div>${servicesCards(ctx,4,true)}</section>` + pricingSection(ctx) + compareSection(ctx) + faqSection(ctx) + `<section class="section" id="contact"><div class="section-head"><p class="kicker">${txt(ctx,"contact")}</p><h2>${esc(ctx.cta)}</h2><p class="lead">${esc(ctx.voice.ctaLine)}</p></div>${contactBlock(ctx)}</section>`; }
function onePage(ctx) { return wrapPage(ctx, `${ctx.biz} - One Page`, ctx.tagline || ctx.data.sub, onePageBody(ctx)); }
function aboutPage(ctx) {
  const body = isHebrew(ctx)
    ? hero(ctx, `אודות ${ctx.biz}`, ctx.tagline || ctx.data.sub, "about") + `<section class="section"><div class="section-head"><p class="kicker">הסיפור שלנו</p><h2>סיפור פתיחה עם הנחיות שימושיות.</h2><p class="lead">השתמשו באזור הזה כדי להסביר למה העסק קיים, את מי הוא משרת ומה לקוחות יכולים לצפות לקבל. התמקדו באמון, לא באוטוביוגרפיה.</p></div><div class="grid cards"><article class="card"><h3>הבטחה</h3><p>כתבו את ההבטחה הפשוטה שהלקוחות יכולים לסמוך עליה.</p></article><article class="card"><h3>תהליך</h3><p>הסבירו איך אתם עובדים כדי שאנשים ירגישו בטוחים להתקדם.</p></article><article class="card"><h3>הוכחה</h3><p>הוסיפו הסמכות, מספרים, המלצות או תוצאות נראות.</p></article></div></section>`
    : hero(ctx, `About ${ctx.biz}`, ctx.tagline || ctx.data.sub, "about") + `<section class="section"><div class="section-head"><p class="kicker">Our story</p><h2>A starter story with useful prompts built in.</h2><p class="lead">Use this area to explain why the business exists, who it serves, and what customers can expect. Focus on trust, not autobiography.</p></div><div class="grid cards"><article class="card"><h3>Promise</h3><p>Write the simple promise customers can hold you to.</p></article><article class="card"><h3>Process</h3><p>Explain how you work so people feel safe taking the next step.</p></article><article class="card"><h3>Proof</h3><p>Add credentials, numbers, testimonials, or visible outcomes.</p></article></div></section>`;
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
    ? `<h2>יצירת קשר</h2><p>לשאלות לגבי עמוד זה, פרטיות או בקשות משתמשים, ניתן לפנות אלינו בכתובת <a href="mailto:${esc(ctx.local.email)}">${esc(ctx.local.email)}</a>.</p>`
    : `<h2>Contact</h2><p>For questions about this page, privacy matters, or user requests, contact us at <a href="mailto:${esc(ctx.local.email)}">${esc(ctx.local.email)}</a>.</p>`;
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
function sitemap(ctx) { const pages=[...generatedPages(ctx).map(([path])=>path),"legal/privacy-policy.html","legal/terms-of-usage.html","legal/cookie-policy.html"]; return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${pages.map(p=>`<url><loc>https://example.com/${p}</loc></url>`).join("")}</urlset>`; }
function manifest(ctx) { const icon = ctx.logo ? { src: ctx.logo.path, sizes: "any", type: ctx.logo.mime } : { src: "assets/img/favicon.svg", sizes: "any", type: "image/svg+xml" }; return JSON.stringify({ name: ctx.biz, short_name: ctx.biz.slice(0,12), start_url: "index.html", display: "standalone", background_color: "#ffffff", theme_color: ctx.colors[0], icons: [icon] }, null, 2); }
function favicon(ctx) { return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="22" fill="${ctx.colors[0]}"/><circle cx="68" cy="32" r="18" fill="${ctx.colors[2]}"/><text x="50" y="62" text-anchor="middle" font-family="Arial" font-size="42" font-weight="800" fill="${textColor(ctx.colors[0])}">${esc(ctx.biz[0]||"W")}</text></svg>`; }
function ogImage(ctx) { return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630"><rect width="1200" height="630" fill="${ctx.colors[0]}"/><circle cx="980" cy="120" r="220" fill="${ctx.colors[2]}" opacity=".75"/><text x="80" y="300" font-family="Arial" font-size="82" font-weight="800" fill="${textColor(ctx.colors[0])}">${esc(ctx.biz)}</text><text x="84" y="380" font-family="Arial" font-size="34" fill="${textColor(ctx.colors[0])}" opacity=".82">${esc(ctx.tagline||ctx.data.sub)}</text></svg>`; }
function launchKitFiles(ctx) {
  return {
    "launch-kit/copy-checklist.md": `# Copy checklist\n\n- Homepage headline names the customer and result.\n- CTA uses: ${ctx.cta}.\n- Each service card explains outcome, audience, and next step.\n- FAQ answers pricing, timeline, preparation, and support.\n- Comparison page stays fair and specific.\n`,
    "launch-kit/content-prompts.md": `# Content prompts\n\n## Homepage\nI help [audience] achieve [result] without [pain].\n\n## About\nWe started ${ctx.biz} because [problem]. Today we help [audience] by [solution].\n\n## Proof\nAdd numbers, testimonials, certifications, before/after examples, or case studies.\n`,
    "launch-kit/image-replacement-guide.md": `# Image replacement guide\n\nThis starter uses stable Picsum URLs for demo impact. Replace them with real images before launch. Keep similar aspect ratios: hero 900x650, cards 600x380, blog 600x360.\n`,
    "launch-kit/seo-checklist.md": `# SEO checklist\n\n- Replace example.com in canonical, robots.txt, sitemap.xml, and schema.\n- Write a unique meta description per page.\n- Rename image alt text to match real images.\n- Submit sitemap.xml after deployment.\n`,
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

- Replace every example.com URL with your real domain in HTML meta tags, robots.txt, sitemap.xml, and schema data.
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
- example.com canonical, sitemap, robots, and schema URLs
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
    logo: logoAsset(uploadedLogoFile),
    local: localDetails(biz),
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

function writeWebsiteZip(root, ctx) {
  generatedPages(ctx).forEach(([path, content]) => root.file(path, content));
  root.folder("assets").folder("css").file("style.css", siteCSS(ctx));
  root.folder("assets").folder("js").file("main.js", siteJS());
  const imgFolder = root.folder("assets").folder("img");
  if (uploadedLogoFile && ctx.logo) imgFolder.file(ctx.logo.filename, uploadedLogoFile);
  imgFolder.file("favicon.svg", favicon(ctx));
  imgFolder.file("og-image.svg", ogImage(ctx));
  const legal = root.folder("legal");
  legal.file("privacy-policy.html", legalPage(ctx,"privacy"));
  legal.file("terms-of-usage.html", legalPage(ctx,"terms"));
  legal.file("cookie-policy.html", legalPage(ctx,"cookies"));
  root.file("robots.txt", "User-agent: *\nAllow: /\nSitemap: https://example.com/sitemap.xml\n");
  root.file("sitemap.xml", sitemap(ctx));
  root.file("site.webmanifest", manifest(ctx));
  root.file(".nojekyll", "");
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
