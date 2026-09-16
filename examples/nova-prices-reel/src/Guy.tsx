import React from 'react';
import {ACCENT, BLUE, INK, POP} from './theme';
import {WALK} from './timing';
import {clamp, lerp, ramp, seg} from './reel';

const SKIN = '#ffffff';
const STROKE = 6;
const FEATURE = 5.5;

const HEAD = {x: 75, y: 58, r: 45} as const;

/**
 * A line-art figure drawn from primitives in the system palette — every shape is a circle
 * or a path, so it sits in the same geometric family as the icon set without pretending
 * to be draughtsmanship.
 *
 * Cartoon proportions, deliberately: the head is r=45 in a 250-unit body, roughly twice
 * life proportion. At natural proportion the head came out 82px, which on a 6.1in phone
 * is a 5.8mm head with a 1.2 x 0.6mm mouth — the features were physically sub-perceptual.
 */
export const Guy: React.FC<{t: number; reduced: boolean}> = ({t, reduced}) => {
	const walking = !reduced && t < WALK.STOP;
	const phase = (t - WALK.IN) * 7.2;

	// The gaze is two opposed ramps, not one: he must look up AND come back. Without the
	// second term he stares at the ceiling for the rest of the scene.
	const lookUp = reduced
		? 0
		: clamp(
				ramp(t, [WALK.LOOK, WALK.LOOK + 0.4]) - ramp(t, [WALK.CAM, WALK.CAM + 0.38]),
				0,
				1,
			);
	const puz = reduced ? 0 : ramp(t, [WALK.LOOK, WALK.LOOK + 0.45]);
	const scr = reduced ? 0 : ramp(t, [WALK.SCR, WALK.SCR + 0.5]);
	const wob = scr > 0.85 ? Math.sin(t * 22) * 4 : 0;

	// Blinks are discrete, never a sine — a continuous oscillation reads as a twitch.
	// max() rather than += so overlapping windows can never stack past 1.
	let bl = 0;
	for (let i = 0; i < WALK.BLINKS; i++) {
		const q = (t - (WALK.BLINK + i * 0.32)) / 0.19;
		if (q > 0 && q < 1) bl = Math.max(bl, Math.sin(q * Math.PI));
	}
	if (reduced) bl = 0;

	const eyeY = 60 - 3 * lookUp;
	const legSwing = walking ? Math.sin(phase) * 9 : 0;
	const armSwing = walking ? Math.sin(phase + Math.PI) * 22 : 0;

	// The scratching arm must BEND. A rigid limb rotated at the shoulder sweeps a fixed
	// radius: the limb is ~57 units, the temple ~67 from the shoulder, so no rotation
	// angle reaches the head — increasing it just reads as waving.
	const ex = lerp(106, 134, scr);
	const ey = lerp(152, 112, scr);
	const hx = lerp(102, 108 + wob, scr);
	const hy = lerp(178, 33 + wob, scr);

	return (
		<svg
			width={264}
			height={440}
			viewBox="0 0 150 250"
			stroke={INK}
			strokeWidth={STROKE}
			strokeLinecap="round"
			strokeLinejoin="round"
			fill="none"
			style={{display: 'block', overflow: 'visible'}}
		>
			{/* legs */}
			<path d={`M66 178 L${64 - legSwing} 240`} />
			<path d={`M84 178 L${86 + legSwing} 240`} />
			<path d={`M${64 - legSwing} 240 L${54 - legSwing} 242`} />
			<path d={`M${86 + legSwing} 240 L${96 + legSwing} 242`} />

			{/* torso — the BLUE shirt */}
			<path d="M56 122 L56 178 L94 178 L94 122 Z" fill={BLUE} />

			{/* the free arm keeps swinging from a rotation group: a hanging limb has no reach problem */}
			<g transform={`rotate(${armSwing} 56 122)`}>
				<path d="M56 122 L44 152 L40 178" />
			</g>

			{/* the scratching arm — joints interpolated between hanging and folded */}
			<path d={`M94 122 L${ex} ${ey} L${hx} ${hy}`} />

			{/* neck + head */}
			<path d="M75 100 L75 122" />
			<circle cx={HEAD.x} cy={HEAD.y} r={HEAD.r} fill={SKIN} />

			{/* ears */}
			<circle cx={30} cy={58} r={9} fill={SKIN} />
			<circle cx={120} cy={58} r={9} fill={SKIN} />

			{/* hair, a filled ink path over the crown */}
			<path
				d="M32 46 C 40 8, 110 8, 118 46 C 104 30, 92 26, 75 26 C 58 26, 46 30, 32 46 Z"
				fill={INK}
				stroke="none"
			/>

			{/* eyes — a rect alone can never fully close a round eye, so the arcs swap in */}
			{bl > 0.92 ? (
				<g strokeWidth={FEATURE}>
					<path d={`M56 ${eyeY} q6 6 12 0`} />
					<path d={`M82 ${eyeY} q6 6 12 0`} />
				</g>
			) : (
				<>
					<circle cx={62} cy={eyeY} r={6} fill={INK} stroke="none" />
					<circle cx={88} cy={eyeY} r={6} fill={INK} stroke="none" />
					{bl > 0 ? (
						<>
							<rect x={55} y={eyeY - 7} width={14} height={12 * bl} fill={SKIN} stroke="none" />
							<rect x={81} y={eyeY - 7} width={14} height={12 * bl} fill={SKIN} stroke="none" />
						</>
					) : null}
				</>
			)}

			{/* brows — the asymmetry is the whole expression */}
			<g strokeWidth={FEATURE}>
				<path d={`M54 ${44 - 5 * puz} q8 -4 16 0`} />
				<path d={`M80 ${44 - 10 * puz} q8 -4 16 0`} />
			</g>

			{/* mouth — a skew, not a frown */}
			<path d={`M62 82 Q75 ${82 + 5 * puz} 90 ${82 + 3 * puz}`} strokeWidth={FEATURE} />
		</svg>
	);
};

/** The mark appears only after he has stopped and read the statement. */
export const QuestionMark: React.FC<{t: number; reduced: boolean}> = ({t, reduced}) => {
	const o = ramp(t, [WALK.QM, WALK.QM + 0.25]);
	if (o <= 0.002) return null;
	const s = reduced ? 1 : seg(t, 0.3, 1, WALK.QM, WALK.QM + 0.55, POP);
	// Two incommensurate frequencies is what keeps it from looking mechanical.
	const bob = reduced ? 0 : Math.sin(t * 2.6) * 9;
	const tilt = reduced ? 0 : Math.sin(t * 1.9) * 7;
	return (
		<div
			style={{
				fontFamily: 'Geist',
				fontWeight: 800,
				fontSize: 68,
				color: ACCENT,
				opacity: o,
				transform: `translateY(${bob}px) rotate(${tilt}deg) scale(${s})`,
			}}
		>
			?
		</div>
	);
};
