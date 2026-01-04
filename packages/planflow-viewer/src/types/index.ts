// Types from backend (duplicated for frontend independence)
export interface StepCommentDTO {
  id: string;
  stepId: string;
  content: string;
  author?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface PlanCommentDTO {
  id: string;
  content: string;
  author?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface StepDTO {
  id: string;
  title: string;
  description: string;
  kind: string;
  status: string;
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
  comments?: StepCommentDTO[];
}

export interface PlanDTO {
  planId: string;
  schemaVersion: string;
  planType: string;
  status?: string;
  metadata: {
    title: string;
    description: string;
    author?: string;
    createdAt: string;
    updatedAt: string;
    tags?: string[];
    revision: number;
  };
  plan: {
    objective: string;
    scope: string;
    constraints?: string[];
    assumptions?: string[];
    successCriteria?: string[];
  };
  steps: StepDTO[];
  createdAt: string;
  updatedAt: string;
  revision: number;
}

export interface CreatePlanInputDTO {
  plan: Record<string, unknown>;
  source?: string;
}

export interface UpdatePlanInputDTO {
  metadata?: Partial<PlanDTO['metadata']>;
  plan?: Partial<PlanDTO['plan']>;
  steps?: StepDTO[];
}

export interface PlanMetadataDTO {
  title: string;
  description: string;
  author?: string;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
  revision: number;
}

export interface StepMetadataDTO {
  estimatedDuration?: {
    value: number;
    unit: string;
  };
}

export interface PlanFilters {
  planType?: string;
  status?: string;
  limit?: number;
  offset?: number;
}

// Local viewer types
export interface FlowNode {
  id: string;
  type: 'step';
  position: { x: number; y: number };
  data: {
    step: StepDTO;
    isBlocked: boolean;
    canExecute: boolean;
  };
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  type: 'dependency';
  animated?: boolean;
}

export interface PlanFilters {
  planType?: string;
  status?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface PlanStats {
  totalPlans: number;
  byStatus: Record<string, number>;
  byType: Record<string, number>;
}

// Step Review types
export type ReviewDecision = 'approved' | 'rejected' | 'skipped';

export interface StepComment {
  id: string;
  stepId: string;
  content: string;
  timestamp: string;
  author?: string;
}

export interface StepReview {
  stepId: string;
  decision: ReviewDecision;
  comments: StepComment[];
  timestamp: string;
}

export interface PlanReviewState {
  planId: string;
  reviews: Record<string, StepReview>; // stepId -> review
  currentStepIndex: number;
  isComplete: boolean;
}
