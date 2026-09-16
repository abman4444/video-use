import React from 'react';
import {D_MAX, FROM_YEAR, SEG, Segment, TO_YEAR, money} from './data';
import {Icon} from './icons';
import {
	ACCENT,
	BLUE,
	CARD,
	DRAW,
	ENTER,
	INK,
	INK2,
	INK3,
	LINE,
	MONO,
	SANS,
	TABULAR,
	chip,
	headline,
	paragraph,
} from './theme';
import {T, Win} from './timing';
import {ramp, seg} from './reel';

/**
 * The arrow is drawn rather than typed: the vendored latin subset does not promise
 * U+2192, and a tofu box in the middle of the money row would be worse than a glyph
 * matched to the mono stroke.
 */
export const Arrow: React.FC<{size: number; color: string}> = ({size, color}) => (
	<svg width={size} height={size} viewBox="0 0 24 24" style={{display: 'block', flex: '0 0 auto'}}>
		<path
			d="M4 12 H19 M13 6 L19 12 L13 18"
			fill="none"
			stroke={color}
			strokeWidth={2}
			strokeLinecap="round"
			strokeLinejoin="round"
		/>
	</svg>
);

const Card: React.FC<{
	segment: Segment;
	enter: Win;
	grow: Win;
	t: number;
	reduced: boolean;
}> = ({segment: s, enter, grow, t, reduced}) => {
	const appear = ramp(t, enter, ENTER);
	const rise = reduced ? 0 : seg(t, 24, 0, enter[0], enter[1], ENTER);
	const growth = ramp(t, grow, DRAW);

	return (
		<div
			style={{
				margin: '0 90px',
				padding: '44px 46px 40px',
				background: CARD,
				border: `1px solid ${LINE}`,
				borderRadius: 20,
				display: 'flex',
				flexDirection: 'column',
				gap: 26,
				opacity: appear,
				transform: `translateY(${rise}px)`,
			}}
		>
			{/* the glyph does identification work — the only role icons get in this system */}
			<div style={{display: 'flex', alignItems: 'center', gap: 20, whiteSpace: 'nowrap'}}>
				<Icon name={s.icon} size={50} color={INK3} />
				<div
					style={{
						fontFamily: SANS,
						fontWeight: 700,
						fontSize: 52,
						letterSpacing: '-0.03em',
						color: INK,
						whiteSpace: 'nowrap',
					}}
				>
					{s.label}
				</div>
			</div>

			<div
				style={{
					fontFamily: SANS,
					fontWeight: 800,
					fontSize: 92,
					letterSpacing: '-0.045em',
					color: ACCENT,
					whiteSpace: 'nowrap',
					...TABULAR,
				}}
			>
				+{money(s.delta * growth)}
			</div>

			{/* one bar, one colour, no segments — the length comparison is the whole argument */}
			<div style={{height: 16, width: '100%'}}>
				<div
					style={{
						height: 16,
						width: `${(s.delta / D_MAX) * 100 * growth}%`,
						background: ACCENT,
						borderRadius: 8,
					}}
				/>
			</div>

			<div style={{display: 'flex', alignItems: 'baseline', gap: 14, whiteSpace: 'nowrap'}}>
				<span style={{fontFamily: MONO, fontSize: 30, color: INK3}}>{FROM_YEAR}</span>
				<span style={{fontFamily: SANS, fontWeight: 700, fontSize: 46, color: INK2, ...TABULAR}}>
					{money(s.from)}
				</span>
				<Arrow size={34} color={INK3} />
				<span style={{fontFamily: MONO, fontSize: 30, color: INK3}}>{TO_YEAR}</span>
				<span style={{fontFamily: SANS, fontWeight: 800, fontSize: 46, color: INK2, ...TABULAR}}>
					{money(s.to)}
				</span>
			</div>
		</div>
	);
};

/**
 * No chart here: this has to be understood in about two seconds of scroll time. Two cards,
 * one figure each, and one line of arithmetic — and a headline that reconciles it with the
 * single average the viewer just read.
 */
export const SplitPanel: React.FC<{t: number; opacity: number; reduced: boolean}> = ({t, opacity, reduced}) => {
	if (opacity <= 0.002) return null;
	return (
		<div style={{position: 'absolute', inset: 0, opacity}}>
			<div style={{position: 'absolute', top: 210, left: 0, right: 0, display: 'flex', flexDirection: 'column'}}>
				<div style={{...chip(28, '0.18em', BLUE), textAlign: 'center'}}>THE SAME TEN YEARS</div>
				<h2 style={{...headline(80), margin: '22px 80px 0', textAlign: 'center'}}>
					That $326,000 was an average.
				</h2>
				<p style={{...paragraph(34), margin: '28px 130px 0', textAlign: 'center'}}>
					Here is what ten years of waiting cost in Fairfax County, by what you were buying.
				</p>

				<div style={{marginTop: 78, display: 'flex', flexDirection: 'column', gap: 44}}>
					<Card segment={SEG[0]} enter={T.card1} grow={T.card1Grow} t={t} reduced={reduced} />
					<Card segment={SEG[1]} enter={T.card2} grow={T.card2Grow} t={t} reduced={reduced} />
				</div>

				<p
					style={{
						margin: '88px 110px 0',
						textAlign: 'center',
						fontFamily: MONO,
						fontWeight: 400,
						fontSize: 27,
						lineHeight: 1.6,
						color: INK3,
					}}
				>
					Average Fairfax County sale price, rounded. 2026 scaled from 2025 actuals; 2016 back-cast
					with the county index.
				</p>
			</div>
		</div>
	);
};
