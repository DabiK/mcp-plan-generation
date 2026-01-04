import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { injectable, inject } from 'tsyringe';
import {
  ValidatePlanUseCase,
  CreatePlanUseCase,
  GetPlanUseCase,
  UpdatePlanUseCase,
  ListPlansUseCase,
  AddStepCommentUseCase,
  DeleteStepCommentUseCase,
  UpdateStepCommentUseCase,
  StepNavigationUseCases,
  AddPlanCommentUseCase,
  UpdatePlanCommentUseCase,
  DeletePlanCommentUseCase,
  GetPlanCommentsUseCase,
} from '../../application/use-cases';

@injectable()
export class McpServer {
  private server: Server;

  constructor(
    private validatePlanUseCase: ValidatePlanUseCase,
    private createPlanUseCase: CreatePlanUseCase,
    private getPlanUseCase: GetPlanUseCase,
    private updatePlanUseCase: UpdatePlanUseCase,
    private listPlansUseCase: ListPlansUseCase,
    private addStepCommentUseCase: AddStepCommentUseCase,
    private deleteStepCommentUseCase: DeleteStepCommentUseCase,
    private updateStepCommentUseCase: UpdateStepCommentUseCase,
    @inject(StepNavigationUseCases) private stepNavigationUseCases: StepNavigationUseCases,
    @inject(AddPlanCommentUseCase) private addPlanCommentUseCase: AddPlanCommentUseCase,
    @inject(UpdatePlanCommentUseCase) private updatePlanCommentUseCase: UpdatePlanCommentUseCase,
    @inject(DeletePlanCommentUseCase) private deletePlanCommentUseCase: DeletePlanCommentUseCase,
    @inject(GetPlanCommentsUseCase) private getPlanCommentsUseCase: GetPlanCommentsUseCase
  ) {
    this.server = new Server(
      {
        name: 'mcp-planflow',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
  }

  private setupHandlers(): void {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'plans-validate',
          description: 'Validate a plan against schema and business rules (dependencies, cycles, unique IDs)',
          inputSchema: {
            type: 'object',
            properties: {
              plan: {
                type: 'object',
                description: 'The plan object to validate',
              },
            },
            required: ['plan'],
          },
        },
        {
          name: 'plans-create',
          description: 'Create a new implementation plan',
          inputSchema: {
            type: 'object',
            properties: {
              planData: {
                type: 'object',
                description: 'Complete plan data following PlanFlow v1.1.0 schema',
              },
            },
            required: ['planData'],
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
          name: 'plans-update',
          description: 'Update an existing plan (metadata, details, or steps)',
          inputSchema: {
            type: 'object',
            properties: {
              planId: {
                type: 'string',
                description: 'The unique identifier of the plan',
              },
              updates: {
                type: 'object',
                description: 'Fields to update (metadata, plan, steps)',
              },
            },
            required: ['planId', 'updates'],
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
                    enum: ['id', 'index'],
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
          name: 'steps-navigate',
          description: 'Get the current or next available step (mode: "current"|"next")',
          inputSchema: {
            type: 'object',
            properties: {
              planId: {
                type: 'string',
                description: 'The unique identifier of the plan',
              },
              mode: {
                type: 'string',
                enum: ['current', 'next'],
                description: 'Navigation mode: current step being worked on or next available step',
              },
            },
            required: ['planId', 'mode'],
          },
        },
        {
          name: 'steps-context',
          description: 'Get step context: the step itself + dependencies + dependent steps',
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
            },
            required: ['planId', 'stepId'],
          },
        },
        {
          name: 'comments-manage',
          description: 'Get, add, update, or delete comments on plan or steps',
          inputSchema: {
            type: 'object',
            properties: {
              action: {
                type: 'string',
                enum: ['get', 'add', 'update', 'delete'],
                description: 'The action to perform on the comment',
              },
              target: {
                type: 'string',
                enum: ['plan', 'step'],
                description: 'Whether to comment on the plan or a specific step',
              },
              planId: {
                type: 'string',
                description: 'The unique identifier of the plan',
              },
              stepId: {
                type: 'string',
                description: 'The unique identifier of the step (required when target=step)',
              },
              commentId: {
                type: 'string',
                description: 'The comment ID (required for update/delete)',
              },
              content: {
                type: 'string',
                description: 'The comment content (required for add/update)',
              },
              author: {
                type: 'string',
                description: 'The author of the comment (optional for add)',
              },
            },
            required: ['action', 'target', 'planId'],
          },
        },
      ],
    }));

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        switch (request.params.name) {
          case 'plans-validate':
            return await this.handleValidatePlan(request.params.arguments);

          case 'plans-create':
            return await this.handleCreatePlan(request.params.arguments);

          case 'plans-get':
            return await this.handleGetPlan(request.params.arguments);

          case 'plans-update':
            return await this.handleUpdatePlan(request.params.arguments);

          case 'plans-list':
            return await this.handleListPlans(request.params.arguments);

          case 'steps-get':
            return await this.handleStepsGet(request.params.arguments);

          case 'steps-navigate':
            return await this.handleStepsNavigate(request.params.arguments);

          case 'steps-context':
            return await this.handleStepsContext(request.params.arguments);

          case 'comments-manage':
            return await this.handleCommentsManage(request.params.arguments);

          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${request.params.name}`
            );
        }
      } catch (error) {
        if (error instanceof McpError) {
          throw error;
        }
        throw new McpError(
          ErrorCode.InternalError,
          `Tool execution failed: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    });
  }

  // ==================== Plans Tools ====================

  private async handleValidatePlan(args: any) {
    if (!args?.plan) {
      throw new McpError(ErrorCode.InvalidParams, 'Missing required parameter: plan');
    }

    const result = await this.validatePlanUseCase.execute(args.plan);
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  private async handleCreatePlan(args: any) {
    if (!args?.planData) {
      throw new McpError(ErrorCode.InvalidParams, 'Missing required parameter: planData');
    }

    const result = await this.createPlanUseCase.execute(args.planData);
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  private async handleGetPlan(args: any) {
    if (!args?.planId) {
      throw new McpError(ErrorCode.InvalidParams, 'Missing required parameter: planId');
    }

    const result = await this.getPlanUseCase.execute(args.planId);
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  private async handleUpdatePlan(args: any) {
    if (!args?.planId || !args?.updates) {
      throw new McpError(
        ErrorCode.InvalidParams,
        'Missing required parameters: planId and updates'
      );
    }

    const result = await this.updatePlanUseCase.execute({
      planId: args.planId,
      ...args.updates,
    });
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  private async handleListPlans(args: any) {
    const result = await this.listPlansUseCase.execute(args || {});
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  // ==================== Steps Tools ====================

  private async handleStepsGet(args: any) {
    if (!args?.planId || !args?.selector?.by || args?.selector?.value === undefined) {
      throw new McpError(
        ErrorCode.InvalidParams,
        'Missing required parameters: planId and selector (by, value)'
      );
    }

    const { by, value } = args.selector;
    let result: any = null;

    if (by === 'index') {
      if (typeof value !== 'number') {
        throw new McpError(
          ErrorCode.InvalidParams,
          'selector.value must be a number when by="index"'
        );
      }
      result = await this.stepNavigationUseCases.getStepByIndex(args.planId, value);
    } else if (by === 'id') {
      if (typeof value !== 'string') {
        throw new McpError(
          ErrorCode.InvalidParams,
          'selector.value must be a string when by="id"'
        );
      }
      result = await this.stepNavigationUseCases.getStepById(args.planId, value);
    } else {
      throw new McpError(
        ErrorCode.InvalidParams,
        'selector.by must be either "id" or "index"'
      );
    }

    if (!result) {
      throw new McpError(ErrorCode.InvalidRequest, 'Step not found');
    }

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  private async handleStepsNavigate(args: any) {
    if (!args?.planId || !args?.mode) {
      throw new McpError(
        ErrorCode.InvalidParams,
        'Missing required parameters: planId and mode'
      );
    }

    const mode = args.mode as 'current' | 'next';
    let result: any = null;

    if (mode === 'current') {
      result = await this.stepNavigationUseCases.getCurrentStep(args.planId);
    } else if (mode === 'next') {
      result = await this.stepNavigationUseCases.getNextStep(args.planId);
    } else {
      throw new McpError(
        ErrorCode.InvalidParams,
        'mode must be either "current" or "next"'
      );
    }

    if (!result) {
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(
              { message: 'No step available for the requested mode.' },
              null,
              2
            ),
          },
        ],
      };
    }

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  private async handleStepsContext(args: any) {
    if (!args?.planId || !args?.stepId) {
      throw new McpError(
        ErrorCode.InvalidParams,
        'Missing required parameters: planId and stepId'
      );
    }

    const result = await this.stepNavigationUseCases.getStepContext(
      args.planId,
      args.stepId
    );

    if (!result) {
      throw new McpError(
        ErrorCode.InvalidRequest,
        `Step not found with id: ${args.stepId}`
      );
    }

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  // ==================== Comments Tool ====================

  private async handleCommentsManage(args: any) {
    if (!args?.action || !args?.target || !args?.planId) {
      throw new McpError(
        ErrorCode.InvalidParams,
        'Missing required parameters: action, target, planId'
      );
    }

    const { action, target, planId, stepId, commentId, content, author } = args;

    // Plan-level comments
    if (target === 'plan') {
      if (action === 'get') {
        const result = await this.getPlanCommentsUseCase.execute(planId);
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
        };
      } else if (action === 'add') {
        if (!content) {
          throw new McpError(ErrorCode.InvalidParams, 'Missing required parameter: content');
        }
        const result = await this.addPlanCommentUseCase.execute({ planId, content, author });
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
        };
      } else if (action === 'update') {
        if (!commentId || !content) {
          throw new McpError(
            ErrorCode.InvalidParams,
            'Missing required parameters: commentId and content'
          );
        }
        const result = await this.updatePlanCommentUseCase.execute({
          planId,
          commentId,
          content,
        });
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
        };
      } else if (action === 'delete') {
        if (!commentId) {
          throw new McpError(ErrorCode.InvalidParams, 'Missing required parameter: commentId');
        }
        const result = await this.deletePlanCommentUseCase.execute({ planId, commentId });
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
        };
      }
    }

    // Step-level comments
    else if (target === 'step') {
      if (!stepId) {
        throw new McpError(ErrorCode.InvalidParams, 'Missing required parameter: stepId');
      }

      if (action === 'get') {
        // Get the step which includes its comments
        const step = await this.stepNavigationUseCases.getStepById(planId, stepId);
        if (!step) {
          throw new McpError(ErrorCode.InvalidRequest, `Step not found with id: ${stepId}`);
        }
        const comments = (step as any).comments || [];
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(comments, null, 2) }],
        };
      } else if (action === 'add') {
        if (!content) {
          throw new McpError(ErrorCode.InvalidParams, 'Missing required parameter: content');
        }
        const result = await this.addStepCommentUseCase.execute({
          planId,
          stepId,
          content,
          author,
        });
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
        };
      } else if (action === 'update') {
        if (!commentId || !content) {
          throw new McpError(
            ErrorCode.InvalidParams,
            'Missing required parameters: commentId and content'
          );
        }
        const result = await this.updateStepCommentUseCase.execute({
          planId,
          stepId,
          commentId,
          content,
        });
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
        };
      } else if (action === 'delete') {
        if (!commentId) {
          throw new McpError(ErrorCode.InvalidParams, 'Missing required parameter: commentId');
        }
        const result = await this.deleteStepCommentUseCase.execute({
          planId,
          stepId,
          commentId,
        });
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
        };
      }
    }

    throw new McpError(
      ErrorCode.InvalidParams,
      'Invalid action or target. Use action: get|add|update|delete and target: plan|step'
    );
  }

  // ==================== Server Lifecycle ====================

  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('MCP PlanFlow server started');
  }
}
