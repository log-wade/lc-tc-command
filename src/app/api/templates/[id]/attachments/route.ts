import { NextResponse } from "next/server";
import { deleteStoredAttachment, storeEmailAttachment } from "@/lib/email/load-attachments";
import { logAudit } from "@/lib/audit";
import {
  addTemplateAttachment,
  loadRuntimeTemplate,
  removeTemplateAttachment,
} from "@/lib/templates/runtime";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const template = await loadRuntimeTemplate(id);
    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "file is required" }, { status: 400 });
    }
    const attachment = await storeEmailAttachment({
      scope: "templates",
      ownerId: template.id,
      file,
      existingCount: template.attachments.length,
    });
    const updated = await addTemplateAttachment(template.id, attachment);
    await logAudit({
      actor_type: "human",
      action_type: "email_template_attachment_added",
      inputs: { templateId: template.id, filename: attachment.filename },
      outcome: "success",
    });
    return NextResponse.json({ success: true, template: updated, attachment });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const attachmentId = new URL(request.url).searchParams.get("attachmentId");
  if (!attachmentId) {
    return NextResponse.json({ error: "attachmentId is required" }, { status: 400 });
  }
  try {
    const template = await loadRuntimeTemplate(id);
    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }
    const existing = template.attachments.find((item) => item.id === attachmentId);
    const updated = await removeTemplateAttachment(id, attachmentId);
    if (existing) await deleteStoredAttachment(existing.storage_path);
    await logAudit({
      actor_type: "human",
      action_type: "email_template_attachment_removed",
      inputs: { templateId: id, attachmentId },
      outcome: "success",
    });
    return NextResponse.json({ success: true, template: updated });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Remove failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
