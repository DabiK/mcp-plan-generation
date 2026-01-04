import { inject, injectable } from 'tsyringe';
import { IPlanRepository } from '../../domain/repositories/IPlanRepository';
import { PlanId } from '../../domain/value-objects/PlanId';
import {
  AddPlanCommentInputDTO,
  DeletePlanCommentInputDTO,
  UpdatePlanCommentInputDTO,
  PlanCommentOperationResultDTO,
  PlanCommentDTO,
} from '../dtos/PlanCommentDTO';
import { randomUUID } from 'crypto';

@injectable()
export class AddPlanCommentUseCase {
  constructor(
    @inject('IPlanRepository') private planRepository: IPlanRepository
  ) {}

  async execute(input: AddPlanCommentInputDTO): Promise<PlanCommentOperationResultDTO> {
    try {
      const planId = new PlanId(input.planId);
      
      const comment: PlanCommentDTO = {
        id: randomUUID(),
        content: input.content,
        author: input.author,
        createdAt: new Date().toISOString()
      };

      const success = await this.planRepository.addPlanComment(
        planId.getValue(),
        comment
      );

      if (success) {
        return {
          success: true,
          comment
        };
      }

      return {
        success: false,
        message: 'Failed to add comment to plan'
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

@injectable()
export class UpdatePlanCommentUseCase {
  constructor(
    @inject('IPlanRepository') private planRepository: IPlanRepository
  ) {}

  async execute(input: UpdatePlanCommentInputDTO): Promise<PlanCommentOperationResultDTO> {
    try {
      const planId = new PlanId(input.planId);

      const success = await this.planRepository.updatePlanComment(
        planId.getValue(),
        input.commentId,
        input.content
      );

      if (success) {
        return { success: true };
      }

      return {
        success: false,
        message: 'Failed to update plan comment'
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

@injectable()
export class DeletePlanCommentUseCase {
  constructor(
    @inject('IPlanRepository') private planRepository: IPlanRepository
  ) {}

  async execute(input: DeletePlanCommentInputDTO): Promise<PlanCommentOperationResultDTO> {
    try {
      const planId = new PlanId(input.planId);

      const success = await this.planRepository.deletePlanComment(
        planId.getValue(),
        input.commentId
      );

      if (success) {
        return { success: true };
      }

      return {
        success: false,
        message: 'Failed to delete plan comment'
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

@injectable()
export class GetPlanCommentsUseCase {
  constructor(
    @inject('IPlanRepository') private planRepository: IPlanRepository
  ) {}

  async execute(planId: string): Promise<PlanCommentDTO[]> {
    try {
      const id = new PlanId(planId);
      return await this.planRepository.getPlanComments(id.getValue());
    } catch (error) {
      console.error('Error getting plan comments:', error);
      return [];
    }
  }
}
