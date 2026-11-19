// Only use after drawing the decoded image to a fresh canvas. This removes the
// metadata that some canvas JPEG encoders add; it is not an original-photo decoder.
const MAX_INPUT_BYTES = 20 * 1024 * 1024;
const REMOVE = new Set([0xe1, 0xed, 0xfe]); // EXIF/XMP, IPTC/Photoshop, comments.
const FRAMES = new Set([0xc0, 0xc1, 0xc2]);
const fail = () => { throw new Error('JPEG preparado inválido. Selecione a foto novamente ou exporte uma cópia em JPG.'); };

export function sanitizePreparedJpeg(input) {
  const data = input instanceof Uint8Array ? input : input instanceof ArrayBuffer ? new Uint8Array(input) : null;
  if (!data || data.length < 4 || data.length > MAX_INPUT_BYTES || data[0] !== 0xff || data[1] !== 0xd8) fail();
  const parts = [data.subarray(0, 2)];
  let at = 2, frame = false, scans = 0, ended = false;
  const components = new Set();
  while (at < data.length) {
    const start = at;
    if (data[at++] !== 0xff) fail();
    while (at < data.length && data[at] === 0xff) at++;
    if (at >= data.length) fail();
    const marker = data[at++];
    if (marker === 0xd9) {
      if (!frame || !scans || at !== data.length) fail();
      parts.push(data.subarray(start, at)); ended = true; break;
    }
    // Canvas outputs DCT JPEGs: frame, Huffman/quantization/restart tables,
    // application segments, comments and one or more entropy-coded scans.
    if (!(FRAMES.has(marker) || [0xc4, 0xdb, 0xdd, 0xda].includes(marker) || marker >= 0xe0 && marker <= 0xef || marker === 0xfe)) fail();
    if (at + 2 > data.length) fail();
    const length = data[at] * 256 + data[at + 1], end = at + length;
    if (length < 2 || end > data.length) fail();
    if (FRAMES.has(marker)) {
      if (frame || scans || length < 11) fail();
      const count = data[at + 7], height = data[at + 3] * 256 + data[at + 4], width = data[at + 5] * 256 + data[at + 6];
      if (data[at + 2] !== 8 || !width || !height || count < 1 || count > 4 || length !== 8 + 3 * count) fail();
      for (let i = 0; i < count; i++) {
        const id = data[at + 8 + i * 3];
        if (components.has(id)) fail();
        components.add(id);
      }
      frame = true;
    }
    if (marker === 0xdd && length !== 4) fail();
    if (marker === 0xda) {
      const count = data[at + 2];
      if (!frame || count < 1 || count > components.size || length !== 6 + 2 * count) fail();
      const selected = new Set();
      for (let i = 0; i < count; i++) {
        const id = data[at + 3 + i * 2];
        if (!components.has(id) || selected.has(id)) fail();
        selected.add(id);
      }
      const spectralStart = data[end - 3], spectralEnd = data[end - 2];
      if (spectralStart > spectralEnd || spectralEnd > 63) fail();
    }
    if (!REMOVE.has(marker)) parts.push(data.subarray(start, end));
    at = end;
    if (marker !== 0xda) continue;
    scans++;
    const entropyStart = at;
    while (at < data.length) {
      if (data[at] !== 0xff) { at++; continue; }
      const candidate = at++;
      while (at < data.length && data[at] === 0xff) at++;
      if (at >= data.length) fail();
      const code = data[at];
      if (code === 0x00) {
        if (at !== candidate + 1) fail(); // Byte stuffing is exactly FF 00.
        at++; continue;
      }
      if (code >= 0xd0 && code <= 0xd7) { at++; continue; }
      at = candidate; break;
    }
    if (at === entropyStart || at >= data.length) fail();
    parts.push(data.subarray(entropyStart, at));
  }
  if (!ended) fail();
  const result = new Uint8Array(parts.reduce((total, part) => total + part.length, 0));
  let offset = 0;
  for (const part of parts) { result.set(part, offset); offset += part.length; }
  return result;
}
