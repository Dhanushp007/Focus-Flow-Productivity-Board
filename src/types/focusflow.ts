export type TaskSource = 'outlook' | 'manual';
export type TaskLocation = 'triage' | 'kanban';
export type KanbanColumn = 'ready' | 'in_progress' | 'waiting_on' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type FilterMode = 'all' | 'outlook' | 'manual' | 'high_urgent';
export type AppView = 'workspace' | 'dashboard';

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface OutlookMetadata {
  messageId: string;
  senderName: string;
  senderEmail: string;
  originalSubject: string;
  snippet: string;
  receivedAt: string;
  webLink: string;
  matchedRule: string;
  recipientType: 'to' | 'cc';
}

export interface Task {
  id: string;
  title: string;
  description: string;
  source: TaskSource;
  location: TaskLocation;
  kanbanColumn: KanbanColumn | null;
  priority: TaskPriority;
  dueDate: string | null;
  tags: string[];
  waitingOnPerson: string | null;
  subtasks: Subtask[];
  outlookMetadata: OutlookMetadata | null;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface OutlookRules {
  requireDirectTo: boolean;
  vipSenders: string[];
  includeKeywords: string[];
  excludeKeywords: string[];
  mutedSenders: string[];
}

export interface SimulatedEmail {
  messageId: string;
  senderName: string;
  senderEmail: string;
  subject: string;
  bodyPreview: string;
  receivedAt: string;
  recipientType: 'to' | 'cc';
  webLink: string;
  suggestedPriority: TaskPriority;
  suggestedTags: string[];
  suggestedDueDate: string | null;
}

export interface SyncReport {
  timestamp: string;
  totalScanned: number;
  addedCount: number;
  filteredOutCount: number;
  skippedCount: number;
  addedTitles: string[];
  filterBreakdown: {
    noiseExcluded: number;
    ccIgnored: number;
    mutedSender: number;
    noRuleMatch: number;
  };
}
