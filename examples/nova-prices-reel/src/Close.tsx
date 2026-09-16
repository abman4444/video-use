import React from 'react';
import {Img, staticFile} from 'remotion';
import {Icon} from './icons';
import {
	ACCENT,
	BLUE,
	CARD,
	DRAW,
	ENTER,
	HILITE,
	INK,
	INK2,
	INK3,
	LINE,
	MEDIA_RADIUS,
	MONO,
	POP,
	SANS,
	chip,
	headline,
	paragraph,
} from './theme';
import {T} from './timing';
import {clamp, ramp, seg} from './reel';
import {Marker, Wordmark} from './ui';

const PHONES = ['734.383.6945', '703.957.0060'];

/**
 * Both pills are blue. A red one was tried and removed: ACCENT red means the cost of
 * waiting everywhere else in this piece, so a red call button reads as a warning.
 */
const PhonePill: React.FC<{number: string; k: number; t: number; opacity: number; reduced: boolean}> = ({
	number,
	k,
	t,
	opacity,
	reduced,
}) => {
	const at = T.phonesIn[0] + k * 0.22;
	const o = ramp(t, [at, at + 0.6], ENTER) * opacity;
	const rise = reduced ? 0 : seg(t, 14, 0, at, at + 0.6, ENTER);
	const drift = reduced ? 0 : Math.sin(t * 1.25 + k * 1.9) * 7;
	return (
		<div
			style={{
				display: 'inline-flex',
				alignItems: 'center',
				gap: 18,
				padding: '15px 36px 15px 21px',
				borderRadius: 999,
				background: 'rgba(255,255,255,.72)',
				border: `1px solid ${LINE}`,
				boxShadow: '0 1px 2px rgba(11,11,12,.05), 0 8px 24px rgba(11,11,12,.08)',
				opacity: o,
				transform: `translateY(${rise + drift}px)`,
			}}
		>
			<div
				style={{
					width: 54,
					height: 54,
					borderRadius: '50%',
					background: `linear-gradient(180deg, #3d80ff, ${BLUE})`,
					boxShadow: 'inset 0 1px 0 rgba(255,255,255,.45), 0 2px 8px rgba(10,92,255,.35)',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					flex: '0 0 auto',
				}}
			>
				<Icon name="phone" size={26} color="#ffffff" />
			</div>
			<div style={{fontFamily: MONO, fontWeight: 500, fontSize: 46, letterSpacing: '-0.02em', color: INK}}>
				{number}
			</div>
		</div>
	);
};

// ---------------------------------------------------------------- the pen-drawn underline
//
// The path is sampled, not a Bézier, because the nib has to be positioned along it: yAt
// gives the exact nib height at any progress, where a cubic would need getPointAtLength,
// which is unavailable during SVG-export rendering.

const SAMPLES = 48;
const yAt = (u: number) => 10 - 3.2 * Math.sin(Math.PI * u) - 1.0 * Math.sin(2 * Math.PI * u);

const PEN_PATH = (() => {
	let d = `M 2 ${yAt(0).toFixed(2)}`;
	for (let i = 1; i <= SAMPLES; i++) {
		const u = i / SAMPLES;
		d += ` L ${(2 + 416 * u).toFixed(2)} ${yAt(u).toFixed(2)}`;
	}
	return d;
})();

const PenUnderline: React.FC<{t: number; reduced: boolean}> = ({t, reduced}) => {
	const p = reduced ? 1 : ramp(t, T.penDraw, DRAW);
	if (p <= 0) return null;
	const nibX = 2 + 416 * p;
	const nibY = yAt(p);
	// It appears the instant the stroke starts and lifts away in the last tenth, so it is
	// never parked on a finished line.
	const penO = reduced ? 0 : clamp(p / 0.06, 0, 1) * (1 - clamp((p - 0.9) / 0.1, 0, 1));
	return (
		<svg width={420} height={76} viewBox="0 0 420 76" style={{margin: '-4px 0 -54px', overflow: 'visible'}}>
			<path
				d={PEN_PATH}
				fill="none"
				stroke={ACCENT}
				strokeWidth={4}
				strokeLinecap="round"
				strokeDasharray={424}
				strokeDashoffset={424 * (1 - p)}
			/>
			{penO > 0.002 ? (
				<g transform={`translate(${nibX} ${nibY}) rotate(32) scale(1.5)`} opacity={penO}>
					<polygon points="0,0 -5.5,-14 5.5,-14" fill="#2b2b31" />
					<line x1={0} y1={-1.5} x2={0} y2={-10} stroke="#ffffff" strokeWidth={1.2} opacity={0.7} />
					<circle cx={0} cy={-11.5} r={1.5} fill="#ffffff" opacity={0.7} />
					<rect x={-6.5} y={-18} width={13} height={4.5} rx={1.2} fill="#8d8d96" />
					<rect x={-6} y={-48} width={12} height={30} rx={2} fill={INK} />
					<rect x={-4.5} y={-46} width={3.4} height={26} fill="#ffffff" opacity={0.14} />
					<rect x={-6.4} y={-51} width={12.8} height={3.4} fill="#8d8d96" />
					<rect x={-6.4} y={-66} width={12.8} height={19} rx={3} fill={ACCENT} />
					<rect x={3.4} y={-64} width={2.6} height={12} rx={1.3} fill="#8d8d96" />
				</g>
			) : null}
		</svg>
	);
};

/**
 * The close carries no exit animation at all. It holds at full opacity through the last
 * frame and the loop hard-cuts back to the question — any tail fade leaves blank white
 * frames, which flash on every loop.
 *
 * The scene runs 10.2s and about five of those are a hold. That hold is the deliverable: a
 * viewer who has just decided to call needs the number on screen long enough to pick up a
 * phone.
 */
export const Close: React.FC<{
	t: number;
	opacity: number;
	reduced: boolean;
	logoSrc: string;
	portraitSrc: string;
	brokerageSrc: string;
	equalHousingSrc: string;
}> = ({t, opacity, reduced, logoSrc, portraitSrc, brokerageSrc, equalHousingSrc}) => {
	if (opacity <= 0.002) return null;

	const lockO = ramp(t, T.lockup, ENTER);
	const lockS = reduced ? 1 : seg(t, 0.86, 1, T.lockup[0], T.lockup[1], POP);
	const rule = ramp(t, T.lockupRule, DRAW);
	const tagO = ramp(t, T.taglineIn, ENTER);
	const nova = ramp(t, T.novaHilite, DRAW);
	const rowO = ramp(t, T.portraitRow, ENTER);
	const brokO = ramp(t, T.brokerageIn, ENTER);
	const srcO = ramp(t, T.sourceIn, ENTER);

	return (
		<div style={{position: 'absolute', inset: 0, opacity}}>
			<div
				style={{
					position: 'absolute',
					top: 470,
					left: 90,
					right: 90,
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					textAlign: 'center',
				}}
			>
				<div style={chip(30, '0.16em', INK3)}>TEN YEARS FROM NOW IS 2036</div>
				{/*
				  The close ends on a question, mirroring the open — that is what drives comments.
				  The brief sets this at 96px; in Geist 800 that wraps to three lines in the 900px
				  measure and pushes the lockup through the portrait row pinned at 1296. 88px is
				  the largest size that holds it to two.
				*/}
				<h1 style={{...headline(88), lineHeight: 1.03, marginTop: 26}}>
					Would you buy in Fairfax today, or wait?
				</h1>
				<p style={{...paragraph(36), marginTop: 32}}>Tell me why in the comments.</p>

				<div
					style={{
						marginTop: 44,
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'center',
						gap: 16,
					}}
				>
					{PHONES.map((num, k) => (
						<PhonePill key={num} number={num} k={k} t={t} opacity={1} reduced={reduced} />
					))}
				</div>

				<div
					style={{
						marginTop: 46,
						display: 'flex',
						flexDirection: 'row',
						alignItems: 'center',
						gap: 41,
						whiteSpace: 'nowrap',
						opacity: lockO,
						transform: `scale(${lockS})`,
					}}
				>
					<Img src={staticFile(logoSrc)} style={{width: 144, height: 'auto', flex: '0 0 auto'}} />
					<div style={{display: 'flex', flexDirection: 'column', gap: 14, textAlign: 'left'}}>
						<Wordmark size={68} supSize={28} twoLine />
						{/* sized by the column, so it always ends flush with the name above it */}
						<div
							style={{
								alignSelf: 'stretch',
								height: 2,
								background: INK,
								transform: reduced ? undefined : `scaleX(${rule})`,
								transformOrigin: 'left center',
								opacity: reduced ? rule : 1,
							}}
						/>
						<div
							style={{
								fontFamily: MONO,
								fontWeight: 500,
								fontSize: 30,
								letterSpacing: '0.04em',
								color: INK2,
								opacity: tagO,
							}}
						>
							YOUR TRUSTED REALTOR IN{' '}
							<Marker progress={nova} bleed={10} top="10%" bottom="6%" radius={5} reduced={reduced}>
								NOVA
							</Marker>
						</div>
						<PenUnderline t={t} reduced={reduced} />
					</div>
				</div>
			</div>

			{/*
			  Five blocks share the bottom half of the last frame, so these are pinned at
			  measured positions rather than left to reflow. Any copy change here must be
			  re-measured: there is no reflow safety net at the bottom of a fixed composition.
			*/}
			<div
				style={{
					position: 'absolute',
					top: 1296,
					left: 0,
					right: 0,
					display: 'flex',
					justifyContent: 'center',
					alignItems: 'center',
					gap: 32,
					opacity: rowO,
				}}
			>
				<div
					style={{
						width: 152,
						height: 194,
						borderRadius: MEDIA_RADIUS,
						overflow: 'hidden',
						border: `1px solid ${LINE}`,
						background: CARD,
						flex: '0 0 auto',
					}}
				>
					<Img src={staticFile(portraitSrc)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
				</div>
				<div
					style={{
						fontFamily: MONO,
						fontSize: 34,
						letterSpacing: '0.22em',
						color: INK2,
						whiteSpace: 'nowrap',
					}}
				>
					BUY.SELL.INVEST
				</div>
			</div>

			<div
				style={{
					position: 'absolute',
					top: 1530,
					left: 0,
					right: 0,
					height: 88,
					display: 'flex',
					justifyContent: 'center',
					alignItems: 'center',
					gap: 44,
					opacity: brokO,
				}}
			>
				<Img src={staticFile(brokerageSrc)} style={{height: 52, width: 'auto'}} />
				<Img src={staticFile(equalHousingSrc)} style={{height: 76, width: 'auto'}} />
			</div>

			<div
				style={{
					position: 'absolute',
					top: 1660,
					left: 80,
					right: 80,
					textAlign: 'center',
					fontFamily: MONO,
					fontSize: 23,
					lineHeight: 1.5,
					color: INK3,
					opacity: srcO,
				}}
			>
				Sources: FHFA all-transactions house price index, Fairfax County VA, 1975&ndash;2025 (FRED);
				2026 median $813,000 (Redfin, Fairfax County, May 2026); 30-year fixed rates from Freddie Mac
				PMMS, 2026 value is the year-to-date average; segment averages from MarketStats by ShowingTime
				/ Bright MLS. County dollars are the index scaled to a $740,000 median in 2025. Estimates, not
				appraisals.
			</div>
		</div>
	);
};
