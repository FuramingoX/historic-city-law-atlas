import rawData from "@/data/laws.raw.json";
import { indicators } from "@/data/indicators";
import { DatabaseClient } from "./database-client";

export const metadata = {
  title: "城保法研｜法规数据库",
  description: "59份历史文化名城保护法规的结构化检索、比较与证据审查平台。",
};

export default function Home() {
  const laws = rawData.laws.map((law) => ({
    id: law.id,
    title: law.title,
    jurisdiction: law.jurisdiction,
    versionYear: law.versionYear,
    versionType: law.versionType,
    documentType: law.documentType,
    sourceFile: law.sourceFile,
    sourceBytes: law.sourceBytes,
    extractionStatus: law.extractionStatus,
    extractionNote: law.extractionNote,
    articleCount: law.articles.length,
    textLength: law.text.length,
  }));

  return <DatabaseClient laws={laws} indicators={indicators} generatedAt={rawData.generatedAt} />;
}
