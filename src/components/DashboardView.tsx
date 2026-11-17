import {
  AlertTriangle,
  ArrowRight,
  Calendar,
  CheckCircle2,
  ExternalLink,
  Inbox,
  Mail,
  Plus,
  RefreshCw,
  SlidersHorizontal,
  UserCheck,
} from 'lucide-react';
import {
  KanbanColumn,
  OutlookRules,
  SyncReport,
  Task,
  TaskPriority,
} from '../types/focusflow';
import {
  formatFullTimestamp,
  formatShortDate,
  isDateOverdueOrToday,
  KANBAN_COLUMNS,
  PRIORITY_CONFIG,
} from '../utils/taskHelpers';

interface DashboardViewProps {
  tasks: Task[];
  rules: OutlookRules;
  lastSyncReport: SyncReport | null;
  dismissedCount: number;
  isSyncing: boolean;
  onSyncOutlook: () => void;
  onOpenRules: () => void;
  onOpenWorkspace: () => void;
  onOpenTask: (task: Task) => void;
  onMoveToBoard: (taskId: string) => void;
  onCreateNewTask: () => void;
}

export function DashboardView({
  tasks,
  rules,
  lastSyncReport,
  dismissedCount,
  isSyncing,
  onSyncOutlook,
  onOpenRules,
  onOpenWorkspace,
  onOpenTask,
  onMoveToBoard,
  onCreateNewTask,
}: DashboardViewProps) {
  const triageTasks = tasks.filter((t) => t.location === 'triage');
  const kanbanTasks = tasks.filter((t) => t.location === 'kanban');

  const countByColumn: Record<KanbanColumn, number> = {
    ready: kanbanTasks.filter((t) => t.kanbanColumn === 'ready').length,
    in_progress: kanbanTasks.filter((t) => t.kanbanColumn === 'in_progress').length,
    waiting_on: kanbanTasks.filter((t) => t.kanbanColumn === 'waiting_on').length,
    done: kanbanTasks.filter((t) => t.kanbanColumn === 'done').length,
  };

  const wipCount = countByColumn.in_progress;
  const wipLimit = 3;
  const isWipExceeded = wipCount > wipLimit;

  const doneCount = countByColumn.done;
  const boardCompletionPct =
    kanbanTasks.length > 0 ? Math.round((doneCount / kanbanTasks.length) * 100) : 0;

  const waitingTasks = kanbanTasks.filter((t) => t.kanbanColumn === 'waiting_on');
  const uniqueWaitingPeople = new Set(
    waitingTasks.map((t) => t.waitingOnPerson).filter(Boolean)
  ).size;

  const triageOutlookCount = triageTasks.filter((t) => t.source === 'outlook').length;
  const triageManualCount = triageTasks.length - triageOutlookCount;

  const activeNonDoneTasks = tasks.filter((t) => t.kanbanColumn !== 'done');
  const priorityOrder: TaskPriority[] = ['urgent', 'high', 'medium', 'low'];
  const priorityCounts = priorityOrder.map((p) => ({
    priority: p,
    count: activeNonDoneTasks.filter((t) => t.priority === p).length,
    meta: PRIORITY_CONFIG[p],
  }));

  const attentionTasks = activeNonDoneTasks
    .filter(
      (t) =>
        t.priority === 'urgent' ||
        t.priority === 'high' ||
        t.kanbanColumn === 'waiting_on' ||
        isDateOverdueOrToday(t.dueDate) === 'overdue' ||
        isDateOverdueOrToday(t.dueDate) === 'today'
    )
    .sort((a, b) => {
      const rankDiff = PRIORITY_CONFIG[b.priority].rank - PRIORITY_CONFIG[a.priority].rank;
      if (rankDiff !== 0) return rankDiff;
      return (a.dueDate || '9999-12-31').localeCompare(b.dueDate || '9999-12-31');
    })
    .slice(0, 6);

  const stageDistribution = [
    {
      label: 'Triage Inbox',
      count: triageTasks.length,
      color: 'bg-[#0078d4]',
      note: 'Awaiting review',
    },
    {
      label: 'Ready',
      count: countByColumn.ready,
      color: 'bg-[#565e74]',
      note: 'Committed',
    },
    {
      label: 'In Progress',
      count: countByColumn.in_progress,
      color: isWipExceeded ? 'bg-[#ba1a1a]' : 'bg-[#005faa]',
      note: isWipExceeded ? 'Over WIP limit' : 'Active focus',
    },
    {
      label: 'Waiting On',
      count: countByColumn.waiting_on,
      color: 'bg-[#bc5b00]',
      note: 'External reply',
    },
    {
      label: 'Done',
      count: countByColumn.done,
      color: 'bg-[#16a34a]',
      note: 'Completed',
    },
  ];

  const totalTasksCount = tasks.length || 1;
  const todayLabel = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  return (
    <main className="max-w-[1320px] mx-auto px-4 lg:px-8 py-6 space-y-6">
      {/* Top Executive Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-[#565e74] mb-1">
            {todayLabel} · Corporate Execution Overview
          </p>
          <h1 className="font-display text-[24px] sm:text-[28px] font-semibold tracking-tight text-[#0f172a] leading-tight">
            Workspace Dashboard
          </h1>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={onCreateNewTask}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-[#0f172a] bg-white border border-[#e2e8f0] hover:bg-[#f2f4f6] rounded-md transition-colors whitespace-nowrap cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Task</span>
          </button>

          <button
            type="button"
            onClick={onOpenRules}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-[#0f172a] bg-white border border-[#e2e8f0] hover:bg-[#f2f4f6] rounded-md transition-colors whitespace-nowrap cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Rules</span>
          </button>

          <button
            type="button"
            onClick={onOpenWorkspace}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-[#0f172a] hover:bg-[#1e293b] rounded-md transition-colors whitespace-nowrap cursor-pointer"
          >
            <span>Open Triage &amp; Board</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 4-Column KPI Row */}
      <section aria-label="Key Productivity Metrics" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#e2e8f0] rounded-lg p-4">
          <div className="flex items-center justify-between text-xs text-[#565e74] mb-2">
            <span className="font-medium">Triage Queue</span>
            <Inbox className="w-4 h-4 text-[#0078d4]" />
          </div>
          <div className="font-mono text-2xl font-semibold text-[#0f172a] tabular-nums">
            {triageTasks.length}
          </div>
          <p className="mt-1 text-xs text-[#565e74] tabular-nums">
            {triageOutlookCount} Outlook · {triageManualCount} manual
          </p>
        </div>

        <div className="bg-white border border-[#e2e8f0] rounded-lg p-4">
          <div className="flex items-center justify-between text-xs text-[#565e74] mb-2">
            <span className="font-medium">Active WIP Limit</span>
            {isWipExceeded ? (
              <AlertTriangle className="w-4 h-4 text-[#ba1a1a]" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-[#16a34a]" />
            )}
          </div>
          <div
            className={`font-mono text-2xl font-semibold tabular-nums ${
              isWipExceeded ? 'text-[#ba1a1a]' : 'text-[#0f172a]'
            }`}
          >
            {wipCount} / {wipLimit}
          </div>
          <p className={`mt-1 text-xs ${isWipExceeded ? 'text-[#ba1a1a] font-medium' : 'text-[#565e74]'}`}>
            {isWipExceeded ? 'Limit exceeded — finish active work' : 'Nominal execution load'}
          </p>
        </div>

        <div className="bg-white border border-[#e2e8f0] rounded-lg p-4">
          <div className="flex items-center justify-between text-xs text-[#565e74] mb-2">
            <span className="font-medium">Waiting On</span>
            <UserCheck className="w-4 h-4 text-[#974700]" />
          </div>
          <div className="font-mono text-2xl font-semibold text-[#0f172a] tabular-nums">
            {waitingTasks.length}
          </div>
          <p className="mt-1 text-xs text-[#565e74] tabular-nums">
            Across {uniqueWaitingPeople} external {uniqueWaitingPeople === 1 ? 'contact' : 'contacts'}
          </p>
        </div>

        <div className="bg-white border border-[#e2e8f0] rounded-lg p-4">
          <div className="flex items-center justify-between text-xs text-[#565e74] mb-2">
            <span className="font-medium">Board Completion</span>
            <CheckCircle2 className="w-4 h-4 text-[#16a34a]" />
          </div>
          <div className="font-mono text-2xl font-semibold text-[#0f172a] tabular-nums">
            {boardCompletionPct}%
          </div>
          <p className="mt-1 text-xs text-[#565e74] tabular-nums">
            {doneCount} of {kanbanTasks.length} board items done
          </p>
        </div>
      </section>

      {/* Pipeline & Outlook Rule Engine Digest */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left 7 Cols: Workflow Stage & Priority Breakdown */}
        <div className="lg:col-span-7 bg-white border border-[#e2e8f0] rounded-lg p-5 flex flex-col justify-between gap-5">
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <div>
                <h2 className="font-display text-base font-semibold text-[#0f172a]">
                  Execution Pipeline
                </h2>
                <p className="text-xs text-[#565e74]">
                  Distribution across Triage Inbox and all {KANBAN_COLUMNS.length} Kanban stages
                </p>
              </div>
              <span className="font-mono text-xs text-[#565e74] tabular-nums">
                {tasks.length} total tasks
              </span>
            </div>

            {/* Proportional Stacked Bar */}
            <div className="h-2.5 w-full bg-[#f2f4f6] rounded-full overflow-hidden flex mb-4">
              {stageDistribution.map((stage) => {
                const widthPct = (stage.count / totalTasksCount) * 100;
                if (widthPct === 0) return null;
                return (
                  <div
                    key={stage.label}
                    style={{ width: `${widthPct}%` }}
                    title={`${stage.label}: ${stage.count}`}
                    className={`${stage.color} h-full border-r border-white last:border-r-0`}
                  />
                );
              })}
            </div>

            {/* Clean Tabular Breakdown */}
            <div className="divide-y divide-[#f2f4f6] border-t border-[#f2f4f6]">
              {stageDistribution.map((stage) => (
                <button
                  key={stage.label}
                  type="button"
                  onClick={onOpenWorkspace}
                  className="w-full py-2.5 px-1 flex items-center justify-between text-left hover:bg-[#f7f9fb] transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <span className={`w-2 h-2 rounded-xs ${stage.color}`} />
                    <span className="text-xs font-medium text-[#0f172a]">{stage.label}</span>
                    <span className="text-xs text-[#717783]">· {stage.note}</span>
                  </div>
                  <div className="flex items-center gap-4 font-mono text-xs tabular-nums">
                    <span className="text-[#565e74]">
                      {Math.round((stage.count / totalTasksCount) * 100)}%
                    </span>
                    <span className="font-semibold text-[#0f172a] w-6 text-right">
                      {stage.count}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Priority Mix Bar */}
          <div className="pt-3 border-t border-[#e2e8f0]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-[#404752]">
                Active Workload by Priority
              </span>
              <span className="text-xs text-[#717783] tabular-nums">
                {activeNonDoneTasks.length} open items
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {priorityCounts.map((item) => (
                <div
                  key={item.priority}
                  className="bg-[#f7f9fb] border border-[#e2e8f0] rounded-md px-3 py-2"
                >
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className={`w-2 h-2 rounded-xs ${item.meta.dotClass}`} />
                    <span className={`font-medium ${item.meta.textClass}`}>
                      {item.meta.label}
                    </span>
                  </div>
                  <div className="mt-1 font-mono text-lg font-semibold text-[#0f172a] tabular-nums">
                    {item.count}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 5 Cols: Corporate Outlook Rule Engine Health */}
        <div className="lg:col-span-5 bg-white border border-[#e2e8f0] rounded-lg p-5 flex flex-col justify-between gap-4">
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <div>
                <h2 className="font-display text-base font-semibold text-[#0f172a]">
                  Outlook Rule Engine
                </h2>
                <p className="text-xs text-[#565e74]">
                  Deterministic noise filtering before triage
                </p>
              </div>
              <Mail className="w-4 h-4 text-[#0078d4]" />
            </div>

            {lastSyncReport ? (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2.5 text-center">
                  <div className="bg-[#f7f9fb] border border-[#e2e8f0] rounded-md p-2.5">
                    <div className="font-mono text-lg font-semibold text-[#0f172a] tabular-nums">
                      {lastSyncReport.totalScanned}
                    </div>
                    <div className="text-[11px] text-[#565e74]">Scanned</div>
                  </div>
                  <div className="bg-[#f7f9fb] border border-[#e2e8f0] rounded-md p-2.5">
                    <div className="font-mono text-lg font-semibold text-[#005faa] tabular-nums">
                      {lastSyncReport.addedCount}
                    </div>
                    <div className="text-[11px] text-[#565e74]">Added</div>
                  </div>
                  <div className="bg-[#f7f9fb] border border-[#e2e8f0] rounded-md p-2.5">
                    <div className="font-mono text-lg font-semibold text-[#404752] tabular-nums">
                      {lastSyncReport.filteredOutCount}
                    </div>
                    <div className="text-[11px] text-[#565e74]">Filtered</div>
                  </div>
                </div>

                <div className="text-xs text-[#404752] divide-y divide-[#f2f4f6] border-t border-[#f2f4f6]">
                  <div className="py-2 flex justify-between">
                    <span>Direct &ldquo;To:&rdquo; Enforcement</span>
                    <span className="font-medium text-[#0f172a]">
                      {rules.requireDirectTo ? 'Enabled (Ignore CC)' : 'Off'}
                    </span>
                  </div>
                  <div className="py-2 flex justify-between tabular-nums">
                    <span>VIP Senders Tracked</span>
                    <span className="font-mono font-medium text-[#0f172a]">
                      {rules.vipSenders.length}
                    </span>
                  </div>
                  <div className="py-2 flex justify-between tabular-nums">
                    <span>Action Trigger Keywords</span>
                    <span className="font-mono font-medium text-[#0f172a]">
                      {rules.includeKeywords.length}
                    </span>
                  </div>
                  <div className="py-2 flex justify-between tabular-nums">
                    <span>Noise Exclusions &amp; Dismissed</span>
                    <span className="font-mono font-medium text-[#0f172a]">
                      {rules.excludeKeywords.length} rules · {dismissedCount} dismissed
                    </span>
                  </div>
                  <div className="py-2 flex justify-between tabular-nums">
                    <span>Last Sync Completed</span>
                    <span className="font-mono text-[#565e74]">
                      {formatFullTimestamp(lastSyncReport.timestamp)}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-[#565e74]">
                No Outlook sync recorded yet. Run Sync Outlook to evaluate incoming mail.
              </p>
            )}
          </div>

          <div className="flex items-center gap-2.5 pt-2 border-t border-[#e2e8f0]">
            <button
              type="button"
              onClick={onSyncOutlook}
              disabled={isSyncing}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-white bg-[#0078d4] hover:bg-[#005faa] disabled:opacity-70 rounded-md transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Syncing...' : 'Sync Outlook Now'}</span>
            </button>
            <button
              type="button"
              onClick={onOpenRules}
              className="px-3 py-2 text-xs font-medium text-[#0f172a] bg-[#f2f4f6] hover:bg-[#e6e8ea] rounded-md transition-colors cursor-pointer"
            >
              Edit Rules
            </button>
          </div>
        </div>
      </section>

      {/* Bottom 2-Column Action Queues */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Triage Queue Preview */}
        <div className="bg-white border border-[#e2e8f0] rounded-lg overflow-hidden">
          <div className="px-5 py-3.5 border-b border-[#e2e8f0] flex items-center justify-between gap-2">
            <div>
              <h2 className="font-display text-sm font-semibold text-[#0f172a]">
                Triage Queue Ready for Promotion
              </h2>
              <p className="text-xs text-[#565e74]">
                Promote verified items directly into Ready on your Kanban board
              </p>
            </div>
            <span className="font-mono text-xs text-[#565e74] tabular-nums">
              {triageTasks.length} pending
            </span>
          </div>

          {triageTasks.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm font-medium text-[#0f172a] mb-1">All caught up</p>
              <p className="text-xs text-[#565e74] mb-3">
                Zero items waiting in Triage. Sync Outlook to pull new corporate messages.
              </p>
              <button
                type="button"
                onClick={onSyncOutlook}
                className="px-3 py-1.5 text-xs font-medium text-[#005faa] bg-[#d3e3ff]/50 hover:bg-[#d3e3ff] rounded-md transition-colors cursor-pointer"
              >
                Sync Outlook
              </button>
            </div>
          ) : (
            <div className="divide-y divide-[#f2f4f6]">
              {triageTasks.slice(0, 6).map((task) => {
                const priorityMeta = PRIORITY_CONFIG[task.priority];
                return (
                  <div
                    key={task.id}
                    onClick={() => onOpenTask(task)}
                    className="px-5 py-3 hover:bg-[#f7f9fb] transition-colors flex items-center justify-between gap-3 cursor-pointer"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 text-[11px] text-[#565e74] mb-0.5">
                        <span className={`font-medium ${priorityMeta.textClass}`}>
                          {priorityMeta.label}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="truncate">
                          {task.source === 'outlook'
                            ? task.outlookMetadata?.senderName || 'Outlook'
                            : 'Manual Capture'}
                        </span>
                        {task.dueDate && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="tabular-nums">
                              Due {formatShortDate(task.dueDate)}
                            </span>
                          </>
                        )}
                      </div>
                      <p className="text-xs font-medium text-[#0f172a] truncate">
                        {task.title}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onMoveToBoard(task.id);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-[#005faa] bg-[#f7f9fb] hover:bg-[#d3e3ff]/60 border border-[#e2e8f0] rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <span>Move to Board</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Deadlines & Blockers Tracker */}
        <div className="bg-white border border-[#e2e8f0] rounded-lg overflow-hidden">
          <div className="px-5 py-3.5 border-b border-[#e2e8f0] flex items-center justify-between gap-2">
            <div>
              <h2 className="font-display text-sm font-semibold text-[#0f172a]">
                Priority Deadlines &amp; Blockers
              </h2>
              <p className="text-xs text-[#565e74]">
                Urgent tasks, due dates, and external Waiting On follow-ups
              </p>
            </div>
            <span className="font-mono text-xs text-[#565e74] tabular-nums">
              {attentionTasks.length} flagged
            </span>
          </div>

          {attentionTasks.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm font-medium text-[#0f172a] mb-1">No active blockers</p>
              <p className="text-xs text-[#565e74]">
                High priority tasks and Waiting On dependencies will surface here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#f2f4f6]">
              {attentionTasks.map((task) => {
                const priorityMeta = PRIORITY_CONFIG[task.priority];
                const dateStatus = isDateOverdueOrToday(task.dueDate);
                const stageLabel =
                  task.location === 'triage'
                    ? 'Triage'
                    : KANBAN_COLUMNS.find((c) => c.id === task.kanbanColumn)?.label || 'Board';

                return (
                  <div
                    key={task.id}
                    onClick={() => onOpenTask(task)}
                    className="px-5 py-3 hover:bg-[#f7f9fb] transition-colors flex items-center justify-between gap-3 cursor-pointer"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 text-[11px] text-[#565e74] mb-0.5">
                        <span className={`font-medium ${priorityMeta.textClass}`}>
                          {priorityMeta.label}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{stageLabel}</span>
                        {task.waitingOnPerson && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="text-[#974700] font-medium truncate">
                              Waiting on {task.waitingOnPerson}
                            </span>
                          </>
                        )}
                      </div>
                      <p className="text-xs font-medium text-[#0f172a] truncate">
                        {task.title}
                      </p>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0 text-[11px] tabular-nums">
                      {task.dueDate && (
                        <span
                          className={`inline-flex items-center gap-1 ${
                            dateStatus === 'overdue'
                              ? 'text-[#ba1a1a] font-medium'
                              : dateStatus === 'today'
                              ? 'text-[#974700] font-medium'
                              : 'text-[#565e74]'
                          }`}
                        >
                          <Calendar className="w-3 h-3" />
                          {formatShortDate(task.dueDate)}
                        </span>
                      )}
                      {task.outlookMetadata?.webLink && (
                        <a
                          href={task.outlookMetadata.webLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          title="Open original email in Outlook"
                          className="p-1 text-[#005faa] hover:bg-[#d3e3ff]/40 rounded"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
