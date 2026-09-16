#!/usr/bin/env node
//
// Probes the reel's state function frame by frame and asserts the timing contract
// from the brief. "Any caption that names a year must be on screen only while the
// line is at that year. Check this by probing the readout, not by eye."
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

// src/ is TypeScript; bundle the pure modules with the esbuild that ships with Remotion.
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

const {reelState, windowed, DURATION, CAPTIONS, T, HOLD, money} = M;

let failures = 0;
const check = (name, ok, detail = '') => {
	if (ok) {
		console.log(`  \x1b[32m+\x1b[0m ${name}`);
	} else {
		failures++;
		console.log(`  \x1b[31mx\x1b[0m ${name}${detail ? ` — ${detail}` : ''}`);
	}
};

const frames = [...Array(DURATION).keys()];
const state = frames.map((f) => reelState(f));

console.log('\nNOVA Prices Reel — timing contract\n');

// --- the draw is keyframed in year space, not progress space -----------------

check(
	'line starts at 1975 and is still there at frame 89',
	state[89].tip.year === 1975,
	`got ${state[89].tip.year}`,
);
check(
	'line reaches the 2006 peak at frame 192',
	Math.abs(state[192].tip.year - 2006) < 0.01,
	`got ${state[192].tip.year.toFixed(3)}`,
);
check(
	'line reaches the 2009 trough at frame 210',
	Math.abs(state[210].tip.year - 2009) < 0.01,
	`got ${state[210].tip.year.toFixed(3)}`,
);
check(
	'line finishes at 2025 by frame 312 and stays there',
	Math.abs(state[312].tip.year - 2025) < 0.01 && state[DURATION - 1].tip.year === 2025,
	`got ${state[312].tip.year.toFixed(3)}`,
);

// The 1.6s hold is what makes every caption timing below deterministic.
const holdFrames = frames.filter((f) => f >= HOLD.from && f <= HOLD.to);
check(
	`the line is parked on 2009 for all ${holdFrames.length} frames of the hold`,
	holdFrames.every((f) => Math.abs(state[f].tip.year - 2009) < 1e-9),
);

// --- the brief's own sanity check --------------------------------------------

const cap2 = CAPTIONS[1].window;
const cap2Frames = frames.filter((f) => windowed(f, cap2) > 0);
const badReadout = cap2Frames.filter(
	(f) => state[f].yearLabel !== 2009 || money(state[f].dollars) !== '$408,000',
);
check(
	'every frame caption 2 is on screen the readout says 2009 / $408,000',
	badReadout.length === 0,
	badReadout.length
		? `${badReadout.length} bad frames, first at ${badReadout[0]} showing ` +
			`${state[badReadout[0]].yearLabel} / ${money(state[badReadout[0]].dollars)}`
		: '',
);

// Caption 1 names 1975; caption 3 spans the 2009 -> 2025 recovery.
const cap1Frames = frames.filter((f) => windowed(f, CAPTIONS[0].window) > 0);
check(
	'caption 1 runs entirely inside the 1975 -> 2006 sweep',
	cap1Frames.every((f) => state[f].tip.year >= 1975 && state[f].tip.year <= 2006),
	`${state[cap1Frames[0]].tip.year.toFixed(1)} -> ${state[cap1Frames[cap1Frames.length - 1]].tip.year.toFixed(1)}`,
);
const cap3Frames = frames.filter((f) => windowed(f, CAPTIONS[2].window) > 0);
check(
	'caption 3 runs from the trough to the end of the recovery',
	state[cap3Frames[0]].tip.year >= 2009 &&
		state[cap3Frames[cap3Frames.length - 1]].tip.year >= 2024,
	`${state[cap3Frames[0]].tip.year.toFixed(1)} -> ${state[cap3Frames[cap3Frames.length - 1]].tip.year.toFixed(1)}`,
);

// Only one caption at a time.
const overlap = frames.filter(
	(f) => CAPTIONS.filter((c) => windowed(f, c.window) > 0.02).length > 1,
);
check('captions never overlap', overlap.length === 0, `${overlap.length} frames`);

// --- the 2008 callout is keyed off the line, not the clock -------------------

const dropOn = frames.filter((f) => state[f].dropOpacity > 0);
check(
	'the -20% callout appears only after the line passes 2008.6',
	dropOn.every((f) => state[f].tip.year > 2008.6),
	`first at frame ${dropOn[0]} / year ${state[dropOn[0]].tip.year.toFixed(2)}`,
);
check(
	'the callout outlasts caption 3 and is gone before the Gap camera move',
	state[cap3Frames[cap3Frames.length - 1]].dropOpacity > 0 &&
		state[T.camGap[0]].dropOpacity === 0,
);

// --- cross-fades, not overlaps ----------------------------------------------

const both = frames.filter(
	(f) => state[f].chartOpacity > 0.02 && state[f].panelOpacity > 0.02,
);
check('chart and Split panel never overlap', both.length === 0, `${both.length} frames`);

const panelAndClose = frames.filter(
	(f) => state[f].panelOpacity > 0.02 && state[f].closeOpacity > 0.02,
);
check(
	'Split panel and Close never overlap',
	panelAndClose.length === 0,
	`${panelAndClose.length} frames`,
);

// These two share a position and are specified as a cross-fade, so a brief overlap
// is the point — what must not happen is both reading at full strength at once.
const doubled = frames.filter(
	(f) => Math.min(state[f].readoutOpacity, state[f].deltaOpacity) > 0.5,
);
check(
	'live readout and the delta headline cross-fade rather than stack',
	doubled.length === 0,
	`${doubled.length} frames with both above 0.5`,
);

// --- no frame is ever blank --------------------------------------------------

// The corner mark is up on every frame, so nothing is ever literally blank — and the
// brief's own opening (eyebrow at frame 3, headline at frame 7) leans on exactly that.
// What would read as a white flash is a run of frames mid-piece where one scene has
// faded out and the next has not started. Handoffs may touch zero; they may not linger.
const empty = frames.filter((f) => {
	const s = state[f];
	return (
		Math.max(
			s.chartOpacity,
			s.hookOpacity,
			s.panelOpacity,
			s.closeOpacity,
			s.readoutOpacity,
			s.deltaOpacity,
		) < 0.05 && f >= T.chartIn[0]
	);
});
let longest = 0;
let run = 0;
for (const f of frames) {
	run = empty.includes(f) ? run + 1 : 0;
	longest = Math.max(longest, run);
}
check(
	'no white flash at any handoff (longest near-empty run <= 2 frames)',
	longest <= 2,
	`longest run ${longest} frames${empty.length ? ` (at ${empty[0]}..)` : ''}`,
);

check(
	'the close holds at full opacity through the last frame',
	state[DURATION - 1].closeOpacity === 1,
	`got ${state[DURATION - 1].closeOpacity}`,
);

// --- the camera --------------------------------------------------------------

check(
	'camera is at 1.00 when the line starts drawing',
	Math.abs(state[93].camera.scale - 1) < 1e-6,
	`got ${state[93].camera.scale}`,
);
check(
	'camera keeps drifting through the 2009 hold',
	state[HOLD.to].camera.scale > state[HOLD.from].camera.scale,
	`${state[HOLD.from].camera.scale.toFixed(4)} -> ${state[HOLD.to].camera.scale.toFixed(4)}`,
);
check(
	'Gap framing is scale 2.0 on (883, 800)',
	Math.abs(state[420].camera.scale - 2) < 1e-6 &&
		Math.abs(state[420].camera.fx - 883) < 1e-6 &&
		Math.abs(state[420].camera.fy - 800) < 1e-6,
);
check(
	'camera is back to its original framing by the Split panel',
	Math.abs(state[T.panelIn[1]].camera.scale - 1) < 1e-6,
	`got ${state[T.panelIn[1]].camera.scale}`,
);

// --- the figures -------------------------------------------------------------

check(
	'the delta counter lands on +$261,000',
	`+${money(state[T.deltaCount[1]].deltaValue)}` === '+$261,000',
	`got +${money(state[T.deltaCount[1]].deltaValue)}`,
);
check(
	'2025 reads $740,000',
	money(state[DURATION - 1].tip.index * (740000 / 319.72)) === '$740,000',
);

console.log(
	failures === 0
		? '\n\x1b[32mAll checks passed.\x1b[0m\n'
		: `\n\x1b[31m${failures} check(s) failed.\x1b[0m\n`,
);
process.exit(failures === 0 ? 0 : 1);
