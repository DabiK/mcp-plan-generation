import { injectable, inject } from 'tsyringe';
import { IPlanRepository } from '../../domain/repositories/IPlanRepository';
import {
  AddStepCommentInputDTO,
  DeleteStepCommentInputDTO,
  UpdateStepCommentInputDTO,
  StepCommentOperationResultDTO,
  StepCommentDTO,
} from '../dtos/StepCommentDTO';
import { randomUUID } from 'crypto';
import { PlanId } from '../../domain/value-objects/PlanId';

@injectable()
export class AddStepCommentUseCase {
  constructor(
    @inject('IPlanRepository') private planRepository: IPlanRepository
  ) {}

  async execute(input: AddStepCommentInputDTO): Promise<StepCommentOperationResultDTO> {
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

      // Créer le commentaire
      const comment: StepCommentDTO = {
        id: randomUUID(),
        stepId: input.stepId,
        content: input.content,
        author: input.author,
        createdAt: new Date().toISOString(),
      };

      // Ajouter le commentaire au step via le repository
      const success = await this.planRepository.addStepComment(
        input.planId,
        input.stepId,
        comment
      );

      if (success) {
        return {
          success: true,
          comment,
          message: 'Comment added successfully',
        };
      } else {
        return {
          success: false,
          message: 'Failed to add comment',
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `Error adding comment: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }
}

@injectable()
export class DeleteStepCommentUseCase {
  constructor(
    @inject('IPlanRepository') private planRepository: IPlanRepository
  ) {}

  async execute(input: DeleteStepCommentInputDTO): Promise<StepCommentOperationResultDTO> {
    try {
      const success = await this.planRepository.deleteStepComment(
        input.planId,
        input.stepId,
        input.commentId
      );

      if (success) {
        return {
          success: true,
          message: 'Comment deleted successfully',
        };
      } else {
        return {
          success: false,
          message: 'Failed to delete comment',
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `Error deleting comment: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }
}

@injectable()
export class UpdateStepCommentUseCase {
  constructor(
    @inject('IPlanRepository') private planRepository: IPlanRepository
  ) {}

  async execute(input: UpdateStepCommentInputDTO): Promise<StepCommentOperationResultDTO> {
    try {
      const success = await this.planRepository.updateStepComment(
        input.planId,
        input.stepId,
        input.commentId,
        input.content
      );

      if (success) {
        return {
          success: true,
          message: 'Comment updated successfully',
        };
      } else {
        return {
          success: false,
          message: 'Failed to update comment',
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `Error updating comment: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }
}
