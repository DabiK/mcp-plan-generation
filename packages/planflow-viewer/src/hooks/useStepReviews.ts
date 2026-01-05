import { useState, useEffect, useCallback } from 'react';
import type { PlanReviewState, StepReview, StepComment, ReviewDecision, PlanDTO } from '@/types';
import { planService } from '@/services/planService';

export function useStepReviews(planId: string, plan?: PlanDTO) {
  
  const [reviewState, setReviewState] = useState<PlanReviewState>(() => {
    // Initialize from plan data (API) if available
    if (plan && plan.steps) {
      const reviewsFromDB: Record<string, StepReview> = {};
      
      plan.steps.forEach((step) => {
        // Load comments and review status from API
        const hasComments = step.comments && step.comments.length > 0;
        const hasReviewStatus = step.reviewStatus && step.reviewStatus.decision;
        
        if (hasReviewStatus || hasComments) {
          const review: any = {
            stepId: step.id,
            comments: step.comments?.map((c) => ({
              id: c.id,
              stepId: step.id,
              content: c.content,
              timestamp: c.createdAt,
            })) || [],
            timestamp: step.reviewStatus?.timestamp || new Date().toISOString(),
          };

          if (step.reviewStatus?.decision) {
            review.decision = step.reviewStatus.decision;
          }

          reviewsFromDB[step.id] = review;
        }
      });

      return {
        planId,
        reviews: reviewsFromDB,
        currentStepIndex: 0,
        isComplete: false,
      };
    }

    // Default empty state if plan not loaded yet
    return {
      planId,
      reviews: {},
      currentStepIndex: 0,
      isComplete: false,
    };
  });

  // Hydrate from plan data when it becomes available
  useEffect(() => {
    if (plan && plan.steps) {
      const reviewsFromDB: Record<string, StepReview> = {};
      
      plan.steps.forEach((step) => {
        // Load comments and review status from API
        const hasComments = step.comments && step.comments.length > 0;
        const hasReviewStatus = step.reviewStatus;
        
        if (hasReviewStatus || hasComments) {
          reviewsFromDB[step.id] = {
            stepId: step.id,
            decision: step.reviewStatus?.decision as any,
            comments: step.comments?.map((c) => ({
              id: c.id,
              stepId: step.id,
              content: c.content,
              timestamp: c.createdAt,
            })) || [],
            timestamp: step.reviewStatus?.timestamp || new Date().toISOString(),
          };
        }
      });

      // Use API data as source of truth
      setReviewState((prev) => ({
        ...prev,
        reviews: reviewsFromDB,
      }));
    }
  }, [plan]);

  const addReview = useCallback(async (stepId: string, decision: ReviewDecision) => {
    // Update local state immediately (optimistic update)
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

    // Persist to backend
    try {
      await planService.setStepReviewStatus(planId, stepId, decision);
    } catch (error) {
      console.error('Failed to persist review status:', error);
      // State already updated optimistically, localStorage will persist it
    }
  }, [planId]);

  const addComment = useCallback(async (stepId: string, content: string) => {
    try {
      // Call backend API to persist comment
      const result = await planService.addStepComment(planId, stepId, content);
      
      if (result.success && result.comment) {
        const comment: StepComment = {
          id: result.comment.id,
          stepId,
          content: result.comment.content,
          timestamp: result.comment.createdAt,
        };

        setReviewState((prev) => {
          const existingReview = prev.reviews[stepId];
          // Only update comments if a review exists, don't create a new review
          if (existingReview) {
            return {
              ...prev,
              reviews: {
                ...prev.reviews,
                [stepId]: {
                  ...existingReview,
                  comments: [...existingReview.comments, comment],
                },
              },
            };
          }
          // If no review exists, don't create one - comments are independent
          return prev;
        });
      }
    } catch (error) {
      console.error('Failed to add comment:', error);
    }
  }, [planId]);

  const deleteComment = useCallback(async (stepId: string, commentId: string) => {
    try {
      // Call backend API to delete comment
      await planService.deleteStepComment(planId, stepId, commentId);
      
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
    } catch (error) {
      console.error('Failed to delete comment:', error);
      // Still remove from local state on error
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
    }
  }, [planId]);

  const updateComment = useCallback(async (stepId: string, commentId: string, content: string) => {
    try {
      // Call backend API to update comment
      const result = await planService.updateStepComment(planId, stepId, commentId, content);
      
      if (result.success) {
        setReviewState((prev) => {
          const review = prev.reviews[stepId];
          if (!review) return prev;

          return {
            ...prev,
            reviews: {
              ...prev.reviews,
              [stepId]: {
                ...review,
                comments: review.comments.map((c) =>
                  c.id === commentId
                    ? { ...c, content, timestamp: new Date().toISOString() }
                    : c
                ),
              },
            },
          };
        });
      }
    } catch (error) {
      console.error('Failed to update comment:', error);
      // Still update local state on error (optimistic update)
      setReviewState((prev) => {
        const review = prev.reviews[stepId];
        if (!review) return prev;

        return {
          ...prev,
          reviews: {
            ...prev.reviews,
            [stepId]: {
              ...review,
              comments: review.comments.map((c) =>
                c.id === commentId
                  ? { ...c, content, timestamp: new Date().toISOString() }
                  : c
              ),
            },
          },
        };
      });
    }
  }, [planId]);

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
