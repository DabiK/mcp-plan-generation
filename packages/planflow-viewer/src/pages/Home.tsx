import { Link } from 'react-router-dom';
import { usePlans } from '@/hooks/usePlans';
import { ArrowRight, FileText, Loader2 } from 'lucide-react';

export default function Home() {
  const { data: plans, isLoading } = usePlans({ limit: 5 });

  const stats = plans ? {
    total: plans.length,
    pending: plans.filter(p => p.status === 'pending').length,
    inProgress: plans.filter(p => p.status === 'in_progress').length,
    completed: plans.filter(p => p.status === 'completed').length,
  } : null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-2">PlanFlow Viewer</h1>
        <p className="text-muted-foreground">
          Visualisez et gérez vos plans d'implémentation
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="border border-border p-6 bg-background">
          <div className="text-2xl font-bold">{stats?.total ?? '—'}</div>
          <div className="text-sm text-muted-foreground mt-1">Total Plans</div>
        </div>
        <div className="border border-border p-6 bg-background">
          <div className="text-2xl font-bold">{stats?.pending ?? '—'}</div>
          <div className="text-sm text-muted-foreground mt-1">Pending</div>
        </div>
        <div className="border border-border p-6 bg-background">
          <div className="text-2xl font-bold">{stats?.inProgress ?? '—'}</div>
          <div className="text-sm text-muted-foreground mt-1">In Progress</div>
        </div>
        <div className="border border-border p-6 bg-background">
          <div className="text-2xl font-bold">{stats?.completed ?? '—'}</div>
          <div className="text-sm text-muted-foreground mt-1">Completed</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Actions rapides</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            to="/plans/new"
            className="border border-border p-6 bg-background hover:border-foreground transition-colors group"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold mb-1">Créer un plan</div>
                <div className="text-sm text-muted-foreground">
                  Nouveau plan d'implémentation
                </div>
              </div>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          <Link
            to="/plans"
            className="border border-border p-6 bg-background hover:border-foreground transition-colors group"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold mb-1">Voir tous les plans</div>
                <div className="text-sm text-muted-foreground">
                  Liste complète avec filtres
                </div>
              </div>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Plans */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Plans récents</h2>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : plans && plans.length > 0 ? (
          <div className="space-y-2">
            {plans.map((plan) => (
              <Link
                key={plan.planId}
                to={`/plans/${plan.planId}`}
                className="block border border-border p-4 bg-background hover:border-foreground transition-colors group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <FileText className="w-5 h-5 mt-0.5 text-muted-foreground" />
                    <div>
                      <div className="font-semibold group-hover:text-foreground">
                        {plan.metadata.title}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {plan.metadata.description || 'No description'}
                      </div>
                      <div className="flex items-center space-x-3 mt-2 text-xs text-muted-foreground">
                        <span>{plan.planType}</span>
                        <span>•</span>
                        <span>{plan.steps.length} steps</span>
                        <span>•</span>
                        <span>{plan.status}</span>
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all" />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Aucun plan disponible</p>
            <Link to="/plans/new" className="text-foreground underline mt-2 inline-block">
              Créer votre premier plan
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
