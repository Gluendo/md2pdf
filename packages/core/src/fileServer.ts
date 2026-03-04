import * as http from 'http';
import handler from 'serve-handler';
import getPort from 'get-port';

export interface FileServer {
  server: http.Server;
  port: number;
}

/**
 * Start a local HTTP server serving a directory, for relative asset resolution.
 */
export async function startFileServer(basedir: string): Promise<FileServer> {
  const port = await getPort();
  const server = http.createServer((req, res) =>
    handler(req, res, { public: basedir })
  );

  await new Promise<void>((resolve) => {
    server.listen(port, () => resolve());
  });

  return { server, port };
}

/**
 * Close the file server.
 */
export async function stopFileServer(fileServer: FileServer): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    fileServer.server.close((err) => (err ? reject(err) : resolve()));
  });
}
