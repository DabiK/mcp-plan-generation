import { Plan } from '../../../domain/entities/Plan';
import { Step } from '../../../domain/entities/Step';

/**
 * Port In - Use Case: Gestion des steps
 * Implémenté par: PlanManagementService (Domain)
 * Appelé par: McpServer, HttpServer (Infrastructure)
 */

export interface StepInput {
  id: string;
  title: string;
  description: string;
  kind: string;
  status?: string;
  dependsOn?: string[];
  estimatedDuration?: { value: number; unit: string } | string;
  actions?: any[];
  validation?: any;
  diagram?: any;
}

export interface AddStepInput {
  planId: string;
  step: StepInput;
}

export interface UpdateStepInput {
  planId: string;
  stepId: string;
  updates: Partial<StepInput>;
}

export interface RemoveStepInput {
  planId: string;
  stepId: string;
  mode?: 'strict' | 'cascade';
}

export interface SetReviewStatusInput {
  planId: string;
  stepId: string;
  status: 'pending' | 'approved' | 'needs-revision' | 'rejected';
  comment?: string;
}

export interface StepCommentInput {
  content: string;
  author: string;
}

export interface StepCommentOutput {
  id: string;
  content: string;
  author: string;
  createdAt: string;
  updatedAt?: string;
}

export interface AddStepCommentInput {
  planId: string;
  stepId: string;
  comment: StepCommentInput;
}

export interface UpdateStepCommentInput {
  planId: string;
  stepId: string;
  commentId: string;
  content: string;
}

export interface DeleteStepCommentInput {
  planId: string;
  stepId: string;
  commentId: string;
}

export interface StepOperationOutput {
  plan: Plan;
  step?: Step;
}

export interface IStepManagement {
  addStep(input: AddStepInput): Promise<StepOperationOutput>;
  updateStep(input: UpdateStepInput): Promise<StepOperationOutput>;
  removeStep(input: RemoveStepInput): Promise<StepOperationOutput>;
  setReviewStatus(input: SetReviewStatusInput): Promise<StepOperationOutput>;
  
  // Step comment management
  addStepComment(input: AddStepCommentInput): Promise<StepCommentOutput>;
  updateStepComment(input: UpdateStepCommentInput): Promise<StepCommentOutput>;
  deleteStepComment(input: DeleteStepCommentInput): Promise<void>;
}
