import { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

interface MermaidDiagramProps {
  content: string;
  title?: string;
  description?: string;
}

export function MermaidDiagram({ content, title, description }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    mermaid.initialize({ startOnLoad: true, theme: 'dark', securityLevel: 'loose' });
  }, []);

  useEffect(() => {
    const renderDiagram = async () => {
      if (!containerRef.current) return;
      try {
        setError(null);
        const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
        const { svg } = await mermaid.render(id, content);
        containerRef.current.innerHTML = `<div style="display: flex; justify-content: center; align-items: center; width: 100%;">${svg}</div>`;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to render diagram');
      }
    };
    renderDiagram();
  }, [content]);

  return (
    <div className="border border-border rounded-lg p-4 bg-background">
      {title && <h3 className="text-lg font-semibold mb-2">{title}</h3>}
      {description && <p className="text-sm text-muted-foreground mb-4">{description}</p>}
      {error ? (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
          <p className="text-sm text-red-800 dark:text-red-200">Error: {error}</p>
        </div>
      ) : (
        <div ref={containerRef} className="mermaid-container flex justify-center items-center min-h-[200px]" />
      )}
    </div>
  );
}
