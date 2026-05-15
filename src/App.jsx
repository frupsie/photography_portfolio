import { useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import './App.css';
import { AnimatePresence, motion, useScroll, useTransform } from 'framer-motion';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import LandingPage from './components/LandingPage';
import CityPage from './components/pages/CityPage';
import AboutPage from './components/pages/AboutPage';
import ContactPage from './components/pages/ContactPage';
import GalleryPage from './components/pages/GalleryPage';
import FeaturedPage from './pages/FeaturedPage';
import IntroScreen from './components/IntroScreen';
import { useLenis } from './hooks/useLenis';

const INTRO_KEY = 'jayden_intro_seen';

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
  const [showIntro, setShowIntro] = useState(
    () => !sessionStorage.getItem(INTRO_KEY)
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
      <Navbar />
      <ScrollProgressBar />
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/city/:slug" element={<CityPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/gear" element={<Navigate to="/about" replace />} />
          <Route path="/featured" element={<FeaturedPage />} />
          <Route path="/gallery" element={<GalleryPage />} />
        </Routes>
      </AnimatePresence>
      <Footer />
    </div>
  );
}
