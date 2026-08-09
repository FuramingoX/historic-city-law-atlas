import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const laws = sqliteTable(
  "laws",
  {
    id: text("id").primaryKey(),
    title: text("title").notNull(),
    jurisdiction: text("jurisdiction").notNull(),
    versionYear: integer("version_year"),
    versionType: text("version_type").notNull().default("original"),
    documentType: text("document_type").notNull().default("regulation"),
    sourceFile: text("source_file").notNull(),
    sourceBytes: integer("source_bytes").notNull().default(0),
    extractionStatus: text("extraction_status").notNull().default("pending"),
    reviewStatus: text("review_status").notNull().default("machine_draft"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("idx_laws_jurisdiction").on(table.jurisdiction),
    index("idx_laws_version_year").on(table.versionYear),
    index("idx_laws_review_status").on(table.reviewStatus),
  ],
);

export const articles = sqliteTable(
  "articles",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    lawId: text("law_id").notNull().references(() => laws.id, { onDelete: "cascade" }),
    ordinal: integer("ordinal").notNull(),
    label: text("label").notNull(),
    chapter: text("chapter"),
    content: text("content").notNull(),
  },
  (table) => [
    uniqueIndex("idx_articles_law_ordinal_unique").on(table.lawId, table.ordinal),
    index("idx_articles_law_id").on(table.lawId),
  ],
);

export const indicators = sqliteTable(
  "indicators",
  {
    code: text("code").primaryKey(),
    name: text("name").notNull(),
    category: text("category").notNull(),
    definition: text("definition").notNull(),
    rubric: text("rubric_json").notNull(),
    sortOrder: integer("sort_order").notNull(),
  },
  (table) => [uniqueIndex("idx_indicators_sort_order_unique").on(table.sortOrder)],
);

export const codings = sqliteTable(
  "codings",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    lawId: text("law_id").notNull().references(() => laws.id, { onDelete: "cascade" }),
    indicatorCode: text("indicator_code").notNull().references(() => indicators.code),
    presence: integer("presence").notNull().default(0),
    strength: integer("strength").notNull().default(0),
    confidence: text("confidence").notNull().default("low"),
    reviewStatus: text("review_status").notNull().default("machine_draft"),
    codingNote: text("coding_note").notNull().default(""),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex("idx_codings_law_indicator_unique").on(table.lawId, table.indicatorCode),
    index("idx_codings_indicator_strength").on(table.indicatorCode, table.strength),
  ],
);

export const evidence = sqliteTable(
  "evidence",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    codingId: integer("coding_id").notNull().references(() => codings.id, { onDelete: "cascade" }),
    articleId: integer("article_id").references(() => articles.id, { onDelete: "set null" }),
    articleLabel: text("article_label").notNull(),
    excerpt: text("excerpt").notNull(),
    relevance: text("relevance").notNull().default("supporting"),
  },
  (table) => [index("idx_evidence_coding_id").on(table.codingId)],
);

export const reviewLogs = sqliteTable(
  "review_logs",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id").notNull(),
    reviewer: text("reviewer").notNull(),
    action: text("action").notNull(),
    note: text("note").notNull().default(""),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [index("idx_review_logs_entity").on(table.entityType, table.entityId)],
);
