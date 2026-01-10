import { useState, useCallback } from 'react';
import type { PlanReviewState, StepReview, ReviewDecision, PlanDTO } from '@/types';
import { useAddStepComment, useUpdateStepComment, useDeleteStepComment, useSetStepReviewStatus } from './useStepCommentMutations';

export function useStepReviews(planId: string, plan?: PlanDTO) {
  // Mutations pour les commentaires et review status
  const addStepCommentMutation = useAddStepComment(planId);
  const updateStepCommentMutation = useUpdateStepComment(planId);
  const deleteStepCommentMutation = useDeleteStepComment(planId);
  const setReviewStatusMutation = useSetStepReviewStatus(planId);

  // État local uniquement pour la navigation
  const [reviewState, setReviewState] = useState<PlanReviewState>(() => {
    return {
      planId,
      reviews: {},
      currentStepIndex: 0,
      isComplete: false,
    };
  });

  // Les données sont déjà dans plan.steps[].comments et plan.steps[].reviewStatus
  // Pas besoin de synchronisation, on lit directement depuis plan

  const addReview = useCallback(async (stepId: string, decision: ReviewDecision) => {
    // Appel direct à la mutation - invalide automatiquement le cache
    return setReviewStatusMutation.mutateAsync({ stepId, decision });
  }, [setReviewStatusMutation]);

  const addComment = useCallback(async (stepId: string, content: string) => {
    // Appel direct à la mutation - invalide automatiquement le cache
    return addStepCommentMutation.mutateAsync({ stepId, content });
  }, [addStepCommentMutation]);

  const deleteComment = useCallback(async (stepId: string, commentId: string) => {
    // Appel direct à la mutation - invalide automatiquement le cache
    return deleteStepCommentMutation.mutateAsync({ stepId, commentId });
  }, [deleteStepCommentMutation]);

  const updateComment = useCallback(async (stepId: string, commentId: string, content: string) => {
    // Appel direct à la mutation - invalide automatiquement le cache
    return updateStepCommentMutation.mutateAsync({ stepId, commentId, content });
  }, [updateStepCommentMutation]);

  const setCurrentStepIndex = useCallback((index: number) => {
    setReviewState((prev) => ({
      ...prev,
      currentStepIndex: index,
    }));
  }, []);

  const nextStep = useCallback(() => {
    setReviewState((prev) => ({
      ...prev,
      currentStepIndex: prev.currentStepIndex + 1,
    }));
  }, []);

  const previousStep = useCallback(() => {
    setReviewState((prev) => ({
      ...prev,
      currentStepIndex: Math.max(0, prev.currentStepIndex - 1),
    }));
  }, []);

  const completeReview = useCallback(() => {
    setReviewState((prev) => ({
      ...prev,
      isComplete: true,
    }));
  }, []);

  const resetReview = useCallback(() => {
    setReviewState({
      planId,
      reviews: {},
      currentStepIndex: 0,
      isComplete: false,
    });
  }, [planId]);

  // Lire directement depuis plan - pas besoin d'état local
  const getStepReview = useCallback((stepId: string): StepReview | undefined => {
    const step = plan?.steps.find(s => s.id === stepId);
    if (!step) return undefined;
    
    return {
      stepId,
      decision: step.reviewStatus?.decision as ReviewDecision | undefined,
      comments: (step.comments || []).map(c => ({
        id: c.id,
        stepId,
        content: c.content,
        timestamp: c.createdAt,
      })),
      timestamp: step.reviewStatus?.timestamp || new Date().toISOString(),
    };
  }, [plan]);

  const getReviewStats = useCallback(() => {
    if (!plan || !plan.steps) {
      return {
        total: 0,
        approved: 0,
        rejected: 0,
        skipped: 0,
        commented: 0,
        pending: 0,
      };
    }

    const stats = {
      total: plan.steps.length,
      approved: 0,
      rejected: 0,
      skipped: 0,
      commented: 0,
      pending: 0,
    };

    plan.steps.forEach((step) => {
      if (step.reviewStatus?.decision === 'approved') stats.approved++;
      else if (step.reviewStatus?.decision === 'rejected') stats.rejected++;
      else if (step.reviewStatus?.decision === 'skipped') stats.skipped++;
      else stats.pending++;

      if (step.comments && step.comments.length > 0) stats.commented++;
    });

    return stats;
  }, [plan]);

  return {
    reviewState,
    addReview,
    addComment,
    updateComment,
    deleteComment,
    setCurrentStepIndex,
    nextStep,
    previousStep,
    completeReview,
    resetReview,
    getStepReview,
    getReviewStats,
  };
}
