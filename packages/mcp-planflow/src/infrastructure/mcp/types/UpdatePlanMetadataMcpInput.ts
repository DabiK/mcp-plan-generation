import { SchemaProperty } from '../decorators/schema-metadata';
import type { UpdatePlanMetadataInput } from '../../../application/use-cases/UpdatePlanMetadataUseCase';

/**
 * MCP Input Type for plans-update-metadata tool
 * Infrastructure layer - adapts MCP parameters to domain structure
 */
export class UpdatePlanMetadataMcpInput {
  @SchemaProperty({
    type: 'string',
    description: 'The unique identifier of the plan',
    required: true
  })
  planId!: string;

  @SchemaProperty({
    type: 'object',
    description: 'Partial metadata updates (optional)',
    properties: {
      title: { type: 'string', description: 'Plan title' },
      description: { type: 'string', description: 'Plan description' },
      author: { type: 'string', description: 'Plan author' },
      tags: { type: 'array', items: { type: 'string' }, description: 'Plan tags' }
    }
  })
  metadata?: Partial<{
    title: string;
    description: string;
    author: string;
    tags: string[];
  }>;

  @SchemaProperty({
    type: 'object',
    description: 'Partial plan details updates (optional)',
    properties: {
      objective: { type: 'string', description: 'Plan objective' },
      scope: { type: 'string', description: 'Plan scope' },
      constraints: { type: 'array', items: { type: 'string' }, description: 'Constraints' },
      assumptions: { type: 'array', items: { type: 'string' }, description: 'Assumptions' },
      successCriteria: { type: 'array', items: { type: 'string' }, description: 'Success criteria' }
    }
  })
  planDetails?: Partial<{
    objective: string;
    scope: string;
    constraints: string[];
    assumptions: string[];
    successCriteria: string[];
  }>;

  /**
   * Transforms MCP Input to Domain Input
   */
  toDomain(): UpdatePlanMetadataInput {
    return {
      planId: this.planId,
      metadata: this.metadata,
      planDetails: this.planDetails,
    };
  }
}
