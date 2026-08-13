// Drafts are plain text with embedded HTML tables (see renderKeyDatesTableHtml).
// These helpers let previews and the plain-text email part keep the table structure
// instead of flattening the markup into a single run of words.

const TABLE_RE = /<table\b[^>]*>[\s\S]*?<\/table>/gi;
const ROW_RE = /<tr\b[^>]*>([\s\S]*?)<\/tr>/gi;
const CELL_RE = /<(t[dh])\b[^>]*>([\s\S]*?)<\/\1>/gi;
const LINE_BREAK_RE = /<br\s*\/?>|<\/(?:p|div|li|h[1-6]|tr)>/gi;

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  ndash: "–",
  mdash: "—",
  hellip: "…",
  bull: "•",
};

export type DraftTable = {
  kind: "table";
  header: string[];
  rows: string[][];
};

export type DraftBlock = { kind: "text"; text: string } | DraftTable;

export function decodeEntities(value: string): string {
  return value.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (match, entity: string) => {
    if (entity.startsWith("#")) {
      const isHex = entity[1] === "x" || entity[1] === "X";
      const code = Number.parseInt(isHex ? entity.slice(2) : entity.slice(1), isHex ? 16 : 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : match;
    }
    return NAMED_ENTITIES[entity.toLowerCase()] ?? match;
  });
}

function stripTags(value: string): string {
  return value.replace(LINE_BREAK_RE, "\n").replace(/<[^>]*>/g, "");
}

function toCellText(html: string): string {
  return decodeEntities(stripTags(html)).replace(/\s+/g, " ").trim();
}

function toBlockText(html: string): string {
  return decodeEntities(stripTags(html))
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function parseTable(html: string): DraftTable | null {
  const parsed = [...html.matchAll(ROW_RE)]
    .map((row) => {
      const cells = [...row[1].matchAll(CELL_RE)].map((cell) => toCellText(cell[2]));
      return { isHeader: /<th\b/i.test(row[1]), cells };
    })
    .filter((row) => row.cells.length > 0);

  if (parsed.length === 0) return null;

  const hasHeader = parsed[0].isHeader;
  return {
    kind: "table",
    header: hasHeader ? parsed[0].cells : [],
    rows: (hasHeader ? parsed.slice(1) : parsed).map((row) => row.cells),
  };
}

export function parseDraftBlocks(body: string): DraftBlock[] {
  const blocks: DraftBlock[] = [];
  let cursor = 0;

  const pushText = (raw: string) => {
    const text = toBlockText(raw);
    if (text.length > 0) blocks.push({ kind: "text", text });
  };

  for (const match of body.matchAll(TABLE_RE)) {
    const start = match.index ?? 0;
    pushText(body.slice(cursor, start));
    const table = parseTable(match[0]);
    if (table) blocks.push(table);
    else pushText(match[0]);
    cursor = start + match[0].length;
  }
  pushText(body.slice(cursor));

  return blocks;
}

function tableToPlainText({ header, rows }: DraftTable): string {
  return rows
    .map((cells) => {
      const [label, ...rest] = cells;
      const details = rest
        .map((cell, index) => {
          const heading = header[index + 1];
          return heading ? `${heading}: ${cell}` : cell;
        })
        .filter((part) => part.length > 0);
      return details.length > 0 ? `• ${label} — ${details.join(" | ")}` : `• ${label}`;
    })
    .join("\n");
}

export function htmlDraftToPlainText(body: string): string {
  return parseDraftBlocks(body)
    .map((block) => (block.kind === "text" ? block.text : tableToPlainText(block)))
    .join("\n\n");
}

// Newlines around a table must become <br/> for email clients, but newlines inside
// the table markup must not, or rows gain stray breaks above the table.
export function breakLinesOutsideTables(html: string): string {
  let result = "";
  let cursor = 0;

  for (const match of html.matchAll(TABLE_RE)) {
    const start = match.index ?? 0;
    result += html.slice(cursor, start).replace(/\n/g, "<br/>");
    result += match[0];
    cursor = start + match[0].length;
  }

  return result + html.slice(cursor).replace(/\n/g, "<br/>");
}
