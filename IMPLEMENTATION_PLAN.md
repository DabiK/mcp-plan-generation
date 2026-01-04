# Plan d'implémentation PlanFlow — Backend & MCP

## Vue d'ensemble

Ce plan détaille l'implémentation du serveur MCP et du backend API HTTP pour PlanFlow, permettant à Copilot/LLM de gérer des plans d'implémentation structurés en JSON.

---

## Phase 1 : Configuration initiale du projet

### Étape 1.1 : Initialiser le monorepo
**Objectif** : Créer la structure de base du projet avec pnpm workspaces

**Actions** :
- Initialiser un projet Node.js avec pnpm
- Créer la structure de dossiers (Architecture Hexagonale) :
  ```
  /
  ├── packages/
  │   ├── core/                    # Schéma, types, validation partagés
  │   ├── mcp-server/              # Serveur MCP
  │   │   ├── src/
  │   │   │   ├── application/     # Use cases, DTOs, interfaces de ports
  │   │   │   ├── domain/          # Entités, Value Objects, logique métier
  │   │   │   └── infrastructure/  # Adapters (MongoDB, MCP, etc.)
  │   │   └── package.json
  │   └── api-server/              # API HTTP
  │       ├── src/
  │       │   ├── application/     # Use cases, DTOs, interfaces de ports
  │       │   ├── domain/          # Entités, Value Objects, logique métier
  │       │   └── infrastructure/  # Adapters (HTTP, MongoDB, etc.)
  │       └── package.json
  ├── pnpm-workspace.yaml
  └── package.json
  ```
- Configurer `pnpm-workspace.yaml`
- Créer les `package.json` pour chaque workspace

**Vérification** :
- `pnpm install` fonctionne
- Les workspaces sont reconnus

**Durée estimée** : 30 minutes

---

### Étape 1.2 : Configuration TypeScript
**Objectif** : Configurer TypeScript pour tous les packages

**Actions** :
- Créer `tsconfig.base.json` à la racine
- Créer `tsconfig.json` dans chaque package
- Configurer les options :
  - `strict: true`
  - `esModuleInterop: true`
  - `skipLibCheck: true`
  - `moduleResolution: "node"`
  - `target: "ES2022"`
  - `module: "commonjs"` (pour le MCP) ou `"ES2022"` (pour l'API)

**Vérification** :
- `pnpm -r build` compile sans erreur

**Durée estimée** : 20 minutes

---

## Phase 2 : Package Core (Schéma & Validation)

### Étape 2.1 : Définir le JSON Schema
**Objectif** : Créer le fichier de schéma PlanFlow v1.0.0

**Actions** :
- Créer `packages/core/src/schema/planflow-v1.0.0.json`
- Copier le schéma complet depuis FEATURE.MD
- Valider que le JSON est bien formé

**Fichiers** :
- `packages/core/src/schema/planflow-v1.0.0.json`

**Vérification** :
- Le JSON est valide
- Peut être importé dans du code TypeScript

**Durée estimée** : 15 minutes

---

### Étape 2.2 : Générer les types TypeScript
**Objectif** : Créer les types TypeScript depuis le JSON Schema

**Actions** :
- Installer `json-schema-to-typescript`
- Créer un script de génération
- Générer `packages/core/src/types/plan.ts`
- Créer des types pour les inputs/outputs des tools MCP :
  - `GetPlanFormatInput`, `GetPlanFormatOutput`
  - `ValidatePlanInput`, `ValidatePlanOutput`
  - `CreatePlanInput`, `CreatePlanOutput`
  - `GetPlanInput`, `GetPlanOutput`

**Fichiers** :
- `packages/core/src/types/plan.ts`
- `packages/core/src/types/tools.ts`
- `packages/core/scripts/generate-types.ts`

**Vérification** :
- Les types sont générés sans erreur
- Les types correspondent au schéma

**Durée estimée** : 45 minutes

---

### Étape 2.3 : Implémenter la validation avec Ajv
**Objectif** : Créer le module de validation JSON Schema

**Actions** :
- Installer `ajv` et `ajv-formats`
- Créer `packages/core/src/validation/validator.ts`
- Implémenter la classe `PlanValidator` :
  - Méthode `validate(plan: unknown): ValidationResult`
  - Vérifications supplémentaires :
    - IDs de steps uniques
    - Références `dependsOn` valides
    - Détection de cycles dans le graphe
    - Validation des payloads d'actions selon leur type
- Formater les erreurs Ajv en format lisible
- Ajouter des hints pour les erreurs courantes

**Fichiers** :
- `packages/core/src/validation/validator.ts`
- `packages/core/src/validation/cycle-detector.ts`
- `packages/core/src/validation/errors.ts`

**Vérification** :
- Tests unitaires passent (plans valides/invalides)
- Détection de cycles fonctionne
- Messages d'erreur sont clairs

**Durée estimée** : 2-3 heures

---

### Étape 2.4 : Créer les exemples de plans
**Objectif** : Fournir des exemples de plans valides

**Actions** :
- Créer `packages/core/src/examples/`
- Créer 3 exemples :
  - `simple-feature.json` : Feature simple avec 3-4 steps
  - `refactor.json` : Refactoring avec dépendances complexes
  - `migration.json` : Migration avec rollback
- Valider chaque exemple avec le validator

**Fichiers** :
- `packages/core/src/examples/*.json`
- `packages/core/src/examples/index.ts`

**Vérification** :
- Tous les exemples passent la validation
- Les exemples couvrent différents `planType` et `kind`

**Durée estimée** : 1 heure

---

### Étape 2.5 : Définir les entités du domaine
**Objectif** : Créer les entités métier (Domain Layer)

**Actions** :
- Créer `packages/core/src/domain/entities/Plan.ts` :
  - Entité `Plan` avec propriétés et méthodes métier
  - Validation des règles métier (pas de cycles, IDs uniques, etc.)
  - Méthodes : `addStep()`, `removeStep()`, `updateStep()`, `validate()`
- Créer `packages/core/src/domain/entities/Step.ts` :
  - Entité `Step` avec logique de dépendances
- Créer `packages/core/src/domain/value-objects/` :
  - `PlanId`, `StepId`, `PlanType`, `StepKind`, etc.
- Créer `packages/core/src/domain/repositories/IPlanRepository.ts` :
  - Interface du port de persistance
  - Méthodes : `save()`, `findById()`, `findAll()`, `update()`, `delete()`

**Fichiers** :
- `packages/core/src/domain/entities/Plan.ts`
- `packages/core/src/domain/entities/Step.ts`
- `packages/core/src/domain/value-objects/*.ts`
- `packages/core/src/domain/repositories/IPlanRepository.ts`

**Vérification** :
- Les entités encapsulent correctement la logique métier
- Le domaine est indépendant de toute infrastructure

**Durée estimée** : 2 heures

---

### Étape 2.6 : Exporter le package core
**Objectif** : Rendre le package utilisable par mcp-server et api-server

**Actions** :
- Créer `packages/core/src/index.ts` avec exports :
  - Schema JSON
  - Types TypeScript
  - Validator
  - Exemples
  - Constraints (règles métier)
  - Entités du domaine
  - Interfaces des repositories
- Configurer `package.json` avec les exports
- Builder le package

**Fichiers** :
- `packages/core/src/index.ts`
- `packages/core/package.json`

**Vérification** :
- Le package peut être importé depuis un autre workspace
- Tous les exports sont accessibles

**Durée estimée** : 30 minutes

---

## Phase 3 : Serveur MCP

### Étape 3.1 : Initialiser le serveur MCP
**Objectif** : Configurer le projet MCP avec le SDK officiel

**Actions** :
- Installer `@modelcontextprotocol/sdk`
- Créer `packages/mcp-server/src/index.ts`
- Initialiser le serveur MCP avec transport stdio
- Configurer les métadonnées du serveur :
  - `name: "planflow-mcp"`
  - `version: "1.0.0"`
  - Description

**Fichiers** :
- `packages/mcp-server/src/index.ts`
- `packages/mcp-server/package.json`

**Vérification** :
- Le serveur démarre sans erreur
- Répond au protocole MCP

**Durée estimée** : 45 minutes

---

### Étape 3.2 : Implémenter le Domain Layer
**Objectif** : Créer les services du domaine

**Actions** :
- Créer `packages/mcp-server/src/domain/services/PlanService.ts` :
  - Logique métier de création, validation, mise à jour
  - Détection de cycles dans les dépendances
  - Application des règles métier
- Réutiliser les entités de `@planflow/core`

**Fichiers** :
- `packages/mcp-server/src/domain/services/PlanService.ts`

**Vérification** :
- Les services domaine sont indépendants de l'infrastructure
- La logique métier est testable unitairement

**Durée estimée** : 1.5 heures

---

### Étape 3.3 : Implémenter l'adapter MongoDB (Infrastructure)
**Objectif** : Créer l'adapter de persistance MongoDB

**Actions** :
- Installer `mongodb` (driver natif Node.js)
- Créer `packages/mcp-server/src/infrastructure/persistence/MongoDBPlanRepository.ts` :
  - Implémente `IPlanRepository` de `@planflow/core`
  - Connexion à MongoDB (URL configurable via env)
  - Collection `plans` avec index sur `planId`
  - Méthodes :
    - `save(plan: Plan)`: Insert/Upsert dans MongoDB
    - `findById(planId: string)`: Query par planId
    - `findAll(filters?)`: Liste avec filtres (planType, status, etc.)
    - `update(planId, plan)`: Update avec increment de revision
    - `delete(planId)`: Soft delete ou hard delete
  - Mapping entre entités domaine et documents MongoDB
  - Gestion des erreurs de connexion et requêtes
- Créer `packages/mcp-server/src/infrastructure/persistence/MongoDBConnection.ts` :
  - Singleton de connexion MongoDB
  - Connection pooling
  - Retry logic
  - Health check

**Fichiers** :
- `packages/mcp-server/src/infrastructure/persistence/MongoDBPlanRepository.ts`
- `packages/mcp-server/src/infrastructure/persistence/MongoDBConnection.ts`
- `packages/mcp-server/src/infrastructure/persistence/mappers/PlanMapper.ts`

**Vérification** :
- Connexion à MongoDB fonctionne
- Les opérations CRUD fonctionnent
- Les erreurs sont gérées proprement
- Les entités sont correctement mappées

**Durée estimée** : 3 heures

---

### Étape 3.4 : Implémenter l'Application Layer
**Objectif** : Créer les use cases et DTOs

**Actions** :
- Créer `packages/mcp-server/src/application/use-cases/` :
  - `GetPlanFormatUseCase.ts` : Retourne le schéma
  - `ValidatePlanUseCase.ts` : Valide un plan
  - `CreatePlanUseCase.ts` : Crée et persiste un plan
  - `GetPlanUseCase.ts` : Récupère un plan
- Créer `packages/mcp-server/src/application/dtos/` :
  - DTOs pour inputs/outputs de chaque use case
- Chaque use case :
  - Prend en dépendance `IPlanRepository`
  - Utilise les services du domaine
  - Retourne des DTOs (pas d'entités directement)

**Fichiers** :
- `packages/mcp-server/src/application/use-cases/*.ts`
- `packages/mcp-server/src/application/dtos/*.ts`
- `packages/mcp-server/src/application/ports/IPlanRepository.ts` (si pas dans core)

**Vérification** :
- Les use cases sont testables avec des mocks du repository
- Pas de dépendance directe à l'infrastructure

**Durée estimée** : 2.5 heures

---

### Étape 3.5 : Tool - get_plan_format (Infrastructure MCP)
**Objectif** : Implémenter le premier tool MCP (adapter)

**Actions** :
- Créer `packages/mcp-server/src/infrastructure/mcp/tools/get-plan-format.ts`
- Implémenter le handler MCP qui :
  - Parse les inputs MCP
  - Appelle `GetPlanFormatUseCase`
  - Formatte la réponse MCP
- Charger depuis `@planflow/core`

**Fichiers** :
- `packages/mcp-server/src/infrastructure/mcp/tools/get-plan-format.ts`

**Vérification** :
- Le tool retourne le schéma complet
- Les exemples sont inclus
- Le format est conforme à la spec

**Durée estimée** : 45 minutes

---

### Étape 3.6 : Tool - validate_plan (Infrastructure MCP)
**Objectif** : Implémenter la validation de plans (adapter MCP)

**Actions** :
- Créer `packages/mcp-server/src/infrastructure/mcp/tools/validate-plan.ts`
- Implémenter le handler MCP qui :
  - Parse les inputs MCP
  - Appelle `ValidatePlanUseCase`
  - Formatte la réponse MCP

**Fichiers** :
- `packages/mcp-server/src/infrastructure/mcp/tools/validate-plan.ts`

**Vérification** :
- Plans valides retournent `isValid: true`
- Plans invalides retournent des erreurs détaillées
- Les warnings sont pertinents

**Durée estimée** : 45 minutes

---

### Étape 3.7 : Tool - create_plan (Infrastructure MCP)
**Objectif** : Implémenter la création et persistance de plans (adapter MCP)

**Actions** :
- Créer `packages/mcp-server/src/infrastructure/mcp/tools/create-plan.ts`
- Implémenter le handler MCP qui :
  - Parse les inputs MCP
  - Appelle `CreatePlanUseCase` (injecté avec MongoDBPlanRepository)
  - Formatte la réponse MCP
- Le use case gère :
  - Validation
  - Génération d'ID (nanoid)
  - Métadonnées
  - Persistance via repository

**Fichiers** :
- `packages/mcp-server/src/infrastructure/mcp/tools/create-plan.ts`

**Vérification** :
- Plans valides sont créés et sauvegardés dans MongoDB
- Plans invalides sont rejetés
- Les métadonnées sont correctes

**Durée estimée** : 1 heure

---

### Étape 3.8 : Tool - get_plan (Infrastructure MCP)
**Objectif** : Implémenter la récupération de plans (adapter MCP)

**Actions** :
- Créer `packages/mcp-server/src/infrastructure/mcp/tools/get-plan.ts`
- Implémenter le handler MCP qui :
  - Parse les inputs MCP
  - Appelle `GetPlanUseCase`
  - Formatte la réponse MCP

**Fichiers** :
- `packages/mcp-server/src/infrastructure/mcp/tools/get-plan.ts`

**Vérification** :
- Plans existants sont retournés correctement depuis MongoDB
- Plans inexistants retournent une erreur claire

**Durée estimée** : 45 minutes

---

### Étape 3.9 : Dependency Injection et configuration
**Objectif** : Configurer l'injection de dépendances et bootstrap l'application

**Actions** :
- Créer `packages/mcp-server/src/infrastructure/config/DIContainer.ts` :
  - Configure la connexion MongoDB
  - Instancie MongoDBPlanRepository
  - Instancie les use cases avec leurs dépendances
  - Instancie les tools MCP avec leurs use cases
- Créer `packages/mcp-server/src/infrastructure/config/env.ts` :
  - Charge les variables d'environnement
  - `MONGODB_URI` (ex: mongodb://localhost:27017/planflow)
  - `MONGODB_DB_NAME`
- Pattern : Simple factory ou utiliser `tsyringe`/`inversify` si complexe

**Fichiers** :
- `packages/mcp-server/src/infrastructure/config/DIContainer.ts`
- `packages/mcp-server/src/infrastructure/config/env.ts`

**Vérification** :
- Les dépendances sont correctement injectées
- La connexion MongoDB est initialisée

**Durée estimée** : 1.5 heures

---

### Étape 3.10 : Enregistrer tous les tools
**Objectif** : Intégrer les tools au serveur MCP

**Actions** :
- Créer `packages/mcp-server/src/infrastructure/mcp/McpServer.ts`
- Enregistrer les 4 tools dans le serveur MCP
- Configurer les schémas d'input pour chaque tool
- Ajouter des descriptions claires
- Utiliser le DIContainer pour obtenir les instances

**Fichiers** :
- `packages/mcp-server/src/infrastructure/mcp/McpServer.ts`
- `packages/mcp-server/src/infrastructure/mcp/tools/index.ts`
- Mise à jour de `packages/mcp-server/src/index.ts`

**Vérification** :
- Tous les tools sont listés via MCP
- Les descriptions sont correctes

**Durée estimée** : 45 minutes

---

### Étape 3.11 : Build et configuration
**Objectif** : Préparer le serveur MCP pour utilisation

**Actions** :
- Créer le script de build
- Créer un script `start` pour lancer le serveur
- Créer `.env.example` :
  ```
  MONGODB_URI=mongodb://localhost:27017
  MONGODB_DB_NAME=planflow
  LOG_LEVEL=info
  ```
- Créer un fichier de config pour VS Code :
  ```json
  {
    "mcpServers": {
      "planflow": {
        "command": "node",
        "args": ["/chemin/vers/dist/index.js"],
        "env": {
          "MONGODB_URI": "mongodb://localhost:27017",
          "MONGODB_DB_NAME": "planflow"
        }
      }
    }
  }
  ```
- Documenter l'installation et la config MongoDB dans README

**Fichiers** :
- `packages/mcp-server/README.md`
- `packages/mcp-server/mcp-config.example.json`
- `packages/mcp-server/.env.example`

**Vérification** :
- Le serveur peut être lancé et se connecte à MongoDB
- Il peut être configuré dans VS Code

**Durée estimée** : 45 minutes

---

## Phase 4 : API HTTP (Backend pour Viewer)

### Étape 4.1 : Initialiser le serveur Fastify
**Objectif** : Configurer le serveur HTTP

**Actions** :
- Installer `fastify` et plugins :
  - `@fastify/cors`
  - `@fastify/helmet`
  - `@fastify/rate-limit`
- Créer `packages/api-server/src/index.ts`
- Configurer Fastify avec :
  - Logger
  - CORS pour le viewer
  - Helmet pour sécurité
  - Rate limiting
- Définir le port (ex: 3001)

**Fichiers** :
- `packages/api-server/src/index.ts`
- `packages/api-server/src/config.ts`

**Vérification** :
- Le serveur démarre sur le port configuré
- Health check endpoint répond

**Durée estimée** : 1 heure

---

### Étape 4.2 : Implémenter l'Application Layer API
**Objectif** : Créer les use cases pour l'API (peuvent partager avec MCP)

**Actions** :
- Créer ou réutiliser les use cases de mcp-server :
  - `ListPlansUseCase.ts` : Liste avec filtres/pagination
  - `GetPlanUseCase.ts` : Récupère un plan
  - `CreatePlanUseCase.ts` : Crée un plan
  - `UpdatePlanUseCase.ts` : Met à jour un plan
- Si besoin, créer des DTOs spécifiques à l'API REST

**Fichiers** :
- `packages/api-server/src/application/use-cases/*.ts`
- `packages/api-server/src/application/dtos/*.ts`

**Vérification** :
- Les use cases sont réutilisables
- Testables avec des mocks

**Durée estimée** : 1.5 heures

---

### Étape 4.3 : Implémenter l'adapter MongoDB pour l'API
**Objectif** : Réutiliser ou adapter le repository MongoDB

**Actions** :
- Option 1 : Réutiliser `MongoDBPlanRepository` depuis mcp-server (via package partagé)
- Option 2 : Créer `packages/api-server/src/infrastructure/persistence/MongoDBPlanRepository.ts`
- Configurer la connexion MongoDB (même URI que MCP)

**Fichiers** :
- `packages/api-server/src/infrastructure/persistence/MongoDBPlanRepository.ts` (si option 2)
- `packages/api-server/src/infrastructure/config/DIContainer.ts`

**Vérification** :
- Le repository fonctionne avec MongoDB
- Les deux serveurs partagent la même base

**Durée estimée** : 1 heure

---

### Étape 4.4 : Routes - GET /plans (Infrastructure HTTP)
**Objectif** : Lister les plans avec filtres

**Actions** :
- Créer `packages/api-server/src/infrastructure/http/routes/plans.ts`
- Implémenter `GET /plans` :
  - Query params : `planType?`, `status?`, `limit?`, `offset?`
  - Appelle `ListPlansUseCase`
  - Retourne liste de plans avec metadata
  - Pagination basique

**Fichiers** :
- `packages/api-server/src/infrastructure/http/routes/plans.ts`

**Vérification** :
- L'endpoint retourne la liste des plans depuis MongoDB
- Les filtres fonctionnent
- La pagination fonctionne

**Durée estimée** : 1 heure

---

### Étape 4.5 : Routes - GET /plans/:id (Infrastructure HTTP)
**Objectif** : Récupérer un plan spécifique

**Actions** :
- Implémenter `GET /plans/:id`
- Appelle `GetPlanUseCase`
- Retourner 404 si non trouvé
- Inclure les métadonnées

**Fichiers** :
- Mise à jour de `packages/api-server/src/infrastructure/http/routes/plans.ts`

**Vérification** :
- Plans existants sont retournés depuis MongoDB
- 404 pour plans inexistants

**Durée estimée** : 30 minutes

---

### Étape 4.6 : Routes - POST /plans (Infrastructure HTTP)
**Objectif** : Créer un plan depuis l'UI

**Actions** :
- Implémenter `POST /plans`
- Body : `{ schemaVersion, plan, source? }`
- Appelle `CreatePlanUseCase`
- Retourner le plan créé avec planId

**Fichiers** :
- Mise à jour de `packages/api-server/src/infrastructure/http/routes/plans.ts`

**Vérification** :
- Plans valides sont créés dans MongoDB
- Plans invalides retournent 400 avec erreurs

**Durée estimée** : 45 minutes

---

### Étape 4.7 : Routes - PUT /plans/:id (Infrastructure HTTP)
**Objectif** : Mettre à jour un plan depuis l'UI

**Actions** :
- Implémenter `PUT /plans/:id`
- Appelle `UpdatePlanUseCase`
- Le use case :
  - Valide le plan mis à jour
  - Incrémente la revision
  - Met à jour les métadonnées (updatedAt)
  - Sauvegarde via repository

**Fichiers** :
- Mise à jour de `packages/api-server/src/infrastructure/http/routes/plans.ts`
- `packages/api-server/src/application/use-cases/UpdatePlanUseCase.ts`

**Vérification** :
- Plans peuvent être mis à jour dans MongoDB
- La revision est incrémentée
- Validation est effectuée

**Durée estimée** : 1 heure

---

### Étape 4.8 : Routes - GET /schema (Infrastructure HTTP)
**Objectif** : Exposer le schéma pour le viewer

**Actions** :
- Implémenter `GET /schema`
- Optionnel : `?version=1.0.0`
- Retourner le JSON Schema depuis `@planflow/core`
- Inclure les constraints

**Fichiers** :
- `packages/api-server/src/infrastructure/http/routes/schema.ts`

**Vérification** :
- Le schéma est retourné correctement

**Durée estimée** : 20 minutes

---

### Étape 4.9 : Gestion d'erreurs centralisée
**Objectif** : Standardiser les réponses d'erreur

**Actions** :
- Créer `packages/api-server/src/infrastructure/http/middleware/error-handler.ts`
- Définir les codes d'erreur dans le domaine :
  - `PlanNotFoundError`
  - `ValidationError`
  - `StorageError`
  - etc.
- Format de réponse standardisé HTTP
- Logger les erreurs
- Mapper les erreurs domaine vers codes HTTP

**Fichiers** :
- `packages/api-server/src/infrastructure/http/middleware/error-handler.ts`
- `packages/api-server/src/domain/errors/*.ts`

**Vérification** :
- Toutes les erreurs sont formatées correctement
- Les logs sont générés

**Durée estimée** : 1 heure

---

### Étape 4.10 : Documentation OpenAPI
**Objectif** : Documenter l'API

**Actions** :
- Installer `@fastify/swagger`
- Configurer Swagger dans `packages/api-server/src/infrastructure/http/`
- Ajouter les schémas pour chaque endpoint
- Générer la doc à `/docs`

**Fichiers** :
- `packages/api-server/src/infrastructure/http/swagger.ts`

**Vérification** :
- La doc Swagger est accessible
- Tous les endpoints sont documentés

**Durée estimée** : 1.5 heures

---

## Phase 5 : Tests & Qualité

### Étape 5.1 : Tests unitaires - Core
**Objectif** : Tester la validation et les utilitaires

**Actions** :
- Installer `vitest`
- Créer tests pour :
  - PlanValidator (cas valides/invalides)
  - Cycle detector
  - Formatage des erreurs
- Viser 80%+ de couverture pour core

**Fichiers** :
- `packages/core/tests/*.test.ts`

**Vérification** :
- Tous les tests passent
- Couverture > 80%

**Durée estimée** : 3 heures

---

### Étape 5.2 : Tests d'intégration - MCP Server
**Objectif** : Tester les tools MCP end-to-end

**Actions** :
- Créer tests pour chaque tool :
  - `get_plan_format`
  - `validate_plan` (plans valides/invalides)
  - `create_plan` (workflow complet)
  - `get_plan` (existant/non-existant)
- Utiliser un stockage temporaire pour les tests
- Tester les cas d'erreur

**Fichiers** :
- `packages/mcp-server/tests/*.test.ts`

**Vérification** :
- Tous les scénarios fonctionnent
- Les erreurs sont gérées

**Durée estimée** : 4 heures

---

### Étape 5.3 : Tests d'intégration - API Server
**Objectif** : Tester les endpoints HTTP

**Actions** :
- Installer `@fastify/testing` ou équivalent
- Créer tests pour chaque endpoint
- Tester les cas d'erreur (404, 400, etc.)
- Tester la pagination
- Tester les filtres

**Fichiers** :
- `packages/api-server/tests/*.test.ts`

**Vérification** :
- Tous les endpoints fonctionnent
- Les codes de statut sont corrects

**Durée estimée** : 4 heures

---

### Étape 5.4 : Tests E2E
**Objectif** : Tester le workflow complet

**Actions** :
- Créer un test E2E :
  1. LLM appelle `get_plan_format`
  2. Valide un plan avec `validate_plan`
  3. Crée le plan avec `create_plan`
  4. Récupère le plan via API HTTP
  5. Met à jour via API
- Vérifier la cohérence des données

**Fichiers** :
- `tests/e2e/workflow.test.ts`

**Vérification** :
- Le workflow complet fonctionne
- Les données sont cohérentes entre MCP et API

**Durée estimée** : 2 heures

---

### Étape 5.5 : Linting et formatage
**Objectif** : Assurer la qualité du code

**Actions** :
- Configurer ESLint avec règles strictes
- Configurer Prettier
- Ajouter `lint` et `format` scripts
- Configurer pre-commit hooks avec husky

**Fichiers** :
- `.eslintrc.json`
- `.prettierrc`
- `.husky/pre-commit`

**Vérification** :
- Le code passe le lint
- Le formatage est uniforme

**Durée estimée** : 1 heure

---

## Phase 6 : Documentation & Déploiement

### Étape 6.1 : Documentation README
**Objectif** : Documenter le projet

**Actions** :
- Créer README.md principal :
  - Vue d'ensemble
  - Architecture
  - Installation
  - Configuration VS Code
  - Démarrage de l'API
  - Exemples d'utilisation
- README pour chaque package

**Fichiers** :
- `README.md`
- `packages/*/README.md`

**Vérification** :
- La doc est claire et complète
- Les exemples fonctionnent

**Durée estimée** : 2 heures

---

### Étape 6.2 : Scripts de démarrage
**Objectif** : Simplifier le lancement

**Actions** :
- Créer scripts npm :
  - `dev:mcp` : Lance le serveur MCP
  - `dev:api` : Lance l'API en mode dev
  - `dev:all` : Lance tout en parallèle
  - `build` : Build tous les packages
  - `test` : Lance tous les tests
- Utiliser `concurrently` pour les modes parallèles

**Fichiers** :
- `package.json` (root)

**Vérification** :
- Tous les scripts fonctionnent

**Durée estimée** : 45 minutes

---

### Étape 6.3 : Configuration d'environnement
**Objectif** : Gérer les variables d'environnement

**Actions** :
- Créer `.env.example` à la racine et dans chaque package
- Variables pour MCP Server :
  - `MONGODB_URI` : URI MongoDB (ex: mongodb://localhost:27017)
  - `MONGODB_DB_NAME` : Nom de la base (ex: planflow)
  - `LOG_LEVEL` : Niveau de log
- Variables pour API Server :
  - `MONGODB_URI` : URI MongoDB (partagé avec MCP)
  - `MONGODB_DB_NAME` : Nom de la base (partagé avec MCP)
  - `API_PORT` : Port de l'API (ex: 3001)
  - `API_HOST` : Host de l'API (ex: localhost)
  - `LOG_LEVEL` : Niveau de log
- Utiliser `dotenv`

**Fichiers** :
- `.env.example` (root)
- `packages/mcp-server/.env.example`
- `packages/api-server/.env.example`
- `packages/api-server/src/infrastructure/config/env.ts`
- `packages/mcp-server/src/infrastructure/config/env.ts`

**Vérification** :
- Les variables sont chargées correctement
- Les deux serveurs se connectent au même MongoDB

**Durée estimée** : 45 minutes

---

## Phase 7 : Validation finale

### Étape 7.1 : Test manuel complet
**Objectif** : Valider le workflow end-to-end manuellement

**Actions** :
1. Configurer le MCP dans VS Code
2. Tester depuis Copilot :
   - Générer un plan
   - Le valider
   - Le créer
   - Le récupérer
3. Tester l'API :
   - Lister les plans
   - Récupérer un plan
   - Le modifier

**Vérification** :
- Tout fonctionne comme spécifié
- Pas de bugs critiques

**Durée estimée** : 2 heures

---

### Étape 7.2 : Performance & optimisation
**Objectif** : S'assurer de performances correctes

**Actions** :
- Profiler l'API (temps de réponse)
- Optimiser la lecture/écriture des fichiers
- Ajouter du caching si nécessaire
- Benchmarker la validation

**Vérification** :
- API répond en < 100ms pour GET
- Validation prend < 50ms

**Durée estimée** : 2 heures

---

### Étape 7.3 : Sécurité
**Objectif** : Audit de sécurité basique

**Actions** :
- Vérifier les dépendances (npm audit)
- Valider les inputs (pas d'injection)
- S'assurer que les chemins de fichiers sont sûrs
- Tester les limites (plan très large, etc.)

**Vérification** :
- Pas de vulnérabilités critiques
- Les inputs sont validés

**Durée estimée** : 1.5 heures

---

## Résumé des livrables

### Backend MCP (Architecture Hexagonale)
- ✅ Serveur MCP avec 4 tools opérationnels
- ✅ Architecture hexagonale (Domain / Application / Infrastructure)
- ✅ Validation robuste avec Ajv
- ✅ Persistance MongoDB avec repository pattern
- ✅ Détection de cycles dans le domaine
- ✅ Dependency Injection configurée
- ✅ Tests unitaires et d'intégration

### Backend API (Architecture Hexagonale)
- ✅ API REST Fastify
- ✅ Architecture hexagonale (Domain / Application / Infrastructure)
- ✅ Endpoints CRUD complets
- ✅ Persistance MongoDB partagée avec MCP
- ✅ Documentation Swagger
- ✅ Gestion d'erreurs standardisée
- ✅ Tests d'intégration

### Core (Package partagé)
- ✅ JSON Schema v1.0.0
- ✅ Types TypeScript générés
- ✅ Entités du domaine (Plan, Step, etc.)
- ✅ Value Objects
- ✅ Interfaces des repositories
- ✅ Validator réutilisable
- ✅ Exemples de plans

### Infrastructure
- ✅ Monorepo pnpm fonctionnel
- ✅ Configuration TypeScript
- ✅ MongoDB configuré (local)
- ✅ Scripts de build/dev/test
- ✅ Documentation complète

---

## Estimation totale

**Développement** : ~50-60 heures (architecture hexagonale + MongoDB)
**Tests** : ~15-20 heures
**Documentation** : ~5 heures
**Buffer** : ~10 heures

**Total** : ~80-95 heures (~2-3 semaines pour 1 développeur)

**Note** : L'architecture hexagonale ajoute ~10h de développement initial mais améliore significativement la maintenabilité et la testabilité.

---

## Prochaines étapes (hors scope V1)

- Frontend viewer avec React Flow
- Support de révisions/historique
- API de recherche avancée
- Support de branches de plans
- Intégration CI/CD pour validation automatique
- Métriques et observabilité
