#!/usr/bin/env tsx
/**
 * Script pour générer et afficher le schéma JSON de UpdateStepInPlanMcpInput
 * Utile pour voir tous les champs disponibles pour l'update de step
 */

import { generateMcpSchema } from '../src/infrastructure/mcp/schema-generator';
import { UpdateStepInPlanMcpInput } from '../src/infrastructure/mcp/types/UpdateStepInPlanMcpInput';

console.log('🔍 Génération du schéma pour UpdateStepInPlanMcpInput\n');

const schema = generateMcpSchema(UpdateStepInPlanMcpInput);

console.log('📋 Schéma JSON complet:');
console.log(JSON.stringify(schema, null, 2));

console.log('\n\n📝 Exemple d\'utilisation pour update step:\n');

const examplePayload = {
  planId: "XOtsELcuuVHicXD4dDnHY",
  stepId: "step-2",
  updates: {
    title: "Nouveau titre (optionnel)",
    description: "Nouvelle description (optionnel)",
    kind: "edit_file", // Valeurs possibles dans le schéma
    status: "in_progress", // Valeurs possibles dans le schéma
    dependsOn: ["step-1"], // Array de step IDs (optionnel)
    estimatedDuration: {
      value: 2,
      unit: "hours"
    },
    actions: [
      {
        type: "edit_file",
        filePath: "src/services/authService.js",
        description: "Modifier le service"
      }
    ],
    validation: {
      criteria: ["Critère 1", "Critère 2"],
      automatedTests: ["npm test"]
    },
    diagram: "flowchart TD\n  A[Start] --> B[End]"
  }
};

console.log(JSON.stringify(examplePayload, null, 2));

console.log('\n\n🔍 Structure du champ "updates" (PartialStepUpdateDTO):');
if (schema.properties && schema.properties.updates) {
  console.log(JSON.stringify(schema.properties.updates, null, 2));
}

console.log('\n✨ Tous les champs dans updates sont optionnels - seuls les champs fournis seront mis à jour.');
