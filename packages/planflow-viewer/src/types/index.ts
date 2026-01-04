// Re-export types from mcp-planflow
export type { 
  PlanDTO, 
  StepDTO, 
  CreatePlanInputDTO,
  UpdatePlanInputDTO,
  PlanMetadataDTO,
  StepMetadataDTO
} from '../../../mcp-planflow/src/application/dtos';

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
