import { CheckCircle2, Info, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { DashboardView } from './components/DashboardView';
import { Header } from './components/Header';
import { KanbanBoard } from './components/KanbanBoard';
import { OutlookRulesModal } from './components/OutlookRulesModal';
import { TaskDetailModal } from './components/TaskDetailModal';
import { TriagePanel } from './components/TriagePanel';
import { WorkspaceToolbar } from './components/WorkspaceToolbar';
import {
  DEFAULT_OUTLOOK_RULES,
  INITIAL_SYNC_REPORT,
  INITIAL_TASKS,
} from './data/mockInbox';
import { useLocalStorage } from './hooks/useLocalStorage';
import { fetchAndFilterOutlookEmails } from './services/outlookSync';
import {
  AppView,
  FilterMode,
  KanbanColumn,
  OutlookRules,
  SyncReport,
  Task,
} from './types/focusflow';
import { matchesSearchAndFilter } from './utils/taskHelpers';

interface ToastMessage {
  id: string;
  message: string;
  detail?: string;
  tone: 'info' | 'success';
}

export default function App() {
  const [tasks, setTasks] = useLocalStorage<Task[]>('focusflow_tasks_v1', INITIAL_TASKS);
  const [outlookRules, setOutlookRules] = useLocalStorage<OutlookRules>(
    'focusflow_rules_v1',
    DEFAULT_OUTLOOK_RULES
  );
  const [dismissedEmailIds, setDismissedEmailIds] = useLocalStorage<string[]>(
    'focusflow_dismissed_ids_v1',
    []
  );
  const [lastSyncReport, setLastSyncReport] = useLocalStorage<SyncReport | null>(
    'focusflow_last_sync_v1',
    INITIAL_SYNC_REPORT
  );
  const [activeView, setActiveView] = useLocalStorage<AppView>(
    'focusflow_active_view_v1',
    'workspace'
  );
  const [isTriageCollapsed, setIsTriageCollapsed] = useLocalStorage<boolean>(
    'focusflow_triage_collapsed_v1',
    false
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<{ task: Task; isNew: boolean } | null>(null);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const showToast = (message: string, detail?: string, tone: 'info' | 'success' = 'success') => {
    const id = Date.now().toString(36);
    setToast({ id, message, detail, tone });
  };

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => {
      setToast(null);
    }, 5200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  // Escape closes open modals
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (editingTask) setEditingTask(null);
        else if (isRulesOpen) setIsRulesOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [editingTask, isRulesOpen]);

  // Derived filtered slices
  const allTriageTasks = useMemo(
    () =>
      tasks
        .filter((t) => t.location === 'triage')
        .sort((a, b) => a.order - b.order),
    [tasks]
  );

  const filteredTriageTasks = useMemo(
    () =>
      allTriageTasks.filter((t) => matchesSearchAndFilter(t, searchQuery, filterMode)),
    [allTriageTasks, searchQuery, filterMode]
  );

  const allKanbanCountByColumn = useMemo<Record<KanbanColumn, number>>(() => {
    const counts: Record<KanbanColumn, number> = {
      ready: 0,
      in_progress: 0,
      waiting_on: 0,
      done: 0,
    };
    for (const t of tasks) {
      if (t.location === 'kanban' && t.kanbanColumn) {
        counts[t.kanbanColumn] += 1;
      }
    }
    return counts;
  }, [tasks]);

  const filteredKanbanByColumn = useMemo<Record<KanbanColumn, Task[]>>(() => {
    const grouped: Record<KanbanColumn, Task[]> = {
      ready: [],
      in_progress: [],
      waiting_on: [],
      done: [],
    };

    for (const t of tasks) {
      if (
        t.location === 'kanban' &&
        t.kanbanColumn &&
        matchesSearchAndFilter(t, searchQuery, filterMode)
      ) {
        grouped[t.kanbanColumn].push(t);
      }
    }

    (Object.keys(grouped) as KanbanColumn[]).forEach((col) => {
      grouped[col].sort((a, b) => a.order - b.order);
    });

    return grouped;
  }, [tasks, searchQuery, filterMode]);

  const totalKanbanCount =
    allKanbanCountByColumn.ready +
    allKanbanCountByColumn.in_progress +
    allKanbanCountByColumn.waiting_on +
    allKanbanCountByColumn.done;

  // Actions
  const handleSyncOutlook = async (rulesOverride?: OutlookRules) => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      const existingMessageIds = new Set<string>(
        tasks
          .map((t) => t.outlookMetadata?.messageId)
          .filter((id): id is string => Boolean(id))
      );
      const dismissedSet = new Set<string>(dismissedEmailIds);

      const activeRules = rulesOverride || outlookRules;
      const { newTasks, report } = await fetchAndFilterOutlookEmails(
        activeRules,
        existingMessageIds,
        dismissedSet
      );

      if (newTasks.length > 0) {
        setTasks((prev) => {
          const bumpedExisting = prev.map((t) =>
            t.location === 'triage' ? { ...t, order: t.order + newTasks.length } : t
          );
          return [...newTasks, ...bumpedExisting];
        });
      }

      setLastSyncReport(report);

      if (report.addedCount > 0) {
        showToast(
          `Synced: ${report.addedCount} important ${
            report.addedCount === 1 ? 'email' : 'emails'
          } added to Triage, ${report.filteredOutCount} filtered out`,
          `Scanned ${report.totalScanned} corporate inbox messages`,
          'success'
        );
      } else {
        showToast(
          `Inbox up to date: 0 new emails matched, ${report.filteredOutCount} filtered out`,
          report.skippedCount > 0
            ? `${report.skippedCount} already imported or dismissed`
            : undefined,
          'info'
        );
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const handleAddManualTriage = (title: string) => {
    const nowIso = new Date().toISOString();
    const newTask: Task = {
      id: `task-manual-${Date.now().toString(36)}`,
      title,
      description: '',
      source: 'manual',
      location: 'triage',
      kanbanColumn: null,
      priority: 'medium',
      dueDate: null,
      tags: [],
      waitingOnPerson: null,
      subtasks: [],
      outlookMetadata: null,
      order: 0,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    setTasks((prev) => [
      newTask,
      ...prev.map((t) => (t.location === 'triage' ? { ...t, order: t.order + 1 } : t)),
    ]);
  };

  const handleInlineEditTitle = (taskId: string, newTitle: string) => {
    const nowIso = new Date().toISOString();
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, title: newTitle, updatedAt: nowIso } : t))
    );
  };

  const handleMoveToBoard = (taskId: string, targetColumn: KanbanColumn = 'ready') => {
    const nowIso = new Date().toISOString();
    setTasks((prev) => {
      const targetColCount = prev.filter(
        (t) => t.location === 'kanban' && t.kanbanColumn === targetColumn
      ).length;
      return prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              location: 'kanban',
              kanbanColumn: targetColumn,
              order: targetColCount,
              updatedAt: nowIso,
            }
          : t
      );
    });
    showToast('Moved task to Ready column', undefined, 'info');
  };

  const handleDismissTask = (taskId: string) => {
    const target = tasks.find((t) => t.id === taskId);
    if (!target) return;

    if (target.outlookMetadata?.messageId) {
      const msgId = target.outlookMetadata.messageId;
      setDismissedEmailIds((prev) => (prev.includes(msgId) ? prev : [...prev, msgId]));
    }

    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    showToast('Task dismissed from triage', undefined, 'info');
  };

  const handleAddColumnTask = (column: KanbanColumn, title: string) => {
    const nowIso = new Date().toISOString();
    setTasks((prev) => {
      const colCount = prev.filter(
        (t) => t.location === 'kanban' && t.kanbanColumn === column
      ).length;
      const newTask: Task = {
        id: `task-kanban-${Date.now().toString(36)}`,
        title,
        description: '',
        source: 'manual',
        location: 'kanban',
        kanbanColumn: column,
        priority: 'medium',
        dueDate: null,
        tags: [],
        waitingOnPerson: null,
        subtasks: [],
        outlookMetadata: null,
        order: colCount,
        createdAt: nowIso,
        updatedAt: nowIso,
      };
      return [...prev, newTask];
    });
  };

  const handleDropOnColumn = (targetColumn: KanbanColumn, targetIndex?: number) => {
    if (!draggedTaskId) return;
    const nowIso = new Date().toISOString();

    setTasks((prev) => {
      const moving = prev.find((t) => t.id === draggedTaskId);
      if (!moving) return prev;

      const withoutMoving = prev.filter((t) => t.id !== draggedTaskId);
      const targetColumnTasks = withoutMoving
        .filter((t) => t.location === 'kanban' && t.kanbanColumn === targetColumn)
        .sort((a, b) => a.order - b.order);

      const updatedMoving: Task = {
        ...moving,
        location: 'kanban',
        kanbanColumn: targetColumn,
        updatedAt: nowIso,
      };

      const insertAt =
        targetIndex !== undefined && targetIndex >= 0 && targetIndex <= targetColumnTasks.length
          ? targetIndex
          : targetColumnTasks.length;

      targetColumnTasks.splice(insertAt, 0, updatedMoving);

      const reindexedMap = new Map<string, Task>();
      targetColumnTasks.forEach((t, index) => {
        reindexedMap.set(t.id, { ...t, order: index });
      });

      const others = withoutMoving.filter(
        (t) => !(t.location === 'kanban' && t.kanbanColumn === targetColumn)
      );

      return [...others, ...Array.from(reindexedMap.values())];
    });

    setDraggedTaskId(null);
  };

  const handleClearDone = () => {
    const doneTasks = tasks.filter(
      (t) => t.location === 'kanban' && t.kanbanColumn === 'done'
    );
    if (doneTasks.length === 0) return;

    const doneEmailIds = doneTasks
      .map((t) => t.outlookMetadata?.messageId)
      .filter((id): id is string => Boolean(id));

    if (doneEmailIds.length > 0) {
      setDismissedEmailIds((prev) => Array.from(new Set([...prev, ...doneEmailIds])));
    }

    setTasks((prev) =>
      prev.filter((t) => !(t.location === 'kanban' && t.kanbanColumn === 'done'))
    );
    showToast(`Cleared ${doneTasks.length} completed tasks`, undefined, 'info');
  };

  const handleSaveTaskModal = (updated: Task) => {
    if (editingTask?.isNew) {
      setTasks((prev) => [updated, ...prev]);
      showToast('Task created', undefined, 'success');
    } else {
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      showToast('Task updated', undefined, 'info');
    }
    setEditingTask(null);
  };

  const handleDeleteTaskModal = (taskId: string) => {
    const target = tasks.find((t) => t.id === taskId);
    if (target?.outlookMetadata?.messageId) {
      const msgId = target.outlookMetadata.messageId;
      setDismissedEmailIds((prev) => (prev.includes(msgId) ? prev : [...prev, msgId]));
    }
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    setEditingTask(null);
    showToast('Task removed', undefined, 'info');
  };

  const handleSaveRules = (newRules: OutlookRules, triggerSync: boolean) => {
    setOutlookRules(newRules);
    setIsRulesOpen(false);
    if (triggerSync) {
      void handleSyncOutlook(newRules);
    } else {
      showToast('Outlook rules saved', undefined, 'success');
    }
  };

  const handleResetWorkspace = () => {
    setTasks(INITIAL_TASKS);
    setOutlookRules(DEFAULT_OUTLOOK_RULES);
    setDismissedEmailIds([]);
    setLastSyncReport(INITIAL_SYNC_REPORT);
    setSearchQuery('');
    setFilterMode('all');
    showToast('Workspace reset to default dataset', undefined, 'info');
  };

  const handleOpenNewTaskModal = () => {
    const nowIso = new Date().toISOString();
    const blankTask: Task = {
      id: `task-manual-${Date.now().toString(36)}`,
      title: '',
      description: '',
      source: 'manual',
      location: 'kanban',
      kanbanColumn: 'ready',
      priority: 'medium',
      dueDate: null,
      tags: [],
      waitingOnPerson: null,
      subtasks: [],
      outlookMetadata: null,
      order: 0,
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    setEditingTask({ task: blankTask, isNew: true });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f7f9fb] text-[#191c1e]">
      <Header
        activeView={activeView}
        onChangeView={setActiveView}
        onOpenRules={() => setIsRulesOpen(true)}
        onSyncOutlook={() => void handleSyncOutlook()}
        isSyncing={isSyncing}
        lastSyncedAt={lastSyncReport?.timestamp || null}
        triageCount={allTriageTasks.length}
      />

      {activeView === 'workspace' ? (
        <div className="flex-1 flex flex-col min-h-0">
          <WorkspaceToolbar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            filterMode={filterMode}
            onFilterChange={setFilterMode}
            isTriageCollapsed={isTriageCollapsed}
            onToggleTriage={() => setIsTriageCollapsed((c) => !c)}
            triageCount={allTriageTasks.length}
            kanbanCount={totalKanbanCount}
          />

          <div className="flex-1 flex flex-col lg:flex-row min-h-[calc(100vh-7.5rem)]">
            {!isTriageCollapsed && (
              <TriagePanel
                tasks={filteredTriageTasks}
                totalUnfilteredCount={allTriageTasks.length}
                onAddManualTriage={handleAddManualTriage}
                onInlineEditTitle={handleInlineEditTitle}
                onMoveToBoard={(id) => handleMoveToBoard(id, 'ready')}
                onDismissTask={handleDismissTask}
                onOpenTask={(task) => setEditingTask({ task, isNew: false })}
                onSyncOutlook={() => void handleSyncOutlook()}
                onDragStartTask={(id) => setDraggedTaskId(id)}
                onDragEndTask={() => setDraggedTaskId(null)}
              />
            )}

            <KanbanBoard
              tasksByColumn={filteredKanbanByColumn}
              allTasksCountByColumn={allKanbanCountByColumn}
              draggedTaskId={draggedTaskId}
              onDragStartTask={(id) => setDraggedTaskId(id)}
              onDragEndTask={() => setDraggedTaskId(null)}
              onDropOnColumn={handleDropOnColumn}
              onAddColumnTask={handleAddColumnTask}
              onOpenTask={(task) => setEditingTask({ task, isNew: false })}
              onClearDone={handleClearDone}
            />
          </div>
        </div>
      ) : (
        <DashboardView
          tasks={tasks}
          rules={outlookRules}
          lastSyncReport={lastSyncReport}
          dismissedCount={dismissedEmailIds.length}
          isSyncing={isSyncing}
          onSyncOutlook={() => void handleSyncOutlook()}
          onOpenRules={() => setIsRulesOpen(true)}
          onOpenWorkspace={() => setActiveView('workspace')}
          onOpenTask={(task) => setEditingTask({ task, isNew: false })}
          onMoveToBoard={(id) => handleMoveToBoard(id, 'ready')}
          onCreateNewTask={handleOpenNewTaskModal}
        />
      )}

      {/* Task Detail & Edit Modal */}
      {editingTask && (
        <TaskDetailModal
          task={editingTask.task}
          isNew={editingTask.isNew}
          onClose={() => setEditingTask(null)}
          onSave={handleSaveTaskModal}
          onDelete={handleDeleteTaskModal}
        />
      )}

      {/* Outlook Rules Configuration Modal */}
      {isRulesOpen && (
        <OutlookRulesModal
          rules={outlookRules}
          onClose={() => setIsRulesOpen(false)}
          onSave={handleSaveRules}
          onResetWorkspace={handleResetWorkspace}
        />
      )}

      {/* Toast Notification */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 right-5 z-50 max-w-sm bg-[#0f172a] text-white border border-[#334155] rounded-lg shadow-lg px-4 py-3 flex items-start gap-3"
        >
          {toast.tone === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-[#4ade80] shrink-0 mt-0.5" />
          ) : (
            <Info className="w-4 h-4 text-[#60a5fa] shrink-0 mt-0.5" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium leading-snug">{toast.message}</p>
            {toast.detail && (
              <p className="text-[11px] text-[#cbd5e1] mt-0.5">{toast.detail}</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => setToast(null)}
            aria-label="Dismiss notification"
            className="text-[#94a3b8] hover:text-white p-0.5 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
