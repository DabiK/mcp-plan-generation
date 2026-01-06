import { injectable, inject } from 'tsyringe';
import Ajv, { ValidateFunction, ErrorObject } from 'ajv';
import addFormats from 'ajv-formats';
import planflowSchema from './schemas/planflow-v1.1.0.json';
import { DetailedValidationError } from '../../domain/errors/ValidationError';
import { MermaidValidator } from './MermaidValidator';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  detailedErrors: DetailedValidationError[];
}

@injectable()
export class PlanValidator {
  private ajv: Ajv;
  private validateFunction: ValidateFunction;

  constructor(@inject(MermaidValidator) private mermaidValidator?: MermaidValidator) {
    this.ajv = new Ajv({
      allErrors: true,
      verbose: true,
      strict: false,
    });
    addFormats(this.ajv);
    
    this.validateFunction = this.ajv.compile(planflowSchema);
  }

  /**
   * Valide un plan contre le JSON Schema
   */
  async validate(plan: unknown): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const detailedErrors: DetailedValidationError[] = [];

    // Validation JSON Schema
    const isValid = this.validateFunction(plan);
    
    if (!isValid && this.validateFunction.errors) {
      for (const error of this.validateFunction.errors) {
        const path = error.instancePath || 'root';
        const message = error.message || 'Unknown error';
        errors.push(`${path}: ${message}`);
        
        // Convertir en DetailedValidationError
        detailedErrors.push(this.convertAjvError(error));
      }
    }

    // Validation supplémentaire si le schéma de base est valide
    if (isValid && this.isPlanObject(plan)) {
      // Vérifier les IDs uniques
      const stepIds = new Set<string>();
      for (const step of plan.steps) {
        if (stepIds.has(step.id)) {
          const errorMsg = `Duplicate step ID: ${step.id}`;
          errors.push(errorMsg);
          detailedErrors.push({
            path: `/steps/${step.id}`,
            message: errorMsg,
            errorType: 'business',
            actualValue: step.id,
          });
        }
        stepIds.add(step.id);
      }

      // Vérifier les références de dépendances
      for (const step of plan.steps) {
        if (step.dependsOn) {
          for (const depId of step.dependsOn) {
            if (!stepIds.has(depId)) {
              const errorMsg = `Step "${step.id}" depends on non-existent step "${depId}"`;
              errors.push(errorMsg);
              detailedErrors.push({
                path: `/steps/${step.id}/dependsOn`,
                message: errorMsg,
                errorType: 'business',
                actualValue: depId,
              });
            }
          }
        }
      }

      // Vérifier les cycles de dépendances
      if (this.hasCyclicDependencies(plan.steps)) {
        const errorMsg = 'Cyclic dependencies detected in plan steps';
        errors.push(errorMsg);
        detailedErrors.push({
          path: '/steps',
          message: errorMsg,
          errorType: 'business',
        });
      }

      // Validation des diagrammes Mermaid
      if (this.mermaidValidator) {
        // Valider les diagrammes au niveau plan
        if (plan.plan && plan.plan.diagrams) {
          for (let i = 0; i < plan.plan.diagrams.length; i++) {
            const diagram = plan.plan.diagrams[i];
            const result = await this.mermaidValidator.validate(diagram.type, diagram.content);
            if (!result.isValid) {
              const errorMsg = `Invalid Mermaid diagram "${diagram.title}": ${result.error}`;
              errors.push(errorMsg);
              detailedErrors.push({
                path: `/plan/diagrams/${i}`,
                message: result.error || 'Invalid diagram syntax',
                errorType: 'format',
                actualValue: diagram.content,
              });
            }
          }
        }

        // Valider les diagrammes au niveau steps
        for (let i = 0; i < plan.steps.length; i++) {
          const step = plan.steps[i];
          if (step.diagram) {
            const result = await this.mermaidValidator.validate(step.diagram.type, step.diagram.content);
            if (!result.isValid) {
              const errorMsg = `Invalid Mermaid diagram in step "${step.id}": ${result.error}`;
              errors.push(errorMsg);
              detailedErrors.push({
                path: `/steps/${i}/diagram`,
                message: result.error || 'Invalid diagram syntax',
                errorType: 'format',
                actualValue: step.diagram.content,
              });
            }
          }
        }
      }

      // Warnings
      if (plan.steps.length === 0) {
        warnings.push('Plan has no steps');
      }

      const stepsWithoutDuration = plan.steps.filter((s) => !s.estimatedDuration);
      if (stepsWithoutDuration.length > 0) {
        warnings.push(
          `${stepsWithoutDuration.length} step(s) without estimated duration`
        );
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      detailedErrors,
    };
  }

  /**
   * Convertit une erreur Ajv en DetailedValidationError
   */
  private convertAjvError(error: ErrorObject): DetailedValidationError {
    return {
      path: error.instancePath || 'root',
      message: error.message || 'Unknown validation error',
      errorType: 'schema',
      expectedValue: error.params,
      actualValue: error.data,
      schemaKeyword: error.keyword,
    };
  }

  /**
   * Type guard pour vérifier qu'un objet a la structure d'un plan
   */
  private isPlanObject(obj: unknown): obj is {
    plan?: {
      diagrams?: Array<{ type: string; content: string; title: string; description?: string }>;
    };
    steps: Array<{
      id: string;
      dependsOn?: string[];
      estimatedDuration?: { value: number; unit: string };
      diagram?: { type: string; content: string; description?: string };
    }>;
  } {
    return (
      typeof obj === 'object' &&
      obj !== null &&
      'steps' in obj &&
      Array.isArray((obj as any).steps)
    );
  }

  /**
   * Détecte les cycles dans le graphe de dépendances
   */
  private hasCyclicDependencies(
    steps: Array<{ id: string; dependsOn?: string[] }>
  ): boolean {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const hasCycle = (stepId: string): boolean => {
      visited.add(stepId);
      recursionStack.add(stepId);

      const step = steps.find((s) => s.id === stepId);
      if (!step || !step.dependsOn) {
        recursionStack.delete(stepId);
        return false;
      }

      for (const depId of step.dependsOn) {
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
      if (!visited.has(step.id)) {
        if (hasCycle(step.id)) return true;
      }
    }

    return false;
  }

  /**
   * Formate les erreurs pour un affichage user-friendly
   */
  formatErrors(errors: string[]): string {
    if (errors.length === 0) return 'No errors';
    
    return errors
      .map((err, index) => `${index + 1}. ${err}`)
      .join('\n');
  }
}
