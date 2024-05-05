const defaultLocale="en",supportedLocales=["en","he","fr"],divs=document.querySelectorAll("div[align-left]"),langSelectorTag=document.getElementById("langSelector"),langLabel=document.getElementById("langLabel");function toggleLangSelectorDisplay(){"none"===langSelectorTag.style.display?langSelectorTag.style.display="block":langSelectorTag.style.display="none"}langLabel.addEventListener("click",toggleLangSelectorDisplay);let currentAlign="ltr",translations={},locale="en";async function setLocale(e){if(e===locale)return;const t=await fetchTranslationsFor(e);locale=e,translations=t,document.documentElement.lang=e;const n=dir(e);n!=currentAlign&&(document.documentElement.dir=n,currentAlign=n,"ltr"===n?setAlignLeft():setAlignRight()),translatePage()}function setAlignRight(){for(const e of divs)e.setAttribute("align-right",""),e.removeAttribute("align-left")}function setAlignLeft(){for(const e of divs)e.setAttribute("align-left",""),e.removeAttribute("align-right")}function dir(e){return"he"===e?"rtl":"ltr"}async function fetchTranslationsFor(e){const t=`/locales/${e}.json`,n=await fetch(t);return await n.json()}function translatePage(){document.querySelectorAll("[data-i18n-key]").forEach(translateElement)}function translateElement(e){const t=e.getAttribute("data-i18n-key"),n=translations[t];e.innerText=n}function bindLocaleSwitcher(e){const t=document.querySelector("[data-i18n-switcher]");t.value=e,t.onchange=e=>{setLocale(e.target.value)}}function isSupported(e){return supportedLocales.indexOf(e)>-1}function supportedOrDefault(e){return e.find(isSupported)||"en"}function browserLocales(e=!1){return navigator.languages.map((t=>e?t.split("-")[0]:t))}document.addEventListener("DOMContentLoaded",(()=>{const e=supportedOrDefault(browserLocales(!0));setLocale(e),bindLocaleSwitcher(e)}));
