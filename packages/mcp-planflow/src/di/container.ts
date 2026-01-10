import 'reflect-metadata';
import { container } from 'tsyringe';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { MongoDBConnection } from '../infrastructure/persistence/mongodb/MongoDBConnection';
import { MongoDBPlanRepository } from '../infrastructure/persistence/mongodb/MongoDBPlanRepository';
import { IPlanRepository } from '../application/ports/out/IPlanRepository';
import { IValidationPort } from '../application/ports/out/IValidationPort';
import { IPlanCreation } from '../application/ports/in/IPlanCreation';
import { IPlanRetrieval } from '../application/ports/in/IPlanRetrieval';
import { IStepManagement } from '../application/ports/in/IStepManagement';
import { IPlanModification } from '../application/ports/in/IPlanModification';
import { PlanValidator } from '../infrastructure/validation/PlanValidator';
import { ContextValidator } from '../infrastructure/validation/ContextValidator';
import { MermaidValidator } from '../infrastructure/validation/MermaidValidator';
import { ValidationPort } from '../infrastructure/validation/ValidationPort';
import { DTOMapper } from '../infrastructure/mappers/DTOMapper';
import { DependencyGraphService } from '../domain/services/DependencyGraphService';
import { BusinessRulesValidator } from '../domain/services/BusinessRulesValidator';
import { PlanManagementService } from '../domain/services/PlanManagementService';
import { GetPlanFormatUseCase } from '../application/use-cases/GetPlanFormatUseCase';
import { CreatePlanUseCase } from '../application/use-cases/CreatePlanUseCase';
import { GetPlanUseCase } from '../application/use-cases/GetPlanUseCase';
import { ListPlansUseCase } from '../application/use-cases/ListPlansUseCase';
import { StepNavigationUseCases } from '../application/use-cases/StepNavigationUseCases';
import { PatchPlanElementsUseCase } from '../application/use-cases/PatchPlanElementsUseCase';
import { SetPlanContextUseCase } from '../application/use-cases/SetPlanContextUseCase';
import { GetPlanContextUseCase } from '../application/use-cases/GetPlanContextUseCase';
import { CreatePlanDraftUseCase } from '../application/use-cases/CreatePlanDraftUseCase';
import { AddStepToPlanUseCase } from '../application/use-cases/AddStepToPlanUseCase';
import { UpdateStepInPlanUseCase } from '../application/use-cases/UpdateStepInPlanUseCase';
import { RemoveStepFromPlanUseCase } from '../application/use-cases/RemoveStepFromPlanUseCase';
import { UpdatePlanMetadataUseCase } from '../application/use-cases/UpdatePlanMetadataUseCase';
import { FinalizePlanUseCase } from '../application/use-cases/FinalizePlanUseCase';
import { DeletePlanContextUseCase } from '../application/use-cases/DeletePlanContextUseCase';
import { PlanContextRepository } from '../infrastructure/database/repositories/PlanContextRepository';
import { McpServer } from '../infrastructure/mcp/McpServer';
import { HttpServer } from '../infrastructure/http/HttpServer';
import { McpSseHandler } from '../infrastructure/http/McpSseHandler';

export function setupContainer(): void {
  // ========== Infrastructure Layer ==========
  
  // Database & Persistence
  container.registerSingleton(MongoDBConnection);
  
  // Validators (Infrastructure)
  container.registerSingleton(MermaidValidator);
  container.registerSingleton(PlanValidator);
  container.registerSingleton(ContextValidator);
  
  // Mappers (Infrastructure)
  container.registerSingleton(DTOMapper);
  
  // ========== Domain Layer ==========
  
  // Domain Services
  container.registerSingleton(DependencyGraphService);
  container.registerSingleton(BusinessRulesValidator);
  container.registerSingleton(PlanManagementService);
  
  // ========== Application Layer - Ports Out (Implemented by Infrastructure) ==========
  
  // Repository Port
  container.register<IPlanRepository>('IPlanRepository', {
    useClass: MongoDBPlanRepository,
  });
  
  // Validation Port
  container.register<IValidationPort>('IValidationPort', {
    useClass: ValidationPort,
  });

  container.register('PlanContextRepository', {
    useClass: PlanContextRepository,
  });
  
  // ========== Application Layer - Ports In (Implemented by Domain) ==========
  
  // Register PlanManagementService as all Ports In implementations
  container.register<IPlanCreation>('IPlanCreation', {
    useClass: PlanManagementService,
  });
  
  container.register<IPlanRetrieval>('IPlanRetrieval', {
    useClass: PlanManagementService,
  });
  
  container.register<IStepManagement>('IStepManagement', {
    useClass: PlanManagementService,
  });
  
  container.register<IPlanModification>('IPlanModification', {
    useClass: PlanManagementService,
  });

  // ========== Legacy Use Cases (À décommissionner progressivement) ==========
  
  container.registerSingleton(GetPlanFormatUseCase);
  container.registerSingleton(CreatePlanUseCase);
  container.registerSingleton(GetPlanUseCase);
  container.registerSingleton(PatchPlanElementsUseCase);
  container.registerSingleton(ListPlansUseCase);
  container.registerSingleton(StepNavigationUseCases);
  container.registerSingleton(SetPlanContextUseCase);
  container.registerSingleton(GetPlanContextUseCase);
  container.registerSingleton(DeletePlanContextUseCase);
  container.registerSingleton(CreatePlanDraftUseCase);
  container.registerSingleton(AddStepToPlanUseCase);
  container.registerSingleton(UpdateStepInPlanUseCase);
  container.registerSingleton(RemoveStepFromPlanUseCase);
  container.registerSingleton(UpdatePlanMetadataUseCase);
  container.registerSingleton(FinalizePlanUseCase);
  
  // ========== Infrastructure - Servers ==========
  
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

