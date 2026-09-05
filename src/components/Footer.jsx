import { Link, useLocation, useNavigate } from 'react-router-dom';
import { SOCIAL } from '../data/social';
import { InstagramIcon, EmailIcon } from './icons/SocialIcons';

const links = [
  { to: '/gallery', label: 'Gallery' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
];

const SOCIAL_LINKS = [
  SOCIAL.instagram && {
    label: 'Instagram',
    href: `https://instagram.com/${SOCIAL.instagram}`,
    Icon: InstagramIcon,
  },
  SOCIAL.email && {
    label: 'Email',
    href: `mailto:${SOCIAL.email}`,
    Icon: EmailIcon,
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
            <nav className="footer__nav" aria-label="Footer">
              {links.map(({ to, label }) => (
                <Link key={to} to={to} className="footer__link">{label}</Link>
              ))}
            </nav>

            {SOCIAL_LINKS.length > 0 && (
              <div className="footer__social">
                {SOCIAL_LINKS.map(({ label, href, Icon }) => (
                  <a
                    key={label}
                    href={href}
                    className="footer__social-link"
                    aria-label={label}
                    target={href.startsWith('mailto:') ? undefined : '_blank'}
                    rel={href.startsWith('mailto:') ? undefined : 'noopener noreferrer'}
                  >
                    <Icon />
                  </a>
                ))}
              </div>
            )}
          </div>

        </div>

        <div className="footer__bottom">
          <p className="footer__copy">
            &copy; {new Date().getFullYear()} Jayden Ng. All rights reserved
          </p>
        </div>

      </div>
    </footer>
  );
}
