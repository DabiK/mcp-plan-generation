import { injectable } from 'tsyringe';
import { PlanValidator } from '../../infrastructure/validation/PlanValidator';
import { ValidationResultDTO } from '../dtos';

@injectable()
export class ValidatePlanUseCase {
  constructor(private validator: PlanValidator) {}

  execute(plan: unknown): ValidationResultDTO {
    return this.validator.validate(plan);
  }
}
