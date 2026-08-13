import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isEcadRequired } from "./ecad";

describe("isEcadRequired", () => {
  it("requires all three source-document conditions", () => {
    assert.equal(
      isEcadRequired(
        { yearBuilt: 2016, inAustinCityLimits: true, austinEnergyService: true },
        2026
      ),
      true
    );
    assert.equal(
      isEcadRequired(
        { yearBuilt: 2016, inAustinCityLimits: false, austinEnergyService: true },
        2026
      ),
      false
    );
    assert.equal(
      isEcadRequired(
        { yearBuilt: 2016, inAustinCityLimits: true, austinEnergyService: false },
        2026
      ),
      false
    );
  });

  it("does not trigger until the property is at least ten years old", () => {
    assert.equal(
      isEcadRequired(
        { yearBuilt: 2017, inAustinCityLimits: true, austinEnergyService: true },
        2026
      ),
      false
    );
  });
});
