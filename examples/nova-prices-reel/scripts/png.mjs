// A minimal PNG codec — 8-bit RGB/RGBA, non-interlaced.
//
// Remotion's bundled ffmpeg has no rawvideo muxer, so pixels cannot round-trip through it.
// Decoding and encoding here keeps the whole pixel pipeline in one place and lets the
// brief's portrait recipes be implemented as the per-pixel arithmetic they actually are.

import {deflateSync, inflateSync} from 'node:zlib';

const CRC = (() => {
	const t = new Int32Array(256);
	for (let n = 0; n < 256; n++) {
		let c = n;
		for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
		t[n] = c;
	}
	return t;
})();

const crc32 = (buf) => {
	let c = 0xffffffff;
	for (let i = 0; i < buf.length; i++) c = CRC[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
	return (c ^ 0xffffffff) >>> 0;
};

const paeth = (a, b, c) => {
	const p = a + b - c;
	const pa = Math.abs(p - a);
	const pb = Math.abs(p - b);
	const pc = Math.abs(p - c);
	return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
};

/** @returns {{width:number,height:number,data:Buffer}} data is tightly packed RGB. */
export const decodePng = (buf) => {
	if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error('not a PNG');
	let pos = 8;
	let width = 0;
	let height = 0;
	let channels = 0;
	const idat = [];

	while (pos < buf.length) {
		const len = buf.readUInt32BE(pos);
		const type = buf.toString('ascii', pos + 4, pos + 8);
		const body = buf.subarray(pos + 8, pos + 8 + len);
		if (type === 'IHDR') {
			width = body.readUInt32BE(0);
			height = body.readUInt32BE(4);
			const depth = body[8];
			const colorType = body[9];
			if (depth !== 8) throw new Error(`unsupported bit depth ${depth}`);
			if (body[12] !== 0) throw new Error('interlaced PNGs are not supported');
			channels = colorType === 2 ? 3 : colorType === 6 ? 4 : 0;
			if (!channels) throw new Error(`unsupported colour type ${colorType}`);
		} else if (type === 'IDAT') {
			idat.push(body);
		} else if (type === 'IEND') break;
		pos += 12 + len;
	}

	const raw = inflateSync(Buffer.concat(idat));
	const stride = width * channels;
	const out = Buffer.alloc(width * height * 3);
	let prev = Buffer.alloc(stride);

	for (let y = 0; y < height; y++) {
		const filter = raw[y * (stride + 1)];
		const line = Buffer.from(raw.subarray(y * (stride + 1) + 1, y * (stride + 1) + 1 + stride));
		for (let i = 0; i < stride; i++) {
			const a = i >= channels ? line[i - channels] : 0;
			const b = prev[i];
			const c = i >= channels ? prev[i - channels] : 0;
			if (filter === 1) line[i] = (line[i] + a) & 0xff;
			else if (filter === 2) line[i] = (line[i] + b) & 0xff;
			else if (filter === 3) line[i] = (line[i] + ((a + b) >> 1)) & 0xff;
			else if (filter === 4) line[i] = (line[i] + paeth(a, b, c)) & 0xff;
		}
		for (let x = 0; x < width; x++) {
			out[(y * width + x) * 3] = line[x * channels];
			out[(y * width + x) * 3 + 1] = line[x * channels + 1];
			out[(y * width + x) * 3 + 2] = line[x * channels + 2];
		}
		prev = line;
	}

	return {width, height, data: out};
};

const chunk = (type, body) => {
	const head = Buffer.alloc(8);
	head.writeUInt32BE(body.length, 0);
	head.write(type, 4, 'ascii');
	const crcBuf = Buffer.alloc(4);
	crcBuf.writeUInt32BE(crc32(Buffer.concat([Buffer.from(type, 'ascii'), body])), 0);
	return Buffer.concat([head, body, crcBuf]);
};

/** Encodes tightly packed RGB. Filter 0 throughout — these are small, and deflate does the work. */
export const encodePng = (width, height, rgb) => {
	const stride = width * 3;
	const raw = Buffer.alloc((stride + 1) * height);
	for (let y = 0; y < height; y++) {
		raw[y * (stride + 1)] = 0;
		rgb.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
	}
	const ihdr = Buffer.alloc(13);
	ihdr.writeUInt32BE(width, 0);
	ihdr.writeUInt32BE(height, 4);
	ihdr[8] = 8;
	ihdr[9] = 2; // truecolour
	return Buffer.concat([
		Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
		chunk('IHDR', ihdr),
		chunk('IDAT', deflateSync(raw, {level: 9})),
		chunk('IEND', Buffer.alloc(0)),
	]);
};
