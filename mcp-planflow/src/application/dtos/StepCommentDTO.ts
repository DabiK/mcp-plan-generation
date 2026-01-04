export interface StepCommentDTO {
  id: string;
  stepId: string;
  content: string;
  author?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface AddStepCommentInputDTO {
  planId: string;
  stepId: string;
  content: string;
  author?: string;
}

export interface DeleteStepCommentInputDTO {
  planId: string;
  stepId: string;
  commentId: string;
}

export interface UpdateStepCommentInputDTO {
  planId: string;
  stepId: string;
  commentId: string;
  content: string;
}

export interface StepCommentOperationResultDTO {
  success: boolean;
  comment?: StepCommentDTO;
  message?: string;
}
