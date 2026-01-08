# Refactoring: Schema Generation from Use Case DTOs

## Objectif

Remplacer les schémas MCP manuels par une génération automatique basée sur les DTOs des use cases avec des décorateurs TypeScript. Cela permet d'avoir une **single source of truth** et d'éviter la duplication entre les types TypeScript et les schémas JSON.

## Architecture actuelle

```
┌─────────────────────────────┐
│  mcp-tools-definitions.ts   │  ← Schémas JSON manuels
│  (700+ lignes de schémas)   │
└─────────────────────────────┘
              │
              │ Pas de lien automatique
              │
┌─────────────────────────────┐
│    Use Cases                │
│  - CreatePlanDraftUseCase   │  ← Types TypeScript
│  - AddStepToPlanUseCase     │
│  - etc.                     │
└─────────────────────────────┘
```

**Problèmes:**
- ❌ Duplication de la définition des types (TypeScript + JSON Schema)
- ❌ Risque de désynchronisation entre types et schémas
- ❌ Maintenance difficile (2 endroits à modifier)
- ❌ Pas de garantie de cohérence

## Architecture cible

```
┌─────────────────────────────┐
│  MCP Handler Input Types    │  ← Infrastructure layer
│  avec @SchemaProperty       │  ← Single source of truth pour MCP
│  (src/infrastructure/mcp/   │
│   types/)                   │
└─────────────────────────────┘
              │
              │ Metadata (reflect-metadata)
              ↓
┌─────────────────────────────┐
│  schema-generator.ts        │  ← Génération automatique
│  generateMcpSchema()        │
└─────────────────────────────┘
              │
              ↓
┌─────────────────────────────┐
│  mcp-tools-definitions.ts   │  ← Schémas générés
└─────────────────────────────┘

              │ Mapping manuel dans handlers
              │ (McpServer.ts)
              ↓
┌─────────────────────────────┐
│  Use Case Input DTOs        │  ← Domain/Application reste PUR
│  (pas de décorateurs)       │  ← Pas de dépendances infrastructure
└─────────────────────────────┘
```

**Avantages:**
- ✅ **Respecte l'architecture hexagonale** - Domain reste pur
- ✅ Types MCP = source unique de vérité pour l'infrastructure
- ✅ Synchronisation automatique types ↔ schémas
- ✅ Maintenance simplifiée (1 seul endroit par outil)
- ✅ Type-safe et auto-documenté
- ✅ Évolutif (ajout d'enums → mise à jour auto)
- ✅ Mapping explicite et visible dans les handlers

---

## Plan de refactoring (13 phases)

### Phase 1: Setup infrastructure de décorateurs
**Fichiers à créer:**
- `src/infrastructure/mcp/decorators/schema-metadata.ts`
  - Interface `PropertyMetadata`
  - Décorateur `@SchemaProperty()`
  - Fonction `getSchemaMetadata()`
  - Support de `reflect-metadata`

**Actions:**
- Installer `reflect-metadata` si pas déjà présent
- Vérifier `tsconfig.json` pour `experimentalDecorators: true` et `emitDecoratorMetadata: true`

---

### Phase 2: Créer le générateur de schémas
**Fichiers à créer:**
- `src/infrastructure/mcp/schema-generator.ts`
  - Fonction `generateMcpSchema(inputClass)`
  - Fonction `flattenToMcpParams(inputClass)` pour les outils qui prennent des paramètres "plats"
  - Helpers pour gérer:
    - Types primitifs (string, number, boolean)
    - Types complexes (object, array)
    - Enums dynamiques
    - Required vs optional
    - Nested properties

**Signature:**
```typescript
function generateMcpSchema(inputClass: any, options?: {
  flattenParams?: boolean;  // Pour les outils avec paramètres plats
  exclude?: string[];       // Propriétés à exclure
}): JSONSchema;
```

---

### Phase 3: Créer les MCP Input Types pour les use cases incrémentaux

**⚠️ IMPORTANT: Architecture Hexagonale**  
Les types MCP annotés sont créés dans `src/infrastructure/mcp/types/` et **NON** dans les use cases.  
Les use cases restent purs, sans dépendances sur l'infrastructure MCP.

**Fichiers à créer:**

1. `src/infrastructure/mcp/types/CreatePlanDraftMcpInput.ts`
   - Type annoté pour l'outil `plans-create-draft`
   - Propriétés "plates" correspondant aux paramètres MCP

2. `src/infrastructure/mcp/types/AddStepToPlanMcpInput.ts`
   - Type annoté pour l'outil `plans-step-add`
   - Inclut `StepMcpInputDTO` pour le nested step object
   - Méthode `toDomain()` pour transformer vers `AddStepInput`

3. `src/infrastructure/mcp/types/UpdateStepInPlanMcpInput.ts`
   - Type annoté pour l'outil `plans-update-step`
   - Propriétés partielles pour updates

4. `src/infrastructure/mcp/types/RemoveStepFromPlanMcpInput.ts`
   - Type annoté pour l'outil `plans-remove-step`

5. `src/infrastructure/mcp/types/UpdatePlanMetadataMcpInput.ts`
   - Type annoté pour l'outil `plans-update-metadata`
   - Nested objects pour metadata et plan

6. `src/infrastructure/mcp/types/FinalizePlanMcpInput.ts`
   - Type annoté pour l'outil `plans-finalize`

**Pattern pour les MCP Input Types:**
```typescript
// src/infrastructure/mcp/types/CreatePlanDraftMcpInput.ts
import { SchemaProperty } from '../decorators/schema-metadata';
import { PLAN_TYPE_VALUES, PLAN_TYPE_DESCRIPTION } from '../mcp-schema-constants';
import type { CreatePlanDraftInput } from '../../../application/use-cases/CreatePlanUseCase';

export class CreatePlanDraftMcpInput {
  @SchemaProperty({
    type: 'string',
    description: PLAN_TYPE_DESCRIPTION,
    required: true,
    enum: PLAN_TYPE_VALUES
  })
  planType!: string;

  @SchemaProperty({
    type: 'string',
    description: 'Plan title',
    required: true
  })
  title!: string;

  @SchemaProperty({
    type: 'string',
    description: 'Plan description',
    required: true
  })
  description!: string;

  @SchemaProperty({
    type: 'string',
    description: 'Plan author (optional)'
  })
  author?: string;

  @SchemaProperty({
    type: 'array',
    description: 'Plan tags (optional)',
    items: { type: 'string' }
  })
  tags?: string[];

  @SchemaProperty({
    type: 'string',
    description: 'Plan objective',
    required: true
  })
  objective!: string;

  @SchemaProperty({
    type: 'string',
    description: 'Plan scope (optional)'
  })
  scope?: string;

  @SchemaProperty({
    type: 'array',
    description: 'Plan constraints (optional)',
    items: { type: 'string' }
  })
  constraints?: string[];

  @SchemaProperty({
    type: 'array',
    description: 'Plan assumptions (optional)',
    items: { type: 'string' }
  })
  assumptions?: string[];

  @SchemaProperty({
    type: 'array',
    description: 'Success criteria (optional)',
    items: { type: 'string' }
  })
  successCriteria?: string[];

  /**
   * Transforme le MCP Input (Infrastructure) vers le Domain Input (Use Case)
   * Cette méthode encapsule la logique de mapping entre les couches
   */
  toDomain(): CreatePlanDraftInput {
    return {
      planType: this.planType,
      metadata: {
        title: this.title,
        description: this.description,
        author: this.author,
        tags: this.tags,
      },
      objective: this.objective,
      scope: this.scope,
      constraints: this.constraints,
      assumptions: this.assumptions,
      successCriteria: this.successCriteria,
    };
  }
}
```

**Pattern pour nested objects:**
```typescript
// src/infrastructure/mcp/types/StepMcpInputDTO.ts
import { SchemaProperty } from '../decorators/schema-metadata';
import { STEP_KIND_VALUES, STEP_STATUS_VALUES, STEP_KIND_DESCRIPTION, STEP_STATUS_DESCRIPTION } from '../mcp-schema-constants';
import type { Step } from '../../../domain/entities/Step';

export class StepMcpInputDTO {
  @SchemaProperty({
    type: 'string',
    description: 'Unique step identifier',
    required: true
  })
  id!: string;

  @SchemaProperty({
    type: 'string',
    description: 'Step title',
    required: true
  })
  title!: string;

  @SchemaProperty({
    type: 'string',
    description: 'Step description',
    required: true
  })
  description!: string;

  @SchemaProperty({
    type: 'string',
    description: STEP_KIND_DESCRIPTION,
    required: true,
    enum: STEP_KIND_VALUES
  })
  kind!: string;

  @SchemaProperty({
    type: 'string',
    description: STEP_STATUS_DESCRIPTION,
    required: true,
    enum: STEP_STATUS_VALUES
  })
  status!: string;
  
  @SchemaProperty({
    type: 'array',
    description: 'Array of step IDs this step depends on (optional)',
    items: { type: 'string' }
  })
  dependsOn?: string[];

  @SchemaProperty({
    type: 'object',
    description: 'Estimated duration (optional)',
    properties: {
      value: { type: 'number', description: 'Duration value' },
      unit: { type: 'string', description: 'Duration unit (e.g., hours, days, minutes)' }
    }
  })
  estimatedDuration?: {
    value: number;
    unit: string;
  };

  // ... autres propriétés

  /**
   * Transforme le DTO MCP vers l'entité Domain Step (structure partielle)
   */
  toDomain(): Partial<Step> {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      kind: this.kind as any,  // Le use case validera l'enum
      status: this.status as any,
      dependsOn: this.dependsOn,
      estimatedDuration: this.estimatedDuration,
      // ... autres propriétés
    };
  }
}

// src/infrastructure/mcp/types/AddStepToPlanMcpInput.ts
import type { AddStepInput } from '../../../application/use-cases/AddStepToPlanUseCase';

export class AddStepToPlanMcpInput {
  @SchemaProperty({
    type: 'string',
    description: 'The unique identifier of the plan',
    required: true
  })
  planId!: string;

  @SchemaProperty({
    type: 'object',
    description: 'The step to add',
    required: true,
    nestedClass: StepMcpInputDTO  // Référence à la classe pour génération
  })
  step!: StepMcpInputDTO;

  /**
   * Transforme le MCP Input vers le Domain Input
   * Délègue la transformation du step à StepMcpInputDTO.toDomain()
   */
  toDomain(): AddStepInput {
    return {
      planId: this.planId,
      step: this.step.toDomain(),  // Délégation au nested DTO
    };
  }
}
```

**Barrel export:**
```typescript
// src/infrastructure/mcp/types/index.ts
export { CreatePlanDraftMcpInput } from './CreatePlanDraftMcpInput';
export { AddStepToPlanMcpInput, StepMcpInputDTO } from './AddStepToPlanMcpInput';
export { UpdateStepInPlanMcpInput } from './UpdateStepInPlanMcpInput';
export { RemoveStepFromPlanMcpInput } from './RemoveStepFromPlanMcpInput';
export { UpdatePlanMetadataMcpInput } from './UpdatePlanMetadataMcpInput';
export { FinalizePlanMcpInput } from './FinalizePlanMcpInput';
```

---

### Phase 4: Créer les MCP Input Types pour les autres use cases

**Fichiers à créer dans `src/infrastructure/mcp/types/`:**

1. **Plans tools:**
   - `GetPlanMcpInput.ts` - outil `plans-get`
   - `UpdatePlanMcpInput.ts` - outil `plans-update`
   - `ListPlansMcpInput.ts` - outil `plans-list`
   - `ValidatePlanMcpInput.ts` - outil `plans-validate`
   - `PatchPlanElementsMcpInput.ts` - outil `plans-patch` (cas complexe avec union)

2. **Steps tools:**
   - `StepsGetMcpInput.ts` - outil `steps-get`
   - `StepsNavigateMcpInput.ts` - outil `steps-navigate`

3. **Comments tools:**
   - `CommentsManageMcpInput.ts` - outil `comments-manage` (union d'actions)
   - Peut nécessiter plusieurs types selon l'action

4. **Context tools:**
   - `SetPlanContextMcpInput.ts` - outil `plan-context-set`
   - `GetPlanContextMcpInput.ts` - outil `plan-context-get`
   - `DeletePlanContextMcpInput.ts` - outil `plan-context-delete`

**Note:** Ces types sont dans l'infrastructure et peuvent être différents des Input des use cases si nécessaire (adaptation).

---

### Phase 5: Migrer mcp-tools-definitions.ts

### Phase 4: Créer les MCP Input Types pour les autres use cases
**Fichiers à modifier:**

1. `src/application/use-cases/GetPlanUseCase.ts`
   - `GetPlanInput` class

2. `src/application/use-cases/UpdatePlanUseCase.ts`
   - `UpdatePlanInput` class

3. `src/application/use-cases/ListPlansUseCase.ts`
   - `ListPlansInput` class

4. `src/application/use-cases/ValidatePlanUseCase.ts`
   - `ValidatePlanInput` class

5. `src/application/use-cases/PatchPlanElementsUseCase.ts`
   - `PatchPlanElementsInput` class
   - Cas complexe avec union de propriétés conditionnelles

6. Comment use cases:
   - `AddPlanCommentUseCase.ts` → `AddPlanCommentInput`
   - `AddStepCommentUseCase.ts` → `AddStepCommentInput`
   - `UpdatePlanCommentUseCase.ts` → `UpdatePlanCommentInput`
   - `DeletePlanCommentUseCase.ts` → `DeletePlanCommentInput`
   - etc.

7. Context use cases:
   - `SetPlanContextUseCase.ts` → `SetPlanContextInput`
   - `GetPlanContextUseCase.ts` → `GetPlanContextInput`
   - `DeletePlanContextUseCase.ts` → `DeletePlanContextInput`

8. Navigation use cases:
   - `StepNavigationUseCases.ts` → Plusieurs inputs

**Note:** Ces fichiers ne sont PAS modifiés dans ce refactoring car on respecte l'architecture hexagonale.  
Les use cases restent purs. On crée des types MCP séparés dans l'infrastructure.

---

### Phase 5: Migrer mcp-tools-definitions.ts
**Fichier à modifier:**
- `src/infrastructure/mcp/mcp-tools-definitions.ts`

**Changements:**
```typescript
// AVANT (manuel)
{
  name: 'plans-create-draft',
  description: '...',
  inputSchema: {
    type: 'object',
    properties: {
      planType: { type: 'string', enum: PLAN_TYPE_VALUES, ... },
      title: { type: 'string', ... },
      // ... 50+ lignes
    },
    required: ['planType', 'title', ...]
  }
}

// APRÈS (généré depuis type MCP)
import { CreatePlanDraftMcpInput } from './types/CreatePlanDraftMcpInput';
import { generateMcpSchema } from './schema-generator';

{
  name: 'plans-create-draft',
  description: '...',
  inputSchema: generateMcpSchema(CreatePlanDraftMcpInput)
}
```

**Ordre de migration:**
1. Plans tools (plans-create-draft, plans-step-add, plans-update-step, etc.)
2. Steps tools (steps-get, steps-navigate)
3. Comments tools (comments-manage avec union d'actions)
4. Context tools (plan-context-set, etc.)
5. Autres tools (plans-validate, plans-get, etc.)

---

### Phase 6: Gérer les cas spéciaux

**Cas 1: Tools avec paramètres "plats" (pas d'objet wrapper)**
- `plans-create-draft` prend directement `planType`, `title`, etc. sans wrapper
- Solution: Option `flattenParams: true` dans `generateMcpSchema()`

**Cas 2: Tools avec unions conditionnelles**
- `comments-manage`: différents params selon `action` et `target`
- Solution: Créer plusieurs Input classes ou utiliser des decorators conditionnels

**Cas 3: Tools avec nested objects complexes**
- `plans-patch`: metadata, plan, ou step properties selon stepId
- Solution: Utiliser `nestedClass` dans `@SchemaProperty` pour référencer d'autres DTOs

**Cas 4: Descriptions dynamiques basées sur enums**
- Garder `enumToDescription()` helper
- L'appeler dans les décorateurs: `description: enumToDescription(STEP_KIND_VALUES)`

**Cas 5: Propriétés optionnelles vs required**
- Utiliser `required?: boolean` dans `@SchemaProperty`
- Ou déduire automatiquement du `?` TypeScript (avec `emitDecoratorMetadata`)

---

### Phase 7: Adapter les handlers McpServer.ts pour utiliser toDomain()

**⚠️ IMPORTANT: Transformation encapsulée dans les MCP Input Types**  
Les handlers reçoivent des types MCP (infrastructure) et appellent simplement `args.toDomain()` pour obtenir l'input du use case.

**Fichier à modifier:**
- `src/infrastructure/mcp/McpServer.ts`

**Pour chaque handler:**
1. Typer le paramètre `args` avec le type MCP correspondant au lieu de `any`
2. Appeler `args.toDomain()` pour obtenir l'input du use case
3. Passer le résultat directement au use case

**Pattern simplifié avec toDomain():**
```typescript
// AVANT (any, pas de type safety, mapping manuel dans handler)
private async handleCreatePlanDraft(args: any) {
  if (!args?.planType || !args?.title || !args?.description || !args?.objective) {
    throw new McpError(ErrorCode.InvalidParams, '...');
  }

  const result = await this.createPlanDraftUseCase.execute({
    planType: args.planType,
    metadata: { title: args.title, description: args.description, ... },
    // ... mapping manuel répété dans chaque handler
  });

  return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
}

// APRÈS (typé avec toDomain() - mapping encapsulé)
import { CreatePlanDraftMcpInput } from './types/CreatePlanDraftMcpInput';

private async handleCreatePlanDraft(args: CreatePlanDraftMcpInput) {
  // La validation MCP schema est déjà appliquée par le serveur MCP
  
  // TRANSFORMATION: args.toDomain() fait le mapping Infrastructure → Domain
  const result = await this.createPlanDraftUseCase.execute(args.toDomain());

  return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
}

// Exemple avec nested object
private async handleAddStepToPlan(args: AddStepToPlanMcpInput) {
  const result = await this.addStepToPlanUseCase.execute(args.toDomain());
  return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
}
```

**Handlers à modifier (17 handlers):**
1. `handleCreatePlanDraft(args: CreatePlanDraftMcpInput)` → `execute(args.toDomain())`
2. `handleAddStepToPlan(args: AddStepToPlanMcpInput)` → `execute(args.toDomain())`
3. `handleUpdateStepInPlan(args: UpdateStepInPlanMcpInput)` → `execute(args.toDomain())`
4. `handleRemoveStepFromPlan(args: RemoveStepFromPlanMcpInput)` → `execute(args.toDomain())`
5. `handleUpdatePlanMetadata(args: UpdatePlanMetadataMcpInput)` → `execute(args.toDomain())`
6. `handleFinalizePlan(args: FinalizePlanMcpInput)` → `execute(args.toDomain())`
7. `handleGetPlan(args: GetPlanMcpInput)` → `execute(args.toDomain())`
8. `handleUpdatePlan(args: UpdatePlanMcpInput)` → `execute(args.toDomain())`
9. `handleListPlans(args: ListPlansMcpInput)` → `execute(args.toDomain())`
10. `handleValidatePlan(args: ValidatePlanMcpInput)` → `execute(args.toDomain())`
11. `handlePatchPlan(args: PatchPlanElementsMcpInput)` → `execute(args.toDomain())`
12. `handleStepsGet(args: StepsGetMcpInput)` → `execute(args.toDomain())`
13. `handleStepsNavigate(args: StepsNavigateMcpInput)` → `execute(args.toDomain())`
14. `handleCommentsManage(args: CommentsManageMcpInput)` → `execute(args.toDomain())`
15. `handleSetPlanContext(args: SetPlanContextMcpInput)` → `execute(args.toDomain())`
16. `handleGetPlanContext(args: GetPlanContextMcpInput)` → `execute(args.toDomain())`
17. `handleDeletePlanContext(args: DeletePlanContextMcpInput)` → `execute(args.toDomain())`

**Bénéfices:**
- ✅ **Type safety end-to-end** - Typage depuis MCP jusqu'au domain
- ✅ **Handlers ultra-simples** - Une seule ligne: `execute(args.toDomain())`
- ✅ **Mapping centralisé** - Logique de transformation dans les MCP Input Types
- ✅ **Testabilité** - Méthodes `toDomain()` testables unitairement
- ✅ **Domain reste pur** - Aucune dépendance sur l'infrastructure MCP
- ✅ **Évolutivité** - Changements de structure faciles (modifier juste `toDomain()`)

---

### Phase 8: Mettre à jour les barrel exports

**Fichier à créer/modifier:**
- `src/infrastructure/mcp/types/index.ts` (déjà créé en phase 3)

**Pattern:**
```typescript
// Export tous les types MCP Input
export { CreatePlanDraftMcpInput } from './CreatePlanDraftMcpInput';
export { AddStepToPlanMcpInput, StepMcpInputDTO } from './AddStepToPlanMcpInput';
export { UpdateStepInPlanMcpInput } from './UpdateStepInPlanMcpInput';
// ... tous les autres

// Les use cases ne sont PAS modifiés et n'exportent rien de nouveau

---

### Phase 9: Tests de compilation et validation

1. **Vérifier la compilation TypeScript**
   ```bash
   npx tsc --noEmit
   ```

2. **Vérifier que les schémas générés sont valides**
   - Créer un script de test qui génère tous les schémas
   - Valider contre JSON Schema spec
   - Comparer avec les anciens schémas manuels

3. **Tests unitaires pour le générateur**
   - Tester `generateMcpSchema()` avec différents Input DTOs
   - Vérifier les cas edge (nested, arrays, enums, optionals)

---

### Phase 10: Mettre à jour McpServer.ts

**Fichier à modifier:**
- `src/infrastructure/mcp/McpServer.ts`

**Changements:**
- Imports des types MCP depuis `./types`
- Les handlers sont déjà typés (fait en phase 7)
- Vérifier que les validations MCP fonctionnent avec les nouveaux schémas
- Pas de changement majeur de logique

---

### Phase 11: Documentation et nettoyage

**Documentation à créer/mettre à jour:**
1. `README.md` - Section sur l'architecture des schémas
2. `CONTRIBUTING.md` - Guide pour ajouter de nouveaux outils MCP
3. JSDoc sur les décorateurs et le générateur
4. Exemples d'utilisation des décorateurs

**Nettoyage:**
1. Supprimer les anciens schémas manuels (garder en commentaire temporairement)
2. Vérifier qu'il n'y a plus de duplication
3. Organiser les imports

---

### Phase 12: Tests E2E

**Vérifier que tout fonctionne:**
1. Lancer le serveur MCP
2. Tester chaque outil via MCP client
3. Vérifier les validations d'erreurs
4. Tester avec les cas edge (données invalides, manquantes, etc.)

**Scénarios de test:**
- ✅ Créer un draft plan
- ✅ Ajouter des steps avec dépendances
- ✅ Mettre à jour un step
- ✅ Finaliser le plan
- ✅ Ajouter des commentaires
- ✅ Gérer le contexte
- ❌ Tenter de créer avec des données invalides
- ❌ Tenter d'ajouter un step avec un kind invalide

---

### Phase 13: Migration finale et cleanup

1. **Supprimer définitivement les anciens schémas**
   - Retirer les schémas manuels de `mcp-tools-definitions.ts`
   - Garder uniquement les descriptions et les schémas générés

2. **Optimisations possibles:**
   - Cacher les schémas générés en mémoire (pas besoin de regénérer à chaque appel)
   - Générer les schémas au build time au lieu du runtime

3. **Documentation finale:**
   - Mettre à jour ce document avec les lessons learned
   - Documenter les patterns à suivre pour de nouveaux outils

---

## Dépendances requises

```json
{
  "dependencies": {
    "reflect-metadata": "^0.2.1"
  }
}
```

**tsconfig.json:**
```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

---

## Risques et mitigation

### Risque 1: Breaking changes dans les schémas générés
**Mitigation:**
- Comparer les schémas générés avec les anciens (test automatique)
- Garder les anciens schémas en commentaire pendant la transition
- Rollback facile si problème

### Risque 2: Complexité des décorateurs pour les nouveaux développeurs
**Mitigation:**
- Documentation claire avec exemples
- Templates pour créer de nouveaux Input DTOs
- Guide de contribution

### Risque 3: Performance (reflection au runtime)
**Mitigation:**
- Cacher les schémas générés
- Envisager la génération au build time si nécessaire
- Mesurer l'impact (probablement négligeable)

### Risque 4: Bugs dans le générateur de schémas
**Mitigation:**
- Tests unitaires complets
- Validation contre JSON Schema spec
- Tests E2E

---

## Mesures de succès

- ✅ 0 duplication entre types TypeScript et schémas JSON
- ✅ Tous les tests E2E passent
- ✅ 0 erreur de compilation TypeScript
- ✅ Les schémas générés sont identiques aux anciens (ou explicitement améliorés)
- ✅ Code coverage > 80% sur le générateur de schémas
- ✅ Documentation complète

---

## Timeline estimée

| Phase | Durée estimée | Complexité |
|-------|---------------|------------|
| Phase 1: Infrastructure décorateurs | 30min | Faible |
| Phase 2: Générateur de schémas | 1h | Moyenne |
| Phase 3: DTOs use cases incrémentaux | 1h | Moyenne |
| Phase 4: DTOs autres use cases | 1.5h | Moyenne |
| Phase 5: Migration mcp-tools-definitions | 1h | Moyenne |
| Phase 6: Cas spéciaux | 1h | Élevée |
| Phase 7: Adapter use cases | 30min | Faible |
| Phase 8: Barrel exports | 15min | Faible |
| Phase 9: Tests compilation | 30min | Faible |
| Phase 10: Mise à jour McpServer | 30min | Faible |
| Phase 11: Documentation | 45min | Faible |
| Phase 12: Tests E2E | 1h | Moyenne |
| Phase 13: Migration finale | 30min | Faible |

**Total estimé: ~9-10 heures**

---

## Notes d'implémentation

### Pattern recommandé pour les MCP Input Types (Infrastructure)

**⚠️ Architecture: Types MCP dans `src/infrastructure/mcp/types/` avec méthode `toDomain()`**

```typescript
// src/infrastructure/mcp/types/MyUseCaseMcpInput.ts
import { SchemaProperty } from '../decorators/schema-metadata';
import { STEP_KIND_VALUES } from '../mcp-schema-constants';
import type { MyUseCaseInput } from '../../../application/use-cases/MyUseCase';

export class MyUseCaseMcpInput {
  @SchemaProperty({
    type: 'string',
    description: 'Clear description for API docs',
    required: true,
    enum: ENUM_VALUES  // Si applicable
  })
  myProperty!: string;

  @SchemaProperty({
    type: 'array',
    description: 'Array of items',
    items: { type: 'string' }
  })
  myArray?: string[];

  @SchemaProperty({
    type: 'object',
    description: 'Nested object',
    nestedClass: NestedMcpDTO  // Pour les objets complexes
  })
  nested?: NestedMcpDTO;

  /**
   * Transforme le MCP Input (Infrastructure) vers le Domain Input (Use Case)
   * Cette méthode encapsule toute la logique de mapping entre les couches
   */
  toDomain(): MyUseCaseInput {
    return {
      // Mapping simple (pass-through)
      myProperty: this.myProperty,
      myArray: this.myArray,
      
      // Mapping complexe (transformation de structure)
      nested: this.nested?.toDomain(),  // Délégation si nested DTO
      
      // Ou transformation personnalisée
      // computed: this.myProperty.toUpperCase(),
    };
  }
}
```

### Mapping encapsulé avec toDomain() (Infrastructure → Domain)

```typescript
// src/infrastructure/mcp/McpServer.ts
import { CreatePlanDraftMcpInput } from './types/CreatePlanDraftMcpInput';
import { AddStepToPlanMcpInput } from './types/AddStepToPlanMcpInput';

// Pattern ultra-simple: args.toDomain() fait tout le mapping
private async handleCreatePlanDraft(args: CreatePlanDraftMcpInput) {
  const result = await this.createPlanDraftUseCase.execute(args.toDomain());
  return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
}

// Même pattern pour nested objects - la complexité est dans toDomain()
private async handleAddStepToPlan(args: AddStepToPlanMcpInput) {
  const result = await this.addStepToPlanUseCase.execute(args.toDomain());
  return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
}

// La logique de transformation est dans les classes MCP Input:
// CreatePlanDraftMcpInput.toDomain() {
//   return {
//     planType: this.planType,
//     metadata: { title: this.title, description: this.description, ... },
//     objective: this.objective,
//     ...
//   };
// }
```

### Helper pour descriptions dynamiques

```typescript
import { enumToDescription } from '../schema-helpers';

// Dans un type MCP Input
@SchemaProperty({
  type: 'string',
  description: enumToDescription(STEP_KIND_VALUES, 'Step kind: '),
  enum: STEP_KIND_VALUES
})
kind!: string;
```

---

## Prochaines étapes après le refactoring

Une fois ce refactoring terminé, on pourra facilement:
1. **Ajouter de nouveaux outils MCP** - Créer classe MCP Input + méthode `toDomain()` + handler simple
2. **Modifier des schémas** - Changer juste les décorateurs dans les types MCP
3. **Ajouter de nouvelles validations** - Au niveau du décorateur ou dans `toDomain()`
4. **Générer de la documentation** - Automatiquement depuis les métadonnées
5. **Créer des clients typés** - Pour consommer les outils MCP
6. **Changer la structure domain** - Modifier juste `toDomain()`, pas les schémas MCP
7. **Tester la transformation** - Tests unitaires sur `toDomain()` sans démarrer le serveur

**Avantages clés de cette architecture:**  
- ✅ **Domain pur** - Aucune dépendance sur l'infrastructure MCP
- ✅ **Handlers simples** - Une ligne: `execute(args.toDomain())`
- ✅ **Mapping centralisé** - Dans les classes MCP Input, testable unitairement
- ✅ **Évolutivité** - Domain et MCP peuvent évoluer indépendamment
- ✅ **Type safety** - Compilation TypeScript garantit la cohérence

---

**Date de création:** 8 janvier 2026  
**Auteur:** GitHub Copilot  
**Status:** 📋 Planification - Mis à jour avec approche Infrastructure/Domain  
**Architecture:** Hexagonale - Infrastructure adaptée, Domain préservé
