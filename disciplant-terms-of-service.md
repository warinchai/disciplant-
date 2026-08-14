# Disciplant — Terms of Service

**Draft for review. Not legal advice. Every `[SQUARE BRACKET]` is a decision you have to make before this goes live.**

**Effective date:** `[DATE]`
**Last updated:** `[DATE]`

---

## 1. Who these terms are with

Disciplant is a free habit tracker at `[https://disciplant.vercel.app]`. Completing a habit grows a plant in your garden.

These terms are an agreement between you and:

`[LEGAL NAME OR REGISTERED COMPANY NAME]`
`[REGISTERED ADDRESS OR SERVICE ADDRESS]`
`[COUNTRY]`

Referred to below as "we" and "us". Contact: **`[hello@yourdomain]`**

By using Disciplant — including as a guest, without signing in — you agree to these terms. If you don't agree, don't use it. How we handle your information is covered separately in the [Privacy Policy](/privacy), which forms part of this agreement.

---

## 2. Disciplant is not a health service

**Read this one.** It is the most important clause here.

Disciplant is a habit tracker. It counts days and draws plants. It is **not**:

- a medical device
- a source of medical, psychological, psychiatric, nutritional, or therapeutic advice
- a treatment, diagnosis, or intervention for any condition
- a medication reminder or adherence system
- a substitute for a doctor, therapist, pharmacist, counsellor, or any other qualified professional

People track real things here. Medication, physiotherapy, recovery meetings, exercise after injury, sleep after a diagnosis. **Do not rely on Disciplant for any of it.** Notifications can fail, data can be lost, a device can break, the service can go down, and a plant can look healthy on a day you did not actually do the thing.

If you are managing a health condition, follow the guidance of the professional treating you. Nothing here overrides it, and nothing here should be read as encouragement to stop or change anything they told you.

If you are in crisis, this app is not the right tool. Contact a doctor or your local emergency service.

---

## 3. Who can use it

You must be **13 or older**. If you are under 13, you may not create an account or use Disciplant, and we will delete any account we learn belongs to someone below that age.

If you are between 13 and the age of majority where you live, you should have a parent or guardian's permission.

> **`[FLAG]`** See the corresponding note in the privacy policy — 13 satisfies COPPA but sits below the digital-consent age in several EU states, and the PDPA has its own rules for minors. The gap is narrow because almost everything here runs on this contract rather than on consent, but it exists.

---

## 4. Accounts

### 4.1 Guest accounts, and why they are fragile

You can use Disciplant without signing in. We create an anonymous account tied to your browser.

**A guest garden can be lost, permanently, and we cannot get it back.** It will disappear if you clear your browser data, use private or incognito browsing, switch browsers or devices, or if your browser evicts the stored session on its own. There is no email attached, no password, and nothing for us to look up. We could not recover it even if we wanted to, and no amount of contacting us will change that.

If your garden matters to you, sign in with Google. That is the only way it survives a new phone or a cleared browser.

### 4.2 Signed-in accounts

Signing in with Google is subject to Google's own terms. You are responsible for keeping access to your Google account secure — anyone who can sign into it can reach your garden.

You may hold one account. Creating accounts in bulk, or automating account creation, is not permitted.

### 4.3 Accounts you stop using

We keep accounts indefinitely. We do not delete a garden for inactivity, and there is no expiry date on your data — come back after three years and your plants are where you left them.

If you want your account gone, delete it yourself (section 9). That is the only thing that removes it.

> **`[NOTE — why this stayed as "forever".]`** I nearly changed this to expire unclaimed guest accounts after 24 months, and decided against it. Indefinite retention does sit awkwardly with the storage-limitation principle (GDPR Art. 5(1)(e), PDPA s.37), and abandoned guest accounts are the awkward case: nobody can ever reach one again, including the person who made it, so it is personal data whose subject has no way to exercise any right over it. But you have no scheduled job that could actually carry out an expiry — Firestore cleanup needs a Cloud Function, which needs the Blaze plan — and **a retention promise you cannot execute is worse than an honest one you can.** A policy that says data is deleted after 24 months while it quietly sits there forever is a false statement in a legal document. Revisit this the day you have a cleanup job running, not before.

---

## 5. Usernames

Usernames are first come, first served, and are visible to any signed-in user who searches for one.

You may not choose a username that impersonates another person or organisation, is a slur or is otherwise abusive, is chosen to harass a specific person, or is registered in bulk or in order to resell.

We may reclaim, change, or suspend a username that breaks these rules, and we may reclaim one that infringes somebody's trademark. Releasing your username by deleting your account makes it available for anyone else to claim.

---

## 6. Your content

Your habits, their names, and your garden layout are yours. We claim no ownership of them.

To run the service we need a limited licence: permission to store, process, back up, and display your content back to you, and to display the parts of it that the friends feature exposes to the friends you have chosen. That licence exists only so the app can function, ends when you delete the content, and does not extend to anything else. **We will not use your habit text for advertising, sell it, or publish it.**

You are responsible for what you put in. Don't enter anything unlawful, and remember that habit text is stored on our systems — the privacy policy explains what we can and cannot see, and suggests neutral wording if you would rather not hand over medical or religious detail.

---

## 7. Friends

Adding a friend is a decision to share something. An accepted friend can see your username, your display name, your profile picture, and a summary of your garden.

**That summary reveals the category of every habit you keep** — a sunflower means an exercise habit, a lotus means mindfulness — along with your streaks and growth totals. It does not include your habit text.

If a category itself is something you would rather not disclose, either file the habit under a different one or don't add that person. Once someone can see your garden, you cannot control what they do with what they saw.

Do not use the friends feature to harass, stalk, or pressure anyone. We may remove friend connections and suspend accounts over it.

---

## 8. Acceptable use

Don't:

- break the law, or use Disciplant to help anyone else break it
- harass, threaten, impersonate, or abuse another user
- try to reach another person's habits, garden, or account
- probe, scan, or attempt to defeat the security rules, App Check, or rate limits
- automate access, scrape the service, or run it through a bot
- create accounts in bulk, or deliberately drive up our database costs
- resell or commercially redistribute the service

We may suspend or terminate an account for any of this, without notice where the conduct is serious.

---

## 9. Deleting your account

You can delete your account from inside the app: **Account → Delete this account**.

That removes your habits, your day-by-day history, your garden, your username, your profile, your friend connections, and your sign-in. It happens as a single operation, so a half-deleted account is not a state that can exist.

**There is no undo and no recovery period.** We do not keep a copy, there is no grace window, and we cannot restore it afterwards. If you want your data first, export it before you delete — **Account → Your data → Download my data**.

Two things survive, neither of which identifies you:

- Backups held by our infrastructure providers, for as long as they retain them
- The site-wide totals — gardeners, plants, days grown. These are plain integers with no names or identifiers in them. They are recalculated from scratch periodically rather than adjusted as people come and go, so a deleted account drops out of the totals at the next recalculation rather than the instant you press delete

---

## 10. The service is free, and provided as it is

Disciplant is free. There are no paid features, no subscriptions, and no adverts. If that ever changes, we will publish separate terms for it and nothing here commits you to paying for anything.

Because it is free and run at our own expense, it is provided **"as is" and "as available"**, without warranties of any kind, to the fullest extent the law allows. In particular we do not promise that:

- the service will be available, uninterrupted, or error-free
- your data will never be lost or corrupted
- streaks, growth totals, or plant stages will always be calculated correctly
- the service will continue to exist

We may change, suspend, or discontinue any part of Disciplant at any time. **We may shut it down entirely.** If we plan to, we will give reasonable notice in the app so you can export your data first — but a service that costs nothing carries no guarantee of permanence, and you should treat your export as the durable copy.

---

## 11. Limitation of liability

To the fullest extent permitted by law, we are not liable for any indirect, incidental, special, or consequential loss, or for lost data, lost streaks, lost progress, or lost profits, arising from your use of Disciplant.

Our total liability to you for any claim relating to the service is limited to **USD 100**, or the amount you have paid us in the previous twelve months, whichever is greater. Since Disciplant is free, that amount is currently zero, so the cap is USD 100.

Nothing here excludes liability that cannot legally be excluded — including for death or personal injury caused by negligence, for fraud, and for anything else your local consumer law protects. **If you are a consumer, you keep every right your local law gives you**, and these terms do not take any of them away.

---

## 12. Suspension and termination by us

We may suspend or terminate your access if you break these terms, if we are required to by law, or if your use threatens the security or cost of the service.

Where the circumstances allow, we will tell you why and give you a chance to respond. For serious conduct — harassment, attacking the service, or content involving minors — we may act immediately and permanently.

If we terminate your account for breach, we may delete your data. Deleting your own account under section 9 remains available to you at any time.

---

## 13. Our content

The Disciplant name, the plant artwork, the garden scenes, the skins, the interface, and the code behind them are ours and are protected by copyright. Nothing in these terms transfers any of it to you.

You may use Disciplant as a personal habit tracker. You may not copy, redistribute, resell, reverse engineer, or build a competing service out of it, or use our name or artwork in a way suggesting we endorse you.

The source repository is private and no part of Disciplant is offered under an open-source licence. If that ever changes, this section has to change with it — an open licence and a clause forbidding copying cannot both be true at once.

---

## 14. Third-party services

Disciplant runs on Google Firebase and is hosted by Vercel, and signing in uses Google's authentication. Your use of those is subject to their terms as well as these. We are not responsible for their availability, their changes, or their failures — if Firebase goes down, Disciplant goes down with it.

---

## 15. Changes to these terms

We may update these terms. The date at the top changes when we do, and material changes will be announced in the app before they take effect. Continuing to use Disciplant after that means you accept the new version. If you don't, delete your account.

---

## 16. Governing law and disputes

These terms are governed by the laws of **Thailand**, and disputes go to the courts of **Bangkok, Thailand**.

If you are a consumer, this does not deprive you of the protection of the mandatory laws of the country where you live, or of your right to bring proceedings there.

Where our users live does not change this. Users in other countries are expected and welcome; the governing law follows where the service is operated from, not where it is opened.

> **`[REVISIT IF YOU INCORPORATE ELSEWHERE.]`** This says Thailand because that is where the service is run from, and a governing-law clause pointing at a country you have no connection to is often unenforceable. If you form a company in another jurisdiction, this clause and section 1 move with it. Note also that naming Thailand here does not exempt you from foreign regulation — GDPR applies to processing EU residents' data regardless of what this section says, which is a question of conduct rather than of contract.

---

## 17. General

If any part of these terms is unenforceable, the rest stays in force. Not enforcing a term straight away doesn't waive it. These terms, together with the Privacy Policy, are the whole agreement between us about Disciplant. You may not transfer your rights under them; we may transfer ours if the service changes hands, and will say so in the app if that happens.

---

## 18. Contact

`[LEGAL NAME OR COMPANY NAME]`
`[ADDRESS]`
**`[hello@yourdomain]`**
