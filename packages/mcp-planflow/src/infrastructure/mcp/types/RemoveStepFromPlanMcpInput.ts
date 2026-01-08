import { SchemaProperty } from '../decorators/schema-metadata';
import { STEP_REMOVAL_MODE_VALUES } from '../mcp-schema-constants';
import { enumToDescription } from '../schema-generator';
import type { RemoveStepFromPlanInput } from '../../../application/use-cases/RemoveStepFromPlanUseCase';

/**
 * MCP Input Type for plans-remove-step tool
 * Infrastructure layer - adapts MCP parameters to domain structure
 */
export class RemoveStepFromPlanMcpInput {
  @SchemaProperty({
    type: 'string',
    description: 'The unique identifier of the plan',
    required: true
  })
  planId!: string;

  @SchemaProperty({
    type: 'string',
    description: 'The unique identifier of the step to remove',
    required: true
  })
  stepId!: string;

  @SchemaProperty({
    type: 'string',
    description: enumToDescription(STEP_REMOVAL_MODE_VALUES, 'Removal mode: '),
    enum: STEP_REMOVAL_MODE_VALUES
  })
  mode?: 'strict' | 'cascade';

  /**
   * Transforms MCP Input to Domain Input
   */
  toDomain(): RemoveStepFromPlanInput {
    return {
      planId: this.planId,
      stepId: this.stepId,
      mode: this.mode,
    };
  }
}
