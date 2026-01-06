// Action types based on schema v1.1.0 (with backward compatibility for v1.0.0)
export type CreateFileAction = {
  type: 'create_file' | 'create_directory'; // v1.0.0 compatibility
  filePath?: string;
  content?: string;
  description?: string;
  payload?: {
    file?: string;  // v1.0.0
    path?: string;  // v1.0.0
    content?: string; // v1.0.0
  };
};

export type EditFileAction = {
  type: 'edit_file';
  filePath?: string;
  before?: string;
  after?: string;
  description?: string;
  lineNumbers?: {
    start: number;
    end: number;
  };
  payload?: {
    file?: string;  // v1.0.0
    changes?: string; // v1.0.0
  };
};

export type DeleteFileAction = {
  type: 'delete_file';
  filePath: string;
  reason?: string;
  description?: string;
};

export type RunCommandAction = {
  type: 'run_command' | 'terminal'; // v1.0.0 compatibility
  command?: string;
  workingDirectory?: string;
  expectedOutput?: string;
  description?: string;
  payload?: {
    command?: string; // v1.0.0
  };
};

export type TestAction = {
  type: 'test' | 'manual_test'; // v1.0.0 compatibility
  testCommand?: string;
  testFiles?: string[];
  coverage?: number;
  description?: string;
  payload?: {
    scenarios?: string[]; // v1.0.0
  };
};

export type ReviewAction = {
  type: 'review' | 'code_review'; // v1.0.0 compatibility
  checklistItems?: string[];
  reviewers?: string[];
  description?: string;
  payload?: {
    checks?: string[]; // v1.0.0
  };
};

export type DocumentationAction = {
  type: 'documentation';
  sections?: string[];
  format?: 'markdown' | 'jsdoc' | 'openapi' | 'readme';
  filePath?: string;
  description?: string;
};

export type CustomAction = {
  type: 'custom';
  description: string;
  payload?: Record<string, unknown>;
};

export type StepAction = 
  | CreateFileAction 
  | EditFileAction 
  | DeleteFileAction 
  | RunCommandAction 
  | TestAction 
  | ReviewAction 
  | DocumentationAction 
  | CustomAction;

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
    diagrams?: Array<{
      title: string;
      type: 'flowchart' | 'sequence' | 'class' | 'er' | 'gantt' | 'state';
      content: string;
      description?: string;
    }>;
  };
  steps: StepDTO[];
  createdAt: string;
  updatedAt: string;
  revision: number;
  comments?: {
    id: string;
    content: string;
    author?: string;
    createdAt: string;
    updatedAt?: string;
  }[];
}

export interface StepCommentDTO {
  id: string;
  content: string;
  author?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface StepReviewStatusDTO {
  decision: 'approved' | 'rejected' | 'skipped';
  timestamp: string;
  reviewer?: string;
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
  actions: StepAction[];
  validation?: {
    criteria: string[];
    automatedTests?: string[];
  };
  comments?: StepCommentDTO[];
  reviewStatus?: StepReviewStatusDTO;
  diagram?: {
    type: 'flowchart' | 'sequence' | 'class' | 'er' | 'gantt' | 'state';
    content: string;
    description?: string;
  };
}

export interface DetailedValidationErrorDTO {
  path: string;
  message: string;
  errorType: 'schema' | 'business' | 'format';
  expectedValue?: any;
  actualValue?: any;
  schemaKeyword?: string;
}

export interface ValidationResultDTO {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  detailedErrors: DetailedValidationErrorDTO[];
}

export interface CreatePlanInputDTO {
  plan: Record<string, unknown>;
  source?: string;
}

export interface CreatePlanOutputDTO {
  planId: string;
  plan: PlanDTO;
}
