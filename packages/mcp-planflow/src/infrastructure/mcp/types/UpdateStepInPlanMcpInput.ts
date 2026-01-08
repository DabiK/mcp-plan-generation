import { SchemaProperty } from '../decorators/schema-metadata';
import type { UpdateStepInPlanInput } from '../../../application/use-cases/UpdateStepInPlanUseCase';
import { STEP_KIND_VALUES, STEP_STATUS_VALUES } from '../mcp-schema-constants';
import { enumToDescription } from '../schema-generator';

/**
 * Partial Step DTO for updates - all fields are optional
 */
export class PartialStepUpdateDTO {
  @SchemaProperty({
    type: 'string',
    description: 'Step title'
  })
  title?: string;

  @SchemaProperty({
    type: 'string',
    description: 'Step description'
  })
  description?: string;

  @SchemaProperty({
    type: 'string',
    description: enumToDescription(STEP_KIND_VALUES, 'Step kind: '),
    enum: STEP_KIND_VALUES
  })
  kind?: string;

  @SchemaProperty({
    type: 'string',
    description: enumToDescription(STEP_STATUS_VALUES, 'Step status: '),
    enum: STEP_STATUS_VALUES
  })
  status?: string;

  @SchemaProperty({
    type: 'array',
    description: 'Array of step IDs this step depends on',
    items: { type: 'string' }
  })
  dependsOn?: string[];

  @SchemaProperty({
    type: 'object',
    description: 'Estimated duration',
    properties: {
      value: { type: 'number', description: 'Duration value' },
      unit: { type: 'string', description: 'Duration unit (e.g., hours, days, minutes)' }
    }
  })
  estimatedDuration?: {
    value: number;
    unit: string;
  };

  @SchemaProperty({
    type: 'array',
    description: 'Actions to perform in this step',
    items: { type: 'object' }
  })
  actions?: any[];

  @SchemaProperty({
    type: 'object',
    description: 'Validation criteria for this step',
    properties: {
      criteria: { type: 'array', items: { type: 'string' } },
      automatedTests: { type: 'array', items: { type: 'string' } }
    }
  })
  validation?: {
    criteria?: string[];
    automatedTests?: string[];
  };

  @SchemaProperty({
    type: 'object',
    description: 'Optional Mermaid diagram for step-specific visualization',
    properties: {
      type: {
        type: 'string',
        enum: ['flowchart', 'sequence', 'class', 'er', 'gantt', 'state'],
        description: 'Mermaid diagram type'
      },
      content: {
        type: 'string',
        description: 'Mermaid diagram syntax content'
      },
      description: {
        type: 'string',
        description: 'Optional description of the diagram'
      }
    }
  })
  diagram?: {
    type: 'flowchart' | 'sequence' | 'class' | 'er' | 'gantt' | 'state';
    content: string;
    description?: string;
  };
}

/**
 * MCP Input Type for plans-update-step tool
 * Infrastructure layer - adapts MCP parameters to domain structure
 */
export class UpdateStepInPlanMcpInput {
  @SchemaProperty({
    type: 'string',
    description: 'The unique identifier of the plan',
    required: true
  })
  planId!: string;

  @SchemaProperty({
    type: 'string',
    description: 'The unique identifier of the step to update',
    required: true
  })
  stepId!: string;

  @SchemaProperty({
    type: 'object',
    description: 'Partial step data to update (only provided fields will be updated)',
    required: true,
    nestedClass: PartialStepUpdateDTO
  })
  updates!: PartialStepUpdateDTO;

  /**
   * Transforms MCP Input to Domain Input
   */
  toDomain(): UpdateStepInPlanInput {
    // Nettoyer null en undefined pour validation (accepté à l'entrée mais normalisé)
    const cleanedUpdates: any = { ...this.updates };
    if (cleanedUpdates.validation === null) {
      delete cleanedUpdates.validation;
    }
    
    return {
      planId: this.planId,
      stepId: this.stepId,
      updates: cleanedUpdates,
    };
  }
}
