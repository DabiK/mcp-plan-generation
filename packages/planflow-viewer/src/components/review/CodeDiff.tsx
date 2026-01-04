interface CodeDiffProps {
  before?: string;
  after?: string;
  language?: string;
}

export function CodeDiff({ before, after }: CodeDiffProps) {
  if (!before && !after) return null;

  // Si seulement before ou after, afficher en pleine largeur
  if (before && !after) {
    return (
      <div className="space-y-2">
        <div className="text-xs text-muted-foreground">Code à supprimer</div>
        <DiffBlock code={before} type="removed" />
      </div>
    );
  }

  if (after && !before) {
    return (
      <div className="space-y-2">
        <div className="text-xs text-muted-foreground">Code à ajouter</div>
        <DiffBlock code={after} type="added" />
      </div>
    );
  }

  // Les deux côtés
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <div className="text-xs text-red-400">Avant</div>
        <DiffBlock code={before!} type="removed" />
      </div>
      <div className="space-y-2">
        <div className="text-xs text-green-400">Après</div>
        <DiffBlock code={after!} type="added" />
      </div>
    </div>
  );
}

interface DiffBlockProps {
  code: string;
  type: 'added' | 'removed';
}

function DiffBlock({ code, type }: DiffBlockProps) {
  const lines = code.split('\n');
  
  const bgColor = type === 'added' 
    ? 'bg-green-500/5 border-green-500/20' 
    : 'bg-red-500/5 border-red-500/20';
  
  const lineNumberColor = type === 'added'
    ? 'text-green-600/50'
    : 'text-red-600/50';

  return (
    <div className={`border rounded-lg overflow-hidden ${bgColor}`}>
      <div className="overflow-x-auto max-h-96">
        <table className="w-full text-xs font-mono">
          <tbody>
            {lines.map((line, idx) => (
              <tr key={idx} className="hover:bg-black/20">
                <td className={`px-2 py-0.5 text-right select-none border-r border-white/5 ${lineNumberColor} w-12`}>
                  {idx + 1}
                </td>
                <td className="px-3 py-0.5">
                  <pre className="text-foreground m-0 whitespace-pre">{line || ' '}</pre>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
