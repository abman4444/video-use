import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {Chart} from './Chart';
import {Close} from './Close';
import {Investigate} from './Investigate';
import {Captions, DeltaHeadline, MoneyMotif, RatesTitle, Readout} from './Overlays';
import {Payment} from './Payment';
import {Question} from './Question';
import {Sold} from './Sold';
import {SplitPanel} from './Split';
import {BLUE, PAPER} from './theme';
import {HEIGHT, WIDTH} from './timing';
import {cameraTransform, reelState} from './reel';
import {CornerMark, Eyebrow} from './ui';

export type NovaPricesReelProps = {
	/** Paths inside public/. Drop real artwork in and point these at it. */
	logoSrc: string;
	portraitFindOut: string;
	portraitColor: string;
	brokerageSrc: string;
	equalHousingSrc: string;
	/**
	 * `prefers-reduced-motion`: opacity only, no camera moves, no wipes. Leave undefined to
	 * read the viewer's own setting; set it explicitly to make a render deterministic.
	 */
	reducedMotion?: boolean;
};

const prefersReducedMotion = () =>
	typeof window !== 'undefined' &&
	typeof window.matchMedia === 'function' &&
	window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const NovaPricesReel: React.FC<NovaPricesReelProps> = ({
	logoSrc,
	portraitFindOut,
	portraitColor,
	brokerageSrc,
	equalHousingSrc,
	reducedMotion,
}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const reduced = reducedMotion ?? prefersReducedMotion();
	const state = reelState(frame, fps, reduced);

	return (
		<AbsoluteFill style={{backgroundColor: PAPER, width: WIDTH, height: HEIGHT}}>
			{/*
			  The money motif paints UNDER the chart: several of its x positions fall straight
			  through the 2016 / $487K annotations, and clay glyphs over mono digits garble
			  them. Lowering opacity does not fix it — the chart and its labels always win.
			*/}
			<MoneyMotif t={state.t} opacity={state.chartOpacity} />

			{/*
			  One continuous element tree. The chart mounts once and is moved by a single
			  camera transform; text blocks cross-fade over it. It is never remounted, so it
			  never re-enters.
			*/}
			{state.chartOpacity > 0.002 ? (
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

			<Eyebrow opacity={state.eyebrowOpacity} text="FAIRFAX COUNTY HOME PRICES" color={BLUE} />

			<Question state={state} />
			<Investigate state={state} portraitSrc={portraitFindOut} />
			<Readout state={state} />
			<Captions t={state.t} />
			<RatesTitle state={state} />
			<DeltaHeadline state={state} />
			<SplitPanel t={state.t} opacity={state.panelOpacity} reduced={reduced} />
			<Sold t={state.t} opacity={state.soldOpacity} reduced={reduced} />
			<Payment t={state.t} opacity={state.payOpacity} reduced={reduced} />
			<Close
				t={state.t}
				opacity={state.closeOpacity}
				reduced={reduced}
				logoSrc={logoSrc}
				portraitSrc={portraitColor}
				brokerageSrc={brokerageSrc}
				equalHousingSrc={equalHousingSrc}
			/>

			<CornerMark logoSrc={logoSrc} />
		</AbsoluteFill>
	);
};
