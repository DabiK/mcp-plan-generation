import { Plan } from '../../../domain/entities/Plan';

/**
 * Port In - Use Case: Récupération de plans
 * Implémenté par: PlanManagementService (Domain)
 * Appelé par: McpServer, HttpServer (Infrastructure)
 */

export interface PlanFilters {
  status?: string;
  planType?: string;
  author?: string;
  tags?: string[];
}

export interface PlanOutput {
  plan: Plan;
}

export interface PlanListOutput {
  plans: Plan[];
}

export interface PlanFormatOutput {
  schema: any;
}

export interface IPlanRetrieval {
  getById(planId: string): Promise<PlanOutput>;
  list(filters?: PlanFilters): Promise<PlanListOutput>;
  getFormat(): Promise<PlanFormatOutput>;
}
