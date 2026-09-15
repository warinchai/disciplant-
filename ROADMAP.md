# Disciplant — Roadmap

**Last updated:** 15 September 2026

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
* ⬜ **B2** — Streak insurance
* ⬜ **B3** — Pause / vacation mode
* 🔜 **B4** — Retroactive ticking — *priority for retention*
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
* ⬜ **D2** — Seeds spendable on head starts or skin unlocks
* ⬜ **D3** — Garden-level aggregate goals
* ⬜ **D4** — Plot expansion / new terrain

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

* **H1** — Onboarding / seeded first habit. New users land on an empty garden, which is the worst possible first screen for an app whose value proposition is a plant growing.
* **H2** — Undo a tick. No clean reversal today; `retuneAward()` machinery is mostly already in place.
* **H3** — Manual task ordering. No reorder in the task list; daily habits should be able to sit at the top.
* **H4** — Archive instead of delete. Deleting a finished habit destroys the history that made it satisfying. Archive keeps it out of the denominator but preserves the plant.

### I. Correctness

* **I1** — Timezone / travel handling. `getTodayString()` is local-date based with no stored home timezone; crossing zones can silently break a streak or grant a double day.
* **I2** — Import. Export exists in `10-account-data.js` and `verify-history.js` proves the round-trip is lossless, but there is no import path.

---

## Invariants — do not break

* **`EFFORT_LEVELS` index is the stored character.** Never reorder that array. `'1'` must mean Steady forever, because every day predating C1 holds a `'1'`.
* **Packed history is load-bearing.** One character per day-of-year keeps Firestore egress flat as history grows. Any change reintroducing per-day keyed maps defeats the entire design.
* **Migrations should be no-ops where possible.** C1 and C3 both shipped as genuine no-ops on existing data. Aim for that.
* **Denominators err toward flattering the past.** The `firstSeen` approximation is deliberate — using current task count for historical heatmap cells produces misleading shading.
* **SVG colours use `style="fill:var(--c-leaf,…)"`,** never `fill="var(…)"` — CSS custom properties in SVG presentation attributes are unreliable cross-browser.
* **`cleanUrls: true` on Vercel** requires root-absolute paths in HTML, and breaks HTML-file Search Console verification (use the meta tag method).

## Test suites

Tests are additive — none should be lost between sessions.

| File | Coverage | Runner |
| --- | --- | --- |
| `test-app.js` | ~194 checks | jsdom |
| `verify-history.js` | 77 assertions, round-trip losslessness | node |
| `test-impact.js` | UI smoke test | jsdom |
| `test-appcheck.js` | 28 checks, App Check vs rate-limit denial | jsdom |

Validate syntax with `node --check` after every change.
Serve locally with `python3 -m http.server 8000` so root-absolute paths resolve.
