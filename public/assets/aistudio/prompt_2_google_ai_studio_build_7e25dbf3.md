Build a fully functional, interactive single-page web application based on the attached Stitch UI design for **FocusFlow** (Corporate Outlook Triage & Kanban Board). Implement complete client-side state management with `localStorage` persistence so all tasks, edits, column moves, and Outlook rules persist across reloads.

**Core Functional Requirements to Implement:**

1. **Two-Stage Task Architecture (`Triage To-Do` vs. `Kanban Board`):**
   * Maintain a unified task state where each task has `location: 'triage' | 'kanban'` and `kanbanColumn: 'ready' | 'in_progress' | 'waiting_on' | 'done'`.
   * **To-Do Triage Panel (Left):**
     * Users can type into the quick-add bar and press `Enter` to add a new manual item to the To-Do list.
     * Users can click any task title in the To-Do list to edit it inline, or click the card to open a full **Task Detail & Edit Modal** (to edit title, description, priority, due date, tags, or "Waiting On" person).
     * Clicking **"Move to Board →"** smoothly transitions the item from the To-Do list into the Kanban board's **Ready** column.
     * Clicking **"Dismiss" (`×`)** removes the item from the To-Do list and stores its `message_id` in a `dismissedEmailIds` list so it never re-appears on future Outlook syncs.

2. **Interactive Kanban Board (Right):**
   * Support **Drag-and-Drop** (using native HTML5 drag-and-drop or clean pointer events) to:
     * Reorder and move cards between `Ready`, `In Progress`, `Waiting On`, and `Done`.
     * Drag a card directly from the Left To-Do Triage list and drop it into any Kanban column.
   * **Direct Creation:** Clicking `+` or `"+ Add task"` in any Kanban column opens an inline input or creation modal that creates the card directly in that specific column.
   * **WIP Limit Indicator:** Display a live counter `X / 3` on the **In Progress** column; highlight the badge in red if tasks exceed 3.
   * **Task Detail Modal:** Clicking any Kanban card opens a clean modal allowing the user to edit all fields, view the original Outlook email metadata (Sender, Original Subject, Received Time, and a clickable `"Open in Outlook"` link), move columns, or delete the task.

3. **Corporate Outlook Rule Engine & Sync Simulator (Plus Real API Ready):**
   * Create an **"Outlook Rules" Modal** accessible from the top header where the user can configure:
     * Toggle: `Only import emails where I am in the "To" field (Ignore CC-only)`
     * Tag input list for **VIP Senders** (e.g., `manager@corp.com`, `director@corp.com`)
     * Tag input list for **Include Action Keywords** (e.g., `action required`, `review`, `approval`, `urgent`, `deadline`)
     * Tag input list for **Exclude Noise Keywords** (e.g., `out of office`, `newsletter`, `digest`, `accepted:`)
   * Structure the email ingestion service cleanly (`fetchAndFilterOutlookEmails()`) with:
     * **Built-in Corporate Inbox Simulator:** Include a realistic mock corporate inbox dataset (12 diverse emails including manager requests, CC-only threads, newsletters, OOO replies, and spec reviews) so clicking **"Sync Outlook"** runs the live rule engine against those emails, filters out noise/CCs based on the user's active rules, skips already-imported or dismissed IDs, and reports newly matched actionable emails into the To-Do Triage list with a toast notification (e.g., *"Synced: 3 important emails added to Triage, 6 filtered out"*).
     * **Modular Graph API / Webhook Hook:** Keep the ingestion function cleanly separated with comments showing where to plug in a Microsoft Graph `/me/messages` fetch token or a Power Automate JSON webhook endpoint for live corporate Outlook connection.

4. **Search & Filtering:**
   * Make the top search bar and filter pills (`All`, `Outlook Only`, `Manual Only`, `High/Urgent`) filter both the To-Do Triage list and the Kanban board in real time.