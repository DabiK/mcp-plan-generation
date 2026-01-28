import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import fs from 'node:fs/promises';
import path from 'node:path';
import { injectable, inject } from 'tsyringe';
import { Plan } from '../../domain/entities/Plan';
import {
  // Keep only non-plan-management use cases
  GetPlanFormatUseCase,
  StepNavigationUseCases,
  SetPlanContextUseCase,
  GetPlanContextUseCase,
  DeletePlanContextUseCase,
} from '../../application/use-cases';
import { PatchPlanElementsUseCase } from '../../application/use-cases/PatchPlanElementsUseCase';
import { MCP_TOOLS } from './mcp-tools-definitions';

// Import Ports In for hexagonal architecture
import { 
  IPlanCreation, 
  IPlanRetrieval, 
  IStepManagement, 
  IPlanModification 
} from '../../application/ports/in';
import { DTOMapper } from '../mappers/DTOMapper';

// MCP Input Types (Infrastructure layer)
import { CreatePlanDraftMcpInput, AddStepToPlanMcpInput, StepMcpInputDTO } from './types';

@injectable()
export class McpServer {
  private server: Server;

  private static readonly PLAN_REVIEW_UI_URI = 'ui://planflow/plan-review.html';
  private static readonly PLAN_REVIEW_UI_DIST_RELATIVE_PATH = path.join(
    'dist',
    'apps',
    'plan-review',
    'mcp-app.html'
  );

  constructor(
    // Hexagonal architecture: inject Ports In instead of individual use cases
    @inject('IPlanCreation') private planCreation: IPlanCreation,
    @inject('IPlanRetrieval') private planRetrieval: IPlanRetrieval,
    @inject('IStepManagement') private stepManagement: IStepManagement,
    @inject('IPlanModification') private planModification: IPlanModification,
    private dtoMapper: DTOMapper,
    
    // Keep non-plan-management use cases
    @inject(GetPlanFormatUseCase) private getPlanFormatUseCase: GetPlanFormatUseCase,
    @inject(StepNavigationUseCases) private stepNavigationUseCases: StepNavigationUseCases,
    @inject(PatchPlanElementsUseCase) private patchPlanElementsUseCase: PatchPlanElementsUseCase,
    @inject(SetPlanContextUseCase) private setPlanContextUseCase: SetPlanContextUseCase,
    @inject(GetPlanContextUseCase) private getPlanContextUseCase: GetPlanContextUseCase,
    @inject(DeletePlanContextUseCase) private deletePlanContextUseCase: DeletePlanContextUseCase
  ) {
    this.server = new Server(
      {
        name: 'mcp-planflow',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
          resources: {},
        },
      }
    );

    this.setupHandlers();
  }

  private setupHandlers(): void {
    // List available resources (including MCP Apps UI resources)
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => ({
      resources: [
        {
          uri: McpServer.PLAN_REVIEW_UI_URI,
          name: 'Plan Review UI',
          description: 'MCP App UI for reviewing plans and code inside the host chat.',
          mimeType: 'text/html',
        },
      ],
    }));

    // Serve UI resources
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const uri = request.params.uri;

      if (uri !== McpServer.PLAN_REVIEW_UI_URI) {
        throw new McpError(ErrorCode.InvalidRequest, `Unknown resource: ${uri}`);
      }

      return {
        contents: [
          {
            uri,
            mimeType: 'text/html',
            text: await this.getPlanReviewHtml(),
          },
        ],
      };
    });

    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: MCP_TOOLS,
    }));

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        switch (request.params.name) {
          case 'plans-review-ui':
            // For P0: reuse the existing plans-get payload as the initial tool result.
            // The host will render the UI resource referenced in the tool metadata.
            return await this.handleGetPlan(request.params.arguments);

          case 'steps-review-set':
            return await this.handleSetStepReviewDecision(request.params.arguments);

          case 'steps-comment-add':
            return await this.handleAddStepComment(request.params.arguments);

          case 'steps-comment-update':
            return await this.handleUpdateStepComment(request.params.arguments);

          case 'steps-comment-delete':
            return await this.handleDeleteStepComment(request.params.arguments);

          case 'plans-comment-add':
            return await this.handleAddPlanComment(request.params.arguments);

          case 'plans-comment-update':
            return await this.handleUpdatePlanComment(request.params.arguments);

          case 'plans-comment-delete':
            return await this.handleDeletePlanComment(request.params.arguments);

          case 'plans-format':
            return await this.handleGetPlanFormat(request.params.arguments);

          case 'plan-context-format':
            return await this.handleGetContextFormat(request.params.arguments);

          case 'plans-get':
            return await this.handleGetPlan(request.params.arguments);

          case 'plans-patch':
            return await this.handlePatchPlan(request.params.arguments);

          case 'plans-list':
            return await this.handleListPlans(request.params.arguments);

          case 'steps-get':
            return await this.handleStepsGet(request.params.arguments);

          case 'plan-context-set':
            return await this.handleSetPlanContext(request.params.arguments);

          case 'plan-context-get':
            return await this.handleGetPlanContext(request.params.arguments);

          case 'plan-context-delete':
            return await this.handleDeletePlanContext(request.params.arguments);

          case 'plans-create-draft':
            return await this.handleCreatePlanDraft(
              CreatePlanDraftMcpInput.fromMcpArgs(request.params.arguments)
            );

          case 'plans-step-add':
            return await this.handleAddStepToPlan(
              AddStepToPlanMcpInput.fromMcpArgs(request.params.arguments)
            );

          case 'plans-update-step':
            return await this.handleUpdateStepInPlan(request.params.arguments);

          case 'plans-remove-step':
            return await this.handleRemoveStepFromPlan(request.params.arguments);

          case 'plans-update-metadata':
            return await this.handleUpdatePlanMetadata(request.params.arguments);

          case 'plans-finalize':
            return await this.handleFinalizePlan(request.params.arguments);

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
        // Gérer les erreurs de validation avec détails
        if (error instanceof Error && error.name === 'ValidationError') {
          console.log('Handling ValidationError:', error.message);
          const validationError = error as any;
          console.log('Detailed errors:', validationError.detailedErrors);
          
          let errorMessage = error.message;
          
          // Enrichir le message avec les informations de schéma si disponibles
          if (validationError.detailedErrors && validationError.detailedErrors.length > 0) {
            // Chercher d'abord les erreurs avec expectedSchema (erreurs sur les objets métier)
            let schemaError = validationError.detailedErrors.find((e: any) => e.expectedSchema);
            console.log('Schema error found:', schemaError);
            
            // Si pas trouvé, prendre la première erreur de schéma
            if (!schemaError) {
              schemaError = validationError.detailedErrors.find((e: any) => e.errorType === 'schema');
              console.log('Fallback schema error:', schemaError);
            }
            
            if (schemaError && schemaError.expectedSchema) {
              console.log('Adding schema to error message');
              errorMessage += `\n\nExpected schema for ${schemaError.path}:`;
              errorMessage += `\n${JSON.stringify(schemaError.expectedSchema, null, 2)}`;
            }
          }
          
          const errorResponse: any = {
            message: errorMessage,
            errors: validationError.errors || [],
          };
          if (validationError.detailedErrors && validationError.detailedErrors.length > 0) {
            errorResponse.detailedErrors = validationError.detailedErrors;
          }
          throw new McpError(
            ErrorCode.InvalidParams,
            JSON.stringify(errorResponse)
          );
        }
        throw new McpError(
          ErrorCode.InternalError,
          `Tool execution failed: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    });
  }

  // ==================== Review + Comments (P2) ====================

  private async handleSetStepReviewDecision(args: any) {
    if (!args?.planId) {
      throw new McpError(ErrorCode.InvalidParams, 'Missing required parameter: planId');
    }
    if (!args?.stepId) {
      throw new McpError(ErrorCode.InvalidParams, 'Missing required parameter: stepId');
    }
    if (!args?.decision) {
      throw new McpError(ErrorCode.InvalidParams, 'Missing required parameter: decision');
    }

    const result = await this.stepManagement.setReviewStatus({
      planId: args.planId,
      stepId: args.stepId,
      // NOTE: The port type currently uses status values that don't perfectly match the domain.
      // Domain stores StepReviewStatus.decision: approved|rejected|skipped.
      status: args.decision,
      comment: args.reviewer,
    } as any);

    const planDTO = this.dtoMapper.toDTO(result.plan);
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({ plan: planDTO }, null, 2),
        },
      ],
    };
  }

  private async handleAddStepComment(args: any) {
    if (!args?.planId) {
      throw new McpError(ErrorCode.InvalidParams, 'Missing required parameter: planId');
    }
    if (!args?.stepId) {
      throw new McpError(ErrorCode.InvalidParams, 'Missing required parameter: stepId');
    }
    if (!args?.content) {
      throw new McpError(ErrorCode.InvalidParams, 'Missing required parameter: content');
    }
    if (!args?.author) {
      throw new McpError(ErrorCode.InvalidParams, 'Missing required parameter: author');
    }

    const comment = await this.stepManagement.addStepComment({
      planId: args.planId,
      stepId: args.stepId,
      comment: {
        content: args.content,
        author: args.author,
      },
    });

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(comment, null, 2),
        },
      ],
    };
  }

  private async handleUpdateStepComment(args: any) {
    if (!args?.planId) {
      throw new McpError(ErrorCode.InvalidParams, 'Missing required parameter: planId');
    }
    if (!args?.stepId) {
      throw new McpError(ErrorCode.InvalidParams, 'Missing required parameter: stepId');
    }
    if (!args?.commentId) {
      throw new McpError(ErrorCode.InvalidParams, 'Missing required parameter: commentId');
    }
    if (!args?.content) {
      throw new McpError(ErrorCode.InvalidParams, 'Missing required parameter: content');
    }

    const comment = await this.stepManagement.updateStepComment({
      planId: args.planId,
      stepId: args.stepId,
      commentId: args.commentId,
      content: args.content,
    });

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(comment, null, 2),
        },
      ],
    };
  }

  private async handleDeleteStepComment(args: any) {
    if (!args?.planId) {
      throw new McpError(ErrorCode.InvalidParams, 'Missing required parameter: planId');
    }
    if (!args?.stepId) {
      throw new McpError(ErrorCode.InvalidParams, 'Missing required parameter: stepId');
    }
    if (!args?.commentId) {
      throw new McpError(ErrorCode.InvalidParams, 'Missing required parameter: commentId');
    }

    await this.stepManagement.deleteStepComment({
      planId: args.planId,
      stepId: args.stepId,
      commentId: args.commentId,
    });

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({ ok: true }, null, 2),
        },
      ],
    };
  }

  private async handleAddPlanComment(args: any) {
    if (!args?.planId) {
      throw new McpError(ErrorCode.InvalidParams, 'Missing required parameter: planId');
    }
    if (!args?.content) {
      throw new McpError(ErrorCode.InvalidParams, 'Missing required parameter: content');
    }
    if (!args?.author) {
      throw new McpError(ErrorCode.InvalidParams, 'Missing required parameter: author');
    }

    const comment = await this.planModification.addPlanComment({
      planId: args.planId,
      comment: {
        content: args.content,
        author: args.author,
      },
    });

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(comment, null, 2),
        },
      ],
    };
  }

  private async handleUpdatePlanComment(args: any) {
    if (!args?.planId) {
      throw new McpError(ErrorCode.InvalidParams, 'Missing required parameter: planId');
    }
    if (!args?.commentId) {
      throw new McpError(ErrorCode.InvalidParams, 'Missing required parameter: commentId');
    }
    if (!args?.content) {
      throw new McpError(ErrorCode.InvalidParams, 'Missing required parameter: content');
    }

    const comment = await this.planModification.updatePlanComment({
      planId: args.planId,
      commentId: args.commentId,
      content: args.content,
    });

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(comment, null, 2),
        },
      ],
    };
  }

  private async handleDeletePlanComment(args: any) {
    if (!args?.planId) {
      throw new McpError(ErrorCode.InvalidParams, 'Missing required parameter: planId');
    }
    if (!args?.commentId) {
      throw new McpError(ErrorCode.InvalidParams, 'Missing required parameter: commentId');
    }

    await this.planModification.deletePlanComment({
      planId: args.planId,
      commentId: args.commentId,
    });

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({ ok: true }, null, 2),
        },
      ],
    };
  }

  private async getPlanReviewHtml(): Promise<string> {
    // Prefer the bundled single-file UI if present.
    const diskHtml = await this.tryReadPlanReviewBundledHtml();
    if (diskHtml) return diskHtml;

    // Phase P0 fallback: minimal static HTML to validate MCP Apps rendering in the host.
    return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Plan Review</title>
    <style>
      body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; margin: 0; padding: 12px; }
      .card { border: 1px solid rgba(0,0,0,0.12); border-radius: 10px; padding: 12px; }
      h1 { font-size: 14px; margin: 0 0 8px; }
      p { margin: 0 0 8px; color: rgba(0,0,0,0.72); font-size: 12px; }
      code { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; font-size: 12px; }
      .muted { color: rgba(0,0,0,0.55); }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>Plan Review UI (P0)</h1>
      <p>This is a placeholder MCP App resource served from <code>${McpServer.PLAN_REVIEW_UI_URI}</code>.</p>
      <p class="muted">UI bundle not found at <code>${McpServer.PLAN_REVIEW_UI_DIST_RELATIVE_PATH}</code>. Run the app build to enable P1.</p>
    </div>
  </body>
</html>`;
  }

  private async tryReadPlanReviewBundledHtml(): Promise<string | null> {
    // When running `node dist/index.js` from the package directory, cwd points to packages/mcp-planflow.
    const candidatePaths = [
      path.join(process.cwd(), McpServer.PLAN_REVIEW_UI_DIST_RELATIVE_PATH),
      // Fallback: resolve relative to compiled file location (dist/infrastructure/mcp)
      path.join(__dirname, '..', '..', '..', McpServer.PLAN_REVIEW_UI_DIST_RELATIVE_PATH),
    ];

    for (const candidatePath of candidatePaths) {
      try {
        return await fs.readFile(candidatePath, 'utf-8');
      } catch {
        // ignore
      }
    }

    return null;
  }

  // ==================== Plans Tools ====================

  private async handleGetPlanFormat(args: any) {
    const result = this.getPlanFormatUseCase.execute();
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  private async handleGetContextFormat(args: any) {
    const contextSchema = require('../validation/schemas/context-v1.0.0.json');
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(contextSchema, null, 2),
        },
      ],
    };
  }

  // LEGACY - Disabled in favor of incremental workflow
  private async handleCreatePlan(args: any) {
    throw new McpError(ErrorCode.MethodNotFound, 'Use plans-create-draft instead');
  }

  private async handleGetPlan(args: any) {
    if (!args?.planId) {
      throw new McpError(ErrorCode.InvalidParams, 'Missing required parameter: planId');
    }

    const result = await this.planRetrieval.getById(args.planId);
    const planDTO = this.dtoMapper.toDTO(result.plan);
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(planDTO, null, 2),
        },
      ],
    };
  }

  private async handlePatchPlan(args: any) {
    if (!args?.planId) {
      throw new McpError(
        ErrorCode.InvalidParams,
        'Missing required parameter: planId'
      );
    }

    const result = await this.patchPlanElementsUseCase.execute({
      planId: args.planId,
      stepId: args.stepId,
      // Plan-level fields
      metadata: args.metadata,
      plan: args.plan ? {
        ...args.plan,
        diagrams: args.plan.diagrams,
      } : undefined,
      // Step-level fields
      title: args.title,
      description: args.description,
      kind: args.kind,
      status: args.status,
      dependsOn: args.dependsOn,
      estimatedDuration: args.estimatedDuration,
      actions: args.actions,
      validation: args.validation,
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
    const result = await this.planRetrieval.list();
    const plansDTO = result.plans.map((p: Plan) => this.dtoMapper.toDTO(p));
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(plansDTO, null, 2),
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

  // ==================== Plan Context Tools ====================

  private async handleSetPlanContext(args: any) {
    if (!args?.planId) {
      throw new McpError(ErrorCode.InvalidParams, 'Missing required parameter: planId');
    }
    if (!args?.files || !Array.isArray(args.files)) {
      throw new McpError(ErrorCode.InvalidParams, 'Missing required parameter: files (must be an array)');
    }

    const result = await this.setPlanContextUseCase.execute(args.planId, args.files);
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  private async handleGetPlanContext(args: any) {
    if (!args?.planId) {
      throw new McpError(ErrorCode.InvalidParams, 'Missing required parameter: planId');
    }

    const result = await this.getPlanContextUseCase.execute(args.planId);
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  private async handleDeletePlanContext(args: any) {
    if (!args?.planId) {
      throw new McpError(ErrorCode.InvalidParams, 'Missing required parameter: planId');
    }

    const result = await this.deletePlanContextUseCase.execute(args.planId);
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({ success: result }, null, 2),
        },
      ],
    };
  }

  // ==================== Incremental Plan Creation Handlers ====================

  /**
   * Handler for plans-create-draft tool
   * ✅ Typed with CreatePlanDraftMcpInput and uses toDomain()
   */
  private async handleCreatePlanDraft(args: CreatePlanDraftMcpInput) {
    // MCP schema validation already applied by server
    // Transform MCP Input → Domain Input using toDomain()
    const result = await this.planCreation.createDraft(args.toDomain());
    const planDTO = this.dtoMapper.toDTO(result.plan);

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({ planId: result.planId, plan: planDTO }, null, 2),
        },
      ],
    };
  }

  /**
   * Handler for plans-step-add tool
   * ✅ Typed with AddStepToPlanMcpInput and uses toDomain()
   */
  private async handleAddStepToPlan(args: AddStepToPlanMcpInput) {
    // MCP schema validation already applied by server
    // Transform MCP Input → Domain Input using toDomain()
    const result = await this.stepManagement.addStep(args.toDomain());
    const planDTO = this.dtoMapper.toDTO(result.plan);

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({ plan: planDTO }, null, 2),
        },
      ],
    };
  }

  private async handleUpdateStepInPlan(args: any) {
    if (!args?.planId || !args?.stepId || !args?.updates) {
      throw new McpError(
        ErrorCode.InvalidParams,
        'Missing required parameters: planId, stepId, updates'
      );
    }

    const result = await this.stepManagement.updateStep({
      planId: args.planId,
      stepId: args.stepId,
      updates: args.updates,
    });
    const planDTO = this.dtoMapper.toDTO(result.plan);

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({ plan: planDTO }, null, 2),
        },
      ],
    };
  }

  private async handleRemoveStepFromPlan(args: any) {
    if (!args?.planId || !args?.stepId) {
      throw new McpError(ErrorCode.InvalidParams, 'Missing required parameters: planId, stepId');
    }

    const result = await this.stepManagement.removeStep({
      planId: args.planId,
      stepId: args.stepId,
      mode: args.mode || 'strict',
    });
    const planDTO = this.dtoMapper.toDTO(result.plan);

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({ plan: planDTO }, null, 2),
        },
      ],
    };
  }

  private async handleUpdatePlanMetadata(args: any) {
    if (!args?.planId) {
      throw new McpError(ErrorCode.InvalidParams, 'Missing required parameter: planId');
    }

    const result = await this.planModification.updateMetadata({
      planId: args.planId,
      metadata: args.metadata,
      planDetails: args.plan,
    });
    const planDTO = this.dtoMapper.toDTO(result.plan);

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({ plan: planDTO }, null, 2),
        },
      ],
    };
  }

  private async handleFinalizePlan(args: any) {
    if (!args?.planId) {
      throw new McpError(ErrorCode.InvalidParams, 'Missing required parameter: planId');
    }

    const result = await this.planCreation.finalizeDraft(args.planId);
    const planDTO = this.dtoMapper.toDTO(result.plan);

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({ plan: planDTO }, null, 2),
        },
      ],
    };
  }

  // ==================== Server Lifecycle ====================

  getServer(): Server {
    return this.server;
  }

  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('MCP PlanFlow server started');
  }
}
