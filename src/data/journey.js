/**
 * journey.js — the actual travel routes that animate on the Featured page.
 *
 * Two phases:
 *   Phase 1 — Air routes leaving Singapore for hub destinations.
 *   Phase 2 — Ground routes (train / car / ferry) from each hub to its
 *             satellite cities once the user arrived in-country.
 *
 * Edit freely as new trips happen. `from` is either 'SIN' (Singapore origin)
 * or the slug of a city defined in cities.js.
 */
export const journeyRoutes = [
  // ── Phase 1: Air routes from Singapore ──────────────────────────
  { from: 'SIN', to: 'hong-kong', mode: 'plane', phase: 1 }, // 2023 — direct
  { from: 'SIN', to: 'seoul',     mode: 'plane', phase: 1 }, // 2024
  { from: 'SIN', to: 'hainan',    mode: 'plane', phase: 1 }, // 2025
  { from: 'SIN', to: 'guangzhou', mode: 'plane', phase: 1 }, // 2025 — Greater Bay hub
  { from: 'SIN', to: 'tokyo',     mode: 'plane', phase: 1 }, // 2025 — Japan hub

  // ── Phase 2: Ground routes from hub cities ──────────────────────
  // Greater Bay region (from Guangzhou, 2025)
  { from: 'guangzhou', to: 'shenzhen', mode: 'train', phase: 2 },
  { from: 'guangzhou', to: 'macau',    mode: 'car',   phase: 2 },
  // Japan (from Tokyo, 2025)
  { from: 'tokyo', to: 'nikko',  mode: 'train', phase: 2 },
  { from: 'tokyo', to: 'hakone', mode: 'train', phase: 2 },
  { from: 'tokyo', to: 'kyoto',  mode: 'train', phase: 2 },
  { from: 'tokyo', to: 'osaka',  mode: 'train', phase: 2 },
];

// Animation timing (ms) — tune here, not in the component.
export const FLIGHT_TIMINGS = {
  PHASE_1_DURATION: 2800, // plane arc travel time
  PHASE_2_DURATION: 1600, // ground vehicle travel time
  PHASE_1_GAP:       200, // stagger between planes leaving Singapore
  PHASE_GAP:         600, // pause between phase 1 ending and phase 2 starting
  PHASE_2_GAP:       180, // stagger between ground vehicles departing
};
