export const SIGNATURE_BLOCK = `Carly Bryant
Senior Listing & Transaction Coordinator
Keller Williams Realty — Austin Northwest Market Center
TX Salesperson #723235-SA | Sponsored by Keller Williams Realty ANW

Direct: (512) 555-0184  |  Cell: (512) 555-0291
carly.bryant@kw.com
Office hours: Mon–Fri, 8:00 AM – 5:30 PM CT

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
