import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const links = [
  { to: '/', label: 'Home' },
  { to: '/gallery', label: 'Gallery' },
  { to: '/about', label: 'About' },
  { to: '/gear', label: 'Gear' },
  { to: '/contact', label: 'Contact' },
];

export default function Navbar() {
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
    <nav className="navbar">
      <a href="/" className="navbar__logo" onClick={handleHome}>
        Jayden Ng
      </a>

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
              <Link to={to} className={`navbar__link${pathname === to ? ' navbar__link--active' : ''}`}>
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
    </nav>
  );
}
