// Entry point for scripts/verify-timing.mjs. Re-exports only the pure parts of the
// tree — no React, no DOM — so the timing contract can be asserted in plain Node.
export {reelState, windowed, tipAt, drawYearAt, progressAt, cameraAt} from './reel';
export {CAPTIONS, DURATION, FPS, HOLD, SCENE, T} from './timing';
export {money, moneyK, WAIT_COST, DOLLARS_2015, DOLLARS_2025} from './data';
