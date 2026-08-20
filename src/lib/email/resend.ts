import { Resend } from "resend";
import { logAudit } from "../audit";
import { breakLinesOutsideTables } from "../templates/html-draft";

// Default to Resend's shared sending domain so outbound mail works before a
// custom domain (dokindtx.com) is verified. Override with EMAIL_FROM once the
// domain passes verification in Resend.
const FROM = process.env.EMAIL_FROM ?? "Do Kind <onboarding@resend.dev>";

export async function sendEmail(params: {
  to: string[];
  cc?: string[];
  subject: string;
  body: string;
  html?: string;
  fileType?: string;
  fileId?: string;
  templateId?: string;
  attachments?: Array<{ filename: string; content: Buffer; contentType?: string }>;
}): Promise<{ sent: boolean; id?: string; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const attachmentMeta = (params.attachments ?? []).map((file) => ({
    filename: file.filename,
    contentType: file.contentType,
    size: file.content.length,
  }));

  if (!apiKey) {
    await logAudit({
      actor_type: "system",
      file_type: params.fileType,
      file_id: params.fileId,
      action_type: "email_send_simulated",
      inputs: { to: params.to, subject: params.subject, attachments: attachmentMeta },
      outputs: { mode: "demo", body_preview: params.body.slice(0, 200) },
      outcome: "success",
    });
    return { sent: true, id: `demo-${Date.now()}` };
  }

  try {
    const resend = new Resend(apiKey);
    const hasHtmlTags = /<\/?(?:table|tr|td|th|p|br|a)\b/i.test(params.html ?? params.body);
    const htmlSource = params.html ?? (hasHtmlTags ? params.body : undefined);
    const html = htmlSource ? breakLinesOutsideTables(htmlSource) : undefined;
    const attachments =
      params.attachments && params.attachments.length > 0
        ? params.attachments.map((file) => ({
            filename: file.filename,
            content: file.content,
            contentType: file.contentType,
          }))
        : undefined;

    const { data, error } = await resend.emails.send({
      from: FROM,
      to: params.to,
      cc: params.cc,
      subject: params.subject,
      text: params.body,
      ...(html ? { html } : {}),
      ...(attachments ? { attachments } : {}),
    });

    if (error) {
      await logAudit({
        actor_type: "system",
        action_type: "email_send_failed",
        inputs: params,
        outputs: { error: error.message },
        outcome: "failure",
      });
      return { sent: false, error: error.message };
    }

    await logAudit({
      actor_type: "system",
      file_type: params.fileType,
      file_id: params.fileId,
      action_type: "email_sent",
      inputs: {
        to: params.to,
        cc: params.cc,
        subject: params.subject,
        templateId: params.templateId,
        attachments: attachmentMeta,
      },
      outputs: { messageId: data?.id },
      outcome: "success",
    });

    return { sent: true, id: data?.id };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return { sent: false, error: msg };
  }
}
