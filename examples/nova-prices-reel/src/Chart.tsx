import React from 'react';
import {
	DATA,
	DECADES,
	DOLLARS_2015,
	FIRST_YEAR,
	GRID_DOLLARS,
	IDX_2015,
	IDX_2025,
	LAST_YEAR,
	PEAK_2006,
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
} from './data';
import {ACCENT, BLUE, BLUE50, INK, INK3, INK4, LINE, MONO, SANS, SOLD} from './theme';
import {T} from './timing';
import {DRAW as DRAW_EASE} from './theme';
import {ReelState, Tip, clamp, rampIn, seg} from './reel';

const n = (v: number) => v.toFixed(2);

/** Polyline to the fractional tip: M, then one L per whole year, then L to the tip. */
const linePath = (tip: Tip) => {
	const parts = [`M ${n(xOf(FIRST_YEAR))} ${n(yOf(DATA[0][1]))}`];
	const whole = Math.floor(tip.year);
	for (let y = FIRST_YEAR + 1; y <= whole; y++) {
		parts.push(`L ${n(xOf(y))} ${n(yOf(idxOfYear(y)))}`);
	}
	if (tip.year > whole) parts.push(`L ${n(tip.x)} ${n(tip.y)}`);
	return parts.join(' ');
};

const areaPath = (tip: Tip) =>
	`${linePath(tip)} L ${n(tip.x)} ${Y0} L ${n(xOf(FIRST_YEAR))} ${Y0} Z`;

const FULL_TIP: Tip = {
	year: LAST_YEAR,
	index: IDX_2025,
	x: xOf(LAST_YEAR),
	y: yOf(IDX_2025),
};

// ---------------------------------------------------------------- decade ticks
//
// Each decade swells, turns blue and settles back to grey as the line sweeps past it.

const DecadeTick: React.FC<{year: number; tipYear: number}> = ({year, tipYear}) => {
	if (tipYear < year - 1.2) return null;

	const d = tipYear - year;
	const fl = clamp(1 - Math.abs(d) / 2.4, 0, 1) ** 2;
	const live = fl > 0.04;
	const x = xOf(year);

	return (
		<g>
			<line
				x1={x}
				y1={Y0}
				x2={x}
				y2={Y0 + 16 + 12 * fl}
				stroke={live ? BLUE : INK}
				strokeWidth={3 + 3 * fl}
			/>
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

// ---------------------------------------------------------------- 2008 callout
//
// Nothing in this group may be opaque. It renders after the area fill, so any fill
// here paints over the chart and erases the recovery leg.

const DropCallout: React.FC<{opacity: number}> = ({opacity}) => {
	if (opacity <= 0) return null;

	const xPeak = xOf(2006);
	const yPeak = yOf(PEAK_2006);
	const xTrough = xOf(2009);
	const yTrough = yOf(TROUGH_2009);

	return (
		<g opacity={opacity}>
			<line
				x1={xPeak}
				y1={yPeak}
				x2={xOf(2019)}
				y2={yPeak}
				stroke={INK4}
				strokeWidth={3}
				strokeDasharray="12 10"
			/>
			<circle cx={xPeak} cy={yPeak} r={13} fill="none" stroke={INK} strokeWidth={4} />
			<circle cx={xTrough} cy={yTrough} r={13} fill={SOLD} />
			<text
				x={xTrough + 30}
				y={yTrough + 46}
				fontFamily={SANS}
				fontSize={44}
				fontWeight={800}
				fill={SOLD}
			>
				-20%
			</text>
			<text
				x={xTrough + 30}
				y={yTrough + 84}
				fontFamily={MONO}
				fontSize={26}
				fontWeight={400}
				fill={INK3}
			>
				2006 to 2009
			</text>
		</g>
	);
};

// ---------------------------------------------------------------- the ten-year gap

const GapCallout: React.FC<{frame: number}> = ({frame}) => {
	const ring = rampIn(frame, T.gapRing);
	const draw = seg(frame, 0, 1, T.gapRule[0], T.gapRule[1], DRAW_EASE);
	if (ring <= 0 && draw <= 0) return null;

	const x15 = xOf(2015);
	const y15 = yOf(IDX_2015);
	const y25 = yOf(IDX_2025);

	return (
		<g>
			{/*
			  Above-left of the 2015 point, and high enough to clear the 2006 peak: at the
			  Gap zoom the frame only shows chart x 613..1153, so the stack cannot move
			  further left without leaving the frame — it has to move up instead.
			*/}
			<g opacity={ring}>
				<circle cx={x15} cy={y15} r={13} fill="none" stroke={INK} strokeWidth={4} />
				<text
					x={x15 - 24}
					y={y15 - 178}
					textAnchor="end"
					fontFamily={MONO}
					fontSize={26}
					fontWeight={400}
					fill={INK3}
				>
					2015
				</text>
				<text
					x={x15 - 24}
					y={y15 - 130}
					textAnchor="end"
					fontFamily={SANS}
					fontSize={46}
					fontWeight={700}
					fill={INK}
				>
					{moneyK(DOLLARS_2015)}
				</text>
			</g>

			<g opacity={draw > 0 ? 1 : 0}>
				<line
					x1={x15}
					y1={y15}
					x2={x15 + (X1 - x15) * draw}
					y2={y15}
					stroke={INK4}
					strokeWidth={3}
					strokeDasharray="12 10"
				/>
				<line
					x1={X1}
					y1={y15}
					x2={X1}
					y2={y15 + (y25 - y15) * draw}
					stroke={ACCENT}
					strokeWidth={5}
				/>
				<line
					x1={X1 - 16}
					y1={y15}
					x2={X1 + 16}
					y2={y15}
					stroke={ACCENT}
					strokeWidth={5}
					opacity={draw > 0.02 ? 1 : 0}
				/>
			</g>
		</g>
	);
};

// ---------------------------------------------------------------- the chart

export const Chart: React.FC<{state: ReelState}> = ({state}) => {
	const {tip, p, frame, chartRise, dropOpacity} = state;
	const drawing = p <= 0.995;

	return (
		<svg
			width={VB_W}
			height={VB_H}
			viewBox={`0 0 ${VB_W} ${VB_H}`}
			style={{position: 'absolute', left: 0, top: 0}}
		>
			<g transform={`translate(0 ${n(chartRise)})`}>
				{/* gridlines */}
				{GRID_DOLLARS.map((d) => {
					const y = yOf(indexOfDollars(d));
					return (
						<g key={d}>
							<line x1={X0} y1={y} x2={X1} y2={y} stroke={LINE} strokeWidth={2} />
							<text
								x={X0 - 24}
								y={y + 11}
								textAnchor="end"
								fontFamily={MONO}
								fontSize={30}
								fontWeight={400}
								fill={INK4}
							>
								{moneyK(d)}
							</text>
						</g>
					);
				})}

				{/* the finished 50-year shape, underneath, so the frame is never empty */}
				<path d={linePath(FULL_TIP)} fill="none" stroke={LINE} strokeWidth={5} />

				<path d={areaPath(tip)} fill={BLUE50} stroke="none" />
				<path
					d={linePath(tip)}
					fill="none"
					stroke={BLUE}
					strokeWidth={7}
					strokeLinecap="round"
					strokeLinejoin="round"
				/>

				{drawing ? (
					<line
						x1={tip.x}
						y1={tip.y}
						x2={tip.x}
						y2={Y0}
						stroke={BLUE}
						strokeWidth={2}
						opacity={0.3}
					/>
				) : null}
				<circle cx={tip.x} cy={tip.y} r={drawing ? 15 : 13} fill={BLUE} />

				{/* x axis */}
				<line x1={X0} y1={Y0} x2={X1} y2={Y0} stroke={INK} strokeWidth={3} />
				{DECADES.map((y) => (
					<DecadeTick key={y} year={y} tipYear={tip.year} />
				))}

				<DropCallout opacity={dropOpacity} />
				<GapCallout frame={frame} />
			</g>
		</svg>
	);
};
