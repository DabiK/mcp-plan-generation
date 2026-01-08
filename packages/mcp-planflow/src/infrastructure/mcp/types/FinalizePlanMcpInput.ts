import { SchemaProperty } from '../decorators/schema-metadata';
import type { FinalizePlanInput } from '../../../application/use-cases/FinalizePlanUseCase';

/**
 * MCP Input Type for plans-finalize tool
 * Infrastructure layer - adapts MCP parameters to domain structure
 */
export class FinalizePlanMcpInput {
  @SchemaProperty({
    type: 'string',
    description: 'The unique identifier of the draft plan to finalize',
    required: true
  })
  planId!: string;

  /**
   * Transforms MCP Input to Domain Input
   */
  toDomain(): FinalizePlanInput {
    return {
      planId: this.planId,
    };
  }
}
