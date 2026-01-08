import { injectable, inject } from 'tsyringe';
import { nanoid } from 'nanoid';
import { IPlanRepository } from '../../domain/repositories/IPlanRepository';
import { Plan, PlanMetadata, PlanDetails, Step } from '../../domain/entities';
import { PlanId, StepId, PlanType, StepKind, StepStatus, PlanStatus } from '../../domain/value-objects';
import { PlanValidator } from '../../infrastructure/validation/PlanValidator';
import { ValidationError } from '../../domain/errors/ValidationError';
import { PlanDTO, CreatePlanOutputDTO } from '../dtos';

@injectable()
export class CreatePlanUseCase {
  constructor(
    @inject('IPlanRepository') private repository: IPlanRepository,
    private validator: PlanValidator
  ) {}

  async execute(planData: Record<string, any>): Promise<CreatePlanOutputDTO> {
    // Valider le plan
    const validationResult = await this.validator.validate(planData);
    if (!validationResult.isValid) {
      throw new ValidationError(
        'Plan validation failed',
        validationResult.errors,
        validationResult.detailedErrors
      );
    }

    // Générer un ID unique
    const planId = nanoid();

    // Créer les steps
    const steps = planData.steps.map((stepData: any) => {
      return new Step(
        new StepId(stepData.id),
        stepData.title,
        stepData.description,
        stepData.kind as StepKind,
        stepData.status || StepStatus.PENDING,
        (stepData.dependsOn || []).map((id: string) => new StepId(id)),
        stepData.estimatedDuration,
        stepData.actions || [],
        stepData.validation,
        [],
        undefined,
        stepData.diagram
      );
    });

    // Créer les métadonnées
    const now = new Date();
    const metadata: PlanMetadata = {
      title: planData.metadata.title,
      description: planData.metadata.description,
      author: planData.metadata.author,
      createdAt: now,
      updatedAt: now,
      tags: planData.metadata.tags,
      revision: 1,
    };

    // Créer les détails du plan
    const planDetails: PlanDetails = {
      objective: planData.plan.objective,
      scope: planData.plan.scope,
      constraints: planData.plan.constraints,
      assumptions: planData.plan.assumptions,
      successCriteria: planData.plan.successCriteria,
      diagrams: planData.plan.diagrams,
    };

    // Créer l'entité Plan
    const plan = new Plan(
      new PlanId(planId),
      planData.schemaVersion || '1.0.0',
      planData.planType as PlanType,
      PlanStatus.ACTIVE, // Plans created via the old API are automatically active
      metadata,
      planDetails,
      steps,
      now,
      now,
      1
    );

    // Persister
    await this.repository.save(plan);

    // Convertir en DTO pour la réponse
    const planDTO = this.toDTO(plan);

    return {
      planId,
      plan: planDTO,
    };
  }

  private toDTO(plan: Plan): PlanDTO {
    return {
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
        actions: step.actions,
        validation: step.validation,
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
