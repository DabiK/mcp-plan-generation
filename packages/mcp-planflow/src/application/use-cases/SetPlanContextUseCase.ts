import { injectable, inject } from 'tsyringe';
import { PlanContextRepository } from '../../infrastructure/database/repositories/PlanContextRepository';
import { IPlanRepository } from '../../domain/repositories/IPlanRepository';
import { ContextFile } from '../../domain/entities/PlanContext';
import { PlanId } from '../../domain/value-objects/PlanId';
import { ContextValidator } from '../../infrastructure/validation/ContextValidator';
import { ValidationError } from '../../domain/errors/ValidationError';

@injectable()
export class SetPlanContextUseCase {
  constructor(
    @inject('PlanContextRepository') private contextRepo: PlanContextRepository,
    @inject('IPlanRepository') private planRepo: IPlanRepository,
    private contextValidator: ContextValidator
  ) {}

  async execute(planId: string, files: ContextFile[]): Promise<{ success: boolean; filesCount: number }> {
    // Valider le contexte
    const contextData = { files };
    const validationResult = this.contextValidator.validate(contextData);
    if (!validationResult.isValid) {
      throw new ValidationError(
        'Context validation failed',
        validationResult.errors,
        validationResult.detailedErrors
      );
    }

    const plan = await this.planRepo.findById(new PlanId(planId));
    if (!plan) throw new Error(`Plan ${planId} not found`);

    const existing = await this.contextRepo.findByPlanId(planId);
    if (existing) {
      await this.contextRepo.update(planId, files);
    } else {
      await this.contextRepo.create({ planId, files });
    }

    return { success: true, filesCount: files.length };
  }
}