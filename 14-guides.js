// ============================================
// 14: GUIDES - what to plant, and how to keep it growing
// Part of DISCIPLANT.
// Loaded as a plain global script (no modules), AFTER 12 and 13, because it
// calls tpScheduleLabel / tpOpenSheet (12), getPlantSVG and
// escapeHtml (04), and the task-model helpers in 01.
//
// WHAT THIS IS
// One guide per category: why it matters for a student, three ideas
// on how to actually do it, and a set of suggested tasks. Every
// suggestion has a "Plant this" button that creates the task with its
// schedule, type and steps already filled in, then drops the user
// into the task sheet to change anything before it grows.
//
// Two views on one page (#page-guide):
//   #guide             the front page - every category, one card each
//   #guide/<category>  one category's full guide
// The Tasks page links to both: the front page from the "All plots"
// view, a category's guide from that category's filter.
//
// WHAT IS DELIBERATELY NOT HERE
// Nothing new is stored. A planted suggestion is an ordinary task made
// by makeTask(), indistinguishable from one typed into the add form,
// so the document format does not change and nothing needs migrating.
// All the content is static, below.
// ============================================


// ============================================
// Schedules, in the 7-character mask from 01 (index 0 = Sunday).
// null is "every day", which is how the default is stored.
// ============================================
var GS_DAILY    = null;
var GS_WEEKDAYS = SCHEDULE_WEEKDAYS;  // Mon-Fri
var GS_WEEKENDS = SCHEDULE_WEEKENDS;  // Sat + Sun
var GS_MWF      = '0101010';
var GS_TTS      = '0010101';          // Tue / Thu / Sat
var GS_SAT      = '0000001';
var GS_SUN      = '1000000';


// ============================================
// The content
//
// tier: 'start' - almost too easy, the first plant in a plot
//       'level' - once the easy one has stuck
//       'once'  - an assignment, done a single time
// next: the id of the natural step up from a 'start' suggestion.
//       Not read yet - kept so a later "ready for the next step?"
//       nudge has something to point at.
//
// Every text is well under TASK_TEXT_MAX (120) and every step under
// SUBTASK_TEXT_MAX (90), so nothing is silently cut when planted.
// ============================================
var CATEGORY_GUIDES = {

  education: {
    tagline: 'Study a little every day instead of a lot the night before.',
    why:
      'Falling behind in school is rarely one bad week. It is a lot of ' +
      'small skipped evenings adding up. A little studying every day is ' +
      'far less painful than cramming three chapters the night before an ' +
      'exam, and you remember more of it.',
    how: [
      ['Test yourself instead of rereading.',
       'Close the book and try to recall what you just read. It feels ' +
       'harder, and that difficulty is what makes it stick.'],
      ['Spread it out.',
       'Twenty minutes on five different days beats two hours on one.'],
      ['Make starting tiny.',
       '"Open the book and do one question" is a real task. Once you have ' +
       'started, you usually keep going.'],
    ],
    missed:
      'One skipped evening is fine. Two in a row starts a habit of ' +
      'skipping. Tomorrow, do the smallest version, even just one question.',
    suggestions: [
      { id: 'edu-review-notes', tier: 'start', kind: 'habit', schedule: GS_WEEKDAYS,
        text: "Review today's class notes for 10 minutes", next: 'edu-study-session' },
      { id: 'edu-one-question', tier: 'start', kind: 'habit', schedule: GS_DAILY,
        text: 'Do one practice question', next: 'edu-self-quiz' },

      { id: 'edu-study-session', tier: 'level', kind: 'habit', schedule: GS_WEEKDAYS,
        text: 'Study session: 25 min focus, 5 min break' },
      { id: 'edu-self-quiz', tier: 'level', kind: 'habit', schedule: GS_SAT,
        text: "Quiz myself on this week's topics",
        subtasks: ['Write 5 questions from memory', 'Answer them without notes',
                   'Check and fix my mistakes'] },
      { id: 'edu-homework-early', tier: 'level', kind: 'habit', schedule: GS_WEEKDAYS,
        text: 'Finish homework before 8pm' },
      { id: 'edu-read', tier: 'level', kind: 'habit', schedule: GS_DAILY,
        text: 'Read for 20 minutes (anything, not for school)' },

      { id: 'edu-exam-plan', tier: 'once', kind: 'once', impact: 3,
        text: 'Make a study plan for exam week',
        subtasks: ['List every exam and its date', 'Break each subject into topics',
                   'Put the topics on a calendar'] },
      { id: 'edu-backlog', tier: 'once', kind: 'once', impact: 7,
        text: 'Clear my backlog of unfinished homework' },
    ],
  },

  exercise: {
    tagline: 'Any movement counts. Start with ten minutes.',
    why:
      'Moving your body is not only about fitness. It helps your energy, ' +
      'focus and mood through a long school day, and it helps you sleep. ' +
      'Health guidelines suggest teenagers get about an hour of activity ' +
      'a day, and walking, cycling and sports practice all count toward it.',
    how: [
      ['Any movement counts.',
       'Walking to school, taking the stairs and dancing in your room ' +
       'all count. It does not have to be a "workout".'],
      ['Attach it to something you already do.',
       'Ten squats after brushing your teeth is easier to remember than ' +
       '"exercise more".'],
      ['Mix it up across the week.',
       'Get your heart rate up on most days, and add some strength work ' +
       '(push-ups, squats) a few times a week.'],
    ],
    missed:
      'Rest days are not failures. If today was not on your schedule, ' +
      'your streak is safe. If it was, a 10-minute walk still counts.',
    suggestions: [
      { id: 'ex-walk', tier: 'start', kind: 'habit', schedule: GS_DAILY,
        text: '10-minute walk', next: 'ex-cardio' },
      { id: 'ex-pushups-squats', tier: 'start', kind: 'habit', schedule: GS_DAILY,
        text: '10 push-ups and 10 squats', next: 'ex-strength' },

      { id: 'ex-cardio', tier: 'level', kind: 'habit', schedule: GS_MWF,
        text: '30 minutes of cardio (run, bike, swim or a sport)' },
      { id: 'ex-strength', tier: 'level', kind: 'habit', schedule: GS_TTS,
        text: 'Bodyweight strength circuit',
        subtasks: ['Push-ups', 'Squats', 'Plank', 'Lunges'] },
      { id: 'ex-stretch', tier: 'level', kind: 'habit', schedule: GS_DAILY,
        text: 'Stretch for 10 minutes before bed' },
      { id: 'ex-stairs', tier: 'level', kind: 'habit', schedule: GS_WEEKDAYS,
        text: 'Take the stairs, not the lift' },

      { id: 'ex-try-sport', tier: 'once', kind: 'once', impact: 3,
        text: "Try a sport or class I've never done" },
      { id: 'ex-plan-week', tier: 'once', kind: 'once', impact: 1,
        text: 'Plan my workouts for the week' },
    ],
  },

  mindfulness: {
    tagline: 'A few quiet minutes a day, at the same time every day.',
    why:
      'School, exams, friends and family all pull at your attention at ' +
      'once. A few quiet minutes a day will not fix everything, but they ' +
      'give you room to notice how you feel before it takes over the ' +
      'whole day.',
    how: [
      ['Short and daily beats long and rare.',
       'Three minutes every day is worth more than thirty minutes once ' +
       'a month.'],
      ['You do not have to "clear your mind".',
       'Noticing your thoughts wander and bringing your attention back ' +
       'is the exercise itself.'],
      ['Pick a fixed moment.',
       'Right after waking up, on the bus, or before bed. The same time ' +
       'every day.'],
    ],
    missed:
      'Being hard on yourself for missing a day of mindfulness misses ' +
      'the point. Just breathe tomorrow.',
    support: true,
    suggestions: [
      { id: 'mind-three-breaths', tier: 'start', kind: 'habit', schedule: GS_DAILY,
        text: 'Take 3 slow breaths before I open my phone', next: 'mind-breathing' },
      { id: 'mind-one-good-thing', tier: 'start', kind: 'habit', schedule: GS_DAILY,
        text: 'Write down one good thing from today', next: 'mind-journal' },

      { id: 'mind-breathing', tier: 'level', kind: 'habit', schedule: GS_DAILY,
        text: '5 minutes of breathing or meditation' },
      { id: 'mind-journal', tier: 'level', kind: 'habit', schedule: GS_DAILY,
        text: 'Journal for 10 minutes',
        subtasks: ['How do I feel right now?', "What's on my mind?",
                   "One thing I'm looking forward to"] },
      { id: 'mind-phone-free-walk', tier: 'level', kind: 'habit', schedule: GS_WEEKENDS,
        text: 'Go for a walk without my phone' },
      { id: 'mind-no-social-morning', tier: 'level', kind: 'habit', schedule: GS_DAILY,
        text: 'No social media for the first 30 minutes of the day' },

      { id: 'mind-notifications', tier: 'once', kind: 'once', impact: 1,
        text: "Turn off the notifications I don't need" },
      { id: 'mind-letter', tier: 'once', kind: 'once', impact: 1,
        text: 'Write a letter to myself to open after exams' },
    ],
  },

  sleep: {
    tagline: 'Same wake-up time, every day. Everything else follows.',
    why:
      'Teenagers need more sleep than adults, about 8 to 10 hours a ' +
      'night, and most get less. Short sleep makes it harder to focus, ' +
      'to remember what you studied and to stay in a good mood. Sleep is ' +
      "when the day's studying actually gets saved.",
    how: [
      ['Wake up at the same time every day.',
       'Weekends included, as close as you can. This one change does ' +
       'more than any other.'],
      ['Wind down before bed.',
       'Bright screens and scrolling make it harder to fall asleep. Give ' +
       'yourself 30 minutes without them.'],
      ['Do not trade sleep for study.',
       'An all-nighter usually costs you more in the exam than the extra ' +
       'hours gave you.'],
    ],
    missed:
      'A late night happens, especially around exams. Don\'t sleep until ' +
      'noon to make up for it. Get up at your usual time and go to bed a ' +
      'little earlier.',
    suggestions: [
      { id: 'sleep-phone-away', tier: 'start', kind: 'habit', schedule: GS_DAILY,
        text: 'Phone away 30 minutes before bed', next: 'sleep-routine' },
      { id: 'sleep-bedtime', tier: 'start', kind: 'habit', schedule: GS_DAILY,
        text: 'In bed by 10:30pm', next: 'sleep-same-wake' },

      { id: 'sleep-same-wake', tier: 'level', kind: 'habit', schedule: GS_DAILY,
        text: 'Wake up at the same time, weekends too' },
      { id: 'sleep-routine', tier: 'level', kind: 'habit', schedule: GS_DAILY,
        text: 'Bedtime routine',
        subtasks: ["Pack my bag for tomorrow", 'Brush my teeth',
                   'Phone charging away from my bed', 'Lights off'] },
      { id: 'sleep-caffeine', tier: 'level', kind: 'habit', schedule: GS_DAILY,
        text: 'No caffeine after 3pm' },
      { id: 'sleep-sunlight', tier: 'level', kind: 'habit', schedule: GS_DAILY,
        text: 'Get some daylight within an hour of waking up' },

      { id: 'sleep-room', tier: 'once', kind: 'once', impact: 3,
        text: 'Set up my room for sleep: dark, cool and quiet' },
      { id: 'sleep-charger', tier: 'once', kind: 'once', impact: 1,
        text: 'Move my phone charger away from my bed' },
    ],
  },

  chores: {
    tagline: 'Reset a little every day so the big mess never forms.',
    why:
      'Nobody gets excited about chores. But a clear desk makes it easier ' +
      'to start studying, clean clothes mean calmer mornings, and helping ' +
      'at home is practice for living on your own one day.',
    how: [
      ['If it takes under two minutes, do it now.',
       'Hanging up the towel is quicker than thinking about it later.'],
      ['Reset, don\'t deep-clean.',
       'Ten minutes of putting things back every day stops the big mess ' +
       'from ever forming.'],
      ['Tie chores to fixed times.',
       'After dinner, before bed, Saturday morning.'],
    ],
    missed:
      'Chores pile up, but a reset catches up fast. Ten minutes tomorrow ' +
      'and you are back where you were.',
    suggestions: [
      { id: 'ch-bed', tier: 'start', kind: 'habit', schedule: GS_DAILY,
        text: 'Make my bed', next: 'ch-room-reset' },
      { id: 'ch-desk', tier: 'start', kind: 'habit', schedule: GS_DAILY,
        text: 'Clear my desk before bed', next: 'ch-room-reset' },

      { id: 'ch-room-reset', tier: 'level', kind: 'habit', schedule: GS_DAILY,
        text: '10-minute room reset' },
      { id: 'ch-dishes', tier: 'level', kind: 'habit', schedule: GS_DAILY,
        text: 'Wash my own dishes after eating' },
      { id: 'ch-laundry', tier: 'level', kind: 'habit', schedule: GS_SAT,
        text: 'Do my laundry',
        subtasks: ['Wash', 'Hang or dry', 'Fold and put away'] },
      { id: 'ch-help-home', tier: 'level', kind: 'habit', schedule: GS_MWF,
        text: 'Help with one job around the house' },

      { id: 'ch-wardrobe', tier: 'once', kind: 'once', impact: 7,
        text: "Clear out my wardrobe and donate what I don't wear" },
      { id: 'ch-school-bag', tier: 'once', kind: 'once', impact: 1,
        text: 'Sort out my school bag and supplies' },
    ],
  },

  finance: {
    tagline: 'Know where it goes. Save first, spend what is left.',
    why:
      'Whatever you are saving for, whether that is new shoes, a trip or ' +
      'a gift, the habits that get you there are the ones you will use ' +
      'with a real salary later. A small allowance is the cheapest time ' +
      'to learn them.',
    how: [
      ['Know where it goes.',
       'Most people are surprised when they track a week of spending. ' +
       'You can\'t change what you don\'t see.'],
      ['Save first, spend what\'s left.',
       'Put some aside the moment you get money, not "whatever is left" ' +
       'at the end of the month.'],
      ['Wait before you buy.',
       'For anything you don\'t need, wait a day. If you still want it ' +
       'tomorrow, go ahead.'],
    ],
    missed:
      'One unplanned purchase doesn\'t undo anything. Write it down and ' +
      'move on.',
    note:
      'Amounts are shown in Thai baht and US dollars. Change them to fit ' +
      'your own allowance after planting.',
    suggestions: [
      { id: 'fin-log-spending', tier: 'start', kind: 'habit', schedule: GS_DAILY,
        text: 'Write down what I spent today', next: 'fin-weekly-check' },
      { id: 'fin-no-impulse', tier: 'start', kind: 'habit', schedule: GS_WEEKDAYS,
        text: 'No impulse buys today', next: 'fin-wait-24h' },

      { id: 'fin-save-first', tier: 'level', kind: 'habit', schedule: GS_SUN,
        text: 'Put ฿100 / $3 of my allowance into savings' },
      { id: 'fin-bring-snacks', tier: 'level', kind: 'habit', schedule: GS_WEEKDAYS,
        text: 'Bring water and snacks from home instead of buying them' },
      { id: 'fin-weekly-check', tier: 'level', kind: 'habit', schedule: GS_SUN,
        text: 'Weekly money check',
        subtasks: ["Add up this week's spending", 'Compare it to my budget',
                   'Move what is left into savings'] },
      { id: 'fin-wait-24h', tier: 'level', kind: 'habit', schedule: GS_DAILY,
        text: 'Wait 24 hours before buying anything over ฿500 / $15' },

      { id: 'fin-savings-goal', tier: 'once', kind: 'once', impact: 3,
        text: 'Pick one thing to save for and write down its price' },
      { id: 'fin-budget', tier: 'once', kind: 'once', impact: 3,
        text: 'Make a simple monthly budget',
        subtasks: ['Money coming in', 'Things I must spend on',
                   'Things I want to spend on', 'How much I will save'] },
    ],
  },

  misc: {
    tagline: 'The things you do just because you want to.',
    why:
      'Not everything fits in a box. Learning guitar, drawing, cooking, ' +
      'a new language, a side project: the things you do just because ' +
      'you want to are often the ones that shape who you become.',
    how: [
      ['Protect a small daily slot.',
       'Fifteen minutes of practice every day beats a two-hour session ' +
       'you keep putting off.'],
      ['Count practice, not talent.',
       'Your plant grows because you showed up, not because you are ' +
       'already good at it.'],
      ['Keep it fun.',
       'If a hobby starts to feel like a chore, change how you do it, ' +
       'not whether you do it.'],
    ],
    missed:
      'Hobbies are allowed to have days off. Pick it up again tomorrow.',
    suggestions: [
      { id: 'misc-hobby', tier: 'start', kind: 'habit', schedule: GS_DAILY,
        text: '15 minutes on my hobby', next: 'misc-instrument' },
      { id: 'misc-words', tier: 'start', kind: 'habit', schedule: GS_DAILY,
        text: "Learn 5 new words in a language I'm learning" },

      { id: 'misc-instrument', tier: 'level', kind: 'habit', schedule: GS_WEEKDAYS,
        text: 'Practise my instrument' },
      { id: 'misc-create', tier: 'level', kind: 'habit', schedule: GS_DAILY,
        text: 'Draw or write something small' },
      { id: 'misc-cook', tier: 'level', kind: 'habit', schedule: GS_WEEKENDS,
        text: 'Cook, or help cook, one meal' },
      { id: 'misc-side-project', tier: 'level', kind: 'habit', schedule: GS_WEEKENDS,
        text: 'Work on my side project',
        subtasks: ["Decide today's one goal", 'Work on it', "Note what's next"] },

      { id: 'misc-finish', tier: 'once', kind: 'once', impact: 7,
        text: 'Finish one thing I started and gave up on' },
      { id: 'misc-share', tier: 'once', kind: 'once', impact: 1,
        text: 'Show someone something I made' },
    ],
  },
};

var GUIDE_TIERS = [
  { id: 'start', title: 'Start here',
    note: 'Almost too easy, on purpose. Streaks start with easy wins.' },
  { id: 'level', title: 'Level up',
    note: 'Once a starter has stuck for a couple of weeks, add one of these.' },
  { id: 'once',  title: 'One-offs',
    note: 'Assignments you only do once. Bigger ones grow their plant more.' },
];


// ============================================
// Page state
// ============================================
var pageGuideEl    = document.getElementById('page-guide');
var guideContentEl = document.getElementById('guideContent');

// Which guide is open: a category id, or null for the front page.
// Set by navigateTo() in 01 from the #guide/<category> hash.
var guideCategory = null;

function guideCategoryById(id) {
  for (var i = 0; i < CATEGORIES.length; i++) {
    if (CATEGORIES[i].id === id) return CATEGORIES[i];
  }
  return null;
}

// Only a category that has a guide is a real destination; anything
// else in the hash is treated as the front page.
function isGuideCategory(id) {
  return !!(id && CATEGORY_GUIDES[id] && guideCategoryById(id));
}


// ============================================
// Small helpers
// ============================================
function guideArt(catId, size) {
  if (typeof getPlantSVG !== 'function') return '';
  // The last stage, so every guide shows the plant it is growing toward.
  return getPlantSVG(catId, 3, null, size);
}

function guideSuggestion(catId, sugId) {
  var g = CATEGORY_GUIDES[catId];
  if (!g) return null;
  for (var i = 0; i < g.suggestions.length; i++) {
    if (g.suggestions[i].id === sugId) return g.suggestions[i];
  }
  return null;
}

function guideNormText(s) {
  return String(s || '').trim().toLowerCase();
}

// "Already planted" is a match on name within the same plot. Loose on
// purpose: renaming a planted suggestion frees it up again, which is
// the right answer, since it is no longer the same task.
function guideIsPlanted(catId, sug) {
  if (!Array.isArray(tasks)) return false;
  var want = guideNormText(sug.text);
  return tasks.some(function (t) {
    return t.categoryId === catId && guideNormText(t.text) === want;
  });
}

function guideMetaLabel(sug) {
  if (sug.kind === 'once') {
    var imp = null;
    TASK_IMPACTS.forEach(function (i) { if (i.value === sug.impact) imp = i; });
    return 'Assignment' + (imp ? ' · ' + imp.label + ' impact' : '');
  }
  var when = (typeof tpScheduleLabel === 'function')
    ? tpScheduleLabel({ schedule: sug.schedule })
    : 'Every day';
  return 'Habit · ' + when;
}


// ============================================
// Rendering
// ============================================
function renderGuidePage() {
  if (!guideContentEl) return;
  guideContentEl.innerHTML = isGuideCategory(guideCategory)
    ? guideCategoryHtml(guideCategory)
    : guideIndexHtml();
}

function guideIndexHtml() {
  var cards = CATEGORIES.map(function (cat) {
    var g = CATEGORY_GUIDES[cat.id];
    if (!g) return '';
    return (
      '<button type="button" class="guide-card" data-guide-open="' + cat.id + '">' +
        '<span class="guide-card-art">' + guideArt(cat.id, 72) + '</span>' +
        '<span class="guide-card-text">' +
          '<span class="guide-card-name">' + escapeHtml(cat.name) + '</span>' +
          '<span class="guide-card-species">grows ' + escapeHtml(cat.species) + '</span>' +
          '<span class="guide-card-tagline">' + escapeHtml(g.tagline) + '</span>' +
        '</span>' +
        '<span class="guide-card-arrow" aria-hidden="true">&rarr;</span>' +
      '</button>'
    );
  }).join('');

  return (
    '<nav class="guide-crumbs">' +
      '<button type="button" class="guide-crumb" data-guide-back="tasks">&larr; Tasks</button>' +
    '</nav>' +
    '<header class="guide-hero">' +
      '<h2 class="guide-hero-title">The Grower\'s Guide</h2>' +
      '<p class="guide-hero-lede">Not sure what to plant? Every part of your ' +
        'life has its own plot. Pick one to see why it matters, how to ' +
        'actually stick with it, and tasks you can plant in one tap.</p>' +
      '<p class="guide-hero-tip">Tip: start with <b>one</b> easy habit, not ' +
        'five. You can always add more once it grows.</p>' +
    '</header>' +
    '<div class="guide-grid">' + cards + '</div>'
  );
}

function guideCategoryHtml(catId) {
  var cat = guideCategoryById(catId);
  var g   = CATEGORY_GUIDES[catId];

  var how = g.how.map(function (h, i) {
    return (
      '<li class="guide-how-item">' +
        '<span class="guide-how-num">' + (i + 1) + '</span>' +
        '<span><b>' + escapeHtml(h[0]) + '</b> ' + escapeHtml(h[1]) + '</span>' +
      '</li>'
    );
  }).join('');

  var tiers = GUIDE_TIERS.map(function (tier) {
    var list = g.suggestions.filter(function (s) { return s.tier === tier.id; });
    if (!list.length) return '';
    return (
      '<section class="guide-tier">' +
        '<h3 class="tp-section-title">' + escapeHtml(tier.title) + '</h3>' +
        '<p class="tp-section-note">' + escapeHtml(tier.note) + '</p>' +
        '<ul class="guide-sugs">' + list.map(function (s) {
          return guideSuggestionHtml(catId, s);
        }).join('') + '</ul>' +
      '</section>'
    );
  }).join('');

  var support = g.support
    ? '<aside class="guide-card-panel guide-support">' +
        '<h3 class="guide-panel-title">If things feel heavy</h3>' +
        '<p>If you have felt low, anxious or overwhelmed for more than a few ' +
        'days, talking to someone helps: a friend, someone in your family, a ' +
        'teacher or a school counsellor.</p>' +
        '<p>In Thailand you can call the Department of Mental Health ' +
        'hotline on <a href="tel:1323"><b>1323</b></a>. It is free, ' +
        'confidential and open 24 hours a day. In an emergency, call ' +
        '<a href="tel:1669"><b>1669</b></a>.</p>' +
      '</aside>'
    : '';

  var note = g.note
    ? '<p class="guide-note">' + escapeHtml(g.note) + '</p>'
    : '';

  return (
    '<nav class="guide-crumbs">' +
      '<button type="button" class="guide-crumb" data-guide-open="">&larr; All guides</button>' +
      '<button type="button" class="guide-crumb" data-guide-back="' + catId + '">My ' +
        escapeHtml(cat.name) + ' tasks</button>' +
    '</nav>' +

    '<header class="guide-hero guide-hero-cat">' +
      '<span class="guide-hero-art">' + guideArt(catId, 96) + '</span>' +
      '<div>' +
        '<h2 class="guide-hero-title">' + escapeHtml(cat.name) + '</h2>' +
        '<p class="guide-hero-species">grows ' + escapeHtml(cat.species) + '</p>' +
        '<p class="guide-hero-lede">' + escapeHtml(g.tagline) + '</p>' +
      '</div>' +
    '</header>' +

    '<div class="guide-cols">' +
      '<div class="guide-col">' +
        '<section class="guide-card-panel">' +
          '<h3 class="guide-panel-title">Why it matters</h3>' +
          '<p>' + escapeHtml(g.why) + '</p>' +
        '</section>' +
        '<section class="guide-card-panel">' +
          '<h3 class="guide-panel-title">How to actually do it</h3>' +
          '<ol class="guide-how">' + how + '</ol>' +
        '</section>' +
        '<section class="guide-card-panel guide-missed">' +
          '<h3 class="guide-panel-title">If you miss a day</h3>' +
          '<p>' + escapeHtml(g.missed) + '</p>' +
        '</section>' +
        support +
      '</div>' +
      '<div class="guide-col">' + note + tiers + '</div>' +
    '</div>'
  );
}

function guideSuggestionHtml(catId, s) {
  var planted = guideIsPlanted(catId, s);

  var steps = (s.subtasks && s.subtasks.length)
    ? '<ul class="guide-sug-steps">' + s.subtasks.map(function (t) {
        return '<li>' + escapeHtml(t) + '</li>';
      }).join('') + '</ul>'
    : '';

  var btn;
  if (planted) {
    btn = '<span class="guide-planted">Planted</span>';
  } else if (!authReady) {
    btn = '<button type="button" class="guide-plant-btn" disabled>Loading&hellip;</button>';
  } else {
    btn = '<button type="button" class="guide-plant-btn" data-guide-plant="' +
          s.id + '" data-guide-cat="' + catId + '">Plant this</button>';
  }

  return (
    '<li class="guide-sug' + (s.kind === 'once' ? ' is-once' : '') +
      (planted ? ' is-planted' : '') + '">' +
      '<div class="guide-sug-body">' +
        '<span class="guide-sug-text">' + escapeHtml(s.text) + '</span>' +
        '<span class="guide-sug-meta">' + escapeHtml(guideMetaLabel(s)) + '</span>' +
        steps +
      '</div>' +
      btn +
    '</li>'
  );
}


// ============================================
// Planting a suggestion
//
// The same steps as the add form in 12, with the extra fields filled
// in, then straight into the task sheet on the new plant so every
// choice made here can be changed before it matters.
// ============================================
function guidePlant(catId, sugId) {
  if (!authReady) return;
  var s = guideSuggestion(catId, sugId);
  if (!s || guideIsPlanted(catId, s)) return;

  var task = makeTask(nextId, s.text, catId);
  task.kind     = (s.kind === 'once') ? 'once' : 'habit';
  task.schedule = (task.kind === 'habit') ? normalizeSchedule(s.schedule) : null;
  task.impact   = (task.kind === 'once') ? normalizeImpact(s.impact) : TASK_IMPACT_DEFAULT;
  task.subtasks = normalizeSubtasks((s.subtasks || []).map(function (text, i) {
    return { id: i + 1, text: text, done: false };
  }));
  tasks.push(task);
  nextId++;

  assignPermanentPositions();
  saveData();

  // Land on this plot's tasks, with the new plant's sheet open.
  tpCategory = catId;
  if (typeof tpAddCatEl !== 'undefined' && tpAddCatEl) tpAddCatEl.value = catId;
  render();
  navigateTo('tasks');
  tpOpenSheet(task.id);
}


// ============================================
// Clicks. One delegated listener, because the page body is rebuilt
// on every render.
// ============================================
if (guideContentEl) {
  guideContentEl.addEventListener('click', function (e) {
    var plant = e.target.closest('[data-guide-plant]');
    if (plant) {
      guidePlant(plant.getAttribute('data-guide-cat'), plant.getAttribute('data-guide-plant'));
      return;
    }

    var open = e.target.closest('[data-guide-open]');
    if (open) {
      navigateTo('guide', { guideCat: open.getAttribute('data-guide-open') || null });
      return;
    }

    var back = e.target.closest('[data-guide-back]');
    if (back) {
      var to = back.getAttribute('data-guide-back');
      tpCategory = (to && to !== 'tasks') ? to : 'all';
      if (tpCategory !== 'all' && typeof tpAddCatEl !== 'undefined' && tpAddCatEl) {
        tpAddCatEl.value = tpCategory;
      }
      navigateTo('tasks');
    }
  });
}


// ============================================
// The way in, from the Tasks page
//
// A strip under the plot filter. On "All plots" it points at the
// front page; on a single plot it points at that plot's guide.
// Called from renderTaskList() in 12.
// ============================================
var tpGuideLinkEl = document.getElementById('tpGuideLink');

function tpRenderGuideLink() {
  if (!tpGuideLinkEl) return;
  var cat = (tpCategory && tpCategory !== 'all') ? guideCategoryById(tpCategory) : null;

  var label = cat
    ? 'How to grow ' + cat.name + ': ideas and tips'
    : "Not sure what to plant? Read the Grower's Guide";
  var target = cat ? cat.id : '';

  if (tpGuideLinkEl.dataset.target === target && tpGuideLinkEl.innerHTML) return;
  tpGuideLinkEl.dataset.target = target;
  tpGuideLinkEl.innerHTML =
    '<button type="button" class="tp-guide-btn" data-guide-open="' + target + '">' +
      '<span class="tp-guide-icon" aria-hidden="true">' +
        '<svg viewBox="0 0 20 20" width="18" height="18"><path d="M4 3.5h8.5a3 3 0 0 1 3 3V17H7a3 3 0 0 1-3-3z" ' +
        'fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>' +
        '<path d="M8 7.5h4.5M8 10.5h4.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>' +
      '</span>' +
      '<span class="tp-guide-label">' + escapeHtml(label) + '</span>' +
      '<span class="tp-guide-arrow" aria-hidden="true">&rarr;</span>' +
    '</button>';
}

if (tpGuideLinkEl) {
  tpGuideLinkEl.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-guide-open]');
    if (!btn) return;
    navigateTo('guide', { guideCat: btn.getAttribute('data-guide-open') || null });
  });
}
