export class StepId {
  private readonly value: string;

  constructor(value: string) {
    if (!value || value.length < 1) {
      throw new Error('StepId cannot be empty');
    }
    this.value = value;
  }

  toString(): string {
    return this.value;
  }

  equals(other: StepId): boolean {
    return this.value === other.value;
  }

  getValue(): string {
    return this.value;
  }
}
