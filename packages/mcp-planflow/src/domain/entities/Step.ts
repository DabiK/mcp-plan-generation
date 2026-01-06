import { StepId } from '../value-objects/StepId';
import { StepKind } from '../value-objects/StepKind';
import { StepStatus } from '../value-objects/StepStatus';

export interface Duration {
  value: number;
  unit: 'minutes' | 'hours' | 'days';
}

// Action types based on schema v1.1.0
export type CreateFileAction = {
  type: 'create_file' | 'create_directory';
  filePath?: string;
  content?: string;
  description?: string;
  payload?: {
    file?: string;
    path?: string;
    content?: string;
  };
};

export type EditFileAction = {
  type: 'edit_file';
  filePath?: string;
  before?: string;
  after?: string;
  description?: string;
  lineNumbers?: {
    start: number;
    end: number;
  };
  payload?: {
    file?: string;
    changes?: string;
  };
};

export type DeleteFileAction = {
  type: 'delete_file';
  filePath: string;
  reason?: string;
  description?: string;
};

export type RunCommandAction = {
  type: 'run_command' | 'terminal';
  command?: string;
  workingDirectory?: string;
  expectedOutput?: string;
  description?: string;
  payload?: {
    command?: string;
  };
};

export type TestAction = {
  type: 'test' | 'manual_test';
  testCommand?: string;
  testFiles?: string[];
  coverage?: number;
  description?: string;
  payload?: {
    scenarios?: string[];
  };
};

export type ReviewAction = {
  type: 'review' | 'code_review';
  checklistItems?: string[];
  reviewers?: string[];
  description?: string;
  payload?: {
    checks?: string[];
  };
};

export type DocumentationAction = {
  type: 'documentation';
  sections?: string[];
  format?: 'markdown' | 'jsdoc' | 'openapi' | 'readme';
  filePath?: string;
  description?: string;
};

export type CustomAction = {
  type: 'custom';
  description: string;
  payload?: Record<string, unknown>;
};

export type Action = 
  | CreateFileAction 
  | EditFileAction 
  | DeleteFileAction 
  | RunCommandAction 
  | TestAction 
  | ReviewAction 
  | DocumentationAction 
  | CustomAction;

export interface ValidationCriteria {
  criteria: string[];
  automatedTests?: string[];
}

export interface StepReviewStatus {
  decision: 'approved' | 'rejected' | 'skipped';
  timestamp: Date;
  reviewer?: string;
}

export interface StepComment {
  id: string;
  content: string;
  author?: string;
  createdAt: Date;
  updatedAt?: Date;
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
    public validation?: ValidationCriteria,
    public comments: StepComment[] = [],
    public reviewStatus?: StepReviewStatus,
    public diagram?: { type: string; content: string; description?: string }
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
