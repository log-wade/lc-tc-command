import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  breakLinesOutsideTables,
  htmlDraftToPlainText,
  parseDraftBlocks,
} from "./html-draft";
import { renderKeyDatesTableHtml } from "./deadline-table";

const KEY_DATE_ROWS = [
  {
    item: "Option Fee Due",
    dueDate: "Aug 13, 2026",
    days: "3 days",
    completed: "—",
    sendToNotes: "Send to: Texas National Title",
  },
  {
    item: "Closing Date",
    dueDate: "Sep 14, 2026",
    days: "Contractual",
    completed: "—",
    sendToNotes: "At: Texas National Title",
  },
];

const DRAFT = `Hi Dana,

Here are your key dates and responsibilities:

${renderKeyDatesTableHtml(KEY_DATE_ROWS)}

Thank you,
Carly Bryant`;

describe("parseDraftBlocks", () => {
  it("keeps the key dates table as a table instead of flattening it to text", () => {
    const blocks = parseDraftBlocks(DRAFT);
    const table = blocks.find((b) => b.kind === "table");

    assert.ok(table, "expected a table block");
    assert.deepEqual(table.header, [
      "Item",
      "Due date",
      "Days",
      "Completed",
      "Send to / Notes",
    ]);
    assert.deepEqual(table.rows, [
      ["Option Fee Due", "Aug 13, 2026", "3 days", "—", "Send to: Texas National Title"],
      ["Closing Date", "Sep 14, 2026", "Contractual", "—", "At: Texas National Title"],
    ]);
  });

  it("preserves the surrounding copy in order and drops all markup", () => {
    const blocks = parseDraftBlocks(DRAFT);

    assert.deepEqual(
      blocks.map((b) => b.kind),
      ["text", "table", "text"]
    );
    for (const block of blocks) {
      if (block.kind === "text") assert.doesNotMatch(block.text, /[<>]/);
    }
    assert.match(blocks[0].kind === "text" ? blocks[0].text : "", /^Hi Dana,/);
  });

  it("decodes entities escaped by the table renderer", () => {
    const [block] = parseDraftBlocks(
      renderKeyDatesTableHtml([
        { ...KEY_DATE_ROWS[0], sendToNotes: "Smith & Co <escrow>" },
      ])
    );

    assert.equal(block.kind, "table");
    assert.equal(block.rows[0][4], "Smith & Co <escrow>");
  });

  it("falls back to text for a draft with no table", () => {
    assert.deepEqual(parseDraftBlocks("Plain update.\n\nThank you"), [
      { kind: "text", text: "Plain update.\n\nThank you" },
    ]);
  });
});

describe("htmlDraftToPlainText", () => {
  it("renders table rows as labeled bullets with no markup left over", () => {
    const text = htmlDraftToPlainText(DRAFT);

    assert.doesNotMatch(text, /[<>]/);
    assert.match(
      text,
      /• Option Fee Due — Due date: Aug 13, 2026 \| Days: 3 days \| Completed: — \| Send to \/ Notes: Send to: Texas National Title/
    );
    assert.match(text, /^Hi Dana,/);
    assert.match(text, /Carly Bryant$/);
  });
});

describe("breakLinesOutsideTables", () => {
  it("converts newlines around the table but never inside its markup", () => {
    const html = breakLinesOutsideTables(DRAFT);
    const table = html.slice(html.indexOf("<table"), html.indexOf("</table>"));

    assert.match(html, /Hi Dana,<br\/>/);
    assert.doesNotMatch(table, /<br\/>/);
  });
});
