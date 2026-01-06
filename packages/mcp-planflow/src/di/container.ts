import 'reflect-metadata';
import { container } from 'tsyringe';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { MongoDBConnection } from '../infrastructure/persistence/mongodb/MongoDBConnection';
import { MongoDBPlanRepository } from '../infrastructure/persistence/mongodb/MongoDBPlanRepository';
import { IPlanRepository } from '../domain/repositories/IPlanRepository';
import { PlanValidator } from '../infrastructure/validation/PlanValidator';
import { ContextValidator } from '../infrastructure/validation/ContextValidator';
import { MermaidValidator } from '../infrastructure/validation/MermaidValidator';
import { DependencyGraphService } from '../domain/services/DependencyGraphService';
import { GetPlanFormatUseCase } from '../application/use-cases/GetPlanFormatUseCase';
import { ValidatePlanUseCase } from '../application/use-cases/ValidatePlanUseCase';
import { CreatePlanUseCase } from '../application/use-cases/CreatePlanUseCase';
import { GetPlanUseCase } from '../application/use-cases/GetPlanUseCase';
import { UpdatePlanUseCase } from '../application/use-cases/UpdatePlanUseCase';
import { ListPlansUseCase } from '../application/use-cases/ListPlansUseCase';
import { AddStepCommentUseCase, DeleteStepCommentUseCase, UpdateStepCommentUseCase } from '../application/use-cases/StepCommentUseCases';
import { GetPlanCommentsUseCase, AddPlanCommentUseCase, UpdatePlanCommentUseCase, DeletePlanCommentUseCase } from '../application/use-cases/PlanCommentUseCases';
import { StepNavigationUseCases } from '../application/use-cases/StepNavigationUseCases';
import { PatchPlanElementsUseCase } from '../application/use-cases/PatchPlanElementsUseCase';
import { SetPlanContextUseCase } from '../application/use-cases/SetPlanContextUseCase';
import { GetPlanContextUseCase } from '../application/use-cases/GetPlanContextUseCase';
import { DeletePlanContextUseCase } from '../application/use-cases/DeletePlanContextUseCase';
import { PlanContextRepository } from '../infrastructure/database/repositories/PlanContextRepository';
import { McpServer } from '../infrastructure/mcp/McpServer';
import { HttpServer } from '../infrastructure/http/HttpServer';
import { McpSseHandler } from '../infrastructure/http/McpSseHandler';

export function setupContainer(): void {
  // Register infrastructure services as singletons
  container.registerSingleton(MongoDBConnection);
  container.registerSingleton(MermaidValidator);
  container.registerSingleton(PlanValidator);
  container.registerSingleton(ContextValidator);
  container.registerSingleton(DependencyGraphService);

  // Register repository with interface token
  container.register<IPlanRepository>('IPlanRepository', {
    useClass: MongoDBPlanRepository,
  });

  container.register('PlanContextRepository', {
    useClass: PlanContextRepository,
  });

  // Register application use cases
  container.registerSingleton(GetPlanFormatUseCase);
  container.registerSingleton(ValidatePlanUseCase);
  container.registerSingleton(CreatePlanUseCase);
  container.registerSingleton(GetPlanUseCase);
  container.registerSingleton(UpdatePlanUseCase);
  container.registerSingleton(PatchPlanElementsUseCase);
  container.registerSingleton(ListPlansUseCase);
  container.registerSingleton(AddStepCommentUseCase);
  container.registerSingleton(DeleteStepCommentUseCase);
  container.registerSingleton(UpdateStepCommentUseCase);
  container.registerSingleton(StepNavigationUseCases);
  container.registerSingleton(GetPlanCommentsUseCase);
  container.registerSingleton(AddPlanCommentUseCase);
  container.registerSingleton(UpdatePlanCommentUseCase);
  container.registerSingleton(DeletePlanCommentUseCase);
  container.registerSingleton(SetPlanContextUseCase);
  container.registerSingleton(GetPlanContextUseCase);
  container.registerSingleton(DeletePlanContextUseCase);

  // Register MCP server
  container.registerSingleton(McpServer);
  
  // Register MCP Server instance for SSE
  const mcpServerInstance = container.resolve(McpServer);
  container.register<Server>('McpServerInstance', {
    useValue: mcpServerInstance.getServer(),
  });

  // Register SSE handler
  container.registerSingleton(McpSseHandler);

  // Register HTTP server
  container.registerSingleton(HttpServer);
}

export async function bootstrapApp(): Promise<void> {
  // Setup dependency injection container
  setupContainer();

  // Connect to MongoDB
  const mongoConnection = container.resolve(MongoDBConnection);
  await mongoConnection.connect();

  // Create indexes
  await mongoConnection.createIndexes();

  console.error('Application bootstrapped successfully');
}

export { container };
