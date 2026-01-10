import { injectable, inject } from 'tsyringe';
import { IPlanRepository, PlanFilters } from '../../domain/repositories/IPlanRepository';
import { PlanDTO } from '../dtos';
import { Plan } from '../../domain/entities';

export interface ListPlansInput {
  planType?: string;
  status?: string;
  planId?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface ListPlansOutput {
  plans: PlanDTO[];
  total: number;
  limit?: number;
  offset?: number;
}

@injectable()
export class ListPlansUseCase {
  constructor(@inject('IPlanRepository') private repository: IPlanRepository) {}

  async execute(input?: ListPlansInput): Promise<ListPlansOutput> {
    const filters: PlanFilters = {
      planType: input?.planType as any,
      status: input?.status as any,
      planId: input?.planId,
      search: input?.search,
      limit: input?.limit,
      offset: input?.offset,
    };

    const plans = await this.repository.findAll(filters);
    const planDTOs = plans.map((plan) => this.toDTO(plan));

    return {
      plans: planDTOs,
      total: planDTOs.length,
      limit: input?.limit,
      offset: input?.offset,
    };
  }

  private toDTO(plan: Plan): PlanDTO {
    return {
      planId: plan.id.getValue(),
      schemaVersion: plan.schemaVersion,
      planType: plan.planType,
      status: plan.status,
      metadata: {
        title: plan.metadata.title,
        description: plan.metadata.description,
        author: plan.metadata.author,
        createdAt: plan.metadata.createdAt.toISOString(),
        updatedAt: plan.metadata.updatedAt.toISOString(),
        tags: plan.metadata.tags,
        revision: plan.metadata.revision,
      },
      plan: {
        objective: plan.plan.objective,
        scope: plan.plan.scope,
        constraints: plan.plan.constraints,
        assumptions: plan.plan.assumptions,
        successCriteria: plan.plan.successCriteria,
      },
      steps: plan.steps.map((step) => ({
        id: step.id.getValue(),
        title: step.title,
        description: step.description,
        kind: step.kind,
        status: step.status,
        dependsOn: step.dependsOn.map((id) => id.getValue()),
        estimatedDuration: step.estimatedDuration,
        actions: step.actions,
        validation: step.validation,
        reviewStatus: step.reviewStatus ? {
          decision: step.reviewStatus.decision,
          timestamp: step.reviewStatus.timestamp.toISOString(),
          reviewer: step.reviewStatus.reviewer,
        } : undefined,
      })),
      createdAt: plan.createdAt.toISOString(),
      updatedAt: plan.updatedAt.toISOString(),
      revision: plan.revision,
    };
  }
}
