# API REST - MCP PlanFlow

## 🚀 Endpoints Disponibles

### Base URL
```
http://localhost:3000/api/plans
```

### Endpoints

#### 1. **GET /api/plans/format**
Récupère la spécification du format JSON Schema.

**Response:**
```json
{
  "schema": { /* JSON Schema */ },
  "version": "1.0.0",
  "exampleFiles": [...],
  "constraints": { ... }
}
```

---

#### 2. **POST /api/plans/validate**
Valide un plan contre le schéma et les règles métier.

**Request Body:**
```json
{
  "schemaVersion": "1.0.0",
  "planType": "feature",
  "metadata": { ... },
  "plan": { ... },
  "steps": [ ... ]
}
```

**Response:**
```json
{
  "isValid": true,
  "errors": [],
  "warnings": []
}
```

---

#### 3. **GET /api/plans**
Liste tous les plans avec filtres optionnels.

**Query Parameters:**
- `planType` (optional): `feature`, `bugfix`, `refactor`, etc.
- `status` (optional): `pending`, `in_progress`, `completed`, etc.
- `limit` (optional): Nombre max de résultats
- `offset` (optional): Pagination offset

**Example:**
```
GET /api/plans?planType=feature&limit=10
```

**Response:**
```json
{
  "plans": [
    {
      "planId": "abc123",
      "schemaVersion": "1.0.0",
      "planType": "feature",
      "metadata": { ... },
      "plan": { ... },
      "steps": [ ... ],
      "createdAt": "2024-01-15T10:00:00Z",
      "updatedAt": "2024-01-15T10:00:00Z",
      "revision": 1
    }
  ],
  "total": 1,
  "limit": 10,
  "offset": 0
}
```

---

#### 4. **GET /api/plans/:id**
Récupère un plan spécifique par son ID.

**Example:**
```
GET /api/plans/abc123
```

**Response:**
```json
{
  "planId": "abc123",
  "schemaVersion": "1.0.0",
  "planType": "feature",
  "metadata": {
    "title": "Implement Authentication",
    "description": "...",
    "author": "dev-team",
    "createdAt": "2024-01-15T10:00:00Z",
    "updatedAt": "2024-01-15T10:00:00Z",
    "tags": ["auth", "security"],
    "revision": 1
  },
  "plan": {
    "objective": "...",
    "scope": "...",
    "constraints": [...],
    "assumptions": [...],
    "successCriteria": [...]
  },
  "steps": [
    {
      "id": "step-1",
      "title": "Create User Schema",
      "description": "...",
      "kind": "implementation",
      "status": "pending",
      "dependsOn": [],
      "estimatedDuration": "2h",
      "actions": [...],
      "validation": { ... }
    }
  ],
  "createdAt": "2024-01-15T10:00:00Z",
  "updatedAt": "2024-01-15T10:00:00Z",
  "revision": 1
}
```

**Error Response (404):**
```json
{
  "error": "Not Found",
  "message": "Plan with ID abc123 not found"
}
```

---

#### 5. **POST /api/plans**
Crée un nouveau plan.

**Request Body:**
```json
{
  "schemaVersion": "1.0.0",
  "planType": "feature",
  "metadata": {
    "title": "New Feature",
    "description": "Description",
    "author": "dev-team",
    "tags": ["feature"]
  },
  "plan": {
    "objective": "Implement feature X",
    "scope": "Backend API",
    "constraints": ["Use TypeScript"],
    "assumptions": ["Database exists"],
    "successCriteria": ["All tests pass"]
  },
  "steps": [
    {
      "id": "step-1",
      "title": "Step 1",
      "description": "...",
      "kind": "implementation",
      "status": "pending",
      "dependsOn": [],
      "actions": []
    }
  ]
}
```

**Response (201 Created):**
```json
{
  "planId": "generated-id",
  "plan": { /* Le plan complet avec ID généré */ }
}
```

**Error Response (400):**
```json
{
  "error": "Validation Error",
  "message": "Plan validation failed: ..."
}
```

---

#### 6. **PUT /api/plans/:id**
Met à jour un plan existant.

**Request Body:**
```json
{
  "metadata": {
    "title": "Updated Title"
  },
  "steps": [
    /* Nouvelle liste de steps */
  ]
}
```

**Response (200):**
```json
{
  "planId": "abc123",
  "schemaVersion": "1.0.0",
  /* Plan mis à jour avec revision incrémentée */
}
```

**Error Responses:**
- `404` - Plan not found
- `400` - Validation error

---

#### 7. **DELETE /api/plans/:id**
Supprime un plan.

**Response (204 No Content):**
```
(empty body)
```

**Error Response (404):**
```json
{
  "error": "Not Found",
  "message": "Plan with ID abc123 not found"
}
```

---

## 🔧 Configuration

### Variables d'environnement (.env)

```env
# HTTP API
HTTP_ENABLED=true
HTTP_PORT=3000
HTTP_HOST=0.0.0.0
CORS_ORIGIN=http://localhost:5173

# MCP (désactiver pour mode API only)
MCP_ENABLED=false

# MongoDB
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=planflow
```

---

## 🚀 Démarrage

### Mode API HTTP uniquement
```bash
# .env
HTTP_ENABLED=true
MCP_ENABLED=false

# Start
pnpm start
```

### Mode MCP uniquement
```bash
# .env
HTTP_ENABLED=false
MCP_ENABLED=true

# Start
pnpm start
```

### Mode Hybride (HTTP + MCP)
```bash
# .env
HTTP_ENABLED=true
MCP_ENABLED=true

# Start
pnpm start
```

---

## 🧪 Tests avec curl

### Créer un plan
```bash
curl -X POST http://localhost:3000/api/plans \
  -H "Content-Type: application/json" \
  -d @examples/feature-authentication.json
```

### Lister les plans
```bash
curl http://localhost:3000/api/plans
```

### Récupérer un plan
```bash
curl http://localhost:3000/api/plans/PLAN_ID
```

### Mettre à jour un plan
```bash
curl -X PUT http://localhost:3000/api/plans/PLAN_ID \
  -H "Content-Type: application/json" \
  -d '{"metadata": {"title": "Updated Title"}}'
```

### Supprimer un plan
```bash
curl -X DELETE http://localhost:3000/api/plans/PLAN_ID
```

---

## 📝 Notes

- **Aucune altération des données**: L'API utilise exactement les mêmes DTOs que le serveur MCP
- **CORS**: Configuré pour accepter `http://localhost:5173` (Vite dev server)
- **Validation**: Tous les plans sont validés avant création/mise à jour
- **Erreurs**: Codes HTTP standards (200, 201, 400, 404, 500)
- **Format**: Toujours JSON avec `Content-Type: application/json`
