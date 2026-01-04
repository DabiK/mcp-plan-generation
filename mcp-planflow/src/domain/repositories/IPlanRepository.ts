import { PlanId } from '../value-objects/PlanId';
import { PlanType } from '../value-objects/PlanType';
import { StepStatus } from '../value-objects/StepStatus';
import { Plan } from '../entities/Plan';
import { StepCommentDTO } from '../../application/dtos/StepCommentDTO';
import { PlanCommentDTO } from '../../application/dtos/PlanCommentDTO';
import { StepReviewStatus } from '../entities/Step';

export interface PlanFilters {
  planType?: PlanType;
  status?: StepStatus;
  createdAfter?: Date;
  createdBefore?: Date;
  limit?: number;
  offset?: number;
}

export interface IPlanRepository {
  save(plan: Plan): Promise<void>;
  findById(id: PlanId): Promise<Plan | null>;
  findAll(filters?: PlanFilters): Promise<Plan[]>;
  update(id: PlanId, plan: Plan): Promise<void>;
  delete(id: PlanId): Promise<void>;
  exists(id: PlanId): Promise<boolean>;
  
  // Step comments management
  addStepComment(planId: string, stepId: string, comment: StepCommentDTO): Promise<boolean>;
  deleteStepComment(planId: string, stepId: string, commentId: string): Promise<boolean>;
  updateStepComment(planId: string, stepId: string, commentId: string, content: string): Promise<boolean>;
  
  // Plan comments management
  addPlanComment(planId: string, comment: PlanCommentDTO): Promise<boolean>;
  deletePlanComment(planId: string, commentId: string): Promise<boolean>;
  updatePlanComment(planId: string, commentId: string, content: string): Promise<boolean>;
  getPlanComments(planId: string): Promise<PlanCommentDTO[]>;
  
  // Step review status management
  setStepReviewStatus(planId: string, stepId: string, reviewStatus: StepReviewStatus): Promise<boolean>;
}
