export const TEXT_BATCH_LIMITS = Object.freeze({
  maxFiles: 20,
  maxFileBytes: 5 * 1024 * 1024,
  maxTotalBytes: 20 * 1024 * 1024,
});

export interface TextBatchFile { name: string; size: number; text?: string; }
export type TextBatchStatus = 'queued' | 'running' | 'review' | 'failed' | 'cancelled';
export interface TextBatchResult extends TextBatchFile { id: string; status: TextBatchStatus; output?: string; error?: string; }

export function validateBatchSelection(files: Array<{ name: string; size: number }>): void {
  if (files.length > TEXT_BATCH_LIMITS.maxFiles) throw new Error('Text batches support at most 20 files.');
  let total = 0;
  for (const file of files) {
    if (!/\.(?:txt|md|log|json|csv)$/i.test(file.name)) {
      throw new Error('Only supported text files can be processed.');
    }
    if (file.size > TEXT_BATCH_LIMITS.maxFileBytes) throw new Error('Each text file must be 5 MiB or smaller.');
    total += file.size;
  }
  if (total > TEXT_BATCH_LIMITS.maxTotalBytes) throw new Error('Text batch total must be 20 MiB or smaller.');
}

export async function processTextBatch(
  files: TextBatchFile[],
  process: (file: TextBatchFile) => Promise<string>,
  signal?: AbortSignal
): Promise<TextBatchResult[]> {
  validateBatchSelection(files);
  const results: TextBatchResult[] = [];
  for (let index = 0; index < files.length; index++) {
    const file = files[index];
    const id = `text-${index + 1}`;
    if (signal?.aborted) {
      results.push({ ...file, id, status: 'cancelled' });
      continue;
    }
    try {
      const output = await process(file);
      results.push({ ...file, id, status: 'review', output });
    } catch (error) {
      results.push({ ...file, id, status: 'failed', error: error instanceof Error ? error.message : 'Processing failed' });
    }
  }
  return results;
}
