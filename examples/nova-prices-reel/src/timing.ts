// Every time in the piece, in one place.
//
// Authored in SECONDS against absolute composition time, as the brief specifies: each
// element computes its own opacity and transform from T and a cue constant. That is what
// lets elements cross scene boundaries — the chart persists from Climb through Rates into
// Gap, and the subject-line eyebrow leaves and comes back — and why this is ONE element
// tree rather than nine sequences.

export const FPS = 30;
export const DURATION = 2040; // 68.0s
export const WIDTH = 1080;
export const HEIGHT = 1920;

/** Scene start cues, in seconds. */
export const CUE = {
	question: 0,
	investigate: 5.2,
	climb: 16.8,
	rates: 25.8,
	gap: 33.8,
	split: 38.6,
	sold: 45.0,
	payment: 51.6,
	close: 57.8,
	end: 68.0,
} as const;

export const SCENES = [
	{name: 'Question', at: CUE.question, until: CUE.investigate},
	{name: 'Investigate', at: CUE.investigate, until: CUE.climb},
	{name: 'Climb', at: CUE.climb, until: CUE.rates},
	{name: 'Rates', at: CUE.rates, until: CUE.gap},
	{name: 'Gap', at: CUE.gap, until: CUE.split},
	{name: 'Split', at: CUE.split, until: CUE.sold},
	{name: 'Sold', at: CUE.sold, until: CUE.payment},
	{name: 'Payment', at: CUE.payment, until: CUE.close},
	{name: 'Close', at: CUE.close, until: CUE.end},
] as const;

const Q = CUE.question;
const I = CUE.investigate;
const C = CUE.climb;
const R = CUE.rates;
const G = CUE.gap;
const S = CUE.split;
const So = CUE.sold;
const P = CUE.payment;
const K = CUE.close;

export type Win = readonly [number, number];
const w = (a: number, b: number): Win => [a, b];

/** The line is keyframed in YEAR space, never in progress space. */
export const DRAW_KEYS = [
	{years: 31, win: w(C + 0.2, C + 3.6)}, // 1975 -> 2006 peak
	{years: 3, win: w(C + 3.6, C + 4.2)}, // 2006 -> 2009 trough — the fall
	{years: 10, win: w(C + 5.8, C + 6.8)}, // 1.6s HOLD at 2009, then recovery to 2019
	{years: 7, win: w(C + 6.8, C + 7.6)}, // 2019 -> 2026
] as const;

/** The gap between key 2 and key 3: the line is parked on 2009 for 1.6 seconds. */
export const HOLD = w(C + 4.2, C + 5.8);

export const T = {
	// ---- global
	eyebrowIn: w(Q + 0.1, Q + 0.8),
	eyebrowOut: w(S - 0.6, S - 0.15),
	eyebrowBack: w(K + 0.25, K + 0.9), // returns for Close

	// ---- Scene 1 Question
	askIn: w(Q + 0.15, Q + 0.7),
	// The brief's Q+4.0 is stale: it predates this scene growing 4.4s -> 5.2s for the
	// house build. Left there it opens a 0.9s white gap before Investigate arrives, so the
	// exit takes the same handoff shape every other scene change in the piece uses.
	askOut: w(I - 0.55, I - 0.05),
	trueHilite: w(Q + 0.75, Q + 1.35),
	houseIn: w(Q + 1.15, Q + 1.5),
	houseBuild: w(Q + 1.2, Q + 2.5),
	claimIn: w(Q + 2.05, Q + 2.6),
	claimHilite: w(Q + 3.0, Q + 3.65),

	// ---- Scene 2 Investigate
	invIn: w(I - 0.05, I + 0.45),
	// The brief's +7.2 is stale from the 8.1s cut of this scene. At 11.6s the statement
	// has to stay up for the walker to read it and for the flash beat to land against it,
	// so it holds until W_OUT and hands straight off to the chart fading in underneath.
	invOut: w(I + 10.6, I + 11.1),
	portraitDrop: w(I + 0.05, I + 1.0),
	portraitDrift: w(I + 1.0, I + 7.0),
	portraitScale: w(I + 0.05, I + 0.9),
	writeOn: w(I + 0.85, I + 2.0),
	writeHilite: w(I + 2.05, I + 2.7),

	// ---- Scene 3 Climb
	chartIn: w(C - 0.6, C + 0.2),
	chartOut: w(S - 0.65, S - 0.05),
	chartRise: w(C - 0.5, C + 0.3),
	camSettle: w(C - 0.5, C + 0.3),
	camDrift: w(C + 0.3, G - 0.2),
	camGap: w(G - 0.1, G + 1.5),
	camBack: w(S - 0.65, S - 0.05),
	readoutIn: w(C - 0.25, C + 0.25),
	readoutOut: w(R - 0.5, R - 0.1), // leaves for Rates…
	readoutBack: w(G - 0.3, G + 0.2), // …and comes back for Gap
	readoutGone: w(G + 2.3, G + 2.8),
	cap1: w(C + 0.4, C + 3.2),
	// Ends ON the hold, not 0.05s past it: one frame past and the line has started to
	// climb again, so the readout flips red under a caption about a fall.
	cap2: w(C + 4.25, C + 5.8),
	cap3: w(C + 5.95, C + 7.9),
	dropOut: w(R + 0.15, R + 0.6), // the rate car occupies the same band…
	// The brief brings these back for Gap. At the 2x zoom they render at double size over
	// the gap measure and the 2016 ring — the same noise argument the brief makes for
	// stripping the rate layer applies here, so they stay gone.
	dropBack: w(G - 0.4, G - 0.39),

	// ---- Scene 4 Rates
	ratesTitleIn: w(R - 0.1, R + 0.45),
	ratesTitleOut: w(G - 0.55, G - 0.15),
	rateRide: w(R + 0.4, R + 6.6), // LINEAR — 51 years in 6.2s
	carIn: w(R + 0.3, R + 0.8),
	rateLayerOut: w(G - 0.75, G - 0.35),

	// ---- Scene 5 Gap
	gapRing: w(G + 0.2, G + 1.0),
	gapRule: w(G + 0.35, G + 1.7),
	gapMeasure: w(G + 0.9, G + 1.7),
	deltaIn: w(G + 2.5, G + 3.0),
	deltaCount: w(G + 2.2, G + 4.4),
	deltaSwipe: w(G + 3.9, G + 4.5),
	billsFrom: G + 1.9,

	// ---- Scene 6 Split
	panelIn: w(S - 0.05, S + 0.45),
	panelOut: w(So - 0.55, So - 0.05),
	card1: w(S + 0.45, S + 0.95),
	card1Grow: w(S + 0.95, S + 2.05),
	card2: w(S + 1.4, S + 1.9),
	card2Grow: w(S + 1.9, S + 3.0),

	// ---- Scene 7 Sold
	soldIn: w(So - 0.05, So + 0.45),
	soldOut: w(P - 0.55, P - 0.05),
	soldGroup1: So + 0.5,
	soldGroup2: So + 1.65,
	soldTileStep: 0.16,

	// ---- Scene 8 Payment
	payIn: w(P - 0.05, P + 0.45),
	// Held to the frame Close begins on. The brief clears this at K-0.15 but starts Close
	// at K+0.25, which leaves 0.4s of white between the two.
	payOut: w(K - 0.35, K + 0.25),
	payChip: w(P + 0.25, P + 0.75),
	payRow1: w(P + 0.5, P + 1.0),
	payRow1Grow: w(P + 1.0, P + 2.1),
	payRow2: w(P + 1.35, P + 1.85),
	payRow2Grow: w(P + 1.85, P + 2.95),
	payInflation: w(P + 3.5, P + 4.1),

	// ---- Scene 9 Close
	closeIn: w(K + 0.25, K + 1.0),
	phonesIn: w(K + 0.75, K + 1.35),
	lockup: w(K + 0.6, K + 1.3),
	lockupRule: w(K + 1.15, K + 1.7),
	taglineIn: w(K + 1.45, K + 1.95),
	novaHilite: w(K + 1.75, K + 2.25),
	penDraw: w(K + 2.05, K + 2.85),
	portraitRow: w(K + 1.8, K + 2.3),
	brokerageIn: w(K + 2.0, K + 2.5),
	sourceIn: w(K + 2.15, K + 2.7),
} as const;

/** The walker's six beats. Each is derived from the one before, so changing a delay reflows the chain. */
export const WALK = (() => {
	const IN = I + 3.35;
	const STOP = I + 5.1;
	// +7.15 is stale from the 8.1s cut: the chain below runs to W_Q = I+8.01, so the
	// walker would fade out mid-scratch. The brief's own later note gives iIn + 11.1.
	const OUT = I + 11.1;
	const BLINKS = 2;
	const LOOK = STOP + 0.15;
	const FLASH = LOOK + 0.4; // walkerFlashDelay
	const BLINK = FLASH + 0.5;
	const CAM = BLINK + BLINKS * 0.32 + 0.12;
	const SCR = CAM + 0.45; // walkerScratchDelay
	const QM = SCR + 0.65;
	return {IN, STOP, OUT, BLINKS, LOOK, FLASH, BLINK, CAM, SCR, QM} as const;
})();

export const CAPTIONS = [
	{text: 'Public county data begins in 1975.', window: T.cap1},
	{text: '2008: prices fell 20 percent.', window: T.cap2},
	{text: 'It took thirteen years to get back to the 2006 peak.', window: T.cap3},
] as const;
