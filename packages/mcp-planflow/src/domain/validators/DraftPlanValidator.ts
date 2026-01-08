import { Plan } from '../entities/Plan';

export interface DraftPlanValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validateur spécifique pour les plans en mode draft.
 * Applique une validation allégée car les plans draft sont incomplets par nature.
 */
export class DraftPlanValidator {
  /**
   * Valide un plan draft.
   * Requis:
   * - metadata.title (non vide)
   * - metadata.description (non vide)
   * - plan.objective (non vide)
   * 
   * Optionnel:
   * - plan.scope
   * - steps (peut être vide en draft)
   */
  static validate(plan: Plan): DraftPlanValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Vérifier que c'est bien un plan draft
    if (!plan.isDraft()) {
      errors.push('Plan is not in draft status');
      return { isValid: false, errors, warnings };
    }

    // Validation des métadonnées requises
    if (!plan.metadata.title || plan.metadata.title.trim() === '') {
      errors.push('metadata.title is required');
    }

    if (!plan.metadata.description || plan.metadata.description.trim() === '') {
      errors.push('metadata.description is required');
    }

    // Validation de l'objectif
    if (!plan.plan.objective || plan.plan.objective.trim() === '') {
      errors.push('plan.objective is required');
    }

    // Warnings pour les champs optionnels manquants
    if (!plan.plan.scope || plan.plan.scope.trim() === '') {
      warnings.push('plan.scope is recommended but not required for draft');
    }

    if (plan.steps.length === 0) {
      warnings.push('Draft plan has no steps');
    }

    // Vérifier l'unicité des stepIds si des steps existent
    if (plan.steps.length > 0) {
      const stepIds = new Set<string>();
      for (const step of plan.steps) {
        const id = step.id.getValue();
        if (stepIds.has(id)) {
          errors.push(`Duplicate step ID: ${id}`);
        }
        stepIds.add(id);
      }

      // Vérifier les dépendances
      for (const step of plan.steps) {
        for (const depId of step.dependsOn) {
          if (!plan.steps.some((s) => s.id.equals(depId))) {
            errors.push(
              `Step ${step.id.getValue()} depends on non-existent step ${depId.getValue()}`
            );
          }
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Vérifie si un plan peut être finalisé (passage de draft à active).
   */
  static canFinalize(plan: Plan): DraftPlanValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!plan.isDraft()) {
      errors.push('Plan is not in draft status');
    }

    if (plan.steps.length === 0) {
      errors.push('Plan must have at least one step to be finalized');
    }

    // Utiliser la validation complète du plan
    const validation = plan.validate();
    errors.push(...validation.errors);
    warnings.push(...validation.warnings);

    // Vérifier les cycles de dépendances
    if (plan.hasCyclicDependencies()) {
      errors.push('Plan has cyclic dependencies');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }
}
