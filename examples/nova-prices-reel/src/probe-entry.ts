// Entry for scripts/verify-timing.mjs. Re-exports only the pure parts of the tree — no
// React, no DOM — so the timing contract can be asserted in plain Node.
export {reelState, windowed, tipAt, tipRising, drawYearAt, progressAt, cameraAt, rateTipAt} from './reel';
export {CAPTIONS, CUE, DURATION, FPS, HOLD, SCENES, T, WALK} from './timing';
export {
	money,
	perMonth,
	moneyK,
	WAIT_COST,
	DOLLARS_FROM,
	DOLLARS_TO,
	PRICE_RISE_PCT,
	PMT_RISE_PCT,
	REAL_RISE_PCT,
	PMT_FROM,
	PMT_TO,
	FROM_YEAR,
	TO_YEAR,
} from './data';
