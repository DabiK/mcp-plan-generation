import { useEffect, useRef } from 'react';
import type { StepDTO } from '@/types';
import type { Phase } from '@/lib/phaseDetection';

interface MiniMapProps {
  steps: StepDTO[];
  phases: Phase[];
  currentStepIndex: number;
  onStepClick: (index: number) => void;
  reviewedSteps: Set<number>; // Indices des steps reviewés (approved/rejected/skipped)
}

export function MiniMap({ steps, phases, currentStepIndex, onStepClick, reviewedSteps }: MiniMapProps) {
  const currentStepRef = useRef<HTMLButtonElement>(null);

  // Auto-scroll vers le step courant
  useEffect(() => {
    if (currentStepRef.current) {
      currentStepRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [currentStepIndex]);

  return (
    <div className="sticky top-24 w-64 h-[calc(100vh-7rem)] flex flex-col bg-card border border-border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border bg-muted/30">
        <h3 className="font-semibold text-sm">Navigation rapide</h3>
        <p className="text-xs text-muted-foreground mt-1">
          {steps.length} étapes · {phases.length} phases
        </p>
      </div>

      {/* Steps list grouped by phases */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {phases.map((phase, phaseIdx) => {
          const completedInPhase = phase.stepIndexes.filter(idx => reviewedSteps.has(idx)).length;
          const progressPercent = (completedInPhase / phase.stepIndexes.length) * 100;

          return (
            <div key={phaseIdx} className="space-y-1.5">
              {/* Phase header */}
              <div className="px-2 py-1.5 bg-muted/50 rounded-md">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium flex items-center gap-1.5">
                    <span>{phase.icon}</span>
                    <span>{phase.name}</span>
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {completedInPhase}/{phase.stepIndexes.length}
                  </span>
                </div>
                {/* Mini progress bar */}
                <div className="w-full bg-background rounded-full h-1 mt-1.5">
                  <div
                    className="bg-foreground h-1 rounded-full transition-all"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Steps in phase */}
              <div className="space-y-0.5 pl-1">
                {phase.stepIndexes.map((stepIdx) => {
                  const step = steps[stepIdx];
                  const isCurrent = stepIdx === currentStepIndex;
                  const isReviewed = reviewedSteps.has(stepIdx);

                  return (
                    <button
                      key={stepIdx}
                      ref={isCurrent ? currentStepRef : null}
                      onClick={() => onStepClick(stepIdx)}
                      className={`
                        w-full text-left px-2 py-1.5 rounded text-xs
                        transition-all duration-150
                        ${isCurrent 
                          ? 'bg-foreground text-background font-semibold shadow-sm' 
                          : isReviewed
                            ? 'bg-muted/70 text-muted-foreground hover:bg-muted'
                            : 'hover:bg-muted/50 text-foreground'
                        }
                      `}
                    >
                      <div className="flex items-center gap-1.5">
                        {/* Status indicator */}
                        <span className={`
                          w-1.5 h-1.5 rounded-full flex-shrink-0
                          ${isCurrent ? 'bg-background' : isReviewed ? 'bg-green-500' : 'bg-border'}
                        `} />
                        
                        {/* Step number and title */}
                        <span className="truncate flex-1">
                          <span className="font-medium">#{stepIdx + 1}</span>
                          {' '}
                          <span className={isCurrent ? '' : 'opacity-90'}>
                            {step.title}
                          </span>
                        </span>

                        {/* Dependencies indicator */}
                        {step.dependsOn && step.dependsOn.length > 0 && (
                          <span className="text-[10px] opacity-60">
                            ⤷{step.dependsOn.length}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer with keyboard shortcuts */}
      <div className="px-3 py-2 border-t border-border bg-muted/20 text-[10px] text-muted-foreground space-y-0.5">
        <div className="flex items-center justify-between">
          <span>← → Navigation</span>
        </div>
        <div className="flex items-center justify-between">
          <span>A / R / S Décision</span>
        </div>
      </div>
    </div>
  );
}
