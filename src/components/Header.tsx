import { RefreshCw, SlidersHorizontal } from 'lucide-react';
import { AppView } from '../types/focusflow';
import { formatRelativeTime } from '../utils/taskHelpers';

interface HeaderProps {
  activeView: AppView;
  onChangeView: (view: AppView) => void;
  onOpenRules: () => void;
  onSyncOutlook: () => void;
  isSyncing: boolean;
  lastSyncedAt: string | null;
  triageCount: number;
}

export function Header({
  activeView,
  onChangeView,
  onOpenRules,
  onSyncOutlook,
  isSyncing,
  lastSyncedAt,
  triageCount,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 h-14 bg-white border-b border-[#e2e8f0] px-4 lg:px-6 flex items-center justify-between gap-8">
      {/* Zone 1: Clean Single-Element Brand Wordmark */}
      <div className="flex items-center gap-2.5 shrink-0">
        <span
          aria-hidden="true"
          className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-[#0078d4] text-white font-display font-semibold text-sm tracking-tight"
        >
          F
        </span>
        <span className="font-display text-[17px] font-semibold tracking-tight text-[#0f172a] whitespace-nowrap shrink-0">
          FocusFlow
        </span>
      </div>

      {/* Zone 2: Clean Single-Line Navigation Links */}
      <nav aria-label="Primary Views" className="flex items-center gap-6">
        <button
          type="button"
          onClick={() => onChangeView('dashboard')}
          className={`relative py-4 text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0078d4] rounded-sm ${
            activeView === 'dashboard'
              ? 'text-[#0f172a]'
              : 'text-[#565e74] hover:text-[#0f172a]'
          }`}
        >
          Dashboard
          {activeView === 'dashboard' && (
            <span className="absolute inset-x-0 bottom-0 h-0.5 bg-[#0078d4]" />
          )}
        </button>

        <button
          type="button"
          onClick={() => onChangeView('workspace')}
          className={`relative py-4 text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0078d4] rounded-sm flex items-center gap-1.5 ${
            activeView === 'workspace'
              ? 'text-[#0f172a]'
              : 'text-[#565e74] hover:text-[#0f172a]'
          }`}
        >
          <span>Triage &amp; Board</span>
          <span className="text-xs text-[#565e74] font-mono tabular-nums">
            ({triageCount})
          </span>
          {activeView === 'workspace' && (
            <span className="absolute inset-x-0 bottom-0 h-0.5 bg-[#0078d4]" />
          )}
        </button>

        <button
          type="button"
          onClick={onOpenRules}
          className="hidden sm:inline-flex items-center gap-1.5 py-1.5 text-sm font-medium text-[#565e74] hover:text-[#0f172a] transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0078d4] rounded-sm"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Outlook Rules</span>
        </button>
      </nav>

      {/* Zone 3: Primary Action */}
      <div className="flex items-center gap-3 shrink-0">
        {lastSyncedAt && (
          <span className="hidden md:inline text-xs text-[#717783] tabular-nums whitespace-nowrap">
            Synced {formatRelativeTime(lastSyncedAt)}
          </span>
        )}
        <button
          type="button"
          onClick={onOpenRules}
          aria-label="Configure Outlook Rules"
          className="sm:hidden inline-flex items-center justify-center h-9 w-9 rounded-md border border-[#e2e8f0] text-[#404752] hover:bg-[#f2f4f6] transition-colors cursor-pointer"
        >
          <SlidersHorizontal className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={onSyncOutlook}
          disabled={isSyncing}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-[#0078d4] hover:bg-[#005faa] disabled:opacity-70 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#0078d4]"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
          <span>{isSyncing ? 'Syncing...' : 'Sync Outlook'}</span>
        </button>
      </div>
    </header>
  );
}
