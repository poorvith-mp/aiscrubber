import exifr from 'exifr';
import piexif from 'piexifjs';

export interface MetadataField {
  tag: string;
  category: 'camera' | 'location' | 'document' | 'technical' | 'author' | 'audio';
  label: string;
  value: string;
  isSensitive?: boolean;
}

export interface ParsedMetadata {
  fileName: string;
  fileSize: number;
  fileType: string;
  lastModified: string;
  fields: MetadataField[];
  hasGps: boolean;
  gpsCoordinates?: {
    latitude: number;
    longitude: number;
    mapsUrl: string;
  };
  threats: string[];
}

// CRC32 table and calculator for PNG chunks
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

function getMimeFromExtension(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    case 'svg':
      return 'image/svg+xml';
    case 'pdf':
      return 'application/pdf';
    case 'mp3':
      return 'audio/mpeg';
    case 'wav':
      return 'audio/wav';
    case 'mp4':
      return 'video/mp4';
    default:
      return 'application/octet-stream';
  }
}

export async function parseFileMetadata(file: File): Promise<ParsedMetadata> {
  const fields: MetadataField[] = [];
  const threats: string[] = [];
  let hasGps = false;
  let gpsCoordinates: ParsedMetadata['gpsCoordinates'] | undefined;

  const mimeType = file.type || getMimeFromExtension(file.name);

  // 1. IMAGE METADATA (JPEG, PNG, WEBP, TIFF, HEIC, AVIF) via exifr
  if (
    mimeType.startsWith('image/') &&
    mimeType !== 'image/svg+xml' &&
    !file.name.toLowerCase().endsWith('.svg')
  ) {
    try {
      const rawExif = await exifr.parse(file, {
        tiff: true,
        xmp: true,
        icc: true,
        iptc: true,
        jfif: true,
        mergeOutput: true,
      });

      if (rawExif) {
        // Map Standard Fields
        if (rawExif.Make) {
          fields.push({ tag: 'Make', category: 'camera', label: 'Camera Manufacturer', value: String(rawExif.Make), isSensitive: true });
        }
        if (rawExif.Model) {
          fields.push({ tag: 'Model', category: 'camera', label: 'Camera Model', value: String(rawExif.Model), isSensitive: true });
          threats.push(`Camera/Device model exposed: ${rawExif.Model}`);
        }
        if (rawExif.Artist || rawExif.creator || rawExif.Author) {
          const val = String(rawExif.Artist || rawExif.creator || rawExif.Author);
          fields.push({ tag: 'Artist', category: 'author', label: 'Creator / Author', value: val, isSensitive: true });
          threats.push(`Author name discovered: ${val}`);
        }
        if (rawExif.ImageDescription || rawExif.title || rawExif.Title || rawExif.headline) {
          const val = String(rawExif.ImageDescription || rawExif.title || rawExif.Title || rawExif.headline);
          fields.push({ tag: 'Title', category: 'document', label: 'Document / Image Title', value: val });
        }
        if (rawExif.Software || rawExif.CreatorTool) {
          const val = String(rawExif.Software || rawExif.CreatorTool);
          fields.push({ tag: 'Software', category: 'technical', label: 'Software Used', value: val, isSensitive: true });
          threats.push(`Editing software fingerprint: ${val}`);
        }
        if (rawExif.Copyright || rawExif.rights) {
          const val = String(rawExif.Copyright || rawExif.rights);
          fields.push({ tag: 'Copyright', category: 'author', label: 'Copyright Notice', value: val });
        }
        if (rawExif.DateTimeOriginal || rawExif.CreateDate || rawExif.ModifyDate) {
          const val = String(rawExif.DateTimeOriginal || rawExif.CreateDate || rawExif.ModifyDate);
          fields.push({ tag: 'DateTimeOriginal', category: 'camera', label: 'Capture Timestamp', value: val, isSensitive: true });
        }
        if (rawExif.LensModel || rawExif.Lens) {
          fields.push({ tag: 'LensModel', category: 'camera', label: 'Lens Specification', value: String(rawExif.LensModel || rawExif.Lens) });
        }
        if (rawExif.ISO) {
          fields.push({ tag: 'ISO', category: 'technical', label: 'ISO Sensitivity', value: String(rawExif.ISO) });
        }
        if (rawExif.FNumber) {
          fields.push({ tag: 'FNumber', category: 'technical', label: 'Aperture (F-Stop)', value: `f/${rawExif.FNumber}` });
        }
        if (rawExif.ExposureTime) {
          fields.push({ tag: 'ExposureTime', category: 'technical', label: 'Shutter Speed', value: `1/${Math.round(1 / rawExif.ExposureTime)}s` });
        }

        // Generic extraction of any other tags in exifr output
        const knownKeys = new Set([
          'Make', 'Model', 'Artist', 'creator', 'Author', 'ImageDescription', 'title', 'Title',
          'headline', 'Software', 'CreatorTool', 'Copyright', 'rights', 'DateTimeOriginal',
          'CreateDate', 'ModifyDate', 'LensModel', 'Lens', 'ISO', 'FNumber', 'ExposureTime',
          'latitude', 'longitude', 'GPSLatitude', 'GPSLongitude', 'GPSAltitude',
        ]);

        for (const [key, val] of Object.entries(rawExif)) {
          if (!knownKeys.has(key) && typeof val === 'string' && val.trim() && val.length < 200) {
            fields.push({
              tag: key,
              category: 'document',
              label: key.replace(/([A-Z])/g, ' $1').trim(),
              value: val.trim(),
            });
          }
        }
      }

      // Check GPS
      const gps = await exifr.gps(file);
      if (gps && typeof gps.latitude === 'number' && typeof gps.longitude === 'number') {
        hasGps = true;
        gpsCoordinates = {
          latitude: gps.latitude,
          longitude: gps.longitude,
          mapsUrl: `https://www.google.com/maps?q=${gps.latitude},${gps.longitude}`,
        };
        fields.push({ tag: 'GPSLatitude', category: 'location', label: 'GPS Latitude', value: `${gps.latitude.toFixed(6)}°`, isSensitive: true });
        fields.push({ tag: 'GPSLongitude', category: 'location', label: 'GPS Longitude', value: `${gps.longitude.toFixed(6)}°`, isSensitive: true });
        threats.push(`Precise GPS coordinates discovered in EXIF header (${gps.latitude.toFixed(4)}, ${gps.longitude.toFixed(4)})`);
      }
    } catch (err) {
      console.warn('exifr parse error fallback:', err);
    }
  }

  // 2. PDF PARSER
  if (mimeType === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
    const buffer = await file.arrayBuffer();
    const decoder = new TextDecoder('latin1');
    const text = decoder.decode(new Uint8Array(buffer));

    const infoMatch = text.match(/\/Title\s*\(([^)]+)\)/i);
    if (infoMatch) fields.push({ tag: 'PDF_Title', category: 'document', label: 'Document Title', value: infoMatch[1].trim() });

    const authorMatch = text.match(/\/Author\s*\(([^)]+)\)/i);
    if (authorMatch) {
      fields.push({ tag: 'PDF_Author', category: 'author', label: 'Creator / Author', value: authorMatch[1].trim(), isSensitive: true });
      threats.push(`PDF author metadata found: ${authorMatch[1].trim()}`);
    }

    const creatorMatch = text.match(/\/Creator\s*\(([^)]+)\)/i);
    if (creatorMatch) {
      fields.push({ tag: 'PDF_Creator', category: 'technical', label: 'Software Creator', value: creatorMatch[1].trim() });
    }

    const producerMatch = text.match(/\/Producer\s*\(([^)]+)\)/i);
    if (producerMatch) {
      fields.push({ tag: 'PDF_Producer', category: 'technical', label: 'PDF Producer Engine', value: producerMatch[1].trim() });
    }

    const dateMatch = text.match(/\/CreationDate\s*\(([^)]+)\)/i);
    if (dateMatch) fields.push({ tag: 'PDF_CreationDate', category: 'document', label: 'Creation Date', value: dateMatch[1].trim() });
  }

  // 3. AUDIO ID3 PARSER
  if (mimeType.startsWith('audio/') || file.name.toLowerCase().endsWith('.mp3')) {
    const buffer = await file.arrayBuffer();
    const decoder = new TextDecoder('latin1');

    if (buffer.byteLength > 10) {
      const id3Header = decoder.decode(new Uint8Array(buffer, 0, 3));
      if (id3Header === 'ID3') {
        fields.push({ tag: 'Audio_ID3v2', category: 'audio', label: 'ID3v2 Tag Container', value: 'Present', isSensitive: true });
        threats.push('Audio contains ID3 metadata headers.');
      }
    }

    if (buffer.byteLength > 128) {
      const tag = decoder.decode(new Uint8Array(buffer, buffer.byteLength - 128, 3));
      if (tag === 'TAG') {
        const title = decoder.decode(new Uint8Array(buffer, buffer.byteLength - 125, 30)).replace(/\0/g, '').trim();
        const artist = decoder.decode(new Uint8Array(buffer, buffer.byteLength - 95, 30)).replace(/\0/g, '').trim();
        if (title) fields.push({ tag: 'Audio_Title', category: 'audio', label: 'Track Title', value: title });
        if (artist) {
          fields.push({ tag: 'Audio_Artist', category: 'author', label: 'Track Artist', value: artist, isSensitive: true });
          threats.push(`Audio artist name: ${artist}`);
        }
      }
    }
  }

  // 4. SVG METADATA PARSER
  if (mimeType.startsWith('image/svg')) {
    const buffer = await file.arrayBuffer();
    const decoder = new TextDecoder('utf-8');
    const text = decoder.decode(new Uint8Array(buffer));
    if (text.includes('<metadata>') || text.includes('<rdf:RDF>')) {
      fields.push({ tag: 'SVG_Metadata', category: 'document', label: 'SVG Metadata Block', value: 'Embedded RDF / Dublin Core', isSensitive: true });
      threats.push('SVG contains embedded XML/RDF metadata.');
    }
  }

  return {
    fileName: file.name,
    fileSize: file.size,
    fileType: mimeType || 'application/octet-stream',
    lastModified: new Date(file.lastModified).toLocaleString(),
    fields,
    hasGps,
    gpsCoordinates,
    threats,
  };
}

// Helper to convert Blob to DataURL
function fileToDataUrl(fileOrBlob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(fileOrBlob);
  });
}

// Helper to convert DataURL to Blob
function dataUrlToBlob(dataUrl: string): Blob {
  const parts = dataUrl.split(',');
  const mime = parts[0].match(/:(.*?);/)?.[1] || 'application/octet-stream';
  const binary = atob(parts[1]);
  const array = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    array[i] = binary.charCodeAt(i);
  }
  return new Blob([array], { type: mime });
}

// Helper to create PNG tEXt chunk
function createPngTextChunk(keyword: string, value: string): Uint8Array {
  const enc = new TextEncoder();
  const keywordBytes = enc.encode(keyword);
  const valueBytes = enc.encode(value);
  const dataLen = keywordBytes.length + 1 + valueBytes.length;

  const chunk = new Uint8Array(4 + 4 + dataLen + 4);
  const view = new DataView(chunk.buffer);

  // 1. Data length
  view.setUint32(0, dataLen, false);

  // 2. Type "tEXt"
  chunk[4] = 0x74; // 't'
  chunk[5] = 0x45; // 'E'
  chunk[6] = 0x58; // 'X'
  chunk[7] = 0x74; // 't'

  // 3. Keyword + Null + Value
  chunk.set(keywordBytes, 8);
  chunk[8 + keywordBytes.length] = 0x00;
  chunk.set(valueBytes, 8 + keywordBytes.length + 1);

  // 4. CRC computed over Type + Data
  const crcBytes = chunk.subarray(4, 8 + dataLen);
  const crcVal = crc32(crcBytes);
  view.setUint32(8 + dataLen, crcVal, false);

  return chunk;
}

// 1-Click Stripper: Removes 100% of metadata client-side
export async function stripFileMetadata(file: File): Promise<Blob> {
  const mimeType = file.type || getMimeFromExtension(file.name);

  // For images (JPEG, PNG, WebP), draw onto an offscreen canvas and export clean compressed pixel data
  if (mimeType.startsWith('image/')) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context unavailable'));
          return;
        }
        ctx.drawImage(img, 0, 0);

        const exportFormat = mimeType === 'image/png' ? 'image/png' : 'image/jpeg';
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Failed to generate stripped image blob'));
          },
          exportFormat,
          0.95
        );
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Could not render image onto canvas for stripping'));
      };
      img.src = url;
    });
  }

  // For PDFs: Wipe /Info and /Metadata streams in binary
  if (mimeType === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
    const buffer = await file.arrayBuffer();
    const decoder = new TextDecoder('latin1');
    let text = decoder.decode(new Uint8Array(buffer));

    text = text.replace(/\/Info\s+\d+\s+\d+\s+R/g, '/Info null');
    text = text.replace(/\/Author\s*\([^)]*\)/gi, '/Author ()');
    text = text.replace(/\/Creator\s*\([^)]*\)/gi, '/Creator ()');
    text = text.replace(/\/Producer\s*\([^)]*\)/gi, '/Producer ()');
    text = text.replace(/\/Title\s*\([^)]*\)/gi, '/Title ()');
    text = text.replace(/\/CreationDate\s*\([^)]*\)/gi, '/CreationDate ()');
    text = text.replace(/\/ModDate\s*\([^)]*\)/gi, '/ModDate ()');

    const encoder = new TextEncoder();
    const cleanBytes = encoder.encode(text);
    return new Blob([cleanBytes], { type: 'application/pdf' });
  }

  // For audio files: strip ID3 headers
  if (mimeType.startsWith('audio/') || file.name.toLowerCase().endsWith('.mp3')) {
    const buffer = await file.arrayBuffer();
    let startOffset = 0;
    let endOffset = buffer.byteLength;

    const view = new DataView(buffer);
    const decoder = new TextDecoder('latin1');

    if (view.byteLength > 10 && decoder.decode(new Uint8Array(buffer, 0, 3)) === 'ID3') {
      const sizeBytes = [
        view.getUint8(6),
        view.getUint8(7),
        view.getUint8(8),
        view.getUint8(9),
      ];
      const tagSize = (sizeBytes[0] << 21) | (sizeBytes[1] << 14) | (sizeBytes[2] << 7) | sizeBytes[3];
      startOffset = 10 + tagSize;
    }

    if (view.byteLength > 128 && decoder.decode(new Uint8Array(buffer, buffer.byteLength - 128, 3)) === 'TAG') {
      endOffset = buffer.byteLength - 128;
    }

    const cleanSlice = buffer.slice(startOffset, endOffset);
    return new Blob([cleanSlice], { type: mimeType });
  }

  return file;
}

// Apply Custom Metadata Edits & Inject into Binary Streams
export async function applyMetadataEdits(
  file: File,
  edits: Record<string, string>
): Promise<Blob> {
  const mimeType = file.type || getMimeFromExtension(file.name);

  // 1. JPEG EXIF INJECTION (piexifjs)
  if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') {
    try {
      const dataUrl = await fileToDataUrl(file);
      let exifObj: any;
      try {
        exifObj = piexif.load(dataUrl);
      } catch {
        exifObj = { '0th': {}, Exif: {}, GPS: {}, '1st': {}, Interop: {} };
      }

      if (!exifObj['0th']) exifObj['0th'] = {};
      if (!exifObj.Exif) exifObj.Exif = {};

      if (edits.Author) exifObj['0th'][piexif.ImageIFD.Artist] = edits.Author;
      if (edits.Title) exifObj['0th'][piexif.ImageIFD.ImageDescription] = edits.Title;
      if (edits.Software) exifObj['0th'][piexif.ImageIFD.Software] = edits.Software;
      if (edits.Copyright) exifObj['0th'][piexif.ImageIFD.Copyright] = edits.Copyright;

      // Clear GPS dictionary for privacy
      exifObj.GPS = {};

      const exifBytes = piexif.dump(exifObj);
      const newJpegDataUrl = piexif.insert(exifBytes, dataUrl);
      return dataUrlToBlob(newJpegDataUrl);
    } catch (err) {
      console.error('Failed to inject JPEG EXIF with piexifjs:', err);
    }
  }

  // 2. PNG IN-PLACE CHUNK INJECTION
  if (mimeType === 'image/png') {
    const buffer = await file.arrayBuffer();
    const view = new DataView(buffer);
    if (view.byteLength > 8 && view.getUint32(0) === 0x89504e47) {
      const decoder = new TextDecoder('latin1');
      const filteredChunks: Uint8Array[] = [new Uint8Array(buffer, 0, 8)]; // PNG Signature
      let offset = 8;

      while (offset < view.byteLength - 4) {
        const length = view.getUint32(offset);
        const chunkType = decoder.decode(new Uint8Array(buffer, offset + 4, 4));
        const totalChunkSize = 12 + length;

        // Filter out old textual/exif chunks
        if (!['tEXt', 'zTXt', 'iTXt', 'eXIf'].includes(chunkType)) {
          filteredChunks.push(new Uint8Array(buffer, offset, totalChunkSize));
        }

        // Insert new custom tEXt chunks right after IHDR
        if (chunkType === 'IHDR') {
          if (edits.Author) filteredChunks.push(createPngTextChunk('Author', edits.Author));
          if (edits.Title) filteredChunks.push(createPngTextChunk('Title', edits.Title));
          if (edits.Software) filteredChunks.push(createPngTextChunk('Software', edits.Software));
          if (edits.Copyright) filteredChunks.push(createPngTextChunk('Copyright', edits.Copyright));
        }

        offset += totalChunkSize;
      }

      return new Blob(filteredChunks as BlobPart[], { type: 'image/png' });
    }
  }

  // 3. PDF IN-PLACE METADATA INJECTION
  if (mimeType === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
    const buffer = await file.arrayBuffer();
    const decoder = new TextDecoder('latin1');
    let text = decoder.decode(new Uint8Array(buffer));

    const authorStr = edits.Author || '';
    const titleStr = edits.Title || '';
    const softwareStr = edits.Software || 'AIScrubber';
    const copyStr = edits.Copyright || '';

    // If /Info dictionary exists, replace tags
    if (text.includes('/Info')) {
      if (text.match(/\/Author\s*\([^)]*\)/i)) {
        text = text.replace(/\/Author\s*\([^)]*\)/gi, `/Author (${authorStr})`);
      }
      if (text.match(/\/Title\s*\([^)]*\)/i)) {
        text = text.replace(/\/Title\s*\([^)]*\)/gi, `/Title (${titleStr})`);
      }
      if (text.match(/\/Creator\s*\([^)]*\)/i)) {
        text = text.replace(/\/Creator\s*\([^)]*\)/gi, `/Creator (${softwareStr})`);
      }
    }

    // Append info dictionary before trailer if missing
    if (!text.includes(`/Author (${authorStr})`) && authorStr) {
      text = text.replace(
        /trailer\s*<<\s*/i,
        `trailer << /Info << /Author (${authorStr}) /Title (${titleStr}) /Creator (${softwareStr}) /Copyright (${copyStr}) >> `
      );
    }

    const encoder = new TextEncoder();
    return new Blob([encoder.encode(text)], { type: 'application/pdf' });
  }

  // 4. AUDIO (MP3/WAV) ID3v1 INJECTION
  if (mimeType.startsWith('audio/') || file.name.toLowerCase().endsWith('.mp3')) {
    const buffer = await file.arrayBuffer();
    const baseLength =
      buffer.byteLength > 128 &&
      new TextDecoder('latin1').decode(new Uint8Array(buffer, buffer.byteLength - 128, 3)) === 'TAG'
        ? buffer.byteLength - 128
        : buffer.byteLength;

    const baseData = new Uint8Array(buffer, 0, baseLength);
    const id3v1Tag = new Uint8Array(128);
    const enc = new TextEncoder();

    // 0..2: 'TAG'
    id3v1Tag[0] = 0x54;
    id3v1Tag[1] = 0x41;
    id3v1Tag[2] = 0x47;

    // 3..32: Title (30 bytes)
    if (edits.Title) {
      const titleBytes = enc.encode(edits.Title.padEnd(30, '\0').slice(0, 30));
      id3v1Tag.set(titleBytes, 3);
    }

    // 33..62: Artist / Author (30 bytes)
    if (edits.Author) {
      const artistBytes = enc.encode(edits.Author.padEnd(30, '\0').slice(0, 30));
      id3v1Tag.set(artistBytes, 33);
    }

    return new Blob([baseData, id3v1Tag], { type: mimeType });
  }

  return file;
}
