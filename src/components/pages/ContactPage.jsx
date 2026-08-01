import { useState } from 'react';
import { motion } from 'framer-motion';

/**
 * ContactPage
 *
 * Submits to Formspree when VITE_FORMSPREE_ID is set. When it isn't, the form
 * degrades to a pre-filled mailto: link rather than pretending to send —
 * so a deploy without the key still reaches a real inbox, and adding the key
 * later needs no code change.
 *
 * Set up: formspree.io → new form → copy the ID from the endpoint
 * (https://formspree.io/f/XXXXXXXX) into .env as VITE_FORMSPREE_ID=XXXXXXXX
 */
const FORMSPREE_ID = import.meta.env.VITE_FORMSPREE_ID ?? '';
const FALLBACK_EMAIL = import.meta.env.VITE_CONTACT_EMAIL ?? '';

// Neither configured means a submit would open a blank-recipient mail draft —
// a dead end for the visitor. Shout about it in dev so it can't reach
// production unnoticed. Silent in the production bundle.
if (import.meta.env.DEV && !FORMSPREE_ID && !FALLBACK_EMAIL) {
  console.warn(
    '[contact] Neither VITE_FORMSPREE_ID nor VITE_CONTACT_EMAIL is set — ' +
    'the contact form has nowhere to deliver. Copy .env.example to .env and ' +
    'fill in at least one before deploying.'
  );
}

const EMPTY = { name: '', email: '', message: '' };

export default function ContactPage() {
  const [form, setForm]       = useState(EMPTY);
  const [status, setStatus]   = useState('idle'); // idle | sending | sent | error
  const [errorMsg, setErrorMsg] = useState('');

  const canPost = Boolean(FORMSPREE_ID);

  /** Pre-filled mailto used when no form backend is configured. */
  const mailtoHref = () => {
    const to = FALLBACK_EMAIL;
    const subject = encodeURIComponent(`Enquiry from ${form.name || 'the website'}`);
    const body = encodeURIComponent(
      `${form.message}\n\n—\n${form.name}\n${form.email}`
    );
    return `mailto:${to}?subject=${subject}&body=${body}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // No backend configured — hand off to the visitor's mail client.
    if (!canPost) {
      window.location.href = mailtoHref();
      return;
    }

    setStatus('sending');
    setErrorMsg('');
    try {
      const res = await fetch(`https://formspree.io/f/${FORMSPREE_ID}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          message: form.message,
          _subject: `Portfolio enquiry from ${form.name}`,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.errors?.[0]?.message ?? `Request failed (${res.status})`);
      }
      setForm(EMPTY);
      setStatus('sent');
    } catch (err) {
      setErrorMsg(err.message || 'Something went wrong.');
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

            {import.meta.env.DEV && !canPost && !FALLBACK_EMAIL && (
              <p className="contact-form__error" role="status">
                Dev notice: no contact destination configured. Set
                {' '}<code>VITE_FORMSPREE_ID</code> or <code>VITE_CONTACT_EMAIL</code>
                {' '}in <code>.env</code> — see <code>.env.example</code>.
              </p>
            )}

            {status === 'error' && (
              <p className="contact-form__error" role="alert">
                {errorMsg} — please try again{FALLBACK_EMAIL ? (
                  <>, or email <a href={`mailto:${FALLBACK_EMAIL}`}>{FALLBACK_EMAIL}</a></>
                ) : null}.
              </p>
            )}

            <motion.button
              type="submit"
              className="contact-form__submit"
              disabled={status === 'sending'}
              whileHover={{ scale: status === 'sending' ? 1 : 1.03 }}
              whileTap={{ scale: status === 'sending' ? 1 : 0.97 }}
            >
              {status === 'sending' ? 'Sending…' : canPost ? 'Send Message' : 'Send via Email'}
            </motion.button>
          </form>
        )}
      </div>
    </motion.div>
  );
}
