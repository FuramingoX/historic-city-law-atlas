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
  articles: Array<{ ordinal: number; label: string; text: string }>;
};

type RawCoding = {
  lawId: string;
  indicatorCode: string;
  presence: number;
  strength: number;
  confidence: string;
  reviewStatus: string;
  codingNote: string;
  evidence: Array<{ articleOrdinal: number; articleLabel: string; excerpt: string }>;
};

const root = resolve(import.meta.dirname, "..");
const rawText = readFileSync(resolve(root, "data/laws.raw.json"), "utf8").replace(/^\uFEFF/, "");
const raw = JSON.parse(rawText) as { laws: RawLaw[] };
const codingText = readFileSync(resolve(root, "data/codings.raw.json"), "utf8").replace(/^\uFEFF/, "");
const codingData = JSON.parse(codingText) as { codings: RawCoding[] };
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

const articleIds = new Map<string, number>();
let articleId = 1;
for (const law of raw.laws) {
  for (const article of law.articles) {
    articleIds.set(`${law.id}:${article.ordinal}`, articleId);
    statements.push(
      `INSERT OR REPLACE INTO articles (id, law_id, ordinal, label, chapter, content) VALUES (${articleId}, ${quote(law.id)}, ${article.ordinal}, ${quote(article.label)}, NULL, ${quote(article.text)});`,
    );
    articleId += 1;
  }
}

let codingId = 1;
let evidenceId = 1;
for (const coding of codingData.codings) {
  statements.push(
    `INSERT OR REPLACE INTO codings (id, law_id, indicator_code, presence, strength, confidence, review_status, coding_note) VALUES (${codingId}, ${quote(coding.lawId)}, ${quote(coding.indicatorCode)}, ${coding.presence}, ${coding.strength}, ${quote(coding.confidence)}, ${quote(coding.reviewStatus)}, ${quote(coding.codingNote)});`,
  );
  for (const item of coding.evidence) {
    const linkedArticleId = articleIds.get(`${coding.lawId}:${item.articleOrdinal}`);
    statements.push(
      `INSERT OR REPLACE INTO evidence (id, coding_id, article_id, article_label, excerpt, relevance) VALUES (${evidenceId}, ${codingId}, ${linkedArticleId ?? "NULL"}, ${quote(item.articleLabel)}, ${quote(item.excerpt)}, 'supporting');`,
    );
    evidenceId += 1;
  }
  codingId += 1;
}

statements.push("PRAGMA optimize;");
writeFileSync(resolve(root, "drizzle/0001_seed_catalog.sql"), `${statements.join("\n")}\n`, "utf8");
console.log(`Seeded ${raw.laws.length} laws, ${indicators.length} indicators, ${articleId - 1} articles, ${codingId - 1} codings, and ${evidenceId - 1} evidence records.`);
