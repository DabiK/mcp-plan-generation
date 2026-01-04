import { useState } from 'react';
import type { PlanCommentDTO } from '@/types';

interface PlanCommentsProps {
  comments: PlanCommentDTO[];
  onAddComment: (content: string, author?: string) => void;
  onUpdateComment?: (commentId: string, content: string) => void;
  onDeleteComment?: (commentId: string) => void;
  isLoading?: boolean;
}

export const PlanComments = ({
  comments,
  onAddComment,
  onUpdateComment,
  onDeleteComment,
  isLoading,
}: PlanCommentsProps) => {
  const [newComment, setNewComment] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState('');

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    onAddComment(newComment.trim());
    setNewComment('');
  };

  const handleStartEdit = (comment: PlanCommentDTO) => {
    setEditingCommentId(comment.id);
    setEditingCommentText(comment.content);
  };

  const handleSaveEdit = () => {
    if (!editingCommentId || !editingCommentText.trim()) return;
    onUpdateComment?.(editingCommentId, editingCommentText.trim());
    setEditingCommentId(null);
    setEditingCommentText('');
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditingCommentText('');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    
    return date.toLocaleDateString('fr-FR', { 
      day: 'numeric', 
      month: 'short', 
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined 
    });
  };

  return (
    <div className="bg-[var(--color-background)] rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-[var(--color-foreground)] mb-4 flex items-center gap-2">
        <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
        </svg>
        Notes globales
        {comments.length > 0 && (
          <span className="text-sm font-normal text-gray-500 dark:text-gray-400">({comments.length})</span>
        )}
      </h3>

      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Ajoutez vos observations générales sur l'ensemble du plan
      </p>

      {/* Add new comment */}
      <div className="mb-6">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Ex: Le plan est bien structuré mais manque de tests d'intégration..."
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-[var(--color-background)] text-[var(--color-foreground)] placeholder-gray-500 dark:placeholder-gray-400"
          rows={3}
          disabled={isLoading}
        />
        <div className="mt-2 flex justify-end">
          <button
            onClick={handleAddComment}
            disabled={!newComment.trim() || isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors text-sm font-medium"
          >
            Ajouter une note
          </button>
        </div>
      </div>

      {/* Comments list */}
      {isLoading && comments.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <svg className="w-12 h-12 mx-auto mb-3 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          <p className="font-medium">Aucune note pour le moment</p>
          <p className="text-sm mt-1">Partagez vos impressions générales sur le plan</p>
        </div>
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors bg-[var(--color-background)]"
            >
              {editingCommentId === comment.id ? (
                // Edit mode
                <div className="space-y-3">
                  <textarea
                    value={editingCommentText}
                    onChange={(e) => setEditingCommentText(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-[var(--color-background)] text-[var(--color-foreground)]"
                    rows={3}
                    autoFocus
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={handleCancelEdit}
                      className="px-3 py-1.5 text-sm text-[var(--color-foreground)] bg-[var(--color-background)] border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={handleSaveEdit}
                      disabled={!editingCommentText.trim()}
                      className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
                    >
                      Enregistrer
                    </button>
                  </div>
                </div>
              ) : (
                // View mode
                <>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                        <span className="text-blue-600 dark:text-blue-400 font-medium">
                          {comment.author?.[0]?.toUpperCase() || '?'}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-[var(--color-foreground)]">
                          {comment.author || 'Anonyme'}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400" title={new Date(comment.createdAt).toLocaleString('fr-FR')}>
                          {formatDate(comment.createdAt)}
                          {comment.updatedAt && comment.updatedAt !== comment.createdAt && (
                            <span className="ml-1">(modifié)</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {onUpdateComment && (
                        <button
                          onClick={() => handleStartEdit(comment)}
                          className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900 rounded transition-colors"
                          title="Modifier"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                      )}
                      {onDeleteComment && (
                        <button
                          onClick={() => {
                            if (window.confirm('Supprimer ce commentaire ?')) {
                              onDeleteComment(comment.id);
                            }
                          }}
                          className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900 rounded transition-colors"
                          title="Supprimer"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-[var(--color-foreground)] whitespace-pre-wrap">{comment.content}</p>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
