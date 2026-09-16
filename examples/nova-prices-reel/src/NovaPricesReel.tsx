import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Chart} from './Chart';
import {Close} from './Close';
import {
	Captions,
	CornerMark,
	DeltaHeadline,
	Eyebrow,
	Hook,
	Readout,
} from './Overlays';
import {SplitPanel} from './Split';
import {PAPER} from './theme';
import {HEIGHT, WIDTH} from './timing';
import {cameraTransform, reelState} from './reel';

export type NovaPricesReelProps = {
	/** Path inside public/. Drop the real artwork in and point this at it. */
	logoSrc: string;
	/**
	 * `prefers-reduced-motion`: opacity only, no camera moves. Leave undefined to read
	 * the viewer's own setting; set it explicitly to make a render deterministic.
	 */
	reducedMotion?: boolean;
};

const prefersReducedMotion = () =>
	typeof window !== 'undefined' &&
	typeof window.matchMedia === 'function' &&
	window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const NovaPricesReel: React.FC<NovaPricesReelProps> = ({
	logoSrc,
	reducedMotion,
}) => {
	const frame = useCurrentFrame();
	const reduced = reducedMotion ?? prefersReducedMotion();
	const state = reelState(frame, reduced);

	return (
		<AbsoluteFill style={{backgroundColor: PAPER, width: WIDTH, height: HEIGHT}}>
			{/*
			  One continuous element tree. The chart is mounted from Climb through Split
			  and moved by a single camera transform; text blocks cross-fade over it. It is
			  never remounted, so it never re-enters.
			*/}
			{state.chartOpacity > 0 ? (
				<AbsoluteFill style={{opacity: state.chartOpacity}}>
					<div
						style={{
							position: 'absolute',
							left: 0,
							top: 0,
							transformOrigin: '0 0',
							transform: cameraTransform(state.camera),
						}}
					>
						<Chart state={state} />
					</div>
				</AbsoluteFill>
			) : null}

			<Eyebrow opacity={state.eyebrowOpacity} text="FAIRFAX COUNTY, VIRGINIA" />

			{state.hookOpacity > 0 ? <Hook state={state} reduced={reduced} /> : null}
			{state.readoutOpacity > 0 ? <Readout state={state} /> : null}
			<Captions frame={frame} />
			{state.deltaOpacity > 0 ? (
				<DeltaHeadline state={state} reduced={reduced} />
			) : null}

			<SplitPanel frame={frame} opacity={state.panelOpacity} reduced={reduced} />
			<Close
				frame={frame}
				opacity={state.closeOpacity}
				reduced={reduced}
				logoSrc={logoSrc}
			/>

			<CornerMark logoSrc={logoSrc} />
		</AbsoluteFill>
	);
};
