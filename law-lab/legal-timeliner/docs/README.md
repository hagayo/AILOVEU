# Legal Timeline 1.4.2

גרסת הדגמה מקומית בדפדפן לבניית ציר זמן כרונולוגי ממסמכי DOCX ו-TXT.

## מה המערכת עושה

1. המשתמש מוסיף מסמכים בכמה סבבים ומכמה תיקיות.
2. שום מסמך לא מעובד בזמן הבחירה.
3. לאחר DOCX ראשון מתחילה ברקע טעינה lazy של officeParser 8.0.0.
4. בלחיצה על "בנה ציר זמן" הקבצים מעובדים אחד-אחד.
5. DOCX מפורק לפסקאות גוף, פסקאות בתוך תאי טבלאות, footnotes, endnotes ו-comments. TXT מפוצל לפסקאות לפי שורות ריקות. Headers/footers אינם נסרקים.
6. בהערות נסרק רק תוכן ההערה. תאריך creation/modified מתוך metadata של comment/note אינו נכנס לציר הזמן.
7. מנוע תאריכים דטרמיניסטי מאתר תאריכים מלאים בכל פסקה. ברירת המחדל מציגה תאריך שמופיע בסמיכות לביטוי מתאים לאחת מחמש קבוצות אירועים: מועדים וחובות, מסמכים והחלטות, תקשורת ומסירה, פגישות ודיונים, תשלומים.
8. ניתן לבחור סינון מדויק יותר (ביטוי סמוך לתאריך), מאוזן (ברירת מחדל), או רחב (כולל פסקאות עם תאריך וטקסט משמעותי ללא סיווג ברור). שינוי הסינון בונה מחדש את התוצאות מהטקסט שכבר חולץ, ללא קריאת קבצים חוזרת; אזכורים רחבים דורשים בדיקה ידנית.
9. פסקה שמכילה רק תאריך אינה יוצרת רשומת Timeline בשום רמת סינון. לא מחברים אליה פסקאות שכנות ולא מסיקים מה משמעות התאריך.
10. לכל רשומה נשמרים הפסקה המלאה, הסיווג ומיקום המקור. אפשר להסיר אירוע בודד מהציר; ההסרה נשמרת בעת שינוי סינון ובנייה מחדש באותה לשונית, ומתאפסת בניקוי התיק או ברענון הדף.
11. אין deduplication בכלל.
12. כל הרשומות מכל המסמכים ממוינות כרונולוגית. רשומות מאותו תאריך מוצגות יחד.
13. לכל רשומה מוצגים מסמכים קשורים: מסמך המקור, ועוד מסמכים שבהם אותו תאריך מלא נמצא בתוכן או בשם הקובץ.
14. שמות מסמכים מוצגים תמיד בדיוק בשם הקובץ המקורי המלא, כולל הסיומת וללא ניקוי או קיצור סמנטי.
15. אפשר לסמן אירועים ולייצא אותם לקובץ Word, להדפסת PDF או ל-Markdown. הייצוא כולל תאריך, קטגוריה, נוסח האירוע, שם המסמך ומיקום המקור.
16. הסיווג מוצג ליד כל אירוע וניתן לסנן את הציר לפי קבוצת אירועים.

## פרטיות וארכיטקטורה

- Browser-only.
- אין שרת, DB, AI או API key.
- תוכן המסמכים נשאר בדפדפן.
- officeParser נטען רק אם נוסף DOCX. תיק שמכיל TXT בלבד לא מוריד אותו.
- officeParser 8.0.0 שמור מקומית בתוך `vendor/officeparser/` ונטען משם בלבד.
- הקובץ הוא ה-IIFE הרשמי מגרסת v8.0.0, עם SHA-256 מקובע שנבדק באמצעות `npm run verify:vendor`.
- אין תלות ב-CDN בזמן העבודה עם DOCX.

## הרצה

הדרך הפשוטה: לפתוח `index.html` ב-Chrome.

אפשר גם להגיש סטטית, ללא build:

```bash
python -m http.server 8421
```

ואז לפתוח `http://127.0.0.1:8421/`.

## בדיקות

אין dependencies לבדיקות:

```bash
npm test
npm run check
```

## מבנה

```text
index.html
css/style.css
js/config.js
js/script-loader.js
js/file-store.js
js/document-extractor.js
js/date-engine.js
js/timeline.js
js/related-documents.js
js/app.js
tests/
```

## החלטות V1

- יחידת המקור היא פסקה מלאה, לא משפט.
- פסקה שמכילה רק תאריך ללא טקסט משמעותי נוסף אינה נכנסת לציר הזמן, בכל מיקום במסמך. לא מצרפים אליה פסקאות שכנות ולא מייחסים לה משמעות כגון תאריך יצירת מסמך.
- טבלאות נסרקות עם provenance של table/row/cell.
- headers/footers לא נכנסים לטיימליין.
- footnotes, endnotes ו-comments כן נסרקים, אבל רק הטקסט שבתוכם. תאריכי metadata של ההערות אינם נסרקים.
- לכל Timeline Entry מוצג מסמך המקור ומסמכים נוספים שבהם אותו תאריך מלא נמצא בתוכן או בשם הקובץ. ההתאמה דטרמיניסטית בלבד, ללא AI.
- אין איחוד כפילויות של אירועים מזוהים; המשתמש יכול להסיר אירועים ידנית.
- מספר תאריכים באותה פסקה יוצרים מספר Timeline Entries עם אותה פסקה מלאה.
- תאריך מספרי מפורש תמיד לפי ישראל: יום/חודש/שנה.
- נתמכים גם `YYYY-MM-DD`, תאריך מילולי בעברית, תאריך מילולי באנגלית ושנה דו-ספרתית.
- שנה דו-ספרתית: `00-49` ממופה ל-`2000-2049`, ו-`50-99` ל-`1950-1999`.
- כרגע נסרקים תאריכים מלאים עם יום, חודש ושנה בלבד.

## מעבר עתידי לשרת

שכבת `DocumentExtractor` מבודדת משאר המערכת. בגרסת מוצר ניתן להחליף את חילוץ ה-DOCX ב-Python backend ולהשאיר את מודל ה-Timeline וה-UI כמעט ללא שינוי. בשלב זה אפשר גם להעביר לשרת את מנוע התאריכים ולהוסיף OCR/AI כשכבות אופציונליות.

## Real DOCX integration check

The normal unit tests mock the officeParser AST. A separate integration check uses the real files in `demo/`, the vendored browser IIFE, and the same production extraction path:

```bash
npm run test:integration
```

It runs:

`real DOCX/TXT fixtures -> officeParser browser bundle -> DocumentExtractor -> DateEngine -> TimelineBuilder -> RelatedDocumentMatcher`

The check runs directly with Node 22+ and does not require Chrome, a local web server, or network access. It parses the real DOCX fixtures through the vendored `officeParser` bundle before running the production extraction, date, timeline, and related-document logic.
