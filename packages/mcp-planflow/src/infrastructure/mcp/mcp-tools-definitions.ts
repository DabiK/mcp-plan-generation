import {
  STEP_KIND_VALUES,
  STEP_STATUS_VALUES,
  STEP_REVIEW_DECISION_VALUES,
  PLAN_TYPE_VALUES,
  COMMENT_ACTION_VALUES,
  COMMENT_TARGET_VALUES,
  STEP_NAVIGATION_MODE_VALUES,
  STEP_SELECTOR_BY_VALUES,
  STEP_REMOVAL_MODE_VALUES,
} from './mcp-schema-constants';
import { generateMcpSchema, enumToDescription } from './schema-generator';

// MCP Input Types for incremental workflow
import { CreatePlanDraftMcpInput } from './types/CreatePlanDraftMcpInput';
import { AddStepToPlanMcpInput } from './types/AddStepToPlanMcpInput';

// Keep legacy descriptions for non-migrated tools
const STEP_KIND_DESCRIPTION = enumToDescription(STEP_KIND_VALUES, 'Step kind: ');
const STEP_STATUS_DESCRIPTION = enumToDescription(STEP_STATUS_VALUES, 'Step status: ');
const PLAN_TYPE_DESCRIPTION = enumToDescription(PLAN_TYPE_VALUES, 'Type of plan: ');
const STEP_REVIEW_DECISION_DESCRIPTION = enumToDescription(
  STEP_REVIEW_DECISION_VALUES,
  'Review decision: '
);

export const MCP_TOOLS = [
  {
    name: 'plans-review-ui',
    description: 'Open the Plan Review MCP App UI for a given plan (VS Code will render an interactive view when supported).',
    inputSchema: {
      type: 'object',
      properties: {
        planId: {
          type: 'string',
          description: 'The unique identifier of the plan',
        },
      },
      required: ['planId'],
    },
    _meta: {
      ui: {
        resourceUri: 'ui://planflow/plan-review.html',
        visibility: ['model', 'app'],
      },
    },
  },
  {
    name: 'plans-format',
    description: 'Get the PlanFlow schema specification (v1.1.0) with field descriptions, valid values, and examples',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'plan-context-format',
    description: 'Get the context schema specification (v1.0.0) for plan file context',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'plans-get',
    description: 'Fetch a plan by ID including all steps, step comments, and plan-level comments',
    inputSchema: {
      type: 'object',
      properties: {
        planId: {
          type: 'string',
          description: 'The unique identifier of the plan',
        },
      },
      required: ['planId'],
    },
  },
  {
    name: 'plans-patch',
    description: 'Atomically update any part of a plan: metadata, plan details, or a specific step. If stepId is provided, updates that step; otherwise updates plan-level fields.',
    inputSchema: {
      type: 'object',
      properties: {
        planId: {
          type: 'string',
          description: 'The unique identifier of the plan',
        },
        stepId: {
          type: 'string',
          description: 'The step ID to update (optional). If provided, other step-related fields will be applied to this step.',
        },
        // Plan-level fields (used when stepId is NOT provided)
        metadata: {
          type: 'object',
          description: 'Partial metadata updates (only when stepId is not provided)',
          properties: {
            title: { type: 'string', description: 'Plan title' },
            description: { type: 'string', description: 'Plan description' },
            author: { type: 'string', description: 'Plan author' },
            tags: { type: 'array', items: { type: 'string' }, description: 'Plan tags' },
          },
        },
        plan: {
          type: 'object',
          description: 'Partial plan details updates (only when stepId is not provided)',
          properties: {
            objective: { type: 'string', description: 'Plan objective' },
            scope: { type: 'string', description: 'Plan scope' },
            constraints: { type: 'array', items: { type: 'string' }, description: 'Constraints' },
            assumptions: { type: 'array', items: { type: 'string' }, description: 'Assumptions' },
            successCriteria: { type: 'array', items: { type: 'string' }, description: 'Success criteria' },
          },
        },
        // Step-level fields (used when stepId IS provided)
        title: { type: 'string', description: 'Step title (only when stepId is provided)' },
        description: { type: 'string', description: 'Step description (only when stepId is provided)' },
        kind: { type: 'string', description: `${STEP_KIND_DESCRIPTION} (only when stepId is provided)` },
        status: { type: 'string', description: `${STEP_STATUS_DESCRIPTION} (only when stepId is provided)` },
        dependsOn: { type: 'array', items: { type: 'string' }, description: 'Step dependencies as array of step IDs (only when stepId is provided)' },
        estimatedDuration: { 
          type: 'object', 
          description: 'Estimated duration (only when stepId is provided)',
          properties: {
            value: { type: 'number', description: 'Duration value' },
            unit: { type: 'string', description: 'Duration unit (e.g., hours, days, minutes)' },
          },
        },
        actions: { 
          type: 'array',
          description: 'Actions to perform (only when stepId is provided). Supported types: create_file, edit_file, delete_file, run_command, test, review, documentation, custom',
          items: {
            type: 'object',
            properties: {
              type: { 
                type: 'string',
                description: 'Action type: create_file, edit_file, delete_file, run_command, test, review, documentation, custom',
              },
              description: { type: 'string', description: 'Action description' },
              filePath: { type: 'string', description: 'File path (for file operations)' },
              content: { type: 'string', description: 'File content (for create_file)' },
              before: { type: 'string', description: 'Content before edit (for edit_file)' },
              after: { type: 'string', description: 'Content after edit (for edit_file)' },
              command: { type: 'string', description: 'Command to run (for run_command)' },
              testCommand: { type: 'string', description: 'Test command (for test)' },
              testFiles: { type: 'array', items: { type: 'string' }, description: 'Test files (for test)' },
              checklistItems: { type: 'array', items: { type: 'string' }, description: 'Checklist items (for review)' },
              sections: { type: 'array', items: { type: 'string' }, description: 'Documentation sections (for documentation)' },
              payload: { type: 'object', description: 'Additional custom data' },
            },
            required: ['type'],
          },
        },
        validation: {
          type: 'object',
          description: 'Validation criteria (only when stepId is provided)',
          properties: {
            criteria: { type: 'array', items: { type: 'string' } },
            automatedTests: { type: 'array', items: { type: 'string' } },
          },
        },
      },
      required: ['planId'],
    },
  },
  {
    name: 'plans-list',
    description: 'List plans with optional filters (planType, status, pagination)',
    inputSchema: {
      type: 'object',
      properties: {
        planType: {
          type: 'string',
          description: 'Filter by plan type',
        },
        status: {
          type: 'string',
          description: 'Filter by step status',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of plans to return',
        },
        offset: {
          type: 'number',
          description: 'Number of plans to skip (pagination)',
        },
      },
      required: [],
    },
  },
  {
    name: 'steps-get',
    description: 'Get a step by ID or index with selector: { by: "id"|"index", value: string|number }',
    inputSchema: {
      type: 'object',
      properties: {
        planId: {
          type: 'string',
          description: 'The unique identifier of the plan',
        },
        selector: {
          type: 'object',
          description: 'Selector to identify the step',
          properties: {
            by: {
              type: 'string',
              enum: STEP_SELECTOR_BY_VALUES,
              description: 'Selection mode: by step ID or array index',
            },
            value: {
              description: 'The step ID (string) or index (number)',
            },
          },
          required: ['by', 'value'],
        },
      },
      required: ['planId', 'selector'],
    },
  },
  {
    name: 'steps-review-set',
    description: 'Set the review decision for a step (approved/rejected/skipped).',
    inputSchema: {
      type: 'object',
      properties: {
        planId: {
          type: 'string',
          description: 'The unique identifier of the plan',
        },
        stepId: {
          type: 'string',
          description: 'The unique identifier of the step',
        },
        decision: {
          type: 'string',
          enum: STEP_REVIEW_DECISION_VALUES,
          description: STEP_REVIEW_DECISION_DESCRIPTION,
        },
        reviewer: {
          type: 'string',
          description: 'Optional reviewer identifier (e.g., your name/handle)',
        },
      },
      required: ['planId', 'stepId', 'decision'],
    },
  },
  {
    name: 'steps-comment-add',
    description: 'Add a comment to a step.',
    inputSchema: {
      type: 'object',
      properties: {
        planId: { type: 'string', description: 'The unique identifier of the plan' },
        stepId: { type: 'string', description: 'The unique identifier of the step' },
        content: { type: 'string', description: 'Comment content' },
        author: { type: 'string', description: 'Comment author' },
      },
      required: ['planId', 'stepId', 'content', 'author'],
    },
  },
  {
    name: 'steps-comment-update',
    description: 'Update an existing step comment.',
    inputSchema: {
      type: 'object',
      properties: {
        planId: { type: 'string', description: 'The unique identifier of the plan' },
        stepId: { type: 'string', description: 'The unique identifier of the step' },
        commentId: { type: 'string', description: 'The unique identifier of the comment' },
        content: { type: 'string', description: 'Updated comment content' },
      },
      required: ['planId', 'stepId', 'commentId', 'content'],
    },
  },
  {
    name: 'steps-comment-delete',
    description: 'Delete a step comment.',
    inputSchema: {
      type: 'object',
      properties: {
        planId: { type: 'string', description: 'The unique identifier of the plan' },
        stepId: { type: 'string', description: 'The unique identifier of the step' },
        commentId: { type: 'string', description: 'The unique identifier of the comment' },
      },
      required: ['planId', 'stepId', 'commentId'],
    },
  },
  {
    name: 'plans-comment-add',
    description: 'Add a plan-level comment.',
    inputSchema: {
      type: 'object',
      properties: {
        planId: { type: 'string', description: 'The unique identifier of the plan' },
        content: { type: 'string', description: 'Comment content' },
        author: { type: 'string', description: 'Comment author' },
      },
      required: ['planId', 'content', 'author'],
    },
  },
  {
    name: 'plans-comment-update',
    description: 'Update a plan-level comment.',
    inputSchema: {
      type: 'object',
      properties: {
        planId: { type: 'string', description: 'The unique identifier of the plan' },
        commentId: { type: 'string', description: 'The unique identifier of the comment' },
        content: { type: 'string', description: 'Updated comment content' },
      },
      required: ['planId', 'commentId', 'content'],
    },
  },
  {
    name: 'plans-comment-delete',
    description: 'Delete a plan-level comment.',
    inputSchema: {
      type: 'object',
      properties: {
        planId: { type: 'string', description: 'The unique identifier of the plan' },
        commentId: { type: 'string', description: 'The unique identifier of the comment' },
      },
      required: ['planId', 'commentId'],
    },
  },
  {
    name: 'plan-context-set',
    description: 'Attach or update file context to a plan (list of file paths without content)',
    inputSchema: {
      type: 'object',
      properties: {
        planId: {
          type: 'string',
          description: 'The unique identifier of the plan',
        },
        files: {
          type: 'array',
          description: 'List of files to attach to the plan',
          items: {
            type: 'object',
            properties: {
              path: {
                type: 'string',
                description: 'Absolute file path (must start with /)',
              },
              purpose: {
                type: 'string',
                description: 'Why this file is relevant to the plan (preferred)',
              },
              title: {
                type: 'string',
                description: 'Optional file title (accepted for backward compatibility)',
              },
              summary: {
                type: 'string',
                description: 'Optional file summary (accepted for backward compatibility)',
              },
              lastModified: {
                type: 'string',
                description: 'Optional ISO 8601 date string',
              },
            },
            required: ['path'],
          },
        },
      },
      required: ['planId', 'files'],
    },
  },
  {
    name: 'plan-context-get',
    description: 'Get the file context attached to a plan',
    inputSchema: {
      type: 'object',
      properties: {
        planId: {
          type: 'string',
          description: 'The unique identifier of the plan',
        },
      },
      required: ['planId'],
    },
  },
  {
    name: 'plan-context-delete',
    description: 'Remove all file context from a plan',
    inputSchema: {
      type: 'object',
      properties: {
        planId: {
          type: 'string',
          description: 'The unique identifier of the plan',
        },
      },
      required: ['planId'],
    },
  },
  {
    name: 'plans-create-draft',
    description: 'Create a new draft plan with metadata only (no steps required). Use this as the first step in incremental plan creation.',
    // ✅ Schema generated from CreatePlanDraftMcpInput type
    inputSchema: generateMcpSchema(CreatePlanDraftMcpInput),
  },
  {
    name: 'plans-step-add',
    description: 'Add a new step to an existing plan (draft or active). The step is validated against the schema.',
    // ✅ Schema generated from AddStepToPlanMcpInput type
    inputSchema: generateMcpSchema(AddStepToPlanMcpInput),
  },
  {
    name: 'plans-update-step',
    description: 'Update an existing step in a plan. Only provided fields will be updated (partial update).',
    inputSchema: {
      type: 'object',
      properties: {
        planId: {
          type: 'string',
          description: 'The unique identifier of the plan',
        },
        stepId: {
          type: 'string',
          description: 'The unique identifier of the step to update',
        },
        updates: {
          type: 'object',
          description: 'Partial step data to update (all fields optional)',
          properties: {
            title: { type: 'string', description: 'Step title' },
            description: { type: 'string', description: 'Step description' },
            kind: { 
              type: 'string', 
              enum: STEP_KIND_VALUES,
              description: STEP_KIND_DESCRIPTION,
            },
            status: { 
              type: 'string',
              enum: STEP_STATUS_VALUES,
              description: STEP_STATUS_DESCRIPTION,
            },
            dependsOn: { 
              type: 'array', 
              items: { type: 'string' }, 
              description: 'Array of step IDs this step depends on' 
            },
            estimatedDuration: { 
              type: 'object',
              properties: {
                value: { type: 'number', description: 'Duration value' },
                unit: { type: 'string', description: 'Duration unit (e.g., hours, days, minutes)' },
              },
            },
            actions: { 
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  type: { type: 'string' },
                  description: { type: 'string' },
                  filePath: { type: 'string' },
                  content: { type: 'string' },
                },
                required: ['type'],
              },
            },
            validation: {
              type: 'object',
              properties: {
                criteria: { type: 'array', items: { type: 'string' } },
                automatedTests: { type: 'array', items: { type: 'string' } },
              },
            },
          },
        },
      },
      required: ['planId', 'stepId', 'updates'],
    },
  },
  {
    name: 'plans-remove-step',
    description: 'Remove a step from a plan. Can cascade-remove dependent steps or fail if dependencies exist (strict mode).',
    inputSchema: {
      type: 'object',
      properties: {
        planId: {
          type: 'string',
          description: 'The unique identifier of the plan',
        },
        stepId: {
          type: 'string',
          description: 'The unique identifier of the step to remove',
        },
        mode: {
          type: 'string',
          enum: STEP_REMOVAL_MODE_VALUES,
          description: enumToDescription(STEP_REMOVAL_MODE_VALUES, 'Removal mode: ') + ' (default: strict)',
        },
      },
      required: ['planId', 'stepId'],
    },
  },
  {
    name: 'plans-update-metadata',
    description: 'Update plan metadata (title, description, author, tags) and plan details (objective, scope, etc.) without touching steps.',
    inputSchema: {
      type: 'object',
      properties: {
        planId: {
          type: 'string',
          description: 'The unique identifier of the plan',
        },
        metadata: {
          type: 'object',
          description: 'Partial metadata updates (optional, all fields optional)',
          properties: {
            title: { type: 'string', description: 'Plan title' },
            description: { type: 'string', description: 'Plan description' },
            author: { type: 'string', description: 'Plan author' },
            tags: { 
              type: 'array', 
              items: { type: 'string' }, 
              description: 'Plan tags' 
            },
          },
        },
        plan: {
          type: 'object',
          description: 'Partial plan details updates (optional, all fields optional)',
          properties: {
            objective: { type: 'string', description: 'Plan objective' },
            scope: { type: 'string', description: 'Plan scope' },
            constraints: { 
              type: 'array', 
              items: { type: 'string' }, 
              description: 'Plan constraints' 
            },
            assumptions: { 
              type: 'array', 
              items: { type: 'string' }, 
              description: 'Plan assumptions' 
            },
            successCriteria: { 
              type: 'array', 
              items: { type: 'string' }, 
              description: 'Success criteria' 
            },
          },
        },
      },
      required: ['planId'],
    },
  },
  {
    name: 'plans-finalize',
    description: 'Finalize a draft plan to active status. Validates that the plan has steps and passes full validation. Cannot be used on non-draft plans.',
    inputSchema: {
      type: 'object',
      properties: {
        planId: {
          type: 'string',
          description: 'The unique identifier of the draft plan to finalize',
        },
      },
      required: ['planId'],
    },
  },
];
