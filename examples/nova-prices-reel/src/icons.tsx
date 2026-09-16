import React from 'react';

/**
 * Lucide (ISC), 24px grid, 2px stroke, round caps, outline only — vendored as path data
 * so the glyphs inherit currentColor and a render never reaches for a CDN. House imagery
 * in this piece is always one of these; nothing is ever drawn by hand.
 */
const PATHS = {
	house: [
		'M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8',
		'M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
	],
	layers: [
		'M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z',
		'M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12',
		'M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17',
	],
	phone: [
		'M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384',
	],
} as const;

export type IconName = keyof typeof PATHS;

export const Icon: React.FC<{
	name: IconName;
	size: number;
	color?: string;
	strokeWidth?: number;
	style?: React.CSSProperties;
}> = ({name, size, color = 'currentColor', strokeWidth = 2, style}) => (
	<svg
		width={size}
		height={size}
		viewBox="0 0 24 24"
		fill="none"
		stroke={color}
		strokeWidth={strokeWidth}
		strokeLinecap="round"
		strokeLinejoin="round"
		style={{display: 'block', flex: '0 0 auto', ...style}}
	>
		{PATHS[name].map((d) => (
			<path key={d} d={d} />
		))}
	</svg>
);
