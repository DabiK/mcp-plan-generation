#!/usr/bin/env node
import 'reflect-metadata';
import { bootstrapApp, container } from './di/container';
import { McpServer } from './infrastructure/mcp/McpServer';
import { HttpServer } from './infrastructure/http/HttpServer';
import { MongoDBConnection } from './infrastructure/persistence/mongodb/MongoDBConnection';
import { config } from './infrastructure/config/env';

async function main() {
  try {
    // Bootstrap application
    await bootstrapApp();

    // Start HTTP API server if enabled
    if (config.http.enabled) {
      const httpServer = container.resolve(HttpServer);
      await httpServer.start();
    }

    // Start MCP server if enabled
    if (config.mcp.enabled) {
      const mcpServer = container.resolve(McpServer);
      await mcpServer.start();
    }

    // If neither is enabled, warn user
    if (!config.http.enabled && !config.mcp.enabled) {
      console.error('⚠️  Warning: Both HTTP and MCP servers are disabled');
      console.error('    Set HTTP_ENABLED=true or MCP_ENABLED=true in .env');
    }

    // Graceful shutdown handlers
    const shutdown = async () => {
      console.error('Shutting down gracefully...');
      
      if (config.http.enabled) {
        const httpServer = container.resolve(HttpServer);
        await httpServer.stop();
      }
      
      const mongoConnection = container.resolve(MongoDBConnection);
      await mongoConnection.disconnect();
      
      process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

main();
