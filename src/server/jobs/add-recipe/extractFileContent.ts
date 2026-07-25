import { readdir, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { extname, join } from 'node:path';
import { extractText, getDocumentProxy } from 'unpdf';
import { cleanHtmlContent } from '#/server/jobs/add-recipe/scrapeAndCleanContent';
import { createError } from '#/server/utils/createError';

async function extractPdfText(buffer: Buffer): Promise<string> {
  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  const { text } = await extractText(pdf, { mergePages: true });
  return text.trim();
}

export async function extractFileContent(uploadId: string): Promise<string> {
  const dir = join(tmpdir(), 'heirloom-files', uploadId);
  const [fileName] = await readdir(dir);
  if (!fileName) {
    throw createError({ statusCode: 400, statusMessage: 'No uploaded file found' });
  }

  const filePath = join(dir, fileName);
  const ext = extname(fileName).toLowerCase();

  let content: string;
  switch (ext) {
    case '.txt':
      content = await readFile(filePath, 'utf-8');
      break;
    case '.html':
    case '.htm':
      content = cleanHtmlContent(await readFile(filePath, 'utf-8'));
      break;
    case '.pdf':
      content = await extractPdfText(await readFile(filePath));
      break;
    default:
      throw createError({ statusCode: 400, statusMessage: `Unsupported file type: ${ext}` });
  }

  if (!content.trim()) {
    throw createError({
      statusCode: 400,
      statusMessage:
        'No text could be extracted from this file. Scanned or image-only PDFs are not supported.',
    });
  }

  return content;
}
