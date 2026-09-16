import React from 'react';
import {Img, staticFile} from 'remotion';
import {ACCENT, HILITE, INK, MONO, SANS, chip} from './theme';

/**
 * Marker highlight — a HILITE block that wipes in BEHIND text from the left. Scene 1
 * only (twice), the Investigate write-on, and NOVA in the close. Adding a fourth
 * devalues all of them.
 */
export const Marker: React.FC<{
	children: React.ReactNode;
	progress: number;
	bleed?: number;
	top?: string;
	bottom?: string;
	radius?: number;
	reduced?: boolean;
}> = ({children, progress, bleed = 16, top = '14%', bottom = '2%', radius = 8, reduced = false}) => (
	<span style={{position: 'relative', display: 'inline-block'}}>
		<span
			style={{
				position: 'absolute',
				left: -bleed,
				right: -bleed,
				top,
				bottom,
				background: HILITE,
				borderRadius: radius,
				transform: reduced ? undefined : `scaleX(${progress})`,
				transformOrigin: 'left center',
				opacity: reduced ? progress : 1,
			}}
		/>
		<span style={{position: 'relative'}}>{children}</span>
	</span>
);

/** Accent swipe — an ACCENT pill UNDER a number, same wipe. Only after the figure lands. */
export const AccentSwipe: React.FC<{
	width: number;
	height: number;
	progress: number;
	reduced: boolean;
	marginTop?: number;
}> = ({width, height, progress, reduced, marginTop = 0}) => (
	<div
		style={{
			marginTop,
			width,
			height,
			borderRadius: height / 2,
			background: ACCENT,
			transform: reduced ? undefined : `scaleX(${progress})`,
			transformOrigin: 'left center',
			opacity: reduced ? progress : 1,
		}}
	/>
);

/** The wordmark. Always with the registered mark — never "AM Real Estate". */
export const Wordmark: React.FC<{size: number; supSize: number; twoLine?: boolean}> = ({
	size,
	supSize,
	twoLine = false,
}) => (
	<div
		style={{
			fontFamily: SANS,
			fontWeight: 900,
			fontSize: size,
			letterSpacing: '-0.03em',
			lineHeight: 1.04,
			color: INK,
			whiteSpace: 'nowrap',
		}}
	>
		Ahmed Makkiyah{twoLine ? <br /> : ' '}Realtor
		<span
			style={{
				fontSize: supSize,
				fontWeight: 700,
				verticalAlign: 'super',
				letterSpacing: 0,
				marginLeft: twoLine ? 5 : 3,
			}}
		>
			®
		</span>
	</div>
);

/** Mounted once, outside all scene logic, above everything, at constant opacity 1. */
export const CornerMark: React.FC<{logoSrc: string}> = ({logoSrc}) => (
	<div
		style={{
			position: 'absolute',
			left: 80,
			top: 84,
			display: 'flex',
			flexDirection: 'row',
			alignItems: 'center',
			gap: 22,
			whiteSpace: 'nowrap',
			pointerEvents: 'none',
			opacity: 1,
		}}
	>
		<Img src={staticFile(logoSrc)} style={{width: 76, height: 'auto'}} />
		<Wordmark size={34} supSize={15} />
	</div>
);

export const Eyebrow: React.FC<{opacity: number; text: string; color: string}> = ({opacity, text, color}) => {
	if (opacity <= 0.002) return null;
	return (
		<div
			style={{
				position: 'absolute',
				top: 196,
				left: 0,
				right: 0,
				textAlign: 'center',
				opacity,
				...chip(26, '0.2em', color),
			}}
		>
			{text}
		</div>
	);
};

export const monoLine = (size: number, tracking: string, color: string) => ({
	...chip(size, tracking, color),
	fontFamily: MONO,
});
