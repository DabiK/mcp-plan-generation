import { Plan } from '../../../domain/entities/Plan';

/**
 * Port In - Use Case: Création de plans
 * Implémenté par: PlanManagementService (Domain)
 * Appelé par: McpServer, HttpServer (Infrastructure)
 */

export interface CreatePlanDraftInput {
  planType: string;
  metadata: {
    title: string;
    description: string;
    author?: string;
    tags?: string[];
  };
  objective: string;
  scope?: string;
  constraints?: string[];
  assumptions?: string[];
  successCriteria?: string[];
}

export interface CreatePlanDraftOutput {
  plan: Plan;
  planId: string;
}

export interface FinalizePlanOutput {
  plan: Plan;
}

export interface ValidatePlanInput {
  plan: any; // Full plan structure to validate
}

export interface ValidatePlanOutput {
  valid: boolean;
  errors?: any[];
}

export interface IPlanCreation {
  createDraft(input: CreatePlanDraftInput): Promise<CreatePlanDraftOutput>;
  finalizeDraft(planId: string): Promise<FinalizePlanOutput>;
  validatePlan(input: ValidatePlanInput): Promise<ValidatePlanOutput>;
}
