import { useState } from 'react';
import { Link } from 'react-router-dom';
import { usePlans } from '@/hooks/usePlans';
import { Loader2, FileText, ArrowRight, Search, Copy, Check } from 'lucide-react';
import type { PlanFilters } from '@/types';

export default function PlanList() {
  const [filters, setFilters] = useState<PlanFilters>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { data: plans, isLoading, error } = usePlans(filters);

  const copyToClipboard = async (id: string) => {
    try {
      await navigator.clipboard.writeText(id);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy ID:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Plans</h1>
          <p className="text-muted-foreground mt-1">
            Gérez vos plans d'implémentation
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-4">
        <div className="flex items-center space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Rechercher par titre ou description..."
              className="w-full pl-10 pr-4 py-2 bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground"
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>
          
          <select
            className="px-4 py-2 bg-background border border-border text-foreground focus:outline-none focus:border-foreground"
            onChange={(e) => setFilters({ ...filters, planType: e.target.value || undefined })}
          >
            <option value="">Tous les types</option>
            <option value="feature">Feature</option>
            <option value="bugfix">Bugfix</option>
            <option value="refactor">Refactor</option>
          </select>

          <select
            className="px-4 py-2 bg-background border border-border text-foreground focus:outline-none focus:border-foreground"
            onChange={(e) => setFilters({ ...filters, status: e.target.value || undefined })}
          >
            <option value="">Tous les statuts</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
          </select>
        </div>

        {/* ID Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Rechercher par ID du plan..."
            className="w-full pl-10 pr-4 py-2 bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground font-mono text-sm"
            onChange={(e) => setFilters({ ...filters, planId: e.target.value || undefined })}
          />
        </div>
      </div>

      {/* Plans List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : error ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>Erreur lors du chargement des plans</p>
        </div>
      ) : plans && plans.length > 0 ? (
        <div className="border border-border">
          {plans.map((plan, index) => (
            <Link
              key={plan.planId}
              to={`/plans/${plan.planId}`}
              className={`block p-4 hover:bg-secondary transition-colors group ${
                index !== 0 ? 'border-t border-border' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <FileText className="w-5 h-5 mt-0.5 text-muted-foreground" />
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="font-semibold group-hover:text-foreground">
                        {plan.metadata.title}
                      </div>
                      <div className="flex items-center space-x-2">
                        <code className="px-2 py-1 bg-muted text-xs font-mono text-muted-foreground border border-border">
                          {plan.planId}
                        </code>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            copyToClipboard(plan.planId);
                          }}
                          className="p-1 hover:bg-background rounded transition-colors"
                          title="Copier l'ID"
                        >
                          {copiedId === plan.planId ? (
                            <Check className="w-3 h-3 text-green-600" />
                          ) : (
                            <Copy className="w-3 h-3 text-muted-foreground hover:text-foreground" />
                          )}
                        </button>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {plan.metadata.description || 'No description'}
                    </div>
                    <div className="flex items-center space-x-4 mt-3 text-xs">
                      <span className="px-2 py-1 bg-secondary text-foreground">
                        {plan.planType}
                      </span>
                      <span className="px-2 py-1 bg-secondary text-foreground">
                        {plan.status}
                      </span>
                      <span className="text-muted-foreground">
                        {plan.steps.length} steps
                      </span>
                      <span className="text-muted-foreground">
                        v{plan.revision}
                      </span>
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all flex-shrink-0 ml-4" />
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 border border-border">
          <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground mb-2">Aucun plan trouvé</p>
        </div>
      )}
    </div>
  );
}
