#!/usr/bin/env node
//
// Probes the reel's state function frame by frame and asserts the timing contract from
// the brief. "Any caption that names a year must be on screen only while the line is at
// that year. Check this by probing the readout, not by eye."
//
//   node scripts/verify-timing.mjs

import {execFileSync} from 'node:child_process';
import {mkdtempSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join, dirname, resolve} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = mkdtempSync(join(tmpdir(), 'nova-probe-'));
const bundle = join(out, 'reel.mjs');

execFileSync(
	join(root, 'node_modules', '.bin', 'esbuild'),
	[
		join(root, 'src', 'probe-entry.ts'),
		'--bundle',
		'--format=esm',
		'--platform=node',
		'--log-level=warning',
		`--outfile=${bundle}`,
	],
	{stdio: 'inherit'},
);

const M = await import(pathToFileURL(bundle).href);
rmSync(out, {recursive: true, force: true});

const {
	reelState, windowed, tipRising, tipAt, rateTipAt,
	DURATION, FPS, CAPTIONS, CUE, T, HOLD, WALK,
	money, perMonth, WAIT_COST, PRICE_RISE_PCT, PMT_RISE_PCT, REAL_RISE_PCT,
	PMT_FROM, PMT_TO, FROM_YEAR, TO_YEAR,
} = M;

let failures = 0;
const check = (name, ok, detail = '') => {
	if (ok) console.log(`  \x1b[32m+\x1b[0m ${name}`);
	else {
		failures++;
		console.log(`  \x1b[31mx\x1b[0m ${name}${detail ? ` — ${detail}` : ''}`);
	}
};
const head = (s) => console.log(`\n\x1b[1m${s}\x1b[0m`);

const frames = [...Array(DURATION).keys()];
const S = frames.map((f) => reelState(f, FPS));
const at = (sec) => S[Math.round(sec * FPS)];

console.log('\nNOVA Prices Reel — timing contract');

// ---------------------------------------------------------------- the draw
head('The draw is keyframed in year space');

check('line holds at 1975 until its first keyframe', at(CUE.climb + 0.19).tip.year === 1975);
check(
	'line reaches the 2006 peak at Climb+3.6',
	Math.abs(at(CUE.climb + 3.6).tip.year - 2006) < 0.02,
	`got ${at(CUE.climb + 3.6).tip.year.toFixed(3)}`,
);
check(
	'line reaches the 2009 trough at Climb+4.2',
	Math.abs(at(CUE.climb + 4.2).tip.year - 2009) < 0.02,
	`got ${at(CUE.climb + 4.2).tip.year.toFixed(3)}`,
);
check(
	'line finishes on 2026 by Climb+7.6 and stays there',
	Math.abs(at(CUE.climb + 7.6).tip.year - 2026) < 0.02 && S[DURATION - 1].tip.year === 2026,
	`got ${at(CUE.climb + 7.6).tip.year.toFixed(3)}`,
);

const holdFrames = frames.filter((f) => S[f].t >= HOLD[0] && S[f].t <= HOLD[1]);
check(
	`the line is parked on 2009 for all ${holdFrames.length} frames of the 1.6s hold`,
	holdFrames.every((f) => Math.abs(S[f].tip.year - 2009) < 1e-9),
);

// ---------------------------------------------------------------- the brief's own check
head('The sanity check');

const cap2 = CAPTIONS[1].window;
const cap2Frames = frames.filter((f) => windowed(S[f].t, cap2) > 0);
const badReadout = cap2Frames.filter(
	(f) => S[f].yearLabel !== 2009 || money(S[f].dollars) !== '$408,000',
);
check(
	'every frame caption 2 is up, the readout says 2009 / $408,000',
	badReadout.length === 0,
	badReadout.length
		? `${badReadout.length} bad frames, first showing ${S[badReadout[0]].yearLabel} / ${money(S[badReadout[0]].dollars)}`
		: '',
);
// The trap: the line has just fallen for three years, but 2010 is higher — a
// forward-looking direction test paints the bottom of the crash as a gain.
check(
	'the 2009 trough reads BLUE, not red (the tip looks backward)',
	cap2Frames.every((f) => S[f].rising === false),
	`${cap2Frames.filter((f) => S[f].rising).length} red frames`,
);

const cap1 = frames.filter((f) => windowed(S[f].t, CAPTIONS[0].window) > 0);
check(
	'caption 1 runs entirely inside the 1975 -> 2006 sweep',
	cap1.every((f) => S[f].tip.year >= 1975 && S[f].tip.year <= 2006),
);
const cap3 = frames.filter((f) => windowed(S[f].t, CAPTIONS[2].window) > 0);
check(
	'caption 3 runs from the trough to the end of the recovery',
	S[cap3[0]].tip.year >= 2009 && S[cap3[cap3.length - 1]].tip.year >= 2025,
	`${S[cap3[0]].tip.year.toFixed(1)} -> ${S[cap3[cap3.length - 1]].tip.year.toFixed(1)}`,
);
check(
	'captions never overlap',
	frames.filter((f) => CAPTIONS.filter((c) => windowed(S[f].t, c.window) > 0.02).length > 1).length === 0,
);

// ---------------------------------------------------------------- the rate ride
head('The rate ride is linear');

const rideA = rateTipAt(T.rateRide[0] + 1).year - rateTipAt(T.rateRide[0]).year;
const rideB = rateTipAt(T.rateRide[0] + 4).year - rateTipAt(T.rateRide[0] + 3).year;
check(
	'the ride covers equal years per second throughout (no ease)',
	Math.abs(rideA - rideB) < 1e-6,
	`${rideA.toFixed(4)} vs ${rideB.toFixed(4)} years/s`,
);
check(
	'the ride is about 8 years per second, not 19',
	rideA > 7.5 && rideA < 8.7,
	`${rideA.toFixed(2)} years/s`,
);
check(
	'the ride starts at 1975 and ends on 2026',
	rateTipAt(T.rateRide[0]).year === 1975 && Math.abs(rateTipAt(T.rateRide[1]).year - 2026) < 0.01,
);
check(
	'the rate layer is gone before the Gap camera move',
	at(CUE.gap - 0.3).rateLayerOpacity === 0 && at(CUE.rates + 3).rateLayerOpacity > 0.9,
);

// ---------------------------------------------------------------- handoffs
head('Handoffs are cross-fades, never stacks');

const panels = [
	['chart', (s) => s.chartOpacity],
	['Split', (s) => s.panelOpacity],
	['Sold', (s) => s.soldOpacity],
	['Payment', (s) => s.payOpacity],
	['Close', (s) => s.closeOpacity],
	['Question', (s) => s.askOpacity],
	['Investigate', (s) => s.invOpacity],
];
for (let i = 0; i < panels.length; i++) {
	for (let j = i + 1; j < panels.length; j++) {
		const [na, fa] = panels[i];
		const [nb, fb] = panels[j];
		const both = frames.filter((f) => fa(S[f]) > 0.02 && fb(S[f]) > 0.02);
		if (na === 'chart' && (nb === 'Investigate' || nb === 'Question')) continue; // deliberate overlap
		if (both.length) {
			check(`${na} and ${nb} never overlap`, false, `${both.length} frames from ${both[0]}`);
		}
	}
}
check('every full-screen panel pair is exclusive (see above)', true);

const readoutDelta = frames.filter(
	(f) => Math.min(S[f].readoutOpacity, S[f].deltaOpacity) > 0.5,
);
check('live readout and the delta headline cross-fade rather than stack', readoutDelta.length === 0);

// The corner mark is up on every frame, so nothing is literally blank. What would read as
// a white flash is a run of frames where one scene has gone and the next has not started.
const content = (s) =>
	Math.max(
		s.chartOpacity, s.askOpacity, s.invOpacity, s.panelOpacity,
		s.soldOpacity, s.payOpacity, s.closeOpacity, s.readoutOpacity, s.deltaOpacity,
	);
let longest = 0;
let run = 0;
let runAt = -1;
for (const f of frames) {
	if (content(S[f]) < 0.05 && S[f].t > 0.6) {
		run++;
		if (run > longest) {
			longest = run;
			runAt = f - run + 1;
		}
	} else run = 0;
}
check(
	'no white flash at any handoff (longest near-empty run <= 2 frames)',
	longest <= 2,
	`longest run ${longest} frames at f${runAt}`,
);
check(
	'the close holds at full opacity through the last frame',
	S[DURATION - 1].closeOpacity === 1,
);

// ---------------------------------------------------------------- camera
head('One camera over one chart');

check('camera is at 1.00 when the line starts drawing', Math.abs(at(CUE.climb + 0.3).camera.scale - 1) < 1e-6);
check(
	'camera keeps drifting through the 2009 hold',
	at(HOLD[1]).camera.scale > at(HOLD[0]).camera.scale,
);
check(
	'Gap framing is scale 2.0 on (885, 800)',
	Math.abs(at(CUE.gap + 2).camera.scale - 2) < 1e-6 &&
		Math.abs(at(CUE.gap + 2).camera.fx - 885) < 1e-6 &&
		Math.abs(at(CUE.gap + 2).camera.fy - 800) < 1e-6,
);
check(
	'camera is back to its original framing by the Split panel',
	Math.abs(at(CUE.split + 0.1).camera.scale - 1) < 1e-6,
);

// ---------------------------------------------------------------- the walker
head("The walker's six beats");

const order = [WALK.IN, WALK.STOP, WALK.LOOK, WALK.FLASH, WALK.BLINK, WALK.CAM, WALK.SCR, WALK.QM];
check(
	'walk, halt, look, flash, blink, back to camera, scratch, question mark — in that order',
	order.every((v, i) => i === 0 || v > order[i - 1]),
);
check(
	'the whole beat finishes inside its own scene',
	WALK.QM + 0.25 < WALK.OUT && WALK.OUT <= CUE.climb,
	`QM ends ${(WALK.QM + 0.25).toFixed(2)}s, walker out ${WALK.OUT.toFixed(2)}s, Climb ${CUE.climb}s`,
);
check(
	'the statement is still up when it flashes back at him',
	at(WALK.FLASH).invOpacity > 0.9,
	`invOpacity ${at(WALK.FLASH).invOpacity.toFixed(2)}`,
);

// ---------------------------------------------------------------- the figures
head('Every figure on screen');

check(
	`the delta counter lands on +${money(WAIT_COST)}`,
	`+${money(at(T.deltaCount[1]).deltaValue)}` === '+$326,000',
	`got +${money(at(T.deltaCount[1]).deltaValue)}`,
);
check(`${FROM_YEAR} reads $487,000`, money(M.DOLLARS_FROM) === '$487,000', money(M.DOLLARS_FROM));
check(`${TO_YEAR} reads $813,000`, money(M.DOLLARS_TO) === '$813,000', money(M.DOLLARS_TO));
check('the price rose 67%', Math.round(PRICE_RISE_PCT) === 67, `${PRICE_RISE_PCT.toFixed(1)}%`);
check('the payment rose 128%', Math.round(PMT_RISE_PCT) === 128, `${PMT_RISE_PCT.toFixed(1)}%`);
check('adjusted for inflation it rose 21%', Math.round(REAL_RISE_PCT) === 21, `${REAL_RISE_PCT.toFixed(1)}%`);
check(
	'the two payments read $1,782/mo and $4,056/mo',
	perMonth(PMT_FROM) === '$1,782/mo' && perMonth(PMT_TO) === '$4,056/mo',
	`${perMonth(PMT_FROM)} / ${perMonth(PMT_TO)}`,
);

console.log(
	failures === 0
		? '\n\x1b[32mAll checks passed.\x1b[0m\n'
		: `\n\x1b[31m${failures} check(s) failed.\x1b[0m\n`,
);
process.exit(failures === 0 ? 0 : 1);
