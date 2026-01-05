import { injectable, inject } from 'tsyringe';
import { IPlanRepository } from '../../domain/repositories/IPlanRepository';
import { PlanDTO, StepAction } from '../dtos';
import { PlanId, StepId } from '../../domain/value-objects';
import { PlanNotFoundError } from '../../domain/errors/PlanNotFoundError';

export interface PatchPlanElementsInput {
  planId: string;
  stepId?: string; // Si fourni, on patch la step, sinon on patch le plan
  // Champs pour le plan
  metadata?: {
    title?: string;
    description?: string;
    author?: string;
    tags?: string[];
  };
  plan?: {
    objective?: string;
    scope?: string;
    constraints?: string[];
    assumptions?: string[];
    successCriteria?: string[];
  };
  // Champs pour une step (utilisés uniquement si stepId est fourni)
  title?: string;
  description?: string;
  kind?: string;
  status?: string;
  dependsOn?: string[];
  estimatedDuration?: {
    value: number;
    unit: string;
  };
  actions?: StepAction[];
  validation?: {
    criteria: string[];
    automatedTests?: string[];
  };
}

@injectable()
export class PatchPlanElementsUseCase {
  constructor(
    @inject('IPlanRepository') private repository: IPlanRepository
  ) {}

  async execute(input: PatchPlanElementsInput): Promise<PlanDTO> {
    // Retrieve existing plan
    const existingPlan = await this.repository.findById(new PlanId(input.planId));
    if (!existingPlan) {
      throw new PlanNotFoundError(input.planId);
    }

    // Détecter si on patch une step ou le plan
    if (input.stepId) {
      // Patch d'une step spécifique
      await this.patchStep(existingPlan, input);
    } else {
      // Patch du plan (métadonnées et/ou détails)
      await this.patchPlan(existingPlan, input);
    }

    // Update plan metadata
    existingPlan.metadata.updatedAt = new Date();

    // Increment revision
    existingPlan.incrementRevision();

    // Persist the updated plan
    await this.repository.update(existingPlan.id, existingPlan);

    return this.toDTO(existingPlan);
  }

  private async patchPlan(plan: any, input: PatchPlanElementsInput): Promise<void> {
    // Apply partial updates to metadata
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

    // Apply partial updates to plan section
    if (input.plan) {
      if (input.plan.objective !== undefined) {
        plan.plan.objective = input.plan.objective;
      }
      if (input.plan.scope !== undefined) {
        plan.plan.scope = input.plan.scope;
      }
      if (input.plan.constraints !== undefined) {
        plan.plan.constraints = input.plan.constraints;
      }
      if (input.plan.assumptions !== undefined) {
        plan.plan.assumptions = input.plan.assumptions;
      }
      if (input.plan.successCriteria !== undefined) {
        plan.plan.successCriteria = input.plan.successCriteria;
      }
    }
  }

  private async patchStep(plan: any, input: PatchPlanElementsInput): Promise<void> {
    // Find the step to update
    const stepToUpdate = plan.steps.find(
      (step: any) => step.id.getValue() === input.stepId
    );

    if (!stepToUpdate) {
      throw new Error(`Step with ID ${input.stepId} not found in plan ${input.planId}`);
    }

    // Apply partial updates to the step
    if (input.title !== undefined) {
      stepToUpdate.title = input.title;
    }
    if (input.description !== undefined) {
      stepToUpdate.description = input.description;
    }
    if (input.kind !== undefined) {
      stepToUpdate.kind = input.kind as any;
    }
    if (input.status !== undefined) {
      stepToUpdate.status = input.status as any;
    }
    if (input.dependsOn !== undefined) {
      stepToUpdate.dependsOn = input.dependsOn.map((id) => new StepId(id));
    }
    if (input.estimatedDuration !== undefined) {
      stepToUpdate.estimatedDuration = input.estimatedDuration as any;
    }
    if (input.actions !== undefined) {
      stepToUpdate.actions = input.actions;
    }
    if (input.validation !== undefined) {
      stepToUpdate.validation = input.validation;
    }
  }

  private toDTO(plan: any): PlanDTO {
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
      },
      steps: plan.steps.map((step: any) => ({
        id: step.id.getValue(),
        title: step.title,
        description: step.description,
        kind: step.kind,
        status: step.status,
        dependsOn: step.dependsOn.map((id: any) => id.getValue()),
        estimatedDuration: step.estimatedDuration,
        actions: step.actions,
        validation: step.validation,
        comments: step.comments?.map((comment: any) => ({
          id: comment.id.getValue(),
          content: comment.content,
          author: comment.author,
          createdAt: comment.createdAt.toISOString(),
          updatedAt: comment.updatedAt ? comment.updatedAt.toISOString() : undefined,
        })),
        reviewStatus: step.reviewStatus ? {
          decision: step.reviewStatus.decision,
          timestamp: step.reviewStatus.timestamp.toISOString(),
          reviewer: step.reviewStatus.reviewer,
        } : undefined,
      })),
      createdAt: plan.createdAt.toISOString(),
      updatedAt: plan.updatedAt.toISOString(),
      revision: plan.revision,
      comments: plan.comments?.map((comment: any) => ({
        id: comment.id.getValue(),
        content: comment.content,
        author: comment.author,
        createdAt: comment.createdAt.toISOString(),
        updatedAt: comment.updatedAt ? comment.updatedAt.toISOString() : undefined,
      })),
    };
  }
}
