import { injectable } from 'tsyringe';
import { Plan } from '../../domain/entities/Plan';
import { Step } from '../../domain/entities/Step';
import { IValidationPort, ValidationResult } from '../../application/ports/out/IValidationPort';
import { PlanValidator } from './PlanValidator';
import { MermaidValidator } from './MermaidValidator';
import { DTOMapper } from '../mappers/DTOMapper';

/**
 * Infrastructure Adapter - Implémente le Port Out IValidationPort
 * Utilisé par: PlanManagementService (Domain)
 * Dépend de: PlanValidator, MermaidValidator, DTOMapper (Infrastructure)
 */
@injectable()
export class ValidationPort implements IValidationPort {
  constructor(
    private readonly planValidator: PlanValidator,
    private readonly mermaidValidator: MermaidValidator,
    private readonly dtoMapper: DTOMapper
  ) {}

  async validatePlanSchema(plan: Plan): Promise<ValidationResult> {
    // 1. Mapper Domain → DTO pour validation schéma
    const planDTO = this.dtoMapper.toDTO(plan);

    // 2. Validation via JSON Schema
    const result = await this.planValidator.validate(planDTO);
    
    return {
      isValid: result.isValid,
      errors: result.errors,
    };
  }

  async validateStepSchema(step: Step): Promise<ValidationResult> {
    // 1. Mapper Domain → DTO pour validation schéma
    const stepDTO = this.dtoMapper.stepToDTO(step);

    // 2. Validation via JSON Schema
    const result = await this.planValidator.validateSteps([stepDTO]);
    
    return {
      isValid: result.isValid,
      errors: result.errors,
    };
  }

  async validateMermaidDiagram(type: string, content: string): Promise<ValidationResult> {
    const result = await this.mermaidValidator.validate(type, content);
    
    return {
      isValid: result.isValid,
      errors: result.error ? [result.error] : [],
    };
  }

  async validate(data: any): Promise<void> {
    // Generic validation for raw data (used by validatePlan endpoint)
    const result = await this.planValidator.validate(data);
    
    if (!result.isValid) {
      const ValidationError = (await import('../../domain/errors/ValidationError')).ValidationError;
      throw new ValidationError('Validation failed', result.errors);
    }
  }
}
