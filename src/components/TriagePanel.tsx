import { ArrowRight, CheckSquare, ExternalLink, Mail, Plus, X } from 'lucide-react';
import React, { useState } from 'react';
import { Task } from '../types/focusflow';
import { formatShortDate, isDateOverdueOrToday, PRIORITY_CONFIG } from '../utils/taskHelpers';

interface TriagePanelProps {
  tasks: Task[];
  totalUnfilteredCount: number;
  onAddManualTriage: (title: string) => void;
  onInlineEditTitle: (taskId: string, newTitle: string) => void;
  onMoveToBoard: (taskId: string) => void;
  onDismissTask: (taskId: string) => void;
  onOpenTask: (task: Task) => void;
  onSyncOutlook: () => void;
  onDragStartTask: (taskId: string) => void;
  onDragEndTask: () => void;
}

export function TriagePanel({
  tasks,
  totalUnfilteredCount,
  onAddManualTriage,
  onInlineEditTitle,
  onMoveToBoard,
  onDismissTask,
  onOpenTask,
  onSyncOutlook,
  onDragStartTask,
  onDragEndTask,
}: TriagePanelProps) {
  const [quickTitle, setQuickTitle] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState('');

  const handleQuickAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = quickTitle.trim();
    if (!trimmed) return;
    onAddManualTriage(trimmed);
    setQuickTitle('');
  };

  const startInlineEdit = (e: React.MouseEvent, task: Task) => {
    e.stopPropagation();
    setEditingId(task.id);
    setDraftTitle(task.title);
  };

  const commitInlineEdit = (taskId: string) => {
    const trimmed = draftTitle.trim();
    if (trimmed) {
      onInlineEditTitle(taskId, trimmed);
    }
    setEditingId(null);
  };

  return (
    <aside
      aria-label="To-Do Triage Inbox"
      className="w-full lg:w-[32%] lg:min-w-[320px] lg:max-w-[420px] bg-[#f2f4f6] border-b lg:border-b-0 lg:border-r border-[#e2e8f0] flex flex-col shrink-0"
    >
      {/* Panel Header */}
      <div className="px-4 pt-4 pb-3 border-b border-[#e2e8f0] bg-white">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div>
            <h2 className="font-display text-sm font-semibold text-[#0f172a]">
              To-Do Triage Inbox
            </h2>
            <p className="text-xs text-[#565e74]">
              Review Outlook imports &amp; quick captures before promoting
            </p>
          </div>
          <span className="font-mono text-xs font-medium text-[#404752] tabular-nums">
            {tasks.length}
            {tasks.length !== totalUnfilteredCount ? ` / ${totalUnfilteredCount}` : ''}
          </span>
        </div>

        {/* Quick-Add Bar */}
        <form onSubmit={handleQuickAddSubmit} className="relative">
          <Plus className="w-4 h-4 text-[#717783] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={quickTitle}
            onChange={(e) => setQuickTitle(e.target.value)}
            placeholder="+ Add to-do item and press Enter..."
            aria-label="Quick add triage to-do item"
            className="w-full h-9 pl-9 pr-3 text-xs bg-[#f7f9fb] border border-[#e2e8f0] rounded-md text-[#191c1e] placeholder:text-[#717783] focus:outline-none focus:bg-white focus:border-[#0078d4] transition-colors"
          />
        </form>
      </div>

      {/* Triage Item List */}
      <div className="flex-1 overflow-y-auto thin-scrollbar p-3 space-y-2.5">
        {tasks.length === 0 ? (
          <div className="bg-white border border-dashed border-[#c0c7d4] rounded-lg p-6 text-center">
            <p className="text-sm font-medium text-[#0f172a] mb-1">
              {totalUnfilteredCount === 0 ? 'Triage inbox is clear' : 'No matching triage items'}
            </p>
            <p className="text-xs text-[#565e74] mb-4">
              {totalUnfilteredCount === 0
                ? 'Sync Outlook to scan for new actionable emails or add a quick to-do above.'
                : 'Try adjusting your search query or source filter.'}
            </p>
            {totalUnfilteredCount === 0 && (
              <button
                type="button"
                onClick={onSyncOutlook}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#005faa] bg-[#d3e3ff]/50 hover:bg-[#d3e3ff] rounded-md transition-colors cursor-pointer"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Sync Outlook</span>
              </button>
            )}
          </div>
        ) : (
          tasks.map((task) => {
            const priorityMeta = PRIORITY_CONFIG[task.priority];
            const dateStatus = isDateOverdueOrToday(task.dueDate);
            const formattedDate = formatShortDate(task.dueDate);
            const isEditing = editingId === task.id;

            return (
              <article
                key={task.id}
                draggable={!isEditing}
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/plain', task.id);
                  e.dataTransfer.effectAllowed = 'move';
                  onDragStartTask(task.id);
                }}
                onDragEnd={onDragEndTask}
                onClick={() => {
                  if (!isEditing) onOpenTask(task);
                }}
                className="group bg-white border border-[#e2e8f0] hover:border-[#c0c7d4] rounded-lg p-3.5 transition-colors cursor-pointer"
              >
                {/* Top Metadata Line (Zero-Pill Discipline) */}
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-1.5 min-w-0 text-[11px] text-[#565e74]">
                    {task.source === 'outlook' ? (
                      <Mail className="w-3.5 h-3.5 text-[#0078d4] shrink-0" />
                    ) : (
                      <CheckSquare className="w-3.5 h-3.5 text-[#565e74] shrink-0" />
                    )}
                    <span className="truncate font-medium text-[#404752]">
                      {task.source === 'outlook'
                        ? task.outlookMetadata?.matchedRule || 'Outlook'
                        : 'Manual Capture'}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className={`font-medium shrink-0 ${priorityMeta.textClass}`}>
                      {priorityMeta.label}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDismissTask(task.id);
                    }}
                    title="Dismiss from triage"
                    aria-label={`Dismiss ${task.title}`}
                    className="p-1 -m-1 text-[#717783] hover:text-[#ba1a1a] rounded transition-colors cursor-pointer shrink-0"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Inline-Editable Task Title */}
                {isEditing ? (
                  <input
                    type="text"
                    autoFocus
                    value={draftTitle}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => setDraftTitle(e.target.value)}
                    onBlur={() => commitInlineEdit(task.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        commitInlineEdit(task.id);
                      } else if (e.key === 'Escape') {
                        setEditingId(null);
                      }
                    }}
                    className="w-full px-2 py-1 text-sm font-medium text-[#0f172a] bg-[#f7f9fb] border border-[#0078d4] rounded focus:outline-none mb-1.5"
                  />
                ) : (
                  <h3
                    onClick={(e) => startInlineEdit(e, task)}
                    title="Click title to edit inline, or click card for details"
                    className="text-[13.5px] font-medium leading-snug text-[#0f172a] hover:text-[#005faa] transition-colors mb-1.5 cursor-text"
                  >
                    {task.title}
                  </h3>
                )}

                {/* Sender / Snippet */}
                {task.source === 'outlook' && task.outlookMetadata && (
                  <p className="text-xs text-[#404752] mb-1 truncate">
                    From <span className="font-medium">{task.outlookMetadata.senderName}</span>
                    <span className="text-[#717783]"> ({task.outlookMetadata.senderEmail})</span>
                  </p>
                )}

                {task.description && (
                  <p className="text-xs text-[#565e74] line-clamp-2 leading-relaxed mb-2.5">
                    {task.description}
                  </p>
                )}

                {/* Footer & Action Row */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#f2f4f6]">
                  <div className="flex items-center gap-2 text-[11px] text-[#565e74] tabular-nums min-w-0">
                    {formattedDate && (
                      <span
                        className={
                          dateStatus === 'overdue'
                            ? 'text-[#ba1a1a] font-medium'
                            : dateStatus === 'today'
                            ? 'text-[#974700] font-medium'
                            : ''
                        }
                      >
                        Due {formattedDate}
                      </span>
                    )}
                    {task.outlookMetadata?.webLink && (
                      <a
                        href={task.outlookMetadata.webLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 text-[#005faa] hover:underline whitespace-nowrap"
                      >
                        <span>Email</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onMoveToBoard(task.id);
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-[#005faa] bg-[#f7f9fb] hover:bg-[#d3e3ff]/60 border border-[#e2e8f0] rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <span>Move to Board</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </article>
            );
          })
        )}
      </div>
    </aside>
  );
}
