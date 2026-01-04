export interface PlanCommentDTO {
  id: string;
  content: string;
  author?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface AddPlanCommentInputDTO {
  planId: string;
  content: string;
  author?: string;
}

export interface DeletePlanCommentInputDTO {
  planId: string;
  commentId: string;
}

export interface UpdatePlanCommentInputDTO {
  planId: string;
  commentId: string;
  content: string;
}

export interface PlanCommentOperationResultDTO {
  success: boolean;
  comment?: PlanCommentDTO;
  message?: string;
}
