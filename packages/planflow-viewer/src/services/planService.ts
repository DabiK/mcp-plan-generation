import type { PlanDTO, CreatePlanInputDTO, UpdatePlanInputDTO, PlanFilters } from '@/types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const planService = {
  async getFormat() {
    const res = await fetch(`${API_BASE}/api/plans/format`);
    if (!res.ok) throw new Error('Failed to fetch format');
    return res.json();
  },

  async validatePlan(plan: any) {
    const res = await fetch(`${API_BASE}/api/plans/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(plan),
    });
    if (!res.ok) throw new Error('Failed to validate plan');
    return res.json();
  },

  async createPlan(data: CreatePlanInputDTO): Promise<{ planId: string; plan: PlanDTO }> {
    const res = await fetch(`${API_BASE}/api/plans`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to create plan');
    }
    return res.json();
  },

  async getPlan(id: string): Promise<PlanDTO> {
    const res = await fetch(`${API_BASE}/api/plans/${id}`);
    if (!res.ok) {
      if (res.status === 404) throw new Error('Plan not found');
      throw new Error('Failed to fetch plan');
    }
    return res.json();
  },

  async updatePlan(id: string, updates: UpdatePlanInputDTO): Promise<PlanDTO> {
    const res = await fetch(`${API_BASE}/api/plans/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) {
      if (res.status === 404) throw new Error('Plan not found');
      const error = await res.json();
      throw new Error(error.error || 'Failed to update plan');
    }
    return res.json();
  },

  async deletePlan(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/api/plans/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      if (res.status === 404) throw new Error('Plan not found');
      throw new Error('Failed to delete plan');
    }
  },

  async listPlans(filters?: PlanFilters): Promise<PlanDTO[]> {
    const params = new URLSearchParams();
    if (filters?.planType) params.append('planType', filters.planType);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.offset) params.append('offset', filters.offset.toString());
    
    const url = `${API_BASE}/api/plans${params.toString() ? `?${params}` : ''}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to list plans');
    const data = await res.json();
    return data.plans || data; // Support both response formats
  },
};
