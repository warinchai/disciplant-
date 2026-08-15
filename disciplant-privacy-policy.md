# Disciplant — Privacy Policy

**Draft for review. Not legal advice. Every `[SQUARE BRACKET]` is a decision you have to make before this goes live.**

**Effective date:** `[DATE]`
**Last updated:** `[DATE]`

---

## 1. Who we are

Disciplant is a free habit tracker at `[https://disciplant.vercel.app]`. Completing a habit grows a plant in your garden.

The data controller — the party that decides why and how your information is used — is:

`[LEGAL NAME OR REGISTERED COMPANY NAME]`
`[REGISTERED ADDRESS OR SERVICE ADDRESS]`
`[COUNTRY]`

Contact for anything in this policy, including requests about your data: **`[privacy@yourdomain]`**

We aim to reply within `[30]` days.

> **Note on jurisdiction.** The service is operated from Thailand, so this is written primarily against the Personal Data Protection Act B.E. 2562 (PDPA), with GDPR-equivalent language where the two overlap. Users elsewhere are expected, and being outside Thailand does not reduce your rights — where the GDPR or another local law gives you more, that law applies to us in respect of your data regardless of where we are. If you incorporate outside Thailand, sections 8, 9 and 12 need revisiting.

---

## 2. The short version

- Your habit names are private. They are never shown to other users, and they are not used for advertising.
- Friends can see your garden — which means they can see the **category** of each habit (a sunflower means an exercise habit), your streaks, and your growth totals. They cannot see what any habit is called.
- You can download everything we hold at any time, and you can delete your account permanently from inside the app.
- We do not sell your data. We do not run ads.
- Google and Vercel process data on our behalf. Details in section 6.

The full version follows, because the short version is not a substitute for it.

---

## 3. What we collect

### 3.1 Account information

**If you use Disciplant as a guest,** we create an anonymous account. We hold only a randomly generated account identifier. We do not know who you are, and we cannot recover a guest account if you lose it.

**If you sign in with Google,** Google passes us:

- your account identifier
- your email address
- your display name
- your profile picture URL

We store these so your garden follows you between devices and so friends can recognise you.

**If you claim a username,** we store the username and a lowercase copy of it used to check that no two people take the same one. Your username is searchable by any other user.

### 3.2 Your habits and garden

For each habit you create, we store:

- the text you typed
- the category you chose
- the plant skin selected
- whether it is ticked off today
- your current and longest streak
- total days grown and your best-ever total
- **every date on which you ticked it off**
- where you dragged the plant in your garden

We also store which landscape skin your garden is wearing and the date of your last daily reset.

> **Please read this part.** Habit text is free text, and people put real things in it. "Physio for my knee", "take my medication", "AA meeting" and "morning prayer" are all ordinary things to track, and all of them count as **sensitive personal data** under PDPA section 26 and Article 9 GDPR — data about health, or about religious belief.
>
> We do not want or need that level of detail. If you would rather not give it to us, use neutral wording: "appointment", "meds", "meeting", "practice". Your streaks and your plant work exactly the same either way.
>
> If you do choose to enter sensitive information, you are giving your explicit consent for us to store it in order to run the service for you. You can withdraw that at any time by editing the habit or deleting your account.

### 3.3 Friends

If you use the friends feature we store:

- your friends list, as account identifiers
- friend requests you have sent or received, and their status
- a **garden summary** for you, which is the version of your garden your friends can load

The garden summary contains: each plant's identifier, its category, its skin, its streak, its total growth days, whether it was ticked off as of your last save, and its position. **It does not contain your habit text or your day-by-day history.**

The summary is only written once you have at least one friend, because until then nobody on earth is permitted to read it.

### 3.4 Technical and usage data

- **Vercel Web Analytics** counts visits and pages viewed. It sets no cookies and stores nothing on your device: Vercel works out whether you are a returning visitor by hashing the incoming request on its own servers, and throws that hash away after 24 hours. It runs for every visitor.
- **Google Analytics** records visits, pages viewed, approximate location derived from IP, device and browser type. It runs **only if you agreed** — see 3.5.
- **Vercel**, our host, records standard web server logs including IP address, user agent and requested URL.
- **Firebase App Check and reCAPTCHA** collect device and behavioural signals to confirm requests come from the real app rather than an automated script.
- **Rate-limit counters** on your account record when your current write window opened, to stop one account overwhelming the database.

### 3.5 Cookies and on-device storage

**Without asking you**, because they are strictly necessary to deliver the app you asked for:

- your Firebase sign-in token, which is what keeps you signed in
- a cached copy of your own garden, so the app works offline
- your claimed username, cached to save a database read
- a display preference (`disciplant:dailyGrowth`)
- **your answer to the cookie question below** — we have to remember a "no", or we would ask you again on every visit

None of these are shared with anyone, and none of them are used to track you across other websites.

**Only if you say yes**, when the banner asks on your first visit:

- Google Analytics cookies, which set an identifier Google uses to recognise a returning visitor

If you decline, or have not answered yet, Google Analytics is **never loaded at all** — not loaded and switched off, but never fetched. No connection to Google Analytics is opened.

**Not covered by the banner, and we would rather tell you than have you find out:** our host counts your visit whether or not you accept. Vercel Web Analytics writes nothing to your device — no cookie, no stored identifier — and recognises a returning visitor only via a hash computed on Vercel's servers and discarded after a day. The permission rule the banner exists to satisfy is about storing or reading things on your device, so a system that stores nothing there does not engage it, and it runs on legitimate interests instead.

The practical effect is that declining hides you from Google, not from a visitor count. If that is not acceptable to you, no amount of banner-clicking will change it, and the only real remedy is not to use the site.

You can change your answer at any time via **[Cookie settings](/#cookies)**. Withdrawing is as easy as giving, which is the legal standard as well as the decent one.

---

## 4. Why we use it, and on what legal basis

| What we do | Why | Legal basis (GDPR) | Legal basis (PDPA) |
|---|---|---|---|
| Store your habits, streaks and garden | It is the service | Performance of a contract | Necessary for a contract, s.24(3) |
| Sign you in and keep you signed in | So your garden is yours | Performance of a contract | Necessary for a contract |
| Store sensitive habit text, where you enter it | Only because you typed it | Explicit consent, Art. 9(2)(a) | Explicit consent, s.26 |
| Publish a garden summary to friends | You asked to add that friend | Performance of a contract | Necessary for a contract |
| App Check, reCAPTCHA, rate limits | Stopping abuse and runaway cost | Legitimate interests | Legitimate interest, s.24(5) |
| Vercel Web Analytics | Knowing how many people use the app at all | Legitimate interests — no device storage | Legitimate interest, s.24(5) |
| Google Analytics | Understanding *how* the app is used | Consent, freely given and withdrawable | Consent, s.19 |
| Keeping backups | Recovering from failure | Legitimate interests | Legitimate interest |

Analytics is the only thing here that rests on consent, and it is the only thing that waits for you to say yes. Everything else in this table is either the service itself or the security around it, and none of it can be switched off while you have an account — if you want none of it, the answer is to delete the account.

---

## 5. Who can see what

**Nobody but you** sees your habit text, your day-by-day completion history, or your email address.

**Your accepted friends** can see your username, display name, profile picture, and your garden summary — which discloses the **category** of every habit you keep, along with streaks and growth totals. If you keep a habit whose category you would rather not reveal, either choose a different category or do not add that person as a friend.

**Any signed-in user** can find you by searching your exact username, and can see your username and display name in the result.

**Nobody** can see anything if you never claim a username and never add a friend.

**Aggregate counters** on the home page — total gardeners, total plants, total days grown — are plain integers. They name nobody and cannot be traced to any account.

---

## 6. Who processes data for us

| Provider | Role | What they get | Where |
|---|---|---|---|
| Google (Firebase Authentication, Cloud Firestore, App Check) | Accounts, database, abuse prevention | Everything in section 3.1–3.3 | `[FIRESTORE REGION]` |
| Google Analytics | Usage measurement | Section 3.4 | Google's global infrastructure |
| Google (reCAPTCHA) | Bot detection | Device and interaction signals | Google's global infrastructure |
| Vercel Inc. | Hosting and Web Analytics | Section 3.4 server logs and visit counts | `[VERCEL REGION]` |

These are processors acting on our instructions, not independent recipients. We do not sell personal data, and we have never disclosed personal data to any third party for their own purposes.

**International transfer.** Both providers operate outside Thailand and outside the EEA. Transfers rely on `[Google Cloud's Standard Contractual Clauses / your chosen mechanism]` and, for PDPA purposes, on `[the adequacy or safeguard route you are relying on under s.28–29]`.

---

## 7. How long we keep it

| Data | Retention |
|---|---|
| Your account, habits, history, garden | Until you delete your account |
| Garden summary, friends list, friend requests | Deleted with your account, immediately |
| Your username reservation | Released on deletion, free for others to claim |
| Firestore backups | For as long as Google retains them, currently `[X]` days |
| Google Analytics | `[2 / 14]` months, per our retention setting |
| Vercel server logs | `[X]` days, per Vercel's retention policy |
| Vercel Web Analytics visitor hash | 24 hours, then discarded |
| Aggregate counters | Indefinitely — they contain no personal data |

Accounts are kept indefinitely, including guest accounts that are never opened again. We do not delete a garden for inactivity — come back after three years and your plants are where you left them. Deleting your account yourself is the only thing that removes it.

> **`[REVISIT WHEN YOU HAVE A CLEANUP JOB.]`** Indefinite retention is the hardest version of storage limitation to defend, and abandoned guest accounts are the weak point — nobody can reach one again, including the person who created it. The reason it is written this way is that you currently have no scheduled process that could carry out an expiry, and promising a deletion you cannot perform is worse than admitting the retention. See the matching note in section 4.3 of the Terms.

---

## 8. Your rights

You can:

- **Get a copy.** Account → Your data → Download my data produces a JSON file of everything we hold, straight away and without asking us.
- **Correct it.** Edit habits and your display name in the app; email us for anything you cannot reach.
- **Delete it.** Account → Delete this account removes your habits, history, garden, username, profile, friend connections, friend requests and sign-in. There is no undo and no recovery period.
- **Withdraw consent**, where consent is the basis. For analytics, use [Cookie settings](/#cookies); the change takes effect immediately. For sensitive habit text, edit the habit or delete your account.
- **Object** to processing based on legitimate interests.
- **Complain.** In Thailand, to the Personal Data Protection Committee. In the EEA or UK, to your national supervisory authority. You do not have to come to us first, though we would rather you did.

Your data export deliberately excludes other people's account identifiers. Your friends list is as much a fact about them as about you, and a portability right is not a licence to hand out identifiers for other accounts. The count is included instead.

---

## 9. Children

Disciplant is not for anyone under **13**. We do not knowingly collect data from children below that age. If you believe a child has created an account, email `[privacy@yourdomain]` and we will delete it.

> **`[FLAG — read this before launch.]`** Thirteen is the right floor for US COPPA purposes and it is what most habit trackers use. It is not automatically enough in Europe: GDPR lets each member state set the age of valid digital consent anywhere from 13 to 16, and several — Germany, the Netherlands, Ireland — set it above 13. Because almost everything Disciplant does runs on contract rather than consent, the practical exposure is narrow: it is the **analytics consent** a 13-year-old in Germany cannot validly give. Under Thailand's PDPA, consent from anyone under 10 must come from a parent, and consent from a minor may need parental backing depending on what is being agreed to. Options, in ascending order of caution: leave it at 13 and accept the narrow gap; raise it to 16; or suppress the analytics banner for self-declared under-16s so the question is never asked of someone who cannot answer it.

---

## 10. Security

Access to your data is enforced by server-side database rules, not by the app on your screen. A friend can load your garden summary only while the server agrees you are friends; nobody can read your habit text but you. Account deletion runs as a single atomic operation, so a half-deleted account is not a state that can exist.

No system is perfect. If we discover a breach affecting your personal data we will notify the relevant authority within 72 hours where required, and notify you directly where the risk to you is high.

---

## 11. Changes

We will post any change here and update the date at the top. If a change materially affects how we use your data, we will tell you in the app before it takes effect.

---

## 12. Contact

`[LEGAL NAME OR COMPANY NAME]`
`[ADDRESS]`
**`[privacy@yourdomain]`**

`[If you have EEA or UK users at any scale, you may need a representative under Art. 27 GDPR — check this before launching to those markets.]`