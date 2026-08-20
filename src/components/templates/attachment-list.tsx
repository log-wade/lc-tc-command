"use client";

import { Paperclip, Trash2 } from "lucide-react";
import type { EmailAttachment } from "@/lib/templates/attachments";
import { Button } from "@/components/ui/button";

export function AttachmentList({
  attachments,
  locked = false,
  lockedHint,
  disabled,
  onRemove,
}: {
  attachments: EmailAttachment[];
  locked?: boolean;
  lockedHint?: string;
  disabled?: boolean;
  onRemove?: (attachmentId: string) => void;
}) {
  if (attachments.length === 0) {
    return null;
  }

  return (
    <ul className="space-y-2">
      {attachments.map((attachment) => (
        <li
          key={attachment.id}
          className="flex items-center justify-between gap-3 rounded-xl border border-border bg-white px-3 py-2"
        >
          <div className="min-w-0">
            <p className="flex items-center gap-2 truncate text-sm text-ink">
              <Paperclip className="h-3.5 w-3.5 shrink-0 text-brand-coral" />
              {attachment.filename}
            </p>
            <p className="mt-0.5 text-[11px] text-ink-muted">
              {formatBytes(attachment.size)}
              {locked && lockedHint ? ` · ${lockedHint}` : ""}
            </p>
          </div>
          {!locked && onRemove && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={disabled}
              onClick={() => onRemove(attachment.id)}
              aria-label={`Remove ${attachment.filename}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </li>
      ))}
    </ul>
  );
}

export function AttachmentPicker({
  disabled,
  onFile,
}: {
  disabled?: boolean;
  onFile: (file: File) => void;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-ink-muted">Add file</span>
      <input
        type="file"
        className="mt-1 block w-full text-xs text-ink file:mr-3 file:rounded-lg file:border file:border-border file:bg-brand-bg file:px-3 file:py-1.5 file:text-xs file:font-medium"
        disabled={disabled}
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) onFile(file);
        }}
      />
    </label>
  );
}

function formatBytes(size: number): string {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}
