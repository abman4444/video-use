import React from 'react';
import {Img, staticFile} from 'remotion';
import {
	BLUE,
	DRAW,
	INK,
	INK2,
	INK3,
	MONO,
	POP,
	SANS,
	headline,
	paragraph,
} from './theme';
import {T} from './timing';
import {rampIn, seg} from './reel';
import {AccentSwipe} from './Overlays';

/**
 * The close carries no exit animation at all. It holds at full opacity through the
 * last frame and the loop hard-cuts back to the hook — any tail fade would leave
 * blank white frames that flash on every loop.
 */
export const Close: React.FC<{
	frame: number;
	opacity: number;
	reduced: boolean;
	logoSrc: string;
}> = ({frame, opacity, reduced, logoSrc}) => {
	if (opacity <= 0) return null;

	const cta = rampIn(frame, T.ctaIn);
	const swipe = seg(frame, 0, 1, T.ctaSwipe[0], T.ctaSwipe[1], DRAW);
	const lockupScale = reduced
		? 1
		: seg(frame, 0.86, 1, T.lockup[0], T.lockup[1], POP);
	const lockupOpacity = rampIn(frame, T.lockup);
	const bsi = rampIn(frame, T.bsiIn);
	const source = rampIn(frame, T.sourceIn);

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
				<h1 style={headline(100)}>Ten years from now is 2036.</h1>
				<p style={{...paragraph(36), marginTop: 36}}>
					Run the numbers on your ZIP code before you wait again.
				</p>

				<div
					style={{
						marginTop: 76,
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'center',
						gap: 18,
						opacity: cta,
					}}
				>
					<div style={{...headline(58), fontWeight: 800}}>Let&rsquo;s talk</div>
					<div
						style={{
							fontFamily: MONO,
							fontWeight: 500,
							fontSize: 52,
							color: BLUE,
							whiteSpace: 'nowrap',
						}}
					>
						Call 734.383.6945
					</div>
					<AccentSwipe
						width={446}
						height={14}
						marginTop={0}
						progress={swipe}
						reduced={reduced}
					/>
				</div>

				<div
					style={{
						marginTop: 96,
						display: 'flex',
						flexDirection: 'row',
						alignItems: 'center',
						gap: 41,
						whiteSpace: 'nowrap',
						opacity: lockupOpacity,
						transform: `scale(${lockupScale})`,
					}}
				>
					<Img src={staticFile(logoSrc)} style={{width: 120, height: 'auto'}} />
					<div
						style={{
							fontFamily: SANS,
							fontWeight: 900,
							fontSize: 74,
							letterSpacing: '-0.03em',
							color: INK,
						}}
					>
						AM Real Estate
					</div>
				</div>

				<div
					style={{
						marginTop: 30,
						fontFamily: MONO,
						fontWeight: 500,
						fontSize: 32,
						letterSpacing: '0.22em',
						color: INK2,
						opacity: bsi,
					}}
				>
					BUY.SELL.INVEST
				</div>
			</div>

			<div
				style={{
					position: 'absolute',
					top: 1560,
					left: 120,
					right: 120,
					textAlign: 'center',
					fontFamily: MONO,
					fontWeight: 400,
					fontSize: 26,
					lineHeight: 1.55,
					color: INK3,
					opacity: source,
				}}
			>
				Sources: FHFA all-transactions house price index, Fairfax County VA, 1975&ndash;2025
				(FRED); segment averages from MarketStats by ShowingTime / Bright MLS. County
				dollars are the index scaled to a $740,000 median in 2025. Estimates, not
				appraisals.
			</div>
		</div>
	);
};
