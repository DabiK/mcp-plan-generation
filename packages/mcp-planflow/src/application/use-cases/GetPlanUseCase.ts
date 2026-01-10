import { injectable, inject } from 'tsyringe';
import { IPlanRepository } from '../../domain/repositories/IPlanRepository';
import { PlanId } from '../../domain/value-objects/PlanId';
import { PlanNotFoundError } from '../../domain/errors/PlanNotFoundError';
import { PlanDTO } from '../dtos';
import { Plan } from '../../domain/entities';

@injectable()
export class GetPlanUseCase {
  constructor(@inject('IPlanRepository') private repository: IPlanRepository) {}

  async execute(planId: string): Promise<PlanDTO> {
    const plan = await this.repository.findById(new PlanId(planId));

    if (!plan) {
      throw new PlanNotFoundError(planId);
    }
    
    return this.toDTO(plan);
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
        diagrams: plan.plan.diagrams,
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
        comments: (step.comments || []).map((c) => ({
          id: c.id,
          content: c.content,
          author: c.author,
          createdAt: c.createdAt.toISOString(),
          updatedAt: c.updatedAt ? c.updatedAt.toISOString() : undefined,
        })),
        reviewStatus: step.reviewStatus ? {
          decision: step.reviewStatus.decision,
          timestamp: step.reviewStatus.timestamp.toISOString(),
          reviewer: step.reviewStatus.reviewer,
        } : undefined,
        diagram: step.diagram ? {
          type: step.diagram.type as 'flowchart' | 'sequence' | 'class' | 'er' | 'gantt' | 'state',
          content: step.diagram.content,
          description: step.diagram.description,
        } : undefined,
      })),
      createdAt: plan.createdAt.toISOString(),
      updatedAt: plan.updatedAt.toISOString(),
      revision: plan.revision,
    };
  }
}
