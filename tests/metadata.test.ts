import { afterEach, describe, expect, test, vi } from 'vitest';
import exifr from 'exifr';
import { applyMetadataEdits, detectC2paProvenance, parseFileMetadata, stripMetadataUniversal } from '../src/lib/metadata';

vi.mock('exifr', () => ({ default: { parse: vi.fn() } }));
afterEach(() => {
  vi.mocked(exifr.parse).mockReset();
  vi.unstubAllGlobals();
});

function fileLike(name: string, type: string, bytes: Uint8Array) {
  return {
    name,
    type,
    size: bytes.byteLength,
    arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
  } as File;
}

const pngBytes = () => new Uint8Array(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64'));
const jpegBytes = () => new Uint8Array(Buffer.from('/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////2wBDAf//////////////////////////////////////////////////////////////////////////////////////wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAX/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIQAxAAAAF//8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABBQJ//8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAgBAwEBPwF//8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAgBAgEBPwF//8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQAGPwJ//8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPyF//9oADAMBAAIAAwAAABD/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oACAEDAQE/EF//xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oACAECAQE/EF//xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oACAEBAAE/EF//2Q==', 'base64'));

describe('metadata engine', () => {
  test('writes, detects, parses, and strips PNG text and C2PA chunks', async () => {
    const edited = await applyMetadataEdits(fileLike('pixel.png', 'image/png', pngBytes()), {
      Author: 'Test Author',
      Title: 'Synthetic Fixture',
      c2paSigner: 'Fixture Authority',
      c2paGenerator: 'AIScrubber Test',
      signWithC2pa: true,
    });
    const bytes = new Uint8Array(await edited.arrayBuffer());
    const file = fileLike('edited.png', 'image/png', bytes);
    const provenance = await detectC2paProvenance(file);
    expect(provenance.signer).toBe('Fixture Authority');
    const analysis = await parseFileMetadata(file);
    expect(analysis.fields.some(({ value }) => value === 'Test Author')).toBe(true);

    const stripped = await stripMetadataUniversal(file);
    const strippedFile = fileLike('stripped.png', 'image/png', new Uint8Array(await stripped.arrayBuffer()));
    expect((await detectC2paProvenance(strippedFile)).hasManifest).toBe(false);
  });

  test('parses, edits, and strips PDF document metadata', async () => {
    const source = new TextEncoder().encode('%PDF-1.4 /Info 2 0 R /Author (Alice) /Creator (Tool) /Producer (PDF) /Title (Draft) /CreationDate (Now)');
    const file = fileLike('draft.pdf', 'application/pdf', source);
    const analysis = await parseFileMetadata(file);
    expect(analysis.threats).toContain('PDF Author exposed: Alice');
    const edited = await applyMetadataEdits(file, { Author: 'Bob', Title: 'Clean', Software: 'AIScrubber' });
    expect(new TextDecoder().decode(await edited.arrayBuffer())).toContain('/Author (Bob)');
    const stripped = await stripMetadataUniversal(file);
    const text = new TextDecoder().decode(await stripped.arrayBuffer());
    expect(text).toContain('/Author ()');
    expect(text).toContain('/Info null');
  });

  test('maps standard provenance signatures and embedded prompts', async () => {
    const fixtures = [
      ['OpenAI prompt: private scene', 'OpenAI Inc.'],
      ['Nano Banana prompt: private scene', 'Nano Banana CA'],
      ['Adobe Firefly prompt: private scene', 'Adobe Inc. (Content Authenticity Initiative)'],
      ['Google SynthID prompt: private scene', 'Google LLC'],
      ['Midjourney prompt: private scene', 'Midjourney Inc.'],
      ['c2pa prompt: private scene', 'Verified C2PA Signing Authority'],
    ];
    for (const [source, signer] of fixtures) {
      const provenance = await detectC2paProvenance(fileLike('artifact.bin', 'application/octet-stream', new TextEncoder().encode(source)));
      expect(provenance.signer).toBe(signer);
      expect(provenance.aiPrompt).toBe('private scene');
    }
    const clean = await detectC2paProvenance(fileLike('plain.bin', 'application/octet-stream', new Uint8Array([1, 2, 3])));
    expect(clean.hasManifest).toBe(false);
    expect(clean.signatureDigest).toBeNull();
  });

  test('maps image EXIF, creator, timestamp, and GPS into user-facing findings', async () => {
    vi.mocked(exifr.parse).mockResolvedValue({
      Make: 'FixtureCam',
      Model: 'FC-1',
      Artist: 'Alice',
      ImageDescription: 'Private draft',
      Software: 'Editor',
      Copyright: 'Alice 2026',
      DateTimeOriginal: '2026-08-20',
      latitude: 12.9716,
      longitude: 77.5946,
      altitude: 920,
    });
    const analysis = await parseFileMetadata(fileLike('photo.jpg', 'image/jpeg', new Uint8Array([0xff, 0xd8, 0xff, 0xd9])));
    expect(analysis.fields.map(({ tag }) => tag)).toEqual(expect.arrayContaining(['Make', 'Model', 'Artist', 'Title', 'Software', 'Copyright', 'DateTimeOriginal', 'GPSCoordinates']));
    expect(analysis.gpsCoordinates?.googleMapsUrl).toBe('https://www.google.com/maps?q=12.9716,77.5946');
    expect(analysis.threats.some((threat) => threat.includes('EXACT GPS'))).toBe(true);
  });

  test('returns unknown formats unchanged and handles image parse failures', async () => {
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    vi.mocked(exifr.parse).mockRejectedValue(new Error('unsupported fixture'));
    const bytes = new Uint8Array([9, 8, 7]);
    const unknown = fileLike('archive.bin', 'application/octet-stream', bytes);
    expect(await applyMetadataEdits(unknown, { Author: 'Nobody' })).toBe(unknown);
    expect(await stripMetadataUniversal(unknown)).toBe(unknown);
    const analysis = await parseFileMetadata(fileLike('broken.webp', 'image/webp', bytes));
    expect(analysis.fields).toEqual([]);
    expect(warning).toHaveBeenCalledOnce();
    warning.mockRestore();
  });

  test('recognizes embedded custom provenance and can omit a new PNG signature', async () => {
    const json = '{"issuer":"Local Authority","generator":"Fixture","title":"Draft","action":"created"}';
    const provenance = await detectC2paProvenance(fileLike('payload.bin', 'application/octet-stream', new TextEncoder().encode(json)));
    expect(provenance).toMatchObject({ signer: 'Local Authority', generator: 'Fixture', aiPrompt: 'Draft' });

    const edited = await applyMetadataEdits(fileLike('plain.png', 'image/png', pngBytes()), { signWithC2pa: false, Author: '', Title: '' });
    const editedFile = fileLike('plain.png', 'image/png', new Uint8Array(await edited.arrayBuffer()));
    expect((await detectC2paProvenance(editedFile)).hasManifest).toBe(false);
  });

  test('detects JPEG APP11 provenance and tolerates malformed C2PA segments', async () => {
    const payload = new TextEncoder().encode('JP\0\0' + JSON.stringify({
      signer: 'JPEG Authority',
      generator: 'Fixture Camera',
      title: 'JPEG Prompt',
      action: 'c2pa.created',
    }));
    const length = payload.length + 2;
    const jpeg = new Uint8Array(2 + 4 + payload.length + 2);
    jpeg.set([0xff, 0xd8, 0xff, 0xeb, length >> 8, length & 0xff], 0);
    jpeg.set(payload, 6);
    jpeg.set([0xff, 0xd9], 6 + payload.length);
    const found = await detectC2paProvenance(fileLike('fixture.jpg', 'image/jpeg', jpeg));
    expect(found).toMatchObject({ signer: 'JPEG Authority', generator: 'Fixture Camera', aiPrompt: 'JPEG Prompt' });

    const malformed = new Uint8Array([0xff, 0xd8, 0xff, 0xeb, 0, 8, 1, 2, 3, 4, 0xff, 0xd9]);
    const fallback = await detectC2paProvenance(fileLike('broken.jpg', 'image/jpeg', malformed));
    expect(fallback.hasManifest).toBe(true);
    expect(fallback.signer).toBe('Verified C2PA Signing Authority');
  });

  test('edits and strips JPEG EXIF and APP11 provenance through the browser file boundary', async () => {
    class FixtureFileReader {
      result: string | ArrayBuffer | null = null;
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      readAsDataURL(file: File) {
        file.arrayBuffer().then((buffer) => {
          this.result = `data:image/jpeg;base64,${Buffer.from(buffer).toString('base64')}`;
          this.onload?.();
        }, () => this.onerror?.());
      }
    }
    vi.stubGlobal('FileReader', FixtureFileReader);
    const original = fileLike('photo.jpg', 'image/jpeg', jpegBytes());
    const edited = await applyMetadataEdits(original, {
      Author: 'JPEG Author',
      Title: 'JPEG Title',
      Software: 'AIScrubber Test',
      c2paSigner: 'JPEG Test Authority',
      signWithC2pa: true,
    });
    const editedFile = fileLike('edited.jpg', 'image/jpeg', new Uint8Array(await edited.arrayBuffer()));
    expect((await detectC2paProvenance(editedFile)).signer).toBe('JPEG Test Authority');
    const stripped = await stripMetadataUniversal(editedFile);
    const strippedFile = fileLike('stripped.jpg', 'image/jpeg', new Uint8Array(await stripped.arrayBuffer()));
    expect((await detectC2paProvenance(strippedFile)).hasManifest).toBe(false);

    const unsigned = await applyMetadataEdits(fileLike('fallback.jpeg', '', jpegBytes()), { signWithC2pa: false });
    expect((await detectC2paProvenance(fileLike('unsigned.jpeg', '', new Uint8Array(await unsigned.arrayBuffer())))).hasManifest).toBe(false);
  });

  test('falls back safely when non-PNG images cannot load or draw', async () => {
    class BrokenImage {
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      set src(_value: string) { this.onerror?.(); }
    }
    vi.stubGlobal('Image', BrokenImage);
    vi.stubGlobal('URL', { createObjectURL: () => 'blob:fixture', revokeObjectURL: vi.fn() });
    const source = fileLike('broken.webp', 'image/webp', new Uint8Array([1, 2]));
    expect(await stripMetadataUniversal(source)).toBe(source);
  });

  test('uses filename fallbacks when browsers omit MIME types', async () => {
    const png = fileLike('fallback.PNG', '', pngBytes());
    const editedPng = await applyMetadataEdits(png, {});
    expect((await detectC2paProvenance(fileLike('fallback.PNG', '', new Uint8Array(await editedPng.arrayBuffer())))).hasManifest).toBe(true);
    expect((await stripMetadataUniversal(png)).type).toBe('image/png');

    const pdf = fileLike('fallback.pdf', '', new TextEncoder().encode('%PDF /Author (A) /Creator (B) /Title (C)'));
    expect((await parseFileMetadata(pdf)).fields.length).toBe(3);
    expect((await applyMetadataEdits(pdf, {})).type).toBe('application/pdf');
    expect((await stripMetadataUniversal(pdf)).type).toBe('application/pdf');
  });

  test('falls back when image canvas creation fails and returns a clean re-encode when it succeeds', async () => {
    class LoadedImage {
      naturalWidth = 2;
      naturalHeight = 3;
      width = 2;
      height = 3;
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      set src(_value: string) { this.onload?.(); }
    }
    vi.stubGlobal('Image', LoadedImage);
    vi.stubGlobal('URL', { createObjectURL: () => 'blob:fixture', revokeObjectURL: vi.fn() });
    const source = fileLike('photo.webp', 'image/webp', new Uint8Array([1, 2]));

    vi.stubGlobal('document', { createElement: () => ({ getContext: () => null }) });
    expect(await stripMetadataUniversal(source)).toBe(source);

    const clean = new Blob(['clean'], { type: 'image/webp' });
    const drawImage = vi.fn();
    vi.stubGlobal('document', {
      createElement: () => ({
        width: 0,
        height: 0,
        getContext: () => ({ drawImage }),
        toBlob: (callback: (blob: Blob) => void) => callback(clean),
      }),
    });
    expect(await stripMetadataUniversal(source)).toBe(clean);
    expect(drawImage).toHaveBeenCalledOnce();
  });
});
