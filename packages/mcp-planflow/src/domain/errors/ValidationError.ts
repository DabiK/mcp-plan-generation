import { DomainError } from './DomainError';

export interface DetailedValidationError {
  path: string;
  message: string;
  errorType: 'schema' | 'business' | 'format';
  expectedValue?: any;
  actualValue?: any;
  schemaKeyword?: string;
}

export class ValidationError extends DomainError {
  constructor(
    message: string,
    public readonly errors: string[],
    public readonly detailedErrors: DetailedValidationError[] = []
  ) {
    super(message);
    this.name = 'ValidationError';
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}
