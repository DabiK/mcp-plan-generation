import { injectable, inject } from 'tsyringe';
import { PlanContextRepository } from '../../infrastructure/database/repositories/PlanContextRepository';

@injectable()
export class DeletePlanContextUseCase {
  constructor(@inject('PlanContextRepository') private repo: PlanContextRepository) {}

  async execute(planId: string): Promise<boolean> {
    return this.repo.delete(planId);
  }
}