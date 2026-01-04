import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { planService } from '@/services/planService';
import type { PlanFilters, CreatePlanInputDTO, UpdatePlanInputDTO } from '@/types';

export function usePlans(filters?: PlanFilters) {
  return useQuery({
    queryKey: ['plans', filters],
    queryFn: () => planService.listPlans(filters),
  });
}

export function usePlanDetail(planId: string | undefined) {
  return useQuery({
    queryKey: ['plans', planId],
    queryFn: () => planService.getPlan(planId!),
    enabled: !!planId,
  });
}

export function useCreatePlan() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreatePlanInputDTO) => planService.createPlan(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
    },
  });
}

export function useUpdatePlan(planId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (updates: UpdatePlanInputDTO) => planService.updatePlan(planId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      queryClient.invalidateQueries({ queryKey: ['plans', planId] });
    },
  });
}

export function useDeletePlan() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (planId: string) => planService.deletePlan(planId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
    },
  });
}

export function usePlanFormat() {
  return useQuery({
    queryKey: ['plan-format'],
    queryFn: () => planService.getFormat(),
    staleTime: Infinity, // Format doesn't change
  });
}

export function useValidatePlan() {
  return useMutation({
    mutationFn: (plan: any) => planService.validatePlan(plan),
  });
}
