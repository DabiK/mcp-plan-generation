import { injectable } from 'tsyringe';
import { Plan } from '../entities/Plan';
import { Step } from '../entities/Step';
import { DependencyGraphService } from './DependencyGraphService';
import { ValidationError } from '../errors/ValidationError';

@injectable()
export class PlanService {
  constructor(private dependencyGraphService: DependencyGraphService) {}

  /**
   * Valide un plan selon les règles métier
   */
  validatePlan(plan: Plan): void {
    const errors: string[] = [];

    // Vérifier les IDs uniques
    const stepIds = new Set<string>();
    for (const step of plan.steps) {
      const id = step.id.getValue();
      if (stepIds.has(id)) {
        errors.push(`Duplicate step ID: ${id}`);
      }
      stepIds.add(id);
    }

    // Vérifier les références de dépendances
    const refErrors = this.dependencyGraphService.validateDependencyReferences(plan.steps);
    errors.push(...refErrors);

    // Vérifier les cycles
    if (this.dependencyGraphService.detectCycles(plan.steps)) {
      errors.push('Cyclic dependency detected in plan steps');
    }

    // Vérifier les champs obligatoires
    if (!plan.metadata.title || plan.metadata.title.trim() === '') {
      errors.push('Plan title is required');
    }

    if (!plan.plan.objective || plan.plan.objective.trim() === '') {
      errors.push('Plan objective is required');
    }

    if (errors.length > 0) {
      throw new ValidationError('Plan validation failed', errors);
    }
  }

  /**
   * Calcule les métriques du plan
   */
  calculateMetrics(plan: Plan): {
    totalSteps: number;
    completedSteps: number;
    pendingSteps: number;
    failedSteps: number;
    estimatedDuration?: number;
  } {
    const totalSteps = plan.steps.length;
    const completedSteps = plan.steps.filter((s) => s.status === 'completed').length;
    const pendingSteps = plan.steps.filter((s) => s.status === 'pending').length;
    const failedSteps = plan.steps.filter((s) => s.status === 'failed').length;

    // Calculer la durée estimée totale (en heures)
    let estimatedDuration: number | undefined;
    const stepsWithDuration = plan.steps.filter((s) => s.estimatedDuration);
    
    if (stepsWithDuration.length > 0) {
      estimatedDuration = stepsWithDuration.reduce((acc, step) => {
        if (!step.estimatedDuration) return acc;
        
        const { value, unit } = step.estimatedDuration;
        let hours = value;
        
        if (unit === 'minutes') {
          hours = value / 60;
        } else if (unit === 'days') {
          hours = value * 8; // 8 heures par jour
        }
        
        return acc + hours;
      }, 0);
    }

    return {
      totalSteps,
      completedSteps,
      pendingSteps,
      failedSteps,
      estimatedDuration,
    };
  }

  /**
   * Obtient les prochains steps exécutables
   */
  getExecutableSteps(plan: Plan): Step[] {
    const completedStepIds = new Set(
      plan.steps.filter((s) => s.status === 'completed').map((s) => s.id.getValue())
    );

    return plan.steps.filter((step) => {
      // Step déjà complété ou en cours
      if (step.status === 'completed' || step.status === 'in_progress') {
        return false;
      }

      // Toutes les dépendances sont complétées
      return step.canExecute(completedStepIds);
    });
  }
}
