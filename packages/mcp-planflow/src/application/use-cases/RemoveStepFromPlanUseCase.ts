import { IPlanRepository } from '../../domain/repositories/IPlanRepository';
import { PlanDTO } from '../dtos/PlanDTO';
import { ValidationError } from '../../domain/errors/ValidationError';
import { PlanNotFoundError } from '../../domain/errors/PlanNotFoundError';
import { StepId, PlanId } from '../../domain/value-objects';
import { injectable, inject } from 'tsyringe';

export interface RemoveStepFromPlanInput {
  planId: string;
  stepId: string;
  /**
   * Mode de suppression:
   * - 'strict': Rejette si d'autres steps dépendent de celui-ci
   * - 'cascade': Supprime les dépendances dans les autres steps
   */
  mode?: 'strict' | 'cascade';
}

export interface RemoveStepFromPlanOutput {
  plan: PlanDTO;
}

/**
 * Use case pour retirer un step d'un plan.
 * Gère les dépendances avec deux stratégies: strict ou cascade.
 */
@injectable()
export class RemoveStepFromPlanUseCase {
  constructor(@inject('IPlanRepository') private readonly planRepository: IPlanRepository) {}

  async execute(input: RemoveStepFromPlanInput): Promise<RemoveStepFromPlanOutput> {
    const mode = input.mode || 'strict';

    // 1. Récupérer le plan existant
    const plan = await this.planRepository.findById(new PlanId(input.planId));
    if (!plan) {
      throw new PlanNotFoundError(input.planId);
    }

    // 2. Vérifier que le step existe
    const stepToRemove = plan.getStep(new StepId(input.stepId));
    if (!stepToRemove) {
      throw new ValidationError(
        'Step not found',
        [`Step "${input.stepId}" does not exist in plan`]
      );
    }

    // 3. Vérifier si d'autres steps dépendent de celui-ci
    const dependentSteps = plan.steps.filter((s) =>
      s.dependsOn.some((depId) => depId.getValue() === input.stepId)
    );

    if (dependentSteps.length > 0) {
      if (mode === 'strict') {
        // Mode strict: rejeter la suppression
        throw new ValidationError(
          'Cannot remove step with dependencies',
          [
            `Step "${input.stepId}" is referenced by: ${dependentSteps
              .map((s) => s.id.getValue())
              .join(', ')}`,
            'Use cascade mode to remove dependencies automatically',
          ]
        );
      } else {
        // Mode cascade: supprimer les dépendances
        for (const step of dependentSteps) {
          const updatedDependencies = step.dependsOn.filter(
            (depId) => depId.getValue() !== input.stepId
          );
          
          plan.updateStep(step.id, {
            dependsOn: updatedDependencies,
          });
        }
      }
    }

    // 4. Supprimer le step
    plan.removeStep(new StepId(input.stepId));

    // 5. Sauvegarder le plan mis à jour
    await this.planRepository.update(plan.id, plan);

    // 6. Retourner le plan complet mis à jour
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
