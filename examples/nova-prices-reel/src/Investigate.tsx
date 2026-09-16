import React from 'react';
import {Img, staticFile} from 'remotion';
import {Guy, QuestionMark} from './Guy';
import {CARD, DRAW, HAND, HILITE, INK, LINE, MEDIA_RADIUS, SANS} from './theme';
import {T, WALK} from './timing';
import {ReelState, clamp, life, ramp, rampIn, seg} from './reel';

const FLASH_LEN = 0.62;

/**
 * The face appears on the promise beat and nowhere else — this is the frame where someone
 * decides whether to trust the investigation. Head-down, eyes-lowered: it reads as someone
 * about to look something up. The direct-to-camera headshot is held back for the close.
 */
const Portrait: React.FC<{t: number; src: string; reduced: boolean}> = ({t, src, reduced}) => {
	// Three additive terms on one translateY: the entrance, a slow two-second descent, and
	// a small perpetual bob so the plate never looks frozen.
	const y = reduced
		? 0
		: seg(t, -170, 0, T.portraitDrop[0], T.portraitDrop[1]) +
			seg(t, 0, 26, T.portraitDrift[0], T.portraitDrift[1], DRAW) +
			Math.sin(t * 1.15) * 5;
	const s = reduced ? 1 : seg(t, 0.94, 1, T.portraitScale[0], T.portraitScale[1]);
	return (
		<div
			style={{
				width: 380,
				height: 484,
				margin: '0 auto 60px',
				borderRadius: MEDIA_RADIUS,
				overflow: 'hidden',
				border: `1px solid ${LINE}`,
				background: CARD,
				transform: `translateY(${y}px) scale(${s})`,
			}}
		>
			<Img src={staticFile(src)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
		</div>
	);
};

export const Investigate: React.FC<{state: ReelState; portraitSrc: string}> = ({state, portraitSrc}) => {
	const {t, invOpacity, reduced} = state;

	// Writing first, highlighting second — the reverse looks like a bug.
	const write = reduced ? 1 : ramp(t, T.writeOn, DRAW);
	const hi = ramp(t, T.writeHilite, DRAW);

	// One full cycle, so the chip brightens, dims and returns without a hold.
	const flashT = (t - WALK.FLASH) / FLASH_LEN;
	const flash = !reduced && flashT > 0 && flashT < 1 ? Math.sin(flashT * 2 * Math.PI) : 0;
	const lit = flash > 0.02;

	const walkO = life(t, [WALK.IN - 0.3, WALK.IN], [WALK.OUT - 0.5, WALK.OUT]);
	const walkX = reduced ? 0 : seg(t, -620, 0, WALK.IN, WALK.STOP);
	const walking = !reduced && t < WALK.STOP;
	const phase = (t - WALK.IN) * 7.2;
	const settle = ramp(t, [WALK.STOP + 0.35, WALK.STOP + 1.0]);
	// Absolute sine on the bob so both halves of the stride lift him; a raw sine sinks him
	// through the floor on alternate steps.
	const walkBob = walking ? Math.abs(Math.sin(phase)) * -13 : 0;
	const lean = walking
		? Math.sin(phase) * 3
		: Math.sin((t - WALK.STOP - 0.35) * 4.4) * 7 * settle;

	return (
		<>
			{invOpacity <= 0.002 ? null : (
				<div
					style={{
						position: 'absolute',
						top: 470,
						left: 90,
						right: 90,
						textAlign: 'center',
						opacity: invOpacity,
					}}
				>
					<Portrait t={t} src={portraitSrc} reduced={reduced} />

					<h1
						style={{
							fontFamily: SANS,
							fontWeight: 800,
							fontSize: 108,
							letterSpacing: '-0.04em',
							lineHeight: 1.03,
							color: INK,
							margin: 0,
						}}
					>
						Let&rsquo;s find out.
					</h1>

					{/*
					  The handwritten line is nowrap, so it does not respect the parent's 90px
					  gutter. At 76px it measured ~1008px and the highlight's bleed landed 18px
					  from each frame edge — inside the zone where platform UI chrome sits. 58px
					  clears the layout's own safe area. If the copy changes, re-measure.
					*/}
					<div style={{marginTop: 44, display: 'flex', justifyContent: 'center'}}>
						<span
							style={{
								position: 'relative',
								display: 'inline-block',
								transform: lit ? `scale(${1 + flash * 0.05})` : undefined,
							}}
						>
							<span
								style={{
									position: 'absolute',
									left: -18,
									right: -18,
									top: '22%',
									bottom: '10%',
									background: HILITE,
									borderRadius: 6,
									transform: reduced ? undefined : `scaleX(${hi})`,
									transformOrigin: 'left center',
									opacity: reduced ? hi : 1,
									boxShadow: lit ? `0 0 0 ${flash * 9}px rgba(255,201,74,.32)` : undefined,
								}}
							/>
							{/* the write-on: an overflow-hidden wrapper whose WIDTH animates */}
							<span
								style={{
									position: 'relative',
									display: 'block',
									overflow: 'hidden',
									width: `${write * 100}%`,
								}}
							>
								<span
									style={{
										fontFamily: HAND,
										fontWeight: 600,
										fontSize: 58,
										lineHeight: 1.25,
										color: INK,
										whiteSpace: 'nowrap',
										display: 'block',
									}}
								>
									51 years of Fairfax County home prices
								</span>
							</span>
						</span>
					</div>
				</div>
			)}

			{walkO <= 0.002 ? null : (
				<div
					style={{
						position: 'absolute',
						top: 1310,
						left: 0,
						right: 0,
						height: 560,
						pointerEvents: 'none',
						opacity: walkO,
					}}
				>
					{/*
					  Centre with translateX(calc(-50% + …)), never a hardcoded pixel nudge:
					  left: 50% puts the wrapper's LEFT EDGE on the axis, so the correction has
					  to be half the box's own width. The percentage form is size-independent.
					*/}
					<div
						style={{
							position: 'absolute',
							left: '50%',
							bottom: 0,
							display: 'flex',
							flexDirection: 'column',
							alignItems: 'center',
							transform: `translateX(calc(-50% + ${walkX}px)) translateY(${walkBob}px)`,
							transformOrigin: '50% 90%',
						}}
					>
						<QuestionMark t={t} reduced={reduced} />
						<div style={{transform: `rotate(${lean}deg)`, transformOrigin: '50% 90%'}}>
							<Guy t={t} reduced={reduced} />
						</div>
					</div>
				</div>
			)}
		</>
	);
};
