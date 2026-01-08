import { useState } from 'react';
import type { PlanDTO } from '@/types';

interface ReviewStats {
  approved: number;
  rejected: number;
  skipped: number;
  pending: number;
}

interface ReviewSummaryHeaderProps {
  plan: PlanDTO;
  stats: ReviewStats;
  currentStepIndex: number;
  currentPhase?: {
    name: string;
    current: number;
    total: number;
  };
}

export function ReviewSummaryHeader({ plan, stats, currentStepIndex, currentPhase }: ReviewSummaryHeaderProps) {
  const [copiedId, setCopiedId] = useState(false);
  const [copiedReviewSummary, setCopiedReviewSummary] = useState(false);
  const [copiedUpdatePlan, setCopiedUpdatePlan] = useState(false);
  const [copiedDetailedAnalysis, setCopiedDetailedAnalysis] = useState(false);
  const [copiedEnrichPlan, setCopiedEnrichPlan] = useState(false);

  const copyToClipboard = async (text: string, setCopied: (val: boolean) => void) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleCopyId = () => {
    copyToClipboard(plan.planId, setCopiedId);
  };

  const handleCopyReviewSummary = () => {
    const prompt = `Récupère le plan ${plan.planId} et analyse les commentaires de revue.

Statistiques actuelles:
- ${stats.approved} approuvées, ${stats.rejected} rejetées, ${stats.skipped} ignorées, ${stats.pending} en attente
- Progression: étape ${currentStepIndex + 1}/${plan.steps.length}

Fournis un résumé détaillé des retours, identifie les patterns dans les commentaires, et propose des actions d'amélioration prioritaires.`;

    copyToClipboard(prompt, setCopiedReviewSummary);
  };

  const handleCopyUpdatePlan = () => {
    const prompt = `Mets à jour le plan ${plan.planId} en te basant sur les commentaires de revue.

Instructions:
1. Récupère le plan et tous ses commentaires (plan-level et step-level)
2. Analyse les retours et identifie les modifications nécessaires
3. Applique les changements via plans-patch ou plans-update-step selon les besoins
4. Priorise les commentaires des étapes rejetées et en attente
5. Préserve la cohérence des dépendances et de la structure

Fournis un résumé des modifications apportées.`;

    copyToClipboard(prompt, setCopiedUpdatePlan);
  };

  const handleCopyDetailedAnalysis = () => {
    const prompt = `Analyse en profondeur le plan ${plan.planId}.

Axes d'analyse:
1. **Structure et cohérence**: Évalue la logique des ${plan.steps.length} étapes, la pertinence des dépendances, et la couverture de l'objectif
2. **Qualité des critères**: Vérifie les critères de validation, les tests automatisés, et les indicateurs de succès
3. **Risques et blocages**: Identifie les points critiques, dépendances circulaires potentielles, et étapes à risque
4. **Complétude**: Évalue les actions définies, la documentation, et les diagrammes
5. **Estimations**: Analyse la cohérence des durées estimées et la charge globale

Fournis une note /10, les forces principales, les faiblesses critiques, et 3-5 recommandations d'amélioration concrètes.`;

    copyToClipboard(prompt, setCopiedDetailedAnalysis);
  };

  const handleCopyEnrichPlan = () => {
    const prompt = `Enrichis le plan ${plan.planId} pour le rendre plus complet et professionnel.

Améliorations attendues:
1. **Actions détaillées**: Ajoute des actions concrètes pour chaque étape (create_file, edit_file, run_command, test, etc.)
2. **Critères de validation**: Renforce les critères de succès et ajoute des tests automatisés pertinents
3. **Diagrammes**: Crée ou améliore les diagrammes Mermaid pour visualiser l'architecture, les flux, ou les processus
4. **Documentation**: Enrichis les descriptions avec plus de contexte et de détails techniques
5. **Estimations**: Affine les durées estimées si nécessaire
6. **Dépendances**: Vérifie et optimise les dépendances entre étapes

Utilise plans-patch pour mettre à jour les éléments du plan et plans-update-step pour les étapes individuelles. Fournis un résumé des enrichissements apportés.`;

    copyToClipboard(prompt, setCopiedEnrichPlan);
  };

  const totalSteps = plan.steps.length;
  const progress = ((currentStepIndex + 1) / totalSteps) * 100;
  
  // Calculer le temps estimé total et passé
  const getTotalTime = () => {
    let total = 0;
    let elapsed = 0;
    
    plan.steps.forEach((step: any, idx: number) => {
      if (step.estimatedDuration) {
        const duration = typeof step.estimatedDuration === 'object' 
          ? step.estimatedDuration.value 
          : parseInt(step.estimatedDuration);
        
        if (idx <= currentStepIndex) {
          elapsed += duration;
        }
        total += duration;
      }
    });
    
    return { total, elapsed };
  };

  const { total: totalTime, elapsed: elapsedTime } = getTotalTime();

  return (
    <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-4">
        {/* Title and objective */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h1 className="text-xl font-bold flex items-center gap-2">
              📋 {plan.metadata.title}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {plan.plan.objective}
            </p>
          </div>
          
          {/* Action buttons */}
          <div className="flex items-center gap-2 ml-4">
            <button
              onClick={handleCopyId}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-secondary hover:bg-border border border-border rounded-lg transition-colors"
              title="Copier l'ID du plan"
            >
              {copiedId ? (
                <>
                  <svg className="w-3.5 h-3.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-green-500">Copié !</span>
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <span>ID Plan</span>
                </>
              )}
            </button>
            
            <button
              onClick={handleCopyReviewSummary}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 text-green-600 dark:text-green-400 rounded-lg transition-colors"
              title="Copier prompt de résumé de revue"
            >
              {copiedReviewSummary ? (
                <>
                  <svg className="w-3.5 h-3.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-green-500">Copié !</span>
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Résumé Revue</span>
                </>
              )}
            </button>

            <button
              onClick={handleCopyUpdatePlan}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 text-orange-600 dark:text-orange-400 rounded-lg transition-colors"
              title="Copier prompt pour mettre à jour le plan"
            >
              {copiedUpdatePlan ? (
                <>
                  <svg className="w-3.5 h-3.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-green-500">Copié !</span>
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <span>Update Plan</span>
                </>
              )}
            </button>

            <button
              onClick={handleCopyDetailedAnalysis}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 text-purple-600 dark:text-purple-400 rounded-lg transition-colors"
              title="Copier prompt pour analyser le plan"
            >
              {copiedDetailedAnalysis ? (
                <>
                  <svg className="w-3.5 h-3.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-green-500">Copié !</span>
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <span>Analyser Plan</span>
                </>
              )}
            </button>

            <button
              onClick={handleCopyEnrichPlan}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-600 dark:text-blue-400 rounded-lg transition-colors"
              title="Copier prompt pour enrichir le plan"
            >
              {copiedEnrichPlan ? (
                <>
                  <svg className="w-3.5 h-3.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-green-500">Copié !</span>
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span>Enrichir Plan</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-muted-foreground">
              Étape {currentStepIndex + 1}/{totalSteps}
            </span>
            <span className="text-xs font-semibold">
              {Math.round(progress)}%
            </span>
          </div>
          <div className="w-full bg-secondary rounded-full h-1.5">
            <div
              className="bg-foreground h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-6 text-sm">
          {/* Review decisions */}
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="text-green-500 font-bold">✓{stats.approved}</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="text-red-500 font-bold">✗{stats.rejected}</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="text-gray-500 font-bold">⏭{stats.skipped}</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="text-muted-foreground font-bold">○{stats.pending}</span>
            </span>
          </div>

          {/* Separator */}
          <div className="w-px h-4 bg-border" />

          {/* Phase indicator */}
          {currentPhase && (
            <>
              <span className="text-muted-foreground">
                Phase: <span className="font-medium text-foreground">{currentPhase.name}</span> ({currentPhase.current}/{currentPhase.total})
              </span>
              <div className="w-px h-4 bg-border" />
            </>
          )}

          {/* Time */}
          {totalTime > 0 && (
            <span className="text-muted-foreground">
              Temps: <span className="font-medium text-foreground">{elapsedTime}/{totalTime}min</span>
            </span>
          )}

          {/* Blocked count */}
          {stats.pending > 0 && (
            <>
              <div className="w-px h-4 bg-border" />
              <span className="text-muted-foreground">
                Restant: <span className="font-medium text-foreground">{stats.pending}</span>
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
