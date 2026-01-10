import { Plan } from '../../../domain/entities/Plan';
import { Step } from '../../../domain/entities/Step';

/**
 * Port Out - Validation des schémas et diagrammes
 * Implémenté par: ValidationPort (Infrastructure)
 * Utilisé par: PlanManagementService (Domain)
 */

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface IValidationPort {
  validatePlanSchema(plan: Plan): Promise<ValidationResult>;
  validateStepSchema(step: Step): Promise<ValidationResult>;
  validateMermaidDiagram(type: string, content: string): Promise<ValidationResult>;
  validate(data: any): Promise<void>; // Generic validation method for raw data
}
