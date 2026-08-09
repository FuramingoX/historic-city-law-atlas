import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { indicators } from "../data/indicators";

type RawLaw = {
  id: string;
  title: string;
  jurisdiction: string;
  versionYear: number | null;
  versionType: string;
  documentType: string;
  sourceFile: string;
  sourceBytes: number;
  extractionStatus: string;
};

const root = resolve(import.meta.dirname, "..");
const rawText = readFileSync(resolve(root, "data/laws.raw.json"), "utf8").replace(/^\uFEFF/, "");
const raw = JSON.parse(rawText) as { laws: RawLaw[] };
const quote = (value: string) => `'${value.replaceAll("'", "''")}'`;
const nullableNumber = (value: number | null) => value === null ? "NULL" : String(value);

const statements: string[] = [
  "-- Generated catalog seed. Full text and coding evidence are added by the import pipeline.",
];

for (const indicator of indicators) {
  statements.push(
    `INSERT OR REPLACE INTO indicators (code, name, category, definition, rubric_json, sort_order) VALUES (${quote(indicator.code)}, ${quote(indicator.name)}, ${quote(indicator.category)}, ${quote(indicator.definition)}, ${quote(JSON.stringify(indicator.rubric))}, ${indicators.indexOf(indicator) + 1});`,
  );
}

for (const law of raw.laws) {
  statements.push(
    `INSERT OR REPLACE INTO laws (id, title, jurisdiction, version_year, version_type, document_type, source_file, source_bytes, extraction_status, review_status) VALUES (${quote(law.id)}, ${quote(law.title)}, ${quote(law.jurisdiction)}, ${nullableNumber(law.versionYear)}, ${quote(law.versionType)}, ${quote(law.documentType)}, ${quote(law.sourceFile)}, ${law.sourceBytes}, ${quote(law.extractionStatus)}, 'machine_draft');`,
  );
}

statements.push("PRAGMA optimize;");
writeFileSync(resolve(root, "drizzle/0001_seed_catalog.sql"), `${statements.join("\n")}\n`, "utf8");
console.log(`Seeded ${raw.laws.length} laws and ${indicators.length} indicators.`);
