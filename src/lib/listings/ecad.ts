export interface EcadInput {
  yearBuilt?: number;
  inAustinCityLimits: boolean;
  austinEnergyService: boolean;
}

/**
 * Austin ECAD resale-audit trigger from the listing-coordination source document:
 * Austin city limits + Austin Energy service + property at least 10 years old.
 */
export function isEcadRequired(input: EcadInput, currentYear = new Date().getFullYear()): boolean {
  return (
    typeof input.yearBuilt === "number" &&
    input.yearBuilt > 0 &&
    input.inAustinCityLimits &&
    input.austinEnergyService &&
    input.yearBuilt <= currentYear - 10
  );
}
