export const SIGNATURE_BLOCK = `Carly Bryant
Senior Listing & Transaction Coordinator
Keller Williams Southwest
TX Salesperson #723235-SA | Sponsored by Keller Williams Southwest

carly@dokindtx.com
Office hours: Mon–Fri, 9:00 AM – 5:00 PM CT

Each office is independently owned and operated.`;

export function fillTemplate(
  template: string,
  vars: Record<string, string | number | undefined>
): string {
  let result = template;
  const allVars = { signature_block: SIGNATURE_BLOCK, ...vars };
  for (const [key, value] of Object.entries(allVars)) {
    const re = new RegExp(`\\{\\{${key}\\}\\}`, "g");
    result = result.replace(re, String(value ?? ""));
  }
  return result;
}
