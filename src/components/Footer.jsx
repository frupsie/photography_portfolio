import { Link, useLocation, useNavigate } from 'react-router-dom';

const links = [
  { to: '/gallery', label: 'Gallery' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
];

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

          {/* Right — Nav */}
          <nav className="footer__nav">
            {links.map(({ to, label }) => (
              <Link key={to} to={to} className="footer__link">{label}</Link>
            ))}
          </nav>

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
