// Three public annual series, 1975 through the current year. The piece is authored to
// end on today, not on the last complete year — so the final point is partial and the
// source block says so.

// 1. Fairfax County home prices. FHFA all-transactions house price index, annual, 2000 = 100.
export const DATA: [number, number][] = [
	[1975, 25.6], [1976, 27.2], [1977, 29.17], [1978, 32.52], [1979, 36.16], [1980, 41.56],
	[1981, 44.59], [1982, 42.77], [1983, 47.68], [1984, 50.38], [1985, 53.65], [1986, 57.35],
	[1987, 63.85], [1988, 76.49], [1989, 84.44], [1990, 84.51], [1991, 83.04], [1992, 83.21],
	[1993, 83.16], [1994, 83.13], [1995, 82.63], [1996, 82.98], [1997, 83.5], [1998, 85.4],
	[1999, 89.18], [2000, 100.0], [2001, 114.0], [2002, 127.66], [2003, 137.13], [2004, 160.97],
	[2005, 204.71], [2006, 221.44], [2007, 210.06], [2008, 187.56], [2009, 176.44], [2010, 179.32],
	[2011, 180.87], [2012, 184.21], [2013, 192.44], [2014, 203.52], [2015, 207.0], [2016, 210.3],
	[2017, 215.03], [2018, 220.22], [2019, 228.66], [2020, 236.38], [2021, 253.55], [2022, 278.66],
	[2023, 293.45], [2024, 313.13], [2025, 319.72], [2026, 351.26],
];

// 2. Mortgage rates. Freddie Mac PMMS, 30-year fixed, annual averages.
export const RATES: [number, number][] = [
	[1975, 9.05], [1976, 8.87], [1977, 8.85], [1978, 9.64], [1979, 11.2], [1980, 13.74],
	[1981, 16.63], [1982, 16.04], [1983, 13.24], [1984, 13.88], [1985, 12.43], [1986, 10.19],
	[1987, 10.21], [1988, 10.34], [1989, 10.32], [1990, 10.13], [1991, 9.25], [1992, 8.39],
	[1993, 7.31], [1994, 8.38], [1995, 7.93], [1996, 7.81], [1997, 7.6], [1998, 6.94],
	[1999, 7.44], [2000, 8.05], [2001, 6.97], [2002, 6.54], [2003, 5.83], [2004, 5.84],
	[2005, 5.87], [2006, 6.41], [2007, 6.34], [2008, 6.03], [2009, 5.04], [2010, 4.69],
	[2011, 4.45], [2012, 3.66], [2013, 3.98], [2014, 4.17], [2015, 3.85], [2016, 3.65],
	[2017, 3.99], [2018, 4.54], [2019, 3.94], [2020, 3.11], [2021, 2.96], [2022, 5.34],
	[2023, 6.81], [2024, 6.72], [2025, 6.6], [2026, 6.37],
];

// 3. Inflation. CPI-U annual averages, used for exactly one figure — the real-terms
// price change on the Payment card.
export const CPI = {from: 240.007, to: 331.26} as const;

export const PER_IDX = 740000 / 319.72;

export const FIRST_YEAR = DATA[0][0]; // 1975
export const LAST_YEAR = DATA[DATA.length - 1][0]; // 2026
export const SPAN_YEARS = LAST_YEAR - FIRST_YEAR; // 51

/** The ten-year comparison every scene from Gap onward keys off. */
export const FROM_YEAR = 2016;
export const TO_YEAR = 2026;

// ---------------------------------------------------------------- chart geometry

export const VB_W = 1400;
export const VB_H = 1920;

export const X0 = 190;
export const X1 = 960;
export const Y0 = 1330;
export const IMAX = 375;
export const YSPAN = 740;
export const RMAX = 19; // the rate line's own right-hand scale

export const xOf = (year: number) => X0 + ((year - FIRST_YEAR) / SPAN_YEARS) * (X1 - X0);
export const yOf = (index: number) => Y0 - (index / IMAX) * YSPAN;
export const yRate = (pct: number) => Y0 - (pct / RMAX) * YSPAN;

export const indexOfDollars = (dollars: number) => dollars / PER_IDX;

/** The last tick is the current year, not a decade, so the chart always ends on today. */
export const DECADES = [1975, 1985, 1995, 2005, 2015, LAST_YEAR];
export const GRID_DOLLARS = [200000, 400000, 600000];
export const RATE_TICKS = [5, 10, 15];

// ---------------------------------------------------------------- reads off the series

const seriesAt = (series: [number, number][], year: number): number => {
	const y = Math.min(Math.max(year, FIRST_YEAR), LAST_YEAR);
	const i = Math.min(Math.floor(y - FIRST_YEAR), series.length - 2);
	const [ya, va] = series[i];
	const [, vb] = series[i + 1];
	return y <= ya ? va : va + (vb - va) * (y - ya);
};

export const indexAt = (year: number) => seriesAt(DATA, year);
export const rateAt = (year: number) => seriesAt(RATES, year);

export const idxOfYear = (year: number) => DATA[year - FIRST_YEAR][1];
export const rateOfYear = (year: number) => RATES[year - FIRST_YEAR][1];

export const PEAK_2006 = idxOfYear(2006); // 221.44
export const TROUGH_2009 = idxOfYear(2009); // 176.44

export const DOLLARS_FROM = idxOfYear(FROM_YEAR) * PER_IDX; // 486,745
export const DOLLARS_TO = idxOfYear(TO_YEAR) * PER_IDX; // 813,000
export const WAIT_COST = DOLLARS_TO - DOLLARS_FROM; // 326,255

export const PRICE_RISE_PCT = (DOLLARS_TO / DOLLARS_FROM - 1) * 100; // 67.0

// ---------------------------------------------------------------- the payment
//
// 30-year P&I on 80% LTV. No taxes, insurance or HOA — the note says so, and the
// down-payment chip states the assumption as a display element rather than a footnote.

export const DOWN_PCT = 0.2;

export const PMT = (price: number, pct: number) => {
	const loan = price * (1 - DOWN_PCT);
	const r = pct / 100 / 12;
	return (loan * r) / (1 - Math.pow(1 + r, -360));
};

export const PRICE_FROM = Math.round(DOLLARS_FROM / 1000) * 1000; // 487,000
export const PRICE_TO = Math.round(DOLLARS_TO / 1000) * 1000; // 813,000
export const RATE_FROM = rateOfYear(FROM_YEAR); // 3.65
export const RATE_TO = rateOfYear(TO_YEAR); // 6.37

export const PMT_FROM = PMT(PRICE_FROM, RATE_FROM); // 1,782
export const PMT_TO = PMT(PRICE_TO, RATE_TO); // 4,056
export const PMT_RISE_PCT = (PMT_TO / PMT_FROM - 1) * 100; // 127.5 → 128

/** Real-terms price change: the whole point of the Payment scene's last card. */
export const REAL_RISE_PCT = (PRICE_TO / (DOLLARS_FROM * (CPI.to / CPI.from)) - 1) * 100; // 21.0

// ---------------------------------------------------------------- Scene 6 segments

export type Segment = {
	label: string;
	short: string;
	icon: 'house' | 'layers';
	from: number;
	to: number;
	delta: number;
};

export const SEG: Segment[] = [
	{label: 'Single-family house', short: 'SF', icon: 'house', from: 802000, to: 1338000, delta: 536000},
	{label: 'Townhome', short: 'TW', icon: 'layers', from: 374000, to: 624000, delta: 250000},
];

export const D_MAX = 536000; // the larger delta — sets the magnitude bar scale

// ---------------------------------------------------------------- Scene 7 listing photos

export type ShotGroup = {label: string; icon: 'house' | 'layers'; cols: number; shots: string[]};

export const SHOTS: ShotGroup[] = [
	{
		label: 'Single-family houses',
		icon: 'house',
		cols: 2,
		shots: ['sold/sf-1.svg', 'sold/sf-2.svg', 'sold/sf-3.svg', 'sold/sf-4.svg'],
	},
	{
		label: 'Townhomes',
		icon: 'layers',
		cols: 3,
		shots: ['sold/tw-1.svg', 'sold/tw-2.svg', 'sold/tw-3.svg'],
	},
];

// ---------------------------------------------------------------- seeded scatters
//
// Every position, size and delay is a fixed literal. A random scatter re-rolls on every
// render, so scrubbing the timeline or re-rendering a frame produces a different image.

/** [x, y, size] — deliberately avoids y 470–960, the question and claim band. */
export const HOUSES: [number, number, number][] = [
	[96, 300, 82], [352, 330, 58], [620, 296, 70], [880, 344, 52],
	[232, 404, 76], [512, 392, 84], [760, 418, 56],
	[128, 996, 56], [70, 1064, 74], [330, 1158, 54], [598, 1082, 86],
	[860, 1170, 62], [206, 1374, 64], [508, 1448, 78], [790, 1380, 56],
];

/** [x, delay, duration] */
export const BILLS: [number, number, number][] = [
	[126, 0.0, 2.0], [268, 0.34, 2.3], [402, 0.12, 1.9], [534, 0.52, 2.2],
	[668, 0.22, 2.1], [802, 0.44, 2.4], [936, 0.08, 2.0], [196, 0.66, 2.2],
	[340, 0.8, 1.9], [470, 0.28, 2.5], [604, 0.72, 2.1], [738, 0.58, 2.3],
	[872, 0.9, 2.0], [60, 0.48, 2.2],
];

// ---------------------------------------------------------------- formatting
//
// One format everywhere: full dollars rounded to the nearest thousand.

export const money = (dollars: number) =>
	`$${Math.round(dollars / 1000).toLocaleString('en-US')},000`;

export const moneyK = (dollars: number) => `$${Math.round(dollars / 1000)}K`;

/** Monthly payments are the one figure shown to the dollar. */
export const perMonth = (dollars: number) =>
	`$${Math.round(dollars).toLocaleString('en-US')}/mo`;

export const pct = (n: number) => `${Math.round(n)}%`;
