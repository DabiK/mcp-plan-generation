import { useState } from 'react';
import { CodeBlock, detectLanguage } from '../CodeBlock';

interface CodeDiffProps {
  before?: string;
  after?: string;
  language?: string;
  filename?: string;
  collapsedByDefault?: boolean;
  showLinting?: boolean;
}

export function CodeDiff({ before, after, language, filename, collapsedByDefault = false, showLinting = true }: CodeDiffProps) {
  const [isCollapsed, setIsCollapsed] = useState(collapsedByDefault);

  if (!before && !after) return null;

  // Auto-detect language if not provided
  const detectedLanguage = language || detectLanguage((before || after || ''), filename);

  // Generate linting errors for the code
  const beforeLintErrors = before && showLinting ? [] : [];
  const afterLintErrors = after && showLinting ? [] : [];

  // Si seulement before ou after, afficher en pleine largeur
  if (before && !after) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground flex items-center gap-2">
            <span className="text-red-400">●</span>
            Code à supprimer
            {beforeLintErrors.length > 0 && (
              <span className="text-xs bg-red-500/10 text-red-600 px-2 py-0.5 rounded">
                {beforeLintErrors.length} problème{beforeLintErrors.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 px-2 py-1 rounded hover:bg-secondary transition-colors"
          >
            {isCollapsed ? '▼ Afficher le code' : '▲ Masquer le code'}
          </button>
        </div>
        {!isCollapsed && (
          <CodeBlock
            code={before}
            language={detectedLanguage}
            theme="dark"
            lintErrors={beforeLintErrors}
            className="border border-red-500/20"
          />
        )}
      </div>
    );
  }

  if (after && !before) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground flex items-center gap-2">
            <span className="text-green-400">●</span>
            Code à ajouter
            {afterLintErrors.length > 0 && (
              <span className="text-xs bg-green-500/10 text-green-600 px-2 py-0.5 rounded">
                {afterLintErrors.length} problème{afterLintErrors.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 px-2 py-1 rounded hover:bg-secondary transition-colors"
          >
            {isCollapsed ? '▼ Afficher le code' : '▲ Masquer le code'}
          </button>
        </div>
        {!isCollapsed && (
          <CodeBlock
            code={after}
            language={detectedLanguage}
            theme="dark"
            lintErrors={afterLintErrors}
            className="border border-green-500/20"
          />
        )}
      </div>
    );
  }

  // Les deux côtés
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground flex items-center gap-2">
          <span className="text-blue-400">●</span>
          Modifications de code
          {(beforeLintErrors.length + afterLintErrors.length) > 0 && (
            <span className="text-xs bg-blue-500/10 text-blue-600 px-2 py-0.5 rounded">
              {(beforeLintErrors.length + afterLintErrors.length)} problème{(beforeLintErrors.length + afterLintErrors.length) > 1 ? 's' : ''}
            </span>
          )}
          <span className="text-xs text-muted-foreground">({detectedLanguage})</span>
        </div>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 px-2 py-1 rounded hover:bg-secondary transition-colors"
        >
          {isCollapsed ? '▼ Afficher le code' : '▲ Masquer le code'}
        </button>
      </div>
      {!isCollapsed && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="text-xs text-red-400 flex items-center gap-2">
              <span>●</span>
              Avant
              {beforeLintErrors.length > 0 && (
                <span className="text-xs bg-red-500/10 text-red-600 px-1.5 py-0.5 rounded">
                  {beforeLintErrors.length}
                </span>
              )}
            </div>
            <CodeBlock
              code={before!}
              language={detectedLanguage}
              theme="dark"
              lintErrors={beforeLintErrors}
              className="border border-red-500/20"
            />
          </div>
          <div className="space-y-2">
            <div className="text-xs text-green-400 flex items-center gap-2">
              <span>●</span>
              Après
              {afterLintErrors.length > 0 && (
                <span className="text-xs bg-green-500/10 text-green-600 px-1.5 py-0.5 rounded">
                  {afterLintErrors.length}
                </span>
              )}
            </div>
            <CodeBlock
              code={after!}
              language={detectedLanguage}
              theme="dark"
              lintErrors={afterLintErrors}
              className="border border-green-500/20"
            />
          </div>
        </div>
      )}
    </div>
  );
}


