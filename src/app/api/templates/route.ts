import { NextResponse } from "next/server";
import { listRuntimeTemplates } from "@/lib/templates/runtime";
import { publicAttachment } from "@/lib/templates/attachments";

export async function GET() {
  const templates = await listRuntimeTemplates();
  return NextResponse.json({
    templates: templates.map((template) => ({
      ...template,
      attachments: template.attachments.map(publicAttachment),
    })),
  });
}
