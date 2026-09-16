import {interpolate} from 'remotion';
import {DRAW, ENTER, EXIT, RIDE} from './theme';
import {CUE, DRAW_KEYS, HEIGHT, T as W, WIDTH, Win} from './timing';
import {
	DATA,
	FIRST_YEAR,
	LAST_YEAR,
	PER_IDX,
	SPAN_YEARS,
	WAIT_COST,
	indexAt,
	rateAt,
	xOf,
	yOf,
	yRate,
} from './data';

type Curve = (n: number) => number;

const LINEAR: Curve = (n) => n;

/** interpolate() with both ends clamped — the only ramp primitive in the piece. */
export const seg = (
	t: number,
	from: number,
	to: number,
	a: number,
	b: number,
	easing: Curve = LINEAR,
) =>
	interpolate(t, [a, b], [from, to], {
		easing,
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});

export const ramp = (t: number, win: Win, easing: Curve = ENTER) =>
	seg(t, 0, 1, win[0], win[1], easing);

export const rampIn = (t: number, win: Win) => ramp(t, win, ENTER);
export const rampOut = (t: number, win: Win) => 1 - ramp(t, win, EXIT);

/**
 * Elements fade out by subtraction, not by a second component. An element with two
 * exits and two entrances is still one element with four terms.
 */
export const life = (t: number, ...phases: Win[]) =>
	clamp(
		phases.reduce((v, win, k) => v + (k % 2 === 0 ? 1 : -1) * ramp(t, win, k % 2 === 0 ? ENTER : EXIT), 0),
		0,
		1,
	);

/** A caption window: 0.4s in at the start, 0.4s out at the end. */
export const windowed = (t: number, [start, end]: Win) =>
	life(t, [start, start + 0.4], [end - 0.4, end]);

export const clamp = (n: number, lo: number, hi: number) => Math.min(Math.max(n, lo), hi);
export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

// ---------------------------------------------------------------- the draw
//
// Animate the YEAR through explicit keyframes and derive progress from it. An eased
// 0 -> 1 progress makes year a non-linear function of time, the last two decades get
// consumed in a fraction of a second, and no caption can be timed to its event.

export const drawYearAt = (t: number) =>
	DRAW_KEYS.reduce((year, k) => year + seg(t, 0, k.years, k.win[0], k.win[1], DRAW), FIRST_YEAR);

export type Tip = {year: number; index: number; x: number; y: number; i: number; frac: number};

export const tipAt = (t: number): Tip => {
	const year = clamp(drawYearAt(t), FIRST_YEAR, LAST_YEAR);
	const i = Math.min(Math.floor(year - FIRST_YEAR), DATA.length - 1);
	const index = indexAt(year);
	return {year, index, x: xOf(year), y: yOf(index), i, frac: year - FIRST_YEAR - i};
};

/**
 * The tip looks BACKWARD, at the move just drawn — not forward at the move coming next.
 * Get this wrong and the 2009 trough renders red: the line has just fallen for three
 * years, but 2010 happens to be higher.
 */
export const tipRising = (tip: Tip) => {
	if (tip.frac > 0.001) {
		const next = DATA[Math.min(tip.i + 1, DATA.length - 1)][1];
		return next >= DATA[tip.i][1];
	}
	if (tip.i === 0) return true;
	return DATA[tip.i][1] >= DATA[tip.i - 1][1];
};

export const progressAt = (t: number) => clamp((drawYearAt(t) - FIRST_YEAR) / SPAN_YEARS, 0, 1);

// ---------------------------------------------------------------- the rate ride
//
// Linear, and slow: 51 years in 6.2 seconds. An ease-in-out makes a vehicle accelerate
// through the middle of its own journey, which reads as a glitch rather than a ride.

export const rateYearAt = (t: number) =>
	seg(t, FIRST_YEAR, LAST_YEAR, W.rateRide[0], W.rateRide[1], RIDE);

export type RateTip = {year: number; pct: number; x: number; y: number};

export const rateTipAt = (t: number): RateTip => {
	const year = rateYearAt(t);
	const pct = rateAt(year);
	return {year, pct, x: xOf(year), y: yRate(pct)};
};

// ---------------------------------------------------------------- camera

export const GAP_FOCUS = {x: 885, y: 800, scale: 2} as const;
const HOME = {x: WIDTH / 2, y: HEIGHT / 2} as const;

export type Camera = {scale: number; fx: number; fy: number};

export const cameraAt = (t: number, reduced = false): Camera => {
	if (reduced) return {scale: 1, fx: HOME.x, fy: HOME.y};

	// Arrive at 1.00, drift slowly back to 1.06, undo the drift on the pull-back.
	const settle = seg(t, 1.06, 1.0, W.camSettle[0], W.camSettle[1], ENTER);
	const drift = seg(t, 0, 0.06, W.camDrift[0], W.camDrift[1]);
	const undrift = seg(t, 0, 0.06, W.camBack[0], W.camBack[1], ENTER);
	const base = settle + drift - undrift;

	const k = rampIn(t, W.camGap) * (1 - rampIn(t, W.camBack));

	return {
		scale: lerp(base, GAP_FOCUS.scale, k),
		fx: lerp(HOME.x, GAP_FOCUS.x, k),
		fy: lerp(HOME.y, GAP_FOCUS.y, k),
	};
};

/** Maps the 1400x1920 chart space onto the 1080x1920 frame. */
export const cameraTransform = ({scale, fx, fy}: Camera) =>
	`translate(${WIDTH / 2 - fx * scale}px, ${HEIGHT / 2 - fy * scale}px) scale(${scale})`;

// ---------------------------------------------------------------- the whole state

export type ReelState = {
	t: number;
	frame: number;
	reduced: boolean;
	tip: Tip;
	p: number;
	rising: boolean;
	dollars: number;
	yearLabel: number;
	rate: RateTip;
	camera: Camera;
	chartRise: number;
	chartOpacity: number;
	eyebrowOpacity: number;
	askOpacity: number;
	askLift: number;
	invOpacity: number;
	readoutOpacity: number;
	dropOpacity: number;
	rateLayerOpacity: number;
	ratesTitleOpacity: number;
	deltaOpacity: number;
	deltaValue: number;
	panelOpacity: number;
	soldOpacity: number;
	payOpacity: number;
	closeOpacity: number;
};

export const reelState = (frame: number, fps: number, reduced = false): ReelState => {
	const t = frame / fps;
	const tip = tipAt(t);
	const rising = tipRising(tip);

	// The 2008 callout is keyed off the line, not the clock: it lands as the fall
	// completes and outlasts the recovery caption.
	const dropIn = clamp((tip.year - 2008.6) / 0.4, 0, 1);

	return {
		t,
		frame,
		reduced,
		tip,
		p: progressAt(t),
		rising,
		dollars: tip.index * PER_IDX,
		yearLabel: Math.round(tip.year),
		rate: rateTipAt(t),
		camera: cameraAt(t, reduced),
		chartRise: reduced ? 0 : seg(t, 90, 0, W.chartRise[0], W.chartRise[1], ENTER),
		chartOpacity: life(t, W.chartIn, W.chartOut),
		eyebrowOpacity: life(t, W.eyebrowIn, W.eyebrowOut, W.eyebrowBack),
		askOpacity: life(t, W.askIn, W.askOut),
		askLift: reduced ? 0 : seg(t, 0, -140, W.askOut[0], W.askOut[1], ENTER),
		invOpacity: life(t, W.invIn, W.invOut),
		readoutOpacity: life(t, W.readoutIn, W.readoutOut, W.readoutBack, W.readoutGone),
		// Up from the moment the line reaches it; ducks out for the rate car; comes back for Gap.
		dropOpacity: dropIn * life(t, [-1, -0.9], W.dropOut),
		rateLayerOpacity: life(t, [W.rateRide[0] - 0.4, W.rateRide[0]], W.rateLayerOut),
		ratesTitleOpacity: life(t, W.ratesTitleIn, W.ratesTitleOut),
		deltaOpacity: life(t, W.deltaIn, W.chartOut),
		deltaValue: seg(t, 0, WAIT_COST, W.deltaCount[0], W.deltaCount[1], DRAW),
		panelOpacity: life(t, W.panelIn, W.panelOut),
		soldOpacity: life(t, W.soldIn, W.soldOut),
		payOpacity: life(t, W.payIn, W.payOut),
		closeOpacity: rampIn(t, W.closeIn),
	};
};

export {CUE};
