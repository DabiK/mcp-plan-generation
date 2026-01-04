import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface CodeBlockProps {
  code: string;
  language?: string;
  showLineNumbers?: boolean;
  theme?: 'dark' | 'light';
  className?: string;
  lintErrors?: Array<{
    line: number;
    column?: number;
    message: string;
    severity: 'error' | 'warning' | 'info';
  }>;
}

export function CodeBlock({
  code,
  language = 'javascript',
  showLineNumbers = true,
  theme = 'dark',
  className = '',
  lintErrors = []
}: CodeBlockProps) {
  const style = theme === 'dark' ? oneDark : oneLight;

  // Create custom style with linting highlights
  const customStyle = {
    ...style,
    'pre[class*="language-"]': {
      ...style['pre[class*="language-"]'],
      background: 'var(--color-background)',
      margin: 0,
      padding: '1rem',
      borderRadius: '0.5rem',
      fontSize: '0.75rem',
      lineHeight: '1.25',
    },
    'code[class*="language-"]': {
      ...style['code[class*="language-"]'],
      background: 'transparent',
      color: 'var(--color-foreground)',
    }
  };

  // Add line highlighting for lint errors
  const lineProps = (lineNumber: number) => {
    const error = lintErrors.find(err => err.line === lineNumber);
    if (error) {
      const bgColor = error.severity === 'error'
        ? 'rgba(239, 68, 68, 0.1)' // red-500/10
        : error.severity === 'warning'
        ? 'rgba(245, 158, 11, 0.1)' // amber-500/10
        : 'rgba(59, 130, 246, 0.1)'; // blue-500/10

      return {
        style: {
          backgroundColor: bgColor,
          borderLeft: `3px solid ${
            error.severity === 'error' ? '#ef4444' :
            error.severity === 'warning' ? '#f59e0b' : '#3b82f6'
          }`,
          paddingLeft: '0.5rem',
          display: 'block',
          width: '100%',
        },
        title: error.message,
      };
    }
    return {};
  };

  return (
    <div className={`relative ${className}`}>
      <SyntaxHighlighter
        language={language}
        style={customStyle}
        showLineNumbers={showLineNumbers}
        lineNumberStyle={{
          color: 'var(--color-muted-foreground)',
          paddingRight: '1rem',
          borderRight: '1px solid var(--color-border)',
          marginRight: '1rem',
          textAlign: 'right',
          minWidth: '2.5rem',
        }}
        lineProps={lineProps}
        customStyle={{
          margin: 0,
          background: 'var(--color-background)',
        }}
      >
        {code}
      </SyntaxHighlighter>

      {/* Lint error summary */}
      {lintErrors.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2 text-xs">
          {lintErrors.map((error, idx) => (
            <div
              key={idx}
              className={`px-2 py-1 rounded flex items-center gap-1 ${
                error.severity === 'error'
                  ? 'bg-red-500/10 text-red-600 border border-red-500/20'
                  : error.severity === 'warning'
                  ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                  : 'bg-blue-500/10 text-blue-600 border border-blue-500/20'
              }`}
              title={`${error.message} (ligne ${error.line}${error.column ? `, colonne ${error.column}` : ''})`}
            >
              <span className={`w-2 h-2 rounded-full ${
                error.severity === 'error' ? 'bg-red-500' :
                error.severity === 'warning' ? 'bg-amber-500' : 'bg-blue-500'
              }`} />
              Ligne {error.line}: {error.message}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Helper function to detect language from file extension or content
export function detectLanguage(code: string, filename?: string): string {
  if (filename) {
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'js': case 'jsx': return 'javascript';
      case 'ts': case 'tsx': return 'typescript';
      case 'py': return 'python';
      case 'java': return 'java';
      case 'cpp': case 'cc': case 'cxx': return 'cpp';
      case 'c': return 'c';
      case 'cs': return 'csharp';
      case 'php': return 'php';
      case 'rb': return 'ruby';
      case 'go': return 'go';
      case 'rs': return 'rust';
      case 'swift': return 'swift';
      case 'kt': return 'kotlin';
      case 'scala': return 'scala';
      case 'sh': case 'bash': return 'bash';
      case 'sql': return 'sql';
      case 'html': return 'html';
      case 'xml': return 'xml';
      case 'css': return 'css';
      case 'scss': case 'sass': return 'scss';
      case 'less': return 'less';
      case 'json': return 'json';
      case 'yaml': case 'yml': return 'yaml';
      case 'md': return 'markdown';
      case 'dockerfile': return 'dockerfile';
      default: break;
    }
  }

  // Simple content-based detection
  if (code.includes('function') || code.includes('const') || code.includes('let') || code.includes('var ')) {
    return code.includes(':') && code.includes('interface') ? 'typescript' : 'javascript';
  }
  if (code.includes('def ') || code.includes('import ')) return 'python';
  if (code.includes('public class') || code.includes('System.out')) return 'java';
  if (code.includes('#include') || code.includes('int main')) return 'cpp';
  if (code.includes('<?php')) return 'php';

  return 'text'; // fallback
}


