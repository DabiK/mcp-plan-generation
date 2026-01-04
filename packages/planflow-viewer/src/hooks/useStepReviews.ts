import { useState, useEffect, useCallback } from 'react';
import type { PlanReviewState, StepReview, StepComment, ReviewDecision } from '@/types';

const STORAGE_PREFIX = 'planflow_review_';

export function useStepReviews(planId: string) {
  const storageKey = `${STORAGE_PREFIX}${planId}`;
  
  const [reviewState, setReviewState] = useState<PlanReviewState>(() => {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return {
          planId,
          reviews: {},
          currentStepIndex: 0,
          isComplete: false,
        };
      }
    }
    return {
      planId,
      reviews: {},
      currentStepIndex: 0,
      isComplete: false,
    };
  });

  // Persist to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(reviewState));
  }, [reviewState, storageKey]);

  const addReview = useCallback((stepId: string, decision: ReviewDecision) => {
    setReviewState((prev) => ({
      ...prev,
      reviews: {
        ...prev.reviews,
        [stepId]: {
          stepId,
          decision,
          comments: prev.reviews[stepId]?.comments || [],
          timestamp: new Date().toISOString(),
        },
      },
    }));
  }, []);

  const addComment = useCallback((stepId: string, content: string) => {
    const comment: StepComment = {
      id: `comment_${Date.now()}`,
      stepId,
      content,
      timestamp: new Date().toISOString(),
    };

    setReviewState((prev) => {
      const existingReview = prev.reviews[stepId];
      return {
        ...prev,
        reviews: {
          ...prev.reviews,
          [stepId]: {
            stepId,
            decision: existingReview?.decision || 'skipped',
            comments: [...(existingReview?.comments || []), comment],
            timestamp: existingReview?.timestamp || new Date().toISOString(),
          },
        },
      };
    });
  }, []);

  const deleteComment = useCallback((stepId: string, commentId: string) => {
    setReviewState((prev) => {
      const review = prev.reviews[stepId];
      if (!review) return prev;

      return {
        ...prev,
        reviews: {
          ...prev.reviews,
          [stepId]: {
            ...review,
            comments: review.comments.filter((c) => c.id !== commentId),
          },
        },
      };
    });
  }, []);

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

  const getStepReview = useCallback((stepId: string): StepReview | undefined => {
    return reviewState.reviews[stepId];
  }, [reviewState.reviews]);

  const getReviewStats = useCallback(() => {
    const reviews = Object.values(reviewState.reviews);
    return {
      total: reviews.length,
      approved: reviews.filter((r) => r.decision === 'approved').length,
      rejected: reviews.filter((r) => r.decision === 'rejected').length,
      skipped: reviews.filter((r) => r.decision === 'skipped').length,
      commented: reviews.filter((r) => r.comments.length > 0).length,
    };
  }, [reviewState.reviews]);

  return {
    reviewState,
    addReview,
    addComment,
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
