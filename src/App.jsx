import { lazy, Suspense, useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import './App.css';
import { AnimatePresence, motion, useScroll } from 'framer-motion';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import BackToTopButton from './components/BackToTopButton';
import LandingPage from './components/LandingPage';
import IntroScreen from './components/IntroScreen';
import { useLenis, getLenis } from './hooks/useLenis';
import { cities } from './data/cities';

// LandingPage (and the intro overlay below) stay eager: "/" is where most
// first-time visitors land, so that code was always going to be needed
// immediately. Every other route was shipping in the same bundle regardless
// of whether a visitor ever went there — a visitor landing directly on
// /contact downloaded Gallery's full photo-list machinery and Home's GSAP
// pinned-scroll logic for nothing. Split per-route instead.
const CityPage    = lazy(() => import('./components/pages/CityPage'));
const AboutPage   = lazy(() => import('./components/pages/AboutPage'));
const ContactPage = lazy(() => import('./components/pages/ContactPage'));
const GalleryPage = lazy(() => import('./components/pages/GalleryPage'));
const NotFound    = lazy(() => import('./components/pages/NotFound'));

const INTRO_KEY = 'jayden_intro_seen';
const SITE_NAME = 'Jayden Ng';
const HOME_TITLE = 'Jayden Ng: Travel & Street Photography Across Asia';

// One central place derives the title for every route (including Gallery's
// own filter state, carried in the URL's search params — no need for
// GalleryPage itself to know anything about document.title). Confirmed live
// before this existed: "/", "/gallery", and any "/gallery?..." filter all
// shared the exact same title — no confirmation for a screen-reader or
// multi-tab visitor that the route or filter had actually changed.
function deriveTitle(pathname, search) {
  if (pathname === '/') return HOME_TITLE;

  if (pathname === '/gallery') {
    const params = new URLSearchParams(search);
    const city = params.get('city');
    const country = params.get('country');
    if (city)    return `Gallery — ${city} · ${SITE_NAME}`;
    if (country) return `Gallery — ${country} · ${SITE_NAME}`;
    return `Gallery · ${SITE_NAME}`;
  }

  if (pathname === '/about')   return `About · ${SITE_NAME}`;
  if (pathname === '/contact') return `Contact · ${SITE_NAME}`;

  const cityMatch = pathname.match(/^\/city\/([^/]+)$/);
  if (cityMatch) {
    const city = cities.find((c) => c.slug === cityMatch[1]);
    return city ? `${city.name} · ${SITE_NAME}` : `${SITE_NAME}`;
  }

  return `Page Not Found · ${SITE_NAME}`;
}

/** DocumentTitle — sets document.title on every route/filter change. Same
 * shape as ScrollToTop below: a location-effect component with no visual
 * output, mounted once at the app root rather than duplicated per page. */
function DocumentTitle() {
  const { pathname, search } = useLocation();
  useEffect(() => {
    document.title = deriveTitle(pathname, search);
  }, [pathname, search]);
  return null;
}

/**
 * ScrollToTop — resets scroll on every route change.
 * Lenis manages its own internal scroll state, so a plain window.scrollTo()
 * isn't enough: we tell Lenis to jump first (immediate=true skips its smooth
 * tween), then fall back to native scroll if Lenis isn't booted (reduced-motion).
 */
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    const lenis = getLenis();
    if (lenis) lenis.scrollTo(0, { immediate: true });
    else window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function ScrollProgressBar() {
  // scrollYProgress is already a 0-1 motion value, which is exactly what
  // scaleY wants — no useTransform needed. Was driving `height` on every
  // scroll tick (a layout property); scaleY is compositor-only. The CSS's
  // own transform-origin: top was already set up for this, unused before.
  const { scrollYProgress } = useScroll();

  return (
    <div className="scroll-bar__track">
      <motion.div className="scroll-bar__fill" style={{ scaleY: scrollYProgress }} />
    </div>
  );
}

export default function App() {
  const location = useLocation();
  useLenis(); // shared smooth-scroll instance, bridged to GSAP ScrollTrigger
  // The intro is a homepage overture, so it only plays for someone arriving at
  // "/". Now that deep links resolve (SPA rewrites), a visitor opening a shared
  // /gallery or /city/<slug> link would otherwise be held behind a viewfinder
  // animation for content they asked for directly.
  //
  // sessionStorage, deliberately: once per tab per session, not once ever per
  // browser — a new tab replays it. Wrapped defensively since storage access
  // can throw in private browsing.
  const [showIntro, setShowIntro] = useState(() => {
    if (window.location.pathname !== '/') return false;
    try {
      return !sessionStorage.getItem(INTRO_KEY);
    } catch {
      return true;
    }
  });

  const handleIntroDone = () => {
    try { sessionStorage.setItem(INTRO_KEY, '1'); } catch { /* nothing to persist to */ }
    setShowIntro(false);
  };

  return (
    <div className="app">
      <AnimatePresence>
        {showIntro && <IntroScreen key="intro" onDone={handleIntroDone} />}
      </AnimatePresence>
      <ScrollToTop />
      <DocumentTitle />
      {/* First thing in the tab order. Every page routes through one landmark
          below, so this target is stable no matter which route is mounted. */}
      <a className="skip-link" href="#main">Skip to content</a>
      <Navbar />
      <ScrollProgressBar />
      {/* The single <main> for the whole app. Pages render their own sections
          inside it; none declares its own landmark, which is what kept five of
          the six pages without one. */}
      <main id="main" tabIndex={-1}>
      <AnimatePresence mode="wait">
        {/* fallback=null rather than a spinner: on any reasonable connection
            a lazy route chunk resolves near-instantly, and <main>'s own
            solid background already prevents a blank-white flash while it
            does — an honest brief gap, not chrome pretending to be doing
            something. */}
        <Suspense fallback={null}>
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/city/:slug" element={<CityPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/gallery" element={<GalleryPage />} />
            {/* Retired routes — redirects kept for any existing external links */}
            <Route path="/gear" element={<Navigate to="/about" replace />} />
            <Route path="/featured" element={<Navigate to="/" replace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </AnimatePresence>
      </main>
      <Footer />
      <BackToTopButton />
    </div>
  );
}
