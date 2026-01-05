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
  const [copiedPrompt, setCopiedPrompt] = useState(false);

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

  const handleCopyPrompt = () => {
    const prompt = `Récupère le plan avec l'ID "${plan.planId}" et applique les modifications liées aux commentaires que tu trouveras dans le plan.`;
    copyToClipboard(prompt, setCopiedPrompt);
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
              onClick={handleCopyPrompt}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-600 dark:text-blue-400 rounded-lg transition-colors"
              title="Copier le prompt pour appliquer les commentaires"
            >
              {copiedPrompt ? (
                <>
                  <svg className="w-3.5 h-3.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-green-500">Copié !</span>
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                  </svg>
                  <span>Copier Prompt</span>
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
