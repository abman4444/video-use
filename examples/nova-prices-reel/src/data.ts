// FHFA all-transactions house price index, Fairfax County VA, annual, index 2000 = 100.
// Dollar values are this index multiplied by PER_IDX ($740,000 county median in 2025).

export const DATA: [number, number][] = [
	[1975, 25.6], [1976, 27.2], [1977, 29.17], [1978, 32.52], [1979, 36.16], [1980, 41.56],
	[1981, 44.59], [1982, 42.77], [1983, 47.68], [1984, 50.38], [1985, 53.65], [1986, 57.35],
	[1987, 63.85], [1988, 76.49], [1989, 84.44], [1990, 84.51], [1991, 83.04], [1992, 83.21],
	[1993, 83.16], [1994, 83.13], [1995, 82.63], [1996, 82.98], [1997, 83.5], [1998, 85.4],
	[1999, 89.18], [2000, 100.0], [2001, 114.0], [2002, 127.66], [2003, 137.13], [2004, 160.97],
	[2005, 204.71], [2006, 221.44], [2007, 210.06], [2008, 187.56], [2009, 176.44], [2010, 179.32],
	[2011, 180.87], [2012, 184.21], [2013, 192.44], [2014, 203.52], [2015, 207.0], [2016, 210.3],
	[2017, 215.03], [2018, 220.22], [2019, 228.66], [2020, 236.38], [2021, 253.55], [2022, 278.66],
	[2023, 293.45], [2024, 313.13], [2025, 319.72],
];

export const PER_IDX = 740000 / 319.72;

export const FIRST_YEAR = DATA[0][0];
export const LAST_YEAR = DATA[DATA.length - 1][0];
export const SPAN_YEARS = LAST_YEAR - FIRST_YEAR; // 50

// ---------------------------------------------------------------- chart geometry
//
// The SVG viewBox is wider than the 1080px frame on purpose: at the Gap zoom the
// annotations to the right of X1 must not be clipped by the SVG itself.

export const VB_W = 1400;
export const VB_H = 1920;

export const X0 = 190;
export const X1 = 960;
export const Y0 = 1330;
export const IMAX = 345;
export const YSPAN = 740;

export const xOf = (year: number) => X0 + ((year - FIRST_YEAR) / SPAN_YEARS) * (X1 - X0);
export const yOf = (index: number) => Y0 - (index / IMAX) * YSPAN;

export const indexOfDollars = (dollars: number) => dollars / PER_IDX;

export const DECADES = [1975, 1985, 1995, 2005, 2015, 2025];
export const GRID_DOLLARS = [200000, 400000, 600000];

// ---------------------------------------------------------------- reads off the series

/** Index value at a fractional year, linearly interpolated between annual points. */
export const indexAt = (year: number): number => {
	const y = Math.min(Math.max(year, FIRST_YEAR), LAST_YEAR);
	const i = Math.min(Math.floor(y - FIRST_YEAR), DATA.length - 2);
	const [ya, va] = DATA[i];
	const [, vb] = DATA[i + 1];
	if (y <= ya) return va;
	return va + (vb - va) * (y - ya);
};

export const idxOfYear = (year: number) => DATA[year - FIRST_YEAR][1];

export const PEAK_2006 = idxOfYear(2006); // 221.44
export const TROUGH_2009 = idxOfYear(2009); // 176.44
export const IDX_2015 = idxOfYear(2015); // 207.00
export const IDX_2025 = idxOfYear(2025); // 319.72

export const DOLLARS_2015 = IDX_2015 * PER_IDX; // 479,107
export const DOLLARS_2025 = IDX_2025 * PER_IDX; // 740,000
export const WAIT_COST = DOLLARS_2025 - DOLLARS_2015; // 260,893

// ---------------------------------------------------------------- Scene 4 segments

export type Segment = {label: string; y15: number; y25: number; delta: number};

export const SEG: Segment[] = [
	{label: 'A house', y15: 789000, y25: 1218000, delta: 429000},
	{label: 'A townhouse', y15: 368000, y25: 568000, delta: 200000},
];

export const D_MAX = 429000; // the larger delta — sets the magnitude bar scale

// ---------------------------------------------------------------- formatting
//
// One format everywhere: full dollars rounded to the nearest thousand.

export const money = (dollars: number) =>
	`$${Math.round(dollars / 1000).toLocaleString('en-US')},000`;

export const moneyK = (dollars: number) => `$${Math.round(dollars / 1000)}K`;
