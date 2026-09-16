import React from 'react';
import {Img, staticFile} from 'remotion';
import {
	ACCENT,
	BLUE,
	INK,
	INK2,
	INK3,
	SANS,
	TABULAR,
	chip,
	headline,
	paragraph,
} from './theme';
import {CAPTIONS, T} from './timing';
import {ReelState, seg, windowed} from './reel';
import {DRAW} from './theme';
import {money} from './data';

/**
 * The recurring emphasis device: a clay pill that wipes left to right, and only ever
 * under a figure that has already landed. Three in the whole piece.
 */
export const AccentSwipe: React.FC<{
	width: number;
	height: number;
	progress: number;
	reduced: boolean;
	marginTop: number;
}> = ({width, height, progress, reduced, marginTop}) => (
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
			gap: 18,
			whiteSpace: 'nowrap',
			pointerEvents: 'none',
			opacity: 1,
		}}
	>
		<Img src={staticFile(logoSrc)} style={{width: 62, height: 'auto'}} />
		<div
			style={{
				fontFamily: SANS,
				fontWeight: 900,
				fontSize: 30,
				letterSpacing: '-0.03em',
				color: INK,
			}}
		>
			AM Real Estate
		</div>
	</div>
);

export const Eyebrow: React.FC<{opacity: number; text: string; color?: string}> = ({
	opacity,
	text,
	color = BLUE,
}) => (
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

export const Hook: React.FC<{state: ReelState; reduced: boolean}> = ({state, reduced}) => {
	const swipe = seg(state.frame, 0, 1, T.hookSwipe[0], T.hookSwipe[1], DRAW);

	return (
		<div
			style={{
				position: 'absolute',
				top: 640,
				left: 80,
				right: 80,
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				textAlign: 'center',
				opacity: state.hookOpacity,
				transform: `translateY(${state.hookLift}px)`,
			}}
		>
			{/*
			  The brief sets this at 104px. In Geist 800 the second line measures ~925px,
			  which spills past the 80px gutters and lets the browser re-wrap it into three
			  lines — the hard break is the point, so the type gives up 4px instead of it.
			*/}
			<h1 style={{...headline(100), whiteSpace: 'nowrap'}}>
				Waiting ten years
				<br />
				cost you $261,000.
			</h1>
			<AccentSwipe
				width={560}
				height={16}
				marginTop={26}
				progress={swipe}
				reduced={reduced}
			/>
			<p style={{...paragraph(36), marginTop: 44}}>
				Median home price, 2015 to 2025.
				<br />
				Here is the whole record.
			</p>
		</div>
	);
};

/** Year + price, live off the tip. The caption check reads these two lines. */
export const Readout: React.FC<{state: ReelState}> = ({state}) => (
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
				color: INK,
				...TABULAR,
			}}
		>
			{money(state.dollars)}
		</div>
	</div>
);

export const Captions: React.FC<{frame: number}> = ({frame}) => (
	<>
		{CAPTIONS.map((c) => {
			const opacity = windowed(frame, c.window);
			if (opacity <= 0) return null;
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

/** The cost of waiting. Clay, counting, and the second of the three accent swipes. */
export const DeltaHeadline: React.FC<{state: ReelState; reduced: boolean}> = ({
	state,
	reduced,
}) => {
	const swipe = seg(state.frame, 0, 1, T.deltaSwipe[0], T.deltaSwipe[1], DRAW);

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
				opacity: state.deltaOpacity,
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
			<AccentSwipe
				width={520}
				height={18}
				marginTop={24}
				progress={swipe}
				reduced={reduced}
			/>
		</div>
	);
};
