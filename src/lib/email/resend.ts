import { Resend } from "resend";
import { logAudit } from "../audit";

const FROM =
  process.env.EMAIL_FROM ?? "Carly Bryant <coordination@kw-anw.example.com>";

export async function sendEmail(params: {
  to: string[];
  cc?: string[];
  subject: string;
  body: string;
  html?: string;
  fileType?: string;
  fileId?: string;
  templateId?: string;
}): Promise<{ sent: boolean; id?: string; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    await logAudit({
      actor_type: "system",
      file_type: params.fileType,
      file_id: params.fileId,
      action_type: "email_send_simulated",
      inputs: { to: params.to, subject: params.subject },
      outputs: { mode: "demo", body_preview: params.body.slice(0, 200) },
      outcome: "success",
    });
    return { sent: true, id: `demo-${Date.now()}` };
  }

  try {
    const resend = new Resend(apiKey);
    const hasHtmlTags = /<\/?(?:table|tr|td|th|p|br|a)\b/i.test(params.html ?? params.body);
    const htmlSource = params.html ?? (hasHtmlTags ? params.body : undefined);
    const html = htmlSource
      ? htmlSource.includes("<table")
        ? htmlSource.replace(/\n/g, "<br/>")
        : htmlSource.replace(/\n/g, "<br/>")
      : undefined;

    const { data, error } = await resend.emails.send({
      from: FROM,
      to: params.to,
      cc: params.cc,
      subject: params.subject,
      text: params.body,
      ...(html ? { html } : {}),
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
      inputs: { to: params.to, subject: params.subject, templateId: params.templateId },
      outputs: { messageId: data?.id },
      outcome: "success",
    });

    return { sent: true, id: data?.id };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return { sent: false, error: msg };
  }
}
