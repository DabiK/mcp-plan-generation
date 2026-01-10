import { IPlanRepository } from '../../domain/repositories/IPlanRepository';
import { PlanValidator } from '../../infrastructure/validation/PlanValidator';
import { PlanDTO, StepDTO } from '../dtos/PlanDTO';
import { ValidationError } from '../../domain/errors/ValidationError';
import { PlanNotFoundError } from '../../domain/errors/PlanNotFoundError';
import { CyclicDependencyError } from '../../domain/errors/CyclicDependencyError';
import { StepId, PlanId, StepKind, StepStatus } from '../../domain/value-objects';
import { Step } from '../../domain/entities/Step';
import { injectable, inject } from 'tsyringe';

export interface AddStepToPlanInput {
  planId: string;
  step: StepDTO;
}

export interface AddStepToPlanOutput {
  plan: PlanDTO;
}

/**
 * Use case pour ajouter un step à un plan existant.
 * 
 * Validation en 2 phases:
 * - PHASE 1: Validation du schéma du step via le validateur Ajv existant
 * - PHASE 2: Validation de cohérence avec le plan (unicité, dépendances, cycles)
 */
@injectable()
export class AddStepToPlanUseCase {
  constructor(
    @inject('IPlanRepository') private readonly planRepository: IPlanRepository,
    @inject(PlanValidator) private readonly planValidator: PlanValidator
  ) {}

  async execute(input: AddStepToPlanInput): Promise<AddStepToPlanOutput> {
    // 1. Récupérer le plan existant
    const plan = await this.planRepository.findById(new PlanId(input.planId));
    if (!plan) {
      throw new PlanNotFoundError(input.planId);
    }

    // 2. PHASE 1: Validation du schéma des steps et de leur cohérence
    // Valider tous les steps (existants + nouveau) pour vérifier la cohérence
    const allSteps = [
      ...plan.steps.map((s) => ({
        id: s.id.getValue(),
        title: s.title,
        description: s.description,
        kind: s.kind,
        status: s.status,
        dependsOn: s.dependsOn.map((d) => d.getValue()),
        estimatedDuration: s.estimatedDuration,
        actions: s.actions,
        validation: s.validation,
      })),
      input.step,
    ];
    
    const stepValidationResult = await this.planValidator.validateSteps(allSteps);
    if (!stepValidationResult.isValid) {
      throw new ValidationError(
        'Step schema validation failed',
        stepValidationResult.errors,
        stepValidationResult.detailedErrors
      );
    }

    // 3. PHASE 2: Validation de cohérence avec le plan existant
    
    // Vérifier l'unicité du stepId
    if (plan.steps.some((s) => s.id.getValue() === input.step.id)) {
      throw new ValidationError(
        'Step ID must be unique',
        [`Step with id "${input.step.id}" already exists in plan`]
      );
    }

    // Vérifier que les dépendances existent
    if (input.step.dependsOn && input.step.dependsOn.length > 0) {
      const existingStepIds = new Set(plan.steps.map((s) => s.id.getValue()));
      const missingDeps = input.step.dependsOn.filter((depId) => !existingStepIds.has(depId));
      
      if (missingDeps.length > 0) {
        throw new ValidationError(
          'Invalid step dependencies',
          missingDeps.map((depId) => `Dependency "${depId}" does not exist in plan`)
        );
      }
    }

    // Créer le step domain entity
    const stepEntity = new Step(
      new StepId(input.step.id),
      input.step.title,
      input.step.description,
      input.step.kind as StepKind,
      input.step.status as StepStatus,
      (input.step.dependsOn || []).map((id) => new StepId(id)),
      input.step.estimatedDuration as any,
      input.step.actions as any, // Les actions sont déjà validées par le schéma
      input.step.validation
    );

    // Ajouter le step au plan
    plan.addStep(stepEntity);

    // Vérifier les cycles de dépendances après l'ajout
    if (plan.hasCyclicDependencies()) {
      throw new CyclicDependencyError(
        `Adding step "${input.step.id}" would create a cyclic dependency`
      );
    }

    // 4. Sauvegarder le plan mis à jour
    await this.planRepository.update(plan.id, plan);

    // 5. Retourner le plan complet mis à jour
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
