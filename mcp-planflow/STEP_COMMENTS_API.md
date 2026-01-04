# Step Comments API - MCP Tools

## Endpoints disponibles

### 1. `add-step-comment`
Ajoute un commentaire à une étape spécifique d'un plan.

**Paramètres:**
- `planId` (string, required): ID du plan
- `stepId` (string, required): ID de l'étape
- `content` (string, required): Contenu du commentaire
- `author` (string, optional): Auteur du commentaire

**Exemple d'utilisation:**
```json
{
  "name": "add-step-comment",
  "arguments": {
    "planId": "plan-123",
    "stepId": "step-456",
    "content": "N'oublie pas de gérer les cas d'erreur dans cette fonction",
    "author": "Alice"
  }
}
```

**Réponse:**
```json
{
  "success": true,
  "comment": {
    "id": "comment-789",
    "stepId": "step-456",
    "content": "N'oublie pas de gérer les cas d'erreur dans cette fonction",
    "author": "Alice",
    "createdAt": "2026-01-04T10:30:00.000Z"
  },
  "message": "Comment added successfully"
}
```

---

### 2. `update-step-comment`
Met à jour le contenu d'un commentaire existant.

**Paramètres:**
- `planId` (string, required): ID du plan
- `stepId` (string, required): ID de l'étape
- `commentId` (string, required): ID du commentaire à modifier
- `content` (string, required): Nouveau contenu

**Exemple d'utilisation:**
```json
{
  "name": "update-step-comment",
  "arguments": {
    "planId": "plan-123",
    "stepId": "step-456",
    "commentId": "comment-789",
    "content": "Cas d'erreur ajoutés, merci!"
  }
}
```

**Réponse:**
```json
{
  "success": true,
  "message": "Comment updated successfully"
}
```

---

### 3. `delete-step-comment`
Supprime un commentaire d'une étape.

**Paramètres:**
- `planId` (string, required): ID du plan
- `stepId` (string, required): ID de l'étape
- `commentId` (string, required): ID du commentaire à supprimer

**Exemple d'utilisation:**
```json
{
  "name": "delete-step-comment",
  "arguments": {
    "planId": "plan-123",
    "stepId": "step-456",
    "commentId": "comment-789"
  }
}
```

**Réponse:**
```json
{
  "success": true,
  "message": "Comment deleted successfully"
}
```

---

## Structure des données

### StepCommentDTO
```typescript
{
  id: string;          // UUID unique du commentaire
  stepId: string;      // ID de l'étape parent
  content: string;     // Contenu du commentaire
  author?: string;     // Auteur (optionnel)
  createdAt: string;   // ISO 8601 timestamp
  updatedAt?: string;  // ISO 8601 timestamp (après modification)
}
```

### Dans PlanDTO
Les commentaires sont maintenant inclus dans chaque step:

```typescript
{
  "planId": "plan-123",
  "steps": [
    {
      "id": "step-456",
      "title": "Create LoginForm component",
      "description": "...",
      "comments": [
        {
          "id": "comment-789",
          "stepId": "step-456",
          "content": "N'oublie pas de gérer les cas d'erreur",
          "author": "Alice",
          "createdAt": "2026-01-04T10:30:00.000Z"
        }
      ]
    }
  ]
}
```

---

## Cas d'usage

### Workflow de review
1. L'utilisateur parcourt les steps d'un plan
2. Il ajoute des commentaires sur les étapes qui nécessitent des clarifications
3. Les commentaires sont sauvegardés et visibles dans le viewer
4. Il peut modifier ou supprimer ses commentaires
5. Les commentaires persistent dans la base de données MongoDB

### Intégration avec le viewer
Le viewer React peut maintenant:
- Afficher tous les commentaires d'une étape
- Ajouter de nouveaux commentaires via l'interface
- Modifier/supprimer des commentaires existants
- Filtrer les étapes par présence de commentaires
