import {Easing, staticFile} from 'remotion';
import {loadFont} from '@remotion/fonts';

// ---------------------------------------------------------------- tokens

export const INK = '#0b0b0c'; // primary type
export const INK2 = '#3a3a40'; // secondary type
export const INK3 = '#64646b'; // muted type, captions
export const INK4 = '#9a9aa1'; // axis labels, dashed rules
export const BLUE = '#0a5cff'; // the subject line, FALLING price segments, the live year, phones
export const AREA = '#f6f7f9'; // area fill — neutral, so it never fights the two line colours
export const LINE = '#e9e9ee'; // hairlines, card borders
export const HILITE = '#ffc94a'; // marker highlight — Scene 1, the Scene 2 write-on, NOVA in the close
export const ACCENT = '#c8232c'; // red — RISING price segments, every delta, bars, swipes
export const RATE = '#128a4e'; // green — the mortgage rate line, its car, and Payment's eyebrow
export const DIP = '#3a3a40'; // the 2008 drop callout

export const PAPER = '#ffffff';
export const CARD = '#fafafb';
export const TINT = '#fdf1f1'; // the one tinted panel, on the payment that hurts
export const TINT_EDGE = 'rgba(200,35,44,.2)';

// ---------------------------------------------------------------- type
//
// Vendored as variable woff2 (latin subset) under public/fonts so a render never
// depends on the network. Geist and Geist Mono are SIL OFL 1.1; so is Caveat.

export const SANS = 'Geist';
export const MONO = 'Geist Mono';
export const HAND = 'Caveat'; // one place only: the Investigate write-on line

loadFont({family: SANS, url: staticFile('fonts/Geist-latin.woff2'), format: 'woff2', weight: '100 900'});
loadFont({family: MONO, url: staticFile('fonts/GeistMono-latin.woff2'), format: 'woff2', weight: '100 900'});
loadFont({family: HAND, url: staticFile('fonts/Caveat-latin.woff2'), format: 'woff2', weight: '400 700'});

// ---------------------------------------------------------------- easing
//
// Four curves, and the distinction matters. Anything representing a vehicle
// travelling must be linear — see the rate car.

export const ENTER = Easing.out(Easing.poly(4)); // out-quart — text and camera arrivals
export const DRAW = Easing.inOut(Easing.cubic); // line draws, bar growth, counters, highlight wipes
export const RIDE = (n: number) => n; // LINEAR — the rate car only
export const POP = Easing.out(Easing.back(1.7)); // the lockup scale-in only

// Exits are linear: a film dissolve. Easing a fade-out either dumps its opacity in the
// first frames (a white gap at every handoff) or holds it too long (two headlines
// stacked). This is the absence of a curve, not a fifth one.
export const EXIT = (n: number) => n;

// ---------------------------------------------------------------- shared text styles

export const headline = (size: number, weight = 800) =>
	({
		fontFamily: SANS,
		fontWeight: weight,
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

/** The system's media radius — portraits, listing tiles. */
export const MEDIA_RADIUS = 14;
