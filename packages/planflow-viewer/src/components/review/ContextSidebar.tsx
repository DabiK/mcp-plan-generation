import { FileText, ChevronRight, X } from 'lucide-react';
import { ContextTab } from '@/components/plan-detail/ContextTab';

interface ContextSidebarProps {
  planId: string;
  isOpen: boolean;
  onToggle: () => void;
}

export function ContextSidebar({ planId, isOpen, onToggle }: ContextSidebarProps) {
  return (
    <>
      {/* Toggle button */}
      <button
        onClick={onToggle}
        className={`fixed top-1/2 -translate-y-1/2 right-4 z-60 p-3 bg-blue-600 text-white rounded-full shadow-lg hover:shadow-xl hover:bg-blue-700 transition-all duration-200 ${
          isOpen ? 'translate-x-[-336px]' : ''
        }`}
        title={isOpen ? 'Masquer le contexte' : 'Afficher le contexte'}
      >
        {isOpen ? (
          <ChevronRight className="w-5 h-5" />
        ) : (
          <FileText className="w-5 h-5" />
        )}
      </button>

      {/* Sidebar */}
      <div
        className={`fixed top-0 right-0 h-full w-80 bg-background border-l border-border shadow-2xl z-70 transition-transform duration-300 overflow-y-auto ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="sticky top-0 bg-background border-b border-border p-4 flex items-center justify-between z-10">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            Contexte du Plan
          </h2>
          <button
            onClick={onToggle}
            className="p-2 hover:bg-secondary rounded-lg transition-colors"
            title="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4">
          <ContextTab planId={planId} />
        </div>
      </div>

      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-65 md:hidden"
          onClick={onToggle}
        />
      )}
    </>
  );
}