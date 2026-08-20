import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createListingIntake, getReviewQueue } from "./index";
import { buildEmailContext } from "../templates/build-context";
import { getTemplateById } from "../templates/catalog";
import { fillTemplate } from "../templates/signature";

type QueueRow = Record<string, unknown>;

const baseIntake = {
  seller_preferred_name: "Sam",
  survey_on_file: "yes",
};

/** Queue rows for one listing, in the order the review page renders them. */
async function queuedTemplates(listingId: string): Promise<Array<[string, string]>> {
  const queue = (await getReviewQueue()) as QueueRow[];
  return queue
    .filter((r) => String(r.file_id) === listingId)
    .map((r) => {
      const payload = (r.payload as Record<string, unknown>) ?? {};
      return [String(r.priority), String(payload.template_id)] as [string, string];
    });
}

describe("listing intake review queue order", () => {
  it("queues the intro email ahead of the listing documents request", async () => {
    const listing = await createListingIntake({
      ...baseIntake,
      property_address: "413 Pecan Hollow Dr",
      year_built: 2015,
      in_austin_city_limits: "no",
      austin_energy_service: "no",
    });

    assert.deepEqual(await queuedTemplates(listing.id), [
      ["P1", "tpl-1"],
      ["P2", "tpl-listing-docs"],
    ]);
  });

  it("folds ECAD into the documents email instead of queueing a separate notice", async () => {
    const listing = await createListingIntake({
      ...baseIntake,
      property_address: "902 Bluebonnet Ln",
      year_built: 1998,
      in_austin_city_limits: "yes",
      austin_energy_service: "yes",
      photo_date: "2026-09-10",
      photo_time: "10:00",
    });

    const queued = await queuedTemplates(listing.id);

    assert.equal(queued[0][1], "tpl-1", "intro email must lead the batch");
    assert.deepEqual(queued, [
      ["P1", "tpl-1"],
      ["P1", "tpl-photoshoot-prep"],
      ["P2", "tpl-listing-docs"],
    ]);
  });

  it("does not interleave batches from separate listings ahead of their intro email", async () => {
    const first = await createListingIntake({
      ...baseIntake,
      property_address: "11 Cypress Bend",
      year_built: 2020,
      in_austin_city_limits: "no",
      austin_energy_service: "no",
    });
    const second = await createListingIntake({
      ...baseIntake,
      property_address: "12 Cypress Bend",
      year_built: 2020,
      in_austin_city_limits: "no",
      austin_energy_service: "no",
    });

    for (const id of [first.id, second.id]) {
      assert.deepEqual(await queuedTemplates(id), [
        ["P1", "tpl-1"],
        ["P2", "tpl-listing-docs"],
      ]);
    }
  });

  it("puts ECAD copy in the documents draft only when intake screening requires it", async () => {
    const template = getTemplateById("tpl-listing-docs");
    assert.ok(template);

    const notRequired = await createListingIntake({
      ...baseIntake,
      property_address: "200 Cedar Park Blvd",
      year_built: 1998,
      in_austin_city_limits: "no",
      austin_energy_service: "no",
    });
    const tooNew = await createListingIntake({
      ...baseIntake,
      property_address: "50 Rainey St",
      year_built: 2022,
      in_austin_city_limits: "yes",
      austin_energy_service: "yes",
    });
    const required = await createListingIntake({
      ...baseIntake,
      property_address: "1200 E 6th St",
      year_built: 1998,
      in_austin_city_limits: "yes",
      austin_energy_service: "yes",
    });

    const notRequiredBody = fillTemplate(
      template.body,
      await buildEmailContext("listing", notRequired.id)
    );
    const tooNewBody = fillTemplate(
      template.body,
      await buildEmailContext("listing", tooNew.id)
    );
    const requiredBody = fillTemplate(
      template.body,
      await buildEmailContext("listing", required.id)
    );

    assert.equal(notRequiredBody.includes("ECAD energy audit"), false);
    assert.equal(notRequiredBody.includes("{{ecad_request}}"), false);
    assert.equal(tooNewBody.includes("ECAD energy audit"), false);
    assert.match(requiredBody, /ECAD energy audit/);
    assert.match(requiredBody, /austinauditors\.com\/book/);
  });
});
