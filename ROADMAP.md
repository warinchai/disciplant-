# Disciplant — Roadmap

**Last updated:** 4 October 2026

Legend: ✅ done · ⬜ open · 🔜 next up · ❌ dropped

---

## A. Task model

* ✅ **A1** — One-off vs recurring task types; one-offs leave the permanent list when done
* ❌ **A2** — One-offs feed growth into a chosen existing plant *(dropped — they get their own plants and it works)*
* ✅ **A3** — Subtasks / checklist within a task
* ✅ **A4** — Partial credit from subtasks — `weight × (done/total)`, floor of one step; `retuneAward()` prevents drift when re-rating or editing steps on a live tick
* ⬜ **A5** — Per-habit difficulty weight — UI change plus one denominator guard; `taskGrowthWeight` already exists, no schema change needed
* ⬜ **A6** — Batch quick-add flow
* ✅ **A7** — Real creation date stored per task
* ✅ **A8** — Impact rating on one-offs — Small 1 / Medium 3 / Large 7 / Major 14, selected in the task sheet

## B. Scheduling & fairness

* ✅ **B1** — Custom schedule (7-bit weekday mask); streaks only break on scheduled days
* ✅ **B2** — Streak insurance: **Mulch** (`18-market.js`). 15 Dew (was 25), hold at most 10 (was 2). Since 5 October 2026 it is the **only way to log a missed day**: a habit due yesterday and not ticked can be logged late by spending one bag, which brings back the day, its growth, its streak and its tick Dew exactly as an on-time tick would (it is B4 with a price). Chosen per plant, from the "Forgot to tick yesterday?" card, the habit's sheet, or the Market's "Not ticked yesterday" list. Yesterday only; re-ratable and undoable until today ends (undo returns the bag); one per plant per 7 days. History of the design: first automatic at midnight and streak-only, then manual and streak-only, then merged with B4 so there is one button, not two.
* ❌ **B3** — Pause / vacation mode *(shipped, then removed 5 October 2026)*. A free 3/7/14-day freeze in the Booster Market. It could not be ended - see the save fix under Infrastructure - and was cut rather than fixed; Fertilizer took its slot. A garden that still stores one drops it on load, so its days count as due again
* ✅ **B4** — Retroactive ticking (`17-yesterday.js`), **now paid for with Mulch** (B2): 18 wraps `ydFix` / `ydUndo` so every late log spends a bag and every undo returns it; there is no free path on the live site. 17 is still the engine: yesterday only, habits only, only a day the habit was scheduled for and not before it existed; logs yesterday with an effort level, grows the plant by an ordinary tick, rebuilds the streak from history, pays the habit-tick Dew plus any milestone. One optional task field, `lateOn`, written only while it is today's. The card sits under the Tasks page list (hideable for the day)
* ✅ **B5** — Heatmap denominator rebuilt on B1 + A7

## C. Growth & visibility

* ✅ **C1** — Effort buckets in the packed history — `'0'` not done / `'1'` Steady ×1 / `'2'` Hard ×1.5 / `'3'` All out ×2
* ✅ **C2** — Effort affects growth rate — each day reads its own bucket, not one multiplier across the window
* ✅ **C3** — Growth points replacing integer days — `totalGrowthDays` is fractional (3dp); `clampGrowthDays` split into `clampGrowthPoints` and `clampStreak`
* ✅ **C4** — Visible delta next to the height tag
* ✅ **C5** — Growth line chart on Stats
* ⬜ **C6** — Window scrubber for "show today's growth"
* ⬜ **C7** — Consistency as a second visual dimension
* ⬜ **C8** — Milestone decoration layer
* ⬜ **C9** — More growth stages
* ⬜ **C10** — Distinct celebration at real milestones
* ⬜ **C11** — Milestone journal note
* ✅ **C12** — Effort prompt modal (`#effortAsk`) on every tick

## D. Progression & rewards

* ⬜ **D1** — Harvest a mature plant into a seed
* ⬜ **D2** — Seeds spendable on head starts or skin unlocks *(skin unlocks now covered by Dew, D5; head starts deliberately not — Dew never buys growth)*
* ⬜ **D3** — Garden-level aggregate goals
* ⬜ **D4** — Plot expansion / new terrain
* ✅ **D5** — Dew currency (`15-wallet.js`). Earned: 3 per habit tick, cap 30/day (1 and 10/day until 6 October 2026, raised so more habits pay noticeably more than the flat daily quests and Morning dew), an assignment's impact on completion (cap 25/day, nothing for one under 10 minutes old), and streak bonuses at 7/30/100/365 days off `maxStreak`. Spent on plant skins (per species, by slot: 50/75/100/150) and landscapes (150 / 250). Raised on 6 October 2026 from 30/40/50/80 and 100/150, because a bought look is permanent and covers every plant of the species, while boosters (used once) were cut Same-day unticks refund exactly what was paid; achievement unlocks still work as a free route. Stored as one `wallet` map on `gardens/{uid}`, riding on the existing save; never mirrored to `gardenSummaries`
* ✅ **D7** — The Greenhouse's two markets (`18-market.js`). One page, two tabs under one Dew balance: **Decoration Market** (the existing plant skins and landscapes, unchanged) and **Booster Market** (Mulch and Fertilizer, as linen item cards: name, price, one sentence, fact chips, an action strip, then who to use it on). The menu plank opens Decoration; `#market` / `navigateTo('market')` and "Get Mulch" open Boosters. There was briefly a separate Market page (5 October 2026); merged on request so all spending is in one place. Pets/props are deferred
* ✅ **D8** — **Fertilizer** (`18-market.js`). 20 Dew (was 40), hold at most 10 (was 2). Put on one plant you choose; for 7 days from that day every tick on it gets +0.25 on top of its effort (Steady ×1.25, Hard ×1.75, All out ×2.25). A day not ticked gets nothing. One bag per plant at a time; undoable the day it went on. Works through `growthBonusOn()` / `dayMultiplier()` in 01, so the tick, the show/hide toggle, the 7-day gain, the charts and a Mulch late-log all count it the same way; putting it on or taking it off retunes a live tick via `retuneAward()`. Fed weeks are kept per plant (`wallet.mk.fert`) so old charts stay right. The Tasks row says "Fertilized until …"
* ✅ **D6** — Rewards page (`16-rewards.js`): Morning dew (a 7-step daily collect ladder, reset by a missed day), three daily / weekly / monthly quests, and 12 lifelong badges. All progress is derived from stored history, `doneAt` and `maxStreak`; the only new state is which rewards were collected (`wallet.rw`)

## E. Social

* ⬜ **E1** — Friends comparison strip on Stats
* ⬜ **E2** — Water a friend's plant
* ⬜ **E3** — Co-op habits feeding one shared plant

## F. Ambient

* ⬜ **F1** — Weather derived from recent consistency
* ⬜ **F2** — Recoverable wilt on neglect

---

## Infrastructure

* ✅ Fix App Check misattribution in `02-auth-tasks.js` — `isRateLimitDenial()` treated every `permission-denied` as the rate limiter, so a broken attestation token was reported as a write-limit breach and retried three times for nothing. `classifyDenial()` now probes App Check for a fresh token at the moment of the denial and returns `appcheck` / `ratelimit` / `other`; all three write paths (`writeUserProfileDoc`, `saveData`, `writeGardenSummary`) branch on it, stop retrying when attestation is the cause, and roll back the optimistic `rlStart` they had recorded
* ✅ Contributors' pushes deploy on their own (4 October 2026). On Hobby with a private repo, Vercel blocked any commit not authored by the project owner, so every outside push needed a "redeploy" commit. Deploy hooks do not get round this — Vercel checks the latest commit's author for hook and CLI deploys too (tested: hook accepted, nothing went live). Fixed by making the GitHub repo public; verified with two pushes live in ~30 s each
* ⬜ App Check rollout checklist
* ⬜ Attach Cloud Billing to unlock finer reCAPTCHA score levels

---

## Proposed — not yet adopted

Gaps found by auditing the codebase rather than extending the existing groups.
IDs are provisional; nothing here is committed.

### G. Re-engagement

* **G1** — Service worker + real PWA. No `sw.js` exists. Unlocks offline read, instant loads, and iOS web-push eligibility (which requires home-screen install). Prerequisite for G2.
* **G2** — Daily reminder notification. Local notification at a user-set time, deep-linking to the tasks page. Local scheduling from the service worker avoids FCM setup and Firestore cost.
* **G3** — Share card. Render the garden to a PNG with a caption; reuses the existing SVG pipeline. Cheapest acquisition channel available for a free app.

### H. First run & list hygiene

* ✅ **H1** — Onboarding / seeded first habit *(adopted and shipped)*. An empty plot now shows a first-run card instead of two lines of text: six one-tap starter habits, one per plot and each drawn as the plant it grows into, plus a box for your own with the same Habit / Assignment switch and plant picker the Tasks page form has (defaults: habit, Miscellaneous). Planting walks the loop once on the real garden: "did you do it today?", then a pointer at Show today's growth. The stage is derived from the garden every time it is asked (`onboardStage()` in `13-onboarding.js`), so there is no new field, no new read and no localStorage, and a reload part-way through simply drops it. The Tasks page's empty state offers the same starters. The first tick skips the effort question and is logged Steady.
* ✅ **H2** — Undo a tick *(already covered)*. Unticking on the same day reverses everything — growth, streak, history and Dew. After midnight a tick is banked on purpose, and B4 covers the opposite case
* ✅ **H3** — Manual task ordering *(adopted and shipped)*. `task.order`, a manual override with the same semantics as `posX`/`posY`: a number means the user placed it, `null` means use the automatic sort. Placed tasks take the top of their list in the given order; everything unplaced keeps sorting itself underneath, so dragging one row never discards the due-date or growth sorts wholesale. Habits and assignments order separately. Drag handle on each row (pointer events, works on touch) plus up/down controls and a "back to automatic" reset in the detail sheet for keyboard reach. `compareTasks()` in 01 is now the single comparator; `tpSortHabits`/`tpSortAssignments` delegate to it. Orders are dense 0..n-1, rewritten per move, and written to Firestore only once a task is actually placed.
* **H4** — Archive instead of delete. Deleting a finished habit destroys the history that made it satisfying. Archive keeps it out of the denominator but preserves the plant.
* ✅ **H5** — The Grower's Guide *(adopted and shipped)*, `14-guides.js`. One page per category (`#guide`, `#guide/<category>`): why it matters for a student, three how-tos, "if you miss a day", and Start here / Level up / One-off suggestions, each planted in one tap with its schedule, type, impact and steps prefilled, then opened in the task sheet. Static content, nothing new stored. Linked from the Tasks page and a home-page sign. Mindfulness carries the 1323 / 1669 support note. Each suggestion's `next` field is in place for the later level-up nudge but not read yet

### I. Correctness

* ✅ **I1** — Timezone / travel handling *(adopted and shipped)*. `getTodayString()` never goes backwards: if the device date falls behind `lastResetDate` by up to `DAY_HOLD_MAX_DAYS` (2, the widest any two timezones differ), the garden stays on the later day until the local date catches up, so flying west can no longer re-open and double-pay a day. A bigger fall is a corrected clock and trusts the device. Flying east far enough to skip a calendar day is an ordinary missed day, which B4 offers. The Stats heatmap now counts from the same today instead of reading the clock itself
* **I2** — Import. Export exists in `10-account-data.js` and `verify-history.js` proves the round-trip is lossless, but there is no import path.
* ✅ **I4** — Garden saves replace fields instead of deep-merging them (`saveData` in 02). The write used `merge:true`, which merges INSIDE maps: a key the payload left out survived in the stored document and came back on the next snapshot. That made Pause impossible to end, and let an unticked habit's "already paid" Dew entry linger so it could be refunded twice. Now `mergeFields: Object.keys(payload)` - each named field is replaced whole, and unnamed ones (rlStart on the same-window branch) are left alone. Existing leftovers clear on each garden's next save
* 🔜 **I3** — Harden the Dew wallet in `firestore.rules` — **written, not yet published**: `walletOk()` on gardens create/update requires `bal == earned - spent`, `bal <= 99999`, Mulch and Fertilizer held `<= 11`, and a new `owned` entry only in a write that also spends. No per-write rise cap, because saves are coalesced and a first Rewards visit can legitimately collect hundreds at once. The client keeps the invariant itself (symmetric clamps in `dewCredit` / `dewRefund`, repair in `dewNormalizeWallet`). Must be pasted into the Firebase Console and published, after the client is live. Original note: Today the rules never look at the wallet, so the balance is one edit away. Free, partial fix: require `bal == earned - spent`, cap the balance rise per write (largest single reward is 80), and only allow a new `owned` entry when `spent` rose by at least its price. Not urgent while Dew buys only cosmetics and is never shown to anyone else; becomes necessary the moment it does either

---

## Invariants — do not break

* **`EFFORT_LEVELS` index is the stored character.** Never reorder that array. `'1'` must mean Steady forever, because every day predating C1 holds a `'1'`.
* **Packed history is load-bearing.** One character per day-of-year keeps Firestore egress flat as history grows. Any change reintroducing per-day keyed maps defeats the entire design.
* **Migrations should be no-ops where possible.** C1 and C3 both shipped as genuine no-ops on existing data. Aim for that.
* **Denominators err toward flattering the past.** The `firstSeen` approximation is deliberate — using current task count for historical heatmap cells produces misleading shading.
* **SVG colours use `style="fill:var(--c-leaf,…)"`,** never `fill="var(…)"` — CSS custom properties in SVG presentation attributes are unreliable cross-browser.
* **Dew never buys growth by itself.** Mulch gives the ordinary tick for a day the user says they did, logged late; Fertilizer makes the user's own ticks worth more for a week and does nothing on a day nobody ticked. Nothing adds a day nobody claims. Because Dew now reaches growth and streaks, which friends see, I3 must be published.
* **A day's growth multiplier is `dayMultiplier(task, date, level)`, never `effortMultiplier(level)` alone.** Anything that turns a day into growth has to go through it, or a fertilized day will be counted two ways.
* **Garden saves use `mergeFields`, not `merge:true`.** With deep merge, dropping a key from a map in the payload does not delete it.
* **`bal == earned - spent`** on the wallet, through every credit, refund and purchase. I3 relies on it.
* **Rewards are derived, not counted.** Quest and badge progress is read off history; only collected IDs are stored. Don't add a tick counter alongside toggleTask().
* **A past day is banked unless it was back-filled today.** `lateOn === today` is the only thing that makes yesterday changeable; never widen B4 past yesterday without rethinking that.
* **Read the date through `getTodayString()`, never `new Date()`.** It is the only thing that knows to hold a day after a westward flight; anything that reads the clock itself can disagree with the rest of the app about which day it is.
* **The repo is public.** Every commit, old ones included, is world-readable. Secrets (`serviceAccountKey.json`, `.env*`) stay gitignored.
* **`cleanUrls: true` on Vercel** requires root-absolute paths in HTML, and breaks HTML-file Search Console verification (use the meta tag method).

## Test suites

Tests are additive — none should be lost between sessions.

| File | Coverage | Runner |
| --- | --- | --- |
| `test-app.js` | 298 checks (incl. manual ordering, onboarding, guides, scope switch) | jsdom |
| `test-impact.js` | 62 checks, impact picker / effort dialog smoke test | jsdom |
| `test-appcheck.js` | 29 checks, App Check vs rate-limit denial | jsdom |
| `test-wallet.js` | 86 checks, Dew earning, refunds, caps, shop, pill | jsdom |
| `test-rewards.js` | 50 checks, Morning dew, quests, badges, navigation | jsdom |
| `test-reload.js` | 13 checks, a refresh on #greenhouse / #stats / #rewards / #tasks draws the page without leaving it | jsdom |
| `test-market.js` | 133 checks, Mulch buying / logging yesterday with it / weekly limit / Tasks card, Fertilizer (growth, charts, retune, undo, late logs), Pause removed, wallet invariant, saving incl. `mergeFields`, the Greenhouse's two tabs | jsdom |
| `test-timezone.js` | 25 checks, flying west / east, corrected clocks, heatmap's today | jsdom |
| `test-yesterday.js` | 70 checks, the B4 engine without the Market loaded (so free): eligibility, growth, streak, Dew, undo, card, sheet | jsdom |
| `verify-history.js` | 77 assertions, round-trip losslessness | node |

Every suite exits on its own with 0 on success, 1 on failure (`test-app.js` used to hang after passing; fixed 4 October 2026).

Validate syntax with `node --check` after every change.
Serve locally with `python3 -m http.server 8000` so root-absolute paths resolve.
