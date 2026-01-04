import { useState } from 'react';
import type { StepDTO, StepReview, ReviewDecision } from '@/types';
import {
  CreateFileLayout,
  EditFileLayout,
  DeleteFileLayout,
  RunCommandLayout,
  TestLayout,
  ReviewLayout,
  DocumentationLayout,
  CustomLayout,
} from './StepKindLayouts';

interface StepReviewCardProps {
  step: StepDTO;
  stepNumber: number;
  totalSteps: number;
  existingReview?: StepReview;
  onDecision: (decision: ReviewDecision) => void;
  onAddComment: (content: string) => void;
  onUpdateComment?: (commentId: string, content: string) => void;
  onDeleteComment: (commentId: string) => void;
  onNext: () => void;
  onPrevious: () => void;
  onSkip: () => void;
  autoAdvance?: boolean; // Nouvelle prop pour contrôler l'auto-advance
}

export function StepReviewCard({
  step,
  stepNumber,
  totalSteps,
  existingReview,
  onDecision,
  onAddComment,
  onUpdateComment,
  onDeleteComment,
  onNext,
  onPrevious,
  onSkip,
  autoAdvance = true, // Par défaut true pour maintenir la compatibilité
}: StepReviewCardProps) {
  const [commentText, setCommentText] = useState('');
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState('');

  const handleApprove = () => {
    onDecision('approved');
    if (autoAdvance) {
      setTimeout(onNext, 300);
    }
  };

  const handleReject = () => {
    onDecision('rejected');
    if (autoAdvance) {
      setTimeout(onNext, 300);
    }
  };

  const handleSkipStep = () => {
    onSkip();
    if (autoAdvance) {
      setTimeout(onNext, 300);
    }
  };

  const handleAddComment = () => {
    if (commentText.trim()) {
      onAddComment(commentText.trim());
      setCommentText('');
      setShowCommentForm(false);
    }
  };

  const getStepKindLayout = () => {
    switch (step.kind) {
      case 'create_file':
        return <CreateFileLayout step={step} />;
      case 'edit_file':
        return <EditFileLayout step={step} />;
      case 'delete_file':
        return <DeleteFileLayout step={step} />;
      case 'run_command':
        return <RunCommandLayout step={step} />;
      case 'test':
        return <TestLayout step={step} />;
      case 'review':
        return <ReviewLayout step={step} />;
      case 'documentation':
        return <DocumentationLayout step={step} />;
      default:
        return <CustomLayout step={step} />;
    }
  };

  const getDecisionColor = (decision: ReviewDecision) => {
    switch (decision) {
      case 'approved':
        return 'text-green-500';
      case 'rejected':
        return 'text-red-500';
      case 'skipped':
        return 'text-gray-500';
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">
            Étape {stepNumber} sur {totalSteps}
          </span>
          <span className="text-sm font-semibold">
            {Math.round((stepNumber / totalSteps) * 100)}%
          </span>
        </div>
        <div className="w-full bg-secondary rounded-full h-2">
          <div
            className="bg-foreground h-2 rounded-full transition-all duration-300"
            style={{ width: `${(stepNumber / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {/* Main card */}
      <div className="bg-secondary border border-border rounded-xl p-6 space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-2xl font-bold">{step.title}</h2>
              {step.description && (
                <p className="text-muted-foreground mt-2">{step.description}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                step.status === 'completed' ? 'bg-green-500/10 text-green-500' :
                step.status === 'in_progress' ? 'bg-blue-500/10 text-blue-500' :
                step.status === 'failed' ? 'bg-red-500/10 text-red-500' :
                step.status === 'blocked' ? 'bg-orange-500/10 text-orange-500' :
                step.status === 'skipped' ? 'bg-yellow-500/10 text-yellow-500' :
                step.status === 'pending' ? 'bg-blue-500/10 text-blue-500' :
                'bg-gray-500/10 text-gray-500'
              }`}>
                {step.status === 'completed' ? 'Terminé' :
                 step.status === 'in_progress' ? 'En cours' :
                 step.status === 'failed' ? 'Échoué' :
                 step.status === 'blocked' ? 'Bloqué' :
                 step.status === 'skipped' ? 'Ignoré' :
                 step.status === 'pending' ? 'En attente' :
                 step.status}
              </span>
            </div>
          </div>

          {existingReview && (
            <div className="flex items-center gap-2 mt-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className={`text-sm font-medium ${getDecisionColor(existingReview.decision)}`}>
                {existingReview.decision === 'approved' ? 'Approuvé' :
                 existingReview.decision === 'rejected' ? 'Rejeté' : 'Ignoré'}
              </span>
            </div>
          )}
        </div>

        {/* Step content based on kind */}
        <div className="border-t border-border pt-6">
          {getStepKindLayout()}
        </div>

        {/* Metadata */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground border-t border-border pt-4">
          {step.estimatedDuration && (
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>
                {typeof step.estimatedDuration === 'object' 
                  ? `${step.estimatedDuration.value} ${step.estimatedDuration.unit}` 
                  : step.estimatedDuration}
              </span>
            </div>
          )}
          {step.dependsOn && step.dependsOn.length > 0 && (
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>{step.dependsOn.length} dépendance(s)</span>
            </div>
          )}
        </div>

        {/* Comments section */}
        <div className="border-t border-border pt-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">
              Commentaires ({existingReview?.comments.length || 0})
            </h3>
            <button
              onClick={() => setShowCommentForm(!showCommentForm)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {showCommentForm ? 'Annuler' : '+ Ajouter'}
            </button>
          </div>

          {showCommentForm && (
            <div className="space-y-2">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Ajouter un commentaire..."
                className="w-full p-3 bg-background border border-border rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-foreground/20"
                rows={3}
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setCommentText('');
                    setShowCommentForm(false);
                  }}
                  className="px-3 py-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleAddComment}
                  disabled={!commentText.trim()}
                  className="px-4 py-1 bg-foreground text-background text-sm rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                >
                  Enregistrer
                </button>
              </div>
            </div>
          )}

          {existingReview?.comments && existingReview.comments.length > 0 && (
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {existingReview.comments.map((comment) => (
                <div
                  key={comment.id}
                  className="p-3 bg-background rounded-lg"
                >
                  {editingCommentId === comment.id ? (
                    // Edit mode
                    <div className="space-y-2">
                      <textarea
                        value={editingCommentText}
                        onChange={(e) => setEditingCommentText(e.target.value)}
                        className="w-full p-2 bg-secondary border border-border rounded text-sm resize-none focus:outline-none focus:ring-2 focus:ring-foreground/20"
                        rows={3}
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => {
                            setEditingCommentId(null);
                            setEditingCommentText('');
                          }}
                          className="px-3 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                        >
                          Annuler
                        </button>
                        <button
                          onClick={() => {
                            if (onUpdateComment && editingCommentText.trim()) {
                              onUpdateComment(comment.id, editingCommentText);
                              setEditingCommentId(null);
                              setEditingCommentText('');
                            }
                          }}
                          disabled={!editingCommentText.trim()}
                          className="px-3 py-1 bg-foreground text-background text-xs rounded hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                        >
                          Enregistrer
                        </button>
                      </div>
                    </div>
                  ) : (
                    // View mode
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="text-sm">{comment.content}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(comment.timestamp).toLocaleString('fr-FR')}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        {onUpdateComment && (
                          <button
                            onClick={() => {
                              setEditingCommentId(comment.id);
                              setEditingCommentText(comment.content);
                            }}
                            className="text-muted-foreground hover:text-foreground transition-colors p-1"
                            title="Éditer"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                        )}
                        <button
                          onClick={() => onDeleteComment(comment.id)}
                          className="text-muted-foreground hover:text-red-500 transition-colors p-1"
                          title="Supprimer"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-3 pt-4 border-t border-border">
          <button
            onClick={onPrevious}
            disabled={stepNumber === 1}
            className="px-4 py-2 bg-secondary border border-border rounded-lg hover:bg-border disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            ← Précédent
          </button>

          <div className="flex-1 flex items-center justify-center gap-3">
            <button
              onClick={handleReject}
              className="flex items-center gap-2 px-6 py-3 bg-red-500/10 border-2 border-red-500/20 text-red-500 rounded-lg hover:bg-red-500/20 hover:border-red-500/30 transition-all"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span className="font-semibold">Rejeter</span>
            </button>

            <button
              onClick={handleSkipStep}
              className="flex items-center gap-2 px-6 py-3 bg-secondary border border-border rounded-lg hover:bg-border transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
              <span className="font-semibold">Passer</span>
            </button>

            <button
              onClick={handleApprove}
              className="flex items-center gap-2 px-6 py-3 bg-green-500/10 border-2 border-green-500/20 text-green-500 rounded-lg hover:bg-green-500/20 hover:border-green-500/30 transition-all"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="font-semibold">Approuver</span>
            </button>
          </div>

          <button
            onClick={onNext}
            disabled={stepNumber === totalSteps}
            className="px-4 py-2 bg-secondary border border-border rounded-lg hover:bg-border disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Suivant →
          </button>
        </div>
      </div>

      {/* Keyboard shortcuts hint */}
      <div className="mt-4 flex items-center justify-center gap-4 text-xs text-muted-foreground">
        <span>Raccourcis: ← Précédent | → Suivant | A Approuver | R Rejeter | S Passer</span>
      </div>
    </div>
  );
}
