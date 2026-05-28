import { readdir, readFile } from 'node:fs/promises';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import sharp from 'sharp';

export async function compressPhotos(uploadId: string): Promise<string> {
  const srcDir = join(tmpdir(), 'heirloom-photos', uploadId);
  const destDir = join(srcDir, 'compressed');
  await mkdir(destDir, { recursive: true });

  const files = (await readdir(srcDir)).filter((f) => f !== 'compressed').sort();

  await Promise.all(
    files.map(async (file) => {
      const raw = await readFile(join(srcDir, file));
      const outName = file.replace(/\.[^.]+$/, '.jpg');
      await sharp(raw)
        .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 75 })
        .toFile(join(destDir, outName));
    }),
  );

  return destDir;
}
