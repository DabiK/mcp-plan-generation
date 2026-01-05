import { useParams, Link, useNavigate } from 'react-router-dom';
import { usePlanDetail, useDeletePlan } from '@/hooks/usePlans';
import { Loader2, ArrowLeft, Trash2 } from 'lucide-react';
import { useState, useMemo } from 'react';
import FlowGraph from '@/components/flow/FlowGraph';
import { planToFlowGraph } from '@/utils/flowHelpers';
import { ContextTab } from '@/components/plan-detail/ContextTab';

export default function PlanDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: plan, isLoading, error } = usePlanDetail(id);
  const deleteMutation = useDeletePlan();
  const [activeTab, setActiveTab] = useState<'overview' | 'review' | 'graph' | 'steps' | 'json' | 'context'>('overview');
  
  const flowGraph = useMemo(() => {
    if (!plan) return { nodes: [], edges: [] };
    return planToFlowGraph(plan);
  }, [plan]);

  const handleDelete = async () => {
    if (!id || !confirm('Êtes-vous sûr de vouloir supprimer ce plan ?')) return;
    
    try {
      await deleteMutation.mutateAsync(id);
      navigate('/plans');
    } catch (error) {
      alert('Erreur lors de la suppression');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  if (error || !plan) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">Plan non trouvé</p>
        <Link to="/plans" className="text-foreground underline">
          Retour aux plans
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          to="/plans"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Retour aux plans
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold">{plan.metadata.title}</h1>
            <p className="text-muted-foreground mt-2">
              {plan.metadata.description}
            </p>
            <div className="flex items-center space-x-3 mt-4 text-sm">
              <span className="px-2 py-1 bg-secondary text-foreground">
                {plan.planType}
              </span>
              <span className="px-2 py-1 bg-secondary text-foreground">
                {plan.status}
              </span>
              <span className="text-muted-foreground">
                {plan.steps.length} steps
              </span>
              <span className="text-muted-foreground">v{plan.revision}</span>
            </div>
          </div>

          <button
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="px-4 py-2 border border-border hover:border-foreground transition-colors disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <div className="flex space-x-6">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'overview'
                ? 'border-foreground text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => navigate(`/plans/${id}/review`)}
            className="pb-3 text-sm font-medium border-b-2 border-transparent text-muted-foreground hover:text-foreground transition-colors"
          >
            Review
          </button>
          <button
            onClick={() => setActiveTab('graph')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'graph'
                ? 'border-foreground text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Graph
          </button>
          <button
            onClick={() => setActiveTab('steps')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'steps'
                ? 'border-foreground text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Steps
          </button>
          <button
            onClick={() => setActiveTab('json')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'json'
                ? 'border-foreground text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            JSON
          </button>
          <button
            onClick={() => setActiveTab('context')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'context'
                ? 'border-foreground text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Context
          </button>
        </div>
      </div>

      {/* Content */}
      <div>
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="border border-border p-6">
              <h2 className="font-semibold mb-4">Informations</h2>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm text-muted-foreground">ID</dt>
                  <dd className="font-mono text-sm">{plan.planId}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Objectif</dt>
                  <dd>{plan.plan.objective}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Scope</dt>
                  <dd className="text-sm">{plan.plan.scope || '—'}</dd>
                </div>
                {plan.metadata.tags && plan.metadata.tags.length > 0 && (
                  <div>
                    <dt className="text-sm text-muted-foreground">Tags</dt>
                    <dd className="flex flex-wrap gap-2 mt-1">
                      {plan.metadata.tags.map((tag: string) => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-secondary text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
        )}

        {activeTab === 'graph' && (
          <div>
            <FlowGraph nodes={flowGraph.nodes} edges={flowGraph.edges} />
          </div>
        )}

        {activeTab === 'steps' && (
          <div className="border border-border">
            {plan.steps.map((step: any, index: number) => (
              <div
                key={step.id}
                className={`p-4 ${index !== 0 ? 'border-t border-border' : ''}`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-semibold">{step.title}</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {step.description}
                    </div>
                    <div className="flex items-center space-x-3 mt-3 text-xs">
                      <span className="px-2 py-1 bg-secondary">
                        {step.kind}
                      </span>
                      <span className="px-2 py-1 bg-secondary">
                        {step.status}
                      </span>
                      {step.dependsOn && step.dependsOn.length > 0 && (
                        <span className="text-muted-foreground">
                          {step.dependsOn.length} dependencies
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {step.id}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'json' && (
          <div className="border border-border p-4">
            <pre className="text-xs font-mono overflow-x-auto">
              {JSON.stringify(plan, null, 2)}
            </pre>
          </div>
        )}

        {activeTab === 'context' && (
          <ContextTab planId={plan.planId} />
        )}
      </div>
    </div>
  );
}
