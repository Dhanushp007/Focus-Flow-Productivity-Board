import {
  AlertTriangle,
  CheckCircle2,
  CheckSquare,
  Clock,
  Mail,
  Plus,
  Trash2,
  UserCheck,
  X,
} from 'lucide-react';
import React, { useState } from 'react';
import { KanbanColumn, Task } from '../types/focusflow';
import {
  formatShortDate,
  isDateOverdueOrToday,
  KANBAN_COLUMNS,
  PRIORITY_CONFIG,
} from '../utils/taskHelpers';

interface KanbanBoardProps {
  tasksByColumn: Record<KanbanColumn, Task[]>;
  allTasksCountByColumn: Record<KanbanColumn, number>;
  draggedTaskId: string | null;
  onDragStartTask: (taskId: string) => void;
  onDragEndTask: () => void;
  onDropOnColumn: (column: KanbanColumn, targetIndex?: number) => void;
  onAddColumnTask: (column: KanbanColumn, title: string) => void;
  onOpenTask: (task: Task) => void;
  onClearDone: () => void;
}

export function KanbanBoard({
  tasksByColumn,
  allTasksCountByColumn,
  draggedTaskId,
  onDragStartTask,
  onDragEndTask,
  onDropOnColumn,
  onAddColumnTask,
  onOpenTask,
  onClearDone,
}: KanbanBoardProps) {
  const [activeColumnInput, setActiveColumnInput] = useState<KanbanColumn | null>(null);
  const [newCardTitle, setNewCardTitle] = useState('');
  const [dragOverColumn, setDragOverColumn] = useState<KanbanColumn | null>(null);

  const handleCreateSubmit = (e: React.FormEvent, column: KanbanColumn) => {
    e.preventDefault();
    const trimmed = newCardTitle.trim();
    if (!trimmed) return;
    onAddColumnTask(column, trimmed);
    setNewCardTitle('');
    setActiveColumnInput(null);
  };

  return (
    <section
      aria-label="Kanban Execution Board"
      className="flex-1 min-w-0 overflow-x-auto thin-scrollbar p-4 lg:p-5 bg-[#f7f9fb]"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 min-h-full items-start">
        {KANBAN_COLUMNS.map((col) => {
          const visibleTasks = tasksByColumn[col.id];
          const totalInCol = allTasksCountByColumn[col.id];
          const isWipExceeded =
            col.id === 'in_progress' && col.wipLimit !== undefined && totalInCol > col.wipLimit;
          const isDropTarget = dragOverColumn === col.id && draggedTaskId !== null;

          return (
            <div
              key={col.id}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                if (dragOverColumn !== col.id) {
                  setDragOverColumn(col.id);
                }
              }}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                  setDragOverColumn(null);
                }
              }}
              onDrop={(e) => {
                e.preventDefault();
                setDragOverColumn(null);
                onDropOnColumn(col.id);
              }}
              className={`flex flex-col rounded-lg border transition-colors min-h-[380px] ${
                isDropTarget
                  ? 'bg-[#eff6ff] border-[#0078d4] ring-2 ring-[#0078d4]/20'
                  : 'bg-[#f2f4f6]/70 border-[#e2e8f0]'
              }`}
            >
              {/* Column Header */}
              <div className="px-3.5 py-3 border-b border-[#e2e8f0] bg-white rounded-t-lg">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <h3 className="font-display text-[13.5px] font-semibold text-[#0f172a] whitespace-nowrap">
                      {col.label}
                    </h3>
                    {col.id === 'in_progress' && col.wipLimit !== undefined ? (
                      <span
                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[11px] font-mono font-medium rounded tabular-nums whitespace-nowrap ${
                          isWipExceeded
                            ? 'bg-[#ffdad6] text-[#93000a]'
                            : 'bg-[#f2f4f6] text-[#404752]'
                        }`}
                      >
                        {isWipExceeded && <AlertTriangle className="w-3 h-3" />}
                        {totalInCol} / {col.wipLimit}
                      </span>
                    ) : (
                      <span className="text-xs font-mono font-medium text-[#565e74] tabular-nums">
                        {totalInCol}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {col.id === 'done' && totalInCol > 0 && (
                      <button
                        type="button"
                        onClick={onClearDone}
                        title="Archive all completed tasks"
                        className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-[#565e74] hover:text-[#ba1a1a] hover:bg-[#ffdad6]/40 rounded transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Clear</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setActiveColumnInput(col.id);
                        setNewCardTitle('');
                      }}
                      title={`Add task to ${col.label}`}
                      aria-label={`Add task to ${col.label}`}
                      className="p-1 text-[#565e74] hover:text-[#0f172a] hover:bg-[#f2f4f6] rounded transition-colors cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {isWipExceeded ? (
                  <p className="mt-1 text-[11px] font-medium text-[#ba1a1a]">
                    WIP limit exceeded — finish active items before pulling more
                  </p>
                ) : (
                  <p className="mt-0.5 text-[11px] text-[#717783]">{col.subtitle}</p>
                )}
              </div>

              {/* Column Body */}
              <div className="flex-1 p-2.5 space-y-2.5">
                {/* Inline Column Quick-Add */}
                {activeColumnInput === col.id && (
                  <form
                    onSubmit={(e) => handleCreateSubmit(e, col.id)}
                    className="bg-white border border-[#0078d4] rounded-lg p-2.5 shadow-xs"
                  >
                    <input
                      type="text"
                      autoFocus
                      value={newCardTitle}
                      onChange={(e) => setNewCardTitle(e.target.value)}
                      placeholder={`New task in ${col.label}...`}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') {
                          setActiveColumnInput(null);
                          setNewCardTitle('');
                        }
                      }}
                      className="w-full text-xs text-[#0f172a] placeholder:text-[#717783] focus:outline-none mb-2"
                    />
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveColumnInput(null);
                          setNewCardTitle('');
                        }}
                        className="p-1 text-[#565e74] hover:text-[#0f172a] rounded cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="submit"
                        className="px-2.5 py-1 text-[11px] font-medium text-white bg-[#0078d4] hover:bg-[#005faa] rounded transition-colors cursor-pointer"
                      >
                        Add Task
                      </button>
                    </div>
                  </form>
                )}

                {visibleTasks.length === 0 && activeColumnInput !== col.id ? (
                  <div className="border border-dashed border-[#c0c7d4] rounded-lg p-4 text-center">
                    <p className="text-xs text-[#717783] mb-2">
                      Drop tasks here or create one
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveColumnInput(col.id);
                        setNewCardTitle('');
                      }}
                      className="inline-flex items-center gap-1 text-xs font-medium text-[#005faa] hover:underline cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add task</span>
                    </button>
                  </div>
                ) : (
                  visibleTasks.map((task, idx) => {
                    const priorityMeta = PRIORITY_CONFIG[task.priority];
                    const dateStatus = isDateOverdueOrToday(task.dueDate);
                    const formattedDate = formatShortDate(task.dueDate);
                    const completedSubtasks = task.subtasks.filter((s) => s.completed).length;

                    return (
                      <article
                        key={task.id}
                        draggable
                        onDragStart={(e) => {
                          e.stopPropagation();
                          e.dataTransfer.setData('text/plain', task.id);
                          e.dataTransfer.effectAllowed = 'move';
                          onDragStartTask(task.id);
                        }}
                        onDragEnd={onDragEndTask}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setDragOverColumn(null);
                          onDropOnColumn(col.id, idx);
                        }}
                        onClick={() => onOpenTask(task)}
                        className={`bg-white border rounded-lg p-3 transition-colors cursor-pointer ${
                          draggedTaskId === task.id
                            ? 'opacity-50 border-[#0078d4]'
                            : 'border-[#e2e8f0] hover:border-[#c0c7d4]'
                        }`}
                      >
                        {/* Quiet Single-Line Kicker (Zero-Pill) */}
                        <div className="flex items-center justify-between gap-2 text-[11px] mb-1.5">
                          <div className="flex items-center gap-1.5 min-w-0">
                            {task.source === 'outlook' ? (
                              <Mail className="w-3 h-3 text-[#0078d4] shrink-0" />
                            ) : (
                              <CheckSquare className="w-3 h-3 text-[#717783] shrink-0" />
                            )}
                            <span className={`font-medium ${priorityMeta.textClass}`}>
                              {priorityMeta.label}
                            </span>
                            <span aria-hidden="true" className="text-[#c0c7d4]">
                              ·
                            </span>
                            <span className="text-[#565e74] truncate">
                              {task.source === 'outlook'
                                ? task.outlookMetadata?.senderName || 'Outlook'
                                : 'Manual'}
                            </span>
                          </div>
                          {col.id === 'done' && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#16a34a] shrink-0" />
                          )}
                        </div>

                        {/* Title */}
                        <h4
                          className={`text-[13px] font-medium leading-snug mb-1.5 ${
                            col.id === 'done' ? 'line-through text-[#565e74]' : 'text-[#0f172a]'
                          }`}
                        >
                          {task.title}
                        </h4>

                        {/* Waiting On Person Indicator */}
                        {task.waitingOnPerson && (
                          <div className="flex items-center gap-1.5 text-[11.5px] font-medium text-[#974700] mb-2">
                            <UserCheck className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">Waiting on {task.waitingOnPerson}</span>
                          </div>
                        )}

                        {/* Metadata Footer (Unboxed, Tabular) */}
                        <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#f2f4f6] text-[11px] text-[#565e74] tabular-nums">
                          <div className="flex items-center gap-2 min-w-0 truncate">
                            {task.tags.length > 0 && (
                              <span className="truncate">{task.tags.slice(0, 2).join(' · ')}</span>
                            )}
                          </div>

                          <div className="flex items-center gap-2.5 shrink-0">
                            {task.subtasks.length > 0 && (
                              <span className="font-mono">
                                {completedSubtasks}/{task.subtasks.length}
                              </span>
                            )}
                            {formattedDate && (
                              <span
                                className={`inline-flex items-center gap-1 ${
                                  col.id !== 'done' && dateStatus === 'overdue'
                                    ? 'text-[#ba1a1a] font-medium'
                                    : col.id !== 'done' && dateStatus === 'today'
                                    ? 'text-[#974700] font-medium'
                                    : ''
                                }`}
                              >
                                <Clock className="w-3 h-3" />
                                {formattedDate}
                              </span>
                            )}
                          </div>
                        </div>
                      </article>
                    );
                  })
                )}
              </div>

              {/* Column Footer Quick Add */}
              {visibleTasks.length > 0 && activeColumnInput !== col.id && (
                <div className="px-2.5 pb-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveColumnInput(col.id);
                      setNewCardTitle('');
                    }}
                    className="w-full py-1.5 px-2 text-xs font-medium text-[#565e74] hover:text-[#0f172a] hover:bg-white rounded-md transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add task</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
