import rawData from "@/data/laws.raw.json";
import codingData from "@/data/codings.raw.json";
import { indicators } from "@/data/indicators";
import { DatabaseClient } from "./database-client";

export const metadata = {
  title: "城保法研｜法规数据库",
  description: "59份历史文化名城保护法规的结构化检索、比较与证据审查平台。",
};

export default function Home() {
  const laws = rawData.laws.map((law) => ({
    ...(() => {
      const items = codingData.codings.filter((coding) => coding.lawId === law.id);
      return {
        codedIndicators: items.filter((coding) => coding.presence === 1).length,
        meanStrength: items.length ? items.reduce((sum, coding) => sum + coding.strength, 0) / items.length : 0,
        evidenceCount: items.reduce((sum, coding) => sum + coding.evidence.length, 0),
      };
    })(),
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

  const indicatorStats = indicators.map((indicator) => {
    const items = codingData.codings.filter((coding) => coding.indicatorCode === indicator.code);
    return {
      code: indicator.code,
      presentCount: items.filter((coding) => coding.presence === 1).length,
      strongCount: items.filter((coding) => coding.strength === 3).length,
      evidenceCount: items.reduce((sum, coding) => sum + coding.evidence.length, 0),
    };
  });

  return <DatabaseClient laws={laws} indicators={indicators} indicatorStats={indicatorStats} processingSummary={codingData.summary} generatedAt={rawData.generatedAt} />;
}
