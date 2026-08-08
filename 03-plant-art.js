// ============================================
// 03: PLANT ART — SVG plant illustration data + skins system
// Part of DISCIPLANT — split from script.js.
// Loaded as a plain global script (no modules).
// Must load in order: 01 -> 02 -> 03 -> 04 -> 05,
// after firebase-config.js. All functions/vars here
// share one global scope with the other 4 files.
// ============================================

// ============================================
// SVG plant illustrations
// ============================================
// Each entry is an array of 4 SVG body strings (stages 0–3).
// ViewBox is "0 0 80 130". Plant base sits at y≈122, which is
// where every stage's ground shadow is centred (PLANT_ANCHORS
// rounds it to 120-121). A plant drawn short of that line reads as
// floating: the art scales from a fixed origin, so a 4-unit gap at
// stage 0 becomes a ~70px gap once the plant is a year old.
// ============================================

var PLANT_SVG_DATA = {

  // ---- OAK (Education) ----
  education: [
    // Stage 0: Acorn on soil
    '<path d="M29,122 C29,120.4 33.9,119 40,119 C46.1,119 51,120.4 51,122 C51,123.6 46.1,125 40,125 C33.9,125 29,123.6 29,122 Z" style="fill:var(--c-shadow,rgba(0,0,0,0.14))"/><path d="M40,107 C36.5,107 34.5,110.2 34.5,114 C34.5,117.9 36.5,121 40,121 C43.5,121 45.5,117.9 45.5,114 C45.5,110.2 43.5,107 40,107 Z" style="fill:var(--c-seed,hsl(35,38%,68%))"/><path d="M40,107 C37,107 34.5,109.8 34.5,113 L40,113.4 Z" style="fill:var(--c-seed-dark,hsl(35,38%,56%))"/><path d="M33,107 C33,104.8 36.1,103.5 40,103.5 C43.9,103.5 47,104.8 47,107 C47,109.2 43.9,110.5 40,110.5 C36.1,110.5 33,109.2 33,107 Z" style="fill:var(--c-stem,hsl(20,30%,45%))"/><path d="M40,103.5 C43.9,103.5 47,104.8 47,107 C47,109.2 43.9,110.5 40,110.5 Z" style="fill:var(--c-stem-dark,hsl(20,30%,35%))"/><path d="M38.7,99 C38.7,97.6 39.2,96.5 40,96.5 C40.8,96.5 41.3,97.6 41.3,99 L41.3,104 L38.7,104 Z" style="fill:var(--c-stem-dark,hsl(20,30%,35%))"/>',

    // Stage 1: Seedling, two round leaves -- recolored to the mature bark/canopy palette
    '<path d="M26,122 C26,120.1 32.3,118.5 40,118.5 C47.7,118.5 54,120.1 54,122 C54,123.9 47.7,125.5 40,125.5 C32.3,125.5 26,123.9 26,122 Z" style="fill:var(--c-shadow,rgba(0,0,0,0.14))"/><path d="M39,122 C38.8,113 39,104 39.6,96 C39.7,95 40.3,95 40.4,96 C41,104 41.2,113 41,122 Z" style="fill:var(--c-bark,hsl(8,30%,40%))"/><path d="M40.4,96 C41,104 41.2,113 41,122 L40.2,122 C40.4,113 40.2,104 39.9,96 Z" style="fill:var(--c-bark-dark,hsl(9,33%,30%))"/><g transform="translate(29,95) rotate(-22) scale(1.05)"><path d="M0,-5 C-6.1,-5 -11,-0.1 -11,6 C-11,12.1 -6.1,17 0,17 Z" style="fill:var(--c-canopy,hsl(61,45%,55%))"/><path d="M0,-5 C6.1,-5 11,-0.1 11,6 C11,12.1 6.1,17 0,17 Z" style="fill:var(--c-canopy-dark,hsl(58,38%,42%))"/></g><g transform="translate(51,92) rotate(22) scale(1.05)"><path d="M0,-5 C-6.1,-5 -11,-0.1 -11,6 C-11,12.1 -6.1,17 0,17 Z" style="fill:var(--c-canopy,hsl(61,45%,55%))"/><path d="M0,-5 C6.1,-5 11,-0.1 11,6 C11,12.1 6.1,17 0,17 Z" style="fill:var(--c-canopy-dark,hsl(58,38%,42%))"/></g>',

    // Stage 2: Young oak -- rounded three-tier crown as one merged mass,
    //          trunk carried down to the ground line at y=122 (it used
    //          to stop at 118 and hover above its own shadow)
    '<ellipse cx="40" cy="122" rx="19" ry="5.5" style="fill:var(--c-shadow,rgba(0,0,0,0.15))"/><g fill="none" style="stroke:var(--c-bark-dark,hsl(9,33%,30%))" stroke-linecap="round"><path d="M40,83 C37.4,78 35,71 32,52" stroke-width="2.2"/><path d="M40,86 C42.6,81 45,73.5 48,52" stroke-width="2.2"/></g><path d="M33.4,122 C33.7,120.4 34.4,119.3 34.5,118 C36.2,110 37.2,96 37.9,80 C38.2,74 38.3,67 38.3,59 L40,59 L40,122 Z" style="fill:var(--c-bark,hsl(8,30%,42%))"/><path d="M46.6,122 C46.3,120.4 45.6,119.3 45.5,118 C43.8,110 42.8,96 42.1,80 C41.8,74 41.7,67 41.7,59 L40,59 L40,122 Z" style="fill:var(--c-bark-dark,hsl(9,33%,30%))"/><path d="M32.6,37 A9,9 0 1,0 50.6,37 A9,9 0 1,0 32.6,37 Z M21.6,43 A8,8 0 1,0 37.6,43 A8,8 0 1,0 21.6,43 Z M45.6,43 A8,8 0 1,0 61.6,43 A8,8 0 1,0 45.6,43 Z M31.1,47 A10.5,10.5 0 1,0 52.1,47 A10.5,10.5 0 1,0 31.1,47 Z M23.6,53 A8,8 0 1,0 39.6,53 A8,8 0 1,0 23.6,53 Z M43.6,53 A8,8 0 1,0 59.6,53 A8,8 0 1,0 43.6,53 Z M33.6,57 A8,8 0 1,0 49.6,57 A8,8 0 1,0 33.6,57 Z" style="fill:var(--c-canopy-dark,hsl(58,38%,42%))"/><path d="M31,35 A9,9 0 1,0 49,35 A9,9 0 1,0 31,35 Z M20,41 A8,8 0 1,0 36,41 A8,8 0 1,0 20,41 Z M44,41 A8,8 0 1,0 60,41 A8,8 0 1,0 44,41 Z M29.5,45 A10.5,10.5 0 1,0 50.5,45 A10.5,10.5 0 1,0 29.5,45 Z M22,51 A8,8 0 1,0 38,51 A8,8 0 1,0 22,51 Z M42,51 A8,8 0 1,0 58,51 A8,8 0 1,0 42,51 Z M32,55 A8,8 0 1,0 48,55 A8,8 0 1,0 32,55 Z" style="fill:var(--c-canopy,hsl(61,45%,55%))"/><g fill="none" style="stroke:var(--c-canopy-dark,hsl(58,38%,42%))" stroke-linecap="round" stroke-width="1.3" opacity="0.42"><path d="M31,38 C34.5,43 45.5,43 49,38"/><path d="M22,44 C25,49 31,50.5 35,48"/></g>',

    // Stage 3: Full spreading oak -- ten merged lobes forming a single
    //          connected crown, split-shaded trunk with flared roots,
    //          limbs that terminate inside the canopy, and a trunk that
    //          reaches the y=122 ground line with a small root flare
    '<ellipse cx="40" cy="122" rx="24" ry="6" style="fill:var(--c-shadow,rgba(0,0,0,0.16))"/><g fill="none" style="stroke:var(--c-bark-dark,hsl(9,33%,30%))" stroke-linecap="round"><path d="M40,77 C35.2,72 31.4,65.5 28.5,58" stroke-width="2.9"/><path d="M40,80 C44.6,75 48,67 50.5,57.5" stroke-width="2.9"/><path d="M40,68 C37.6,63 35.4,59 33.6,54.5" stroke-width="2"/><path d="M40,70 C42.6,65 44.8,61 46.6,56" stroke-width="2"/></g><path d="M29.4,122 C29.8,120.3 30.7,119.3 31,118 C33.2,112 35,103 36.3,88 C37.1,78 37.4,68 37.5,58 L40,58 L40,122 Z" style="fill:var(--c-bark,hsl(8,30%,40%))"/><path d="M50.6,122 C50.2,120.3 49.3,119.3 49,118 C46.8,112 45,103 43.7,88 C42.9,78 42.6,68 42.5,58 L40,58 L40,122 Z" style="fill:var(--c-bark-dark,hsl(9,33%,30%))"/><g fill="none" style="stroke:var(--c-bark-dark,hsl(9,33%,30%))" stroke-linecap="round" stroke-width="0.8" opacity="0.35"><path d="M37.4,112 C38,100 38.4,86 38.6,72"/><path d="M34.6,116 C35.6,108 36.3,99 36.8,90"/></g><path d="M29,21.6 A13,13 0 1,0 55,21.6 A13,13 0 1,0 29,21.6 Z M17,29.6 A12,12 0 1,0 41,29.6 A12,12 0 1,0 17,29.6 Z M43,29.6 A12,12 0 1,0 67,29.6 A12,12 0 1,0 43,29.6 Z M11,40.6 A10,10 0 1,0 31,40.6 A10,10 0 1,0 11,40.6 Z M53,40.6 A10,10 0 1,0 73,40.6 A10,10 0 1,0 53,40.6 Z M27,36.6 A15,15 0 1,0 57,36.6 A15,15 0 1,0 27,36.6 Z M17,49.6 A12,12 0 1,0 41,49.6 A12,12 0 1,0 17,49.6 Z M43,49.6 A12,12 0 1,0 67,49.6 A12,12 0 1,0 43,49.6 Z M29,52.6 A13,13 0 1,0 55,52.6 A13,13 0 1,0 29,52.6 Z M33,60.6 A9,9 0 1,0 51,60.6 A9,9 0 1,0 33,60.6 Z" style="fill:var(--c-canopy-dark,hsl(58,38%,42%))"/><path d="M27,19 A13,13 0 1,0 53,19 A13,13 0 1,0 27,19 Z M15,27 A12,12 0 1,0 39,27 A12,12 0 1,0 15,27 Z M41,27 A12,12 0 1,0 65,27 A12,12 0 1,0 41,27 Z M9,38 A10,10 0 1,0 29,38 A10,10 0 1,0 9,38 Z M51,38 A10,10 0 1,0 71,38 A10,10 0 1,0 51,38 Z M25,34 A15,15 0 1,0 55,34 A15,15 0 1,0 25,34 Z M15,47 A12,12 0 1,0 39,47 A12,12 0 1,0 15,47 Z M41,47 A12,12 0 1,0 65,47 A12,12 0 1,0 41,47 Z M27,50 A13,13 0 1,0 53,50 A13,13 0 1,0 27,50 Z M31,58 A9,9 0 1,0 49,58 A9,9 0 1,0 31,58 Z" style="fill:var(--c-canopy,hsl(61,45%,55%))"/><g fill="none" style="stroke:var(--c-canopy-dark,hsl(58,38%,42%))" stroke-linecap="round" stroke-width="1.6" opacity="0.45"><path d="M30,17 C34,23 46,23 50,17"/><path d="M18,30 C22,38 32,40 37,36"/><path d="M62,30 C58,38 48,40 43,36"/></g>'
  ],

  // ---- SUNFLOWER (Exercise) ----
  exercise: [
    // Stage 0: Single seed
    '<ellipse cx="40" cy="121" rx="9" ry="2.5" style="fill:var(--c-shadow,rgba(0,0,0,0.12))"/>' +
    '<ellipse cx="40" cy="113" rx="5" ry="7" style="fill:var(--c-seed,#C8A030)"/>' +
    '<line x1="38" y1="109" x2="42" y2="109" style="stroke:var(--c-seed-line,#908018)" stroke-width="1.5"/>' +
    '<line x1="37" y1="112" x2="43" y2="112" style="stroke:var(--c-seed-line,#908018)" stroke-width="1.5"/>' +
    '<line x1="37" y1="115" x2="43" y2="115" style="stroke:var(--c-seed-line,#908018)" stroke-width="1.5"/>',

    // Stage 1: Sprout with leaves and small bud
    '<ellipse cx="40" cy="122" rx="13" ry="3.5" style="fill:var(--c-shadow,rgba(0,0,0,0.14))"/>' +
    '<rect x="39" y="95" width="2" height="27" rx="1" style="fill:var(--c-stem,#6A9A30)"/>' +
    '<ellipse cx="28" cy="103" rx="12" ry="5" style="fill:var(--c-leaf-light,#8FBF7F)" transform="rotate(-28,28,103)"/>' +
    '<ellipse cx="52" cy="99" rx="12" ry="5" style="fill:var(--c-leaf,#7ABF50)" transform="rotate(28,52,99)"/>' +
    '<circle cx="40" cy="93" r="5.5" style="fill:var(--c-petal,#F5C840)"/>' +
    '<circle cx="40" cy="93" r="3" style="fill:var(--c-petal-dark,#D4A010)"/>',

    // Stage 2: Blooming sunflower
    '<ellipse cx="40" cy="122" rx="15" ry="4" style="fill:var(--c-shadow,rgba(0,0,0,0.15))"/>' +
    '<rect x="39" y="80" width="2" height="42" rx="1" style="fill:var(--c-stem,#5A8830)"/>' +
    '<ellipse cx="26" cy="96" rx="14" ry="5.5" style="fill:var(--c-leaf,#7ABF50)" transform="rotate(-25,26,96)"/>' +
    '<ellipse cx="54" cy="91" rx="14" ry="5.5" style="fill:var(--c-leaf-light,#8FBF7F)" transform="rotate(25,54,91)"/>' +
    '<g transform="translate(40,76)">' +
    '<ellipse cx="0" cy="-13" rx="4.5" ry="9.5" style="fill:var(--c-petal,#F2B84B)" transform="rotate(0)"/>' +
    '<ellipse cx="0" cy="-13" rx="4.5" ry="9.5" style="fill:var(--c-petal-dark,#E8A020)" transform="rotate(45)"/>' +
    '<ellipse cx="0" cy="-13" rx="4.5" ry="9.5" style="fill:var(--c-petal,#F2B84B)" transform="rotate(90)"/>' +
    '<ellipse cx="0" cy="-13" rx="4.5" ry="9.5" style="fill:var(--c-petal-dark,#E8A020)" transform="rotate(135)"/>' +
    '<ellipse cx="0" cy="-13" rx="4.5" ry="9.5" style="fill:var(--c-petal,#F2B84B)" transform="rotate(180)"/>' +
    '<ellipse cx="0" cy="-13" rx="4.5" ry="9.5" style="fill:var(--c-petal-dark,#E8A020)" transform="rotate(225)"/>' +
    '<ellipse cx="0" cy="-13" rx="4.5" ry="9.5" style="fill:var(--c-petal,#F2B84B)" transform="rotate(270)"/>' +
    '<ellipse cx="0" cy="-13" rx="4.5" ry="9.5" style="fill:var(--c-petal-dark,#E8A020)" transform="rotate(315)"/>' +
    '<circle cx="0" cy="0" r="10" style="fill:var(--c-disc,#5C3A1A)"/>' +
    '<circle cx="0" cy="0" r="6.5" style="fill:var(--c-disc-dark,#3C2210)"/>' +
    '</g>',

    // Stage 3: Tall full sunflower
    '<ellipse cx="40" cy="122" rx="16" ry="4.5" style="fill:var(--c-shadow,rgba(0,0,0,0.16))"/>' +
    '<rect x="38.5" y="66" width="3" height="56" rx="1.5" style="fill:var(--c-stem,#4A7820)"/>' +
    '<ellipse cx="22" cy="88" rx="17" ry="6.5" style="fill:var(--c-leaf-dark,#6AAF40)" transform="rotate(-22,22,88)"/>' +
    '<ellipse cx="58" cy="82" rx="17" ry="6.5" style="fill:var(--c-leaf,#7ABF50)" transform="rotate(22,58,82)"/>' +
    '<g transform="translate(40,58)">' +
    '<ellipse cx="0" cy="-18" rx="6" ry="13" style="fill:var(--c-petal,#F2B84B)" transform="rotate(0)"/>' +
    '<ellipse cx="0" cy="-18" rx="6" ry="13" style="fill:var(--c-petal-dark,#E8A010)" transform="rotate(45)"/>' +
    '<ellipse cx="0" cy="-18" rx="6" ry="13" style="fill:var(--c-petal,#F2B84B)" transform="rotate(90)"/>' +
    '<ellipse cx="0" cy="-18" rx="6" ry="13" style="fill:var(--c-petal-dark,#E8A010)" transform="rotate(135)"/>' +
    '<ellipse cx="0" cy="-18" rx="6" ry="13" style="fill:var(--c-petal,#F2B84B)" transform="rotate(180)"/>' +
    '<ellipse cx="0" cy="-18" rx="6" ry="13" style="fill:var(--c-petal-dark,#E8A010)" transform="rotate(225)"/>' +
    '<ellipse cx="0" cy="-18" rx="6" ry="13" style="fill:var(--c-petal,#F2B84B)" transform="rotate(270)"/>' +
    '<ellipse cx="0" cy="-18" rx="6" ry="13" style="fill:var(--c-petal-dark,#E8A010)" transform="rotate(315)"/>' +
    '<circle cx="0" cy="0" r="14" style="fill:var(--c-disc,#5C3A1A)"/>' +
    '<circle cx="0" cy="0" r="10" style="fill:var(--c-disc-dark,#3C2210)"/>' +
    '<circle cx="-4" cy="-3" r="2.5" style="fill:var(--c-disc-seed,#704820)"/>' +
    '<circle cx="4" cy="-2" r="2.5" style="fill:var(--c-disc-seed,#704820)"/>' +
    '<circle cx="0" cy="5" r="2.5" style="fill:var(--c-disc-seed,#704820)"/>' +
    '</g>'
  ],

  // ---- LOTUS (Mindfulness) ----
  // Every stage below is built from the same "vesica" petal primitive:
  // a path that starts and ends at one shared base point and reaches a
  // single shared tip point via two curves, split down the centerline
  // into a light half + a dark half for two-tone shading. This is what
  // guarantees a genuinely sharp petal tip (both halves close on the
  // exact same coordinate -- no blunt double-point kinks) and keeps every
  // growth stage -- seed, closed bud, half-open, full bloom -- built out
  // of the *same* petal shape at increasing size/count, so the design
  // reads as one continuous plant rather than unrelated art per stage.
  // Palette: petal base #F5BCC6 (hsl 350,75%,85%), petal shadow #E28D9B
  // (hsl 350,60%,72%), leaves/stem sage green #64B47F (hsl 140,35%,55%).
  mindfulness: [
    // Stage 0: Seed on a small lily pad -- a single tiny pointed nub
    '<ellipse cx="40" cy="121" rx="14" ry="4" style="fill:var(--c-shadow,rgba(40,100,50,0.3))"/>' +
    '<ellipse cx="40" cy="119" rx="12" ry="4.5" style="fill:var(--c-pad-dark,#3A7A4A)"/>' +
    '<ellipse cx="40" cy="117" rx="11" ry="3.5" style="fill:var(--c-pad,#4A9A5A)"/>' +
    '<path d="M40.0,118.0 C36.4,114.4 36.7,108.2 40.0,105.0 L40.0,118.0 Z" style="fill:var(--c-petal-outer,#F5BCC6)"/>' +
    '<path d="M40.0,118.0 C43.6,114.4 43.3,108.2 40.0,105.0 L40.0,118.0 Z" style="fill:var(--c-petal-outer-light,#FAD1D8)"/>',

    // Stage 1: Pad with stem + closed bud (3 tight, upright petal tips)
    '<ellipse cx="40" cy="121" rx="17" ry="4.5" style="fill:var(--c-shadow,rgba(40,100,50,0.28))"/>' +
    '<ellipse cx="40" cy="119" rx="15" ry="5" style="fill:var(--c-pad-dark,#2A6A3A)"/>' +
    '<ellipse cx="40" cy="117" rx="13.5" ry="4" style="fill:var(--c-pad,#3A8A4A)"/>' +
    '<rect x="39" y="103" width="2" height="16" rx="1" style="fill:var(--c-pad-dark,#3A7A4A)"/>' +
    '<path d="M40.0,103.0 C34.8,98.6 33.7,89.0 36.9,83.2 L40.0,103.0 Z" style="fill:var(--c-petal-outer,#F5BCC6)"/>' +
    '<path d="M40.0,103.0 C43.5,97.2 41.7,87.7 36.9,83.2 L40.0,103.0 Z" style="fill:var(--c-petal-outer-light,#FAD1D8)"/>' +
    '<path d="M40.0,103.0 C35.6,97.8 36.0,88.2 40.0,83.0 L40.0,103.0 Z" style="fill:var(--c-petal-outer,#F5BCC6)"/>' +
    '<path d="M40.0,103.0 C44.4,97.8 44.0,88.2 40.0,83.0 L40.0,103.0 Z" style="fill:var(--c-petal-outer-light,#FAD1D8)"/>' +
    '<path d="M40.0,103.0 C36.5,97.2 38.3,87.7 43.1,83.2 L40.0,103.0 Z" style="fill:var(--c-petal-outer,#F5BCC6)"/>' +
    '<path d="M40.0,103.0 C45.2,98.6 46.3,89.0 43.1,83.2 L40.0,103.0 Z" style="fill:var(--c-petal-outer-light,#FAD1D8)"/>',

    // Stage 2: Half-open lotus -- 2 back petals + 3 front petals + carpel,
    // same shading pairs the full bloom uses (mid pink / light pink)
    '<ellipse cx="40" cy="121" rx="20" ry="5" style="fill:var(--c-shadow,rgba(40,100,50,0.3))"/>' +
    '<ellipse cx="40" cy="119" rx="18" ry="5.5" style="fill:var(--c-pad-dark,#2A6A3A)"/>' +
    '<ellipse cx="40" cy="117" rx="16" ry="4.5" style="fill:var(--c-pad,#3A8A4A)"/>' +
    '<ellipse cx="26" cy="120" rx="9" ry="3" style="fill:var(--c-pad-dark,#3A7A4A)"/>' +
    '<ellipse cx="54" cy="120" rx="9" ry="3" style="fill:var(--c-pad,#4A9A5A)"/>' +
    '<rect x="39" y="89" width="2" height="30" rx="1" style="fill:var(--c-pad-dark,#2A6A3A)"/>' +
    '<path d="M40.0,89.0 C30.5,82.4 24.5,67.7 26.6,58.9 L40.0,89.0 Z" style="fill:var(--c-petal-mid,#E28D9B)"/>' +
    '<path d="M40.0,89.0 C41.5,77.5 34.6,63.2 26.6,58.9 L40.0,89.0 Z" style="fill:var(--c-petal-mid-light,#EEA0AD)"/>' +
    '<path d="M40.0,89.0 C38.5,77.5 45.4,63.2 53.4,58.9 L40.0,89.0 Z" style="fill:var(--c-petal-mid,#E28D9B)"/>' +
    '<path d="M40.0,89.0 C49.5,82.4 55.5,67.7 53.4,58.9 L40.0,89.0 Z" style="fill:var(--c-petal-mid-light,#EEA0AD)"/>' +
    '<path d="M40.0,89.0 C33.5,82.6 31.4,69.8 34.8,62.5 L40.0,89.0 Z" style="fill:var(--c-petal-outer,#F5BCC6)"/>' +
    '<path d="M40.0,89.0 C43.7,80.6 40.8,67.9 34.8,62.5 L40.0,89.0 Z" style="fill:var(--c-petal-outer-light,#FAD1D8)"/>' +
    '<path d="M40.0,89.0 C34.8,81.4 35.2,68.5 40.0,62.0 L40.0,89.0 Z" style="fill:var(--c-petal-outer,#F5BCC6)"/>' +
    '<path d="M40.0,89.0 C45.2,81.4 44.8,68.5 40.0,62.0 L40.0,89.0 Z" style="fill:var(--c-petal-outer-light,#FAD1D8)"/>' +
    '<path d="M40.0,89.0 C36.3,80.6 39.2,67.9 45.2,62.5 L40.0,89.0 Z" style="fill:var(--c-petal-outer,#F5BCC6)"/>' +
    '<path d="M40.0,89.0 C46.5,82.6 48.6,69.8 45.2,62.5 L40.0,89.0 Z" style="fill:var(--c-petal-outer-light,#FAD1D8)"/>' +
    '<ellipse cx="40" cy="83" rx="5" ry="3.8" style="fill:var(--c-center,#E8D27A)"/>' +
    '<circle cx="40" cy="82" r="2.2" style="fill:var(--c-center-dark,#D9C05C)"/>',

    // Stage 3: Full open lotus -- 3 clean layers (3 back / 4 middle /
    // 4 front = 11 petals total), each a sharp-tipped vesica split into
    // a light/dark half, fanned from one shared base joint so petals
    // stay clearly separated instead of bleeding together. Own stem +
    // 2 leaves, pink/green palette (no purple).
    '<ellipse cx="40" cy="121" rx="24" ry="5.5" style="fill:var(--c-shadow,rgba(40,100,50,0.32))"/>' +
    '<ellipse cx="40" cy="119" rx="22" ry="6" style="fill:var(--c-pad-dark,#2A6A3A)"/>' +
    '<ellipse cx="40" cy="117" rx="20" ry="5" style="fill:var(--c-pad,#3A8A4A)"/>' +
    '<ellipse cx="22" cy="120" rx="11" ry="3.5" style="fill:var(--c-pad-dark,#3A7A4A)"/>' +
    '<ellipse cx="58" cy="120" rx="11" ry="3.5" style="fill:var(--c-pad,#4A9A5A)"/>' +
    '<g transform="translate(8.5,36) scale(0.21)">' +
    '<path d="M158.6,273.9 C180.8,235.9 234.0,226.3 263.8,249.6 L158.6,273.9 Z" style="fill:var(--c-leaf-dark,#40965D)"/>' +
    '<path d="M158.6,273.9 C195.2,298.3 247.3,283.6 263.8,249.6 L158.6,273.9 Z" style="fill:var(--c-leaf,#64B47F)"/>' +
    '<path d="M166.5,330.7 C139.8,357.8 93.9,354.0 74.6,327.5 L166.5,330.7 Z" style="fill:var(--c-leaf-light,#87C59B)"/>' +
    '<path d="M166.5,330.7 C141.8,301.9 95.7,302.5 74.6,327.5 L166.5,330.7 Z" style="fill:var(--c-leaf,#64B47F)"/>' +
    '<path d="M150.0,213.0 C160.6,223.9 173.9,323.5 178.5,416.0 L150.0,213.0 Z" style="fill:var(--c-leaf-dark,#40965D)"/>' +
    '<path d="M150.0,213.0 C142.8,226.4 157.5,325.8 178.5,416.0 L150.0,213.0 Z" style="fill:var(--c-leaf,#64B47F)"/>' +
    '<path d="M150.0,213.0 C87.4,172.6 44.9,93.5 52.5,44.1 L150.0,213.0 Z" style="fill:var(--c-petal-inner,#DA4E65)"/>' +
    '<path d="M150.0,213.0 C146.3,138.6 99.1,62.3 52.5,44.1 L150.0,213.0 Z" style="fill:var(--c-petal-inner-light,#D77585)"/>' +
    '<path d="M150.0,213.0 C116.0,146.7 118.7,57.0 150.0,18.0 L150.0,213.0 Z" style="fill:var(--c-petal-inner,#DA4E65)"/>' +
    '<path d="M150.0,213.0 C184.0,146.7 181.3,57.0 150.0,18.0 L150.0,213.0 Z" style="fill:var(--c-petal-inner-light,#D77585)"/>' +
    '<path d="M150.0,213.0 C153.7,138.6 200.9,62.3 247.5,44.1 L150.0,213.0 Z" style="fill:var(--c-petal-inner,#DA4E65)"/>' +
    '<path d="M150.0,213.0 C212.6,172.6 255.1,93.5 247.5,44.1 L150.0,213.0 Z" style="fill:var(--c-petal-inner-light,#D77585)"/>' +
    '<path d="M150.0,213.0 C83.4,210.3 22.9,164.4 14.8,118.4 L150.0,213.0 Z" style="fill:var(--c-petal-mid,#E28D9B)"/>' +
    '<path d="M150.0,213.0 C124.7,151.3 60.9,110.2 14.8,118.4 L150.0,213.0 Z" style="fill:var(--c-petal-mid-light,#EEA0AD)"/>' +
    '<path d="M150.0,213.0 C98.4,170.8 77.7,97.7 99.0,56.1 L150.0,213.0 Z" style="fill:var(--c-petal-mid,#E28D9B)"/>' +
    '<path d="M150.0,213.0 C166.9,148.5 140.7,77.2 99.0,56.1 L150.0,213.0 Z" style="fill:var(--c-petal-mid-light,#EEA0AD)"/>' +
    '<path d="M150.0,213.0 C133.1,148.5 159.3,77.2 201.0,56.1 L150.0,213.0 Z" style="fill:var(--c-petal-mid,#E28D9B)"/>' +
    '<path d="M150.0,213.0 C201.6,170.8 222.3,97.7 201.0,56.1 L150.0,213.0 Z" style="fill:var(--c-petal-mid-light,#EEA0AD)"/>' +
    '<path d="M150.0,213.0 C175.3,151.3 239.1,110.2 285.2,118.4 L150.0,213.0 Z" style="fill:var(--c-petal-mid,#E28D9B)"/>' +
    '<path d="M150.0,213.0 C216.6,210.3 277.1,164.4 285.2,118.4 L150.0,213.0 Z" style="fill:var(--c-petal-mid-light,#EEA0AD)"/>' +
    '<path d="M150.0,213.0 C100.2,201.2 68.3,156.3 73.0,114.5 L150.0,213.0 Z" style="fill:var(--c-petal-outer,#F5BCC6)"/>' +
    '<path d="M150.0,213.0 C150.6,161.8 114.7,120.0 73.0,114.5 L150.0,213.0 Z" style="fill:var(--c-petal-outer-light,#FAD1D8)"/>' +
    '<path d="M150.0,213.0 C149.4,161.8 185.3,120.0 227.0,114.5 L150.0,213.0 Z" style="fill:var(--c-petal-outer,#F5BCC6)"/>' +
    '<path d="M150.0,213.0 C199.8,201.2 231.7,156.3 227.0,114.5 L150.0,213.0 Z" style="fill:var(--c-petal-outer-light,#FAD1D8)"/>' +
    '</g>'
  ],

 // ---- LAVENDER (Sleep) — flat pastel rebuild ----
  // Rebuilt against the reference illustration: a spike of clean,
  // clearly separated whorls instead of a dense pile of buds.
  //
  // Rules this entry follows:
  //   * flat fills only — no strokes, no gradients, no fill-opacity on
  //     any part of the plant (the ground shadow is the one exception,
  //     since it sits on the soil, not on the flower);
  //   * three petals per whorl only — a left and a right bract that fan
  //     outward, and one upright centre bract laid over their bases —
  //     so nothing crowds and no shape is hidden behind another;
  //   * tones alternate like a checkerboard: the centre petal always
  //     takes the opposite tone from its own row's side petals, and
  //     each row flips, so touching shapes always read apart without an
  //     outline;
  //   * a solid deep-lilac head mass sits behind the whorls, so the
  //     wedges between petals read as shade, never as background;
  //   * every shape carries a class hook (petal-dark, petal-light,
  //     calyx, foliage, shadow) as well as a palette variable, so the
  //     plant can be recoloured from CSS classes or from the garden's
  //     --c-* tokens.
  //
  // Each whorl is a bezier bract (a broad, rounded teardrop tapering to
  // its attachment point) sat on an olive calyx cup that stays visible
  // between rows. Whorls tighten and shrink toward the tip, so the head
  // is a full, tapering plume that dominates the plant's silhouette by
  // the final stage. Stem and lance-shaped leaves are tapered bezier
  // paths in sage.
  //
  // Palette hooks (all with pastel fallbacks): --c-bud, --c-bud-shade,
  // --c-bud-pale, --c-calyx, --c-stem, --c-stem-light, --c-shadow.
  sleep: (function () {
    var LAV_MAIN   = 'var(--c-bud,#8A72C8)';
    var LAV_PALE   = 'var(--c-bud-pale,#C7B6EC)';
    var LAV_DEEP   = 'var(--c-bud-shade,#6A55A6)';
    var CALYX_C    = 'var(--c-calyx,#9FA07A)';
    var SAGE       = 'var(--c-stem,#6EA98B)';
    var SAGE_LIGHT = 'var(--c-stem-light,#93C6A8)';
    var SHADOW     = 'var(--c-shadow,rgba(0,0,0,0.12))';

    // bract + calyx geometry, drawn from the attachment point (0,0) up
    var BRACT = 'M0,0C-3.7,-2.0 -5.8,-4.9 -5.8,-8.7C-5.8,-12.5 -3.2,-15.2 0,-15.2C3.2,-15.2 5.8,-12.5 5.8,-8.7C5.8,-4.9 3.7,-2.0 0,0Z';
    var CALYX = 'M0,0C-3.6,-0.3 -5.5,-2.5 -5.1,-5.1C-2.8,-4.3 -0.9,-4.1 0,-4.1C0.9,-4.1 2.8,-4.3 5.1,-5.1C5.5,-2.5 3.6,-0.3 0,0Z';

    function place(cx, cy, rot, s) {
      return '<g transform="translate(' + cx.toFixed(2) + ',' + cy.toFixed(2) + ') rotate(' + rot + ') scale(' + s.toFixed(3) + ')">';
    }
    function bud(cx, cy, rot, s, fill, cls) {
      return place(cx, cy, rot, s) +
        '<path class="' + cls + '" d="' + BRACT + '" style="fill:' + fill + '"/></g>';
    }
    function budCalyx(cx, cy, s) {
      return place(cx, cy, 0, s) +
        '<path class="calyx" d="' + CALYX + '" style="fill:' + CALYX_C + '"/></g>';
    }

    // catmull-rom -> cubic, for organic closed outlines (no ellipses)
    function smoothClosed(pts) {
      var n = pts.length, d = 'M' + pts[0][0].toFixed(2) + ',' + pts[0][1].toFixed(2);
      for (var i = 0; i < n; i++) {
        var p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
        var c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
        var c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
        d += 'C' + c1[0].toFixed(2) + ',' + c1[1].toFixed(2) + ' ' + c2[0].toFixed(2) + ',' + c2[1].toFixed(2) +
             ' ' + p2[0].toFixed(2) + ',' + p2[1].toFixed(2);
      }
      return d + 'Z';
    }
    // solid backing plate: sits inside the petal envelope, so the small
    // wedges between bracts read as depth instead of holes
    function headMass(rows) {
      var left = [], right = [], i, r, w;
      for (i = 0; i < rows.length; i++) {
        r = rows[i];
        w = r[1] + 3.1 * r[2];
        left.push([40 - w, r[0] - 5.6 * r[2]]);
        right.unshift([40 + w, r[0] - 5.6 * r[2]]);
      }
      var top = rows[rows.length - 1];
      var pts = left.concat([[40, top[0] - 12.4 * top[2]]], right, [[40, rows[0][0] + 1.4]]);
      return '<path class="petal-dark" d="' + smoothClosed(pts) + '" style="fill:' + LAV_DEEP + '"/>';
    }
    // phase flips the two tones row to row so neighbours never match
    function budWhorl(cy, spread, s, phase) {
      var sideC   = phase ? LAV_PALE : LAV_MAIN;
      var sideCls = phase ? 'petal-light' : 'petal-dark';
      var midC    = phase ? LAV_MAIN : LAV_PALE;
      var midCls  = phase ? 'petal-dark' : 'petal-light';
      return bud(40 - spread, cy + 2.0, -40, s * 0.90, sideC, sideCls) +
        bud(40 + spread, cy + 2.0,  40, s * 0.90, sideC, sideCls) +
        budCalyx(40, cy + 4.6, s) +
        bud(40, cy - 1.0, 0, s, midC, midCls);
    }
    // rows: [cy, spread, scale], bottom row first
    function spike(rows) {
      var out = headMass(rows);
      for (var i = 0; i < rows.length; i++) out += budWhorl(rows[i][0], rows[i][1], rows[i][2], i % 2);
      return out;
    }
    function leafShape(x, y, rot, l, w) {
      var d = 'M0,0C' + (w * 0.95).toFixed(2) + ',' + (-l * 0.30).toFixed(2) + ' ' + (w * 0.72).toFixed(2) + ',' +
        (-l * 0.74).toFixed(2) + ' 0,' + (-l).toFixed(2) + 'C' + (-w * 0.66).toFixed(2) + ',' + (-l * 0.72).toFixed(2) +
        ' ' + (-w * 0.88).toFixed(2) + ',' + (-l * 0.28).toFixed(2) + ' 0,0Z';
      var rib = 'M0,' + (-l * 0.08).toFixed(2) + 'C' + (w * 0.13).toFixed(2) + ',' + (-l * 0.38).toFixed(2) + ' ' +
        (w * 0.11).toFixed(2) + ',' + (-l * 0.68).toFixed(2) + ' 0,' + (-l * 0.92).toFixed(2) + 'C' +
        (-w * 0.02).toFixed(2) + ',' + (-l * 0.66).toFixed(2) + ' ' + (-w * 0.03).toFixed(2) + ',' +
        (-l * 0.36).toFixed(2) + ' 0,' + (-l * 0.08).toFixed(2) + 'Z';
      return '<g transform="translate(' + x.toFixed(2) + ',' + y.toFixed(2) + ') rotate(' + rot + ')">' +
        '<path class="foliage" d="' + d + '" style="fill:' + SAGE + '"/>' +
        '<path class="foliage" d="' + rib + '" style="fill:' + SAGE_LIGHT + '"/></g>';
    }
    function stemShape(top, b, t) {
      var mid = 122 - (122 - top) * 0.45, up = top + (122 - top) * 0.3;
      return '<path class="foliage" d="M' + (40 - b).toFixed(2) + ',122C' + (40 - b * 0.9).toFixed(2) + ',' + mid.toFixed(2) + ' ' +
        (40 - t * 1.3).toFixed(2) + ',' + up.toFixed(2) + ' ' + (40 - t).toFixed(2) + ',' + top.toFixed(2) +
        'L' + (40 + t).toFixed(2) + ',' + top.toFixed(2) + 'C' + (40 + t * 1.3).toFixed(2) + ',' + up.toFixed(2) + ' ' +
        (40 + b * 0.9).toFixed(2) + ',' + mid.toFixed(2) + ' ' + (40 + b).toFixed(2) + ',122Z" style="fill:' + SAGE + '"/>' +
        '<path class="foliage" d="M' + (40 - b * 0.38).toFixed(2) + ',122C' + (40 - b * 0.32).toFixed(2) + ',' + mid.toFixed(2) + ' ' +
        (40 - t * 0.45).toFixed(2) + ',' + up.toFixed(2) + ' ' + (40 - t * 0.28).toFixed(2) + ',' + top.toFixed(2) +
        'L' + (40 + t * 0.08).toFixed(2) + ',' + top.toFixed(2) + 'C' + (40 + t * 0.18).toFixed(2) + ',' + up.toFixed(2) + ' ' +
        (40 + b * 0.04).toFixed(2) + ',' + mid.toFixed(2) + ' ' + (40 + b * 0.08).toFixed(2) + ',122Z" style="fill:' + SAGE_LIGHT + '"/>';
    }
    function ground(rx, ry) {
      return '<path class="shadow" d="' + smoothClosed([[40 - rx, 122], [40, 122 - ry], [40 + rx, 122], [40, 122 + ry]]) +
        '" style="fill:' + SHADOW + '"/>';
    }

    return [
      // Stage 0: sprout — two seed leaves and a pair of small whorls
      ground(9, 2.4) + stemShape(103, 1.5, 0.9) +
        leafShape(38.40, 113.00, -36, 12.0, 4.2) + leafShape(41.60, 111.00, 34, 11.0, 4.0) +
        spike([[104.0, 2.94, 0.450], [99.6, 2.30, 0.360]]),

      // Stage 1: young spike — four whorls, the head still slim
      ground(12, 3.0) + stemShape(86, 1.8, 1.0) +
        leafShape(38.20, 115.00, -34, 20.0, 5.4) + leafShape(41.80, 112.00, 32, 18.0, 5.0) +
        spike([[100.0, 3.84, 0.580], [94.2, 3.71, 0.550], [88.8, 3.33, 0.490], [84.0, 2.69, 0.400]]),

      // Stage 2: filling out — the spike broadens at the shoulder, then tapers
      ground(16, 3.6) + stemShape(67, 2.1, 1.1) +
        leafShape(37.90, 116.00, -33, 30.0, 6.8) + leafShape(42.10, 113.00, 31, 27.0, 6.3) +
        spike([[101.0, 5.12, 0.780], [93.7, 4.99, 0.750], [86.7, 4.67, 0.700], [80.1, 4.22, 0.620],
               [74.3, 3.71, 0.530], [69.3, 3.07, 0.430], [65.3, 2.43, 0.340]]),

      // Stage 3: full plant — eight whorls; the flower head dominates
      // the plant's overall height
      ground(21, 4.6) + stemShape(48, 2.5, 1.1) +
        leafShape(37.40, 117.00, -33, 40.0, 7.6) + leafShape(42.60, 114.00, 31, 37.0, 7.2) +
        spike([[103.0, 6.27, 0.950], [94.1, 6.14, 0.930], [85.4, 5.89, 0.890], [77.0, 5.57, 0.840],
               [69.1, 5.12, 0.780], [61.8, 4.61, 0.700], [55.2, 4.03, 0.610], [49.5, 3.33, 0.500]])
    ];
  }()),

  // ---- BAMBOO (Chores) ----
  // Rebuilt from the reference illustration: ONE culm at every stage,
  // grown from real tapering internode segments (not stacked rects),
  // banded by slightly-overhanging tan node collars, and every leaf
  // is grown off a drawn twig so nothing floats detached. Palette is
  // medium pastel green — soft, never neon.
  chores: (function () {

    var LEAF_L = 'var(--c-leaf-light,#C6E4A2)';
    var LEAF_M = 'var(--c-leaf,#96CC72)';
    var LEAF_D = 'var(--c-leaf-dark,#6BA854)';

    function n(v) { return Math.round(v * 100) / 100; }

    // ---- one lance-shaped leaf -------------------------------------
    // The base sits exactly at (x,y) — always a point on a twig — and
    // the blade tapers to a real point. Two-tone: the lower half is
    // repainted one step darker so the midrib reads as a crease,
    // like the reference art, instead of a flat ellipse.
    function leaf(x, y, ang, L, W, top, under) {
      return (
        '<g transform="translate(' + n(x) + ',' + n(y) + ') rotate(' + n(ang) + ')">' +
          '<path d="M0,0C' + n(L * 0.20) + ',' + n(-W) + ' ' + n(L * 0.66) + ',' + n(-W * 0.74) + ' ' + n(L) + ',0' +
            'C' + n(L * 0.66) + ',' + n(W * 0.74) + ' ' + n(L * 0.20) + ',' + n(W) + ' 0,0Z"' +
            ' style="fill:' + top + '"/>' +
          '<path d="M0,0C' + n(L * 0.20) + ',' + n(W) + ' ' + n(L * 0.66) + ',' + n(W * 0.74) + ' ' + n(L) + ',0Z"' +
            ' style="fill:' + under + '"/>' +
          '<path d="M' + n(L * 0.06) + ',0L' + n(L * 0.88) + ',0" fill="none"' +
            ' style="stroke:' + LEAF_L + '" stroke-width="0.35" opacity="0.45"/>' +
        '</g>'
      );
    }

    // ---- a twig with its leaves attached ---------------------------
    // Drawn right-facing in local space, then mirrored with
    // scale(-1,1) for the left side so both sides are built the same
    // way. Every leaf base is pinned to a point ON the twig curve.
    // `pale` swaps the cluster to the lighter pair, which is how the
    // canopy gets depth without extra outlines.
    function spray(x, y, dir, s, pale) {
      var top   = pale ? LEAF_L : LEAF_M;
      var under = pale ? LEAF_M : LEAF_D;

      return (
        '<g transform="translate(' + n(x) + ',' + n(y) + ') scale(' + n(dir * s) + ',' + n(s) + ')">' +
          '<path d="M0,0Q7,-2.5 13.5,-8" fill="none"' +
            ' style="stroke:var(--c-culm-mid,#74AC55)" stroke-width="1.2" stroke-linecap="round"/>' +
          '<path d="M6.5,-2.6Q9,-5.5 10.2,-9.6" fill="none"' +
            ' style="stroke:var(--c-culm-mid,#74AC55)" stroke-width="0.9" stroke-linecap="round"/>' +
          leaf(6.5, -2.6, 26, 14, 3.8, LEAF_M, LEAF_D) +
          leaf(10.2, -9.6, -72, 15.5, 4.1, top, under) +
          leaf(13.5, -8, -38, 18, 4.7, under, LEAF_D) +
          leaf(13.5, -8, -4, 19.5, 5, top, under) +
        '</g>'
      );
    }

    // ---- the crown tuft at the very tip ----------------------------
    function crown(x, y, s) {
      return (
        '<g transform="translate(' + n(x) + ',' + n(y) + ') scale(' + n(s) + ')">' +
          '<path d="M0,0L-1.5,-5" fill="none" style="stroke:var(--c-culm-mid,#74AC55)"' +
            ' stroke-width="1" stroke-linecap="round"/>' +
          leaf(0, -0.5, -62, 15, 4, LEAF_M, LEAF_D) +
          leaf(-1.5, -5, -96, 16.5, 4.2, LEAF_L, LEAF_M) +
          leaf(0, -1, -126, 14, 3.8, LEAF_M, LEAF_D) +
        '</g>'
      );
    }

    // ---- the culm --------------------------------------------------
    // Internodes are individual segments that narrow as they rise, so
    // the stalk actually tapers and carries a lit/shaded side rather
    // than reading as one flat bar. `ys` lists node heights from the
    // ground up; the last entry is the top of the stalk, which gets a
    // rounded cap.
    function culm(cx, baseY, ys, wB, wT) {
      var span = baseY - ys[ys.length - 1];
      function hw(y) { return wB + (wT - wB) * ((baseY - y) / span); }

      var out = '';

      for (var i = 0; i < ys.length; i++) {
        var y0 = (i === 0) ? baseY : ys[i - 1];
        var y1 = ys[i];
        var w0 = hw(y0);
        var w1 = hw(y1);
        var capped = (i === ys.length - 1);
        var lift = capped ? 1.4 : 0;
        var top = capped
          ? 'L' + n(cx - w1) + ',' + n(y1 + 1.6) + 'Q' + n(cx - w1) + ',' + n(y1 - 0.5) + ' ' + n(cx) + ',' + n(y1 - 0.7) +
            'Q' + n(cx + w1) + ',' + n(y1 - 0.5) + ' ' + n(cx + w1) + ',' + n(y1 + 1.6)
          : 'L' + n(cx - w1) + ',' + n(y1) + 'L' + n(cx + w1) + ',' + n(y1);

        out +=
          '<path d="M' + n(cx - w0) + ',' + n(y0) + top + 'L' + n(cx + w0) + ',' + n(y0) + 'Z"' +
            ' style="fill:var(--c-culm,#93C86E)"/>' +
          '<path d="M' + n(cx - w0) + ',' + n(y0) + 'L' + n(cx - w1) + ',' + n(y1 + lift) +
            'L' + n(cx - w1 * 0.42) + ',' + n(y1 + lift) + 'L' + n(cx - w0 * 0.46) + ',' + n(y0) + 'Z"' +
            ' style="fill:var(--c-culm-light,#B7DC92)"/>' +
          '<path d="M' + n(cx + w0 * 0.5) + ',' + n(y0) + 'L' + n(cx + w1 * 0.48) + ',' + n(y1 + lift) +
            'L' + n(cx + w1) + ',' + n(y1 + lift) + 'L' + n(cx + w0) + ',' + n(y0) + 'Z"' +
            ' style="fill:var(--c-culm-mid,#74AC55)"/>';
      }

      for (var j = 0; j < ys.length - 1; j++) {
        var ny = ys[j];
        var w  = hw(ny);
        out +=
          // each internode darkens slightly toward its base, the way
          // the reference art shades its segments
          '<path d="M' + n(cx - w) + ',' + n(ny) + 'L' + n(cx + w) + ',' + n(ny) +
            'L' + n(cx + w) + ',' + n(ny - 4.5) + 'Q' + n(cx) + ',' + n(ny - 2.6) + ' ' + n(cx - w) + ',' + n(ny - 4.5) + 'Z"' +
            ' style="fill:var(--c-culm-mid,#74AC55)" opacity="0.35"/>' +
          '<path d="M' + n(cx - w - 0.9) + ',' + n(ny + 2.3) +
            'Q' + n(cx) + ',' + n(ny + 3.1) + ' ' + n(cx + w + 0.9) + ',' + n(ny + 2.3) +
            'L' + n(cx + w + 0.5) + ',' + n(ny - 0.7) +
            'Q' + n(cx) + ',' + n(ny - 1.4) + ' ' + n(cx - w - 0.5) + ',' + n(ny - 0.7) + 'Z"' +
            ' style="fill:var(--c-node,#B79A6A)"/>' +
          '<path d="M' + n(cx - w - 0.85) + ',' + n(ny + 2.3) +
            'Q' + n(cx) + ',' + n(ny + 3.1) + ' ' + n(cx + w + 0.85) + ',' + n(ny + 2.3) + '" fill="none"' +
            ' style="stroke:var(--c-node-dark,#94764A)" stroke-width="0.85" stroke-linecap="round"/>';
      }

      return out;
    }

    function ground(rx, ry, alpha) {
      return '<ellipse cx="40" cy="121.5" rx="' + rx + '" ry="' + ry + '"' +
             ' style="fill:var(--c-shadow,rgba(0,0,0,' + alpha + '))"/>';
    }

    return [
      // Stage 0: a sprouting shoot — overlapping pointed sheaths still
      // wrapped shut, first tan node ring showing at the soil line.
      ground(9, 2.4, 0.1) +
      '<path d="M35.2,121C34.4,113 35.7,105.8 40,99.6C44.3,105.8 45.6,113 44.8,121Z"' +
        ' style="fill:var(--c-culm,#93C86E)"/>' +
      '<path d="M35.2,121C34.4,113 35.7,105.8 40,99.6L40,121Z"' +
        ' style="fill:var(--c-culm-light,#B7DC92)"/>' +
      '<path d="M36,121C32.8,116.2 31.9,110.6 33.5,106C36.2,110 37.5,115.7 37.8,121Z"' +
        ' style="fill:var(--c-culm-mid,#74AC55)"/>' +
      '<path d="M44,121C46.9,116.6 47.7,111.8 46.4,107.8C43.9,111.4 42.6,116.2 42.3,121Z"' +
        ' style="fill:var(--c-culm-mid,#74AC55)"/>' +
      '<path d="M40,104.2C41.6,108 42.2,113.4 41.8,121L38.2,121C37.8,113.4 38.4,108 40,104.2Z"' +
        ' style="fill:var(--c-leaf,#96CC72)" opacity="0.55"/>' +
      '<path d="M34.8,117.6Q40,116.5 45.2,117.6L44.9,114.6Q40,113.6 35.1,114.6Z"' +
        ' style="fill:var(--c-node,#B79A6A)"/>' +
      '<path d="M34.8,117.6Q40,116.5 45.2,117.6" fill="none"' +
        ' style="stroke:var(--c-node-dark,#94764A)" stroke-width="0.85" stroke-linecap="round"/>',

      // Stage 1: first real culm — three internodes, a twig each side
      // and a small crown tuft.
      ground(11, 2.9, 0.11) +
      culm(40, 121, [109, 98, 88], 4.4, 3.6) +
      spray(43.9, 106.5,  1, 0.6,  false) +
      spray(36.1,  96,   -1, 0.72, true) +
      crown(40, 88, 0.7),

      // Stage 2: taller single culm, five internodes, alternating twigs.
      ground(14, 3.4, 0.13) +
      culm(40, 121, [110, 98, 86, 74, 62], 5, 3.8) +
      spray(44.5, 107,  1, 0.62, false) +
      spray(35.5,  95, -1, 0.76, true) +
      spray(44.2,  83,  1, 0.86, false) +
      spray(35.8,  71, -1, 0.8,  true) +
      crown(40, 62, 0.88),

      // Stage 3: mature culm — seven internodes, bare at the base like
      // the reference, full alternating canopy up top.
      ground(17, 4, 0.15) +
      culm(40, 121, [110, 98, 86, 74, 62, 50, 38], 5.6, 4) +
      spray(45.1,  95,  1, 0.68, false) +
      spray(34.9,  83, -1, 0.8,  true) +
      spray(44.8,  71,  1, 0.92, false) +
      spray(35.2,  59, -1, 0.98, true) +
      spray(44.5,  47,  1, 0.9,  false) +
      spray(35.5,  40, -1, 0.72, true) +
      crown(40, 38, 1)
    ];
  }()),

  // ---- CLOVER (Finance) — pointed-heart leaflets, no circle "blobbiness" ----
  // Each leaflet is a single closed heart path (tip toward the hub, notch at
  // the outer tip) instead of overlapping circles, so the clover actually
  // comes to a point at each lobe. Two half-heart fills (split down the
  // center) give the two-tone shading; a duplicated, slightly offset dark
  // copy underneath adds a soft cast shadow instead of a flat outline.
  // Palette: #0F291E (deep shade) · #274F3C / #3E6B54 / #5C8267 (mid greens)
  // #8A9A86 (soft highlight) · #E5A93C (ochre accent) · #F5F0EB (cream vein line)
  finance: [
    // Stage 0: seed — two-tone capsule, no vein/accent clutter
    '<ellipse cx="40" cy="121" rx="8" ry="2.5" style="fill:var(--c-shadow,rgba(0,0,0,0.11))"/>' +
    '<ellipse cx="40" cy="115" rx="4.6" ry="6.2" style="fill:var(--c-outline,#0F291E)"/>' +
    '<ellipse cx="38.6" cy="113.6" rx="2.5" ry="4.3" style="fill:var(--c-leaf-mid,#3E6B54)" opacity="0.88"/>',

    // Stage 1: single sprouting heart-leaflet, tilted off-axis — one plant,
    // one stem, one leaflet.
    '<ellipse cx="39" cy="122" rx="12" ry="3.2" style="fill:var(--c-shadow,rgba(0,0,0,0.12))"/>' +
    '<path d="M40,122 C39.3,112 39.7,101 41.4,94" style="stroke:var(--c-outline,#0F291E)" stroke-width="1.6" fill="none" stroke-linecap="round"/>' +
    '<g transform="translate(41.4,94) rotate(-10) scale(0.72)">' +
      '<path d="M0.8,0.8 C-9.4,-7.7 -16.2,-14.5 -16.2,-21.3 C-16.2,-28.1 -9.4,-33.2 0.8,-26.4 C11,-33.2 17.8,-28.1 17.8,-21.3 C17.8,-14.5 11,-7.7 0.8,0.8 Z" style="fill:var(--c-outline,#0F291E)" opacity="0.4"/>' +
      '<path d="M0,0 C-10.2,-8.5 -17,-15.3 -17,-22.1 C-17,-28.9 -10.2,-34 0,-27.2 L0,0 Z" style="fill:var(--c-leaf-dark,#274F3C)"/>' +
      '<path d="M0,0 C10.2,-8.5 17,-15.3 17,-22.1 C17,-28.9 10.2,-34 0,-27.2 L0,0 Z" style="fill:var(--c-leaf,#5C8267)"/>' +
      '<ellipse cx="5.5" cy="-16" rx="5.6" ry="9" style="fill:var(--c-sheen,#8A9A86)" opacity="0.3"/>' +
    '</g>',

    // Stage 2: three-leaflet clover — a SINGLE stem rising to one hub point,
    // with all three leaflets fanning out from that same hub, so it still
    // reads as one plant (not three separate sprouts growing side by side).
    '<ellipse cx="40" cy="122" rx="20" ry="4.6" style="fill:var(--c-shadow,rgba(0,0,0,0.14))"/>' +
    '<path d="M40,122 C39.6,110 39.8,98 40,88" style="stroke:var(--c-outline,#0F291E)" stroke-width="1.9" fill="none" stroke-linecap="round"/>' +
    '<g transform="translate(40,88) rotate(-16) scale(0.74)">' +
      '<path d="M0.8,0.8 C-9.4,-7.7 -16.2,-14.5 -16.2,-21.3 C-16.2,-28.1 -9.4,-33.2 0.8,-26.4 C11,-33.2 17.8,-28.1 17.8,-21.3 C17.8,-14.5 11,-7.7 0.8,0.8 Z" style="fill:var(--c-outline,#0F291E)" opacity="0.4"/>' +
      '<path d="M0,0 C-10.2,-8.5 -17,-15.3 -17,-22.1 C-17,-28.9 -10.2,-34 0,-27.2 L0,0 Z" style="fill:var(--c-leaf-dark,#274F3C)"/>' +
      '<path d="M0,0 C10.2,-8.5 17,-15.3 17,-22.1 C17,-28.9 10.2,-34 0,-27.2 L0,0 Z" style="fill:var(--c-leaf,#5C8267)"/>' +
      '<ellipse cx="5.5" cy="-16" rx="5.6" ry="9" style="fill:var(--c-sheen,#8A9A86)" opacity="0.3"/>' +
    '</g>' +
    '<g transform="translate(40,88) rotate(6) scale(0.9)">' +
      '<path d="M0.8,0.8 C-9.4,-7.7 -16.2,-14.5 -16.2,-21.3 C-16.2,-28.1 -9.4,-33.2 0.8,-26.4 C11,-33.2 17.8,-28.1 17.8,-21.3 C17.8,-14.5 11,-7.7 0.8,0.8 Z" style="fill:var(--c-outline,#0F291E)" opacity="0.42"/>' +
      '<path d="M0,0 C-10.2,-8.5 -17,-15.3 -17,-22.1 C-17,-28.9 -10.2,-34 0,-27.2 L0,0 Z" style="fill:var(--c-leaf-mid,#3E6B54)"/>' +
      '<path d="M0,0 C10.2,-8.5 17,-15.3 17,-22.1 C17,-28.9 10.2,-34 0,-27.2 L0,0 Z" style="fill:var(--c-leaf-dark,#274F3C)"/>' +
      '<ellipse cx="-5.5" cy="-16" rx="5.8" ry="9.2" style="fill:var(--c-sheen,#8A9A86)" opacity="0.28"/>' +
    '</g>' +
    '<g transform="translate(40,88) rotate(20) scale(0.68)">' +
      '<path d="M0.8,0.8 C-9.4,-7.7 -16.2,-14.5 -16.2,-21.3 C-16.2,-28.1 -9.4,-33.2 0.8,-26.4 C11,-33.2 17.8,-28.1 17.8,-21.3 C17.8,-14.5 11,-7.7 0.8,0.8 Z" style="fill:var(--c-outline,#0F291E)" opacity="0.4"/>' +
      '<path d="M0,0 C-10.2,-8.5 -17,-15.3 -17,-22.1 C-17,-28.9 -10.2,-34 0,-27.2 L0,0 Z" style="fill:var(--c-leaf-dark,#274F3C)"/>' +
      '<path d="M0,0 C10.2,-8.5 17,-15.3 17,-22.1 C17,-28.9 10.2,-34 0,-27.2 L0,0 Z" style="fill:var(--c-leaf,#5C8267)"/>' +
      '<ellipse cx="5.5" cy="-16" rx="5.6" ry="9" style="fill:var(--c-sheen,#8A9A86)" opacity="0.3"/>' +
    '</g>' +
    '<circle cx="25" cy="70" r="0.8" style="fill:var(--c-bloom,#F5F0EB)" opacity="0.08"/>' +
    '<circle cx="55" cy="66" r="0.9" style="fill:var(--c-bloom,#F5F0EB)" opacity="0.08"/>',

    // Stage 3: full lucky four-leaf clover — one stem to one hub, four
    // pointed hearts fanning around it at off-angle rotations and scales
    // so no two lobes are identical. Still a single plant.
    '<ellipse cx="40" cy="122" rx="27" ry="6" style="fill:var(--c-shadow,rgba(0,0,0,0.17))"/>' +
    '<path d="M40,122 C39.2,105 39.6,86 40,68" style="stroke:var(--c-outline,#0F291E)" stroke-width="2.2" fill="none" stroke-linecap="round"/>' +
    '<g transform="translate(40,66) rotate(-6) scale(1.14)">' +
      '<path d="M0.9,0.9 C-9.5,-7.8 -16.4,-14.7 -16.4,-21.5 C-16.4,-28.3 -9.5,-33.4 0.9,-26.6 C11.3,-33.4 18.2,-28.3 18.2,-21.5 C18.2,-14.7 11.3,-7.8 0.9,0.9 Z" style="fill:var(--c-outline,#0F291E)" opacity="0.45"/>' +
      '<path d="M0,0 C-10.2,-8.5 -17,-15.3 -17,-22.1 C-17,-28.9 -10.2,-34 0,-27.2 L0,0 Z" style="fill:var(--c-leaf-dark,#274F3C)"/>' +
      '<path d="M0,0 C10.2,-8.5 17,-15.3 17,-22.1 C17,-28.9 10.2,-34 0,-27.2 L0,0 Z" style="fill:var(--c-leaf,#5C8267)"/>' +
      '<ellipse cx="5.8" cy="-16.5" rx="6.4" ry="10" style="fill:var(--c-sheen,#8A9A86)" opacity="0.34"/>' +
    '</g>' +
    '<g transform="translate(40,66) rotate(89) scale(0.96)">' +
      '<path d="M0.9,0.9 C-9.5,-7.8 -16.4,-14.7 -16.4,-21.5 C-16.4,-28.3 -9.5,-33.4 0.9,-26.6 C11.3,-33.4 18.2,-28.3 18.2,-21.5 C18.2,-14.7 11.3,-7.8 0.9,0.9 Z" style="fill:var(--c-outline,#0F291E)" opacity="0.45"/>' +
      '<path d="M0,0 C-10.2,-8.5 -17,-15.3 -17,-22.1 C-17,-28.9 -10.2,-34 0,-27.2 L0,0 Z" style="fill:var(--c-leaf-mid,#3E6B54)"/>' +
      '<path d="M0,0 C10.2,-8.5 17,-15.3 17,-22.1 C17,-28.9 10.2,-34 0,-27.2 L0,0 Z" style="fill:var(--c-leaf-dark,#274F3C)"/>' +
      '<ellipse cx="-5.6" cy="-16.5" rx="6.2" ry="9.7" style="fill:var(--c-sheen,#8A9A86)" opacity="0.3"/>' +
    '</g>' +
    '<g transform="translate(40,66) rotate(182) scale(1.04)">' +
      '<path d="M0.9,0.9 C-9.5,-7.8 -16.4,-14.7 -16.4,-21.5 C-16.4,-28.3 -9.5,-33.4 0.9,-26.6 C11.3,-33.4 18.2,-28.3 18.2,-21.5 C18.2,-14.7 11.3,-7.8 0.9,0.9 Z" style="fill:var(--c-outline,#0F291E)" opacity="0.45"/>' +
      '<path d="M0,0 C-10.2,-8.5 -17,-15.3 -17,-22.1 C-17,-28.9 -10.2,-34 0,-27.2 L0,0 Z" style="fill:var(--c-leaf-dark,#274F3C)"/>' +
      '<path d="M0,0 C10.2,-8.5 17,-15.3 17,-22.1 C17,-28.9 10.2,-34 0,-27.2 L0,0 Z" style="fill:var(--c-leaf,#5C8267)"/>' +
      '<ellipse cx="5.6" cy="-16.5" rx="6.3" ry="9.7" style="fill:var(--c-sheen,#8A9A86)" opacity="0.32"/>' +
    '</g>' +
    '<g transform="translate(40,66) rotate(273) scale(1.09)">' +
      '<path d="M0.9,0.9 C-9.5,-7.8 -16.4,-14.7 -16.4,-21.5 C-16.4,-28.3 -9.5,-33.4 0.9,-26.6 C11.3,-33.4 18.2,-28.3 18.2,-21.5 C18.2,-14.7 11.3,-7.8 0.9,0.9 Z" style="fill:var(--c-outline,#0F291E)" opacity="0.45"/>' +
      '<path d="M0,0 C-10.2,-8.5 -17,-15.3 -17,-22.1 C-17,-28.9 -10.2,-34 0,-27.2 L0,0 Z" style="fill:var(--c-leaf-mid,#3E6B54)"/>' +
      '<path d="M0,0 C10.2,-8.5 17,-15.3 17,-22.1 C17,-28.9 10.2,-34 0,-27.2 L0,0 Z" style="fill:var(--c-leaf-dark,#274F3C)"/>' +
      '<ellipse cx="-5.9" cy="-16.5" rx="6.6" ry="10.2" style="fill:var(--c-sheen,#8A9A86)" opacity="0.35"/>' +
    '</g>' +
    '<circle cx="22" cy="80" r="0.8" style="fill:var(--c-bloom,#F5F0EB)" opacity="0.07"/>' +
    '<circle cx="58" cy="78" r="0.9" style="fill:var(--c-bloom,#F5F0EB)" opacity="0.07"/>' +
    '<circle cx="40" cy="45" r="0.8" style="fill:var(--c-bloom,#F5F0EB)" opacity="0.08"/>'
  ],

  // ---- MUSHROOM (Misc) ----
  // Modelled on the flat-illustration reference: a broad, slightly
  // off-centre cap over a swollen tapering stalk, with soft apricot
  // gill tabs tucked under the rim. No outlines anywhere — the cap's
  // shading is cut along its own silhouette (the outline curves are
  // split with de Casteljau) so the dark side can never spill past
  // the edge, and the speckles are hand-wobbled paths rather than
  // circles. Palette is one step softer than the reference: coral
  // instead of pillarbox red, cream instead of white.
  misc: (function () {

    var CAP_L  = 'var(--c-cap-light,#F0967F)';
    var CAP_M  = 'var(--c-cap,#E4715E)';
    var CAP_D  = 'var(--c-cap-dark,#C4574A)';
    var SPOT   = 'var(--c-spot,#F7E9DE)';
    var STEM_L = 'var(--c-stem-light,#F2DECE)';
    var STEM_M = 'var(--c-stem,#E0C0AB)';
    var STEM_D = 'var(--c-stem-dark,#C39C86)';

    function n(v) { return Math.round(v * 100) / 100; }

    // ---- cubic helpers ---------------------------------------------
    function lerpPt(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]; }

    // de Casteljau split: returns { a: [4 pts before t], b: [4 pts after t] }
    function splitCubic(p, t) {
      var q0 = lerpPt(p[0], p[1], t), q1 = lerpPt(p[1], p[2], t), q2 = lerpPt(p[2], p[3], t);
      var r0 = lerpPt(q0, q1, t), r1 = lerpPt(q1, q2, t);
      var s  = lerpPt(r0, r1, t);
      return { a: [p[0], q0, r0, s], b: [s, r1, q2, p[3]] };
    }

    function C(c) { // "C x1,y1 x2,y2 x3,y3" from a 4-point cubic
      return 'C' + n(c[1][0]) + ',' + n(c[1][1]) + ' ' + n(c[2][0]) + ',' + n(c[2][1]) +
             ' ' + n(c[3][0]) + ',' + n(c[3][1]);
    }
    function M(p) { return 'M' + n(p[0]) + ',' + n(p[1]); }
    function L(p) { return 'L' + n(p[0]) + ',' + n(p[1]); }

    // ---- an off-round cream speckle --------------------------------
    // Deliberately not a circle: each quadrant gets its own radius so
    // the spot reads as hand-painted rather than stamped.
    function spot(cx, cy, r, wob) {
      var k = 0.5523 * r;
      var a = 1 + (wob || 0) * 0.12, b = 1 - (wob || 0) * 0.09;
      return '<path d="M' + n(cx - r * a) + ',' + n(cy + r * 0.06) +
        'C' + n(cx - r * a) + ',' + n(cy + r * 0.06 - k * 1.02) + ' ' + n(cx - k * 0.9) + ',' + n(cy - r * b) + ' ' + n(cx + r * 0.05) + ',' + n(cy - r * b) +
        'C' + n(cx + k * 0.96) + ',' + n(cy - r * b) + ' ' + n(cx + r) + ',' + n(cy - k * 0.86) + ' ' + n(cx + r) + ',' + n(cy + r * 0.04) +
        'C' + n(cx + r) + ',' + n(cy + k * 1.0) + ' ' + n(cx + k * 0.88) + ',' + n(cy + r * 1.02) + ' ' + n(cx - r * 0.04) + ',' + n(cy + r * 1.02) +
        'C' + n(cx - k * 1.02) + ',' + n(cy + r * 1.02) + ' ' + n(cx - r * a) + ',' + n(cy + k * 0.94) + ' ' + n(cx - r * a) + ',' + n(cy + r * 0.06) + 'Z"' +
        ' style="fill:' + SPOT + '"/>';
    }

    // ---- the cap ----------------------------------------------------
    // Built from two mirrored cubics meeting at the apex with a gently
    // sagging underside. The shading is cut along the real outline
    // (split with de Casteljau) so the dark side can never bleed past
    // the silhouette — no stroke needed anywhere.
    function cap(cx, rimY, hw, h) {
      var Lp = [cx - hw, rimY];
      var Rp = [cx + hw, rimY];
      var ax = cx - hw * 0.06;              // apex sits a little left of centre
      var Ap = [ax, rimY - h];

      var left  = [Lp, [cx - hw + hw * 0.031, rimY - h * 0.55], [ax - hw * 0.52, rimY - h], Ap];
      var right = [Ap, [ax + hw * 0.60, rimY - h], [cx + hw * 0.97, rimY - h * 0.58], Rp];
      var bottomQ = 'Q' + n(cx) + ',' + n(rimY + hw * 0.203) + ' ' + n(cx - hw) + ',' + n(rimY);

      var body =
        '<path d="' + M(Lp) + C(left) + C(right) + bottomQ + 'Z" style="fill:' + CAP_M + '"/>';

      // shaded lower-left, cut on a diagonal across the cap face
      var lHalf = splitCubic(left, 0.5).a;
      var rTail = splitCubic(right, 0.85).b;
      var shade =
        '<path d="' + M(Lp) + C(lHalf) + L(rTail[0]) + C(rTail) + bottomQ + 'Z"' +
        ' style="fill:' + CAP_D + '"/>';

      // lit sliver riding the top-right rim
      var rHead = splitCubic(right, 0.5).a;
      var Hp = rHead[3];
      var lit =
        '<path d="' + M(Ap) + C(rHead) +
        'C' + n(Hp[0] - hw * 0.30) + ',' + n(Hp[1] - h * 0.10) + ' ' +
              n(Ap[0] + hw * 0.18) + ',' + n(Ap[1] + h * 0.16) + ' ' + n(Ap[0]) + ',' + n(Ap[1]) + 'Z"' +
        ' style="fill:' + CAP_L + '"/>';

      return body + shade + lit;
    }

    // ---- the stalk --------------------------------------------------
    // One closed silhouette that swells toward the soil, then a lit
    // right face and a shaded left crescent laid inside it.
    function stalk(cx, topY, groundY, tw, bw) {
      var H  = groundY - topY;
      var y1 = topY + H * 0.295, y2 = topY + H * 0.526,
          y3 = topY + H * 0.737, y4 = topY + H * 0.916;

      var outline =
        'M' + n(cx - tw) + ',' + n(topY) +
        'C' + n(cx - tw - bw * 0.08) + ',' + n(y1) + ' ' + n(cx - bw * 0.92) + ',' + n(y2) + ' ' + n(cx - bw) + ',' + n(y3) +
        'C' + n(cx - bw * 1.08) + ',' + n(y4) + ' ' + n(cx - bw * 0.65) + ',' + n(groundY) + ' ' + n(cx) + ',' + n(groundY) +
        'C' + n(cx + bw * 0.65) + ',' + n(groundY) + ' ' + n(cx + bw * 1.08) + ',' + n(y4) + ' ' + n(cx + bw) + ',' + n(y3) +
        'C' + n(cx + bw * 0.92) + ',' + n(y2) + ' ' + n(cx + tw + bw * 0.08) + ',' + n(y1) + ' ' + n(cx + tw) + ',' + n(topY) + 'Z';

      var litFace =
        'M' + n(cx) + ',' + n(topY) + 'L' + n(cx + tw) + ',' + n(topY) +
        'C' + n(cx + tw + bw * 0.08) + ',' + n(y1) + ' ' + n(cx + bw * 0.92) + ',' + n(y2) + ' ' + n(cx + bw) + ',' + n(y3) +
        'C' + n(cx + bw * 1.08) + ',' + n(y4) + ' ' + n(cx + bw * 0.65) + ',' + n(groundY) + ' ' + n(cx) + ',' + n(groundY) + 'Z';

      var shadeFace =
        'M' + n(cx - tw) + ',' + n(topY) +
        'C' + n(cx - tw - bw * 0.08) + ',' + n(y1) + ' ' + n(cx - bw * 0.92) + ',' + n(y2) + ' ' + n(cx - bw) + ',' + n(y3) +
        'C' + n(cx - bw * 1.08) + ',' + n(y4) + ' ' + n(cx - bw * 0.65) + ',' + n(groundY) + ' ' + n(cx) + ',' + n(groundY) +
        'C' + n(cx - bw * 0.42) + ',' + n(groundY - H * 0.02) + ' ' + n(cx - bw * 0.62) + ',' + n(y3) + ' ' + n(cx - tw * 0.45) + ',' + n(topY) + 'Z';

      return '<path d="' + outline + '" style="fill:' + STEM_M + '"/>' +
             '<path d="' + litFace + '" style="fill:' + STEM_L + '"/>' +
             '<path d="' + shadeFace + '" style="fill:' + STEM_D + '"/>';
    }

    function ground(rx, ry, alpha) {
      return '<ellipse cx="40" cy="121.5" rx="' + rx + '" ry="' + ry + '"' +
             ' style="fill:var(--c-shadow,rgba(0,0,0,' + alpha + '))"/>';
    }

    // spots placed in cap space: u across (-1..1 of half-width),
    // v up from the rim (0..1 of cap height), r as a share of half-width
    function speckles(cx, rimY, hw, h, list) {
      var out = '';
      for (var i = 0; i < list.length; i++) {
        var s = list[i];
        out += spot(cx + s[0] * hw, rimY - s[1] * h, s[2] * hw, s[3] || 0);
      }
      return out;
    }

    function shroom(cfg) {
      return ground(cfg.gr[0], cfg.gr[1], cfg.gr[2]) +
             stalk(40, cfg.rimY - cfg.h * 0.12, 121.5, cfg.tw, cfg.bw) +
             cap(40, cfg.rimY, cfg.hw, cfg.h) +
             speckles(40, cfg.rimY, cfg.hw, cfg.h, cfg.spots) +
             (cfg.stemSpot ? spot(cfg.stemSpot[0], cfg.stemSpot[1], cfg.stemSpot[2], 1) : '');
    }

    return [
      shroom({
        gr: [9, 2.4, 0.10], rimY: 118, hw: 9.4, h: 9.6, tw: 3.4, bw: 4.6,
        spots: [[-0.2, 0.5, 0.26, 1], [0.42, 0.24, 0.17, 0]],
      }),
      shroom({
        gr: [12, 3.0, 0.12], rimY: 106, hw: 15.5, h: 15.4, tw: 4, bw: 6.6,
        spots: [[-0.24, 0.46, 0.26, 1], [0.46, 0.62, 0.16, 0], [0.62, 0.2, 0.13, 1]],
      }),
      shroom({
        gr: [15, 3.6, 0.14], rimY: 92, hw: 23.5, h: 22.8, tw: 5, bw: 9.6,
        spots: [[-0.24, 0.47, 0.27, 1], [0.48, 0.6, 0.17, 0], [0.14, 0.84, 0.1, 1], [-0.76, 0.21, 0.13, 0]],
      }),
      shroom({
        gr: [19, 4.4, 0.16], rimY: 78, hw: 32, h: 30, tw: 6, bw: 13,
        spots: [[-0.22, 0.48, 0.28, 1], [0.5, 0.62, 0.17, 0], [0.13, 0.85, 0.1, 1],
                [-0.78, 0.22, 0.14, 0], [0.8, 0.2, 0.11, 1]],
        stemSpot: [45.5, 107, 3.4],
      }),
    ];
  }()),
};


// ============================================
// Plant skins
// ============================================
// A skin never redraws a plant. The art in PLANT_SVG_DATA above is
// authored once per species with every colour exposed as a CSS
// custom property (--c-leaf, --c-petal, --c-bark, …), each falling
// back to that plant's original colour. So a skin is only data:
//
//   vars    Token → colour. Whatever a skin leaves out keeps the
//           original colour, so a three-line skin is perfectly valid
//           and a broken/partial skin can never render an invisible
//           plant.
//   defs    Optional <linearGradient>/<radialGradient>/<pattern>
//           markup. A CSS variable is allowed to hold 'url(#id)',
//           which is how a skin swaps a flat fill for a gradient or
//           a texture without touching a single path. Give every id
//           a 'sk-<skinid>-' prefix so two skins can never collide.
//   extras  Optional small elements layered on top of the base art,
//           keyed by stage index, in the same "0 0 80 130" space.
//           Either a markup string or a function that receives that
//           stage's anchors (see PLANT_ANCHORS) so the same extra
//           can be written once and dropped on any species.
//   swatch  Three colours for the picker's little colour pip.
//
// Adding a new look means adding one object to the list for that
// species. No new art, no changes to any rendering code.
//
// ORDER MATTERS. Every species' list runs in the same five slots,
// and the Greenhouse picker paints them in exactly this array order:
//
//   0  classic   the plant as first grown — always the default, and
//                always index 0, since getSkin() falls back to
//                list[0] for an unknown or removed skin id
//   1  gold      the gilded/struck-metal look
//   2  rainbow   the full-spectrum look
//   3  themed    that species' own extra look
//   4  showcase  the most elaborate look — the one worth chasing
//
// The slot is also the achievement: SKIN_UNLOCK_RULES down below gates
// each one by index, so a species gets the whole ladder purely by
// having its five skins in this order. Keep new looks in their slot
// rather than appending to the end.
//
// Token reference, per species:
//   education    seed seed-dark stem stem-dark leaf leaf-dark bark
//                bark-dark canopy canopy-dark
//   exercise     seed seed-line stem leaf-light leaf leaf-dark petal
//                petal-dark disc disc-dark disc-seed
//   mindfulness  petal-outer(-light) petal-mid(-light)
//                petal-inner(-light) center center-dark leaf-light
//                leaf leaf-dark pad pad-dark
//   sleep        bud bud-pale bud-shade calyx stem stem-light
//   chores       culm-light culm culm-mid node node-dark leaf-light
//                leaf leaf-dark
//   finance      leaf leaf-mid leaf-dark outline sheen bloom
//   misc         cap-light cap cap-dark spot gill stem-light
//                stem stem-dark
// Every species also has --c-shadow for the ground shadow.
// ============================================

var SKIN_DEFAULT_ID = 'classic';

// Landmarks on each plant, per stage, in the art's own coordinate
// space: `canopy` is the middle of the leafy/flowering mass, `top`
// is roughly its highest point, `base` is where it meets the ground.
// Skin extras position themselves from these instead of hard-coding
// coordinates, so one extra works across every species and stage.
var PLANT_ANCHORS = {
  education: [
    { canopy: [40, 112], top: [40,  96], base: [40, 121] },
    { canopy: [40,  98], top: [40,  88], base: [40, 121] },
    { canopy: [40,  48], top: [40,  38], base: [40, 121] },
    { canopy: [40,  36], top: [40,  15], base: [40, 121] },
  ],
  exercise: [
    { canopy: [40, 113], top: [40, 106], base: [40, 121] },
    { canopy: [40,  93], top: [40,  87], base: [40, 121] },
    { canopy: [40,  76], top: [40,  54], base: [40, 121] },
    { canopy: [40,  58], top: [40,  27], base: [40, 121] },
  ],
  mindfulness: [
    { canopy: [40, 114], top: [40, 108], base: [40, 120] },
    { canopy: [40, 104], top: [40,  96], base: [40, 120] },
    { canopy: [40,  84], top: [40,  70], base: [40, 120] },
    { canopy: [40,  64], top: [40,  40], base: [40, 120] },
  ],
  sleep: [
    { canopy: [40, 107], top: [40, 100], base: [40, 121] },
    { canopy: [40,  92], top: [40,  82], base: [40, 121] },
    { canopy: [40,  76], top: [40,  63], base: [40, 121] },
    { canopy: [40,  50], top: [40,  25], base: [40, 121] },
  ],
  chores: [
    { canopy: [40, 110], top: [40, 100], base: [40, 121] },
    { canopy: [40,  96], top: [40,  76], base: [40, 121] },
    { canopy: [40,  80], top: [40,  48], base: [40, 121] },
    { canopy: [40,  62], top: [40,  22], base: [40, 121] },
  ],
  finance: [
    { canopy: [40, 113], top: [40, 108], base: [40, 121] },
    { canopy: [40,  94], top: [40,  72], base: [40, 121] },
    { canopy: [40,  88], top: [40,  62], base: [40, 121] },
    { canopy: [40,  66], top: [40,  30], base: [40, 121] },
  ],
  misc: [
    { canopy: [40, 113], top: [40, 108], base: [40, 121] },
    { canopy: [40,  98], top: [40,  91], base: [40, 121] },
    { canopy: [40,  81], top: [40,  69], base: [40, 121] },
    { canopy: [40,  63], top: [40,  48], base: [40, 121] },
  ],
};

function getPlantAnchors(catId, stageIndex) {
  var set = PLANT_ANCHORS[catId] || PLANT_ANCHORS.misc;
  return set[Math.max(0, Math.min(stageIndex, set.length - 1))];
}


// ---- Reusable bits for writing extras ----------------------------

function skinDot(x, y, r, colour, opacity) {
  return '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="' + r +
         '" fill="' + colour + '" opacity="' + (opacity === undefined ? 1 : opacity) + '"/>';
}

// Four-point star — reads as a glint at any size.
function skinSparkle(x, y, r, colour, opacity) {
  var i = r * 0.28;
  return '<path d="M' + x + ',' + (y - r) +
         ' C' + x + ',' + (y - i) + ' ' + (x + i) + ',' + y + ' ' + (x + r) + ',' + y +
         ' C' + (x + i) + ',' + y + ' ' + x + ',' + (y + i) + ' ' + x + ',' + (y + r) +
         ' C' + x + ',' + (y + i) + ' ' + (x - i) + ',' + y + ' ' + (x - r) + ',' + y +
         ' C' + (x - i) + ',' + y + ' ' + x + ',' + (y - i) + ' ' + x + ',' + (y - r) + ' Z"' +
         ' fill="' + colour + '" opacity="' + (opacity === undefined ? 1 : opacity) + '"/>';
}

// A single drifting leaf, used by the autumn skin.
function skinLeafMote(x, y, rot, s, colour, opacity) {
  return '<g transform="translate(' + x + ',' + y + ') rotate(' + rot + ') scale(' + s + ')">' +
         '<path d="M0,0 C3.4,-1.6 5.6,-4.4 5.6,-7 C5.6,-9.6 3.4,-10.4 0,-8.6' +
         ' C-3.4,-10.4 -5.6,-9.6 -5.6,-7 C-5.6,-4.4 -3.4,-1.6 0,0 Z"' +
         ' fill="' + colour + '" opacity="' + (opacity === undefined ? 1 : opacity) + '"/></g>';
}

// A flat ripple ring on the waterline, used by the lotus skin.
function skinRipple(x, y, rx, colour, opacity, width) {
  return '<ellipse cx="' + x + '" cy="' + y + '" rx="' + rx + '" ry="' + (rx * 0.30).toFixed(1) +
         '" fill="none" stroke="' + colour + '" stroke-width="' + (width || 0.7) +
         '" opacity="' + (opacity === undefined ? 1 : opacity) + '"/>';
}

// A soft jelly sweet sitting on the soil, used by the candy skin.
// Deliberately lopsided — wider on the right, settled on the left —
// so a row of them never reads as a line of stamped domes. (x, y) is
// where it meets the ground; it grows upward from there.
function skinGumdrop(x, y, s, colour, hilite) {
  var g = '<g transform="translate(' + x + ',' + y + ') scale(' + s + ')">' +
    '<path d="M0,0 C-4.7,0 -6.3,-2.0 -5.7,-4.6' +
    ' C-5.2,-7.0 -3.2,-8.5 -0.2,-8.7' +
    ' C3.0,-8.9 5.3,-7.1 5.8,-4.6' +
    ' C6.3,-2.1 4.6,0 0,0 Z" fill="' + colour + '"/>';
  if (hilite) {
    g += '<path d="M-3.2,-5.8 C-2.7,-7.2 -1.4,-8.0 0.2,-7.8' +
         ' C-1.2,-7.1 -2.2,-6.5 -2.7,-5.3 Z" fill="' + hilite + '"/>';
  }
  return g + '</g>';
}

// A tall almond eye with one catchlight, used by the alien skin.
// r is the half-width; the eye stands 1.5x that above and below its
// centre, which is what gives it the narrow off-world look.
function skinAlienEye(x, y, r, colour, glint) {
  var out = '<g transform="translate(' + x + ',' + y + ')">' +
    '<path d="M' + (-r) + ',0' +
    ' C' + (-r) + ',' + (-r * 1.16) + ' ' + (-r * 0.52) + ',' + (-r * 1.5) + ' 0,' + (-r * 1.5) +
    ' C' + (r * 0.52) + ',' + (-r * 1.5) + ' ' + r + ',' + (-r * 1.16) + ' ' + r + ',0' +
    ' C' + r + ',' + (r * 1.16) + ' ' + (r * 0.52) + ',' + (r * 1.5) + ' 0,' + (r * 1.5) +
    ' C' + (-r * 0.52) + ',' + (r * 1.5) + ' ' + (-r) + ',' + (r * 1.16) + ' ' + (-r) + ',0 Z"' +
    ' fill="' + colour + '"/>';
  if (glint) {
    out += '<path d="M' + (-r * 0.16) + ',' + (-r * 0.96) +
      ' C' + (r * 0.36) + ',' + (-r * 0.96) + ' ' + (r * 0.56) + ',' + (-r * 0.44) + ' ' + (r * 0.24) + ',' + (-r * 0.24) +
      ' C' + (-r * 0.10) + ',' + (-r * 0.46) + ' ' + (-r * 0.36) + ',' + (-r * 0.70) + ' ' + (-r * 0.16) + ',' + (-r * 0.96) + ' Z"' +
      ' fill="' + glint + '"/>';
  }
  return out + '</g>';
}

// A tapered feeler with a knob on the end, used by the alien skin.
// Travels only upward from (x, y) so it can start inside a canopy or
// cap and still read as emerging from it. tilt is a lean as a share
// of the length: negative leans left, positive right.
function skinAntenna(x, y, len, tilt, colour, knob) {
  var dx = len * tilt;
  var tipX = x + dx, tipY = y - len;
  var w = len * 0.095;
  return '<path d="M' + (x - w) + ',' + y +
    ' C' + (x - w + dx * 0.28) + ',' + (y - len * 0.46) +
    ' ' + (tipX - len * 0.16) + ',' + (tipY + len * 0.30) + ' ' + tipX + ',' + tipY +
    ' C' + (tipX + len * 0.11) + ',' + (tipY + len * 0.32) +
    ' ' + (x + w + dx * 0.28) + ',' + (y - len * 0.46) + ' ' + (x + w) + ',' + y + ' Z"' +
    ' fill="' + colour + '"/>' +
    skinDot(tipX, tipY, (len * 0.17).toFixed(2), knob, 1);
}

// A pitted rock hanging in a canopy, used by the nebula skin. The
// outline is deliberately lopsided and the craters sit off-centre,
// so a handful of them never reads as a row of stamped pebbles.
// s scales it about (x, y) — a rock at s=1 is roughly 12 across —
// and rot turns it so no two share a silhouette.
function skinAsteroid(x, y, s, colour, shade, rot) {
  return '<g transform="translate(' + x + ',' + y + ') rotate(' + (rot || 0) + ') scale(' + s + ')">' +
    '<path d="M-6,-1.2 C-6.2,-3.6 -4.4,-5.5 -2,-6.1' +
    ' C0.7,-6.8 3.7,-5.9 5.1,-3.8' +
    ' C6.4,-1.8 6.3,1.5 4.7,3.4' +
    ' C3.1,5.3 0.2,6.2 -2.3,5.5' +
    ' C-4.8,4.8 -5.8,2.5 -6,-1.2 Z" fill="' + colour + '"/>' +
    '<path d="M5.1,-3.8 C6.4,-1.8 6.3,1.5 4.7,3.4' +
    ' C3.1,5.3 0.2,6.2 -2.3,5.5' +
    ' C1.3,4.7 3.7,1.3 3.4,-2.6 Z" fill="' + shade + '"/>' +
    '<path d="M-3.4,-2.2 C-2.2,-3.3 -0.5,-3.0 -0.1,-1.7' +
    ' C0.2,-0.5 -0.9,0.5 -2.3,0.2' +
    ' C-3.5,-0.1 -4.2,-1.2 -3.4,-2.2 Z" fill="' + shade + '" opacity="0.8"/>' +
    '<path d="M0.5,2.3 C1.4,1.7 2.6,2.0 2.7,2.9' +
    ' C2.8,3.8 1.7,4.4 0.8,4.0' +
    ' C0.0,3.6 -0.3,2.8 0.5,2.3 Z" fill="' + shade + '" opacity="0.55"/></g>';
}

// A small world hanging where a fruit would, used by the nebula
// skin. The ring is drawn in two halves — the back arc before the
// body, the front arc after — so it genuinely passes behind the
// planet instead of lying flat across it. Pass ring as null for a
// bare moon; r is the body radius.
function skinPlanet(x, y, r, colour, shade, ring) {
  var rx = (r * 1.95).toFixed(2), ry = (r * 0.55).toFixed(2);
  var w = Math.max(0.55, r * 0.2).toFixed(2);
  var q = (r * 0.55).toFixed(2), n = (-r).toFixed(2), p = r.toFixed(2), nq = (-r * 0.55).toFixed(2);
  var out = '<g transform="translate(' + x + ',' + y + ')">';
  if (ring) {
    out += '<g transform="rotate(-20)"><path d="M-' + rx + ',0 A' + rx + ',' + ry +
           ' 0 0,1 ' + rx + ',0" fill="none" stroke="' + ring + '" stroke-width="' + w +
           '" stroke-linecap="round" opacity="0.7"/></g>';
  }
  out += '<path d="M0,' + n + ' C' + q + ',' + n + ' ' + p + ',' + nq + ' ' + p + ',0' +
         ' C' + p + ',' + q + ' ' + q + ',' + p + ' 0,' + p +
         ' C' + nq + ',' + p + ' ' + n + ',' + q + ' ' + n + ',0' +
         ' C' + n + ',' + nq + ' ' + nq + ',' + n + ' 0,' + n + ' Z" fill="' + colour + '"/>' +
         '<path d="M0,' + n + ' C' + q + ',' + n + ' ' + p + ',' + nq + ' ' + p + ',0' +
         ' C' + p + ',' + q + ' ' + q + ',' + p + ' 0,' + p +
         ' C' + (r * 0.32).toFixed(2) + ',' + (r * 0.46).toFixed(2) +
         ' ' + (r * 0.32).toFixed(2) + ',' + (-r * 0.46).toFixed(2) + ' 0,' + n + ' Z"' +
         ' fill="' + shade + '"/>';
  if (ring) {
    out += '<g transform="rotate(-20)"><path d="M-' + rx + ',0 A' + rx + ',' + ry +
           ' 0 0,0 ' + rx + ',0" fill="none" stroke="' + ring + '" stroke-width="' + w +
           '" stroke-linecap="round"/></g>';
  }
  return out + '</g>';
}

// Rounds a computed coordinate to two decimals so generated path
// data stays readable instead of carrying float dust.
function skinN(v) { return Math.round(v * 100) / 100; }

// A framed numeric readout hanging in the air, used by the cyber
// skin. Corner ticks only — a full box would box the plant in and
// read as a border, which the art doesn't use anywhere — with the
// digits centred between them. `size` is the digit height and the
// frame measures itself off the string, so '7' and '100%' both sit
// in a well-proportioned bracket. Keep strings short: the frame is
// roughly (len * size * 0.58 + size * 0.8) wide, so a five-character
// readout at size 4 already spans a quarter of the 80-unit canvas.
function skinReadout(x, y, size, text, colour, opacity) {
  var hw = (text.length * size * 0.58) / 2 + size * 0.4;
  var hh = size * 0.78;
  var t  = size * 0.36;
  var L = skinN(x - hw), R = skinN(x + hw);
  var T = skinN(y - hh), B = skinN(y + hh);
  return '<g opacity="' + (opacity === undefined ? 0.9 : opacity) + '">' +
    '<path d="M' + skinN(L + t) + ',' + T + 'H' + L + 'V' + skinN(T + t) +
    ' M' + L + ',' + skinN(B - t) + 'V' + B + 'H' + skinN(L + t) +
    ' M' + skinN(R - t) + ',' + T + 'H' + R + 'V' + skinN(T + t) +
    ' M' + R + ',' + skinN(B - t) + 'V' + B + 'H' + skinN(R - t) + '"' +
    ' fill="none" stroke="' + colour + '" stroke-width="' + skinN(Math.max(0.32, size * 0.1)) + '"' +
    ' stroke-linecap="round" stroke-linejoin="round"/>' +
    '<text x="' + skinN(x) + '" y="' + skinN(y + size * 0.35) + '" fill="' + colour + '"' +
    ' font-family="ui-monospace,SFMono-Regular,Menlo,Consolas,monospace"' +
    ' font-size="' + size + '" text-anchor="middle">' + text + '</text></g>';
}

// An L-shaped circuit trace ending in a solder dot, used by the
// cyber skin to tether a floating readout back to the plant. Runs
// horizontally from (x, y) by dx, then vertically by dy, so start it
// on the culm and finish it at the edge of a readout frame.
function skinTrace(x, y, dx, dy, colour, opacity) {
  var mx = skinN(x + dx), my = skinN(y + dy);
  return '<g opacity="' + (opacity === undefined ? 0.7 : opacity) + '">' +
    '<path d="M' + skinN(x) + ',' + skinN(y) + 'H' + mx + 'V' + my + '" fill="none"' +
    ' stroke="' + colour + '" stroke-width="0.45"' +
    ' stroke-linecap="round" stroke-linejoin="round"/>' +
    skinDot(mx, my, 0.85, colour, 1) + '</g>';
}

// A struck coin lying face-up on the soil, used by the luck skins.
// Not a plain disc: the blank is a touch out of round, the rim sits
// heavier on the lower-right, and the inner field is nudged up-left
// off centre, so the light always reads as coming from the same
// place and a pair of them never looks like two stamped circles.
// r is the coin radius; rot turns the whole thing, glint is
// optional — leave it off for coins meant to sit further back.
function skinCoin(x, y, r, face, edge, glint, rot) {
  var s = r / 5;
  var out = '<g transform="translate(' + x + ',' + y + ') rotate(' + (rot || 0) +
    ') scale(' + skinN(s) + ')">' +
    '<path d="M0.1,-5 C3,-4.9 5,-2.8 5,0.1' +
    ' C5,3.1 2.7,5 -0.4,5' +
    ' C-3.3,5 -5,2.8 -5,-0.3' +
    ' C-5,-3.2 -2.8,-5.1 0.1,-5 Z" fill="' + edge + '"/>' +
    '<path d="M-0.3,-3.9 C2.1,-3.9 3.8,-2.3 3.8,-0.1' +
    ' C3.8,2.1 2,3.6 -0.4,3.6' +
    ' C-2.7,3.6 -4.1,2 -4,-0.2' +
    ' C-3.9,-2.4 -2.5,-3.9 -0.3,-3.9 Z" fill="' + face + '"/>';
  if (glint) {
    out += '<path d="M-2.4,-1.3 C-2,-2.6 -0.8,-3.3 0.7,-3.1' +
      ' C-0.4,-2.4 -1.3,-1.5 -1.6,-0.4 Z" fill="' + glint + '"/>';
  }
  return out + '</g>';
}

// A squat cauldron brimming over, used by the luck skins. (x, y) is
// where it meets the ground and it grows upward, so it can be
// dropped straight onto the soil line. s scales it — a pot at s=1 is
// about 17 across. The spill on top is one lumpy path rather than a
// stack of discs, which keeps it reading as loose coin at small
// sizes instead of a pile of circles.
function skinPot(x, y, s, body, shade, rim, gold, glint) {
  var out = '<g transform="translate(' + x + ',' + y + ') scale(' + s + ')">' +
    '<path d="M-6.8,-0.4 C-8.5,-2.8 -8.7,-6.4 -7.1,-9.2' +
    ' L7.1,-9.2 C8.7,-6.4 8.5,-2.8 6.8,-0.4' +
    ' C3.2,1.5 -3.2,1.5 -6.8,-0.4 Z" fill="' + body + '"/>' +
    '<path d="M7.1,-9.2 C8.7,-6.4 8.5,-2.8 6.8,-0.4' +
    ' C4.9,0.6 2.5,1.1 0.1,1.2' +
    ' C3.4,-1.5 4.6,-5.3 4.1,-9.2 Z" fill="' + shade + '"/>' +
    '<path d="M-5.7,-9.6 C-4.8,-12.1 -2.6,-13.2 -0.7,-12.3' +
    ' C0.4,-13.8 2.9,-13.7 3.7,-12' +
    ' C5.3,-12.2 6.2,-11 5.8,-9.6' +
    ' C2,-8.6 -1.9,-8.6 -5.7,-9.6 Z" fill="' + gold + '"/>';
  if (glint) {
    out += '<path d="M-3.6,-10.2 C-3.2,-11.5 -1.9,-12.2 -0.6,-11.8' +
      ' C-1.7,-11.3 -2.5,-10.8 -2.9,-10 Z" fill="' + glint + '"/>' +
      skinDot(3.1, -11.1, 0.55, glint, 0.85);
  }
  out += '<path d="M-8.3,-9.5 C-5.5,-11.1 5.5,-11.1 8.3,-9.5' +
    ' C5.7,-8.2 -5.7,-8.2 -8.3,-9.5 Z" fill="' + rim + '"/>';
  return out + '</g>';
}

// A band of colour arcing over the soil, used by the luck skins.
// Drawn as separate stroked arcs from the outside in, so the bands
// stay even at any radius, and swept between two angles (measured
// the usual way, 0 = right, 90 = straight up) rather than as a full
// half-dome — a quarter arc landing behind a pot reads as a rainbow
// with an end, which a symmetrical hoop never does. Keep the opacity
// low enough that the plant still wins wherever they overlap.
function skinRainbowArc(cx, cy, r, a0, a1, width, opacity, bands) {
  var cols = bands || ['#E2574C', '#EF9A3D', '#F2D24B', '#5CBB5F', '#4A8FD4', '#8A5FC0'];
  var w = width || 1.7;
  var large = Math.abs(a1 - a0) > 180 ? 1 : 0;
  var sweep = a1 < a0 ? 1 : 0;
  var out = '<g opacity="' + (opacity === undefined ? 0.55 : opacity) + '">';
  for (var i = 0; i < cols.length; i++) {
    var rr = r - i * w;
    if (rr <= w) break;
    var x0 = skinN(cx + rr * Math.cos(a0 * Math.PI / 180));
    var y0 = skinN(cy - rr * Math.sin(a0 * Math.PI / 180));
    var x1 = skinN(cx + rr * Math.cos(a1 * Math.PI / 180));
    var y1 = skinN(cy - rr * Math.sin(a1 * Math.PI / 180));
    out += '<path d="M' + x0 + ',' + y0 + ' A' + skinN(rr) + ',' + skinN(rr) +
      ' 0 ' + large + ',' + sweep + ' ' + x1 + ',' + y1 + '" fill="none"' +
      ' stroke="' + cols[i] + '" stroke-width="' + skinN(w * 0.94) + '"' +
      ' stroke-linecap="round"/>';
  }
  return out + '</g>';
}

// A pair of flat shades, used by the beach skin. Authored at a
// nominal 20 units wide and scaled to `w`, so the same pair sits on
// a tiny bud or on a full-grown disc without being redrawn. The
// lenses taper outward-down and the brow bar dips across the bridge
// rather than running straight — two matching rounded rectangles
// read as clip art, this reads as something actually worn. Pass rot
// to knock them off level; glint is optional.
function skinSunglasses(x, y, w, rot, lens, frame, glint) {
  var s = w / 20;
  var out = '<g transform="translate(' + x + ',' + y + ') rotate(' + (rot || 0) +
    ') scale(' + skinN(s) + ')">' +
    '<path d="M-10.1,-3.3 C-11.9,-3.1 -13.0,-2.3 -13.5,-1.0' +
    ' L-12.3,-0.6 C-11.8,-1.6 -11.0,-2.2 -9.8,-2.3 Z" fill="' + frame + '"/>' +
    '<path d="M10.1,-3.3 C11.9,-3.1 13.0,-2.3 13.5,-1.0' +
    ' L12.3,-0.6 C11.8,-1.6 11.0,-2.2 9.8,-2.3 Z" fill="' + frame + '"/>' +
    '<path d="M-9.7,-2.5 C-10.0,0.5 -8.4,3.1 -5.6,3.4' +
    ' C-3.0,3.7 -1.3,2.0 -1.1,-0.7 L-1.0,-2.7 Z" fill="' + lens + '"/>' +
    '<path d="M9.7,-2.5 C10.0,0.5 8.4,3.1 5.6,3.4' +
    ' C3.0,3.7 1.3,2.0 1.1,-0.7 L1.0,-2.7 Z" fill="' + lens + '"/>' +
    '<path d="M-10.4,-3.6 C-4.2,-4.7 4.2,-4.7 10.4,-3.6' +
    ' L10.1,-1.8 C7.0,-2.5 3.6,-2.9 1.4,-2.6' +
    ' C0.5,-1.9 -0.5,-1.9 -1.4,-2.6' +
    ' C-3.6,-2.9 -7.0,-2.5 -10.1,-1.8 Z" fill="' + frame + '"/>';
  if (glint) {
    out += '<path d="M-8.3,-1.5 C-7.3,-2.2 -5.7,-2.3 -4.7,-1.8' +
      ' C-6.3,-0.9 -7.3,0.3 -7.7,1.5 Z" fill="' + glint + '" opacity="0.75"/>';
  }
  return out + '</g>';
}

// A straw sun hat perched at an angle, used by the beach skin.
// (x, y) is the middle of the brim and `w` its full width. Drawn
// back-brim → crown → band → front brim, so the near edge of the
// brim genuinely passes in front of the crown instead of the whole
// thing reading as a dome stuck on a disc. The brim is a touch
// wider on the right and the crown leans with it, which is what
// lets a tilted hat still look like it is resting on something.
function skinStrawHat(x, y, w, rot, straw, shade, band) {
  var s = w / 20;
  return '<g transform="translate(' + x + ',' + y + ') rotate(' + (rot || 0) +
    ') scale(' + skinN(s) + ')">' +
    '<path d="M-10.0,0.5 C-9.5,-1.7 -5.3,-3.0 0.1,-3.0' +
    ' C5.4,-3.0 9.5,-1.6 10.0,0.7' +
    ' C9.2,2.7 5.1,3.7 -0.3,3.6' +
    ' C-5.5,3.5 -9.3,2.5 -10.0,0.5 Z" fill="' + straw + '"/>' +
    '<path d="M-5.7,-2.1 C-6.1,-5.8 -4.3,-8.8 -0.7,-9.2' +
    ' C2.9,-9.5 5.2,-7.1 5.6,-2.8' +
    ' C5.7,-2.0 5.7,-1.6 5.7,-1.4' +
    ' C2.1,-0.4 -2.6,-0.6 -5.7,-2.1 Z" fill="' + straw + '"/>' +
    '<path d="M2.4,-9.0 C4.4,-8.0 5.4,-5.7 5.6,-2.8' +
    ' C5.7,-2.0 5.7,-1.5 5.7,-1.4' +
    ' C4.2,-1.0 2.5,-0.7 0.7,-0.7' +
    ' C3.1,-3.0 3.6,-6.3 2.4,-9.0 Z" fill="' + shade + '"/>' +
    '<path d="M-5.8,-2.4 C-2.4,-1.1 2.3,-1.0 5.7,-2.3' +
    ' L5.7,-0.6 C2.3,0.6 -2.4,0.5 -5.8,-0.8 Z" fill="' + band + '"/>' +
    '<path d="M-10.0,0.5 C-9.3,2.5 -5.5,3.5 -0.3,3.6' +
    ' C5.1,3.7 9.2,2.7 10.0,0.7' +
    ' C6.4,2.0 -6.3,2.1 -10.0,0.5 Z" fill="' + shade + '"/></g>';
}

// A scallop shell lying on the sand, used by the beach skin. The
// hinge is at (x, y) and it fans upward from there, so it can be
// dropped straight onto the soil line. The top edge is a run of
// uneven lobes rather than a clean fan, and the shade wedge covers
// the left side only, so a handful of them never reads as repeated
// stamps. A shell at s=1 is about 14 across; rot turns it.
function skinSeashell(x, y, s, rot, shell, shade) {
  return '<g transform="translate(' + x + ',' + y + ') rotate(' + (rot || 0) +
    ') scale(' + s + ')">' +
    '<path d="M0,0 C-4.3,-0.9 -7.1,-3.5 -7.4,-6.5' +
    ' C-6.0,-5.3 -4.6,-5.9 -4.0,-7.3' +
    ' C-2.9,-5.6 -1.4,-5.9 -0.6,-7.7' +
    ' C0.5,-5.9 2.0,-5.7 2.9,-7.2' +
    ' C3.8,-5.7 5.3,-5.4 6.5,-6.6' +
    ' C6.3,-3.3 3.9,-0.6 0,0 Z" fill="' + shell + '"/>' +
    '<path d="M0,0 C-4.3,-0.9 -7.1,-3.5 -7.4,-6.5' +
    ' C-6.0,-5.3 -4.6,-5.9 -4.0,-7.3' +
    ' C-3.1,-4.7 -1.7,-2.0 0,0 Z" fill="' + shade + '"/></g>';
}

// A stoppered flask sitting on the soil, used by the witch skin.
// (x, y) is where it meets the ground and it grows upward. The body
// is a lopsided round-bottomed flask — fuller on the right, the neck
// set a little left of centre — so two of them at different scales
// never read as the same bottle twice. The brew is a separate path
// with a wavy meniscus that sits inside the glass rather than
// filling it edge to edge, which is what keeps the glass reading as
// glass without any transparency. A flask at s=1 is about 10 across
// and 15 tall; `glint` is optional and adds the streak and bubbles.
function skinPotion(x, y, s, glass, liquid, cork, glint) {
  var out = '<g transform="translate(' + x + ',' + y + ') scale(' + s + ')">' +
    '<path d="M-4.6,-4.4 C-4.9,-7.4 -3.4,-9.7 -1.7,-10.5' +
    ' L-1.7,-12.5 L1.9,-12.5 L1.9,-10.3' +
    ' C3.7,-9.4 5.1,-7.2 4.8,-4.3' +
    ' C4.5,-1.6 2.3,0.1 -0.2,0.1' +
    ' C-2.7,0.1 -4.4,-1.7 -4.6,-4.4 Z" fill="' + glass + '"/>' +
    '<path d="M-4.4,-5.2 C-2.9,-4.5 -1.4,-4.2 0.2,-4.3' +
    ' C1.9,-4.4 3.3,-4.8 4.6,-5.5' +
    ' C4.6,-2.4 2.4,-0.4 -0.2,-0.4' +
    ' C-2.7,-0.4 -4.3,-2.3 -4.4,-5.2 Z" fill="' + liquid + '"/>' +
    '<path d="M-2.1,-12.3 L2.3,-12.3 L2.0,-14.8' +
    ' C1.0,-15.4 -1.0,-15.4 -1.8,-14.8 Z" fill="' + cork + '"/>';
  if (glint) {
    out += '<path d="M-3.3,-7.6 C-3.8,-5.6 -3.6,-3.4 -2.6,-1.7' +
      ' C-4.0,-3.2 -4.4,-5.7 -3.3,-7.6 Z" fill="' + glint + '" opacity="0.8"/>' +
      skinDot(0.9, -2.6, 0.6, glint, 0.7) +
      skinDot(-1.4, -1.6, 0.4, glint, 0.55);
  }
  return out + '</g>';
}

// A pointed felt hat perched on a plant, used by the witch skin.
// (x, y) is the middle of the brim and `w` its full width, matching
// skinStrawHat so the two are interchangeable. Drawn back-brim →
// cone → shade → band → buckle → front brim, so the near edge of the
// brim passes in front of the cone. The cone climbs to the right and
// its tip flops over into a curl rather than ending in a clean
// point — a straight triangle reads as a party hat, the flop reads
// as felt with some age on it.
function skinWitchHat(x, y, w, rot, felt, shade, band, buckle) {
  var s = w / 20;
  var out = '<g transform="translate(' + x + ',' + y + ') rotate(' + (rot || 0) +
    ') scale(' + skinN(s) + ')">' +
    '<path d="M-10.2,0.4 C-9.4,-2.0 -4.8,-3.4 0.4,-3.3' +
    ' C5.6,-3.2 9.6,-1.7 10.1,0.8' +
    ' C9.2,3.0 4.8,4.1 -0.6,4.0' +
    ' C-5.8,3.9 -9.4,2.6 -10.2,0.4 Z" fill="' + felt + '"/>' +
    '<path d="M-5.6,-2.4 C-5.0,-7.6 -3.2,-11.8 -0.4,-14.2' +
    ' C1.2,-15.6 3.6,-15.7 4.8,-14.3' +
    ' C5.9,-13.0 5.6,-11.2 4.0,-10.6' +
    ' C4.8,-11.6 4.4,-12.8 3.2,-12.9' +
    ' C2.0,-13.0 1.2,-12.2 0.6,-11.0' +
    ' C1.6,-8.0 3.4,-5.0 5.4,-2.8' +
    ' C1.8,-1.5 -2.2,-1.4 -5.6,-2.4 Z" fill="' + felt + '"/>' +
    '<path d="M0.6,-11.0 C1.6,-8.0 3.4,-5.0 5.4,-2.8' +
    ' C3.7,-2.2 1.9,-1.9 0.1,-1.85' +
    ' C2.1,-5.0 1.9,-8.2 0.6,-11.0 Z" fill="' + shade + '"/>' +
    '<path d="M-5.4,-4.6 C-2.0,-3.4 2.2,-3.4 5.1,-4.7' +
    ' L5.4,-2.7 C2.2,-1.4 -2.0,-1.4 -5.5,-2.6 Z" fill="' + band + '"/>';
  if (buckle) {
    out += '<path d="M-1.3,-4.2 L1.3,-4.3 L1.3,-2.2 L-1.3,-2.1 Z" fill="' + buckle + '"/>' +
      '<path d="M-0.5,-3.7 L0.5,-3.75 L0.5,-2.8 L-0.5,-2.75 Z" fill="' + band + '"/>';
  }
  return out + '<path d="M-10.2,0.4 C-9.4,2.6 -5.8,3.9 -0.6,4.0' +
    ' C4.8,4.1 9.2,3.0 10.1,0.8' +
    ' C6.5,2.2 -6.4,2.3 -10.2,0.4 Z" fill="' + shade + '"/></g>';
}

// An eighth note drifting off a plant, used by the disco skin. The
// head is a tilted lozenge rather than a circle and the stem sits
// against its right shoulder, so it reads as printed music at four
// or five units tall. Pass `beamed` for a pair joined by a sloped
// beam — mixing singles and pairs is what stops a handful of notes
// from looking like a repeated stamp. A single note at s=1 is about
// 8 wide and 14 tall, measured from the head centre at (x, y).
function skinNote(x, y, s, rot, colour, beamed) {
  function head(dx) {
    return '<g transform="translate(' + dx + ',0)">' +
      '<path d="M-3.1,1.4 C-3.4,-0.2 -2.0,-2.0 -0.2,-2.3' +
      ' C1.4,-2.6 2.6,-1.7 2.4,-0.2' +
      ' C2.2,1.4 0.7,2.7 -1.0,2.8' +
      ' C-2.3,2.9 -3.0,2.4 -3.1,1.4 Z" fill="' + colour + '"/></g>';
  }
  var out = '<g transform="translate(' + x + ',' + y + ') rotate(' + (rot || 0) +
    ') scale(' + s + ')">';
  if (beamed) {
    out += head(-4.6) + head(3.4) +
      '<path d="M-2.2,-0.7 L-1.2,-1.2 L-1.2,-10.6 L-2.2,-10.2 Z" fill="' + colour + '"/>' +
      '<path d="M5.8,-0.7 L6.8,-1.2 L6.8,-11.6 L5.8,-11.2 Z" fill="' + colour + '"/>' +
      '<path d="M-2.2,-10.2 L6.8,-11.6 L6.8,-9.4 L-2.2,-8.0 Z" fill="' + colour + '"/>';
  } else {
    out += head(0) +
      '<path d="M1.4,-0.9 L2.4,-1.4 L2.4,-10.8 L1.4,-10.4 Z" fill="' + colour + '"/>' +
      '<path d="M2.4,-10.8 C5.0,-9.6 6.1,-7.6 5.0,-5.2' +
      ' C5.4,-7.3 4.4,-8.7 2.4,-9.4 Z" fill="' + colour + '"/>';
  }
  return out + '</g>';
}

// A speaker cabinet standing on the soil, used by the disco skin.
// (x, y) is where it meets the ground and it grows upward. The box
// is drawn as a front face plus one side panel in shade — the face
// leans back a little at the top and the side is only visible on
// the right — so a cabinet reads as a solid object rather than a
// rectangle, and two of them at different scales look like a stack
// rather than a repeat. A cabinet at s=1 is about 14 across and 16
// tall; rot tips it off square.
function skinSpeaker(x, y, s, rot, cab, shade, cone, dust) {
  return '<g transform="translate(' + x + ',' + y + ') rotate(' + (rot || 0) +
    ') scale(' + s + ')">' +
    '<path d="M-6.2,0 L-5.6,-15.4 L5.4,-16.2 L6.2,-0.6 Z" fill="' + cab + '"/>' +
    '<path d="M5.4,-16.2 L7.7,-14.9 L8.3,0.4 L6.2,-0.6 Z" fill="' + shade + '"/>' +
    '<path d="M-5.5,-14.6 L5.2,-15.3 L5.2,-14.2 L-5.5,-13.5 Z" fill="' + shade +
    '" opacity="0.65"/>' +
    skinDot(-0.2, -4.6, 3.7, cone) +
    skinDot(-0.2, -4.6, 1.4, dust) +
    skinDot(-0.2, -11.2, 2.1, cone) +
    skinDot(-0.2, -11.2, 0.75, dust) +
    '</g>';
}

// A mirror ball hanging above a plant, used by the disco skin. The
// cord is drawn first so the ball sits on the end of it, and the
// facets are a handful of off-centre quads plus one shaded crescent
// rather than a full lat-long grid — at eight or ten units across a
// full grid turns to mush, while three bright quads still read as
// mirrored tiles. Pass cordTop as the y to hang it from (0 is the
// top of the frame), or null for a ball floating free.
function skinDiscoBall(x, y, r, ball, facet, shade, glint, cordTop) {
  var s = r / 6;
  var out = '';
  if (cordTop !== undefined && cordTop !== null) {
    out += '<path d="M' + skinN(x - 0.32) + ',' + skinN(cordTop) +
      ' H' + skinN(x + 0.32) + ' V' + skinN(y - r * 0.88) +
      ' H' + skinN(x - 0.32) + ' Z" fill="' + shade + '"/>';
  }
  out += '<g transform="translate(' + x + ',' + y + ') scale(' + skinN(s) + ')">' +
    skinDot(0, 0, 6, ball) +
    '<path d="M3.2,-5.1 C6.0,-3.2 6.9,0.6 5.3,3.4' +
    ' C3.7,6.0 0.4,6.8 -2.3,5.6' +
    ' C2.0,4.3 4.5,-0.6 3.2,-5.1 Z" fill="' + shade + '"/>' +
    '<path d="M-3.6,-3.8 L-0.7,-4.6 L-0.3,-1.9 L-3.2,-1.1 Z" fill="' + facet + '"/>' +
    '<path d="M0.5,-1.5 L3.2,-2.1 L3.4,0.7 L0.7,1.3 Z" fill="' + facet +
    '" opacity="0.72"/>' +
    '<path d="M-4.4,0.7 L-1.7,0.1 L-1.3,2.6 L-3.8,3.2 Z" fill="' + facet +
    '" opacity="0.58"/></g>';
  if (glint) {
    out += skinSparkle(skinN(x - r * 0.52), skinN(y - r * 0.6), skinN(r * 0.55), glint, 0.9);
  }
  return out;
}

// A sprung treasure chest sitting on the soil, used by the pirate
// skin. (x, y) is where it meets the ground and it grows upward, so
// it can be dropped straight onto the soil line. The lid is thrown
// back and drawn *before* the body, so the front boards genuinely
// overlap it instead of the whole thing reading as a box with a
// triangle stuck on. The hoard inside is one lumpy path rather than
// a stack of discs — at four or five units across a pile of circles
// turns to porridge, while one uneven ridge still reads as coin. The
// body is a touch wider at the foot and the right side panel is the
// only one visible, so two chests at different scales never look
// like the same stamp twice. A chest at s=1 is about 17 across.
function skinTreasureChest(x, y, s, rot, wood, shade, band, gold, glint) {
  var out = '<g transform="translate(' + x + ',' + y + ') rotate(' + (rot || 0) +
    ') scale(' + s + ')">' +
    '<path d="M-7.4,-7.6 C-8.6,-10.8 -7.3,-13.6 -4.4,-14.8' +
    ' C-1.2,-16.1 3.1,-15.4 5.3,-13.5' +
    ' L6.5,-8.2 C3.2,-10.0 -2.9,-9.8 -7.4,-7.6 Z" fill="' + wood + '"/>' +
    '<path d="M-4.4,-14.8 C-1.2,-16.1 3.1,-15.4 5.3,-13.5' +
    ' L4.5,-10.8 C2.3,-12.4 -1.3,-12.8 -3.9,-12.0 Z" fill="' + shade + '"/>' +
    '<path d="M-6.3,-8.3 C-4.3,-10.2 -0.9,-10.8 1.3,-9.5' +
    ' C2.7,-10.7 5.1,-10.3 5.7,-8.7' +
    ' C2.1,-7.3 -2.7,-7.1 -6.3,-8.3 Z" fill="' + gold + '"/>' +
    '<path d="M-7.2,-0.2 L-6.6,-7.7 L6.3,-8.1 L7.2,0.2 Z" fill="' + wood + '"/>' +
    '<path d="M6.3,-8.1 L8.1,-7.1 L8.8,0.7 L7.2,0.2 Z" fill="' + shade + '"/>' +
    '<path d="M-7.0,-4.6 L6.7,-5.0 L6.8,-3.7 L-6.9,-3.3 Z" fill="' + band +
    '" opacity="0.85"/>' +
    '<path d="M-3.5,-7.8 L-2.3,-7.8 L-2.0,0.0 L-3.3,0.0 Z" fill="' + band + '"/>' +
    '<path d="M2.5,-8.0 L3.7,-8.0 L4.2,0.1 L2.9,0.1 Z" fill="' + band + '"/>' +
    skinDot(0.1, -4.1, 1.35, band) +
    skinDot(0.1, -4.1, 0.5, gold);
  if (glint) {
    out += '<path d="M-5.6,-13.0 C-4.6,-14.2 -2.9,-14.8 -1.3,-14.5' +
      ' C-3.0,-13.9 -4.3,-13.4 -5.0,-12.4 Z" fill="' + glint + '" opacity="0.7"/>' +
      skinDot(-2.6, -8.9, 0.5, glint, 0.8);
  }
  return out + '</g>';
}

// A deck gun on a wheeled carriage, used by the pirate skin. (x, y)
// is where the wheels meet the ground and it grows upward. The
// barrel sits nose-up with the shade running along its underside,
// which is what gives a flat quad the roundness of cast iron, and
// the far wheel is drawn in shade behind the carriage while the near
// one sits in front, so the whole thing has a side to it. A cannon
// at s=1 is about 14 across and 9 tall; rot tips it off level.
function skinCannon(x, y, s, rot, iron, shade, wood, trim) {
  return '<g transform="translate(' + x + ',' + y + ') rotate(' + (rot || 0) +
    ') scale(' + s + ')">' +
    skinDot(1.6, -1.8, 1.6, shade) +
    skinDot(1.6, -1.8, 0.5, trim) +
    '<path d="M-4.4,-5.0 L3.4,-4.4 L2.6,-1.6 L-4.2,-1.6 Z" fill="' + wood + '"/>' +
    '<path d="M3.4,-4.4 L2.6,-1.6 L1.0,-1.6 L1.6,-4.3 Z" fill="' + shade +
    '" opacity="0.45"/>' +
    '<path d="M-5.2,-9.0 L5.2,-8.2 L5.2,-5.4 L-5.2,-4.4 Z" fill="' + iron + '"/>' +
    skinDot(-5.2, -6.7, 2.3, iron) +
    '<path d="M-5.2,-6.5 L5.2,-6.6 L5.2,-5.4 L-5.2,-4.4 Z" fill="' + shade + '"/>' +
    '<path d="M4.8,-8.4 L7.1,-8.3 L7.1,-5.3 L4.8,-5.4 Z" fill="' + iron + '"/>' +
    skinDot(6.9, -6.8, 0.8, shade) +
    skinDot(-2.6, -1.9, 1.9, wood) +
    skinDot(-2.6, -1.9, 0.6, trim) +
    '</g>';
}

// A playing card, used by the joker skin. (x, y) is the middle of
// the card and it is drawn a hair out of true — the long edges are
// not quite parallel and the pip sits slightly off centre — so a
// handful of them scattered around a plant never reads as one
// rectangle copied four times. The right-hand strip of shade is what
// stops it looking like a flat sticker. A card at s=1 is about 9
// across and 13 tall; rot lays it flat on the soil or tips it in
// mid-air.
function skinPlayingCard(x, y, s, rot, face, ink, shade) {
  return '<g transform="translate(' + x + ',' + y + ') rotate(' + (rot || 0) +
    ') scale(' + s + ')">' +
    '<path d="M-4.3,-6.1 L4.0,-6.6 L4.5,6.1 L-3.9,6.6 Z" fill="' + face + '"/>' +
    '<path d="M4.0,-6.6 L4.5,6.1 L2.5,6.2 L2.1,-6.5 Z" fill="' + shade +
    '" opacity="0.5"/>' +
    '<path d="M0.2,-3.1 L2.1,-0.2 L0.4,3.0 L-1.6,0.0 Z" fill="' + ink + '"/>' +
    '<path d="M-2.9,-5.0 L-2.0,-3.6 L-2.8,-2.1 L-3.7,-3.5 Z" fill="' + ink +
    '" opacity="0.85"/></g>';
}

// A single motley lozenge, used by the joker skin as confetti and as
// the pip on a costume. Kept deliberately taller than it is wide so
// it reads as harlequin diamond rather than as a rotated square.
function skinDiamondChip(x, y, s, rot, colour, opacity) {
  return '<g transform="translate(' + x + ',' + y + ') rotate(' + (rot || 0) +
    ') scale(' + s + ')">' +
    '<path d="M0,-2.5 L1.5,0 L0,2.5 L-1.5,0 Z" fill="' + colour +
    '" opacity="' + (opacity === undefined ? 1 : opacity) + '"/></g>';
}


// ---- The skins ---------------------------------------------------

var PLANT_SKINS = {

 education: [
    {
      id: 'classic',
      name: 'Heartwood',
      note: 'The oak as first grown.',
      swatch: ['hsl(61,45%,55%)', 'hsl(58,38%,42%)', 'hsl(9,33%,32%)'],
      vars: {},
    },
    {
      id: 'aurelian',
      name: 'Aurelian',
      note: 'Struck in gold, down to the last acorn.',
      swatch: ['#F7D257', '#C9922A', '#4E3A19'],
      defs:
        '<linearGradient id="sk-aurelian-canopy" x1="0.1" y1="0" x2="0.35" y2="1">' +
          '<stop offset="0" stop-color="#FFE894"/>' +
          '<stop offset="0.5" stop-color="#F3C64C"/>' +
          '<stop offset="1" stop-color="#D19A2C"/>' +
        '</linearGradient>' +
        '<linearGradient id="sk-aurelian-canopy-dark" x1="0.1" y1="0" x2="0.35" y2="1">' +
          '<stop offset="0" stop-color="#D6A536"/>' +
          '<stop offset="1" stop-color="#A87A1C"/>' +
        '</linearGradient>' +
        '<linearGradient id="sk-aurelian-bark" x1="0" y1="0" x2="1" y2="0.2">' +
          '<stop offset="0" stop-color="#8A6C31"/>' +
          '<stop offset="1" stop-color="#6A5124"/>' +
        '</linearGradient>',
      vars: {
        '--c-canopy':      'url(#sk-aurelian-canopy)',
        '--c-canopy-dark': 'url(#sk-aurelian-canopy-dark)',
        '--c-bark':        'url(#sk-aurelian-bark)',
        '--c-bark-dark':   '#4B3717',
        '--c-leaf':        '#F5CE5C',
        '--c-leaf-dark':   '#C2902A',
        '--c-stem':        '#7E6029',
        '--c-stem-dark':   '#4E3A19',
        '--c-seed':        '#F2D88C',
        '--c-seed-dark':   '#C7A346',
        '--c-shadow':      'rgba(72,50,6,0.20)',
      },
      extras: {
        0: function (a) {
          return skinSparkle(a.canopy[0] + 9, a.canopy[1] - 8, 2.2, '#FFF4C4', 0.9) +
                 skinSparkle(a.canopy[0] - 8, a.canopy[1] + 2, 1.4, '#FFE9A0', 0.7);
        },
        1: function (a) {
          return skinSparkle(a.canopy[0] - 14, a.canopy[1] - 10, 2.4, '#FFF4C4', 0.9) +
                 skinSparkle(a.canopy[0] + 15, a.canopy[1] - 3,  1.7, '#FFE9A0', 0.72);
        },
        2: function (a) {
          return skinSparkle(a.canopy[0] - 12, a.canopy[1] - 9,  2.6, '#FFF4C4', 0.92) +
                 skinSparkle(a.canopy[0] + 3,  a.canopy[1] - 14, 1.8, '#FFEEB0', 0.8) +
                 skinSparkle(a.canopy[0] + 11, a.canopy[1] + 4,  2.1, '#FFE9A0', 0.7) +
                 skinDot(a.canopy[0] - 4, a.canopy[1] + 8, 0.9, '#FFF4C4', 0.6);
        },
        3: function (a) {
          return skinSparkle(a.canopy[0] - 16, a.canopy[1] - 8,  3.0, '#FFF4C4', 0.92) +
                 skinSparkle(a.canopy[0] - 2,  a.canopy[1] - 18, 2.1, '#FFEEB0', 0.82) +
                 skinSparkle(a.canopy[0] + 17, a.canopy[1] + 3,  2.6, '#FFE9A0', 0.75) +
                 skinSparkle(a.canopy[0] + 6,  a.canopy[1] + 18, 1.9, '#FFF4C4', 0.65) +
                 skinDot(a.canopy[0] - 21, a.canopy[1] + 10, 1.1, '#FFF4C4', 0.55) +
                 skinDot(a.canopy[0] + 9,  a.canopy[1] - 9,  0.9, '#FFF4C4', 0.5);
        },
      },
    },
    {
      id: 'prismbloom',
      name: 'Prismbloom',
      note: 'A crown that never settled on one colour.',
      swatch: ['#FF6B6B', '#FFE14D', '#4FA8F5'],
      defs:
        '<linearGradient id="sk-prismbloom-canopy" x1="0" y1="0.15" x2="1" y2="0.85">' +
          '<stop offset="0" stop-color="#FF7B72"/>' +
          '<stop offset="0.2" stop-color="#FFA945"/>' +
          '<stop offset="0.4" stop-color="#FFE45C"/>' +
          '<stop offset="0.6" stop-color="#5FD97A"/>' +
          '<stop offset="0.8" stop-color="#54AEF7"/>' +
          '<stop offset="1" stop-color="#B072F2"/>' +
        '</linearGradient>' +
        '<linearGradient id="sk-prismbloom-canopy-dark" x1="0" y1="0.15" x2="1" y2="0.85">' +
          '<stop offset="0" stop-color="#D8514F"/>' +
          '<stop offset="0.2" stop-color="#DE7C22"/>' +
          '<stop offset="0.4" stop-color="#DCBB2E"/>' +
          '<stop offset="0.6" stop-color="#38AC55"/>' +
          '<stop offset="0.8" stop-color="#2F80C9"/>' +
          '<stop offset="1" stop-color="#7F49C6"/>' +
        '</linearGradient>' +
        '<linearGradient id="sk-prismbloom-bark" x1="0" y1="0" x2="1" y2="0.3">' +
          '<stop offset="0" stop-color="#9A7A8E"/>' +
          '<stop offset="1" stop-color="#6E5470"/>' +
        '</linearGradient>',
      vars: {
        '--c-canopy':      'url(#sk-prismbloom-canopy)',
        '--c-canopy-dark': 'url(#sk-prismbloom-canopy-dark)',
        '--c-bark':        'url(#sk-prismbloom-bark)',
        '--c-bark-dark':   '#503A56',
        '--c-leaf':        'url(#sk-prismbloom-canopy)',
        '--c-leaf-dark':   'url(#sk-prismbloom-canopy-dark)',
        '--c-stem':        '#7E6084',
        '--c-stem-dark':   '#523C58',
        '--c-seed':        '#F2A9C4',
        '--c-seed-dark':   '#C56E97',
        '--c-shadow':      'rgba(60,26,74,0.18)',
      },
      extras: {
        0: function (a) {
          return skinSparkle(a.canopy[0] + 9, a.canopy[1] - 9, 2.1, '#FFE45C', 0.9) +
                 skinSparkle(a.canopy[0] - 9, a.canopy[1] + 1, 1.5, '#7FD4F7', 0.8);
        },
        1: function (a) {
          return skinSparkle(a.canopy[0] - 14, a.canopy[1] - 11, 2.3, '#FF8FA8', 0.9) +
                 skinSparkle(a.canopy[0] + 15, a.canopy[1] - 4,  1.8, '#7FD4F7', 0.8) +
                 skinDot(a.canopy[0] + 5, a.canopy[1] + 6, 0.9, '#FFE45C', 0.75);
        },
        2: function (a) {
          return skinSparkle(a.canopy[0] - 13, a.canopy[1] - 10, 2.5, '#FF8FA8', 0.92) +
                 skinSparkle(a.canopy[0] + 4,  a.canopy[1] - 15, 1.9, '#FFE45C', 0.85) +
                 skinSparkle(a.canopy[0] + 12, a.canopy[1] + 3,  2.2, '#7FD4F7', 0.85) +
                 skinDot(a.canopy[0] - 5, a.canopy[1] + 9, 1.0, '#C79BF5', 0.8);
        },
        3: function (a) {
          return skinSparkle(a.canopy[0] - 17, a.canopy[1] - 7,  2.9, '#FF8FA8', 0.92) +
                 skinSparkle(a.canopy[0] - 1,  a.canopy[1] - 19, 2.2, '#FFE45C', 0.88) +
                 skinSparkle(a.canopy[0] + 18, a.canopy[1] + 2,  2.6, '#7FD4F7', 0.88) +
                 skinSparkle(a.canopy[0] + 7,  a.canopy[1] + 19, 2.0, '#8CE9A2', 0.8) +
                 skinDot(a.canopy[0] - 20, a.canopy[1] + 12, 1.2, '#C79BF5', 0.8) +
                 skinDot(a.canopy[0] + 10, a.canopy[1] - 10, 1.0, '#FFE45C', 0.7);
        },
      },
    },
    {
      id: 'emberfall',
      name: 'Emberfall',
      note: 'Late-autumn canopy, always mid-drop.',
      swatch: ['#F0A93E', '#C2552A', '#5B3A2C'],
      defs:
        '<linearGradient id="sk-emberfall-canopy" x1="0" y1="0" x2="0.25" y2="1">' +
          '<stop offset="0" stop-color="#F5B84A"/>' +
          '<stop offset="0.55" stop-color="#E08A34"/>' +
          '<stop offset="1" stop-color="#C4552A"/>' +
        '</linearGradient>',
      vars: {
        '--c-canopy':      'url(#sk-emberfall-canopy)',
        '--c-canopy-dark': '#A8401F',
        '--c-bark':        '#6B4536',
        '--c-bark-dark':   '#46281F',
        '--c-leaf':        '#E4A455',
        '--c-leaf-dark':   '#BB6B2E',
        '--c-stem':        '#7A5235',
        '--c-stem-dark':   '#4E3221',
        '--c-seed':        '#DBA25D',
        '--c-seed-dark':   '#AF7335',
        '--c-shadow':      'rgba(58,22,6,0.20)',
      },
      extras: {
        2: function (a) {
          return skinLeafMote(a.canopy[0] - 15, a.canopy[1] + 14, -28, 0.5, '#D2622B', 0.85) +
                 skinLeafMote(a.canopy[0] + 16, a.canopy[1] + 22, 34, 0.42, '#E0873A', 0.7);
        },
        3: function (a) {
          return skinLeafMote(a.canopy[0] - 22, a.canopy[1] + 26, -24, 0.62, '#D2622B', 0.85) +
                 skinLeafMote(a.canopy[0] + 20, a.canopy[1] + 38, 40, 0.52, '#E0873A', 0.72) +
                 skinLeafMote(a.canopy[0] + 8,  a.canopy[1] + 56, -12, 0.44, '#C24C25', 0.6);
        },
      },
    },
    {
      id: 'nebulark',
      name: 'Nebulark',
      note: 'Deep-space crown, fruiting small worlds and drifting rock.',
      swatch: ['#7C5AC4', '#2E1B57', '#4FD8D0'],
      defs:
        '<radialGradient id="sk-nebulark-canopy" cx="0.36" cy="0.26" r="0.88">' +
          '<stop offset="0" stop-color="#9068E0"/>' +
          '<stop offset="0.5" stop-color="#5D3CA8"/>' +
          '<stop offset="1" stop-color="#33206A"/>' +
        '</radialGradient>' +
        '<linearGradient id="sk-nebulark-canopy-dark" x1="0.2" y1="0" x2="0.5" y2="1">' +
          '<stop offset="0" stop-color="#2E1A5C"/>' +
          '<stop offset="1" stop-color="#1B0F3D"/>' +
        '</linearGradient>' +
        '<linearGradient id="sk-nebulark-bark" x1="0" y1="0" x2="1" y2="0.25">' +
          '<stop offset="0" stop-color="#4A3A72"/>' +
          '<stop offset="1" stop-color="#332654"/>' +
        '</linearGradient>',
      vars: {
        '--c-canopy':      'url(#sk-nebulark-canopy)',
        '--c-canopy-dark': 'url(#sk-nebulark-canopy-dark)',
        '--c-bark':        'url(#sk-nebulark-bark)',
        '--c-bark-dark':   '#231A44',
        '--c-leaf':        '#7C5AC4',
        '--c-leaf-dark':   '#4A2E90',
        '--c-stem':        '#4C3B78',
        '--c-stem-dark':   '#2B1F4C',
        '--c-seed':        '#9A82D6',
        '--c-seed-dark':   '#63499E',
        '--c-shadow':      'rgba(18,8,44,0.26)',
      },
      extras: {
        0: function (a) {
          return skinSparkle(a.canopy[0] - 12, a.canopy[1] - 6, 1.8, '#CFE6FF', 0.85) +
                 skinSparkle(a.canopy[0] + 12, a.canopy[1] - 11, 1.4, '#9FD8F0', 0.7) +
                 skinDot(a.canopy[0] + 4, a.canopy[1] - 16, 0.7, '#EDE3FF', 0.6);
        },
        1: function (a) {
          return skinPlanet(a.canopy[0] + 17, a.canopy[1] - 14, 3.0, '#E0768F', '#B4506D', null) +
                 skinSparkle(a.canopy[0] - 16, a.canopy[1] - 8, 2.0, '#CFE6FF', 0.85) +
                 skinDot(a.canopy[0] - 6, a.canopy[1] - 18, 0.8, '#EDE3FF', 0.6);
        },
        2: function (a) {
          return skinPlanet(a.canopy[0] - 10, a.canopy[1] - 8, 4.0, '#E0768F', '#B4506D', '#F3D08A') +
                 skinAsteroid(a.canopy[0] + 9, a.canopy[1] - 11, 0.42, '#9A8CC4', '#665A96', 18) +
                 skinAsteroid(a.canopy[0] + 4, a.canopy[1] + 7, 0.34, '#8E80B8', '#5C5188', -34) +
                 skinPlanet(a.canopy[0] + 13, a.canopy[1] + 2, 2.4, '#63D6CC', '#37A49C', null) +
                 skinSparkle(a.canopy[0] - 3, a.canopy[1] - 16, 1.8, '#CFE6FF', 0.85) +
                 skinDot(a.canopy[0] + 1, a.canopy[1] + 12, 0.8, '#EDE3FF', 0.65);
        },
        3: function (a) {
          return skinPlanet(a.canopy[0] - 14, a.canopy[1] - 6, 5.2, '#E0768F', '#B4506D', '#F3D08A') +
                 skinAsteroid(a.canopy[0] + 14, a.canopy[1] - 12, 0.55, '#9A8CC4', '#665A96', 22) +
                 skinAsteroid(a.canopy[0] + 10, a.canopy[1] + 14, 0.46, '#8E80B8', '#5C5188', -28) +
                 skinPlanet(a.canopy[0] - 20, a.canopy[1] + 9, 3.0, '#63D6CC', '#37A49C', null) +
                 skinPlanet(a.canopy[0] + 3, a.canopy[1] + 21, 2.6, '#F0A860', '#C07636', null) +
                 skinSparkle(a.canopy[0] - 6, a.canopy[1] - 19, 2.4, '#CFE6FF', 0.9) +
                 skinSparkle(a.canopy[0] + 22, a.canopy[1] + 2, 1.9, '#9FD8F0', 0.8) +
                 skinDot(a.canopy[0] + 4, a.canopy[1] - 8, 0.9, '#EDE3FF', 0.65) +
                 skinDot(a.canopy[0] - 18, a.canopy[1] - 15, 0.7, '#EDE3FF', 0.55);
        },
      },
    },
  ],

  // ---- SUNFLOWER (Exercise) ----
  // Base art untouched. Every look below is vars + defs + extras only.
  // Token set for this species: seed seed-line stem leaf-light leaf
  // leaf-dark petal petal-dark disc disc-dark disc-seed (+ shadow).
  exercise: [
    {
      id: 'classic',
      name: 'Daybreak',
      note: 'The sunflower as first grown.',
      swatch: ['#F2B84B', '#E8A020', '#5C3A1A'],
      vars: {},
    },
    {
      // The hard part of a gold sunflower is that the plant is
      // already yellow, so a straight hue swap changes nothing. What
      // separates metal from petal here is the ramp: every petal runs
      // dark bronze at the base to near-white at the tip, which is how
      // a struck surface catches light, and the leaves and stem go
      // gold too so nothing is left behind as an organic green.
      id: 'midas',
      name: 'Midas Bloom',
      note: 'Struck from metal, still turning to face the light.',
      swatch: ['#FFF0B4', '#D6A72C', '#7A5209'],
      defs:
        '<linearGradient id="sk-midas-petal" x1="0" y1="1" x2="0" y2="0">' +
          '<stop offset="0" stop-color="#B57F16"/>' +
          '<stop offset="0.45" stop-color="#EFC44E"/>' +
          '<stop offset="1" stop-color="#FFF0B4"/>' +
        '</linearGradient>' +
        '<linearGradient id="sk-midas-petal-dark" x1="0" y1="1" x2="0" y2="0">' +
          '<stop offset="0" stop-color="#8F6209"/>' +
          '<stop offset="0.5" stop-color="#D6A72C"/>' +
          '<stop offset="1" stop-color="#F4DA8C"/>' +
        '</linearGradient>' +
        '<linearGradient id="sk-midas-leaf" x1="0" y1="1" x2="0.3" y2="0">' +
          '<stop offset="0" stop-color="#9C7A1B"/>' +
          '<stop offset="1" stop-color="#DCB748"/>' +
        '</linearGradient>' +
        '<linearGradient id="sk-midas-leaf-light" x1="0" y1="1" x2="0.3" y2="0">' +
          '<stop offset="0" stop-color="#C6A031"/>' +
          '<stop offset="1" stop-color="#F1DA92"/>' +
        '</linearGradient>' +
        '<radialGradient id="sk-midas-disc" cx="0.38" cy="0.32" r="0.78">' +
          '<stop offset="0" stop-color="#E8C155"/>' +
          '<stop offset="1" stop-color="#9A6E12"/>' +
        '</radialGradient>' +
        '<radialGradient id="sk-midas-disc-dark" cx="0.4" cy="0.3" r="0.8">' +
          '<stop offset="0" stop-color="#A8791A"/>' +
          '<stop offset="1" stop-color="#6B4708"/>' +
        '</radialGradient>' +
        '<linearGradient id="sk-midas-stem" x1="0" y1="1" x2="0" y2="0">' +
          '<stop offset="0" stop-color="#96731A"/>' +
          '<stop offset="1" stop-color="#CFA835"/>' +
        '</linearGradient>',
      vars: {
        '--c-petal':      'url(#sk-midas-petal)',
        '--c-petal-dark': 'url(#sk-midas-petal-dark)',
        '--c-disc':       'url(#sk-midas-disc)',
        '--c-disc-dark':  'url(#sk-midas-disc-dark)',
        '--c-disc-seed':  '#E8C866',
        '--c-leaf-light': 'url(#sk-midas-leaf-light)',
        '--c-leaf':       'url(#sk-midas-leaf)',
        '--c-leaf-dark':  '#9C7A1B',
        '--c-stem':       'url(#sk-midas-stem)',
        '--c-seed':       '#EBCB72',
        '--c-seed-line':  '#9C7A1B',
        '--c-shadow':     'rgba(92,64,10,0.24)',
      },
      extras: {
        0: function (a) {
          return skinSparkle(a.canopy[0] + 8, a.canopy[1] - 4, 1.5, '#FFF4CE', 0.7);
        },
        1: function (a) {
          return skinCoin(58, 120.5, 2.6, '#F2CE68', '#B58A18', '#FFF4CE', -12) +
                 skinSparkle(a.canopy[0] - 8, a.canopy[1] - 6, 1.8, '#FFF4CE', 0.8);
        },
        2: function (a) {
          return skinCoin(23, 121, 3.0, '#F2CE68', '#B58A18', '#FFF4CE', 18) +
                 skinCoin(59, 120.5, 2.5, '#E7C158', '#A87D12', null, -24) +
                 skinSparkle(a.canopy[0] - 17, a.canopy[1] - 13, 2.3, '#FFF4CE', 0.85) +
                 skinSparkle(a.canopy[0] + 15, a.canopy[1] - 19, 1.7, '#FFF4CE', 0.6);
        },
        3: function (a) {
          return skinCoin(21, 121.5, 3.4, '#F2CE68', '#B58A18', '#FFF4CE', -14) +
                 skinCoin(27, 120, 2.6, '#E7C158', '#A87D12', null, 26) +
                 skinCoin(60, 120.5, 3.0, '#F2CE68', '#B58A18', '#FFF4CE', 9) +
                 skinSparkle(a.canopy[0] - 23, a.canopy[1] - 17, 2.9, '#FFF4CE', 0.9) +
                 skinSparkle(a.canopy[0] + 21, a.canopy[1] - 24, 2.2, '#FFF4CE', 0.7) +
                 skinSparkle(a.canopy[0] + 4,  a.canopy[1] - 37, 1.7, '#FFF4CE', 0.55) +
                 skinDot(a.canopy[0] - 27, a.canopy[1] + 8, 1.0, '#FFF4CE', 0.5);
        },
      },
    },
    {
      // Grow-a-Garden flavour: the whole spectrum on one head. Rather
      // than tinting every petal the same, the two petal tokens carry
      // two different ramps — warm and cool — and the base art already
      // alternates them around the ring, so the flower reads as a
      // colour wheel without a single path being touched.
      id: 'chromabloom',
      name: 'Chromabloom',
      note: 'Every petal caught a different part of the light.',
      swatch: ['#FBC55F', '#F2717F', '#7B5ED8'],
      defs:
        '<linearGradient id="sk-chromabloom-petal" x1="0" y1="1" x2="0" y2="0">' +
          '<stop offset="0" stop-color="#F2717F"/>' +
          '<stop offset="0.45" stop-color="#FBC55F"/>' +
          '<stop offset="1" stop-color="#8FE3A5"/>' +
        '</linearGradient>' +
        '<linearGradient id="sk-chromabloom-petal-dark" x1="0" y1="1" x2="0" y2="0">' +
          '<stop offset="0" stop-color="#8E6BE0"/>' +
          '<stop offset="0.5" stop-color="#5FB8EE"/>' +
          '<stop offset="1" stop-color="#7CE5D6"/>' +
        '</linearGradient>' +
        '<radialGradient id="sk-chromabloom-disc" cx="0.4" cy="0.34" r="0.8">' +
          '<stop offset="0" stop-color="#FFF1BC"/>' +
          '<stop offset="0.5" stop-color="#F58BD1"/>' +
          '<stop offset="1" stop-color="#7B5ED8"/>' +
        '</radialGradient>' +
        '<radialGradient id="sk-chromabloom-disc-dark" cx="0.42" cy="0.3" r="0.85">' +
          '<stop offset="0" stop-color="#C86FE0"/>' +
          '<stop offset="1" stop-color="#4B3AA6"/>' +
        '</radialGradient>' +
        '<linearGradient id="sk-chromabloom-leaf" x1="0" y1="1" x2="1" y2="0">' +
          '<stop offset="0" stop-color="#46C8A8"/>' +
          '<stop offset="1" stop-color="#9BE879"/>' +
        '</linearGradient>' +
        '<linearGradient id="sk-chromabloom-leaf-light" x1="0" y1="1" x2="1" y2="0">' +
          '<stop offset="0" stop-color="#7BE0C6"/>' +
          '<stop offset="1" stop-color="#C6F196"/>' +
        '</linearGradient>' +
        '<linearGradient id="sk-chromabloom-stem" x1="0" y1="1" x2="0" y2="0">' +
          '<stop offset="0" stop-color="#4FC7B4"/>' +
          '<stop offset="1" stop-color="#8FD86A"/>' +
        '</linearGradient>' +
        '<linearGradient id="sk-chromabloom-seed" x1="0" y1="1" x2="0.4" y2="0">' +
          '<stop offset="0" stop-color="#8E6BE0"/>' +
          '<stop offset="1" stop-color="#F9A8CE"/>' +
        '</linearGradient>',
      vars: {
        '--c-petal':      'url(#sk-chromabloom-petal)',
        '--c-petal-dark': 'url(#sk-chromabloom-petal-dark)',
        '--c-disc':       'url(#sk-chromabloom-disc)',
        '--c-disc-dark':  'url(#sk-chromabloom-disc-dark)',
        '--c-disc-seed':  '#FFE9A6',
        '--c-leaf-light': 'url(#sk-chromabloom-leaf-light)',
        '--c-leaf':       'url(#sk-chromabloom-leaf)',
        '--c-leaf-dark':  '#2FA893',
        '--c-stem':       'url(#sk-chromabloom-stem)',
        '--c-seed':       'url(#sk-chromabloom-seed)',
        '--c-seed-line':  '#6B4FC4',
        '--c-shadow':     'rgba(90,50,140,0.22)',
      },
      extras: {
        0: function (a) {
          return skinSparkle(a.canopy[0] + 8, a.canopy[1] - 5, 1.5, '#FFE1F2', 0.75) +
                 skinDot(a.canopy[0] - 9, a.canopy[1] + 3, 0.8, '#A8E8DC', 0.6);
        },
        1: function (a) {
          return skinSparkle(a.canopy[0] + 9,  a.canopy[1] - 7, 1.9, '#FFE1F2', 0.8) +
                 skinSparkle(a.canopy[0] - 11, a.canopy[1] + 2, 1.4, '#C9EBFF', 0.6) +
                 skinDot(a.canopy[0] + 13, a.canopy[1] + 9, 0.9, '#D6F5C4', 0.55);
        },
        2: function (a) {
          return skinSparkle(a.canopy[0] - 18, a.canopy[1] - 12, 2.4, '#FFE1F2', 0.85) +
                 skinSparkle(a.canopy[0] + 16, a.canopy[1] - 18, 1.8, '#C9EBFF', 0.7) +
                 skinSparkle(a.canopy[0] + 6,  a.canopy[1] - 28, 1.4, '#FFF0B8', 0.55) +
                 skinDot(a.canopy[0] - 21, a.canopy[1] + 10, 1.0, '#D6F5C4', 0.55);
        },
        3: function (a) {
          return skinRainbowArc(40, 121, 32, 58, 6, 1.5, 0.38) +
                 skinSparkle(a.canopy[0] - 24, a.canopy[1] - 16, 3.0, '#FFE1F2', 0.9) +
                 skinSparkle(a.canopy[0] + 22, a.canopy[1] - 25, 2.2, '#C9EBFF', 0.7) +
                 skinSparkle(a.canopy[0] + 3,  a.canopy[1] - 38, 1.7, '#FFF0B8', 0.6) +
                 skinDot(a.canopy[0] - 28, a.canopy[1] + 4, 1.1, '#D6F5C4', 0.5);
        },
      },
    },
    {
      id: 'moonpetal',
      name: 'Moonpetal',
      note: 'A night-blooming sunflower, silver instead of gold.',
      swatch: ['#F4F1FF', '#9FB4DE', '#2E3560'],
      defs:
        '<linearGradient id="sk-moonpetal-petal" x1="0" y1="1" x2="0" y2="0">' +
          '<stop offset="0" stop-color="#B9C6EC"/>' +
          '<stop offset="1" stop-color="#FBF9FF"/>' +
        '</linearGradient>',
      vars: {
        '--c-petal':      'url(#sk-moonpetal-petal)',
        '--c-petal-dark': '#9FB4DE',
        '--c-disc':       '#2E3560',
        '--c-disc-dark':  '#1B1F3C',
        '--c-disc-seed':  '#7A87C4',
        '--c-leaf-light': '#6E9C8E',
        '--c-leaf':       '#4E8377',
        '--c-leaf-dark':  '#3B6A62',
        '--c-stem':       '#3F6A5F',
        '--c-seed':       '#B9C3E8',
        '--c-seed-line':  '#6E7BB8',
        '--c-shadow':     'rgba(18,20,58,0.22)',
      },
      extras: {
        1: function (a) {
          return skinSparkle(a.canopy[0] + 7, a.canopy[1] - 5, 1.6, '#EDE9FF', 0.75);
        },
        2: function (a) {
          return skinSparkle(a.canopy[0] - 16, a.canopy[1] - 12, 2.2, '#EDE9FF', 0.8) +
                 skinSparkle(a.canopy[0] + 14, a.canopy[1] - 20, 1.7, '#EDE9FF', 0.6) +
                 skinDot(a.canopy[0] + 19, a.canopy[1] + 2, 0.9, '#EDE9FF', 0.5);
        },
        3: function (a) {
          return skinSparkle(a.canopy[0] - 22, a.canopy[1] - 16, 2.8, '#EDE9FF', 0.85) +
                 skinSparkle(a.canopy[0] + 20, a.canopy[1] - 26, 2.1, '#EDE9FF', 0.65) +
                 skinSparkle(a.canopy[0] + 5,  a.canopy[1] - 38, 1.6, '#EDE9FF', 0.5) +
                 skinDot(a.canopy[0] - 26, a.canopy[1] + 6, 1.1, '#EDE9FF', 0.45);
        },
      },
    },
    {
      // Sun-bleached rather than recoloured: the petals lose their
      // saturation the way anything does after a season outdoors, and
      // the disc swaps its flat brown for a userSpaceOnUse sand
      // pattern. Because that pattern is tied to the canvas and not to
      // each shape, the disc and its darker inner well share one
      // continuous grain instead of each carrying its own tiling.
      // The hat only shows up at full growth — a seedling in a sun hat
      // is a joke, a grown sunflower in one is a character.
      id: 'beachcomber',
      name: 'Beachcomber',
      note: 'Sun-bleached, sand-dusted, and in no hurry.',
      swatch: ['#FBD98E', '#D9B98A', '#2F5D6B'],
      defs:
        '<pattern id="sk-beachcomber-sand" patternUnits="userSpaceOnUse" width="7" height="7">' +
          '<rect width="7" height="7" fill="#D9B98A"/>' +
          '<circle cx="1.6" cy="2.1" r="0.55" fill="#EFDCBB"/>' +
          '<circle cx="5.1" cy="1.2" r="0.40" fill="#C09B6C"/>' +
          '<path d="M3.0,4.2 C3.6,3.9 4.1,4.3 3.9,4.9 C3.4,5.2 2.8,4.8 3.0,4.2 Z" fill="#EFDCBB"/>' +
          '<circle cx="6.2" cy="5.4" r="0.45" fill="#C09B6C"/>' +
          '<circle cx="0.8" cy="5.9" r="0.35" fill="#EFDCBB" opacity="0.7"/>' +
        '</pattern>' +
        '<pattern id="sk-beachcomber-sand-dark" patternUnits="userSpaceOnUse" width="7" height="7">' +
          '<rect width="7" height="7" fill="#BC9765"/>' +
          '<circle cx="2.2" cy="1.5" r="0.5" fill="#D6B187"/>' +
          '<circle cx="5.6" cy="3.1" r="0.38" fill="#A37E4E"/>' +
          '<path d="M1.4,5.0 C2.0,4.7 2.5,5.1 2.3,5.7 C1.8,6.0 1.2,5.6 1.4,5.0 Z" fill="#D6B187"/>' +
          '<circle cx="4.9" cy="6.0" r="0.42" fill="#A37E4E"/>' +
        '</pattern>' +
        '<linearGradient id="sk-beachcomber-petal" x1="0" y1="1" x2="0" y2="0">' +
          '<stop offset="0" stop-color="#F0BE68"/>' +
          '<stop offset="1" stop-color="#FFF0C6"/>' +
        '</linearGradient>' +
        '<linearGradient id="sk-beachcomber-petal-dark" x1="0" y1="1" x2="0" y2="0">' +
          '<stop offset="0" stop-color="#E0A94F"/>' +
          '<stop offset="1" stop-color="#FBDFA0"/>' +
        '</linearGradient>',
      vars: {
        '--c-petal':      'url(#sk-beachcomber-petal)',
        '--c-petal-dark': 'url(#sk-beachcomber-petal-dark)',
        '--c-disc':       'url(#sk-beachcomber-sand)',
        '--c-disc-dark':  'url(#sk-beachcomber-sand-dark)',
        '--c-disc-seed':  '#E9D0A6',
        '--c-leaf-light': '#A3CBAB',
        '--c-leaf':       '#7FB894',
        '--c-leaf-dark':  '#5E9A7C',
        '--c-stem':       '#6FA383',
        '--c-seed':       'url(#sk-beachcomber-sand)',
        '--c-seed-line':  '#B08A55',
        '--c-shadow':     'rgba(120,95,55,0.20)',
      },
      extras: {
        0: function () {
          return skinSeashell(55, 121, 0.36, 18, '#F7E3CE', '#DFC3A0');
        },
        1: function (a) {
          return skinSeashell(23, 121.5, 0.40, -15, '#F4DCC0', '#D8B892') +
                 skinSunglasses(a.canopy[0], a.canopy[1] - 0.6, 8.5, -3,
                                '#2F5D6B', '#F0E2C2', '#A9DCE4');
        },
        2: function (a) {
          return skinSeashell(22, 121.5, 0.44, -18, '#F4DCC0', '#D8B892') +
                 skinSeashell(58, 120.5, 0.32, 24, '#F7E3CE', '#DFC3A0') +
                 skinSunglasses(a.canopy[0], a.canopy[1] - 1.2, 15, -2,
                                '#2F5D6B', '#F0E2C2', '#A9DCE4');
        },
        3: function (a) {
          return skinSeashell(20, 121.5, 0.46, -16, '#F4DCC0', '#D8B892') +
                 skinSeashell(60, 120.5, 0.34, 22, '#F7E3CE', '#DFC3A0') +
                 skinDot(29, 120.5, 0.9, '#EFDCBB', 0.8) +
                 skinSunglasses(a.canopy[0], a.canopy[1] - 1.5, 21, -2,
                                '#2F5D6B', '#F0E2C2', '#A9DCE4') +
                 skinStrawHat(a.canopy[0] - 13, a.canopy[1] - 22, 21, -17,
                              '#EBD7A2', '#CDB275', '#7FBEC0');
        },
      },
    },
  ],

  // Lotus skins. 'inkandgold' is gone, replaced by 'corsair'; the
  // base art in PLANT_SVG_DATA.mindfulness is untouched — every look
  // below is vars + defs + extras only.
  mindfulness: [
    {
      id: 'classic',
      name: 'Dawn Lotus',
      note: 'The lotus as first grown.',
      swatch: ['#FAD1D8', '#E28D9B', '#DA4E65'],
      vars: {},
    },
    {
      id: 'goldleaf',
      name: 'Gilded Sovereign',
      note: 'Beaten gold from pad to petal tip.',
      swatch: ['#FFF6D2', '#E8B23C', '#8A5E17'],
      defs:
        '<linearGradient id="sk-goldleaf-outer" x1="0" y1="1" x2="0" y2="0">' +
          '<stop offset="0" stop-color="#E4B043"/>' +
          '<stop offset="1" stop-color="#FFE9A6"/>' +
        '</linearGradient>' +
        '<linearGradient id="sk-goldleaf-mid" x1="0" y1="1" x2="0" y2="0">' +
          '<stop offset="0" stop-color="#B77F1E"/>' +
          '<stop offset="1" stop-color="#F0C55C"/>' +
        '</linearGradient>' +
        '<linearGradient id="sk-goldleaf-inner" x1="0" y1="1" x2="0" y2="0">' +
          '<stop offset="0" stop-color="#7E5312"/>' +
          '<stop offset="0.55" stop-color="#C08A24"/>' +
          '<stop offset="1" stop-color="#EFC65F"/>' +
        '</linearGradient>',
      vars: {
        '--c-petal-outer-light': '#FFF6D2',
        '--c-petal-outer':       'url(#sk-goldleaf-outer)',
        '--c-petal-mid-light':   '#F5CE72',
        '--c-petal-mid':         'url(#sk-goldleaf-mid)',
        '--c-petal-inner-light': '#D9A63C',
        '--c-petal-inner':       'url(#sk-goldleaf-inner)',
        '--c-center':            '#FFF7DA',
        '--c-center-dark':       '#C98A1E',
        '--c-pad':               '#6B6228',
        '--c-pad-dark':          '#443F16',
        '--c-leaf-light':        '#A08C3C',
        '--c-leaf':              '#77692A',
        '--c-leaf-dark':         '#514812',
        '--c-shadow':            'rgba(58,44,8,0.34)',
      },
      extras: {
        0: function (a) {
          return skinCoin(a.base[0] - 12, a.base[1] + 1.5, 1.7, '#F7D774', '#B98B2C', '#FFF3C4', -14) +
                 skinSparkle(a.top[0] + 4, a.top[1] - 1, 1.4, '#FFF3C4', 0.75);
        },
        1: function (a) {
          return skinCoin(a.base[0] - 14, a.base[1] + 2, 2.0, '#F7D774', '#B98B2C', '#FFF3C4', -8) +
                 skinCoin(a.base[0] + 13, a.base[1] + 0.5, 1.5, '#E7C25C', '#A87C22', null, 16) +
                 skinSparkle(a.top[0] + 4.5, a.top[1] + 2, 1.6, '#FFF3C4', 0.8);
        },
        2: function (a) {
          return skinRipple(a.base[0], a.base[1] - 1, 20, '#D9AE4A', 0.34) +
                 skinRipple(a.base[0], a.base[1] + 2, 25, '#D9AE4A', 0.18) +
                 skinCoin(a.base[0] - 17, a.base[1] + 2, 2.1, '#F7D774', '#B98B2C', '#FFF3C4', -12) +
                 skinCoin(a.base[0] + 16, a.base[1] + 1.5, 1.7, '#E7C25C', '#A87C22', null, 22) +
                 skinSparkle(a.canopy[0] + 7, a.canopy[1] - 6, 1.8, '#FFF3C4', 0.8);
        },
        3: function (a) {
          return skinRipple(a.base[0], a.base[1] - 1, 25, '#D9AE4A', 0.36) +
                 skinRipple(a.base[0], a.base[1] + 2.5, 31, '#D9AE4A', 0.2) +
                 skinCoin(a.base[0] - 20, a.base[1] + 2, 2.4, '#F7D774', '#B98B2C', '#FFF3C4', -16) +
                 skinCoin(a.base[0] + 18, a.base[1] + 2.5, 2.0, '#F0CB68', '#B08222', '#FFF3C4', 9) +
                 skinCoin(a.base[0] + 25, a.base[1] - 0.5, 1.5, '#E0B848', '#9C731C', null, 30) +
                 skinSparkle(a.canopy[0] - 9, a.canopy[1] - 4, 2.1, '#FFF6D2', 0.85) +
                 skinSparkle(a.top[0] + 8, a.top[1] + 8, 1.5, '#FFF6D2', 0.6);
        },
      },
    },
    {
      id: 'prism',
      name: 'Prismbloom',
      note: 'A different colour in every ring of petals.',
      swatch: ['#5FD08A', '#7B6BE8', '#EF7BA8'],
      defs:
        '<linearGradient id="sk-prism-outer" x1="0" y1="1" x2="0" y2="0">' +
          '<stop offset="0" stop-color="#2FB4B0"/>' +
          '<stop offset="0.5" stop-color="#4CC77E"/>' +
          '<stop offset="1" stop-color="#B6E45C"/>' +
        '</linearGradient>' +
        '<linearGradient id="sk-prism-outer-light" x1="0" y1="1" x2="0" y2="0">' +
          '<stop offset="0" stop-color="#5FD2CD"/>' +
          '<stop offset="0.5" stop-color="#7EDD9C"/>' +
          '<stop offset="1" stop-color="#D3F084"/>' +
        '</linearGradient>' +
        '<linearGradient id="sk-prism-mid" x1="0" y1="1" x2="0" y2="0">' +
          '<stop offset="0" stop-color="#2E92E0"/>' +
          '<stop offset="0.5" stop-color="#6A6FE4"/>' +
          '<stop offset="1" stop-color="#A45FDC"/>' +
        '</linearGradient>' +
        '<linearGradient id="sk-prism-mid-light" x1="0" y1="1" x2="0" y2="0">' +
          '<stop offset="0" stop-color="#5FB0EC"/>' +
          '<stop offset="0.5" stop-color="#8E92EE"/>' +
          '<stop offset="1" stop-color="#C088E9"/>' +
        '</linearGradient>' +
        '<linearGradient id="sk-prism-inner" x1="0" y1="1" x2="0" y2="0">' +
          '<stop offset="0" stop-color="#E24C6E"/>' +
          '<stop offset="0.45" stop-color="#EF8A3D"/>' +
          '<stop offset="1" stop-color="#F2D24B"/>' +
        '</linearGradient>' +
        '<linearGradient id="sk-prism-inner-light" x1="0" y1="1" x2="0" y2="0">' +
          '<stop offset="0" stop-color="#EF7B96"/>' +
          '<stop offset="0.45" stop-color="#F5A868"/>' +
          '<stop offset="1" stop-color="#F8E183"/>' +
        '</linearGradient>',
      vars: {
        '--c-petal-outer-light': 'url(#sk-prism-outer-light)',
        '--c-petal-outer':       'url(#sk-prism-outer)',
        '--c-petal-mid-light':   'url(#sk-prism-mid-light)',
        '--c-petal-mid':         'url(#sk-prism-mid)',
        '--c-petal-inner-light': 'url(#sk-prism-inner-light)',
        '--c-petal-inner':       'url(#sk-prism-inner)',
        '--c-center':            '#FFF3B0',
        '--c-center-dark':       '#F0B93C',
        '--c-pad':               '#33BCA4',
        '--c-pad-dark':          '#1C8377',
        '--c-leaf-light':        '#8FE2B4',
        '--c-leaf':              '#4CC58C',
        '--c-leaf-dark':         '#2A9A6E',
        '--c-shadow':            'rgba(26,86,112,0.3)',
      },
      extras: {
        0: function (a) {
          return skinSparkle(a.top[0] - 6, a.top[1] + 1, 1.5, '#8FE9FF', 0.8) +
                 skinDot(a.base[0] + 9, a.base[1] - 4, 0.8, '#F5A0C8', 0.75);
        },
        1: function (a) {
          return skinRainbowArc(a.base[0], a.base[1], 18, 176, 132, 1.1, 0.4) +
                 skinSparkle(a.top[0] + 5, a.top[1] + 3, 1.6, '#FFF3B0', 0.85) +
                 skinDot(a.base[0] + 12, a.base[1] - 8, 0.9, '#7FD4FF', 0.7);
        },
        2: function (a) {
          return skinRainbowArc(a.base[0], a.base[1] + 1, 26, 178, 128, 1.3, 0.4) +
                 skinRainbowArc(a.base[0], a.base[1] + 1, 22, 2, 44, 1.1, 0.32) +
                 skinSparkle(a.canopy[0] - 9, a.canopy[1] - 5, 1.9, '#8FE9FF', 0.85) +
                 skinSparkle(a.top[0] + 7, a.top[1] + 6, 1.4, '#F5A0C8', 0.7) +
                 skinDot(a.base[0] - 20, a.base[1] - 12, 0.9, '#C6A0F5', 0.7);
        },
        3: function (a) {
          return skinRainbowArc(a.base[0], a.base[1] + 2, 34, 178, 134, 1.5, 0.38) +
                 skinRainbowArc(a.base[0], a.base[1] + 2, 30, 2, 42, 1.3, 0.3) +
                 skinSparkle(a.top[0] - 3, a.top[1] - 4, 2.3, '#FFF6DA', 0.9) +
                 skinSparkle(a.canopy[0] + 15, a.canopy[1] - 2, 1.7, '#8FE9FF', 0.75) +
                 skinSparkle(a.canopy[0] - 16, a.canopy[1] + 8, 1.4, '#F5A0C8', 0.7) +
                 skinDot(a.base[0] + 22, a.base[1] - 24, 1.0, '#C6A0F5', 0.7) +
                 skinDot(a.base[0] - 24, a.base[1] - 18, 0.8, '#B6E45C', 0.7);
        },
      },
    },
    {
      id: 'harlequin',
      name: 'Wild Card',
      note: 'Motley stripes, and the deck never far away.',
      swatch: ['#C0263A', '#3E9B4F', '#6B3FA0'],
      defs:
        // Hard-stop diagonals: banded per petal half, so the two
        // halves of one petal never line up and the whole bloom
        // reads as stitched motley instead of striped wallpaper.
        '<linearGradient id="sk-harlequin-mid" x1="0" y1="1" x2="1" y2="0">' +
          '<stop offset="0" stop-color="#3E9B4F"/>' +
          '<stop offset="0.34" stop-color="#3E9B4F"/>' +
          '<stop offset="0.34" stop-color="#6B3FA0"/>' +
          '<stop offset="0.67" stop-color="#6B3FA0"/>' +
          '<stop offset="0.67" stop-color="#3E9B4F"/>' +
          '<stop offset="1" stop-color="#3E9B4F"/>' +
        '</linearGradient>' +
        '<linearGradient id="sk-harlequin-mid-light" x1="0" y1="1" x2="1" y2="0">' +
          '<stop offset="0" stop-color="#8B5FC4"/>' +
          '<stop offset="0.38" stop-color="#8B5FC4"/>' +
          '<stop offset="0.38" stop-color="#5CB86D"/>' +
          '<stop offset="0.72" stop-color="#5CB86D"/>' +
          '<stop offset="0.72" stop-color="#8B5FC4"/>' +
          '<stop offset="1" stop-color="#8B5FC4"/>' +
        '</linearGradient>' +
        '<linearGradient id="sk-harlequin-inner" x1="1" y1="1" x2="0" y2="0">' +
          '<stop offset="0" stop-color="#C0263A"/>' +
          '<stop offset="0.36" stop-color="#C0263A"/>' +
          '<stop offset="0.36" stop-color="#2F8543"/>' +
          '<stop offset="0.7" stop-color="#2F8543"/>' +
          '<stop offset="0.7" stop-color="#C0263A"/>' +
          '<stop offset="1" stop-color="#C0263A"/>' +
        '</linearGradient>' +
        '<linearGradient id="sk-harlequin-inner-light" x1="1" y1="1" x2="0" y2="0">' +
          '<stop offset="0" stop-color="#D94456"/>' +
          '<stop offset="0.42" stop-color="#D94456"/>' +
          '<stop offset="0.42" stop-color="#4FA765"/>' +
          '<stop offset="0.76" stop-color="#4FA765"/>' +
          '<stop offset="0.76" stop-color="#D94456"/>' +
          '<stop offset="1" stop-color="#D94456"/>' +
        '</linearGradient>',
      vars: {
        '--c-petal-outer-light': '#8B5FC4',
        '--c-petal-outer':       '#6B3FA0',
        '--c-petal-mid-light':   'url(#sk-harlequin-mid-light)',
        '--c-petal-mid':         'url(#sk-harlequin-mid)',
        '--c-petal-inner-light': 'url(#sk-harlequin-inner-light)',
        '--c-petal-inner':       'url(#sk-harlequin-inner)',
        '--c-center':            '#F2E27A',
        '--c-center-dark':       '#C9A83E',
        '--c-pad':               '#357F4A',
        '--c-pad-dark':          '#1D4A2E',
        '--c-leaf-light':        '#79B486',
        '--c-leaf':              '#4E8F5C',
        '--c-leaf-dark':         '#356B42',
        '--c-shadow':            'rgba(38,14,54,0.35)',
      },
      extras: {
        0: function (a) {
          return skinPlayingCard(a.base[0] - 10, a.base[1] - 2.5, 0.22, -76, '#F5EFE0', '#C0263A', '#B9A78E');
        },
        1: function (a) {
          return skinPlayingCard(a.base[0] - 13, a.base[1] - 1.5, 0.27, -82, '#F5EFE0', '#C0263A', '#B9A78E') +
                 skinPlayingCard(a.base[0] + 12, a.base[1] - 0.5, 0.24, 97, '#F5EFE0', '#6B3FA0', '#B9A78E') +
                 skinDiamondChip(a.top[0] + 5, a.top[1] + 2, 0.45, 12, '#F2E27A', 0.85);
        },
        2: function (a) {
          return skinPlayingCard(a.base[0] - 16, a.base[1] - 12, 0.3, -24, '#F5EFE0', '#C0263A', '#B9A78E') +
                 skinPlayingCard(a.base[0] + 17, a.base[1] - 3, 0.27, 104, '#F5EFE0', '#3E9B4F', '#B9A78E') +
                 skinPlayingCard(a.canopy[0] + 16, a.canopy[1] + 6, 0.26, 21, '#F5EFE0', '#6B3FA0', '#B9A78E') +
                 skinDiamondChip(a.base[0] - 21, a.base[1] - 24, 0.5, -16, '#3E9B4F', 0.8) +
                 skinDiamondChip(a.top[0] + 8, a.top[1] + 4, 0.42, 24, '#F2E27A', 0.85);
        },
        3: function (a) {
          return skinPlayingCard(a.base[0] - 22, a.base[1] - 15, 0.35, -28, '#F5EFE0', '#C0263A', '#B9A78E') +
                 skinPlayingCard(a.base[0] - 15, a.base[1] - 3, 0.3, -101, '#F5EFE0', '#6B3FA0', '#B9A78E') +
                 skinPlayingCard(a.base[0] + 23, a.base[1] - 18, 0.33, 26, '#F5EFE0', '#3E9B4F', '#B9A78E') +
                 skinPlayingCard(a.canopy[0] + 19, a.canopy[1] - 8, 0.26, 15, '#F5EFE0', '#C0263A', '#B9A78E') +
                 skinDiamondChip(a.canopy[0] - 20, a.canopy[1] - 6, 0.55, -18, '#6B3FA0', 0.8) +
                 skinDiamondChip(a.top[0] + 6, a.top[1] - 3, 0.5, 14, '#F2E27A', 0.9) +
                 skinDiamondChip(a.base[0] + 27, a.base[1] - 30, 0.4, 32, '#3E9B4F', 0.75);
        },
      },
    },
    {
      id: 'corsair',
      name: "Corsair's Bounty",
      note: 'Sailcloth and salvaged plank, moored over dark water.',
      swatch: ['#F2E7CB', '#9C6B38', '#C9A24F'],
      defs:
        // Hard stops down the petal give the mid ring the look of
        // caulked planking without a pattern, so it holds up at both
        // the seedling scale and the full bloom's 0.21 scale.
        '<linearGradient id="sk-corsair-plank" x1="0" y1="1" x2="0" y2="0">' +
          '<stop offset="0" stop-color="#77492A"/>' +
          '<stop offset="0.32" stop-color="#77492A"/>' +
          '<stop offset="0.33" stop-color="#9C6B38"/>' +
          '<stop offset="0.63" stop-color="#9C6B38"/>' +
          '<stop offset="0.64" stop-color="#8A5C31"/>' +
          '<stop offset="1" stop-color="#AE7C45"/>' +
        '</linearGradient>' +
        '<linearGradient id="sk-corsair-plank-light" x1="0" y1="1" x2="0" y2="0">' +
          '<stop offset="0" stop-color="#96683C"/>' +
          '<stop offset="0.36" stop-color="#96683C"/>' +
          '<stop offset="0.37" stop-color="#B5844E"/>' +
          '<stop offset="0.7" stop-color="#B5844E"/>' +
          '<stop offset="0.71" stop-color="#A67540"/>' +
          '<stop offset="1" stop-color="#C4955C"/>' +
        '</linearGradient>' +
        '<linearGradient id="sk-corsair-gold" x1="0" y1="1" x2="0" y2="0">' +
          '<stop offset="0" stop-color="#7E5A1B"/>' +
          '<stop offset="1" stop-color="#D9B369"/>' +
        '</linearGradient>',
      vars: {
        '--c-petal-outer-light': '#F2E7CB',
        '--c-petal-outer':       '#DCCBA4',
        '--c-petal-mid-light':   'url(#sk-corsair-plank-light)',
        '--c-petal-mid':         'url(#sk-corsair-plank)',
        '--c-petal-inner-light': '#C9A24F',
        '--c-petal-inner':       'url(#sk-corsair-gold)',
        '--c-center':            '#F5E2A2',
        '--c-center-dark':       '#B98B2C',
        '--c-pad':               '#26534E',
        '--c-pad-dark':          '#143034',
        '--c-leaf-light':        '#4E8478',
        '--c-leaf':              '#2F6156',
        '--c-leaf-dark':         '#1D453D',
        '--c-shadow':            'rgba(9,29,32,0.36)',
      },
      extras: {
        0: function (a) {
          return skinCoin(a.base[0] - 10, a.base[1] + 1, 1.6, '#E9C468', '#8A6520', '#F7E4A8', -18) +
                 skinCoin(a.base[0] + 8, a.base[1] + 1.5, 1.2, '#D8B052', '#7A5718', null, 24);
        },
        1: function (a) {
          return skinTreasureChest(a.base[0] - 13, a.base[1] + 1.5, 0.3, -5,
                   '#8A5C31', '#5F3C1E', '#4A4A4A', '#E9C468', '#F7E4A8') +
                 skinCoin(a.base[0] + 11, a.base[1] + 1, 1.5, '#E9C468', '#8A6520', '#F7E4A8', 12);
        },
        2: function (a) {
          return skinRipple(a.base[0], a.base[1] - 1, 20, '#5E9C93', 0.35) +
                 skinRipple(a.base[0], a.base[1] + 2, 25, '#5E9C93', 0.2) +
                 skinTreasureChest(a.base[0] - 16, a.base[1] + 2, 0.42, -6,
                   '#8A5C31', '#5F3C1E', '#4A4A4A', '#E9C468', '#F7E4A8') +
                 skinCannon(a.base[0] + 16, a.base[1] + 1.5, 0.34, -6,
                   '#3E4348', '#23272B', '#7A4F27', '#C9A24F') +
                 skinCoin(a.base[0] - 6, a.base[1] + 2.5, 1.4, '#E9C468', '#8A6520', '#F7E4A8', 20);
        },
        3: function (a) {
          return skinRipple(a.base[0], a.base[1] - 1, 25, '#5E9C93', 0.36) +
                 skinRipple(a.base[0], a.base[1] + 2.5, 31, '#5E9C93', 0.2) +
                 skinTreasureChest(a.base[0] - 20, a.base[1] + 2, 0.5, -7,
                   '#8A5C31', '#5F3C1E', '#4A4A4A', '#E9C468', '#F7E4A8') +
                 skinCannon(a.base[0] + 20, a.base[1] + 2.5, 0.42, -5,
                   '#3E4348', '#23272B', '#7A4F27', '#C9A24F') +
                 skinCoin(a.base[0] - 8, a.base[1] + 3, 1.7, '#E9C468', '#8A6520', '#F7E4A8', -10) +
                 skinCoin(a.base[0] + 8, a.base[1] + 3.5, 1.4, '#D8B052', '#7A5718', null, 26) +
                 skinSparkle(a.canopy[0] + 2, a.canopy[1] - 5, 1.7, '#F7E4A8', 0.7);
        },
      },
    },
  ],

  // ---- LAVENDER (sleep) skins --------------------------------------
  // Tokens the lavender art actually exposes: --c-bud (the main
  // whorl tone), --c-bud-pale (the alternating tone), --c-bud-shade
  // (the solid backing plate behind the spike), --c-calyx, --c-stem,
  // --c-stem-light and --c-shadow.
  //
  // The spike reads by alternation, not by outline: every whorl
  // flips which tone sits on the centre bract and which on the two
  // side bracts. So a skin has one job it must not get wrong —
  // --c-bud and --c-bud-pale have to stay clearly apart in value.
  // Two similar tones and the whole head collapses into one blob.
  // --c-bud-shade should stay darker than both, since it is the
  // plate the wedges between petals are read against.
  sleep: [
    {
      id: 'classic',
      name: 'Dusk Lavender',
      note: 'The lavender as first grown.',
      swatch: ['#F1EBFB', '#D9CDF5', '#BCA8E6'],
      vars: {},
    },
    {
      id: 'midas',
      name: 'Midas Hour',
      note: 'Struck gold from calyx to tip, with the spill to prove it.',
      swatch: ['#FFF1C6', '#E3A93C', '#8A5F14'],
      defs:
        '<linearGradient id="sk-midas-bud" x1="0" y1="1" x2="0.35" y2="0">' +
          '<stop offset="0" stop-color="#B8801E"/>' +
          '<stop offset="0.55" stop-color="#E3A93C"/>' +
          '<stop offset="1" stop-color="#F7CE6C"/>' +
        '</linearGradient>' +
        '<linearGradient id="sk-midas-bud-pale" x1="0" y1="1" x2="0.35" y2="0">' +
          '<stop offset="0" stop-color="#F0CB7C"/>' +
          '<stop offset="1" stop-color="#FFF3D2"/>' +
        '</linearGradient>',
      vars: {
        '--c-bud':        'url(#sk-midas-bud)',
        '--c-bud-pale':   'url(#sk-midas-bud-pale)',
        '--c-bud-shade':  '#8A5F14',
        '--c-calyx':      '#8F7A32',
        '--c-stem':       '#7C8A4C',
        '--c-stem-light': '#AEBC77',
        '--c-shadow':     'rgba(84,58,8,0.18)',
      },
      // The coins arrive before the pot does: one at the sprout,
      // a scatter by mid-growth, the full spill only at the end.
      extras: {
        1: function (a) {
          return skinCoin(a.base[0] - 11, a.base[1] - 1, 2.3, '#F6D06A', '#C08F26', '#FFF3C8', -12) +
                 skinSparkle(a.canopy[0] + 8, a.canopy[1] - 5, 1.9, '#FFF3C8', 0.85);
        },
        2: function (a) {
          return skinCoin(a.base[0] - 13, a.base[1] - 0.5, 2.6, '#F6D06A', '#C08F26', '#FFF3C8', -16) +
                 skinCoin(a.base[0] + 11, a.base[1] + 1, 2.1, '#EFC459', '#B8862B', null, 13) +
                 skinSparkle(a.canopy[0] - 11, a.canopy[1] - 7, 2.3, '#FFF3C8', 0.85) +
                 skinSparkle(a.canopy[0] + 12, a.canopy[1] + 5, 1.5, '#FFF3C8', 0.6);
        },
        3: function (a) {
          return skinPot(a.base[0] - 16, a.base[1] + 0.5, 0.62,
                         '#463522', '#2F2416', '#6B5433', '#F0C25C', '#FFF3C8') +
                 skinCoin(a.base[0] + 13, a.base[1] - 0.5, 2.7, '#F6D06A', '#C08F26', '#FFF3C8', 18) +
                 skinCoin(a.base[0] + 8.5, a.base[1] + 1.5, 2.2, '#EFC459', '#B8862B', null, -8) +
                 skinSparkle(a.canopy[0] - 13, a.canopy[1] - 10, 2.6, '#FFF3C8', 0.9) +
                 skinSparkle(a.canopy[0] + 13, a.canopy[1] + 2, 1.8, '#FFF3C8', 0.7) +
                 skinSparkle(a.top[0] + 6, a.top[1] - 3, 1.5, '#FFF3C8', 0.6);
        },
      },
    },
    {
      id: 'prism',
      name: 'Prism Spike',
      note: 'Every whorl catches a different part of the light.',
      swatch: ['#F2568E', '#F2D74B', '#4A9BE8'],
      // Both gradients are objectBoundingBox, so each bract carries
      // the whole sweep inside its own outline. That keeps the
      // iridescence identical at every growth stage — a gradient run
      // across the plant instead would leave the sprout stuck on the
      // red end and only pay off at full height. The saturated sweep
      // and the pastel one run in different directions so touching
      // petals never land on the same colour at their shared edge.
      defs:
        '<linearGradient id="sk-prism-bud" x1="0" y1="1" x2="0.85" y2="0">' +
          '<stop offset="0" stop-color="#F2568E"/>' +
          '<stop offset="0.22" stop-color="#F7913F"/>' +
          '<stop offset="0.42" stop-color="#EFD048"/>' +
          '<stop offset="0.62" stop-color="#4FC97E"/>' +
          '<stop offset="0.82" stop-color="#4A9BE8"/>' +
          '<stop offset="1" stop-color="#9B6BE8"/>' +
        '</linearGradient>' +
        '<linearGradient id="sk-prism-bud-pale" x1="0.15" y1="0" x2="1" y2="1">' +
          '<stop offset="0" stop-color="#FBF3C6"/>' +
          '<stop offset="0.3" stop-color="#BFF3D8"/>' +
          '<stop offset="0.6" stop-color="#BEE4FB"/>' +
          '<stop offset="0.82" stop-color="#D2C6FA"/>' +
          '<stop offset="1" stop-color="#F9C9E6"/>' +
        '</linearGradient>',
      vars: {
        '--c-bud':        'url(#sk-prism-bud)',
        '--c-bud-pale':   'url(#sk-prism-bud-pale)',
        '--c-bud-shade':  '#553A94',
        '--c-calyx':      '#5EC3A6',
        '--c-stem':       '#4FBE8C',
        '--c-stem-light': '#8FE4BC',
        '--c-shadow':     'rgba(86,48,124,0.16)',
      },
      // Motes, not a halo: a few coloured glints at different sizes
      // and opacities, none of them centred on the spike, so the
      // shimmer looks like it is coming off the flowers rather than
      // sitting behind them in a ring.
      extras: {
        1: function (a) {
          return skinSparkle(a.canopy[0] + 9, a.canopy[1] - 6, 2.1, '#F9D7E8', 0.9) +
                 skinSparkle(a.canopy[0] - 8, a.canopy[1] + 4, 1.5, '#BEE4FB', 0.75) +
                 skinDot(a.canopy[0] + 12, a.canopy[1] + 7, 0.7, '#FBF3C6', 0.7);
        },
        2: function (a) {
          return skinSparkle(a.canopy[0] - 12, a.canopy[1] - 8, 2.5, '#F9C9E6', 0.9) +
                 skinSparkle(a.canopy[0] + 12, a.canopy[1] - 2, 1.9, '#BFF3D8', 0.8) +
                 skinSparkle(a.canopy[0] + 8, a.canopy[1] + 12, 1.4, '#BEE4FB', 0.65) +
                 skinDot(a.canopy[0] - 9, a.canopy[1] + 9, 0.8, '#FBF3C6', 0.7) +
                 skinDot(a.top[0] + 5, a.top[1] - 4, 0.6, '#D2C6FA', 0.65);
        },
        3: function (a) {
          return skinSparkle(a.canopy[0] - 14, a.canopy[1] - 12, 2.9, '#F9C9E6', 0.92) +
                 skinSparkle(a.canopy[0] + 14, a.canopy[1] - 4, 2.2, '#BEE4FB', 0.82) +
                 skinSparkle(a.canopy[0] + 10, a.canopy[1] + 16, 1.6, '#BFF3D8', 0.7) +
                 skinSparkle(a.top[0] - 6, a.top[1] - 5, 2.0, '#FBF3C6', 0.85) +
                 skinDot(a.canopy[0] - 10, a.canopy[1] + 13, 0.9, '#D2C6FA', 0.7) +
                 skinDot(a.top[0] + 8, a.top[1] + 2, 0.7, '#F9D7E8', 0.65);
        },
      },
    },
    {
      id: 'hexbloom',
      name: 'Hexbloom',
      note: 'Steeped in something. Best not to ask what.',
      swatch: ['#C69BEA', '#6B34A0', '#2C1440'],
      defs:
        '<linearGradient id="sk-hexbloom-bud" x1="0" y1="1" x2="0.3" y2="0">' +
          '<stop offset="0" stop-color="#4A1F74"/>' +
          '<stop offset="1" stop-color="#8E52C6"/>' +
        '</linearGradient>',
      // The stems go swamp-green rather than sage, which is what
      // pushes the purple from "lavender" toward "nightshade"
      // without touching a single petal.
      vars: {
        '--c-bud':        'url(#sk-hexbloom-bud)',
        '--c-bud-pale':   '#C69BEA',
        '--c-bud-shade':  '#331353',
        '--c-calyx':      '#4C7A52',
        '--c-stem':       '#3F6B57',
        '--c-stem-light': '#6FA37E',
        '--c-shadow':     'rgba(24,6,40,0.22)',
      },
      // The hat lands on the `top` anchor, so it perches on the tip
      // whorl and grows with the spike instead of being pinned to a
      // fixed height. The acid-green glints are the only warm-free
      // accent in the skin — they read as fumes off the flask.
      extras: {
        1: function (a) {
          return skinPotion(a.base[0] - 10, a.base[1], 0.5, '#CDBEE8', '#79E86A', '#A8763F', '#F0E6FF') +
                 skinSparkle(a.canopy[0] + 8, a.canopy[1] - 5, 1.8, '#8CFF6B', 0.8);
        },
        2: function (a) {
          return skinPotion(a.base[0] - 12, a.base[1] + 0.5, 0.64, '#CDBEE8', '#79E86A', '#A8763F', '#F0E6FF') +
                 skinWitchHat(a.top[0] + 2, a.top[1] + 1.5, 13, -15, '#31164A', '#1E0C30', '#160823', '#CDA84E') +
                 skinSparkle(a.canopy[0] - 11, a.canopy[1] + 2, 2.1, '#8CFF6B', 0.8) +
                 skinDot(a.base[0] - 8, a.base[1] - 7, 0.8, '#8CFF6B', 0.6);
        },
        3: function (a) {
          return skinPotion(a.base[0] - 14, a.base[1] + 0.5, 0.82, '#CDBEE8', '#79E86A', '#A8763F', '#F0E6FF') +
                 skinPotion(a.base[0] + 12, a.base[1] + 1, 0.54, '#C4B2E4', '#C87BF0', '#8E6234', '#F0E6FF') +
                 skinWitchHat(a.top[0] + 2.5, a.top[1] + 1, 18, -14, '#31164A', '#1E0C30', '#160823', '#CDA84E') +
                 skinSparkle(a.canopy[0] - 13, a.canopy[1] - 6, 2.6, '#8CFF6B', 0.85) +
                 skinSparkle(a.canopy[0] + 13, a.canopy[1] + 8, 1.8, '#8CFF6B', 0.7) +
                 skinDot(a.base[0] - 10, a.base[1] - 12, 1.0, '#8CFF6B', 0.55) +
                 skinDot(a.base[0] - 7, a.base[1] - 17, 0.7, '#8CFF6B', 0.4);
        },
      },
    },
    {
      id: 'glitterball',
      name: 'Glitterball',
      note: 'Mirror-tiled whorls under a very small ball.',
      swatch: ['#FF6BC0', '#3FD8E8', '#3A1160'],
      // Patterns rather than gradients, because the brief here is
      // texture: a checker of two tones on a 3.2-unit tile, turned
      // off-axis so the tiles read as diamond facets catching light.
      // patternUnits is userSpaceOnUse so the facet size stays
      // constant across every bract instead of stretching to fit
      // each one. Two hues only — hot magenta against cyan — which
      // is what keeps this from drifting toward the prism skin.
      defs:
        '<pattern id="sk-glitterball-mag" width="3.2" height="3.2"' +
          ' patternUnits="userSpaceOnUse" patternTransform="rotate(18)">' +
          '<rect width="3.2" height="3.2" fill="#E0348F"/>' +
          '<rect width="1.6" height="1.6" fill="#FF6BC0"/>' +
          '<rect x="1.6" y="1.6" width="1.6" height="1.6" fill="#A82678"/>' +
        '</pattern>' +
        '<pattern id="sk-glitterball-cyan" width="3.2" height="3.2"' +
          ' patternUnits="userSpaceOnUse" patternTransform="rotate(-24)">' +
          '<rect width="3.2" height="3.2" fill="#43D3E6"/>' +
          '<rect width="1.6" height="1.6" fill="#9BF4FA"/>' +
          '<rect x="1.6" y="1.6" width="1.6" height="1.6" fill="#2A96BE"/>' +
        '</pattern>',
      vars: {
        '--c-bud':        'url(#sk-glitterball-mag)',
        '--c-bud-pale':   'url(#sk-glitterball-cyan)',
        '--c-bud-shade':  '#3A1160',
        '--c-calyx':      '#7A4BD8',
        '--c-stem':       '#7C7AAE',
        '--c-stem-light': '#BDBBDE',
        '--c-shadow':     'rgba(30,0,50,0.22)',
      },
      // Stage by stage: one note, then the stack arrives, then the
      // ball drops in on a cord from the top of the frame. The ball
      // hangs off to the right so it never sits on the spike tip.
      extras: {
        1: function (a) {
          return skinNote(a.canopy[0] + 11, a.canopy[1] - 3, 0.38, 12, '#43D3E6') +
                 skinSparkle(a.canopy[0] - 9, a.canopy[1] - 6, 1.7, '#FFD9F0', 0.8);
        },
        2: function (a) {
          return skinSpeaker(a.base[0] - 15, a.base[1] + 0.5, 0.6, -4, '#2A1140', '#180726', '#FF6BC0', '#43D3E6') +
                 skinNote(a.canopy[0] + 12, a.canopy[1] - 5, 0.44, 14, '#FF6BC0', true) +
                 skinNote(a.canopy[0] - 12, a.canopy[1] + 8, 0.34, -12, '#43D3E6') +
                 skinSparkle(a.canopy[0] + 8, a.canopy[1] + 12, 1.6, '#FFD9F0', 0.7);
        },
        3: function (a) {
          return skinSpeaker(a.base[0] - 16, a.base[1] + 0.5, 0.72, -5, '#2A1140', '#180726', '#FF6BC0', '#43D3E6') +
                 skinSpeaker(a.base[0] + 15, a.base[1] + 1, 0.5, 6, '#241038', '#150620', '#43D3E6', '#FF6BC0') +
                 skinNote(a.canopy[0] - 14, a.canopy[1] - 8, 0.5, -14, '#FF6BC0', true) +
                 skinNote(a.canopy[0] + 13, a.canopy[1] + 6, 0.4, 16, '#43D3E6') +
                 skinNote(a.canopy[0] + 9, a.canopy[1] - 22, 0.32, 8, '#FFD9F0') +
                 skinSparkle(a.canopy[0] - 11, a.canopy[1] + 14, 1.8, '#FFD9F0', 0.7);
        },
      },
    },
  ],

  chores: [
    {
      id: 'classic',
      name: 'Green Culm',
      note: 'The bamboo as first grown.',
      swatch: ['#C6E4A2', '#93C86E', '#B79A6A'],
      vars: {},
    },
    {
      // Gilded, not yellow. The culm gradient runs dark-bronze →
      // pale-gold → dark-bronze across each internode, so the
      // existing lit/shaded strips read as a turned metal rim
      // instead of flat paint, and the nodes drop to antique bronze
      // so the collars still separate the segments. Leaf gradients
      // run base-to-tip, which is the direction leaf() already draws
      // in, so every blade catches light at the stem and cools off
      // toward the point.
      id: 'kintake',
      name: 'Kintake',
      note: 'Gilded culms, sunlit blades.',
      swatch: ['#FBE9A6', '#C9902A', '#7C5410'],
      defs:
        '<linearGradient id="sk-kintake-culm" x1="0" y1="0" x2="1" y2="0">' +
          '<stop offset="0" stop-color="#8A5F16"/>' +
          '<stop offset="0.28" stop-color="#D9A93C"/>' +
          '<stop offset="0.5" stop-color="#FBE9A6"/>' +
          '<stop offset="0.72" stop-color="#C9902A"/>' +
          '<stop offset="1" stop-color="#7A5312"/>' +
        '</linearGradient>' +
        '<linearGradient id="sk-kintake-leaf" x1="0" y1="0" x2="1" y2="0">' +
          '<stop offset="0" stop-color="#F6E1A0"/>' +
          '<stop offset="0.55" stop-color="#DCB247"/>' +
          '<stop offset="1" stop-color="#A97C1E"/>' +
        '</linearGradient>',
      vars: {
        '--c-culm-light': '#FFE9A8',
        '--c-culm':       'url(#sk-kintake-culm)',
        '--c-culm-mid':   '#B0801F',
        '--c-node':       '#7C5410',
        '--c-node-dark':  '#4E340A',
        '--c-leaf-light': '#FBEBB4',
        '--c-leaf':       'url(#sk-kintake-leaf)',
        '--c-leaf-dark':  '#AE801F',
        '--c-shadow':     'rgba(96,66,8,0.20)',
      },
      extras: {
        1: function (a) {
          return skinSparkle(a.canopy[0] + 9, a.canopy[1] - 4, 2.0, '#FFF6D2', 0.75);
        },
        2: function (a) {
          return skinSparkle(a.canopy[0] - 11, a.canopy[1] - 6,  2.4, '#FFF6D2', 0.8) +
                 skinSparkle(a.canopy[0] + 12, a.canopy[1] + 12, 1.7, '#FFE9A6', 0.6) +
                 skinDot(a.canopy[0] + 4, a.canopy[1] - 14, 0.7, '#FFF6D2', 0.5);
        },
        3: function (a) {
          return skinSparkle(a.top[0] - 8,     a.top[1] + 6,     2.8, '#FFF6D2', 0.85) +
                 skinSparkle(a.canopy[0] + 13, a.canopy[1] - 2,  2.1, '#FFE9A6', 0.7) +
                 skinSparkle(a.canopy[0] - 12, a.canopy[1] + 18, 1.6, '#FFF6D2', 0.55) +
                 skinDot(a.canopy[0] + 6, a.canopy[1] + 26, 0.75, '#FFE9A6', 0.45);
        },
      },
    },
    {
      // Grow-a-Garden flavour: candy-saturated rather than pastel.
      // The culm gradient is vertical and left on object bounding
      // box units on purpose — culm() draws each internode as its
      // own path, so every segment runs the full spectrum and the
      // stalk bands up its whole height instead of smearing one long
      // fade that short stages would never show. Nodes go warm cream
      // with a pink seam so the bands stay separated, and the twigs
      // (which share --c-culm-mid) turn violet.
      id: 'prism',
      name: 'Prism Grove',
      note: 'Every internode a different band of light.',
      swatch: ['#FF6FB1', '#7BE38A', '#6E8BFF'],
      defs:
        '<linearGradient id="sk-prism-culm" x1="0" y1="0" x2="0" y2="1">' +
          '<stop offset="0" stop-color="#FF6FB1"/>' +
          '<stop offset="0.2" stop-color="#FFC24D"/>' +
          '<stop offset="0.4" stop-color="#7BE38A"/>' +
          '<stop offset="0.6" stop-color="#4FD6E8"/>' +
          '<stop offset="0.8" stop-color="#6E8BFF"/>' +
          '<stop offset="1" stop-color="#C46BFF"/>' +
        '</linearGradient>' +
        '<linearGradient id="sk-prism-leaf" x1="0" y1="0" x2="1" y2="0">' +
          '<stop offset="0" stop-color="#7BE8FF"/>' +
          '<stop offset="0.5" stop-color="#8BE87A"/>' +
          '<stop offset="1" stop-color="#FFD84F"/>' +
        '</linearGradient>' +
        '<linearGradient id="sk-prism-leaf-lo" x1="0" y1="0" x2="1" y2="0">' +
          '<stop offset="0" stop-color="#3FA8D8"/>' +
          '<stop offset="0.5" stop-color="#4FA85F"/>' +
          '<stop offset="1" stop-color="#C98A2E"/>' +
        '</linearGradient>',
      vars: {
        '--c-culm-light': '#FFF0FA',
        '--c-culm':       'url(#sk-prism-culm)',
        '--c-culm-mid':   '#8A5CE0',
        '--c-node':       '#FFF3C4',
        '--c-node-dark':  '#E0679F',
        // left flat on purpose: this token also strokes the leaf
        // midrib, and a horizontal line has a zero-height bounding
        // box, which would drop a bbox gradient entirely
        '--c-leaf-light': '#FFE7F4',
        '--c-leaf':       'url(#sk-prism-leaf)',
        '--c-leaf-dark':  'url(#sk-prism-leaf-lo)',
        '--c-shadow':     'rgba(120,60,180,0.16)',
      },
      extras: {
        1: function (a) {
          return skinSparkle(a.canopy[0] + 9, a.canopy[1] - 5, 2.2, '#FFF2A8', 0.8) +
                 skinDot(a.canopy[0] - 8, a.canopy[1] + 6, 0.9, '#7BE8FF', 0.65);
        },
        2: function (a) {
          return skinSparkle(a.canopy[0] - 12, a.canopy[1] - 8,  2.6, '#FF9AD8', 0.8) +
                 skinSparkle(a.canopy[0] + 12, a.canopy[1] + 10, 2.0, '#7BE8FF', 0.7) +
                 skinDot(a.canopy[0] + 4, a.canopy[1] - 16, 1.0, '#FFF2A8', 0.7);
        },
        3: function (a) {
          return skinSparkle(a.top[0] - 9,     a.top[1] + 10,    2.9, '#FFF2A8', 0.85) +
                 skinSparkle(a.canopy[0] + 13, a.canopy[1] - 4,  2.3, '#FF9AD8', 0.75) +
                 skinSparkle(a.canopy[0] - 13, a.canopy[1] + 16, 1.9, '#7BE8FF', 0.65) +
                 skinDot(a.canopy[0] + 7, a.canopy[1] + 28, 1.0,  '#B98BFF', 0.6) +
                 skinDot(a.canopy[0] - 6, a.canopy[1] - 14, 0.85, '#8BE87A', 0.5);
        },
      },
    },
    {
      id: 'kurotake',
      name: 'Kurotake',
      note: 'Black bamboo with jade leaves.',
      swatch: ['#4A4A46', '#232322', '#5FA37E'],
      defs:
        '<linearGradient id="sk-kurotake-culm" x1="0" y1="0" x2="1" y2="0">' +
          '<stop offset="0" stop-color="#22221F"/>' +
          '<stop offset="0.55" stop-color="#494945"/>' +
          '<stop offset="1" stop-color="#2A2A27"/>' +
        '</linearGradient>',
      vars: {
        '--c-culm-light': '#55554F',
        '--c-culm':       'url(#sk-kurotake-culm)',
        '--c-culm-mid':   '#33332F',
        '--c-node':       '#1A1A18',
        '--c-node-dark':  '#0E0E0D',
        '--c-leaf-light': '#7FBF9A',
        '--c-leaf':       '#5FA37E',
        '--c-leaf-dark':  '#3F7A62',
        '--c-shadow':     'rgba(0,0,0,0.24)',
      },
      extras: {
        2: function (a) {
          return skinDot(a.canopy[0] - 9, a.canopy[1] + 10, 0.8, '#C6A25A', 0.55) +
                 skinDot(a.canopy[0] + 8, a.canopy[1] + 20, 0.7, '#C6A25A', 0.4);
        },
        3: function (a) {
          return skinDot(a.canopy[0] - 13, a.canopy[1] + 12, 1.0, '#C6A25A', 0.6) +
                 skinDot(a.canopy[0] + 12, a.canopy[1] + 26, 0.85, '#C6A25A', 0.45) +
                 skinDot(a.canopy[0] + 2,  a.canopy[1] - 10, 0.75, '#C6A25A', 0.35);
        },
      },
    },
    {
      // Machined bamboo. The culm gradient is a tight specular band
      // — dark edge, hard bright core at 0.5, dark edge — which is
      // what turns a flat segment into a brushed metal plate, and
      // the node collars go gunmetal while --c-node-dark (the thin
      // stroke under each collar) goes cyan, so every joint reads as
      // a lit seam between plates. Leaves take a cyan → blue →
      // violet gradient along the blade for the holographic sheen.
      // The floating numbers are deliberately meaningless telemetry;
      // swap the strings for real stats if you ever want them live.
      id: 'nanotake',
      name: 'Nanotake',
      note: 'Plated culms, holographic blades, live telemetry.',
      swatch: ['#C7D6DF', '#2A3740', '#3BE8D8'],
      defs:
        '<linearGradient id="sk-nanotake-culm" x1="0" y1="0" x2="1" y2="0">' +
          '<stop offset="0" stop-color="#1B242B"/>' +
          '<stop offset="0.22" stop-color="#41525E"/>' +
          '<stop offset="0.42" stop-color="#8FA6B4"/>' +
          '<stop offset="0.5" stop-color="#C7D6DF"/>' +
          '<stop offset="0.58" stop-color="#8FA6B4"/>' +
          '<stop offset="0.8" stop-color="#33424C"/>' +
          '<stop offset="1" stop-color="#161D22"/>' +
        '</linearGradient>' +
        '<linearGradient id="sk-nanotake-leaf" x1="0" y1="0" x2="1" y2="0">' +
          '<stop offset="0" stop-color="#5CF2E0"/>' +
          '<stop offset="0.45" stop-color="#4FA8FF"/>' +
          '<stop offset="1" stop-color="#C46BFF"/>' +
        '</linearGradient>' +
        '<linearGradient id="sk-nanotake-leaf-lo" x1="0" y1="0" x2="1" y2="0">' +
          '<stop offset="0" stop-color="#1E7F8C"/>' +
          '<stop offset="0.5" stop-color="#2A5AB8"/>' +
          '<stop offset="1" stop-color="#6A3AA8"/>' +
        '</linearGradient>',
      vars: {
        '--c-culm-light': '#A9BEC9',
        '--c-culm':       'url(#sk-nanotake-culm)',
        '--c-culm-mid':   '#2A3740',
        '--c-node':       '#141C22',
        '--c-node-dark':  '#3BE8D8',
        '--c-leaf-light': '#BFF6FF',
        '--c-leaf':       'url(#sk-nanotake-leaf)',
        '--c-leaf-dark':  'url(#sk-nanotake-leaf-lo)',
        '--c-shadow':     'rgba(40,200,210,0.18)',
      },
      extras: {
        1: function (a) {
          return skinTrace(a.canopy[0] + 4, a.canopy[1] - 2, 7, -6, '#3BE8D8', 0.6) +
                 skinReadout(a.canopy[0] + 17, a.canopy[1] - 8, 3.4, '018', '#7FF3E6', 0.85);
        },
        2: function (a) {
          return skinTrace(a.canopy[0] + 5, a.canopy[1] + 6, 8, -8, '#3BE8D8', 0.6) +
                 skinReadout(a.canopy[0] + 19, a.canopy[1] - 2, 3.6, '2.48', '#7FF3E6', 0.85) +
                 skinTrace(a.canopy[0] - 5, a.canopy[1] - 10, -7, 6, '#3BE8D8', 0.5) +
                 skinReadout(a.canopy[0] - 18, a.canopy[1] - 4, 3.2, '061', '#9FD8FF', 0.75);
        },
        3: function (a) {
          return skinTrace(a.canopy[0] + 5, a.canopy[1] + 10, 9, -9, '#3BE8D8', 0.6) +
                 skinReadout(a.canopy[0] + 20, a.canopy[1] + 1, 3.8, '100%', '#7FF3E6', 0.9) +
                 skinTrace(a.canopy[0] - 5, a.canopy[1] - 8, -8, 7, '#3BE8D8', 0.55) +
                 skinReadout(a.canopy[0] - 19, a.canopy[1] - 1, 3.4, '07.4', '#9FD8FF', 0.8) +
                 skinReadout(a.top[0] + 13, a.top[1] + 8, 3.2, '+2.1', '#C9A8FF', 0.65) +
                 skinDot(a.canopy[0] - 14, a.canopy[1] + 22, 0.8, '#3BE8D8', 0.5);
        },
      },
    },
  ],

  finance: [
    {
      id: 'classic',
      name: 'Field Clover',
      note: 'The clover as first grown.',
      swatch: ['#5C8267', '#274F3C', '#0F291E'],
      vars: {},
    },
    {
      // Gilding, not gold plate: the leaflets keep their two-tone
      // split, but the lit half runs from struck amber up to pale
      // gold so each lobe catches the light at a different angle.
      // The drifting motes are flakes of gold leaf coming loose.
      id: 'goldleaf',
      name: 'Gold Leaf',
      note: 'Beaten thin and gilded, hammer marks and all.',
      swatch: ['#F0C558', '#9C6B1E', '#4A2F0B'],
      defs:
        '<linearGradient id="sk-goldleaf-leaf" x1="0" y1="1" x2="0.35" y2="0">' +
          '<stop offset="0" stop-color="#B7791F"/>' +
          '<stop offset="0.55" stop-color="#E8B948"/>' +
          '<stop offset="1" stop-color="#F8DE8B"/>' +
        '</linearGradient>' +
        '<linearGradient id="sk-goldleaf-mid" x1="0" y1="1" x2="0.5" y2="0">' +
          '<stop offset="0" stop-color="#8F5D16"/>' +
          '<stop offset="1" stop-color="#DDAA3C"/>' +
        '</linearGradient>',
      vars: {
        '--c-leaf':      'url(#sk-goldleaf-leaf)',
        '--c-leaf-mid':  'url(#sk-goldleaf-mid)',
        '--c-leaf-dark': '#9C6B1E',
        '--c-outline':   '#4A2F0B',
        '--c-sheen':     '#FFF3CD',
        '--c-bloom':     '#FFEBA8',
        '--c-shadow':    'rgba(74,47,11,0.20)',
      },
      extras: {
        1: function (a) {
          return skinSparkle(a.canopy[0] + 12, a.canopy[1] - 13, 1.6, '#FFF3CD', 0.75);
        },
        2: function (a) {
          return skinSparkle(a.canopy[0] - 16, a.canopy[1] - 15, 2.1, '#FFF3CD', 0.8) +
                 skinSparkle(a.canopy[0] + 15, a.canopy[1] - 3, 1.5, '#FFEBA8', 0.6) +
                 skinLeafMote(a.canopy[0] + 19, a.canopy[1] + 14, 28, 0.5, '#E8B948', 0.5);
        },
        3: function (a) {
          return skinSparkle(a.canopy[0] - 23, a.canopy[1] - 20, 2.6, '#FFF3CD', 0.85) +
                 skinSparkle(a.canopy[0] + 22, a.canopy[1] - 7, 1.9, '#FFEBA8', 0.65) +
                 skinSparkle(a.canopy[0] + 4,  a.canopy[1] - 34, 1.6, '#FFFFFF', 0.5) +
                 skinLeafMote(a.canopy[0] - 21, a.canopy[1] + 26, 34, 0.62, '#E8B948', 0.55) +
                 skinLeafMote(a.canopy[0] + 24, a.canopy[1] + 18, -27, 0.52, '#F8DE8B', 0.45);
        },
      },
    },
    {
      // Every leaflet is cut from the same spectrum, but the two
      // halves pull from gradients offset against each other, so the
      // fan of lobes never lands on the same hue twice. The dark
      // half stays a deepened spectrum rather than grey, which keeps
      // the shading colourful instead of muddy.
      id: 'prismsprig',
      name: 'Prism Sprig',
      note: 'Splits the light, keeps the leaf.',
      swatch: ['#FFE45C', '#63D97A', '#B266E8'],
      defs:
        '<linearGradient id="sk-prismsprig-leaf" x1="0" y1="1" x2="1" y2="0">' +
          '<stop offset="0" stop-color="#FF5D5D"/>' +
          '<stop offset="0.2" stop-color="#FFA24B"/>' +
          '<stop offset="0.4" stop-color="#FFE45C"/>' +
          '<stop offset="0.6" stop-color="#63D97A"/>' +
          '<stop offset="0.8" stop-color="#4FA8F5"/>' +
          '<stop offset="1" stop-color="#B266E8"/>' +
        '</linearGradient>' +
        '<linearGradient id="sk-prismsprig-mid" x1="0.1" y1="1" x2="0.9" y2="0">' +
          '<stop offset="0" stop-color="#FFA24B"/>' +
          '<stop offset="0.25" stop-color="#FFE45C"/>' +
          '<stop offset="0.5" stop-color="#63D97A"/>' +
          '<stop offset="0.75" stop-color="#4FA8F5"/>' +
          '<stop offset="1" stop-color="#B266E8"/>' +
        '</linearGradient>' +
        '<linearGradient id="sk-prismsprig-dark" x1="0" y1="1" x2="0.8" y2="0">' +
          '<stop offset="0" stop-color="#C93F6A"/>' +
          '<stop offset="0.35" stop-color="#2FA85C"/>' +
          '<stop offset="0.7" stop-color="#2E6FD1"/>' +
          '<stop offset="1" stop-color="#7A3FC0"/>' +
        '</linearGradient>',
      vars: {
        '--c-leaf':      'url(#sk-prismsprig-leaf)',
        '--c-leaf-mid':  'url(#sk-prismsprig-mid)',
        '--c-leaf-dark': 'url(#sk-prismsprig-dark)',
        '--c-outline':   '#4A2C6E',
        '--c-sheen':     '#FFFFFF',
        '--c-bloom':     '#FFFFFF',
        '--c-shadow':    'rgba(74,44,110,0.18)',
      },
      extras: {
        1: function (a) {
          return skinSparkle(a.canopy[0] + 11, a.canopy[1] - 12, 1.6, '#FFE45C', 0.8) +
                 skinDot(a.canopy[0] - 10, a.canopy[1] - 4, 0.7, '#4FA8F5', 0.65);
        },
        2: function (a) {
          return skinSparkle(a.canopy[0] - 15, a.canopy[1] - 15, 2.1, '#FF5D5D', 0.7) +
                 skinSparkle(a.canopy[0] + 14, a.canopy[1] - 3, 1.7, '#4FA8F5', 0.7) +
                 skinDot(a.canopy[0] + 8, a.canopy[1] - 24, 0.8, '#FFE45C', 0.7);
        },
        3: function (a) {
          return skinSparkle(a.canopy[0] - 22, a.canopy[1] - 19, 2.6, '#FF5D5D', 0.75) +
                 skinSparkle(a.canopy[0] + 21, a.canopy[1] - 6, 2.0, '#63D97A', 0.7) +
                 skinSparkle(a.canopy[0] + 5,  a.canopy[1] - 35, 1.8, '#B266E8', 0.7) +
                 skinDot(a.canopy[0] - 12, a.canopy[1] + 30, 0.9, '#FFA24B', 0.6) +
                 skinDot(a.canopy[0] + 16, a.canopy[1] + 24, 0.8, '#4FA8F5', 0.6);
        },
      },
    },
    {
      id: 'wildfrost',
      name: 'Wildfrost',
      note: 'Frozen mid-morning, edges still rimed.',
      swatch: ['#DCEEF4', '#8FBCCB', '#39586B'],
      defs:
        '<linearGradient id="sk-wildfrost-leaf" x1="0" y1="1" x2="0.4" y2="0">' +
          '<stop offset="0" stop-color="#7FAABB"/>' +
          '<stop offset="1" stop-color="#CDE7F0"/>' +
        '</linearGradient>',
      vars: {
        '--c-leaf':      'url(#sk-wildfrost-leaf)',
        '--c-leaf-mid':  '#7FA9BA',
        '--c-leaf-dark': '#547E93',
        '--c-outline':   '#2E4A5C',
        '--c-sheen':     '#EAF6FA',
        '--c-bloom':     '#FFFFFF',
        '--c-shadow':    'rgba(28,58,78,0.18)',
      },
      extras: {
        1: function (a) {
          return skinSparkle(a.canopy[0] + 9, a.canopy[1] - 12, 1.5, '#FFFFFF', 0.7);
        },
        2: function (a) {
          return skinSparkle(a.canopy[0] - 14, a.canopy[1] - 14, 2.0, '#FFFFFF', 0.75) +
                 skinSparkle(a.canopy[0] + 13, a.canopy[1] - 4, 1.5, '#FFFFFF', 0.55);
        },
        3: function (a) {
          return skinSparkle(a.canopy[0] - 19, a.canopy[1] - 16, 2.5, '#FFFFFF', 0.8) +
                 skinSparkle(a.canopy[0] + 18, a.canopy[1] - 6, 1.8, '#FFFFFF', 0.6) +
                 skinSparkle(a.canopy[0] + 3,  a.canopy[1] - 30, 1.5, '#FFFFFF', 0.45);
        },
      },
    },
    {
      // The luck skin: leaflets in a bright meadow green, a coin or
      // two working their way up out of the soil, and by full growth
      // an arc that comes down to the left of the plant and lands in
      // the pot rather than floating decoratively behind it.
      id: 'rainbowsend',
      name: "Rainbow's End",
      note: 'Bright green, a full pot, and the arc that pointed here.',
      swatch: ['#4FCB6E', '#1F7A44', '#F0C558'],
      defs:
        '<linearGradient id="sk-rainbowsend-leaf" x1="0" y1="1" x2="0.35" y2="0">' +
          '<stop offset="0" stop-color="#2E9E52"/>' +
          '<stop offset="1" stop-color="#8CEB95"/>' +
        '</linearGradient>' +
        '<linearGradient id="sk-rainbowsend-mid" x1="0" y1="1" x2="0.5" y2="0">' +
          '<stop offset="0" stop-color="#237F44"/>' +
          '<stop offset="1" stop-color="#59C86F"/>' +
        '</linearGradient>',
      vars: {
        '--c-leaf':      'url(#sk-rainbowsend-leaf)',
        '--c-leaf-mid':  'url(#sk-rainbowsend-mid)',
        '--c-leaf-dark': '#1F7A44',
        '--c-outline':   '#0C3A22',
        '--c-sheen':     '#E4FFE9',
        '--c-bloom':     '#FFE9A0',
        '--c-shadow':    'rgba(12,58,34,0.20)',
      },
      extras: {
        0: function (a) {
          return skinCoin(a.base[0] + 12, a.base[1] - 1, 2.2, '#F0C558', '#B7791F', '#FFF3CD', -14);
        },
        1: function (a) {
          return skinCoin(a.base[0] + 14, a.base[1] - 1.5, 2.4, '#F0C558', '#B7791F', '#FFF3CD', 9) +
                 skinCoin(a.base[0] - 14, a.base[1] - 0.5, 1.8, '#E8B948', '#9C6B1E', null, -22) +
                 skinSparkle(a.canopy[0] + 11, a.canopy[1] - 13, 1.5, '#FFF3CD', 0.7);
        },
        2: function (a) {
          return skinPot(a.base[0] - 22, a.base[1] + 2.5, 0.62,
                         '#33302E', '#1C1A19', '#4A4644', '#F0C558', '#FFF3CD') +
                 skinCoin(a.base[0] + 19, a.base[1] - 1, 2.5, '#F0C558', '#B7791F', '#FFF3CD', 12) +
                 skinSparkle(a.canopy[0] + 14, a.canopy[1] - 6, 1.7, '#FFF3CD', 0.65) +
                 skinSparkle(a.canopy[0] - 15, a.canopy[1] - 16, 2.0, '#E4FFE9', 0.55);
        },
        3: function (a) {
          return skinRainbowArc(a.base[0] + 6, a.base[1] + 3, 33, 180, 132, 1.8, 0.5) +
                 skinPot(a.base[0] - 25, a.base[1] + 3.5, 0.95,
                         '#33302E', '#1C1A19', '#4A4644', '#F0C558', '#FFF3CD') +
                 skinCoin(a.base[0] + 22, a.base[1] + 0.5, 2.7, '#F0C558', '#B7791F', '#FFF3CD', -8) +
                 skinCoin(a.base[0] + 17, a.base[1] + 1.5, 2.0, '#E8B948', '#9C6B1E', null, 18) +
                 skinSparkle(a.canopy[0] + 21, a.canopy[1] - 7, 2.0, '#FFF3CD', 0.7) +
                 skinSparkle(a.canopy[0] - 21, a.canopy[1] - 19, 2.5, '#E4FFE9', 0.6) +
                 skinSparkle(a.canopy[0] + 4,  a.canopy[1] - 34, 1.6, '#FFFFFF', 0.5);
        },
      },
    },
  ],

 misc: [
    {
      id: 'classic',
      name: 'Coral Cap',
      note: 'The mushroom as first grown.',
      swatch: ['#E4715E', '#C4574A', '#F7E9DE'],
      vars: {},
    },

    // ---- Sunstruck -------------------------------------------------
    // Warm gilded cap over a pale honey stalk. The cap gradient runs
    // low-left to high-right so it agrees with the art's own lighting
    // instead of fighting it; the shaded face stays flat so the metal
    // reads as burnished rather than glassy.
    {
      id: 'sunstruck',
      name: 'Sunstruck',
      note: 'Caught a low sunbeam and never gave it back.',
      swatch: ['#E4B451', '#A87528', '#FFF8E2'],
      defs:
        '<linearGradient id="sk-sunstruck-cap" x1="0.12" y1="1" x2="0.72" y2="0">' +
          '<stop offset="0" stop-color="#C68E2C"/>' +
          '<stop offset="0.55" stop-color="#E4B451"/>' +
          '<stop offset="1" stop-color="#F6D67F"/>' +
        '</linearGradient>' +
        '<linearGradient id="sk-sunstruck-stem" x1="0" y1="0" x2="1" y2="0.25">' +
          '<stop offset="0" stop-color="#E8D5A4"/>' +
          '<stop offset="1" stop-color="#F7EACB"/>' +
        '</linearGradient>',
      vars: {
        '--c-cap-light':  '#FCEBA8',
        '--c-cap':        'url(#sk-sunstruck-cap)',
        '--c-cap-dark':   '#A87528',
        '--c-spot':       '#FFF8E2',
        '--c-stem-light': 'url(#sk-sunstruck-stem)',
        '--c-stem':       '#DEC48F',
        '--c-stem-dark':  '#AE8F52',
        '--c-shadow':     'rgba(104,74,22,0.16)',
      },
      extras: {
        0: function (a) {
          return skinSparkle(a.top[0] + 7, a.top[1] - 1, 1.2, '#FFF6D8', 0.7);
        },
        1: function (a) {
          return skinSparkle(a.top[0] + 11, a.top[1] - 3, 1.7, '#FFF6D8', 0.8) +
                 skinSparkle(a.top[0] - 12, a.top[1] + 7, 1.2, '#FFF6D8', 0.5);
        },
        2: function (a) {
          return skinSparkle(a.top[0] + 16, a.top[1] - 4, 2.2, '#FFF6D8', 0.8) +
                 skinSparkle(a.top[0] - 18, a.top[1] + 9, 1.6, '#FFF6D8', 0.55) +
                 skinSparkle(a.top[0] + 2,  a.top[1] - 9, 1.3, '#FFFDF0', 0.45);
        },
        3: function (a) {
          return skinSparkle(a.top[0] + 22, a.top[1] - 4, 2.7, '#FFF6D8', 0.85) +
                 skinSparkle(a.top[0] - 24, a.top[1] + 12, 2.0, '#FFF6D8', 0.6) +
                 skinSparkle(a.top[0] + 4,  a.top[1] - 11, 1.6, '#FFFDF0', 0.5) +
                 skinSparkle(a.top[0] - 9,  a.canopy[1] + 16, 1.3, '#FFF6D8', 0.4);
        },
      },
    },

    // ---- Prismcap --------------------------------------------------
    // The rainbow is carried by three parallel gradients — base, shade
    // and highlight — all with the same stop positions, so the spectrum
    // stays continuous across the cap's three faces instead of breaking
    // at the shading seam. Object-bounding-box units mean every growth
    // stage gets the full sweep rather than a slice of it.
    {
      id: 'prismcap',
      name: 'Prismcap',
      note: 'Every colour it considered, worn all at once.',
      swatch: ['#F08A8A', '#93D6A2', '#B49BE0'],
      defs:
        '<linearGradient id="sk-prismcap-cap" x1="0" y1="0.15" x2="1" y2="0">' +
          '<stop offset="0"    stop-color="#F08A8A"/>' +
          '<stop offset="0.2"  stop-color="#F3C079"/>' +
          '<stop offset="0.4"  stop-color="#EFE18A"/>' +
          '<stop offset="0.6"  stop-color="#93D6A2"/>' +
          '<stop offset="0.8"  stop-color="#86C4E8"/>' +
          '<stop offset="1"    stop-color="#B49BE0"/>' +
        '</linearGradient>' +
        '<linearGradient id="sk-prismcap-cap-dark" x1="0" y1="0.15" x2="1" y2="0">' +
          '<stop offset="0"    stop-color="#C4696E"/>' +
          '<stop offset="0.2"  stop-color="#C69457"/>' +
          '<stop offset="0.4"  stop-color="#C0B45F"/>' +
          '<stop offset="0.6"  stop-color="#69A87B"/>' +
          '<stop offset="0.8"  stop-color="#6096BC"/>' +
          '<stop offset="1"    stop-color="#8873B3"/>' +
        '</linearGradient>' +
        '<linearGradient id="sk-prismcap-cap-light" x1="0" y1="0.15" x2="1" y2="0">' +
          '<stop offset="0"    stop-color="#FBB9B4"/>' +
          '<stop offset="0.2"  stop-color="#F9D9A6"/>' +
          '<stop offset="0.4"  stop-color="#F7F0B8"/>' +
          '<stop offset="0.6"  stop-color="#BAE7C6"/>' +
          '<stop offset="0.8"  stop-color="#B4DDF2"/>' +
          '<stop offset="1"    stop-color="#D3C3EE"/>' +
        '</linearGradient>' +
        '<linearGradient id="sk-prismcap-stem" x1="0" y1="0" x2="1" y2="0.3">' +
          '<stop offset="0" stop-color="#EFE0EE"/>' +
          '<stop offset="1" stop-color="#FDF4F9"/>' +
        '</linearGradient>',
      vars: {
        '--c-cap-light':  'url(#sk-prismcap-cap-light)',
        '--c-cap':        'url(#sk-prismcap-cap)',
        '--c-cap-dark':   'url(#sk-prismcap-cap-dark)',
        '--c-spot':       '#FEF9FF',
        '--c-stem-light': 'url(#sk-prismcap-stem)',
        '--c-stem':       '#E7D5E4',
        '--c-stem-dark':  '#BDA5BF',
        '--c-shadow':     'rgba(92,70,110,0.16)',
      },
      extras: {
        1: function (a) {
          return skinSparkle(a.top[0] + 12, a.top[1] - 2, 1.6, '#FFFFFF', 0.75) +
                 skinDot(a.top[0] - 12, a.top[1] + 8, 0.9, '#B49BE0', 0.6);
        },
        2: function (a) {
          return skinSparkle(a.top[0] - 17, a.top[1] - 3, 2.1, '#FFFFFF', 0.8) +
                 skinSparkle(a.top[0] + 17, a.top[1] + 6, 1.5, '#FFFFFF', 0.55) +
                 skinDot(a.top[0] + 6, a.top[1] - 8, 1.1, '#86C4E8', 0.65) +
                 skinDot(a.top[0] - 8, a.canopy[1] + 14, 0.9, '#F3C079', 0.55);
        },
        3: function (a) {
          return skinSparkle(a.top[0] - 22, a.top[1] - 3, 2.6, '#FFFFFF', 0.85) +
                 skinSparkle(a.top[0] + 21, a.top[1] + 8, 1.9, '#FFFFFF', 0.6) +
                 skinDot(a.top[0] + 8, a.top[1] - 10, 1.4, '#86C4E8', 0.7) +
                 skinDot(a.top[0] - 13, a.top[1] - 7, 1.1, '#F08A8A', 0.6) +
                 skinDot(a.top[0] + 15, a.canopy[1] + 20, 1.0, '#93D6A2', 0.5);
        },
      },
    },

    // ---- Sugar Spin ------------------------------------------------
    // Lollipop cap and candy-cane stalk. The cap rings are a radial
    // gradient with paired hard stops, so the bands stay concentric at
    // any stage size without new art. The three stalk patterns share
    // one geometry in user space, which is what makes the stripes run
    // unbroken across the lit, mid and shaded faces.
    {
      id: 'sugarspin',
      name: 'Sugar Spin',
      note: 'Pulled, twisted, and left to set on the sill.',
      swatch: ['#EE8FA4', '#FBEAEF', '#9FE3C0'],
      defs:
        '<radialGradient id="sk-sugarspin-swirl" cx="0.46" cy="0.62" r="0.62">' +
          '<stop offset="0"    stop-color="#FDF0F4"/>' +
          '<stop offset="0.17" stop-color="#FDF0F4"/>' +
          '<stop offset="0.17" stop-color="#F08FA6"/>' +
          '<stop offset="0.34" stop-color="#F08FA6"/>' +
          '<stop offset="0.34" stop-color="#FDF0F4"/>' +
          '<stop offset="0.51" stop-color="#FDF0F4"/>' +
          '<stop offset="0.51" stop-color="#F08FA6"/>' +
          '<stop offset="0.68" stop-color="#F08FA6"/>' +
          '<stop offset="0.68" stop-color="#FDF0F4"/>' +
          '<stop offset="0.85" stop-color="#FDF0F4"/>' +
          '<stop offset="0.85" stop-color="#F08FA6"/>' +
          '<stop offset="1"    stop-color="#F08FA6"/>' +
        '</radialGradient>' +
        '<pattern id="sk-sugarspin-cane" width="6.4" height="6.4"' +
          ' patternUnits="userSpaceOnUse" patternTransform="rotate(34)">' +
          '<rect width="6.4" height="6.4" fill="#FBEAEF"/>' +
          '<rect width="3.2" height="6.4" fill="#EE8FA4"/>' +
        '</pattern>' +
        '<pattern id="sk-sugarspin-cane-lt" width="6.4" height="6.4"' +
          ' patternUnits="userSpaceOnUse" patternTransform="rotate(34)">' +
          '<rect width="6.4" height="6.4" fill="#FFF7FA"/>' +
          '<rect width="3.2" height="6.4" fill="#F8B6C4"/>' +
        '</pattern>' +
        '<pattern id="sk-sugarspin-cane-dk" width="6.4" height="6.4"' +
          ' patternUnits="userSpaceOnUse" patternTransform="rotate(34)">' +
          '<rect width="6.4" height="6.4" fill="#E0C7D1"/>' +
          '<rect width="3.2" height="6.4" fill="#CB6C85"/>' +
        '</pattern>',
      vars: {
        '--c-cap-light':  '#FDE4EB',
        '--c-cap':        'url(#sk-sugarspin-swirl)',
        '--c-cap-dark':   '#D0798F',
        '--c-spot':       '#FFFFFF',
        '--c-stem-light': 'url(#sk-sugarspin-cane-lt)',
        '--c-stem':       'url(#sk-sugarspin-cane)',
        '--c-stem-dark':  'url(#sk-sugarspin-cane-dk)',
        '--c-shadow':     'rgba(118,58,80,0.15)',
      },
      extras: {
        1:
          skinGumdrop(55, 121.2, 0.45, '#9FE3C0', '#E6FBF1'),
        2:
          skinGumdrop(59, 121.2, 0.62, '#9FE3C0', '#E6FBF1') +
          skinGumdrop(22, 121.2, 0.46, '#F8DC7E', '#FFF4C8'),
        3:
          skinGumdrop(64, 121.2, 0.80, '#9FE3C0', '#E6FBF1') +
          skinGumdrop(56.5, 121.2, 0.50, '#E48FB4', '#FBDCE8') +
          skinGumdrop(17, 121.2, 0.62, '#F8DC7E', '#FFF4C8'),
      },
    },

    // ---- Xenobloom -------------------------------------------------
    // Acid-green cap, pale sea-glass stalk. The feelers start at the
    // apex anchor and only ever travel upward, so they read as growing
    // out of the cap rather than being painted across it; the eyes sit
    // on the stalk in the cap's shadow, which is the one place on the
    // silhouette with room for them at every stage.
    {
      id: 'xenobloom',
      name: 'Xenobloom',
      note: 'Came down sometime last night. Seems friendly.',
      swatch: ['#7BD44F', '#2E7A3F', '#E8FFB0'],
      defs:
        '<linearGradient id="sk-xenobloom-cap" x1="0.1" y1="1" x2="0.75" y2="0">' +
          '<stop offset="0" stop-color="#4FA83A"/>' +
          '<stop offset="0.6" stop-color="#7BD44F"/>' +
          '<stop offset="1" stop-color="#A6EC6B"/>' +
        '</linearGradient>' +
        '<linearGradient id="sk-xenobloom-stem" x1="0" y1="0" x2="1" y2="0.25">' +
          '<stop offset="0" stop-color="#B7E2D5"/>' +
          '<stop offset="1" stop-color="#DCF4EA"/>' +
        '</linearGradient>',
      vars: {
        '--c-cap-light':  '#C3F58A',
        '--c-cap':        'url(#sk-xenobloom-cap)',
        '--c-cap-dark':   '#2E7A3F',
        '--c-spot':       '#E8FFB0',
        '--c-stem-light': 'url(#sk-xenobloom-stem)',
        '--c-stem':       '#9FD3C6',
        '--c-stem-dark':  '#6BA398',
        '--c-shadow':     'rgba(30,88,52,0.18)',
      },
      extras: {
        0: function (a) {
          return skinDot(a.top[0] + 6, a.top[1] + 1, 1.0, '#E8FFB0', 0.55);
        },
        1: function (a) {
          return skinAntenna(a.top[0] - 3, a.top[1] + 2.5, 8, -0.34, '#5FA83E', '#E8FFB0') +
                 skinAntenna(a.top[0] + 3, a.top[1] + 2.5, 7, 0.40, '#5FA83E', '#E8FFB0') +
                 skinAlienEye(37.2, 113, 1.7, '#17402F', '#CFF8D8') +
                 skinAlienEye(43.0, 113, 1.5, '#17402F', '#CFF8D8');
        },
        2: function (a) {
          return skinAntenna(a.top[0] - 4, a.top[1] + 3, 11, -0.34, '#5FA83E', '#E8FFB0') +
                 skinAntenna(a.top[0] + 4, a.top[1] + 3, 9.5, 0.42, '#5FA83E', '#E8FFB0') +
                 skinAlienEye(36.4, 104.0, 2.4, '#17402F', '#CFF8D8') +
                 skinAlienEye(44.0, 104.5, 2.1, '#17402F', '#CFF8D8') +
                 skinDot(a.top[0] + 19, a.canopy[1] + 4, 1.1, '#CFF56E', 0.45);
        },
        3: function (a) {
          return skinAntenna(a.top[0] - 5, a.top[1] + 3.5, 15, -0.32, '#5FA83E', '#E8FFB0') +
                 skinAntenna(a.top[0] + 5, a.top[1] + 3.5, 13, 0.40, '#5FA83E', '#E8FFB0') +
                 skinAlienEye(35.0, 96.0, 3.3, '#17402F', '#CFF8D8') +
                 skinAlienEye(45.4, 97.0, 2.9, '#17402F', '#CFF8D8') +
                 skinDot(a.top[0] + 25, a.canopy[1] - 2, 1.4, '#CFF56E', 0.45) +
                 skinDot(a.top[0] - 24, a.canopy[1] + 12, 1.1, '#CFF56E', 0.35);
        },
      },
    },
  ],
};


// ---- Skin lookup + application -----------------------------------

function getSkinsFor(catId) {
  return PLANT_SKINS[catId] || PLANT_SKINS.misc;
}

// Always returns a real skin: an unknown or removed skin id falls
// back to that species' first entry rather than rendering nothing.
function getSkin(catId, skinId) {
  var list = getSkinsFor(catId);
  var found = null;
  list.forEach(function (s) { if (s.id === skinId) found = s; });
  return found || list[0];
}

// ---- Skin unlocks -------------------------------------------------
// A skin is earned, not just chosen. Which achievement gates which
// skin is decided purely by the slot it sits in — the same order the
// picker paints, documented up by SKIN_DEFAULT_ID — so a new species
// gets the whole ladder for free the moment its five skins are in
// the right order. Nothing here is per-species.
//
//   0  classic   always available. Every plant starts here and can
//                always be brought back here, so a garden can never
//                end up with a plant that has nothing legal to wear.
//   1  gold      3 friends      — account-wide
//   2  rainbow   7 friends      — account-wide
//   3  themed    10-day streak  — THIS plant
//   4  showcase  30 growth days — THIS plant
//
// Friends are account-wide because a friend count is: reaching 3
// friends lights the gold skin on every plant at once. The streak and
// growth gates are per-plant, so each plant earns its own top two.
//
// Every gate is monotonic — it can be reached but not lost. That's
// deliberate, and it's why both per-plant gates read a high-water
// mark (maxStreak, maxGrowthDays) rather than the live counter:
// breaking a streak, or un-ticking today's box, must not strip a skin
// off a plant that already earned it.
var SKIN_UNLOCK_RULES = [
  { kind: 'always'                },
  { kind: 'friends', need: 3      },
  { kind: 'friends', need: 7      },
  { kind: 'streak',  need: 10     },
  { kind: 'growth',  need: 30     },
];

// Reads the live friend list owned by 06-friends.js. Guarded with
// typeof because this file loads first — if the friends listener
// hasn't populated it yet, or a signed-out visitor never starts one,
// the honest answer is zero rather than a crash. Duplicate and empty
// uids are ignored so a malformed friends array can't inflate the
// count past what the Friends page actually shows.
function getMyFriendCount() {
  if (typeof myFriendUids === 'undefined' || !Array.isArray(myFriendUids)) return 0;
  var seen = {};
  var total = 0;
  myFriendUids.forEach(function (uid) {
    if (typeof uid !== 'string' || uid === '') return;
    if (seen[uid]) return;
    seen[uid] = true;
    total++;
  });
  return total;
}

// High-water marks, not live values — see the note above. maxStreak
// is maintained by 02-auth-tasks.js; the Math.max against the live
// counter covers a task saved before that field existed.
function getTaskBestStreak(task) {
  if (!task) return 0;
  return Math.max(Number(task.maxStreak) || 0, Number(task.streak) || 0);
}

function getTaskBestGrowth(task) {
  if (!task) return 0;
  return Math.max(Number(task.maxGrowthDays) || 0, Number(task.totalGrowthDays) || 0);
}

// Which slot a skin occupies in its species' list. -1 for an id that
// isn't in the list at all.
function getSkinSlot(catId, skinId) {
  var list = getSkinsFor(catId);
  var slot = -1;
  list.forEach(function (s, i) { if (s.id === skinId) slot = i; });
  return slot;
}

// Everything the UI needs about one skin's gate, in one object, so
// the tile and its label can never disagree about whether it's open.
//
// A skin in a slot with no rule — a sixth skin appended to a species
// — comes back unlocked. Better a new skin that's simply available
// than one nobody can ever reach because its gate was forgotten.
function getSkinUnlockState(task, catId, skinId) {
  var skin = getSkin(catId, skinId);
  var slot = getSkinSlot(catId, skin.id);
  var rule = (slot >= 0 && SKIN_UNLOCK_RULES[slot]) || SKIN_UNLOCK_RULES[0];

  var have = 0;
  var need = rule.need || 0;

  if (rule.kind === 'friends')      have = getMyFriendCount();
  else if (rule.kind === 'streak')  have = getTaskBestStreak(task);
  else if (rule.kind === 'growth')  have = getTaskBestGrowth(task);

  return {
    skin:     skin,
    slot:     slot,
    kind:     rule.kind,
    need:     need,
    have:     have,
    unlocked: (rule.kind === 'always') || (have >= need),
  };
}

function isSkinUnlocked(task, catId, skinId) {
  return getSkinUnlockState(task, catId, skinId).unlocked;
}

function countUnlockedSkins(task, catId) {
  var total = 0;
  getSkinsFor(catId).forEach(function (skin) {
    if (isSkinUnlocked(task, catId, skin.id)) total++;
  });
  return total;
}

// What the tile says while it's still locked. Phrased as the thing to
// go and do, not as a rule being enforced.
function skinUnlockRequirement(state) {
  if (!state || state.unlocked) return '';
  if (state.kind === 'friends') {
    return 'Add ' + state.need + ' friend' + (state.need === 1 ? '' : 's') + ' to unlock';
  }
  if (state.kind === 'streak') {
    return 'Reach a ' + state.need + '-day streak on this plant';
  }
  if (state.kind === 'growth') {
    return 'Grow this plant for ' + state.need + ' days';
  }
  return 'Locked';
}

// "2 / 3" — capped at the target so an account with 40 friends
// doesn't read "40 / 3" on a tile that's already open.
function skinUnlockProgress(state) {
  if (!state || state.kind === 'always' || !state.need) return '';
  return Math.min(state.have, state.need) + ' / ' + state.need;
}


// The skin a plant actually WEARS, which is not always the skin its
// owner picked. Every renderer — the garden, the Greenhouse card, the
// pip on a task row — goes through here, so a locked skin has exactly
// one place it could leak from, and it doesn't.
//
// The stored task.skinId is left alone on purpose. In practice no
// gate can un-earn itself, but if one somehow did, the plant falls
// back to classic for as long as that lasts and returns to the
// owner's choice the moment it's earned again. Overwriting the saved
// id would quietly throw that choice away.
function getTaskSkinId(task) {
  var catId = (task && task.categoryId) || 'misc';
  // Resolve first, so an id that no longer exists at all comes back as
  // classic rather than being handed on to be resolved again later.
  var wanted = getSkin(catId, (task && task.skinId) || SKIN_DEFAULT_ID).id;
  if (wanted === SKIN_DEFAULT_ID) return SKIN_DEFAULT_ID;
  return isSkinUnlocked(task, catId, wanted) ? wanted : SKIN_DEFAULT_ID;
}

// Gradients and patterns live once in a hidden sprite in the page,
// not inside each plant's <svg>. Two plants can then reference the
// same gradient, and the crossfade between growth stages — which has
// two copies of the art on screen at once — can't produce duplicate
// element ids.
var injectedSkinDefs = {};

function ensureSkinDefs(catId, skin) {
  if (!skin || !skin.defs) return;
  var key = catId + ':' + skin.id;
  if (injectedSkinDefs[key]) return;

  var sprite = document.getElementById('skinDefsSprite');
  if (!sprite) return;
  var defs = sprite.querySelector('defs');
  if (!defs) return;

  // insertAdjacentHTML parses in SVG context here, which createElement
  // would not.
  defs.insertAdjacentHTML('beforeend', skin.defs);
  injectedSkinDefs[key] = true;
}

function skinStyleString(skin) {
  if (!skin || !skin.vars) return '';
  var out = '';
  Object.keys(skin.vars).forEach(function (token) {
    out += token + ':' + skin.vars[token] + ';';
  });
  return out;
}

function skinExtrasFor(catId, skin, stageIndex) {
  if (!skin || !skin.extras) return '';
  var extra = skin.extras[stageIndex];
  if (!extra) return '';
  if (typeof extra === 'function') {
    return extra(getPlantAnchors(catId, stageIndex)) || '';
  }
  return extra;
}


// ============================================
// GARDEN LANDSCAPE SKINS
// ============================================
// A plant skin repaints one plant. A landscape skin repaints the
// ground every plant is standing in: the lawn, the grass, the fence
// and the man-made props in the plot.
//
// It is deliberately NOT built the way plant skins are, because a
// plant is a single <svg> string and the landscape is not. The plot
// is a stack of separate DOM layers - a CSS gradient for the lawn, a
// repeating gradient for the fence pickets, a few hundred inline
// styled <div> blades for the grass, a button for the signpost - so
// there is nothing to hang one set of vars off the way skinStyleString
// hangs them off an <svg> root. What there is instead:
//
//   vars   set on the .garden-scene element itself, where every one
//          of those layers can read them (see applyGardenSkin in
//          04-garden-scene.js, and the token block in style.css that
//          declares the same names as fallbacks).
//   grass  handed to buildGrassClump directly, because blades are
//          built in JS and their gradients written as inline styles,
//          which no stylesheet var can reach.
//   props  SVG things scattered about the plot, placed as their own
//          depth-scaled elements by renderSkinProps in 04. A skin
//          without them just omits the key.
//
//          `width` is in px at neutral depth, BEFORE the depth curve
//          multiplies it (0.6x at the back of the plot to 1.4x at the
//          front), and it is worth reading against a plant, which is
//          120px wide at the same depth. Small numbers here produce
//          litter dropped on a lawn; these are sized to be terrain.
//          `count` is spread over the whole track, which is three
//          screens wide - so divide by three for how many are in
//          view at once.
//
// ONE SKIN PER GARDEN, not one per plant. The chosen id lives on the
// gardens/{uid} document as gardenSkinId - a field on a document the
// app already reads and writes, so this costs no extra Firestore
// reads and no extra writes - and is mirrored into the friend-visible
// gardenSummaries document so a friend sees your plot in your skin.
//
// WHAT A SKIN DOES NOT TOUCH: the sky. The sky is repainted from the
// real clock every minute by updateSky() in 05-stats-app.js, and the
// scrolled sky strip above the plot reads --sky-top / --sky-high from
// that same tick. A skin that also painted the sky would either fight
// the clock or throw away the time-of-day read, so the horizon is
// where a skin stops.
//
// ADDING A SKIN: copy the meadow entry, change the values, append it.
// Every skin must declare the WHOLE token set, not a subset. A
// missing token is not inherited from the default skin - it falls
// through to the stylesheet value, which is the meadow value, which
// on a candy-coloured plot is a stripe of lawn green. `props` is the
// one optional key; when present, each entry needs `ratio` (the
// builder's viewBox height over its width) as well as `width`,
// because the Greenhouse preview sizes props itself and has no other
// way to know how tall one stands.
// ============================================

// ---- Ground props -------------------------------------------------
// Small things lying about in the plot: a lollipop dropped in the
// candy grass, a sandcastle on the shore, cooling lava, a crater.
// They belong to the landscape skin rather than to the garden, so a
// skin with none simply omits the key and nothing renders.
//
// Each builder returns a COMPLETE <svg> sized to the width it's
// handed, because 04-garden-scene.js positions each prop as its own
// absolutely-placed element and scales it by the same depth curve the
// plants use. Builders take a seed so a prop type placed four times
// isn't the same picture four times, and so the scatter is stable
// across renders rather than reshuffling every time the garden
// repaints.
//
// Flat illustration throughout: no strokes, no outlines, no gradients
// and no element ids. Ids especially - every prop is inlined into the
// page several times over, and two copies of the same id is a bug
// that only shows up on the second one.

function gardenPropWrap(vbW, vbH, width, body) {
  var h = width * vbH / vbW;
  return '<svg viewBox="0 0 ' + vbW + ' ' + vbH + '"' +
    ' width="' + skinN(width) + '" height="' + skinN(h) + '"' +
    ' xmlns="http://www.w3.org/2000/svg"' +
    ' style="overflow:visible;display:block">' + body + '</svg>';
}

// A closed, slightly irregular blob: points spaced evenly round an
// ellipse, each pushed in or out a little by the seed, then joined
// with quadratics THROUGH the points rather than to them - which is
// what keeps the outline smooth instead of faceted. Used for
// everything round here, since a true circle is the one shape that
// reads as clip art.
function gardenPropBlobPath(cx, cy, rx, ry, points, wobble, seed) {
  var pts = [];
  for (var i = 0; i < points; i++) {
    var a = (i / points) * Math.PI * 2;
    var k = 1 + (hashSeed(seed + i * 1.73) - 0.5) * wobble;
    pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]);
  }

  var mid = function (p, q) { return [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2]; };
  var start = mid(pts[points - 1], pts[0]);
  var d = 'M' + skinN(start[0]) + ',' + skinN(start[1]);
  for (var j = 0; j < points; j++) {
    var m = mid(pts[j], pts[(j + 1) % points]);
    d += ' Q' + skinN(pts[j][0]) + ',' + skinN(pts[j][1]) +
         ' ' + skinN(m[0]) + ',' + skinN(m[1]);
  }
  return d + ' Z';
}

// One pie slice, for the lollipop's pinwheel. Angles in degrees,
// clockwise from east.
function gardenPropWedge(cx, cy, r, a0deg, a1deg, fill) {
  var a0 = a0deg * Math.PI / 180;
  var a1 = a1deg * Math.PI / 180;
  var large = (a1deg - a0deg) > 180 ? 1 : 0;
  return '<path d="M' + skinN(cx) + ',' + skinN(cy) +
    ' L' + skinN(cx + Math.cos(a0) * r) + ',' + skinN(cy + Math.sin(a0) * r) +
    ' A' + skinN(r) + ',' + skinN(r) + ' 0 ' + large + ' 1 ' +
      skinN(cx + Math.cos(a1) * r) + ',' + skinN(cy + Math.sin(a1) * r) +
    ' Z" fill="' + fill + '"/>';
}

// An angular chunk with one lit top facet. Shared by the volcanic
// basalt and the martian stones, since a rock is a rock and only the
// palette differs.
function gardenPropStone(cx, base, w, h, body, lit) {
  var d = 'M' + skinN(cx - w / 2) + ',' + skinN(base) +
    ' L' + skinN(cx - w * 0.42) + ',' + skinN(base - h * 0.55) +
    ' L' + skinN(cx - w * 0.12) + ',' + skinN(base - h) +
    ' L' + skinN(cx + w * 0.26) + ',' + skinN(base - h * 0.88) +
    ' L' + skinN(cx + w / 2) + ',' + skinN(base - h * 0.34) + ' Z';

  return '<path d="' + d + '" fill="' + body + '"/>' +
    '<path d="M' + skinN(cx - w * 0.42) + ',' + skinN(base - h * 0.55) +
    ' L' + skinN(cx - w * 0.12) + ',' + skinN(base - h) +
    ' L' + skinN(cx + w * 0.26) + ',' + skinN(base - h * 0.88) +
    ' L' + skinN(cx - w * 0.02) + ',' + skinN(base - h * 0.6) +
    ' Z" fill="' + lit + '"/>';
}

// A crowned tower, tapering out toward its base so it reads as packed
// sand rather than as a brick keep. teeth is the battlement count.
function gardenPropSandTower(x, yTop, w, h, teeth, body, lit, crown) {
  var flare = w * 0.18;
  var out =
    '<path d="M' + skinN(x - flare) + ',' + skinN(yTop + h) +
    ' L' + skinN(x) + ',' + skinN(yTop) +
    ' L' + skinN(x + w) + ',' + skinN(yTop) +
    ' L' + skinN(x + w + flare) + ',' + skinN(yTop + h) + ' Z" fill="' + body + '"/>' +
    // Lit left face. The whole garden is lit from the upper left, so
    // every prop's highlight has to fall on the same side or the plot
    // ends up with several suns.
    '<path d="M' + skinN(x - flare) + ',' + skinN(yTop + h) +
    ' L' + skinN(x) + ',' + skinN(yTop) +
    ' L' + skinN(x + w * 0.34) + ',' + skinN(yTop) +
    ' L' + skinN(x + w * 0.2 - flare) + ',' + skinN(yTop + h) + ' Z" fill="' + lit + '"/>';

  var tw = w / (teeth * 2 - 1);
  var d = '';
  for (var i = 0; i < teeth; i++) {
    var tx = x + i * tw * 2;
    d += 'M' + skinN(tx) + ',' + skinN(yTop) +
         ' L' + skinN(tx) + ',' + skinN(yTop - tw * 0.85) +
         ' L' + skinN(tx + tw) + ',' + skinN(yTop - tw * 0.85) +
         ' L' + skinN(tx + tw) + ',' + skinN(yTop) + ' Z ';
  }
  return out + '<path d="' + d + '" fill="' + crown + '"/>';
}


// ---- Candy Land ---------------------------------------------------

function gardenPropLollipop(seed, width) {
  var pal = hashSeed(seed) < 0.5
    ? { disc: '#f8f0f5', a: '#ef7f9c', b: '#8fd9c0' }
    : { disc: '#fdf4e6', a: '#f6c86a', b: '#c9a7ec' };

  var cx = 13, cy = 13, r = 11;
  var spin = hashSeed(seed + 1.13) * 360;

  var body =
    // Stick, with a narrow shaded edge down its right so it doesn't
    // read as a flat white line.
    '<path d="M12.1,19 L14.2,19 L14.7,42 L11.9,42 Z" fill="#f4ede2"/>' +
    '<path d="M13.5,19 L14.2,19 L14.7,42 L13.9,42 Z" fill="#dccfbb"/>' +
    '<path d="' + gardenPropBlobPath(cx, cy, r, r, 9, 0.09, seed + 4.21) + '" fill="' + pal.disc + '"/>' +
    // Three slices rather than a drawn spiral: at 20px across, a
    // spiral is mush, and a pinwheel still reads as swirled sugar.
    gardenPropWedge(cx, cy, r * 0.93, spin, spin + 62, pal.a) +
    gardenPropWedge(cx, cy, r * 0.93, spin + 120, spin + 182, pal.b) +
    gardenPropWedge(cx, cy, r * 0.93, spin + 240, spin + 302, pal.a);

  return gardenPropWrap(26, 44, width, body);
}

function gardenPropJelly(seed, width) {
  // Reusing skinGumdrop from the candy PLANT skin on purpose: same
  // sweets, same shape language, one definition.
  var cols = [
    ['#ef7f9c', '#ffd6e2'],
    ['#8fd9c0', '#ddf7ee'],
    ['#f6c86a', '#fff0c9'],
    ['#c9a7ec', '#f0e2ff'],
  ];

  var count = 2 + Math.floor(hashSeed(seed) * 2);
  var body = '';
  for (var i = 0; i < count; i++) {
    var c = cols[Math.floor(hashSeed(seed + i * 2.31) * cols.length)];
    var s = 0.95 + hashSeed(seed + i * 3.07) * 0.4;
    var x = 5.5 + i * 7.6 + hashSeed(seed + i * 1.71) * 1.8;
    body += skinGumdrop(x, 13.4, s, c[0], c[1]);
  }
  return gardenPropWrap(26, 14, width, body);
}


// ---- Driftwood Shore ----------------------------------------------

function gardenPropSandcastle(seed, width) {
  var body  = '#c9a071';
  var lit   = '#ddb789';
  var crown = '#d3aa7c';

  var out =
    // The heaped sand the castle is standing in, so it doesn't look
    // set down on the ground like a toy.
    '<path d="' + gardenPropBlobPath(16, 28.4, 15, 3.2, 9, 0.18, seed + 2.17) + '" fill="#bd9265"/>' +
    gardenPropSandTower(2.6, 13, 6.4, 16, 3, body, lit, crown) +
    gardenPropSandTower(23, 13, 6.4, 16, 3, body, lit, crown) +
    gardenPropSandTower(11.4, 8, 9.2, 21, 4, body, lit, crown) +
    // Doorway, arched.
    '<path d="M14.6,29 L14.6,24 Q16,21.9 17.4,24 L17.4,29 Z" fill="#8e6a47"/>' +
    // Flag. Pole starts clear of the battlements above the keep.
    '<path d="M15.7,6.2 L16.6,6.2 L16.6,1 L15.7,1 Z" fill="#8e8272"/>' +
    '<path d="M16.6,1.4 L23,3 L16.6,4.9 Z" fill="#d9694f"/>';

  return gardenPropWrap(32, 32, width, out);
}

function gardenPropShovel(seed, width) {
  var hot = hashSeed(seed) < 0.5;
  var grip  = hot ? '#d9694f' : '#3f7ea8';
  var gripD = hot ? '#b5503a' : '#2f6285';

  // Drawn upright and then tilted as a whole, so the blade and the
  // handle can't drift out of line with each other.
  var lean = -14 + hashSeed(seed + 0.91) * 28;

  var out =
    '<g transform="rotate(' + skinN(lean) + ' 9 31)">' +
      // D-grip
      '<path d="M5.8,7 Q5.8,1.2 9,1.2 Q12.2,1.2 12.2,7 L10.4,7 Q10.4,3.1 9,3.1' +
        ' Q7.6,3.1 7.6,7 Z" fill="' + grip + '"/>' +
      // Shaft
      '<path d="M7.6,6.4 L10.4,6.4 L10.4,21.4 L7.6,21.4 Z" fill="' + grip + '"/>' +
      '<path d="M9.5,6.4 L10.4,6.4 L10.4,21.4 L9.5,21.4 Z" fill="' + gripD + '"/>' +
      // Blade, buried a little at the tip
      '<path d="M4.5,20.8 L13.5,20.8 L12.3,27.6 Q9,32.4 5.7,27.6 Z" fill="#e2e7e9"/>' +
      '<path d="M9,20.8 L13.5,20.8 L12.3,27.6 Q10.7,30 9,30.9 Z" fill="#c3cbd1"/>' +
    '</g>' +
    // Sand piled against the blade, which is what sells it as stuck
    // in rather than lying on.
    '<path d="' + gardenPropBlobPath(9, 32, 8, 2.2, 8, 0.2, seed + 5.3) + '" fill="#d3b177"/>';

  return gardenPropWrap(18, 34, width, out);
}


// ---- Emberfield ---------------------------------------------------

function gardenPropLavaSmear(seed, width) {
  // Four nested blobs, each smaller and hotter, each with its own
  // wobble seed so the edges don't run parallel. Offset leftward as
  // they go in, so the smear reads as flowing rather than as a
  // target.
  var body =
    '<path d="' + gardenPropBlobPath(22, 10, 20,   5.4, 11, 0.22, seed + 1.31) + '" fill="#2b1a15"/>' +
    '<path d="' + gardenPropBlobPath(22, 10, 15.4, 3.9, 10, 0.24, seed + 2.93) + '" fill="#a8401c"/>' +
    '<path d="' + gardenPropBlobPath(21, 10, 10.2, 2.5,  9, 0.28, seed + 4.71) + '" fill="#e07a2a"/>' +
    '<path d="' + gardenPropBlobPath(19.6, 10, 5.6, 1.3, 8, 0.3,  seed + 6.13) + '" fill="#ffd07a"/>';
  return gardenPropWrap(44, 16, width, body);
}

function gardenPropBasalt(seed, width) {
  var big = 8 + hashSeed(seed + 0.4) * 3;
  var out =
    gardenPropStone(9,  17, 13, big, '#3a2e2b', '#584743') +
    gardenPropStone(20, 17, 9.5, big * 0.62, '#312624', '#4c3c38');

  // One crack still lit, on one rock in three. Every rock glowing
  // would be a bonfire; none glowing is gravel.
  if (hashSeed(seed + 3.7) < 0.34) {
    out += '<path d="M6.2,16.6 L8.4,' + skinN(17 - big * 0.55) +
           ' L9.4,' + skinN(17 - big * 0.5) + ' L7.4,16.6 Z" fill="#c0512c"/>';
  }
  return gardenPropWrap(28, 18, width, out);
}


// ---- Mars ---------------------------------------------------------

function gardenPropCrater(seed, width) {
  var rx = 14 + hashSeed(seed + 0.7) * 3.5;
  var out =
    // Raised rim, catching the light.
    '<path d="' + gardenPropBlobPath(18, 9, rx, rx * 0.44, 12, 0.16, seed + 1.09) + '" fill="#dd9a6d"/>' +
    // The bowl. Dark all round...
    '<path d="' + gardenPropBlobPath(18, 9.4, rx * 0.74, rx * 0.3, 11, 0.18, seed + 2.61) + '" fill="#75391f"/>' +
    // ...then a lifted floor set LOW inside it. The far wall staying
    // dark while the near floor catches light is the whole depth cue;
    // without it a crater is just a brown patch. Done with a second
    // shape rather than a clipped crescent because there are no clip
    // paths in these builders by design.
    '<path d="' + gardenPropBlobPath(18, 11, rx * 0.6, rx * 0.19, 10, 0.2, seed + 4.03) + '" fill="#a35c3c"/>';
  return gardenPropWrap(36, 18, width, out);
}

function gardenPropMarsStones(seed, width) {
  var out =
    gardenPropStone(8,  17, 11, 6.5 + hashSeed(seed + 0.5) * 2.5, '#8a4a30', '#b26a48') +
    gardenPropStone(19, 17, 8,  4.4 + hashSeed(seed + 1.9) * 2,   '#7a3f28', '#a35c3c');
  return gardenPropWrap(28, 18, width, out);
}


var GARDEN_SKIN_DEFAULT_ID = 'meadow';

var GARDEN_SKINS = [
  {
    id:     'meadow',
    name:   'Meadow',
    note:   'The garden as it grows on its own.',
    swatch: ['#6fae46', '#58973a', '#3f7a2a'],
    // These are the same values style.css declares as fallbacks, so
    // applying this skin is a no-op and an unskinned garden and a
    // meadow-skinned one are the same picture.
    vars: {
      '--lawn-back':  '#6fae46',
      '--lawn-mid':   '#58973a',
      '--lawn-front': '#3f7a2a',
      '--lawn-crest': '#6fae46',

      // Pointing at the shared UI palette on purpose: the fence and
      // the signpost have always been painted in the app's own clay
      // and bark, and the default should keep being exactly that
      // even if those tokens are retuned later.
      '--fence-a':    'var(--clay)',
      '--fence-b':    'var(--clay-edge)',
      '--fence-c':    'var(--clay-deep)',
      '--fence-d':    'var(--clay-deep)',
      '--fence-rail': 'var(--clay-deep)',
      '--fence-shadow-rgb': '20, 40, 12',

      '--scenery-wood':      'var(--bark)',
      '--scenery-wood-lit':  'var(--bark-light)',
      '--scenery-wood-deep': 'var(--bark-deep)',
      '--scenery-ink':       'var(--linen)',

      '--scene-night-bright':       '0.45',
      '--scene-night-sat':          '0.85',
      '--scene-night-fence-bright': '0.55',
    },
    grass: ['#3a6020', '#4a7a30', '#537d33', '#5a9035', '#487526', '#6aab45', '#436b2c'],
    grassTip: '#cfe8a0',
  },

  {
    id:     'candy',
    name:   'Candy Land',
    note:   'Bubblegum ground, candy-cane fence, gingerbread post.',
    swatch: ['#f3a9cb', '#8fd9c0', '#ef7f9c'],
    vars: {
      '--lawn-back':  '#f7bcd6',
      '--lawn-mid':   '#e894ba',
      '--lawn-front': '#c56b9c',
      '--lawn-crest': '#fbcde1',

      // Four pickets instead of the meadow's three shades of one
      // wood: icing, strawberry, mint, butterscotch, cycling every
      // 104px, which is what turns a fence into a row of sweets.
      '--fence-a':    '#fbf3f6',
      '--fence-b':    '#ef7f9c',
      '--fence-c':    '#8fd9c0',
      '--fence-d':    '#f6c86a',
      '--fence-rail': '#d4577f',
      // Plum rather than the meadow's green-black. A contact shadow
      // takes its colour from the ground it falls on, and this ground
      // is pink.
      '--fence-shadow-rgb': '92, 42, 74',

      '--scenery-wood':      '#c07a45',
      '--scenery-wood-lit':  '#dda06a',
      '--scenery-wood-deep': '#8f5730',
      '--scenery-ink':       '#fff3e0',

      // Lifted well off the meadow's 0.45. Pastels have nowhere to go
      // when they are darkened: at the default night filter this plot
      // reads as grey mud rather than as a candy garden after dark,
      // which is the whole reason night lives on the skin.
      '--scene-night-bright':       '0.62',
      '--scene-night-sat':          '1',
      '--scene-night-fence-bright': '0.72',
    },
    grass: ['#7fd0b4', '#a8e6cf', '#f6dc8a', '#c9a7ec', '#6cc0a4', '#ffd1a8', '#b489e0'],
    grassTip: '#fff6dd',
    props: [
      { build: gardenPropLollipop, count: 5, width: 40, ratio: 44 / 26 },
      { build: gardenPropJelly,    count: 7, width: 38, ratio: 14 / 26 },
    ],
  },

  {
    id:     'beach',
    name:   'Driftwood Shore',
    note:   'Sun-bleached sand, marram grass, salt-worn palings.',
    swatch: ['#f2dfb4', '#d3b177', '#8e8272'],
    vars: {
      // Sand runs the opposite way to grass: dry and pale up by the
      // fence, damp and deeper toward the foreground, which is the
      // direction the tide comes from.
      '--lawn-back':  '#f2dfb4',
      '--lawn-mid':   '#e5cb96',
      '--lawn-front': '#d3b177',
      '--lawn-crest': '#f7e9c6',

      // Driftwood, not paint. Four greys of the same silvered timber
      // rather than four colours, so the fence reads as one weathered
      // material with some planks older than others.
      '--fence-a':    '#e6ded1',
      '--fence-b':    '#bfb3a2',
      '--fence-c':    '#d8cfc0',
      '--fence-d':    '#a89b89',
      '--fence-rail': '#8e8272',
      '--fence-shadow-rgb': '120, 96, 62',

      '--scenery-wood':      '#a89583',
      '--scenery-wood-lit':  '#c4b3a1',
      '--scenery-wood-deep': '#6f6154',
      // Dark lettering here, where every other skin uses light. The
      // board this sits on is pale driftwood rather than dark bark,
      // and cream text on cream wood is not text.
      '--scenery-ink':       '#514434',

      // Barely dimmed and slightly cooled: a beach at night is
      // moonlit, and sand is the one ground that keeps giving light
      // back after dark rather than swallowing it.
      '--scene-night-bright':       '0.58',
      '--scene-night-sat':          '0.72',
      '--scene-night-fence-bright': '0.66',
    },
    // Marram and sea oats: bleached straw with what green survives
    // salt, so the ground cover reads as dune rather than lawn.
    grass: ['#b9b573', '#cfc389', '#8f9a5c', '#ddd0a0', '#a3a869', '#7f8a52', '#c7bb80'],
    grassTip: '#f6efcd',
    props: [
      { build: gardenPropSandcastle, count: 5, width: 64, ratio: 32 / 32 },
      { build: gardenPropShovel,     count: 6, width: 32, ratio: 34 / 18 },
    ],
  },

  {
    id:     'volcanic',
    name:   'Emberfield',
    note:   'Cooled basalt, ember grass, charred palings.',
    swatch: ['#2a1f1f', '#d4652f', '#8c3a1c'],
    vars: {
      // Dark ground needs its depth cue inverted: lighter at the back
      // where a distant glow catches it, near black underfoot. Run
      // the usual way round and the plot reads as a hole.
      '--lawn-back':  '#57443f',
      '--lawn-mid':   '#3d2e2c',
      '--lawn-front': '#2a1f1f',
      '--lawn-crest': '#6b514a',

      // Three charred planks and one that hasn't finished burning.
      // The single hot picket in four is doing the work here: make
      // them all glow and it stops reading as fire.
      '--fence-a':    '#3a2c28',
      '--fence-b':    '#241b19',
      '--fence-c':    '#8c3a1c',
      '--fence-d':    '#2f2320',
      '--fence-rail': '#171010',
      '--fence-shadow-rgb': '10, 6, 6',

      '--scenery-wood':      '#3b2b26',
      '--scenery-wood-lit':  '#55403a',
      '--scenery-wood-deep': '#150e0d',
      // The sign glows rather than reflects, since there is nothing
      // pale enough on this plot for dark lettering to sit on.
      '--scenery-ink':       '#ffb066',

      // The clearest case for night living on the skin rather than in
      // the stylesheet. Run this ground through the meadow's
      // brightness(0.45) and it goes to flat black; the embers are
      // the whole picture and they are what has to survive dusk, so
      // it barely dims and gains saturation instead.
      '--scene-night-bright':       '0.82',
      '--scene-night-sat':          '1.18',
      '--scene-night-fence-bright': '0.9',
    },
    // Sparks rather than blades. The two dark entries matter as much
    // as the bright ones: an all-ember field is a bonfire, and what
    // this wants is ash with fire still in it.
    grass: ['#c0512c', '#7a3320', '#d4652f', '#e08a3c', '#5e2a1c', '#a8452a', '#8c3a22'],
    grassTip: '#ffd07a',
    props: [
      { build: gardenPropLavaSmear, count: 6, width: 84, ratio: 16 / 44 },
      { build: gardenPropBasalt,    count: 6, width: 50, ratio: 18 / 28 },
    ],
  },

  {
    id:     'mars',
    name:   'Mars',
    note:   'Rust dust, cratered flats, panelled palings.',
    swatch: ['#cf7d52', '#8e4c31', '#b9c2c8'],
    vars: {
      '--lawn-back':  '#cf7d52',
      '--lawn-mid':   '#b26340',
      '--lawn-front': '#8e4c31',
      '--lawn-crest': '#dd8f61',

      // The only fence here that isn't wood. Four shades of one
      // brushed panel, cool against the rust so the plot reads as
      // something built on the ground rather than grown out of it.
      '--fence-a':    '#d3d9dc',
      '--fence-b':    '#8d979e',
      '--fence-c':    '#b9c2c8',
      '--fence-d':    '#6f7a81',
      '--fence-rail': '#5a646b',
      // Rust, not grey: the shadow takes its colour from the dust it
      // falls on.
      '--fence-shadow-rgb': '70, 34, 20',

      '--scenery-wood':      '#9aa4ab',
      '--scenery-wood-lit':  '#c2cad0',
      '--scenery-wood-deep': '#5c666d',
      // Dark lettering, same reason as the shore: the sign is pale
      // metal and cream on cream is nothing.
      '--scenery-ink':       '#2b3a44',

      // A thin atmosphere gives a hard night with no glow to soften
      // it, so this dims further than the shore does and loses a
      // little colour with it.
      '--scene-night-bright':       '0.46',
      '--scene-night-sat':          '0.78',
      '--scene-night-fence-bright': '0.6',
    },
    // Not grass. The blade field still renders on every skin, so on a
    // dead planet it becomes wind-blown dust and dry scrub - the same
    // shapes reading as something else entirely, which is cheaper
    // than a switch to turn the field off.
    grass: ['#8a5a44', '#a06b4e', '#6f4d3d', '#95664b', '#7d5540', '#ab7757', '#5f4436'],
    grassTip: '#d9a982',
    props: [
      { build: gardenPropCrater,     count: 7, width: 78, ratio: 18 / 36 },
      { build: gardenPropMarsStones, count: 5, width: 46, ratio: 18 / 28 },
    ],
  },
];


// ---- Landscape skin lookup ---------------------------------------

// Always returns a real skin, same contract as getSkin() above: an
// unknown or removed id falls back to the first entry rather than
// leaving the plot with no ground.
function getGardenSkin(skinId) {
  var found = null;
  GARDEN_SKINS.forEach(function (s) { if (s.id === skinId) found = s; });
  return found || GARDEN_SKINS[0];
}

// Every token any skin can set, taken from the default skin's own
// keys rather than written out a second time here - a list that has
// to be kept in step with the skins by hand is a list that won't be.
// applyGardenSkin() clears each of these before setting, so switching
// from a skin that sets a token to one that doesn't can't leave the
// old value stranded on the element.
function getGardenSkinTokens() {
  return Object.keys(GARDEN_SKINS[0].vars);
}


// ---- Landscape skin unlocks --------------------------------------
// Nothing is gated yet: every landscape is free to choose. The shape
// is here because the gates are a decision that hasn't been made, not
// one that's been made against - when it is, it lands in this array
// and nothing else has to change.
//
// Slot-indexed, same as SKIN_UNLOCK_RULES, but the KINDS have to
// differ. A landscape belongs to the garden, not to a plant, so the
// per-plant gates ('streak', 'growth') have no plant to read from.
// Whatever goes in here will need to be account-wide: friends, or
// lifetime growth across every plant, or plants brought to full size.
//
// An empty rule for a slot means unlocked, matching the plant
// picker's own rule that a skin whose gate was forgotten is available
// rather than unreachable.
var GARDEN_SKIN_UNLOCK_RULES = [];

function getGardenSkinUnlockState(skinId) {
  var skin = getGardenSkin(skinId);
  var slot = -1;
  GARDEN_SKINS.forEach(function (s, i) { if (s.id === skin.id) slot = i; });
  var rule = (slot >= 0 && GARDEN_SKIN_UNLOCK_RULES[slot]) || null;

  var have = 0;
  var need = (rule && rule.need) || 0;

  if (rule && rule.kind === 'friends') have = getMyFriendCount();

  return {
    skin:     skin,
    slot:     slot,
    kind:     rule ? rule.kind : 'always',
    need:     need,
    have:     have,
    unlocked: !rule || have >= need,
  };
}

function isGardenSkinUnlocked(skinId) {
  return getGardenSkinUnlockState(skinId).unlocked;
}

function gardenSkinUnlockRequirement(state) {
  if (!state || state.unlocked) return '';
  if (state.kind === 'friends') {
    return 'Add ' + state.need + ' friend' + (state.need === 1 ? '' : 's') + ' to unlock';
  }
  return 'Locked';
}


// The landscape the garden actually WEARS, which is not always the
// one stored - exactly the arrangement getTaskSkinId() uses for
// plants, and for the same reason. The saved id is never overwritten,
// so a landscape behind a gate that somehow closed comes back on its
// own when the gate opens again.
//
// gardenSkinId is a global owned by 02-auth-tasks.js, loaded from the
// gardens/{uid} document. Guarded with typeof because this file loads
// before it, and because a signed-out visitor never loads a garden at
// all: the honest answer then is the default, not a crash.
function getActiveGardenSkinId() {
  var stored = (typeof gardenSkinId === 'string' && gardenSkinId)
    ? gardenSkinId
    : GARDEN_SKIN_DEFAULT_ID;

  // Resolve first, so an id that no longer exists comes back as the
  // default rather than being handed on to be resolved again later.
  var wanted = getGardenSkin(stored).id;
  if (wanted === GARDEN_SKIN_DEFAULT_ID) return GARDEN_SKIN_DEFAULT_ID;
  return isGardenSkinUnlocked(wanted) ? wanted : GARDEN_SKIN_DEFAULT_ID;
}

function getActiveGardenSkin() {
  return getGardenSkin(getActiveGardenSkinId());
}