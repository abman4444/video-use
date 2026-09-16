import {Easing, staticFile} from 'remotion';
import {loadFont} from '@remotion/fonts';

// ---------------------------------------------------------------- tokens

export const INK = '#0b0b0c'; // primary type
export const INK2 = '#3a3a40'; // secondary type
export const INK3 = '#64646b'; // muted type, captions
export const INK4 = '#9a9aa1'; // axis labels, dashed rules
export const BLUE = '#0a5cff'; // accent: eyebrow, the price line, live year, phone number
export const BLUE50 = '#ebf2ff'; // area fill under the price line
export const LINE = '#e9e9ee'; // hairlines, the "2015" portion of comparison bars
export const SOLD = '#c8232c'; // the 2008 drop callout only
export const ACCENT = '#b8652f'; // clay — the cost-of-waiting figure and bar extensions

export const PAPER = '#ffffff';
export const CARD = '#fafafb';

// ---------------------------------------------------------------- type
//
// Geist / Geist Mono are vendored as variable woff2 (latin subset) under
// public/fonts so a render never depends on the network. Both are SIL OFL 1.1.

export const SANS = 'Geist';
export const MONO = 'Geist Mono';

loadFont({
	family: SANS,
	url: staticFile('fonts/Geist-latin.woff2'),
	format: 'woff2',
	weight: '100 900',
});

loadFont({
	family: MONO,
	url: staticFile('fonts/GeistMono-latin.woff2'),
	format: 'woff2',
	weight: '100 900',
});

// ---------------------------------------------------------------- easing
//
// Three curves. No springs, no bounces.

export const ENTER = Easing.out(Easing.poly(4)); // out-quart — text and camera arrivals
// Exits are linear — a film dissolve, not an eased arrival. Easing a fade-out either
// dumps its opacity in the first frames (leaving a white gap at every handoff) or
// holds it too long (stacking two headlines that share a position). Straight down
// does neither. This is the absence of a curve, not a fourth one.
export const EXIT = (n: number) => n;
export const DRAW = Easing.inOut(Easing.cubic); // line draws, bar growth, counters
export const POP = Easing.out(Easing.back(1.7)); // the lockup scale-in only

// ---------------------------------------------------------------- shared text styles

export const headline = (size: number) =>
	({
		fontFamily: SANS,
		fontWeight: 800,
		fontSize: size,
		letterSpacing: '-0.04em',
		lineHeight: 1.03,
		textWrap: 'balance',
		color: INK,
		margin: 0,
	}) as const;

export const paragraph = (size: number, color: string = INK3) =>
	({
		fontFamily: SANS,
		fontWeight: 400,
		fontSize: size,
		lineHeight: 1.35,
		textWrap: 'pretty',
		color,
		margin: 0,
	}) as const;

export const chip = (size: number, tracking: string, color: string) =>
	({
		fontFamily: MONO,
		fontWeight: 500,
		fontSize: size,
		letterSpacing: tracking,
		color,
		margin: 0,
	}) as const;

export const TABULAR = {fontVariantNumeric: 'tabular-nums'} as const;
