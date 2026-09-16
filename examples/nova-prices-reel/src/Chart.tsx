import React from 'react';
import {
	DATA,
	DECADES,
	DOLLARS_FROM,
	FIRST_YEAR,
	FROM_YEAR,
	GRID_DOLLARS,
	LAST_YEAR,
	PEAK_2006,
	RATES,
	RATE_TICKS,
	TROUGH_2009,
	VB_H,
	VB_W,
	X0,
	X1,
	Y0,
	idxOfYear,
	indexOfDollars,
	moneyK,
	xOf,
	yOf,
	yRate,
} from './data';
import {ACCENT, AREA, BLUE, DIP, DRAW, INK, INK3, INK4, LINE, MONO, RATE, SANS} from './theme';
import {T} from './timing';
import {ReelState, Tip, clamp, ramp, rampIn, seg, tipRising} from './reel';

const n = (v: number) => v.toFixed(2);

// ---------------------------------------------------------------- the price line
//
// Not one path: one path per year-over-year move, stroked ACCENT red if that year closed
// at or above the previous year and BLUE if it closed below — so the viewer reads gain
// and loss without being told.

type Seg = {d: string; up: boolean};

const segsTo = (tip: Tip): Seg[] => {
	const out: Seg[] = [];
	for (let k = 1; k <= tip.i; k++) {
		out.push({
			d: `M ${n(xOf(DATA[k - 1][0]))} ${n(yOf(DATA[k - 1][1]))} L ${n(xOf(DATA[k][0]))} ${n(yOf(DATA[k][1]))}`,
			up: DATA[k][1] >= DATA[k - 1][1],
		});
	}
	if (tip.frac > 0.001 && tip.i < DATA.length - 1) {
		out.push({
			d: `M ${n(xOf(DATA[tip.i][0]))} ${n(yOf(DATA[tip.i][1]))} L ${n(tip.x)} ${n(tip.y)}`,
			up: DATA[tip.i + 1][1] >= DATA[tip.i][1],
		});
	}
	return out;
};

/** The filled shape under whatever has been drawn so far. */
const areaTo = (tip: Tip) => {
	const parts = [`M ${n(xOf(FIRST_YEAR))} ${n(yOf(DATA[0][1]))}`];
	for (let k = 1; k <= tip.i; k++) parts.push(`L ${n(xOf(DATA[k][0]))} ${n(yOf(DATA[k][1]))}`);
	if (tip.frac > 0.001) parts.push(`L ${n(tip.x)} ${n(tip.y)}`);
	parts.push(`L ${n(tip.x)} ${Y0}`, `L ${n(xOf(FIRST_YEAR))} ${Y0}`, 'Z');
	return parts.join(' ');
};

const GHOST = (() => {
	const parts = [`M ${n(xOf(FIRST_YEAR))} ${n(yOf(DATA[0][1]))}`];
	for (let k = 1; k < DATA.length; k++) parts.push(`L ${n(xOf(DATA[k][0]))} ${n(yOf(DATA[k][1]))}`);
	return parts.join(' ');
})();

const ratePathTo = (year: number) => {
	const parts = [`M ${n(xOf(FIRST_YEAR))} ${n(yRate(RATES[0][1]))}`];
	const whole = Math.floor(year);
	for (let k = 1; k <= whole - FIRST_YEAR && k < RATES.length; k++) {
		parts.push(`L ${n(xOf(RATES[k][0]))} ${n(yRate(RATES[k][1]))}`);
	}
	return parts.join(' ');
};

// ---------------------------------------------------------------- decade ticks

const DecadeTick: React.FC<{year: number; tipYear: number}> = ({year, tipYear}) => {
	if (tipYear < year - 1.2) return null;
	const d = tipYear - year;
	const fl = clamp(1 - Math.abs(d) / 2.4, 0, 1) ** 2;
	const live = fl > 0.04;
	const x = xOf(year);
	return (
		<g>
			<line x1={x} y1={Y0} x2={x} y2={Y0 + 16 + 12 * fl} stroke={live ? BLUE : INK} strokeWidth={3 + 3 * fl} />
			<text
				x={x}
				y={Y0 + 60 + 8 * fl}
				textAnchor="middle"
				fontFamily={MONO}
				fontSize={34 + 16 * fl}
				fontWeight={fl > 0.35 ? 700 : 400}
				fill={live ? BLUE : INK3}
			>
				{year}
			</text>
		</g>
	);
};

// ---------------------------------------------------------------- the 2008 drop
//
// Nothing in this group may be opaque. It renders after the area fill, so any fill here
// paints over the chart and erases the recovery leg.

const DropCallout: React.FC<{opacity: number}> = ({opacity}) => {
	if (opacity <= 0.002) return null;
	const xPeak = xOf(2006);
	const yPeak = yOf(PEAK_2006);
	const xTrough = xOf(2009);
	const yTrough = yOf(TROUGH_2009);
	const x19 = xOf(2019);
	return (
		<g opacity={opacity}>
			<line x1={xPeak} y1={yPeak} x2={x19} y2={yPeak} stroke={INK4} strokeWidth={3} strokeDasharray="12 10" />
			<circle cx={xPeak} cy={yPeak} r={13} fill="none" stroke={INK} strokeWidth={4} />
			<circle cx={xTrough} cy={yTrough} r={13} fill={DIP} />
			<text x={xTrough + 30} y={yTrough + 46} fontFamily={SANS} fontSize={44} fontWeight={800} fill={DIP}>
				-20%
			</text>
			<text x={xTrough + 30} y={yTrough + 84} fontFamily={MONO} fontSize={26} fontWeight={400} fill={INK3}>
				2006 to 2009
			</text>
			<text x={x19} y={yPeak - 26} textAnchor="middle" fontFamily={SANS} fontSize={40} fontWeight={800} fill={BLUE}>
				2019
			</text>
			<text x={x19} y={yPeak - 66} textAnchor="middle" fontFamily={MONO} fontSize={24} fontWeight={400} fill={INK3}>
				back to 2006 prices
			</text>
		</g>
	);
};

// ---------------------------------------------------------------- the ten-year gap

const GapCallout: React.FC<{t: number}> = ({t}) => {
	const ring = rampIn(t, T.gapRing);
	const rule = ramp(t, T.gapRule, DRAW);
	const measure = ramp(t, T.gapMeasure, DRAW);
	if (ring <= 0.002 && rule <= 0.002) return null;

	const xf = xOf(FROM_YEAR);
	const yf = yOf(idxOfYear(FROM_YEAR));
	const yt = yOf(idxOfYear(LAST_YEAR));

	return (
		<g>
			{/*
			  Above-left of the 2016 point, and high enough to clear the 2006 peak: at the Gap
			  zoom the frame shows only chart x 615..1155, so the stack cannot move further
			  left without leaving the frame — it moves up instead.
			*/}
			<g opacity={ring}>
				<circle cx={xf} cy={yf} r={13} fill="none" stroke={INK} strokeWidth={4} />
				<text x={xf - 24} y={yf - 186} textAnchor="end" fontFamily={MONO} fontSize={26} fill={INK3}>
					{FROM_YEAR}
				</text>
				<text x={xf - 24} y={yf - 138} textAnchor="end" fontFamily={SANS} fontSize={46} fontWeight={700} fill={INK}>
					{moneyK(DOLLARS_FROM)}
				</text>
			</g>
			<g opacity={rule > 0 ? 1 : 0}>
				<line
					x1={xf}
					y1={yf}
					x2={xf + (X1 - xf) * rule}
					y2={yf}
					stroke={INK4}
					strokeWidth={3}
					strokeDasharray="12 10"
				/>
			</g>
			<g opacity={measure > 0 ? 1 : 0}>
				<line x1={X1} y1={yf} x2={X1} y2={yf + (yt - yf) * measure} stroke={ACCENT} strokeWidth={5} />
				<line x1={X1 - 16} y1={yf} x2={X1 + 16} y2={yf} stroke={ACCENT} strokeWidth={5} />
			</g>
		</g>
	);
};

// ---------------------------------------------------------------- the rate car
//
// A dashed line is meaningless to someone landing mid-scroll, and a legend at the top is
// not where the eye is. So the line carries its own nameplate, riding the leading tip.

const CAR_W = 530;
const CAR_H = 100;
const STEM = 32;

export type CarBox = {x0: number; x1: number; y0: number; y1: number} | null;

export const carBoxAt = (state: ReelState, opacity: number): CarBox => {
	if (opacity <= 0.002) return null;
	const {rate, camera} = state;
	// The margin is derived from the live camera scale: a literal 80 in SVG space renders
	// at 52px on screen while the camera sits at its 1.06 drift.
	const mg = 540 - (540 - 80) / camera.scale;
	const cx = clamp(rate.x, CAR_W / 2 + mg, 1080 - CAR_W / 2 - mg);
	const below = rate.pct > 13;
	const cy = below ? rate.y + STEM + CAR_H / 2 : rate.y - STEM - CAR_H / 2;
	return {x0: cx - CAR_W / 2, x1: cx + CAR_W / 2, y0: cy - CAR_H / 2, y1: cy + CAR_H / 2};
};

const RateCar: React.FC<{state: ReelState; opacity: number; box: CarBox}> = ({state, opacity, box}) => {
	if (!box) return null;
	const {rate} = state;
	const cx = (box.x0 + box.x1) / 2;
	const cy = (box.y0 + box.y1) / 2;
	return (
		<g opacity={opacity}>
			<line x1={rate.x} y1={rate.y} x2={cx} y2={cy} stroke={RATE} strokeWidth={3} />
			<rect x={box.x0} y={box.y0} width={CAR_W} height={CAR_H} rx={CAR_H / 2} fill={RATE} />
			<text x={box.x0 + 40} y={cy - 8} fontFamily={MONO} fontSize={19} letterSpacing="1.6" fill="rgba(255,255,255,.85)">
				30-YEAR MORTGAGE
			</text>
			<text x={box.x0 + 40} y={cy + 24} fontFamily={MONO} fontSize={19} letterSpacing="1.6" fill="rgba(255,255,255,.85)">
				INTEREST RATE
			</text>
			<text
				x={box.x1 - 40}
				y={cy + 18}
				textAnchor="end"
				fontFamily={SANS}
				fontSize={50}
				fontWeight={800}
				fill="#ffffff"
				style={{fontVariantNumeric: 'tabular-nums'}}
			>
				{rate.pct.toFixed(2)}%
			</text>
			{/* the wheel on the track */}
			<circle cx={rate.x} cy={rate.y} r={15} fill={RATE} />
			<circle cx={rate.x} cy={rate.y} r={7} fill="#ffffff" />
		</g>
	);
};

const RateMark: React.FC<{
	year: number;
	pct: number;
	rideYear: number;
	after: number;
	span: number;
	anchor: 'start' | 'end';
}> = ({year, pct, rideYear, after, span, anchor}) => {
	const o = clamp((rideYear - after) / span, 0, 1);
	if (o <= 0.002) return null;
	const x = xOf(year);
	const y = yRate(pct);
	const dx = anchor === 'start' ? 30 : -30;
	return (
		<g opacity={o}>
			<circle cx={x} cy={y} r={13} fill={RATE} />
			<text x={x + dx} y={y + 6} textAnchor={anchor} fontFamily={SANS} fontSize={52} fontWeight={800} fill={RATE}>
				{pct.toFixed(2)}%
			</text>
			<text x={x + dx} y={y + 42} textAnchor={anchor} fontFamily={MONO} fontSize={26} fill={INK3}>
				{year}
			</text>
		</g>
	);
};

// ---------------------------------------------------------------- the chart

export const Chart: React.FC<{state: ReelState}> = ({state}) => {
	const {tip, p, t, chartRise, dropOpacity, rateLayerOpacity, rising} = state;
	const drawing = p <= 0.995;
	const tipColor = rising ? ACCENT : BLUE;
	const rideYear = state.rate.year;
	const box = carBoxAt(state, rateLayerOpacity);

	return (
		<svg width={VB_W} height={VB_H} viewBox={`0 0 ${VB_W} ${VB_H}`} style={{position: 'absolute', left: 0, top: 0}}>
			<g transform={`translate(0 ${n(chartRise)})`}>
				{/* price gridlines — a label yields while the car crosses it, the car never moves */}
				{GRID_DOLLARS.map((d) => {
					const y = yOf(indexOfDollars(d));
					const hidden = box !== null && box.x0 < X0 - 4 && y > box.y0 - 24 && y < box.y1 + 24;
					return (
						<g key={d}>
							<line x1={X0} y1={y} x2={X1} y2={y} stroke={LINE} strokeWidth={2} />
							<text
								x={X0 - 24}
								y={y + 11}
								textAnchor="end"
								fontFamily={MONO}
								fontSize={30}
								fill={INK4}
								opacity={hidden ? 0 : 1}
							>
								{moneyK(d)}
							</text>
						</g>
					);
				})}

				{/* the finished 51-year shape, underneath, so the frame is never empty */}
				<path d={GHOST} fill="none" stroke={LINE} strokeWidth={5} />

				<path d={areaTo(tip)} fill={AREA} stroke="none" />
				{segsTo(tip).map((s, k) => (
					<path
						key={k}
						d={s.d}
						fill="none"
						stroke={s.up ? ACCENT : BLUE}
						strokeWidth={7}
						strokeLinecap="round"
						strokeLinejoin="round"
					/>
				))}

				{drawing ? (
					<line x1={tip.x} y1={tip.y} x2={tip.x} y2={Y0} stroke={tipColor} strokeWidth={2} opacity={0.3} />
				) : null}
				<circle cx={tip.x} cy={tip.y} r={drawing ? 15 : 13} fill={tipColor} />

				{/* the rate layer — its own dashed line on its own right-hand scale */}
				{rateLayerOpacity > 0.002 ? (
					<g opacity={rateLayerOpacity}>
						<path
							d={ratePathTo(rideYear)}
							fill="none"
							stroke={RATE}
							strokeWidth={6}
							strokeDasharray="14 9"
							strokeLinecap="round"
							strokeLinejoin="round"
						/>
						{RATE_TICKS.map((pc) => (
							<text key={pc} x={X1 + 26} y={yRate(pc) + 10} fontFamily={MONO} fontSize={28} fill={RATE}>
								{pc}%
							</text>
						))}
						<RateMark year={1981} pct={16.63} rideYear={rideYear} after={1981.6} span={2.2} anchor="start" />
						<RateMark year={2021} pct={2.96} rideYear={rideYear} after={2021.4} span={1.8} anchor="end" />
						<RateCar state={state} opacity={rateLayerOpacity} box={box} />
					</g>
				) : null}

				{/* x axis */}
				<line x1={X0} y1={Y0} x2={X1} y2={Y0} stroke={INK} strokeWidth={3} />
				{DECADES.map((y) => (
					<DecadeTick key={y} year={y} tipYear={tip.year} />
				))}

				<DropCallout opacity={dropOpacity} />
				<GapCallout t={t} />
			</g>
		</svg>
	);
};
