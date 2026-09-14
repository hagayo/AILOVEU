'use strict';

window.EyeTracking = window.EyeTracking || {};
window.EyeTracking.gameConfig = {
  initialLength: 3,
  cueMs: 1200,
  gapMs: 300,
  leadInMs: 650,
  successMs: 1150,
  feedbackMs: 230,
  shuffleMs: 800,
  // Keep the correct face lit long enough to be useful feedback after a mistake.
  errorRevealMs: 2500,
  levels: {
    beginner: { label: 'מתחילים', secondsPerFace: 0, cueMs: 1200 },
    advanced: { label: 'מתקדמים', secondsPerFace: 10, cueMs: 1000 },
    champion: { label: 'אלופי־על', secondsPerFace: 5, cueMs: 800 },
  },
  // Ordered from the foreground toward the back; overlaps resolve in this order.
  faces: [
    { id: 'natural', label: 'טבעי', color: '#ffa58b', frequency: 659.25,
      outline: window.EyeTracking.config.bubbles.faceOutline },
    { id: 'blue', label: 'כחול', color: '#62caff', frequency: 523.25,
      outline: window.EyeTracking.config.smoke.faceOutline },
    { id: 'green', label: 'ירוק', color: '#9cd477', frequency: 392,
      outline: [[465,283],[426,308],[383,340],[347,374],[323,423],[307,473],
        [302,526],[306,592],[315,655],[323,713],[329,766],[341,829],[357,883],
        [376,933],[409,964],[449,977],[470,949],[492,912],[495,840],[486,770],
        [481,700],[477,627],[478,556],[484,484],[503,422],[521,375],[543,335]] },
    { id: 'yellow', label: 'צהוב', color: '#ffe078', frequency: 329.63,
      // A full irregular strip: yellow/green seam down to the base of the chin,
      // then the yellow/orange seam back up. Coordinates follow the artwork.
      outline: [[335,310],[320,350],[309,400],[303,450],[301,500],[301,550],
        [300,580],[307,620],[301,660],[300,710],[302,750],[309,790],[319,830],
        [334,870],[352,910],[362,928],[332,946],[293,954],[258,948],[236,934],
        [220,910],[208,883],[193,847],[183,810],[176,780],[168,744],[164,713],
        [164,686],[162,661],[170,635],[174,610],[163,580],[160,555],[167,530],
        [173,490],[177,450],[190,410],[214,375],[255,350],[300,321]] },
    { id: 'orange', label: 'כתום', color: '#ffa348', frequency: 261.63,
      outline: [[214,375],[190,410],[177,450],[173,490],[167,530],[160,555],
        [163,580],[174,610],[170,635],[162,661],[164,686],[164,713],[168,744],
        [176,780],[183,810],[193,847],[208,883],[219,890],[203,905],[171,913],
        [143,905],[119,886],[100,850],[84,800],[80,740],[72,700],[62,660],
        [58,630],[59,600],[66,560],[76,520],[86,480],[97,440],[106,405],
        [137,393],[175,380]] },
  ],
};

// A date-seeded generator keeps the daily challenge identical for every visitor
// using the same local calendar day, without a server or account.
window.EyeTracking.dailySeed = function dailySeed(date = new Date()) {
  const key = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  let seed = 2166136261;
  for (const char of key) {
    seed ^= char.charCodeAt(0);
    seed = Math.imul(seed, 16777619);
  }
  return seed >>> 0;
};
window.EyeTracking.createSeededRandom = function createSeededRandom(value) {
  let seed = value >>> 0 || 1;
  return () => {
    seed ^= seed << 13;
    seed ^= seed >>> 17;
    seed ^= seed << 5;
    return (seed >>> 0) / 4294967296;
  };
};
window.EyeTracking.createDailyRandom = function createDailyRandom(date = new Date()) {
  return window.EyeTracking.createSeededRandom(window.EyeTracking.dailySeed(date));
};
