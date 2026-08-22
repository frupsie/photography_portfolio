import { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import './App.css';
import { AnimatePresence, motion, useScroll, useTransform } from 'framer-motion';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import BackToTopButton from './components/BackToTopButton';
import LandingPage from './components/LandingPage';
import CityPage from './components/pages/CityPage';
import AboutPage from './components/pages/AboutPage';
import ContactPage from './components/pages/ContactPage';
import GalleryPage from './components/pages/GalleryPage';
import NotFound from './components/pages/NotFound';
import IntroScreen from './components/IntroScreen';
// Sandbox — unlinked route for comparing a redesign against the live acts.
// See CLAUDE.md: visual changes are staged, never edited in place.
import JourneyAct from './components/sandbox/JourneyAct';
import HomeV2 from './components/sandbox/HomeV2';
import { useLenis, getLenis } from './hooks/useLenis';

const INTRO_KEY = 'jayden_intro_seen';

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
  const { scrollYProgress } = useScroll();
  const height = useTransform(scrollYProgress, [0, 1], ['0%', '100%']);

  return (
    <div className="scroll-bar__track">
      <motion.div className="scroll-bar__fill" style={{ height }} />
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
  const [showIntro, setShowIntro] = useState(
    () => window.location.pathname === '/' && !sessionStorage.getItem(INTRO_KEY)
  );

  const handleIntroDone = () => {
    sessionStorage.setItem(INTRO_KEY, '1');
    setShowIntro(false);
  };

  return (
    <div className="app">
      <AnimatePresence>
        {showIntro && <IntroScreen key="intro" onDone={handleIntroDone} />}
      </AnimatePresence>
      <ScrollToTop />
      <Navbar />
      <ScrollProgressBar />
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/city/:slug" element={<CityPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/gallery" element={<GalleryPage />} />
          {/* Sandbox — not in the navbar, not in the sitemap */}
          <Route path="/sandbox/journey" element={<JourneyAct />} />
          <Route path="/sandbox/home" element={<HomeV2 />} />
          {/* Retired routes — redirects kept for any existing external links */}
          <Route path="/gear" element={<Navigate to="/about" replace />} />
          <Route path="/featured" element={<Navigate to="/" replace />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AnimatePresence>
      <Footer />
      <BackToTopButton />
    </div>
  );
}
