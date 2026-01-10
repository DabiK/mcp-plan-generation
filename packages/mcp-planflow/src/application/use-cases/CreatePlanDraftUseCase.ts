import { IPlanRepository } from '../../domain/repositories/IPlanRepository';
import { Plan } from '../../domain/entities/Plan';
import { PlanId } from '../../domain/value-objects/PlanId';
import { PlanType } from '../../domain/value-objects/PlanType';
import { PlanStatus } from '../../domain/value-objects/PlanStatus';
import { CreatePlanDraftInputDTO } from '../dtos/CreatePlanDraftDTO';
import { PlanDTO } from '../dtos/PlanDTO';
import { DraftPlanValidator } from '../../domain/validators/DraftPlanValidator';
import { ValidationError } from '../../domain/errors/ValidationError';
import { injectable, inject } from 'tsyringe';

export interface CreatePlanDraftOutput {
  plan: PlanDTO;
}

/**
 * Use case pour créer un plan en mode draft.
 * Un plan draft contient uniquement les métadonnées et l'objectif,
 * sans steps (steps = []).
 */
@injectable()
export class CreatePlanDraftUseCase {
  constructor(@inject('IPlanRepository') private readonly planRepository: IPlanRepository) {}

  async execute(input: CreatePlanDraftInputDTO): Promise<CreatePlanDraftOutput> {
    // Générer un nouveau PlanId
    const { nanoid } = await import('nanoid');
    const planId = new PlanId(nanoid());
    
    // Créer le plan en mode draft
    const now = new Date();
    const plan = new Plan(
      planId,
      '1.1.0', // schemaVersion
      input.planType as PlanType,
      PlanStatus.DRAFT, // status = draft
      {
        title: input.metadata.title,
        description: input.metadata.description,
        author: input.metadata.author,
        createdAt: now,
        updatedAt: now,
        tags: input.metadata.tags,
        revision: 0,
      },
      {
        objective: input.objective,
        scope: input.scope || '',
        constraints: input.constraints,
        assumptions: input.assumptions,
        successCriteria: input.successCriteria,
      },
      [], // Pas de steps en draft
      now,
      now,
      0 // revision
    );

    // Valider le plan draft
    const validation = DraftPlanValidator.validate(plan);
    if (!validation.isValid) {
      throw new ValidationError(
        'Draft plan validation failed',
        validation.errors
      );
    }

    // Sauvegarder le plan
    await this.planRepository.save(plan);

    // Retourner le DTO
    const planDTO: PlanDTO = {
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
      steps: [],
      createdAt: plan.createdAt.toISOString(),
      updatedAt: plan.updatedAt.toISOString(),
      revision: plan.revision,
    };

    return { plan: planDTO };
  }
}
