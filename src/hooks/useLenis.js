/**
 * useLenis — boots a single smooth-scroll instance and hooks it into GSAP
 * ScrollTrigger. Call once at the App root.
 *
 * Why a single shared RAF loop:
 *   - Lenis usually drives its own animation frame.
 *   - GSAP ScrollTrigger has its own ticker.
 *   - If both run, scroll position desyncs.
 * The bridge here: stop Lenis's internal RAF and drive it from GSAP's ticker,
 * which means ScrollTrigger fires AFTER Lenis updates the scroll position in
 * the same frame. This is the canonical GSAP+Lenis pattern.
 */
import { useEffect } from 'react';
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

let lenisInstance = null;
export const getLenis = () => lenisInstance;

export function useLenis() {
  useEffect(() => {
    // Respect prefers-reduced-motion: bail out, native scroll handles it.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // expo-out
      smoothWheel: true,
      smoothTouch: false, // keep touch native — better mobile feel
    });
    lenisInstance = lenis;

    // Bridge Lenis to GSAP's ticker
    const onTick = (time) => lenis.raf(time * 1000);
    gsap.ticker.add(onTick);
    gsap.ticker.lagSmoothing(0);

    // Sync ScrollTrigger with Lenis
    lenis.on('scroll', ScrollTrigger.update);

    // After Lenis is wired up, refresh ScrollTrigger so any triggers created
    // before now (or during the same frame) pick up the correct scroll positions.
    requestAnimationFrame(() => ScrollTrigger.refresh());

    return () => {
      gsap.ticker.remove(onTick);
      lenis.destroy();
      lenisInstance = null;
    };
  }, []);
}
