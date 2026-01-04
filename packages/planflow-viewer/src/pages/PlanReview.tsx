import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePlanDetail } from '@/hooks/usePlans';
import { useStepReviews } from '@/hooks/useStepReviews';
import { StepReviewCard } from '@/components/review/StepReviewCard';
import type { ReviewDecision } from '@/types';

export function PlanReview() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: plan, isLoading } = usePlanDetail(id || '');
  const [showStepNav, setShowStepNav] = useState(false);
  
  const {
    reviewState,
    addReview,
    addComment,
    deleteComment,
    nextStep,
    previousStep,
    completeReview,
    resetReview,
    getStepReview,
    getReviewStats,
    setCurrentStepIndex,
  } = useStepReviews(id || '');

  const currentStep = plan?.steps[reviewState.currentStepIndex];
  const isLastStep = reviewState.currentStepIndex === (plan?.steps.length || 0) - 1;
  const isComplete = reviewState.isComplete || reviewState.currentStepIndex >= (plan?.steps.length || 0);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) {
        return; // Don't trigger shortcuts when typing
      }

      switch (e.key.toLowerCase()) {
        case 'a':
          if (currentStep) {
            addReview(currentStep.id, 'approved');
            if (!isLastStep) nextStep();
          }
          break;
        case 'r':
          if (currentStep) {
            addReview(currentStep.id, 'rejected');
            if (!isLastStep) nextStep();
          }
          break;
        case 's':
          if (currentStep) {
            addReview(currentStep.id, 'skipped');
            if (!isLastStep) nextStep();
          }
          break;
        case 'arrowleft':
          if (reviewState.currentStepIndex > 0) {
            previousStep();
          }
          break;
        case 'arrowright':
          if (!isLastStep) {
            nextStep();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentStep, isLastStep, reviewState.currentStepIndex, addReview, nextStep, previousStep]);

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
    <div className="min-h-screen bg-background p-6">
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <button
              onClick={() => navigate(`/plans/${id}`)}
              className="text-sm text-muted-foreground hover:text-foreground mb-2 flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Retour au plan
            </button>
            <h1 className="text-2xl font-bold">{plan.metadata.title}</h1>
            <p className="text-sm text-muted-foreground">{plan.metadata.description}</p>
          </div>

          <div className="flex items-center gap-3">
            {/* Step Navigator Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowStepNav(!showStepNav)}
                className="px-4 py-2 bg-secondary border border-border rounded-lg hover:bg-border transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                <span className="text-sm">Aller à l'étape</span>
              </button>

              {showStepNav && (
                <>
                  {/* Backdrop */}
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setShowStepNav(false)}
                  />
                  
                  {/* Dropdown */}
                  <div className="absolute right-0 mt-2 w-96 bg-secondary border border-border rounded-lg shadow-lg z-20 max-h-96 overflow-y-auto">
                    <div className="p-2 space-y-1">
                      {plan.steps.map((step: any, idx: number) => {
                        const review = getStepReview(step.id);
                        const isCurrent = idx === reviewState.currentStepIndex;
                        
                        return (
                          <button
                            key={step.id}
                            onClick={() => {
                              setCurrentStepIndex(idx);
                              setShowStepNav(false);
                            }}
                            className={`w-full text-left p-3 rounded-lg transition-colors ${
                              isCurrent 
                                ? 'bg-foreground text-background' 
                                : 'hover:bg-border'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className={`text-xs font-semibold ${isCurrent ? 'text-background' : 'text-muted-foreground'}`}>
                                    #{idx + 1}
                                  </span>
                                  <span className={`text-sm font-medium truncate ${isCurrent ? 'text-background' : 'text-foreground'}`}>
                                    {step.title}
                                  </span>
                                </div>
                                <div className={`text-xs mt-1 ${isCurrent ? 'text-background/70' : 'text-muted-foreground'}`}>
                                  {step.kind}
                                </div>
                              </div>
                              
                              {review && (
                                <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                                  review.decision === 'approved' ? 'bg-green-500' :
                                  review.decision === 'rejected' ? 'bg-red-500' :
                                  'bg-gray-500'
                                }`}>
                                  {review.decision === 'approved' && (
                                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                  )}
                                  {review.decision === 'rejected' && (
                                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  )}
                                  {review.decision === 'skipped' && (
                                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                                    </svg>
                                  )}
                                </div>
                              )}
                            </div>
                            
                            {review && review.comments.length > 0 && (
                              <div className={`text-xs mt-1 flex items-center gap-1 ${isCurrent ? 'text-background/70' : 'text-muted-foreground'}`}>
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                                </svg>
                                <span>{review.comments.length} commentaire(s)</span>
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={resetReview}
              className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Réinitialiser
            </button>
          </div>
        </div>
      </div>

      {/* Review card */}
      <StepReviewCard
        step={currentStep}
        stepNumber={reviewState.currentStepIndex + 1}
        totalSteps={plan.steps.length}
        existingReview={getStepReview(currentStep.id)}
        onDecision={handleDecision}
        onAddComment={handleAddComment}
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

      {/* Mini stats */}
      <div className="max-w-4xl mx-auto mt-6 flex items-center justify-center gap-6 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded-full" />
          <span>{stats.approved} approuvées</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500 rounded-full" />
          <span>{stats.rejected} rejetées</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-gray-500 rounded-full" />
          <span>{stats.skipped} passées</span>
        </div>
      </div>
    </div>
  );
}
