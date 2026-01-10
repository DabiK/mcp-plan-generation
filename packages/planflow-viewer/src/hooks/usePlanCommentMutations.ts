import { useMutation, useQueryClient } from '@tanstack/react-query';
import { planService } from '@/services/planService';

/**
 * Hook pour ajouter un commentaire global au plan
 * Invalide automatiquement le cache pour déclencher un refetch
 */
export function useAddPlanComment(planId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ content, author }: { content: string; author?: string }) => 
      planService.addPlanComment(planId, content, author),
    onSuccess: () => {
      // Invalide le cache pour forcer un refetch automatique
      queryClient.invalidateQueries({ queryKey: ['plans', planId] });
    },
  });
}

/**
 * Hook pour modifier un commentaire global du plan
 * Invalide automatiquement le cache pour déclencher un refetch
 */
export function useUpdatePlanComment(planId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ commentId, content }: { commentId: string; content: string }) => 
      planService.updatePlanComment(planId, commentId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans', planId] });
    },
  });
}

/**
 * Hook pour supprimer un commentaire global du plan
 * Invalide automatiquement le cache pour déclencher un refetch
 */
export function useDeletePlanComment(planId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (commentId: string) => 
      planService.deletePlanComment(planId, commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans', planId] });
    },
  });
}
