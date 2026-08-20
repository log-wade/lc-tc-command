export type EmailAttachment = {
  id: string;
  filename: string;
  storage_path: string;
  content_type: string;
  size: number;
  added_at: string;
  /** Demo/memory only — never written to Postgres. */
  content_base64?: string;
};

const MAX_ATTACHMENT_BYTES = 8 * 1024 * 1024;
const MAX_ATTACHMENTS = 10;

const ALLOWED_CONTENT_TYPES = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/zip",
]);

export function parseEmailAttachments(raw: unknown): EmailAttachment[] {
  if (!Array.isArray(raw)) return [];
  const parsed: EmailAttachment[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const id = String(row.id ?? "");
    const filename = String(row.filename ?? "");
    const storagePath = String(row.storage_path ?? "");
    const contentType = String(row.content_type ?? "application/octet-stream");
    const size = Number(row.size);
    const addedAt = String(row.added_at ?? "");
    if (!id || !filename || !storagePath) continue;
    parsed.push({
      id,
      filename,
      storage_path: storagePath,
      content_type: contentType,
      size: Number.isFinite(size) ? size : 0,
      added_at: addedAt || new Date().toISOString(),
      ...(typeof row.content_base64 === "string"
        ? { content_base64: row.content_base64 }
        : {}),
    });
  }
  return parsed;
}

export function publicAttachment(attachment: EmailAttachment): EmailAttachment {
  const { content_base64: _omit, ...rest } = attachment;
  void _omit;
  return rest;
}

export function mergeEmailAttachments(
  templateAttachments: EmailAttachment[],
  reviewAttachments: EmailAttachment[]
): EmailAttachment[] {
  const byId = new Map<string, EmailAttachment>();
  for (const attachment of [...templateAttachments, ...reviewAttachments]) {
    byId.set(attachment.id, attachment);
  }
  return [...byId.values()];
}

export function assertAttachableFile(file: {
  name: string;
  type: string;
  size: number;
}): void {
  if (file.size <= 0) throw new Error("The file is empty");
  if (file.size > MAX_ATTACHMENT_BYTES) {
    throw new Error("Attachments must be 8 MB or smaller");
  }
  const contentType = file.type || guessContentType(file.name);
  if (!ALLOWED_CONTENT_TYPES.has(contentType)) {
    throw new Error(`File type ${contentType || "unknown"} is not allowed`);
  }
}

export function assertAttachmentLimit(count: number): void {
  if (count >= MAX_ATTACHMENTS) {
    throw new Error(`A template can have at most ${MAX_ATTACHMENTS} attachments`);
  }
}

export function sanitizeFilename(name: string): string {
  const base = name.split(/[/\\]/).pop()?.trim() || "attachment";
  return base.replace(/[^\w.\- ()]/g, "_").slice(0, 180);
}

export function guessContentType(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "pdf":
      return "application/pdf";
    case "png":
      return "image/png";
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "webp":
      return "image/webp";
    case "txt":
      return "text/plain";
    case "doc":
      return "application/msword";
    case "docx":
      return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    case "xlsx":
      return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    case "zip":
      return "application/zip";
    default:
      return "application/octet-stream";
  }
}

export function newAttachmentId(): string {
  return crypto.randomUUID();
}
