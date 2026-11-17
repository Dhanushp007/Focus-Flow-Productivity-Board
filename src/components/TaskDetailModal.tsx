import {
  CheckSquare,
  ExternalLink,
  Mail,
  Plus,
  Square,
  Trash2,
  X,
} from 'lucide-react';
import React, { useState } from 'react';
import {
  KanbanColumn,
  Subtask,
  Task,
  TaskLocation,
  TaskPriority,
} from '../types/focusflow';
import { formatFullTimestamp, KANBAN_COLUMNS } from '../utils/taskHelpers';

interface TaskDetailModalProps {
  task: Task;
  isNew?: boolean;
  onClose: () => void;
  onSave: (updated: Task) => void;
  onDelete: (taskId: string) => void;
}

export function TaskDetailModal({
  task,
  isNew = false,
  onClose,
  onSave,
  onDelete,
}: TaskDetailModalProps) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [location, setLocation] = useState<TaskLocation>(task.location);
  const [kanbanColumn, setKanbanColumn] = useState<KanbanColumn>(
    task.kanbanColumn || 'ready'
  );
  const [priority, setPriority] = useState<TaskPriority>(task.priority);
  const [dueDate, setDueDate] = useState(task.dueDate || '');
  const [waitingOnPerson, setWaitingOnPerson] = useState(task.waitingOnPerson || '');
  const [tags, setTags] = useState<string[]>(task.tags);
  const [tagInput, setTagInput] = useState('');
  const [subtasks, setSubtasks] = useState<Subtask[]>(task.subtasks);
  const [subtaskInput, setSubtaskInput] = useState('');

  const handleAddTag = () => {
    const clean = tagInput.trim();
    if (clean && !tags.includes(clean)) {
      setTags([...tags, clean]);
    }
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleAddSubtask = () => {
    const clean = subtaskInput.trim();
    if (!clean) return;
    setSubtasks([
      ...subtasks,
      { id: `st-${Date.now().toString(36)}`, title: clean, completed: false },
    ]);
    setSubtaskInput('');
  };

  const handleToggleSubtask = (id: string) => {
    setSubtasks(
      subtasks.map((st) => (st.id === id ? { ...st, completed: !st.completed } : st))
    );
  };

  const handleDeleteSubtask = (id: string) => {
    setSubtasks(subtasks.filter((st) => st.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;

    onSave({
      ...task,
      title: trimmedTitle,
      description: description.trim(),
      location,
      kanbanColumn: location === 'kanban' ? kanbanColumn : null,
      priority,
      dueDate: dueDate || null,
      waitingOnPerson: waitingOnPerson.trim() || null,
      tags,
      subtasks,
      updatedAt: new Date().toISOString(),
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="task-modal-title"
      onClick={onClose}
      className="fixed inset-0 z-50 bg-[#0f172a]/40 backdrop-blur-[1px] flex items-center justify-center p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl bg-white border border-[#e2e8f0] rounded-xl shadow-lg max-h-[90vh] flex flex-col overflow-hidden"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#e2e8f0] flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-[#565e74]">
            {task.source === 'outlook' ? (
              <>
                <Mail className="w-4 h-4 text-[#0078d4]" />
                <span className="font-medium text-[#005faa]">Outlook Imported Task</span>
              </>
            ) : (
              <>
                <CheckSquare className="w-4 h-4 text-[#565e74]" />
                <span className="font-medium text-[#404752]">
                  {isNew ? 'Create New Task' : 'Manual Task'}
                </span>
              </>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1 text-[#565e74] hover:text-[#0f172a] rounded-md cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form id="task-detail-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto thin-scrollbar p-6 space-y-5">
          <div>
            <label
              htmlFor="task-modal-title"
              className="block text-xs font-medium text-[#404752] mb-1.5"
            >
              Task Title
            </label>
            <input
              id="task-modal-title"
              type="text"
              required
              autoFocus={isNew}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Actionable task summary..."
              className="w-full px-3 py-2 text-sm font-medium text-[#0f172a] bg-[#f7f9fb] border border-[#e2e8f0] rounded-md focus:outline-none focus:bg-white focus:border-[#0078d4]"
            />
          </div>

          <div>
            <label
              htmlFor="task-modal-desc"
              className="block text-xs font-medium text-[#404752] mb-1.5"
            >
              Notes &amp; Context
            </label>
            <textarea
              id="task-modal-desc"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add acceptance criteria, links, or notes..."
              className="w-full px-3 py-2 text-xs text-[#191c1e] bg-[#f7f9fb] border border-[#e2e8f0] rounded-md focus:outline-none focus:bg-white focus:border-[#0078d4] resize-y"
            />
          </div>

          {/* Stage, Column, Priority, Due Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="task-stage-select"
                className="block text-xs font-medium text-[#404752] mb-1.5"
              >
                Workspace Stage
              </label>
              <select
                id="task-stage-select"
                value={location === 'triage' ? 'triage' : kanbanColumn}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === 'triage') {
                    setLocation('triage');
                  } else {
                    setLocation('kanban');
                    setKanbanColumn(val as KanbanColumn);
                  }
                }}
                className="w-full h-9 px-3 text-xs text-[#0f172a] bg-[#f7f9fb] border border-[#e2e8f0] rounded-md focus:outline-none focus:bg-white focus:border-[#0078d4]"
              >
                <option value="triage">To-Do Triage Inbox</option>
                {KANBAN_COLUMNS.map((col) => (
                  <option key={col.id} value={col.id}>
                    Kanban · {col.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="task-priority-select"
                className="block text-xs font-medium text-[#404752] mb-1.5"
              >
                Priority
              </label>
              <select
                id="task-priority-select"
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full h-9 px-3 text-xs text-[#0f172a] bg-[#f7f9fb] border border-[#e2e8f0] rounded-md focus:outline-none focus:bg-white focus:border-[#0078d4]"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="task-due-input"
                className="block text-xs font-medium text-[#404752] mb-1.5"
              >
                Due Date
              </label>
              <input
                id="task-due-input"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full h-9 px-3 text-xs text-[#0f172a] bg-[#f7f9fb] border border-[#e2e8f0] rounded-md focus:outline-none focus:bg-white focus:border-[#0078d4] tabular-nums"
              />
            </div>

            <div>
              <label
                htmlFor="task-waiting-input"
                className="block text-xs font-medium text-[#404752] mb-1.5"
              >
                Waiting On Person (Optional)
              </label>
              <input
                id="task-waiting-input"
                type="text"
                value={waitingOnPerson}
                onChange={(e) => setWaitingOnPerson(e.target.value)}
                placeholder="e.g., Sarah Jenkins"
                className="w-full h-9 px-3 text-xs text-[#0f172a] bg-[#f7f9fb] border border-[#e2e8f0] rounded-md focus:outline-none focus:bg-white focus:border-[#0078d4]"
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label
              htmlFor="task-tag-input"
              className="block text-xs font-medium text-[#404752] mb-1.5"
            >
              Tags
            </label>
            <div className="flex items-center gap-2 mb-2">
              <input
                id="task-tag-input"
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="Add a tag and press Enter..."
                className="flex-1 h-8 px-3 text-xs text-[#0f172a] bg-[#f7f9fb] border border-[#e2e8f0] rounded-md focus:outline-none focus:bg-white focus:border-[#0078d4]"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="h-8 px-3 text-xs font-medium text-[#0f172a] bg-[#f2f4f6] hover:bg-[#e6e8ea] rounded-md cursor-pointer"
              >
                Add
              </button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-0.5 text-xs text-[#404752] bg-[#f2f4f6] border border-[#e2e8f0] rounded"
                  >
                    <span>{tag}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      aria-label={`Remove ${tag}`}
                      className="text-[#717783] hover:text-[#ba1a1a] cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Subtasks */}
          <div>
            <label
              htmlFor="task-subtask-input"
              className="block text-xs font-medium text-[#404752] mb-1.5"
            >
              Subtasks Checklist ({subtasks.filter((s) => s.completed).length}/{subtasks.length})
            </label>
            <div className="flex items-center gap-2 mb-2">
              <input
                id="task-subtask-input"
                type="text"
                value={subtaskInput}
                onChange={(e) => setSubtaskInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSubtask();
                  }
                }}
                placeholder="Add a step..."
                className="flex-1 h-8 px-3 text-xs text-[#0f172a] bg-[#f7f9fb] border border-[#e2e8f0] rounded-md focus:outline-none focus:bg-white focus:border-[#0078d4]"
              />
              <button
                type="button"
                onClick={handleAddSubtask}
                className="inline-flex items-center gap-1 h-8 px-3 text-xs font-medium text-[#0f172a] bg-[#f2f4f6] hover:bg-[#e6e8ea] rounded-md cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>
            {subtasks.length > 0 && (
              <ul className="divide-y divide-[#f2f4f6] border border-[#e2e8f0] rounded-md">
                {subtasks.map((st) => (
                  <li
                    key={st.id}
                    className="px-3 py-2 flex items-center justify-between gap-2 text-xs"
                  >
                    <button
                      type="button"
                      onClick={() => handleToggleSubtask(st.id)}
                      className="flex items-center gap-2 text-left flex-1 min-w-0 cursor-pointer"
                    >
                      {st.completed ? (
                        <CheckSquare className="w-4 h-4 text-[#0078d4] shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-[#717783] shrink-0" />
                      )}
                      <span
                        className={`truncate ${
                          st.completed ? 'line-through text-[#717783]' : 'text-[#0f172a]'
                        }`}
                      >
                        {st.title}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteSubtask(st.id)}
                      aria-label="Delete subtask"
                      className="text-[#717783] hover:text-[#ba1a1a] p-0.5 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Original Outlook Email Metadata */}
          {task.source === 'outlook' && task.outlookMetadata && (
            <div className="bg-[#f7f9fb] border border-[#e2e8f0] rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-xs font-semibold text-[#0f172a] flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-[#0078d4]" />
                  <span>Original Outlook Email Metadata</span>
                </h3>
                <a
                  href={task.outlookMetadata.webLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-medium text-[#005faa] hover:underline"
                >
                  <span>Open in Outlook</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-xs pt-1">
                <div>
                  <span className="text-[#565e74]">Sender: </span>
                  <span className="font-medium text-[#0f172a]">
                    {task.outlookMetadata.senderName} ({task.outlookMetadata.senderEmail})
                  </span>
                </div>
                <div className="tabular-nums">
                  <span className="text-[#565e74]">Received: </span>
                  <span className="text-[#0f172a]">
                    {formatFullTimestamp(task.outlookMetadata.receivedAt)}
                  </span>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-[#565e74]">Original Subject: </span>
                  <span className="font-medium text-[#0f172a]">
                    {task.outlookMetadata.originalSubject}
                  </span>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-[#565e74]">Matched Rule: </span>
                  <span className="text-[#005faa] font-medium">
                    {task.outlookMetadata.matchedRule}
                  </span>
                </div>
              </div>
            </div>
          )}
        </form>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-[#e2e8f0] bg-[#f7f9fb] flex items-center justify-between gap-3">
          {!isNew ? (
            <button
              type="button"
              onClick={() => onDelete(task.id)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#ba1a1a] hover:bg-[#ffdad6]/60 rounded-md transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{task.location === 'triage' ? 'Dismiss Task' : 'Delete Task'}</span>
            </button>
          ) : (
            <span />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-medium text-[#404752] hover:text-[#0f172a] bg-white border border-[#e2e8f0] rounded-md transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="task-detail-form"
              className="px-4 py-2 text-xs font-medium text-white bg-[#0078d4] hover:bg-[#005faa] rounded-md transition-colors cursor-pointer"
            >
              {isNew ? 'Create Task' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
