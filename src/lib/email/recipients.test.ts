import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getTemplateById } from "../templates/catalog";
import { resolveSendRecipients } from "./recipients";

const listingTpl = getTemplateById("tpl-1")!;
const internalTpl = getTemplateById("tpl-4")!;
const txnTpl = getTemplateById("tpl-5")!;
const titleTpl = getTemplateById("tpl-6")!;

describe("resolveSendRecipients", () => {
  it("sends listing templates to seller and CCs alert", () => {
    const result = resolveSendRecipients({
      template: listingTpl,
      sellerEmail: "Seller@Example.com",
      alertEmail: "carly@dokindtx.com",
    });
    assert.deepEqual(result.to, ["seller@example.com"]);
    assert.deepEqual(result.cc, ["carly@dokindtx.com"]);
    assert.equal(result.usedAlertFallback, false);
  });

  it("falls back to alert when seller email is missing", () => {
    const result = resolveSendRecipients({
      template: listingTpl,
      alertEmail: "carly@dokindtx.com",
    });
    assert.deepEqual(result.to, ["carly@dokindtx.com"]);
    assert.equal(result.usedAlertFallback, true);
  });

  it("sends transaction templates to client and CCs alert", () => {
    const result = resolveSendRecipients({
      template: txnTpl,
      clientEmail: "buyer@example.com",
      alertEmail: "carly@dokindtx.com",
    });
    assert.deepEqual(result.to, ["buyer@example.com"]);
    assert.deepEqual(result.cc, ["carly@dokindtx.com"]);
  });

  it("sends tpl-6 to third party and CCs client + alert", () => {
    const result = resolveSendRecipients({
      template: titleTpl,
      thirdPartyEmail: "title@escrow.com",
      clientEmail: "buyer@example.com",
      alertEmail: "carly@dokindtx.com",
    });
    assert.deepEqual(result.to, ["title@escrow.com"]);
    assert.deepEqual(result.cc, ["buyer@example.com", "carly@dokindtx.com"]);
  });

  it("sends internal templates to the listing agent", () => {
    const result = resolveSendRecipients({
      template: internalTpl,
      agentEmail: "jamie@example.com",
      alertEmail: "carly@dokindtx.com",
    });
    assert.deepEqual(result.to, ["jamie@example.com"]);
    assert.deepEqual(result.cc, ["carly@dokindtx.com"]);
  });
});
