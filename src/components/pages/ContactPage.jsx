import { useState } from 'react';
import { motion } from 'framer-motion';

export default function ContactPage() {
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', message: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    // Wire up to a real email service (Formspree, EmailJS, etc.) when deploying
    setSent(true);
  };

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

        {sent ? (
          <motion.div
            className="contact-success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <span className="contact-success__icon">✓</span>
            <p>Message sent. I'll be in touch soon.</p>
          </motion.div>
        ) : (
          <form className="contact-form" onSubmit={handleSubmit}>
            <div className="contact-form__field">
              <label>Name</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Your name"
              />
            </div>
            <div className="contact-form__field">
              <label>Email</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="you@example.com"
              />
            </div>
            <div className="contact-form__field">
              <label>Message</label>
              <textarea
                required
                rows={5}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder="Tell me about your project..."
              />
            </div>
            <motion.button
              type="submit"
              className="contact-form__submit"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              Send Message
            </motion.button>
          </form>
        )}
      </div>
    </motion.div>
  );
}
