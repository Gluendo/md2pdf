import { describe, it, expect, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { startFileServer, stopFileServer, FileServer } from '../../src/fileServer';

describe('fileServer', () => {
  let server: FileServer | undefined;
  let tmpDir: string;

  afterEach(async () => {
    if (server) {
      await stopFileServer(server).catch(() => {});
      server = undefined;
    }
    if (tmpDir) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('serves files from a directory on a random port', async () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'md2pdf-test-'));
    fs.writeFileSync(path.join(tmpDir, 'test.txt'), 'hello world');

    server = await startFileServer(tmpDir);
    expect(server.port).toBeGreaterThan(0);

    const response = await fetch(`http://localhost:${server.port}/test.txt`);
    expect(response.ok).toBe(true);
    const text = await response.text();
    expect(text).toBe('hello world');
  });

  it('returns 404 for non-existent files', async () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'md2pdf-test-'));
    server = await startFileServer(tmpDir);

    const response = await fetch(`http://localhost:${server.port}/nonexistent.txt`);
    expect(response.status).toBe(404);
  });

  it('stops cleanly', async () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'md2pdf-test-'));
    server = await startFileServer(tmpDir);
    const port = server.port;

    await stopFileServer(server);
    server = undefined;

    // Connection should fail after stop
    await expect(fetch(`http://localhost:${port}/test`)).rejects.toThrow();
  });
});
