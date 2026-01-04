# MCP PlanFlow Monorepo

A complete solution for managing and visualizing implementation plans using the Model Context Protocol.

## 📦 Packages

### [`mcp-planflow`](./mcp-planflow)
MCP server for creating, validating, and managing implementation plans with MongoDB persistence.

**Features:**
- 6 MCP tools (create, get, update, list, validate, get-format)
- Hexagonal architecture
- Dependency injection with TSyringe
- MongoDB persistence
- JSON Schema validation with cycle detection

### [`packages/planflow-viewer`](./packages/planflow-viewer) *(coming soon)*
Web-based visualization interface for implementation plans.

**Features:**
- Interactive workflow visualization
- Dependency graph display
- Step execution tracking
- Real-time plan updates

## 🚀 Quick Start

### Prerequisites
- Node.js >= 18
- pnpm >= 8
- MongoDB >= 6.0

### Installation

```bash
# Install all dependencies
pnpm install

# Build all packages
pnpm build
```

### Development

```bash
# Run all packages in dev mode (parallel)
pnpm dev

# Build all packages
pnpm build

# Run tests across all packages
pnpm test

# Lint all packages
pnpm lint
```

### Working with individual packages

```bash
# Run commands in specific package
pnpm --filter mcp-planflow build
pnpm --filter planflow-viewer dev

# Or navigate to package directory
cd mcp-planflow
pnpm build
```

## 📁 Project Structure

```
MCP-Plan/
├── package.json              # Root package (workspace config)
├── pnpm-workspace.yaml       # pnpm workspace definition
├── .npmrc                    # pnpm configuration
├── mcp-planflow/            # MCP server package
│   ├── src/
│   │   ├── domain/          # Core business logic
│   │   ├── application/     # Use cases & DTOs
│   │   ├── infrastructure/  # MCP, MongoDB, validation
│   │   └── di/              # Dependency injection
│   └── package.json
└── packages/
    └── planflow-viewer/     # Visualization UI (TBD)
        ├── src/
        └── package.json
```

## 🔧 Available Commands

| Command | Description |
|---------|-------------|
| `pnpm install` | Install dependencies for all packages |
| `pnpm build` | Build all packages |
| `pnpm dev` | Run all packages in development mode |
| `pnpm clean` | Clean all node_modules and build artifacts |
| `pnpm lint` | Lint all packages |
| `pnpm format` | Format code across all packages |
| `pnpm test` | Run tests for all packages |

## 🔗 Cross-Package Dependencies

The viewer package can depend on shared types from the MCP server:

```json
{
  "dependencies": {
    "mcp-planflow": "workspace:*"
  }
}
```

## 📝 License

MIT

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request
