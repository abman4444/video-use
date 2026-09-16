import React from 'react';
import {
	DOWN_PCT,
	PMT_FROM,
	PMT_RISE_PCT,
	PMT_TO,
	PRICE_FROM,
	PRICE_RISE_PCT,
	PRICE_TO,
	RATE_FROM,
	RATE_TO,
	REAL_RISE_PCT,
	money,
	perMonth,
} from './data';
import {
	ACCENT,
	CARD,
	DRAW,
	ENTER,
	INK,
	INK2,
	INK3,
	INK4,
	LINE,
	MONO,
	RATE,
	SANS,
	TABULAR,
	TINT,
	TINT_EDGE,
	chip,
	headline,
} from './theme';
import {T, Win} from './timing';
import {ramp, seg} from './reel';

const pct2 = (n: number) => `${n.toFixed(2)}%`;
const round = (n: number) => Math.round(n);

const Row: React.FC<{
	year: number;
	price: number;
	rate: number;
	payment: number;
	hurts: boolean;
	enter: Win;
	grow: Win;
	t: number;
	reduced: boolean;
}> = ({year, price, rate, payment, hurts, enter, grow, t, reduced}) => {
	const o = ramp(t, enter, ENTER);
	const rise = reduced ? 0 : seg(t, 24, 0, enter[0], enter[1], ENTER);
	const growth = ramp(t, grow, DRAW);
	return (
		<div
			style={{
				padding: '34px 40px',
				borderRadius: 20,
				background: hurts ? TINT : CARD,
				border: `1px solid ${hurts ? TINT_EDGE : LINE}`,
				display: 'flex',
				flexDirection: 'row',
				justifyContent: 'space-between',
				alignItems: 'center',
				gap: 24,
				opacity: o,
				transform: `translateY(${rise}px)`,
			}}
		>
			<div style={{display: 'flex', flexDirection: 'column', gap: 6, textAlign: 'left'}}>
				<div style={{fontFamily: SANS, fontWeight: 800, fontSize: 50, letterSpacing: '-0.03em', color: INK}}>
					{year}
				</div>
				<div style={{fontFamily: MONO, fontSize: 27, color: INK3, whiteSpace: 'nowrap'}}>
					{money(price)} &middot; {pct2(rate)}
				</div>
				<div style={{fontFamily: MONO, fontSize: 25, color: INK4, whiteSpace: 'nowrap'}}>
					{money(price * DOWN_PCT)} down
				</div>
			</div>
			<div
				style={{
					fontFamily: SANS,
					fontWeight: 800,
					fontSize: 86,
					letterSpacing: '-0.04em',
					color: hurts ? ACCENT : INK,
					whiteSpace: 'nowrap',
					...TABULAR,
				}}
			>
				{perMonth(payment * growth)}
			</div>
		</div>
	);
};

/**
 * A payment figure without its down-payment and escrow assumptions is a number a licensed
 * agent should not put on screen — so the assumption is a display element, not a footnote.
 * The heavy ink border is what makes it read as a stated condition rather than a label.
 */
const DownChip: React.FC<{opacity: number}> = ({opacity}) => (
	<div
		style={{
			margin: '38px auto 0',
			display: 'inline-flex',
			alignItems: 'center',
			gap: 20,
			padding: '18px 38px 18px 24px',
			borderRadius: 999,
			background: '#ffffff',
			border: `2px solid ${INK}`,
			boxShadow: '0 1px 2px rgba(11,11,12,.05), 0 8px 24px rgba(11,11,12,.07)',
			opacity,
		}}
	>
		<div style={{fontFamily: SANS, fontWeight: 900, fontSize: 58, color: INK, ...TABULAR}}>20%</div>
		<div style={{textAlign: 'left', fontFamily: MONO, fontSize: 26, letterSpacing: '0.08em', color: INK2}}>
			DOWN
			<br />
			BOTH YEARS
		</div>
	</div>
);

/**
 * The turn. Everything before this measured price; this measures what a buyer actually
 * signs for, and the two numbers disagree.
 */
export const Payment: React.FC<{t: number; opacity: number; reduced: boolean}> = ({t, opacity, reduced}) => {
	if (opacity <= 0.002) return null;
	const chipO = ramp(t, T.payChip, ENTER);
	const infl = ramp(t, T.payInflation, ENTER);

	return (
		<div style={{position: 'absolute', inset: 0, opacity}}>
			<div style={{position: 'absolute', top: 260, left: 0, right: 0, display: 'flex', flexDirection: 'column'}}>
				{/* clay would belong to the price story — this scene belongs to the rate story */}
				<div style={{...chip(28, '0.18em', RATE), textAlign: 'center'}}>WHAT YOU ACTUALLY PAY</div>

				{/* sized to hold exactly two lines: 84px overflowed to three at these figures */}
				<h2 style={{...headline(76), lineHeight: 1.06, margin: '24px 60px 0', textAlign: 'center'}}>
					The price rose {round(PRICE_RISE_PCT)}%.
					<br />
					The payment rose {round(PMT_RISE_PCT)}%.
				</h2>

				<div style={{display: 'flex', justifyContent: 'center'}}>
					<DownChip opacity={chipO} />
				</div>

				<div style={{margin: '48px 90px 0', display: 'flex', flexDirection: 'column', gap: 26}}>
					<Row
						year={2016}
						price={PRICE_FROM}
						rate={RATE_FROM}
						payment={PMT_FROM}
						hurts={false}
						enter={T.payRow1}
						grow={T.payRow1Grow}
						t={t}
						reduced={reduced}
					/>
					<Row
						year={2026}
						price={PRICE_TO}
						rate={RATE_TO}
						payment={PMT_TO}
						hurts
						enter={T.payRow2}
						grow={T.payRow2Grow}
						t={t}
						reduced={reduced}
					/>
				</div>

				<div
					style={{
						margin: '64px 100px 0',
						padding: '34px 40px',
						background: CARD,
						border: `1px solid ${LINE}`,
						borderRadius: 20,
						textAlign: 'center',
						opacity: infl,
					}}
				>
					<div style={{fontFamily: SANS, fontWeight: 700, fontSize: 42, letterSpacing: '-0.03em', color: INK}}>
						Adjusted for inflation, the price only rose {round(REAL_RISE_PCT)}%.
					</div>
					<div style={{marginTop: 16, fontFamily: MONO, fontSize: 28, color: INK3}}>
						The rate did the damage, not the price.
					</div>
				</div>

				<p
					style={{
						margin: '44px 110px 0',
						textAlign: 'center',
						fontFamily: MONO,
						fontSize: 25,
						lineHeight: 1.6,
						color: INK3,
					}}
				>
					30-year principal and interest only. Taxes, insurance and HOA excluded. Freddie Mac annual
					average rate.
				</p>
			</div>
		</div>
	);
};
