import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { DEFAULT_ORG_ID } from "@/lib/supabase/server-auth";
import { recordFileEvent } from "@/lib/events/file-events";
import { captureException } from "@/lib/observability";

export async function POST(request: Request) {
  const webhookSecret = process.env.INBOUND_EMAIL_WEBHOOK_SECRET;
  if (webhookSecret) {
    const provided = request.headers.get("x-webhook-secret");
    if (provided !== webhookSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const body = await request.json();
    const from = String(body.from ?? body.sender ?? "unknown");
    const subject = String(body.subject ?? "(no subject)");
    const text = String(body.text ?? body.body ?? "");
    const messageId = String(body.message_id ?? body.id ?? `inbound-${Date.now()}`);

    const supabase = createServiceClient();
    if (supabase) {
      await supabase.from("inbound_emails").insert({
        organization_id: DEFAULT_ORG_ID,
        message_id: messageId,
        from_address: from,
        subject,
        body: text.slice(0, 8000),
        ai_classification: { webhook_payload: body },
        processed: false,
      });
    }

    await recordFileEvent({
      eventType: "inbound_email.received",
      fileType: "transaction",
      fileId: DEFAULT_ORG_ID,
      actorType: "integration",
      actorId: "inbound-email",
      payload: { from, subject, messageId },
    });

    return NextResponse.json({ ok: true, messageId });
  } catch (e) {
    captureException(e);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}
