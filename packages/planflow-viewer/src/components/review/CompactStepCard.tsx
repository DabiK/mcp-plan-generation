import type { StepDTO, StepReview } from '@/types';

interface CompactStepCardProps {
  step: StepDTO;
  stepNumber: number;
  review?: StepReview;
  isCurrent: boolean;
  onClick: () => void;
}

export function CompactStepCard({ step, stepNumber, review, isCurrent, onClick }: CompactStepCardProps) {
  // Générer un résumé one-line
  const getOneLineSummary = () => {
    const action = step.actions?.[0] as any;
    
    if (!action) return step.title;
    
    // Extraire l'info clé selon le type
    let detail = '';
    switch (action.type) {
      case 'create_file':
      case 'create_directory':
        const path = action.filePath || action.payload?.file || action.payload?.path;
        detail = path ? `→ ${path.split('/').pop()}` : '';
        break;
      case 'edit_file':
        detail = action.lineNumbers 
          ? `→ L${action.lineNumbers.start}-${action.lineNumbers.end}` 
          : '→ edits';
        break;
      case 'delete_file':
        detail = `→ rm ${action.filePath?.split('/').pop() || 'file'}`;
        break;
      case 'run_command':
      case 'terminal':
        const cmd = action.command || action.payload?.command || '';
        detail = `→ ${cmd.split(' ')[0]}`;
        break;
      case 'test':
      case 'manual_test':
        detail = action.coverage ? `→ ${action.coverage}% coverage` : '→ tests';
        break;
      case 'review':
      case 'code_review':
        const items = action.checklistItems?.length || action.payload?.checks?.length || 0;
        detail = items ? `→ ${items} checks` : '';
        break;
      case 'documentation':
        detail = action.format ? `→ ${action.format}` : '→ docs';
        break;
      default:
        detail = action.description ? `→ ${action.description.slice(0, 30)}` : '';
    }
    
    return `${step.title} ${detail}`;
  };

  const getReviewIcon = () => {
    if (!review) return '○';
    switch (review.decision) {
      case 'approved': return '✓';
      case 'rejected': return '✗';
      case 'skipped': return '⏭';
      default: return '○';
    }
  };

  const getReviewColor = () => {
    if (!review) return 'text-gray-500';
    switch (review.decision) {
      case 'approved': return 'text-green-500';
      case 'rejected': return 'text-red-500';
      case 'skipped': return 'text-gray-500';
      default: return 'text-gray-500';
    }
  };

  const getDurationText = () => {
    if (!step.estimatedDuration) return '';
    const duration = typeof step.estimatedDuration === 'object'
      ? `${step.estimatedDuration.value}${step.estimatedDuration.unit[0]}`
      : step.estimatedDuration;
    return `⏱ ${duration}`;
  };

  const hasDependencies = step.dependsOn && step.dependsOn.length > 0;

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-3 rounded-lg transition-all ${
        isCurrent 
          ? 'bg-foreground/10 border-2 border-foreground' 
          : 'bg-secondary/50 border border-border hover:bg-secondary'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Review status icon */}
        <span className={`text-lg font-bold ${getReviewColor()} mt-0.5`}>
          {getReviewIcon()}
        </span>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* One-line summary */}
          <div className="flex items-baseline gap-2">
            <span className="font-medium text-sm">
              {stepNumber}. {getOneLineSummary()}
            </span>
          </div>

          {/* Meta info */}
          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
            {/* Kind badge */}
            <span className="px-2 py-0.5 bg-background/50 rounded text-xs">
              {step.kind}
            </span>

            {/* Duration */}
            {step.estimatedDuration && (
              <span>{getDurationText()}</span>
            )}

            {/* Dependencies indicator */}
            {hasDependencies && (
              <span className="flex items-center gap-1">
                ⤷ {step.dependsOn.length}
              </span>
            )}

            {/* Comments count */}
            {review?.comments && review.comments.length > 0 && (
              <span className="flex items-center gap-1">
                💬 {review.comments.length}
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}
