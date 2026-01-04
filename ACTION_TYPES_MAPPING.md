# Mapping des Types d'Actions

Ce document explique la correspondance entre les types d'actions utilisés en base de données (schema v1.0.0) et les types définis dans le nouveau schema v1.1.0.

## Compatibilité

Le viewer supporte **les deux formats** pour assurer une transition en douceur :
- ✅ Ancien format (v1.0.0) avec `type` varié et `payload`
- ✅ Nouveau format (v1.1.0) avec types stricts et champs spécifiques

## Correspondance des Types

### 1. Commandes Terminal

**Ancien format (v1.0.0):**
```json
{
  "type": "terminal",
  "description": "Créer un nouveau projet React",
  "payload": {
    "command": "npm create vite@latest login-app"
  }
}
```

**Nouveau format (v1.1.0):**
```json
{
  "type": "run_command",
  "command": "npm create vite@latest login-app",
  "description": "Créer un nouveau projet React"
}
```

**Mapping:** `terminal` → `run_command`

---

### 2. Création de Fichiers

**Ancien format (v1.0.0):**
```json
{
  "type": "create_file",
  "description": "Créer LoginForm.jsx",
  "payload": {
    "file": "src/components/LoginForm.jsx",
    "content": "import React from 'react'..."
  }
}
```

**Nouveau format (v1.1.0):**
```json
{
  "type": "create_file",
  "filePath": "src/components/LoginForm.jsx",
  "content": "import React from 'react'...",
  "description": "Créer LoginForm.jsx"
}
```

**Mapping:** `create_file` reste `create_file`, mais `payload.file` → `filePath`

---

### 3. Création de Répertoires

**Ancien format (v1.0.0):**
```json
{
  "type": "create_directory",
  "description": "Créer le dossier components",
  "payload": {
    "path": "src/components"
  }
}
```

**Nouveau format (v1.1.0):**
```json
{
  "type": "create_file",
  "filePath": "src/components/.gitkeep",
  "description": "Créer le dossier components"
}
```

**Mapping:** `create_directory` → `create_file` (traité comme création de fichier)

---

### 4. Édition de Fichiers

**Ancien format (v1.0.0):**
```json
{
  "type": "edit_file",
  "description": "Ajouter la validation",
  "payload": {
    "file": "src/components/LoginForm.jsx",
    "changes": "Importer et utiliser les fonctions de validation"
  }
}
```

**Nouveau format (v1.1.0):**
```json
{
  "type": "edit_file",
  "filePath": "src/components/LoginForm.jsx",
  "description": "Ajouter la validation",
  "before": "// Code avant modification",
  "after": "// Code après modification",
  "lineNumbers": {
    "start": 1,
    "end": 19
  }
}
```

**Mapping:** `edit_file` reste `edit_file`, mais `payload.file` → `filePath`

---

### 5. Tests Manuels

**Ancien format (v1.0.0):**
```json
{
  "type": "manual_test",
  "description": "Tester la validation des champs",
  "payload": {
    "scenarios": [
      "Email invalide",
      "Mot de passe trop court",
      "Champs vides"
    ]
  }
}
```

**Nouveau format (v1.1.0):**
```json
{
  "type": "test",
  "description": "Tester la validation des champs",
  "testCommand": "npm test",
  "testFiles": ["src/__tests__/validation.test.ts"]
}
```

**Mapping:** `manual_test` → `test`  
**Note:** Les scénarios dans `payload.scenarios` sont affichés si présents

---

### 6. Code Review

**Ancien format (v1.0.0):**
```json
{
  "type": "code_review",
  "description": "Vérifier la qualité du code",
  "payload": {
    "checks": [
      "Supprimer le code inutilisé",
      "Ajouter des commentaires JSDoc",
      "Vérifier la cohérence du nommage"
    ]
  }
}
```

**Nouveau format (v1.1.0):**
```json
{
  "type": "review",
  "description": "Vérifier la qualité du code",
  "checklistItems": [
    "Supprimer le code inutilisé",
    "Ajouter des commentaires JSDoc",
    "Vérifier la cohérence du nommage"
  ],
  "reviewers": ["@senior-dev", "@tech-lead"]
}
```

**Mapping:** `code_review` → `review`  
**Note:** Les checks dans `payload.checks` sont affichés si présents

---

## Implémentation dans le Viewer

Le viewer utilise une stratégie de **fallback intelligent** pour supporter les deux formats :

```typescript
// Exemple pour RunCommandLayout
const action = step.actions?.find(
  (a: any) => a.type === 'run_command' || a.type === 'terminal'
) as any;

// Récupération de la commande avec fallback
const command = action?.command || action?.payload?.command;
```

### Layouts Supportés

| Layout | Types acceptés | Champs payload supportés |
|--------|----------------|-------------------------|
| `CreateFileLayout` | `create_file`, `create_directory` | `payload.file`, `payload.path`, `payload.content` |
| `EditFileLayout` | `edit_file` | `payload.file` |
| `RunCommandLayout` | `run_command`, `terminal` | `payload.command` |
| `TestLayout` | `test`, `manual_test` | `payload.scenarios` |
| `ReviewLayout` | `review`, `code_review` | `payload.checks` |
| `DocumentationLayout` | `documentation` | - |
| `CustomLayout` | `custom` + tous les autres | - |

## Migration Recommandée

Pour migrer un plan de v1.0.0 vers v1.1.0 :

1. **Remplacer les types :**
   - `terminal` → `run_command`
   - `manual_test` → `test`
   - `code_review` → `review`
   - `create_directory` → `create_file`

2. **Extraire les champs du payload :**
   - `payload.command` → `command`
   - `payload.file` → `filePath`
   - `payload.path` → `filePath`
   - `payload.content` → `content`
   - `payload.scenarios` → conserver temporairement dans payload
   - `payload.checks` → `checklistItems`

3. **Enrichir avec les nouveaux champs :**
   - Ajouter `before` / `after` pour les `edit_file`
   - Ajouter `lineNumbers` pour localiser les changements
   - Ajouter `testFiles` et `coverage` pour les tests
   - Ajouter `reviewers` pour les reviews

## Exemple Complet de Migration

**Avant (v1.0.0):**
```json
{
  "id": "step-1",
  "kind": "run_command",
  "actions": [
    {
      "type": "terminal",
      "description": "Installer les dépendances",
      "payload": {
        "command": "npm install"
      }
    }
  ]
}
```

**Après (v1.1.0):**
```json
{
  "id": "step-1",
  "kind": "run_command",
  "actions": [
    {
      "type": "run_command",
      "command": "npm install",
      "workingDirectory": "./my-project",
      "description": "Installer les dépendances",
      "expectedOutput": "added 234 packages"
    }
  ]
}
```

## Support Long Terme

- ✅ **v1.0.0** : Support complet avec fallbacks
- ✅ **v1.1.0** : Format recommandé avec types stricts
- 🔄 **Migration progressive** : Pas de breaking change, les deux formats coexistent
