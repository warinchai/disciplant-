// ============================================
// 11: CONSENT — the analytics opt-in banner
// Part of DISCIPLANT. A plain global script like every other file
// here, loaded LAST, after 10-account-data.js. It depends on nothing
// and nothing depends on it, so its position is a convenience rather
// than a constraint: it only needs the DOM, and its <script> tag sits
// at the bottom of <body> where the DOM is already there.
//
//
// WHAT THIS FILE IS FOR
//
// Google Analytics sets cookies and sends an identifier to Google.
// Under the GDPR and the ePrivacy rules that needs the visitor's
// prior consent, and under Thailand's PDPA it is processing that
// rests on consent rather than on the contract that covers the
// garden itself. Until now the tag loaded for everybody the moment
// the page opened, which is consent-after-the-fact, which is not
// consent.
//
//
// WHY THE TAG IS NOT LOADED AT ALL, RATHER THAN LOADED AND MUZZLED
//
// Google's own recommendation is Consent Mode: load gtag.js always,
// start with analytics_storage denied, flip it on acceptance. It is
// less code than this file. It was not used, because a "denied" tag
// still opens a connection to Google and still sends a cookieless
// ping on every page view, and whether that ping is lawful without
// consent is exactly the question several EU regulators have been
// arguing about. A tag that was never fetched raises no question at
// all. The cost is that returning visitors who accepted get their
// page_view a few hundred milliseconds late, which nothing depends on.
//
//
// WHAT IS *NOT* BEHIND THIS BANNER, AND WHY
//
//   * App Check / reCAPTCHA Enterprise (firebase-config.js). Strictly
//     necessary: it is the thing that stops someone minting free
//     anonymous accounts against the Firestore quota. Consent law
//     exempts what is strictly necessary to deliver the service the
//     user asked for, and gating it would hand anyone a way to skip
//     attestation by clicking "Decline".
//   * Firebase Auth and Firestore. That is the garden. It runs on the
//     contract, not on consent.
//   * The consent record written by this file. Remembering that
//     someone said no is itself strictly necessary — the alternative
//     is asking them again on every single visit.
//   * Vercel Web Analytics, the <script> tag in index.html. It stores
//     nothing on the device at all — the visitor hash is computed on
//     Vercel's side and discarded after 24 hours — so the rule this
//     banner exists to satisfy never engages. It runs for everyone,
//     which is the point: it is what gives an honest headcount once
//     the decliners have vanished from Google Analytics. The banner
//     copy below says so rather than leaving it to be discovered.
//
//
// TWO BUTTONS, EQUALLY WEIGHTED
//
// Accept and Decline are the same size, the same shape and the same
// distance from the thumb. A banner whose only button is "Accept" —
// or whose refusal is a grey link three clicks deep — is the single
// most commonly enforced defect in this whole area. Do not restyle
// one of these to be quieter than the other.
//
// The banner is shown to every visitor rather than only to European
// ones. Geo-gating would need a lookup this static site has no way to
// perform, and showing it to everyone is never the wrong answer.
// ============================================


// Bump this if what loads on acceptance ever changes — a new tag, a
// second provider — so that everyone is asked again about the new
// thing rather than being held to a yes they gave about the old one.
var CONSENT_VERSION = 1;

var CONSENT_KEY = 'disciplant:consent';

// Kept here rather than read back out of firebase-config.js on
// purpose: this file must work even if Firebase never loads, and the
// measurement ID is the one value it needs.
var CONSENT_GA_ID = 'G-Q64R6MP546';

// Set once the tag has actually been injected, so a visitor who
// accepts, opens the settings again and accepts a second time does
// not end up with two copies of gtag.js on the page.
var consentAnalyticsLoaded = false;

var consentBannerEl = null;


// ============================================
// The stored decision
//
// Every access is wrapped: localStorage throws outright in Safari's
// private mode and when a browser is set to block all storage. A
// visitor in that state simply gets asked every time, which is the
// safe way to fail — the unsafe way would be treating a storage
// error as a yes.
// ============================================
function readConsent() {
  try {
    var raw = localStorage.getItem(CONSENT_KEY);
    if (!raw) return null;

    var saved = JSON.parse(raw);
    if (!saved || typeof saved !== 'object') return null;

    // A decision about an older set of tags does not carry forward.
    if (saved.version !== CONSENT_VERSION) return null;

    return (saved.analytics === true || saved.analytics === false) ? saved : null;
  } catch (e) {
    return null;
  }
}

function writeConsent(granted) {
  try {
    localStorage.setItem(CONSENT_KEY, JSON.stringify({
      version:   CONSENT_VERSION,
      analytics: !!granted,
      // The timestamp is the part that makes this a record rather than
      // a preference. If anyone ever asks you to demonstrate consent,
      // this is what you have.
      at:        new Date().toISOString(),
    }));
  } catch (e) {
    // Nothing to do about it, and nothing to tell the user: the
    // session-scoped answer they just gave is still honoured below.
    console.warn('DISCIPLANT: consent choice could not be stored.');
  }
}


// ============================================
// Loading Google Analytics, on acceptance only
// ============================================
function loadAnalytics() {
  if (consentAnalyticsLoaded) return;
  consentAnalyticsLoaded = true;

  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };

  var tag   = document.createElement('script');
  tag.async = true;
  tag.src   = 'https://www.googletagmanager.com/gtag/js?id=' + CONSENT_GA_ID;

  // Configure only once the library is actually there. Pushing to
  // dataLayer before it arrives does work — that is what the array is
  // for — but doing it in order keeps the failure case (blocked by an
  // ad blocker, offline) completely silent instead of half-armed.
  tag.onload = function () {
    window.gtag('js', new Date());
    window.gtag('config', CONSENT_GA_ID);
  };

  document.head.appendChild(tag);
}

// Declining cannot unring the bell within a page that already loaded
// the tag — it can only stop the next one. That situation is only
// reachable by accepting and then changing your mind in the same
// session, so the honest thing is to reload, which drops gtag.js and
// every cookie decision it made along with the page.
function unloadAnalyticsByReload() {
  window.location.reload();
}


// ============================================
// The banner
// ============================================
function buildConsentBanner() {
  if (consentBannerEl) return consentBannerEl;

  var el = document.createElement('div');
  el.className = 'consent-banner';
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-modal', 'false');       // it does not trap the page
  el.setAttribute('aria-labelledby', 'consentTitle');

  el.innerHTML =
    '<div class="consent-card">' +
      '<h2 class="consent-title" id="consentTitle">A quiet question about cookies</h2>' +
      '<p class="consent-text">' +
        'Disciplant would like to use Google Analytics to see which pages get ' +
        'used. It sets cookies and sends an identifier to Google. Nothing about ' +
        'your habits, your streaks or your garden is ever sent there.' +
      '</p>' +
      '<p class="consent-text">' +
        'Either way, our host counts your visit in a way that puts nothing on ' +
        'your device and forgets you after a day. That part is not optional, ' +
        'and saying no below does not hide you from it.' +
      '</p>' +
      '<p class="consent-text consent-text-quiet">' +
        'Saying no changes nothing about how the app works. ' +
        '<a href="privacy.html" class="consent-link">Privacy policy</a>' +
      '</p>' +
      '<div class="consent-actions">' +
        '<button type="button" class="consent-btn consent-btn-no" id="consentDecline">No thanks</button>' +
        '<button type="button" class="consent-btn consent-btn-yes" id="consentAccept">Allow analytics</button>' +
      '</div>' +
    '</div>';

  document.body.appendChild(el);
  consentBannerEl = el;

  el.querySelector('#consentAccept').addEventListener('click', function () {
    writeConsent(true);
    hideConsentBanner();
    loadAnalytics();
  });

  el.querySelector('#consentDecline').addEventListener('click', function () {
    var wasLoaded = consentAnalyticsLoaded;
    writeConsent(false);
    hideConsentBanner();
    if (wasLoaded) unloadAnalyticsByReload();
  });

  return el;
}

function showConsentBanner() {
  var el = buildConsentBanner();
  el.classList.remove('hidden');

  // Focus the heading rather than either button, so a screen-reader
  // user hears what is being asked before they reach the answers, and
  // so neither answer is the one the keyboard lands on by default.
  var title = el.querySelector('#consentTitle');
  if (title) {
    title.setAttribute('tabindex', '-1');
    title.focus();
  }
}

function hideConsentBanner() {
  if (consentBannerEl) consentBannerEl.classList.add('hidden');
}


// ============================================
// Re-opening it later
//
// Consent that cannot be withdrawn as easily as it was given is not
// consent. Wire this to a link — the About panel on the home page is
// the natural home for it, next to wherever the privacy policy is
// linked:
//
//   <button type="button" onclick="openConsentSettings()">Cookie settings</button>
//
// It is deliberately a global function rather than a listener bound to
// a specific id, so it can be attached to whichever element you end
// up using without editing this file.
// ============================================
function openConsentSettings() {
  showConsentBanner();
}


// ============================================
// Start
//
// Note what is NOT here: any clearing of this key on sign-out or on
// account deletion. A consent decision belongs to the browser, not to
// the account, exactly like 'disciplant:dailyGrowth' — and wiping it
// on deletion would mean the last thing a departing user sees is the
// question they already answered.
// ============================================
(function initConsent() {
  var decision = readConsent();

  if (decision === null) {
    showConsentBanner();
    return;
  }

  if (decision.analytics) loadAnalytics();
})();
