(function (global) {
  'use strict';

  var TIME_REGEX = /(?<!\d)(?:(?:[01]?\d|2[0-3]):[0-5]\d(?::[0-5]\d)?(?:\s*(?:a\.?m\.?|p\.?m\.?))?|(?:0?[1-9]|1[0-2])\s*(?:a\.?m\.?|p\.?m\.?))(?!\d)/gi;
  var DATE_TIME_CONNECTOR_REGEX = /\b(?:at|on)\b|(?:^|[\s,;:()\-])(?:בשעה|שעה|ביום|בתאריך)(?=$|[\s,;:()\-])/gi;
  var EVENT_RULES = Object.freeze([
    {
      category: 'מועדים וחובות',
      action: /מועד\s+(?:אחרון|סופי|הגשה|פירעון|חידוש|סיום)|לא\s+יאוחר\s+מ|עד\s+(?:ליום|לתאריך)|(?:יש|נדרש|חובה)\s+(?:להגיש|לשלם|לחדש|להשיב)|(?:לתשלום|להגשה|לתגובה|לפירעון)\s+עד|(?:תוקף|ההסכם)\s+(?:מסתיים|יפוג)\s+ב/gu
    },
    {
      category: 'מסמכים והחלטות',
      action: /(?:נחתם|נחתמה|נחתמו|חתמ[וה]?)\s+(?:על\s+)?(?:הסכם|חוזה|מסמך)|(?:הוגש|הוגשה|הוגשו)\s+(?:כתב|בקשה|תגובה|תביעה|ערעור|מסמך)|(?:ניתנה|התקבלה)\s+(?:החלטה|החלטת|פסיקה)|(?:ניתן|ניתנה|התקבל)\s+(?:צו|פסק\s+דין|אישור)|(?:אושר|אושרה)\s+(?:ההסכם|החוזה|הבקשה|המסמך)/gu
    },
    {
      category: 'תקשורת ומסירה',
      action: /(?:נשלח[הו]?|התקבל[הו]?|נמסר[הו]?|הומצא[הו]?)\s+(?:(?:ל\S+|אצל\S+)\s+)?(?:מכתב|הודע[הת]|דוא[״"']?ל|מייל|התרא[הת]|דריש[הת]|תזכור[הת]|מסרון)|(?:מכתב|הודע[הת]|דוא[״"']?ל|מייל|התרא[הת]|דריש[הת]|תזכור[הת]|מסרון)\s+(?:ש)?(?:נשלח[הו]?|התקבל[הו]?|נמסר[הו]?|הומצא[הו]?)/gu
    },
    {
      category: 'פגישות ודיונים',
      action: /(?:התקיימ[הום]|(?:נערכ[הו]|נערך)|נקבע[הו]?)\s+(?:ה)?(?:פגיש[הת]|דיון|שיח[הת](?:\s+טלפון)?|ישיבה|שימוע)|(?:ה)?(?:פגיש[הת]|דיון|שיח[הת](?:\s+טלפון)?|ישיבה|שימוע)(?:\s+(?!לא(?:\s|$)|טרם(?:\s|$)|שלא(?:\s|$))\S+){0,2}\s+(?:התקיימ[הום]|(?:נערכ[הו]|נערך)|נקבע[הו]?)/gu
    },
    {
      category: 'תשלומים',
      action: /(?:שולם|שולמה|שולמו|שילם|שילמה|שילמו|בוצע|בוצעה|הועבר|הועברה|התקבל|התקבלה)\s+(?:ה)?(?:תשלום|סכום|חשבונית)|(?:ה)?(?:תשלום|סכום|חשבונית)\s+(?:שולם|שולמה|שולמו|בוצע|בוצעה|הועבר|הועברה|התקבל|התקבלה)|(?:טרם\s+התקבל|לא\s+התקבל|לא\s+שולם)\s+(?:ה)?(?:תשלום|סכום)/gu
    }
  ]);
  var FILTER_CATEGORIES = Object.freeze(EVENT_RULES.map(function (rule) { return rule.category; }).concat(['אזכור לבדיקה']));
  var NEGATION_REGEX = /(?:לא|טרם|ללא|שלא|בוטל[הו]?|נדחה|טיוטה|מתוכנן|צפוי|עשוי|אם|במידה)\s*$/u;
  var FILTER_LEVELS = Object.freeze([
    Object.freeze({ value: 'precise', label: 'מדויקת', maxDistance: 35 }),
    Object.freeze({ value: 'balanced', label: 'מאוזנת', maxDistance: 85 }),
    Object.freeze({ value: 'broad', label: 'רחבה - גם אזכורים לבדיקה', maxDistance: 140 })
  ]);
  var DEFAULT_FILTER_LEVEL = 'balanced';

  function hasMeaningfulNonDateText(text, matches) {
    var source = String(text || '');
    var cursor = 0;
    var remainder = '';

    (matches || []).forEach(function (match) {
      remainder += source.slice(cursor, match.index);
      cursor = match.index + match.length;
    });
    remainder += source.slice(cursor);

    remainder = remainder.replace(TIME_REGEX, ' ');
    remainder = remainder.replace(DATE_TIME_CONNECTOR_REGEX, ' ');

    var meaningfulCharacters = remainder.match(/[\p{L}\p{N}]/gu) || [];
    return meaningfulCharacters.length >= 2;
  }

  function classifyEvent(text, dateMatch, dates, maxDistance) {
    var boundaries = [0, text.length];
    (dates || []).forEach(function (other) {
      if (other === dateMatch) return;
      if (other.index < dateMatch.index) boundaries[0] = Math.max(boundaries[0], other.index + other.length);
      if (other.index > dateMatch.index) boundaries[1] = Math.min(boundaries[1], other.index);
    });
    var beforeClause = text.slice(boundaries[0], dateMatch.index);
    var lastSeparator = Math.max(beforeClause.lastIndexOf(','), beforeClause.lastIndexOf(';'), beforeClause.lastIndexOf('!'), beforeClause.lastIndexOf('?'));
    var sentenceEnd;
    var sentenceRegex = /\.(?=\s|$)/g;
    while ((sentenceEnd = sentenceRegex.exec(beforeClause)) !== null) lastSeparator = Math.max(lastSeparator, sentenceEnd.index);
    if (lastSeparator >= 0) boundaries[0] += lastSeparator + 1;
    var afterClause = text.slice(dateMatch.index + dateMatch.length, boundaries[1]);
    var nextSeparators = [',', ';', '!', '?'].map(function (separator) { return afterClause.indexOf(separator); }).filter(function (index) { return index >= 0; });
    var nextSentenceEnd = /\.(?=\s|$)/.exec(afterClause);
    if (nextSentenceEnd) nextSeparators.push(nextSentenceEnd.index);
    if (nextSeparators.length) boundaries[1] = dateMatch.index + dateMatch.length + Math.min.apply(null, nextSeparators);
    var clause = text.slice(boundaries[0], boundaries[1]);
    var dateIndex = dateMatch.index - boundaries[0];
    var best = null;

    EVENT_RULES.forEach(function (rule) {
      rule.action.lastIndex = 0;
      var match;
      while ((match = rule.action.exec(clause)) !== null) {
        var distance = match.index > dateIndex + dateMatch.length
          ? match.index - dateIndex - dateMatch.length
          : dateIndex > match.index + match[0].length
            ? dateIndex - match.index - match[0].length : 0;
        if (distance > maxDistance) continue;
        var before = clause.slice(Math.max(0, match.index - 18), match.index);
        if (NEGATION_REGEX.test(before)) continue;
        if (!best || distance < best.distance) best = { category: rule.category, distance: distance };
      }
    });
    if (!best && /^,\s*(?:טרם|לא)\s+(?:התקבל|שולם)\s+(?:ה)?(?:תשלום|סכום)/u.test(afterClause)) {
      return 'תשלומים';
    }
    return best && best.category;
  }

  function build(fileItems, filterLevel) {
    var entries = [];
    var level = FILTER_LEVELS.find(function (option) { return option.value === filterLevel; }) ||
      FILTER_LEVELS.find(function (option) { return option.value === DEFAULT_FILTER_LEVEL; });

    (fileItems || []).forEach(function (fileItem, fileOrder) {
      if (!Array.isArray(fileItem.blocks)) return;

      fileItem.blocks.forEach(function (block) {
        var matches = DateEngine.findDates(block.text);
        if (!matches.length || !hasMeaningfulNonDateText(block.text, matches)) return;

        matches.forEach(function (match, occurrenceIndex) {
          if (level.value === 'precise' && !/(?:ביום|בתאריך)\s*$/u.test(block.text.slice(0, match.index))) return;
          var category = classifyEvent(block.text, match, matches, level.maxDistance);
          if (!category && level.value === 'broad') category = 'אזכור לבדיקה';
          if (!category) return;
          entries.push({
            id: fileItem.id + ':' + block.index + ':' + match.index + ':' + occurrenceIndex,
            normalizedDate: match.normalizedDate,
            category: category,
            rawDate: match.raw,
            matchIndex: match.index,
            matchLength: match.length,
            paragraphText: block.text,
            blockIndex: block.index,
            blockKind: block.kind,
            location: block.location,
            fileId: fileItem.id,
            fileName: fileItem.name,
            fileOrder: fileOrder
          });
        });
      });
    });

    entries.sort(function (a, b) {
      return a.normalizedDate.localeCompare(b.normalizedDate) ||
        a.fileOrder - b.fileOrder ||
        a.blockIndex - b.blockIndex ||
        a.matchIndex - b.matchIndex;
    });

    return entries;
  }

  function group(entries) {
    var groups = [];
    var current = null;
    (entries || []).forEach(function (entry) {
      if (!current || current.date !== entry.normalizedDate) {
        current = { date: entry.normalizedDate, entries: [] };
        groups.push(current);
      }
      current.entries.push(entry);
    });
    return groups;
  }

  function filterByCategory(entries, category) {
    if (!category || category === 'all') return (entries || []).slice();
    return (entries || []).filter(function (entry) { return entry.category === category; });
  }

  global.TimelineBuilder = Object.freeze({
    build: build,
    group: group,
    filterByCategory: filterByCategory,
    categories: FILTER_CATEGORIES,
    filterLevels: FILTER_LEVELS,
    defaultFilterLevel: DEFAULT_FILTER_LEVEL
  });
})(globalThis);
