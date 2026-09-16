#!/usr/bin/env node
//
// Turns a source image or video frame into one of the composition's asset slots.
//
// Pixels go through raw RGB rather than a PNG codec: Remotion ships an ffmpeg, so
// decoding and encoding are its job, and everything in between is plain arithmetic here.
// That matters because the brief specifies the portrait treatments as per-pixel recipes —
// a luminance-ratio unsharp and a neutral ink ramp — not as CSS filters.
//
//   node scripts/prepare-assets.mjs <source> <out.png> --size WxH [options]
//
//     --anchor N     vertical crop anchor, 0 top … 1 bottom (default 0.5; the brief
//                    uses 0.46 for listing photos, which favours the roofline over the lawn)
//     --frame N      take frame N of a video source (default 0), reached by seeking
//     --fps N        frame rate to interpret --frame against (default 30)
//     --mono         the Investigate recipe: luminance, unsharp, contrast, shadow lift,
//                    then a neutral ink ramp — no hue is introduced
//     --sharpen A    unsharp amount (default 0.45 colour, 0.50 mono)
//     --contrast C   contrast curve (default 1.08 colour, 1.22 mono)

import {execFileSync} from 'node:child_process';
import {mkdtempSync, readFileSync, rmSync, writeFileSync, mkdirSync} from 'node:fs';
import {decodePng, encodePng} from './png.mjs';
import {tmpdir} from 'node:os';
import {dirname, join, resolve} from 'node:path';

const argv = process.argv.slice(2);
const flag = (name, fallback = null) => {
	const i = argv.indexOf(`--${name}`);
	return i === -1 ? fallback : argv[i + 1];
};
const has = (name) => argv.includes(`--${name}`);

const VALUED = new Set(['size', 'anchor', 'frame', 'sharpen', 'contrast', 'fps']);
const positional = [];
for (let i = 0; i < argv.length; i++) {
	const a = argv[i];
	if (a.startsWith('--')) {
		if (VALUED.has(a.slice(2))) i++;
		continue;
	}
	positional.push(a);
}
const [src, out] = positional;
if (!src || !out) {
	console.error('usage: prepare-assets.mjs <source> <out.png> --size WxH [--anchor N] [--frame N] [--mono]');
	process.exit(1);
}

const [outW, outH] = (flag('size') ?? '').split('x').map(Number);
if (!outW || !outH) {
	console.error('--size WxH is required');
	process.exit(1);
}

const anchor = Number(flag('anchor', '0.5'));
const frameNo = Number(flag('frame', '0'));
const mono = has('mono');
const amount = Number(flag('sharpen', mono ? '0.50' : '0.45'));
const contrast = Number(flag('contrast', mono ? '1.22' : '1.08'));

const FFMPEG = ['remotion', 'ffmpeg'];
const ff = (args) => execFileSync('npx', [...FFMPEG, '-hide_banner', '-loglevel', 'error', ...args]);

const work = mkdtempSync(join(tmpdir(), 'prep-'));
const framePng = join(work, 'frame.png');

// --- pull one frame out with ffmpeg, then stay in Node -----------------------------
// Remotion's ffmpeg is built without the `select` filter, so frames are reached by
// seeking rather than filtering. --frame is interpreted against --fps (default 30).
const seek = frameNo > 0 ? ['-ss', String(frameNo / Number(flag('fps', '30')))] : [];
ff([...seek, '-i', src, '-frames:v', '1', '-y', framePng]);
const decoded = decodePng(readFileSync(framePng));
const pix = decoded.data;
const srcW = decoded.width;
const srcH = decoded.height;

const at = (x, y, c) => pix[(y * srcW + x) * 3 + c];

// --- centre-crop to the output aspect, with a vertical anchor ----------------------
const targetAspect = outW / outH;
let cropW = srcW;
let cropH = Math.round(srcW / targetAspect);
if (cropH > srcH) {
	cropH = srcH;
	cropW = Math.round(srcH * targetAspect);
}
const cropX = Math.round((srcW - cropW) / 2);
const cropY = Math.round((srcH - cropH) * anchor);

// --- bilinear resize into the slot -------------------------------------------------
const rgb = new Float64Array(outW * outH * 3);
for (let y = 0; y < outH; y++) {
	const sy = cropY + ((y + 0.5) * cropH) / outH - 0.5;
	const y0 = Math.max(cropY, Math.min(cropY + cropH - 1, Math.floor(sy)));
	const y1 = Math.min(cropY + cropH - 1, y0 + 1);
	const fy = Math.max(0, Math.min(1, sy - y0));
	for (let x = 0; x < outW; x++) {
		const sx = cropX + ((x + 0.5) * cropW) / outW - 0.5;
		const x0 = Math.max(cropX, Math.min(cropX + cropW - 1, Math.floor(sx)));
		const x1 = Math.min(cropX + cropW - 1, x0 + 1);
		const fx = Math.max(0, Math.min(1, sx - x0));
		for (let c = 0; c < 3; c++) {
			const top = at(x0, y0, c) * (1 - fx) + at(x1, y0, c) * fx;
			const bot = at(x0, y1, c) * (1 - fx) + at(x1, y1, c) * fx;
			rgb[(y * outW + x) * 3 + c] = top * (1 - fy) + bot * fy;
		}
	}
}

// --- luminance and a 3x3 box blur of it --------------------------------------------
const lum = new Float64Array(outW * outH);
for (let i = 0; i < outW * outH; i++) {
	lum[i] = (0.2126 * rgb[i * 3] + 0.7152 * rgb[i * 3 + 1] + 0.0722 * rgb[i * 3 + 2]) / 255;
}
const blur = new Float64Array(outW * outH);
for (let y = 0; y < outH; y++) {
	for (let x = 0; x < outW; x++) {
		let sum = 0;
		let n = 0;
		for (let dy = -1; dy <= 1; dy++) {
			for (let dx = -1; dx <= 1; dx++) {
				const yy = y + dy;
				const xx = x + dx;
				if (yy < 0 || yy >= outH || xx < 0 || xx >= outW) continue;
				sum += lum[yy * outW + xx];
				n++;
			}
		}
		blur[y * outW + x] = sum / n;
	}
}

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const result = Buffer.alloc(outW * outH * 3);

if (mono) {
	// Shadow rgb(16,16,19) -> highlight rgb(250,250,251). Mapping onto a neutral ramp is
	// what keeps the plate inside the palette: no hue is introduced, so the portrait reads
	// as part of the same system as the type and the chart.
	const SHADOW = [16, 16, 19];
	const HIGH = [250, 250, 251];
	for (let i = 0; i < outW * outH; i++) {
		let v = lum[i] + amount * (lum[i] - blur[i]);
		v = (v - 0.5) * contrast + 0.5;
		v = Math.pow(clamp01(v), 0.94); // shadow lift
		for (let c = 0; c < 3; c++) result[i * 3 + c] = Math.round(SHADOW[c] + (HIGH[c] - SHADOW[c]) * v);
	}
} else {
	// Scaling all three channels by a shared luminance ratio sharpens without shifting
	// hue; sharpening each channel independently fringes the skin tones.
	for (let i = 0; i < outW * outH; i++) {
		const boost = 1 + amount * ((lum[i] - blur[i]) / Math.max(lum[i], 0.04));
		for (let c = 0; c < 3; c++) {
			let v = (rgb[i * 3 + c] * boost) / 255;
			v = (v - 0.5) * contrast + 0.5;
			result[i * 3 + c] = Math.round(clamp01(v) * 255);
		}
	}
}

mkdirSync(dirname(resolve(out)), {recursive: true});
writeFileSync(resolve(out), encodePng(outW, outH, result));
rmSync(work, {recursive: true, force: true});

console.log(
	`${out}  ${outW}x${outH}  from ${srcW}x${srcH} frame ${frameNo}` +
		`  crop ${cropW}x${cropH}+${cropX}+${cropY}  ${mono ? 'mono' : 'colour'}`,
);
