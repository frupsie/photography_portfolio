import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useMatchMedia } from '../../hooks/useMatchMedia';

/**
 * ContactPage
 *
 * Submits through Web3Forms, which relays the message to the inbox that owns
 * the access key — no account, no server, nothing exposed in the bundle beyond
 * a key that can only ever deliver to that one address.
 *
 * ── SETUP (one time, ~30 seconds) ─────────────────────────────────────────
 *   1. Go to https://web3forms.com
 *   2. Enter ngziyu.co@gmail.com — they email an access key immediately
 *   3. Put it in .env as:  VITE_WEB3FORMS_KEY=your-key-here
 *   4. Restart the dev server
 *
 * On Netlify or Vercel, also add VITE_WEB3FORMS_KEY in the site's environment
 * variables so production builds pick it up.
 *
 * The access key is safe to expose — it is write-only and bound to the
 * destination address, so it can't be used to read anything or to send
 * anywhere else.
 *
 * Layout: a two-column split (form left, photograph right) that mirrors the
 * homepage's sticky index section, rather than the single centred column
 * this page used to be. A form-only page had nothing to place it as a
 * photography site's contact page rather than any other business's.
 */
const WEB3FORMS_KEY = import.meta.env.VITE_WEB3FORMS_KEY ?? '';
const ENDPOINT = 'https://api.web3forms.com/submit';

// Surfaced both as a direct alternative to the form and as the fallback if a
// send fails, so a visitor is never left with no way through.
const OWNER_EMAIL = 'ngziyu.co@gmail.com';

if (import.meta.env.DEV && !WEB3FORMS_KEY) {
  console.warn(
    '[contact] VITE_WEB3FORMS_KEY is not set — the form will fail to send.\n' +
    'Get a key at https://web3forms.com (enter ngziyu.co@gmail.com, no account ' +
    'needed), then add it to .env and restart the dev server.'
  );
}

const EMPTY = { name: '', email: '', message: '' };

// A visitor who taps to Gallery mid-thought (checking a photo before
// finishing their message) and comes back previously lost everything
// typed, with no warning it would happen. Persisted here, cleared only on
// a successful send.
const DRAFT_KEY = 'contact-draft';

function loadDraft() {
  try {
    const saved = localStorage.getItem(DRAFT_KEY);
    return saved ? { ...EMPTY, ...JSON.parse(saved) } : EMPTY;
  } catch {
    // Private-browsing / storage-blocked: fall back to a normal empty form.
    return EMPTY;
  }
}

// Native HTML5 validation renders the browser's own light, unstyled bubble
// ("Please include an '@'...") on top of this page's near-black theme —
// jarring at the exact moment a visitor has made a mistake. `noValidate`
// on the form (below) suppresses that; this replaces it with the same
// checks, surfaced as on-brand inline text under each field instead.
function validate(form) {
  const errors = {};
  if (!form.name.trim()) errors.name = 'Please enter your name.';
  if (!form.email.trim()) {
    errors.email = 'Please enter your email.';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = 'Please enter a valid email address.';
  }
  if (!form.message.trim()) errors.message = 'Please enter a message.';
  return errors;
}

export default function ContactPage() {
  const [form, setForm]               = useState(loadDraft);
  const [status, setStatus]           = useState('idle'); // idle | sending | sent | error
  const [errorMsg, setErrorMsg]       = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const successRef                    = useRef(null);
  // Same hook About/Home/PhotoLightbox already use — this page had ~3
  // motion.* elements (page transition, success block, submit button
  // hover/tap) running unconditionally despite PRODUCT.md's "respected
  // sitewide" claim.
  const reduceMotion = useMatchMedia('(prefers-reduced-motion: reduce)');

  useEffect(() => {
    try {
      if (form.name || form.email || form.message) {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(form));
      } else {
        localStorage.removeItem(DRAFT_KEY);
      }
    } catch {
      // Nothing to recover from here — the form still works, it just won't
      // survive a navigation away and back.
    }
  }, [form]);

  // Move focus to the confirmation the moment it mounts. Without this, a
  // keyboard/screen-reader user who just submitted gets no signal the
  // message actually sent — focus silently fell back to <body>, and
  // .contact-success carried no aria-live either (see role="status" below).
  useEffect(() => {
    if (status === 'sent') successRef.current?.focus();
  }, [status]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const errors = validate(form);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setStatus('sending');
    setErrorMsg('');

    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          access_key: WEB3FORMS_KEY,
          subject: `Portfolio enquiry from ${form.name}`,
          from_name: 'Jayden Ng Photography',
          name: form.name,
          email: form.email,
          message: form.message,
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        throw new Error(data?.message || `HTTP ${res.status}`);
      }

      setForm(EMPTY);
      setStatus('sent');
      try { localStorage.removeItem(DRAFT_KEY); } catch { /* nothing to clean up */ }
    } catch (err) {
      // Raw API text ("Form must include a 'form_id'…") is a message to the
      // developer, not the visitor. Log the detail, show something human.
      console.error('[contact] send failed:', err);
      // The link to OWNER_EMAIL is rendered separately below, as a real
      // mailto anchor rather than plain text in this string.
      setErrorMsg("Sorry, that didn't send. Please try again, or reach me directly at");
      setStatus('error');
    }
  };

  // Clears a field's error the moment its value changes, rather than
  // leaving a stale "Please enter your email" showing after it's been fixed.
  const set = (k) => (e) => {
    setForm({ ...form, [k]: e.target.value });
    if (fieldErrors[k]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[k];
        return next;
      });
    }
  };

  return (
    <motion.div
      className="content-page"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: reduceMotion ? 0 : 0.5 }}
    >
      <div className="content-page__inner">
        <div className="contact-page__layout">
          <div className="contact-page__main">
            <span className="content-page__label">Get in touch</span>
            <h1 className="content-page__title">Work Together</h1>
            <p className="content-page__sub">
              Open to hearing about interesting projects — travel, editorial, or otherwise.
            </p>

            <div className="contact-page__direct">
              <a href={`mailto:${OWNER_EMAIL}`} className="contact-page__direct-email">
                {OWNER_EMAIL}
              </a>
              <p className="contact-page__direct-meta">
                Based in Singapore. Replies usually come within two or three days.
              </p>
            </div>

            {status === 'sent' ? (
              // role="status" + aria-live announce this to a screen-reader
              // user the moment it mounts; tabIndex + the focus effect above
              // move real keyboard focus here too. Without both, this was
              // the single highest-stakes moment on the page — did the
              // message actually send? — with zero signal for anyone not
              // watching the screen, right after the submit button they'd
              // just focused was removed from the DOM under them.
              <motion.div
                ref={successRef}
                className="contact-success"
                role="status"
                aria-live="polite"
                tabIndex={-1}
                initial={reduceMotion ? false : { opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <span className="contact-success__icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                       strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="9.25" />
                    <path d="M8 12.5l2.6 2.6L16.5 9" />
                  </svg>
                </span>
                <p>Message sent. I&rsquo;ll be in touch soon.</p>
              </motion.div>
            ) : (
              // noValidate replaces the browser's own native validation
              // bubbles — correct, but a stark light popup on this page's
              // near-black theme — with the same checks (validate(), above)
              // surfaced as on-brand inline text under each field instead.
              <form className="contact-form" onSubmit={handleSubmit} noValidate>
                <div className="contact-form__field">
                  <label htmlFor="cf-name">Name</label>
                  <input
                    id="cf-name" type="text" required
                    value={form.name} onChange={set('name')}
                    placeholder="Your name" autoComplete="name"
                    aria-invalid={fieldErrors.name ? 'true' : undefined}
                    aria-describedby={fieldErrors.name ? 'cf-name-error' : undefined}
                  />
                  {fieldErrors.name && (
                    <p id="cf-name-error" className="contact-form__field-error" role="alert">
                      {fieldErrors.name}
                    </p>
                  )}
                </div>
                <div className="contact-form__field">
                  <label htmlFor="cf-email">Email</label>
                  <input
                    id="cf-email" type="email" required
                    value={form.email} onChange={set('email')}
                    placeholder="you@example.com" autoComplete="email"
                    aria-invalid={fieldErrors.email ? 'true' : undefined}
                    aria-describedby={fieldErrors.email ? 'cf-email-error' : undefined}
                  />
                  {fieldErrors.email && (
                    <p id="cf-email-error" className="contact-form__field-error" role="alert">
                      {fieldErrors.email}
                    </p>
                  )}
                </div>
                <div className="contact-form__field">
                  <label htmlFor="cf-message">Message</label>
                  <textarea
                    id="cf-message" required rows={5}
                    value={form.message} onChange={set('message')}
                    placeholder="Tell me about your project..."
                    aria-invalid={fieldErrors.message ? 'true' : undefined}
                    aria-describedby={fieldErrors.message ? 'cf-message-error' : undefined}
                  />
                  {fieldErrors.message && (
                    <p id="cf-message-error" className="contact-form__field-error" role="alert">
                      {fieldErrors.message}
                    </p>
                  )}
                </div>

                {status === 'error' && (
                  <p className="contact-form__error" role="alert">
                    {errorMsg} <a href={`mailto:${OWNER_EMAIL}`}>{OWNER_EMAIL}</a>.
                  </p>
                )}

                <motion.button
                  type="submit"
                  className="contact-form__submit"
                  disabled={status === 'sending'}
                  whileHover={reduceMotion ? undefined : { scale: status === 'sending' ? 1 : 1.03 }}
                  whileTap={reduceMotion ? undefined : { scale: status === 'sending' ? 1 : 0.97 }}
                >
                  {status === 'sending' ? 'Sending…' : 'Send Message'}
                </motion.button>
              </form>
            )}
          </div>

          <div className="contact-page__visual">
            <img
              src="/photos-web/nikko/IMG_1474.JPG"
              alt="A vermilion temple hall with black tiled roofs and gold fittings, framed by cedar and pine, Nikko"
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
