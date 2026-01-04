# MCP Implementation Tools - Plan d'implémentation

## Vue d'ensemble
Outils MCP pour permettre à l'agent d'interagir avec le plan pendant l'implémentation.
Implémentation des priorités HAUTE et MOYENNE.

---

## 🎯 Outils à implémenter

### PRIORITÉ HAUTE

#### 1. Navigation & Récupération des étapes
```typescript
getCurrentStep(planId: string): StepDTO | null
  → Retourne l'étape courante basée sur currentStepIndex
  → Null si aucune étape courante

getNextStep(planId: string): StepDTO | null
  → Retourne la prochaine étape disponible (non-done, dépendances satisfaites)
  → Null si toutes les étapes sont terminées

getStepByIndex(planId: string, index: number): StepDTO | null
  → Récupère une étape par son index (0-based)
  → Null si index invalide

getStepById(planId: string, stepId: string): StepDTO | null
  → Récupère une étape par son ID unique
  → Null si stepId non trouvé

getAllSteps(planId: string): StepDTO[]
  → Liste toutes les étapes avec leurs statuts
```

#### 2. Gestion de l'état d'implémentation
```typescript
markStepAsStarted(planId: string, stepId: string): { success: boolean, message: string }
  → Marque une étape comme "in-progress"
  → Met à jour currentStepIndex
  → Vérifie les dépendances

markStepAsCompleted(planId: string, stepId: string, notes?: string): { success: boolean, message: string }
  → Marque une étape comme "done"
  → Enregistre des notes optionnelles
  → Incrémente currentStepIndex automatiquement

markStepAsBlocked(planId: string, stepId: string, reason: string): { success: boolean, message: string }
  → Marque une étape comme "blocked"
  → Enregistre la raison du blocage

markStepAsSkipped(planId: string, stepId: string, reason?: string): { success: boolean, message: string }
  → Marque une étape comme "skipped"
  → Enregistre la raison optionnelle
```

#### 3. Détails & Actions
```typescript
getStepDetails(planId: string, stepId: string): StepDTO | null
  → Retourne toutes les infos de l'étape
  → { id, title, description, kind, actions, estimatedDuration, dependsOn, status, ... }

getStepActions(planId: string, stepId: string): ActionDTO[] | null
  → Retourne uniquement les actions de l'étape
  → Format détaillé pour chaque type (create_file, edit_file, run_command, etc.)

getStepContext(planId: string, stepId: string): StepContextDTO | null
  → Contexte complet: current step + dependencies + next steps
  → { currentStep, dependencies: StepDTO[], nextSteps: StepDTO[] }
```

---

### PRIORITÉ MOYENNE

#### 4. Validation & Dépendances
```typescript
canStartStep(planId: string, stepId: string): CanStartResult
  → Vérifie si toutes les dépendances sont satisfaites
  → { allowed: boolean, reason?: string, missingDependencies: string[] }

getStepDependencies(planId: string, stepId: string): DependencyInfo[]
  → Liste les étapes dont dépend l'étape donnée
  → { stepId: string, title: string, status: 'done' | 'pending' | 'blocked' | 'in-progress' }

getDependentSteps(planId: string, stepId: string): StepDTO[]
  → Liste les étapes qui dépendent de l'étape donnée
```

#### 5. Progression & Statistiques
```typescript
getImplementationProgress(planId: string): ProgressDTO
  → { 
      total: number,
      completed: number, 
      inProgress: number,
      blocked: number, 
      skipped: number, 
      pending: number,
      percentComplete: number,
      estimatedTimeRemaining?: string
    }

getPhaseProgress(planId: string, phaseName?: string): PhaseProgressDTO | PhaseProgressDTO[]
  → Progression par phase (Setup, Components, Tests, etc.)
  → Si phaseName fourni, retourne la progression de cette phase
  → Sinon, retourne la progression de toutes les phases

getImplementationState(planId: string): ImplementationStateDTO
  → { 
      currentStepIndex: number,
      isStarted: boolean,
      isComplete: boolean,
      startedAt?: Date,
      completedAt?: Date,
      totalSteps: number
    }
```

#### 6. Workflow Global
```typescript
startImplementation(planId: string): { success: boolean, message: string }
  → Initialise le workflow d'implémentation
  → Met isStarted = true, startedAt = timestamp
  → Reset currentStepIndex = 0 si nécessaire

completeImplementation(planId: string): { success: boolean, message: string }
  → Finalise l'implémentation
  → Met isComplete = true, completedAt = timestamp
  → Vérifie que toutes les étapes sont done ou skipped

resetImplementation(planId: string): { success: boolean, message: string }
  → Reset tous les statuts des étapes
  → Reset currentStepIndex = 0
  → Met isStarted = false, isComplete = false
```

---

## 📊 Structure de données

### DTOs à créer/modifier:

```typescript
interface StepStatus {
  status: 'pending' | 'in-progress' | 'done' | 'blocked' | 'skipped';
  startedAt?: Date;
  completedAt?: Date;
  notes?: string;
  blockReason?: string;
}

interface StepContextDTO {
  currentStep: StepDTO;
  dependencies: StepDTO[];
  nextSteps: StepDTO[];
}

interface CanStartResult {
  allowed: boolean;
  reason?: string;
  missingDependencies: string[];
}

interface DependencyInfo {
  stepId: string;
  title: string;
  status: 'done' | 'pending' | 'blocked' | 'in-progress' | 'skipped';
}

interface ProgressDTO {
  total: number;
  completed: number;
  inProgress: number;
  blocked: number;
  skipped: number;
  pending: number;
  percentComplete: number;
  estimatedTimeRemaining?: string;
}

interface PhaseProgressDTO {
  phaseName: string;
  icon: string;
  total: number;
  completed: number;
  percentComplete: number;
}

interface ImplementationStateDTO {
  currentStepIndex: number;
  isStarted: boolean;
  isComplete: boolean;
  startedAt?: Date;
  completedAt?: Date;
  totalSteps: number;
}
```

---

## 🏗️ Architecture d'implémentation

### Backend (mcp-planflow):

```
src/
├── domain/
│   └── entities/
│       └── StepStatus.ts (nouveau)
├── application/
│   ├── dtos/
│   │   ├── StepStatusDTO.ts (nouveau)
│   │   ├── StepContextDTO.ts (nouveau)
│   │   ├── ProgressDTO.ts (nouveau)
│   │   └── ImplementationStateDTO.ts (nouveau)
│   └── use-cases/
│       ├── StepNavigationUseCases.ts (nouveau)
│       ├── StepStatusUseCases.ts (nouveau)
│       ├── StepDependencyUseCases.ts (nouveau)
│       ├── ImplementationProgressUseCases.ts (nouveau)
│       └── ImplementationWorkflowUseCases.ts (nouveau)
├── infrastructure/
│   └── repositories/
│       └── MongoDBPlanRepository.ts (mise à jour)
└── presentation/
    ├── mcp/
    │   └── tools/ (21 nouveaux tools)
    └── express/
        └── routes/
            └── implementationRoutes.ts (nouveau)
```

### Modifications du modèle Plan:

```typescript
interface Plan {
  // ... existant
  implementation?: {
    isStarted: boolean;
    isComplete: boolean;
    startedAt?: Date;
    completedAt?: Date;
    currentStepIndex: number;
  };
  steps: Array<StepDTO & {
    status?: {
      state: 'pending' | 'in-progress' | 'done' | 'blocked' | 'skipped';
      startedAt?: Date;
      completedAt?: Date;
      notes?: string;
      blockReason?: string;
    };
  }>;
}
```

---

## 🔄 Workflow d'implémentation pour l'agent

```typescript
// 1. Démarrer
startImplementation(planId)

// 2. Boucle
while (true) {
  const step = getNextStep(planId)
  if (!step) break
  
  const canStart = canStartStep(planId, step.id)
  if (!canStart.allowed) {
    markStepAsBlocked(step.id, canStart.reason)
    continue
  }
  
  markStepAsStarted(planId, step.id)
  const actions = getStepActions(planId, step.id)
  
  // Exécuter les actions...
  
  markStepAsCompleted(planId, step.id, "Done!")
  
  const progress = getImplementationProgress(planId)
  console.log(`Progress: ${progress.percentComplete}%`)
}

// 3. Finaliser
completeImplementation(planId)
```

---

## 📝 Ordre d'implémentation recommandé

### Phase 1 - Navigation (Jour 1):
1. ✅ Créer DTOs de base (StepStatusDTO, StepContextDTO)
2. ✅ StepNavigationUseCases avec: getCurrentStep, getNextStep, getStepByIndex, getStepById, getAllSteps
3. ✅ MCP tools: get-current-step, get-next-step, get-step-by-index, get-step-by-id, get-all-steps
4. ✅ Tests unitaires

### Phase 2 - Statuts (Jour 2):
5. ✅ Modifier MongoDBPlanRepository pour supporter les statuts
6. ✅ StepStatusUseCases avec: markStepAsStarted, markStepAsCompleted, markStepAsBlocked, markStepAsSkipped
7. ✅ MCP tools: mark-step-started, mark-step-completed, mark-step-blocked, mark-step-skipped
8. ✅ Tests unitaires

### Phase 3 - Détails & Contexte (Jour 3):
9. ✅ Implémenter getStepDetails, getStepActions, getStepContext
10. ✅ MCP tools: get-step-details, get-step-actions, get-step-context
11. ✅ Tests unitaires

### Phase 4 - Dépendances (Jour 4):
12. ✅ StepDependencyUseCases avec: canStartStep, getStepDependencies, getDependentSteps
13. ✅ MCP tools: can-start-step, get-step-dependencies, get-dependent-steps
14. ✅ Tests unitaires

### Phase 5 - Progression (Jour 5):
15. ✅ Créer ProgressDTO, PhaseProgressDTO, ImplementationStateDTO
16. ✅ ImplementationProgressUseCases avec: getImplementationProgress, getPhaseProgress, getImplementationState
17. ✅ MCP tools: get-implementation-progress, get-phase-progress, get-implementation-state
18. ✅ Tests unitaires

### Phase 6 - Workflow Global (Jour 6):
19. ✅ ImplementationWorkflowUseCases avec: startImplementation, completeImplementation, resetImplementation
20. ✅ MCP tools: start-implementation, complete-implementation, reset-implementation
21. ✅ Tests d'intégration complets
22. ✅ Documentation finale

---

## ✅ Critères de validation

Pour chaque outil:
- ✅ Use case implémenté avec logique métier
- ✅ Repository mis à jour si nécessaire
- ✅ MCP tool exposé avec schema JSON complet
- ✅ Gestion d'erreurs robuste
- ✅ Tests unitaires (couverture > 80%)
- ✅ Documentation inline
- ✅ Types TypeScript stricts

---

## 📊 Total: 21 nouveaux outils MCP

**Priorité HAUTE**: 12 outils
**Priorité MOYENNE**: 9 outils

**Temps estimé**: 5-6 jours
**Complexité**: Moyenne-Haute
