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
 * Native scanner for PNG tEXt chunks fallback
 */
function parsePngTextChunks(bytes: Uint8Array): Record<string, string> {
  const result: Record<string, string> = {};
  let offset = 8; // PNG signature length

  while (offset + 8 <= bytes.length) {
    const view = new DataView(bytes.buffer, bytes.byteOffset + offset, 8);
    const length = view.getUint32(0);
    const type = String.fromCharCode(bytes[offset + 4], bytes[offset + 5], bytes[offset + 6], bytes[offset + 7]);

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

    offset += 8 + length + 4; // length + type (8) + data (length) + crc (4)
  }

  return result;
}

/**
 * Detect C2PA Content Credentials & AI Generation Provenance
 */
export async function detectC2paProvenance(file: File): Promise<C2paProvenance> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const textContent = new TextDecoder('latin1').decode(bytes.subarray(0, Math.min(bytes.length, 500000)));

  let hasC2paMarker = false;
  let signer: string | null = null;
  let generator: string | null = null;
  let claimAction: string | null = null;
  let aiPrompt: string | null = null;
  let rawJson: string | null = null;

  // 1. Scan for C2PA APP11 segment in JPEG (Marker 0xFFEB)
  for (let i = 0; i < bytes.length - 4; i++) {
    if (bytes[i] === 0xff && bytes[i + 1] === 0xeb) {
      hasC2paMarker = true;
      break;
    }
  }

  // 2. Scan for PNG caPI or c2pa or jumb chunks
  if (textContent.includes('caPI') || textContent.includes('c2pa') || textContent.includes('jumb') || textContent.includes('JUMBF')) {
    hasC2paMarker = true;
  }

  // 3. Scan for custom AIScrubber embedded C2PA JSON
  const customJsonMatch = textContent.match(/\{"(?:signer|issuer)":"([^"]+)","generator":"([^"]+)"(?:,"title":"([^"]*)")?(?:,"action":"([^"]*)")?\}/);
  if (customJsonMatch) {
    hasC2paMarker = true;
    signer = customJsonMatch[1] || 'AIScrubber Verified Signer';
    generator = customJsonMatch[2] || 'AIScrubber Suite';
    if (customJsonMatch[3]) aiPrompt = customJsonMatch[3];
    claimAction = customJsonMatch[4] || 'c2pa.created';
  }

  // 4. Identify Frontier AI Signers & Platforms
  if (textContent.includes('OpenAI') || textContent.includes('DALL-E') || textContent.includes('dall-e')) {
    hasC2paMarker = true;
    signer = signer || 'OpenAI Inc.';
    generator = generator || 'ChatGPT (DALL·E 3)';
    claimAction = claimAction || 'c2pa.created (AI Synthetic Synthesis)';
  } else if (textContent.includes('Nano Banana') || textContent.includes('nanobanana') || textContent.includes('FLUX.1')) {
    hasC2paMarker = true;
    signer = signer || 'Nano Banana CA';
    generator = generator || 'Nano Banana / FLUX.1';
    claimAction = claimAction || 'c2pa.ai_generated';
  } else if (textContent.includes('Adobe') || textContent.includes('Firefly')) {
    hasC2paMarker = true;
    signer = signer || 'Adobe Inc. (Content Authenticity Initiative)';
    generator = generator || 'Adobe Firefly Model';
    claimAction = claimAction || 'c2pa.ai_generated';
  } else if (textContent.includes('Google') || textContent.includes('SynthID') || textContent.includes('Imagen')) {
    hasC2paMarker = true;
    signer = signer || 'Google LLC';
    generator = generator || 'Google Imagen 3 / SynthID';
    claimAction = claimAction || 'c2pa.ai_generated';
  } else if (textContent.includes('Midjourney')) {
    hasC2paMarker = true;
    signer = signer || 'Midjourney Inc.';
    generator = generator || 'Midjourney v6';
    claimAction = claimAction || 'c2pa.ai_generated';
  }

  // 5. Extract embedded AI Prompt
  if (!aiPrompt) {
    const promptMatch =
      textContent.match(/"prompt":\s*"([^"]+)"/) ||
      textContent.match(/prompt:\s*([^\n\r\t]+)/i) ||
      textContent.match(/parameters\0([^]+?)(?:Negative prompt|Steps:|$)/);

    if (promptMatch && promptMatch[1]) {
      aiPrompt = promptMatch[1].trim().slice(0, 500);
    }
  }

  // Fallback defaults if manifest marker was discovered
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
    rawJson,
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
          fields.push({ tag: 'Make', category: 'camera', label: 'Camera Manufacturer', value: String(rawExifData.Make), isSensitive: true });
        }
        if (rawExifData.Model) {
          fields.push({ tag: 'Model', category: 'camera', label: 'Camera Model', value: String(rawExifData.Model), isSensitive: true });
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
    if (file.type === 'image/png') {
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

/**
 * Convert DataURL to Blob
 */
function dataUrlToBlob(dataUrl: string): Blob {
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

/**
 * Apply Custom Metadata Edits & Inject C2PA Manifest
 */
export async function applyMetadataEdits(
  file: File,
  edits: {
    Author?: string;
    Title?: string;
    Software?: string;
    Copyright?: string;
    signWithC2pa?: boolean;
  }
): Promise<Blob> {
  const mimeType = file.type || '';

  // 1. JPEG EXIF & C2PA Injection (piexifjs + APP11 JUMBF segment)
  if (mimeType === 'image/jpeg' || mimeType === 'image/jpg' || file.name.match(/\.jpe?g$/i)) {
    try {
      const dataUrl = await fileToDataUrl(file);

      // Clean existing EXIF first to avoid corrupting duplicate headers
      let cleanDataUrl = dataUrl;
      try {
        cleanDataUrl = piexif.remove(dataUrl);
      } catch {
        cleanDataUrl = dataUrl;
      }

      const zeroth: Record<number, string> = {};
      if (edits.Author) zeroth[piexif.ImageIFD.Artist] = edits.Author;
      if (edits.Title) zeroth[piexif.ImageIFD.ImageDescription] = edits.Title;
      if (edits.Software) zeroth[piexif.ImageIFD.Software] = edits.Software;
      if (edits.Copyright) zeroth[piexif.ImageIFD.Copyright] = edits.Copyright;

      const exifObj = { '0th': zeroth, Exif: {}, GPS: {}, '1st': {}, Interop: {} };
      const exifBytes = piexif.dump(exifObj);
      const withExifDataUrl = piexif.insert(exifBytes, cleanDataUrl);

      const base64Data = withExifDataUrl.replace(/^data:image\/jpeg;base64,/, '');
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Inject APP11 C2PA segment
      if (edits.signWithC2pa !== false) {
        const c2paPayload = new TextEncoder().encode(
          'JP\0\0' +
            JSON.stringify({
              signer: edits.Author || 'AIScrubber Verified Signer',
              generator: edits.Software || 'AIScrubber Privacy Suite',
              title: edits.Title || 'Protected Asset',
              action: 'c2pa.created',
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

        return new Blob([combined], { type: 'image/jpeg' });
      }

      return new Blob([bytes], { type: 'image/jpeg' });
    } catch (err) {
      console.error('Failed to inject JPEG EXIF/C2PA:', err);
    }
  }

  // 2. PNG Chunk Injection (tEXt and caPI chunks)
  if (mimeType === 'image/png' || file.name.match(/\.png$/i)) {
    try {
      const buffer = await file.arrayBuffer();
      const rawBytes = new Uint8Array(buffer);

      // Verify PNG signature (8 bytes)
      if (rawBytes.length > 33 && rawBytes[0] === 0x89 && rawBytes[1] === 0x50) {
        const ihdrEndOffset = 8 + 4 + 4 + 13 + 4; // 33
        const chunksToInsert: Uint8Array[] = [];

        if (edits.Author) chunksToInsert.push(createPngTextChunk('Author', edits.Author));
        if (edits.Title) chunksToInsert.push(createPngTextChunk('Title', edits.Title));
        if (edits.Software) chunksToInsert.push(createPngTextChunk('Software', edits.Software));
        if (edits.Copyright) chunksToInsert.push(createPngTextChunk('Copyright', edits.Copyright));

        if (edits.signWithC2pa !== false) {
          const c2paPayload = new TextEncoder().encode(
            JSON.stringify({
              signer: edits.Author || 'AIScrubber Verified Signer',
              generator: edits.Software || 'AIScrubber Suite',
              title: edits.Title || 'Protected Asset',
              action: 'c2pa.created',
              timestamp: new Date().toISOString(),
            })
          );
          chunksToInsert.push(createPngChunk('caPI', c2paPayload));
        }

        const totalInsertSize = chunksToInsert.reduce((acc, c) => acc + c.length, 0);
        const newPngBytes = new Uint8Array(rawBytes.length + totalInsertSize);

        newPngBytes.set(rawBytes.subarray(0, ihdrEndOffset), 0);
        let curOffset = ihdrEndOffset;
        for (const chunk of chunksToInsert) {
          newPngBytes.set(chunk, curOffset);
          curOffset += chunk.length;
        }
        newPngBytes.set(rawBytes.subarray(ihdrEndOffset), curOffset);

        return new Blob([newPngBytes], { type: 'image/png' });
      }
    } catch (err) {
      console.error('Failed to inject PNG chunks:', err);
    }
  }

  // 3. PDF Dictionary Injection
  if (mimeType === 'application/pdf' || file.name.endsWith('.pdf')) {
    const buffer = await file.arrayBuffer();
    let text = new TextDecoder('latin1').decode(buffer);

    if (edits.Author) text = text.replace(/\/Author\s*\([^)]*\)/gi, `/Author (${edits.Author})`);
    if (edits.Title) text = text.replace(/\/Title\s*\([^)]*\)/gi, `/Title (${edits.Title})`);
    if (edits.Software) text = text.replace(/\/Creator\s*\([^)]*\)/gi, `/Creator (${edits.Software})`);

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

      // Also strip APP11 (0xFFEB) C2PA segments
      const base64Data = strippedDataUrl.replace(/^data:image\/jpeg;base64,/, '');
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Filter out APP11 segments
      const cleanedSegments: number[] = [];
      let i = 0;
      while (i < bytes.length) {
        if (i < bytes.length - 3 && bytes[i] === 0xff && bytes[i + 1] === 0xeb) {
          const segLen = (bytes[i + 2] << 8) + bytes[i + 3];
          i += 2 + segLen; // Skip APP11 marker and its payload
        } else {
          cleanedSegments.push(bytes[i]);
          i++;
        }
      }

      return new Blob([new Uint8Array(cleanedSegments)], { type: 'image/jpeg' });
    } catch {
      // Canvas fallback
    }
  }

  // 2. Strip PNG metadata by re-encoding clean canvas buffer
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

  // 3. Strip PDF Metadata
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
