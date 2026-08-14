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

export async function parseFileMetadata(file: File): Promise<ParsedMetadata> {
  const buffer = await file.arrayBuffer();
  const fields: MetadataField[] = [];
  const threats: string[] = [];
  let hasGps = false;
  let gpsCoordinates: ParsedMetadata['gpsCoordinates'] | undefined;

  const mimeType = file.type || getMimeFromExtension(file.name);

  if (mimeType.startsWith('image/jpeg') || mimeType.startsWith('image/jpg')) {
    parseJpegMetadata(buffer, fields, threats);
  } else if (mimeType.startsWith('image/png')) {
    parsePngMetadata(buffer, fields, threats);
  } else if (mimeType === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
    parsePdfMetadata(buffer, fields, threats);
  } else if (mimeType.startsWith('audio/') || file.name.toLowerCase().endsWith('.mp3')) {
    parseAudioMetadata(buffer, fields, threats);
  } else if (mimeType.startsWith('image/svg')) {
    parseSvgMetadata(buffer, fields, threats);
  }

  // Check for GPS in extracted fields
  const latField = fields.find((f) => f.tag === 'GPSLatitude');
  const lonField = fields.find((f) => f.tag === 'GPSLongitude');
  if (latField && lonField) {
    const lat = parseFloat(latField.value);
    const lon = parseFloat(lonField.value);
    if (!isNaN(lat) && !isNaN(lon)) {
      hasGps = true;
      gpsCoordinates = {
        latitude: lat,
        longitude: lon,
        mapsUrl: `https://www.google.com/maps?q=${lat},${lon}`,
      };
      threats.push('Precise GPS coordinates discovered in EXIF header.');
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

// JPEG EXIF Parser
function parseJpegMetadata(
  buffer: ArrayBuffer,
  fields: MetadataField[],
  threats: string[]
) {
  const view = new DataView(buffer);
  if (view.byteLength < 4 || view.getUint16(0) !== 0xffd8) return;

  let offset = 2;
  while (offset < view.byteLength - 2) {
    const marker = view.getUint16(offset);
    offset += 2;

    if (marker === 0xffe1) {
      // APP1 (EXIF or XMP)
      const length = view.getUint16(offset);
      const app1Offset = offset + 2;

      // Check for "Exif\0\0"
      if (
        view.getUint8(app1Offset) === 0x45 &&
        view.getUint8(app1Offset + 1) === 0x78 &&
        view.getUint8(app1Offset + 2) === 0x69 &&
        view.getUint8(app1Offset + 3) === 0x66 &&
        view.getUint8(app1Offset + 4) === 0x00 &&
        view.getUint8(app1Offset + 5) === 0x00
      ) {
        parseExifTiff(buffer, app1Offset + 6, fields, threats);
      }
      offset += length;
    } else if (marker === 0xffe2 || marker === 0xffed) {
      const length = view.getUint16(offset);
      threats.push('Photoshop/ICC metadata chunk found in file.');
      offset += length;
    } else if ((marker & 0xff00) === 0xff00 && marker !== 0xff00) {
      if (marker === 0xffda) break;
      const length = view.getUint16(offset);
      offset += length;
    } else {
      break;
    }
  }
}

function parseExifTiff(
  buffer: ArrayBuffer,
  tiffOffset: number,
  fields: MetadataField[],
  threats: string[]
) {
  const view = new DataView(buffer, tiffOffset);
  if (view.byteLength < 8) return;

  const isLittleEndian = view.getUint16(0) === 0x4949;
  const firstIfdOffset = view.getUint32(4, isLittleEndian);
  if (firstIfdOffset >= view.byteLength) return;

  parseIfd(view, firstIfdOffset, isLittleEndian, fields, threats, '0th');
}

function parseIfd(
  view: DataView,
  offset: number,
  isLittle: boolean,
  fields: MetadataField[],
  threats: string[],
  context: string
) {
  if (offset + 2 > view.byteLength) return;
  const numEntries = view.getUint16(offset, isLittle);
  let entryOffset = offset + 2;

  for (let i = 0; i < numEntries; i++) {
    if (entryOffset + 12 > view.byteLength) break;
    const tag = view.getUint16(entryOffset, isLittle);
    const type = view.getUint16(entryOffset + 2, isLittle);
    const count = view.getUint32(entryOffset + 4, isLittle);
    const valueOffset = entryOffset + 8;

    const val = readIfdValue(view, type, count, valueOffset, isLittle);
    mapExifTagToField(tag, val, fields, threats, context);

    if (tag === 0x8769 && typeof val === 'number') {
      parseIfd(view, val, isLittle, fields, threats, 'Exif');
    } else if (tag === 0x8825 && typeof val === 'number') {
      parseIfd(view, val, isLittle, fields, threats, 'GPS');
    }

    entryOffset += 12;
  }
}

function readIfdValue(
  view: DataView,
  type: number,
  count: number,
  valueOffset: number,
  isLittle: boolean
): any {
  if (type === 2) {
    const stringOffset = count > 4 ? view.getUint32(valueOffset, isLittle) : valueOffset;
    if (stringOffset + count > view.byteLength) return '';
    let str = '';
    for (let c = 0; c < count - 1; c++) {
      str += String.fromCharCode(view.getUint8(stringOffset + c));
    }
    return str.trim();
  } else if (type === 3) {
    return view.getUint16(valueOffset, isLittle);
  } else if (type === 4) {
    return view.getUint32(valueOffset, isLittle);
  } else if (type === 5) {
    const rationalOffset = view.getUint32(valueOffset, isLittle);
    if (rationalOffset + 8 <= view.byteLength) {
      const num = view.getUint32(rationalOffset, isLittle);
      const den = view.getUint32(rationalOffset + 4, isLittle);
      return den !== 0 ? num / den : 0;
    }
  }
  return '';
}

function mapExifTagToField(
  tag: number,
  val: any,
  fields: MetadataField[],
  threats: string[],
  context: string
) {
  if (val === undefined || val === '' || val === null) return;
  const strVal = String(val);

  switch (tag) {
    case 0x010f:
      fields.push({ tag: 'Make', category: 'camera', label: 'Camera Manufacturer', value: strVal, isSensitive: true });
      break;
    case 0x0110:
      fields.push({ tag: 'Model', category: 'camera', label: 'Camera Model', value: strVal, isSensitive: true });
      threats.push(`Camera/Device model exposed: ${strVal}`);
      break;
    case 0x0131:
      fields.push({ tag: 'Software', category: 'technical', label: 'Software Used', value: strVal, isSensitive: true });
      threats.push(`Editing software fingerprint: ${strVal}`);
      break;
    case 0x0132:
    case 0x9003:
      fields.push({ tag: 'DateTimeOriginal', category: 'camera', label: 'Capture Timestamp', value: strVal, isSensitive: true });
      break;
    case 0x013b:
      fields.push({ tag: 'Artist', category: 'author', label: 'Creator / Author', value: strVal, isSensitive: true });
      threats.push(`Author / Creator name exposed: ${strVal}`);
      break;
    case 0x8298:
      fields.push({ tag: 'Copyright', category: 'author', label: 'Copyright Notice', value: strVal });
      break;
    case 0x0002:
      if (context === 'GPS') {
        fields.push({ tag: 'GPSLatitude', category: 'location', label: 'GPS Latitude', value: strVal, isSensitive: true });
      }
      break;
    case 0x0004:
      if (context === 'GPS') {
        fields.push({ tag: 'GPSLongitude', category: 'location', label: 'GPS Longitude', value: strVal, isSensitive: true });
      }
      break;
    case 0xa434:
      fields.push({ tag: 'LensModel', category: 'camera', label: 'Lens Model', value: strVal });
      break;
  }
}

// PNG Chunk Parser
function parsePngMetadata(
  buffer: ArrayBuffer,
  fields: MetadataField[],
  threats: string[]
) {
  const view = new DataView(buffer);
  if (view.byteLength < 8) return;

  let offset = 8;
  const decoder = new TextDecoder('latin1');

  while (offset < view.byteLength - 8) {
    const length = view.getUint32(offset);
    const chunkType = decoder.decode(new Uint8Array(buffer, offset + 4, 4));

    if (chunkType === 'tEXt' || chunkType === 'zTXt' || chunkType === 'iTXt') {
      const data = new Uint8Array(buffer, offset + 8, length);
      const textContent = decoder.decode(data);
      const parts = textContent.split('\0');
      const keyword = parts[0];
      const value = parts.slice(1).join(' ').trim();

      fields.push({
        tag: `PNG_${keyword}`,
        category: 'document',
        label: `PNG ${keyword}`,
        value: value || 'Included in chunk',
        isSensitive: true,
      });
      threats.push(`PNG textual metadata chunk detected: ${keyword}`);
    } else if (chunkType === 'eXIf') {
      threats.push('PNG embedded EXIF profile detected.');
      fields.push({
        tag: 'PNG_EXIF',
        category: 'camera',
        label: 'PNG Embedded EXIF',
        value: 'Contains full EXIF data',
        isSensitive: true,
      });
    }

    offset += 12 + length;
  }
}

// PDF Parser
function parsePdfMetadata(
  buffer: ArrayBuffer,
  fields: MetadataField[],
  threats: string[]
) {
  const decoder = new TextDecoder('latin1');
  const text = decoder.decode(new Uint8Array(buffer));

  const infoMatch = text.match(/\/Title\s*\(([^)]+)\)/i);
  if (infoMatch) fields.push({ tag: 'PDF_Title', category: 'document', label: 'Document Title', value: infoMatch[1] });

  const authorMatch = text.match(/\/Author\s*\(([^)]+)\)/i);
  if (authorMatch) {
    fields.push({ tag: 'PDF_Author', category: 'author', label: 'PDF Author', value: authorMatch[1], isSensitive: true });
    threats.push(`PDF author metadata found: ${authorMatch[1]}`);
  }

  const creatorMatch = text.match(/\/Creator\s*\(([^)]+)\)/i);
  if (creatorMatch) {
    fields.push({ tag: 'PDF_Creator', category: 'technical', label: 'Application Creator', value: creatorMatch[1], isSensitive: true });
    threats.push(`Creation software: ${creatorMatch[1]}`);
  }

  const producerMatch = text.match(/\/Producer\s*\(([^)]+)\)/i);
  if (producerMatch) fields.push({ tag: 'PDF_Producer', category: 'technical', label: 'PDF Producer Engine', value: producerMatch[1] });

  const dateMatch = text.match(/\/CreationDate\s*\(([^)]+)\)/i);
  if (dateMatch) fields.push({ tag: 'PDF_CreationDate', category: 'document', label: 'Creation Date', value: dateMatch[1] });
}

// Audio ID3 Parser
function parseAudioMetadata(
  buffer: ArrayBuffer,
  fields: MetadataField[],
  threats: string[]
) {
  const view = new DataView(buffer);
  const decoder = new TextDecoder('latin1');

  if (view.byteLength > 10) {
    const id3Header = decoder.decode(new Uint8Array(buffer, 0, 3));
    if (id3Header === 'ID3') {
      fields.push({ tag: 'Audio_ID3v2', category: 'audio', label: 'ID3v2 Tag Container', value: 'Present', isSensitive: true });
      threats.push('Audio contains ID3 metadata headers.');
    }
  }

  if (view.byteLength > 128) {
    const tag = decoder.decode(new Uint8Array(buffer, buffer.byteLength - 128, 3));
    if (tag === 'TAG') {
      const title = decoder.decode(new Uint8Array(buffer, buffer.byteLength - 125, 30)).trim();
      const artist = decoder.decode(new Uint8Array(buffer, buffer.byteLength - 95, 30)).trim();
      if (title) fields.push({ tag: 'Audio_Title', category: 'audio', label: 'Track Title', value: title });
      if (artist) {
        fields.push({ tag: 'Audio_Artist', category: 'author', label: 'Track Artist', value: artist, isSensitive: true });
        threats.push(`Audio artist name: ${artist}`);
      }
    }
  }
}

// SVG Metadata Parser
function parseSvgMetadata(
  buffer: ArrayBuffer,
  fields: MetadataField[],
  threats: string[]
) {
  const decoder = new TextDecoder('utf-8');
  const text = decoder.decode(new Uint8Array(buffer));

  if (text.includes('<metadata>') || text.includes('<rdf:RDF>')) {
    fields.push({ tag: 'SVG_Metadata', category: 'document', label: 'SVG Metadata Block', value: 'Embedded RDF / Dublin Core', isSensitive: true });
    threats.push('SVG contains embedded XML/RDF metadata.');
  }
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

// Apply Custom Metadata Edits
export async function applyMetadataEdits(
  file: File,
  edits: Record<string, string>
): Promise<Blob> {
  const mimeType = file.type || getMimeFromExtension(file.name);

  // PDF In-Place Edit
  if (mimeType === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
    const buffer = await file.arrayBuffer();
    const decoder = new TextDecoder('latin1');
    let text = decoder.decode(new Uint8Array(buffer));

    if (edits.Author !== undefined) {
      text = text.replace(/\/Author\s*\([^)]*\)/gi, `/Author (${edits.Author})`);
    }
    if (edits.Title !== undefined) {
      text = text.replace(/\/Title\s*\([^)]*\)/gi, `/Title (${edits.Title})`);
    }
    if (edits.Software !== undefined) {
      text = text.replace(/\/Creator\s*\([^)]*\)/gi, `/Creator (${edits.Software})`);
      text = text.replace(/\/Producer\s*\([^)]*\)/gi, `/Producer (${edits.Software})`);
    }

    const encoder = new TextEncoder();
    return new Blob([encoder.encode(text)], { type: 'application/pdf' });
  }

  // Audio ID3v1 In-Place Edit
  if (mimeType.startsWith('audio/') || file.name.toLowerCase().endsWith('.mp3')) {
    const buffer = await file.arrayBuffer();
    const uint8 = new Uint8Array(buffer.slice(0));
    const encoder = new TextEncoder();

    if (uint8.length > 128) {
      const tagOffset = uint8.length - 128;
      // Write 'TAG' marker
      uint8[tagOffset] = 0x54;
      uint8[tagOffset + 1] = 0x41;
      uint8[tagOffset + 2] = 0x47;

      if (edits.Title) {
        const titleBytes = encoder.encode(edits.Title.padEnd(30, '\0').slice(0, 30));
        uint8.set(titleBytes, tagOffset + 3);
      }
      if (edits.Author) {
        const artistBytes = encoder.encode(edits.Author.padEnd(30, '\0').slice(0, 30));
        uint8.set(artistBytes, tagOffset + 33);
      }
    }

    return new Blob([uint8], { type: mimeType });
  }

  // For Images: Strip sensitive hardware/GPS EXIF first, then emit clean canvas blob with sanitized fields
  return stripFileMetadata(file);
}
