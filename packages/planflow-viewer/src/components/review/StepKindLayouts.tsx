import type { StepDTO } from '@/types';
import { CodeDiff } from './CodeDiff';

interface StepKindLayoutProps {
  step: StepDTO;
}

export function CreateFileLayout({ step }: StepKindLayoutProps) {
  const action = step.actions?.find((a: any) => a.type === 'create_file' || a.type === 'create_directory') as any;
  
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-green-500/10 rounded-lg">
          <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </div>
        <div>
          <h3 className="font-semibold text-lg">Créer un fichier</h3>
          <p className="text-sm text-muted-foreground">Nouveau fichier à ajouter au projet</p>
        </div>
      </div>

      {(action?.filePath || action?.payload?.file || action?.payload?.path) && (
        <div className="p-4 bg-secondary rounded-lg">
          <div className="text-xs text-muted-foreground mb-1">Chemin</div>
          <code className="text-sm font-mono text-foreground">{action?.filePath || action?.payload?.file || action?.payload?.path}</code>
        </div>
      )}
      
      {action?.description && (
        <div className="p-4 bg-secondary rounded-lg">
          <div className="text-xs text-muted-foreground mb-1">Description</div>
          <p className="text-sm">{action.description}</p>
        </div>
      )}

      {(action?.content || action?.payload?.content) && (
        <CodeDiff after={action?.content || action?.payload?.content} filename={action?.filePath || action?.payload?.file || action?.payload?.path} />
      )}
    </div>
  );
}

export function EditFileLayout({ step }: StepKindLayoutProps) {
  const action = step.actions?.find((a: any) => a.type === 'edit_file') as any;
  
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-blue-500/10 rounded-lg">
          <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </div>
        <div>
          <h3 className="font-semibold text-lg">Modifier un fichier</h3>
          <p className="text-sm text-muted-foreground">Édition de fichier existant</p>
        </div>
      </div>

      {(action?.filePath || action?.payload?.file) && (
        <div className="p-4 bg-secondary rounded-lg">
          <div className="text-xs text-muted-foreground mb-1">Fichier</div>
          <code className="text-sm font-mono text-foreground">{action?.filePath || action?.payload?.file}</code>
        </div>
      )}
      
      {action?.description && (
        <div className="p-4 bg-secondary rounded-lg">
          <div className="text-xs text-muted-foreground mb-1">Description</div>
          <p className="text-sm">{action.description}</p>
        </div>
      )}
      
      {action?.lineNumbers && (
        <div className="p-3 bg-secondary rounded-lg">
          <div className="text-xs text-muted-foreground">
            📍 Lignes {action.lineNumbers.start} - {action.lineNumbers.end}
          </div>
        </div>
      )}

      <CodeDiff before={action?.before} after={action?.after} filename={action?.filePath || action?.payload?.file} />
    </div>
  );
}

export function DeleteFileLayout({ step }: StepKindLayoutProps) {
  const action = step.actions?.find((a: any) => a.type === 'delete_file') as any;
  
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-red-500/10 rounded-lg">
          <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </div>
        <div>
          <h3 className="font-semibold text-lg">Supprimer un fichier</h3>
          <p className="text-sm text-muted-foreground">Fichier à retirer du projet</p>
        </div>
      </div>

      {action?.filePath && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
          <div className="text-xs text-muted-foreground mb-1">Fichier à supprimer</div>
          <code className="text-sm font-mono text-foreground">{action.filePath}</code>
        </div>
      )}

      {action?.reason && (
        <div className="p-4 bg-secondary rounded-lg">
          <div className="text-xs text-muted-foreground mb-1">Raison</div>
          <p className="text-sm">{action.reason}</p>
        </div>
      )}
      
      {action?.description && (
        <div className="p-4 bg-secondary rounded-lg">
          <div className="text-xs text-muted-foreground mb-1">Description</div>
          <p className="text-sm">{action.description}</p>
        </div>
      )}
    </div>
  );
}

export function RunCommandLayout({ step }: StepKindLayoutProps) {
  const action = step.actions?.find((a: any) => a.type === 'run_command' || a.type === 'terminal') as any;
  
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-purple-500/10 rounded-lg">
          <svg className="w-6 h-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <div>
          <h3 className="font-semibold text-lg">Exécuter une commande</h3>
          <p className="text-sm text-muted-foreground">Commande shell à lancer</p>
        </div>
      </div>

      {(action?.command || action?.payload?.command) && (
        <div className="p-4 bg-secondary rounded-lg font-mono">
          <div className="text-xs text-muted-foreground mb-2">Commande</div>
          <code className="text-sm text-green-400">{action?.command || action?.payload?.command}</code>
        </div>
      )}

      {action?.workingDirectory && (
        <div className="p-4 bg-secondary rounded-lg">
          <div className="text-xs text-muted-foreground mb-1">Répertoire</div>
          <code className="text-sm font-mono">{action.workingDirectory}</code>
        </div>
      )}

      {action?.expectedOutput && (
        <div className="p-4 bg-secondary rounded-lg max-h-32 overflow-auto">
          <div className="text-xs text-muted-foreground mb-2">Output attendu</div>
          <pre className="text-xs font-mono whitespace-pre-wrap">{action.expectedOutput}</pre>
        </div>
      )}
      
      {action?.description && (
        <div className="p-4 bg-secondary rounded-lg">
          <div className="text-xs text-muted-foreground mb-1">Description</div>
          <p className="text-sm">{action.description}</p>
        </div>
      )}
    </div>
  );
}

export function TestLayout({ step }: StepKindLayoutProps) {
  const action = step.actions?.find((a: any) => a.type === 'test' || a.type === 'manual_test') as any;
  
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-yellow-500/10 rounded-lg">
          <svg className="w-6 h-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <h3 className="font-semibold text-lg">Tests</h3>
          <p className="text-sm text-muted-foreground">Tests à valider</p>
        </div>
      </div>

      {action?.testCommand && (
        <div className="p-4 bg-secondary rounded-lg font-mono">
          <div className="text-xs text-muted-foreground mb-2">Commande de test</div>
          <code className="text-sm text-yellow-400">{action.testCommand}</code>
        </div>
      )}
      
      {action?.testFiles && action.testFiles.length > 0 && (
        <div className="p-4 bg-secondary rounded-lg">
          <div className="text-xs text-muted-foreground mb-2">Fichiers de test</div>
          <div className="space-y-1">
            {action.testFiles.map((file: string, idx: number) => (
              <code key={idx} className="block text-xs font-mono">{file}</code>
            ))}
          </div>
        </div>
      )}
      
      {action?.payload?.scenarios && Array.isArray(action.payload.scenarios) && (
        <div className="space-y-2">
          <div className="text-xs text-muted-foreground">Scénarios de test</div>
          {action.payload.scenarios.map((scenario: string, idx: number) => (
            <div key={idx} className="flex items-start gap-2 p-3 bg-secondary rounded-lg">
              <svg className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm">{scenario}</span>
            </div>
          ))}
        </div>
      )}

      {action?.coverage !== undefined && (
        <div className="p-4 bg-secondary rounded-lg">
          <div className="text-xs text-muted-foreground mb-2">Couverture attendue</div>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-background rounded-full h-2">
              <div 
                className="bg-yellow-500 h-2 rounded-full" 
                style={{ width: `${action.coverage}%` }}
              />
            </div>
            <span className="text-sm font-semibold">{action.coverage}%</span>
          </div>
        </div>
      )}
      
      {action?.description && (
        <div className="p-4 bg-secondary rounded-lg">
          <div className="text-xs text-muted-foreground mb-1">Description</div>
          <p className="text-sm">{action.description}</p>
        </div>
      )}
    </div>
  );
}

export function ReviewLayout({ step }: StepKindLayoutProps) {
  const action = step.actions?.find((a: any) => a.type === 'review' || a.type === 'code_review') as any;
  
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-cyan-500/10 rounded-lg">
          <svg className="w-6 h-6 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        </div>
        <div>
          <h3 className="font-semibold text-lg">Revue</h3>
          <p className="text-sm text-muted-foreground">Étape de validation</p>
        </div>
      </div>
      
      {action?.checklistItems && action.checklistItems.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs text-muted-foreground">Checklist</div>
          {action.checklistItems.map((item: string, idx: number) => (
            <div key={idx} className="flex items-start gap-2 p-3 bg-secondary rounded-lg">
              <svg className="w-5 h-5 text-cyan-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm">{item}</span>
            </div>
          ))}
        </div>
      )}
      
      {action?.payload?.checks && Array.isArray(action.payload.checks) && (
        <div className="space-y-2">
          <div className="text-xs text-muted-foreground">Vérifications</div>
          {action.payload.checks.map((check: string, idx: number) => (
            <div key={idx} className="flex items-start gap-2 p-3 bg-secondary rounded-lg">
              <svg className="w-5 h-5 text-cyan-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm">{check}</span>
            </div>
          ))}
        </div>
      )}
      
      {action?.reviewers && action.reviewers.length > 0 && (
        <div className="p-4 bg-secondary rounded-lg">
          <div className="text-xs text-muted-foreground mb-2">Reviewers suggérés</div>
          <div className="flex flex-wrap gap-2">
            {action.reviewers.map((reviewer: string, idx: number) => (
              <span key={idx} className="px-2 py-1 bg-cyan-500/10 text-cyan-500 rounded text-xs">
                @{reviewer}
              </span>
            ))}
          </div>
        </div>
      )}

      {step.validation?.criteria && step.validation.criteria.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs text-muted-foreground">Critères de validation</div>
          {step.validation.criteria.map((criterion: string, idx: number) => (
            <div key={idx} className="flex items-start gap-2 p-3 bg-secondary rounded-lg">
              <svg className="w-5 h-5 text-cyan-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm">{criterion}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function DocumentationLayout({ step }: StepKindLayoutProps) {
  const action = step.actions?.find((a: any) => a.type === 'documentation') as any;
  
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-orange-500/10 rounded-lg">
          <svg className="w-6 h-6 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <div>
          <h3 className="font-semibold text-lg">Documentation</h3>
          <p className="text-sm text-muted-foreground">Documentation à rédiger</p>
        </div>
      </div>
      
      {action?.filePath && (
        <div className="p-4 bg-secondary rounded-lg">
          <div className="text-xs text-muted-foreground mb-1">Fichier</div>
          <code className="text-sm font-mono text-foreground">{action.filePath}</code>
        </div>
      )}
      
      {action?.format && (
        <div className="p-4 bg-secondary rounded-lg">
          <div className="text-xs text-muted-foreground mb-1">Format</div>
          <span className="text-sm font-medium uppercase">{action.format}</span>
        </div>
      )}

      {action?.sections && Array.isArray(action.sections) && (
        <div className="space-y-2">
          <div className="text-xs text-muted-foreground">Sections à documenter</div>
          {action.sections.map((section: string, idx: number) => (
            <div key={idx} className="p-3 bg-secondary rounded-lg">
              <span className="text-sm font-medium">{section}</span>
            </div>
          ))}
        </div>
      )}
      
      {action?.description && (
        <div className="p-4 bg-secondary rounded-lg">
          <div className="text-xs text-muted-foreground mb-1">Description</div>
          <p className="text-sm">{action.description}</p>
        </div>
      )}
    </div>
  );
}

export function CustomLayout({ step }: StepKindLayoutProps) {
  const action = step.actions?.find((a: any) => a.type === 'custom') || step.actions?.[0] as any;
  
  // Gérer les actions run_command dans CustomLayout
  if (action?.type === 'run_command' || (action?.command && !action?.type)) {
    return <RunCommandLayout step={step} />;
  }
  
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-gray-500/10 rounded-lg">
          <svg className="w-6 h-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
        </div>
        <div>
          <h3 className="font-semibold text-lg">Étape personnalisée</h3>
          <p className="text-sm text-muted-foreground">Action spécifique au projet</p>
        </div>
      </div>
      
      {action?.description && (
        <div className="p-4 bg-secondary rounded-lg">
          <div className="text-xs text-muted-foreground mb-1">Description</div>
          <p className="text-sm">{action.description}</p>
        </div>
      )}

      {action && Object.keys(action).length > 2 && (
        <div className="p-4 bg-secondary rounded-lg">
          <div className="text-xs text-muted-foreground mb-2">Détails</div>
          <pre className="text-xs font-mono whitespace-pre-wrap">
            {JSON.stringify(action, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
