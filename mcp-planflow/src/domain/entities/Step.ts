import { StepId } from '../value-objects/StepId';
import { StepKind } from '../value-objects/StepKind';
import { StepStatus } from '../value-objects/StepStatus';

export interface Duration {
  value: number;
  unit: 'minutes' | 'hours' | 'days';
}

export interface Action {
  type: string;
  description: string;
  payload?: Record<string, unknown>;
}

export interface ValidationCriteria {
  criteria: string[];
  automatedTests?: string[];
}

export class Step {
  constructor(
    public readonly id: StepId,
    public title: string,
    public description: string,
    public kind: StepKind,
    public status: StepStatus,
    public dependsOn: StepId[],
    public estimatedDuration?: Duration,
    public actions: Action[] = [],
    public validation?: ValidationCriteria
  ) {}

  addDependency(stepId: StepId): void {
    if (!this.dependsOn.some((dep) => dep.equals(stepId))) {
      this.dependsOn.push(stepId);
    }
  }

  removeDependency(stepId: StepId): void {
    this.dependsOn = this.dependsOn.filter((dep) => !dep.equals(stepId));
  }

  canExecute(completedSteps: Set<string>): boolean {
    return this.dependsOn.every((dep) => completedSteps.has(dep.getValue()));
  }

  markAsCompleted(): void {
    this.status = StepStatus.COMPLETED;
  }

  markAsInProgress(): void {
    this.status = StepStatus.IN_PROGRESS;
  }

  markAsFailed(): void {
    this.status = StepStatus.FAILED;
  }

  markAsSkipped(): void {
    this.status = StepStatus.SKIPPED;
  }

  markAsBlocked(): void {
    this.status = StepStatus.BLOCKED;
  }
}
