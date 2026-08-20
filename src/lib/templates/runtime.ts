import { createServiceClient, isDatabaseConfigured, useMemoryStore } from "../supabase/server";
import {
  EMAIL_TEMPLATES,
  getTemplateById,
  resolveTemplateId,
  type EmailTemplate,
} from "./catalog";
import {
  parseEmailAttachments,
  publicAttachment,
  type EmailAttachment,
} from "./attachments";

export type RuntimeEmailTemplate = EmailTemplate & {
  attachments: EmailAttachment[];
};

type TemplateOverlay = {
  name?: string;
  subject?: string;
  body?: string;
  attachments?: EmailAttachment[];
};

const memoryOverlays = new Map<string, TemplateOverlay>();

function applyOverlay(template: EmailTemplate, overlay?: TemplateOverlay): RuntimeEmailTemplate {
  return {
    ...template,
    name: overlay?.name || template.name,
    subject: overlay?.subject || template.subject,
    body: overlay?.body || template.body,
    attachments: overlay?.attachments ?? [],
  };
}

function rowToOverlay(row: Record<string, unknown>): TemplateOverlay {
  return {
    name: typeof row.name === "string" ? row.name : undefined,
    subject: typeof row.subject_template === "string" ? row.subject_template : undefined,
    body: typeof row.body_template === "string" ? row.body_template : undefined,
    attachments: parseEmailAttachments(row.attachments),
  };
}

export async function listRuntimeTemplates(): Promise<RuntimeEmailTemplate[]> {
  const overlays = await loadOverlays();
  return EMAIL_TEMPLATES.map((template) => applyOverlay(template, overlays.get(template.id)));
}

export async function loadRuntimeTemplate(id: string): Promise<RuntimeEmailTemplate | undefined> {
  const resolved = resolveTemplateId(id);
  const template = getTemplateById(resolved);
  if (!template) return undefined;
  const overlays = await loadOverlays();
  return applyOverlay(template, overlays.get(template.id));
}

async function loadOverlays(): Promise<Map<string, TemplateOverlay>> {
  if (useMemoryStore() || !isDatabaseConfigured()) {
    return new Map(memoryOverlays);
  }
  const supabase = createServiceClient();
  if (!supabase) return new Map(memoryOverlays);

  const { data, error } = await supabase
    .from("email_templates")
    .select("id, name, subject_template, body_template, attachments");
  if (error || !data) return new Map(memoryOverlays);

  const overlays = new Map<string, TemplateOverlay>();
  for (const row of data as Record<string, unknown>[]) {
    const id = typeof row.id === "string" ? resolveTemplateId(row.id) : "";
    if (!id) continue;
    overlays.set(id, rowToOverlay(row));
  }
  return overlays;
}

export async function saveTemplateRevision(
  id: string,
  patch: { name?: string; subject?: string; body?: string }
): Promise<RuntimeEmailTemplate> {
  const current = await loadRuntimeTemplate(id);
  if (!current) throw new Error("Template not found");

  const next: RuntimeEmailTemplate = {
    ...current,
    name: patch.name?.trim() || current.name,
    subject: patch.subject ?? current.subject,
    body: patch.body ?? current.body,
  };

  await persistOverlay(current.id, {
    name: next.name,
    subject: next.subject,
    body: next.body,
    attachments: next.attachments,
  });
  return next;
}

export async function addTemplateAttachment(
  id: string,
  attachment: EmailAttachment
): Promise<RuntimeEmailTemplate> {
  const current = await loadRuntimeTemplate(id);
  if (!current) throw new Error("Template not found");
  const attachments = [...current.attachments, attachment];
  await persistOverlay(current.id, {
    name: current.name,
    subject: current.subject,
    body: current.body,
    attachments,
  });
  return { ...current, attachments };
}

export async function removeTemplateAttachment(
  id: string,
  attachmentId: string
): Promise<RuntimeEmailTemplate> {
  const current = await loadRuntimeTemplate(id);
  if (!current) throw new Error("Template not found");
  const attachments = current.attachments.filter((item) => item.id !== attachmentId);
  await persistOverlay(current.id, {
    name: current.name,
    subject: current.subject,
    body: current.body,
    attachments,
  });
  return { ...current, attachments };
}

async function persistOverlay(id: string, overlay: TemplateOverlay): Promise<void> {
  memoryOverlays.set(id, overlay);

  if (useMemoryStore() || !isDatabaseConfigured()) return;
  const supabase = createServiceClient();
  if (!supabase) return;

  const { error } = await supabase
    .from("email_templates")
    .update({
      name: overlay.name,
      subject_template: overlay.subject,
      body_template: overlay.body,
      attachments: (overlay.attachments ?? []).map(publicAttachment),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export function resetTemplateOverlaysForTests(): void {
  memoryOverlays.clear();
}
