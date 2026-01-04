import { PlanId } from '../value-objects/PlanId';
import { PlanType } from '../value-objects/PlanType';
import { StepStatus } from '../value-objects/StepStatus';
import { Plan } from '../entities/Plan';

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
}
