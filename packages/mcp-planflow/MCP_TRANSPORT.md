# MCP Transport Implementation

## StreamableHTTPServerTransport (Recommandé)

Le serveur utilise **StreamableHTTPServerTransport** du SDK MCP officiel, qui gère automatiquement le protocole MCP sur HTTP.

### Avantages par rapport à une implémentation manuelle :

1. **Tout est géré par le SDK** 
   - Pas besoin de gérer manuellement les endpoints GET/POST/DELETE
   - Gestion automatique des sessions et des IDs
   - Headers SSE configurés correctement

2. **Compatibilité garantie**
   - Suit le protocole MCP officiel (version 2025-11-25)
   - Compatible avec tous les clients MCP (VS Code, Claude Desktop, etc.)
   - Mises à jour automatiques avec le SDK

3. **Fonctionnalités avancées**
   - Gestion de sessions multi-clients
   - Reconnexion automatique
   - Event store pour resumabilité
   - Notifications serveur → client

4. **Moins de code à maintenir**
   - ~50 lignes au lieu de ~200 lignes
   - Pas de gestion manuelle du protocole SSE
   - Pas de parsing JSONRPC manuel

## Architecture

```
┌─────────────┐                    ┌──────────────────────┐
│  VS Code    │                    │  MCP Server          │
│  MCP Client │                    │                      │
└─────────────┘                    └──────────────────────┘
       │                                    │
       │  GET /mcp                          │
       │  (établit stream SSE)              │
       │───────────────────────────────────>│
       │<───────────────────────────────────│
       │  event: endpoint                   │
       │  data: /mcp?sessionId=xxx          │
       │                                    │
       │  POST /mcp                         │
       │  mcp-session-id: xxx               │
       │  {initialize request}              │
       │───────────────────────────────────>│
       │<───────────────────────────────────│
       │  {initialize response}             │
       │                                    │
       │  POST /mcp                         │
       │  {tools/list}                      │
       │───────────────────────────────────>│
       │<───────────────────────────────────│
       │  {tools list}                      │
       │                                    │
       │  event: message                    │
       │<───────────────────────────────────│
       │  data: {notification}              │
       │                                    │
       │  DELETE /mcp                       │
       │  (ferme la session)                │
       │───────────────────────────────────>│
       │<───────────────────────────────────│
       │  200 OK                            │
```

## Code simplifié

### Avant (implémentation manuelle SSE)

```typescript
export class McpSseHandler {
  private activeTransports = new Map<string, SSEServerTransport>();

  async handleSseStream(res: ServerResponse): Promise<void> {
    const transport = new SSEServerTransport('/sse', res);
    const sessionId = transport.sessionId;
    
    // Gestion manuelle des headers, cleanup, errors...
    this.activeTransports.set(sessionId, transport);
    
    transport.onclose = () => { /* ... */ };
    transport.onerror = (error) => { /* ... */ };
    
    await this.mcpServer.connect(transport);
  }

  async handleSseMessage(req: IncomingMessage, res: ServerResponse): Promise<void> {
    // Parser l'URL pour récupérer sessionId
    // Trouver le transport correspondant
    // Gérer les erreurs si session non trouvée
    // Forwarding manuel...
  }
}

// Dans HttpServer.ts, besoin de 3 routes :
app.get('/sse', ...);
app.post('/sse', ...);
app.options('/sse', ...);
```

### Après (StreamableHTTPServerTransport)

```typescript
export class McpSseHandler {
  private transports = new Map<string, StreamableHTTPServerTransport>();

  async handleRequest(req: Request, res: Response): Promise<void> {
    const sessionId = req.headers['mcp-session-id'] as string | undefined;
    
    let transport: StreamableHTTPServerTransport;

    if (sessionId && this.transports.has(sessionId)) {
      transport = this.transports.get(sessionId)!;
    } else {
      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (id) => {
          this.transports.set(id, transport);
        }
      });

      transport.onclose = () => {
        if (transport.sessionId) {
          this.transports.delete(transport.sessionId);
        }
      };

      await this.mcpServer.connect(transport);
    }

    // ✨ Une seule ligne - le SDK gère tout !
    await transport.handleRequest(req, res, req.body);
  }
}

// Dans HttpServer.ts, une seule route :
app.all('/mcp', ...);
```

## Configuration client

### VS Code `.vscode/mcp.json`

```json
{
  "mcpServers": {
    "planflow": {
      "url": "http://localhost:3000/mcp"
    }
  }
}
```

Le client détecte automatiquement StreamableHTTP et utilise le bon protocole.

## Références

- [MCP Specification - Streamable HTTP](https://modelcontextprotocol.io/specification/2025-11-25/basic/transports)
- [MCP SDK Examples](https://github.com/modelcontextprotocol/typescript-sdk/tree/main/examples/server)
- [StreamableHTTPServerTransport API](https://github.com/modelcontextprotocol/typescript-sdk/blob/main/packages/server/src/server/streamableHttp.ts)
