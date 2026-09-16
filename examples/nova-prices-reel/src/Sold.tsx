import React from 'react';
import {Img, staticFile} from 'remotion';
import {SHOTS, ShotGroup} from './data';
import {Icon} from './icons';
import {BLUE, ENTER, INK, INK3, LINE, MEDIA_RADIUS, SANS, chip, headline, paragraph} from './theme';
import {T} from './timing';
import {ramp, seg} from './reel';

const Tile: React.FC<{src: string; at: number; t: number; reduced: boolean}> = ({src, at, t, reduced}) => {
	const o = ramp(t, [at, at + 0.5], ENTER);
	const rise = reduced ? 0 : seg(t, 22, 0, at, at + 0.5, ENTER);
	const s = reduced ? 1 : seg(t, 0.94, 1, at, at + 0.5, ENTER);
	return (
		<div
			style={{
				aspectRatio: '4 / 3',
				maxWidth: '100%',
				borderRadius: MEDIA_RADIUS,
				overflow: 'hidden',
				border: `1px solid ${LINE}`,
				opacity: o,
				transform: `translateY(${rise}px) scale(${s})`,
			}}
		>
			<Img src={staticFile(src)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
		</div>
	);
};

/**
 * Grid, not a flex row. Four photos in one row across a 960px measure gives 218px
 * thumbnails — too small to read a house. Two columns gives the single-family shots 472px
 * each; the three townhomes go 3-across because an odd count in two columns leaves a hole.
 * The groups therefore have different column counts by design.
 */
const Group: React.FC<{group: ShotGroup; at: number; t: number; reduced: boolean}> = ({group, at, t, reduced}) => {
	const labelO = ramp(t, [at, at + 0.5], ENTER);
	const labelRise = reduced ? 0 : seg(t, 14, 0, at, at + 0.5, ENTER);
	return (
		<div style={{display: 'flex', flexDirection: 'column', gap: 16}}>
			<div
				style={{
					display: 'flex',
					alignItems: 'center',
					gap: 18,
					opacity: labelO,
					transform: `translateY(${labelRise}px)`,
				}}
			>
				<Icon name={group.icon} size={42} color={INK3} />
				<div style={{fontFamily: SANS, fontWeight: 700, fontSize: 46, letterSpacing: '-0.03em', color: INK}}>
					{group.label}
				</div>
			</div>
			<div
				style={{
					display: 'grid',
					gridTemplateColumns: `repeat(${group.cols}, minmax(0, 1fr))`,
					gap: 16,
				}}
			>
				{group.shots.map((src, i) => (
					<Tile key={src} src={src} at={at + 0.25 + i * T.soldTileStep} t={t} reduced={reduced} />
				))}
			</div>
		</div>
	);
};

/**
 * The one scene that is evidence rather than analysis. The location line is load-bearing:
 * every other figure in the piece is county-wide, so naming Fairfax City INSIDE Fairfax
 * County is what keeps the scene honest. Never shorten it to "Fairfax".
 */
export const Sold: React.FC<{t: number; opacity: number; reduced: boolean}> = ({t, opacity, reduced}) => {
	if (opacity <= 0.002) return null;
	return (
		<div style={{position: 'absolute', inset: 0, opacity}}>
			<div style={{position: 'absolute', top: 250, left: 0, right: 0, display: 'flex', flexDirection: 'column'}}>
				<div style={{...chip(28, '0.18em', BLUE), textAlign: 'center'}}>
					SOLD IN 2026 &middot; $810K &ndash; $813K
				</div>
				<h2 style={{...headline(84), margin: '24px 80px 0', textAlign: 'center'}}>This is what that buys.</h2>
				<p style={{...paragraph(32), margin: '22px 110px 0', textAlign: 'center'}}>
					Seven homes, $810K to $813K.
					<br />
					Fairfax City, inside Fairfax County.
				</p>

				<div style={{margin: '56px 60px 0', display: 'flex', flexDirection: 'column', gap: 44}}>
					<Group group={SHOTS[0]} at={T.soldGroup1} t={t} reduced={reduced} />
					<Group group={SHOTS[1]} at={T.soldGroup2} t={t} reduced={reduced} />
				</div>
			</div>
		</div>
	);
};
