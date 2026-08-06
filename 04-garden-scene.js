// ============================================
// 04: GARDEN SCENE - plant height/positions, grass, fence, garden rendering, drag-to-place
// Part of DISCIPLANT - split from script.js.
// Loaded as a plain global script (no modules).
// Must load in order: 01 -> 02 -> 03 -> 04 -> 05,
// after firebase-config.js. All functions/vars here
// share one global scope with the other 4 files.
// ============================================

// ============================================
// Plant height system (shown on hover)
// ============================================
// Height is a function of DAYS GROWN, not of the number that scales
// the artwork. The two used to be the same thing, which is what made
// a seed 1.6 m: the on-screen scale starts at 1 and multiplies up, so
// anything derived from it starts at whatever "scale 1" was declared
// to be and can never be small.
//
// The curve is fantasy, not botany: these are beanstalks. It has
// three parts, each doing a different job.
//
//   1. A seed floor. Day zero is 2 cm and nothing is ever shorter.
//
//   2. An S-curve (a Hill function) that carries the plant from
//      sprout to giant across its first two months, tuned so that
//      day 60 lands on 50 m exactly. The exponent is what gives the
//      beanstalk shape: barely anything for the first few days, then
//      it takes off, then it eases as the canopy fills in.
//
//         0 days   2.0 cm      21 days    8.0 m
//         1 day    3.1 cm      30 days   16.2 m
//         7 days     77 cm     45 days   33.0 m
//        14 days    3.4 m      60 days   50.0 m
//
//   3. A slow logarithmic tail that only starts once past day 60.
//      The S-curve alone flattens against its ceiling, and a plant
//      whose number stops moving is a plant that stops rewarding the
//      person growing it. The tail keeps it climbing forever without
//      the growth spurt continuing: 84 m at three months, 149 m at a
//      year, 194 m at ten. (For scale, the tallest real tree ever
//      measured was about 116 m - a year-old plant here is beyond
//      anything that has actually grown on Earth, which is the
//      intent.)
//
// It is strictly increasing at every single day boundary, forever.
// It does get slow in absolute terms out past a year - around 7 cm a
// day at 365, 2 cm a day at 1000 - so the displayed figure moves
// every few days rather than every day for very old plants.
//
// TWO THINGS IT DELIBERATELY IGNORES, both for the same reason: they
// change how big a plant LOOKS without changing how much it has
// grown.
//
//   depth      where a plant sits front-to-back in the scene. Pure
//              perspective - dragging a plant back does not shrink
//              the plant, so it must not shrink its height.
//   flourishes the streak momentum multiplier, and the light played
//              over a plant while it grows. Both are celebration laid
//              on top of the plant's real size and neither is
//              measured.
//   the toggle the show/hide growth button (see today's growth,
//              below) changes how big a plant is DRAWN, between
//              before and after the day it earned today. The height
//              is read from task.totalGrowthDays in both positions,
//              so it says the same thing either way - it is a fact
//              about the plant, not a readout of what is currently on
//              screen. It does still move on its own the moment a box
//              is ticked, because ticking raises the day count.
//
// So the label answers "how much has this grown", consistently, from
// anywhere in the app; it is not a readout of pixels on screen.
var PLANT_SEED_HEIGHT_M    = 0.02; // a plant with no days yet
var PLANT_HEIGHT_CANOPY_M  = 120;  // ceiling the S-curve alone approaches
var PLANT_HEIGHT_STEEPNESS = 2.2;  // >1 = slow start then a growth spurt
var PLANT_HEIGHT_MIDPOINT  = 69.937; // days; solved so day 60 lands on 50 m
var PLANT_HEIGHT_KNEE_DAYS = 60;   // where the S-curve hands over to the tail
var PLANT_HEIGHT_ANCIENT_M = 18;   // metres per e-fold of age past the knee

// Precomputed rather than raised on every plant of every frame.
var PLANT_HEIGHT_MIDPOINT_POW =
  Math.pow(PLANT_HEIGHT_MIDPOINT, PLANT_HEIGHT_STEEPNESS);

function computeHeightMeters(growthDays) {
  var days = Math.max(0, growthDays || 0);
  if (!isFinite(days)) days = 0;

  var grown = Math.pow(days, PLANT_HEIGHT_STEEPNESS);
  var surge = PLANT_HEIGHT_CANOPY_M * grown / (PLANT_HEIGHT_MIDPOINT_POW + grown);

  // Zero until the knee, so the first two months are the S-curve's
  // alone and day 60 hits its target untouched.
  var ancient = PLANT_HEIGHT_ANCIENT_M * Math.log(
    1 + Math.max(0, days - PLANT_HEIGHT_KNEE_DAYS) / PLANT_HEIGHT_KNEE_DAYS
  );

  return PLANT_SEED_HEIGHT_M + surge + ancient;
}

// Centimetres below a metre, metres above it - "0.02 m" is not how
// anyone describes a seed. Sub-10cm keeps one decimal so the first
// few days are visibly different from each other rather than all
// rounding to the same whole number.
function formatHeightMeters(meters) {
  var m = Math.max(0, meters || 0);
  if (m < 1) {
    var cm = m * 100;
    return (cm < 10 ? cm.toFixed(1) : String(Math.round(cm))) + ' cm';
  }
  return m.toFixed(1) + ' m';
}


// ============================================
// Plant positions in the garden scene - perspective depth
// ============================================
// Every task can be placed at any free (x, y) point in the garden -
// there's no fixed depth row to snap to. Two internal "slots" groups
// still exist purely so freshly-added, never-dragged plants spread
// out across the width instead of stacking in the middle (see
// assignPermanentPositions below) - they don't affect depth.
//
// Depth perception: a plant's y position (bottomPct - how far up
// the scene it sits) continuously drives two things: how big it
// renders (further up/back = smaller, further down/front = bigger)
// and its stacking order (further-down/front plants paint on top of
// further-up/back ones), via computeDepthScale/computeDepthZ below.
// ============================================

// Deterministic pseudo-random value in [0, 1) for a given integer
// seed. Same input always produces the same output - this is what
// makes the automatic-slot assignment stable across renders/reloads
// instead of re-shuffling every time the garden re-renders.
function hashSeed(n) {
  var x = Math.sin(n * 12.9898) * 43758.5453123;
  return x - Math.floor(x);
}

// Used only to spread never-dragged plants into one of two
// interleaved slot groups (see phaseOffset in computePlantLayout)
// so they don't all land in a perfectly even single-file line.
var SLOT_GROUPS = {
  a: { centerMin: 16, centerMax: 84, phaseOffset: 0   },
  b: { centerMin: 16, centerMax: 84, phaseOffset: 0.5 },
};
var DEFAULT_BOTTOM_PCT = 40;
var PLANT_Z_INDEX      = 3;

// Depth-perception tuning. bottomPct's visible range is clamped to
// [DEPTH_BOTTOM_MIN, DEPTH_BOTTOM_MAX] by clampBottomPct() below.
// DEFAULT_BOTTOM_PCT is treated as the "neutral" depth (scale 1x,
// matching how auto-placed plants have always looked) - dragging a
// plant further down toward DEPTH_BOTTOM_MIN (foreground) scales it
// up toward DEPTH_MAX_SCALE, and further up toward DEPTH_BOTTOM_MAX
// (background) scales it down toward DEPTH_MIN_SCALE.
var DEPTH_BOTTOM_MIN = 4;
var DEPTH_BOTTOM_MAX = 92;
var DEPTH_MIN_SCALE  = 0.6;  // furthest back
var DEPTH_MAX_SCALE  = 1.4;  // furthest front

// Bigger/closer plants should always paint over smaller/further ones
// - a simple painter's-algorithm z-index derived straight from
// bottomPct, so stacking order always matches the size cue instead
// of depending on task order or manual z-index bookkeeping.
function computeDepthScale(bottomPct) {
  var clamped = Math.max(DEPTH_BOTTOM_MIN, Math.min(DEPTH_BOTTOM_MAX, bottomPct));
  if (clamped <= DEFAULT_BOTTOM_PCT) {
    var tNear = (DEFAULT_BOTTOM_PCT - clamped) / (DEFAULT_BOTTOM_PCT - DEPTH_BOTTOM_MIN);
    return 1 + (DEPTH_MAX_SCALE - 1) * tNear;
  }
  var tFar = (clamped - DEFAULT_BOTTOM_PCT) / (DEPTH_BOTTOM_MAX - DEFAULT_BOTTOM_PCT);
  return 1 - (1 - DEPTH_MIN_SCALE) * tFar;
}

function computeDepthZ(bottomPct) {
  var clamped = Math.max(DEPTH_BOTTOM_MIN, Math.min(DEPTH_BOTTOM_MAX, bottomPct));
  // Lower bottomPct (further down/toward the viewer) → higher z-index.
  return PLANT_Z_INDEX + Math.round((DEPTH_BOTTOM_MAX - clamped) * 5);
}

function getTaskSlotGroup(taskId) {
  var seed = hashSeed(taskId);
  return seed < 0.5 ? 'a' : 'b';
}

// A task with a manually-dragged position stores posX and posY
// (each 0–100, as a left%/bottom% pair) directly on the task,
// bypassing the automatic slot layout below entirely - this is a
// free (x, y) point, not a snap to any row or band.
function hasCustomPosition(task) {
  return typeof task.posX === 'number' && typeof task.posY === 'number';
}

// Keeps a plant's title - a fixed 130px-wide tag centered right below
// it - fully on-screen. A flat percentage clamp either wastes width
// on a wide desktop or still lets labels clip off a narrow phone, so
// instead the safe margin is computed in real pixels against the
// current viewport width: plants can spread across almost the entire
// page on a wide screen, while narrower screens pull the edges in
// just enough to keep every title readable.
function clampCenterPct(pct) {
  var trackW      = (gardenTrackEl && gardenTrackEl.getBoundingClientRect().width) ||
                     ((typeof window !== 'undefined' && window.innerWidth * 3) || 2400);
  var labelHalfPx = 68; // half of .plant-label-tag's 130px width, plus a small buffer
  var marginPct   = Math.min(30, (labelHalfPx / trackW) * 100);
  return Math.max(marginPct, Math.min(100 - marginPct, pct));
}

// Keeps a dragged plant's base from landing above the top of the
// scene or below the visible grass - a free y placement, just kept
// within a sane visible range.
function clampBottomPct(pct) {
  return Math.max(4, Math.min(92, pct));
}

function computePlantLayout(task, indexInGroup, groupTotal) {
  var group = getTaskSlotGroup(task.id);
  var cfg   = SLOT_GROUPS[group];
  var range = cfg.centerMax - cfg.centerMin;

  var basePct;
  if (groupTotal <= 1) {
    basePct = cfg.centerMin + range / 2;
  } else {
    // Evenly spaced slots across the width, then group "b"'s slots
    // are nudged by half a slot (phaseOffset: 0.5) so its plants fall
    // into the gaps of group "a"'s plants instead of lining up
    // directly on top of them.
    var slot = range / groupTotal;
    basePct = cfg.centerMin + slot * (indexInGroup + 0.5) + slot * (cfg.phaseOffset || 0);
  }

  // Small stable jitter (from a second, independent hash) so plants
  // don't line up in a perfectly even row.
  var jitterSeed  = hashSeed(task.id * 7 + 3);
  var jitterRange = range / Math.max(groupTotal, 1) * 0.35;
  var centerPct   = clampCenterPct(basePct + (jitterSeed - 0.5) * jitterRange);

  return {
    center:      centerPct + '%',
    bottomPct:   DEFAULT_BOTTOM_PCT,
    depthScale:  computeDepthScale(DEFAULT_BOTTOM_PCT),
    z:           computeDepthZ(DEFAULT_BOTTOM_PCT),
  };
}

// Permanently assigns an auto-computed posX/posY to every task that
// doesn't already have one (i.e. hasn't been manually dragged). This
// is what makes plant positions stable: instead of recomputing an
// undragged plant's slot every render based on how many OTHER
// undragged plants currently exist (which shifts every remaining
// plant's slot the moment one of them gets dragged out of that
// pool), each plant's automatic position is computed exactly once,
// written onto the task like a manual placement, and never touched
// again - dragging one plant can no longer move any other plant.
// Returns true if any task was newly assigned (so callers know to
// persist the change).
function assignPermanentPositions() {
  var assignedAny = false;
  var slotGroups = { a: [], b: [] };

  tasks.forEach(function (task) {
    if (!hasCustomPosition(task)) {
      slotGroups[getTaskSlotGroup(task.id)].push(task);
    }
  });

  Object.keys(slotGroups).forEach(function (group) {
    var list = slotGroups[group];
    list.forEach(function (task, idx) {
      var layout   = computePlantLayout(task, idx, list.length);
      task.posX    = parseFloat(layout.center);
      task.posY    = layout.bottomPct;
      assignedAny  = true;
    });
  });

  return assignedAny;
}

// Layout for a manually-placed plant - its left%/bottom% come
// straight from the saved (x, y) override, and its size + stacking
// order are derived from that same y so plants dropped further down
// (toward the viewer) look and paint bigger/closer than ones dropped
// further up (toward the horizon).
function computeCustomLayout(task) {
  var bottomPct = clampBottomPct(task.posY);
  return {
    center:      clampCenterPct(task.posX) + '%',
    bottomPct:   bottomPct,
    depthScale:  computeDepthScale(bottomPct),
    z:           computeDepthZ(bottomPct),
  };
}


// ============================================
// Ground texture - grass blade clumps
//
// The scrollable garden track was otherwise a flat green plane, so
// swiping left/right gave no visual feedback that the view was
// actually moving. These clumps live INSIDE #gardenSceneTrack (the
// element that actually scrolls), scattered across its full 300%
// width, so they visibly slide past as you swipe - unlike the fixed
// sky/lawn backdrop behind everything, which never moves.
//
// Deterministic (hashSeed-based) so the field looks the same on
// every render/reload instead of re-shuffling. Blade height and tint
// are derived from the same depth math as the plants (computeDepthScale/
// lerpColor, both already defined above) so clumps nearer the "front"
// of the garden render bigger and more saturated than ones further
// toward the horizon - reinforcing the same depth cue the plants use.
// ============================================

// Meadow's blades, kept here as the fallback rather than only inside
// the skin: this file has to be able to draw a lawn before any skin
// is resolved, and a garden with no grass is a worse failure than a
// garden in the wrong green.
var GRASS_PALETTE = ['#3a6020', '#4a7a30', '#537d33', '#5a9035', '#487526', '#6aab45', '#436b2c'];
var GRASS_TIP_LIGHT = '#cfe8a0';

// Grass is the one part of the landscape a CSS variable can't reach.
// Every blade's gradient is written as an inline style on the blade
// itself (see buildGrassClump below), so the palette has to arrive as
// data rather than as a token - which is why skins carry .grass and
// .grassTip alongside their .vars.
function getGrassPalette(skin) {
  var palette = (skin && Array.isArray(skin.grass) && skin.grass.length)
    ? skin.grass
    : GRASS_PALETTE;
  return {
    palette: palette,
    tip:     (skin && skin.grassTip) || GRASS_TIP_LIGHT,
  };
}
// The track is 3x the viewport width, so this total is split evenly
// across those 3 "screens" - 45 total works out to ~15 clumps visible
// in any single field of view at a time, matching GRASS_PER_SCREEN.
var GRASS_PER_SCREEN  = 15;
var GRASS_CLUMP_COUNT = GRASS_PER_SCREEN * 3;

function buildGrassClump(xPct, yPct, seedBase, grass) {
  // Resolved by the caller once per field rather than once per clump,
  // but defaulted here too so a stray call can't throw.
  grass = grass || getGrassPalette(null);
  var wrap = document.createElement('div');
  wrap.className = 'grass-clump';
  wrap.style.left = xPct + '%';
  wrap.style.bottom = yPct + '%';

  // Reuse the plants' own depth scale so clumps shrink/lighten
  // toward the back of the garden the same way plants do.
  var depthScale = computeDepthScale(yPct);
  var bladeCount = 3;

  for (var b = 0; b < bladeCount; b++) {
    var s = seedBase + b * 2.3;
    var heightPx  = (9 + hashSeed(s) * 11) * depthScale;
    var widthPx   = 3 + hashSeed(s + 0.7) * 2.5;
    var rotDeg    = (hashSeed(s + 1.3) - 0.5) * 46;
    var offsetX   = (hashSeed(s + 2.1) - 0.5) * 14;
    var colorIdx  = Math.floor(hashSeed(s + 3.4) * grass.palette.length);
    var baseColor = grass.palette[colorIdx];
    var tipColor  = lerpColor(baseColor, grass.tip, 0.35);

    var blade = document.createElement('div');
    blade.className = 'grass-blade';
    blade.style.left      = offsetX + 'px';
    blade.style.width     = widthPx + 'px';
    blade.style.height    = Math.max(5, heightPx) + 'px';
    blade.style.background = 'linear-gradient(to top, ' + baseColor + ', ' + tipColor + ')';
    blade.style.transform  = 'translateX(-50%) rotate(' + rotDeg + 'deg)';
    blade.style.opacity    = (0.65 + hashSeed(s + 4.2) * 0.3).toFixed(2);
    wrap.appendChild(blade);
  }

  return wrap;
}

// ============================================
// Garden fence - DOM elements inside the scrollable track
// ============================================
// Previously the fence lived in the fixed #gardenBackdrop, so it
// never moved when the garden was panned. Rendering it here instead,
// as a direct child of #gardenSceneTrack (same as the grass field
// above), means it scrolls together with the plants and grass. See
// .garden-fence-strip / .garden-fence-shadow in style.css for the
// picket shading and ground-connecting shadow.
function renderFence(track) {
  var fence = document.createElement('div');
  fence.className = 'garden-fence-strip';
  track.appendChild(fence);

  var shadow = document.createElement('div');
  shadow.className = 'garden-fence-shadow';
  track.appendChild(shadow);
}

function renderGrassField(track, skin) {
  var grass = getGrassPalette(skin || getActiveGardenSkin());

  var field = document.createElement('div');
  field.className = 'grass-tuft-field';

  // Stratified placement: the track is divided into GRASS_CLUMP_COUNT
  // equal-width cells (one clump per cell), and each clump is jittered
  // to a random spot WITHIN its own cell. This keeps clumps spread
  // out evenly across the whole track - unlike pure random x/y, which
  // can easily leave empty gaps in one area and a dense bunch in
  // another purely by chance.
  var cellWidth = 100 / GRASS_CLUMP_COUNT;

  for (var i = 0; i < GRASS_CLUMP_COUNT; i++) {
    var seed = i * 9.173;
    var xPct = i * cellWidth + hashSeed(seed) * cellWidth;
    var yPct = 6 + hashSeed(seed + 0.5) * 76; // keep off the very top/bottom edges of the plot
    field.appendChild(buildGrassClump(xPct, yPct, seed * 3.7, grass));
  }

  track.appendChild(field);
}


// ============================================
// The sky above the garden, and the lawn below it
//
// The garden scrolls UP as well as sideways. What is up there is not
// a new scene - it is the same sky the top of the frame is already
// showing, carried further up and darkening as it goes, the way the
// sky does when you tip your head back. It is repainted from the real
// clock along with everything else: 05-stats-app.js publishes the
// current sky colours as --sky-top and --sky-high on every updateSky()
// tick, and the gradient below reads them, so noon up there is a paler
// blue than 3am with no code here knowing what time it is.
//
// The bottom of that strip fades out completely well before it reaches
// the plot, which is what keeps the unscrolled view byte-for-byte what
// it always was: the band of sky you can see without scrolling is the
// fixed #sky backdrop, untouched, exactly as before.
//
// The lawn moved in here too. It used to be a fixed element in
// #gardenBackdrop, which is why it sat still while the fence and the
// plants standing on it slid away - the ground stayed welded to the
// window. Rendered into the track it scrolls with everything rooted in
// it, and the fixed sky's own hills, haze and ground are switched off
// on the garden pages (see .sky-on-garden in style.css) so no second,
// motionless horizon can appear from behind this one.
// ============================================

// A whole starfield in one element: an invisible 2px dot wearing one
// box-shadow copy of itself per star. Cheaper than a node per star by
// two orders of magnitude, and hashSeed keeps the same sky coming back
// on every render instead of reshuffling.
//
// Offsets are in vw/vh so the field stays spread across the track at
// any window size - the track is 300% wide, hence the 300vw span.
// Placed only in the part of the strip you have to scroll to reach:
// the band already on screen has the fixed sky's own stars in it, and
// two starfields over each other reads as neither.
function buildStarfield(count, seedBase, topVh, spanVh) {
  var parts = [];
  for (var i = 0; i < count; i++) {
    var s      = seedBase + i * 4.113;
    var x      = (hashSeed(s) * 300).toFixed(2);
    var y      = (topVh + hashSeed(s + 0.61) * spanVh).toFixed(2);
    var alpha  = (0.3 + hashSeed(s + 1.27) * 0.6).toFixed(2);
    // Roughly one star in eight is a bright one.
    var spread = hashSeed(s + 2.03) < 0.13 ? '0.9px' : '0';
    parts.push(x + 'vw ' + y + 'vh 0 ' + spread + ' rgba(226,238,255,' + alpha + ')');
  }
  return parts.join(', ');
}

// Built once and reused: renderGarden() empties and refills the track
// on every render, and the stars are the one part of it that never
// depend on the tasks. The colours aren't in here - those live in the
// stylesheet as custom properties, so the strip keeps following the
// clock without being rebuilt.
var starfieldCache = null;

function getStarfieldMarkup() {
  if (starfieldCache === null) {
    starfieldCache =
      '<span class="sky-dust" style="box-shadow:' + buildStarfield(58, 17.5, 2, 94) + '"></span>' +
      '<span class="sky-dust sky-dust-b" style="box-shadow:' + buildStarfield(34, 89.3, 4, 90) + '"></span>';
  }
  return starfieldCache;
}

// ============================================
// What is actually up there - day and night
// ============================================
// The strip above the plot held nothing but stars. These are the
// things you scroll up to find: balloons and kites while the sun is
// up, constellations and planets once it is down.
//
// Every shape here is flat SVG built as a string, for exactly the
// reasons the plant art is: no <defs>, no gradients, and above all NO
// id attributes anywhere. Several copies of each shape are on screen
// at once and ids would collide the moment a second one rendered.
//
// Day and night are not two sets of markup swapped in and out - both
// are always in the DOM, and the .scene-night class that
// 05-stats-app.js puts on the scene cross-fades between them over the
// same 3s the starfield already uses, so nightfall arrives on
// everything at once instead of one layer at a time.
//
// Nothing in here knows what time it is, and nothing in here is
// rebuilt: the whole lot is one cached string (see skyDecorCache
// below), the same trick the starfield uses, because renderGarden()
// empties and refills the track on every single render and none of
// this depends on the tasks.

// --- Hot air balloons ---------------------------------------------
// A cream envelope with three darker gores painted over it, hung off
// a burner frame, with a wicker basket underneath.
//
// The gores are bands between two vertical arcs that both run from
// the top apex to the bottom point, which is what gives them the
// pinched-at-both-ends shape a real balloon's panels have - a plain
// rectangle striped over a circle reads as a beach ball instead.
//
// The basket is not the usual flat brown trapezoid. It is a flared
// tub with a rounded bottom, an overhanging rim that casts the top
// edge into shade, and a crossed diagonal weave inside it - wicker is
// woven on the bias, and drawing it that way is what makes it read as
// basketwork rather than a crate. Between it and the envelope sits an
// actual burner frame: two short posts and a bar, with the ropes
// terminating on the bar rather than vanishing into the rim.
//
// The weave lines deliberately stay well inside x 40-60 / y 130-142.
// There is no clip path anywhere in this file (that would need an id),
// so anything drawn on the basket has to fit inside the basket by
// construction or it will hang out over the edge of it.
var BALLOON_PALETTES = [
  { light: '#F4E9D8', dark: '#6FB0B5', basket: '#9A7048', rim: '#7C5636', weave: '#C39B6E' },
  { light: '#F7EEE1', dark: '#E4836A', basket: '#9A7048', rim: '#7C5636', weave: '#C39B6E' },
  { light: '#EAF1F4', dark: '#EEC069', basket: '#9A7048', rim: '#7C5636', weave: '#C39B6E' },
  { light: '#F4E9D8', dark: '#9AAEDC', basket: '#9A7048', rim: '#7C5636', weave: '#C39B6E' },
];

function buildBalloonSVG(paletteIndex) {
  var p = BALLOON_PALETTES[paletteIndex % BALLOON_PALETTES.length];
  return (
    '<svg viewBox="0 0 100 150" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      // Ropes first so the envelope above and the frame below both
      // paint over their ends and no cut edge shows.
      '<path d="M22 92 L40 118 M78 92 L60 118 M43 114 L45 118 M57 114 L55 118" ' +
        'fill="none" stroke="' + p.rim + '" stroke-width="1.5" opacity="0.7"/>' +
      '<path d="M50 4 C94 4 92 26 92 50 C92 76 76 96 50 118 C24 96 8 76 8 50 C8 26 6 4 50 4 Z" ' +
        'fill="' + p.light + '"/>' +
      '<path d="M50 4 C5.9 4 8 26 8 50 C8 76 24 96 50 118 C34.5 96 25 76 25 50 C25 26 23.8 4 50 4 Z" ' +
        'fill="' + p.dark + '"/>' +
      '<path d="M50 4 C41.6 4 42 26 42 50 C42 76 45 96 50 118 C55 96 58 76 58 50 C58 26 58.4 4 50 4 Z" ' +
        'fill="' + p.dark + '"/>' +
      '<path d="M50 4 C76.3 4 75 26 75 50 C75 76 65.5 96 50 118 C76 96 92 76 92 50 C92 26 94.1 4 50 4 Z" ' +
        'fill="' + p.dark + '"/>' +
      // Burner frame: bar, then the two posts dropping to the rim.
      '<rect x="38.5" y="116.4" width="23" height="3.2" rx="1.6" fill="' + p.rim + '"/>' +
      '<path d="M42 119.6 L41 126 M58 119.6 L59 126" fill="none" ' +
        'stroke="' + p.rim + '" stroke-width="2" stroke-linecap="round"/>' +
      // Basket: flared tub, rounded at the bottom corners.
      '<path d="M36.5 128.5 L63.5 128.5 L62 141.5 Q61.2 146.4 55 147 L45 147 ' +
        'Q38.8 146.4 38 141.5 Z" fill="' + p.basket + '"/>' +
      // Bias weave. Two sets of parallels crossing into a lattice.
      '<path d="M40 142 L49 130 M46 142 L55 130 M52 142 L60 131 ' +
        'M60 142 L51 130 M54 142 L45 130 M48 142 L40 131" fill="none" ' +
        'stroke="' + p.weave + '" stroke-width="1.1" opacity="0.55" stroke-linecap="round"/>' +
      // Rim last, so it overhangs everything and shades the top edge.
      '<path d="M34.5 125.4 L65.5 125.4 L64.4 129.8 L35.6 129.8 Z" fill="' + p.rim + '"/>' +
    '</svg>'
  );
}

// --- Kites --------------------------------------------------------
// Four different kites, not one shape in four colourways: a quartered
// diamond, a delta, a box kite and a six-sided rokkaku. They share a
// palette table and a string, and nothing else. The tails are bare
// line now - no bows.
//
// Every stripe, chevron and panel vertex is a point ON the kite's own
// outline, worked out from its corner points rather than eyeballed,
// so a panel meets the silhouette exactly instead of poking out of it
// or falling short. Same reason as the basket weave above: with no
// clip paths available, everything has to fit by construction.
var KITE_PALETTES = [
  { a: '#F6EFE2', b: '#D2825F', c: '#5C9BA6', shade: '#B96F4E', spar: '#4A4266' },
  { a: '#EFF3F0', b: '#F3C173', c: '#88BFAE', shade: '#D9A64F', spar: '#4A4266' },
  { a: '#F5EADA', b: '#B3A5D8', c: '#8FC3DE', shade: '#9A8BC4', spar: '#4A4266' },
  { a: '#F2EFE6', b: '#8FB98A', c: '#E7B96F', shade: '#79A175', spar: '#4A4266' },
];

// Shape 0 - diamond, quartered, with an inset diamond at the cross.
function buildKiteDiamond(p) {
  return (
    '<polygon points="60,8 108,62 60,132 12,62" fill="' + p.a + '"/>' +
    '<polygon points="60,8 60,62 12,62" fill="' + p.b + '"/>' +
    '<polygon points="60,62 108,62 60,132" fill="' + p.b + '"/>' +
    '<polygon points="60,34 84,62 60,90 36,62" fill="' + p.c + '"/>' +
    '<path d="M60 8 L60 132 M12 62 L108 62" fill="none" ' +
      'stroke="' + p.spar + '" stroke-width="1.6" opacity="0.35"/>' +
    '<path d="M60 132 C50 152 68 166 55 184 C45 198 60 208 52 222" fill="none" ' +
      'stroke="' + p.spar + '" stroke-width="1.5" opacity="0.4" stroke-linecap="round"/>'
  );
}

// Shape 1 - delta. Nose triangle, then a chevron band following the
// swept trailing edge.
function buildKiteDelta(p) {
  return (
    '<polygon points="60,8 112,88 60,116 8,88" fill="' + p.a + '"/>' +
    '<polygon points="60,8 82,42 38,42" fill="' + p.b + '"/>' +
    '<polygon points="8,88 60,116 112,88 100,80.5 60,101 20,80.5" fill="' + p.c + '"/>' +
    '<path d="M60 8 L60 116" fill="none" ' +
      'stroke="' + p.spar + '" stroke-width="1.6" opacity="0.35"/>' +
    '<path d="M60 116 C50 136 68 150 55 168 C45 182 60 194 52 210" fill="none" ' +
      'stroke="' + p.spar + '" stroke-width="1.5" opacity="0.4" stroke-linecap="round"/>'
  );
}

// Shape 2 - box kite. Two cells seen slightly from the side: a front
// face and a shaded side face each, joined by three struts.
function buildKiteBox(p) {
  return (
    '<polygon points="86,10 104,18 104,52 86,46" fill="' + p.shade + '"/>' +
    '<polygon points="86,76 104,84 104,118 86,112" fill="' + p.shade + '"/>' +
    '<polygon points="24,16 86,10 86,46 24,52" fill="' + p.a + '"/>' +
    '<polygon points="24,82 86,76 86,112 24,118" fill="' + p.a + '"/>' +
    '<polygon points="24,28 86,22 86,34 24,40" fill="' + p.b + '"/>' +
    '<polygon points="24,94 86,88 86,100 24,106" fill="' + p.c + '"/>' +
    '<path d="M24 52 L24 82 M86 46 L86 76 M104 52 L104 84" fill="none" ' +
      'stroke="' + p.spar + '" stroke-width="2.4" opacity="0.5" stroke-linecap="round"/>' +
    '<path d="M64 118 C54 138 72 152 59 170 C49 184 64 196 56 212" fill="none" ' +
      'stroke="' + p.spar + '" stroke-width="1.5" opacity="0.4" stroke-linecap="round"/>'
  );
}

// Shape 3 - rokkaku. Six-sided, with the two end caps in one colour
// and a chevron across the middle in another.
function buildKiteRokkaku(p) {
  return (
    '<polygon points="60,6 104,34 104,96 60,130 16,96 16,34" fill="' + p.a + '"/>' +
    '<polygon points="16,34 104,34 60,6" fill="' + p.c + '"/>' +
    '<polygon points="16,96 104,96 60,130" fill="' + p.c + '"/>' +
    '<polygon points="16,92 60,58 104,92 104,74 60,40 16,74" fill="' + p.b + '"/>' +
    '<path d="M60 6 L60 130 M16 65 L104 65" fill="none" ' +
      'stroke="' + p.spar + '" stroke-width="1.6" opacity="0.3"/>' +
    '<path d="M60 130 C50 150 68 164 55 182 C45 196 60 206 52 220" fill="none" ' +
      'stroke="' + p.spar + '" stroke-width="1.5" opacity="0.4" stroke-linecap="round"/>'
  );
}

var KITE_SHAPE_BUILDERS = [
  buildKiteDiamond,
  buildKiteDelta,
  buildKiteBox,
  buildKiteRokkaku,
];

function buildKiteSVG(paletteIndex, shapeIndex) {
  var p     = KITE_PALETTES[paletteIndex % KITE_PALETTES.length];
  var build = KITE_SHAPE_BUILDERS[shapeIndex % KITE_SHAPE_BUILDERS.length];
  // One box for all four so they hang at a consistent scale against
  // each other; each shape's string is drawn out to about y 220.
  return (
    '<svg viewBox="0 0 120 226" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      build(p) +
    '</svg>'
  );
}

// --- Planets ------------------------------------------------------
// A flat disc marked with spots rather than bands - craters and
// storms, not layer cake.
//
// Nothing is clipped, because a clip path needs an id and ids cannot
// be repeated. Instead every spot is placed so it CANNOT reach the
// edge: an angle and a distance are drawn from hashSeed, and the
// distance is capped at 39 minus the spot's own reach, so the whole
// blob is inside the disc by arithmetic. The distance is also passed
// through a square root, which spreads spots evenly over the disc's
// area - without it they crowd into the middle, because a small
// central ring of the disc holds far less room than a wide outer one.
//
// The spots are quadratic blobs with four jittered radii rather than
// circles, so no two are the same shape and none of them look
// stamped.
//
// The ring on the one ringed planet is the two-halves trick: the far
// half is drawn first and the disc paints over its middle, then the
// near half is drawn on top and crosses the face.
var PLANET_STYLES = [
  { body: '#5E96BE', spot: '#47799F', spotLight: '#8CB8D8', ring: null      },
  { body: '#DDA45C', spot: '#BE8340', spotLight: '#F0C589', ring: '#6FA9A6' },
  { body: '#9080C0', spot: '#7365A8', spotLight: '#B7ABDD', ring: null      },
  { body: '#6FB89E', spot: '#54977E', spotLight: '#98D3BD', ring: null      },
  { body: '#D9CDB4', spot: '#B4A68B', spotLight: '#EFE7D6', ring: null      },
];

// One spot. Four radii around a centre, joined by quadratics whose
// control points sit at 0.75 of the neighbouring radii - close enough
// to round to read as a crater, uneven enough not to read as a circle.
function buildPlanetSpot(cx, cy, r, seed, color) {
  var rN = r * (0.80 + hashSeed(seed) * 0.40);
  var rE = r * (0.80 + hashSeed(seed + 0.41) * 0.40);
  var rS = r * (0.80 + hashSeed(seed + 0.82) * 0.40);
  var rW = r * (0.80 + hashSeed(seed + 1.23) * 0.40);
  function pt(x, y) { return x.toFixed(2) + ' ' + y.toFixed(2); }
  return (
    '<path d="M' + pt(cx, cy - rN) +
      ' Q' + pt(cx + rE * 0.75, cy - rN * 0.75) + ' ' + pt(cx + rE, cy) +
      ' Q' + pt(cx + rE * 0.75, cy + rS * 0.75) + ' ' + pt(cx, cy + rS) +
      ' Q' + pt(cx - rW * 0.75, cy + rS * 0.75) + ' ' + pt(cx - rW, cy) +
      ' Q' + pt(cx - rW * 0.75, cy - rN * 0.75) + ' ' + pt(cx, cy - rN) +
      ' Z" fill="' + color + '"/>'
  );
}

// sizeMin/sizeMax are the spot radii; 1.2 is the most any jittered
// radius can exceed r, so that is the reach a spot actually occupies
// and the number both the containment cap and the spacing test use.
//
// Placement is rejection sampling, not one blind draw. The first
// version drew an angle and a distance once per spot and lived with
// the result, and the result was spots landing almost on top of each
// other - random points do not spread themselves out, they clump.
// Each spot now gets up to two dozen candidate positions and takes
// the first that clears everything already down. `placed` is shared
// across both passes so the small pale spots dodge the big dark ones
// as well as each other.
function buildPlanetSpotField(count, seedBase, sizeMin, sizeMax, color, placed) {
  var out = '';

  for (var i = 0; i < count; i++) {
    var chosen = null;

    for (var attempt = 0; attempt < 24 && !chosen; attempt++) {
      var s     = seedBase + i * 5.37 + attempt * 1.913;
      var angle = hashSeed(s) * Math.PI * 2;
      var size  = sizeMin + hashSeed(s + 0.7) * (sizeMax - sizeMin);
      var reach = size * 1.2;
      var dist  = Math.sqrt(hashSeed(s + 0.31)) * (39 - reach);
      var cx    = 50 + Math.cos(angle) * dist;
      var cy    = 50 + Math.sin(angle) * dist;

      var clear = true;
      for (var k = 0; k < placed.length; k++) {
        var dx = cx - placed[k][0];
        var dy = cy - placed[k][1];
        if (Math.sqrt(dx * dx + dy * dy) < reach + placed[k][2] + 0.8) {
          clear = false;
          break;
        }
      }
      if (clear) chosen = [cx, cy, reach, size, s];
    }

    // No room left on this face. One spot fewer is a better outcome
    // than a spot sitting on another one.
    if (!chosen) continue;

    placed.push(chosen);
    out += buildPlanetSpot(chosen[0], chosen[1], chosen[3], chosen[4] + 2.1, color);
  }

  return out;
}

function buildPlanetSVG(styleIndex) {
  var p    = PLANET_STYLES[styleIndex % PLANET_STYLES.length];
  var seed = 11.3 + styleIndex * 17.77;

  var placed = [];
  var spots =
    buildPlanetSpotField(6, seed,        4.5, 9.5, p.spot,      placed) +
    buildPlanetSpotField(5, seed + 3.19, 2.0, 4.0, p.spotLight, placed);

  var backRing  = '';
  var frontRing = '';
  if (p.ring) {
    backRing =
      '<g transform="translate(50 52) rotate(-18)">' +
        '<path d="M-62 0 A62 17 0 0 1 62 0" fill="none" stroke="' + p.ring +
        '" stroke-width="7" stroke-linecap="round"/></g>';
    frontRing =
      '<g transform="translate(50 52) rotate(-18)">' +
        '<path d="M-62 0 A62 17 0 0 0 62 0" fill="none" stroke="' + p.ring +
        '" stroke-width="7" stroke-linecap="round"/></g>';
  }

  // A ringed planet needs room either side for the ring; a bare one
  // would just render small inside that same box, so it gets a box
  // cropped to the disc.
  var box = p.ring ? '-16 -8 132 120' : '4 4 92 92';

  return (
    '<svg viewBox="' + box + '" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      backRing +
      '<circle cx="50" cy="50" r="40" fill="' + p.body + '"/>' +
      spots +
      frontRing +
    '</svg>'
  );
}

// --- Constellations -----------------------------------------------
// Deliberately nameless. These are not Orion or the Plough and no
// label goes anywhere near them: they are shapes in the sky, and half
// the pleasure of finding one is that it is yours to read however you
// like.
//
// Each is one polyline through a handful of points, four-pointed
// sparkles at every joint (bigger on alternate points so the figure
// has some rhythm), and a few loose stars around it drawn from the
// same hashSeed the grass field uses - so a constellation sits in a
// sky rather than on an empty page, and comes back identical on every
// render.
var CONSTELLATION_SHAPES = [
  [[10, 70], [30, 58], [52, 62], [74, 46], [96, 50], [112, 32]],
  [[14, 30], [34, 44], [56, 36], [80, 44], [100, 28], [110, 50]],
  [[12, 52], [36, 28], [58, 44], [82, 22], [104, 46], [86, 66]],
  [[18, 22], [40, 42], [64, 32], [86, 54], [108, 34]],
  [[8, 44], [28, 66], [52, 54], [74, 70], [98, 52], [114, 66]],
];

function buildStarPoint(x, y, size, color) {
  var cx = Number(x);
  var cy = Number(y);
  var s  = Number(size);
  var q  = s * 0.24;
  return (
    '<path d="M' + cx + ' ' + (cy - s) +
      ' Q' + (cx + q).toFixed(2) + ' ' + (cy - q).toFixed(2) + ' ' + (cx + s) + ' ' + cy +
      ' Q' + (cx + q).toFixed(2) + ' ' + (cy + q).toFixed(2) + ' ' + cx + ' ' + (cy + s) +
      ' Q' + (cx - q).toFixed(2) + ' ' + (cy + q).toFixed(2) + ' ' + (cx - s) + ' ' + cy +
      ' Q' + (cx - q).toFixed(2) + ' ' + (cy - q).toFixed(2) + ' ' + cx + ' ' + (cy - s) +
      ' Z" fill="' + color + '"/>'
  );
}

function buildConstellationSVG(shapeIndex) {
  var pts   = CONSTELLATION_SHAPES[shapeIndex % CONSTELLATION_SHAPES.length];
  var line  = '';
  var stars = '';
  for (var i = 0; i < pts.length; i++) {
    line += (i === 0 ? 'M' : ' L') + pts[i][0] + ' ' + pts[i][1];
    var big = (i % 2 === 0);
    stars += buildStarPoint(pts[i][0], pts[i][1], big ? 4.2 : 2.8, big ? '#F4F8FF' : '#D8E4FA');
  }

  var loose = '';
  for (var j = 0; j < 6; j++) {
    var s = shapeIndex * 7.31 + j * 3.77;
    loose += buildStarPoint(
      (5 + hashSeed(s) * 110).toFixed(1),
      (6 + hashSeed(s + 0.9) * 80).toFixed(1),
      1.5,
      'rgba(226,238,255,0.62)'
    );
  }

  return (
    '<svg viewBox="0 0 120 92" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      '<path d="' + line + '" fill="none" stroke="rgba(198,216,255,0.32)" ' +
        'stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"/>' +
      loose +
      stars +
    '</svg>'
  );
}

// --- Where everything hangs ---------------------------------------
// left is a percentage of the TRACK, which is three screens wide, so
// 33-67 is what you see before panning anywhere. top is a percentage
// of the 150vh sky strip, and the bottom third of that strip is the
// band already visible without scrolling up at all - which is why a
// few rows sit down at 70-85%. Those are the ones that tell you there
// is something up there worth scrolling for; the rest are the reward.
//
// phase is fed in as a NEGATIVE animation-delay, which starts an
// animation already part-way through rather than holding it still for
// that long first. Without it every balloon in the sky would rise and
// fall in perfect unison.
var SKY_BALLOONS = [
  { art: 0, left: 46, top: 76, size: 98, secs: 26, phase:  0 },
  { art: 1, left: 61, top: 41, size: 70, secs: 31, phase:  7 },
  { art: 2, left: 25, top: 21, size: 52, secs: 35, phase: 14 },
  { art: 3, left: 83, top: 57, size: 58, secs: 29, phase: 20 },
  { art: 1, left: 12, top: 47, size: 46, secs: 33, phase:  4 },
];

// One of each shape, so no two kites in the sky are the same kite.
var SKY_KITES = [
  { art: 0, shape: 0, left: 38, top: 85, size: 78, secs:  9, phase: 0 },
  { art: 1, shape: 1, left: 71, top: 66, size: 64, secs: 11, phase: 3 },
  { art: 2, shape: 2, left: 15, top: 74, size: 56, secs: 10, phase: 6 },
  { art: 3, shape: 3, left: 57, top: 52, size: 60, secs: 12, phase: 2 },
];

var SKY_CONSTELLATIONS = [
  { art: 0, left: 42, top: 71, size: 210, secs:  7, phase: 0 },
  { art: 1, left: 29, top: 33, size: 236, secs:  9, phase: 2 },
  { art: 2, left: 63, top: 17, size: 194, secs:  8, phase: 4 },
  { art: 3, left: 79, top: 52, size: 214, secs: 10, phase: 6 },
  { art: 4, left: 12, top: 61, size: 182, secs:  8, phase: 1 },
];

var SKY_PLANETS = [
  { art: 1, left: 55, top: 29, size: 96, secs: 34, phase:  0 },
  { art: 0, left: 36, top: 14, size: 58, secs: 38, phase:  9 },
  { art: 2, left: 68, top: 61, size: 46, secs: 30, phase: 15 },
  { art: 3, left: 50, top: 80, size: 38, secs: 36, phase:  5 },
  { art: 4, left: 21, top: 44, size: 52, secs: 32, phase: 21 },
];

// The wrapper carries the position and the centring translate; the
// inner element carries the animation. They have to be two elements:
// an animated transform completely replaces any transform already on
// the box, so one element doing both would drop the -50%/-50% the
// moment the first keyframe landed and every balloon would jump.
function buildSkyDecorItem(className, spot, inner) {
  return (
    '<div class="sky-decor-item" style="left:' + spot.left + '%;top:' + spot.top + '%">' +
      '<div class="' + className + '" style="width:' + spot.size + 'px;' +
        'animation-duration:' + spot.secs + 's;animation-delay:-' + spot.phase + 's">' +
        inner +
      '</div>' +
    '</div>'
  );
}

var skyDecorCache = null;

function getSkyDecorMarkup() {
  if (skyDecorCache !== null) return skyDecorCache;

  var i;
  var day = '';
  for (i = 0; i < SKY_BALLOONS.length; i++) {
    day += buildSkyDecorItem('sky-balloon', SKY_BALLOONS[i], buildBalloonSVG(SKY_BALLOONS[i].art));
  }
  for (i = 0; i < SKY_KITES.length; i++) {
    day += buildSkyDecorItem(
      'sky-kite', SKY_KITES[i], buildKiteSVG(SKY_KITES[i].art, SKY_KITES[i].shape)
    );
  }

  var night = '';
  for (i = 0; i < SKY_CONSTELLATIONS.length; i++) {
    night += buildSkyDecorItem(
      'sky-constellation', SKY_CONSTELLATIONS[i], buildConstellationSVG(SKY_CONSTELLATIONS[i].art)
    );
  }
  for (i = 0; i < SKY_PLANETS.length; i++) {
    night += buildSkyDecorItem('sky-planet', SKY_PLANETS[i], buildPlanetSVG(SKY_PLANETS[i].art));
  }

  skyDecorCache =
    '<div class="garden-sky-decor sky-decor-day">'   + day   + '</div>' +
    '<div class="garden-sky-decor sky-decor-night">' + night + '</div>';

  return skyDecorCache;
}


// Takes the track as an argument for the same reason renderGrassField
// and renderFence do: 07-friend-garden.js renders into a different
// track and gets the same sky for free.
function renderSky(track) {
  var strip = document.createElement('div');
  strip.className = 'garden-sky-extension';
  // Scenery, with nothing in it a screen reader could use.
  strip.setAttribute('aria-hidden', 'true');
  // Stars, then the balloons/kites/constellations/planets layer.
  // Both are cached strings, so this is a concatenation and an
  // innerHTML assignment, not a rebuild.
  strip.innerHTML = getStarfieldMarkup() + getSkyDecorMarkup();
  track.appendChild(strip);
}

// ============================================
// Landscape props
// ============================================
// The small things lying about in the plot - a lollipop in the candy
// grass, a sandcastle, a lava smear, a crater. They come off the
// active landscape skin (skin.props, built in 03-plant-art.js), so a
// skin with none renders none and this whole function costs nothing.
//
// Placed exactly the way plants are, not the way grass is, and that
// is the point. Each prop gets:
//
//   a depth SCALE from computeDepthScale(bottomPct), so one further
//   up the plot is smaller;
//   a depth Z from computeDepthZ(bottomPct), the same painter's
//   algorithm the plants use - which is what lets a crater in the
//   foreground correctly sit IN FRONT of a plant standing further
//   back, instead of every prop being flatly behind every plant.
//
// That second one is why props are NOT wrapped in a z-indexed layer
// the way the grass field is. A layer with its own z-index (or its
// own filter) would be a stacking context, and every prop inside it
// would be trapped at the layer's depth no matter what z-index it
// carried. The field element is deliberately plain, and the night
// dimming in style.css is applied to each prop individually for the
// same reason.
//
// Placement is stratified across the track and round-robined between
// prop types, so three lava smears and three rocks come out
// interleaved and spread rather than as two clumps. Seeds are fixed,
// so the scatter is the same arrangement every render - a prop that
// jumped to a new spot every time the garden repainted would read as
// a bug even though nothing was wrong.
// Nearly the plot's full depth. Props sitting in a narrow band across
// the middle read as a row of ornaments; running them from the very
// front edge to just under the fence is what makes the ground look
// like it is made of them.
var PROP_BOTTOM_MIN = 5;
var PROP_BOTTOM_MAX = 84;

function renderSkinProps(track, skin) {
  if (!skin || !Array.isArray(skin.props) || !skin.props.length) return;

  // Round-robin rather than type-by-type: filling the array in type
  // order would put every lollipop in the left third of the plot,
  // because the stratified placement below walks it left to right.
  var slots = [];
  var placed = 0;
  var remaining = skin.props.map(function (prop) { return prop.count || 1; });
  var anyLeft = true;
  while (anyLeft) {
    anyLeft = false;
    for (var p = 0; p < skin.props.length; p++) {
      if (remaining[p] <= 0) continue;
      remaining[p]--;
      anyLeft = true;
      slots.push({ prop: skin.props[p], seed: (p + 1) * 31.77 + placed * 12.91 });
      placed++;
    }
  }

  var field = document.createElement('div');
  field.className = 'garden-prop-field';
  field.setAttribute('aria-hidden', 'true');

  var cell = 100 / slots.length;

  slots.forEach(function (slot, i) {
    var s         = slot.seed;
    var xPct      = i * cell + hashSeed(s) * cell;
    var bottomPct = PROP_BOTTOM_MIN +
      hashSeed(s + 0.53) * (PROP_BOTTOM_MAX - PROP_BOTTOM_MIN);
    var width     = (slot.prop.width || 24) * computeDepthScale(bottomPct);

    var el = document.createElement('div');
    el.className     = 'garden-prop';
    el.style.left    = xPct.toFixed(2) + '%';
    el.style.bottom  = bottomPct.toFixed(2) + '%';
    el.style.zIndex  = computeDepthZ(bottomPct);
    el.innerHTML     = slot.prop.build(s * 3.11, width);
    field.appendChild(el);
  });

  track.appendChild(field);
}


// ============================================
// Applying a landscape skin
// ============================================
// One call, before anything is drawn: set the skin's custom
// properties on the SCENE element, which is the ancestor of every
// layer inside the track. The lawn gradient, the fence pickets, the
// signpost and the night filter all read them from there, so none of
// those has to know a skin system exists.
//
// Set on the scene rather than on the track because the track is torn
// down and rebuilt by innerHTML on every render, which would throw an
// inline style away; the scene element survives.
//
// Tokens are CLEARED before they're set, and cleared from the full
// token list rather than from the incoming skin's own keys. Skins are
// supposed to declare the whole set, but if one ever doesn't, the
// alternative is the previous skin's value staying stuck on the
// element - a candy fence around a meadow lawn, and no obvious reason
// why. removeProperty falls the token back to style.css, which is the
// meadow value.
//
// Takes the skin as an argument because 07-friend-garden.js calls
// this for a FRIEND's scene with the skin off their summary document,
// which is not the one the local user is wearing.
function applyGardenSkin(sceneEl, skin) {
  var resolved = skin || getActiveGardenSkin();
  if (!sceneEl) return resolved;

  var style = sceneEl.style;
  getGardenSkinTokens().forEach(function (token) {
    var value = resolved.vars ? resolved.vars[token] : null;
    style.removeProperty(token);
    if (value !== undefined && value !== null && value !== '') {
      style.setProperty(token, value);
    }
  });

  return resolved;
}


// The ground the whole plot stands on. First thing into the track, so
// the grass clumps, the fence and every plant paint over it.
function renderLawn(track) {
  var lawn = document.createElement('div');
  lawn.className = 'garden-lawn';
  lawn.setAttribute('aria-hidden', 'true');
  track.appendChild(lawn);
}

// The scene is two screens taller than the window now, and the plot is
// at the BOTTOM of it - but a scroll container starts at scrollTop 0,
// which up there is empty sky. So every scroll reset has to mean "all
// the way back down" rather than "back to zero".
//
// Set twice on purpose: immediately, so the scene can never paint a
// frame up in the air, and again next frame, because scrollHeight read
// straight after an innerHTML swap can still be the previous render's.
// A scene that is still hidden measures zero and is left alone, so the
// next render tries again.
function scrollSceneToGround(sceneEl) {
  if (!sceneEl) return;

  var settle = function () {
    if (!sceneEl.clientHeight) return;
    sceneEl.scrollTop = sceneEl.scrollHeight - sceneEl.clientHeight;
  };

  settle();
  requestAnimationFrame(settle);
}


// ============================================
// Daily-progress ring at the plant's base
// ============================================
function buildProgressRing(comp) {
  if (comp.total === 0 || comp.percent === 0) return '';

  var r             = 14;
  var cx            = 40;
  var cy            = 119;
  var circumference = 2 * Math.PI * r;
  var progress      = (comp.percent / 100) * circumference;
  var color         = comp.percent === 100
    ? '#F2B84B'
    : 'rgba(242,184,75,0.6)';
  var strokeW       = comp.percent === 100 ? 3 : 2;

  var sparkles = '';
  if (comp.percent === 100) {
    sparkles =
      '<line x1="40" y1="100" x2="40" y2="104" stroke="#F2B84B" stroke-width="2" stroke-linecap="round"/>' +
      '<line x1="51" y1="103" x2="49.5" y2="107" stroke="#F2B84B" stroke-width="2" stroke-linecap="round"/>' +
      '<line x1="29" y1="103" x2="30.5" y2="107" stroke="#F2B84B" stroke-width="2" stroke-linecap="round"/>';
  }

  return (
    '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="none"' +
    ' stroke="' + color + '" stroke-width="' + strokeW + '"' +
    ' stroke-dasharray="' + progress + ' ' + (circumference - progress) + '"' +
    ' transform="rotate(-90,' + cx + ',' + cy + ')"' +
    ' stroke-linecap="round"/>' +
    sparkles
  );
}


// ============================================
// Build one plant's SVG markup
// (No progress ring - each garden section uses its own label instead)
// ============================================
function getPlantSVG(catId, stageIndex, skinId, width) {
  var data  = PLANT_SVG_DATA[catId] || PLANT_SVG_DATA.misc;
  var stage = Math.max(0, Math.min(stageIndex, data.length - 1));
  var body  = data[stage];

  // The skin only supplies CSS variables (and optionally a few extra
  // elements) - the base art below is the same string either way.
  var skin = getSkin(catId, skinId || SKIN_DEFAULT_ID);
  ensureSkinDefs(catId, skin);

  var w = width || 120;
  var h = Math.round(w * 195 / 120);

  return (
    '<svg viewBox="0 0 80 130" xmlns="http://www.w3.org/2000/svg"' +
    ' width="' + w + '" height="' + h + '"' +
    ' style="overflow:visible;display:block;' + skinStyleString(skin) + '">' +
    body +
    skinExtrasFor(catId, skin, stage) +
    '</svg>'
  );
}



// ============================================
// Today's growth - the garden's growth preview toggle
// ============================================
// There were once two gardens here, Daily and Long-Term, on a pair of
// tabs. The Daily one was sized off the streak rather than lifetime
// days and jumped to the last piece of art at 1.35x the instant a box
// was ticked. Two gardens meant two sets of rules to keep in step,
// and they did not stay in step.
//
// They were merged into one render path, at which point the tabs were
// showing the same plot twice and were removed as well. There is now
// one garden, and this button is the only thing that changes how it
// is drawn - it rolls today's growth back by one day so it can be
// watched happening:
//
//   off (default)  every plant whose box is ticked today is drawn one
//                  day short of where it is
//   on             every plant exactly where it really stands
//
// So pressing it is the same event as ticking the box was, replayed:
// the plant grows by one day, crossing into new art if that day
// happens to land on a milestone. It is the "+1 day" dev button,
// pointed at today and running backwards first.
//
// THE CHECKLIST DECIDES WHO MOVES. Ticking a box is what added the
// day (toggleTask in 02 raises totalGrowthDays), so a plant with an
// unticked box has no day to roll back and is drawn identically in
// both positions. It does not shrink, it does not wilt, it simply
// does not move - and standing still next to a neighbour that grew is
// the whole of the feedback.
//
// THIS IS A VIEW, NOT A STATE CHANGE. Nothing here writes to a task,
// advances anything, or can be got into a wrong order by pressing it
// twice: both sizes are pure functions of numbers that were already
// true before the button existed, so the toggle is reversible,
// idempotent, and safe to leave in either position across a reload, a
// midnight rollover or a re-render. There is deliberately no
// half-applied middle state for anything to glitch into.
//
// WHAT IT DOES NOT TOUCH: the day count, the streak and the hover
// height are read from the task in both positions, so they say the
// same thing whichever way the button is set. It rolls back SIZE.
//
// AND IT COSTS NOTHING. No new Firestore field, no new read, no new
// write. Both sizes come from what is already on every task in
// memory:
//
//   task.totalGrowthDays   lifetime days, ALREADY counting today
//   task.completed         whether today's tick happened
//
// so "before today" is simply totalGrowthDays - (completed ? 1 : 0).
// The only new fact is which way the button is currently set, and
// that is a preference about this browser's view of the plot rather
// than garden data, so it lives in localStorage. Losing it (private
// window, storage off, another device) just opens the plot with the
// growth still to play, which is the default anyway.
// ============================================

var DAILY_GROWTH_KEY = 'disciplant:showDailyGrowth';

var dailyGrowthShown  = readDailyGrowthShown();
var dailyGrowthAnimating = false;  // blocks a second press mid-animation

function readDailyGrowthShown() {
  try {
    // Left over from the first version of this feature, which banked
    // per-task reveals under a dated key. Nothing reads it now, so
    // clear it rather than leave it sitting in people's browsers.
    localStorage.removeItem('disciplant:dailyGrowth');
    return localStorage.getItem(DAILY_GROWTH_KEY) === '1';
  } catch (e) {
    // Private browsing or storage switched off. Opening on yesterday
    // is the harmless direction to fail in.
    return false;
  }
}

function persistDailyGrowthShown() {
  try {
    localStorage.setItem(DAILY_GROWTH_KEY, dailyGrowthShown ? '1' : '0');
  } catch (e) {}
}

// The day count a plant is DRAWN at - its size and art stage, and
// nothing else. The height tag and the label read task.totalGrowthDays
// directly in both positions of the toggle.
//
// Only ever one day apart from the real total, and only for a task
// whose box is ticked today. Everything else returns the real total in
// both positions, so switching the toggle on leaves the garden showing
// exactly what it would show if this button did not exist.
function getDailyDisplayDays(task) {
  var days = Math.max(0, task.totalGrowthDays || 0);
  if (dailyGrowthShown || !task.completed) return days;
  return Math.max(0, days - 1);
}

// The growth-only scale (before depth) that the garden draws a plant
// at. Lives here as one function because renderGarden and the toggle
// animation both have to arrive at the same number for the same
// plant, and the streak momentum flourish is easy to apply in one
// place and forget in the other.
//
// Momentum is deliberately NOT rolled back with the day: it is a
// property of the streak being alive right now, and the toggle's job
// is to show the difference one DAY makes. Holding it constant is
// what makes the size change on screen exactly one day's worth.
function computeGardenGrowthScale(days, momentum) {
  return computeScaleForDays(days) * (momentum || 1);
}

function computeTaskMomentum(task) {
  return 1 + Math.min(Math.max(0, task.streak || 0), 60) * 0.004;
}

// Plants drawn differently in the two positions - i.e. the ones the
// button actually has something to show. The day count guard is
// belt-and-braces: toggleTask() raises totalGrowthDays before it sets
// the flag, so a completed task always has at least one day on it.
function getGrownTodayTasks() {
  return tasks.filter(function (task) {
    return task.completed && (task.totalGrowthDays || 0) > 0;
  });
}


// ============================================
// The button
// ============================================
var gardenGrowBarEl   = document.getElementById('gardenGrowBar');
var gardenGrowBtnEl   = document.getElementById('gardenGrowBtn');
var gardenGrowLabelEl = document.getElementById('gardenGrowLabel');
var gardenGrowHintEl  = document.getElementById('gardenGrowHint');

// Says which way it will move things, not which way they are - a
// button labelled with its current state reads as a description and
// gets ignored. Hidden on an empty plot, and in edit mode (resizing a
// plant mid-drag is a fight nobody needs).
function updateGardenGrowUI() {
  if (!gardenGrowBarEl) return;

  var show = tasks.length > 0 && !gardenEditMode;
  gardenGrowBarEl.classList.toggle('hidden', !show);
  if (!show) return;

  var grown = getGrownTodayTasks().length;

  var label, hint;
  if (dailyGrowthShown) {
    label = "Hide today's growth";
    hint  = grown === 1 ? '1 plant grew today' : grown + ' plants grew today';
  } else if (grown > 0) {
    label = "Show today's growth (" + grown + ')';
    hint  = grown === 1 ? '1 plant is ready' : grown + ' plants are ready';
  } else {
    label = "Show today's growth";
    hint  = 'Tick a habit to see it grow';
  }

  if (gardenGrowLabelEl) gardenGrowLabelEl.textContent = label;
  if (gardenGrowHintEl)  gardenGrowHintEl.textContent  = hint;

  if (gardenGrowBtnEl) {
    gardenGrowBtnEl.classList.toggle('is-ready', grown > 0 && !dailyGrowthShown && !dailyGrowthAnimating);
    gardenGrowBtnEl.classList.toggle('is-showing', dailyGrowthShown);
    gardenGrowBtnEl.setAttribute('aria-pressed', dailyGrowthShown ? 'true' : 'false');
    gardenGrowBtnEl.disabled = dailyGrowthAnimating || (grown === 0 && !dailyGrowthShown);
  }
}


// ============================================
// Moving between the two sizes
// ============================================
// Deliberately NOT done by re-rendering the scene. renderGarden()
// replaces the track's children outright, so a fresh element would
// arrive already at its final size with nothing left to transition
// from - the plant would cut between two sizes with no growing in
// between, which is the exact thing this feature exists to show.
//
// Instead each plant already on screen is nudged: --plant-scale is
// moved and .plant-visual's existing 1.1s transition does the actual
// growing. renderGarden() still renders whichever position the toggle
// is in, so a re-render landing at any moment - a snapshot, a resize,
// switching pages - agrees with what is on screen instead of fighting
// it. There is no state here that can be half-applied.
var DAILY_GROWTH_STAGGER_MS = 130;

function toggleDailyGrowth() {
  setDailyGrowthShown(!dailyGrowthShown);
}

function setDailyGrowthShown(next) {
  if (dailyGrowthAnimating) return;
  if (gardenEditMode) return;
  if (next === dailyGrowthShown) return;

  dailyGrowthShown = next;
  persistDailyGrowthShown();

  var crop = getGrownTodayTasks();

  // Nothing to animate: no plot built yet (garden page not opened this
  // session), or nothing ticked. Paint the position and be done.
  if (!gardenTrackEl || !crop.length || !gardenTrackEl.querySelector('.garden-plant')) {
    renderGarden();
    return;
  }

  dailyGrowthAnimating = true;
  updateGardenGrowUI();

  // Growing is staggered so a full plot ripples rather than jumping as
  // one block. Going back is not - hiding a preview should feel like
  // closing it, not like watching everything wilt in sequence.
  var stagger = dailyGrowthShown ? DAILY_GROWTH_STAGGER_MS : 0;

  crop.forEach(function (task, i) {
    setTimeout(function () { resizePlantForToggle(task); }, i * stagger);
  });

  setTimeout(function () {
    dailyGrowthAnimating = false;
    updateGardenGrowUI();
  }, (crop.length - 1) * stagger + (dailyGrowthShown ? 1400 : 900));
}

function resizePlantForToggle(task) {
  if (!gardenTrackEl) return;

  var wrap = gardenTrackEl.querySelector(
    '.garden-plant[data-task-id="' + task.id + '"]'
  );
  if (!wrap) return;

  var cat  = getCategoryById(task.categoryId);
  var days = getDailyDisplayDays(task);

  // Depth is recomputed from the plant's own bottom% rather than read
  // back off the rendered scale, so a rounded custom property can't
  // accumulate error into the plant's size over repeated toggles.
  var bottomPct   = parseFloat(wrap.style.getPropertyValue('--plant-depth-bottom')) || 0;
  var depthScale  = computeDepthScale(bottomPct);
  var growthScale = computeGardenGrowthScale(days, computeTaskMomentum(task));

  // The drag handler in edit mode reads this back to recompute total
  // scale live while a plant is carried between depth bands.
  wrap.dataset.growthScale = growthScale.toFixed(4);
  wrap.style.setProperty('--plant-scale', (growthScale * depthScale).toFixed(3));

  // The waiting glow is an invitation to press the button, so it
  // belongs on the plants that still have something to show.
  wrap.classList.toggle('daily-ready', !dailyGrowthShown);

  // A day that crosses a milestone (day 2, 15 or 60) is drawn as a
  // different plant, and previewing the growth has to preview that
  // too - otherwise the one day that changes the most shows the least.
  var stageIdx = getStageIndexForDays(days);
  var wasStage = plantStageMemory.hasOwnProperty(task.id)
    ? plantStageMemory[task.id]
    : stageIdx;
  if (stageIdx !== wasStage) crossfadePlantStage(wrap, task, cat, stageIdx);

  if (dailyGrowthShown) playGrowthFlourish(wrap);
}

// The in-place twin of the crossfade buildPlantVisual() does at render
// time. Needed because a milestone crossed mid-animation lands in an
// element that is deliberately not being rebuilt.
function crossfadePlantStage(wrap, task, cat, stageIdx) {
  var host = wrap.querySelector('.plant-stage-crossfade');
  if (!host) return;

  var oldLayers = Array.prototype.slice.call(
    host.querySelectorAll('.plant-stage-layer')
  );

  var layer = document.createElement('div');
  layer.className     = 'plant-stage-layer';
  layer.style.opacity = '0';
  layer.innerHTML     = getPlantSVG(cat.id, stageIdx, getTaskSkinId(task));
  host.appendChild(layer);

  requestAnimationFrame(function () {
    requestAnimationFrame(function () {
      oldLayers.forEach(function (el) { el.style.opacity = '0'; });
      layer.style.opacity = '1';
    });
  });

  setTimeout(function () {
    oldLayers.forEach(function (el) {
      if (el.parentNode) el.parentNode.removeChild(el);
    });
    // Same bookkeeping buildPlantVisual does, so the next full render
    // doesn't replay a crossfade that has already happened.
    plantStageMemory[task.id] = stageIdx;
  }, 900);
}

// A four-point spark, drawn with curves rather than as a star polygon
// so it keeps the soft edges the rest of the art has. No ids in it -
// this is stamped several times per plant, and duplicate ids in a
// document are exactly how gradients start bleeding between copies.
var GROWTH_SPARK_SVG =
  '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="currentColor">' +
  '<path d="M12 0.8 C13.1 7.3 16.7 10.9 23.2 12 C16.7 13.1 13.1 16.7 12 23.2 ' +
  'C10.9 16.7 7.3 13.1 0.8 12 C7.3 10.9 10.9 7.3 12 0.8 Z"/>' +
  '</svg>';

// Hand-placed rather than randomised: five sparks that read as one
// burst, weighted upward and slightly off-centre so it doesn't look
// like a symmetrical explosion.
var GROWTH_SPARKS = [
  { x: '-31px', y: '-42px', spin: '-120deg', delay: '0s',    size: 16 },
  { x:  '27px', y: '-48px', spin:  '135deg', delay: '0.07s', size: 13 },
  { x:  '-7px', y: '-60px', spin:   '55deg', delay: '0.14s', size: 18 },
  { x:  '39px', y: '-17px', spin:  '-75deg', delay: '0.21s', size: 11 },
  { x: '-41px', y: '-13px', spin:   '95deg', delay: '0.27s', size: 12 },
];

// The pop and the sparks. Worth being clear about what these are for,
// because a day of growth is a much smaller number than it feels like:
// a plant's first day is +15%, but day 29 to 30 is +1.5% and day 59 to
// 60 is under 1%. Past the first fortnight the honest difference is a
// couple of pixels, and without something drawing the eye to the plant
// that moved you would not know which one it was.
//
// So a light comes up over the plant while it grows, and the sparks
// mark the spot.
//
// It used to be a bounce - the plant gathered down and sprang up. That
// was a mistake and is worth not repeating: it MOVED the plant, over
// the top of the one movement you were supposed to be watching, and a
// 1% size change cannot be read through a 12% bounce happening at the
// same time. A light adds no motion of its own, so the only thing
// changing shape on screen is the growth itself.
//
// It lands only on plants that are actually growing, because this runs
// only for those: an unticked habit has no day to roll back, never
// gets passed to resizePlantForToggle, and so is never lit.
//
// Nothing here ADDS anything to the plant: the size it settles at is
// the true one, and once the light has faded the plot is identical to
// the Long-Term garden down to the pixel. All of it is decoration over
// a size that is already correct, which is why the
// prefers-reduced-motion block in style.css can drop the lot, and why
// deleting this function would cost nothing but legibility.
function playGrowthFlourish(wrap) {
  // On the wrap rather than inside it, so the light can be a filter on
  // .plant-visual - the same property, and the same warm colour, as
  // the halo edit mode puts on a grabbable plant.
  wrap.classList.remove('plant-growing');
  void wrap.offsetWidth;   // lets the same class be re-added and re-run
  wrap.classList.add('plant-growing');
  setTimeout(function () { wrap.classList.remove('plant-growing'); }, 1450);

  var burst = document.createElement('div');
  burst.className = 'plant-grow-burst';
  burst.setAttribute('aria-hidden', 'true');
  burst.innerHTML = GROWTH_SPARKS.map(function (spark) {
    return (
      '<span class="plant-grow-spark" style="' +
      '--spark-x:' + spark.x + ';' +
      '--spark-y:' + spark.y + ';' +
      '--spark-spin:' + spark.spin + ';' +
      '--spark-delay:' + spark.delay + ';' +
      'width:' + spark.size + 'px;height:' + spark.size + 'px;' +
      'margin:' + (-spark.size / 2) + 'px 0 0 ' + (-spark.size / 2) + 'px;">' +
      GROWTH_SPARK_SVG +
      '</span>'
    );
  }).join('');

  wrap.appendChild(burst);
  // Removed rather than left to pile up: the toggle can be pressed as
  // often as anyone likes.
  setTimeout(function () {
    if (burst.parentNode) burst.parentNode.removeChild(burst);
  }, 1400);
}

if (gardenGrowBtnEl) {
  gardenGrowBtnEl.addEventListener('click', toggleDailyGrowth);
}


// ============================================
// Rendering the garden scene
// ============================================

// Remembers which art stage each task was last rendered at, so we can
// detect "just crossed a milestone" and crossfade into the new stage
// instead of just popping to it. Session-only (not persisted) - on a
// fresh page load a plant just appears at its correct current stage.
var plantStageMemory = {};

// Builds the (possibly crossfading) SVG art for one plant. If the
// task's stage hasn't changed since last render, this is just the
// current stage's art. If it HAS changed (a milestone was just
// crossed), it briefly overlays the old and new stage art and
// crossfades between them via CSS transition.
function buildPlantVisual(task, cat, stageIdx) {
  var container = document.createElement('div');
  container.className = 'plant-stage-crossfade';

  var skinId = getTaskSkinId(task);

  var prevStage = plantStageMemory.hasOwnProperty(task.id)
    ? plantStageMemory[task.id]
    : stageIdx;

  if (prevStage === stageIdx) {
    var layer = document.createElement('div');
    layer.className = 'plant-stage-layer';
    layer.style.opacity = '1';
    layer.innerHTML = getPlantSVG(cat.id, stageIdx, skinId);
    container.appendChild(layer);
    plantStageMemory[task.id] = stageIdx;
    return container;
  }

  // Stage just changed - crossfade the old art out and the new art in.
  var oldLayer = document.createElement('div');
  oldLayer.className = 'plant-stage-layer';
  oldLayer.innerHTML = getPlantSVG(cat.id, prevStage, skinId);
  oldLayer.style.opacity = '1';

  var newLayer = document.createElement('div');
  newLayer.className = 'plant-stage-layer';
  newLayer.innerHTML = getPlantSVG(cat.id, stageIdx, skinId);
  newLayer.style.opacity = '0';

  container.appendChild(oldLayer);
  container.appendChild(newLayer);

  // Flip opacities on the next frame so the browser registers the
  // starting state first, then animates the transition via CSS.
  requestAnimationFrame(function () {
    requestAnimationFrame(function () {
      oldLayer.style.opacity = '0';
      newLayer.style.opacity = '1';
    });
  });

  // Lock in the new stage once the crossfade finishes so later
  // renders don't keep re-triggering it.
  setTimeout(function () {
    plantStageMemory[task.id] = stageIdx;
  }, 900);

  return container;
}

// Has the scene ever been pulled down onto the plot? Purely a guard
// against opening the garden in deep space: renderGarden() can run
// while the scene is still hidden (it is called whenever data lands,
// whichever page you are on), and a hidden element measures zero, so
// the grounding silently does nothing and has to be tried again on the
// next render. Once it takes, it never needs to happen unasked again.
var gardenSceneGrounded = false;

// Centers the garden scene's horizontal scroll position on its full
// (3x-viewport-wide) track, and puts the vertical scroll back on the
// ground. Deferred a frame so it runs after the browser has laid out
// this render's plants and recalculated scrollWidth - reading it
// synchronously right after an innerHTML swap can still reflect the
// previous render's width.
function centerGardenScroll() {
  requestAnimationFrame(function () {
    if (!gardenSceneEl) return;
    gardenSceneEl.scrollLeft = (gardenSceneEl.scrollWidth - gardenSceneEl.clientWidth) / 2;
    scrollSceneToGround(gardenSceneEl);
    if (gardenSceneEl.clientHeight) gardenSceneGrounded = true;
  });
}

// A signpost standing in the plot, pointing back to the tasks list.
// Deliberately part of the scene rather than a button floating in a
// corner: it sits inside the scrollable track with the grass and the
// fence, so it pans with the garden like everything else growing here.
function renderSignpost(track) {
  var post = document.createElement('button');
  post.type      = 'button';
  post.className = 'garden-signpost';
  post.title     = 'Back to your tasks';
  post.innerHTML =
    '<span class="garden-signpost-board">Tasks</span>' +
    '<span class="garden-signpost-stake" aria-hidden="true"></span>';
  post.addEventListener('click', function (e) {
    e.stopPropagation();
    navigateTo('tasks');
  });
  track.appendChild(post);
}

function renderGarden() {
  if (!gardenSceneEl || !gardenTrackEl) return;

  updateGardenEditUI();
  gardenTrackEl.innerHTML = '';

  var shouldCenterScroll = pendingGardenScrollCenter;
  pendingGardenScrollCenter = false;

  // The landscape skin goes on before anything is drawn, so the first
  // painted frame is already in the right palette rather than
  // flashing meadow green and then correcting itself.
  var gardenSkin = applyGardenSkin(gardenSceneEl);

  // Sky, lawn, ground texture and fence first, so they sit behind
  // every plant appended below. All four live inside the scrollable
  // track, which is what makes them move with the plants instead of
  // staying pinned to the window - see renderLawn() above.
  renderSky(gardenTrackEl);
  renderLawn(gardenTrackEl);
  renderGrassField(gardenTrackEl, gardenSkin);
  renderSkinProps(gardenTrackEl, gardenSkin);
  renderFence(gardenTrackEl);
  renderSignpost(gardenTrackEl);

  var emptyMsgEl = document.getElementById('gardenEmptyMsg');

  if (tasks.length === 0) {
    if (emptyMsgEl) emptyMsgEl.classList.remove('hidden');
    // Nothing to pan to yet - keep the message in view, which means
    // parking on the plot rather than up in the sky above it.
    gardenSceneEl.scrollLeft = 0;
    scrollSceneToGround(gardenSceneEl);
    if (gardenSceneEl.clientHeight) gardenSceneGrounded = true;
    return;
  }
  if (emptyMsgEl) emptyMsgEl.classList.add('hidden');

  // Bucket auto-positioned (never-dragged) tasks into their slot
  // group once per render. Each task's group is a stable hash of its
  // id, so this grouping (and therefore each task's position) stays
  // consistent render to render. Manually-placed (dragged) tasks are
  // excluded here - they don't participate in the auto grid at all,
  // so they don't shift where other plants' slots fall.
  var slotGroups = { a: [], b: [] };
  tasks.forEach(function (task) {
    if (hasCustomPosition(task)) return;
    slotGroups[getTaskSlotGroup(task.id)].push(task);
  });

  tasks.forEach(function (task, i) {
    var cat = getCategoryById(task.categoryId);
    var layout;
    if (hasCustomPosition(task)) {
      layout = computeCustomLayout(task);
    } else {
      var group        = getTaskSlotGroup(task.id);
      var groupTasks   = slotGroups[group];
      var indexInGroup = groupTasks.indexOf(task);
      layout           = computePlantLayout(task, indexInGroup, groupTasks.length);
    }

    var totalGrowthDays = Math.max(0, task.totalGrowthDays || 0);
    var streak          = Math.max(0, task.streak || 0);

    // The day count this plant's height is read from - the same one
    // its size is built from in each tab, but without the flourish
    // multipliers layered on afterwards.
    // Everything below reads LIFETIME days (totalGrowthDays), never
    // the streak. A broken streak shrinks the momentum flourish but
    // must never shrink what a plant has actually grown to.
    var momentum = computeTaskMomentum(task); // up to +24% at a 60-day streak

    // The checklist is what decides whether there is a day to roll
    // back: ticking a box is what added the day in the first place
    // (toggleTask in 02 raises totalGrowthDays), so an unticked plant
    // has nothing to subtract and is drawn the same in both positions
    // of the toggle - it simply does not move.
    var readyToGrow = task.completed && totalGrowthDays > 0 && !dailyGrowthShown;

    // Through the same helper the toggle animation calls, so the
    // rendered size and the animated size cannot be computed two
    // slightly different ways.
    var drawnDays = getDailyDisplayDays(task);

    var stageIdx = getStageIndexForDays(drawnDays);
    var scale    = computeGardenGrowthScale(drawnDays, momentum);

    // Read from the real lifetime total, NOT from drawnDays. The
    // height and the label are facts about the plant and say the same
    // thing whichever way the button is set - the toggle rolls back
    // SIZE, and only size.
    var heightDays = totalGrowthDays;

    var streakPart = streak > 0 ? ' · ' + streak + ' day streak' : '';
    var subLabel   = totalGrowthDays + ' days grown' + streakPart;

    // Depth multiplier stacks with the growth-based scale - a fully
    // grown far-row plant is still smaller than a fully grown
    // near-row plant, and vice versa a young near-row plant can still
    // be bigger on screen than an old far-row one.
    var growthOnlyScale = scale;
    scale = scale * layout.depthScale;

    // Read from days grown, so neither depth nor the flourish
    // multipliers above can move it - see the height system notes at
    // the top of this file.
    var heightMeters = computeHeightMeters(heightDays);

    // Ground-anchored wrapper - position only, never scales.
    var wrap = document.createElement('div');
    wrap.className = 'garden-plant' + (readyToGrow ? ' daily-ready' : '');
    wrap.style.left = layout.center;
    wrap.style.zIndex = layout.z;
    // Set on the wrap (not the inner .plant-visual) so both the
    // wrap's ground-sink offset and .plant-visual's own scale - which
    // inherits this custom property - can read the same value.
    wrap.style.setProperty('--plant-scale', scale.toFixed(3));
    wrap.style.setProperty('--plant-depth-bottom', layout.bottomPct + '%');
    // Stashed so the drag handler can recompute total scale live as
    // the plant is dragged between the far/near bands, without
    // having to redo the daily/long-term growth math mid-drag.
    wrap.dataset.growthScale = growthOnlyScale.toFixed(4);
    wrap.dataset.taskId      = task.id;
    wrap.setAttribute(
      'title',
      task.text + ' · ' + cat.name + ' (' + cat.species + ') · ' +
      totalGrowthDays + ' days grown' + (streak > 0 ? ' · ' + streak + ' day streak' : '') +
      (gardenEditMode ? ' · drag to move' : '')
    );

    // Scaling visual - grows from a fixed point near the ground.
    var visual = document.createElement('div');
    visual.className = 'plant-visual';

    visual.appendChild(buildPlantVisual(task, cat, stageIdx));
    wrap.appendChild(visual);

    // Height tooltip - hidden by default, revealed on hover via CSS
    // (see .plant-height-tag / :hover rules in style.css). Sits
    // outside .plant-visual so it doesn't get scaled along with the
    // art itself.
    var heightTag = document.createElement('div');
    heightTag.className = 'plant-height-tag';
    heightTag.textContent = formatHeightMeters(heightMeters);
    wrap.appendChild(heightTag);

    // Label - fixed size, sits below the plant at ground level.
    var labelEl = document.createElement('div');
    labelEl.className = 'plant-label-tag';
    labelEl.innerHTML =
      '<span class="plant-label-name">' + escapeHtml(task.text) + '</span>' +
      '<span class="plant-label-streak">' + subLabel + '</span>';
    wrap.appendChild(labelEl);

    // Bound only in edit mode, so outside it a plant has no drag
    // listeners on it whatsoever.
    if (gardenEditMode) setupPlantDrag(wrap, task.id);

    gardenTrackEl.appendChild(wrap);
  });

  // The `|| !gardenSceneGrounded` half is the first-render case: if
  // the very first render that could measure the scene wasn't a fresh
  // visit, the view would still be sitting at scrollTop 0 - which is
  // now the top of the sky, not the garden.
  if (shouldCenterScroll || !gardenSceneGrounded) centerGardenScroll();
}

// Escapes a task's free-text text before it's inserted via innerHTML
function escapeHtml(str) {
  var div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}


// ============================================
// Garden edit mode
//
// Plants used to be draggable at all times, which meant every stray
// long-press moved something, and every move wrote the whole garden
// document to Firestore (plus the friend-visible summary) the instant
// you let go. Rearranging ten plants cost twenty writes.
//
// Now moving is a mode you opt into. "Edit garden" takes a snapshot of
// where everything currently is, then lets you drag freely - all of it
// purely in memory, no network at all. "Save & exit" writes ONCE for
// the whole session. "Discard" puts the snapshot back.
//
// Leaving the Garden page, or closing the tab, is a discard too: since
// nothing is written until you press Save, walking away simply never
// commits. That is also why there is no beforeunload handler here -
// there is nothing to flush.
// ============================================

var gardenEditMode     = false;
var gardenEditSnapshot = null; // [{ id, posX, posY }] as of entering edit mode

var gardenEditBarEl     = document.getElementById('gardenEditBar');
var gardenEditStartEl   = document.getElementById('gardenEditStart');
var gardenEditActionsEl = document.getElementById('gardenEditActions');
var gardenEditSaveEl    = document.getElementById('gardenEditSave');
var gardenEditDiscardEl = document.getElementById('gardenEditDiscard');

function snapshotGardenPositions() {
  return tasks.map(function (t) {
    return {
      id:   t.id,
      posX: (typeof t.posX === 'number') ? t.posX : null,
      posY: (typeof t.posY === 'number') ? t.posY : null,
    };
  });
}

// The one thing that stops an unrelated save from leaking unsaved
// drags into Firestore.
//
// checkDayRollover() fires every 60 seconds and calls saveData() when
// the date flips, and saveData() serializes the LIVE tasks array - so
// a midnight rollover in the middle of an editing session would have
// quietly committed positions the user hadn't saved and might be about
// to discard. saveData() asks this function for each task's position
// instead: while editing, that's the pre-edit snapshot value, so a
// rollover writes streak and completion changes and leaves the
// half-finished layout exactly where it is, uncommitted.
//
// Outside edit mode (and for any task that didn't exist when edit mode
// began) it just hands back the task itself.
function getPersistedPosition(task) {
  if (gardenEditMode && gardenEditSnapshot) {
    for (var i = 0; i < gardenEditSnapshot.length; i++) {
      if (gardenEditSnapshot[i].id === task.id) return gardenEditSnapshot[i];
    }
  }
  return task;
}

// Called from renderGarden() as well as from the mode changes below,
// so the bar can never drift out of step with the actual state.
function updateGardenEditUI() {
  // Nothing to arrange in an empty garden - hide the whole bar rather
  // than offer a mode that does nothing.
  if (gardenEditBarEl) gardenEditBarEl.classList.toggle('hidden', tasks.length === 0);

  if (gardenEditStartEl)   gardenEditStartEl.classList.toggle('hidden', gardenEditMode);
  if (gardenEditActionsEl) gardenEditActionsEl.classList.toggle('hidden', !gardenEditMode);
  if (gardenSceneEl)       gardenSceneEl.classList.toggle('garden-editing', gardenEditMode);

  // The grow button shares this row and hides while editing, so it is
  // updated from here rather than from a second call site that would
  // have to be remembered every time this one is touched.
  updateGardenGrowUI();
}

function enterGardenEditMode() {
  if (gardenEditMode || !tasks.length) return;
  gardenEditSnapshot = snapshotGardenPositions();
  gardenEditMode     = true;
  updateGardenEditUI();
  // Re-render so every plant gets its drag listeners bound - outside
  // edit mode they simply aren't attached (see renderGarden).
  renderGarden();
}

function saveGardenEdits() {
  if (!gardenEditMode) return;
  if (activePlantDrag) onPlantDragEnd();  // mid-carry: drop it where it is

  // Cleared BEFORE saving, so saveData() reads the live positions
  // rather than the snapshot it would otherwise be protecting.
  gardenEditMode     = false;
  gardenEditSnapshot = null;
  updateGardenEditUI();

  saveData();   // the single write this whole feature exists to enable
  render();
}

function discardGardenEdits() {
  if (!gardenEditMode) return;
  if (activePlantDrag) onPlantDragEnd();  // drop first, then undo it below

  var snapshot = gardenEditSnapshot || [];
  snapshot.forEach(function (saved) {
    var task = tasks.find(function (t) { return t.id === saved.id; });
    if (!task) return;
    task.posX = saved.posX;
    task.posY = saved.posY;
  });

  gardenEditMode     = false;
  gardenEditSnapshot = null;
  updateGardenEditUI();
  render();
}

if (gardenEditStartEl)   gardenEditStartEl.addEventListener('click', enterGardenEditMode);
if (gardenEditSaveEl)    gardenEditSaveEl.addEventListener('click', saveGardenEdits);
if (gardenEditDiscardEl) gardenEditDiscardEl.addEventListener('click', discardGardenEdits);

updateGardenEditUI();


// ============================================
// Drag-to-place: inside edit mode, press a plant and it comes up
// immediately, follows the pointer anywhere in the garden, and
// drops where you let go. Nothing is written to Firestore here -
// the move lives in memory until "Save & exit".
//
// Outside edit mode none of this is bound at all (renderGarden only
// calls setupPlantDrag while editing), so plants can't be nudged by
// accident and a touch-drag across the lawn scrolls the scene the
// way it does everywhere else.
// ============================================

var activePlantDrag = null; // { taskId, wrap, moved, pendingX, pendingY }

function setupPlantDrag(wrap, taskId) {
  // No hold delay and no movement threshold: in edit mode the only
  // reason to touch a plant is to move it, so pressing it picks it up
  // at once. A press with no movement is still a no-op - the plant is
  // put back down exactly where it was and nothing is marked changed.
  //
  // Hovering does nothing: this is pointerdown, so the plant is never
  // picked up by the cursor merely passing over it.
  wrap.addEventListener('pointerdown', function (e) {
    if (e.button !== undefined && e.button !== 0) return; // left-click / primary touch only
    if (activePlantDrag) return;                          // one plant at a time
    e.preventDefault();
    beginPlantDrag(taskId, wrap, e.pointerId);
  });

  // Only applied to plants that are actually draggable, i.e. only in
  // edit mode - stops touch scrolling and the long-press callout menu
  // from fighting the drag.
  wrap.style.touchAction = 'none';
  wrap.style.userSelect  = 'none';
  wrap.addEventListener('contextmenu', function (e) { e.preventDefault(); });
}

function beginPlantDrag(taskId, wrap, pointerId, floating) {
  var task = tasks.find(function (t) { return t.id === taskId; });
  if (!task || !gardenSceneEl) return;

  activePlantDrag = {
    taskId:   taskId,
    wrap:     wrap,
    moved:    false,
    floating: !!floating,
    pendingX: (typeof task.posX === 'number') ? task.posX : (parseFloat(wrap.style.left) || 50),
    pendingY: (typeof task.posY === 'number') ? task.posY : DEFAULT_BOTTOM_PCT,
  };

  wrap.classList.add('dragging');
  wrap.style.zIndex = 9990;

  document.addEventListener('pointermove', onPlantDragMove);

  if (floating) {
    // Picked up via double-click - the mouse button isn't held down,
    // so there's no pointerup to end on. Instead, follow the pointer
    // on plain movement and finalize on the next click anywhere.
    document.addEventListener('click', onPlantDragEnd, { capture: true, once: true });
  } else {
    try { wrap.setPointerCapture(pointerId); } catch (e) {}
    document.addEventListener('pointerup', onPlantDragEnd);
    document.addEventListener('pointercancel', onPlantDragEnd);
  }
}

function onPlantDragMove(e) {
  if (!activePlantDrag || !gardenTrackEl) return;
  activePlantDrag.moved = true;

  var rect = gardenTrackEl.getBoundingClientRect();
  // Free placement: track the pointer directly, anywhere across the
  // (scrollable, 3x-wide) track - no row/band to snap to.
  var xPct = clampCenterPct(((e.clientX - rect.left) / rect.width) * 100);
  var yPct = ((e.clientY - rect.top) / rect.height) * 100;
  var bottomPct = clampBottomPct(100 - yPct);

  activePlantDrag.pendingX = xPct;
  activePlantDrag.pendingY = bottomPct;

  var wrap = activePlantDrag.wrap;
  var growthScale = parseFloat(wrap.dataset.growthScale || '1');
  var totalScale  = growthScale * computeDepthScale(bottomPct);

  wrap.style.left = xPct + '%';
  wrap.style.setProperty('--plant-depth-bottom', bottomPct + '%');
  wrap.style.setProperty('--plant-scale', totalScale.toFixed(3));
}

function onPlantDragEnd(e) {
  if (e && e.type === 'click') {
    // This click is the "drop" for a floating carry, not a real
    // click on whatever happens to be underneath - don't let it
    // also trigger that element's own click behavior.
    e.preventDefault();
    e.stopPropagation();
  }

  document.removeEventListener('pointermove', onPlantDragMove);
  document.removeEventListener('pointerup', onPlantDragEnd);
  document.removeEventListener('pointercancel', onPlantDragEnd);
  document.removeEventListener('click', onPlantDragEnd, { capture: true });

  if (!activePlantDrag) return;

  var drag = activePlantDrag;
  activePlantDrag = null;

  drag.wrap.classList.remove('dragging');

  var task = tasks.find(function (t) { return t.id === drag.taskId; });
  if (!task) { renderGarden(); return; }

  if (drag.moved) {
    // Dropped somewhere new - lock in the free (x, y) position.
    task.posX = drag.pendingX;
    task.posY = drag.pendingY;
  }
  // else: released without moving (a tap, or a press let go in place)
  // - leave the plant's position exactly as it was. No reset to the
  // automatic spot.

  // Deliberately NO saveData() here. The new position lives in memory
  // until "Save & exit" commits the whole session in one write; that
  // is the entire point of edit mode.
  render();
}