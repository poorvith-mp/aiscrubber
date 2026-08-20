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

/**
 * Scan PNG binary for caPI or c2pa chunks
 */
function parsePngC2paChunk(bytes: Uint8Array): Record<string, any> | null {
  if (bytes.length < 8 || bytes[0] !== 0x89 || bytes[1] !== 0x50) return null;
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

    if ((type === 'caPI' || type === 'c2pa') && offset + 8 + length <= bytes.length) {
      const chunkData = bytes.subarray(offset + 8, offset + 8 + length);
      const str = new TextDecoder('utf-8').decode(chunkData);
      try {
        return JSON.parse(str);
      } catch {
        const m = str.match(/\{[\s\S]*\}/);
        if (m) {
          try {
            return JSON.parse(m[0]);
          } catch {}
        }
      }
    }
    if (type === 'IEND') break;
    offset += 8 + length + 4;
  }
  return null;
}

/**
 * Scan JPEG binary for APP11 (0xFFEB) C2PA segments
 */
function parseJpegC2paSegment(bytes: Uint8Array): Record<string, any> | null {
  for (let i = 0; i < bytes.length - 4; i++) {
    if (bytes[i] === 0xff && bytes[i + 1] === 0xeb) {
      const segLen = (bytes[i + 2] << 8) + bytes[i + 3];
      if (i + 2 + segLen <= bytes.length) {
        const segData = bytes.subarray(i + 4, i + 2 + segLen);
        const str = new TextDecoder('latin1').decode(segData);
        const jsonMatch = str.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            return JSON.parse(jsonMatch[0]);
          } catch {}
        }
      }
    }
  }
  return null;
}

/**
 * Native scanner for PNG tEXt chunks fallback
 */
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

/**
 * Strip all pre-existing JPEG APP11 (0xFFEB) C2PA segments from a byte array
 */
function stripJpegApp11Segments(bytes: Uint8Array): Uint8Array {
  const cleaned: number[] = [];
  let i = 0;
  while (i < bytes.length) {
    if (i < bytes.length - 3 && bytes[i] === 0xff && bytes[i + 1] === 0xeb) {
      const segLen = (bytes[i + 2] << 8) + bytes[i + 3];
      i += 2 + segLen; // Skip entire APP11 segment
    } else {
      cleaned.push(bytes[i]);
      i++;
    }
  }
  return new Uint8Array(cleaned);
}

/**
 * Strip all pre-existing PNG metadata chunks (tEXt, iTXt, caPI, c2pa, jumb)
 */
function stripPngMetadataChunks(bytes: Uint8Array): Uint8Array {
  if (bytes.length < 8 || bytes[0] !== 0x89 || bytes[1] !== 0x50) return bytes;

  const resultChunks: Uint8Array[] = [bytes.subarray(0, 8)]; // PNG Signature
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

    // Filter out old metadata chunks
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

/**
 * Detect C2PA Content Credentials & AI Generation Provenance
 */
export async function detectC2paProvenance(file: File): Promise<C2paProvenance> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const textContent = new TextDecoder('latin1').decode(
    bytes.subarray(0, Math.min(bytes.length, 600000))
  );

  let hasC2paMarker = false;
  let signer: string | null = null;
  let generator: string | null = null;
  let claimAction: string | null = null;
  let aiPrompt: string | null = null;

  // 1. Direct Binary Chunk Search for PNG caPI / c2pa chunks
  if (file.type === 'image/png' || file.name.match(/\.png$/i) || (bytes[0] === 0x89 && bytes[1] === 0x50)) {
    const pngC2pa = parsePngC2paChunk(bytes);
    if (pngC2pa && (pngC2pa.signer || pngC2pa.issuer || pngC2pa.generator)) {
      return {
        hasManifest: true,
        signer: pngC2pa.signer || pngC2pa.issuer || 'Custom Author',
        generator: pngC2pa.generator || 'AIScrubber Suite',
        claimAction: pngC2pa.action || 'c2pa.created (Custom Content Credentials)',
        timestamp: pngC2pa.timestamp || new Date().toISOString(),
        signatureDigest: `sha256-${Array.from(bytes.subarray(0, 16)).map((b) => b.toString(16).padStart(2, '0')).join('')}`,
        aiPrompt: pngC2pa.title || pngC2pa.prompt || null,
        rawJson: JSON.stringify(pngC2pa),
      };
    }
  }

  // 2. Direct Binary APP11 Search for JPEG files
  if (file.type === 'image/jpeg' || file.type === 'image/jpg' || file.name.match(/\.jpe?g$/i) || (bytes[0] === 0xff && bytes[1] === 0xd8)) {
    const jpegC2pa = parseJpegC2paSegment(bytes);
    if (jpegC2pa && (jpegC2pa.signer || jpegC2pa.issuer || jpegC2pa.generator)) {
      return {
        hasManifest: true,
        signer: jpegC2pa.signer || jpegC2pa.issuer || 'Custom Author',
        generator: jpegC2pa.generator || 'AIScrubber Suite',
        claimAction: jpegC2pa.action || 'c2pa.created (Custom Content Credentials)',
        timestamp: jpegC2pa.timestamp || new Date().toISOString(),
        signatureDigest: `sha256-${Array.from(bytes.subarray(0, 16)).map((b) => b.toString(16).padStart(2, '0')).join('')}`,
        aiPrompt: jpegC2pa.title || jpegC2pa.prompt || null,
        rawJson: JSON.stringify(jpegC2pa),
      };
    }
  }

  // 3. Scan for any embedded custom JSON block in textContent
  const jsonBlocks = textContent.match(/\{"(?:signer|issuer)":\s*"[^"]+",[\s\S]*?\}/g);
  if (jsonBlocks) {
    for (const block of jsonBlocks) {
      try {
        const parsed = JSON.parse(block);
        if (parsed.signer || parsed.issuer) {
          return {
            hasManifest: true,
            signer: parsed.signer || parsed.issuer,
            generator: parsed.generator || 'AIScrubber Suite',
            claimAction: parsed.action || 'c2pa.created (Custom Content Credentials)',
            timestamp: parsed.timestamp || new Date().toISOString(),
            signatureDigest: `sha256-${Array.from(bytes.subarray(0, 16)).map((b) => b.toString(16).padStart(2, '0')).join('')}`,
            aiPrompt: parsed.title || parsed.prompt || null,
            rawJson: block,
          };
        }
      } catch {}
    }
  }

  // 4. Marker checks for standard platforms
  for (let i = 0; i < bytes.length - 4; i++) {
    if (bytes[i] === 0xff && bytes[i + 1] === 0xeb) {
      hasC2paMarker = true;
      break;
    }
  }
  if (textContent.includes('caPI') || textContent.includes('c2pa') || textContent.includes('jumb') || textContent.includes('JUMBF')) {
    hasC2paMarker = true;
  }

  // 5. Check Frontier AI Platform signatures
  if (textContent.includes('OpenAI') || textContent.includes('DALL-E') || textContent.includes('dall-e')) {
    hasC2paMarker = true;
    signer = 'OpenAI Inc.';
    generator = 'ChatGPT (DALL·E 3)';
    claimAction = 'c2pa.created (AI Synthetic Synthesis)';
  } else if (textContent.includes('Nano Banana') || textContent.includes('nanobanana') || textContent.includes('FLUX.1')) {
    hasC2paMarker = true;
    signer = 'Nano Banana CA';
    generator = 'Nano Banana / FLUX.1';
    claimAction = 'c2pa.ai_generated';
  } else if (textContent.includes('Adobe') || textContent.includes('Firefly')) {
    hasC2paMarker = true;
    signer = 'Adobe Inc. (Content Authenticity Initiative)';
    generator = 'Adobe Firefly Model';
    claimAction = 'c2pa.ai_generated';
  } else if (textContent.includes('Google') || textContent.includes('SynthID') || textContent.includes('Imagen')) {
    hasC2paMarker = true;
    signer = 'Google LLC';
    generator = 'Google Imagen 3 / SynthID';
    claimAction = 'c2pa.ai_generated';
  } else if (textContent.includes('Midjourney')) {
    hasC2paMarker = true;
    signer = 'Midjourney Inc.';
    generator = 'Midjourney v6';
    claimAction = 'c2pa.ai_generated';
  }

  // Extract embedded prompt if present
  if (!aiPrompt) {
    const promptMatch =
      textContent.match(/"prompt":\s*"([^"]+)"/) ||
      textContent.match(/prompt:\s*([^\n\r\t]+)/i) ||
      textContent.match(/parameters\0([^]+?)(?:Negative prompt|Steps:|$)/);

    if (promptMatch && promptMatch[1]) {
      aiPrompt = promptMatch[1].trim().slice(0, 500);
    }
  }

  // Fallback defaults only if a binary C2PA marker was present without recognized author
  if (hasC2paMarker && !signer) {
    signer = 'Verified C2PA Signing Authority';
    generator = 'Generative AI Foundation Model';
    claimAction = 'c2pa.created (Content Credentials)';
  }

  return {
    hasManifest: hasC2paMarker,
    signer,
    generator,
    claimAction,
    timestamp: hasC2paMarker ? new Date().toISOString() : null,
    signatureDigest: hasC2paMarker
      ? `sha256-${Array.from(bytes.subarray(0, 16)).map((b) => b.toString(16).padStart(2, '0')).join('')}`
      : null,
    aiPrompt,
  };
}

/**
 * Universal File Metadata Parser (EXIF, IPTC, XMP, C2PA, GPS, PDF, Audio)
 */
export async function parseFileMetadata(file: File): Promise<FileMetadataAnalysis> {
  const fields: MetadataField[] = [];
  const threats: string[] = [];
  let gpsCoordinates: FileMetadataAnalysis['gpsCoordinates'];

  const mimeType = file.type || 'application/octet-stream';
  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);

  // 1. Check C2PA Provenance first
  const c2pa = await detectC2paProvenance(file);
  if (c2pa.hasManifest) {
    threats.push(`C2PA Content Credentials Manifest active (Signer: ${c2pa.signer})`);
    fields.push({
      tag: 'C2PA_Signer',
      category: 'c2pa',
      label: 'C2PA Signer / Issuer',
      value: c2pa.signer || 'Unknown Authority',
      isSensitive: true,
    });
    fields.push({
      tag: 'C2PA_Generator',
      category: 'c2pa',
      label: 'AI Generator / Tool',
      value: c2pa.generator || 'Generative Engine',
    });
    if (c2pa.claimAction) {
      fields.push({
        tag: 'C2PA_Action',
        category: 'c2pa',
        label: 'C2PA Claim Action',
        value: c2pa.claimAction,
      });
    }
    if (c2pa.aiPrompt) {
      fields.push({
        tag: 'C2PA_Prompt',
        category: 'ai',
        label: 'Embedded AI Prompt',
        value: c2pa.aiPrompt,
        isSensitive: true,
      });
      threats.push('Embedded AI generation prompt discovered in metadata');
    }
  }

  // 2. Universal Image EXIF / IPTC / XMP Parsing via exifr
  if (file.type.startsWith('image/')) {
    try {
      const rawExifData = await exifr.parse(arrayBuffer, {
        tiff: true,
        xmp: true,
        icc: true,
        iptc: true,
        jfif: true,
        mergeOutput: true,
      });

      if (rawExifData) {
        if (rawExifData.Make) {
          fields.push({
            tag: 'Make',
            category: 'camera',
            label: 'Camera Manufacturer',
            value: String(rawExifData.Make),
            isSensitive: true,
          });
        }
        if (rawExifData.Model) {
          fields.push({
            tag: 'Model',
            category: 'camera',
            label: 'Camera Model',
            value: String(rawExifData.Model),
            isSensitive: true,
          });
          threats.push(`Camera/Device model exposed: ${rawExifData.Model}`);
        }
        if (rawExifData.Artist || rawExifData.creator || rawExifData.Author) {
          const val = String(rawExifData.Artist || rawExifData.creator || rawExifData.Author);
          fields.push({ tag: 'Artist', category: 'author', label: 'Creator / Author', value: val, isSensitive: true });
          threats.push(`Author name discovered: ${val}`);
        }
        if (rawExifData.ImageDescription || rawExifData.title || rawExifData.Title || rawExifData.headline) {
          const val = String(rawExifData.ImageDescription || rawExifData.title || rawExifData.Title || rawExifData.headline);
          fields.push({ tag: 'Title', category: 'document', label: 'Document / Image Title', value: val });
        }
        if (rawExifData.Software || rawExifData.CreatorTool) {
          const val = String(rawExifData.Software || rawExifData.CreatorTool);
          fields.push({ tag: 'Software', category: 'technical', label: 'Software Used', value: val, isSensitive: true });
          threats.push(`Editing software fingerprint: ${val}`);
        }
        if (rawExifData.Copyright || rawExifData.rights) {
          const val = String(rawExifData.Copyright || rawExifData.rights);
          fields.push({ tag: 'Copyright', category: 'author', label: 'Copyright Notice', value: val });
        }
        if (rawExifData.DateTimeOriginal || rawExifData.CreateDate) {
          const val = String(rawExifData.DateTimeOriginal || rawExifData.CreateDate);
          fields.push({ tag: 'DateTimeOriginal', category: 'technical', label: 'Date/Time Captured', value: val, isSensitive: true });
          threats.push(`Timestamp exposed: ${val}`);
        }

        // GPS Coordinates
        if (typeof rawExifData.latitude === 'number' && typeof rawExifData.longitude === 'number') {
          const lat = rawExifData.latitude;
          const lon = rawExifData.longitude;
          const alt = typeof rawExifData.altitude === 'number' ? rawExifData.altitude : undefined;

          gpsCoordinates = {
            latitude: lat,
            longitude: lon,
            altitude: alt,
            googleMapsUrl: `https://www.google.com/maps?q=${lat},${lon}`,
          };

          fields.push({
            tag: 'GPSCoordinates',
            category: 'location',
            label: 'Exact GPS Location',
            value: `${lat.toFixed(6)}, ${lon.toFixed(6)}${alt ? ` (Alt: ${alt.toFixed(1)}m)` : ''}`,
            isSensitive: true,
          });
          threats.push(`EXACT GPS COORDINATES FOUND (${lat.toFixed(4)}, ${lon.toFixed(4)})`);
        }
      }
    } catch (err) {
      console.warn('exifr parse notice:', err);
    }

    // 3. Fallback: Parse native PNG tEXt chunks
    if (file.type === 'image/png' || file.name.match(/\.png$/i)) {
      const pngTexts = parsePngTextChunks(bytes);
      for (const [key, val] of Object.entries(pngTexts)) {
        if (!fields.some((f) => f.tag.toLowerCase() === key.toLowerCase())) {
          fields.push({
            tag: key,
            category: 'document',
            label: key,
            value: val,
            isSensitive: key.toLowerCase().includes('author') || key.toLowerCase().includes('prompt'),
          });
        }
      }
    }
  }

  // 4. PDF Metadata Parser
  if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
    const textContent = new TextDecoder('latin1').decode(bytes.subarray(0, Math.min(bytes.length, 100000)));

    const authorMatch = textContent.match(/\/Author\s*\(([^)]+)\)/);
    if (authorMatch) {
      fields.push({ tag: 'PDF_Author', category: 'author', label: 'PDF Author', value: authorMatch[1], isSensitive: true });
      threats.push(`PDF Author exposed: ${authorMatch[1]}`);
    }

    const creatorMatch = textContent.match(/\/Creator\s*\(([^)]+)\)/);
    if (creatorMatch) {
      fields.push({ tag: 'PDF_Creator', category: 'technical', label: 'PDF Creator Tool', value: creatorMatch[1], isSensitive: true });
      threats.push(`PDF Creator tool: ${creatorMatch[1]}`);
    }

    const titleMatch = textContent.match(/\/Title\s*\(([^)]+)\)/);
    if (titleMatch) {
      fields.push({ tag: 'PDF_Title', category: 'document', label: 'PDF Document Title', value: titleMatch[1] });
    }
  }

  // Deduplicate fields by tag
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

/**
 * Convert File to Base64 DataURL
 */
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
  c2paSigner?: string;
  c2paGenerator?: string;
  c2paAction?: string;
  c2paPrompt?: string;
  signWithC2pa?: boolean;
}

/**
 * Apply Custom Metadata Edits & Overwrite C2PA Manifest
 */
export async function applyMetadataEdits(
  file: File,
  edits: MetadataEditPayload
): Promise<Blob> {
  const mimeType = file.type || '';

  // 1. JPEG EXIF & C2PA Injection (piexifjs + APP11 JUMBF segment)
  if (mimeType === 'image/jpeg' || mimeType === 'image/jpg' || file.name.match(/\.jpe?g$/i)) {
    try {
      const dataUrl = await fileToDataUrl(file);

      // Clean existing EXIF first
      let cleanDataUrl = dataUrl;
      try {
        cleanDataUrl = piexif.remove(dataUrl);
      } catch {
        cleanDataUrl = dataUrl;
      }

      const authorName = edits.Author || edits.c2paSigner || 'Poorvith M P';
      const softwareName = edits.Software || edits.c2paGenerator || 'AIScrubber Privacy Suite v2.3.0';
      const titleName = edits.Title || edits.c2paPrompt || file.name.replace(/\.[^/.]+$/, '');
      const copyrightName = edits.Copyright || 'CC-BY 4.0 / All Rights Reserved';

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

      // Strip any old APP11 C2PA segments (e.g. OpenAI / DALL·E 3)
      const bytes = stripJpegApp11Segments(rawBytes);

      // Inject new customized APP11 C2PA segment
      if (edits.signWithC2pa !== false) {
        const c2paSigner = edits.c2paSigner || authorName;
        const c2paGenerator = edits.c2paGenerator || softwareName;
        const c2paAction = edits.c2paAction || 'c2pa.created (Custom Content Credentials)';
        const c2paTitle = edits.c2paPrompt || titleName;

        const c2paPayload = new TextEncoder().encode(
          'JP\0\0' +
            JSON.stringify({
              signer: c2paSigner,
              generator: c2paGenerator,
              title: c2paTitle,
              action: c2paAction,
              timestamp: new Date().toISOString(),
            })
        );
        const app11Len = 2 + c2paPayload.length;
        const app11Header = new Uint8Array(4);
        app11Header[0] = 0xff;
        app11Header[1] = 0xeb;
        app11Header[2] = (app11Len >> 8) & 0xff;
        app11Header[3] = app11Len & 0xff;

        const combined = new Uint8Array(bytes.length + app11Header.length + c2paPayload.length);
        combined.set(bytes.subarray(0, 2), 0); // SOI (0xFF 0xD8)
        combined.set(app11Header, 2);
        combined.set(c2paPayload, 2 + app11Header.length);
        combined.set(bytes.subarray(2), 2 + app11Header.length + c2paPayload.length);

        return new Blob([combined as unknown as BlobPart], { type: 'image/jpeg' });
      }

      return new Blob([bytes as unknown as BlobPart], { type: 'image/jpeg' });
    } catch (err) {
      console.error('Failed to inject JPEG EXIF/C2PA:', err);
    }
  }

  // 2. PNG Chunk Injection (tEXt and caPI chunks)
  if (mimeType === 'image/png' || file.name.match(/\.png$/i)) {
    try {
      const buffer = await file.arrayBuffer();
      const originalBytes = new Uint8Array(buffer);

      // Strip all old metadata chunks (tEXt, caPI, c2pa, jumb)
      const cleanPngBytes = stripPngMetadataChunks(originalBytes);

      if (cleanPngBytes.length > 33 && cleanPngBytes[0] === 0x89 && cleanPngBytes[1] === 0x50) {
        const ihdrEndOffset = 8 + 4 + 4 + 13 + 4; // 33
        const chunksToInsert: Uint8Array[] = [];

        const authorName = edits.Author || edits.c2paSigner || 'Poorvith M P';
        const softwareName = edits.Software || edits.c2paGenerator || 'AIScrubber Privacy Suite v2.3.0';
        const titleName = edits.Title || edits.c2paPrompt || file.name.replace(/\.[^/.]+$/, '');
        const copyrightName = edits.Copyright || 'CC-BY 4.0 / All Rights Reserved';

        if (authorName) chunksToInsert.push(createPngTextChunk('Author', authorName));
        if (titleName) chunksToInsert.push(createPngTextChunk('Title', titleName));
        if (softwareName) chunksToInsert.push(createPngTextChunk('Software', softwareName));
        if (copyrightName) chunksToInsert.push(createPngTextChunk('Copyright', copyrightName));

        if (edits.signWithC2pa !== false) {
          const c2paSigner = edits.c2paSigner || authorName;
          const c2paGenerator = edits.c2paGenerator || softwareName;
          const c2paAction = edits.c2paAction || 'c2pa.created (Custom Content Credentials)';
          const c2paTitle = edits.c2paPrompt || titleName;

          const c2paPayload = new TextEncoder().encode(
            JSON.stringify({
              signer: c2paSigner,
              generator: c2paGenerator,
              title: c2paTitle,
              action: c2paAction,
              timestamp: new Date().toISOString(),
            })
          );
          chunksToInsert.push(createPngChunk('caPI', c2paPayload));
        }

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

  // 3. PDF Dictionary Injection
  if (mimeType === 'application/pdf' || file.name.endsWith('.pdf')) {
    const buffer = await file.arrayBuffer();
    let text = new TextDecoder('latin1').decode(buffer);

    const authorName = edits.Author || edits.c2paSigner || 'Poorvith M P';
    const titleName = edits.Title || edits.c2paPrompt || file.name;
    const softwareName = edits.Software || edits.c2paGenerator || 'AIScrubber Suite';

    text = text.replace(/\/Author\s*\([^)]*\)/gi, `/Author (${authorName})`);
    text = text.replace(/\/Title\s*\([^)]*\)/gi, `/Title (${titleName})`);
    text = text.replace(/\/Creator\s*\([^)]*\)/gi, `/Creator (${softwareName})`);

    const encoder = new TextEncoder();
    return new Blob([encoder.encode(text)], { type: 'application/pdf' });
  }

  return file;
}

/**
 * Universal 1-Click Metadata Stripper
 */
export async function stripMetadataUniversal(file: File): Promise<Blob> {
  const mimeType = file.type || '';

  // 1. Strip JPEG EXIF & C2PA APP11 markers
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

      // Filter out any APP11 markers
      const cleaned = stripJpegApp11Segments(bytes);
      return new Blob([cleaned as unknown as BlobPart], { type: 'image/jpeg' });
    } catch {
      // Canvas fallback
    }
  }

  // 2. Strip PNG metadata chunks without decoding or recompressing pixels.
  if (mimeType === 'image/png' || file.name.match(/\.png$/i)) {
    const bytes = new Uint8Array(await file.arrayBuffer());
    return new Blob([stripPngMetadataChunks(bytes) as unknown as BlobPart], { type: 'image/png' });
  }

  // 3. Strip other image metadata by re-encoding a clean canvas buffer
  if (file.type.startsWith('image/')) {
    return new Promise((resolve, reject) => {
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

  // 4. Strip PDF Metadata
  if (mimeType === 'application/pdf' || file.name.endsWith('.pdf')) {
    const buffer = await file.arrayBuffer();
    let text = new TextDecoder('latin1').decode(buffer);
    text = text.replace(/\/Info\s+\d+\s+\d+\s+R/g, '/Info null');
    text = text.replace(/\/Author\s*\([^)]*\)/gi, '/Author ()');
    text = text.replace(/\/Creator\s*\([^)]*\)/gi, '/Creator ()');
    text = text.replace(/\/Producer\s*\([^)]*\)/gi, '/Producer ()');
    text = text.replace(/\/Title\s*\([^)]*\)/gi, '/Title ()');
    text = text.replace(/\/CreationDate\s*\([^)]*\)/gi, '/CreationDate ()');
    return new Blob([new TextEncoder().encode(text)], { type: 'application/pdf' });
  }

  return file;
}
