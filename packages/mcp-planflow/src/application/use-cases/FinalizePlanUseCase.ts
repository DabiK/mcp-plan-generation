import { IPlanRepository } from '../../domain/repositories/IPlanRepository';
import { PlanDTO } from '../dtos/PlanDTO';
import { ValidationError } from '../../domain/errors/ValidationError';
import { PlanNotFoundError } from '../../domain/errors/PlanNotFoundError';
import { DraftPlanValidator } from '../../domain/validators/DraftPlanValidator';
import { PlanId, PlanStatus } from '../../domain/value-objects';
import { injectable, inject } from 'tsyringe';

export interface FinalizePlanInput {
  planId: string;
}

export interface FinalizePlanOutput {
  plan: PlanDTO;
}

/**
 * Use case pour finaliser un plan draft.
 * Change le status de 'draft' à 'active' après validation complète.
 */
@injectable()
export class FinalizePlanUseCase {
  constructor(@inject('IPlanRepository') private readonly planRepository: IPlanRepository) {}

  async execute(input: FinalizePlanInput): Promise<FinalizePlanOutput> {
    // 1. Récupérer le plan existant
    const plan = await this.planRepository.findById(new PlanId(input.planId));
    if (!plan) {
      throw new PlanNotFoundError(input.planId);
    }

    // 2. Vérifier que le plan est en draft
    if (!plan.isDraft()) {
      throw new ValidationError(
        'Cannot finalize plan',
        [`Plan is not in draft status (current status: ${plan.status})`]
      );
    }

    // 3. Valider que le plan peut être finalisé
    const validation = DraftPlanValidator.canFinalize(plan);
    if (!validation.isValid) {
      throw new ValidationError(
        'Plan cannot be finalized',
        validation.errors
      );
    }

    // 4. Finaliser le plan (change status draft → active)
    plan.finalize();

    // 5. Sauvegarder le plan finalisé
    await this.planRepository.save(plan);

    // 6. Retourner le plan complet finalisé
    const planDTO: PlanDTO = {
      planId: plan.id.getValue(),
      schemaVersion: plan.schemaVersion,
      planType: plan.planType,
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
        actions: step.actions as any,
        validation: step.validation,
        comments: step.comments.map(c => ({
          id: c.id,
          content: c.content,
          author: c.author,
          createdAt: c.createdAt.toISOString(),
          updatedAt: c.updatedAt?.toISOString(),
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

    return { plan: planDTO };
  }
}
