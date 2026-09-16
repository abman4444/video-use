import React from 'react';
import {Composition} from 'remotion';
import {NovaPricesReel} from './NovaPricesReel';
import {DURATION, FPS, HEIGHT, WIDTH} from './timing';

export const RemotionRoot: React.FC = () => {
	return (
		<Composition
			id="NovaPricesReel"
			component={NovaPricesReel}
			durationInFrames={DURATION}
			fps={FPS}
			width={WIDTH}
			height={HEIGHT}
			defaultProps={{
				logoSrc: 'logo-mark.svg',
				portraitFindOut: 'portraits/ahmed-findout.svg',
				portraitColor: 'portraits/ahmed-color.svg',
				brokerageSrc: 'brand/douglas-realty.svg',
				equalHousingSrc: 'brand/equal-housing.svg',
				reducedMotion: false,
			}}
		/>
	);
};
