import { useState, useCallback, useEffect } from 'react';
import { planService } from '@/services/planService';
import type { PlanCommentDTO } from '@/types';

export const usePlanComments = (planId: string) => {
  const [comments, setComments] = useState<PlanCommentDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadComments = useCallback(async () => {
    if (!planId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await planService.getPlanComments(planId);
      setComments(result.comments || []);
    } catch (err) {
      console.error('Error loading plan comments:', err);
      setError(err instanceof Error ? err.message : 'Failed to load comments');
    } finally {
      setIsLoading(false);
    }
  }, [planId]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  const addComment = useCallback(async (content: string, author?: string) => {
    try {
      const result = await planService.addPlanComment(planId, content, author);
      
      if (result.success && result.comment) {
        setComments(prev => [...prev, result.comment]);
      }
      
      return result;
    } catch (err) {
      console.error('Error adding plan comment:', err);
      throw err;
    }
  }, [planId]);

  const updateComment = useCallback(async (commentId: string, content: string) => {
    try {
      const result = await planService.updatePlanComment(planId, commentId, content);
      
      if (result.success) {
        setComments(prev => 
          prev.map(c => 
            c.id === commentId 
              ? { ...c, content, updatedAt: new Date().toISOString() } 
              : c
          )
        );
      }
      
      return result;
    } catch (err) {
      console.error('Error updating plan comment:', err);
      throw err;
    }
  }, [planId]);

  const deleteComment = useCallback(async (commentId: string) => {
    try {
      const result = await planService.deletePlanComment(planId, commentId);
      
      if (result.success) {
        setComments(prev => prev.filter(c => c.id !== commentId));
      }
      
      return result;
    } catch (err) {
      console.error('Error deleting plan comment:', err);
      throw err;
    }
  }, [planId]);

  return {
    comments,
    isLoading,
    error,
    addComment,
    updateComment,
    deleteComment,
    refresh: loadComments,
  };
};
