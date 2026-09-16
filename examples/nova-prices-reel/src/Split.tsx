import React from 'react';
import {D_MAX, SEG, Segment, money} from './data';
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
import {T} from './timing';
import {rampIn, seg} from './reel';

/**
 * The arrow is drawn rather than typed: the vendored latin subset does not promise
 * U+2192, and a tofu box in the middle of the money row would be worse than a glyph
 * that matches the mono stroke exactly.
 */
const Arrow: React.FC<{size: number; color: string}> = ({size, color}) => (
	<svg width={size} height={size} viewBox="0 0 24 24" style={{display: 'block'}}>
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
	seg: Segment;
	enter: readonly [number, number];
	grow: readonly [number, number];
	frame: number;
	reduced: boolean;
}> = ({seg: s, enter, grow, frame, reduced}) => {
	const appear = rampIn(frame, enter);
	const rise = reduced ? 0 : seg2(frame, 24, 0, enter);
	const growth = seg(frame, 0, 1, grow[0], grow[1], DRAW);

	return (
		<div
			style={{
				margin: '0 90px',
				padding: '52px 52px 46px',
				background: CARD,
				border: `1px solid ${LINE}`,
				borderRadius: 20,
				display: 'flex',
				flexDirection: 'column',
				gap: 34,
				opacity: appear,
				transform: `translateY(${rise}px)`,
			}}
		>
			<div
				style={{
					display: 'flex',
					flexDirection: 'row',
					justifyContent: 'space-between',
					alignItems: 'baseline',
					whiteSpace: 'nowrap',
					gap: 24,
				}}
			>
				<div
					style={{
						fontFamily: SANS,
						fontWeight: 700,
						fontSize: 58,
						letterSpacing: '-0.03em',
						color: INK,
						whiteSpace: 'nowrap',
					}}
				>
					{s.label}
				</div>
				<div
					style={{
						fontFamily: SANS,
						fontWeight: 800,
						fontSize: 84,
						letterSpacing: '-0.04em',
						color: ACCENT,
						whiteSpace: 'nowrap',
						...TABULAR,
					}}
				>
					+{money(s.delta * growth)}
				</div>
			</div>

			{/* One bar, one colour, no segments — the length comparison is the argument. */}
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

			<div
				style={{
					display: 'flex',
					flexDirection: 'row',
					alignItems: 'center',
					gap: 16,
					fontFamily: MONO,
					fontWeight: 400,
					fontSize: 38,
					color: INK2,
					whiteSpace: 'nowrap',
				}}
			>
				<span>{money(s.y15)}</span>
				<Arrow size={38} color={INK2} />
				<span>{money(s.y25)}</span>
			</div>
		</div>
	);
};

/** seg() with the window given as a tuple. Card arrivals use the enter curve. */
const seg2 = (frame: number, from: number, to: number, w: readonly [number, number]) =>
	seg(frame, from, to, w[0], w[1], ENTER);

export const SplitPanel: React.FC<{
	frame: number;
	opacity: number;
	reduced: boolean;
}> = ({frame, opacity, reduced}) => {
	if (opacity <= 0) return null;

	return (
		<div
			style={{
				position: 'absolute',
				inset: 0,
				opacity,
			}}
		>
			<div
				style={{
					position: 'absolute',
					top: 210,
					left: 0,
					right: 0,
					display: 'flex',
					flexDirection: 'column',
				}}
			>
				<div style={{...chip(28, '0.18em', BLUE), textAlign: 'center'}}>
					THE SAME TEN YEARS
				</div>
				<h2 style={{...headline(88), margin: '26px 80px 0', textAlign: 'center'}}>
					That $261,000 was an average.
				</h2>
				<p style={{...paragraph(38), margin: '30px 130px 0', textAlign: 'center'}}>
					Here is what the wait actually cost, by what you were buying.
				</p>

				<div
					style={{
						marginTop: 92,
						display: 'flex',
						flexDirection: 'column',
						gap: 52,
					}}
				>
					<Card
						seg={SEG[0]}
						enter={T.card1}
						grow={T.card1Grow}
						frame={frame}
						reduced={reduced}
					/>
					<Card
						seg={SEG[1]}
						enter={T.card2}
						grow={T.card2Grow}
						frame={frame}
						reduced={reduced}
					/>
				</div>

				<p
					style={{
						margin: '100px 110px 0',
						textAlign: 'center',
						fontFamily: MONO,
						fontWeight: 400,
						fontSize: 27,
						lineHeight: 1.6,
						color: INK3,
					}}
				>
					Average Fairfax County sale price, rounded. 2025 actual; 2015 back-cast with
					the county index.
				</p>
			</div>
		</div>
	);
};
