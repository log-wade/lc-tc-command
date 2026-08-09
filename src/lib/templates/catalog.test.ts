import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { EMAIL_TEMPLATES, getTemplateById } from "./catalog";

const FORBIDDEN_PLACEHOLDERS = [
  "photographer_name",
  "lockbox_serial",
  "go_live_time",
  "agent_read",
  "next_steps",
] as const;

describe("EMAIL_TEMPLATES catalog", () => {
  it("has exactly ids tpl-1 … tpl-9 contiguous, with no tpl-10", () => {
    const ids = EMAIL_TEMPLATES.map((t) => t.id);
    assert.deepEqual(
      ids,
      Array.from({ length: 9 }, (_, i) => `tpl-${i + 1}`),
    );
    assert.equal(ids.includes("tpl-10"), false);
  });

  it("omits forbidden placeholders from all subjects and bodies", () => {
    for (const template of EMAIL_TEMPLATES) {
      for (const name of FORBIDDEN_PLACEHOLDERS) {
        const token = `{{${name}}}`;
        assert.equal(
          template.subject.includes(token),
          false,
          `${template.id} subject contains ${token}`,
        );
        assert.equal(
          template.body.includes(token),
          false,
          `${template.id} body contains ${token}`,
        );
      }
      assert.equal(
        template.subject.includes("{{week_date}}"),
        false,
        `${template.id} subject contains {{week_date}}`,
      );
    }
  });

  it("tpl-1 introduces Carly with 9 to 5 hours and no Bryant in the body", () => {
    const tpl1 = getTemplateById("tpl-1");
    assert.ok(tpl1);
    assert.match(tpl1.body, /I'm Carly/);
    assert.match(tpl1.body, /9 to 5/);
    assert.equal(tpl1.body.includes("Bryant"), false);
  });

  it("tpl-5 includes key_dates_table and omits lender intro language", () => {
    const tpl5 = getTemplateById("tpl-5");
    assert.ok(tpl5);
    assert.match(tpl5.body, /\{\{key_dates_table\}\}/);
    assert.equal(tpl5.body.includes("Intro emails to lender"), false);
    assert.equal(tpl5.subject.includes("Intro emails to lender"), false);
  });

  it('tpl-6 mentions "Do Kind Group"', () => {
    const tpl6 = getTemplateById("tpl-6");
    assert.ok(tpl6);
    assert.match(tpl6.body, /Do Kind Group/);
  });

  it('getTemplateById("tpl-10") resolves via legacy alias to tpl-9', () => {
    const tpl = getTemplateById("tpl-10");
    assert.ok(tpl);
    assert.equal(tpl.id, "tpl-9");
  });
});
