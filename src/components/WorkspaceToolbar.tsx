import { PanelLeftClose, PanelLeftOpen, Search, X } from 'lucide-react';
import { FilterMode } from '../types/focusflow';

interface WorkspaceToolbarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  filterMode: FilterMode;
  onFilterChange: (mode: FilterMode) => void;
  isTriageCollapsed: boolean;
  onToggleTriage: () => void;
  triageCount: number;
  kanbanCount: number;
}

const FILTER_OPTIONS: { id: FilterMode; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'outlook', label: 'Outlook Only' },
  { id: 'manual', label: 'Manual Only' },
  { id: 'high_urgent', label: 'High / Urgent' },
];

export function WorkspaceToolbar({
  searchQuery,
  onSearchChange,
  filterMode,
  onFilterChange,
  isTriageCollapsed,
  onToggleTriage,
  triageCount,
  kanbanCount,
}: WorkspaceToolbarProps) {
  return (
    <div className="bg-white border-b border-[#e2e8f0] px-4 lg:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3 flex-1 min-w-[240px] max-w-xl">
        <button
          type="button"
          onClick={onToggleTriage}
          title={isTriageCollapsed ? 'Expand Triage Panel' : 'Collapse Triage Panel'}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-[#404752] bg-[#f2f4f6] hover:bg-[#e6e8ea] rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0078d4]"
        >
          {isTriageCollapsed ? (
            <PanelLeftOpen className="w-3.5 h-3.5" />
          ) : (
            <PanelLeftClose className="w-3.5 h-3.5" />
          )}
          <span className="hidden sm:inline">
            {isTriageCollapsed ? `Show Triage (${triageCount})` : 'Triage'}
          </span>
        </button>

        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-[#717783] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search tasks, senders, tags, or blockers..."
            aria-label="Search tasks"
            className="w-full h-8 pl-8 pr-8 text-xs bg-[#f7f9fb] border border-[#e2e8f0] rounded-md text-[#191c1e] placeholder:text-[#717783] focus:outline-none focus:bg-white focus:border-[#0078d4] transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[#717783] hover:text-[#191c1e] p-0.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <div
          role="group"
          aria-label="Filter tasks"
          className="flex items-center gap-1 p-1 bg-[#f2f4f6] rounded-md"
        >
          {FILTER_OPTIONS.map((opt) => {
            const active = filterMode === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => onFilterChange(opt.id)}
                className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0078d4] ${
                  active
                    ? 'bg-white text-[#0f172a] shadow-xs'
                    : 'text-[#565e74] hover:text-[#0f172a]'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        <div className="hidden xl:flex items-center gap-2 text-xs text-[#565e74] tabular-nums whitespace-nowrap">
          <span>{triageCount} in triage</span>
          <span aria-hidden="true">·</span>
          <span>{kanbanCount} on board</span>
        </div>
      </div>
    </div>
  );
}
