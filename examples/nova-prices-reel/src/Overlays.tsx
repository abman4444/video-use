import React from 'react';
import {BILLS, money} from './data';
import {ACCENT, BLUE, DRAW, INK, INK2, INK3, MONO, RATE, SANS, TABULAR, chip} from './theme';
import {CAPTIONS, T} from './timing';
import {ReelState, ramp, windowed} from './reel';
import {AccentSwipe} from './ui';

/**
 * Year + price, live off the tip. The price takes the tip's own direction colour, so the
 * whole frame agrees: during the 1.6s hold this must read $408,000 in blue.
 */
export const Readout: React.FC<{state: ReelState}> = ({state}) => {
	if (state.readoutOpacity <= 0.002) return null;
	return (
		<div
			style={{
				position: 'absolute',
				top: 268,
				left: 0,
				right: 0,
				textAlign: 'center',
				opacity: state.readoutOpacity,
			}}
		>
			<div style={{...chip(52, '0em', INK2), fontWeight: 400}}>{state.yearLabel}</div>
			<div
				style={{
					fontFamily: SANS,
					fontWeight: 800,
					fontSize: 152,
					letterSpacing: '-0.04em',
					lineHeight: 1.04,
					color: state.rising ? ACCENT : BLUE,
					...TABULAR,
				}}
			>
				{money(state.dollars)}
			</div>
		</div>
	);
};

export const Captions: React.FC<{t: number}> = ({t}) => (
	<>
		{CAPTIONS.map((c) => {
			const opacity = windowed(t, c.window);
			if (opacity <= 0.002) return null;
			return (
				<div
					key={c.text}
					style={{
						position: 'absolute',
						top: 1480,
						left: 90,
						right: 90,
						textAlign: 'center',
						fontFamily: SANS,
						fontWeight: 500,
						fontSize: 42,
						lineHeight: 1.25,
						textWrap: 'balance',
						color: INK2,
						opacity,
					}}
				>
					{c.text}
				</div>
			);
		})}
	</>
);

/** Up/Down decode the price line's two colours — the viewer has been seeing them since
 *  Climb, but this is where they get named. */
const Swatch: React.FC<{w: number; h: number; fill: string; dashed?: boolean}> = ({w, h, fill, dashed}) => (
	<span
		style={{
			display: 'inline-block',
			width: w,
			height: h,
			borderRadius: h / 2,
			background: dashed
				? `repeating-linear-gradient(90deg, ${fill} 0 11px, transparent 11px 18px)`
				: fill,
		}}
	/>
);

export const RatesTitle: React.FC<{state: ReelState}> = ({state}) => {
	if (state.ratesTitleOpacity <= 0.002) return null;
	return (
		<div
			style={{
				position: 'absolute',
				top: 252,
				left: 60,
				right: 60,
				textAlign: 'center',
				opacity: state.ratesTitleOpacity,
			}}
		>
			<h2
				style={{
					fontFamily: SANS,
					fontWeight: 800,
					fontSize: 76,
					letterSpacing: '-0.04em',
					lineHeight: 1.03,
					color: INK,
					margin: 0,
				}}
			>
				Now watch the rate.
			</h2>
			<div
				style={{
					marginTop: 30,
					display: 'flex',
					flexDirection: 'row',
					justifyContent: 'center',
					alignItems: 'center',
					gap: 34,
					fontFamily: MONO,
					fontSize: 28,
					color: INK2,
				}}
			>
				<span style={{display: 'flex', alignItems: 'center', gap: 12}}>
					<Swatch w={38} h={7} fill={ACCENT} /> Up
				</span>
				<span style={{display: 'flex', alignItems: 'center', gap: 12}}>
					<Swatch w={38} h={7} fill={BLUE} /> Down
				</span>
				<span style={{display: 'flex', alignItems: 'center', gap: 12}}>
					<Swatch w={44} h={6} fill={RATE} dashed /> 30-yr rate
				</span>
			</div>
		</div>
	);
};

/**
 * Fourteen `$` characters — the typeface's own glyph — rise while the count runs, as if
 * the money is leaving. This paints UNDER the chart: several x positions fall straight
 * through the 2016 / $487K annotations, and clay glyphs over mono digits garble them.
 */
export const MoneyMotif: React.FC<{t: number; opacity: number}> = ({t, opacity}) => {
	if (opacity <= 0.002) return null;
	return (
		<div style={{position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', opacity}}>
			{BILLS.map(([x, delay, dur], i) => {
				const q = (t - (T.billsFrom + delay)) / dur;
				if (q <= 0 || q >= 1) return null;
				return (
					<div
						key={x}
						style={{
							position: 'absolute',
							left: x,
							top: 1240 - q * 640,
							fontFamily: SANS,
							fontWeight: 800,
							fontSize: 54 + 16 * Math.sin(i * 2.1),
							color: ACCENT,
							opacity: Math.sin(q * Math.PI) * 0.5,
							transform: `rotate(${Math.sin(i * 1.3) * 14}deg)`,
						}}
					>
						$
					</div>
				);
			})}
		</div>
	);
};

export const DeltaHeadline: React.FC<{state: ReelState}> = ({state}) => {
	const {t, deltaOpacity, reduced} = state;
	if (deltaOpacity <= 0.002) return null;
	const swipe = ramp(t, T.deltaSwipe, DRAW);
	return (
		<div
			style={{
				position: 'absolute',
				top: 268,
				left: 0,
				right: 0,
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				textAlign: 'center',
				opacity: deltaOpacity,
			}}
		>
			<div style={chip(28, '0.18em', INK3)}>TEN YEARS OF WAITING</div>
			<div
				style={{
					fontFamily: SANS,
					fontWeight: 800,
					fontSize: 158,
					letterSpacing: '-0.04em',
					lineHeight: 1.04,
					color: ACCENT,
					marginTop: 18,
					...TABULAR,
				}}
			>
				+{money(state.deltaValue)}
			</div>
			<AccentSwipe width={520} height={18} marginTop={24} progress={swipe} reduced={reduced} />
		</div>
	);
};
