import { injectable, inject } from 'tsyringe';
import { IPlanRepository } from '../../domain/repositories/IPlanRepository';
import { PlanValidator } from '../../infrastructure/validation/PlanValidator';
import { PlanDTO, StepAction } from '../dtos';
import { Plan, Step } from '../../domain/entities';
import { StepId, PlanId } from '../../domain/value-objects';
import { PlanNotFoundError } from '../../domain/errors/PlanNotFoundError';

export interface UpdatePlanInput {
  planId: string;
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
  steps?: Array<{
    id: string;
    title: string;
    description: string;
    kind: string;
    status: string;
    dependsOn: string[];
    estimatedDuration?: string;
    actions?: StepAction[];
    validation?: {
      criteria: string[];
      method: string;
    };
  }>;
}

@injectable()
export class UpdatePlanUseCase {
  constructor(
    @inject('IPlanRepository') private repository: IPlanRepository,
    @inject('PlanValidator') private validator: PlanValidator
  ) {}

  async execute(input: UpdatePlanInput): Promise<PlanDTO> {
    // Retrieve existing plan
    const existingPlan = await this.repository.findById(new PlanId(input.planId));
    if (!existingPlan) {
      throw new PlanNotFoundError(input.planId);
    }

    // Build updated plan data for validation
    const updatedPlanData = this.buildUpdatedPlanData(existingPlan, input);

    // Validate the updated plan
    const validationResult = await this.validator.validate(updatedPlanData);
    if (!validationResult.isValid) {
      throw new Error(`Plan validation failed: ${JSON.stringify(validationResult.errors)}`);
    }

    // Apply updates to the existing plan
    this.applyUpdates(existingPlan, input);

    // Increment revision
    existingPlan.incrementRevision();

    // Persist the updated plan
    await this.repository.update(existingPlan.id, existingPlan);

    return this.toDTO(existingPlan);
  }

  private buildUpdatedPlanData(existingPlan: Plan, input: UpdatePlanInput): any {
    return {
      schemaVersion: existingPlan.schemaVersion,
      planType: existingPlan.planType,
      metadata: {
        title: input.metadata?.title ?? existingPlan.metadata.title,
        description: input.metadata?.description ?? existingPlan.metadata.description,
        author: input.metadata?.author ?? existingPlan.metadata.author,
        createdAt: existingPlan.metadata.createdAt.toISOString(),
        updatedAt: new Date().toISOString(),
        tags: input.metadata?.tags ?? existingPlan.metadata.tags,
        revision: existingPlan.metadata.revision + 1,
      },
      plan: {
        objective: input.plan?.objective ?? existingPlan.plan.objective,
        scope: input.plan?.scope ?? existingPlan.plan.scope,
        constraints: input.plan?.constraints ?? existingPlan.plan.constraints,
        assumptions: input.plan?.assumptions ?? existingPlan.plan.assumptions,
        successCriteria: input.plan?.successCriteria ?? existingPlan.plan.successCriteria,
      },
      steps: input.steps ?? existingPlan.steps.map((step) => ({
        id: step.id.getValue(),
        title: step.title,
        description: step.description,
        kind: step.kind,
        status: step.status,
        dependsOn: step.dependsOn.map((id) => id.getValue()),
        estimatedDuration: step.estimatedDuration,
        actions: step.actions,
        validation: step.validation,
      })),
    };
  }

  private applyUpdates(plan: Plan, input: UpdatePlanInput): void {
    // Update metadata
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
      plan.metadata.updatedAt = new Date();
    }

    // Update plan section
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

    // Update steps
    if (input.steps) {
      // Remove all existing steps
      for (const step of [...plan.steps]) {
        plan.removeStep(step.id);
      }

      // Add new steps
      for (const stepData of input.steps) {
        const step = new Step(
          new StepId(stepData.id),
          stepData.title,
          stepData.description,
          stepData.kind as any,
          stepData.status as any,
          stepData.dependsOn.map((id) => new StepId(id)),
          stepData.estimatedDuration as any,
          stepData.actions,
          stepData.validation
        );
        plan.addStep(step);
      }
    }
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
