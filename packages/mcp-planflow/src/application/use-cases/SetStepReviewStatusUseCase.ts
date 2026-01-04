import { injectable, inject } from 'tsyringe';
import { IPlanRepository } from '../../domain/repositories/IPlanRepository';
import { PlanId } from '../../domain/value-objects/PlanId';
import { StepReviewStatus } from '../../domain/entities/Step';

export interface SetStepReviewStatusInputDTO {
  planId: string;
  stepId: string;
  decision: 'approved' | 'rejected' | 'skipped';
  reviewer?: string;
}

export interface SetStepReviewStatusResultDTO {
  success: boolean;
  message?: string;
}

@injectable()
export class SetStepReviewStatusUseCase {
  constructor(
    @inject('IPlanRepository') private planRepository: IPlanRepository
  ) {}

  async execute(input: SetStepReviewStatusInputDTO): Promise<SetStepReviewStatusResultDTO> {
    try {
      // Récupérer le plan
      const plan = await this.planRepository.findById(new PlanId(input.planId));
      if (!plan) {
        return {
          success: false,
          message: `Plan with ID ${input.planId} not found`,
        };
      }

      // Trouver le step
      const step = plan.steps.find((s: any) => s.id.getValue() === input.stepId);
      if (!step) {
        return {
          success: false,
          message: `Step with ID ${input.stepId} not found in plan ${input.planId}`,
        };
      }

      // Créer le reviewStatus
      const reviewStatus: StepReviewStatus = {
        decision: input.decision,
        timestamp: new Date(),
        reviewer: input.reviewer,
      };

      // Mettre à jour le reviewStatus via le repository
      const success = await this.planRepository.setStepReviewStatus(
        input.planId,
        input.stepId,
        reviewStatus
      );

      if (!success) {
        return {
          success: false,
          message: 'Failed to set review status',
        };
      }

      return {
        success: true,
        message: 'Review status set successfully',
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'An error occurred while setting review status',
      };
    }
  }
}
