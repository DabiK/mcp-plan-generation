import { useMutation, useQueryClient } from '@tanstack/react-query';
import { planService } from '@/services/planService';

/**
 * Hook pour ajouter un commentaire à une étape
 * Invalide automatiquement le cache pour déclencher un refetch
 */
export function useAddStepComment(planId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ stepId, content, author }: { 
      stepId: string; 
      content: string; 
      author?: string 
    }) => planService.addStepComment(planId, stepId, content, author),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans', planId] });
    },
  });
}

/**
 * Hook pour modifier un commentaire d'une étape
 * Invalide automatiquement le cache pour déclencher un refetch
 */
export function useUpdateStepComment(planId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ stepId, commentId, content }: { 
      stepId: string; 
      commentId: string; 
      content: string 
    }) => planService.updateStepComment(planId, stepId, commentId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans', planId] });
    },
  });
}

/**
 * Hook pour supprimer un commentaire d'une étape
 * Invalide automatiquement le cache pour déclencher un refetch
 */
export function useDeleteStepComment(planId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ stepId, commentId }: { 
      stepId: string; 
      commentId: string 
    }) => planService.deleteStepComment(planId, stepId, commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans', planId] });
    },
  });
}

/**
 * Hook pour définir le statut de review d'une étape
 * Invalide automatiquement le cache pour déclencher un refetch
 */
export function useSetStepReviewStatus(planId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ stepId, decision }: { 
      stepId: string; 
      decision: 'approved' | 'rejected' | 'skipped' 
    }) => planService.setStepReviewStatus(planId, stepId, decision),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans', planId] });
    },
  });
}
