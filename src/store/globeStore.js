import { create } from 'zustand';

let _hoverTimer = null;

export const useGlobeStore = create((set, get) => ({
  selectedCity: null,
  hoveredCity: null,
  isAnimating: false,
  hasLanded: false,

  selectCity: (city) =>
    set({ selectedCity: city, isAnimating: true, hoveredCity: null }),

  /* Debounced hover — card stays while mouse moves pin→card */
  setHoveredCity: (city) => {
    if (_hoverTimer) { clearTimeout(_hoverTimer); _hoverTimer = null; }
    set({ hoveredCity: city });
  },

  scheduleHoverClear: () => {
    if (_hoverTimer) clearTimeout(_hoverTimer);
    _hoverTimer = setTimeout(() => {
      _hoverTimer = null;
      set({ hoveredCity: null });
    }, 160);
  },

  clearHoveredNow: () => {
    if (_hoverTimer) { clearTimeout(_hoverTimer); _hoverTimer = null; }
    set({ hoveredCity: null });
  },

  finishAnimation: () => set({ isAnimating: false }),
  clearSelected:   () => set({ selectedCity: null }),
  setHasLanded:    () => set({ hasLanded: true }),
}));
