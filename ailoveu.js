// The default locale our website show when loading (English)
const defaultLocale = "en";
const supportedLocales = ["en", "he", "fr"];
const divs = document.querySelectorAll('div[align-left]');

const langSelectorDiv = document.getElementById("langSelectorDiv");
const langSelector = document.getElementById("langSelector");
const langLabel = document.getElementById("langLabel");
function toggleLangSelectorDisplay() {
    if (langSelectorDiv.style.display === "none") {
        langSelectorDiv.style.display = "block";
    } else {
        langSelectorDiv.style.display = "none";
    }
}
langLabel.addEventListener("click", toggleLangSelectorDisplay);
langSelector.addEventListener("select", toggleLangSelectorDisplay);

let currentAlign = "ltr";
let translations = {};          // Gets filled with active locale translations
let locale = defaultLocale;     // active locale, set by user preferences

// Load translations and translate the page for given locale
async function setLocale(newLocale) {
    if (newLocale === locale) return;
    const newTranslations = await fetchTranslationsFor(newLocale);
    locale = newLocale;
    translations = newTranslations;
    document.documentElement.lang = newLocale;
    const langDirection = dir(newLocale);
    if (langDirection != currentAlign) {
        // alert("Language-Direction changed to: " + langDirection);    // for debug
        document.documentElement.dir = langDirection;
        currentAlign = langDirection;
        if (langDirection === "ltr") {
            setAlignLeft();
        } else {
            setAlignRight();
        }
    }
    translatePage();
}

function setAlignRight(){
    for (const div of divs) {
        div.setAttribute('align-right', '');
        div.removeAttribute('align-left');
    }
}
function setAlignLeft(){
    for (const div of divs) {
        div.setAttribute('align-left', '');
        div.removeAttribute('align-right');
    }
}

function dir(locale) {
    return locale === "he" ? "rtl" : "ltr";
}

// Retrieve translations JSON object for the given locale
async function fetchTranslationsFor(newLocale) {
    // return await fetch(`https://ailoveu.art/locales/${newLocale}/messages.json`).then(res => res.json()).then(console.log)
    const localePath = `/locales/${newLocale}.json`;
    const response = await fetch(localePath);
    return await response.json();
}

// Replace inner text of all elements with data-i18n-key attribute with their corresponding key translation 
function translatePage() {
    document.querySelectorAll("[data-i18n-key]").forEach(translateElement);
}

// Replace inner text of given HTML element to active locale translation
function translateElement(element) {
    const key = element.getAttribute("data-i18n-key");
    const translation = translations[key];
    element.innerText = translation;
}

// Detect and Translate page to user’s preferred locale when page content ready
document.addEventListener("DOMContentLoaded", () => {
    const initialLocale = supportedOrDefault(browserLocales(true));
    setLocale(initialLocale);
    bindLocaleSwitcher(initialLocale);
});

// update the page when the user selects new locale
function bindLocaleSwitcher(initialValue) {
    const switcher = document.querySelector("[data-i18n-switcher]");
    switcher.value = initialValue;
    switcher.onchange = (e) => {
        // Set the locale to the selected option[value]
        setLocale(e.target.value);
    };
}

function isSupported(locale) {
    return supportedLocales.indexOf(locale) > -1;
}

// return first supported locale from locales-array or return default locale
function supportedOrDefault(locales) {
    return locales.find(isSupported) || defaultLocale;
}

/**
 * Retrieve user-preferred locales from the browser
 * browserLocales() will return ["fr-CA", "zh-CN"]
 * browserLocales(true) will return ["fr", "zh"] instead.
 * param {boolean} languageCodeOnly - when true, returns ["en", "fr"] instead of ["en-US", "fr-FR"]
 * returns array | undefined
 */
function browserLocales(languageCodeOnly = false) {
    return navigator.languages.map((locale) =>
        languageCodeOnly ? locale.split("-")[0] : locale, 
    );
}
