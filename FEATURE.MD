# PlanFlow MCP — Spécification (destinée à Copilot)

## 1) But du projet

Créer un **serveur MCP minimal** qui permet à Copilot/LLM de travailler avec des **plans d’implémentation structurés (JSON)** au lieu de simples fichiers `.md`, afin de les **visualiser dans un navigateur** via un moteur de workflow.

Le plan est :
- **généré par le LLM** (souvent d’abord en `.md`), puis
- **converti en JSON** conforme à un **schéma contrôlé** récupéré depuis le MCP,
- **validé**, puis
- **persisté** (création d’un `planId`),
- récupérable ensuite par `planId` pour exécution/implémentation.

> Le MCP ne “fait pas” l’implémentation. Il sert de **contrat**, **validateur**, et **registry** des plans.

---

## 2) Workflow attendu (Copilot/LLM)

### A) Génération du plan initial
1. Le LLM génère un plan d’implémentation (souvent en Markdown).

### B) Conversion contrôlée vers JSON
2. Le LLM appelle `get_plan_format` pour récupérer le JSON Schema accepté.
3. Le LLM convertit le `.md` en JSON conforme au schéma.
4. Le LLM appelle `validate_plan` avec le JSON produit.
5. Tant que `isValid=false`, le LLM corrige le JSON et revalide.
6. Si `isValid=true`, le LLM appelle `create_plan` pour persister et obtenir `planId`.

### C) Visualisation & édition UI
7. Le site récupère le plan via `get_plan(planId)` et permet des modifications.
8. (La sauvegarde côté UI peut être gérée par un backend du site ; pas besoin d’un tool MCP de patch dans cette V1.)

### D) Implémentation à partir d’un plan
9. Quand on demande “implémente le plan ID=XXX”, le LLM :
   - appelle `get_plan(XXX)`,
   - suit les steps du plan (ordre via `dependsOn`) pour implémenter.

---

## 3) API MCP (tools) — V1 minimal

### 3.1 get_plan_format
Renvoie le schéma accepté + règles.

**Input**
- `schemaVersion?` (string)

**Output**
- `schemaVersion` (string)
- `jsonSchema` (object) — JSON Schema complet
- `constraints` (object) — règles métier (ex: pas de cycles)
- `examples` (array) — exemples valides

---

### 3.2 validate_plan
Valide un plan JSON sans le créer.

**Input**
- `schemaVersion` (string)
- `plan` (object)

**Output**
- `isValid` (boolean)
- `errors[]` : `{ path, code, message, hint? }`
- `warnings[]` : `{ path, code, message, hint? }`
- `normalizedPlan?` (object) — optionnel

**Règles minimales**
- `steps[].id` unique
- `dependsOn` référence des steps existants
- pas de cycles
- payload des `actions` conforme (types + champs)

---

### 3.3 create_plan
Persiste un plan et renvoie un identifiant.

**Input**
- `schemaVersion` (string)
- `plan` (object)
- `source?` (object) — ex: `{ mdHash, origin }`

**Output**
- `planId` (string)
- `revision` (integer)
- `validation` (mêmes champs que validate_plan, recheck côté serveur)
- `meta` (object)

---

### 3.4 get_plan
Récupère un plan persisté.

**Input**
- `planId` (string)

**Output**
- `schemaVersion` (string)
- `plan` (object)
- `meta` (object)
- `revision` (integer)

---

## 4) Modèle de plan JSON (concept)

Le plan est un **DAG de steps** :
- `steps[]` : liste de nœuds
- `dependsOn[]` : dépendances entre steps (le viewer construit le graphe)
- chaque step contient des **actions typées** (pas du texte libre) pour rester exploitable et visualisable.

Le viewer doit pouvoir :
- afficher les steps (cards),
- afficher les dépendances (edges),
- grouper par `kind` ou `ui.group`,
- filtrer par `ui.status`,
- montrer les `targets` (fichiers/symboles),
- montrer les `verification` (tests/commands).

---

## 5) JSON Schema — PlanFlow v1 (Draft 2020-12)

> Remarque : Ce schema est “strict”, mais extensible via `metadata` et `ui`.

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://example.local/schemas/planflow/1.0.0.json",
  "title": "PlanFlow Implementation Plan",
  "type": "object",
  "additionalProperties": false,
  "required": ["schemaVersion", "title", "goal", "planType", "context", "constraints", "steps"],
  "properties": {
    "schemaVersion": { "type": "string", "pattern": "^1\\.0\\.0$" },
    "planId": { "type": ["string", "null"], "minLength": 1 },

    "title": { "type": "string", "minLength": 3, "maxLength": 140 },
    "goal": { "type": "string", "minLength": 3, "maxLength": 4000 },

    "planType": {
      "type": "string",
      "enum": ["feature", "refactor", "bugfix", "migration", "security", "performance", "chore"]
    },

    "context": {
      "type": "object",
      "additionalProperties": false,
      "required": ["repo", "ref", "stack"],
      "properties": {
        "repo": { "type": "string", "minLength": 1 },
        "ref": { "type": "string", "minLength": 1 },
        "stack": { "type": "array", "items": { "type": "string" }, "minItems": 1 },
        "assumptions": { "type": "array", "items": { "type": "string" } }
      }
    },

    "constraints": {
      "type": "object",
      "additionalProperties": false,
      "required": ["nonGoals", "compat", "qualityGates"],
      "properties": {
        "nonGoals": { "type": "array", "items": { "type": "string" } },
        "compat": { "type": "array", "items": { "type": "string" } },
        "qualityGates": {
          "type": "array",
          "items": {
            "type": "string",
            "enum": ["tests_green", "lint_green", "build_green", "typecheck_green", "security_scan_green"]
          }
        }
      }
    },

    "acceptanceCriteria": { "type": "array", "items": { "type": "string" } },

    "risks": {
      "type": "array",
      "items": {
        "type": "object",
        "additionalProperties": false,
        "required": ["id", "level", "title", "mitigation"],
        "properties": {
          "id": { "type": "string", "pattern": "^R[0-9]+$" },
          "level": { "type": "string", "enum": ["low", "medium", "high"] },
          "title": { "type": "string", "minLength": 3 },
          "mitigation": { "type": "string", "minLength": 3 }
        }
      }
    },

    "steps": {
      "type": "array",
      "minItems": 1,
      "items": { "$ref": "#/$defs/step" }
    },

    "metadata": { "type": "object", "additionalProperties": true }
  },

  "$defs": {
    "step": {
      "type": "object",
      "additionalProperties": false,
      "required": ["id", "kind", "title", "intent", "dependsOn", "actions", "verification", "ui"],
      "properties": {
        "id": { "type": "string", "pattern": "^S[0-9]+$" },

        "kind": {
          "type": "string",
          "enum": ["discovery", "design", "implementation", "refactor", "testing", "migration", "rollout", "docs", "verification"]
        },

        "title": { "type": "string", "minLength": 3, "maxLength": 140 },
        "intent": { "type": "string", "minLength": 3, "maxLength": 4000 },

        "dependsOn": {
          "type": "array",
          "items": { "type": "string", "pattern": "^S[0-9]+$" },
          "uniqueItems": true
        },

        "targets": {
          "type": "array",
          "items": { "$ref": "#/$defs/target" }
        },

        "actions": {
          "type": "array",
          "minItems": 1,
          "items": { "$ref": "#/$defs/action" }
        },

        "verification": {
          "type": "array",
          "items": { "$ref": "#/$defs/verification" }
        },

        "outputs": {
          "type": "array",
          "items": { "$ref": "#/$defs/output" }
        },

        "rollback": {
          "type": "array",
          "items": { "$ref": "#/$defs/rollback" }
        },

        "notes": { "type": "string" },

        "ui": {
          "type": "object",
          "additionalProperties": false,
          "required": ["status", "group"],
          "properties": {
            "status": { "type": "string", "enum": ["todo", "doing", "blocked", "done"] },
            "group": { "type": "string", "minLength": 1 },
            "lane": { "type": "string" },
            "orderHint": { "type": "number" }
          }
        }
      }
    },

    "target": {
      "type": "object",
      "additionalProperties": false,
      "required": ["type", "value"],
      "properties": {
        "type": { "type": "string", "enum": ["path", "path_glob", "symbol", "url"] },
        "value": { "type": "string", "minLength": 1 },
        "lines": {
          "type": "array",
          "items": { "type": "integer", "minimum": 1 },
          "minItems": 2,
          "maxItems": 2
        }
      }
    },

    "verification": {
      "type": "object",
      "additionalProperties": false,
      "required": ["type"],
      "properties": {
        "type": { "type": "string", "enum": ["run_command", "add_test"] },

        "command": { "type": "string" },
        "expect": { "type": "string", "enum": ["success", "failure"] },

        "path": { "type": "string" },
        "kind": { "type": "string", "enum": ["unit", "integration", "e2e", "snapshot"] }
      },
      "allOf": [
        {
          "if": { "properties": { "type": { "const": "run_command" } } },
          "then": { "required": ["command", "expect"] }
        },
        {
          "if": { "properties": { "type": { "const": "add_test" } } },
          "then": { "required": ["path", "kind"] }
        }
      ]
    },

    "output": {
      "type": "object",
      "additionalProperties": false,
      "required": ["type", "value"],
      "properties": {
        "type": { "type": "string", "enum": ["note", "artifact"] },
        "value": { "type": "string" },
        "kind": { "type": "string" },
        "ref": { "type": "string" }
      }
    },

    "rollback": {
      "type": "object",
      "additionalProperties": false,
      "required": ["type"],
      "properties": {
        "type": { "type": "string", "enum": ["revert_commit_strategy", "feature_flag_disable"] },
        "note": { "type": "string" }
      }
    },

    "action": {
      "type": "object",
      "additionalProperties": false,
      "required": ["type"],
      "properties": {
        "type": {
          "type": "string",
          "enum": [
            "search",
            "list_files",
            "create_file",
            "edit_file",
            "delete_file",
            "move_file",
            "rename_symbol",
            "move_symbol",
            "extract_component",
            "update_dependencies",
            "add_doc",
            "add_feature_flag"
          ]
        },

        "query": { "type": "string" },
        "glob": { "type": "string" },
        "limit": { "type": "integer", "minimum": 1, "maximum": 200 },

        "path": { "type": "string" },
        "template": { "type": "string" },
        "content": { "type": "string" },
        "instruction": { "type": "string" },

        "fromPath": { "type": "string" },
        "toPath": { "type": "string" },

        "from": { "type": "string" },
        "to": { "type": "string" },

        "symbol": { "type": "string" },

        "package": { "type": "string" },
        "version": { "type": "string" },
        "depAction": { "type": "string", "enum": ["add", "remove", "bump"] },

        "flag": { "type": "string" },
        "default": { "type": "boolean" }
      },

      "allOf": [
        {
          "if": { "properties": { "type": { "const": "search" } } },
          "then": { "required": ["query"] }
        },
        {
          "if": { "properties": { "type": { "const": "list_files" } } },
          "then": { "required": ["glob"] }
        },
        {
          "if": { "properties": { "type": { "const": "create_file" } } },
          "then": { "required": ["path"] }
        },
        {
          "if": { "properties": { "type": { "const": "edit_file" } } },
          "then": { "required": ["path", "instruction"] }
        },
        {
          "if": { "properties": { "type": { "const": "delete_file" } } },
          "then": { "required": ["path"] }
        },
        {
          "if": { "properties": { "type": { "const": "move_file" } } },
          "then": { "required": ["fromPath", "toPath"] }
        },
        {
          "if": { "properties": { "type": { "const": "rename_symbol" } } },
          "then": { "required": ["path", "from", "to"] }
        },
        {
          "if": { "properties": { "type": { "const": "move_symbol" } } },
          "then": { "required": ["fromPath", "toPath", "symbol"] }
        },
        {
          "if": { "properties": { "type": { "const": "extract_component" } } },
          "then": { "required": ["fromPath", "toPath", "symbol"] }
        },
        {
          "if": { "properties": { "type": { "const": "update_dependencies" } } },
          "then": { "required": ["depAction", "package"] }
        },
        {
          "if": { "properties": { "type": { "const": "add_doc" } } },
          "then": { "required": ["path"] }
        },
        {
          "if": { "properties": { "type": { "const": "add_feature_flag" } } },
          "then": { "required": ["flag", "default"] }
        }
      ]
    }
  }
}


# PlanFlow — Stack & Contraintes techniques (addendum pour Copilot)

Ce document complète **PlanFlow MCP — Spécification v1.0.1** en décrivant la stack recommandée (front + back) et les contraintes techniques à respecter pour une implémentation fiable.

---

## 1) Objectif d’architecture

Mettre en place :
1. Un **serveur MCP** (utilisé par Copilot/VS Code) pour **schéma / validation / création / lecture** de plans.
2. Un **viewer web** pour **visualiser et éditer** les plans en workflow (nodes/edges).
3. Un **API HTTP** (utilisée par le viewer) pour CRUD des plans et intégration UI.

> Le viewer **n’a pas besoin** de parler MCP. Le MCP sert surtout à l’écosystème Copilot.

---

## 2) Stack recommandée (V1)

### 2.1 Backend — MCP Server
- **Langage** : TypeScript (Node.js LTS)
- **SDK MCP** : `@modelcontextprotocol/sdk`
- **Transport** : `stdio` (V1, intégration VS Code la plus simple)
- **Validation JSON Schema** : `ajv`
- **Stockage** : fichiers JSON sur disque (V1)
  - `./data/plans/{planId}.json`
  - `./data/index.json` (liste + metadata)
- **Génération planId** : `nanoid` (ou UUIDv4)

**Tools MCP à implémenter**
- `get_plan_format`
- `validate_plan`
- `create_plan`
- `get_plan`

---

### 2.2 Backend — API HTTP (Viewer)
- **Runtime** : Node.js
- **Framework** : Fastify (ou Express)
- **Contrats** : JSON Schema/Types partagés depuis `planflow-core`
- **Endpoints minimaux**
  - `GET /plans` (liste, filtres simples)
  - `GET /plans/:id`
  - `PUT /plans/:id` (save depuis UI) + revalidation
  - `POST /plans` (si UI peut créer)
  - `GET /schema` (optionnel : exposer même schéma pour le viewer)

> L’API HTTP utilise les mêmes fonctions de validation/stockage que le MCP (même code).

---

### 2.3 Frontend — Viewer Web
- **Framework** : Next.js (React + TypeScript)
- **UI Graph** : React Flow (nodes/edges, pan/zoom/drag)
- **Auto-layout** : dagre (optionnel)
- **État** : Zustand (léger) ou React Query (si besoin de cache)
- **Form editing** : React Hook Form + Zod (optionnel ; validation UI)
- **Rendu layout**
  - utilise `plan.layout.nodes[]` comme source de vérité si présent
  - sinon calcule un layout auto (topologique + group lanes)

---

## 3) Monorepo recommandé (partage du schéma & validation)

Utiliser pnpm workspaces (ou Turborepo) :