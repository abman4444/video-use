import {interpolate} from 'remotion';
import {DRAW, ENTER, EXIT} from './theme';
import {DRAW_KEYS, HEIGHT, T, WIDTH} from './timing';
import {
	FIRST_YEAR,
	LAST_YEAR,
	PER_IDX,
	SPAN_YEARS,
	WAIT_COST,
	indexAt,
	xOf,
	yOf,
} from './data';

type Curve = (n: number) => number;

const LINEAR: Curve = (n) => n;

/** interpolate() with both ends clamped — the only ramp primitive used in the piece. */
export const seg = (
	frame: number,
	from: number,
	to: number,
	f0: number,
	f1: number,
	easing: Curve = LINEAR,
) =>
	interpolate(frame, [f0, f1], [from, to], {
		easing,
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});

export const rampIn = (frame: number, [f0, f1]: readonly [number, number]) =>
	seg(frame, 0, 1, f0, f1, ENTER);

export const rampOut = (frame: number, [f0, f1]: readonly [number, number]) =>
	seg(frame, 1, 0, f0, f1, EXIT);

/** Fade in over `into`, hold, fade out over `outOf`. */
export const crossfade = (
	frame: number,
	into: readonly [number, number],
	outOf: readonly [number, number],
) => Math.min(rampIn(frame, into), rampOut(frame, outOf));

/** A caption window: 12 frames in at the start, 12 frames out at the end. */
export const windowed = (frame: number, [start, end]: readonly [number, number]) =>
	crossfade(frame, [start, start + 12], [end - 12, end]);

export const clamp = (n: number, lo: number, hi: number) => Math.min(Math.max(n, lo), hi);

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// ---------------------------------------------------------------- the draw
//
// Animate the YEAR through explicit keyframes and derive progress from it. An eased
// 0 -> 1 progress makes year a non-linear function of time, the last two decades get
// consumed in a fraction of a second, and no caption can be timed to its event.

export const drawYearAt = (frame: number) =>
	DRAW_KEYS.reduce(
		(year, k) => year + seg(frame, 0, k.years, k.from, k.to, DRAW),
		FIRST_YEAR,
	);

export type Tip = {year: number; index: number; x: number; y: number};

export const tipAt = (frame: number): Tip => {
	const year = clamp(drawYearAt(frame), FIRST_YEAR, LAST_YEAR);
	const index = indexAt(year);
	return {year, index, x: xOf(year), y: yOf(index)};
};

export const progressAt = (frame: number) =>
	clamp((drawYearAt(frame) - FIRST_YEAR) / SPAN_YEARS, 0, 1);

// ---------------------------------------------------------------- camera
//
// One camera over one chart. The chart is mounted from Climb through Split and is
// never remounted — every scene change is a cross-fade plus a camera move.

export const GAP_FOCUS = {x: 883, y: 800, scale: 2} as const;
const HOME = {x: WIDTH / 2, y: HEIGHT / 2} as const;

export type Camera = {scale: number; fx: number; fy: number};

export const cameraAt = (frame: number, reduced = false): Camera => {
	if (reduced) return {scale: 1, fx: HOME.x, fy: HOME.y};

	// Arrive at 1.00, drift slowly back out to 1.06, undo the drift on the pull-back.
	const settle = seg(frame, 1.06, 1.0, T.camSettle[0], T.camSettle[1], ENTER);
	const drift = seg(frame, 0, 0.06, T.camDrift[0], T.camDrift[1]);
	const undrift = seg(frame, 0, 0.06, T.camBack[0], T.camBack[1], ENTER);
	const base = settle + drift - undrift;

	// Into the Gap framing, then back out of it.
	const t =
		rampIn(frame, T.camGap) * (1 - rampIn(frame, T.camBack));

	return {
		scale: lerp(base, GAP_FOCUS.scale, t),
		fx: lerp(HOME.x, GAP_FOCUS.x, t),
		fy: lerp(HOME.y, GAP_FOCUS.y, t),
	};
};

/** Maps the 1400x1920 chart space onto the 1080x1920 frame. */
export const cameraTransform = ({scale, fx, fy}: Camera) =>
	`translate(${WIDTH / 2 - fx * scale}px, ${HEIGHT / 2 - fy * scale}px) scale(${scale})`;

// ---------------------------------------------------------------- the whole state
//
// Everything the tree needs, derived from one frame. Pure — scripts/verify-timing.mjs
// probes this directly rather than eyeballing rendered frames.

export type ReelState = {
	frame: number;
	tip: Tip;
	p: number;
	dollars: number;
	yearLabel: number;
	camera: Camera;
	chartRise: number;
	chartOpacity: number;
	eyebrowOpacity: number;
	hookOpacity: number;
	hookLift: number;
	readoutOpacity: number;
	dropOpacity: number;
	deltaOpacity: number;
	deltaValue: number;
	panelOpacity: number;
	closeOpacity: number;
};

export const reelState = (frame: number, reduced = false): ReelState => {
	const tip = tipAt(frame);
	const p = progressAt(frame);

	// The 2008 callout is keyed off the line, not the clock: it lands as the fall
	// completes and outlasts the recovery caption.
	const dropIn = clamp((tip.year - 2008.6) / 0.4, 0, 1);

	return {
		frame,
		tip,
		p,
		dollars: tip.index * PER_IDX,
		yearLabel: Math.round(tip.year),
		camera: cameraAt(frame, reduced),
		chartRise: reduced ? 0 : seg(frame, 90, 0, T.chartRise[0], T.chartRise[1], ENTER),
		chartOpacity: crossfade(frame, T.chartIn, T.chartOut),
		eyebrowOpacity: crossfade(frame, T.eyebrowIn, T.eyebrowOut),
		hookOpacity: crossfade(frame, T.hookHeadIn, T.hookHeadOut),
		hookLift: reduced ? 0 : seg(frame, 0, -180, T.hookHeadOut[0], T.hookHeadOut[1], ENTER),
		readoutOpacity: crossfade(frame, T.readoutIn, T.readoutOut),
		dropOpacity: dropIn * rampOut(frame, T.dropOut),
		deltaOpacity: crossfade(frame, T.deltaIn, T.chartOut),
		deltaValue: seg(frame, 0, WAIT_COST, T.deltaCount[0], T.deltaCount[1], DRAW),
		panelOpacity: crossfade(frame, T.panelIn, T.panelOut),
		closeOpacity: rampIn(frame, T.closeIn),
	};
};
