import { SchemaProperty } from '../decorators/schema-metadata';
import { PLAN_TYPE_VALUES } from '../mcp-schema-constants';
import { enumToDescription } from '../schema-generator';
import type { CreatePlanDraftInputDTO } from '../../../application/dtos/CreatePlanDraftDTO';

/**
 * MCP Input Type for plans-create-draft tool
 * Infrastructure layer - adapts MCP flat parameters to domain structure
 */
export class CreatePlanDraftMcpInput {
  @SchemaProperty({
    type: 'string',
    description: enumToDescription(PLAN_TYPE_VALUES, 'Type of plan: '),
    required: true,
    enum: PLAN_TYPE_VALUES
  })
  planType!: string;

  @SchemaProperty({
    type: 'string',
    description: 'Plan title',
    required: true
  })
  title!: string;

  @SchemaProperty({
    type: 'string',
    description: 'Plan description',
    required: true
  })
  description!: string;

  @SchemaProperty({
    type: 'string',
    description: 'Plan author (optional)'
  })
  author?: string;

  @SchemaProperty({
    type: 'array',
    description: 'Plan tags (optional)',
    items: { type: 'string' }
  })
  tags?: string[];

  @SchemaProperty({
    type: 'string',
    description: 'Plan objective',
    required: true
  })
  objective!: string;

  @SchemaProperty({
    type: 'string',
    description: 'Plan scope (optional)'
  })
  scope?: string;

  @SchemaProperty({
    type: 'array',
    description: 'Plan constraints (optional)',
    items: { type: 'string' }
  })
  constraints?: string[];

  @SchemaProperty({
    type: 'array',
    description: 'Plan assumptions (optional)',
    items: { type: 'string' }
  })
  assumptions?: string[];

  @SchemaProperty({
    type: 'array',
    description: 'Success criteria (optional)',
    items: { type: 'string' }
  })
  successCriteria?: string[];

  /**
   * Creates instance from raw MCP arguments
   * Simplifies mapping in McpServer handlers
   */
  static fromMcpArgs(args: any): CreatePlanDraftMcpInput {
    return Object.assign(new CreatePlanDraftMcpInput(), args);
  }

  /**
   * Transforms MCP Input (Infrastructure) to Domain Input (Use Case)
   * This method encapsulates the mapping logic between layers
   */
  toDomain(): CreatePlanDraftInputDTO {
    return {
      planType: this.planType,
      metadata: {
        title: this.title,
        description: this.description,
        author: this.author,
        tags: this.tags,
      },
      objective: this.objective,
      scope: this.scope,
      constraints: this.constraints,
      assumptions: this.assumptions,
      successCriteria: this.successCriteria,
    };
  }
}
