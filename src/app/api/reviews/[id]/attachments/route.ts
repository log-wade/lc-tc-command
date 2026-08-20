import { NextResponse } from "next/server";
import { getReviewItem, saveReviewRevision } from "@/lib/data";
import { deleteStoredAttachment, storeEmailAttachment } from "@/lib/email/load-attachments";
import { parseEmailAttachments } from "@/lib/templates/attachments";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const review = await getReviewItem(id);
    if (!review) {
      return NextResponse.json({ error: "Review item not found" }, { status: 404 });
    }
    const payload = (review.payload as Record<string, unknown>) ?? {};
    const current = parseEmailAttachments(payload.attachments);
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "file is required" }, { status: 400 });
    }
    const attachment = await storeEmailAttachment({
      scope: "reviews",
      ownerId: id,
      file,
      existingCount: current.length,
    });
    const updated = await saveReviewRevision(id, {
      attachments: [...current, attachment],
    });
    return NextResponse.json({ success: true, review: updated, attachment });
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
    const review = await getReviewItem(id);
    if (!review) {
      return NextResponse.json({ error: "Review item not found" }, { status: 404 });
    }
    const payload = (review.payload as Record<string, unknown>) ?? {};
    const current = parseEmailAttachments(payload.attachments);
    const existing = current.find((item) => item.id === attachmentId);
    const updated = await saveReviewRevision(id, {
      attachments: current.filter((item) => item.id !== attachmentId),
    });
    if (existing) await deleteStoredAttachment(existing.storage_path);
    return NextResponse.json({ success: true, review: updated });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Remove failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
