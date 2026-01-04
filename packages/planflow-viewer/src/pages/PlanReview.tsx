import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePlanDetail } from '@/hooks/usePlans';
import { useStepReviews } from '@/hooks/useStepReviews';
import { usePlanComments } from '@/hooks/usePlanComments';
import { StepReviewCard } from '@/components/review/StepReviewCard';
import { ReviewSummaryHeader } from '@/components/review/ReviewSummaryHeader';
import { MiniMap } from '@/components/review/MiniMap';
import { CompactStepCard } from '@/components/review/CompactStepCard';
import { PlanComments } from '@/components/PlanComments';
import { detectPhases, getCurrentPhase, getPhaseStats } from '@/lib/phaseDetection';
import type { ReviewDecision } from '@/types';

export function PlanReview() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: plan, isLoading } = usePlanDetail(id || '');
  const [compactMode, setCompactMode] = useState(true); // Compact par défaut
  const [expandedStep, setExpandedStep] = useState<string | null>(null); // Step expanded in compact mode
  const [showPlanComments, setShowPlanComments] = useState(false); // Panneau de commentaires
  
  const {
    reviewState,
    addReview,
    addComment,
    updateComment,
    deleteComment,
    nextStep,
    previousStep,
    completeReview,
    resetReview,
    getStepReview,
    getReviewStats,
    setCurrentStepIndex,
  } = useStepReviews(id || '');

  const {
    comments: planComments,
    isLoading: commentsLoading,
    addComment: addPlanComment,
    updateComment: updatePlanComment,
    deleteComment: deletePlanComment,
  } = usePlanComments(id || '');

  // Detect phases
  const phases = plan ? detectPhases(plan.steps) : [];
  const currentPhase = plan ? getCurrentPhase(phases, reviewState.currentStepIndex) : undefined;
  
  // Get reviewed steps for MiniMap
  const reviewedSteps = new Set<number>();
  plan?.steps.forEach((step: any, idx: number) => {
    const review = getStepReview(step.id);
    if (review?.decision) {
      reviewedSteps.add(idx);
    }
  });

  const currentStep = plan?.steps[reviewState.currentStepIndex];
  const isLastStep = reviewState.currentStepIndex === (plan?.steps.length || 0) - 1;
  const isComplete = reviewState.isComplete || reviewState.currentStepIndex >= (plan?.steps.length || 0);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) {
        return; // Don't trigger shortcuts when typing
      }

      const currentStepIndex = reviewState.currentStepIndex;
      const totalSteps = plan?.steps.length || 0;

      switch (e.key.toLowerCase()) {
        case 'a':
          if (compactMode) {
            // En mode compact, approuver l'étape courante et passer à la suivante
            if (plan && currentStepIndex < totalSteps) {
              const step = plan.steps[currentStepIndex];
              addReview(step.id, 'approved');
              if (currentStepIndex < totalSteps - 1) {
                nextStep();
                // Unfold la nouvelle étape courante (avec un petit délai pour s'assurer que l'état est mis à jour)
                setTimeout(() => {
                  if (plan && reviewState.currentStepIndex < plan.steps.length) {
                    setExpandedStep(plan.steps[reviewState.currentStepIndex].id);
                  }
                }, 0);
              } else {
                setExpandedStep(null);
              }
            }
          } else if (currentStep) {
            addReview(currentStep.id, 'approved');
            if (!isLastStep) nextStep();
          }
          break;
        case 'r':
          if (compactMode) {
            // En mode compact, rejeter l'étape courante et passer à la suivante
            if (plan && currentStepIndex < totalSteps) {
              const step = plan.steps[currentStepIndex];
              addReview(step.id, 'rejected');
              if (currentStepIndex < totalSteps - 1) {
                nextStep();
                setTimeout(() => {
                  if (plan && reviewState.currentStepIndex < plan.steps.length) {
                    setExpandedStep(plan.steps[reviewState.currentStepIndex].id);
                  }
                }, 0);
              } else {
                setExpandedStep(null);
              }
            }
          } else if (currentStep) {
            addReview(currentStep.id, 'rejected');
            if (!isLastStep) nextStep();
          }
          break;
        case 's':
          if (compactMode) {
            // En mode compact, skipper l'étape courante et passer à la suivante
            if (plan && currentStepIndex < totalSteps) {
              const step = plan.steps[currentStepIndex];
              addReview(step.id, 'skipped');
              if (currentStepIndex < totalSteps - 1) {
                nextStep();
                setTimeout(() => {
                  if (plan && reviewState.currentStepIndex < plan.steps.length) {
                    setExpandedStep(plan.steps[reviewState.currentStepIndex].id);
                  }
                }, 0);
              } else {
                setExpandedStep(null);
              }
            }
          } else if (currentStep) {
            addReview(currentStep.id, 'skipped');
            if (!isLastStep) nextStep();
          }
          break;
        case 'arrowleft':
          if (currentStepIndex > 0) {
            const newIndex = currentStepIndex - 1;
            previousStep();
            if (compactMode && plan) {
              // En mode compact, unfold l'étape précédente
              setTimeout(() => {
                if (plan && reviewState.currentStepIndex < plan.steps.length) {
                  setExpandedStep(plan.steps[reviewState.currentStepIndex].id);
                }
              }, 0);
            }
          }
          break;
        case 'arrowright':
          if (currentStepIndex < totalSteps - 1) {
            const newIndex = currentStepIndex + 1;
            nextStep();
            if (compactMode && plan) {
              // En mode compact, unfold l'étape suivante
              setTimeout(() => {
                if (plan && reviewState.currentStepIndex < plan.steps.length) {
                  setExpandedStep(plan.steps[reviewState.currentStepIndex].id);
                }
              }, 0);
            }
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentStep, isLastStep, reviewState.currentStepIndex, addReview, nextStep, previousStep, compactMode, plan, setExpandedStep]);

  // Auto-complete when reaching the end
  useEffect(() => {
    if (plan && reviewState.currentStepIndex >= plan.steps.length && !reviewState.isComplete) {
      completeReview();
    }
  }, [reviewState.currentStepIndex, plan, reviewState.isComplete, completeReview]);

  const handleDecision = (decision: ReviewDecision) => {
    if (currentStep) {
      addReview(currentStep.id, decision);
    }
  };

  const handleAddComment = (content: string) => {
    if (currentStep) {
      addComment(currentStep.id, content);
    }
  };

  const handleUpdateComment = (commentId: string, content: string) => {
    if (currentStep) {
      updateComment(currentStep.id, commentId, content);
    }
  };

  const handleDeleteComment = (commentId: string) => {
    if (currentStep) {
      deleteComment(currentStep.id, commentId);
    }
  };

  const handleSkip = () => {
    if (currentStep) {
      addReview(currentStep.id, 'skipped');
    }
  };

  const stats = getReviewStats();
  
  // Get phase stats for header
  const currentPhaseStats = currentPhase 
    ? getPhaseStats(currentPhase, reviewedSteps)
    : undefined;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-4 border-foreground/20 border-t-foreground rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Chargement du plan...</p>
        </div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-3">
          <p className="text-xl font-semibold">Plan introuvable</p>
          <button
            onClick={() => navigate('/plans')}
            className="px-4 py-2 bg-foreground text-background rounded-lg hover:opacity-90"
          >
            Retour à la liste
          </button>
        </div>
      </div>
    );
  }

  if (isComplete) {
    return (
      <div className="flex items-center justify-center min-h-screen p-6">
        <div className="w-full max-w-2xl text-center space-y-6">
          {/* Success animation */}
          <div className="w-24 h-24 mx-auto bg-green-500/10 rounded-full flex items-center justify-center">
            <svg className="w-12 h-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <div>
            <h1 className="text-3xl font-bold mb-2">Revue terminée !</h1>
            <p className="text-muted-foreground">
              Vous avez passé en revue toutes les étapes du plan
            </p>
          </div>

          {/* Stats summary */}
          <div className="bg-secondary border border-border rounded-xl p-6 space-y-4">
            <h2 className="text-xl font-semibold">Résumé</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-background rounded-lg">
                <div className="text-2xl font-bold">{plan.steps.length}</div>
                <div className="text-sm text-muted-foreground">Total</div>
              </div>
              <div className="p-4 bg-green-500/10 rounded-lg">
                <div className="text-2xl font-bold text-green-500">{stats.approved}</div>
                <div className="text-sm text-muted-foreground">Approuvées</div>
              </div>
              <div className="p-4 bg-red-500/10 rounded-lg">
                <div className="text-2xl font-bold text-red-500">{stats.rejected}</div>
                <div className="text-sm text-muted-foreground">Rejetées</div>
              </div>
              <div className="p-4 bg-blue-500/10 rounded-lg">
                <div className="text-2xl font-bold text-blue-500">{stats.commented}</div>
                <div className="text-sm text-muted-foreground">Commentées</div>
              </div>
            </div>

            {stats.rejected > 0 && (
              <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-lg text-left">
                <h3 className="font-semibold text-red-500 mb-2">Étapes rejetées</h3>
                <div className="space-y-1">
                  {plan.steps.map((step: any, idx: number) => {
                    const review = getStepReview(step.id);
                    if (review?.decision === 'rejected') {
                      return (
                        <div key={step.id} className="text-sm">
                          <span className="font-medium">#{idx + 1}</span> - {step.title}
                        </div>
                      );
                    }
                    return null;
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Plan Comments */}
          <div className="text-left">
            <PlanComments
              comments={planComments}
              onAddComment={addPlanComment}
              onUpdateComment={updatePlanComment}
              onDeleteComment={deletePlanComment}
              isLoading={commentsLoading}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => navigate(`/plans/${id}`)}
              className="px-6 py-3 bg-secondary border border-border rounded-lg hover:bg-border transition-colors"
            >
              Voir le plan
            </button>
            <button
              onClick={() => {
                resetReview();
              }}
              className="px-6 py-3 bg-foreground text-background rounded-lg hover:opacity-90 transition-opacity"
            >
              Recommencer la revue
            </button>
          </div>

          {/* Export option */}
          <button
            onClick={() => {
              const reviewData = {
                planId: plan.planId,
                planTitle: plan.metadata.title,
                reviewDate: new Date().toISOString(),
                stats,
                reviews: Object.values(reviewState.reviews),
              };
              const blob = new Blob([JSON.stringify(reviewData, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `review-${plan.planId}-${Date.now()}.json`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Exporter la revue (JSON)
          </button>
        </div>
      </div>
    );
  }

  if (!currentStep) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Aucune étape à afficher</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky header with summary */}
      <ReviewSummaryHeader
        plan={plan}
        stats={{
          approved: stats.approved,
          rejected: stats.rejected,
          skipped: stats.skipped,
          pending: plan.steps.length - stats.approved - stats.rejected - stats.skipped,
        }}
        currentStepIndex={reviewState.currentStepIndex}
        currentPhase={currentPhase && currentPhaseStats ? {
          name: currentPhase.name,
          current: currentPhaseStats.current,
          total: currentPhaseStats.total,
        } : undefined}
      />

      <div className="flex gap-6 p-6">
        {/* MiniMap sidebar */}
        <MiniMap
          steps={plan.steps}
          phases={phases}
          currentStepIndex={reviewState.currentStepIndex}
          onStepClick={(idx) => setCurrentStepIndex(idx)}
          reviewedSteps={reviewedSteps}
        />

        {/* Main content area */}
        <div className="flex-1">
          {/* Mode toggle */}
          <div className="max-w-4xl mx-auto mb-4 flex items-center justify-between">
            <button
              onClick={() => navigate(`/plans/${id}`)}
              className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Retour au plan
            </button>

            <div className="flex items-center gap-3">
              {/* Compact/Detailed toggle */}
              <div className="flex items-center gap-2 bg-secondary border border-border rounded-lg p-1">
                <button
                  onClick={() => setCompactMode(true)}
                  className={`px-3 py-1.5 rounded text-xs transition-colors ${
                    compactMode 
                      ? 'bg-foreground text-background' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Compact
                </button>
                <button
                  onClick={() => setCompactMode(false)}
                  className={`px-3 py-1.5 rounded text-xs transition-colors ${
                    !compactMode 
                      ? 'bg-foreground text-background' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Détaillé
                </button>
              </div>

              <button
                onClick={resetReview}
                className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Réinitialiser
              </button>
            </div>
          </div>

          {/* Compact mode: all steps visible */}
          {compactMode ? (
            <div className="max-w-4xl mx-auto space-y-2">
              {plan.steps.map((step: any, idx: number) => {
                const review = getStepReview(step.id);
                const isCurrent = idx === reviewState.currentStepIndex;
                const isExpanded = expandedStep === step.id;

                return (
                  <div key={step.id}>
                    {/* Compact card */}
                    <CompactStepCard
                      step={step}
                      stepNumber={idx + 1}
                      review={review}
                      isCurrent={isCurrent}
                      onClick={() => {
                        if (isExpanded) {
                          setExpandedStep(null);
                        } else {
                          setExpandedStep(step.id);
                          setCurrentStepIndex(idx);
                        }
                      }}
                    />

                    {/* Expanded detail card */}
                    {isExpanded && (
                      <div className="mt-2 mb-4">
                        <StepReviewCard
                          step={step}
                          stepNumber={idx + 1}
                          totalSteps={plan.steps.length}
                          existingReview={review}
                          onDecision={(decision) => {
                            addReview(step.id, decision);
                            setExpandedStep(null);
                            if (idx < plan.steps.length - 1) {
                              nextStep();
                              // Unfold la nouvelle étape courante
                              setTimeout(() => {
                                if (plan && reviewState.currentStepIndex < plan.steps.length) {
                                  setExpandedStep(plan.steps[reviewState.currentStepIndex].id);
                                }
                              }, 0);
                            }
                          }}
                          onAddComment={(content) => addComment(step.id, content)}
                          onUpdateComment={(commentId, content) => updateComment(step.id, commentId, content)}
                          onDeleteComment={(commentId) => deleteComment(step.id, commentId)}
                          onNext={() => {
                            setExpandedStep(null);
                            if (isLastStep) {
                              completeReview();
                            } else {
                              nextStep();
                            }
                          }}
                          onPrevious={() => {
                            setExpandedStep(null);
                            previousStep();
                          }}
                          onSkip={() => {
                            addReview(step.id, 'skipped');
                            setExpandedStep(null);
                            if (idx < plan.steps.length - 1) {
                              nextStep();
                              // Unfold la nouvelle étape courante
                              setTimeout(() => {
                                if (plan && reviewState.currentStepIndex < plan.steps.length) {
                                  setExpandedStep(plan.steps[reviewState.currentStepIndex].id);
                                }
                              }, 0);
                            }
                          }}
                          autoAdvance={false}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            /* Detailed mode: one step at a time (original behavior) */
            currentStep && (
              <StepReviewCard
                step={currentStep}
                stepNumber={reviewState.currentStepIndex + 1}
                totalSteps={plan.steps.length}
                existingReview={getStepReview(currentStep.id)}
                onDecision={handleDecision}
                onAddComment={handleAddComment}
                onUpdateComment={handleUpdateComment}
                onDeleteComment={handleDeleteComment}
                onNext={() => {
                  if (isLastStep) {
                    completeReview();
                  } else {
                    nextStep();
                  }
                }}
                onPrevious={previousStep}
                onSkip={handleSkip}
              />
            )
          )}
        </div>
      </div>

      {/* Floating Comments Button */}
      <button
        onClick={() => setShowPlanComments(!showPlanComments)}
        className="fixed bottom-6 right-6 p-4 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all hover:scale-110 z-40"
        title="Commentaires du plan"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
        </svg>
        {planComments.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {planComments.length}
          </span>
        )}
      </button>

      {/* Sliding Panel for Plan Comments */}
      <div 
        className={`fixed top-0 right-0 h-full w-full md:w-[500px] bg-background border-l border-border shadow-2xl z-50 transition-transform duration-300 overflow-y-auto ${
          showPlanComments ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="sticky top-0 bg-background border-b border-border p-4 flex items-center justify-between z-10">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
            Commentaires du Plan
          </h2>
          <button
            onClick={() => setShowPlanComments(false)}
            className="p-2 hover:bg-secondary rounded-lg transition-colors"
            title="Fermer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-4">
          <PlanComments
            comments={planComments}
            onAddComment={addPlanComment}
            onUpdateComment={updatePlanComment}
            onDeleteComment={deletePlanComment}
            isLoading={commentsLoading}
          />
        </div>
      </div>

      {/* Backdrop */}
      {showPlanComments && (
        <div 
          className="fixed inset-0 bg-black/30 z-40 md:hidden"
          onClick={() => setShowPlanComments(false)}
        />
      )}
    </div>
  );
}
