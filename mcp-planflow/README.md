# MCP PlanFlow

A Model Context Protocol (MCP) server for managing implementation plans using hexagonal architecture.

## Overview

MCP PlanFlow provides AI assistants with structured tools to create, validate, and manage implementation plans. Plans follow a strict JSON schema with support for multiple plan types (feature, bugfix, refactor, etc.) and comprehensive dependency management.

## Features

- **📋 Plan Management**: Create, read, update, and list implementation plans
- **✅ Validation**: Schema validation + business rule enforcement (cycle detection, dependency validation)
- **🗄️ Persistence**: MongoDB storage with indexing and filtering
- **🏗️ Clean Architecture**: Hexagonal architecture with clear separation of concerns
- **💉 Dependency Injection**: TSyringe for testable, maintainable code
- **🔧 MCP Integration**: Full Model Context Protocol support via stdio transport

## Architecture

```
src/
├── domain/              # Core business logic (framework-independent)
│   ├── entities/        # Plan and Step entities
│   ├── value-objects/   # PlanId, StepId, enums
│   ├── services/        # DependencyGraphService
│   ├── repositories/    # Repository interfaces (ports)
│   └── errors/          # Domain exceptions
├── application/         # Use cases and DTOs
│   ├── use-cases/       # Application services
│   └── dtos/            # Data transfer objects
├── infrastructure/      # External concerns (adapters)
│   ├── mcp/             # MCP server implementation
│   ├── persistence/     # MongoDB repositories
│   └── validation/      # JSON Schema validation
└── di/                  # Dependency injection container
```

## Prerequisites

- Node.js >= 18
- MongoDB >= 6.0
- TypeScript 5.3+

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd mcp-planflow
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment:
```bash
cp .env.example .env
# Edit .env with your MongoDB connection string
```

4. Build the project:
```bash
npm run build
```

## Configuration

Create a `.env` file with the following variables:

```env
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=planflow
MONGODB_COLLECTION_NAME=plans
NODE_ENV=development
```

## Usage

### Running the MCP Server

```bash
npm start
```

The server runs on stdio transport and communicates via MCP protocol.

### MCP Configuration for VS Code

Add to your MCP settings (`.vscode/mcp-config.json` or global config):

```json
{
  "mcpServers": {
    "planflow": {
      "command": "node",
      "args": ["/path/to/mcp-planflow/dist/index.js"],
      "env": {
        "MONGODB_URI": "mongodb://localhost:27017",
        "MONGODB_DB_NAME": "planflow"
      }
    }
  }
}
```

### Available MCP Tools

#### 1. `get-plan-format`
Get the PlanFlow JSON schema specification, version, and constraints.

```json
{}
```

Returns the schema definition, supported plan types, and validation rules.

#### 2. `validate-plan`
Validate a plan against the schema and business rules.

```json
{
  "plan": {
    "schemaVersion": "1.0.0",
    "planType": "feature",
    "metadata": { ... },
    "plan": { ... },
    "steps": [ ... ]
  }
}
```

Returns validation result with errors and warnings.

#### 3. `create-plan`
Create a new implementation plan in the database.

```json
{
  "planData": {
    "schemaVersion": "1.0.0",
    "planType": "feature",
    ...
  }
}
```

Returns the created plan with generated ID and timestamps.

#### 4. `get-plan`
Retrieve a specific plan by ID.

```json
{
  "planId": "abc123xyz"
}
```

Returns the complete plan object.

#### 5. `update-plan`
Update an existing plan.

```json
{
  "planId": "abc123xyz",
  "updates": {
    "metadata": {
      "title": "Updated Title"
    },
    "steps": [ ... ]
  }
}
```

Returns the updated plan with incremented revision.

#### 6. `list-plans`
List plans with optional filters.

```json
{
  "planType": "feature",
  "status": "pending",
  "limit": 10,
  "offset": 0
}
```

Returns array of plans matching filters.

## Plan Schema

### Plan Types
- `feature` - New functionality
- `bugfix` - Bug fixes
- `refactor` - Code improvements
- `optimization` - Performance work
- `documentation` - Documentation updates
- `testing` - Test implementation
- `deployment` - Deployment tasks
- `maintenance` - General maintenance

### Step Kinds
- `setup` - Environment/dependency setup
- `implementation` - Code changes
- `testing` - Test creation/execution
- `validation` - Verification steps
- `deployment` - Deployment actions
- `documentation` - Documentation work
- `review` - Code review steps
- `analysis` - Investigation/analysis
- `cleanup` - Code cleanup

### Step Status
- `pending` - Not started
- `in_progress` - Currently working
- `completed` - Finished successfully
- `failed` - Failed execution
- `skipped` - Intentionally skipped
- `blocked` - Blocked by dependencies

## Example Plans

See the `examples/` directory for complete plan examples:

- `feature-authentication.json` - JWT authentication implementation
- `bugfix-memory-leak.json` - Memory leak investigation and fix
- `refactor-hexagonal-architecture.json` - Architecture refactoring

## Development

### Build
```bash
npm run build
```

### Watch Mode
```bash
npm run build:watch
```

### Run Tests
```bash
npm test
```

### Linting
```bash
npm run lint
```

### Format Code
```bash
npm run format
```

## Project Structure

### Domain Layer
Contains pure business logic with no external dependencies:

- **Entities**: `Plan` and `Step` with business methods
- **Value Objects**: Immutable identifiers and enums
- **Services**: `DependencyGraphService` for cycle detection and topological sorting
- **Repository Interfaces**: Define persistence contracts

### Application Layer
Orchestrates use cases:

- **Use Cases**: Application services implementing specific operations
- **DTOs**: Data transfer objects for API responses

### Infrastructure Layer
Handles external concerns:

- **MCP Server**: Implements MCP protocol with tool handlers
- **MongoDB**: Persistence with connection pooling and indexing
- **Validation**: Ajv-based JSON Schema validation

## Dependencies

### Core
- `@modelcontextprotocol/sdk` - MCP protocol implementation
- `tsyringe` - Dependency injection
- `mongodb` - Database driver
- `ajv` - JSON Schema validation
- `nanoid` - Unique ID generation

### Development
- `typescript` - Type checking
- `vitest` - Testing framework
- `eslint` - Code linting
- `prettier` - Code formatting

## License

MIT

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## Support

For issues and questions, please open a GitHub issue.
