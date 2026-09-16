// Every frame number in the piece, in one place.
// 30fps. 27.6s = 828 frames. The reel loops — the last frame hard-cuts to frame 0.

export const FPS = 30;
export const DURATION = 828;
export const WIDTH = 1080;
export const HEIGHT = 1920;

/** Scene starts. Sequential, but animations deliberately cross the boundaries. */
export const SCENE = {
	hook: 0,
	climb: 84,
	gap: 354,
	split: 498,
	close: 690,
} as const;

/** The line is keyframed in YEAR space, never in progress space. */
export const DRAW_KEYS = [
	{years: 31, from: 90, to: 192}, // 1975 -> 2006 peak
	{years: 3, from: 192, to: 210}, // 2006 -> 2009 trough — the fall
	{years: 10, from: 258, to: 288}, // 1.6s HOLD at 2009, then recovery to 2019
	{years: 6, from: 288, to: 312}, // 2019 -> 2025
] as const;

/** The gap between key 2 and key 3: the line is parked on 2009 for 48 frames. */
export const HOLD = {from: 210, to: 258} as const;

export const T = {
	// global
	eyebrowIn: [3, 24],
	eyebrowOut: [480, 494],

	// scene 1 — hook
	hookHeadIn: [7, 30],
	hookHeadOut: [56, 78],
	hookSwipe: [28, 50],

	// chart + camera
	chartIn: [30, 72],
	chartOut: [478, 496],
	chartRise: [30, 93],
	camSettle: [30, 93],
	camDrift: [93, 348],
	camGap: [351, 399],
	camBack: [478, 496],

	// scene 2 — climb
	readoutIn: [78, 96],
	readoutOut: [423, 438],
	cap1: [96, 180],
	cap2: [212, 260],
	cap3: [262, 321],
	dropOut: [336, 351],

	// scene 3 — gap
	gapRing: [366, 390],
	gapRule: [381, 405],
	deltaIn: [429, 444],
	deltaCount: [420, 486],
	deltaSwipe: [471, 489],

	// scene 4 — split
	panelIn: [496, 512],
	// Same handoff shape as chart -> panel: the outgoing screen is fully gone before
	// the next one starts. Two dense screens of type cross-faded over each other read
	// as a smear, not a dissolve.
	panelOut: [679, 697],
	card1: [511.5, 526.5],
	card1Grow: [526.5, 559.5],
	card2: [540, 555],
	card2Grow: [555, 588],

	// scene 5 — close
	closeIn: [697, 720],
	lockup: [708, 729],
	ctaIn: [712, 730],
	bsiIn: [727, 744],
	ctaSwipe: [731, 747],
	sourceIn: [738, 756],
} as const satisfies Record<string, readonly [number, number]>;

/** Captions are keyed to the draw, not the clock. Kept here so the check is one read. */
export const CAPTIONS = [
	{text: 'Public county price data begins in 1975.', window: T.cap1},
	{text: '2008: prices fell 20 percent.', window: T.cap2},
	{text: 'It took thirteen years to get back to the 2006 peak.', window: T.cap3},
] as const;
