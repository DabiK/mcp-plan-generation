import { DomainError } from './DomainError';

export class PlanNotFoundError extends DomainError {
  constructor(planId: string) {
    super(`Plan not found: ${planId}`);
    this.name = 'PlanNotFoundError';
    Object.setPrototypeOf(this, PlanNotFoundError.prototype);
  }
}
