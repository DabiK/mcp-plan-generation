import { SchemaProperty } from '../decorators/schema-metadata';
import { STEP_KIND_VALUES, STEP_STATUS_VALUES } from '../mcp-schema-constants';
import { enumToDescription } from '../schema-generator';
import type { StepInput } from '../../../application/ports/in/IStepManagement';

/**
 * MCP DTO for Step data in AddStepToPlan tool
 * Represents a complete step with all its properties
 */
export class StepMcpInputDTO {
  @SchemaProperty({
    type: 'string',
    description: 'Unique step identifier',
    required: true
  })
  id!: string;

  @SchemaProperty({
    type: 'string',
    description: 'Step title',
    required: true
  })
  title!: string;

  @SchemaProperty({
    type: 'string',
    description: 'Step description',
    required: true
  })
  description!: string;

  @SchemaProperty({
    type: 'string',
    description: enumToDescription(STEP_KIND_VALUES, 'Step kind: '),
    required: true,
    enum: STEP_KIND_VALUES
  })
  kind!: string;

  @SchemaProperty({
    type: 'string',
    description: enumToDescription(STEP_STATUS_VALUES, 'Step status: '),
    required: true,
    enum: STEP_STATUS_VALUES
  })
  status!: string;

  @SchemaProperty({
    type: 'array',
    description: 'Array of step IDs this step depends on (optional)',
    items: { type: 'string' }
  })
  dependsOn?: string[];

  @SchemaProperty({
    type: 'object',
    description: 'Estimated duration (optional)',
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
    description: 'Actions to perform in this step (optional)',
    items: { type: 'object' }
  })
  actions?: any[];

  @SchemaProperty({
    type: 'object',
    description: 'Validation criteria for this step (optional)',
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

  /**
   * Creates instance from raw MCP arguments
   */
  static fromMcpArgs(args: any): StepMcpInputDTO {
    return Object.assign(new StepMcpInputDTO(), args);
  }

  /**
   * Transforms MCP DTO to Domain StepInput (Port In interface)
   * Returns the same structure expected by IStepManagement port
   */
  toDomain(): StepInput {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      kind: this.kind,
      status: this.status,
      dependsOn: this.dependsOn || [],
      estimatedDuration: this.estimatedDuration,
      actions: this.actions || [],
      validation: this.validation === null ? undefined : this.validation,
      diagram: this.diagram,
    };
  }
}
