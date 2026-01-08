import { IPlanRepository } from '../../domain/repositories/IPlanRepository';
import { PlanValidator } from '../../infrastructure/validation/PlanValidator';
import { MermaidValidator } from '../../infrastructure/validation/MermaidValidator';
import { PlanDTO, StepDTO } from '../dtos/PlanDTO';
import { ValidationError } from '../../domain/errors/ValidationError';
import { PlanNotFoundError } from '../../domain/errors/PlanNotFoundError';
import { CyclicDependencyError } from '../../domain/errors/CyclicDependencyError';
import { StepId, PlanId } from '../../domain/value-objects';
import { injectable, inject } from 'tsyringe';

export interface UpdateStepInPlanInput {
  planId: string;
  stepId: string;
  updates: Partial<StepDTO>;
}

export interface UpdateStepInPlanOutput {
  plan: PlanDTO;
}

/**
 * Use case pour mettre à jour un step existant dans un plan.
 * Applique la validation du schéma sur les champs modifiés.
 */
@injectable()
export class UpdateStepInPlanUseCase {
  constructor(
    @inject('IPlanRepository') private readonly planRepository: IPlanRepository,
    @inject(PlanValidator) private readonly planValidator: PlanValidator,
    @inject(MermaidValidator) private readonly mermaidValidator: MermaidValidator
  ) {}

  async execute(input: UpdateStepInPlanInput): Promise<UpdateStepInPlanOutput> {
    console.log('[UpdateStepInPlanUseCase] Received updates:', JSON.stringify(input.updates, null, 2));
    
    // 1. Récupérer le plan existant
    const plan = await this.planRepository.findById(new PlanId(input.planId));
    if (!plan) {
      throw new PlanNotFoundError(input.planId);
    }

    // 2. Vérifier que le step existe
    const existingStep = plan.getStep(new StepId(input.stepId));
    if (!existingStep) {
      throw new ValidationError(
        'Step not found',
        [`Step "${input.stepId}" does not exist in plan`]
      );
    }

    // 3. Créer le step mis à jour (merge avec l'existant)
    const updatedStepData: StepDTO = {
      id: existingStep.id.getValue(),
      title: input.updates.title ?? existingStep.title,
      description: input.updates.description ?? existingStep.description,
      kind: input.updates.kind ?? existingStep.kind,
      status: input.updates.status ?? existingStep.status,
      dependsOn: input.updates.dependsOn ?? existingStep.dependsOn.map((id) => id.getValue()),
      estimatedDuration: input.updates.estimatedDuration ?? existingStep.estimatedDuration,
      actions: (input.updates.actions ?? existingStep.actions) as any,
      validation: input.updates.validation ?? existingStep.validation,
      comments: input.updates.comments ?? existingStep.comments.map(c => ({
        id: c.id,
        content: c.content,
        author: c.author,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt?.toISOString(),
      })),
      reviewStatus: input.updates.reviewStatus ?? (existingStep.reviewStatus ? {
        decision: existingStep.reviewStatus.decision,
        timestamp: existingStep.reviewStatus.timestamp.toISOString(),
        reviewer: existingStep.reviewStatus.reviewer,
      } : undefined),
      diagram: input.updates.diagram ?? (existingStep.diagram ? {
        type: existingStep.diagram.type as 'flowchart' | 'sequence' | 'class' | 'er' | 'gantt' | 'state',
        content: existingStep.diagram.content,
        description: existingStep.diagram.description,
      } : undefined),
    };
    
    console.log('[UpdateStepInPlanUseCase] Updated step data:', JSON.stringify(updatedStepData, null, 2));

    // 4. Validation du diagram Mermaid si présent
    if (updatedStepData.diagram) {
      console.log('[UpdateStepInPlanUseCase] Validating Mermaid diagram...');
      const mermaidResult = await this.mermaidValidator.validate(
        updatedStepData.diagram.type,
        updatedStepData.diagram.content
      );
      
      if (!mermaidResult.isValid) {
        console.error('[UpdateStepInPlanUseCase] Mermaid validation failed:', mermaidResult.error);
        throw new ValidationError(
          'Invalid Mermaid diagram',
          [mermaidResult.error || 'Diagram syntax is invalid'],
          [{
            path: '/updates/diagram/content',
            message: mermaidResult.error || 'Invalid diagram syntax',
            errorType: 'format',
            actualValue: updatedStepData.diagram.content,
          }]
        );
      }
      console.log('[UpdateStepInPlanUseCase] Mermaid diagram is valid');
    }

    // 5. Validation du schéma : valider tous les steps (existants + modifié)
    const allSteps = plan.steps.map((s) => {
      // Remplacer le step en cours de modification avec les nouvelles données
      if (s.id.getValue() === input.stepId) {
        return updatedStepData;
      }
      // Garder les autres steps tels quels
      return {
        id: s.id.getValue(),
        title: s.title,
        description: s.description,
        kind: s.kind,
        status: s.status,
        dependsOn: s.dependsOn.map((d) => d.getValue()),
        estimatedDuration: s.estimatedDuration,
        actions: s.actions,
        validation: s.validation,
      };
    });

    const schemaValidation = await this.planValidator.validateSteps(allSteps);
    if (!schemaValidation.isValid) {
      throw new ValidationError(
        'Updated step schema validation failed',
        schemaValidation.errors,
        schemaValidation.detailedErrors
      );
    }

    // 6. Si les dépendances ont changé, les valider
    if (input.updates.dependsOn) {
      const existingStepIds = new Set(
        plan.steps
          .filter((s) => s.id.getValue() !== input.stepId) // Exclure le step en cours de modification
          .map((s) => s.id.getValue())
      );

      const missingDeps = input.updates.dependsOn.filter((depId) => !existingStepIds.has(depId));
      
      if (missingDeps.length > 0) {
        throw new ValidationError(
          'Invalid step dependencies',
          missingDeps.map((depId) => `Dependency "${depId}" does not exist in plan`)
        );
      }
    }

    // 7. Mettre à jour le step dans le plan
    const updatePayload = {
      title: updatedStepData.title,
      description: updatedStepData.description,
      kind: updatedStepData.kind as any,
      status: updatedStepData.status as any,
      dependsOn: updatedStepData.dependsOn.map((id) => new StepId(id)),
      estimatedDuration: updatedStepData.estimatedDuration as any,
      actions: updatedStepData.actions,
      validation: updatedStepData.validation,
      diagram: updatedStepData.diagram,
    };
    
    console.log('[UpdateStepInPlanUseCase] Calling plan.updateStep with:', JSON.stringify(updatePayload, null, 2));
    plan.updateStep(new StepId(input.stepId), updatePayload);

    // 8. Vérifier les cycles si les dépendances ont changé
    if (input.updates.dependsOn && plan.hasCyclicDependencies()) {
      throw new CyclicDependencyError(
        `Updating step "${input.stepId}" dependencies would create a cyclic dependency`
      );
    }

    // 9. Sauvegarder le plan mis à jour
    await this.planRepository.update(plan.id, plan);

    // 10. Retourner le plan complet mis à jour
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
