// DTOs basés sur le JSON brut, pas sur les entités du domain
export interface PlanDTO {
  planId: string;
  schemaVersion: string;
  planType: string;
  metadata: {
    title: string;
    description: string;
    author?: string;
    createdAt: string;
    updatedAt: string;
    tags?: string[];
    revision: number;
  };
  plan: {
    objective: string;
    scope: string;
    constraints?: string[];
    assumptions?: string[];
    successCriteria?: string[];
  };
  steps: StepDTO[];
  createdAt: string;
  updatedAt: string;
  revision: number;
}

export interface StepDTO {
  id: string;
  title: string;
  description: string;
  kind: string;
  status: string;
  dependsOn: string[];
  estimatedDuration?: {
    value: number;
    unit: string;
  };
  actions: Array<{
    type: string;
    description: string;
    payload?: Record<string, unknown>;
  }>;
  validation?: {
    criteria: string[];
    automatedTests?: string[];
  };
}

export interface ValidationResultDTO {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface CreatePlanInputDTO {
  plan: Record<string, unknown>;
  source?: string;
}

export interface CreatePlanOutputDTO {
  planId: string;
  plan: PlanDTO;
}
