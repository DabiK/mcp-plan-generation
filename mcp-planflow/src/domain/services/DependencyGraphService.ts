import { injectable } from 'tsyringe';
import { Step } from '../entities/Step';
import { CyclicDependencyError } from '../errors/CyclicDependencyError';

@injectable()
export class DependencyGraphService {
  /**
   * Détecte les cycles dans le graphe de dépendances
   */
  detectCycles(steps: Step[]): boolean {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const hasCycle = (stepId: string): boolean => {
      visited.add(stepId);
      recursionStack.add(stepId);

      const step = steps.find((s) => s.id.getValue() === stepId);
      if (!step) return false;

      for (const dep of step.dependsOn) {
        const depId = dep.getValue();
        if (!visited.has(depId)) {
          if (hasCycle(depId)) return true;
        } else if (recursionStack.has(depId)) {
          return true;
        }
      }

      recursionStack.delete(stepId);
      return false;
    };

    for (const step of steps) {
      const stepId = step.id.getValue();
      if (!visited.has(stepId)) {
        if (hasCycle(stepId)) return true;
      }
    }

    return false;
  }

  /**
   * Calcule l'ordre topologique (ordre d'exécution) des steps
   */
  getTopologicalOrder(steps: Step[]): Step[] {
    const result: Step[] = [];
    const visited = new Set<string>();
    const temp = new Set<string>();

    const visit = (stepId: string): void => {
      if (temp.has(stepId)) {
        throw new CyclicDependencyError();
      }
      if (visited.has(stepId)) return;

      temp.add(stepId);

      const step = steps.find((s) => s.id.getValue() === stepId);
      if (step) {
        for (const dep of step.dependsOn) {
          visit(dep.getValue());
        }
        result.push(step);
      }

      temp.delete(stepId);
      visited.add(stepId);
    };

    for (const step of steps) {
      if (!visited.has(step.id.getValue())) {
        visit(step.id.getValue());
      }
    }

    return result;
  }

  /**
   * Valide que toutes les références de dépendances existent
   */
  validateDependencyReferences(steps: Step[]): string[] {
    const errors: string[] = [];
    const stepIds = new Set(steps.map((s) => s.id.getValue()));

    for (const step of steps) {
      for (const depId of step.dependsOn) {
        if (!stepIds.has(depId.getValue())) {
          errors.push(
            `Step "${step.id.getValue()}" depends on non-existent step "${depId.getValue()}"`
          );
        }
      }
    }

    return errors;
  }

  /**
   * Identifie les steps bloqués (dont les dépendances ne sont pas complétées)
   */
  getBlockedSteps(steps: Step[]): Step[] {
    const completedStepIds = new Set(
      steps.filter((s) => s.status === 'completed').map((s) => s.id.getValue())
    );

    return steps.filter((step) => {
      if (step.status === 'completed') return false;
      return !step.dependsOn.every((dep) => completedStepIds.has(dep.getValue()));
    });
  }
}
