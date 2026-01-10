import { useQuery } from '@tanstack/react-query';
import { FileIcon, Tag, ExternalLink } from 'lucide-react';

interface ContextFile {
  path: string;
  title?: string;
  summary?: string;
  lastModified?: string;
  purpose?: string;
  tags?: string[];
}

export function ContextTab({ planId }: { planId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['plan-context', planId],
    queryFn: async () => {
      const res = await fetch(`/api/plans/${planId}/context`);
      if (!res.ok) return null;
      return res.json() as Promise<{ files: ContextFile[] } | null>;
    }
  });

  if (isLoading) return <div>Loading context...</div>;
  if (!data || !data.files.length) return <div className='text-muted-foreground'>No context attached</div>;

  const getTagColor = (tag: string) => {
    const colors: Record<string, string> = {
      critical: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
      config: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
      test: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
      documentation: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
    };
    return colors[tag] || 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300';
  };

  const getVSCodeUrl = (path: string) => {
    // Get workspace root from environment variable
    const workspaceRoot = import.meta.env.VITE_WORKSPACE_ROOT;
    const absolutePath = path.startsWith('/') ? `${workspaceRoot}${path}` : `${workspaceRoot}/${path}`;
    return `vscode://file${absolutePath}`;
  };

  return (
    <div className='space-y-4'>
      <h3 className='text-lg font-semibold'>{data.files.length} file(s)</h3>
      <div className='space-y-3'>
        {data.files.map((file, idx) => (
          <div key={idx} className='p-4 bg-secondary rounded-lg border border-border hover:border-primary/50 transition-colors'>
            <div className='flex items-start gap-3'>
              <FileIcon className='w-5 h-5 text-primary mt-0.5 flex-shrink-0' />
              <div className='flex-1 min-w-0'>
                {/* Path - clickable to open in VSCode */}
                <a
                  href={getVSCodeUrl(file.path)}
                  className='font-mono text-sm font-medium text-primary hover:text-primary/80 hover:underline break-all mb-2 inline-flex items-center gap-1.5 group'
                  title='Open in VSCode'
                >
                  {file.path}
                  <ExternalLink className='w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0' />
                </a>

                {/* Title */}
                {file.title && (
                  <p className='text-sm font-medium text-foreground mb-1 leading-snug'>
                    {file.title}
                  </p>
                )}

                {/* Summary */}
                {file.summary && (
                  <p className='text-sm text-muted-foreground mb-3 leading-relaxed whitespace-pre-wrap break-words'>
                    {file.summary}
                  </p>
                )}

                {/* Purpose */}
                {file.purpose && (
                  <p className='text-sm text-muted-foreground mb-3 leading-relaxed whitespace-pre-wrap break-words'>
                    {file.purpose}
                  </p>
                )}

                {/* Tags */}
                {file.tags && file.tags.length > 0 && (
                  <div className='flex flex-wrap gap-2'>
                    {file.tags.map((tag, tagIdx) => (
                      <span
                        key={tagIdx}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getTagColor(tag)}`}
                      >
                        <Tag className='w-3 h-3' />
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}