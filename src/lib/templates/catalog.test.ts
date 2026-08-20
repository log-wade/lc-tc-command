import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { EMAIL_TEMPLATES, getTemplateById, listingDocsEcadVars } from "./catalog";
import { fillTemplate, SIGNATURE_BLOCK } from "./signature";

const FORBIDDEN_PLACEHOLDERS = [
  "photographer_name",
  "lockbox_serial",
  "go_live_time",
  "agent_read",
  "next_steps",
] as const;

describe("EMAIL_TEMPLATES catalog", () => {
  it("keeps core and listing-workflow templates present without duplicate IDs", () => {
    const ids = EMAIL_TEMPLATES.map((t) => t.id);
    for (let i = 1; i <= 9; i += 1) {
      assert.equal(ids.includes(`tpl-${i}`), true, `missing tpl-${i}`);
    }
    assert.equal(ids.includes("tpl-photoshoot-prep"), true);
    assert.equal(ids.includes("tpl-listing-docs"), true);
    assert.equal(ids.includes("tpl-ecad-needed"), true);
    assert.equal(ids.includes("tpl-10"), false);
    assert.equal(new Set(ids).size, ids.length, "template ids must be unique");
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

  it("uses a single non-redundant sign-off and omits direct/cell numbers", () => {
    assert.doesNotMatch(SIGNATURE_BLOCK, /Direct:|Cell:/i);

    for (const template of EMAIL_TEMPLATES) {
      const filled = fillTemplate(template.body, {});
      assert.doesNotMatch(filled, /\nCarly\nCarly Bryant/);
      assert.doesNotMatch(filled, /\nThanks,\nCarly/);
      assert.doesNotMatch(filled, /Direct:|Cell:/i);
    }
  });

  it("tpl-1 introduces Carly, references the Make-Ready process, and keeps hours in the signature only", () => {
    const tpl1 = getTemplateById("tpl-1");
    assert.ok(tpl1);
    assert.match(tpl1.body, /I'm Carly/);
    assert.match(tpl1.body, /Make-Ready/);
    // Business hours now live in the signature block, not the body copy.
    assert.equal(tpl1.body.includes("9 to 5"), false);
    assert.equal(tpl1.body.includes("Bryant"), false);
  });

  it("tpl-5 includes key_dates_table and omits lender intro language", () => {
    const tpl5 = getTemplateById("tpl-5");
    assert.ok(tpl5);
    assert.match(tpl5.body, /\{\{key_dates_table\}\}/);
    assert.equal(tpl5.body.includes("Intro emails to lender"), false);
    assert.equal(tpl5.subject.includes("Intro emails to lender"), false);
  });

  it("listing documents template gives accurate survey and T-47 instructions and folds in ECAD when required", () => {
    const template = getTemplateById("tpl-listing-docs");
    assert.ok(template);
    assert.match(template.body, /wet ink/i);
    assert.match(template.body, /notary/i);
    assert.match(template.body, /cannot be electronically signed/i);
    assert.match(template.body, /Sellers Shield/);
    assert.match(template.body, /\{\{ecad_request\}\}/);

    const withoutEcad = fillTemplate(template.body, listingDocsEcadVars(false));
    assert.equal(withoutEcad.includes("ECAD"), false);
    assert.equal(withoutEcad.includes("austinauditors.com"), false);

    const withEcad = fillTemplate(template.body, listingDocsEcadVars(true));
    assert.match(withEcad, /ECAD energy audit/);
    assert.match(withEcad, /Austin city limits/i);
    assert.match(withEcad, /Austin Energy/i);
    assert.match(withEcad, /at least 10 years old/i);
    assert.match(withEcad, /austinauditors\.com\/book/);
    assert.match(withEcad, /before the resale contract is executed/i);
    assert.match(withEcad, /ECAD appointment details/);
  });

  it("ECAD template explains the trigger, timing, and booking path", () => {
    const template = getTemplateById("tpl-ecad-needed");
    assert.ok(template);
    assert.match(template.body, /Austin city limits/i);
    assert.match(template.body, /Austin Energy/i);
    assert.match(template.body, /at least 10 years old/i);
    assert.match(template.body, /austinauditors\.com\/book/);
    assert.match(template.body, /before the resale contract is executed/i);
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
