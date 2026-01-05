# 🤖 Instructions pour GitHub Copilot Agent

Ce fichier contient les instructions et la documentation des outils MCP disponibles dans ce projet.

---

## 📋 Validation des Plans d'Implémentation

**RÈGLE CRITIQUE** : Avant de créer un plan d'implémentation, vous **DEVEZ TOUJOURS** :

1. **Valider le plan en premier** : Utilisez l'outil `plans-validate` avec le contenu du plan
2. **Attendre la validation** : Assurez-vous que la réponse indique `"isValid": true`
3. **Corriger les erreurs** : Si des erreurs sont rapportées (path: `/steps/X/kind`, etc.), appliquez les corrections
4. **Créer uniquement après succès** : Une fois validé, utilisez `plans-create` avec le plan corrigé

### Flux de validation correct :

```
[Plan JSON initial]
↓
plans-validate → Erreurs détectées ?
↓                    ↓
Non ✓            Oui → Corriger
↓                      ↓
plans-create      Revalider
```

### Bénéfices :
- ✅ Évite les allers-retours de correction
- ✅ Plans conformes au schéma PlanFlow v1.1.0
- ✅ Feedback immédiat sur les erreurs de structure
- ✅ Économise token budget et temps

---

## 🛠️ Outils MCP PlanFlow Disponibles

Ce projet expose 10 outils MCP pour gérer les plans d'implémentation :

### 1. `plans-format`

**Description** : Obtenir le schéma PlanFlow v1.1.0 complet avec descriptions, valeurs valides et exemples

**Paramètres** : Aucun

**Utilisation** :
```
Donne-moi le format complet du schéma PlanFlow
```

**Quand l'utiliser** :
- Avant de créer un premier plan
- Pour comprendre la structure attendue
- Pour voir les valeurs valides pour `kind`, `status`, etc.

---

### 2. `plans-validate`

**Description** : Valider un plan contre le schéma et les règles métier (dépendances, cycles, IDs uniques)

**Paramètres** :
- `plan` (requis) - Object : Le plan complet à valider

**Utilisation** :
```
Valide ce plan avant de le créer :
{
  "metadata": { ... },
  "plan": { ... },
  "steps": [ ... ]
}
```

**Retour** :
```json
{
  "isValid": true,
  "errors": [],
  "warnings": []
}
```

**Quand l'utiliser** :
- ⚠️ **TOUJOURS avant `plans-create`**
- Pour vérifier les dépendances circulaires
- Pour s'assurer que tous les IDs sont uniques
- Pour valider les valeurs de `kind`, `status`, etc.

---

### 3. `plans-create`

**Description** : Créer un nouveau plan d'implémentation

**Paramètres** :
- `planData` (requis) - Object : Plan complet suivant le schéma PlanFlow v1.1.0

**Utilisation** :
```
Crée un plan pour ajouter l'authentification JWT avec :
- Login/register pages
- Protected routes
- Token refresh
```

**Retour** :
```json
{
  "planId": "plan_abc123xyz",
  "created": true
}
```

**Quand l'utiliser** :
- Après validation réussie avec `plans-validate`
- Pour persister un nouveau plan
- Au début d'une nouvelle feature/refactor

---

### 4. `plans-get`

**Description** : Récupérer un plan par ID incluant toutes les étapes, commentaires d'étapes et commentaires de plan

**Paramètres** :
- `planId` (requis) - String : L'identifiant unique du plan

**Utilisation** :
```
Récupère le plan "plan_abc123xyz" et montre-moi les étapes critiques
```

**Retour** : Plan complet avec métadonnées, étapes, et commentaires

**Quand l'utiliser** :
- Pour analyser un plan existant
- Avant de mettre à jour un plan
- Pour générer un rapport de statut

---

### 5. `plans-update`

**Description** : Mettre à jour un plan existant (métadonnées, détails ou étapes)

**Paramètres** :
- `planId` (requis) - String : L'identifiant unique du plan
- `updates` (requis) - Object : Champs à mettre à jour (metadata, plan, steps)

**Utilisation** :
```
Marque l'étape "step-2" comme completed dans le plan "plan_abc123xyz"
```

**Exemple de `updates`** :
```json
{
  "steps": [
    {
      "id": "step-2",
      "status": "completed"
    }
  ]
}
```

**Quand l'utiliser** :
- Pour changer le statut d'une étape
- Pour ajouter/modifier des étapes
- Pour mettre à jour les métadonnées du plan

---

### 6. `plans-list`

**Description** : Lister les plans avec filtres optionnels (planType, status, pagination)

**Paramètres** :
- `planType` (optionnel) - String : Filtrer par type de plan
- `status` (optionnel) - String : Filtrer par statut d'étape
- `limit` (optionnel) - Number : Nombre max de plans à retourner
- `offset` (optionnel) - Number : Nombre de plans à sauter (pagination)

**Utilisation** :
```
Liste tous les plans de type "feature" qui ont des étapes en status "blocked"
```

**Retour** : Array de plans avec métadonnées

**Quand l'utiliser** :
- Pour avoir une vue d'ensemble
- Pour trouver les plans bloqués
- Pour générer des statistiques

---

### 7. `steps-get`

**Description** : Récupérer une étape par ID ou index

**Paramètres** :
- `planId` (requis) - String : L'identifiant unique du plan
- `selector` (requis) - Object : Sélecteur pour identifier l'étape
  - `by` (requis) - String : Mode de sélection (`"id"` ou `"index"`)
  - `value` (requis) - String|Number : L'ID de l'étape ou l'index dans le tableau

**Utilisation** :
```
Récupère la 3ème étape du plan "plan_abc123xyz"

Ou :

Récupère l'étape "step-auth-login" du plan "plan_abc123xyz"
```

**Exemples de `selector`** :
```json
// Par index
{ "by": "index", "value": 2 }

// Par ID
{ "by": "id", "value": "step-auth-login" }
```

**Quand l'utiliser** :
- Pour analyser une étape spécifique
- Avant de modifier une étape
- Pour comprendre les dépendances

---

### 8. `steps-navigate`

**Description** : Récupérer l'étape courante ou la prochaine étape disponible

**Paramètres** :
- `planId` (requis) - String : L'identifiant unique du plan
- `mode` (requis) - String : Mode de navigation (`"current"` ou `"next"`)

**Utilisation** :
```
Quelle est l'étape en cours dans le plan "plan_abc123xyz" ?

Ou :

Quelle est la prochaine étape à faire dans le plan "plan_abc123xyz" ?
```

**Modes** :
- `"current"` : Étape actuellement en cours (`status: "in_progress"`)
- `"next"` : Prochaine étape disponible (toutes les dépendances complétées, pas encore commencée)

**Quand l'utiliser** :
- Pour savoir sur quoi travailler maintenant
- Pour guider le développeur
- Pour suivre la progression

---

### 9. `steps-context`

**Description** : Récupérer le contexte complet d'une étape : l'étape elle-même + ses dépendances + les étapes qui dépendent d'elle

**Paramètres** :
- `planId` (requis) - String : L'identifiant unique du plan
- `stepId` (requis) - String : L'identifiant unique de l'étape

**Utilisation** :
```
Montre-moi le contexte complet de l'étape "step-auth-middleware" 
dans le plan "plan_abc123xyz"
```

**Retour** :
```json
{
  "step": { /* étape complète */ },
  "dependencies": [ /* étapes dont celle-ci dépend */ ],
  "dependents": [ /* étapes qui dépendent de celle-ci */ ]
}
```

**Quand l'utiliser** :
- Pour comprendre l'impact d'une étape
- Avant de modifier/supprimer une étape
- Pour identifier le chemin critique

---

### 10. `comments-manage`

**Description** : Gérer les commentaires sur les plans ou les étapes (get, add, update, delete)

**Paramètres** :
- `action` (requis) - String : Action à effectuer (`"get"`, `"add"`, `"update"`, `"delete"`)
- `target` (requis) - String : Cible du commentaire (`"plan"` ou `"step"`)
- `planId` (requis) - String : L'identifiant unique du plan
- `stepId` (optionnel) - String : L'identifiant de l'étape (requis si `target="step"`)
- `commentId` (optionnel) - String : L'ID du commentaire (requis pour `update`/`delete`)
- `content` (optionnel) - String : Contenu du commentaire (requis pour `add`/`update`)
- `author` (optionnel) - String : Auteur du commentaire (optionnel pour `add`)

**Utilisation** :

**Ajouter un commentaire sur une étape** :
```
Ajoute un commentaire sur l'étape "step-auth-login" du plan "plan_abc123xyz" :
"Attention : vérifier la validation du token avant de merger"
```

**Récupérer tous les commentaires d'un plan** :
```
Montre-moi tous les commentaires du plan "plan_abc123xyz"
```

**Exemples de paramètres** :

```json
// Ajouter un commentaire sur un plan
{
  "action": "add",
  "target": "plan",
  "planId": "plan_abc123xyz",
  "content": "Ce plan est prioritaire pour la release v2.0",
  "author": "Alice"
}

// Récupérer les commentaires d'une étape
{
  "action": "get",
  "target": "step",
  "planId": "plan_abc123xyz",
  "stepId": "step-auth-login"
}

// Supprimer un commentaire
{
  "action": "delete",
  "target": "step",
  "planId": "plan_abc123xyz",
  "stepId": "step-auth-login",
  "commentId": "comment_xyz789"
}
```

**Quand l'utiliser** :
- Pour documenter des décisions
- Pour signaler des points d'attention
- Pour collaborer avec l'équipe
- Pour ajouter du contexte à une étape

---

## 📖 Exemples de Workflows Complets

### Workflow 1 : Créer un nouveau plan

```
User: Crée un plan pour ajouter un système d'authentification OAuth

Agent:
1. [Demande plans-format pour connaître le schéma]
2. [Génère le plan JSON]
3. [Appelle plans-validate avec le plan]
4. Si erreurs → [Corrige et revalide]
5. Si OK → [Appelle plans-create]
6. [Confirme avec le planId créé]
```

### Workflow 2 : Analyser et continuer un plan

```
User: Qu'est-ce que je dois faire maintenant sur le plan "plan_abc123xyz" ?

Agent:
1. [Appelle steps-navigate avec mode="next"]
2. [Récupère l'étape suivante]
3. [Appelle steps-context pour voir les dépendances]
4. [Explique ce qu'il faut faire]
```

### Workflow 3 : Review et commentaires

```
User: Review l'étape "step-database-migration" et ajoute tes suggestions

Agent:
1. [Appelle steps-get pour récupérer l'étape]
2. [Analyse le contenu]
3. [Appelle comments-manage action="add" avec les suggestions]
4. [Confirme l'ajout du commentaire]
```

---

## ⚠️ Erreurs Courantes à Éviter

### ❌ Créer sans valider
```
// MAUVAIS
plans-create(planData)  // Peut échouer silencieusement

// BON
plans-validate(planData) → si OK → plans-create(planData)
```

### ❌ Valeurs invalides pour `kind`
```json
// MAUVAIS
{ "kind": "setup" }  // Pas dans l'enum

// BON
{ "kind": "infrastructure_setup" }  // Valeur valide
```

Valeurs valides pour `kind` :
- `infrastructure_setup`
- `dependency_installation`
- `configuration`
- `database_migration`
- `api_implementation`
- `ui_implementation`
- `integration`
- `testing`
- `documentation`
- `deployment`
- `validation`
- `custom`

### ❌ Dépendances circulaires
```json
// MAUVAIS
{
  "steps": [
    { "id": "A", "dependsOn": ["B"] },
    { "id": "B", "dependsOn": ["A"] }  // Cycle !
  ]
}
```

### ❌ IDs dupliqués
```json
// MAUVAIS
{
  "steps": [
    { "id": "step-1", ... },
    { "id": "step-1", ... }  // Dupliqué !
  ]
}
```

---

## 🎯 Bonnes Pratiques

1. **Toujours valider avant de créer** : Utilisez `plans-validate` systématiquement
2. **Utiliser des IDs descriptifs** : `step-auth-login` plutôt que `step-1`
3. **Documenter avec des commentaires** : Ajoutez du contexte aux étapes complexes
4. **Vérifier le contexte** : Utilisez `steps-context` avant de modifier une étape
5. **Navigation intelligente** : Utilisez `steps-navigate` pour guider le workflow
6. **Filtrer intelligemment** : Utilisez `plans-list` avec filtres pour trouver rapidement

---

## 🔗 Ressources

- **API Documentation** : `/packages/mcp-planflow/API.md`
- **Schéma PlanFlow** : Utilisez l'outil `plans-format`
- **Exemples de plans** : `/packages/mcp-planflow/examples/`
- **Interface de review** : `http://localhost:4173/plans/{planId}/review`

---

**Version** : PlanFlow v1.1.0  
**Dernière mise à jour** : 5 janvier 2026
