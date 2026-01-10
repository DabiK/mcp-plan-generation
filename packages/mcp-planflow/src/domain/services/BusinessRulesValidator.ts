import { injectable } from 'tsyringe';
import { Plan } from '../entities/Plan';
import { Step } from '../entities/Step';
import { StepId } from '../value-objects/StepId';
import { PlanStatus } from '../value-objects/PlanStatus';
import { ValidationError } from '../errors/ValidationError';

/**
 * Domain Service - Validation des règles métier
 * Pure logique Domain - ne connaît PAS les DTOs ni l'Infrastructure
 */
@injectable()
export class BusinessRulesValidator {
  /**
   * Valide les métadonnées du plan
   */
  validateMetadata(metadata: { title: string; description: string; author?: string }): void {
    const errors: string[] = [];

    if (!metadata.title || metadata.title.trim().length === 0) {
      errors.push('Title is required');
    }

    if (!metadata.description || metadata.description.trim().length === 0) {
      errors.push('Description is required');
    }

    if (metadata.author && metadata.author.trim().length === 0) {
      errors.push('Author cannot be empty if provided');
    }

    if (errors.length > 0) {
      throw new ValidationError('Invalid plan metadata', errors);
    }
  }

  /**
   * Valide qu'un stepId n'existe pas déjà dans le plan
   */
  validateStepUniqueness(plan: Plan, stepId: StepId): void {
    const existingStep = plan.getStep(stepId);
    if (existingStep) {
      throw new ValidationError(
        'Step ID must be unique',
        [`Step with ID ${stepId.getValue()} already exists`]
      );
    }
  }

  /**
   * Valide que toutes les dépendances existent dans le plan
   */
  validateDependencies(plan: Plan, dependsOn: StepId[]): void {
    const errors: string[] = [];
    
    for (const depId of dependsOn) {
      const dependencyExists = plan.steps.some(s => s.id.equals(depId));
      if (!dependencyExists) {
        errors.push(`Dependency ${depId.getValue()} does not exist`);
      }
    }

    if (errors.length > 0) {
      throw new ValidationError('Invalid dependencies', errors);
    }
  }

  /**
   * Valide l'absence de cycles dans les dépendances
   */
  validateNoCycles(plan: Plan, newStep: Step): void {
    // Créer un plan temporaire avec le nouveau step
    const tempPlan = { ...plan, steps: [...plan.steps, newStep] };
    
    const hasCycle = this.detectCycles(tempPlan.steps);
    if (hasCycle) {
      throw new ValidationError(
        'Cyclic dependency detected',
        ['Adding this step would create a dependency cycle']
      );
    }
  }

  /**
   * Valide qu'un plan peut être finalisé
   */
  validateCanFinalize(plan: Plan): void {
    const errors: string[] = [];

    if (plan.status !== PlanStatus.DRAFT) {
      errors.push('Only draft plans can be finalized');
    }

    if (plan.steps.length === 0) {
      errors.push('Cannot finalize a plan without steps');
    }

    if (errors.length > 0) {
      throw new ValidationError('Cannot finalize plan', errors);
    }
  }

  /**
   * Détecte les cycles dans le graphe de dépendances
   */
  private detectCycles(steps: Step[]): boolean {
    const graph = this.buildDependencyGraph(steps);
    const visited = new Set<string>();
    const recStack = new Set<string>();

    for (const step of steps) {
      if (this.hasCycle(step.id, graph, visited, recStack)) {
        return true;
      }
    }
    return false;
  }

  private buildDependencyGraph(steps: Step[]): Map<string, string[]> {
    const graph = new Map<string, string[]>();
    for (const step of steps) {
      graph.set(
        step.id.getValue(),
        step.dependsOn.map(id => id.getValue())
      );
    }
    return graph;
  }

  private hasCycle(
    stepId: StepId,
    graph: Map<string, string[]>,
    visited: Set<string>,
    recStack: Set<string>
  ): boolean {
    const id = stepId.getValue();
    if (recStack.has(id)) return true;
    if (visited.has(id)) return false;

    visited.add(id);
    recStack.add(id);

    const dependencies = graph.get(id) || [];
    for (const depId of dependencies) {
      if (this.hasCycle(new StepId(depId), graph, visited, recStack)) {
        return true;
      }
    }

    recStack.delete(id);
    return false;
  }
}
