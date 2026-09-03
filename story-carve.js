// ============================================================
// story-carve.js - DRAFT, story.html only.
// ------------------------------------------------------------
// Reuses the actual carved-lettering technique from the home page
// (HB_GLYPHS / hbCutPass / hbCutText in 01-app-core.js) so this
// page's section headings are cut into a board the same way the
// home page's wordmark and tagline are, instead of being plain
// typeset text - see the "compare home page art vs story page art"
// conversation this came out of.
//
// This is a SCOPED COPY, not a shared import: story.html loads no
// other app script, and duplicating the ~12 glyphs actually needed
// here is far cheaper than pulling in all of 01-app-core.js just for
// this. If more headings are added later and need a letter not
// listed below, copy its path data straight from HB_GLYPHS in
// 01-app-core.js - the letterforms have to match exactly or the two
// pages will visibly use two different alphabets.
// ============================================================

var STORY_HB_GLYPHS = {
  ' ': { w: 30, d: [] },
  'A': { w: 72, d: ['M7,101 C16,72 27,38 36,3',
                    'M36,3 C45,38 56,72 65,101',
                    'M18,67 C29,64 43,64 54,67'] },
  'D': { w: 70, d: ['M11,3 C9,36 12,70 11,101',
                    'M11,4 C38,1 63,14 62,52 C61,90 38,103 11,100'] },
  'E': { w: 58, d: ['M13,3 C11,36 14,70 13,101',
                    'M13,4 C27,1 43,3 54,2',
                    'M13,51 C25,48 37,49 46,50',
                    'M13,100 C27,103 43,100 55,99'] },
  'H': { w: 70, d: ['M11,3 C9,36 12,70 11,101',
                    'M60,3 C58,36 61,70 60,101',
                    'M11,52 C25,49 46,49 60,52'] },
  'I': { w: 26, d: ['M13,3 C11,36 15,70 13,101'] },
  'M': { w: 88, d: ['M9,101 C7,70 10,36 9,3',
                    'M9,4 C19,36 32,66 44,88',
                    'M44,88 C56,66 69,36 79,4',
                    'M79,3 C77,36 80,70 79,101'] },
  'N': { w: 72, d: ['M10,101 C8,70 11,36 10,3',
                    'M10,4 C24,36 47,72 62,100',
                    'M62,100 C60,70 63,36 62,3'] },
  'O': { w: 76, d: ['M38,2 C15,2 4,23 4,52 C4,81 15,101 38,101 C61,101 72,81 72,52 C72,23 61,2 38,2Z'] },
  'R': { w: 68, d: ['M11,3 C9,36 12,70 11,101',
                    'M11,4 C34,1 62,6 62,29 C62,48 44,54 11,52',
                    'M35,52 C45,68 56,85 64,101'] },
  'S': { w: 64, d: ['M56,20 C48,4 20,0 12,18 C4,36 27,45 41,54 C57,63 60,84 45,94 C31,103 12,97 6,83'] },
  'T': { w: 62, d: ['M4,5 C20,2 43,3 58,3',
                    'M31,4 C29,36 33,70 31,101'] },
  'U': { w: 70, d: ['M11,3 C9,28 10,52 11,68 C12,90 23,101 37,101 C51,101 61,90 62,68 C63,52 64,28 62,3'] },
  'W': { w: 92, d: ['M8,3 C13,36 18,70 25,101',
                    'M25,101 C32,74 39,48 46,26',
                    'M46,26 C53,48 60,74 67,101',
                    'M67,101 C74,70 79,36 84,3'] }
};

var STORY_HB_TRACKING = 12;
var STORY_HB_CUT_W    = 15;
var STORY_HB_CUT_DX   = 1.9;
var STORY_HB_CUT_DY   = 2.2;

function storyHbCutPass(chars, width, colour, dx, dy, opacity) {
  var out = '<g transform="translate(' + dx + ',' + dy + ')"' +
            (opacity === 1 ? '' : ' opacity="' + opacity + '"') + '>';
  var x = 0, i, j, g;

  for (i = 0; i < chars.length; i++) {
    g = STORY_HB_GLYPHS[chars[i]];
    if (g.d.length) {
      out += '<g transform="translate(' + x + ',0)">';
      for (j = 0; j < g.d.length; j++) {
        out += '<path d="' + g.d[j] + '" fill="none" stroke="' + colour +
               '" stroke-width="' + width + '" stroke-linecap="round" stroke-linejoin="round"/>';
      }
      out += '</g>';
    }
    x += g.w + STORY_HB_TRACKING;
  }

  return out + '</g>';
}

// sign = { text, lit, shadow, floor } - same shape as HB_SIGNS entries.
function storyHbCutText(sign) {
  var raw = String(sign.text).toUpperCase();
  var chars = [];
  var total = 0;
  var i;

  for (i = 0; i < raw.length; i++) {
    if (!STORY_HB_GLYPHS[raw[i]]) {
      console.warn('story-carve: no glyph for "' + raw[i] +
                   '" - add it from HB_GLYPHS in 01-app-core.js.');
      continue;
    }
    chars.push(raw[i]);
    total += STORY_HB_GLYPHS[raw[i]].w + STORY_HB_TRACKING;
  }
  total -= STORY_HB_TRACKING;

  var pad = STORY_HB_CUT_W / 2 + 6;

  return '<svg viewBox="' + (-pad) + ' ' + (-pad) + ' ' + (total + pad * 2) +
         ' ' + (101 + pad * 2) + '" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
    storyHbCutPass(chars, STORY_HB_CUT_W,       sign.lit,      STORY_HB_CUT_DX,        STORY_HB_CUT_DY,        0.95) +
    storyHbCutPass(chars, STORY_HB_CUT_W,       sign.shadow,  -STORY_HB_CUT_DX * 0.7, -STORY_HB_CUT_DY * 0.7,  0.9) +
    storyHbCutPass(chars, STORY_HB_CUT_W - 2.2, sign.floor,    0,                       0,                       1) +
  '</svg>';
}

// Same pale-board trio the home page uses for text cut into pale
// stock (the tagline and the About heading) rather than paint - see
// the comment above HB_SIGNS in 01-app-core.js.
var STORY_PALE_BOARD = { lit: '#FFFBF0', shadow: '#432E14', floor: '#7A5B36' };

// For text carved into the mission plate's own bark/wood surface
// (not pale stock) - tuned the same way HB_SIGNS tunes each button's
// trio "from the same paint as the block it is cut into": a warm
// light tint for the lit wall, a near-black brown for the shadow
// wall, and a mid-brown floor close to (but readably darker than)
// the plate's own tan.
var STORY_WOOD_PLATE = { lit: '#F0D9B0', shadow: '#3A2712', floor: '#7A5330' };

var STORY_CARVED_SIGNS = [
  { hostId: 'storyCutMission', text: 'THE MISSION' },
  { hostId: 'storyCutOrigin',  text: 'HOW IT STARTED' },
  { hostId: 'storyCutPeople',  text: 'WHO WE ARE' },
  // Home page only (index.html) - the mission plaque's heading. Runs
  // here too (this script is now also loaded by index.html) since
  // .getElementById just no-ops for hosts that don't exist on
  // whichever page is currently loaded.
  { hostId: 'missionCutTitle', text: 'OUR MISSION', colors: STORY_WOOD_PLATE }
];

document.addEventListener('DOMContentLoaded', function () {
  STORY_CARVED_SIGNS.forEach(function (sign) {
    var host = document.getElementById(sign.hostId);
    if (!host) return;
    var colors = sign.colors || STORY_PALE_BOARD;
    host.innerHTML = storyHbCutText({
      text:   sign.text,
      lit:    colors.lit,
      shadow: colors.shadow,
      floor:  colors.floor
    });
  });
});
