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
  GetPlanFormatUseCase,
  ValidatePlanUseCase,
  CreatePlanUseCase,
  GetPlanUseCase,
  UpdatePlanUseCase,
  ListPlansUseCase,
} from '../../application/use-cases';

@injectable()
export class McpServer {
  private server: Server;

  constructor(
    private getPlanFormatUseCase: GetPlanFormatUseCase,
    private validatePlanUseCase: ValidatePlanUseCase,
    private createPlanUseCase: CreatePlanUseCase,
    private getPlanUseCase: GetPlanUseCase,
    private updatePlanUseCase: UpdatePlanUseCase,
    private listPlansUseCase: ListPlansUseCase
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
          name: 'get-plan-format',
          description:
            'Get the PlanFlow JSON schema format specification, including version, constraints, and examples',
          inputSchema: {
            type: 'object',
            properties: {},
            required: [],
          },
        },
        {
          name: 'validate-plan',
          description:
            'Validate a PlanFlow implementation plan against the JSON schema and business rules (cyclic dependencies, etc.)',
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
          name: 'create-plan',
          description: 'Create a new implementation plan in the database',
          inputSchema: {
            type: 'object',
            properties: {
              planData: {
                type: 'object',
                description: 'The complete plan data following PlanFlow schema',
              },
            },
            required: ['planData'],
          },
        },
        {
          name: 'get-plan',
          description: 'Retrieve a specific implementation plan by its ID',
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
          name: 'update-plan',
          description: 'Update an existing implementation plan',
          inputSchema: {
            type: 'object',
            properties: {
              planId: {
                type: 'string',
                description: 'The unique identifier of the plan to update',
              },
              updates: {
                type: 'object',
                description: 'The fields to update (metadata, plan, steps)',
              },
            },
            required: ['planId', 'updates'],
          },
        },
        {
          name: 'list-plans',
          description: 'List implementation plans with optional filters',
          inputSchema: {
            type: 'object',
            properties: {
              planType: {
                type: 'string',
                description: 'Filter by plan type (feature, bugfix, refactor, etc.)',
              },
              status: {
                type: 'string',
                description: 'Filter by step status (pending, in_progress, completed, etc.)',
              },
              limit: {
                type: 'number',
                description: 'Maximum number of plans to return',
              },
              offset: {
                type: 'number',
                description: 'Number of plans to skip (for pagination)',
              },
            },
            required: [],
          },
        },
      ],
    }));

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        switch (request.params.name) {
          case 'get-plan-format':
            return await this.handleGetPlanFormat();

          case 'validate-plan':
            return await this.handleValidatePlan(request.params.arguments);

          case 'create-plan':
            return await this.handleCreatePlan(request.params.arguments);

          case 'get-plan':
            return await this.handleGetPlan(request.params.arguments);

          case 'update-plan':
            return await this.handleUpdatePlan(request.params.arguments);

          case 'list-plans':
            return await this.handleListPlans(request.params.arguments);

          default:
            throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${request.params.name}`);
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

  private async handleGetPlanFormat() {
    const result = await this.getPlanFormatUseCase.execute();
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

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
      throw new McpError(ErrorCode.InvalidParams, 'Missing required parameters: planId and updates');
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

  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('MCP PlanFlow server started');
  }
}
