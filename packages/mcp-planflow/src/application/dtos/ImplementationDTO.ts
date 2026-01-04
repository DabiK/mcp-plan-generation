// DTOs for step implementation tracking

export type StepStatusState = 'pending' | 'in-progress' | 'done' | 'blocked' | 'skipped';

export interface StepStatusDTO {
  state: StepStatusState;
  startedAt?: string;
  completedAt?: string;
  notes?: string;
  blockReason?: string;
}

export interface StepWithStatusDTO {
  id: string;
  title: string;
  description: string;
  kind: string;
  status: StepStatusDTO;
  dependsOn: string[];
  estimatedDuration?: {
    value: number;
    unit: string;
  };
  actions: any[];
  validation?: {
    criteria: string[];
    automatedTests?: string[];
  };
}

export interface StepContextDTO {
  currentStep: StepWithStatusDTO;
  dependencies: StepWithStatusDTO[];
  nextSteps: StepWithStatusDTO[];
}

export interface CanStartResultDTO {
  allowed: boolean;
  reason?: string;
  missingDependencies: string[];
}

export interface DependencyInfoDTO {
  stepId: string;
  title: string;
  status: StepStatusState;
}

export interface ProgressDTO {
  total: number;
  completed: number;
  inProgress: number;
  blocked: number;
  skipped: number;
  pending: number;
  percentComplete: number;
  estimatedTimeRemaining?: string;
}

export interface PhaseProgressDTO {
  phaseName: string;
  icon: string;
  total: number;
  completed: number;
  percentComplete: number;
}

export interface ImplementationStateDTO {
  currentStepIndex: number;
  isStarted: boolean;
  isComplete: boolean;
  startedAt?: string;
  completedAt?: string;
  totalSteps: number;
}

export interface ImplementationInfoDTO {
  isStarted: boolean;
  isComplete: boolean;
  startedAt?: string;
  completedAt?: string;
  currentStepIndex: number;
}
