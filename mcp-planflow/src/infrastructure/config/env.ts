import dotenv from 'dotenv';

dotenv.config();

export const config = {
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017',
    dbName: process.env.MONGODB_DB_NAME || 'planflow',
    maxPoolSize: parseInt(process.env.MONGODB_MAX_POOL_SIZE || '10'),
    minPoolSize: parseInt(process.env.MONGODB_MIN_POOL_SIZE || '2'),
  },
  app: {
    nodeEnv: process.env.NODE_ENV || 'development',
    logLevel: process.env.LOG_LEVEL || 'info',
  },
  http: {
    enabled: process.env.HTTP_ENABLED === 'true',
    port: parseInt(process.env.HTTP_PORT || '3000'),
    host: process.env.HTTP_HOST || '0.0.0.0',
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  },
  mcp: {
    enabled: process.env.MCP_ENABLED !== 'false',
    serverName: process.env.MCP_SERVER_NAME || 'planflow-mcp',
    serverVersion: process.env.MCP_SERVER_VERSION || '1.0.0',
  },
};
