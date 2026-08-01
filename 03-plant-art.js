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
// ViewBox is "0 0 80 130". Plant base sits at y≈118.
// ============================================

var PLANT_SVG_DATA = {

  // ---- OAK (Education) ----
  education: [
    // Stage 0: Acorn on soil
    '<path d="M29,122 C29,120.4 33.9,119 40,119 C46.1,119 51,120.4 51,122 C51,123.6 46.1,125 40,125 C33.9,125 29,123.6 29,122 Z" style="fill:var(--c-shadow,rgba(0,0,0,0.14))"/><path d="M40,107 C36.5,107 34.5,110.2 34.5,114 C34.5,117.9 36.5,121 40,121 C43.5,121 45.5,117.9 45.5,114 C45.5,110.2 43.5,107 40,107 Z" style="fill:var(--c-seed,hsl(35,38%,68%))"/><path d="M40,107 C37,107 34.5,109.8 34.5,113 L40,113.4 Z" style="fill:var(--c-seed-dark,hsl(35,38%,56%))"/><path d="M33,107 C33,104.8 36.1,103.5 40,103.5 C43.9,103.5 47,104.8 47,107 C47,109.2 43.9,110.5 40,110.5 C36.1,110.5 33,109.2 33,107 Z" style="fill:var(--c-stem,hsl(20,30%,45%))"/><path d="M40,103.5 C43.9,103.5 47,104.8 47,107 C47,109.2 43.9,110.5 40,110.5 Z" style="fill:var(--c-stem-dark,hsl(20,30%,35%))"/><path d="M38.7,99 C38.7,97.6 39.2,96.5 40,96.5 C40.8,96.5 41.3,97.6 41.3,99 L41.3,104 L38.7,104 Z" style="fill:var(--c-stem-dark,hsl(20,30%,35%))"/>',

    // Stage 1: Seedling, two round leaves -- recolored to the mature bark/canopy palette
    '<path d="M26,122 C26,120.1 32.3,118.5 40,118.5 C47.7,118.5 54,120.1 54,122 C54,123.9 47.7,125.5 40,125.5 C32.3,125.5 26,123.9 26,122 Z" style="fill:var(--c-shadow,rgba(0,0,0,0.14))"/><path d="M39,122 C38.8,113 39,104 39.6,96 C39.7,95 40.3,95 40.4,96 C41,104 41.2,113 41,122 Z" style="fill:var(--c-bark,hsl(8,30%,40%))"/><path d="M40.4,96 C41,104 41.2,113 41,122 L40.2,122 C40.4,113 40.2,104 39.9,96 Z" style="fill:var(--c-bark-dark,hsl(9,33%,30%))"/><g transform="translate(29,95) rotate(-22) scale(1.05)"><path d="M0,-5 C-6.1,-5 -11,-0.1 -11,6 C-11,12.1 -6.1,17 0,17 Z" style="fill:var(--c-canopy,hsl(61,45%,55%))"/><path d="M0,-5 C6.1,-5 11,-0.1 11,6 C11,12.1 6.1,17 0,17 Z" style="fill:var(--c-canopy-dark,hsl(58,38%,42%))"/></g><g transform="translate(51,92) rotate(22) scale(1.05)"><path d="M0,-5 C-6.1,-5 -11,-0.1 -11,6 C-11,12.1 -6.1,17 0,17 Z" style="fill:var(--c-canopy,hsl(61,45%,55%))"/><path d="M0,-5 C6.1,-5 11,-0.1 11,6 C11,12.1 6.1,17 0,17 Z" style="fill:var(--c-canopy-dark,hsl(58,38%,42%))"/></g>',

    // Stage 2: Young oak -- rounded three-tier crown as one merged mass,
    '<ellipse cx="40" cy="122" rx="19" ry="5.5" style="fill:var(--c-shadow,rgba(0,0,0,0.15))"/><g fill="none" style="stroke:var(--c-bark-dark,hsl(9,33%,30%))" stroke-linecap="round"><path d="M40,83 C37.4,78 35,71 32,52" stroke-width="2.2"/><path d="M40,86 C42.6,81 45,73.5 48,52" stroke-width="2.2"/></g><path d="M34.5,118 C36.2,110 37.2,96 37.9,80 C38.2,74 38.3,67 38.3,59 L40,59 L40,118 Z" style="fill:var(--c-bark,hsl(8,30%,42%))"/><path d="M45.5,118 C43.8,110 42.8,96 42.1,80 C41.8,74 41.7,67 41.7,59 L40,59 L40,118 Z" style="fill:var(--c-bark-dark,hsl(9,33%,30%))"/><path d="M32.6,37 A9,9 0 1,0 50.6,37 A9,9 0 1,0 32.6,37 Z M21.6,43 A8,8 0 1,0 37.6,43 A8,8 0 1,0 21.6,43 Z M45.6,43 A8,8 0 1,0 61.6,43 A8,8 0 1,0 45.6,43 Z M31.1,47 A10.5,10.5 0 1,0 52.1,47 A10.5,10.5 0 1,0 31.1,47 Z M23.6,53 A8,8 0 1,0 39.6,53 A8,8 0 1,0 23.6,53 Z M43.6,53 A8,8 0 1,0 59.6,53 A8,8 0 1,0 43.6,53 Z M33.6,57 A8,8 0 1,0 49.6,57 A8,8 0 1,0 33.6,57 Z" style="fill:var(--c-canopy-dark,hsl(58,38%,42%))"/><path d="M31,35 A9,9 0 1,0 49,35 A9,9 0 1,0 31,35 Z M20,41 A8,8 0 1,0 36,41 A8,8 0 1,0 20,41 Z M44,41 A8,8 0 1,0 60,41 A8,8 0 1,0 44,41 Z M29.5,45 A10.5,10.5 0 1,0 50.5,45 A10.5,10.5 0 1,0 29.5,45 Z M22,51 A8,8 0 1,0 38,51 A8,8 0 1,0 22,51 Z M42,51 A8,8 0 1,0 58,51 A8,8 0 1,0 42,51 Z M32,55 A8,8 0 1,0 48,55 A8,8 0 1,0 32,55 Z" style="fill:var(--c-canopy,hsl(61,45%,55%))"/><g fill="none" style="stroke:var(--c-canopy-dark,hsl(58,38%,42%))" stroke-linecap="round" stroke-width="1.3" opacity="0.42"><path d="M31,38 C34.5,43 45.5,43 49,38"/><path d="M22,44 C25,49 31,50.5 35,48"/></g>',

    // Stage 3: Full spreading oak -- ten merged lobes forming a single
    //          connected crown, split-shaded trunk with flared roots,
    //          and limbs that terminate inside the canopy
    '<ellipse cx="40" cy="122" rx="24" ry="6" style="fill:var(--c-shadow,rgba(0,0,0,0.16))"/><g fill="none" style="stroke:var(--c-bark-dark,hsl(9,33%,30%))" stroke-linecap="round"><path d="M40,77 C35.2,72 31.4,65.5 28.5,58" stroke-width="2.9"/><path d="M40,80 C44.6,75 48,67 50.5,57.5" stroke-width="2.9"/><path d="M40,68 C37.6,63 35.4,59 33.6,54.5" stroke-width="2"/><path d="M40,70 C42.6,65 44.8,61 46.6,56" stroke-width="2"/></g><path d="M31,118 C33.2,112 35,103 36.3,88 C37.1,78 37.4,68 37.5,58 L40,58 L40,118 Z" style="fill:var(--c-bark,hsl(8,30%,40%))"/><path d="M49,118 C46.8,112 45,103 43.7,88 C42.9,78 42.6,68 42.5,58 L40,58 L40,118 Z" style="fill:var(--c-bark-dark,hsl(9,33%,30%))"/><g fill="none" style="stroke:var(--c-bark-dark,hsl(9,33%,30%))" stroke-linecap="round" stroke-width="0.8" opacity="0.35"><path d="M37.4,112 C38,100 38.4,86 38.6,72"/><path d="M34.6,116 C35.6,108 36.3,99 36.8,90"/></g><path d="M29,21.6 A13,13 0 1,0 55,21.6 A13,13 0 1,0 29,21.6 Z M17,29.6 A12,12 0 1,0 41,29.6 A12,12 0 1,0 17,29.6 Z M43,29.6 A12,12 0 1,0 67,29.6 A12,12 0 1,0 43,29.6 Z M11,40.6 A10,10 0 1,0 31,40.6 A10,10 0 1,0 11,40.6 Z M53,40.6 A10,10 0 1,0 73,40.6 A10,10 0 1,0 53,40.6 Z M27,36.6 A15,15 0 1,0 57,36.6 A15,15 0 1,0 27,36.6 Z M17,49.6 A12,12 0 1,0 41,49.6 A12,12 0 1,0 17,49.6 Z M43,49.6 A12,12 0 1,0 67,49.6 A12,12 0 1,0 43,49.6 Z M29,52.6 A13,13 0 1,0 55,52.6 A13,13 0 1,0 29,52.6 Z M33,60.6 A9,9 0 1,0 51,60.6 A9,9 0 1,0 33,60.6 Z" style="fill:var(--c-canopy-dark,hsl(58,38%,42%))"/><path d="M27,19 A13,13 0 1,0 53,19 A13,13 0 1,0 27,19 Z M15,27 A12,12 0 1,0 39,27 A12,12 0 1,0 15,27 Z M41,27 A12,12 0 1,0 65,27 A12,12 0 1,0 41,27 Z M9,38 A10,10 0 1,0 29,38 A10,10 0 1,0 9,38 Z M51,38 A10,10 0 1,0 71,38 A10,10 0 1,0 51,38 Z M25,34 A15,15 0 1,0 55,34 A15,15 0 1,0 25,34 Z M15,47 A12,12 0 1,0 39,47 A12,12 0 1,0 15,47 Z M41,47 A12,12 0 1,0 65,47 A12,12 0 1,0 41,47 Z M27,50 A13,13 0 1,0 53,50 A13,13 0 1,0 27,50 Z M31,58 A9,9 0 1,0 49,58 A9,9 0 1,0 31,58 Z" style="fill:var(--c-canopy,hsl(61,45%,55%))"/><g fill="none" style="stroke:var(--c-canopy-dark,hsl(58,38%,42%))" stroke-linecap="round" stroke-width="1.6" opacity="0.45"><path d="M30,17 C34,23 46,23 50,17"/><path d="M18,30 C22,38 32,40 37,36"/><path d="M62,30 C58,38 48,40 43,36"/></g>'
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
// Adding a new look means appending one object to the list for that
// species. No new art, no changes to any rendering code.
//
// Token reference, per species:
//   education    seed seed-dark stem stem-dark leaf leaf-dark bark
//                bark-dark canopy canopy-dark
//   exercise     seed seed-line stem leaf-light leaf leaf-dark petal
//                petal-dark disc disc-dark disc-seed
//   mindfulness  petal-outer(-light) petal-mid(-light)
//                petal-inner(-light) center center-dark leaf-light
//                leaf leaf-dark pad pad-dark
//   sleep        bud bud-shade bud-hilite stem stem-light
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
  ],

  exercise: [
    {
      id: 'classic',
      name: 'Daybreak',
      note: 'The sunflower as first grown.',
      swatch: ['#F2B84B', '#E8A020', '#5C3A1A'],
      vars: {},
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
  ],

  mindfulness: [
    {
      id: 'classic',
      name: 'Dawn Lotus',
      note: 'The lotus as first grown.',
      swatch: ['#FAD1D8', '#E28D9B', '#DA4E65'],
      vars: {},
    },
    {
      id: 'inkandgold',
      name: 'Ink & Gold',
      note: 'Ivory petals over lacquer-dark pads.',
      swatch: ['#FFFDF6', '#C9A24F', '#1E3A33'],
      defs:
        '<linearGradient id="sk-inkandgold-inner" x1="0" y1="1" x2="0" y2="0">' +
          '<stop offset="0" stop-color="#8C6326"/>' +
          '<stop offset="1" stop-color="#D9B369"/>' +
        '</linearGradient>',
      vars: {
        '--c-petal-outer-light': '#FFFDF6',
        '--c-petal-outer':       '#F3E9D2',
        '--c-petal-mid-light':   '#E9DAB6',
        '--c-petal-mid':         '#D6BE8A',
        '--c-petal-inner-light': '#C8A45E',
        '--c-petal-inner':       'url(#sk-inkandgold-inner)',
        '--c-center':            '#FFF0B8',
        '--c-center-dark':       '#DFB94F',
        '--c-pad':               '#25453C',
        '--c-pad-dark':          '#15292A',
        '--c-leaf-light':        '#4A7A66',
        '--c-leaf':              '#2F5A4C',
        '--c-leaf-dark':         '#1E4034',
        '--c-shadow':            'rgba(8,28,26,0.34)',
      },
      extras: {
        2: function (a) {
          return skinRipple(a.base[0], a.base[1] - 1, 19, '#C9A24F', 0.35) +
                 skinRipple(a.base[0], a.base[1] + 1.5, 24, '#C9A24F', 0.18);
        },
        3: function (a) {
          return skinRipple(a.base[0], a.base[1] - 1, 24, '#C9A24F', 0.38) +
                 skinRipple(a.base[0], a.base[1] + 2, 30, '#C9A24F', 0.20) +
                 skinSparkle(a.canopy[0] + 1, a.canopy[1] - 6, 2.0, '#FFF0B8', 0.7);
        },
      },
    },
  ],

  sleep: [
    {
      id: 'classic',
      name: 'Dusk Lavender',
      note: 'The lavender as first grown.',
      swatch: ['#F1EBFB', '#D9CDF5', '#BCA8E6'],
      vars: {},
    },
    {
      id: 'honeydusk',
      name: 'Honeydusk',
      note: 'Warm amber buds on dusty olive stems.',
      swatch: ['#FFF3DC', '#F2CE8E', '#A8B27A'],
      defs:
        '<linearGradient id="sk-honeydusk-bud" x1="0" y1="1" x2="0.3" y2="0">' +
          '<stop offset="0" stop-color="#E8B96A"/>' +
          '<stop offset="1" stop-color="#FBE1AE"/>' +
        '</linearGradient>',
      vars: {
        '--c-bud':        'url(#sk-honeydusk-bud)',
        '--c-bud-shade':  '#DDA95C',
        '--c-bud-hilite': '#FFF6E4',
        '--c-stem':       '#94A06A',
        '--c-stem-light': '#BFC895',
        '--c-shadow':     'rgba(70,52,10,0.16)',
      },
      extras: {
        2: function (a) {
          return skinDot(a.canopy[0] - 11, a.canopy[1] - 4, 0.9, '#FFE9BE', 0.75) +
                 skinDot(a.canopy[0] + 12, a.canopy[1] + 6, 0.7, '#FFE9BE', 0.6);
        },
        3: function (a) {
          return skinDot(a.canopy[0] - 14, a.canopy[1] - 10, 1.1, '#FFE9BE', 0.8) +
                 skinDot(a.canopy[0] + 15, a.canopy[1] + 4, 0.9, '#FFE9BE', 0.62) +
                 skinDot(a.canopy[0] + 6,  a.canopy[1] - 22, 0.8, '#FFE9BE', 0.5);
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
  ],

  misc: [
    {
      id: 'classic',
      name: 'Coral Cap',
      note: 'The mushroom as first grown.',
      swatch: ['#E4715E', '#C4574A', '#F7E9DE'],
      vars: {},
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

function getTaskSkinId(task) {
  return (task && task.skinId) || SKIN_DEFAULT_ID;
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



