// The locale our app shows as default when loading
const defaultLocale = "en";
const supportedLocales = ["en", "he"];


let locale;             // active locale, set by user preferences
let translations = {};  // Gets filled with active locale translations

// Load translations and translate the page for given locale
async function setLocale(newLocale) {
    if (newLocale === locale) return;
    const newTranslations = await fetchTranslationsFor(newLocale);
    locale = newLocale;
    translations = newTranslations;
    document.documentElement.dir = dir(newLocale);      // Set <html dir> attribute
    document.documentElement.lang = newLocale;
    translatePage();
}

function dir(locale) {
    return locale === "he" ? "rtl" : "ltr";
}

// Retrieve translations JSON object for the given locale
async function fetchTranslationsFor(newLocale) {
    const localePath = `./_locales/${newLocale}/messages.json`;
    alert(localePath);

    var xhr = new XMLHttpRequest();
    xhr.open('GET', localesPath, true);
    xhr.responseType = 'json';
    xhr.onload = function() {
      if (xhr.status === 200) {
        alert("JSON read OK!");
        let translationData = xhr.response;
        alert(translationData);
        return await translationsData.json();
      }
      alert("JSON read failed!");
    };
    xhr.send();
    
    // import * as translationsData from localePath;
    // const {name} = translationsData;
    // console.log(name);

    // import translationsData from localePath assert { type: 'json' };
    // console.log(translationsData);
    // let translationJson = require(`./_locales/${newLocale}/messages.json`);
    // console.log(translationJson);
    // alert(translationJson);
    // const response = await fetch(`/lang/${newLocale}.json`);
    // return await fetch(`https://ailoveu.art/_locales/${newLocale}/messages.json`)
        // .then(res => res.json());
        // .then(res => res.json())
        // .then(console.log)
    // const response = await fetch(`/_locales/${newLocale}/messages.json`);
    // const response = await fetch(localePath);
    // return await response.json();
    // return await translationsData.json();
}

// Replace inner text of all HTML elements with data-i18n-key attribute
// with their corresponding key translation 
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
 *
 * @param {boolean} languageCodeOnly - when true, returns ["en", "fr"] instead of ["en-US", "fr-FR"]
 * @returns array | undefined
 */
function browserLocales(languageCodeOnly = false) {
    return navigator.languages.map((locale) =>
        languageCodeOnly ? locale.split("-")[0] : locale, 
    );
}
