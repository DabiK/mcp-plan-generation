import { SchemaProperty } from '../decorators/schema-metadata';
import { StepMcpInputDTO } from './StepMcpInputDTO';
import type { AddStepToPlanInput } from '../../../application/use-cases/AddStepToPlanUseCase';

/**
 * MCP Input Type for plans-step-add tool
 * Infrastructure layer - adapts MCP parameters to domain structure
 */
export class AddStepToPlanMcpInput {
  @SchemaProperty({
    type: 'string',
    description: 'The unique identifier of the plan',
    required: true
  })
  planId!: string;

  @SchemaProperty({
    type: 'object',
    description: 'The step to add (must include id, title, description, kind, status)',
    required: true,
    nestedClass: StepMcpInputDTO
  })
  step!: StepMcpInputDTO;

  /**
   * Creates instance from raw MCP arguments
   * Handles nested StepMcpInputDTO construction
   */
  static fromMcpArgs(args: any): AddStepToPlanMcpInput {
    const input = new AddStepToPlanMcpInput();
    input.planId = args.planId;
    input.step = StepMcpInputDTO.fromMcpArgs(args.step);
    return input;
  }

  /**
   * Transforms MCP Input to Domain Input
   * Delegates step transformation to StepMcpInputDTO.toDomain()
   */
  toDomain(): AddStepToPlanInput {
    return {
      planId: this.planId,
      step: this.step.toDomain(),
    };
  }
}
