import { Plan } from '../../../domain/entities/Plan';
import { PlanOutput } from './IPlanRetrieval';

/**
 * Port In - Use Case: Modification de plans
 * Implémenté par: PlanManagementService (Domain)
 * Appelé par: McpServer, HttpServer (Infrastructure)
 */

export interface UpdateMetadataInput {
  planId: string;
  metadata?: {
    title?: string;
    description?: string;
    author?: string;
    tags?: string[];
  };
  planDetails?: {
    objective?: string;
    scope?: string;
    constraints?: string[];
    assumptions?: string[];
    successCriteria?: string[];
  };
}

export interface PatchElementsInput {
  planId: string;
  stepId?: string;
  title?: string;
  description?: string;
  kind?: string;
  status?: string;
  dependsOn?: string[];
  estimatedDuration?: string;
  actions?: any[];
  validation?: any;
  metadata?: any;
  plan?: any;
}

export interface PlanCommentInput {
  content: string;
  author: string;
}

export interface PlanCommentOutput {
  id: string;
  content: string;
  author: string;
  createdAt: string;
  updatedAt?: string;
}

export interface AddPlanCommentInput {
  planId: string;
  comment: PlanCommentInput;
}

export interface UpdatePlanCommentInput {
  planId: string;
  commentId: string;
  content: string;
}

export interface DeletePlanCommentInput {
  planId: string;
  commentId: string;
}

export interface UpdatePlanInput {
  planId: string;
  updates: any; // Full plan update payload
}

export interface IPlanModification {
  updateMetadata(input: UpdateMetadataInput): Promise<PlanOutput>;
  patchElements(input: PatchElementsInput): Promise<PlanOutput>;
  updatePlan(input: UpdatePlanInput): Promise<PlanOutput>;
  deletePlan(planId: string): Promise<void>;
  
  // Plan comment management
  getPlanComments(planId: string): Promise<PlanCommentOutput[]>;
  addPlanComment(input: AddPlanCommentInput): Promise<PlanCommentOutput>;
  updatePlanComment(input: UpdatePlanCommentInput): Promise<PlanCommentOutput>;
  deletePlanComment(input: DeletePlanCommentInput): Promise<void>;
}
