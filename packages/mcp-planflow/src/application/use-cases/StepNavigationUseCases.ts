import { injectable, inject } from 'tsyringe';
import { IPlanRepository } from '../../domain/repositories/IPlanRepository';
import { PlanId } from '../../domain/value-objects/PlanId';
import { Step } from '../../domain/entities/Step';
import { StepStatus } from '../../domain/value-objects/StepStatus';
import { StepDTO, StepWithStatusDTO, StepStatusDTO } from '../dtos';

@injectable()
export class StepNavigationUseCases {
  constructor(@inject('IPlanRepository') private planRepository: IPlanRepository) {}

  /**
   * Get the current step being implemented based on currentStepIndex
   */
  async getCurrentStep(planIdString: string): Promise<StepDTO | null> {
    const planId = new PlanId(planIdString);
    const plan = await this.planRepository.findById(planId);
    
    if (!plan) {
      return null;
    }
    // Until implementation.currentStepIndex exists, infer current as first available step
    for (const step of plan.steps) {
      if (!this.isCompletedOrSkipped(step) && this.areDependenciesSatisfied(step, plan.steps)) {
        return this.toStepDTO(step);
      }
    }
    return null;
  }

  /**
   * Get the next step available for implementation
   * - Must not be done/skipped
   * - Dependencies must be satisfied
   */
  async getNextStep(planIdString: string): Promise<StepDTO | null> {
    const planId = new PlanId(planIdString);
    const plan = await this.planRepository.findById(planId);
    
    if (!plan) {
      return null;
    }
    // Find first step that is not completed/skipped and has dependencies satisfied
    for (const step of plan.steps) {
      if (this.isCompletedOrSkipped(step)) {
        continue;
      }
      const depsSatisfied = this.areDependenciesSatisfied(step, plan.steps);
      if (depsSatisfied) {
        return this.toStepDTO(step);
      }
    }
    return null;
  }

  /**
   * Get step by its index (0-based)
   */
  async getStepByIndex(planIdString: string, index: number): Promise<StepDTO | null> {
    const planId = new PlanId(planIdString);
    const plan = await this.planRepository.findById(planId);
    
    if (!plan) {
      return null;
    }

    if (index < 0 || index >= plan.steps.length) {
      return null;
    }
    return this.toStepDTO(plan.steps[index]);
  }

  /**
   * Get step by its unique ID
   */
  async getStepById(planIdString: string, stepId: string): Promise<StepDTO | null> {
    const planId = new PlanId(planIdString);
    const plan = await this.planRepository.findById(planId);
    
    if (!plan) {
      return null;
    }
    const step = plan.steps.find((s: Step) => s.id.getValue() === stepId);
    return step ? this.toStepDTO(step) : null;
  }

  /**
   * Get all steps with their current status
   */
  async getAllSteps(planIdString: string): Promise<StepDTO[]> {
    const planId = new PlanId(planIdString);
    const plan = await this.planRepository.findById(planId);
    
    if (!plan) {
      return [];
    }
    return plan.steps.map((s) => this.toStepDTO(s));
  }

  /**
   * Get step details including all information
   */
  async getStepDetails(planIdString: string, stepId: string): Promise<StepDTO | null> {
    return this.getStepById(planIdString, stepId);
  }

  /**
   * Get only the actions of a specific step
   */
  async getStepActions(planIdString: string, stepId: string): Promise<any[] | null> {
    const step = await this.getStepById(planIdString, stepId);
    return step ? step.actions : null;
  }

  /**
   * Helper: Check if all dependencies are satisfied
   */
  private areDependenciesSatisfied(step: Step, allSteps: Step[]): boolean {
    if (!step.dependsOn || step.dependsOn.length === 0) {
      return true;
    }
    for (const depId of step.dependsOn) {
      const depStep = allSteps.find((s: Step) => s.id.equals(depId));
      if (!depStep) {
        return false;
      }
      if (depStep.status !== StepStatus.COMPLETED) {
        return false;
      }
    }
    return true;
  }

  private isCompletedOrSkipped(step: Step): boolean {
    return step.status === StepStatus.COMPLETED || step.status === StepStatus.SKIPPED;
  }

  private toStepDTO(step: Step): StepDTO {
    return {
      id: step.id.getValue(),
      title: step.title,
      description: step.description,
      kind: step.kind,
      status: step.status,
      dependsOn: step.dependsOn.map((id) => id.getValue()),
      estimatedDuration: step.estimatedDuration,
      actions: step.actions,
      validation: step.validation,
    };
  }

  private toStepWithStatusDTO(step: Step): StepWithStatusDTO {
    return {
      id: step.id.getValue(),
      title: step.title,
      description: step.description,
      kind: step.kind,
      status: this.mapStatus(step.status),
      dependsOn: step.dependsOn.map((id) => id.getValue()),
      estimatedDuration: step.estimatedDuration,
      actions: step.actions,
      validation: step.validation,
    };
  }

  private mapStatus(status: StepStatus): StepStatusDTO {
    const state: StepStatusDTO['state'] =
      status === StepStatus.COMPLETED ? 'done' :
      status === StepStatus.IN_PROGRESS ? 'in-progress' :
      status === StepStatus.SKIPPED ? 'skipped' :
      status === StepStatus.BLOCKED ? 'blocked' :
      status === StepStatus.FAILED ? 'blocked' :
      'pending';
    return { state };
  }
}
