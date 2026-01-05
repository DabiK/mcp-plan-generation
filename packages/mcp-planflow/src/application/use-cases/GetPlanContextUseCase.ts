import { injectable, inject } from 'tsyringe';
import { PlanContextRepository } from '../../infrastructure/database/repositories/PlanContextRepository';
import { PlanContext } from '../../domain/entities/PlanContext';

@injectable()
export class GetPlanContextUseCase {
  constructor(@inject('PlanContextRepository') private repo: PlanContextRepository) {}

  async execute(planId: string): Promise<PlanContext | null> {
    return this.repo.findByPlanId(planId);
  }
}