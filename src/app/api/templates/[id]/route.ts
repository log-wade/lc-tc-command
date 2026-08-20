import { NextResponse } from "next/server";
import { logAudit } from "@/lib/audit";
import { publicAttachment } from "@/lib/templates/attachments";
import { loadRuntimeTemplate, saveTemplateRevision } from "@/lib/templates/runtime";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const template = await loadRuntimeTemplate(id);
  if (!template) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }
  return NextResponse.json({
    template: {
      ...template,
      attachments: template.attachments.map(publicAttachment),
    },
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const subject = typeof body.subject === "string" ? body.subject : undefined;
    const bodyText = typeof body.body === "string" ? body.body : undefined;
    const name = typeof body.name === "string" ? body.name : undefined;
    if (subject !== undefined && subject.trim() === "") {
      return NextResponse.json({ error: "Subject is required" }, { status: 400 });
    }
    if (bodyText !== undefined && bodyText.trim() === "") {
      return NextResponse.json({ error: "Body is required" }, { status: 400 });
    }
    const template = await saveTemplateRevision(id, { name, subject, body: bodyText });
    await logAudit({
      actor_type: "human",
      action_type: "email_template_revised",
      inputs: { templateId: template.id },
      outcome: "success",
    });
    return NextResponse.json({
      success: true,
      template: {
        ...template,
        attachments: template.attachments.map(publicAttachment),
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Save failed";
    const status = message === "Template not found" ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
