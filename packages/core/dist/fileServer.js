"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startFileServer = startFileServer;
exports.stopFileServer = stopFileServer;
const http = __importStar(require("http"));
const serve_handler_1 = __importDefault(require("serve-handler"));
const get_port_1 = __importDefault(require("get-port"));
/**
 * Start a local HTTP server serving a directory, for relative asset resolution.
 */
async function startFileServer(basedir) {
    const port = await (0, get_port_1.default)();
    const server = http.createServer((req, res) => (0, serve_handler_1.default)(req, res, { public: basedir }));
    await new Promise((resolve) => {
        server.listen(port, () => resolve());
    });
    return { server, port };
}
/**
 * Close the file server.
 */
async function stopFileServer(fileServer) {
    await new Promise((resolve, reject) => {
        fileServer.server.close((err) => (err ? reject(err) : resolve()));
    });
}
//# sourceMappingURL=fileServer.js.map