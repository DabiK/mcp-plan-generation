import { injectable, inject } from 'tsyringe';
import { nanoid } from 'nanoid';
import { Plan } from '../entities/Plan';
import { Step, StepReviewStatus } from '../entities/Step';
import { PlanId } from '../value-objects/PlanId';
import { StepId } from '../value-objects/StepId';
import { PlanType } from '../value-objects/PlanType';
import { PlanStatus } from '../value-objects/PlanStatus';
import { StepStatus } from '../value-objects/StepStatus';
import { StepKind } from '../value-objects/StepKind';
import { ValidationError } from '../errors/ValidationError';
import { PlanNotFoundError } from '../errors/PlanNotFoundError';
import { BusinessRulesValidator } from './BusinessRulesValidator';

// Import Ports
import type { IPlanRepository } from '../../application/ports/out/IPlanRepository';
import type { IValidationPort } from '../../application/ports/out/IValidationPort';
import type {
  IPlanCreation,
  CreatePlanDraftInput,
  CreatePlanDraftOutput,
  FinalizePlanOutput,
  ValidatePlanInput,
  ValidatePlanOutput,
} from '../../application/ports/in/IPlanCreation';
import type {
  IPlanRetrieval,
  PlanFilters,
  PlanOutput,
  PlanListOutput,
  PlanFormatOutput,
} from '../../application/ports/in/IPlanRetrieval';
import type {
  IStepManagement,
  AddStepInput,
  UpdateStepInput,
  RemoveStepInput,
  SetReviewStatusInput,
  StepOperationOutput,
  StepCommentInput,
  StepCommentOutput,
  AddStepCommentInput,
  UpdateStepCommentInput,
  DeleteStepCommentInput,
} from '../../application/ports/in/IStepManagement';
import type {
  IPlanModification,
  UpdateMetadataInput,
  PatchElementsInput,
  PlanCommentOutput,
  AddPlanCommentInput,
  UpdatePlanCommentInput,
  DeletePlanCommentInput,
  UpdatePlanInput,
} from '../../application/ports/in/IPlanModification';

/**
 * Domain Service - Implémente tous les Ports In (Use Cases)
 * Utilise les Ports Out (Repositories, Validation)
 * 
 * NE connaît PAS:
 * - Infrastructure (MongoDB, HTTP, MCP)
 * - DTOs (mappés par l'Infrastructure)
 */
@injectable()
export class PlanManagementService
  implements IPlanCreation, IPlanRetrieval, IStepManagement, IPlanModification
{
  constructor(
    @inject('IPlanRepository')
    private readonly planRepository: IPlanRepository,

    @inject('IValidationPort')
    private readonly validationPort: IValidationPort,

    private readonly businessValidator: BusinessRulesValidator
  ) {}

  // ========== IPlanCreation ==========

  async createDraft(input: CreatePlanDraftInput): Promise<CreatePlanDraftOutput> {
    const planId = new PlanId(nanoid());
    const now = new Date();

    const plan = new Plan(
      planId,
      '1.1.0',
      input.planType as PlanType,
      PlanStatus.DRAFT,
      {
        title: input.metadata.title,
        description: input.metadata.description,
        author: input.metadata.author || 'Unknown',
        createdAt: now,
        updatedAt: now,
        tags: input.metadata.tags || [],
        revision: 0,
      },
      {
        objective: input.objective,
        scope: input.scope || '',
        constraints: input.constraints || [],
        assumptions: input.assumptions || [],
        successCriteria: input.successCriteria || [],
      },
      [],
      now,
      now,
      0
    );

    this.businessValidator.validateMetadata(plan.metadata);

    await this.planRepository.save(plan);

    return {
      plan,
      planId: plan.id.getValue(),
    };
  }

  async finalizeDraft(planId: string): Promise<FinalizePlanOutput> {
    const plan = await this.getPlanOrThrow(planId);

    this.businessValidator.validateCanFinalize(plan);

    const validationResult = await this.validationPort.validatePlanSchema(plan);
    if (!validationResult.isValid) {
      throw new ValidationError('Plan validation failed', validationResult.errors);
    }

    plan.status = PlanStatus.ACTIVE;
    plan.updatedAt = new Date();
    plan.revision++;

    await this.planRepository.update(plan.id, plan);

    return { plan };
  }

  // ========== IPlanRetrieval ==========

  async getById(planId: string): Promise<PlanOutput> {
    const plan = await this.getPlanOrThrow(planId);
    return { plan };
  }

  async list(filters?: PlanFilters): Promise<PlanListOutput> {
    const plans = await this.planRepository.findAll(filters);
    return { plans };
  }

  async getFormat(): Promise<PlanFormatOutput> {
    const schema = require('../../infrastructure/validation/schemas/plan-v1.1.0.json');
    return { schema };
  }

  // ========== IStepManagement ==========

  async addStep(input: AddStepInput): Promise<StepOperationOutput> {
    const plan = await this.getPlanOrThrow(input.planId);

    const step = new Step(
      new StepId(input.step.id),
      input.step.title,
      input.step.description,
      input.step.kind as StepKind,
      (input.step.status as StepStatus) || StepStatus.PENDING,
      (input.step.dependsOn || []).map(id => new StepId(id)),
      input.step.estimatedDuration as any, // Type conversion handled by Infrastructure
      input.step.actions,
      input.step.validation,
      [],
      undefined,
      input.step.diagram
    );

    const stepValidation = await this.validationPort.validateStepSchema(step);
    if (!stepValidation.isValid) {
      throw new ValidationError('Step validation failed', stepValidation.errors);
    }

    if (step.diagram) {
      const diagramValidation = await this.validationPort.validateMermaidDiagram(
        step.diagram.type,
        step.diagram.content
      );
      if (!diagramValidation.isValid) {
        throw new ValidationError('Diagram validation failed', diagramValidation.errors);
      }
    }

    this.businessValidator.validateStepUniqueness(plan, step.id);
    this.businessValidator.validateDependencies(plan, step.dependsOn);
    this.businessValidator.validateNoCycles(plan, step);

    plan.steps.push(step);
    plan.updatedAt = new Date();
    plan.revision++;

    await this.planRepository.update(plan.id, plan);

    return { plan, step };
  }

  async updateStep(input: UpdateStepInput): Promise<StepOperationOutput> {
    const plan = await this.getPlanOrThrow(input.planId);
    const stepId = new StepId(input.stepId);
    const existingStep = plan.getStep(stepId);

    if (!existingStep) {
      throw new ValidationError('Step not found', [`Step ${input.stepId} not found`]);
    }

    const updatedStep = new Step(
      existingStep.id,
      input.updates.title ?? existingStep.title,
      input.updates.description ?? existingStep.description,
      (input.updates.kind as StepKind) ?? existingStep.kind,
      (input.updates.status as StepStatus) ?? existingStep.status,
      input.updates.dependsOn
        ? input.updates.dependsOn.map(id => new StepId(id))
        : existingStep.dependsOn,
      (input.updates.estimatedDuration as any) ?? existingStep.estimatedDuration,
      input.updates.actions ?? existingStep.actions,
      input.updates.validation ?? existingStep.validation,
      existingStep.comments,
      existingStep.reviewStatus,
      input.updates.diagram ?? existingStep.diagram
    );

    const stepValidation = await this.validationPort.validateStepSchema(updatedStep);
    if (!stepValidation.isValid) {
      throw new ValidationError('Step validation failed', stepValidation.errors);
    }

    if (updatedStep.diagram) {
      const diagramValidation = await this.validationPort.validateMermaidDiagram(
        updatedStep.diagram.type,
        updatedStep.diagram.content
      );
      if (!diagramValidation.isValid) {
        throw new ValidationError('Diagram validation failed', diagramValidation.errors);
      }
    }

    const stepIndex = plan.steps.findIndex(s => s.id.equals(stepId));
    plan.steps[stepIndex] = updatedStep;
    plan.updatedAt = new Date();
    plan.revision++;

    await this.planRepository.update(plan.id, plan);

    return { plan, step: updatedStep };
  }

  async removeStep(input: RemoveStepInput): Promise<StepOperationOutput> {
    const plan = await this.getPlanOrThrow(input.planId);
    const stepId = new StepId(input.stepId);

    const stepToRemove = plan.getStep(stepId);
    if (!stepToRemove) {
      throw new ValidationError('Step not found', [`Step ${input.stepId} not found`]);
    }

    const mode = input.mode || 'strict';
    const dependentSteps = plan.steps.filter(s =>
      s.dependsOn.some(depId => depId.equals(stepId))
    );

    if (dependentSteps.length > 0 && mode === 'strict') {
      throw new ValidationError(
        'Cannot remove step with dependencies',
        [`Step ${input.stepId} is referenced by other steps`]
      );
    }

    if (mode === 'cascade') {
      for (const step of dependentSteps) {
        const updatedDependencies = step.dependsOn.filter(id => !id.equals(stepId));
        const stepIndex = plan.steps.findIndex(s => s.id.equals(step.id));
        if (stepIndex !== -1) {
          plan.steps[stepIndex] = new Step(
            step.id,
            step.title,
            step.description,
            step.kind,
            step.status,
            updatedDependencies,
            step.estimatedDuration,
            step.actions,
            step.validation,
            step.comments,
            step.reviewStatus,
            step.diagram
          );
        }
      }
    }

    plan.steps = plan.steps.filter(s => !s.id.equals(stepId));
    plan.updatedAt = new Date();
    plan.revision++;

    await this.planRepository.update(plan.id, plan);

    return { plan };
  }

  async setReviewStatus(input: SetReviewStatusInput): Promise<StepOperationOutput> {
    const plan = await this.getPlanOrThrow(input.planId);
    const stepId = new StepId(input.stepId);
    const step = plan.getStep(stepId);

    if (!step) {
      throw new ValidationError('Step not found', [`Step ${input.stepId} not found`]);
    }

    const reviewStatus: StepReviewStatus = {
      decision: input.status as 'approved' | 'rejected' | 'skipped',
      timestamp: new Date(),
      reviewer: input.comment,
    };

    step.reviewStatus = reviewStatus;
    plan.updatedAt = new Date();
    plan.revision++;

    await this.planRepository.update(plan.id, plan);

    return { plan, step };
  }

  // ========== IPlanModification ==========

  async updateMetadata(input: UpdateMetadataInput): Promise<PlanOutput> {
    const plan = await this.getPlanOrThrow(input.planId);

    if (input.metadata) {
      Object.assign(plan.metadata, {
        ...input.metadata,
        updatedAt: new Date(),
      });
    }

    if (input.planDetails) {
      Object.assign(plan.plan, input.planDetails);
    }

    this.businessValidator.validateMetadata(plan.metadata);

    plan.updatedAt = new Date();
    plan.revision++;

    await this.planRepository.update(plan.id, plan);

    return { plan };
  }

  async patchElements(input: PatchElementsInput): Promise<PlanOutput> {
    const plan = await this.getPlanOrThrow(input.planId);

    if (input.stepId) {
      return this.updateStep({
        planId: input.planId,
        stepId: input.stepId,
        updates: {
          title: input.title,
          description: input.description,
          kind: input.kind,
          status: input.status,
          dependsOn: input.dependsOn,
          estimatedDuration: input.estimatedDuration,
          actions: input.actions,
          validation: input.validation,
        },
      });
    } else {
      return this.updateMetadata({
        planId: input.planId,
        metadata: input.metadata,
        planDetails: input.plan,
      });
    }
  }

  // ========== Helpers Privés ==========

  private async getPlanOrThrow(planId: string): Promise<Plan> {
    const plan = await this.planRepository.findById(new PlanId(planId));
    if (!plan) {
      throw new PlanNotFoundError(planId);
    }
    return plan;
  }

  // ========== IPlanCreation - validatePlan ==========

  async validatePlan(input: ValidatePlanInput): Promise<ValidatePlanOutput> {
    try {
      await this.validationPort.validate(input.plan);
      return { valid: true };
    } catch (error) {
      if (error instanceof ValidationError) {
        return {
          valid: false,
          errors: error.errors || [error.message],
        };
      }
      throw error;
    }
  }

  // ========== IPlanModification - updatePlan and deletePlan ==========

  async updatePlan(input: UpdatePlanInput): Promise<PlanOutput> {
    const plan = await this.getPlanOrThrow(input.planId);
    
    // Validate the updates
    await this.validationPort.validate(input.updates);
    
    // Update the plan - this is a full update
    // In a real implementation, you'd map the updates to the Plan entity
    // For now, we'll save the existing plan
    await this.planRepository.update(new PlanId(input.planId), plan);
    
    return { plan };
  }

  async deletePlan(planId: string): Promise<void> {
    const plan = await this.getPlanOrThrow(planId);
    await this.planRepository.delete(new PlanId(planId));
  }

  // ========== IStepManagement - Step Comment Management ==========

  async addStepComment(input: AddStepCommentInput): Promise<StepCommentOutput> {
    const plan = await this.getPlanOrThrow(input.planId);
    const step = plan.getStep(new StepId(input.stepId));
    
    if (!step) {
      throw new Error(`Step ${input.stepId} not found in plan ${input.planId}`);
    }

    const commentId = nanoid();
    const now = new Date();
    const comment = {
      id: commentId,
      content: input.comment.content,
      author: input.comment.author,
      createdAt: now.toISOString(),
    };

    // Add to repository
    await this.planRepository.addStepComment(input.planId, input.stepId, comment);

    return comment;
  }

  async updateStepComment(input: UpdateStepCommentInput): Promise<StepCommentOutput> {
    const plan = await this.getPlanOrThrow(input.planId);
    const step = plan.getStep(new StepId(input.stepId));
    
    if (!step) {
      throw new Error(`Step ${input.stepId} not found in plan ${input.planId}`);
    }

    const comment = step.comments?.find(c => c.id === input.commentId);
    if (!comment) {
      throw new Error(`Comment ${input.commentId} not found in step ${input.stepId}`);
    }

    // Update in repository
    await this.planRepository.updateStepComment(input.planId, input.stepId, input.commentId, input.content);

    const now = new Date();
    return {
      id: comment.id,
      content: input.content,
      author: comment.author || 'unknown',
      createdAt: comment.createdAt instanceof Date ? comment.createdAt.toISOString() : comment.createdAt,
      updatedAt: now.toISOString(),
    };
  }

  async deleteStepComment(input: DeleteStepCommentInput): Promise<void> {
    const plan = await this.getPlanOrThrow(input.planId);
    const step = plan.getStep(new StepId(input.stepId));
    
    if (!step) {
      throw new Error(`Step ${input.stepId} not found in plan ${input.planId}`);
    }

    await this.planRepository.deleteStepComment(input.planId, input.stepId, input.commentId);
  }

  // ========== IPlanModification - Plan Comment Management ==========

  async getPlanComments(planId: string): Promise<PlanCommentOutput[]> {
    const plan = await this.getPlanOrThrow(planId);
    
    return plan.comments.map(c => ({
      id: c.id,
      content: c.content,
      author: c.author,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt?.toISOString(),
    }));
  }

  async addPlanComment(input: AddPlanCommentInput): Promise<PlanCommentOutput> {
    const plan = await this.getPlanOrThrow(input.planId);

    const commentId = nanoid();
    const now = new Date();
    const comment = {
      id: commentId,
      content: input.comment.content,
      author: input.comment.author,
      createdAt: now.toISOString(),
    };

    // Add to repository
    await this.planRepository.addPlanComment(input.planId, comment);

    return comment;
  }

  async updatePlanComment(input: UpdatePlanCommentInput): Promise<PlanCommentOutput> {
    const plan = await this.getPlanOrThrow(input.planId);
    
    const comment = plan.comments.find(c => c.id === input.commentId);
    if (!comment) {
      throw new Error(`Comment ${input.commentId} not found in plan ${input.planId}`);
    }

    // Update in repository
    await this.planRepository.updatePlanComment(input.planId, input.commentId, input.content);

    const now = new Date();
    return {
      id: comment.id,
      content: input.content,
      author: comment.author,
      createdAt: comment.createdAt.toISOString(),
      updatedAt: now.toISOString(),
    };
  }

  async deletePlanComment(input: DeletePlanCommentInput): Promise<void> {
    const plan = await this.getPlanOrThrow(input.planId);
    
    const comment = plan.comments.find(c => c.id === input.commentId || (c as any)._id === input.commentId);
    if (!comment) {
      throw new Error(`Comment ${input.commentId} not found in plan ${input.planId}`);
    }

    await this.planRepository.deletePlanComment(input.planId, input.commentId);
  }
}
