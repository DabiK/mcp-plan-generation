import { injectable } from 'tsyringe';
import { PlanValidator } from '../../infrastructure/validation/PlanValidator';
import { ValidationResultDTO } from '../dtos';

@injectable()
export class ValidatePlanUseCase {
  constructor(private validator: PlanValidator) {}

  async execute(plan: unknown): Promise<ValidationResultDTO> {
    return await this.validator.validate(plan);
  }
}
