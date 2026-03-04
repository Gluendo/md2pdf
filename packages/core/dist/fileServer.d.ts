import * as http from 'http';
export interface FileServer {
    server: http.Server;
    port: number;
}
/**
 * Start a local HTTP server serving a directory, for relative asset resolution.
 */
export declare function startFileServer(basedir: string): Promise<FileServer>;
/**
 * Close the file server.
 */
export declare function stopFileServer(fileServer: FileServer): Promise<void>;
