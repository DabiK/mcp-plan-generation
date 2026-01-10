import { Plan, PlanComment } from '../../../domain/entities/Plan';
import { PlanId } from '../../../domain/value-objects/PlanId';

/**
 * Port Out - Repository de plans
 * Implémenté par: MongoDBPlanRepository (Infrastructure)
 * Utilisé par: PlanManagementService (Domain)
 */

export interface StepCommentDTO {
  id: string;
  content: string;
  author: string;
  createdAt: string;
  updatedAt?: string;
}

export interface PlanCommentDTO {
  id: string;
  content: string;
  author: string;
  createdAt: string;
  updatedAt?: string;
}

export interface PlanFilters {
  status?: string;
  planType?: string;
  author?: string;
  search?: string;
  createdAfter?: Date;
  createdBefore?: Date;
  limit?: number;
  offset?: number;
}

export interface IPlanRepository {
  save(plan: Plan): Promise<void>;
  update(planId: PlanId, plan: Plan): Promise<void>;
  findById(planId: PlanId): Promise<Plan | null>;
  findAll(filters?: PlanFilters): Promise<Plan[]>;
  delete(planId: PlanId): Promise<void>;
  exists(planId: PlanId): Promise<boolean>;
  
  // Step comment management
  addStepComment(planId: string, stepId: string, comment: StepCommentDTO): Promise<boolean>;
  updateStepComment(planId: string, stepId: string, commentId: string, content: string): Promise<boolean>;
  deleteStepComment(planId: string, stepId: string, commentId: string): Promise<boolean>;
  
  // Plan comment management
  addPlanComment(planId: string, comment: PlanCommentDTO): Promise<boolean>;
  updatePlanComment(planId: string, commentId: string, content: string): Promise<boolean>;
  deletePlanComment(planId: string, commentId: string): Promise<boolean>;
}
