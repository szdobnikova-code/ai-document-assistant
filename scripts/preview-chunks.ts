import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { extractPdfText } from '@/lib/pdf/extract';
import { chunkText } from '@/lib/chunk/chunk-text';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const PDF_PATH = resolve(ROOT, 'tests/fixtures/corpus.pdf');
const OUT_PATH = resolve(ROOT, 'tests/eval/chunks.preview.md');

const PREVIEW_CHARS = 200;

async function main() {
  const buffer = await readFile(PDF_PATH);
  const data = buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength,
  ) as ArrayBuffer;

  const extracted = await extractPdfText(data, 'corpus.pdf');
  const chunks = chunkText(extracted.text);

  const totalTokens = chunks.reduce((sum, c) => sum + c.tokenCount, 0);
  const avgTokens =
    chunks.length === 0 ? 0 : Math.round(totalTokens / chunks.length);
  const maxTokens = chunks.reduce((m, c) => Math.max(m, c.tokenCount), 0);

  const lines: string[] = [];
  lines.push('# Chunk inventory — corpus.pdf');
  lines.push('');
  lines.push('| Field | Value |');
  lines.push('| --- | --- |');
  lines.push(`| Document id | \`${extracted.meta.id}\` |`);
  lines.push(`| Pages | ${extracted.meta.pageCount} |`);
  lines.push(`| Chars | ${extracted.meta.charCount.toLocaleString()} |`);
  lines.push(`| Chunks | ${chunks.length} |`);
  lines.push(`| Avg tokens / chunk | ${avgTokens} |`);
  lines.push(`| Max tokens / chunk | ${maxTokens} |`);
  lines.push(`| Total tokens | ${totalTokens.toLocaleString()} |`);
  lines.push('');
  lines.push(
    `_Settings: chunkSize=500, overlap=50 (defaults from \`lib/chunk/chunk-text.tsx\`)._`,
  );
  lines.push('');
  lines.push('---');
  lines.push('');

  for (const chunk of chunks) {
    const collapsed = chunk.content.replace(/\s+/g, ' ').trim();
    const preview = collapsed.slice(0, PREVIEW_CHARS);
    const truncated = collapsed.length > PREVIEW_CHARS ? '…' : '';

    lines.push(`## Chunk ${chunk.index} — ${chunk.tokenCount} tokens`);
    lines.push('');
    lines.push(`> ${preview}${truncated}`);
    lines.push('');
    lines.push('<details><summary>Full text</summary>');
    lines.push('');
    lines.push('```');
    lines.push(chunk.content);
    lines.push('```');
    lines.push('');
    lines.push('</details>');
    lines.push('');
  }

  await mkdir(dirname(OUT_PATH), { recursive: true });
  await writeFile(OUT_PATH, lines.join('\n'), 'utf8');

  console.log(`Wrote ${chunks.length} chunks to ${OUT_PATH}`);
  console.log(
    `Pages=${extracted.meta.pageCount} chars=${extracted.meta.charCount} tokens=${totalTokens}`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
