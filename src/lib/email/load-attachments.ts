import { createServiceClient, isDatabaseConfigured, useMemoryStore } from "../supabase/server";
import {
  assertAttachableFile,
  assertAttachmentLimit,
  guessContentType,
  newAttachmentId,
  sanitizeFilename,
  type EmailAttachment,
} from "../templates/attachments";

const BUCKET = "template-attachments";
const memoryFiles = new Map<string, Buffer>();

export async function storeEmailAttachment(opts: {
  scope: "templates" | "reviews";
  ownerId: string;
  file: File;
  existingCount: number;
}): Promise<EmailAttachment> {
  assertAttachmentLimit(opts.existingCount);
  assertAttachableFile({
    name: opts.file.name,
    type: opts.file.type,
    size: opts.file.size,
  });

  const filename = sanitizeFilename(opts.file.name);
  const contentType = opts.file.type || guessContentType(filename);
  const bytes = Buffer.from(await opts.file.arrayBuffer());
  const id = newAttachmentId();
  const storagePath = `${opts.scope}/${opts.ownerId}/${id}-${filename}`;

  if (!useMemoryStore() && isDatabaseConfigured()) {
    const supabase = createServiceClient();
    if (supabase) {
      const { error } = await supabase.storage.from(BUCKET).upload(storagePath, bytes, {
        contentType,
        upsert: false,
      });
      if (error) throw new Error(error.message);
      return {
        id,
        filename,
        storage_path: storagePath,
        content_type: contentType,
        size: bytes.length,
        added_at: new Date().toISOString(),
      };
    }
  }

  memoryFiles.set(storagePath, bytes);
  return {
    id,
    filename,
    storage_path: storagePath,
    content_type: contentType,
    size: bytes.length,
    added_at: new Date().toISOString(),
    content_base64: bytes.toString("base64"),
  };
}

export async function deleteStoredAttachment(storagePath: string): Promise<void> {
  memoryFiles.delete(storagePath);
  if (useMemoryStore() || !isDatabaseConfigured()) return;
  const supabase = createServiceClient();
  if (!supabase) return;
  await supabase.storage.from(BUCKET).remove([storagePath]);
}

export async function loadAttachmentContents(
  attachments: EmailAttachment[]
): Promise<Array<{ filename: string; content: Buffer; contentType: string }>> {
  const files: Array<{ filename: string; content: Buffer; contentType: string }> = [];

  for (const attachment of attachments) {
    if (attachment.content_base64) {
      files.push({
        filename: attachment.filename,
        content: Buffer.from(attachment.content_base64, "base64"),
        contentType: attachment.content_type,
      });
      continue;
    }

    const memory = memoryFiles.get(attachment.storage_path);
    if (memory) {
      files.push({
        filename: attachment.filename,
        content: memory,
        contentType: attachment.content_type,
      });
      continue;
    }

    if (useMemoryStore() || !isDatabaseConfigured()) continue;
    const supabase = createServiceClient();
    if (!supabase) continue;
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .download(attachment.storage_path);
    if (error || !data) continue;
    files.push({
      filename: attachment.filename,
      content: Buffer.from(await data.arrayBuffer()),
      contentType: attachment.content_type,
    });
  }

  return files;
}
