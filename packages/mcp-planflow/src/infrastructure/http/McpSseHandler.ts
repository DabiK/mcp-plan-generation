import { Request, Response } from 'express';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { injectable, inject } from 'tsyringe';
import { randomUUID } from 'crypto';

@injectable()
export class McpSseHandler {
  private transports = new Map<string, StreamableHTTPServerTransport>();

  constructor(@inject('McpServerInstance') private mcpServer: Server) {}

  async handleRequest(req: Request, res: Response): Promise<void> {
    const sessionId = req.headers['mcp-session-id'] as string | undefined;
    
    let transport: StreamableHTTPServerTransport;

    if (sessionId && this.transports.has(sessionId)) {
      // Réutiliser le transport existant pour cette session
      transport = this.transports.get(sessionId)!;
      console.error(`Reusing MCP session: ${sessionId}`);
    } else {
      // Nouveau transport - StreamableHTTP gère tout automatiquement
      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (id) => {
          console.error(`New MCP session initialized: ${id}`);
          this.transports.set(id, transport);
        }
      });

      transport.onclose = () => {
        const id = transport.sessionId;
        if (id) {
          console.error(`MCP session closed: ${id}`);
          this.transports.delete(id);
        }
      };

      await this.mcpServer.connect(transport);
    }

    // StreamableHTTPServerTransport gère automatiquement:
    // - GET: stream SSE
    // - POST: messages JSONRPC
    // - DELETE: fermeture de session
    await transport.handleRequest(req, res, req.body);
  }
}

