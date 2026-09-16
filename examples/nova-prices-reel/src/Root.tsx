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
				reducedMotion: false,
			}}
		/>
	);
};
