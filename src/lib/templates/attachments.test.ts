import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import {
  assertAttachableFile,
  mergeEmailAttachments,
  parseEmailAttachments,
  sanitizeFilename,
} from "./attachments";
import {
  loadRuntimeTemplate,
  resetTemplateOverlaysForTests,
  saveTemplateRevision,
} from "./runtime";

describe("email template attachments", () => {
  it("parses stored attachment rows and skips incomplete ones", () => {
    const parsed = parseEmailAttachments([
      {
        id: "a1",
        filename: "T-47.pdf",
        storage_path: "templates/tpl-listing-docs/a1-T-47.pdf",
        content_type: "application/pdf",
        size: 1200,
        added_at: "2026-08-20T00:00:00.000Z",
      },
      { filename: "missing-id.pdf" },
    ]);
    assert.equal(parsed.length, 1);
    assert.equal(parsed[0]?.filename, "T-47.pdf");
  });

  it("merges template and review attachments without duplicating ids", () => {
    const shared = {
      id: "a1",
      filename: "shared.pdf",
      storage_path: "templates/tpl-1/a1.pdf",
      content_type: "application/pdf",
      size: 10,
      added_at: "2026-08-20T00:00:00.000Z",
    };
    const extra = {
      id: "a2",
      filename: "extra.pdf",
      storage_path: "reviews/r1/a2.pdf",
      content_type: "application/pdf",
      size: 20,
      added_at: "2026-08-20T00:00:00.000Z",
    };
    const merged = mergeEmailAttachments([shared], [shared, extra]);
    assert.deepEqual(
      merged.map((item) => item.id),
      ["a1", "a2"]
    );
  });

  it("rejects empty or oversized files", () => {
    assert.throws(() => assertAttachableFile({ name: "a.pdf", type: "application/pdf", size: 0 }));
    assert.throws(() =>
      assertAttachableFile({
        name: "a.pdf",
        type: "application/pdf",
        size: 9 * 1024 * 1024,
      })
    );
    assert.doesNotThrow(() =>
      assertAttachableFile({ name: "a.pdf", type: "application/pdf", size: 1024 })
    );
  });

  it("sanitizes uploaded filenames", () => {
    assert.equal(sanitizeFilename("../../weird name*.pdf"), "weird name_.pdf");
  });
});

describe("email template revisions", () => {
  afterEach(() => {
    resetTemplateOverlaysForTests();
  });

  it("saves a subject and body overlay for later drafts", async () => {
    const updated = await saveTemplateRevision("tpl-1", {
      subject: "Updated welcome for {{property_address}}",
      body: "Hi {{seller_first_name}},\n\nRevised intro.\n",
    });
    assert.equal(updated.subject, "Updated welcome for {{property_address}}");
    const loaded = await loadRuntimeTemplate("tpl-1");
    assert.equal(loaded?.body.includes("Revised intro"), true);
  });
});
