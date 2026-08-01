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

// Baked in as the default so the contact route works on a fresh deploy with no
// dashboard configuration. VITE_CONTACT_EMAIL overrides it if you'd rather keep
// the address out of the repo.
//
// Note this address is public either way — Vite inlines VITE_* values into the
// client bundle at build time, so an env var wouldn't hide it from a scraper,
// only from the repo. To stop publishing it entirely, set VITE_FORMSPREE_ID:
// Formspree receives the message server-side and the address never ships.
const CONTACT_EMAIL = import.meta.env.VITE_CONTACT_EMAIL || 'ngziyu.co@gmail.com';

const EMPTY = { name: '', email: '', message: '' };

export default function ContactPage() {
  const [form, setForm]       = useState(EMPTY);
  const [status, setStatus]   = useState('idle'); // idle | sending | sent | error
  const [errorMsg, setErrorMsg] = useState('');

  const canPost = Boolean(FORMSPREE_ID);

  /** Pre-filled mailto used when no form backend is configured. */
  const mailtoHref = () => {
    const to = CONTACT_EMAIL;
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

        {/* Visible address — some people would simply rather use their own mail
            client than fill in a form. */}
        <p className="contact-direct">
          Or email directly:{' '}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
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
              <p className="contact-form__error" role="alert">
                {errorMsg} — please try again, or email{' '}
                <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
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
