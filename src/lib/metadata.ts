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

// JPEG EXIF & XMP Parser
function parseJpegMetadata(
  buffer: ArrayBuffer,
  fields: MetadataField[],
  threats: string[]
) {
  const view = new DataView(buffer);
  if (view.byteLength < 4 || view.getUint16(0) !== 0xffd8) return;

  let offset = 2;
  const decoder = new TextDecoder('latin1');

  while (offset < view.byteLength - 2) {
    const marker = view.getUint16(offset);
    offset += 2;

    if (marker === 0xffe1) {
      const length = view.getUint16(offset);
      const app1Offset = offset + 2;

      // 1. Check for EXIF "Exif\0\0"
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
      // 2. Check for XMP "http://ns.adobe.com/xap/1.0/\0"
      else {
        const headerStr = decoder.decode(new Uint8Array(buffer, app1Offset, Math.min(30, length)));
        if (headerStr.startsWith('http://ns.adobe.com/xap/1.0/')) {
          const xmpData = decoder.decode(new Uint8Array(buffer, app1Offset + 29, length - 29));
          parseXmpXml(xmpData, fields, threats);
        }
      }
      offset += length;
    } else if (marker === 0xffe2 || marker === 0xffed) {
      const length = view.getUint16(offset);
      threats.push('Photoshop/ICC metadata chunk found in file.');
      offset += length;
    } else if ((marker & 0xff00) === 0xff00 && marker !== 0xff00) {
      if (marker === 0xffda) break; // SOS
      const length = view.getUint16(offset);
      offset += length;
    } else {
      break;
    }
  }
}

function parseXmpXml(xmpText: string, fields: MetadataField[], threats: string[]) {
  // Title
  const titleMatch =
    xmpText.match(/<dc:title>[^<]*<rdf:li[^>]*>([^<]+)<\/rdf:li>/i) ||
    xmpText.match(/dc:title="([^"]+)"/i) ||
    xmpText.match(/<dc:title>([^<]+)<\/dc:title>/i);
  if (titleMatch && !fields.some((f) => f.tag === 'XMP_Title')) {
    fields.push({
      tag: 'XMP_Title',
      category: 'document',
      label: 'Document / Image Title',
      value: titleMatch[1].trim(),
    });
  }

  // Author / Creator
  const authorMatch =
    xmpText.match(/<dc:creator>[^<]*<rdf:li[^>]*>([^<]+)<\/rdf:li>/i) ||
    xmpText.match(/dc:creator="([^"]+)"/i) ||
    xmpText.match(/<dc:creator>([^<]+)<\/dc:creator>/i);
  if (authorMatch && !fields.some((f) => f.tag === 'XMP_Author')) {
    fields.push({
      tag: 'XMP_Author',
      category: 'author',
      label: 'Creator / Author',
      value: authorMatch[1].trim(),
      isSensitive: true,
    });
    threats.push(`Author name exposed in XMP: ${authorMatch[1].trim()}`);
  }

  // Software / CreatorTool
  const toolMatch =
    xmpText.match(/<xmp:CreatorTool>([^<]+)<\/xmp:CreatorTool>/i) ||
    xmpText.match(/xmp:CreatorTool="([^"]+)"/i);
  if (toolMatch && !fields.some((f) => f.tag === 'XMP_Software')) {
    fields.push({
      tag: 'XMP_Software',
      category: 'technical',
      label: 'Software Used',
      value: toolMatch[1].trim(),
    });
  }

  // Copyright / Rights
  const rightsMatch =
    xmpText.match(/<dc:rights>[^<]*<rdf:li[^>]*>([^<]+)<\/rdf:li>/i) ||
    xmpText.match(/dc:rights="([^"]+)"/i) ||
    xmpText.match(/<dc:rights>([^<]+)<\/dc:rights>/i);
  if (rightsMatch && !fields.some((f) => f.tag === 'XMP_Copyright')) {
    fields.push({
      tag: 'XMP_Copyright',
      category: 'author',
      label: 'Copyright Notice',
      value: rightsMatch[1].trim(),
    });
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
    case 0x010e:
      fields.push({ tag: 'ImageDescription', category: 'document', label: 'Image Description', value: strVal });
      break;
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
      const nullIdx = textContent.indexOf('\0');
      const keyword = nullIdx !== -1 ? textContent.slice(0, nullIdx) : textContent;
      const value = nullIdx !== -1 ? textContent.slice(nullIdx + 1).trim() : '';

      let category: MetadataField['category'] = 'document';
      let label = `PNG ${keyword}`;
      let tag = `PNG_${keyword}`;

      if (/author|artist|creator/i.test(keyword)) {
        category = 'author';
        label = 'Creator / Author';
        tag = 'PNG_Author';
      } else if (/title/i.test(keyword)) {
        category = 'document';
        label = 'Document / Image Title';
        tag = 'PNG_Title';
      } else if (/software|tool/i.test(keyword)) {
        category = 'technical';
        label = 'Software Used';
        tag = 'PNG_Software';
      } else if (/copyright|rights/i.test(keyword)) {
        category = 'author';
        label = 'Copyright Notice';
        tag = 'PNG_Copyright';
      }

      fields.push({
        tag,
        category,
        label,
        value: value || 'Embedded chunk',
        isSensitive: category === 'author',
      });
      if (category === 'author' && value) {
        threats.push(`Author name exposed in PNG chunk: ${value}`);
      }
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

// Helper to create JPEG XMP APP1 chunk
function createJpegXmpApp1(edits: Record<string, string>): Uint8Array {
  const enc = new TextEncoder();
  const author = edits.Author || '';
  const title = edits.Title || '';
  const software = edits.Software || 'AIScrubber';
  const copyright = edits.Copyright || '';

  const xmpXml = `<?xpacket begin="" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/" x:xmptk="AIScrubber">
 <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
  <rdf:Description rdf:about=""
    xmlns:dc="http://purl.org/dc/elements/1.1/"
    xmlns:xmp="http://ns.adobe.com/xap/1.0/">
   ${title ? `<dc:title><rdf:Alt><rdf:li xml:lang="x-default">${title}</rdf:li></rdf:Alt></dc:title>` : ''}
   ${author ? `<dc:creator><rdf:Seq><rdf:li>${author}</rdf:li></rdf:Seq></dc:creator>` : ''}
   ${copyright ? `<dc:rights><rdf:Alt><rdf:li xml:lang="x-default">${copyright}</rdf:li></rdf:Alt></dc:rights>` : ''}
   ${software ? `<xmp:CreatorTool>${software}</xmp:CreatorTool>` : ''}
  </rdf:Description>
 </rdf:RDF>
</x:xmpmeta>
<?xpacket end="w"?>`;

  const namespace = 'http://ns.adobe.com/xap/1.0/\0';
  const headerBytes = enc.encode(namespace);
  const xmlBytes = enc.encode(xmpXml);
  const payloadLen = headerBytes.length + xmlBytes.length;
  const markerLen = 2 + payloadLen;

  const app1 = new Uint8Array(2 + markerLen);
  const view = new DataView(app1.buffer);
  view.setUint16(0, 0xffe1, false);
  view.setUint16(2, markerLen, false);
  app1.set(headerBytes, 4);
  app1.set(xmlBytes, 4 + headerBytes.length);

  return app1;
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

  // 1. PNG IN-PLACE CHUNK INJECTION
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

        // Keep all chunks except old textual/exif chunks
        if (!['tEXt', 'zTXt', 'iTXt', 'eXIf'].includes(chunkType)) {
          filteredChunks.push(new Uint8Array(buffer, offset, totalChunkSize));
        }

        // If after IHDR chunk, inject our new custom tEXt chunks!
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

  // 2. JPEG IN-PLACE XMP APP1 INJECTION
  if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') {
    const buffer = await file.arrayBuffer();
    const view = new DataView(buffer);
    if (view.byteLength > 4 && view.getUint16(0) === 0xffd8) {
      const cleanSegments: Uint8Array[] = [new Uint8Array([0xff, 0xd8])]; // SOI marker

      // Inject our new clean XMP APP1 marker!
      const newXmpApp1 = createJpegXmpApp1(edits);
      cleanSegments.push(newXmpApp1);

      let offset = 2;
      while (offset < view.byteLength - 2) {
        const marker = view.getUint16(offset);
        offset += 2;

        if ((marker & 0xff00) === 0xff00 && marker !== 0xff00) {
          if (marker === 0xffda) {
            // SOS: rest of image stream
            cleanSegments.push(new Uint8Array(buffer, offset - 2));
            break;
          }

          const length = view.getUint16(offset);
          // Omit old APP1 (EXIF/GPS/XMP) and APP2/APP13 chunks so we don't leak old data
          if (marker !== 0xffe1 && marker !== 0xffe2 && marker !== 0xffed) {
            cleanSegments.push(new Uint8Array(buffer, offset - 2, 2 + length));
          }
          offset += length;
        } else {
          break;
        }
      }

      return new Blob(cleanSegments as BlobPart[], { type: 'image/jpeg' });
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

    // Check if /Info dictionary exists
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

    // Append standard XMP or info dictionary before trailer
    if (!text.includes(`/Author (${authorStr})`) && authorStr) {
      text = text.replace(/trailer\s*<<\s*/i, `trailer << /Info << /Author (${authorStr}) /Title (${titleStr}) /Creator (${softwareStr}) /Copyright (${copyStr}) >> `);
    }

    const encoder = new TextEncoder();
    return new Blob([encoder.encode(text)], { type: 'application/pdf' });
  }

  // 4. AUDIO (MP3/WAV) ID3v1 INJECTION
  if (mimeType.startsWith('audio/') || file.name.toLowerCase().endsWith('.mp3')) {
    const buffer = await file.arrayBuffer();
    // Base slice without old 128-byte tag if present
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
