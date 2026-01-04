# Plan d'Implémentation - Serveur MCP PlanFlow

## Vue d'ensemble

Ce plan détaille l'implémentation du serveur MCP pour PlanFlow avec architecture hexagonale, permettant à Copilot/LLM de gérer des plans d'implémentation structurés en JSON, avec persistance MongoDB.

---

## Architecture du Projet

### Structure des dossiers (Architecture Hexagonale)

```
mcp-planflow/
├── src/
│   ├── domain/                      # Couche Domain (Cœur métier)
│   │   ├── entities/
│   │   │   ├── Plan.ts              # Entité Plan
│   │   │   └── Step.ts              # Entité Step
│   │   ├── value-objects/
│   │   │   ├── PlanId.ts
│   │   │   ├── StepId.ts
│   │   │   ├── PlanType.ts
│   │   │   ├── StepKind.ts
│   │   │   └── StepStatus.ts
│   │   ├── repositories/
│   │   │   └── IPlanRepository.ts   # Interface du repository
│   │   ├── services/
│   │   │   ├── PlanService.ts       # Logique métier
│   │   │   └── DependencyGraphService.ts
│   │   └── errors/
│   │       ├── PlanNotFoundError.ts
│   │       ├── ValidationError.ts
│   │       └── CyclicDependencyError.ts
│   │
│   ├── application/                 # Couche Application (Use Cases)
│   │   ├── use-cases/
│   │   │   ├── GetPlanFormatUseCase.ts
│   │   │   ├── ValidatePlanUseCase.ts
│   │   │   ├── CreatePlanUseCase.ts
│   │   │   ├── GetPlanUseCase.ts
│   │   │   ├── UpdatePlanUseCase.ts
│   │   │   └── ListPlansUseCase.ts
│   │   ├── dtos/
│   │   │   ├── PlanDTO.ts
│   │   │   ├── ValidationResultDTO.ts
│   │   │   └── index.ts
│   │   └── ports/
│   │       ├── ILogger.ts
│   │       └── IIdGenerator.ts
│   │
│   ├── infrastructure/              # Couche Infrastructure (Adapters)
│   │   ├── mcp/
│   │   │   ├── McpServer.ts         # Serveur MCP principal
│   │   │   └── tools/
│   │   │       ├── get-plan-format.ts
│   │   │       ├── validate-plan.ts
│   │   │       ├── create-plan.ts
│   │   │       ├── get-plan.ts
│   │   │       ├── update-plan.ts
│   │   │       ├── list-plans.ts
│   │   │       └── index.ts
│   │   ├── persistence/
│   │   │   ├── mongodb/
│   │   │   │   ├── MongoDBConnection.ts
│   │   │   │   ├── MongoDBPlanRepository.ts
│   │   │   │   └── mappers/
│   │   │   │       └── PlanMapper.ts
│   │   │   └── schemas/
│   │   │       └── plan.schema.ts   # Schema MongoDB
│   │   ├── validation/
│   │   │   ├── PlanValidator.ts     # Validation Ajv
│   │   │   ├── CycleDetector.ts
│   │   │   └── schemas/
│   │   │       └── planflow-v1.0.0.json
│   │   ├── config/
│   │   │   ├── container.ts         # Configuration TSyringe
│   │   │   └── env.ts               # Variables d'environnement
│   │   └── logger/
│   │       └── ConsoleLogger.ts
│   │
│   └── index.ts                     # Point d'entrée
│
├── examples/                        # Exemples de plans
│   ├── simple-feature.json
│   ├── refactor.json
│   └── migration.json
│
├── tests/
│   ├── unit/
│   │   ├── domain/
│   │   └── application/
│   ├── integration/
│   │   ├── mcp-tools/
│   │   └── persistence/
│   └── e2e/
│
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

---

## Spécifications du Domain

### 1. Entités

#### **Plan**
Entité racine représentant un plan d'implémentation.

**Propriétés** :
- `id: PlanId` - Identifiant unique (Value Object)
- `schemaVersion: string` - Version du schéma (ex: "1.0.0")
- `planType: PlanType` - Type de plan (feature, refactor, migration, etc.)
- `metadata: PlanMetadata` - Métadonnées du plan
- `plan: PlanDetails` - Détails du plan
- `steps: Step[]` - Liste des steps
- `createdAt: Date`
- `updatedAt: Date`
- `revision: number`

**Méthodes** :
- `addStep(step: Step): void`
- `removeStep(stepId: StepId): void`
- `updateStep(stepId: StepId, updates: Partial<Step>): void`
- `getStep(stepId: StepId): Step | undefined`
- `validate(): ValidationResult`
- `hasCyclicDependencies(): boolean`
- `getExecutionOrder(): Step[]`

#### **Step**
Entité représentant une étape du plan.

**Propriétés** :
- `id: StepId` - Identifiant unique
- `title: string` - Titre de l'étape
- `description: string` - Description détaillée
- `kind: StepKind` - Type d'action
- `status: StepStatus` - Statut d'exécution
- `dependsOn: StepId[]` - Dépendances
- `estimatedDuration?: Duration` - Durée estimée
- `actions: Action[]` - Actions à effectuer
- `validation?: ValidationCriteria` - Critères de validation

**Méthodes** :
- `addDependency(stepId: StepId): void`
- `removeDependency(stepId: StepId): void`
- `canExecute(completedSteps: Set<StepId>): boolean`
- `markAsCompleted(): void`
- `markAsInProgress(): void`

### 2. Value Objects

#### **PlanId**
```typescript
class PlanId {
  private readonly value: string;
  
  constructor(value: string) {
    if (!value || value.length < 1) {
      throw new Error('PlanId cannot be empty');
    }
    this.value = value;
  }
  
  toString(): string {
    return this.value;
  }
  
  equals(other: PlanId): boolean {
    return this.value === other.value;
  }
}
```

#### **StepId**
Similaire à PlanId, identifiant unique pour un step.

#### **PlanType**
```typescript
enum PlanType {
  FEATURE = 'feature',
  REFACTOR = 'refactor',
  MIGRATION = 'migration',
  BUGFIX = 'bugfix',
  OPTIMIZATION = 'optimization',
  DOCUMENTATION = 'documentation'
}
```

#### **StepKind**
```typescript
enum StepKind {
  CREATE_FILE = 'create_file',
  EDIT_FILE = 'edit_file',
  DELETE_FILE = 'delete_file',
  RUN_COMMAND = 'run_command',
  TEST = 'test',
  REVIEW = 'review',
  DOCUMENTATION = 'documentation',
  CUSTOM = 'custom'
}
```

#### **StepStatus**
```typescript
enum StepStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  SKIPPED = 'skipped',
  BLOCKED = 'blocked'
}
```

### 3. Services du Domain

#### **PlanService**
Service gérant la logique métier des plans.

**Responsabilités** :
- Créer un plan valide
- Valider les règles métier
- Gérer les transitions de statut
- Calculer l'ordre d'exécution des steps

#### **DependencyGraphService**
Service gérant le graphe de dépendances.

**Responsabilités** :
- Détecter les cycles
- Calculer l'ordre topologique
- Valider les références de dépendances
- Identifier les steps bloqués

### 4. Repository Interface

#### **IPlanRepository**
```typescript
interface IPlanRepository {
  save(plan: Plan): Promise<void>;
  findById(id: PlanId): Promise<Plan | null>;
  findAll(filters?: PlanFilters): Promise<Plan[]>;
  update(id: PlanId, plan: Plan): Promise<void>;
  delete(id: PlanId): Promise<void>;
  exists(id: PlanId): Promise<boolean>;
}

interface PlanFilters {
  planType?: PlanType;
  status?: StepStatus;
  createdAfter?: Date;
  createdBefore?: Date;
  limit?: number;
  offset?: number;
}
```

---

## Schémas

### 1. JSON Schema (Validation)

Le schéma complet est stocké dans `src/infrastructure/validation/schemas/planflow-v1.0.0.json`.

**Structure principale** :
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "https://planflow.dev/schema/v1.0.0",
  "title": "PlanFlow Implementation Plan",
  "type": "object",
  "required": ["schemaVersion", "planType", "metadata", "plan", "steps"],
  "properties": {
    "schemaVersion": {
      "type": "string",
      "const": "1.0.0"
    },
    "planType": {
      "type": "string",
      "enum": ["feature", "refactor", "migration", "bugfix", "optimization", "documentation"]
    },
    "metadata": { ... },
    "plan": { ... },
    "steps": {
      "type": "array",
      "items": { "$ref": "#/definitions/Step" }
    }
  },
  "definitions": { ... }
}
```

### 2. MongoDB Schema

Le schéma MongoDB est défini avec les contraintes suivantes :

```typescript
// Collection: plans
{
  _id: ObjectId,
  planId: String (unique, indexed),
  schemaVersion: String,
  planType: String,
  metadata: {
    title: String,
    description: String,
    author: String,
    createdAt: Date,
    updatedAt: Date,
    tags: [String],
    revision: Number
  },
  plan: {
    objective: String,
    scope: String,
    constraints: [String],
    assumptions: [String],
    successCriteria: [String]
  },
  steps: [{
    id: String,
    title: String,
    description: String,
    kind: String,
    status: String,
    dependsOn: [String],
    estimatedDuration: {
      value: Number,
      unit: String
    },
    actions: [Mixed],
    validation: {
      criteria: [String],
      automatedTests: [String]
    }
  }],
  createdAt: Date,
  updatedAt: Date,
  revision: Number
}

// Index
db.plans.createIndex({ planId: 1 }, { unique: true })
db.plans.createIndex({ planType: 1 })
db.plans.createIndex({ "metadata.createdAt": -1 })
db.plans.createIndex({ "steps.status": 1 })
```

---

## Phase 1 : Configuration Initiale

### Étape 1.1 : Initialiser le projet
**Durée estimée** : 30 minutes

**Actions** :
- Créer le dossier `mcp-planflow/`
- Initialiser npm : `npm init -y`
- Installer les dépendances de base :
  ```bash
  npm install @modelcontextprotocol/sdk mongodb ajv ajv-formats nanoid dotenv tsyringe reflect-metadata
  npm install -D typescript @types/node tsx vitest
  ```
- Créer la structure de dossiers (architecture hexagonale)

**Vérification** :
- `package.json` est créé
- Dossiers src/ créés

---

### Étape 1.2 : Configuration TypeScript
**Durée estimée** : 20 minutes

**Actions** :
- Créer `tsconfig.json` :
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```
- Ajouter scripts dans `package.json` :
```json
{
  "scripts": {
    "build": "tsc",
    "dev": "tsx watch src/index.ts",
    "start": "node dist/index.js",
    "test": "vitest",
    "lint": "eslint src/**/*.ts"
  }
}
```

**Vérification** :
- `npm run build` compile sans erreur

---

### Étape 1.3 : Configuration des variables d'environnement
**Durée estimée** : 15 minutes

**Actions** :
- Créer `.env.example` :
```env
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=planflow
MONGODB_MAX_POOL_SIZE=10
MONGODB_MIN_POOL_SIZE=2

# Application Configuration
NODE_ENV=development
LOG_LEVEL=info

# MCP Configuration
MCP_SERVER_NAME=planflow-mcp
MCP_SERVER_VERSION=1.0.0
```

- Créer `src/infrastructure/config/env.ts` :
```typescript
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
  mcp: {
    serverName: process.env.MCP_SERVER_NAME || 'planflow-mcp',
    serverVersion: process.env.MCP_SERVER_VERSION || '1.0.0',
  },
};
```

- Ajouter `.env` au `.gitignore`

**Vérification** :
- Les variables sont chargées correctement

---

## Phase 2 : Domain Layer

### Étape 2.1 : Créer les Value Objects
**Durée estimée** : 1 heure

**Actions** :
- Créer `src/domain/value-objects/PlanId.ts`
- Créer `src/domain/value-objects/StepId.ts`
- Créer `src/domain/value-objects/PlanType.ts` (enum)
- Créer `src/domain/value-objects/StepKind.ts` (enum)
- Créer `src/domain/value-objects/StepStatus.ts` (enum)
- Créer `src/domain/value-objects/index.ts` pour les exports

**Fichiers** :
- `src/domain/value-objects/*.ts`

**Vérification** :
- Les Value Objects sont immutables
- Validation dans les constructeurs

---

### Étape 2.2 : Créer les entités
**Durée estimée** : 2 heures

**Actions** :
- Créer `src/domain/entities/Step.ts` :
  - Propriétés du step
  - Méthodes de gestion des dépendances
  - Transitions de statut
- Créer `src/domain/entities/Plan.ts` :
  - Propriétés du plan
  - Méthodes CRUD sur les steps
  - Validation métier
  - Gestion de la révision

**Fichiers** :
- `src/domain/entities/Step.ts`
- `src/domain/entities/Plan.ts`

**Vérification** :
- Les entités encapsulent la logique métier
- Pas de dépendances externes

---

### Étape 2.3 : Créer les services du domain
**Durée estimée** : 2 heures

**Actions** :
- Créer `src/domain/services/DependencyGraphService.ts` :
  - Algorithme de détection de cycles (DFS)
  - Tri topologique pour ordre d'exécution
  - Validation des références
- Créer `src/domain/services/PlanService.ts` :
  - Création de plan valide
  - Validation des règles métier
  - Calcul des métriques

**Fichiers** :
- `src/domain/services/DependencyGraphService.ts`
- `src/domain/services/PlanService.ts`

**Vérification** :
- Détection de cycles fonctionne
- Ordre topologique correct

---

### Étape 2.4 : Créer les erreurs du domain
**Durée estimée** : 30 minutes

**Actions** :
- Créer `src/domain/errors/PlanNotFoundError.ts`
- Créer `src/domain/errors/ValidationError.ts`
- Créer `src/domain/errors/CyclicDependencyError.ts`
- Créer `src/domain/errors/DomainError.ts` (classe de base)

**Fichiers** :
- `src/domain/errors/*.ts`

**Vérification** :
- Hiérarchie d'erreurs claire

---

### Étape 2.5 : Créer l'interface du repository
**Durée estimée** : 30 minutes

**Actions** :
- Créer `src/domain/repositories/IPlanRepository.ts`
- Définir les méthodes CRUD
- Définir les types de filtres

**Fichiers** :
- `src/domain/repositories/IPlanRepository.ts`

**Vérification** :
- Interface complète et claire

---

## Phase 3 : Infrastructure Layer - Validation

### Étape 3.1 : Créer le JSON Schema
**Durée estimée** : 1 heure

**Actions** :
- Créer `src/infrastructure/validation/schemas/planflow-v1.0.0.json`
- Définir le schéma complet selon FEATURE.MD
- Valider le JSON

**Fichiers** :
- `src/infrastructure/validation/schemas/planflow-v1.0.0.json`

**Vérification** :
- JSON valide
- Schéma complet

---

### Étape 3.2 : Implémenter le validateur
**Durée estimée** : 2 heures

**Actions** :
- Créer `src/infrastructure/validation/PlanValidator.ts` :
  - Charger le JSON Schema
  - Configurer Ajv avec formats
  - Valider contre le schéma
  - Validations supplémentaires :
    - IDs uniques
    - Références valides
    - Pas de cycles
- Créer `src/infrastructure/validation/CycleDetector.ts`
- Formatter les erreurs

**Fichiers** :
- `src/infrastructure/validation/PlanValidator.ts`
- `src/infrastructure/validation/CycleDetector.ts`

**Vérification** :
- Validation Ajv fonctionne
- Détection de cycles fonctionne
- Messages d'erreur clairs

---

## Phase 4 : Infrastructure Layer - Persistence

### Étape 4.1 : Implémenter la connexion MongoDB
**Durée estimée** : 1 heure

**Actions** :
- Créer `src/infrastructure/persistence/mongodb/MongoDBConnection.ts` :
  - Singleton de connexion
  - Configuration depuis .env
  - Connection pooling
  - Retry logic
  - Health check
  - Gestion de la déconnexion

**Fichiers** :
- `src/infrastructure/persistence/mongodb/MongoDBConnection.ts`

**Vérification** :
- Connexion à MongoDB fonctionne
- Retry en cas d'échec

---

### Étape 4.2 : Créer le schema MongoDB
**Durée estimée** : 30 minutes

**Actions** :
- Créer `src/infrastructure/persistence/schemas/plan.schema.ts`
- Définir les indexes
- Script de création d'indexes

**Fichiers** :
- `src/infrastructure/persistence/schemas/plan.schema.ts`

**Vérification** :
- Schema correspond au domain

---

### Étape 4.3 : Créer les mappers
**Durée estimée** : 1.5 heures

**Actions** :
- Créer `src/infrastructure/persistence/mongodb/mappers/PlanMapper.ts` :
  - `toDomain(doc: MongoDocument): Plan`
  - `toPersistence(plan: Plan): MongoDocument`
  - Mapper les Value Objects
  - Mapper les dates

**Fichiers** :
- `src/infrastructure/persistence/mongodb/mappers/PlanMapper.ts`

**Vérification** :
- Mapping bidirectionnel fonctionne
- Pas de perte de données

---

### Étape 4.4 : Implémenter le repository MongoDB
**Durée estimée** : 3 heures

**Actions** :
- Créer `src/infrastructure/persistence/mongodb/MongoDBPlanRepository.ts` :
  - Implémente `IPlanRepository`
  - Méthode `save()` : insert/upsert
  - Méthode `findById()` : query par planId
  - Méthode `findAll()` : avec filtres et pagination
  - Méthode `update()` : avec increment de revision
  - Méthode `delete()` : suppression
  - Méthode `exists()` : vérification
  - Gestion des erreurs MongoDB
  - Utiliser PlanMapper

**Fichiers** :
- `src/infrastructure/persistence/mongodb/MongoDBPlanRepository.ts`

**Vérification** :
- Toutes les opérations CRUD fonctionnent
- Erreurs gérées correctement
- Mapping fonctionne

---

## Phase 5 : Application Layer

### Étape 5.1 : Créer les DTOs
**Durée estimée** : 1 heure

**Actions** :
- Créer `src/application/dtos/PlanDTO.ts`
- Créer `src/application/dtos/StepDTO.ts`
- Créer `src/application/dtos/ValidationResultDTO.ts`
- Créer `src/application/dtos/CreatePlanDTO.ts`
- Créer mappers Domain <-> DTO

**Fichiers** :
- `src/application/dtos/*.ts`

**Vérification** :
- DTOs correspondent aux besoins des tools MCP

---

### Étape 5.2 : Créer les Use Cases
**Durée estimée** : 3 heures

**Actions** :
- Créer `src/application/use-cases/GetPlanFormatUseCase.ts` :
  - Retourne le JSON Schema
  - Inclut les exemples
  - Inclut les constraints
- Créer `src/application/use-cases/ValidatePlanUseCase.ts` :
  - Valide via PlanValidator
  - Retourne ValidationResultDTO
- Créer `src/application/use-cases/CreatePlanUseCase.ts` :
  - Génère un ID unique (nanoid)
  - Valide le plan
  - Crée l'entité Plan
  - Persiste via repository
  - Retourne PlanDTO
- Créer `src/application/use-cases/GetPlanUseCase.ts` :
  - Récupère depuis repository
  - Convertit en DTO
- Créer `src/application/use-cases/UpdatePlanUseCase.ts` :
  - Récupère le plan existant
  - Valide les changements
  - Incrémente revision
  - Met à jour via repository
- Créer `src/application/use-cases/ListPlansUseCase.ts` :
  - Liste avec filtres
  - Pagination
  - Convertit en DTOs

**Fichiers** :
- `src/application/use-cases/*.ts`

**Vérification** :
- Chaque use case est testable indépendamment
- Dépendances injectées via constructeur

---

## Phase 6 : Infrastructure Layer - MCP

### Étape 6.1 : Initialiser le serveur MCP
**Durée estimée** : 1 heure

**Actions** :
- Créer `src/infrastructure/mcp/McpServer.ts` :
  - Initialiser avec SDK MCP
  - Transport stdio
  - Métadonnées serveur
  - Enregistrement des tools
- Créer `src/index.ts` : point d'entrée

**Fichiers** :
- `src/infrastructure/mcp/McpServer.ts`
- `src/index.ts`

**Vérification** :
- Serveur démarre
- Répond au protocole MCP

---

### Étape 6.2 : Tool - get_plan_format
**Durée estimée** : 45 minutes

**Actions** :
- Créer `src/infrastructure/mcp/tools/get-plan-format.ts` :
  - Input : aucun
  - Appelle GetPlanFormatUseCase
  - Retourne schéma + exemples + docs
  - Format MCP

**Fichiers** :
- `src/infrastructure/mcp/tools/get-plan-format.ts`

**Vérification** :
- Tool retourne le schéma complet

---

### Étape 6.3 : Tool - validate_plan
**Durée estimée** : 45 minutes

**Actions** :
- Créer `src/infrastructure/mcp/tools/validate-plan.ts` :
  - Input : `{ plan: object }`
  - Appelle ValidatePlanUseCase
  - Retourne `{ isValid, errors, warnings }`
  - Format MCP

**Fichiers** :
- `src/infrastructure/mcp/tools/validate-plan.ts`

**Vérification** :
- Validation fonctionne
- Erreurs formatées

---

### Étape 6.4 : Tool - create_plan
**Durée estimée** : 1 heure

**Actions** :
- Créer `src/infrastructure/mcp/tools/create-plan.ts` :
  - Input : `{ plan: object, source?: string }`
  - Appelle CreatePlanUseCase
  - Retourne `{ planId, plan }`
  - Gestion des erreurs

**Fichiers** :
- `src/infrastructure/mcp/tools/create-plan.ts`

**Vérification** :
- Plans créés dans MongoDB
- Erreurs gérées

---

### Étape 6.5 : Tool - get_plan
**Durée estimée** : 45 minutes

**Actions** :
- Créer `src/infrastructure/mcp/tools/get-plan.ts` :
  - Input : `{ planId: string }`
  - Appelle GetPlanUseCase
  - Retourne le plan
  - 404 si inexistant

**Fichiers** :
- `src/infrastructure/mcp/tools/get-plan.ts`

**Vérification** :
- Plans récupérés depuis MongoDB

---

### Étape 6.6 : Tool - update_plan
**Durée estimée** : 1 heure

**Actions** :
- Créer `src/infrastructure/mcp/tools/update-plan.ts` :
  - Input : `{ planId: string, plan: object }`
  - Appelle UpdatePlanUseCase
  - Retourne le plan mis à jour

**Fichiers** :
- `src/infrastructure/mcp/tools/update-plan.ts`

**Vérification** :
- Mise à jour fonctionne
- Revision incrémentée

---

### Étape 6.7 : Tool - list_plans
**Durée estimée** : 1 heure

**Actions** :
- Créer `src/infrastructure/mcp/tools/list-plans.ts` :
  - Input : `{ planType?, status?, limit?, offset? }`
  - Appelle ListPlansUseCase
  - Retourne `{ plans, total, limit, offset }`

**Fichiers** :
- `src/infrastructure/mcp/tools/list-plans.ts`

**Vérification** :
- Filtres fonctionnent
- Pagination fonctionne

---

### Étape 6.8 : Enregistrer tous les tools
**Durée estimée** : 30 minutes

**Actions** :
- Créer `src/infrastructure/mcp/tools/index.ts`
- Enregistrer les 6 tools dans McpServer
- Définir les schémas d'input
- Ajouter descriptions

**Fichiers** :
- `src/infrastructure/mcp/tools/index.ts`
- Mise à jour de `src/infrastructure/mcp/McpServer.ts`

**Vérification** :
- Tous les tools listés

---

## Phase 7 : Dependency Injection avec TSyringe

### Étape 7.1 : Ajouter les décorateurs @injectable
**Durée estimée** : 1 heure

**Actions** :
- Ajouter le décorateur `@injectable()` à toutes les classes :
  - **Domain Services** : `PlanService`, `DependencyGraphService`
  - **Infrastructure** : `MongoDBConnection`, `MongoDBPlanRepository`, `PlanValidator`
  - **Application** : Tous les Use Cases
  - **MCP Tools** : Tous les handlers de tools
- Importer `reflect-metadata` en haut de chaque fichier qui utilise des décorateurs

**Exemple** :
```typescript
import { injectable } from 'tsyringe';

@injectable()
export class MongoDBPlanRepository implements IPlanRepository {
  constructor(private connection: MongoDBConnection) {}
  // ...
}
```

**Fichiers à modifier** :
- `src/domain/services/*.ts`
- `src/infrastructure/persistence/mongodb/*.ts`
- `src/infrastructure/validation/*.ts`
- `src/application/use-cases/*.ts`
- `src/infrastructure/mcp/tools/*.ts`

**Vérification** :
- Tous les fichiers compilent sans erreur
- Les décorateurs sont bien appliqués

---

### Étape 7.2 : Configurer le conteneur TSyringe
**Durée estimée** : 1 heure

**Actions** :
- Créer `src/infrastructure/config/container.ts` :
  - Importer `reflect-metadata` en premier
  - Configurer les tokens pour les interfaces
  - Enregistrer les singletons et transients
  - Créer une fonction `setupContainer()` pour la configuration
  - Créer une fonction `bootstrapApp()` pour l'initialisation async

**Code exemple** :
```typescript
import 'reflect-metadata';
import { container } from 'tsyringe';
import { MongoDBConnection } from '../persistence/mongodb/MongoDBConnection';
import { MongoDBPlanRepository } from '../persistence/mongodb/MongoDBPlanRepository';
import { IPlanRepository } from '../../domain/repositories/IPlanRepository';

// Tokens pour les interfaces
export const TOKENS = {
  IPlanRepository: Symbol('IPlanRepository'),
  ILogger: Symbol('ILogger'),
} as const;

export function setupContainer() {
  // Singletons (une seule instance partagée)
  container.registerSingleton(MongoDBConnection);
  container.registerSingleton('IPlanRepository', MongoDBPlanRepository);
  
  // Les Use Cases et Tools sont résolus automatiquement
  // grâce aux décorateurs @injectable()
}

export async function bootstrapApp() {
  setupContainer();
  
  // Initialiser la connexion MongoDB
  const mongoConnection = container.resolve(MongoDBConnection);
  await mongoConnection.connect();
  
  return container;
}

export async function shutdownApp() {
  const mongoConnection = container.resolve(MongoDBConnection);
  await mongoConnection.disconnect();
}
```

**Fichiers** :
- `src/infrastructure/config/container.ts`

**Vérification** :
- Le conteneur s'initialise correctement
- Les dépendances sont résolues

---

### Étape 7.3 : Intégrer au point d'entrée
**Durée estimée** : 30 minutes

**Actions** :
- Mettre à jour `src/index.ts` :
  - Importer `reflect-metadata` en premier
  - Appeler `bootstrapApp()`
  - Résoudre `McpServer` depuis le conteneur
  - Démarrer le serveur MCP
  - Gérer le shutdown graceful avec `shutdownApp()`

**Code exemple** :
```typescript
import 'reflect-metadata';
import { container } from 'tsyringe';
import { bootstrapApp, shutdownApp } from './infrastructure/config/container';
import { McpServer } from './infrastructure/mcp/McpServer';

async function main() {
  try {
    // Bootstrap de l'application
    await bootstrapApp();
    console.log('✅ Application bootstrapped');
    
    // Résoudre et démarrer le serveur MCP
    const mcpServer = container.resolve(McpServer);
    await mcpServer.start();
    
    console.log('✅ MCP Server started');
  } catch (error) {
    console.error('❌ Failed to start application:', error);
    process.exit(1);
  }
}

// Gestion du shutdown graceful
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await shutdownApp();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await shutdownApp();
  process.exit(0);
});

main();
```

**Fichiers** :
- `src/index.ts`

**Vérification** :
- Application démarre complètement
- Connexion MongoDB établie
- Shutdown graceful fonctionne

---

## Phase 8 : Exemples & Documentation

### Étape 8.1 : Créer les exemples de plans
**Durée estimée** : 1.5 heures

**Actions** :
- Créer `examples/simple-feature.json` :
  - Feature simple avec 3-4 steps
  - Dépendances linéaires
- Créer `examples/refactor.json` :
  - Refactoring complexe
  - Dépendances parallèles
- Créer `examples/migration.json` :
  - Migration avec rollback
  - Dépendances conditionnelles
- Valider chaque exemple

**Fichiers** :
- `examples/*.json`

**Vérification** :
- Tous les exemples valides

---

### Étape 8.2 : Documentation README
**Durée estimée** : 2 heures

**Actions** :
- Créer `README.md` :
  - Vue d'ensemble
  - Architecture hexagonale
  - Installation
  - Configuration MongoDB
  - Variables d'environnement
  - Configuration dans VS Code
  - Utilisation des tools
  - Exemples
  - Développement
  - Tests

**Fichiers** :
- `README.md`

**Vérification** :
- Documentation complète et claire

---

## Phase 9 : Tests

### Étape 9.1 : Tests unitaires - Domain
**Durée estimée** : 3 heures

**Actions** :
- Tester les Value Objects
- Tester les entités (Plan, Step)
- Tester les services (PlanService, DependencyGraphService)
- Viser 90%+ de couverture

**Fichiers** :
- `tests/unit/domain/**/*.test.ts`

**Vérification** :
- Tous les tests passent
- Couverture > 90%

---

### Étape 9.2 : Tests unitaires - Application
**Durée estimée** : 3 heures

**Actions** :
- Tester chaque Use Case avec mocks
- Tester les transformations DTO
- Viser 85%+ de couverture

**Fichiers** :
- `tests/unit/application/**/*.test.ts`

**Vérification** :
- Tous les tests passent
- Use Cases testés isolément

---

### Étape 9.3 : Tests d'intégration - Persistence
**Durée estimée** : 2 heures

**Actions** :
- Tester MongoDBPlanRepository avec MongoDB en mémoire
- Tester toutes les opérations CRUD
- Tester les filtres et pagination

**Fichiers** :
- `tests/integration/persistence/**/*.test.ts`

**Vérification** :
- Opérations CRUD fonctionnent
- Mapping correct

---

### Étape 9.4 : Tests d'intégration - MCP Tools
**Durée estimée** : 3 heures

**Actions** :
- Tester chaque tool end-to-end
- Utiliser MongoDB en mémoire
- Tester les cas d'erreur

**Fichiers** :
- `tests/integration/mcp-tools/**/*.test.ts`

**Vérification** :
- Tous les tools fonctionnent
- Erreurs gérées

---

### Étape 9.5 : Tests E2E
**Durée estimée** : 2 heures

**Actions** :
- Tester workflow complet :
  1. get_plan_format
  2. validate_plan
  3. create_plan
  4. get_plan
  5. update_plan
  6. list_plans

**Fichiers** :
- `tests/e2e/workflow.test.ts`

**Vérification** :
- Workflow complet fonctionne

---

## Phase 10 : Finalisation

### Étape 10.1 : Configuration MCP pour VS Code
**Durée estimée** : 30 minutes

**Actions** :
- Créer `mcp-config.example.json` :
```json
{
  "mcpServers": {
    "planflow": {
      "command": "node",
      "args": ["/absolute/path/to/dist/index.js"],
      "env": {
        "MONGODB_URI": "mongodb://localhost:27017",
        "MONGODB_DB_NAME": "planflow",
        "LOG_LEVEL": "info"
      }
    }
  }
}
```
- Documenter la configuration dans README

**Fichiers** :
- `mcp-config.example.json`

**Vérification** :
- Configuration VS Code fonctionne

---

### Étape 10.2 : Scripts npm
**Durée estimée** : 30 minutes

**Actions** :
- Ajouter scripts dans `package.json` :
```json
{
  "scripts": {
    "build": "tsc",
    "dev": "tsx watch src/index.ts",
    "start": "node dist/index.js",
    "test": "vitest",
    "test:unit": "vitest tests/unit",
    "test:integration": "vitest tests/integration",
    "test:e2e": "vitest tests/e2e",
    "test:coverage": "vitest --coverage",
    "lint": "eslint src/**/*.ts",
    "format": "prettier --write src/**/*.ts"
  }
}
```

**Vérification** :
- Tous les scripts fonctionnent

---

### Étape 10.3 : Test manuel complet
**Durée estimée** : 2 heures

**Actions** :
1. Démarrer MongoDB localement
2. Configurer .env
3. Build le projet
4. Configurer dans VS Code
5. Tester depuis Copilot :
   - Générer un plan
   - Le valider
   - Le créer
   - Le récupérer
   - Le modifier
   - Lister les plans

**Vérification** :
- Workflow complet fonctionne
- Pas de bugs critiques

---

## Livrables

### ✅ Serveur MCP Complet
- 6 tools MCP opérationnels
- Architecture hexagonale propre
- Séparation claire Domain / Application / Infrastructure
- Validation robuste avec Ajv
- Persistance MongoDB avec repository pattern
- Détection de cycles dans les dépendances
- Gestion complète des erreurs

### ✅ Qualité
- Tests unitaires (Domain + Application)
- Tests d'intégration (Persistence + MCP Tools)
- Tests E2E
- Couverture > 85%
- Code lint et formaté

### ✅ Documentation
- README complet
- Exemples de plans
- Configuration VS Code
- Architecture documentée

### ✅ Sécurité
- Variables sensibles dans .env
- Validation stricte des inputs
- Gestion des erreurs MongoDB

---

## Estimation Totale

| Phase | Durée |
|-------|-------|
| Configuration initiale | 1h |
| Domain Layer | 6h |
| Infrastructure - Validation | 3h |
| Infrastructure - Persistence | 6h |
| Application Layer | 4h |
| Infrastructure - MCP | 6h |
| Dependency Injection (TSyringe) | 2.5h |
| Exemples & Documentation | 3.5h |
| Tests | 13h |
| Finalisation | 3h |
| **TOTAL** | **~48-50 heures** |

**Soit environ 6-7 jours de développement à temps plein**

---

## Dépendances Clés

```json
{
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.0",
    "mongodb": "^6.0.0",
    "ajv": "^8.12.0",
    "ajv-formats": "^3.0.0",
    "nanoid": "^5.0.0",
    "dotenv": "^16.0.0",
    "tsyringe": "^4.8.0",
    "reflect-metadata": "^0.2.0"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "@types/node": "^20.0.0",
    "tsx": "^4.0.0",
    "vitest": "^1.0.0",
    "@vitest/coverage-v8": "^1.0.0",
    "eslint": "^8.0.0",
    "prettier": "^3.0.0"
  }
}
```

---

## Prochaines Étapes (Hors Scope V1)

- API HTTP REST pour le viewer web
- Frontend React avec visualisation du graphe
- Support des révisions/historique
- Webhooks pour notifications
- Métriques et observabilité
- CI/CD avec validation automatique
