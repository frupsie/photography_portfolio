import { Routes, Route, useLocation } from 'react-router-dom';
import './App.css';
import { AnimatePresence } from 'framer-motion';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import LandingPage from './components/LandingPage';
import CityPage from './components/pages/CityPage';
import AboutPage from './components/pages/AboutPage';
import ContactPage from './components/pages/ContactPage';
import GearPage from './components/pages/GearPage';
import GalleryPage from './components/pages/GalleryPage';

export default function App() {
  const location = useLocation();

  return (
    <div className="app">
      <Navbar />
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/city/:slug" element={<CityPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/gear" element={<GearPage />} />
          <Route path="/gallery" element={<GalleryPage />} />
        </Routes>
      </AnimatePresence>
      <Footer />
    </div>
  );
}
