import JSZip from 'jszip';

export type TextExportFormat = 'txt' | 'md';

export function buildTextExport(text: string, format: TextExportFormat) {
  const longest = Math.max(2, ...Array.from(text.matchAll(/`+/g), (run) => run[0].length));
  const fence = '`'.repeat(longest + 1);
  return {
    contents: format === 'md' ? `${fence}text\n${text}\n${fence}\n` : text,
    mime: format === 'md' ? 'text/markdown;charset=utf-8' : 'text/plain;charset=utf-8',
    filename: `sanitized.${format}`,
  };
}

export async function buildTextArchive(items: Array<{ name: string; contents: string }>): Promise<Blob> {
  const zip = new JSZip();
  items.forEach((item, index) => {
    zip.file(`${String(index + 1).padStart(2, '0')}.cleaned.txt`, item.contents);
  });
  return zip.generateAsync({ type: 'blob', compression: 'STORE' });
}
