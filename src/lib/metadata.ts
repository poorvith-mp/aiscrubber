/**
 * AIScrubber Metadata Desk — EXIF / IPTC / XMP / C2PA Provenance Engine
 * 100% Client-Side / Zero-Telemetry
 */

import exifr from 'exifr';
import piexif from 'piexifjs';

export interface MetadataField {
  tag: string;
  category: 'camera' | 'location' | 'document' | 'author' | 'technical' | 'c2pa' | 'ai';
  label: string;
  value: string;
  isSensitive?: boolean;
}

export interface C2paProvenance {
  hasManifest: boolean;
  signer: string | null;
  generator: string | null;
  claimAction: string | null;
  timestamp: string | null;
  signatureDigest: string | null;
  aiPrompt: string | null;
  rawJson?: string | null;
}

export interface FileMetadataAnalysis {
  fileName: string;
  fileSize: number;
  mimeType: string;
  fields: MetadataField[];
  threats: string[];
  gpsCoordinates?: {
    latitude: number;
    longitude: number;
    altitude?: number;
    googleMapsUrl: string;
  };
  c2pa?: C2paProvenance;
}

// CRC32 table for PNG chunk generation
const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c;
  }
  return table;
})();

function crc32(buf: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = CRC_TABLE[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function createPngChunk(type: string, data: Uint8Array): Uint8Array {
  const typeBytes = new TextEncoder().encode(type);
  const chunkLen = 4 + 4 + data.length + 4;
  const chunk = new Uint8Array(chunkLen);
  const view = new DataView(chunk.buffer);

  view.setUint32(0, data.length);
  chunk.set(typeBytes, 4);
  chunk.set(data, 8);

  const crcTarget = chunk.subarray(4, 8 + data.length);
  const crcVal = crc32(crcTarget);
  view.setUint32(8 + data.length, crcVal);

  return chunk;
}

function createPngTextChunk(keyword: string, text: string): Uint8Array {
  const kwBytes = new TextEncoder().encode(keyword);
  const txtBytes = new TextEncoder().encode(text);
  const data = new Uint8Array(kwBytes.length + 1 + txtBytes.length);
  data.set(kwBytes, 0);
  data[kwBytes.length] = 0; // null separator
  data.set(txtBytes, kwBytes.length + 1);
  return createPngChunk('tEXt', data);
}

function parsePngTextChunks(bytes: Uint8Array): Record<string, string> {
  const result: Record<string, string> = {};
  let offset = 8;

  while (offset + 8 <= bytes.length) {
    const view = new DataView(bytes.buffer, bytes.byteOffset + offset, 8);
    const length = view.getUint32(0);
    const type = String.fromCharCode(
      bytes[offset + 4],
      bytes[offset + 5],
      bytes[offset + 6],
      bytes[offset + 7]
    );

    if (type === 'tEXt' && offset + 8 + length <= bytes.length) {
      const chunkData = bytes.subarray(offset + 8, offset + 8 + length);
      const nullIdx = chunkData.indexOf(0);
      if (nullIdx !== -1) {
        const keyword = new TextDecoder('latin1').decode(chunkData.subarray(0, nullIdx));
        const text = new TextDecoder('utf-8').decode(chunkData.subarray(nullIdx + 1));
        result[keyword] = text;
      }
    } else if (type === 'IEND') {
      break;
    }

    offset += 8 + length + 4;
  }

  return result;
}

function stripJpegApp11Segments(bytes: Uint8Array): Uint8Array {
  const cleaned: number[] = [];
  let i = 0;
  while (i < bytes.length) {
    if (i < bytes.length - 3 && bytes[i] === 0xff && bytes[i + 1] === 0xeb) {
      const segLen = (bytes[i + 2] << 8) + bytes[i + 3];
      i += 2 + segLen;
    } else {
      cleaned.push(bytes[i]);
      i++;
    }
  }
  return new Uint8Array(cleaned);
}

function stripPngMetadataChunks(bytes: Uint8Array): Uint8Array {
  if (bytes.length < 8 || bytes[0] !== 0x89 || bytes[1] !== 0x50) return bytes;

  const resultChunks: Uint8Array[] = [bytes.subarray(0, 8)];
  let offset = 8;

  while (offset + 8 <= bytes.length) {
    const view = new DataView(bytes.buffer, bytes.byteOffset + offset, 8);
    const length = view.getUint32(0);
    const type = String.fromCharCode(
      bytes[offset + 4],
      bytes[offset + 5],
      bytes[offset + 6],
      bytes[offset + 7]
    );
    const totalChunkLen = 8 + length + 4;

    if (offset + totalChunkLen > bytes.length) break;

    const isMetaChunk = ['tEXt', 'iTXt', 'zTXt', 'caPI', 'c2pa', 'jumb', 'eXIf'].includes(type);
    if (!isMetaChunk) {
      resultChunks.push(bytes.subarray(offset, offset + totalChunkLen));
    }

    if (type === 'IEND') break;
    offset += totalChunkLen;
  }

  const totalLen = resultChunks.reduce((acc, c) => acc + c.length, 0);
  const out = new Uint8Array(totalLen);
  let cur = 0;
  for (const c of resultChunks) {
    out.set(c, cur);
    cur += c.length;
  }
  return out;
}

export function stripWebpMetadataChunks(bytes: Uint8Array): Uint8Array {
  if (bytes.length < 12) return bytes;
  const riff = String.fromCharCode(...bytes.subarray(0, 4));
  const webp = String.fromCharCode(...bytes.subarray(8, 12));
  if (riff !== 'RIFF' || webp !== 'WEBP') return bytes;

  const resultChunks: Uint8Array[] = [bytes.subarray(0, 12)];
  let offset = 12;
  const removable = new Set(['EXIF', 'XMP ']);
  let totalLength = 12;

  while (offset + 8 <= bytes.length) {
    const chunkType = String.fromCharCode(...bytes.subarray(offset, offset + 4));
    const view = new DataView(bytes.buffer, bytes.byteOffset + offset + 4, 4);
    const chunkSize = view.getUint32(0, true);
    const paddedSize = 8 + chunkSize + (chunkSize % 2);
    if (offset + 8 + chunkSize > bytes.length) break;

    const chunkData = bytes.subarray(offset, Math.min(offset + paddedSize, bytes.length));
    if (!removable.has(chunkType)) {
      if (chunkType === 'VP8X' && chunkData.length >= 9) {
        const modified = new Uint8Array(chunkData);
        modified[8] = modified[8] & ~0x0c;
        resultChunks.push(modified);
        totalLength += modified.length;
      } else {
        resultChunks.push(chunkData);
        totalLength += chunkData.length;
      }
    }
    offset += paddedSize;
  }

  const out = new Uint8Array(totalLength);
  let cur = 0;
  for (const c of resultChunks) {
    out.set(c, cur);
    cur += c.length;
  }
  const view = new DataView(out.buffer, out.byteOffset, out.byteLength);
  view.setUint32(4, out.length - 8, true);
  return out;
}

export async function detectC2paProvenance(file: File): Promise<C2paProvenance> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const isPng = file.type === 'image/png' || /\.png$/i.test(file.name) || (bytes[0] === 0x89 && bytes[1] === 0x50);
  const isJpeg = file.type === 'image/jpeg' || file.type === 'image/jpg' || /\.jpe?g$/i.test(file.name) || (bytes[0] === 0xff && bytes[1] === 0xd8);

  let hasC2paMarker = false;

  if (isPng && bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50) {
    let offset = 8;
    while (offset + 8 <= bytes.length) {
      const view = new DataView(bytes.buffer, bytes.byteOffset + offset, 8);
      const length = view.getUint32(0);
      const type = String.fromCharCode(...bytes.subarray(offset + 4, offset + 8));
      if (['caPI', 'c2pa', 'jumb'].includes(type)) {
        hasC2paMarker = true;
        break;
      }
      const chunkLength = 12 + length;
      if (chunkLength <= 12 || offset + chunkLength > bytes.length) break;
      offset += chunkLength;
    }
  }

  if (isJpeg) {
    for (let i = 0; i < bytes.length - 3; i++) {
      if (bytes[i] === 0xff && bytes[i + 1] === 0xeb) {
        hasC2paMarker = true;
        break;
      }
    }
  }

  return {
    hasManifest: hasC2paMarker,
    signer: null,
    generator: null,
    claimAction: null,
    timestamp: null,
    signatureDigest: null,
    aiPrompt: null,
  };
}

export async function parseFileMetadata(file: File): Promise<FileMetadataAnalysis> {
  const fields: MetadataField[] = [];
  const threats: string[] = [];
  let gpsCoordinates: FileMetadataAnalysis['gpsCoordinates'];

  const mimeType = file.type || 'application/octet-stream';
  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);

  const c2pa = await detectC2paProvenance(file);
  if (c2pa.hasManifest) {
    threats.push('C2PA-compatible metadata marker detected');
    fields.push({
      tag: 'C2PA_Marker',
      category: 'c2pa',
      label: 'C2PA-compatible marker',
      value: 'Present (signature verification is not available in-browser)',
      isSensitive: true,
    });
  }

  if (file.type.startsWith('image/')) {
    try {
      const rawExifData = await exifr.parse(arrayBuffer, {
        tiff: true,
        xmp: true,
        icc: true,
        iptc: true,
        jfif: true,
        ihdr: true,
      });

      if (rawExifData) {
        for (const [key, rawVal] of Object.entries(rawExifData)) {
          if (rawVal === undefined || rawVal === null) continue;
          if (['latitude', 'longitude', 'altitude'].includes(key)) continue;
          const val = typeof rawVal === 'object' ? JSON.stringify(rawVal) : String(rawVal);
          const lowerKey = key.toLowerCase();

          let category: MetadataField['category'] = 'technical';
          let isSensitive = false;
          let tag = key;

          if (key === 'ImageDescription') {
            tag = 'Title';
          }

          if (['make', 'model', 'lensmodel', 'focallength', 'fnumber', 'iso'].some((k) => lowerKey.includes(k))) {
            category = 'camera';
          } else if (['artist', 'creator', 'author', 'by-line', 'copyright'].some((k) => lowerKey.includes(k))) {
            category = 'author';
            isSensitive = true;
            threats.push('Author identifier exposed: ' + key + ' = ' + val);
          } else if (['software', 'modifydate', 'createdate', 'documentid', 'imagedescription'].some((k) => lowerKey.includes(k))) {
            category = 'document';
          }

          fields.push({
            tag,
            category,
            label: tag.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase()),
            value: val,
            isSensitive,
          });
        }

        if (rawExifData.latitude !== undefined && rawExifData.longitude !== undefined) {
          gpsCoordinates = {
            latitude: Number(rawExifData.latitude),
            longitude: Number(rawExifData.longitude),
            altitude: rawExifData.altitude ? Number(rawExifData.altitude) : undefined,
            googleMapsUrl: 'https://www.google.com/maps?q=' + rawExifData.latitude + ',' + rawExifData.longitude,
          };
          threats.push('EXACT GPS COORDINATES exposed: ' + gpsCoordinates.latitude.toFixed(6) + ', ' + gpsCoordinates.longitude.toFixed(6));
          fields.push({
            tag: 'GPSCoordinates',
            category: 'location',
            label: 'GPS Location',
            value: gpsCoordinates.latitude.toFixed(6) + ', ' + gpsCoordinates.longitude.toFixed(6),
            isSensitive: true,
          });
        }
      }
    } catch (err) {
      console.warn('Image metadata parse failed:', err);
    }
  }

  if (file.type === 'image/png' || file.name.match(/\.png$/i) || (bytes[0] === 0x89 && bytes[1] === 0x50)) {
    const textChunks = parsePngTextChunks(bytes);
    for (const [k, v] of Object.entries(textChunks)) {
      fields.push({
        tag: 'PNG_' + k,
        category: 'document',
        label: 'PNG ' + k,
        value: v,
        isSensitive: ['author', 'prompt', 'parameters', 'software'].includes(k.toLowerCase()),
      });
      if (['prompt', 'parameters'].includes(k.toLowerCase())) {
        threats.push('Embedded AI Generation Prompt exposed in PNG: ' + v.slice(0, 80));
      }
    }
  }

  if (file.type === 'application/pdf' || file.name.match(/\.pdf$/i)) {
    const textContent = new TextDecoder('latin1').decode(bytes.subarray(0, Math.min(bytes.length, 300000)));
    const authorMatch = textContent.match(/\/Author\s*\(([^)]+)\)/);
    if (authorMatch) {
      threats.push('PDF Author exposed: ' + authorMatch[1]);
      fields.push({ tag: 'PDF_Author', category: 'author', label: 'PDF Author', value: authorMatch[1], isSensitive: true });
    }

    const creatorMatch = textContent.match(/\/Creator\s*\(([^)]+)\)/);
    if (creatorMatch) {
      fields.push({ tag: 'PDF_Creator', category: 'document', label: 'PDF Creator Tool', value: creatorMatch[1] });
    }

    const titleMatch = textContent.match(/\/Title\s*\(([^)]+)\)/);
    if (titleMatch) {
      fields.push({ tag: 'PDF_Title', category: 'document', label: 'PDF Document Title', value: titleMatch[1] });
    }
  }

  const uniqueFields: MetadataField[] = [];
  const seenTags = new Set<string>();
  for (const f of fields) {
    if (!seenTags.has(f.tag)) {
      seenTags.add(f.tag);
      uniqueFields.push(f);
    }
  }

  return {
    fileName: file.name,
    fileSize: file.size,
    mimeType,
    fields: uniqueFields,
    threats,
    gpsCoordinates,
    c2pa,
  };
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export interface MetadataEditPayload {
  Author?: string;
  Title?: string;
  Software?: string;
  Copyright?: string;
}

export async function applyMetadataEdits(
  file: File,
  edits: MetadataEditPayload
): Promise<Blob | File> {
  const mimeType = file.type || '';

  if (mimeType === 'image/jpeg' || mimeType === 'image/jpg' || file.name.match(/\.jpe?g$/i)) {
    try {
      const dataUrl = await fileToDataUrl(file);
      let cleanDataUrl = dataUrl;
      try {
        cleanDataUrl = piexif.remove(dataUrl);
      } catch {
        cleanDataUrl = dataUrl;
      }

      const authorName = edits.Author || '';
      const softwareName = edits.Software || '';
      const titleName = edits.Title || '';
      const copyrightName = edits.Copyright || '';

      const zeroth: Record<number, string> = {};
      if (authorName) zeroth[piexif.ImageIFD.Artist] = authorName;
      if (titleName) zeroth[piexif.ImageIFD.ImageDescription] = titleName;
      if (softwareName) zeroth[piexif.ImageIFD.Software] = softwareName;
      if (copyrightName) zeroth[piexif.ImageIFD.Copyright] = copyrightName;

      const exifObj = { '0th': zeroth, Exif: {}, GPS: {}, '1st': {}, Interop: {} };
      const exifBytes = piexif.dump(exifObj);
      const withExifDataUrl = piexif.insert(exifBytes, cleanDataUrl);

      const base64Data = withExifDataUrl.replace(/^data:image\/jpeg;base64,/, '');
      const binaryString = atob(base64Data);
      const rawBytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        rawBytes[i] = binaryString.charCodeAt(i);
      }

      const bytes = stripJpegApp11Segments(rawBytes);
      return new Blob([bytes as unknown as BlobPart], { type: 'image/jpeg' });
    } catch (err) {
      console.error('Failed to inject JPEG EXIF:', err);
    }
  }

  if (mimeType === 'image/png' || file.name.match(/\.png$/i)) {
    try {
      const buffer = await file.arrayBuffer();
      const originalBytes = new Uint8Array(buffer);
      const cleanPngBytes = stripPngMetadataChunks(originalBytes);

      if (cleanPngBytes.length > 33 && cleanPngBytes[0] === 0x89 && cleanPngBytes[1] === 0x50) {
        const ihdrEndOffset = 8 + 4 + 4 + 13 + 4;
        const chunksToInsert: Uint8Array[] = [];

        const authorName = edits.Author || '';
        const softwareName = edits.Software || '';
        const titleName = edits.Title || '';
        const copyrightName = edits.Copyright || '';

        if (authorName) chunksToInsert.push(createPngTextChunk('Author', authorName));
        if (titleName) chunksToInsert.push(createPngTextChunk('Title', titleName));
        if (softwareName) chunksToInsert.push(createPngTextChunk('Software', softwareName));
        if (copyrightName) chunksToInsert.push(createPngTextChunk('Copyright', copyrightName));

        const totalInsertSize = chunksToInsert.reduce((acc, c) => acc + c.length, 0);
        const newPngBytes = new Uint8Array(cleanPngBytes.length + totalInsertSize);

        newPngBytes.set(cleanPngBytes.subarray(0, ihdrEndOffset), 0);
        let curOffset = ihdrEndOffset;
        for (const chunk of chunksToInsert) {
          newPngBytes.set(chunk, curOffset);
          curOffset += chunk.length;
        }
        newPngBytes.set(cleanPngBytes.subarray(ihdrEndOffset), curOffset);

        return new Blob([newPngBytes as unknown as BlobPart], { type: 'image/png' });
      }
    } catch (err) {
      console.error('Failed to inject PNG chunks:', err);
    }
  }

  return file;
}

export async function stripMetadataUniversal(file: File): Promise<Blob | File> {
  const mimeType = file.type || '';

  if (mimeType === 'image/jpeg' || mimeType === 'image/jpg' || file.name.match(/\.jpe?g$/i)) {
    try {
      const dataUrl = await fileToDataUrl(file);
      let strippedDataUrl = piexif.remove(dataUrl);

      const base64Data = strippedDataUrl.replace(/^data:image\/jpeg;base64,/, '');
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const cleaned = stripJpegApp11Segments(bytes);
      return new Blob([cleaned as unknown as BlobPart], { type: 'image/jpeg' });
    } catch {
      // Canvas fallback
    }
  }

  if (mimeType === 'image/png' || file.name.match(/\.png$/i)) {
    const bytes = new Uint8Array(await file.arrayBuffer());
    return new Blob([stripPngMetadataChunks(bytes) as unknown as BlobPart], { type: 'image/png' });
  }

  if (file.type.startsWith('image/')) {
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          URL.revokeObjectURL(url);
          resolve(file);
          return;
        }
        ctx.drawImage(img, 0, 0);
        canvas.toBlob((blob) => {
          URL.revokeObjectURL(url);
          if (blob) resolve(blob);
          else resolve(file);
        }, file.type || 'image/png');
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(file);
      };
      img.src = url;
    });
  }

  return file;
}
