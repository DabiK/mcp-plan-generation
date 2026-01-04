import { DomainError } from './DomainError';

export class CyclicDependencyError extends DomainError {
  constructor(message: string = 'Cyclic dependency detected in plan steps') {
    super(message);
    this.name = 'CyclicDependencyError';
    Object.setPrototypeOf(this, CyclicDependencyError.prototype);
  }
}
