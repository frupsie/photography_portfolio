import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const links = [
  { to: '/', label: 'Home' },
  { to: '/gallery', label: 'Gallery' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
];

export default function Navbar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const hamburgerRef = useRef(null);
  const drawerRef = useRef(null);
  const wasOpenRef = useRef(false);

  // Close menu on route change
  useEffect(() => { setMenuOpen(false); }, [pathname]);

  // Lock body scroll when menu is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  // Focus trap + initial focus + Escape — same pattern as PhotoLightbox's:
  // a drawer covering the whole page is exactly the case that earns
  // protected focus. Previously a keyboard user opening it landed on
  // <body>, so Tab walked straight into the page behind it (visually
  // covered by the drawer) instead of the drawer's own links.
  useEffect(() => {
    if (!menuOpen) return;
    drawerRef.current?.querySelector('.nav-drawer__close')?.focus();

    const handleKey = (e) => {
      if (e.key === 'Escape') { setMenuOpen(false); return; }
      if (e.key !== 'Tab') return;
      const root = drawerRef.current;
      if (!root) return;
      const focusable = [...root.querySelectorAll('a, button')];
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [menuOpen]);

  // Return focus to the hamburger once the drawer actually closes (not on
  // open) — covers Escape, backdrop click, the close button, and a link
  // navigating away, all of which just flip menuOpen to false.
  useEffect(() => {
    if (wasOpenRef.current && !menuOpen) hamburgerRef.current?.focus();
    wasOpenRef.current = menuOpen;
  }, [menuOpen]);

  const handleHome = (e) => {
    e.preventDefault();
    setMenuOpen(false);
    if (pathname === '/') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      navigate('/');
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  };

  return (
    <>
      {/* .navbar::before's gradient is hand-tuned to fade a hero photograph
          into readable text — it only makes sense over Home's full-bleed
          image. Every other route is a flat dark page with real foreground
          content (stat numbers, list items, headings) that scrolls past
          this same fixed bar constantly, and the photo-tuned fade was
          instead dimming that content as it passed underneath — a flicker
          that read as a glitch, not a page-specific choice. navbar--solid
          swaps it for an opaque bar matching the page background, which
          doesn't apply to Home so the hero look is untouched. */}
      <nav className={`navbar${pathname === '/' ? '' : ' navbar--solid'}`} aria-label="Primary">
        <a href="/" className="navbar__logo" onClick={handleHome}>
          Jayden Ng
        </a>

        {/* Desktop links */}
        <ul className="navbar__links">
          {links.map(({ to, label }) => (
            <li key={to}>
              {to === '/' ? (
                <a
                  href="/"
                  className={`navbar__link${pathname === to ? ' navbar__link--active' : ''}`}
                  onClick={handleHome}
                >
                  {label}
                  {pathname === to && (
                    <motion.span
                      className="navbar__link-bar"
                      layoutId="nav-bar"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                </a>
              ) : (
                <Link
                  to={to}
                  className={`navbar__link${pathname === to ? ' navbar__link--active' : ''}`}
                >
                  {label}
                  {pathname === to && (
                    <motion.span
                      className="navbar__link-bar"
                      layoutId="nav-bar"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                </Link>
              )}
            </li>
          ))}
        </ul>

        {/* Hamburger button — mobile only */}
        <button
          ref={hamburgerRef}
          className={`navbar__hamburger${menuOpen ? ' navbar__hamburger--open' : ''}`}
          onClick={() => setMenuOpen(o => !o)}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
        >
          <span />
          <span />
          <span />
        </button>
      </nav>

      {/* Mobile drawer — click backdrop to close */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            ref={drawerRef}
            className="nav-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ duration: 0.32, ease: [0.32, 0, 0.08, 1] }}
            onClick={() => setMenuOpen(false)}
          >
            {/* Close × button */}
            <button
              className="nav-drawer__close"
              onClick={() => setMenuOpen(false)}
              aria-label="Close menu"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                   strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            {/* Stop clicks inside the link list from bubbling to the backdrop */}
            <nav className="nav-drawer__links" onClick={e => e.stopPropagation()}>
              {links.map(({ to, label }, i) => (
                <motion.div
                  key={to}
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.08 + i * 0.055, duration: 0.28 }}
                >
                  {to === '/' ? (
                    <a
                      href="/"
                      className={`nav-drawer__link${pathname === to ? ' nav-drawer__link--active' : ''}`}
                      onClick={handleHome}
                    >
                      {label}
                    </a>
                  ) : (
                    <Link
                      to={to}
                      className={`nav-drawer__link${pathname === to ? ' nav-drawer__link--active' : ''}`}
                      onClick={() => setMenuOpen(false)}
                    >
                      {label}
                    </Link>
                  )}
                </motion.div>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
