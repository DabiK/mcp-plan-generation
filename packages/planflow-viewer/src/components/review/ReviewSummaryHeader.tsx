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
