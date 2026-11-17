# Product Specification: FocusFlow (Corporate Outlook Triage & Kanban Board)

## 1. Product Overview

**FocusFlow** is a human-in-the-loop (HITL) personal productivity workspace designed for professionals managing daily engineering, operational, or corporate communication workloads. It bridges the gap between incoming corporate Outlook emails and active execution by providing a clean **Triage To-Do Inbox** alongside a **Kanban Execution Board**.

### Core Philosophy

* **Zero-Noise Execution:** Incoming emails do not clutter the active Kanban board automatically. They land in a staging To-Do list first.

* **Corporate-Friendly Integration:** Uses deterministic, rule-based filtering (no heavy AI dependencies required initially) and safe ingestion methods compatible with locked-down corporate Microsoft 365 / Outlook environments.

* **Full Manual Control:** Users can freely create, edit, prioritize, and organize tasks directly in either the To-Do Triage list or the Kanban Board.

## 2. User Workflows

### Workflow A: Automated Outlook Ingestion (Rule-Based)

1. **Sync / Poll:** The system fetches unread or newly received emails from Outlook (via Microsoft Graph API delegated permissions, Power Automate webhook bridge, or local Outlook desktop bridge).

2. **Basic Rule Engine:** Incoming emails pass through user-configured deterministic rules before hitting the To-Do list:

   * **Rule 1 (Direct Addressing):** User is in the `To:` field (not just `CC:` or a broad distribution list).

   * **Rule 2 (VIP Senders):** Email is from designated key stakeholders (e.g., Manager, Tech Lead, Product Owner).

   * **Rule 3 (Action Keywords):** Subject or first 200 characters contain action triggers (`"Action Required"`, `"Review"`, `"Urgent"`, `"Approval"`, `"Deadline"`, `"EOD"`, `"Follow up"`).

   * **Rule 4 (Exclusion / Noise Filter):** Auto-ignore emails matching muted keywords (`"Out of Office"`, `"Automatic reply"`, `"Newsletter"`, `"Digest"`, `"Accepted:"`, `"Declined:"`) or blocked senders.

3. **Staging:** Matching emails appear as actionable cards in the **To-Do Triage List** with sender info, subject, snippet, timestamp, and a direct deep-link to open the email in Outlook Web/Desktop.

### Workflow B: Triage & Promotion (To-Do → Kanban)

1. User reviews items in the **To-Do Triage List**.

2. For each item, the user can:

   * **Edit Inline:** Rewrite the email subject into a clear action item, add notes, set a due date, or assign a priority (`Low`, `Medium`, `High`, `Urgent`).

   * **Promote to Kanban:** Click **"Move to Board"** (or drag-and-drop) to send the item into the Kanban board's `Ready / To Do` column.

   * **Dismiss / Archive:** Remove irrelevant items with one click (soft-deleted or archived so they don't re-import on the next sync).

### Workflow C: Manual Task Management

* **Add to To-Do:** Quick-capture bar at the top of the To-Do list for fast brain-dumps (e.g., from a Teams ping or standup).

* **Direct Kanban Creation:** `+ Add Task` button at the top of any Kanban column to create work items that did not originate from email.

* **Full Editing:** Clicking any task in either view opens a detail drawer/modal to edit title, description, tags, priority, due date, and subtasks.

### Workflow D: Kanban Execution & Closure

* **Columns:**

  1. `Ready` (Triaged & committed)

  2. `In Progress` (Active work — visual warning if count > 3 WIP limit)

  3. `Waiting On` (Blocked by external team/reply; includes optional "Waiting on [Person]" badge)

  4. `Done` (Completed work; option to archive/clear completed tasks)

## 3. Data Model (JSON / SQLite Schema)

### `tasks` Table / State Object

```json
{
  "id": "uuid-v4",
  "title": "Review updated API requirement spec v2.4",
  "description": "Check section 3 for auth payload changes.",
  "source": "outlook | manual",
  "location": "triage | kanban",
  "kanban_column": "ready | in_progress | waiting_on | done | null",
  "priority": "low | medium | high | urgent",
  "due_date": "2026-11-18",
  "tags": ["Spec Review", "Backend"],
  "waiting_on_person": "Sarah Jenkins",
  "outlook_metadata": {
    "message_id": "AAMkAGI2...",
    "sender_name": "Sarah Jenkins",
    "sender_email": "sarah.j@corp.com",
    "original_subject": "FW: Updated API Spec v2.4 - Need signoff",
    "received_at": "2026-11-16T09:30:00Z",
    "web_link": "https://outlook.office.com/mail/id/...",
    "matched_rule": "VIP Sender + Keyword: Review"
  },
  "is_dismissed": false,
  "created_at": "2026-11-16T09:31:00Z",
  "updated_at": "2026-11-16T10:15:00Z"
}
```

### `outlook_rules` Configuration Object

```json
{
  "require_direct_to": true,
  "vip_senders": ["manager@corp.com", "lead@corp.com"],
  "include_keywords": ["action required", "review", "urgent", "signoff", "approval"],
  "exclude_keywords": ["out of office", "newsletter", "digest", "accepted:", "declined:"],
  "muted_senders": ["noreply@automated-tool.com"]
}
```

## 4. UI / UX Architecture

* **Layout:** Clean, modern productivity aesthetic (Linear / Todoist / Notion inspired). Light mode default with high-contrast subtle borders (`#E5E7EB`) and slate backgrounds (`#F8FAFC`).

* **Top Header Bar:**

  * App Title & Workspace Indicator

  * Search & Filter bar (Filter by Priority, Source: Outlook vs. Manual)

  * **"Sync Outlook"** button (with last-synced timestamp + badge showing new items)

  * **"Outlook Rules"** settings button (opens modal to manage VIP emails & keywords)

* **Split Workspace:**

  * **Left Panel (30% width, collapsible): To-Do Triage Inbox**

    * Quick-add input field (`+ Add to-do item...`)

    * List of incoming Outlook items & manual to-dos

    * Each card shows: Source icon (Outlook blue envelope vs. manual bullet), matched rule badge, editable title, sender, due date, and two crisp action buttons: **Arrow Right (`Move to Board`)** and **Trash/X (`Dismiss`)**.

  * **Right Panel (70% width): Kanban Board**

    * 4 Columns (`Ready`, `In Progress [WIP: 3]`, `Waiting On`, `Done`)

    * `+ Add Card` button in each column header

    * Drag-and-drop across columns (and drag from Left To-Do panel directly into any Kanban column)

    * Card detail modal/drawer on click for editing notes, subtasks, and viewing original Outlook snippet/link.