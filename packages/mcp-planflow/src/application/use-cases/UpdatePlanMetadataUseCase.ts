import { IPlanRepository } from '../../domain/repositories/IPlanRepository';
import { PlanDTO } from '../dtos/PlanDTO';
import { PlanNotFoundError } from '../../domain/errors/PlanNotFoundError';
import { PlanId } from '../../domain/value-objects';
import { injectable, inject } from 'tsyringe';

export interface UpdatePlanMetadataInput {
  planId: string;
  metadata?: Partial<{
    title: string;
    description: string;
    author: string;
    tags: string[];
  }>;
  planDetails?: Partial<{
    objective: string;
    scope: string;
    constraints: string[];
    assumptions: string[];
    successCriteria: string[];
  }>;
}

export interface UpdatePlanMetadataOutput {
  plan: PlanDTO;
}

/**
 * Use case pour mettre à jour les métadonnées d'un plan sans toucher aux steps.
 */
@injectable()
export class UpdatePlanMetadataUseCase {
  constructor(@inject('IPlanRepository') private readonly planRepository: IPlanRepository) {}

  async execute(input: UpdatePlanMetadataInput): Promise<UpdatePlanMetadataOutput> {
    // 1. Récupérer le plan existant
    const plan = await this.planRepository.findById(new PlanId(input.planId));
    if (!plan) {
      throw new PlanNotFoundError(input.planId);
    }

    // 2. Mettre à jour les métadonnées
    if (input.metadata) {
      if (input.metadata.title !== undefined) {
        plan.metadata.title = input.metadata.title;
      }
      if (input.metadata.description !== undefined) {
        plan.metadata.description = input.metadata.description;
      }
      if (input.metadata.author !== undefined) {
        plan.metadata.author = input.metadata.author;
      }
      if (input.metadata.tags !== undefined) {
        plan.metadata.tags = input.metadata.tags;
      }
    }

    // 3. Mettre à jour les détails du plan
    if (input.planDetails) {
      if (input.planDetails.objective !== undefined) {
        plan.plan.objective = input.planDetails.objective;
      }
      if (input.planDetails.scope !== undefined) {
        plan.plan.scope = input.planDetails.scope;
      }
      if (input.planDetails.constraints !== undefined) {
        plan.plan.constraints = input.planDetails.constraints;
      }
      if (input.planDetails.assumptions !== undefined) {
        plan.plan.assumptions = input.planDetails.assumptions;
      }
      if (input.planDetails.successCriteria !== undefined) {
        plan.plan.successCriteria = input.planDetails.successCriteria;
      }
    }

    // 4. Mettre à jour les timestamps
    plan.updatedAt = new Date();
    plan.metadata.updatedAt = new Date();

    // 5. Sauvegarder le plan mis à jour
    await this.planRepository.save(plan);

    // 6. Retourner le plan complet mis à jour
    const planDTO: PlanDTO = {
      planId: plan.id.getValue(),
      schemaVersion: plan.schemaVersion,
      planType: plan.planType,      status: plan.status,      metadata: {
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
