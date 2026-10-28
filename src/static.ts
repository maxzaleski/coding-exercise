import { readFile } from 'node:fs/promises';
import type { ServerResponse } from 'node:http';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const FRONTEND_DIR = fileURLToPath(new URL('../src/frontend/dist/', import.meta.url));

const contentTypes: Record<string, string> = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
};

/** Serve a file from the frontend build. Returns false if there is no such file. */
export async function serveFrontend(res: ServerResponse, pathname: string): Promise<boolean> {
  try {
    const filePath = join(FRONTEND_DIR, pathname === '/' ? 'index.html' : pathname);
    // Read before writing headers: a missing file must leave the response untouched so the
    // caller can still send a 404.
    const body = await readFile(filePath);
    res.writeHead(200, {
      'Content-Type': contentTypes[extname(filePath)] ?? 'application/octet-stream',
    });
    res.end(body);
    return true;
  } catch {
    return false;
  }
}
