import { Link, useLocation, useNavigate } from 'react-router-dom';

const links = [
  { to: '/gallery', label: 'Gallery' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
];

// ─── Social links ────────────────────────────────────────────────────────────
// FILL THESE IN to switch them on. Anything left blank renders nothing, so
// it's safe to deploy as-is.
//   instagram: your handle WITHOUT the @  e.g. 'jaydenng.photo'
//   email:     the address to show        e.g. 'hello@example.com'
const SOCIAL = {
  instagram: '',
  email: '',
};

const SOCIAL_LINKS = [
  SOCIAL.instagram && {
    label: 'Instagram',
    href: `https://instagram.com/${SOCIAL.instagram}`,
    // Instagram glyph: rounded square + lens + flash dot
    path: 'M12 2.2c3.2 0 3.6 0 4.9.07 1.2.05 1.8.25 2.2.42.6.2 1 .5 1.4.9.4.4.7.8.9 1.4.17.4.37 1 .42 2.2.06 1.3.07 1.7.07 4.9s0 3.6-.07 4.9c-.05 1.2-.25 1.8-.42 2.2a3.9 3.9 0 0 1-.9 1.4c-.4.4-.8.7-1.4.9-.4.17-1 .37-2.2.42-1.3.06-1.7.07-4.9.07s-3.6 0-4.9-.07c-1.2-.05-1.8-.25-2.2-.42a3.9 3.9 0 0 1-1.4-.9 3.9 3.9 0 0 1-.9-1.4c-.17-.4-.37-1-.42-2.2C2.2 15.6 2.2 15.2 2.2 12s0-3.6.07-4.9c.05-1.2.25-1.8.42-2.2.2-.6.5-1 .9-1.4.4-.4.8-.7 1.4-.9.4-.17 1-.37 2.2-.42C8.4 2.2 8.8 2.2 12 2.2Zm0 5.4a4.4 4.4 0 1 0 0 8.8 4.4 4.4 0 0 0 0-8.8Zm0 7.2a2.8 2.8 0 1 1 0-5.6 2.8 2.8 0 0 1 0 5.6Zm5.6-7.4a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z',
  },
  SOCIAL.email && {
    label: 'Email',
    href: `mailto:${SOCIAL.email}`,
    path: 'M3 6.5A1.5 1.5 0 0 1 4.5 5h15A1.5 1.5 0 0 1 21 6.5v11a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5v-11Zm1.9.5 7.1 5.2L19.1 7H4.9Z',
  },
].filter(Boolean);

export default function Footer() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const handleHome = (e) => {
    e.preventDefault();
    if (pathname === '/') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      navigate('/');
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  };

  return (
    <footer className="footer">
      <div className="footer__inner">

        <div className="footer__grid">

          {/* Left — Brand */}
          <div className="footer__brand">
            <a href="/" className="footer__logo" onClick={handleHome}>Jayden Ng</a>
            <p className="footer__tagline">Travel &amp; Photography</p>
          </div>

          {/* Right — Nav + socials */}
          <div className="footer__right">
            <nav className="footer__nav">
              {links.map(({ to, label }) => (
                <Link key={to} to={to} className="footer__link">{label}</Link>
              ))}
            </nav>

            {SOCIAL_LINKS.length > 0 && (
              <div className="footer__social">
                {SOCIAL_LINKS.map(({ label, href, path }) => (
                  <a
                    key={label}
                    href={href}
                    className="footer__social-link"
                    aria-label={label}
                    target={href.startsWith('mailto:') ? undefined : '_blank'}
                    rel={href.startsWith('mailto:') ? undefined : 'noopener noreferrer'}
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d={path} />
                    </svg>
                  </a>
                ))}
              </div>
            )}
          </div>

        </div>

        <div className="footer__bottom">
          <p className="footer__copy">
            &copy; {new Date().getFullYear()} Jayden Ng &mdash; All rights reserved
          </p>
        </div>

      </div>
    </footer>
  );
}
