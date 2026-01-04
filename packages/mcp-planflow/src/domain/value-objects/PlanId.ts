export class PlanId {
  private readonly value: string;

  constructor(value: string) {
    if (!value || value.length < 1) {
      throw new Error('PlanId cannot be empty');
    }
    this.value = value;
  }

  toString(): string {
    return this.value;
  }

  equals(other: PlanId): boolean {
    return this.value === other.value;
  }

  getValue(): string {
    return this.value;
  }
}
