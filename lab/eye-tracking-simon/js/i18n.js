'use strict';

window.EyeTracking = window.EyeTracking || {};
window.EyeTracking.i18n = (function () {
  const english = {
    'בלבול צבעים': 'Color shuffle',
    'נראה אם תעבור אותי!': 'Think you can beat me?',
    'למשחק רגיל': 'Play your own game',
    'אתגר חבר — נראה אם תעבור אותי!': 'Challenge a friend — beat my score!',
    'שיתוף חבר באתגר': 'Challenge a friend',
    'קישור לאתגר': 'Challenge link',
    'אותם רצפים, אותם תנאים. היעד: יותר מ־{count} פנים.': 'Same sequences, same rules. Your target: more than {count} faces.',
    'עקפת את החבר! היעד היה {count} פנים.': 'You beat your friend! The target was {count} faces.',
    'תיקו! שניכם השלמתם {count} פנים.': 'A tie! You both completed {count} faces.',
    'עוד ניסיון? היעד של החבר: {count} פנים.': 'Try again? Your friend completed {count} faces.',
    '{color}, מקש {key}': '{color}, key {key}',
    'הפנים מחליפות צבעים…': 'The faces are changing colors…',
    'זכרו את הצבעים, לא את המיקומים.': 'Remember the colors, not the positions.',
    'זכרו את סדר הצבעים. אחרי ההדגמה הם יעברו לפנים אחרות.': 'Remember the color sequence. After playback, the colors will move to other faces.',
    'לחצו על הצבעים שראיתם, במיקומים החדשים שלהם.': 'Click the colors you saw, in their new positions.',
    'זכרתי {count} פנים בזיכרון בצבע, ברמת {level}, במצב {mode}. נראה אם תעבור אותי!': 'I remembered {count} faces in Color Memory on {level}, {mode} mode. Think you can beat me?',
    'מהירות הזיכרון שלי: {seconds} שניות.': 'My memory speed: {seconds} seconds.',
    'האתגר הועתק! הדביקו ושלחו לחבר.': 'Challenge copied! Paste it and send it to a friend.',
    'העתיקו את הקישור ושלחו לחבר.': 'Copy the link and send it to a friend.',
    'זיכרון בצבע': 'Color Memory',
    'זיכרון בצבע — משחק פנים וצלילים': 'Color Memory — Faces and Sounds',
    'לשחק!': 'Play!',
    'שלב': 'Stage', 'אורך הרצף': 'Sequence length', 'נותרו': 'Time left',
    'הישגים': 'Personal bests', 'שיא רצף ארוך': 'Longest sequence',
    'שיא ציון זיכרון': 'Best memory score', 'שיא מהירות זיכרון': 'Best memory speed',
    'תוצאת המשחק הנוכחי': 'This game’s result', 'הרצף הארוך שהושלם': 'Longest completed sequence',
    'ציון זיכרון': 'Memory score', 'מהירות זיכרון': 'Memory speed',
    'רמת קושי': 'Difficulty', 'מצב הפתעה': 'Surprise mode',
    'טבעי': 'Natural', 'כחול': 'Blue', 'ירוק': 'Green', 'צהוב': 'Yellow', 'כתום': 'Orange',
    'מתחילים': 'Beginner', 'מתקדמים': 'Advanced', 'אלופי־על': 'Super champion',
    'מתחילים · ללא הגבלת זמן': 'Beginner · No time limit',
    'מתקדמים · 10 שניות לכל פנים': 'Advanced · 10 seconds per face',
    'אלופי־על · 5 שניות לכל פנים': 'Super champion · 5 seconds per face',
    'רגיל': 'Normal', 'רצף הפוך': 'Reverse order', 'צלילים בלבד': 'Sounds only',
    'הפוך + צלילים בלבד': 'Reverse + sounds only',
    'אתגר יומי': 'Daily challenge', 'התחל משחק': 'Start game', 'נסה שוב': 'Try again',
    'המשך וצפה ברצף': 'Resume and replay',
    'צליל פעיל ♪': 'Sound on ♪', 'צליל מושתק': 'Sound off',
    'השתקת צלילים': 'Mute sounds', 'הפעלת צלילים': 'Enable sounds',
    'רטט פעיל': 'Vibration on', 'רטט כבוי': 'Vibration off', 'רטט לא זמין': 'No vibration',
    'כיבוי רטט': 'Disable vibration', 'הפעלת רטט': 'Enable vibration',
    'חזרה לתמונה': 'Back to the artwork', 'סגור משחק וחזור לתמונה': 'Close game and return to the artwork',
    'לוח המשחק': 'Game panel', 'נתוני המשחק': 'Game statistics', 'כרטיס הישגים': 'Personal bests',
    'תמונת הפנים — לחצו על הפנים כדי לחזור על הרצף': 'Faces artwork — click the faces to repeat the sequence',
    'דיוקן של נשים בצבעים טבעי, כחול, ירוק, צהוב וכתום, ופנים נוספות בקצה השמאלי': 'Portraits of women in natural, blue, green, yellow and orange colors, with additional faces at the far left',
    'לחיצה על פנים או שימוש במקשים 1 עד 5': 'Click a face or use keys 1 to 5',
    'פנים בצבע טבעי, מקש 1': 'Natural face, key 1', 'פנים כחולות, מקש 2': 'Blue face, key 2',
    'פנים ירוקות, מקש 3': 'Green face, key 3', 'פנים צהובות, מקש 4': 'Yellow face, key 4',
    'פנים כתומות, מקש 5': 'Orange face, key 5',
    'טוען את התמונה…': 'Loading the artwork…',
    'לא ניתן להפעיל את המשחק. נסו לרענן את הדף.': 'The game could not start. Please refresh the page.',
    'כדי לשחק צריך להפעיל JavaScript בדפדפן.': 'Please enable JavaScript in your browser to play.',
    '{count} פנים': '{count} faces', '{seconds} שנ׳': '{seconds} s',
    '{progress} מתוך {length}': '{progress} of {length}',
    'חמש פנים. כמה תצליחו לזכור?': 'Five faces. How many can you remember?',
    'צפו ברצף, הקשיבו לצלילים וחזרו עליו בלחיצה על הפנים.': 'Watch, listen, then repeat the sequence by clicking the faces.',
    'צפו ברצף': 'Watch the sequence',
    'הקשיבו וזכרו את הסדר. עוד רגע תורכם.': 'Listen and remember the order. Your turn is next.',
    'עכשיו תורכם': 'Your turn',
    'לחצו על הפנים לפי הסדר — בתמונה, בכפתורים או במקשים 1–5.': 'Repeat the order using the faces, buttons, or keys 1–5.',
    'נכון מאוד!': 'Well done!', 'השלב הבא: רצף חדש, ארוך יותר באחד.': 'Next stage: a new sequence with one more face.',
    'כמעט — זו הייתה טעות': 'Not quite — watch the correct face',
    'הבחירה הנכונה מוארת עכשיו. שימו לב אליה, ואז ננסה שוב.': 'The correct face is highlighted. Take a look, then try again.',
    'המשחק מושהה': 'Game paused',
    'בחזרה נציג שוב את הרצף, וזמן התשובה יתחיל מחדש.': 'On resuming, the sequence will replay and the answer timer will restart.',
    'הזמן נגמר': 'Time’s up', 'זה לא הסדר הפעם': 'That wasn’t the order',
    'הגעתם לשלב {round}, עם רצף של {length} פנים. ננסה שוב?': 'You reached stage {round}, with a sequence of {length} faces. Try again?',
    'הקשיבו בלבד — הפנים לא יוארו בזמן הרצף.': 'Just listen — the faces will not light up during playback.',
    'זכרו: בתורכם לחצו בסדר הפוך.': 'Remember: repeat the sequence in reverse on your turn.',
    'לחצו על הפנים לפי הסדר ההפוך שבו שמעתם אותן.': 'Repeat the faces in the reverse order to what you heard.',
  };
  const storageKey = 'eyeTrackingColorMemory.language';
  let language = 'he';
  try { if (window.localStorage.getItem(storageKey) === 'en') language = 'en'; } catch (_) { /* Optional storage. */ }
  const listeners = new Set();
  function t(key, values = {}) {
    const text = language === 'en' ? (english[key] || key) : key;
    return text.replace(/\{(\w+)\}/g, (match, name) => values[name] ?? match);
  }
  function apply() {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'he' ? 'rtl' : 'ltr';
    document.title = t('זיכרון בצבע — משחק פנים וצלילים');
    document.querySelectorAll('[data-i18n]').forEach(node => { node.textContent = t(node.dataset.i18n); });
    for (const attribute of ['aria-label', 'title', 'alt']) {
      document.querySelectorAll(`[data-i18n-${attribute}]`).forEach(node => {
        node.setAttribute(attribute, t(node.getAttribute(`data-i18n-${attribute}`)));
      });
    }
    const toggle = document.getElementById('languageToggle');
    toggle.textContent = language === 'he' ? 'English' : 'עברית';
    toggle.lang = language === 'he' ? 'en' : 'he';
    toggle.setAttribute('aria-label', language === 'he' ? 'Switch to English' : 'מעבר לעברית');
  }
  function setLanguage(next) {
    if (!['he', 'en'].includes(next) || next === language) return;
    language = next;
    try { window.localStorage.setItem(storageKey, language); } catch (_) { /* Still works without storage. */ }
    apply();
    listeners.forEach(listener => listener());
  }
  document.getElementById('languageToggle').addEventListener('click', () => {
    setLanguage(language === 'he' ? 'en' : 'he');
  });
  apply();
  return { t, getLanguage: () => language, setLanguage,
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); } };
}());
