export interface CreatePlanDraftInputDTO {
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
