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
      
      // Try to load from localStorage as fallback
      try {
        const stored = localStorage.getItem(`plan-comments-${planId}`);
        if (stored) {
          setComments(JSON.parse(stored));
        }
      } catch (storageError) {
        console.error('Error loading from localStorage:', storageError);
      }
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
        
        // Also save to localStorage
        try {
          const updated = [...comments, result.comment];
          localStorage.setItem(`plan-comments-${planId}`, JSON.stringify(updated));
        } catch (storageError) {
          console.error('Error saving to localStorage:', storageError);
        }
      }
      
      return result;
    } catch (err) {
      console.error('Error adding plan comment:', err);
      
      // Fallback to localStorage only
      const newComment: PlanCommentDTO = {
        id: Date.now().toString(),
        content,
        author,
        createdAt: new Date().toISOString(),
      };
      
      setComments(prev => [...prev, newComment]);
      
      try {
        const updated = [...comments, newComment];
        localStorage.setItem(`plan-comments-${planId}`, JSON.stringify(updated));
      } catch (storageError) {
        console.error('Error saving to localStorage:', storageError);
      }
      
      return { success: true, comment: newComment };
    }
  }, [planId, comments]);

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
        
        // Also update localStorage
        try {
          const updated = comments.map(c => 
            c.id === commentId 
              ? { ...c, content, updatedAt: new Date().toISOString() } 
              : c
          );
          localStorage.setItem(`plan-comments-${planId}`, JSON.stringify(updated));
        } catch (storageError) {
          console.error('Error saving to localStorage:', storageError);
        }
      }
      
      return result;
    } catch (err) {
      console.error('Error updating plan comment:', err);
      
      // Fallback: update locally anyway for better UX
      setComments(prev => 
        prev.map(c => 
          c.id === commentId 
            ? { ...c, content, updatedAt: new Date().toISOString() } 
            : c
        )
      );
      
      try {
        const updated = comments.map(c => 
          c.id === commentId 
            ? { ...c, content, updatedAt: new Date().toISOString() } 
            : c
        );
        localStorage.setItem(`plan-comments-${planId}`, JSON.stringify(updated));
      } catch (storageError) {
        console.error('Error saving to localStorage:', storageError);
      }
      
      return { success: true };
    }
  }, [planId, comments]);

  const deleteComment = useCallback(async (commentId: string) => {
    try {
      const result = await planService.deletePlanComment(planId, commentId);
      
      if (result.success) {
        setComments(prev => prev.filter(c => c.id !== commentId));
        
        // Also update localStorage
        try {
          const updated = comments.filter(c => c.id !== commentId);
          localStorage.setItem(`plan-comments-${planId}`, JSON.stringify(updated));
        } catch (storageError) {
          console.error('Error saving to localStorage:', storageError);
        }
      }
      
      return result;
    } catch (err) {
      console.error('Error deleting plan comment:', err);
      
      // Fallback: delete locally anyway
      setComments(prev => prev.filter(c => c.id !== commentId));
      
      try {
        const updated = comments.filter(c => c.id !== commentId);
        localStorage.setItem(`plan-comments-${planId}`, JSON.stringify(updated));
      } catch (storageError) {
        console.error('Error saving to localStorage:', storageError);
      }
      
      return { success: true };
    }
  }, [planId, comments]);

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
