import { Check, ChevronDown, ChevronUp, Plus, RotateCcw, ShieldAlert, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { DEFAULT_OUTLOOK_RULES } from '../data/mockInbox';
import { previewRuleMatches } from '../services/outlookSync';
import { OutlookRules } from '../types/focusflow';

interface OutlookRulesModalProps {
  rules: OutlookRules;
  onClose: () => void;
  onSave: (newRules: OutlookRules, triggerSync: boolean) => void;
  onResetWorkspace: () => void;
}

interface TagListEditorProps {
  label: string;
  helper: string;
  items: string[];
  placeholder: string;
  onChange: (items: string[]) => void;
}

function TagListEditor({ label, helper, items, placeholder, onChange }: TagListEditorProps) {
  const [inputValue, setInputValue] = useState('');

  const addItem = () => {
    const clean = inputValue.trim().toLowerCase();
    if (clean && !items.some((i) => i.toLowerCase() === clean)) {
      onChange([...items, clean]);
    }
    setInputValue('');
  };

  return (
    <div>
      <label className="block text-xs font-semibold text-[#0f172a] mb-0.5">{label}</label>
      <p className="text-[11px] text-[#565e74] mb-2">{helper}</p>
      <div className="flex items-center gap-2 mb-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addItem();
            }
          }}
          placeholder={placeholder}
          className="flex-1 h-8 px-3 text-xs text-[#0f172a] bg-[#f7f9fb] border border-[#e2e8f0] rounded-md focus:outline-none focus:bg-white focus:border-[#0078d4]"
        />
        <button
          type="button"
          onClick={addItem}
          className="inline-flex items-center gap-1 h-8 px-3 text-xs font-medium text-[#0f172a] bg-[#f2f4f6] hover:bg-[#e6e8ea] rounded-md cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add</span>
        </button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item) => (
          <span
            key={item}
            className="inline-flex items-center gap-1 px-2 py-0.5 text-xs text-[#191c1e] bg-[#f2f4f6] border border-[#e2e8f0] rounded"
          >
            <span>{item}</span>
            <button
              type="button"
              onClick={() => onChange(items.filter((i) => i !== item))}
              aria-label={`Remove ${item}`}
              className="text-[#717783] hover:text-[#ba1a1a] cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}

export function OutlookRulesModal({
  rules,
  onClose,
  onSave,
  onResetWorkspace,
}: OutlookRulesModalProps) {
  const [draft, setDraft] = useState<OutlookRules>(rules);
  const [showSimulatorPreview, setShowSimulatorPreview] = useState(false);

  const preview = useMemo(() => previewRuleMatches(draft), [draft]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="rules-modal-title"
      onClick={onClose}
      className="fixed inset-0 z-50 bg-[#0f172a]/40 backdrop-blur-[1px] flex items-center justify-center p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl bg-white border border-[#e2e8f0] rounded-xl shadow-lg max-h-[90vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#e2e8f0] flex items-center justify-between gap-4">
          <div>
            <h2 id="rules-modal-title" className="font-display text-base font-semibold text-[#0f172a]">
              Corporate Outlook Rules
            </h2>
            <p className="text-xs text-[#565e74]">
              Deterministic filters applied before emails reach your Triage To-Do list
            </p>
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

        {/* Body */}
        <div className="flex-1 overflow-y-auto thin-scrollbar p-6 space-y-5">
          {/* Direct To Toggle */}
          <label className="flex items-start justify-between gap-4 p-3.5 bg-[#f7f9fb] border border-[#e2e8f0] rounded-lg cursor-pointer">
            <div>
              <div className="text-xs font-semibold text-[#0f172a]">
                Only import emails where I am in the &ldquo;To&rdquo; field (Ignore CC-only)
              </div>
              <p className="text-[11px] text-[#565e74] mt-0.5">
                Automatically skips broad group threads and FYI discussions where you are only CC&rsquo;d.
              </p>
            </div>
            <input
              type="checkbox"
              checked={draft.requireDirectTo}
              onChange={(e) =>
                setDraft({ ...draft, requireDirectTo: e.target.checked })
              }
              className="mt-0.5 h-4 w-4 accent-[#0078d4] cursor-pointer"
            />
          </label>

          <TagListEditor
            label="VIP Senders"
            helper="Emails from these stakeholders are always prioritized for triage unless explicitly excluded."
            items={draft.vipSenders}
            placeholder="e.g., vp.eng@corp.com"
            onChange={(vipSenders) => setDraft({ ...draft, vipSenders })}
          />

          <TagListEditor
            label="Include Action Keywords"
            helper="Import emails whose subject or preview snippet contains any of these triggers."
            items={draft.includeKeywords}
            placeholder="e.g., signoff, blocker, deadline"
            onChange={(includeKeywords) => setDraft({ ...draft, includeKeywords })}
          />

          <TagListEditor
            label="Exclude Noise Keywords"
            helper="Automatically drop out-of-office replies, newsletters, digests, and calendar responses."
            items={draft.excludeKeywords}
            placeholder="e.g., out of office, digest"
            onChange={(excludeKeywords) => setDraft({ ...draft, excludeKeywords })}
          />

          <TagListEditor
            label="Muted Senders"
            helper="Always block automated bots or notification aliases even if they contain action words."
            items={draft.mutedSenders}
            placeholder="e.g., noreply@automated-tool.com"
            onChange={(mutedSenders) => setDraft({ ...draft, mutedSenders })}
          />

          {/* Live Simulator Rule Preview */}
          <div className="border border-[#e2e8f0] rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => setShowSimulatorPreview((v) => !v)}
              className="w-full px-4 py-3 bg-[#f7f9fb] flex items-center justify-between text-left hover:bg-[#f2f4f6] transition-colors cursor-pointer"
            >
              <div>
                <div className="text-xs font-semibold text-[#0f172a]">
                  Live Corporate Inbox Preview (12 simulated emails)
                </div>
                <p className="text-[11px] text-[#565e74] tabular-nums">
                  <span className="text-[#005faa] font-medium">
                    {preview.matchedCount} matched for Triage
                  </span>
                  {' · '}
                  <span>{preview.filteredCount} filtered out as noise</span>
                </p>
              </div>
              {showSimulatorPreview ? (
                <ChevronUp className="w-4 h-4 text-[#565e74]" />
              ) : (
                <ChevronDown className="w-4 h-4 text-[#565e74]" />
              )}
            </button>

            {showSimulatorPreview && (
              <div className="divide-y divide-[#f2f4f6] max-h-60 overflow-y-auto thin-scrollbar">
                {preview.items.map(({ email, evaluation }) => (
                  <div
                    key={email.messageId}
                    className="px-4 py-2.5 flex items-start justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-[#0f172a] truncate">{email.subject}</p>
                      <p className="text-[11px] text-[#565e74] truncate">
                        {email.senderEmail} · {email.recipientType.toUpperCase()}
                      </p>
                    </div>
                    {evaluation.matched ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#16a34a] shrink-0">
                        <Check className="w-3 h-3" />
                        {evaluation.matchedRule}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] text-[#717783] shrink-0">
                        <ShieldAlert className="w-3 h-3" />
                        {evaluation.filterDetail}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-[#e2e8f0] bg-[#f7f9fb] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setDraft(DEFAULT_OUTLOOK_RULES)}
              className="inline-flex items-center gap-1 text-xs font-medium text-[#565e74] hover:text-[#0f172a] cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Rules</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onResetWorkspace();
                onClose();
              }}
              className="text-xs font-medium text-[#ba1a1a] hover:underline cursor-pointer"
            >
              Reset Demo Workspace
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onSave(draft, false)}
              className="px-3.5 py-2 text-xs font-medium text-[#0f172a] bg-white border border-[#e2e8f0] hover:bg-[#f2f4f6] rounded-md transition-colors cursor-pointer"
            >
              Save Rules
            </button>
            <button
              type="button"
              onClick={() => onSave(draft, true)}
              className="px-4 py-2 text-xs font-medium text-white bg-[#0078d4] hover:bg-[#005faa] rounded-md transition-colors cursor-pointer"
            >
              Save &amp; Sync Outlook
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
