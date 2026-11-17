import { FilterMode, KanbanColumn, Task, TaskPriority } from '../types/focusflow';

export const KANBAN_COLUMNS: {
  id: KanbanColumn;
  label: string;
  subtitle: string;
  wipLimit?: number;
}[] = [
  { id: 'ready', label: 'Ready', subtitle: 'Triaged & committed' },
  { id: 'in_progress', label: 'In Progress', subtitle: 'Active execution', wipLimit: 3 },
  { id: 'waiting_on', label: 'Waiting On', subtitle: 'External dependency' },
  { id: 'done', label: 'Done', subtitle: 'Completed work' },
];

export const PRIORITY_CONFIG: Record<
  TaskPriority,
  { label: string; textClass: string; dotClass: string; rank: number }
> = {
  urgent: {
    label: 'Urgent',
    textClass: 'text-[#ba1a1a]',
    dotClass: 'bg-[#ba1a1a]',
    rank: 4,
  },
  high: {
    label: 'High',
    textClass: 'text-[#974700]',
    dotClass: 'bg-[#bc5b00]',
    rank: 3,
  },
  medium: {
    label: 'Medium',
    textClass: 'text-[#005faa]',
    dotClass: 'bg-[#0078d4]',
    rank: 2,
  },
  low: {
    label: 'Low',
    textClass: 'text-[#565e74]',
    dotClass: 'bg-[#717783]',
    rank: 1,
  },
};

export function matchesSearchAndFilter(
  task: Task,
  searchQuery: string,
  filterMode: FilterMode
): boolean {
  if (filterMode === 'outlook' && task.source !== 'outlook') return false;
  if (filterMode === 'manual' && task.source !== 'manual') return false;
  if (
    filterMode === 'high_urgent' &&
    task.priority !== 'high' &&
    task.priority !== 'urgent'
  ) {
    return false;
  }

  const q = searchQuery.trim().toLowerCase();
  if (!q) return true;

  const fields = [
    task.title,
    task.description,
    task.waitingOnPerson || '',
    ...task.tags,
    task.outlookMetadata?.senderName || '',
    task.outlookMetadata?.senderEmail || '',
    task.outlookMetadata?.originalSubject || '',
    task.outlookMetadata?.matchedRule || '',
  ];

  return fields.some((field) => field.toLowerCase().includes(q));
}

export function formatShortDate(dateStr: string | null): string | null {
  if (!dateStr) return null;
  const parsed = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return dateStr;
  return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function isDateOverdueOrToday(dateStr: string | null): 'overdue' | 'today' | 'upcoming' | null {
  if (!dateStr) return null;
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(
    2,
    '0'
  )}-${String(today.getDate()).padStart(2, '0')}`;
  if (dateStr < todayStr) return 'overdue';
  if (dateStr === todayStr) return 'today';
  return 'upcoming';
}

export function formatRelativeTime(isoString: string | null): string {
  if (!isoString) return 'Never';
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return 'Recently';
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatFullTimestamp(isoString: string | null): string {
  if (!isoString) return '—';
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return isoString;
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
