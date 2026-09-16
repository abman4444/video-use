import React from 'react';
import {HOUSES} from './data';
import {Icon} from './icons';
import {BLUE, DRAW, INK, INK2, INK4, SANS} from './theme';
import {T} from './timing';
import {ReelState, clamp, ramp, rampIn} from './reel';
import {Marker} from './ui';

/**
 * A texture, not a subject: nothing in it is ever legible as a specific house, and it
 * never crosses the type. Positions are seeded literals — a random scatter re-rolls on
 * every render, so scrubbing produces a different image.
 */
const HouseField: React.FC<{t: number; opacity: number; reduced: boolean}> = ({t, opacity, reduced}) => {
	if (opacity <= 0.002) return null;
	return (
		<div style={{position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', opacity: opacity * 0.9}}>
			{HOUSES.map(([x, y, size], i) => (
				<div
					key={`${x}-${y}`}
					style={{
						position: 'absolute',
						left: x,
						top: y,
						opacity: 0.16 + 0.05 * Math.sin(i * 1.7),
						transform: reduced ? undefined : `translateY(${Math.sin(t * 0.34 + i * 0.9) * 14 - t * 3}px)`,
					}}
				>
					<Icon name="house" size={size} color={INK4} />
				</div>
			))}
		</div>
	);
};

// ---------------------------------------------------------------- the house that builds itself
//
// Parts reveal in construction order from one shared build progress. Overlapping the
// ranges — roof still finishing as the walls start — is what makes it feel built rather
// than assembled part by part.

const part = (b: number, from: number, to: number) => clamp((b - from) / (to - from), 0, 1);

const Stroke: React.FC<{d: string; len: number; p: number}> = ({d, len, p}) => (
	<path
		d={d}
		pathLength={len}
		strokeDasharray={len}
		strokeDashoffset={len * (1 - p)}
		fill="none"
	/>
);

const BuildingHouse: React.FC<{t: number; opacity: number; reduced: boolean}> = ({t, opacity, reduced}) => {
	if (opacity <= 0.002) return null;
	const b = reduced ? 1 : ramp(t, T.houseBuild, DRAW);
	const roof = part(b, 0, 0.3);
	const walls = part(b, 0.26, 0.58);
	const chimney = part(b, 0.52, 0.7);
	const door = part(b, 0.66, 0.86);
	const windows = part(b, 0.82, 1);
	const breathe = reduced ? 1 : 1 + Math.sin(t * 1.5) * 0.018 * b;

	return (
		<svg
			width={188}
			height={188 * (100 / 120)}
			viewBox="0 0 120 100"
			style={{marginTop: 62, opacity, transform: `scale(${breathe})`, overflow: 'visible'}}
			stroke={INK}
			strokeWidth={6}
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<Stroke d="M 88 32 L 88 13 L 97 13 L 97 38" len={50} p={chimney} />
			<Stroke d="M 6 50 L 60 12 L 114 50" len={132} p={roof} />
			<Stroke d="M 18 50 L 18 94 L 102 94 L 102 50" len={172} p={walls} />

			{/* the door's fill slides up from the threshold */}
			<clipPath id="doorfill">
				<rect x={48} y={94 - 28 * door} width={24} height={28 * door} />
			</clipPath>
			<rect x={48} y={66} width={24} height={28} fill={BLUE} stroke="none" clipPath="url(#doorfill)" />
			<Stroke d="M 48 94 L 48 66 L 72 66 L 72 94" len={80} p={door} />

			{/* two 15-unit squares are too small for a dash reveal to read: they simply appear */}
			<g opacity={windows}>
				<rect x={27} y={60} width={15} height={15} fill="none" />
				<rect x={78} y={60} width={15} height={15} fill="none" />
			</g>
		</svg>
	);
};

// ---------------------------------------------------------------- the scene
//
// The question lands before the claim on purpose — the viewer commits to the question
// first, then gets the number to doubt.

export const Question: React.FC<{state: ReelState}> = ({state}) => {
	const {t, askOpacity, askLift, reduced} = state;
	const trueHi = ramp(t, T.trueHilite, DRAW);
	const claimHi = ramp(t, T.claimHilite, DRAW);
	const claim = rampIn(t, T.claimIn);
	const houseO = rampIn(t, T.houseIn);

	return (
		<>
			<HouseField t={t} opacity={askOpacity} reduced={reduced} />
			{askOpacity <= 0.002 ? null : (
				<div
					style={{
						position: 'absolute',
						top: 430,
						left: 80,
						right: 80,
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'center',
						textAlign: 'center',
						opacity: askOpacity,
						transform: `translateY(${askLift}px)`,
					}}
				>
					<h1
						style={{
							fontFamily: SANS,
							fontWeight: 800,
							fontSize: 132,
							letterSpacing: '-0.045em',
							lineHeight: 1.0,
							textWrap: 'balance',
							color: INK,
							margin: 0,
						}}
					>
						Is it still{' '}
						<Marker progress={trueHi} bleed={18} reduced={reduced}>
							true?
						</Marker>
					</h1>

					<BuildingHouse t={t} opacity={houseO} reduced={reduced} />

					<p
						style={{
							marginTop: 56,
							fontFamily: SANS,
							fontWeight: 600,
							fontSize: 52,
							letterSpacing: '-0.02em',
							lineHeight: 1.35,
							textWrap: 'balance',
							color: INK2,
							opacity: claim,
							margin: '56px 0 0',
						}}
					>
						Waiting 10 years to buy a house in Fairfax will cost you{' '}
						<Marker progress={claimHi} bleed={14} reduced={reduced}>
							$326,000
						</Marker>
						?
					</p>
				</div>
			)}
		</>
	);
};
