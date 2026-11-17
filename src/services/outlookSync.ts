import { SIMULATED_CORPORATE_INBOX } from '../data/mockInbox';
import { OutlookRules, SimulatedEmail, SyncReport, Task } from '../types/focusflow';

export interface RuleEvaluationResult {
  matched: boolean;
  matchedRule: string | null;
  filterReason: 'mutedSender' | 'noiseExcluded' | 'ccIgnored' | 'noRuleMatch' | null;
  filterDetail: string | null;
}

/**
 * Deterministic corporate rule engine.
 * Evaluates an email against muted senders, exclusion noise keywords,
 * direct "To:" requirement, VIP senders, and include action keywords.
 */
export function evaluateEmailAgainstRules(
  email: SimulatedEmail,
  rules: OutlookRules
): RuleEvaluationResult {
  const senderLower = email.senderEmail.trim().toLowerCase();
  const searchableText = `${email.subject} ${email.bodyPreview}`.toLowerCase();

  // 1. Check muted senders first
  const mutedMatch = rules.mutedSenders.find(
    (muted) => muted.trim().toLowerCase() === senderLower
  );
  if (mutedMatch) {
    return {
      matched: false,
      matchedRule: null,
      filterReason: 'mutedSender',
      filterDetail: `Muted sender (${mutedMatch})`,
    };
  }

  // 2. Check exclusion / noise keywords
  const excludedKeyword = rules.excludeKeywords.find((kw) => {
    const clean = kw.trim().toLowerCase();
    return clean.length > 0 && searchableText.includes(clean);
  });
  if (excludedKeyword) {
    return {
      matched: false,
      matchedRule: null,
      filterReason: 'noiseExcluded',
      filterDetail: `Noise keyword: "${excludedKeyword}"`,
    };
  }

  // 3. Check direct addressing requirement (Ignore CC-only threads)
  if (rules.requireDirectTo && email.recipientType === 'cc') {
    return {
      matched: false,
      matchedRule: null,
      filterReason: 'ccIgnored',
      filterDetail: 'CC-only thread (Direct "To" required)',
    };
  }

  // 4. Match VIP Senders and/or Action Keywords
  const isVip = rules.vipSenders.some(
    (vip) => vip.trim().toLowerCase() === senderLower
  );

  const matchedKeyword = rules.includeKeywords.find((kw) => {
    const clean = kw.trim().toLowerCase();
    return clean.length > 0 && searchableText.includes(clean);
  });

  if (isVip && matchedKeyword) {
    return {
      matched: true,
      matchedRule: `VIP Sender · Keyword: ${capitalizePhrase(matchedKeyword)}`,
      filterReason: null,
      filterDetail: null,
    };
  }

  if (isVip) {
    return {
      matched: true,
      matchedRule: 'VIP Sender',
      filterReason: null,
      filterDetail: null,
    };
  }

  if (matchedKeyword) {
    return {
      matched: true,
      matchedRule: `Keyword: ${capitalizePhrase(matchedKeyword)}`,
      filterReason: null,
      filterDetail: null,
    };
  }

  return {
    matched: false,
    matchedRule: null,
    filterReason: 'noRuleMatch',
    filterDetail: 'No VIP or action keyword match',
  };
}

function capitalizePhrase(value: string): string {
  return value
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function cleanSubjectToTitle(subject: string): string {
  return subject.replace(/^(fw:|fwd:|re:)\s*/i, '').trim();
}

export interface FetchSyncOutcome {
  newTasks: Task[];
  report: SyncReport;
}

/**
 * Modular Outlook Email Ingestion Service.
 *
 * -------------------------------------------------------------------------
 * LIVE CORPORATE API INTEGRATION HOOKS:
 *
 * Option 1: Microsoft Graph API (Delegated Auth via MSAL.js)
 * Replace `rawEmails` below with:
 *   const res = await fetch(
 *     'https://graph.microsoft.com/v1.0/me/messages?$filter=isRead eq false&$top=25&$select=id,subject,bodyPreview,receivedDateTime,from,toRecipients,ccRecipients,webLink',
 *     { headers: { Authorization: `Bearer ${graphAccessToken}` } }
 *   );
 *   const data = await res.json();
 *   const rawEmails = mapGraphMessagesToSimulatedEmails(data.value, currentUserEmail);
 *
 * Option 2: Power Automate JSON Webhook Bridge (No Admin Consent Required)
 * Replace `rawEmails` with a fetch to your local/private webhook cache endpoint:
 *   const res = await fetch('/api/outlook-webhook/pending');
 *   const rawEmails = await res.json();
 * -------------------------------------------------------------------------
 */
export async function fetchAndFilterOutlookEmails(
  rules: OutlookRules,
  existingMessageIds: Set<string>,
  dismissedMessageIds: Set<string>
): Promise<FetchSyncOutcome> {
  // Subtle realistic async delay so UI feedback feels crisp and intentional
  await new Promise((resolve) => setTimeout(resolve, 350));

  const rawEmails: SimulatedEmail[] = SIMULATED_CORPORATE_INBOX;
  const nowIso = new Date().toISOString();

  const newTasks: Task[] = [];
  let filteredOutCount = 0;
  let skippedCount = 0;

  const filterBreakdown = {
    noiseExcluded: 0,
    ccIgnored: 0,
    mutedSender: 0,
    noRuleMatch: 0,
  };

  for (const email of rawEmails) {
    const evaluation = evaluateEmailAgainstRules(email, rules);

    if (!evaluation.matched) {
      filteredOutCount += 1;
      if (evaluation.filterReason) {
        filterBreakdown[evaluation.filterReason] += 1;
      }
      continue;
    }

    // Never re-import already active or previously dismissed Outlook items
    if (
      existingMessageIds.has(email.messageId) ||
      dismissedMessageIds.has(email.messageId)
    ) {
      skippedCount += 1;
      continue;
    }

    const task: Task = {
      id: `task-outlook-${email.messageId}-${Date.now().toString(36)}`,
      title: cleanSubjectToTitle(email.subject),
      description: email.bodyPreview,
      source: 'outlook',
      location: 'triage',
      kanbanColumn: null,
      priority: email.suggestedPriority,
      dueDate: email.suggestedDueDate,
      tags: email.suggestedTags,
      waitingOnPerson: null,
      subtasks: [],
      outlookMetadata: {
        messageId: email.messageId,
        senderName: email.senderName,
        senderEmail: email.senderEmail,
        originalSubject: email.subject,
        snippet: email.bodyPreview,
        receivedAt: email.receivedAt,
        webLink: email.webLink,
        matchedRule: evaluation.matchedRule || 'Rule Match',
        recipientType: email.recipientType,
      },
      order: newTasks.length,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    newTasks.push(task);
  }

  const report: SyncReport = {
    timestamp: nowIso,
    totalScanned: rawEmails.length,
    addedCount: newTasks.length,
    filteredOutCount,
    skippedCount,
    addedTitles: newTasks.map((t) => t.title),
    filterBreakdown,
  };

  return { newTasks, report };
}

export interface RulePreviewItem {
  email: SimulatedEmail;
  evaluation: RuleEvaluationResult;
}

/**
 * Evaluates all 12 simulated inbox emails against a draft rule set
 * for live preview inside the Outlook Rules Modal.
 */
export function previewRuleMatches(rules: OutlookRules): {
  matchedCount: number;
  filteredCount: number;
  items: RulePreviewItem[];
} {
  const items = SIMULATED_CORPORATE_INBOX.map((email) => ({
    email,
    evaluation: evaluateEmailAgainstRules(email, rules),
  }));

  const matchedCount = items.filter((item) => item.evaluation.matched).length;
  const filteredCount = items.length - matchedCount;

  return { matchedCount, filteredCount, items };
}
