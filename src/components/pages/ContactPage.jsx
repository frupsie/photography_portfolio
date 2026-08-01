import { useState } from 'react';
import { motion } from 'framer-motion';

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
 */
const WEB3FORMS_KEY = import.meta.env.VITE_WEB3FORMS_KEY ?? '';
const ENDPOINT = 'https://api.web3forms.com/submit';

// Only surfaced if a send fails, so a visitor is never left with no way through.
const OWNER_EMAIL = 'ngziyu.co@gmail.com';

if (import.meta.env.DEV && !WEB3FORMS_KEY) {
  console.warn(
    '[contact] VITE_WEB3FORMS_KEY is not set — the form will fail to send.\n' +
    'Get a key at https://web3forms.com (enter ngziyu.co@gmail.com, no account ' +
    'needed), then add it to .env and restart the dev server.'
  );
}

const EMPTY = { name: '', email: '', message: '' };

export default function ContactPage() {
  const [form, setForm]         = useState(EMPTY);
  const [status, setStatus]     = useState('idle'); // idle | sending | sent | error
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
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
    } catch (err) {
      // Raw API text ("Form must include a 'form_id'…") is a message to the
      // developer, not the visitor. Log the detail, show something human.
      console.error('[contact] send failed:', err);
      setErrorMsg(
        `Sorry — that didn't send. Please try again, or reach me at ${OWNER_EMAIL}.`
      );
      setStatus('error');
    }
  };

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <motion.div
      className="content-page"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
    >
      <div className="content-page__inner content-page__inner--narrow">
        <span className="content-page__label">Get in touch</span>
        <h1 className="content-page__title">Work Together</h1>
        <p className="content-page__sub">
          Available for travel commissions, editorial licensing, and print orders.
        </p>

        {status === 'sent' ? (
          <motion.div
            className="contact-success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <span className="contact-success__icon">✓</span>
            <p>Message sent. I&rsquo;ll be in touch soon.</p>
          </motion.div>
        ) : (
          <form className="contact-form" onSubmit={handleSubmit}>
            <div className="contact-form__field">
              <label htmlFor="cf-name">Name</label>
              <input
                id="cf-name" type="text" required
                value={form.name} onChange={set('name')}
                placeholder="Your name" autoComplete="name"
              />
            </div>
            <div className="contact-form__field">
              <label htmlFor="cf-email">Email</label>
              <input
                id="cf-email" type="email" required
                value={form.email} onChange={set('email')}
                placeholder="you@example.com" autoComplete="email"
              />
            </div>
            <div className="contact-form__field">
              <label htmlFor="cf-message">Message</label>
              <textarea
                id="cf-message" required rows={5}
                value={form.message} onChange={set('message')}
                placeholder="Tell me about your project..."
              />
            </div>

            {status === 'error' && (
              <p className="contact-form__error" role="alert">{errorMsg}</p>
            )}

            <motion.button
              type="submit"
              className="contact-form__submit"
              disabled={status === 'sending'}
              whileHover={{ scale: status === 'sending' ? 1 : 1.03 }}
              whileTap={{ scale: status === 'sending' ? 1 : 0.97 }}
            >
              {status === 'sending' ? 'Sending…' : 'Send Message'}
            </motion.button>
          </form>
        )}
      </div>
    </motion.div>
  );
}
